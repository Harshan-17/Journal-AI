const fs = require('fs');
const code = fs.readFileSync('src/components/ParticleText.tsx', 'utf8');

const oldLogicRegex = /const content = String\(text \|\| ' '\);[\s\S]*?alpha: alpha \/ 255\s*\}\);\s*\}\s*\}\s*\}/;

const newLogic = `const content = String(text || ' ');
      const maxTextWidth = width * 0.92;
      offCtx.font = font;
      let metrics = offCtx.measureText(content);
      const measuredWidth = Math.max(1, metrics.width);
      if (measuredWidth > maxTextWidth) {
        resolvedSize = Math.max(18, resolvedSize * (maxTextWidth / measuredWidth));
        font = \`\${fontWeight} \${resolvedSize}px \${resolvedFamily}\`;
        await waitForFonts(font);
        if (currentBuild !== buildId) return;
        offCtx.font = font;
      }

      offscreen.width = width;
      offscreen.height = height;
      offCtx.clearRect(0, 0, width, height);
      offCtx.font = font;
      offCtx.textAlign = 'center';
      offCtx.textBaseline = 'middle';
      offCtx.fillStyle = '#ffffff';
      offCtx.fillText(content, width / 2, height / 2);

      const imageData = offCtx.getImageData(0, 0, width, height);
      const targets = [];
      const step = Math.max(2, Math.floor(density));

      for (let y = 0; y < height; y += step) {
        for (let x = 0; x < width; x += step) {
          const alpha = imageData.data[(y * width + x) * 4 + 3];
          if (alpha > 40) {
            targets.push({
              x,
              y,
              alpha: alpha / 255
            });
          }
        }
      }`;

const newCode = code.replace(oldLogicRegex, newLogic);
fs.writeFileSync('src/components/ParticleText.tsx', newCode);
console.log("Done");
