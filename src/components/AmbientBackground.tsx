import React, { useEffect, useState } from 'react';
import { useAppTheme } from '../context/ThemeContext';
import HalftoneReveal from './HalftoneReveal';

export const AmbientBackground: React.FC = () => {
  const {
    themeConfig,
    ambientGlow,
    bgStyle,
    halftoneBgMode,
    halftoneBgDensity,
    halftoneBgRadius,
  } = useAppTheme();
  const [mousePos, setMousePos] = useState({ x: 50, y: 50 });

  useEffect(() => {
    if (!ambientGlow && bgStyle === 'minimal') return;

    const handleMouseMove = (e: MouseEvent) => {
      const x = Math.round((e.clientX / window.innerWidth) * 100);
      const y = Math.round((e.clientY / window.innerHeight) * 100);
      setMousePos({ x, y });
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [ambientGlow, bgStyle]);

  if (bgStyle === 'minimal' && !ambientGlow) return null;

  const [color1, color2, color3] = themeConfig.ambientColors;
  const showHalftone = bgStyle === 'halftone' || bgStyle === 'hybrid';
  const showAurora = ambientGlow && (bgStyle === 'aurora' || bgStyle === 'hybrid');

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none transition-all duration-700">
      {/* 1. Interactive Halftone Reveal Background Layer */}
      {showHalftone && (
        <div className="absolute inset-0 transition-opacity duration-700 opacity-45">
          <HalftoneReveal
            key={`bg-halftone-${themeConfig.id}-${halftoneBgMode}`}
            src={themeConfig.halftoneImage}
            inkColor={themeConfig.halftoneInk}
            paperColor={themeConfig.halftonePaper}
            mode={halftoneBgMode}
            dotDensity={halftoneBgDensity}
            revealRadius={halftoneBgRadius}
            dotSize={0.95}
            edge={0.75}
            follow={0.3}
            idleReveal={0.06}
            trigger="hover"
            globalMouse={true}
            borderRadius="0px"
            className="w-full h-full"
          />
          {/* Subtle dark glass vignette layer to keep typography and controls pristine */}
          <div className="absolute inset-0 bg-gradient-to-b from-neutral-950/75 via-neutral-950/60 to-neutral-950/80 pointer-events-none" />
          <div className="absolute inset-0 bg-radial-[circle_at_center,transparent_30%,rgba(12,10,9,0.7)_100%] pointer-events-none" />
        </div>
      )}

      {/* 2. Dynamic Cursor-Following Interactive Glow Orb */}
      {showAurora && (
        <>
          <div
            className="absolute rounded-full blur-3xl opacity-20 transition-all duration-300 ease-out"
            style={{
              left: `${mousePos.x}%`,
              top: `${mousePos.y}%`,
              width: '45vw',
              height: '45vw',
              transform: 'translate(-50%, -50%)',
              background: `radial-gradient(circle, ${color1} 0%, transparent 70%)`,
            }}
          />

          {/* Floating Animated Ambient Aurora Orbs */}
          <div
            className="absolute -top-32 -left-32 w-[55vw] h-[55vw] max-w-[650px] max-h-[650px] rounded-full blur-[110px] opacity-25 animate-pulse"
            style={{
              background: `radial-gradient(circle, ${color1} 0%, ${color2} 50%, transparent 80%)`,
              animationDuration: '9s',
            }}
          />

          <div
            className="absolute top-1/3 -right-32 w-[50vw] h-[50vw] max-w-[600px] max-h-[600px] rounded-full blur-[120px] opacity-20"
            style={{
              background: `radial-gradient(circle, ${color2} 0%, ${color3} 60%, transparent 85%)`,
            }}
          />

          <div
            className="absolute -bottom-32 left-1/4 w-[60vw] h-[60vw] max-w-[700px] max-h-[700px] rounded-full blur-[130px] opacity-20 animate-pulse"
            style={{
              background: `radial-gradient(circle, ${color3} 0%, ${color1} 50%, transparent 80%)`,
              animationDuration: '12s',
            }}
          />
        </>
      )}

      {/* 3. Subtle iridescent grid overlay for cyber/retro depth */}
      <div
        className="absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage: `linear-gradient(${color1} 1px, transparent 1px), linear-gradient(90deg, ${color1} 1px, transparent 1px)`,
          backgroundSize: '48px 48px',
        }}
      />
    </div>
  );
};
