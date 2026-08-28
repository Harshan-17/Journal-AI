import express, { Request, Response } from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const PORT = 3000;
const app = express();

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
      console.warn(`[Gemini API] Model ${model} encountered an error:`, err?.message || err);
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
        errorMessage.includes('overloaded');

      if (!isRecoverable && MODEL_FALLBACK_LADDER.indexOf(model) === MODEL_FALLBACK_LADDER.length - 1) {
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

    let systemInstruction = `You are a highly capable, knowledgeable, and empathetic AI Assistant and Journaling Companion.

CRITICAL DIRECTIVES:
1. DIRECT ANSWER FIRST: You MUST always directly, accurately, and thoroughly answer or respond to whatever specific text, question, prompt, or challenge the user has entered.
   - If the user asks a factual, technical, coding, conceptual, personal, or general question: Provide the direct, concrete answer immediately with high accuracy and clarity.
   - Never ignore the user's question or replace the answer with generic introspective rambling.
   - Never give unsolicited meta-commentary about what you think in the abstract without answering the user's explicit question or prompt.
2. RESPONSIVENESS & CONTEXT: Directly address the details, context, constraints, and questions stated by the user.
3. MODE-ALIGNED ENRICHMENT:
   - If mode is 'reflect': Give the direct answer/insight clearly, followed by thoughtful perspectives or 1-2 deep inquiry angles that expand on their situation.
   - If mode is 'brainstorm': Give the direct answer/options clearly, followed by structured, creative alternatives and innovative avenues to explore.
   - If mode is 'actionable': Give the direct answer clearly, broken down into practical, step-by-step milestones, checklists, and actionable execution items.
   - If mode is 'summarize': Synthesize the direct key points and core takeaways in a structured format.
4. FORMATTING: Use clean, structured markdown with bullet points, bold headers, and code blocks where helpful.
5. TONE: Warm, clear, insightful, constructive, and intellectually rigorous.`;

    if (mode === 'brainstorm') {
      systemInstruction += `\nMode Focus: Generate actionable creative ideas, alternative viewpoints, and exploration paths for the user's query.`;
    } else if (mode === 'actionable') {
      systemInstruction += `\nMode Focus: Provide concrete next steps, implementation checklists, and pragmatic milestones directly addressing the user's input.`;
    } else if (mode === 'summarize') {
      systemInstruction += `\nMode Focus: Provide structured synthesis, key takeaways, and breakthroughs for the user's input.`;
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

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
