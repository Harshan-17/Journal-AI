const fs = require('fs');
let code = fs.readFileSync('src/components/EntriesMapViewModal.tsx', 'utf8');

const targetStr = `                <p className="text-xs text-neutral-500">
                  Set this key in your AI Studio Secrets as <code className="text-emerald-400 font-mono">VITE_GOOGLE_MAPS_API_KEY</code>.
                </p>
              </div>
            </div>`;

const replaceStr = `                <p className="text-xs text-neutral-500">
                  Set this key in your AI Studio Secrets as <code className="text-emerald-400 font-mono">VITE_GOOGLE_MAPS_API_KEY</code> or update it below.
                </p>
                <div className="w-full max-w-sm space-y-2 mt-4 mx-auto">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Paste Google Maps Demo Key"
                      value={customKey}
                      onChange={(e) => setCustomKey(e.target.value)}
                      className="flex-1 px-3 py-2 bg-black border border-neutral-700 rounded-xl text-xs text-neutral-200 placeholder-neutral-400 focus:outline-none focus:border-cyan-500"
                    />
                    <button
                      onClick={() => {
                        localStorage.setItem('user_google_maps_api_key', customKey.trim());
                        window.location.reload();
                      }}
                      disabled={!customKey.trim()}
                      className={\`px-4 py-2 \${themeConfig.accentBg} \${themeConfig.accentText} font-semibold rounded-xl text-xs\`}
                    >
                      Reload
                    </button>
                  </div>
                </div>
              </div>
            </div>`;

code = code.replace(targetStr, replaceStr);
fs.writeFileSync('src/components/EntriesMapViewModal.tsx', code);
console.log('patched EntriesMapView');
