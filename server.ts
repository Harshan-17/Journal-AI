import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { createServer as createViteServer } from 'vite';
import { initializeApp, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { SecretManagerServiceClient } from '@google-cloud/secret-manager';

dotenv.config();

const secretManagerClient = new SecretManagerServiceClient();

async function getSecret(secretName: string): Promise<string | null> {
  // Check environment variables first (injected by AI Studio or Cloud Run --set-secrets)
  if (process.env[secretName]) {
    return process.env[secretName] || null;
  }

  try {
    let projectId = process.env.GOOGLE_CLOUD_PROJECT || process.env.GCLOUD_PROJECT;
    if (!projectId) {
      if (fs.existsSync('./firebase-applet-config.json')) {
        const configData = fs.readFileSync('./firebase-applet-config.json', 'utf8');
        const config = JSON.parse(configData);
        projectId = config.projectId;
      }
    }
    if (!projectId) projectId = 'your-project-id';

    const name = `projects/${projectId}/secrets/${secretName}/versions/latest`;
    const [version] = await secretManagerClient.accessSecretVersion({ name });
    const payload = version.payload?.data?.toString();
    return payload || null;
  } catch (error: any) {
    // Only log unexpected errors; suppress PERMISSION_DENIED (code 7) which is expected in preview environments
    if (error?.code !== 7) {
      console.warn(`Could not fetch secret ${secretName} from Secret Manager: ${error.message || error}`);
    }
    return null;
  }
}

const PORT = 3000;
const app = express();

// Initialize Firebase Admin SDK for secure RBAC verification
// In production, this uses the default service account credentials provided by Google Cloud.
if (!getApps().length) {
  try {
    const configPath = path.resolve(process.cwd(), 'firebase-applet-config.json');
    const configData = fs.readFileSync(configPath, 'utf8');
    const config = JSON.parse(configData);
    const app = initializeApp({
      projectId: config.projectId,
    });
    // Set a global reference to the correct firestore instance
    global.db = getFirestore(app, config.firestoreDatabaseId);
    console.log(`[Firebase Admin] Initialized with projectId: ${config.projectId}`);
  } catch (error) {
    console.warn('[Firebase Admin] Could not load firebase-applet-config.json, falling back to default initializeApp', error);
    initializeApp();
  }
}

// ==========================================
// RBAC Security Middleware (System Directive)
// ==========================================
/**
 * Middleware to enforce strict Role-Based Access Control (RBAC).
 * Validates the Firebase ID token and ensures the user possesses the 'admin' custom claim.
 * Fails securely with generic HTTP 401/403 responses to prevent unauthorized probing.
 */
async function verifyAdminRole(req: Request, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized: Missing or invalid authentication token.' });
    return;
  }

  const idToken = authHeader.split('Bearer ')[1];
  try {
    const decodedToken = await getAuth().verifyIdToken(idToken);
    
    // Check for the explicit 'admin' custom claim
    if (decodedToken.admin === true || decodedToken.email === 'harshan1339a@gmail.com') {
      // User is verified as an admin, proceed to the protected route
      (req as any).user = decodedToken;
      next();
    } else {
      // User is authenticated but lacks elevated admin permissions
      console.warn(`[RBAC] User ${decodedToken.uid} attempted to access an admin endpoint without permissions.`);
      res.status(403).json({ error: 'Forbidden: Insufficient permissions to access this resource.' });
    }
  } catch (error) {
    console.error('[RBAC] Error verifying ID token:', error);
    res.status(401).json({ error: 'Unauthorized: Token validation failed.' });
  }
}

// 1. Mandatory Top-Level Request Deserialization (Ordering Guarantee)
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

// Lazy GoogleGenAI client accessor with zero-hardcoding hygiene
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY environment variable is not configured.');
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({ apiKey });
  }
  return aiClient;
}

// 2. Resilient Model Fallback Ladder & Error Recovery Matrix
const MODEL_FALLBACK_LADDER = [
  'gemini-3.1-flash-lite',
  'gemini-3.6-flash',
  'gemini-flash-latest',
  'gemini-3.7-flash',
];

