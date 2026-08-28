import React, { useState } from 'react';
import {
  X,
  Eye,
  Sliders,
  Sparkles,
  RotateCw,
  Layers,
  Circle,
  Square,
  Compass,
  Palette,
  Maximize2,
} from 'lucide-react';
import HalftoneReveal from './HalftoneReveal';
import { useAppTheme } from '../context/ThemeContext';

interface HalftoneRevealModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface PresetImage {
  id: string;
  name: string;
  category: string;
  src: string;
  inkColor: string;
  paperColor: string;
  defaultMode: 'mono' | 'duotone' | 'color';
}

const PRESET_ARTWORKS: PresetImage[] = [
  {
    id: 'serene-nature',
    name: 'Misty Alpine Ridge',
    category: 'Perspective',
    src: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1400&q=80',
    inkColor: '#0c1b24',
    paperColor: '#f3f4f6',
    defaultMode: 'duotone',
  },
  {
    id: 'zen-forest',
    name: 'Bamboo Canopy',
    category: 'Calm',
    src: 'https://images.unsplash.com/photo-1511497584788-87676104235f?auto=format&fit=crop&w=1400&q=80',
    inkColor: '#062016',
    paperColor: '#ecfdf5',
    defaultMode: 'color',
  },
  {
    id: 'ocean-drift',
    name: 'Pacific Tide',
    category: 'Flow',
    src: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1400&q=80',
    inkColor: '#082f49',
    paperColor: '#f0f9ff',
    defaultMode: 'duotone',
  },
  {
    id: 'cosmic-architecture',
    name: 'Minimalist Monolith',
    category: 'Clarity',
    src: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1400&q=80',
    inkColor: '#18181b',
    paperColor: '#fafaf9',
    defaultMode: 'mono',
  },
];

