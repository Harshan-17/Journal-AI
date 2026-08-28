import React, { createContext, useContext, useState, useEffect } from 'react';
import { AppTheme } from '../types';
import { THEMES, ThemeConfig, triggerThemeConfetti, triggerBurstConfetti } from '../utils/theme';

export type BackgroundStyle = 'halftone' | 'aurora' | 'hybrid' | 'minimal';

interface ThemeContextType {
  theme: AppTheme;
  themeConfig: ThemeConfig;
  setTheme: (theme: AppTheme) => void;
  ambientGlow: boolean;
  setAmbientGlow: (enabled: boolean) => void;
  bgStyle: BackgroundStyle;
  setBgStyle: (style: BackgroundStyle) => void;
  halftoneBgMode: 'mono' | 'duotone' | 'color';
  setHalftoneBgMode: (mode: 'mono' | 'duotone' | 'color') => void;
  halftoneBgDensity: number;
  setHalftoneBgDensity: (density: number) => void;
  halftoneBgRadius: number;
  setHalftoneBgRadius: (radius: number) => void;
  celebrate: (count?: number) => void;
  celebrateBig: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = 'mindlog_app_theme';
const GLOW_STORAGE_KEY = 'mindlog_ambient_glow';
const BG_STYLE_STORAGE_KEY = 'mindlog_bg_style';
const BG_MODE_STORAGE_KEY = 'mindlog_bg_mode';

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<AppTheme>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(THEME_STORAGE_KEY) as AppTheme;
      if (saved && THEMES[saved]) return saved;
    }
    return 'aurora';
  });

  const [ambientGlow, setAmbientGlowState] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(GLOW_STORAGE_KEY);
      return saved !== null ? saved === 'true' : true;
    }
    return true;
  });

  const [bgStyle, setBgStyleState] = useState<BackgroundStyle>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(BG_STYLE_STORAGE_KEY) as BackgroundStyle;
      if (saved && ['halftone', 'aurora', 'hybrid', 'minimal'].includes(saved)) {
        return saved;
      }
    }
    return 'hybrid'; // Default to interactive halftone + aurora hybrid
  });

  const [halftoneBgMode, setHalftoneBgModeState] = useState<'mono' | 'duotone' | 'color'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(BG_MODE_STORAGE_KEY) as any;
      if (saved && ['mono', 'duotone', 'color'].includes(saved)) return saved;
    }
    return 'duotone';
  });

  const [halftoneBgDensity, setHalftoneBgDensity] = useState<number>(75);
  const [halftoneBgRadius, setHalftoneBgRadius] = useState<number>(0.42);

  const setTheme = (newTheme: AppTheme) => {
    setThemeState(newTheme);
    if (typeof window !== 'undefined') {
      localStorage.setItem(THEME_STORAGE_KEY, newTheme);
    }
    triggerThemeConfetti(newTheme, 40);
  };

  const setAmbientGlow = (enabled: boolean) => {
    setAmbientGlowState(enabled);
    if (typeof window !== 'undefined') {
      localStorage.setItem(GLOW_STORAGE_KEY, String(enabled));
    }
  };

  const setBgStyle = (style: BackgroundStyle) => {
    setBgStyleState(style);
    if (typeof window !== 'undefined') {
      localStorage.setItem(BG_STYLE_STORAGE_KEY, style);
    }
  };

  const setHalftoneBgMode = (mode: 'mono' | 'duotone' | 'color') => {
    setHalftoneBgModeState(mode);
    if (typeof window !== 'undefined') {
      localStorage.setItem(BG_MODE_STORAGE_KEY, mode);
    }
  };

  const celebrate = (count = 50) => {
    triggerThemeConfetti(theme, count);
  };

  const celebrateBig = () => {
    triggerBurstConfetti(theme);
  };

  const themeConfig = THEMES[theme] || THEMES.aurora;

  return (
    <ThemeContext.Provider
      value={{
        theme,
        themeConfig,
        setTheme,
        ambientGlow,
        setAmbientGlow,
        bgStyle,
        setBgStyle,
        halftoneBgMode,
        setHalftoneBgMode,
        halftoneBgDensity,
        setHalftoneBgDensity,
        halftoneBgRadius,
        setHalftoneBgRadius,
        celebrate,
        celebrateBig,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useAppTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useAppTheme must be used within a ThemeProvider');
  }
  return context;
};
