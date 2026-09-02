const fs = require('fs');
let code = fs.readFileSync('src/components/JournalEditor.tsx', 'utf8');

const composerRegex = /\{\/\* Floating Minimalist Input Composer \*\/\}[\s\S]*?(?=\{\/\* Location Picker Modal \*\/\}|$)/;
const composerMatch = code.match(composerRegex);
if (!composerMatch) {
  console.error("Composer not found");
  process.exit(1);
}

const renderComposerDef = `
  const renderComposer = () => (
    <motion.form 
      layoutId="composer-form"
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      onSubmit={handleSubmit} 
      className="max-w-3xl mx-auto w-full space-y-3"
    >
      <div className="relative flex items-end rounded-none bg-black/40 border border-white/20 focus-within:border-white/50 focus-within:ring-1 focus-within:ring-white/10 transition-all p-3 shadow-2xl backdrop-blur-2xl">
        <textarea
          id="input-journal-message"
          ref={textareaRef}
          rows={1}
          value={inputText}
          onChange={(e) => {
            setInputText(e.target.value);
            e.target.style.height = 'auto';
            e.target.style.height = \`\${Math.min(e.target.scrollHeight, 160)}px\`;
          }}
          onKeyDown={handleKeyDown}
          placeholder="What are you contemplating right now?..."
          disabled={isGenerating}
          className="flex-1 bg-transparent px-3 py-2 text-[15px] text-white placeholder-neutral-600 resize-none focus:outline-none max-h-40 min-h-[48px] leading-relaxed font-serif"
        />

        <button
          id="btn-send-message"
          type="submit"
          disabled={!inputText.trim() || isGenerating}
          className={\`p-3 \${themeConfig.accentBg} rounded-none shadow-xl disabled:opacity-20 disabled:cursor-not-allowed transition-all shrink-0 cursor-pointer active:scale-95 ml-2\`}
          title="Send message [Enter]"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>

      <div className="flex items-center justify-between text-[10px] text-neutral-600 px-2 uppercase tracking-widest font-mono">
        <span>
          <kbd className="px-1 border border-neutral-700 text-neutral-400">Enter</kbd> send, <kbd className="px-1 border border-neutral-700 text-neutral-400">Shift+Enter</kbd> newline
        </span>
        <span>{inputText.length} chars</span>
      </div>
    </motion.form>
  );
`;

code = code.replace("return (", renderComposerDef + "\n  return (");

const bottomReplacement = `
      {/* Floating Minimalist Input Composer */}
      {entry.messages.length > 0 && (
        <div className="shrink-0 sticky bottom-0 z-20 w-full px-4 sm:px-8 pb-6 pt-4 bg-gradient-to-t from-black via-black/90 to-transparent pointer-events-auto">
          {renderComposer()}
        </div>
      )}
      
`;
code = code.replace(composerRegex, bottomReplacement);

const emptyStateTriggerRegex = /\{\/\* Moving Border Action Trigger \*\/\}[\s\S]*?<\/div>/;
code = code.replace(emptyStateTriggerRegex, `
            {/* Input Composer in Center */}
            <div className="flex justify-center w-full px-4">
              {renderComposer()}
            </div>
`);

fs.writeFileSync('src/components/JournalEditor.tsx', code);
