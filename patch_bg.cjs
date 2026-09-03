const fs = require('fs');
let code = fs.readFileSync('src/components/LandingPage.tsx', 'utf8');

const target = `      {/* ========================================================================= */}
      {/* 1. FULL-SCREEN INTERACTIVE AURORA BACKGROUND */}
      {/* ========================================================================= */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none transition-all duration-700 bg-neutral-950">
        <div className="w-full h-full opacity-100 transition-opacity duration-500 mix-blend-screen">
          <Aurora
            colorStops={["#10B981", "#B497CF", "#4b32ae"]}
            blend={0.49}
            amplitude={1.0}
            speed={0.9}
          />
        </div>
        
        {/* Dynamic dark glass gradient vignette layer to guarantee pristine WCAG AA contrast while letting Aurora shine through */}
        <div className="absolute inset-0 bg-gradient-to-b from-neutral-950/60 via-transparent to-neutral-950/90 pointer-events-none" />
        <div className="absolute inset-0 bg-radial-[circle_at_center,transparent_0%,rgba(12,10,9,0.85)_100%] pointer-events-none" />

        {/* Ambient atmospheric color bloom */}
        <div
          className="absolute -top-32 -right-32 w-[45vw] h-[45vw] max-w-[550px] max-h-[550px] rounded-full blur-[130px] opacity-20 pointer-events-none animate-pulse"
          style={{
            background: \`radial-gradient(circle, \${themeConfig.ambientColors[0]} 0%, \${themeConfig.ambientColors[1]} 50%, transparent 80%)\`,
            animationDuration: '10s',
          }}
        />
        <div
          className="absolute -bottom-32 -left-32 w-[50vw] h-[50vw] max-w-[600px] max-h-[600px] rounded-full blur-[140px] opacity-15 pointer-events-none"
          style={{
            background: \`radial-gradient(circle, \${themeConfig.ambientColors[2]} 0%, transparent 75%)\`,
          }}
        />
      </div>`;

const replacement = `      {/* ========================================================================= */}
      {/* 1. FULL-SCREEN INTERACTIVE AURORA BACKGROUND */}
      {/* ========================================================================= */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none transition-all duration-700 bg-neutral-950">
        <div className="w-full h-full opacity-100 transition-opacity duration-500">
          <Aurora
            colorStops={["#10B981", "#B497CF", "#4b32ae"]}
            blend={0.49}
            amplitude={1.0}
            speed={0.9}
          />
        </div>
        
        {/* Subtle gradient to ensure text remains readable without mudding the aurora */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-neutral-950/80 pointer-events-none" />
      </div>`;

if (code.includes(target)) {
  code = code.replace(target, replacement);
  fs.writeFileSync('src/components/LandingPage.tsx', code);
  console.log('patched');
} else {
  console.log('could not find target');
}
