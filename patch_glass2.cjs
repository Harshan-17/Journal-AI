const fs = require('fs');
let code = fs.readFileSync('src/components/JournalEditor.tsx', 'utf8');

const targetUserBox = '<div className="relative max-w-[85%] px-5 py-4 bg-neutral-800/50 backdrop-blur-xl border border-cyan-500/30 rounded-2xl rounded-tr-sm text-[14px] leading-relaxed shadow-[0_4px_30px_rgba(0,0,0,0.5)]">';
const replaceUserBox = '<div className="relative max-w-[85%] px-5 py-4 bg-gray-900/60 backdrop-blur-md border border-cyan-500/40 shadow-[0_0_15px_rgba(6,182,212,0.15)] rounded-2xl rounded-tr-sm text-[14px] leading-relaxed">';
code = code.replace(targetUserBox, replaceUserBox);

const targetAIBox = '<div className="relative w-full px-6 py-5 bg-neutral-900/60 backdrop-blur-xl border border-white/5 rounded-2xl text-[14px] sm:text-[15px] leading-loose shadow-[0_4px_30px_rgba(0,0,0,0.5)]">';
const replaceAIBox = '<div className="relative w-full px-6 py-5 bg-gray-900/60 backdrop-blur-md border border-white/10 rounded-2xl text-[14px] sm:text-[15px] leading-loose shadow-sm">';
code = code.replace(targetAIBox, replaceAIBox);

fs.writeFileSync('src/components/JournalEditor.tsx', code);
console.log('patched glass2');
