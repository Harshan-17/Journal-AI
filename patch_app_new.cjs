const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const targetNew = `
  const handleNewEntry = async () => {
    if (!user) return;
    const newEntry = createNewEmptyEntry(user.uid);

    // Optimistically select and persist
    setEntries((prev) => [newEntry, ...prev]);
    setSelectedEntryId(newEntry.id);

    try {
      await persistEntry(newEntry);
    } catch (err) {
      console.error('New entry save failed:', err);
    }
  };
`;
const replacementNew = `
  const handleNewEntry = async () => {
    if (!user) return;
    setSelectedEntryId(null);
  };
`;
code = code.replace(targetNew, replacementNew);

fs.writeFileSync('src/App.tsx', code);
