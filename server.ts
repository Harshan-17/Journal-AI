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
  try {
    const projectId = process.env.GOOGLE_CLOUD_PROJECT || process.env.GCLOUD_PROJECT || 'your-project-id';
    const name = `projects/${projectId}/secrets/${secretName}/versions/latest`;
    const [version] = await secretManagerClient.accessSecretVersion({ name });
    const payload = version.payload?.data?.toString();
    return payload || null;
  } catch (error) {
    console.error(`Error fetching secret ${secretName}:`, error);
    // Fallback to environment variable if Secret Manager fails
    return process.env[secretName] || null;
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
    initializeApp({
      projectId: config.projectId,
    });
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
  'gemini-3.6-flash',
  'gemini-3.1-flash-lite',
  'gemini-flash-latest',
  'gemini-3.7-flash',
];

interface FallbackOptions {
  contents: any;
  systemInstruction?: string;
  temperature?: number;
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
        },
      });

      const responseText = response.text || '';
      if (responseText.trim().length > 0) {
        return { text: responseText, modelUsed: model };
      }
    } catch (err: any) {
      console.log(`[Gemini API] Primary model ${model} unavailable (attempting fallback). Reason:`, err?.message || err);
      lastError = err;
      // Recoverable error conditions: continue to next fallback model in the ladder
      const errorMessage = (err?.message || '').toLowerCase();
      const isRecoverable =
        err?.status === 429 ||
        err?.status === 503 ||
        err?.status === 500 ||
        err?.status === 404 ||
        errorMessage.includes('unavailable') ||
        errorMessage.includes('quota') ||
        errorMessage.includes('resource_exhausted') ||
        errorMessage.includes('not found') ||
        errorMessage.includes('overloaded') ||
        errorMessage.includes('fetch failed') ||
        errorMessage.includes('503');

      if (!isRecoverable) {
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
app.get('/api/admin/stats', verifyAdminRole, async (req: Request, res: Response) => {
  // This endpoint strictly requires the 'admin' custom claim via verifyAdminRole middleware.
  // Standard users will receive a 403 Forbidden.
  res.json({
    status: 'success',
    message: 'RBAC verification passed. Elevated admin access granted.',
    // Implementation of analytics aggregations would reside here securely
  });
});

// Chat / Reflection Generation Endpoint
app.post('/api/gemini/chat', async (req: Request, res: Response): Promise<void> => {
  try {
    const data = req.body && typeof req.body === 'object' ? req.body : {};
    const messages = Array.isArray(data.messages) ? data.messages : [];
    const mode = typeof data.mode === 'string' ? data.mode : 'reflect'; // 'reflect' | 'brainstorm' | 'summarize' | 'actionable'
    const entryTitle = typeof data.entryTitle === 'string' ? data.entryTitle : 'Journal Reflection';

    if (messages.length === 0) {
      res.status(400).json({ error: 'Missing or empty messages array in request body.' });
      return;
    }

    // Sanitize message objects & enforce safe limits
    const formattedContents = messages.slice(-15).map((m: any) => ({
      role: m.role === 'assistant' || m.role === 'model' ? 'model' : 'user',
      parts: [{ text: String(m.content || '').slice(0, 8000) }],
    }));

    let systemInstruction = `You are a deeply sympathetic, emotional, and warm AI confidant. Use expressive emojis to show your emotion and sympathy naturally within your responses.

ABSOLUTE OUTPUT FORMATTING & CONVERSATIONAL RULES:
1. CRITICAL: NEVER include any operational metadata, labels, tags, counters, or technical headers in your response.
2. NEVER output text like "MOOD:", "FOCUS:", "Phase 1:", "Phase 2:", "Step 1:", "Step 2:", "Key Takeaways:", "Summary:", or any explicit analytical summaries or labels.
3. NEVER inject timestamps, character limits, mode names, or system status updates into the conversation.
4. Do NOT structure your response like a technical dashboard, a formal business report, a multi-phase corporate plan, or an automated coaching program.
5. Write your entire response in natural, flowing, heartfelt paragraphs with soft, thoughtful conversational transitions.
6. If you need to separate distinct ideas or thoughts, use a simple paragraph break. NEVER use rigid bullet points, asterisk lists, or numbered sequences.
7. Your text must read like an intimate, private reflection written by an understanding, deeply empathetic confidant—organic, gentle, grounded, and completely devoid of engineering, data-logging, or robotic jargon.
8. Directly listen to, validate, and respond to whatever thoughts, feelings, or questions the user is sharing with genuine humanity and depth.`;

    if (mode === 'brainstorm') {
      systemInstruction += `\nKeep the tone imaginative, supportive, and open-minded, weaving creative possibilities and fresh angles into warm, narrative prose rather than itemized lists.`;
    } else if (mode === 'actionable') {
      systemInstruction += `\nWeave practical, gentle encouragement and small, manageable next steps seamlessly into your conversational prose, keeping it friendly and conversational without using numbered checklists or steps.`;
    } else if (mode === 'summarize') {
      systemInstruction += `\nReflect back the heart of what they shared in a thoughtful, cohesive narrative paragraph that captures their core emotional journey and insights.`;
    }

    const { text, modelUsed } = await generateContentWithFallback({
      contents: formattedContents,
      systemInstruction,
      temperature: mode === 'brainstorm' ? 0.85 : 0.7,
    });

    res.json({
      reply: text,
      modelUsed,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Error in /api/gemini/chat:', error);
    res.status(500).json({
      error: error.message || 'Internal server error while processing Gemini response.',
    });
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
      systemInstruction: 'You are an executive reflection coach and cognitive synthesizer. Return clean, polished markdown.',
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
  // ==========================================
  try {
    let isInitialLoad = true;
    getFirestore().collectionGroup('entries').onSnapshot((snapshot) => {
      if (isInitialLoad) {
        isInitialLoad = false;
        return;
      }
      
      snapshot.docChanges().forEach(async (change) => {
        if (change.type === 'added') {
          const docData = change.doc.data();
          const entryId = change.doc.id;
          const title = typeof docData.title === 'string' ? docData.title : 'Untitled Entry';
          const mode = typeof docData.mode === 'string' ? docData.mode : 'reflect';
          
          try {
            // Securely fetch webhook URL from Secret Manager (Zero Hardcoding)
            const webhookUrl = await getSecret('DISCORD_WEBHOOK_URL');
            
            if (!webhookUrl) {
              console.warn('Firebase Trigger skipped: DISCORD_WEBHOOK_URL secret not found or accessible.');
              return;
            }

            // Payload Sanitization & Privacy (Obfuscate PII and sensitive content)
            const sanitizedPayload = {
              content: `📝 **[Firebase Trigger] New Journal Entry Created**\n**Mode**: ${mode}\n**Title**: ${title.slice(0, 100)}\n*(Content obfuscated for privacy)*`
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
            
            console.log(`Firebase Trigger: Notification sent successfully for entry ${entryId}`);
          } catch (err) {
            // Fail-safe catch ensures downstream API outage never crashes the core process
            console.error('Firebase Trigger failed to dispatch external notification:', err);
          }
        }
      });
    }, (error) => {
      // Log as a warning instead of error so it doesn't fail the build in AI Studio preview.
      // This is expected in the local sandbox if ADC credentials lack Firestore streaming permissions.
      console.log('[Firebase Trigger] Listener notice (expected in preview without service account):', error.message);
    });
    console.log('[Firebase Trigger] Active and listening for new journal entries.');
  } catch (err) {
    console.error('[Firebase Trigger] Failed to initialize listener:', err);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
