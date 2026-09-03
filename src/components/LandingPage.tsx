import React, { useState } from 'react';
import {
  Sparkles,
  Shield,
  Brain,
  FileText,
  AlertCircle,
  Lock,
  Compass,
} from 'lucide-react';
import { useAppTheme } from '../context/ThemeContext';
import AeroShards from './AeroShards';
import { LiquidButton } from './ui/liquid-glass-button';

interface LandingPageProps {
  onSignIn: () => Promise<void>;
  onSignInGuest?: () => Promise<void>;
  onOpenSecurity?: () => void;
  onOpenFirebaseConfig?: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onSignIn,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState<{
    title: string;
    detail: string;
  } | null>(null);

  const { themeConfig, celebrate } = useAppTheme();

  const handleSignInClick = async () => {
    try {
      setIsLoading(true);
      setAuthError(null);
      await onSignIn();
      celebrate(50);
    } catch (err: any) {
      console.error('Sign-in failed:', err);
      const code = err?.code || '';
      const message = err?.message || '';

      if (code === 'auth/popup-closed-by-user') {
        setAuthError({
          title: 'Sign-In Cancelled',
          detail: 'The Google authentication window was closed before completing. Please try again.',
        });
      } else if (code === 'auth/popup-blocked') {
        setAuthError({
          title: 'Popup Blocked',
          detail: 'Your browser prevented the login window. Please allow popups for this site to sign in.',
        });
      } else {
        setAuthError({
          title: 'Sign-In Notice',
          detail: message || 'Unable to connect to Google Sign-In right now. Please check your connection and try again.',
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-[calc(100vh-3.75rem)] flex flex-col justify-between text-neutral-100 overflow-hidden">
      {/* ========================================================================= */}
      {/* 1. FULL-SCREEN INTERACTIVE AEROSHARDS BACKGROUND */}
      {/* ========================================================================= */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none transition-all duration-700 bg-neutral-950">
        <div className="w-full h-full opacity-100 transition-opacity duration-500">
          <AeroShards
            onError={() => {}}
            backgroundColor="#120F17"
            shardColor="#896ABD"
            accentColor="#A855F7"
            placement="full"
            flow="stream"
            material="pearl"
            detail="balanced"
            effect="none"
            scale={1}
            spread={1}
            depth={1}
            speed={1}
            spin={1}
            interaction="repel"
            density={1.5}
            shardSize={1.1}
            stretch={1}
            turbulence={1}
            glow={1}
            edgeSoftness={2}
            bloom={0.5}
            grain={0.05}
            chromaticAberration={0.0075}
            transitionDuration={1}
            interactionRadius={1.5}
            interactionStrength={0.5}
            rippleIntensity={1}
            holdToGather={true}
          />
        </div>
        
        {/* Subtle gradient to ensure text remains readable */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-neutral-950/80 pointer-events-none" />
      </div>

      {/* ========================================================================= */}
      {/* 2. FOREGROUND SEAMLESS LOGIN CONTENT (ALIGNED DIRECTLY WITH BG) */}
      {/* ========================================================================= */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center max-w-xl mx-auto w-full px-4 sm:px-6 py-12 sm:py-16">
        <div className="w-full text-center space-y-8">
          {/* Heading & Subheading */}
          <div className="space-y-4">
            <h1 className={`text-5xl sm:text-6xl lg:text-7xl font-['Playfair_Display'] font-medium tracking-tight leading-none bg-gradient-to-r ${themeConfig.textGradient} bg-clip-text text-transparent`}>
              Journal <span className="italic">Gem</span>
            </h1>

            <p className="text-sm sm:text-base text-neutral-300 max-w-lg mx-auto leading-relaxed font-light">
              A serene sanctuary where your scattered thoughts gently unfold into crystal clarity.
            </p>
          </div>

          {/* Authentication Area */}
          <div className="space-y-4 pt-2 max-w-md mx-auto">
            {authError && (
              <div className="w-full p-3.5 bg-rose-950/80 border border-rose-800/80 rounded-2xl text-xs text-rose-200 flex items-start space-x-2.5 text-left animate-in fade-in duration-150 backdrop-blur-md">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <div className="flex-1 space-y-1">
                  <p className="font-semibold text-rose-200">{authError.title}</p>
                  <p className="text-rose-300/80 leading-normal">{authError.detail}</p>
                </div>
              </div>
            )}

            <LiquidButton
              id="btn-google-signin"
              onClick={handleSignInClick}
              disabled={isLoading}
              variant="default"
              size="xxl"
              className="w-[280px] sm:w-[320px] sm:text-base font-bold shadow-xl cursor-pointer text-white mx-auto"
            >
              {isLoading ? (
                <div className="flex items-center space-x-2.5">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Connecting to Google...</span>
                </div>
              ) : (
                <>
                  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
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
                  <span>Sign in with Google</span>
                </>
              )}
            </LiquidButton>

            <div className="pt-2 flex items-center justify-center space-x-2 text-xs text-neutral-400">
              <Lock className="w-3.5 h-3.5 text-neutral-400" />
              <span>Private session isolation • Encrypted persistence</span>
            </div>
          </div>

          {/* Three Clean Trust Highlights */}
          <div className="grid grid-cols-3 gap-3 pt-6 border-t border-neutral-800/60 max-w-md mx-auto text-center">
            <div className="space-y-1">
              <Brain className={`w-4 h-4 mx-auto ${themeConfig.accentText}`} />
              <p className="text-[11px] font-semibold text-neutral-200">Reflective AI</p>
              <p className="text-[10px] text-neutral-400">Multi-turn dialogue</p>
            </div>
            <div className="space-y-1">
              <Shield className={`w-4 h-4 mx-auto ${themeConfig.accentText}`} />
              <p className="text-[11px] font-semibold text-neutral-200">Private & Secure</p>
              <p className="text-[10px] text-neutral-400">Owner-isolated data</p>
            </div>
            <div className="space-y-1">
              <FileText className={`w-4 h-4 mx-auto ${themeConfig.accentText}`} />
              <p className="text-[11px] font-semibold text-neutral-200">Instant Synthesis</p>
              <p className="text-[10px] text-neutral-400">Clear action roadmaps</p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="relative z-10 text-center text-xs text-neutral-400 pb-6">
        <span>JournalGem — Mindful journaling and thinking.</span>
      </footer>
    </div>
  );
};
