import React, { useState, useRef, useEffect } from 'react';
import { Palette, Sparkles, Check, Flame, Eye, Layers, Image as ImageIcon } from 'lucide-react';
import { useAppTheme, BackgroundStyle } from '../context/ThemeContext';
import { THEMES } from '../utils/theme';
import { AppTheme } from '../types';

export const ThemePickerPopover: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const {
    theme,
    setTheme,
    bgStyle,
    setBgStyle,
    halftoneBgMode,
    setHalftoneBgMode,
    celebrateBig,
  } = useAppTheme();
  const popoverRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const currentTheme = THEMES[theme] || THEMES.aurora;

  const bgStyles: { id: BackgroundStyle; label: string; icon: string }[] = [
    { id: 'hybrid', label: 'Halftone + Aurora', icon: '✨' },
    { id: 'halftone', label: 'Interactive Halftone', icon: '🎨' },
    { id: 'aurora', label: 'Aurora Glow', icon: '🌌' },
    { id: 'minimal', label: 'Minimal Dark', icon: '🌑' },
  ];

  return (
    <div className="relative" ref={popoverRef}>
      <button
        id="btn-theme-picker-toggle"
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border transition-all active:scale-95 cursor-pointer backdrop-blur-md ${
          isOpen
            ? `${currentTheme.accentBorder} ${currentTheme.accentText} bg-stone-900 shadow-md`
            : 'bg-stone-900/80 hover:bg-stone-800 text-stone-200 border-stone-800 hover:border-stone-700'
        }`}
        title="Switch Interactive Colorful Theme"
      >
        <span className="text-sm">{currentTheme.emoji}</span>
        <span className="hidden sm:inline font-medium">{currentTheme.name}</span>
        <Palette className="w-3.5 h-3.5 ml-0.5 opacity-80" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-88 rounded-2xl bg-stone-950/95 border border-stone-800 p-4 shadow-2xl z-50 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150 text-stone-100 max-h-[85vh] overflow-y-auto">
          <div className="flex items-center justify-between pb-3 border-b border-stone-800/80 mb-3">
            <div className="flex items-center space-x-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-cyan-500 to-fuchsia-500 flex items-center justify-center text-stone-950 shadow-xs">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-stone-100 uppercase tracking-wider">
                  Theme & Halftone Engine
                </h4>
                <p className="text-[10px] text-stone-400">Palettes & interactive canvas backgrounds</p>
              </div>
            </div>

            <button
              onClick={() => celebrateBig()}
              className="p-1.5 text-stone-400 hover:text-amber-300 hover:bg-stone-900 rounded-lg transition-all active:scale-90 cursor-pointer"
              title="Burst celebratory confetti"
            >
              <Flame className="w-4 h-4 text-amber-400" />
            </button>
          </div>

          {/* Theme list */}
          <div className="space-y-1.5 mb-4">
            <span className="text-[10px] uppercase font-bold text-stone-400 tracking-wider block mb-1">
              Select Color Palette
            </span>
            {(Object.keys(THEMES) as AppTheme[]).map((themeKey) => {
              const t = THEMES[themeKey];
              const isSelected = theme === themeKey;

              return (
                <button
                  key={themeKey}
                  id={`theme-option-${themeKey}`}
                  onClick={() => {
                    setTheme(themeKey);
                  }}
                  className={`w-full flex items-center justify-between p-2 rounded-xl border text-left transition-all cursor-pointer group active:scale-[0.98] ${
                    isSelected
                      ? `bg-stone-900 ${t.accentBorder} shadow-xs ring-1 ring-white/10`
                      : 'bg-stone-900/40 border-stone-800/60 hover:bg-stone-900/80 hover:border-stone-700'
                  }`}
                >
                  <div className="flex items-center space-x-2.5 min-w-0">
                    <span className="text-base shrink-0 group-hover:scale-110 transition-transform">
                      {t.emoji}
                    </span>
                    <div className="min-w-0">
                      <span
                        className={`text-xs font-bold tracking-tight truncate block ${
                          isSelected ? t.accentText : 'text-stone-200'
                        }`}
                      >
                        {t.name}
                      </span>
                      <p className="text-[10px] text-stone-400 truncate">{t.tagline}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 shrink-0">
                    {/* Visual Color Swatches */}
                    <div className="flex items-center -space-x-1">
                      {t.ambientColors.map((color, i) => (
                        <div
                          key={i}
                          className="w-3 h-3 rounded-full border border-stone-950 shadow-xs"
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>

                    {isSelected && (
                      <div className="w-4 h-4 rounded-full bg-white/10 flex items-center justify-center text-emerald-400">
                        <Check className="w-2.5 h-2.5" />
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Background Style Engine */}
          <div className="pt-3 border-t border-stone-800/80 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-1.5 text-xs text-stone-300">
                <Layers className="w-3.5 h-3.5 text-stone-400" />
                <span className="text-[11px] font-semibold">Background Rendering</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-1.5">
              {bgStyles.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setBgStyle(item.id)}
                  className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg border text-left text-xs transition-all cursor-pointer ${
                    bgStyle === item.id
                      ? `${currentTheme.accentBorder} bg-stone-900 font-semibold ${currentTheme.accentText}`
                      : 'bg-stone-900/30 border-stone-800/70 text-stone-300 hover:bg-stone-900/70'
                  }`}
                >
                  <span className="text-xs">{item.icon}</span>
                  <span className="truncate text-[11px]">{item.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Halftone Mode Controls (if halftone active) */}
          {(bgStyle === 'halftone' || bgStyle === 'hybrid') && (
            <div className="mt-3 pt-2.5 border-t border-stone-800/60 flex items-center justify-between text-xs">
              <div className="flex items-center space-x-1.5 text-stone-400">
                <ImageIcon className="w-3.5 h-3.5" />
                <span className="text-[10px] uppercase font-bold tracking-wider">Halftone Ink Mode</span>
              </div>
              <div className="flex items-center space-x-1 bg-stone-900/80 p-0.5 rounded-lg border border-stone-800">
                {(['duotone', 'color', 'mono'] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => setHalftoneBgMode(m)}
                    className={`px-2 py-0.5 rounded-md text-[10px] font-medium transition-all capitalize cursor-pointer ${
                      halftoneBgMode === m
                        ? `${currentTheme.accentBg} shadow-xs font-bold`
                        : 'text-stone-400 hover:text-stone-200'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
