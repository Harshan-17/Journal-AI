const fs = require('fs');
let code = fs.readFileSync('src/components/JournalEditor.tsx', 'utf8');

const targetStr = `
            {/* Subtle Inspiration Sparks */}
            {promptIdeas.length > 0 && (
              <div className="pt-8 grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl mx-auto text-left">
                {promptIdeas.slice(0, 4).map((idea) => (
                  <button
                    key={idea.id}
                    onClick={() => {
                      setInputText(idea.text);
                      textareaRef.current?.focus();
                    }}
                    className="p-4 rounded-none bg-transparent hover:bg-white/5 border border-white/10 hover:border-white/30 text-left transition-all group cursor-pointer active:scale-[0.99] backdrop-blur-sm"
                  >
                    <span className="font-serif text-sm text-neutral-300 group-hover:text-white transition-colors block mb-2">
                      {idea.title}
                    </span>
                    <span className="text-neutral-500 font-light text-xs line-clamp-2 leading-relaxed">
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

code = code.replace(targetStr, replacementStr);
fs.writeFileSync('src/components/JournalEditor.tsx', code);
