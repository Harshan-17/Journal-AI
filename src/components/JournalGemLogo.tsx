import React from 'react';
import { useAppTheme } from '../context/ThemeContext';

interface JournalGemLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  showSubtitle?: boolean;
  className?: string;
  animate?: boolean;
}

export const JournalGemIcon: React.FC<{
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  animate?: boolean;
}> = ({ size = 'md', className = '', animate = false }) => {
  const { themeConfig } = useAppTheme();

  const sizeClasses = {
    xs: 'w-6 h-6 rounded-lg p-1',
    sm: 'w-7 h-7 rounded-xl p-1.5',
    md: 'w-8 h-8 rounded-xl p-1.5',
    lg: 'w-11 h-11 rounded-2xl p-2',
    xl: 'w-14 h-14 rounded-3xl p-2.5',
  };

  const svgSizes = {
    xs: 'w-4 h-4',
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-7 h-7',
    xl: 'w-9 h-9',
  };

  return (
    <div
      className={`relative flex items-center justify-center shrink-0 bg-gradient-to-tr ${themeConfig.primaryGradient} shadow-md transition-all duration-500 group overflow-hidden ${sizeClasses[size]} ${className}`}
    >
      {/* Gem Facet Glass Shimmer Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-white/30 via-transparent to-black/20 pointer-events-none" />
      
      {/* Subtle Gem Corner Light Flare */}
      <div className="absolute -top-1 -right-1 w-3 h-3 bg-white/40 rounded-full blur-[2px] pointer-events-none" />

      {/* The JournalGem Star & Flare Mark */}
      <svg
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`${svgSizes[size]} relative z-10 text-stone-950 transition-transform duration-300 ${
          animate ? 'group-hover:scale-110 group-hover:rotate-6' : ''
        }`}
      >
        {/* Main 4-pointed radiant Gem Star */}
        <path
          d="M17.5 3C17.5 9.35 12.35 14.5 6 14.5C12.35 14.5 17.5 19.65 17.5 26C17.5 19.65 22.65 14.5 29 14.5C22.65 14.5 17.5 9.35 17.5 3Z"
          fill="currentColor"
          className="drop-shadow-xs"
        />
        {/* Facet interior reflection highlight line */}
        <path
          d="M17.5 7C17.5 11.8 13.8 14.5 9.5 14.5C13.8 14.5 17.5 17.2 17.5 22"
          stroke="rgba(255,255,255,0.4)"
          strokeWidth="1.2"
          strokeLinecap="round"
        />
        {/* Accent satellite gem sparkle dot */}
        <circle cx="8" cy="23" r="2.25" fill="currentColor" />
        {/* Micro flare */}
        <circle cx="25" cy="7" r="1.25" fill="currentColor" opacity="0.8" />
      </svg>
    </div>
  );
};

export const JournalGemLogo: React.FC<JournalGemLogoProps> = ({
  size = 'md',
  showText = true,
  showSubtitle = true,
  className = '',
  animate = true,
}) => {
  const { themeConfig } = useAppTheme();

  const titleSizes = {
    xs: 'text-sm',
    sm: 'text-sm font-bold',
    md: 'text-base font-bold',
    lg: 'text-xl font-bold',
    xl: 'text-2xl font-bold',
  };

  const subtitleSizes = {
    xs: 'text-[9px]',
    sm: 'text-[10px]',
    md: 'text-[10px]',
    lg: 'text-xs',
    xl: 'text-sm',
  };

  return (
    <div className={`flex items-center space-x-2.5 select-none ${className}`}>
      <JournalGemIcon size={size} animate={animate} />

      {showText && (
        <div className="flex flex-col">
          <div className="flex items-center space-x-1 leading-tight">
            <span className={`${titleSizes[size]} tracking-tight text-stone-100 font-bold`}>
              Journal
            </span>
            <span
              className={`${titleSizes[size]} tracking-tight font-bold bg-gradient-to-r ${themeConfig.textGradient} bg-clip-text text-transparent`}
            >
              Gem
            </span>
          </div>
          {showSubtitle && (
            <span
              className={`${subtitleSizes[size]} font-mono text-stone-400 block leading-tight tracking-tight`}
            >
              Mindful AI Journal
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default JournalGemLogo;
