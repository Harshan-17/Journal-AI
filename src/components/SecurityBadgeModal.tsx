import React from 'react';
import { X, ShieldCheck, Lock, Key, Server, Database, CheckCircle, Code } from 'lucide-react';

interface SecurityBadgeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SecurityBadgeModal: React.FC<SecurityBadgeModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-stone-900 border border-stone-800 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl shadow-stone-950 overflow-hidden text-stone-100">
        {/* Header */}
        <div className="p-5 border-b border-stone-800 flex items-center justify-between bg-stone-900/90">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-stone-100">Security Architecture & Isolation Invariants</h3>
              <p className="text-xs text-stone-400">Production-Grade OWASP & Cloud Run Compliance</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-100 hover:bg-stone-800 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs text-stone-300">
          {/* Security Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="p-3.5 rounded-xl bg-stone-950/60 border border-stone-800 space-y-1.5">
              <div className="flex items-center space-x-2 text-emerald-400 font-semibold text-xs">
                <Database className="w-3.5 h-3.5" />
                <span>Strict Firestore Data Isolation</span>
              </div>
              <p className="text-[11px] text-stone-400 leading-relaxed">
                Rules enforce <code className="text-amber-400">request.auth.uid == userId</code> on all subcollections. Cross-tenant reads/writes are blocked at database engine level.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-stone-950/60 border border-stone-800 space-y-1.5">
              <div className="flex items-center space-x-2 text-sky-400 font-semibold text-xs">
                <Lock className="w-3.5 h-3.5" />
                <span>Federated Authentication</span>
              </div>
              <p className="text-[11px] text-stone-400 leading-relaxed">
                Google Sign-In via Firebase Auth. No plaintext passwords or password hashes are handled or stored in custom application code.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-stone-950/60 border border-stone-800 space-y-1.5">
              <div className="flex items-center space-x-2 text-amber-400 font-semibold text-xs">
                <Server className="w-3.5 h-3.5" />
                <span>Server-Side API Proxying</span>
              </div>
              <p className="text-[11px] text-stone-400 leading-relaxed">
                The Gemini API key is accessed exclusively server-side via <code className="text-amber-400">process.env.GEMINI_API_KEY</code>. Zero client-side key leakage.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-stone-950/60 border border-stone-800 space-y-1.5">
              <div className="flex items-center space-x-2 text-purple-400 font-semibold text-xs">
                <Key className="w-3.5 h-3.5" />
                <span>Resilient Fallback Ladder</span>
              </div>
              <p className="text-[11px] text-stone-400 leading-relaxed">
                Automatic recovery matrix across <code className="text-purple-300">gemini-3.6-flash</code> &rarr; <code className="text-purple-300">gemini-3.1-flash-lite</code> &rarr; <code className="text-purple-300">gemini-flash-latest</code>.
              </p>
            </div>
          </div>

          {/* Firestore Rules Display */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-stone-200">
              <span className="flex items-center space-x-1.5">
                <Code className="w-3.5 h-3.5 text-amber-400" />
                <span>Deployed Firestore Security Rules (`firestore.rules`)</span>
              </span>
              <span className="text-[10px] text-emerald-400 font-mono flex items-center space-x-1">
                <CheckCircle className="w-3 h-3" />
                <span>Enforced & Deployed</span>
              </span>
            </div>
            <pre className="p-3.5 bg-stone-950 border border-stone-800/90 rounded-xl font-mono text-[11px] text-stone-300 overflow-x-auto leading-relaxed">
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
            <h4 className="text-xs font-semibold text-stone-200">Verification & Campaign Labeling</h4>
            <div className="p-3 bg-stone-950 border border-stone-800 rounded-xl space-y-2 font-mono text-[11px] text-stone-400">
              <div>
                <span className="text-stone-400"># Cloud Run Verification Label:</span>
                <p className="text-amber-400 font-semibold mt-0.5">dev-tutorial=cloud-run-ai-challenge</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-stone-800 flex justify-end bg-stone-900/90">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-stone-800 hover:bg-stone-700 text-stone-200 font-medium text-xs rounded-xl transition-colors"
          >
            Close Security Specifications
          </button>
        </div>
      </div>
    </div>
  );
};
