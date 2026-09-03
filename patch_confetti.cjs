const fs = require('fs');
let code = fs.readFileSync('src/utils/theme.ts', 'utf8');

code = code.replace(/import confetti from 'canvas-confetti';/g, '');

code = code.replace(
  /export function triggerThemeConfetti.*\{[\s\S]*?\}\n\}/,
  'export function triggerThemeConfetti(themeId: AppTheme = "aurora", customCount = 50) { }'
);

code = code.replace(
  /export function triggerBurstConfetti.*\{[\s\S]*?\}\n\}/,
  'export function triggerBurstConfetti(themeId: AppTheme = "aurora") { }'
);

fs.writeFileSync('src/utils/theme.ts', code);
console.log('patched confetti out');
