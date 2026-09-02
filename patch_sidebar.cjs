const fs = require('fs');
let code = fs.readFileSync('src/components/HistorySidebar.tsx', 'utf8');

const target = `            <div className="flex items-center space-x-1.5">
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-neutral-900 border border-neutral-800 text-neutral-300">
                {entries.length} {entries.length === 1 ? 'log' : 'logs'}
              </span>
              <button`;

const replacement = `            <div className="flex items-center space-x-1.5">
              <button`;

code = code.replace(target, replacement);

fs.writeFileSync('src/components/HistorySidebar.tsx', code);
console.log('patched sidebar');
