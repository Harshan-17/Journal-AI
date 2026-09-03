const fs = require('fs');
let code = fs.readFileSync('src/components/LocationPickerModal.tsx', 'utf8');

code = code.replace(/google\.maps\.places\.PlacesServiceStatus\.OK/g, "'OK'");

fs.writeFileSync('src/components/LocationPickerModal.tsx', code);
console.log('patched map search');
