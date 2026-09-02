const fs = require('fs');
let code = fs.readFileSync('src/components/SessionToolsPopover.tsx', 'utf8');

const target = `<MovingBorderButton
        id="btn-session-tools-trigger"
        onClick={() => setIsOpen((prev) => !prev)}
        borderRadius="12px"
        duration={3500}
        containerClassName="h-8 w-auto min-w-[120px]"
        className={\`flex items-center space-x-2 px-3 py-1.5 rounded-xl border text-xs font-medium transition-all duration-200 active:scale-95 cursor-pointer backdrop-blur-md \${
          isOpen
            ? 'bg-neutral-850 border-neutral-600 text-neutral-100 shadow-md ring-1 ring-white/10'
            : 'bg-black hover:bg-neutral-900 border-white/20 text-neutral-300 hover:text-white'
        }\`}
        title="Session focus and tools"
      >
        <SlidersHorizontal className="w-3.5 h-3.5 text-neutral-400" />
        <span className="font-semibold text-neutral-200">Options</span>
      </MovingBorderButton>`;

const replacement = `<button
        id="btn-session-tools-trigger"
        onClick={() => setIsOpen((prev) => !prev)}
        className={\`h-8 flex items-center space-x-2 px-3 py-1.5 rounded-xl border text-xs font-medium transition-all duration-300 active:scale-95 cursor-pointer backdrop-blur-md hover:shadow-[0_0_15px_rgba(255,255,255,0.2)] \${
          isOpen
            ? 'bg-neutral-850 border-neutral-600 text-neutral-100 ring-1 ring-white/10 shadow-[0_0_20px_rgba(255,255,255,0.2)]'
            : 'bg-black border-white/20 text-neutral-300 hover:text-white hover:border-white/40'
        }\`}
        title="Session focus and tools"
      >
        <SlidersHorizontal className="w-3.5 h-3.5 text-neutral-400" />
        <span className="font-semibold text-neutral-200">Options</span>
      </button>`;

code = code.replace(target, replacement);
fs.writeFileSync('src/components/SessionToolsPopover.tsx', code);
console.log('patched');
