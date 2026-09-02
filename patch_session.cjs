const fs = require('fs');
let code = fs.readFileSync('src/components/SessionToolsPopover.tsx', 'utf8');

if (!code.includes("import { Button as MovingBorderButton } from './ui/moving-border';")) {
  code = code.replace(
    "import { useAppTheme } from '../context/ThemeContext';",
    "import { useAppTheme } from '../context/ThemeContext';\nimport { Button as MovingBorderButton } from './ui/moving-border';"
  );
}

// Let's replace the trigger button
const triggerBtnRegex = /\{\/\* Trigger Button \*\/\}\s*<button[\s\S]*?<\/button>/;
const newTriggerBtn = `      {/* Trigger Button */}
      <MovingBorderButton
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
        <span className="font-semibold text-neutral-200">{currentModeObj.label}</span>
      </MovingBorderButton>`;

code = code.replace(triggerBtnRegex, newTriggerBtn);
fs.writeFileSync('src/components/SessionToolsPopover.tsx', code);
