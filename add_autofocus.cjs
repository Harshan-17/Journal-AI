const fs = require('fs');
let code = fs.readFileSync('src/components/JournalEditor.tsx', 'utf8');

// add useEffect
const newEffect = `
  // Auto-focus the input on mount
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, []);
`;
code = code.replace('  // Fetch prompt ideas for welcome state', newEffect + '\n  // Fetch prompt ideas for welcome state');

// add autoFocus prop
const textareaMatch = '<textarea';
code = code.replace('<textarea', '<textarea\n          autoFocus');

fs.writeFileSync('src/components/JournalEditor.tsx', code);
console.log('patched');
