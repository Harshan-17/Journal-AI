import React from 'react';
import { Sparkles, Shield, LogOut, Plus, User, Menu, Compass, Eye } from 'lucide-react';
import { UserProfile } from '../types';
import { useAppTheme } from '../context/ThemeContext';
import { ThemePickerPopover } from './ThemePickerPopover';

interface NavbarProps {
  user: UserProfile | null;
  onSignOut: () => void;
  onNewEntry: () => void;
  onOpenSecurity: () => void;
  onOpenFirebaseConfig: () => void;
  onToggleSidebar?: () => void;
  onOpenMapView?: () => void;
  onOpenClarityLoupe?: () => void;
  saveStatus: 'saved' | 'saving' | 'unsaved' | 'error';
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  onSignOut,
  onNewEntry,
  onOpenSecurity,
  onToggleSidebar,
  onOpenMapView,
  onOpenClarityLoupe,
  saveStatus,
}) => {
  const { themeConfig } = useAppTheme();

  return (
    <header className="sticky top-0 z-30 bg-stone-950/80 backdrop-blur-xl border-b border-stone-800/80 text-stone-100 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-15 flex items-center justify-between">
        {/* Left: Brand & Sidebar toggle */}
        <div className="flex items-center space-x-3">
          {user && onToggleSidebar && (
            <button
              id="btn-toggle-sidebar"
              onClick={onToggleSidebar}
              className="md:hidden p-2 text-stone-400 hover:text-stone-100 hover:bg-stone-900 rounded-xl transition-all active:scale-95 cursor-pointer"
              title="Toggle History"
              aria-label="Toggle history menu"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}
          <div className="flex items-center space-x-2.5">
            <div
              className={`w-8 h-8 rounded-xl bg-gradient-to-tr ${themeConfig.primaryGradient} flex items-center justify-center text-stone-950 shadow-md transition-all duration-500`}
            >
              <Sparkles className="w-4 h-4 fill-stone-950/20" />
            </div>
            <div>
              <span className={`font-bold text-base tracking-tight block leading-tight bg-gradient-to-r ${themeConfig.textGradient} bg-clip-text text-transparent`}>
                Reflect
              </span>
              <span className="text-[10px] font-mono text-stone-400 block leading-tight">
                Mindful AI Journal
              </span>
            </div>
          </div>
        </div>

        {/* Center: Clean Save State */}
        {user && (
          <div className="hidden sm:flex items-center space-x-2 text-xs text-stone-300 px-3 py-1 rounded-full bg-stone-900/70 border border-stone-800/80 backdrop-blur-md">
            <span
              className={`w-2 h-2 rounded-full transition-all ${
                saveStatus === 'saving'
                  ? 'bg-amber-400 animate-ping'
                  : saveStatus === 'error'
                  ? 'bg-rose-500'
                  : 'bg-emerald-400 shadow-emerald-400/50 shadow-xs'
              }`}
            />
            <span className="font-medium text-[11px]">
              {saveStatus === 'saving'
                ? 'Syncing changes...'
                : saveStatus === 'error'
                ? 'Offline cache'
                : 'Synced'}
            </span>
          </div>
        )}

        {/* Right: Actions, Theme Switcher & User Profile */}
        <div className="flex items-center space-x-2 sm:space-x-2.5">
          {/* Super Cool Theme Switcher Popover */}
          <ThemePickerPopover />

          {onOpenClarityLoupe && (
            <button
              id="btn-nav-clarity-loupe"
              onClick={onOpenClarityLoupe}
              className={`flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium text-stone-300 hover:${themeConfig.accentText} bg-stone-900/80 hover:bg-stone-800 border border-stone-800 hover:${themeConfig.accentBorder} rounded-xl transition-all active:scale-95 cursor-pointer backdrop-blur-md`}
              title="Open Halftone Clarity Loupe"
            >
              <Eye className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Clarity Loupe</span>
            </button>
          )}

          {user && onOpenMapView && (
            <button
              id="btn-nav-atlas"
              onClick={onOpenMapView}
              className={`hidden lg:flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium text-stone-300 hover:${themeConfig.accentText} bg-stone-900/80 hover:bg-stone-800 border border-stone-800 hover:${themeConfig.accentBorder} rounded-xl transition-all active:scale-95 cursor-pointer backdrop-blur-md`}
              title="Open Global Reflections Atlas"
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Atlas</span>
            </button>
          )}

          <button
            id="btn-security-model"
            onClick={onOpenSecurity}
            className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium text-stone-300 hover:text-stone-100 bg-stone-900/80 hover:bg-stone-800 border border-stone-800 rounded-xl transition-all active:scale-95 cursor-pointer backdrop-blur-md"
            title="Privacy & Data Protection"
          >
            <Shield className="w-3.5 h-3.5 opacity-80" />
            <span className="hidden sm:inline">Privacy</span>
          </button>

          {user ? (
            <>
              <button
                id="btn-new-reflection-nav"
                onClick={onNewEntry}
                className={`flex items-center space-x-1.5 px-3.5 py-1.5 text-xs font-bold ${themeConfig.accentBg} rounded-xl shadow-md transition-all active:scale-95 cursor-pointer`}
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">New Reflection</span>
              </button>

              <div className="flex items-center pl-2 sm:pl-3 border-l border-stone-800 space-x-2.5">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'User Avatar'}
                    referrerPolicy="no-referrer"
                    className="w-7 h-7 rounded-full border border-stone-700 object-cover shadow-xs"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-stone-800 border border-stone-700 flex items-center justify-center text-stone-300 text-xs font-medium">
                    <User className="w-3.5 h-3.5" />
                  </div>
                )}
                <div className="hidden xl:block text-left max-w-[110px]">
                  <p className="text-xs font-medium text-stone-200 truncate">
                    {user.displayName || 'User'}
                  </p>
                </div>

                <button
                  id="btn-sign-out"
                  onClick={onSignOut}
                  className="p-1.5 text-stone-400 hover:text-rose-400 hover:bg-stone-900 rounded-lg transition-colors active:scale-95 cursor-pointer"
                  title="Sign out"
                  aria-label="Sign out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </header>
  );
};



