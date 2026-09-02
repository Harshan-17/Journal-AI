const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const oldLogic = `    // Start generating title concurrently if it needs an update
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
    }`;

const newLogic = `    // Generate a simple random title instead of using AI
    let titlePromise: Promise<string | null> = Promise.resolve(null);

    if (needsTitleUpdate) {
      const SIMPLE_TITLES = [
        "Quick Thoughts",
        "Daily Reflection",
        "Morning Note",
        "Evening Check-in",
        "Mindful Moment",
        "Just Thinking",
        "Brain Dump",
        "Processing",
        "Finding Clarity",
        "Inner Monologue"
      ];
      const randomTitle = SIMPLE_TITLES[Math.floor(Math.random() * SIMPLE_TITLES.length)];
      titlePromise = Promise.resolve(randomTitle);
    }`;

code = code.replace(oldLogic, newLogic);
fs.writeFileSync('src/App.tsx', code);
console.log('Title logic replaced');