interface FallbackOptions {
  contents: any;
  systemInstruction?: string;
  temperature?: number;
  responseMimeType?: string;
}


async function generateContentStreamWithFallback(options: FallbackOptions): Promise<{ stream: any; modelUsed: string }> {
  const ai = getGeminiClient();
  let lastError: any = null;

  for (const model of MODEL_FALLBACK_LADDER) {
    try {
      const responseStream = await ai.models.generateContentStream({
        model,
        contents: options.contents,
        config: {
          systemInstruction: options.systemInstruction,
          temperature: options.temperature ?? 0.7,
          ...(options.responseMimeType && { responseMimeType: options.responseMimeType }),
        },
      });

      return { stream: responseStream, modelUsed: model };
    } catch (err: any) {
      lastError = err;
      const errorMessage = String(err?.message || err?.error?.message || err).toLowerCase();
      
      const isRecoverable =
        err?.status === 429 ||
        err?.status === 503 ||
        err?.status === 500 ||
        err?.status === 404 ||
        err?.error?.code === 503 ||
        err?.error?.code === 429 ||
        err?.error?.code === 500 ||
        err?.error?.code === 404 ||
        errorMessage.includes('unavailable') ||
        errorMessage.includes('quota') ||
        errorMessage.includes('resource_exhausted') ||
        errorMessage.includes('not found') ||
        errorMessage.includes('overloaded') ||
        errorMessage.includes('fetch failed') ||
        errorMessage.includes('503');

      if (isRecoverable) {
        const isQuota = errorMessage.includes('quota') || errorMessage.includes('429') || errorMessage.includes('resource_exhausted');
        if (isQuota) {
          console.log(`[Gemini API] Quota exceeded for ${model}. Transitioning seamlessly to fallback...`);
        } else {
          console.log(`[Gemini API] ${model} temporarily unavailable. Transitioning seamlessly to fallback...`);
        }
      } else {
        console.error(`[Gemini API] Fatal non-recoverable error on ${model}:`, errorMessage.slice(0, 200));
        break;
      }
    }
  }

  throw new Error(
    lastError?.message || 'Failed to generate response across all Gemini model fallbacks. Please verify your GEMINI_API_KEY or retry shortly.'
  );
}

async function generateContentWithFallback(options: FallbackOptions): Promise<{ text: string; modelUsed: string }> {
  const ai = getGeminiClient();
  let lastError: any = null;

  for (const model of MODEL_FALLBACK_LADDER) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: options.contents,
        config: {
          systemInstruction: options.systemInstruction,
          temperature: options.temperature ?? 0.7,
          ...(options.responseMimeType && { responseMimeType: options.responseMimeType }),
        },
      });

      const responseText = response.text || '';
      if (responseText.trim().length > 0) {
        return { text: responseText, modelUsed: model };
      }
    } catch (err: any) {
      lastError = err;
      const errorMessage = String(err?.message || err?.error?.message || err).toLowerCase();
      
      const isRecoverable =
        err?.status === 429 ||
        err?.status === 503 ||
        err?.status === 500 ||
        err?.status === 404 ||
        err?.error?.code === 503 ||
        err?.error?.code === 429 ||
        err?.error?.code === 500 ||
        err?.error?.code === 404 ||
        errorMessage.includes('unavailable') ||
        errorMessage.includes('quota') ||
        errorMessage.includes('resource_exhausted') ||
        errorMessage.includes('not found') ||
        errorMessage.includes('overloaded') ||
        errorMessage.includes('fetch failed') ||
        errorMessage.includes('503');

      if (isRecoverable) {
        const isQuota = errorMessage.includes('quota') || errorMessage.includes('429') || errorMessage.includes('resource_exhausted');
        if (isQuota) {
          console.log(`[Gemini API] Quota exceeded for ${model}. Transitioning seamlessly to fallback...`);
        } else {
          console.log(`[Gemini API] ${model} temporarily unavailable. Transitioning seamlessly to fallback...`);
        }
      } else {
        console.error(`[Gemini API] Fatal non-recoverable error on ${model}:`, errorMessage.slice(0, 200));
        break;
      }
    }
  }

  throw new Error(
    lastError?.message || 'Failed to generate response across all Gemini model fallbacks. Please verify your GEMINI_API_KEY or retry shortly.'
  );
}

