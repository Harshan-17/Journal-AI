const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const targetStr = `
      setEntries((prev) => prev.map((e) => (e.id === finalEntry.id ? finalEntry : e)));
      // Guaranteed transaction persistence to /users/{userId}/entries/{entryId}
      await persistEntry(finalEntry);
    } catch (err: any) {
`;

const replacement = `
      // Safely apply the generated message and title without overwriting user edits to the title
      let mergedEntry: JournalEntry | null = null;
      setEntries((prev) => prev.map((e) => {
        if (e.id === entryWithUserMsg.id) {
          mergedEntry = {
            ...e,
            title: generatedTitle && needsTitleUpdate && e.title === 'Analyzing topic...' ? generatedTitle : e.title,
            messages: [...e.messages, assistantMessage],
            updatedAt: assistantNow,
          };
          return mergedEntry;
        }
        return e;
      }));

      if (mergedEntry) {
        await persistEntry(mergedEntry);
      }
    } catch (err: any) {
`;

code = code.replace(targetStr, replacement);
fs.writeFileSync('src/App.tsx', code);
