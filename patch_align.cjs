const fs = require('fs');
let code = fs.readFileSync('src/components/JournalEditor.tsx', 'utf8');

const targetContainer = 'className="flex flex-col items-start w-full group"';
const replaceContainer = 'className={`flex flex-col w-full group ${isUser ? "items-end" : "items-start"}`}';
code = code.replace(targetContainer, replaceContainer);

const targetUserBox = '<div className="relative w-full px-6 py-5 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl text-[14px] leading-relaxed shadow-sm">';
const replaceUserBox = '<div className="relative max-w-[85%] px-5 py-4 bg-cyan-900/30 backdrop-blur-md border border-cyan-500/30 rounded-2xl rounded-tr-sm text-[14px] leading-relaxed shadow-sm">';
code = code.replace(targetUserBox, replaceUserBox);

const targetAITime = '<div className="flex items-center space-x-1.5 text-[10px] text-neutral-500 mb-2 px-1 uppercase tracking-widest font-mono">';
const replaceAITime = '<div className={`flex items-center space-x-1.5 text-[10px] text-neutral-500 mb-2 px-1 uppercase tracking-widest font-mono ${isUser ? "flex-row-reverse space-x-reverse" : ""}`}>';
code = code.replace(targetAITime, replaceAITime);

const targetAITimeDot = '<span>•</span>';
const replaceAITimeDot = '<span className="opacity-50">•</span>';
code = code.replace(targetAITimeDot, replaceAITimeDot);

fs.writeFileSync('src/components/JournalEditor.tsx', code);
console.log('patched align');
