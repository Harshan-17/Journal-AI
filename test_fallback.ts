import { GoogleGenAI } from '@google/genai';

async function test() {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  try {
    const res = await ai.models.generateContent({
      model: 'gemini-flash-latest',
      contents: [{ role: 'user', parts: [{ text: 'hi' }] }],
    });
    console.log(res.text);
  } catch (err: any) {
    console.log('STATUS:', err.status);
    console.log('CODE:', err.error?.code);
    console.log('MESSAGE:', err.message);
  }
}
test();