export const HalftoneRevealModal: React.FC<HalftoneRevealModalProps> = ({ isOpen, onClose }) => {
  const { themeConfig, celebrate } = useAppTheme();

  const [selectedArtwork, setSelectedArtwork] = useState<PresetImage>(PRESET_ARTWORKS[0]);
  const [mode, setMode] = useState<'mono' | 'duotone' | 'color'>('duotone');
  const [shape, setShape] = useState<'circle' | 'square' | 'diamond' | 'line'>('circle');
  const [dotDensity, setDotDensity] = useState<number>(75);
  const [revealRadius, setRevealRadius] = useState<number>(0.38);
  const [trigger, setTrigger] = useState<'hover' | 'always' | 'off'>('hover');
  const [invert, setInvert] = useState<boolean>(false);
  const [showControls, setShowControls] = useState<boolean>(true);

  if (!isOpen) return null;

  const handleSelectArtwork = (art: PresetImage) => {
    setSelectedArtwork(art);
    setMode(art.defaultMode);
    celebrate(20);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-stone-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-stone-900/95 border border-stone-800 rounded-3xl w-full max-w-5xl h-[90vh] flex flex-col shadow-2xl overflow-hidden backdrop-blur-xl">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-800/80 bg-stone-950/80 shrink-0">
          <div className="flex items-center space-x-3">
            <div
              className={`w-9 h-9 rounded-xl bg-gradient-to-tr ${themeConfig.primaryGradient} flex items-center justify-center text-stone-950 font-bold shadow-md`}
            >
              <Eye className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-serif font-semibold text-stone-100">
                  Mindful Clarity Loupe
                </h2>
                <span
                  className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${themeConfig.badgeBg} border`}
                >
                  Halftone Reveal
                </span>
              </div>
              <p className="text-xs text-stone-400">
                Move your cursor over the halftone screen to reveal crystal clarity beneath
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowControls(!showControls)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all flex items-center space-x-1.5 cursor-pointer ${
                showControls
                  ? `${themeConfig.accentBorder} ${themeConfig.accentText} bg-stone-800/90`
                  : 'border-stone-800 text-stone-400 hover:text-stone-200 hover:bg-stone-800/50'
              }`}
              title="Toggle Controls Panel"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Settings</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-stone-400 hover:text-stone-100 hover:bg-stone-800 rounded-xl transition-colors cursor-pointer"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Main Area */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
          {/* Main Visual Canvas Frame */}
          <div className="flex-1 relative bg-stone-950 flex items-center justify-center p-3 sm:p-5 overflow-hidden">
            <div className="w-full h-full relative rounded-2xl overflow-hidden border border-stone-800 shadow-2xl bg-stone-900">
              <HalftoneReveal
                src={selectedArtwork.src}
                inkColor={selectedArtwork.inkColor}
                paperColor={selectedArtwork.paperColor}
                mode={mode}
                shape={shape}
                dotDensity={dotDensity}
                revealRadius={revealRadius}
                trigger={trigger}
                invert={invert}
                borderRadius="1rem"
                className="w-full h-full"
              />

              {/* Overlay Hint on canvas */}
              <div className="absolute top-4 left-4 pointer-events-none z-10 bg-stone-950/70 border border-stone-800/80 backdrop-blur-md px-3 py-1.5 rounded-xl text-[11px] text-stone-300 flex items-center space-x-2">
                <Sparkles className={`w-3.5 h-3.5 ${themeConfig.accentText}`} />
                <span className="font-medium">{selectedArtwork.name}</span>
                <span className="text-stone-400">•</span>
                <span className="text-stone-400 capitalize">{mode} mode</span>
              </div>
            </div>
          </div>

          {/* Side Controls Drawer */}
          {showControls && (
            <div className="w-full md:w-80 border-t md:border-t-0 md:border-l border-stone-800/80 bg-stone-950/90 p-5 overflow-y-auto space-y-5 text-xs text-stone-300 shrink-0 backdrop-blur-md">
              {/* Presets Gallery */}
              <div className="space-y-2">
                <label className="font-semibold text-stone-200 flex items-center space-x-1.5">
                  <Palette className="w-3.5 h-3.5 text-stone-400" />
                  <span>Curated Artworks</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {PRESET_ARTWORKS.map((art) => {
                    const active = selectedArtwork.id === art.id;
                    return (
                      <button
                        key={art.id}
                        onClick={() => handleSelectArtwork(art)}
                        className={`p-2 rounded-xl text-left border transition-all cursor-pointer ${
                          active
                            ? `${themeConfig.accentBorder} bg-stone-900 shadow-md ring-1 ring-white/10`
                            : 'border-stone-800/80 hover:border-stone-700 bg-stone-900/50'
                        }`}
                      >
                        <p className={`font-semibold truncate ${active ? themeConfig.accentText : 'text-stone-200'}`}>
                          {art.name}
                        </p>
                        <p className="text-[10px] text-stone-400 truncate">{art.category}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Halftone Screen Mode */}
              <div className="space-y-2">
                <label className="font-semibold text-stone-200 flex items-center space-x-1.5">
                  <Layers className="w-3.5 h-3.5 text-stone-400" />
                  <span>Halftone Screen Mode</span>
                </label>
                <div className="grid grid-cols-3 gap-1.5 bg-stone-900/80 p-1 rounded-xl border border-stone-800">
                  {(['mono', 'duotone', 'color'] as const).map((m) => (
                    <button
                      key={m}
                      onClick={() => setMode(m)}
                      className={`py-1.5 text-[11px] font-semibold rounded-lg capitalize transition-all cursor-pointer ${
                        mode === m
                          ? `${themeConfig.accentBg} shadow-xs`
                          : 'text-stone-400 hover:text-stone-200'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              {/* Dot Shape */}
              <div className="space-y-2">
                <label className="font-semibold text-stone-200">Screen Dot Geometry</label>
                <div className="grid grid-cols-4 gap-1.5 bg-stone-900/80 p-1 rounded-xl border border-stone-800">
                  {(['circle', 'square', 'diamond', 'line'] as const).map((s) => (
                    <button
                      key={s}
                      onClick={() => setShape(s)}
                      className={`py-1.5 text-[10px] font-semibold rounded-lg capitalize transition-all cursor-pointer ${
                        shape === s
                          ? `${themeConfig.accentBg} shadow-xs`
                          : 'text-stone-400 hover:text-stone-200'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Reveal Radius Slider */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-stone-300 font-medium">Loupe Radius</span>
                  <span className="font-mono text-stone-400">{Math.round(revealRadius * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0.15"
                  max="0.8"
                  step="0.01"
                  value={revealRadius}
                  onChange={(e) => setRevealRadius(parseFloat(e.target.value))}
                  className="w-full accent-cyan-400 bg-stone-800 h-1.5 rounded-lg cursor-pointer"
                />
              </div>

              {/* Dot Density Slider */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-stone-300 font-medium">Screen Density</span>
                  <span className="font-mono text-stone-400">{dotDensity} dots</span>
                </div>
                <input
                  type="range"
                  min="30"
                  max="140"
                  step="1"
                  value={dotDensity}
                  onChange={(e) => setDotDensity(parseInt(e.target.value, 10))}
                  className="w-full accent-cyan-400 bg-stone-800 h-1.5 rounded-lg cursor-pointer"
                />
              </div>

              {/* Trigger & Invert Options */}
              <div className="pt-2 border-t border-stone-800/80 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-stone-300">Continuous Reveal</span>
                  <button
                    onClick={() => setTrigger(trigger === 'always' ? 'hover' : 'always')}
                    className={`px-2.5 py-1 text-[10px] font-bold rounded-lg border transition-all cursor-pointer ${
                      trigger === 'always'
                        ? `${themeConfig.accentBorder} ${themeConfig.accentText} bg-stone-900`
                        : 'border-stone-800 text-stone-400'
                    }`}
                  >
                    {trigger === 'always' ? 'Always On' : 'Hover Only'}
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <span className="font-medium text-stone-300">Invert Tones</span>
                  <button
                    onClick={() => setInvert(!invert)}
                    className={`px-2.5 py-1 text-[10px] font-bold rounded-lg border transition-all cursor-pointer ${
                      invert
                        ? `${themeConfig.accentBorder} ${themeConfig.accentText} bg-stone-900`
                        : 'border-stone-800 text-stone-400'
                    }`}
                  >
                    {invert ? 'Negative' : 'Normal'}
                  </button>
                </div>
              </div>

              {/* Mindful prompt */}
              <div className="p-3 bg-stone-900/60 border border-stone-800/80 rounded-2xl text-[11px] text-stone-400 leading-relaxed">
                <p className="font-semibold text-stone-300 mb-1 flex items-center space-x-1.5">
                  <Sparkles className={`w-3 h-3 ${themeConfig.accentText}`} />
                  <span>Mindful Practice</span>
                </p>
                Take a deep breath and slowly trace your cursor across the halftone texture. Notice how clarity emerges from the pattern.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
