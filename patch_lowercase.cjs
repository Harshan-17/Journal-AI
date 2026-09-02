const fs = require('fs');
let code = fs.readFileSync('src/components/JournalEditor.tsx', 'utf8');

const target = 'text={`Hello${userName ? `, ${userName}` : \'.\'}`}';
const replacement = 'text={`hello${userName ? `, ${userName}` : \'.\'}`.toLowerCase()}';

code = code.replace(target, replacement);

fs.writeFileSync('src/components/JournalEditor.tsx', code);
console.log('patched');
