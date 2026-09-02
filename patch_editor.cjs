const fs = require('fs');
let code = fs.readFileSync('src/components/JournalEditor.tsx', 'utf8');

const oldChatbox = '<div className="relative flex items-end rounded-none bg-black/40 border border-white/20 focus-within:border-white/50 focus-within:ring-1 focus-within:ring-white/20 transition-all p-3 shadow-[0_0_15px_rgba(255,255,255,0.05)] focus-within:shadow-[0_0_30px_rgba(255,255,255,0.15)] backdrop-blur-2xl">';

const newChatbox = `<MovingBorderButton
        as="div"
        borderRadius="0.5rem"
        containerClassName="w-full"
        className="relative flex items-end bg-black/40 border border-transparent transition-all p-3 backdrop-blur-2xl w-full"
      >`;

code = code.replace(oldChatbox, newChatbox);
code = code.replace('        </button>\n      </div>', '        </button>\n      </MovingBorderButton>');

// Highlight Date/Time
const oldTime = '<span>{msg.timestamp}</span>';
const newTime = '<span className="bg-white/10 text-white px-2 py-0.5 rounded-md font-bold tracking-wider shadow-[0_0_8px_rgba(255,255,255,0.1)]">{msg.timestamp}</span>';

code = code.replace(oldTime, newTime); // Assuming only 1 match or we need global replace
// Replace all just in case
code = code.split(oldTime).join(newTime);

fs.writeFileSync('src/components/JournalEditor.tsx', code);
console.log('patched');
