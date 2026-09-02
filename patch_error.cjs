const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const target = `    } catch (geminiErr: any) {
      console.error('Gemini interaction error:', geminiErr);
      setError(geminiErr.message || 'Gemini was unable to respond. Please retry.');
    }`;

const replacement = `    } catch (geminiErr: any) {
      console.error('Gemini interaction error:', geminiErr);
      if (geminiErr.message === 'Failed to fetch') {
        setError('The connection to the AI server was lost (the server was updating). Please retry your message.');
      } else {
        setError(geminiErr.message || 'Gemini was unable to respond. Please retry.');
      }
    }`;

code = code.replace(target, replacement);
fs.writeFileSync('src/App.tsx', code);
console.log('patched');
