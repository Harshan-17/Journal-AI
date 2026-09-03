const fs = require('fs');
let code = fs.readFileSync('src/components/LandingPage.tsx', 'utf8');

// Replace Aurora import with AeroShards
code = code.replace(/import Aurora from '\.\/Aurora';/, "import AeroShards from './AeroShards';");

const target = `      {/* ========================================================================= */}
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

const replacement = `      {/* ========================================================================= */}
      {/* 1. FULL-SCREEN INTERACTIVE AEROSHARDS BACKGROUND */}
      {/* ========================================================================= */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none transition-all duration-700 bg-neutral-950">
        <div className="w-full h-full opacity-100 transition-opacity duration-500">
          <AeroShards
            backgroundColor="#120F17"
            shardColor="#896ABD"
            accentColor="#A855F7"
            placement="full"
            flow="stream"
            material="pearl"
            detail="balanced"
            effect="none"
            scale={1}
            spread={1}
            depth={1}
            speed={1}
            spin={1}
            interaction="repel"
            density={1.5}
            shardSize={1.1}
            stretch={1}
            turbulence={1}
            glow={1}
            edgeSoftness={2}
            bloom={0.5}
            grain={0.05}
            chromaticAberration={0.0075}
            transitionDuration={1}
            interactionRadius={1.5}
            interactionStrength={0.5}
            rippleIntensity={1}
            holdToGather={true}
          />
        </div>
        
        {/* Subtle gradient to ensure text remains readable */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-neutral-950/80 pointer-events-none" />
      </div>`;

if (code.includes(target)) {
  code = code.replace(target, replacement);
  fs.writeFileSync('src/components/LandingPage.tsx', code);
  console.log('patched');
} else {
  console.log('could not find target');
}