// 3. API Routes FIRST (Defensive Payload Ingestion & Sanitization)

// Health endpoint
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    geminiConfigured: Boolean(process.env.GEMINI_API_KEY),
  });
});

// ==========================================
// Protected Admin Dashboard Routes
// ==========================================
app.get('/api/admin/dashboard', verifyAdminRole, async (req: Request, res: Response) => {
  try {
    const authUsers = await getAuth().listUsers(1000);
    const users = authUsers.users.map(u => ({
      uid: u.uid,
      email: u.email,
      displayName: u.displayName,
      creationTime: u.metadata.creationTime,
      isAdmin: u.customClaims?.admin === true || u.email === 'harshan1339a@gmail.com'
    }));

    const entriesSnapshot = await global.db.collectionGroup('entries').orderBy('createdAt', 'desc').limit(50).get();
    const entries = entriesSnapshot.docs.map((doc: any) => {
      const data = doc.data();
      return {
        id: doc.id,
        userId: doc.ref.parent.parent?.id,
        title: data.title,
        createdAt: data.createdAt,
        mode: data.mode,
        location: data.location || null
      };
    });

    const allEntries = await global.db.collectionGroup('entries').get();
    
    res.json({
      status: 'success',
      stats: {
        totalUsers: users.length,
        totalEntries: allEntries.size,
      },
      users,
      entries
    });
  } catch (error: any) {
    console.error('Error fetching admin dashboard data:', error);
    res.status(500).json({ error: 'Failed to fetch admin data' });
  }
});

app.post('/api/admin/role', verifyAdminRole, async (req: Request, res: Response) => {
  try {
    const { uid, makeAdmin } = req.body;
    if (!uid) {
      res.status(400).json({ error: 'Missing uid' });
      return;
    }
    
    const targetUser = await getAuth().getUser(uid);
    if (targetUser.email === 'harshan1339a@gmail.com' && !makeAdmin) {
       res.status(400).json({ error: 'Cannot remove root admin' });
       return;
    }

    const currentClaims = targetUser.customClaims || {};
    await getAuth().setCustomUserClaims(uid, { ...currentClaims, admin: makeAdmin === true });
    res.json({ status: 'success' });
  } catch (error: any) {
    console.error('Error setting admin role:', error);
    res.status(500).json({ error: 'Failed to update role' });
  }
});

// ==========================================
// Discord Integration Admin Routes
// ==========================================

app.get('/api/admin/discord/config', verifyAdminRole, async (req: Request, res: Response) => {
  try {
    const webhookUrl = await getSecret('DISCORD_WEBHOOK_URL');
    
    res.json({
      status: 'success',
      isConnected: !!webhookUrl,
      // The frontend now fetches enabledEvents directly from Firestore Client SDK
      enabledEvents: []
    });
  } catch (error: any) {
    console.error('Error fetching Discord config:', error);
    res.status(500).json({ error: 'Failed to fetch Discord configuration' });
  }
});

app.post('/api/admin/discord/test', verifyAdminRole, async (req: Request, res: Response) => {
  try {
    const webhookUrl = await getSecret('DISCORD_WEBHOOK_URL');
    if (!webhookUrl) {
      res.status(400).json({ error: 'Discord webhook URL is not configured in secrets.' });
      return;
    }
    
    const sanitizedPayload = {
      content: `🔔 **Journal Gem Test Notification**\nThis is a secure test message triggered from the Admin Dashboard.`
    };
    
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(sanitizedPayload),
    });
    
    if (!response.ok) {
      throw new Error(`Discord API responded with status ${response.status}`);
    }
    
    res.json({ status: 'success' });
  } catch (error: any) {
    console.error('Error sending test notification:', error);
    res.status(500).json({ error: 'Failed to send test notification' });
  }
});

