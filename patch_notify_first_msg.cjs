const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const targetStr = `      ).catch((logErr) => console.warn('Interaction logging notice:', logErr));

    } catch (geminiErr: any) {`;

const replaceStr = `      ).catch((logErr) => console.warn('Interaction logging notice:', logErr));

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

code = code.replace(targetStr, replaceStr);
fs.writeFileSync('src/App.tsx', code);
console.log('patched frontend first msg');
