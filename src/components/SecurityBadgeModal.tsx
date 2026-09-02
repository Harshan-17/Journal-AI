import React from 'react';
import { X, ShieldCheck, Lock, Key, Server, Database, CheckCircle, Code } from 'lucide-react';
import { useAppTheme } from '../context/ThemeContext';

interface SecurityBadgeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SecurityBadgeModal: React.FC<SecurityBadgeModalProps> = ({ isOpen, onClose }) => {
  const { themeConfig } = useAppTheme();
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
      <div className="bg-neutral-900/95 border border-neutral-800 rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-neutral-100 backdrop-blur-xl">
        {/* Header */}
        <div className="p-5 border-b border-neutral-800/80 flex items-center justify-between bg-black/80">
          <div className="flex items-center space-x-3">
            <div className={`w-9 h-9 rounded-xl bg-gradient-to-tr ${themeConfig.primaryGradient} text-neutral-950 flex items-center justify-center shadow-md font-bold`}>
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-neutral-100">Security Architecture & Isolation</h3>
              <p className="text-xs text-neutral-400">Enterprise Security Invariants & Isolation</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-neutral-100 hover:bg-neutral-800 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs text-neutral-300">
          {/* Security Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="p-4 rounded-2xl bg-black/70 border border-neutral-800/80 space-y-1.5 shadow-sm">
              <div className="flex items-center space-x-2 text-emerald-400 font-semibold text-xs">
                <Database className="w-3.5 h-3.5" />
                <span>Strict Firestore Data Isolation</span>
              </div>
              <p className="text-[11px] text-neutral-400 leading-relaxed">
                Rules enforce <code className="text-cyan-400 font-mono">request.auth.uid == userId</code> on all subcollections. Cross-tenant reads/writes are blocked at database engine level.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-black/70 border border-neutral-800/80 space-y-1.5 shadow-sm">
              <div className="flex items-center space-x-2 text-sky-400 font-semibold text-xs">
                <Lock className="w-3.5 h-3.5" />
                <span>Federated Authentication</span>
              </div>
              <p className="text-[11px] text-neutral-400 leading-relaxed">
                Google Sign-In via Firebase Auth. No plaintext passwords or password hashes are handled or stored in custom application code.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-black/70 border border-neutral-800/80 space-y-1.5 shadow-sm">
              <div className="flex items-center space-x-2 text-amber-400 font-semibold text-xs">
                <Server className="w-3.5 h-3.5" />
                <span>Server-Side API Proxying</span>
              </div>
              <p className="text-[11px] text-neutral-400 leading-relaxed">
                The Gemini API key is accessed exclusively server-side via <code className="text-amber-400 font-mono">process.env.GEMINI_API_KEY</code>. Zero client-side key leakage.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-black/70 border border-neutral-800/80 space-y-1.5 shadow-sm">
              <div className="flex items-center space-x-2 text-purple-400 font-semibold text-xs">
                <Key className="w-3.5 h-3.5" />
                <span>Resilient Fallback Ladder</span>
              </div>
              <p className="text-[11px] text-neutral-400 leading-relaxed">
                Automatic recovery matrix across <code className="text-purple-300 font-mono">gemini-3.6-flash</code> &rarr; <code className="text-purple-300 font-mono">gemini-3.1-flash-lite</code> &rarr; <code className="text-purple-300 font-mono">gemini-flash-latest</code>.
              </p>
            </div>
          </div>

          {/* Firestore Rules Display */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-neutral-200">
              <span className="flex items-center space-x-1.5">
                <Code className="w-3.5 h-3.5 text-cyan-400" />
                <span>Deployed Firestore Security Rules (`firestore.rules`)</span>
              </span>
              <span className="text-[10px] text-emerald-400 font-mono flex items-center space-x-1">
                <CheckCircle className="w-3 h-3" />
                <span>Enforced & Deployed</span>
              </span>
            </div>
            <pre className="p-4 bg-black border border-neutral-800 rounded-2xl font-mono text-[11px] text-neutral-300 overflow-x-auto leading-relaxed">
{`rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;

      match /entries/{entryId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
      match /interactions/{interactionId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
    }
  }
}`}
            </pre>
          </div>

          {/* Cloud Run Deployment & Campaign Label */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-neutral-200">Verification & Campaign Labeling</h4>
            <div className="p-3.5 bg-black border border-neutral-800 rounded-2xl space-y-2 font-mono text-[11px] text-neutral-400">
              <div>
                <span className="text-neutral-400"># Cloud Run Verification Label:</span>
                <p className="text-cyan-400 font-semibold mt-0.5 font-mono">dev-tutorial=cloud-run-ai-challenge</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-neutral-800/80 flex justify-end bg-black/80">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-semibold text-xs rounded-xl transition-colors cursor-pointer"
          >
            Close Security Specifications
          </button>
        </div>
      </div>
    </div>
  );
};
