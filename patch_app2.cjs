const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const targetStr = `
    // Auto-derive a meaningful title if it's the first message and title is default
    let newTitle = targetEntry.title;
    const isFirstMessage = targetEntry.messages.length === 0 && (targetEntry.title === 'New Reflection' || !targetEntry.title);
    if (isFirstMessage) {
      newTitle = userText.slice(0, 42).trim() + (userText.length > 42 ? '...' : '');
    }
`;

const replacement = `
    // Auto-derive a meaningful title if it's the first message and title is default
    let newTitle = targetEntry.title;
    const isFirstMessage = targetEntry.messages.length === 0 && (targetEntry.title === 'New Reflection' || targetEntry.title === 'Untitled Reflection' || !targetEntry.title);
    if (isFirstMessage) {
      newTitle = 'Analyzing topic...';
    }
`;

code = code.replace(targetStr, replacement);
fs.writeFileSync('src/App.tsx', code);
