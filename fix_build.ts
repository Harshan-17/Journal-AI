import fs from 'fs';

let appTsx = fs.readFileSync('src/App.tsx', 'utf8');

appTsx = appTsx.replace(
`      // Guaranteed transaction persistence to /users/{userId}/entries/{entryId}
      if (finalEntryToPersist) {
        await persistEntry(finalEntryToPersist);
      } else {
        const finalEntry: JournalEntry = {
          ...entryWithUserMsg,
          messages: [...entryWithUserMsg.messages, assistantMessage],
          updatedAt: assistantNow,
        };
        await persistEntry(finalEntry);
      }

      // Log interaction record to /users/{userId}/interactions/{interactionId}
      const interactionDocRef = doc(db, 'users', user.uid, 'interactions', \`interaction_\${assistantNow}\`);
      await setDoc(
        interactionDocRef,
        sanitizePayload({
          id: \`interaction_\${assistantNow}\`,
          entryId: finalEntry.id,
          prompt: userText,
          response: assistantText,
          mode,
          modelUsed: currentModelUsed,
          timestamp: assistantNow,
        }),
        { merge: true }
      ).catch((logErr) => console.warn('Interaction logging notice:', logErr));`,
`      // Guaranteed transaction persistence to /users/{userId}/entries/{entryId}
      let loggedEntryId = entryWithUserMsg.id;
      if (finalEntryToPersist) {
        await persistEntry(finalEntryToPersist);
      } else {
        const finalEntry: JournalEntry = {
          ...entryWithUserMsg,
          messages: [...entryWithUserMsg.messages, assistantMessage],
          updatedAt: assistantNow,
        };
        await persistEntry(finalEntry);
      }

      // Log interaction record to /users/{userId}/interactions/{interactionId}
      const interactionDocRef = doc(db, 'users', user.uid, 'interactions', \`interaction_\${assistantNow}\`);
      await setDoc(
        interactionDocRef,
        sanitizePayload({
          id: \`interaction_\${assistantNow}\`,
          entryId: loggedEntryId,
          prompt: userText,
          response: assistantText,
          mode,
          modelUsed: currentModelUsed,
          timestamp: assistantNow,
        }),
        { merge: true }
      ).catch((logErr) => console.warn('Interaction logging notice:', logErr));`
);

fs.writeFileSync('src/App.tsx', appTsx);
console.log("Fixed reference error");
