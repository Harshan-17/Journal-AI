const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const targetStr = `
    // Auto-derive a meaningful title if it's the first message and title is default
    let newTitle = targetEntry.title;
    const isFirstMessage = targetEntry.messages.length === 0 && (targetEntry.title === 'New Reflection' || targetEntry.title === 'Untitled Reflection' || !targetEntry.title);
    if (isFirstMessage) {
      newTitle = 'Analyzing topic...';
    }

    const entryWithUserMsg: JournalEntry = {
      ...targetEntry,
      title: newTitle,
      mode,
      messages: [...targetEntry.messages, userMessage],
      updatedAt: now,
    };

    // Optimistically update and persist user turn immediately
    setEntries((prev) => prev.map((e) => (e.id === entryWithUserMsg.id ? entryWithUserMsg : e)));
    setIsGenerating(true);
    setError(null);

    try {
      await persistEntry(entryWithUserMsg);
    } catch (saveErr) {
      console.warn('Initial turn save notice:', saveErr);
    }

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
`;

const replacement = `
    // Auto-derive a meaningful title if the title is default or cleared
    let newTitle = targetEntry.title;
    const needsTitleUpdate = targetEntry.title === 'New Reflection' || targetEntry.title === 'Untitled Reflection' || !targetEntry.title || targetEntry.title === 'Analyzing topic...';
    if (needsTitleUpdate) {
      newTitle = 'Analyzing topic...';
    }

    const entryWithUserMsg: JournalEntry = {
      ...targetEntry,
      title: newTitle,
      mode,
      messages: [...targetEntry.messages, userMessage],
      updatedAt: now,
    };

    // Optimistically update and persist user turn immediately
    setEntries((prev) => prev.map((e) => (e.id === entryWithUserMsg.id ? entryWithUserMsg : e)));
    setIsGenerating(true);
    setError(null);

    try {
      await persistEntry(entryWithUserMsg);
    } catch (saveErr) {
      console.warn('Initial turn save notice:', saveErr);
    }

    // Start generating title concurrently if it needs an update
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
    }
`;

code = code.replace(targetStr, replacement);
fs.writeFileSync('src/App.tsx', code);
