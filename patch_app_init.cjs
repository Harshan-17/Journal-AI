const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const targetUseEffect = `
          // Select first entry if current selection is invalid or null
          setSelectedEntryId((prevId) => {
            if (prevId && loadedEntries.some((e) => e.id === prevId)) {
              return prevId;
            }
            if (loadedEntries.length > 0) {
              return loadedEntries[0].id;
            }
            return null;
          });
`;
const replacementUseEffect = `
          // Preserve current selection if valid, otherwise leave it as null (new entry)
          setSelectedEntryId((prevId) => {
            if (prevId && loadedEntries.some((e) => e.id === prevId)) {
              return prevId;
            }
            return null;
          });
`;
code = code.replace(targetUseEffect, replacementUseEffect);

const targetActiveEntry = `
  const activeEntry: JournalEntry =
    currentEntry ||
    (entries.length > 0
      ? entries[0]
      : createNewEmptyEntry(user.uid));
`;
const replacementActiveEntry = `
  const activeEntry: JournalEntry = currentEntry || createNewEmptyEntry(user.uid);
`;
code = code.replace(targetActiveEntry, replacementActiveEntry);

fs.writeFileSync('src/App.tsx', code);
