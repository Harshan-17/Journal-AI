const fs = require('fs');
let code = fs.readFileSync('src/components/JournalEditor.tsx', 'utf8');

const target = `<MovingBorderButton
        as="div"
        borderRadius="0.5rem"
        containerClassName="w-full"
        className="relative flex items-end bg-black/40 border border-transparent transition-all p-3 backdrop-blur-2xl w-full"
      >`;

const replacement = `<div className="relative flex items-end bg-black/40 border border-white/20 focus-within:border-white/50 focus-within:shadow-[0_0_20px_rgba(255,255,255,0.15)] transition-all p-3 backdrop-blur-2xl w-full rounded-xl shadow-[0_0_10px_rgba(255,255,255,0.05)]">`;

code = code.replace(target, replacement);

const targetEnd = `        </button>
      </MovingBorderButton>`;
const replacementEnd = `        </button>
      </div>`;

code = code.replace(targetEnd, replacementEnd);

fs.writeFileSync('src/components/JournalEditor.tsx', code);
console.log('patched');
