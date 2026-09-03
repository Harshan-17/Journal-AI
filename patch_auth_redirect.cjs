const fs = require('fs');
let code = fs.readFileSync('src/firebase.ts', 'utf8');

code = code.replace(/signInWithPopup/g, 'signInWithRedirect');
code = code.replace(
  /const result = await signInWithRedirect\(auth, provider\);\n    return result\.user;/g,
  'await signInWithRedirect(auth, provider);\n    // Result will be handled by auth state listener on reload\n    return null as any;'
);

fs.writeFileSync('src/firebase.ts', code);
console.log('patched auth to use redirect');
