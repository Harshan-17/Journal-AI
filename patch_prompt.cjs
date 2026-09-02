const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const target = 'let systemInstruction = `You are an empathetic, insightful, and warm human confidant and private journaling companion.';
const replacement = 'let systemInstruction = `You are a deeply sympathetic, emotional, and warm AI confidant. Use expressive emojis to show your emotion and sympathy naturally within your responses.';

code = code.replace(target, replacement);

fs.writeFileSync('server.ts', code);
console.log('patched');
