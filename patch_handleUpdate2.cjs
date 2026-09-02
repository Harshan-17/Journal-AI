const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const targetStr = `
  const handleUpdateEntry = async (updatedFields: Partial<JournalEntry>) => {
    if (!selectedEntryId) return;

    let updatedEntry: JournalEntry | null = null;
    
    setEntries((prev) => prev.map((e) => {
      if (e.id === selectedEntryId) {
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

const replacement = `
  const handleUpdateEntry = async (updatedFields: Partial<JournalEntry>) => {
    let targetId = selectedEntryId;

    if (!targetId) {
      const newEntry = createNewEmptyEntry(user ? user.uid : 'anonymous');
      const updated = { ...newEntry, ...updatedFields, updatedAt: Date.now() };
      setEntries((prev) => [updated, ...prev]);
      setSelectedEntryId(updated.id);
      try {
        await persistEntry(updated);
      } catch (err) {
        console.error('Initial update save failed:', err);
      }
      return;
    }

    let updatedEntry: JournalEntry | null = null;
    
    setEntries((prev) => prev.map((e) => {
      if (e.id === targetId) {
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
