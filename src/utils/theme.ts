import confetti from 'canvas-confetti';
import { AppTheme, MoodTag } from '../types';

export interface ThemeConfig {
  id: AppTheme;
  name: string;
  emoji: string;
  tagline: string;
  primaryGradient: string;
  textGradient: string;
  accentBg: string;
  accentText: string;
  accentBorder: string;
  badgeBg: string;
  glowColor: string;
  bubbleUser: string;
  bubbleAi: string;
  sidebarActive: string;
  ambientColors: [string, string, string];
  confettiColors: string[];
  halftoneImage: string;
  halftoneInk: string;
  halftonePaper: string;
  halftoneMode: 'mono' | 'duotone' | 'color';
}

export const THEMES: Record<AppTheme, ThemeConfig> = {
  aurora: {
    id: 'aurora',
    name: 'Cosmic Aurora',
    emoji: '🌌',
    tagline: 'Electric Cyan, Celestial Violet & Mint',
    primaryGradient: 'from-cyan-400 via-teal-400 to-indigo-500',
    textGradient: 'from-cyan-300 via-teal-200 to-indigo-300',
    accentBg: 'bg-cyan-400 hover:bg-cyan-300 text-stone-950',
    accentText: 'text-cyan-300',
    accentBorder: 'border-cyan-500/40',
    badgeBg: 'bg-cyan-500/10 border-cyan-500/30 text-cyan-300',
    glowColor: 'shadow-cyan-500/20 ring-cyan-500/30',
    bubbleUser: 'bg-gradient-to-r from-cyan-500 to-teal-500 text-stone-950 font-medium',
    bubbleAi: 'bg-stone-900/80 border border-cyan-500/30 text-stone-100 backdrop-blur-md',
    sidebarActive: 'bg-cyan-950/40 border-cyan-500/50 text-cyan-300 shadow-cyan-500/10',
    ambientColors: ['#06b6d4', '#8b5cf6', '#10b981'],
    confettiColors: ['#06b6d4', '#3b82f6', '#8b5cf6', '#10b981', '#a7f3d0'],
    halftoneImage: 'https://images.unsplash.com/photo-1517411032315-54ef2cb783bb?auto=format&fit=crop&w=1600&q=80',
    halftoneInk: '#041e24',
    halftonePaper: '#082f49',
    halftoneMode: 'duotone',
  },
  cyberpunk: {
    id: 'cyberpunk',
    name: 'Cyberpunk Neon',
    emoji: '⚡',
    tagline: 'Hot Magenta, Electric Yellow & Neon Cyan',
    primaryGradient: 'from-fuchsia-500 via-pink-500 to-amber-400',
    textGradient: 'from-fuchsia-300 via-pink-200 to-yellow-300',
    accentBg: 'bg-gradient-to-r from-fuchsia-500 to-pink-500 hover:from-fuchsia-400 hover:to-pink-400 text-white font-bold',
    accentText: 'text-fuchsia-300',
    accentBorder: 'border-fuchsia-500/40',
    badgeBg: 'bg-fuchsia-500/10 border-fuchsia-500/30 text-fuchsia-300',
    glowColor: 'shadow-fuchsia-500/25 ring-fuchsia-500/30',
    bubbleUser: 'bg-gradient-to-r from-fuchsia-600 via-pink-600 to-rose-500 text-white font-medium',
    bubbleAi: 'bg-stone-900/85 border border-fuchsia-500/30 text-stone-100 backdrop-blur-md',
    sidebarActive: 'bg-fuchsia-950/40 border-fuchsia-500/50 text-fuchsia-300 shadow-fuchsia-500/10',
    ambientColors: ['#d946ef', '#ec4899', '#eab308'],
    confettiColors: ['#f43f5e', '#d946ef', '#eab308', '#06b6d4', '#ec4899'],
    halftoneImage: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=1600&q=80',
    halftoneInk: '#1f0a24',
    halftonePaper: '#4a044e',
    halftoneMode: 'duotone',
  },
  sunset: {
    id: 'sunset',
    name: 'Vibrant Sunset',
    emoji: '🌅',
    tagline: 'Tangerine Dream, Coral Glow & Gold',
    primaryGradient: 'from-amber-400 via-orange-500 to-rose-500',
    textGradient: 'from-amber-300 via-orange-200 to-rose-300',
    accentBg: 'bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-stone-950 font-bold',
    accentText: 'text-amber-300',
    accentBorder: 'border-amber-500/40',
    badgeBg: 'bg-amber-500/10 border-amber-500/30 text-amber-300',
    glowColor: 'shadow-amber-500/25 ring-amber-500/30',
    bubbleUser: 'bg-gradient-to-r from-amber-400 via-orange-400 to-rose-400 text-stone-950 font-medium',
    bubbleAi: 'bg-stone-900/85 border border-amber-500/30 text-stone-100 backdrop-blur-md',
    sidebarActive: 'bg-amber-950/40 border-amber-500/50 text-amber-300 shadow-amber-500/10',
    ambientColors: ['#f59e0b', '#f97316', '#f43f5e'],
    confettiColors: ['#fbbf24', '#f97316', '#ef4444', '#f43f5e', '#fb7185'],
    halftoneImage: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1600&q=80',
    halftoneInk: '#261005',
    halftonePaper: '#431407',
    halftoneMode: 'duotone',
  },
  emerald: {
    id: 'emerald',
    name: 'Bioluminescent Mint',
    emoji: '🌿',
    tagline: 'Electric Lime, Mint Glow & Marine Cyan',
    primaryGradient: 'from-emerald-400 via-teal-400 to-cyan-500',
    textGradient: 'from-emerald-300 via-teal-200 to-cyan-300',
    accentBg: 'bg-emerald-400 hover:bg-emerald-300 text-stone-950 font-bold',
    accentText: 'text-emerald-300',
    accentBorder: 'border-emerald-500/40',
    badgeBg: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300',
    glowColor: 'shadow-emerald-500/20 ring-emerald-500/30',
    bubbleUser: 'bg-gradient-to-r from-emerald-400 to-teal-500 text-stone-950 font-medium',
    bubbleAi: 'bg-stone-900/85 border border-emerald-500/30 text-stone-100 backdrop-blur-md',
    sidebarActive: 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300 shadow-emerald-500/10',
    ambientColors: ['#10b981', '#14b8a6', '#06b6d4'],
    confettiColors: ['#10b981', '#34d399', '#14b8a6', '#06b6d4', '#a7f3d0'],
    halftoneImage: 'https://images.unsplash.com/photo-1511497584788-87676104235f?auto=format&fit=crop&w=1600&q=80',
    halftoneInk: '#051c13',
    halftonePaper: '#064e3b',
    halftoneMode: 'duotone',
  },
  violet: {
    id: 'violet',
    name: 'Electric Violet',
    emoji: '🔮',
    tagline: 'Amethyst Radiance, Indigo Pulse & Lavender',
    primaryGradient: 'from-violet-400 via-purple-400 to-indigo-500',
    textGradient: 'from-violet-300 via-purple-200 to-indigo-300',
    accentBg: 'bg-violet-400 hover:bg-violet-300 text-stone-950 font-bold',
    accentText: 'text-violet-300',
    accentBorder: 'border-violet-500/40',
    badgeBg: 'bg-violet-500/10 border-violet-500/30 text-violet-300',
    glowColor: 'shadow-violet-500/20 ring-violet-500/30',
    bubbleUser: 'bg-gradient-to-r from-violet-500 via-purple-500 to-indigo-500 text-white font-medium',
    bubbleAi: 'bg-stone-900/85 border border-violet-500/30 text-stone-100 backdrop-blur-md',
    sidebarActive: 'bg-violet-950/40 border-violet-500/50 text-violet-300 shadow-violet-500/10',
    ambientColors: ['#8b5cf6', '#a855f7', '#6366f1'],
    confettiColors: ['#8b5cf6', '#c084fc', '#a855f7', '#6366f1', '#e879f9'],
    halftoneImage: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&w=1600&q=80',
    halftoneInk: '#140724',
    halftonePaper: '#3b0764',
    halftoneMode: 'duotone',
  },
};

