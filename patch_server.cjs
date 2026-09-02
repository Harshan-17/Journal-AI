const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const targetStr = `app.get('/api/gemini/prompts',`;
const newEndpoint = `
// Auto-Title Generation Endpoint
app.post('/api/gemini/title', async (req: Request, res: Response): Promise<void> => {
  try {
    const data = req.body && typeof req.body === 'object' ? req.body : {};
    const content = typeof data.content === 'string' ? data.content : '';

    if (!content.trim()) {
      res.status(400).json({ error: 'Content is required for title generation.' });
      return;
    }

    const prompt = \`Read the following journal entry and generate a 2-3 word topic title that captures its core essence. Respond ONLY with the title. Do not use quotes or introductory text.

Content:
"""
\${content.slice(0, 3000)}
"""\`;

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

`;

code = code.replace(targetStr, newEndpoint + targetStr);
fs.writeFileSync('server.ts', code);
