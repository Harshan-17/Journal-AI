const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// Target 1: handleNewEntry
const target1 = `      await persistEntry(newEntry);
      
      // Trigger background notification
      fetch('/api/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entryId: newEntry.id,
          title: newEntry.title,
          mode: newEntry.mode,
        })
      }).catch(err => console.warn('Notification trigger failed:', err));

    } catch (err) {`;

const replace1 = `      await persistEntry(newEntry);
    } catch (err) {`;
code = code.replace(target1, replace1);

// Target 2: first message title generation
const target2 = `      ).catch((logErr) => console.warn('Interaction logging notice:', logErr));

      // Trigger notification if it's the first message and we generated a title
      if (needsTitleUpdate) {
        fetch('/api/notify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            entryId: finalEntry.id,
            title: finalEntry.title,
            mode: finalEntry.mode,
          })
        }).catch(err => console.warn('Notification trigger failed:', err));
      }

    } catch (geminiErr: any) {`;

const replace2 = `      ).catch((logErr) => console.warn('Interaction logging notice:', logErr));

    } catch (geminiErr: any) {`;
code = code.replace(target2, replace2);

fs.writeFileSync('src/App.tsx', code);
console.log('patched app to remove manual triggers');
