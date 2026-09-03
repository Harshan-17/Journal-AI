import React from 'react';
import { Shield, LogOut, Plus, User, PanelLeftClose, PanelLeftOpen, Compass } from 'lucide-react';
import { UserProfile } from '../types';
import { useAppTheme } from '../context/ThemeContext';
import { ThemePickerPopover } from './ThemePickerPopover';
import { JournalGemLogo } from './JournalGemLogo';

interface NavbarProps {
  user: UserProfile | null;
  onSignOut: () => void;
  onNewEntry: () => void;
  onOpenSecurity: () => void;
  onOpenFirebaseConfig?: () => void;
  isSidebarOpen?: boolean;
  onToggleSidebar?: () => void;
  onOpenMapView?: () => void;
  saveStatus?: 'saved' | 'saving' | 'unsaved' | 'error';
  isAdmin?: boolean;
  onOpenAdmin?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  onSignOut,
  onNewEntry,
  onOpenSecurity,
  isSidebarOpen = true,
  onToggleSidebar,
  onOpenMapView,
  isAdmin = false,
  onOpenAdmin,
}) => {
  const { themeConfig } = useAppTheme();

  return (
    <header
      className={`sticky top-0 z-30 text-neutral-100 transition-all duration-300 ${
        user
          ? 'bg-black/80 backdrop-blur-xl border-b border-neutral-800/80'
          : 'bg-transparent border-b border-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
        {/* Left: Brand & Sidebar toggle */}
        <div className="flex items-center space-x-3">
          
          <JournalGemLogo size="sm" />
        </div>

        {/* Right: Actions, Theme Switcher & User Profile */}
        <div className="flex items-center space-x-2">
          {/* Theme Switcher Popover */}
          <ThemePickerPopover />

          {user && onOpenMapView && (
            <button
              id="btn-nav-atlas"
              onClick={onOpenMapView}
              className="hidden sm:flex items-center space-x-1 px-2.5 py-1 text-xs font-medium text-neutral-400 hover:text-neutral-200 bg-neutral-900/60 hover:bg-neutral-850 border border-neutral-800 rounded-lg transition-all active:scale-95 cursor-pointer"
              title="Global Atlas"
            >
              <Compass className="w-3.5 h-3.5 text-neutral-400" />
              <span>Atlas</span>
            </button>
          )}

          {isAdmin && onOpenAdmin && (
            <button
              onClick={onOpenAdmin}
              className="hidden sm:flex items-center space-x-1 px-2.5 py-1 text-xs font-medium text-indigo-400 hover:text-indigo-300 bg-indigo-900/20 hover:bg-indigo-900/40 border border-indigo-500/20 rounded-lg transition-all active:scale-95 cursor-pointer"
              title="Admin Dashboard"
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Admin</span>
            </button>
          )}

          

          {user ? (
            <div className="flex items-center pl-2 border-l border-neutral-800 space-x-2">
              <button
                id="btn-new-reflection-nav"
                onClick={onNewEntry}
                className={`flex items-center space-x-1 px-2.5 py-1 text-xs font-semibold ${themeConfig.accentBg} rounded-lg shadow-sm transition-all active:scale-95 cursor-pointer`}
                title="New Reflection"
              >
                <Plus className="w-3.5 h-3.5" />
                <span className="hidden md:inline">New</span>
              </button>

              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || 'User Avatar'}
                  referrerPolicy="no-referrer"
                  className="w-6 h-6 rounded-full border border-neutral-700 object-cover"
                />
              ) : (
                <div className="w-6 h-6 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center text-neutral-300 text-xs font-medium">
                  <User className="w-3 h-3" />
                </div>
              )}

              <button
                id="btn-sign-out"
                onClick={onSignOut}
                className="p-1 text-neutral-400 hover:text-rose-400 hover:bg-neutral-900 rounded-md transition-colors cursor-pointer"
                title="Sign out"
                aria-label="Sign out"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
};
