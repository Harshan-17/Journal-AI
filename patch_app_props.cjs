const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const targetStr = `
        <JournalEditor
          entry={activeEntry}
`;
const replacementStr = `
        <JournalEditor
          userName={user?.displayName?.split(' ')[0] || ''}
          entry={activeEntry}
`;
code = code.replace(targetStr, replacementStr);
fs.writeFileSync('src/App.tsx', code);
