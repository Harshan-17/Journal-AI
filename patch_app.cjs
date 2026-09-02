const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const targetStr = `
    // Auto-derive a meaningful title if it's the first message and title is default
    let newTitle = targetEntry.title;
    if (targetEntry.messages.length === 0 && (targetEntry.title === 'New Reflection' || !targetEntry.title)) {
      newTitle = userText.slice(0, 42).trim() + (userText.length > 42 ? '...' : '');
    }
`;

const replacement = `
    // Auto-derive a meaningful title if it's the first message and title is default
    let newTitle = targetEntry.title;
    const isFirstMessage = targetEntry.messages.length === 0 && (targetEntry.title === 'New Reflection' || !targetEntry.title);
    if (isFirstMessage) {
      newTitle = userText.slice(0, 42).trim() + (userText.length > 42 ? '...' : '');
    }
`;

code = code.replace(targetStr, replacement);

const targetStr2 = `
    // Call Backend Gemini Server Proxy (/api/gemini/chat)
    try {
      const response = await fetch('/api/gemini/chat', {`;

const replacement2 = `
    // Start generating title concurrently if it's the first message
    let titlePromise: Promise<string | null> = Promise.resolve(null);
    if (isFirstMessage) {
      titlePromise = fetch('/api/gemini/title', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: userText }),
      })
        .then((r) => r.json())
        .then((d) => d.title || null)
        .catch(() => null);
    }

    // Call Backend Gemini Server Proxy (/api/gemini/chat)
    try {
      const response = await fetch('/api/gemini/chat', {`;

code = code.replace(targetStr2, replacement2);

const targetStr3 = `
      const finalEntry: JournalEntry = {
        ...entryWithUserMsg,
        messages: [...entryWithUserMsg.messages, assistantMessage],
        updatedAt: assistantNow,
      };
`;

const replacement3 = `
      const generatedTitle = await titlePromise;
      const finalEntry: JournalEntry = {
        ...entryWithUserMsg,
        title: generatedTitle || entryWithUserMsg.title,
        messages: [...entryWithUserMsg.messages, assistantMessage],
        updatedAt: assistantNow,
      };
`;

code = code.replace(targetStr3, replacement3);

fs.writeFileSync('src/App.tsx', code);
