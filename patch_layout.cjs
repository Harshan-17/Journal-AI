const fs = require('fs');
let code = fs.readFileSync('src/components/JournalEditor.tsx', 'utf8');

code = code.replace(
  /className=\{`flex flex-col \$\{isUser \? 'items-end' : 'items-start'\} w-full group`\}/g,
  'className="flex flex-col items-start w-full group"'
);

// We need to also check the AI bubble which is currently `bg-transparent md:bg-white/5 ...`. 
// Let's make it consistent.
code = code.replace(
  'className="relative w-full px-6 py-5 bg-transparent md:bg-white/5 md:backdrop-blur-md md:border md:border-white/10 rounded-2xl text-[14px] sm:text-[15px] leading-loose md:shadow-sm"',
  'className="relative w-full px-6 py-5 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl text-[14px] sm:text-[15px] leading-loose shadow-sm"'
);

fs.writeFileSync('src/components/JournalEditor.tsx', code);
