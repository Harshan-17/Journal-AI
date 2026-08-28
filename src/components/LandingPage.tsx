import React, { useState } from 'react';
import {
  Sparkles,
  ShieldCheck,
  Lock,
  ArrowRight,
  Brain,
  History,
  CheckCircle2,
  AlertCircle,
  Play,
  Settings,
  UserCheck,
  Database,
  RefreshCw,
  UserCircle2,
} from 'lucide-react';

interface LandingPageProps {
  onSignIn: () => Promise<void>;
  onSignInGuest: () => Promise<void>;
  onOpenSecurity: () => void;
  onOpenFirebaseConfig: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onSignIn,
  onSignInGuest,
  onOpenSecurity,
  onOpenFirebaseConfig,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isGuestLoading, setIsGuestLoading] = useState(false);
  const [authError, setAuthError] = useState<{
    title: string;
    detail: string;
    isCodeExchangeIssue?: boolean;
    isApiKeyIssue?: boolean;
  } | null>(null);

  const handleSignInClick = async () => {
    try {
      setIsLoading(true);
      setAuthError(null);
      await onSignIn();
    } catch (err: any) {
      console.error('Sign-in failed:', err);
      const code = err?.code || '';
      const message = err?.message || '';

      if (code === 'auth/popup-closed-by-user') {
        setAuthError({
          title: 'Popup Closed',
          detail: 'The Google sign-in window was closed before completing. Please try again.',
        });
      } else if (code === 'auth/popup-blocked') {
        setAuthError({
          title: 'Popup Blocked',
          detail: 'Your browser blocked the Google authentication popup. Please allow popups for this site and try again.',
        });
      } else if (
        message.includes('CODE_EXCHANGE') ||
        message.includes('5XX') ||
        message.includes('malformed response') ||
        code === 'auth/invalid-credential'
      ) {
        setAuthError({
          title: 'Google OAuth Code Exchange Notice',
          detail:
            'Google OAuth returned a temporary exchange response error (CODE_EXCHANGE / 5XX). You can retry Google Sign-In or continue immediately using Guest Mode.',
          isCodeExchangeIssue: true,
        });
      } else if (
        code.includes('api-key-not-valid') ||
        message.includes('api-key-not-valid') ||
        code.includes('app-not-authorized') ||
        code.includes('configuration-not-found')
      ) {
        setAuthError({
          title: 'Firebase Project Configuration Notice',
          detail:
            'Firebase Authentication returned a configuration notice. Please ensure your project is properly configured or supply custom Firebase keys in settings.',
          isApiKeyIssue: true,
        });
      } else {
        setAuthError({
          title: 'Authentication Notice',
          detail:
            message ||
            'Unable to complete sign-in at this moment. You can retry or enter with Guest Mode to start immediately.',
          isCodeExchangeIssue: true,
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGuestSignInClick = async () => {
    try {
      setIsGuestLoading(true);
      setAuthError(null);
      await onSignInGuest();
    } catch (err: any) {
      console.error('Guest sign-in failed:', err);
      setAuthError({
        title: 'Guest Sign-in Notice',
        detail:
          err?.message ||
          'Unable to initialize guest session. Please check your network connection.',
      });
    } finally {
      setIsGuestLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col justify-between bg-gradient-to-b from-stone-950 via-stone-900 to-stone-950 text-stone-100 px-4 sm:px-6 lg:px-8 py-12">
      <div className="max-w-4xl mx-auto w-full space-y-12">
        {/* Top Hero Section */}
        <div className="text-center space-y-6 pt-4">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/25 text-amber-300 text-xs font-medium tracking-wide">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI-Powered Reflective Journaling & Brainstorming</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-stone-100 leading-tight">
            Conversational Clarity, <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-amber-400 to-amber-500">
              Guaranteed Data Isolation.
            </span>
          </h1>

          <p className="text-base sm:text-lg text-stone-300 max-w-2xl mx-auto leading-relaxed">
            Write uninhibited reflections, brainstorm solutions, and converse with Gemini 3.6 Flash.
            Every entry is saved exclusively to your private Firestore collection, enforced by server-level security rules.
          </p>

          {/* Authentication Action Box */}
          <div className="pt-4 flex flex-col items-center justify-center space-y-4">
            {authError && (
              <div className="w-full max-w-lg p-4 bg-rose-950/70 border border-rose-800/80 rounded-2xl text-xs text-rose-200 flex flex-col space-y-3 text-left animate-in fade-in duration-200 shadow-lg shadow-rose-950/40">
                <div className="flex items-start space-x-2.5">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <div className="space-y-1 flex-1">
                    <p className="font-semibold text-rose-300">{authError.title}</p>
                    <p className="text-rose-300/90 leading-relaxed">{authError.detail}</p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-rose-900/60">
                  <button
                    type="button"
                    onClick={handleSignInClick}
                    disabled={isLoading}
                    className="px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-semibold rounded-lg transition-colors flex items-center space-x-1.5"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                    <span>Retry Google Sign-In</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleGuestSignInClick}
                    disabled={isGuestLoading}
                    className="px-3 py-1.5 bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border border-emerald-700/60 text-xs font-semibold rounded-lg transition-colors flex items-center space-x-1.5"
                  >
                    <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Continue in Guest Mode</span>
                  </button>

                  <button
                    type="button"
                    onClick={onOpenFirebaseConfig}
                    className="px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-medium rounded-lg transition-colors flex items-center space-x-1.5"
                  >
                    <Settings className="w-3.5 h-3.5" />
                    <span>Firebase Settings</span>
                  </button>
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 w-full max-w-md">
              <button
                id="btn-google-signin"
                onClick={handleSignInClick}
                disabled={isLoading || isGuestLoading}
                className="w-full sm:w-auto flex-1 group relative inline-flex items-center justify-center space-x-3 px-6 py-3.5 bg-stone-100 hover:bg-white text-stone-950 font-semibold text-sm rounded-xl shadow-xl shadow-stone-950/50 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-75 cursor-pointer"
              >
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-stone-900 border-t-transparent rounded-full animate-spin" />
                    <span>Connecting...</span>
                  </div>
                ) : (
                  <>
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                    <span>Sign In with Google</span>
                  </>
                )}
              </button>

              <button
                id="btn-guest-signin"
                onClick={handleGuestSignInClick}
                disabled={isLoading || isGuestLoading}
                className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-5 py-3.5 bg-stone-900 hover:bg-stone-800 text-stone-200 border border-stone-700/80 font-medium text-sm rounded-xl transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-75 cursor-pointer"
                title="Enter with private guest credentials"
              >
                {isGuestLoading ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-stone-400 border-t-transparent rounded-full animate-spin" />
                    <span>Initializing...</span>
                  </div>
                ) : (
                  <>
                    <UserCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Guest Mode</span>
                  </>
                )}
              </button>
            </div>

            <div className="flex items-center space-x-4 text-xs text-stone-400 pt-1">
              <span className="flex items-center space-x-1.5">
                <Lock className="w-3.5 h-3.5 text-emerald-400" />
                <span>Federated Google Auth & Guest Mode</span>
              </span>
              <span>•</span>
              <button
                type="button"
                onClick={onOpenFirebaseConfig}
                className="hover:text-amber-300 underline underline-offset-2 flex items-center space-x-1"
              >
                <Database className="w-3.5 h-3.5" />
                <span>Firebase Settings</span>
              </button>
            </div>
          </div>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
          <div className="bg-stone-900/60 border border-stone-800 p-6 rounded-2xl space-y-3 backdrop-blur-sm">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Brain className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-stone-100">Multi-Turn Reflection</h3>
            <p className="text-sm text-stone-400 leading-relaxed">
              Engage in rich multi-turn dialogues with Gemini 3.6 Flash. Unpack complex dilemmas, explore alternative mindsets, and refine ideas.
            </p>
          </div>

          <div className="bg-stone-900/60 border border-stone-800 p-6 rounded-2xl space-y-3 backdrop-blur-sm">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-stone-100">Strict User Isolation</h3>
            <p className="text-sm text-stone-400 leading-relaxed">
              Every journal entry is stored under your personal UID collection with hardened Firestore security rules. Other users cannot query or read your thoughts.
            </p>
          </div>

          <div className="bg-stone-900/60 border border-stone-800 p-6 rounded-2xl space-y-3 backdrop-blur-sm">
            <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
              <History className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-stone-100">Past History & Summaries</h3>
            <p className="text-sm text-stone-400 leading-relaxed">
              Review previous sessions, search by topics, and instantly generate executive summaries and actionable checklists whenever needed.
            </p>
          </div>
        </div>

        {/* Security & Compliance Callout */}
        <div className="bg-gradient-to-r from-stone-900 via-stone-900/80 to-stone-900 border border-stone-800 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            <div className="w-10 h-10 rounded-full bg-emerald-950/60 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-stone-200">Security Architecture & OWASP Alignment</h4>
              <p className="text-xs text-stone-400">
                Server-side Secret Manager integration, resilient model fallback ladder, and parameter sanitization.
              </p>
            </div>
          </div>
          <button
            id="btn-landing-security-details"
            onClick={onOpenSecurity}
            className="px-4 py-2 text-xs font-medium text-stone-300 hover:text-stone-100 bg-stone-800 hover:bg-stone-700 rounded-xl transition-colors shrink-0"
          >
            Review Security Specifications
          </button>
        </div>
      </div>

      {/* Footer */}
      <footer className="text-center text-xs text-stone-400 pt-12 pb-4">
        Protected with Firebase Authentication & Cloud Firestore • Powered by Gemini 3.6 Flash
      </footer>
    </div>
  );
};

