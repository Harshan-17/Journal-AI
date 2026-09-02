const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const targetStr = `      await persistEntry(newEntry);
    } catch (err) {
      console.error('Failed to create new entry in Firestore:', err);
    }
  };`;

const replaceStr = `      await persistEntry(newEntry);
      
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

    } catch (err) {
      console.error('Failed to create new entry in Firestore:', err);
    }
  };`;

code = code.replace(targetStr, replaceStr);
fs.writeFileSync('src/App.tsx', code);
console.log('patched frontend');
