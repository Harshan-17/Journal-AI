const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const targetStr = `
              userId: user.uid,
              title: data.title || 'Untitled Reflection',
              mode: data.mode || 'reflect',
`;

const replacement = `
              userId: user.uid,
              title: data.title !== undefined ? data.title : 'Untitled Reflection',
              mode: data.mode || 'reflect',
`;

code = code.replace(targetStr, replacement);
fs.writeFileSync('src/App.tsx', code);
