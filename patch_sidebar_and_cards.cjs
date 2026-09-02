const fs = require('fs');

// 1. Fix Sidebar Initial State in App.tsx
let appCode = fs.readFileSync('src/App.tsx', 'utf8');
appCode = appCode.replace(
  'const [isSidebarOpen, setIsSidebarOpen] = useState(true);',
  'const [isSidebarOpen, setIsSidebarOpen] = useState(false);'
);
fs.writeFileSync('src/App.tsx', appCode);

// 2. Un-box recommendations in JournalEditor.tsx
let editorCode = fs.readFileSync('src/components/JournalEditor.tsx', 'utf8');

const targetStr = `
            {/* Subtle Inspiration Sparks */}
            {promptIdeas.length > 0 && (
              <div className="pt-12 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto text-left">
                {promptIdeas.slice(0, 3).map((idea) => (
                  <button
                    key={idea.id}
                    onClick={() => {
                      setInputText(idea.text);
                      textareaRef.current?.focus();
                    }}
                    className="flex flex-col p-6 rounded-2xl bg-neutral-900/30 hover:bg-neutral-800/50 border border-neutral-800 hover:border-neutral-700 text-left transition-all duration-300 group cursor-pointer active:scale-[0.98] backdrop-blur-md"
                  >
                    <div className="flex items-center space-x-2 mb-3">
                      <Sparkles className="w-4 h-4 text-neutral-500 group-hover:text-white transition-colors" />
                      <span className="font-serif text-sm font-medium text-neutral-300 group-hover:text-white transition-colors">
                        {idea.title}
                      </span>
                    </div>
                    <span className="text-neutral-500 group-hover:text-neutral-400 font-sans text-sm leading-relaxed transition-colors">
                      {idea.text}
                    </span>
                  </button>
                ))}
              </div>
            )}
`;

const replacementStr = `
            {/* Subtle Inspiration Sparks */}
            {promptIdeas.length > 0 && (
              <div className="pt-12 flex flex-col items-center gap-4 max-w-2xl mx-auto text-center">
                <span className="text-xs uppercase tracking-widest text-neutral-600 font-semibold mb-2">Or start with</span>
                <div className="flex flex-col gap-3 w-full">
                  {promptIdeas.slice(0, 3).map((idea) => (
                    <button
                      key={idea.id}
                      onClick={() => {
                        setInputText(idea.text);
                        textareaRef.current?.focus();
                      }}
                      className="group flex items-center justify-center space-x-3 text-neutral-500 hover:text-white transition-colors cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5 opacity-50 group-hover:opacity-100 transition-opacity" />
                      <span className="font-sans text-sm leading-relaxed text-center">
                        {idea.text}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
`;

editorCode = editorCode.replace(targetStr, replacementStr);
fs.writeFileSync('src/components/JournalEditor.tsx', editorCode);
