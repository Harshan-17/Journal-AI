const fs = require('fs');
let code = fs.readFileSync('src/components/JournalEditor.tsx', 'utf8');

const targetStr = `
  // Clean up speech synthesis on unmount
  useEffect(() => {
    
  const renderComposer = () => (
`;
const replacementStr = `
  // Clean up speech synthesis on unmount
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const renderComposer = () => (
`;
code = code.replace(targetStr, replacementStr);
fs.writeFileSync('src/components/JournalEditor.tsx', code);
