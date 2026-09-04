import fs from 'fs';

let appTsx = fs.readFileSync('src/App.tsx', 'utf8');

// 1. Unblock persistEntry
appTsx = appTsx.replace(
`    try {
      await persistEntry(entryWithUserMsg);
    } catch (saveErr) {
      console.warn('Initial turn save notice:', saveErr);
    }`,
`    persistEntry(entryWithUserMsg).catch((saveErr) => {
      console.warn('Initial turn save notice:', saveErr);
    });`
);

// 2. Unblock title generation
appTsx = appTsx.replace(
`    // Start generating title concurrently if it needs an update
    let titlePromise: Promise<string | null> = Promise.resolve(null);
    if (needsTitleUpdate) {
      // Send the entire conversation history to get a better topic
      const conversationContext = entryWithUserMsg.messages.map(m => m.role + ': ' + m.content).join('\\n');
      titlePromise = fetch('/api/gemini/title', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: conversationContext }),
      })
        .then((r) => r.json())
        .then((d) => d.title || null)
        .catch(() => null);
    }`,
`    // Start generating title concurrently if it needs an update
    if (needsTitleUpdate) {
      // Send the entire conversation history to get a better topic
      const conversationContext = entryWithUserMsg.messages.map(m => m.role + ': ' + m.content).join('\\n');
      fetch('/api/gemini/title', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: conversationContext }),
      })
        .then((r) => r.json())
        .then((d) => {
          if (d.title) {
            handleUpdateEntry({ title: d.title });
          }
        })
        .catch(() => null);
    }`
);

// 3. Remove await titlePromise
appTsx = appTsx.replace(
`      const generatedTitle = await titlePromise;
      const finalEntry: JournalEntry = {
        ...entryWithUserMsg,
        title: generatedTitle || entryWithUserMsg.title,
        messages: [...entryWithUserMsg.messages, assistantMessage],
        updatedAt: assistantNow,
      };`,
`      const finalEntry: JournalEntry = {
        ...entryWithUserMsg,
        messages: [...entryWithUserMsg.messages, assistantMessage],
        updatedAt: assistantNow,
      };`
);

fs.writeFileSync('src/App.tsx', appTsx);
console.log("Patched App.tsx for latency");

let serverTs = fs.readFileSync('server.ts', 'utf8');
serverTs = serverTs.replace(
`const MODEL_FALLBACK_LADDER = [
  'gemini-3.6-flash',
  'gemini-3.1-flash-lite',
  'gemini-flash-latest',
  'gemini-3.7-flash',
];`,
`const MODEL_FALLBACK_LADDER = [
  'gemini-3.1-flash-lite',
  'gemini-3.6-flash',
  'gemini-flash-latest',
  'gemini-3.7-flash',
];`
);
fs.writeFileSync('server.ts', serverTs);
console.log("Patched server.ts for model selection");

