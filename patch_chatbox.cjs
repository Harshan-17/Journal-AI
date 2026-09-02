const fs = require('fs');
let code = fs.readFileSync('src/components/JournalEditor.tsx', 'utf8');

const target = 'className="relative flex items-end rounded-none bg-black/40 border border-white/20 focus-within:border-white/50 focus-within:ring-1 focus-within:ring-white/10 transition-all p-3 shadow-2xl backdrop-blur-2xl"';
const replacement = 'className="relative flex items-end rounded-none bg-black/40 border border-white/20 focus-within:border-white/50 focus-within:ring-1 focus-within:ring-white/20 transition-all p-3 shadow-[0_0_15px_rgba(255,255,255,0.05)] focus-within:shadow-[0_0_30px_rgba(255,255,255,0.15)] backdrop-blur-2xl"';

code = code.replace(target, replacement);

fs.writeFileSync('src/components/JournalEditor.tsx', code);
console.log('Chatbox patched');
