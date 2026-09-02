const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const targetStr = `
  const handleNewEntry = async () => {
    if (!user) return;
    const newEntry = createNewEmptyEntry(user.uid);

    // Optimistically select and persist
    setEntries((prev) => [newEntry, ...prev]);
    setSelectedEntryId(newEntry.id);

    try {
      await persistEntry(newEntry);
    } catch (err) {
      console.error('Failed to create new entry in Firestore:', err);
    }
  };
`;

const replacementStr = `
  const handleNewEntry = async () => {
    if (!user) return;
    const newEntry = createNewEmptyEntry(user.uid);

    // Optimistically select and persist
    setEntries((prev) => [newEntry, ...prev]);
    setSelectedEntryId(newEntry.id);
    setIsSidebarOpen(false); // Collapse the sidebar on new reflection

    try {
      await persistEntry(newEntry);
    } catch (err) {
      console.error('Failed to create new entry in Firestore:', err);
    }
  };
`;

code = code.replace(targetStr, replacementStr);
fs.writeFileSync('src/App.tsx', code);
