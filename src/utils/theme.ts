
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
    name: 'Noir / Obsidian',
    emoji: '⬛',
    tagline: 'Pure Monochrome, Crisp Borders & Deep Shadows',
    primaryGradient: 'from-neutral-900 via-neutral-950 to-black',
    textGradient: 'from-white via-neutral-200 to-neutral-400',
    accentBg: 'bg-white hover:bg-neutral-200 text-black shadow-[0_0_20px_rgba(255,255,255,0.3)]',
    accentText: 'text-white',
    accentBorder: 'border-white/40',
    badgeBg: 'bg-white/5 border-white/20 text-white',
    glowColor: 'shadow-[0_0_30px_rgba(255,255,255,0.15)] ring-white/20',
    bubbleUser: 'bg-white/10 border border-white/20 backdrop-blur-2xl text-white font-medium shadow-[0_20px_40px_-15px_rgba(0,0,0,0.8),inset_0_1px_0_rgba(255,255,255,0.2)]',
    bubbleAi: 'bg-transparent border-0 text-neutral-200 p-0 font-serif',
    sidebarActive: 'bg-white/10 border-white/30 text-white shadow-[0_10px_20px_rgba(0,0,0,0.5)]',
    ambientColors: ['#ffffff', '#a3a3a3', '#525252'],
    confettiColors: ['#ffffff', '#d4d4d4', '#a3a3a3', '#737373', '#404040'],
    halftoneImage: 'https://images.unsplash.com/photo-1605810730419-482a17f22312?auto=format&fit=crop&w=1600&q=80',
    halftoneInk: '#000000',
    halftonePaper: '#171717',
    halftoneMode: 'mono',
  },
  cyberpunk: {
    id: 'cyberpunk',
    name: 'Studio Chrome',
    emoji: '📸',
    tagline: 'Stark Silver, Harsh Lights & Vignette',
    primaryGradient: 'from-zinc-800 via-zinc-950 to-black',
    textGradient: 'from-zinc-100 via-zinc-300 to-zinc-500',
    accentBg: 'bg-zinc-300 hover:bg-zinc-100 text-black shadow-[0_0_20px_rgba(212,212,216,0.3)]',
    accentText: 'text-zinc-200',
    accentBorder: 'border-zinc-400/50',
    badgeBg: 'bg-zinc-500/10 border-zinc-400/30 text-zinc-300',
    glowColor: 'shadow-[0_0_30px_rgba(212,212,216,0.15)] ring-zinc-400/20',
    bubbleUser: 'bg-zinc-800/40 border border-zinc-600/50 backdrop-blur-2xl text-zinc-100 font-medium shadow-[0_20px_40px_-15px_rgba(0,0,0,0.8),inset_0_1px_0_rgba(255,255,255,0.1)]',
    bubbleAi: 'bg-transparent border-0 text-zinc-200 p-0 font-serif',
    sidebarActive: 'bg-zinc-800/60 border-zinc-500/40 text-zinc-200 shadow-[0_10px_20px_rgba(0,0,0,0.5)]',
    ambientColors: ['#e4e4e7', '#a1a1aa', '#52525b'],
    confettiColors: ['#f4f4f5', '#e4e4e7', '#d4d4d8', '#a1a1aa', '#71717a'],
    halftoneImage: 'https://images.unsplash.com/photo-1594911772125-07fc7a2d8d9f?auto=format&fit=crop&w=1600&q=80',
    halftoneInk: '#09090b',
    halftonePaper: '#27272a',
    halftoneMode: 'mono',
  },
  sunset: {
    id: 'sunset',
    name: 'Editorial Crimson',
    emoji: '🩸',
    tagline: 'Deep Black, Stark Red & High Contrast',
    primaryGradient: 'from-red-950 via-black to-black',
    textGradient: 'from-red-100 via-white to-red-200',
    accentBg: 'bg-red-600 hover:bg-red-500 text-white shadow-[0_0_25px_rgba(220,38,38,0.4)]',
    accentText: 'text-red-400',
    accentBorder: 'border-red-500/50',
    badgeBg: 'bg-red-950/30 border-red-800/50 text-red-300',
    glowColor: 'shadow-[0_0_30px_rgba(220,38,38,0.2)] ring-red-500/30',
    bubbleUser: 'bg-red-950/20 border border-red-800/40 backdrop-blur-2xl text-white font-medium shadow-[0_20px_40px_-15px_rgba(0,0,0,0.9),inset_0_1px_0_rgba(255,255,255,0.1)]',
    bubbleAi: 'bg-transparent border-0 text-neutral-200 p-0 font-serif',
    sidebarActive: 'bg-red-950/40 border-red-700/50 text-red-200 shadow-[0_10px_20px_rgba(0,0,0,0.5)]',
    ambientColors: ['#dc2626', '#991b1b', '#000000'],
    confettiColors: ['#fef2f2', '#fca5a5', '#ef4444', '#dc2626', '#991b1b'],
    halftoneImage: 'https://images.unsplash.com/photo-1542452255191-c85a98f2cb73?auto=format&fit=crop&w=1600&q=80',
    halftoneInk: '#2a0a0a',
    halftonePaper: '#450a0a',
    halftoneMode: 'duotone',
  },
  emerald: {
    id: 'emerald',
    name: 'Vogue Emerald',
    emoji: '🍸',
    tagline: 'Bottle Green, Crisp White & Cinematic Shadows',
    primaryGradient: 'from-emerald-950 via-black to-black',
    textGradient: 'from-emerald-50 via-white to-emerald-200',
    accentBg: 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-[0_0_25px_rgba(5,150,105,0.4)]',
    accentText: 'text-emerald-400',
    accentBorder: 'border-emerald-500/50',
    badgeBg: 'bg-emerald-950/30 border-emerald-800/50 text-emerald-300',
    glowColor: 'shadow-[0_0_30px_rgba(5,150,105,0.2)] ring-emerald-500/30',
    bubbleUser: 'bg-emerald-950/20 border border-emerald-800/40 backdrop-blur-2xl text-white font-medium shadow-[0_20px_40px_-15px_rgba(0,0,0,0.9),inset_0_1px_0_rgba(255,255,255,0.1)]',
    bubbleAi: 'bg-transparent border-0 text-neutral-200 p-0 font-serif',
    sidebarActive: 'bg-emerald-950/40 border-emerald-700/50 text-emerald-200 shadow-[0_10px_20px_rgba(0,0,0,0.5)]',
    ambientColors: ['#059669', '#064e3b', '#000000'],
    confettiColors: ['#ecfdf5', '#6ee7b7', '#10b981', '#059669', '#064e3b'],
    halftoneImage: 'https://images.unsplash.com/photo-1534067783941-51c9c23ecefd?auto=format&fit=crop&w=1600&q=80',
    halftoneInk: '#022c22',
    halftonePaper: '#064e3b',
    halftoneMode: 'duotone',
  },
  violet: {
    id: 'violet',
    name: 'Midnight Velvet',
    emoji: '🍷',
    tagline: 'Deep Indigo, Velvet Shadows & Harsh Lights',
    primaryGradient: 'from-indigo-950 via-black to-black',
    textGradient: 'from-indigo-100 via-white to-indigo-200',
    accentBg: 'bg-indigo-500 hover:bg-indigo-400 text-white shadow-[0_0_25px_rgba(99,102,241,0.4)]',
    accentText: 'text-indigo-400',
    accentBorder: 'border-indigo-500/50',
    badgeBg: 'bg-indigo-950/30 border-indigo-800/50 text-indigo-300',
    glowColor: 'shadow-[0_0_30px_rgba(99,102,241,0.2)] ring-indigo-500/30',
    bubbleUser: 'bg-indigo-950/20 border border-indigo-800/40 backdrop-blur-2xl text-white font-medium shadow-[0_20px_40px_-15px_rgba(0,0,0,0.9),inset_0_1px_0_rgba(255,255,255,0.1)]',
    bubbleAi: 'bg-transparent border-0 text-neutral-200 p-0 font-serif',
    sidebarActive: 'bg-indigo-950/40 border-indigo-700/50 text-indigo-200 shadow-[0_10px_20px_rgba(0,0,0,0.5)]',
    ambientColors: ['#6366f1', '#312e81', '#000000'],
    confettiColors: ['#e0e7ff', '#a5b4fc', '#6366f1', '#4f46e5', '#312e81'],
    halftoneImage: 'https://images.unsplash.com/photo-1512413916962-eb1440801d93?auto=format&fit=crop&w=1600&q=80',
    halftoneInk: '#1e1b4b',
    halftonePaper: '#312e81',
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

export function triggerThemeConfetti(themeId: AppTheme = "aurora", customCount = 50) { }

export function triggerBurstConfetti(themeId: AppTheme = "aurora") { }
