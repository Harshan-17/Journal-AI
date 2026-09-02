const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  'onSelectEntry={(entry) => setSelectedEntryId(entry.id)}',
  'onSelectEntry={(entry) => { setSelectedEntryId(entry.id); setIsSidebarOpen(false); }}'
);
fs.writeFileSync('src/App.tsx', code);
