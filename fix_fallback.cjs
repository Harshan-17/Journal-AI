const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const oldLogic = `      const isRecoverable =
        err?.status === 429 ||
        err?.status === 503 ||
        err?.status === 500 ||
        err?.status === 404 ||
        errorMessage.includes('unavailable') ||
        errorMessage.includes('quota') ||
        errorMessage.includes('resource_exhausted') ||
        errorMessage.includes('not found') ||
        errorMessage.includes('overloaded');

      if (!isRecoverable && MODEL_FALLBACK_LADDER.indexOf(model) === MODEL_FALLBACK_LADDER.length - 1) {
        break;
      }`;

const newLogic = `      const isRecoverable =
        err?.status === 429 ||
        err?.status === 503 ||
        err?.status === 500 ||
        err?.status === 404 ||
        errorMessage.includes('unavailable') ||
        errorMessage.includes('quota') ||
        errorMessage.includes('resource_exhausted') ||
        errorMessage.includes('not found') ||
        errorMessage.includes('overloaded') ||
        errorMessage.includes('fetch failed') ||
        errorMessage.includes('high demand') ||
        errorMessage.includes('503');

      if (!isRecoverable) {
        break;
      }`;

if (code.includes('errorMessage.includes(\\\'overloaded\\\');')) {
  code = code.replace(oldLogic, newLogic);
  fs.writeFileSync('server.ts', code);
  console.log('Fixed fallback logic');
} else {
  console.log('Could not find logic to replace');
}