export const MOOD_TAGS: MoodTag[] = [
  { id: 'inspired', emoji: '✨', label: 'Inspired', color: 'from-amber-400 to-orange-400' },
  { id: 'focused', emoji: '🎯', label: 'Deep Focus', color: 'from-cyan-400 to-blue-500' },
  { id: 'creative', emoji: '🎨', label: 'Creative Burst', color: 'from-pink-500 to-purple-500' },
  { id: 'calm', emoji: '🧘', label: 'Mindful & Calm', color: 'from-emerald-400 to-teal-500' },
  { id: 'breakthrough', emoji: '💡', label: 'Breakthrough', color: 'from-yellow-400 to-amber-500' },
  { id: 'energized', emoji: '🚀', label: 'Energized', color: 'from-rose-500 to-fuchsia-500' },
];

export function triggerThemeConfetti(themeId: AppTheme = 'aurora', customCount = 50) {
  const currentTheme = THEMES[themeId] || THEMES.aurora;
  try {
    confetti({
      particleCount: customCount,
      spread: 70,
      origin: { y: 0.8 },
      colors: currentTheme.confettiColors,
      ticks: 200,
      gravity: 1.1,
      scalar: 1.1,
      shapes: ['circle', 'square'],
      disableForReducedMotion: true,
    });
  } catch (e) {
    console.warn('Confetti effect bypassed:', e);
  }
}

export function triggerBurstConfetti(themeId: AppTheme = 'aurora') {
  const currentTheme = THEMES[themeId] || THEMES.aurora;
  try {
    const end = Date.now() + 800;
    const interval: any = setInterval(() => {
      if (Date.now() > end) {
        return clearInterval(interval);
      }
      confetti({
        startVelocity: 30,
        spread: 360,
        ticks: 60,
        origin: { x: Math.random(), y: Math.random() - 0.2 },
        colors: currentTheme.confettiColors,
        shapes: ['circle'],
        scalar: 0.9,
      });
    }, 150);
  } catch (e) {
    console.warn('Burst confetti bypassed:', e);
  }
}