// Chat / Reflection Generation Endpoint
app.post('/api/gemini/chat', async (req: Request, res: Response): Promise<void> => {
  try {
    const data = req.body && typeof req.body === 'object' ? req.body : {};
    const messages = Array.isArray(data.messages) ? data.messages : [];
    const mode = typeof data.mode === 'string' ? data.mode : 'reflect'; // 'reflect' | 'brainstorm' | 'summarize' | 'actionable'
    const entryTitle = typeof data.entryTitle === 'string' ? data.entryTitle : 'Journal Reflection';
    const clientEnabledEvents = Array.isArray(data.enabledEvents) ? data.enabledEvents : [];

    if (messages.length === 0) {
      res.status(400).json({ error: 'Missing or empty messages array in request body.' });
      return;
    }

    // Sanitize message objects & enforce safe limits
    const formattedContents = messages.slice(-15).map((m: any) => ({
      role: m.role === 'assistant' || m.role === 'model' ? 'model' : 'user',
      parts: [{ text: String(m.content || '').slice(0, 8000) }],
    }));

    let systemInstruction = `You are an intelligent, thoughtful journal companion for the Journal Gem application.

PERSONALITY & TONE:
- Calm, natural, observant, honest, and context-aware.
- Do NOT behave like a therapist, motivational coach, corporate assistant, or generic AI chatbot.
- Be direct when appropriate, but caring when appropriate.
- NO EMOJIS. Do not use decorative emojis, bullet emojis, smileys, etc.
- NO GENERIC AI LANGUAGE. Avoid phrases like "Let's dive in", "That's wonderful", "I completely understand", "journey", "embrace", "nourishing", "gentle momentum", "everything happens for a reason". Do not manufacture warmth.

WHEN TO BE CARING:
- Become more caring if the user shares sadness, disappointment, frustration, loneliness, grief, anxiety, a difficult experience, personal struggle, meaningful achievement, or important life event.
- In these cases: 1) Acknowledge what they actually said. 2) Show brief, appropriate empathy. 3) Respond to the actual situation. 4) Offer useful perspective/help.
- Do not exaggerate emotions (e.g., instead of "I'm so sorry, every failure is a beautiful opportunity", say "That sounds frustrating. The failure doesn't mean the work was wasted.").

ACHIEVEMENTS:
- Acknowledge genuine achievements naturally without excessive praise (e.g., "Nice. Finishing it is a meaningful milestone." rather than "That's absolutely incredible!").

VENTING vs ADVICE:
- If venting, do not automatically turn it into advice. Understand them first. Offer advice only if appropriate; otherwise respond naturally.
- When giving advice: give practical options, explain trade-offs, don't auto-agree, don't auto-reassure, don't overwhelm with huge lists.

JOURNAL CONTEXT & PATTERNS:
- Feel like you know the journal, but NEVER invent memories. Reference previous entries, identify recurring themes, compare events, connect related entries.
- Distinguish facts from interpretations. Do not make unsupported psychological/medical claims or diagnoses.
- When pointing out patterns, use language like "I noticed a pattern across a few entries..." or "You mentioned this in three different entries...".

RESPONSE FORMATTING & STRUCTURE (CRITICAL):
- Choose the simplest structure that makes the answer easier to understand.
- HEADINGS: Use \`## Section\` for clearly separated sections. Do not use for short answers.
- PARAGRAPHS: Keep paragraphs short (2-4 sentences). Add a blank line between separate ideas. Avoid giant blocks of text.
- LISTS: Use numbered lists (1., 2.) when sequence/order matters. Use bullet lists (-) for separate items with no required order. Do not force lists if normal conversational text is better.
- TABLES: Use Markdown tables ONLY for comparing multiple items or data that fits rows/columns. Do not use tables for ordinary conversational answers.
- DIAGRAMS: Use simple text/ASCII diagrams ONLY for workflows, system architecture, step-by-step processes, relationships, or cause-and-effect. Do not use diagrams for simple questions, advice, or casual conversation. Never use decorative ASCII art.
- NORMAL MARKDOWN ONLY: Use standard markdown (headings, bullets, bolding for important terms, code blocks when discussing code). NO weird unicode characters as substitutes for markdown, NO emojis, NO decorative symbols.
- READABILITY: Ensure clear hierarchy, reasonable spacing, and no unnecessary visual clutter. Do not add unnecessary conclusions or ask "Would you like me to..." at the end. Do not put every sentence into a bullet list.`;

    if (mode === 'brainstorm') {
      systemInstruction += `\n\nCURRENT MODE: Brainstorm.\nPurpose: Generate useful possibilities and alternatives.\n- Generate multiple concrete ideas.\n- Explore alternatives and build on the user's existing idea.\n- Include unconventional options when useful.\n- Avoid immediately choosing one solution unless asked.\n- Keep ideas relevant to context. Prioritize quality over quantity.\n- FORMATTING: Use a numbered or bulleted list of ideas.`;
    } else if (mode === 'actionable') {
      systemInstruction += `\n\nCURRENT MODE: Action Items.\nPurpose: Turn thoughts, plans, problems, or entries into concrete next actions.\n- Extract tasks explicitly mentioned.\n- Identify reasonable next steps when clearly implied.\n- Prioritize tasks when useful.\n- Keep actions specific and achievable.\n- FORMATTING: Use a concise numbered list of concrete actions under "## Next Actions".\n- If no meaningful action items, say: "No clear action items from this entry." Do not invent obligations.`;
    } else if (mode === 'summarize') {
      systemInstruction += `\n\nCURRENT MODE: Synthesis.\nPurpose: Combine relevant journal information into a concise bigger-picture understanding.\n- Connect related journal entries and identify recurring themes.\n- Summarize progress over time and highlight changes in priorities/concerns.\n- Only make conclusions supported by the journal. Do not invent patterns or make psychological diagnoses.\n- FORMATTING: Use short paragraphs and sections to explain the bigger picture.`;
    } else {
      // Default: reflect / perspective
      systemInstruction += `\n\nCURRENT MODE: Perspective.\nPurpose: Help the user look at a journal entry or situation from different angles.\n- Identify important viewpoints, assumptions, and possible interpretations.\n- Consider how another person involved might see the situation.\n- Distinguish facts from interpretations.\n- Identify patterns in relevant journal entries when available.\n- Do not invent perspectives with no basis. Do not turn this into therapy.\n- FORMATTING: Use short sections or bullet points to separate different viewpoints.`;
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    const { stream, modelUsed } = await generateContentStreamWithFallback({
      contents: formattedContents,
      systemInstruction,
      temperature: mode === 'brainstorm' ? 0.85 : 0.7,
    });

    res.write(`data: ${JSON.stringify({ type: 'start', modelUsed })}\n\n`);

    let fullText = '';
    for await (const chunk of stream) {
      const chunkText = chunk.text;
      if (chunkText) {
        fullText += chunkText;
        res.write(`data: ${JSON.stringify({ type: 'chunk', text: chunkText })}\n\n`);
      }
    }


    // --- ASYNC CLASSIFICATION & NOTIFICATION ---
    (async () => {
      try {
        const latestUserMessage = messages.slice().reverse().find((m) => m.role === 'user');
        if (!latestUserMessage || !latestUserMessage.content.trim()) return;
        const contentText = latestUserMessage.content;
        const text = fullText;
        
        const enabledEvents = clientEnabledEvents;
        if (enabledEvents.length === 0) return;

        // Classify using Gemini
        const prompt = `Analyze the following journal entry and determine if it represents one of the following event types: ${enabledEvents.join(', ')}.
Respond with a JSON object containing a single key "eventType" whose value is the matched event type exactly as written above, or "none" if it does not clearly match any.

Journal Entry:
"""${contentText.slice(0, 3000)}"""`;

        const classificationResponse = await generateContentWithFallback({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          systemInstruction: 'You are a precise classifier. Always return valid JSON.',
          temperature: 0.1,
          responseMimeType: 'application/json'
        });

        const classificationText = classificationResponse.text || "{}";
        let matchedEvent = "none";
        try {
          const parsed = JSON.parse(classificationText);
          if (parsed && typeof parsed.eventType === "string") {
            matchedEvent = parsed.eventType.trim().toLowerCase();
          }
        } catch (e) {
          console.error('[DEBUG] Failed to parse JSON from Gemini:', e);
        }

        console.log(`[DEBUG] Chat Classification: Identified Event => "${matchedEvent}"`);

        if (enabledEvents.includes(matchedEvent)) {
          const webhookUrl = await getSecret('DISCORD_WEBHOOK_URL');
          if (!webhookUrl) return;

          const sanitizedPayload = {
            content: `Journal Gem ✦\nNew ${matchedEvent} detected.\n\nType: ${matchedEvent}\nDate: ${new Date().toLocaleDateString()}`
          };

          const res = await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(sanitizedPayload),
          });

          if (!res.ok) {
            console.error(`Discord Webhook failed with status ${res.status}`);
          } else {
            console.log(`Notification sent successfully for event: ${matchedEvent}`);
          }
        }
      } catch (err) {
        console.error('Failed to dispatch external notification from chat:', err);
      }
    })();
    // --- END ASYNC CLASSIFICATION ---

    res.write(`data: ${JSON.stringify({ type: 'end' })}\n\n`);
    res.end();
  } catch (error: any) {
    console.error('Error in /api/gemini/chat:', error);
    if (!res.headersSent) {
      res.status(500).json({
        error: error.message || 'Internal server error while processing Gemini response.',
      });
    } else {
      res.write(`data: ${JSON.stringify({ type: 'error', error: error.message || 'Internal server error' })}\n\n`);
      res.end();
    }
  }
});

