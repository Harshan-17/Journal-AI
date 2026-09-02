const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const targetStr = `
  const handleUpdateEntry = async (updatedFields: Partial<JournalEntry>) => {
    if (!currentEntry) return;
    const updated = {
      ...currentEntry,
      ...updatedFields,
      updatedAt: Date.now(),
    };

    setEntries((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
    try {
      await persistEntry(updated);
    } catch (err) {
      console.error('Update save failed:', err);
    }
  };
`;

const replacement = `
  const handleUpdateEntry = async (updatedFields: Partial<JournalEntry>) => {
    if (!activeEntryId) return;

    let updatedEntry: JournalEntry | null = null;
    
    setEntries((prev) => prev.map((e) => {
      if (e.id === activeEntryId) {
        updatedEntry = {
          ...e,
          ...updatedFields,
          updatedAt: Date.now(),
        };
        return updatedEntry;
      }
      return e;
    }));

    if (updatedEntry) {
      try {
        await persistEntry(updatedEntry);
      } catch (err) {
        console.error('Update save failed:', err);
      }
    }
  };
`;

code = code.replace(targetStr, replacement);
fs.writeFileSync('src/App.tsx', code);
