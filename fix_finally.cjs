const fs = require('fs');
let code = fs.readFileSync('src/components/JournalEditor.tsx', 'utf8');

const replacementStr = `  // Clean up speech synthesis on unmount
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const renderComposer`;

code = code.replace(/  \/\/ Clean up speech synthesis on unmount[\s\S]*?const renderComposer/, replacementStr);
fs.writeFileSync('src/components/JournalEditor.tsx', code);