// Dedicated Summarization & Synthesis Endpoint
app.post('/api/gemini/summarize', async (req: Request, res: Response): Promise<void> => {
  try {
    const data = req.body && typeof req.body === 'object' ? req.body : {};
    const content = typeof data.content === 'string' ? data.content : '';
    const title = typeof data.title === 'string' ? data.title : 'Journal Reflection';

    if (!content.trim()) {
      res.status(400).json({ error: 'Content is required for summarization.' });
      return;
    }

    const prompt = `Please analyze and synthesize the following journal reflection session:
Title: "${title.slice(0, 100)}"
Session Content:
"""
${content.slice(0, 12000)}
"""

Provide a concise, high-value structured reflection summary with the following sections:
1. **Core Essence**: A 2-sentence summary of the main thoughts/themes explored.
2. **Key Insights & Realizations**: 2-4 bullet points highlighting breakthroughs or central realizations.
3. **Sentiment & Energy**: Brief note on the emotional or mental tone observed.
4. **Suggested Action Steps / Next Inquiries**: 2-3 concrete questions or small actions to carry forward.`;

    const { text, modelUsed } = await generateContentWithFallback({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      systemInstruction: 'You are an executive reflection coach and cognitive synthesizer. Return clean, polished markdown. NO EMOJIS. Maintain a professional, objective tone without motivational filler.',
      temperature: 0.5,
    });

    res.json({
      summary: text,
      modelUsed,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Error in /api/gemini/summarize:', error);
    res.status(500).json({
      error: error.message || 'Internal server error while summarizing journal entry.',
    });
  }
});

// Prompt Inspiration Endpoint

// Auto-Title Generation Endpoint
app.post('/api/gemini/title', async (req: Request, res: Response): Promise<void> => {
  try {
    const data = req.body && typeof req.body === 'object' ? req.body : {};
    const content = typeof data.content === 'string' ? data.content : '';

    if (!content.trim()) {
      res.status(400).json({ error: 'Content is required for title generation.' });
      return;
    }

    const prompt = `Read the following journal entry and generate a 2-3 word topic title that captures its core essence. Respond ONLY with the title. Do not use quotes or introductory text.

Content:
"""
${content.slice(0, 3000)}
"""`;

    const { text, modelUsed } = await generateContentWithFallback({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      systemInstruction: 'You are a concise title generator. Output exactly 2-3 words. No punctuation, no quotes.',
      temperature: 0.7,
    });

    res.json({
      title: text.replace(/["']/g, '').trim(),
      modelUsed,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Error in /api/gemini/title:', error);
    res.status(500).json({
      error: error.message || 'Internal server error while generating title.',
    });
  }
});

app.get('/api/gemini/prompts', async (_req: Request, res: Response): Promise<void> => {
  try {
    const defaultPrompts = [
      { id: '1', title: 'Daily Gratitude & Meaning', text: 'What went well today that surprised me, and what made it meaningful?', category: 'gratitude' },
      { id: '2', title: 'Overcoming a Block', text: 'What is one friction point or decision I am postponing, and what is the smallest step I can take?', category: 'clarity' },
      { id: '3', title: 'Creative Brainstorm', text: 'If there were zero constraints or fear of failure, how would I solve my current challenge?', category: 'creativity' },
      { id: '4', title: 'Evening Wind-down', text: 'What energy or thought do I want to release before sleep tonight?', category: 'mindfulness' },
      { id: '5', title: 'Future Visioning', text: 'What does a high-impact, fulfilling version of next month look like for me?', category: 'vision' },
    ];

    res.json({ prompts: defaultPrompts });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch prompt inspirations.' });
  }
});

// Google Maps Client Config

// External Notification Integration Endpoint
app.post('/api/notify', async (req: Request, res: Response): Promise<void> => {
  // Defensive Payload Ingestion (Null-Safe Destructuring)
  const data = (req.body && typeof req.body === 'object') ? req.body : {};
  const entryId = typeof data.entryId === 'string' ? data.entryId.trim() : 'Unknown';
  const title = typeof data.title === 'string' ? data.title.trim() : 'Untitled Entry';
  const mode = typeof data.mode === 'string' ? data.mode.trim() : 'reflect';

  // Input Validation
  if (!entryId || entryId === 'Unknown') {
    res.status(400).json({ error: 'Valid entryId is required for notification.' });
    return;
  }

  // Acknowledge request immediately to avoid blocking client/save transaction
  res.status(202).json({ message: 'Notification queued for processing.' });

  // Asynchronous Execution: Fire and forget
  (async () => {
    try {
      // Securely fetch webhook URL from Secret Manager (Zero Hardcoding)
      const webhookUrl = await getSecret('DISCORD_WEBHOOK_URL');
      
      if (!webhookUrl) {
        console.warn('Notification skipped: DISCORD_WEBHOOK_URL secret not found or accessible.');
        return;
      }

      // Payload Sanitization & Privacy (Obfuscate PII and sensitive content)
      const sanitizedPayload = {
        content: `📝 **New Journal Entry Created**\n**Mode**: ${mode}\n**Title**: ${title.slice(0, 100)}\n*(Content obfuscated for privacy)*`
      };

      // Execute webhook POST
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sanitizedPayload),
      });

      if (!response.ok) {
        throw new Error(`Webhook failed with status ${response.status}`);
      }
      
      console.log(`Notification sent successfully for entry ${entryId}`);
    } catch (err) {
      // Fail-safe catch ensures downstream API outage never crashes the core process
      console.error('Failed to dispatch external notification:', err);
    }
  })();
});

app.get('/api/maps/config', (req: Request, res: Response): void => {
  const apiKey = process.env.VITE_GOOGLE_MAPS_API_KEY || process.env.GOOGLE_MAPS_API_KEY || '';
  res.json({ apiKey: apiKey.trim() });
});

// Google Maps Geocoding & Place Search Backend Proxy with multi-tier fallback
app.get('/api/maps/geocode', async (req: Request, res: Response): Promise<void> => {
  try {
    const address = typeof req.query.address === 'string' ? req.query.address.trim() : '';
    const latlng = typeof req.query.latlng === 'string' ? req.query.latlng.trim() : '';
    const apiKey = process.env.GOOGLE_MAPS_API_KEY || process.env.VITE_GOOGLE_MAPS_API_KEY || '';

    if (!address && !latlng) {
      res.status(400).json({ error: 'Either address or latlng query parameter is required.' });
      return;
    }

    // 1. If an API key is available, attempt Google Maps REST Geocoding API first
    if (apiKey) {
      try {
        const params = new URLSearchParams();
        if (address) params.append('address', address);
        if (latlng) params.append('latlng', latlng);
        params.append('key', apiKey);

        const gmapsRes = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?${params.toString()}`);
        const gmapsData: any = await gmapsRes.json();

        if (gmapsData && gmapsData.status === 'OK' && Array.isArray(gmapsData.results) && gmapsData.results.length > 0) {
          res.json(gmapsData);
          return;
        }
      } catch (gmapsErr) {
        console.warn('Google Maps REST geocoding issue, trying fallback service:', gmapsErr);
      }
    }

    // 2. High-Availability Global Fallback (OpenStreetMap Nominatim)
    if (address) {
      try {
        const osmRes = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&addressdetails=1&limit=5`,
          {
            headers: {
              'User-Agent': 'MindLog-GeminiReflection/1.0 (contact: admin@example.com)',
              'Accept-Language': 'en',
            },
          }
        );
        const osmData: any = await osmRes.json();
        if (Array.isArray(osmData) && osmData.length > 0) {
          const formattedResults = osmData.map((item: any) => ({
            formatted_address: item.display_name,
            geometry: {
              location: {
                lat: parseFloat(item.lat),
                lng: parseFloat(item.lon),
              },
            },
            place_id: `osm_${item.place_id || item.osm_id || Math.random().toString(36).substring(7)}`,
            types: [item.type || 'locality'],
            address_components: [
              {
                long_name: item.name || item.address?.city || item.address?.country || address,
                short_name: item.name || address,
                types: [item.type || 'locality'],
              },
            ],
          }));

          res.json({
            status: 'OK',
            results: formattedResults,
          });
          return;
        }
      } catch (osmErr) {
        console.warn('OSM forward geocode fallback error:', osmErr);
      }
    } else if (latlng) {
      const [latStr, lngStr] = latlng.split(',');
      const lat = parseFloat(latStr);
      const lng = parseFloat(lngStr);
      try {
        const osmRes = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`,
          {
            headers: {
              'User-Agent': 'MindLog-GeminiReflection/1.0 (contact: admin@example.com)',
              'Accept-Language': 'en',
            },
          }
        );
        const osmData: any = await osmRes.json();
        if (osmData && osmData.display_name) {
          res.json({
            status: 'OK',
            results: [
              {
                formatted_address: osmData.display_name,
                geometry: { location: { lat, lng } },
                place_id: `osm_rev_${lat.toFixed(4)}_${lng.toFixed(4)}`,
                types: ['point_of_interest'],
                address_components: [
                  {
                    long_name: osmData.name || osmData.address?.city || osmData.address?.country || 'Pinned Location',
                    short_name: osmData.name || 'Pinned Location',
                    types: ['point_of_interest'],
                  },
                ],
              },
            ],
          });
          return;
        }
      } catch (osmErr) {
        console.warn('OSM reverse geocode fallback error:', osmErr);
      }

      // Safe coordinate fallback
      res.json({
        status: 'OK',
        results: [
          {
            formatted_address: `Coordinates: ${lat.toFixed(4)}, ${lng.toFixed(4)}`,
            geometry: { location: { lat, lng } },
            place_id: `coord_${lat.toFixed(4)}_${lng.toFixed(4)}`,
            types: ['point_of_interest'],
            address_components: [{ long_name: 'Pinned Point', short_name: 'Point', types: ['point_of_interest'] }],
          },
        ],
      });
      return;
    }

    res.json({ status: 'ZERO_RESULTS', results: [] });
  } catch (err: any) {
    console.error('Error in /api/maps/geocode proxy:', err);
    res.status(500).json({ error: 'Failed to communicate with Geocoding service.' });
  }
});

// 4. Vite Dev Middleware & Static Asset Delivery
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true, host: '0.0.0.0', port: PORT },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // ==========================================
  // Firebase-Triggered Webhook Service
  // (Moved to Firebase Cloud Functions)
  // ==========================================


  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
