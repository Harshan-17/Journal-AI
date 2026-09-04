import fs from 'fs';

let appTsx = fs.readFileSync('src/App.tsx', 'utf8');

// Replace final state update to use the latest entry from previous state
appTsx = appTsx.replace(
`      const finalEntry: JournalEntry = {
        ...entryWithUserMsg,
        messages: [...entryWithUserMsg.messages, assistantMessage],
        updatedAt: assistantNow,
      };

      setEntries((prev) => prev.map((e) => (e.id === finalEntry.id ? finalEntry : e)));

      // Guaranteed transaction persistence to /users/{userId}/entries/{entryId}
      await persistEntry(finalEntry);`,
`      let finalEntryToPersist: JournalEntry | null = null;
      setEntries((prev) => prev.map((e) => {
        if (e.id === entryWithUserMsg.id) {
          const finalE = {
            ...e,
            messages: e.messages.map(m => m.id === assistantMessage.id ? assistantMessage : m),
            updatedAt: assistantNow,
          };
          finalEntryToPersist = finalE;
          return finalE;
        }
        return e;
      }));

      // Guaranteed transaction persistence to /users/{userId}/entries/{entryId}
      if (finalEntryToPersist) {
        await persistEntry(finalEntryToPersist);
      } else {
        const finalEntry: JournalEntry = {
          ...entryWithUserMsg,
          messages: [...entryWithUserMsg.messages, assistantMessage],
          updatedAt: assistantNow,
        };
        await persistEntry(finalEntry);
      }`
);

// We should also replace the optimistic update logic inside the streaming loop
// It's currently:
/*
                setEntries((prev) => prev.map((e) => {
                  if (e.id === entryWithUserMsg.id) {
                    const msgs = [...e.messages];
                    msgs[msgs.length - 1] = { ...assistantMessage };
                    return { ...e, messages: msgs };
                  }
                  return e;
                }));
*/
// This is already safe because it spreads `...e`, which is the latest entry state!

fs.writeFileSync('src/App.tsx', appTsx);
console.log("Patched App.tsx stale closure");
