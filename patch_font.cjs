const fs = require('fs');
let code = fs.readFileSync('src/components/JournalEditor.tsx', 'utf8');

code = code.replace('fontFamily="Playfair Display, serif"', 'fontFamily="Inter, sans-serif"');

fs.writeFileSync('src/components/JournalEditor.tsx', code);
console.log('patched');
