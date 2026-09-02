const fs = require('fs');
let code = fs.readFileSync('src/components/ParticleText.tsx', 'utf8');

code = code.replace(
  'const rgbToCss = (rgb: any) => \\`rgb(\\${rgb.r}, \\${rgb.g}, \\${rgb.b})\\`;',
  'const rgbToCss = (rgb: any) => `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;'
);

code = code.replace(
  /let font = \\`\\\$\{fontWeight\}\\\s\\\$\{resolvedSize\}px\\\s\\\$\{resolvedFamily\}\\`;/g,
  'let font = `${fontWeight} ${resolvedSize}px ${resolvedFamily}`;'
);

// Better to just rewrite the file safely:
