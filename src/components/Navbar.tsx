import React from 'react';
import { Sparkles, ShieldCheck, LogOut, Plus, User, Menu, Database, ShieldAlert } from 'lucide-react';
import { UserProfile } from '../types';

interface NavbarProps {
  user: UserProfile | null;
  onSignOut: () => void;
  onNewEntry: () => void;
  onOpenSecurity: () => void;
  onOpenFirebaseConfig: () => void;
  onToggleSidebar?: () => void;
  saveStatus: 'saved' | 'saving' | 'unsaved' | 'error';
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  onSignOut,
  onNewEntry,
  onOpenSecurity,
  onOpenFirebaseConfig,
  onToggleSidebar,
  saveStatus,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-stone-900/90 backdrop-blur-md border-b border-stone-800 text-stone-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Left: Brand & Sidebar toggle */}
        <div className="flex items-center space-x-3">
          {user && onToggleSidebar && (
            <button
              id="btn-toggle-sidebar"
              onClick={onToggleSidebar}
              className="md:hidden p-2 text-stone-400 hover:text-stone-100 hover:bg-stone-800 rounded-lg transition-colors"
              title="Toggle History Sidebar"
              aria-label="Toggle history menu"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-600 to-amber-400 flex items-center justify-center shadow-md shadow-amber-950/40">
              <Sparkles className="w-5 h-5 text-stone-950" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-semibold text-base tracking-tight text-stone-100">
                  Gemini Reflection Journal
                </span>
                <span className="hidden sm:inline-flex px-2 py-0.5 text-[10px] font-medium tracking-wide uppercase bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-full">
                  Gemini 3.6 Flash
                </span>
              </div>
              <p className="hidden md:block text-xs text-stone-400">
                User-Isolated Cloud Firestore Persistence
              </p>
            </div>
          </div>
        </div>

        {/* Center: Save State Indicator (when authenticated) */}
        {user && (
          <div className="hidden lg:flex items-center space-x-2 text-xs font-mono text-stone-400 bg-stone-950/60 px-3 py-1.5 rounded-full border border-stone-800/80">
            <span
              className={`w-2 h-2 rounded-full ${
                saveStatus === 'saving'
                  ? 'bg-amber-400 animate-pulse'
                  : saveStatus === 'error'
                  ? 'bg-rose-500'
                  : saveStatus === 'unsaved'
                  ? 'bg-amber-300'
                  : 'bg-emerald-400'
              }`}
            />
            <span>
              {saveStatus === 'saving'
                ? 'Syncing to Firestore...'
                : saveStatus === 'error'
                ? 'Sync error (retrying...)'
                : saveStatus === 'unsaved'
                ? 'Unsaved changes'
                : 'Synced to Firestore'}
            </span>
          </div>
        )}

        {/* Right: Actions and User profile */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          <button
            id="btn-security-model"
            onClick={onOpenSecurity}
            className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium text-stone-300 hover:text-emerald-400 bg-stone-800/80 hover:bg-stone-800 border border-stone-700/80 rounded-lg transition-colors"
            title="View Security & Privacy Architecture"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span className="hidden sm:inline">Security Specs</span>
          </button>

          <button
            id="btn-firebase-settings-nav"
            onClick={onOpenFirebaseConfig}
            className="hidden sm:flex items-center space-x-1.5 px-2.5 py-1.5 text-xs font-medium text-stone-400 hover:text-amber-300 bg-stone-800/50 hover:bg-stone-800 border border-stone-700/60 rounded-lg transition-colors"
            title="Firebase Database Settings"
          >
            <Database className="w-3.5 h-3.5" />
          </button>

          {user ? (
            <>
              <button
                id="btn-new-reflection-nav"
                onClick={onNewEntry}
                className="flex items-center space-x-1.5 px-3.5 py-1.5 text-xs font-medium text-stone-950 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 rounded-lg shadow-sm shadow-amber-950/20 transition-all font-semibold"
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
                    className="w-8 h-8 rounded-full border border-stone-700 object-cover"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-300 font-semibold text-xs">
                    <User className="w-4 h-4" />
                  </div>
                )}
                <div className="hidden xl:block text-left max-w-[130px]">
                  <p className="text-xs font-medium text-stone-200 truncate">
                    {user.displayName || 'Authenticated User'}
                  </p>
                  <p className="text-[10px] text-stone-400 truncate">
                    {user.email || ''}
                  </p>
                </div>

                <button
                  id="btn-sign-out"
                  onClick={onSignOut}
                  className="p-2 text-stone-400 hover:text-rose-400 hover:bg-stone-800/80 rounded-lg transition-colors"
                  title="Sign out / Switch account"
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

