const fs = require('fs');
let code = fs.readFileSync('src/components/JournalEditor.tsx', 'utf8');

const regex = /  return \(\) => \{\n      if \(typeof window !== 'undefined' && window\.speechSynthesis\) \{\n        window\.speechSynthesis\.cancel\(\);\n      \}\n    \};\n  \}, \[\]\);\n/g;

code = code.replace(regex, '');
fs.writeFileSync('src/components/JournalEditor.tsx', code);
