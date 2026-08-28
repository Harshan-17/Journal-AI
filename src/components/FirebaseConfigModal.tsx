import React, { useState } from 'react';
import { X, Database, Key, CheckCircle, AlertTriangle, RefreshCw, Trash2, ExternalLink } from 'lucide-react';
import { getActiveFirebaseConfig, saveCustomFirebaseConfig, clearCustomFirebaseConfig } from '../firebase';

interface FirebaseConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FirebaseConfigModal: React.FC<FirebaseConfigModalProps> = ({ isOpen, onClose }) => {
  const currentConfig = getActiveFirebaseConfig();
  const isUsingCustom = typeof window !== 'undefined' && Boolean(localStorage.getItem('custom_firebase_config'));

  const [apiKey, setApiKey] = useState(currentConfig.apiKey || '');
  const [projectId, setProjectId] = useState(currentConfig.projectId || '');
  const [authDomain, setAuthDomain] = useState(currentConfig.authDomain || '');
  const [appId, setAppId] = useState(currentConfig.appId || '');
  const [databaseId, setDatabaseId] = useState(currentConfig.firestoreDatabaseId || '(default)');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey.trim() || !projectId.trim()) {
      setStatusMessage('API Key and Project ID are required.');
      return;
    }

    saveCustomFirebaseConfig({
      apiKey: apiKey.trim(),
      projectId: projectId.trim(),
      authDomain: authDomain.trim() || `${projectId.trim()}.firebaseapp.com`,
      appId: appId.trim() || currentConfig.appId,
      firestoreDatabaseId: databaseId.trim() || '(default)',
      storageBucket: `${projectId.trim()}.firebasestorage.app`,
      messagingSenderId: currentConfig.messagingSenderId || '',
    });
  };

  const handleResetToDefault = () => {
    clearCustomFirebaseConfig();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-stone-900 border border-stone-800 rounded-2xl w-full max-w-xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-stone-100">
        {/* Header */}
        <div className="p-5 border-b border-stone-800 flex items-center justify-between bg-stone-900/90">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-stone-100">Firebase & Database Configuration</h3>
              <p className="text-xs text-stone-400">Manage Cloud Firestore & Google Authentication credentials</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-100 hover:bg-stone-800 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-6 overflow-y-auto space-y-4 text-xs">
          {isUsingCustom ? (
            <div className="p-3 bg-amber-950/40 border border-amber-800/60 rounded-xl flex items-center justify-between">
              <div className="flex items-center space-x-2 text-amber-300">
                <CheckCircle className="w-4 h-4 shrink-0" />
                <span>Using Custom Firebase Project Credentials</span>
              </div>
              <button
                type="button"
                onClick={handleResetToDefault}
                className="px-2.5 py-1 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-lg font-medium transition-colors flex items-center space-x-1"
              >
                <Trash2 className="w-3 h-3 text-rose-400" />
                <span>Reset to Default</span>
              </button>
            </div>
          ) : (
            <div className="p-3 bg-stone-950/60 border border-stone-800 rounded-xl flex items-start space-x-2.5 text-stone-300">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-stone-200">Default Project Binding</p>
                <p className="text-[11px] text-stone-400 mt-0.5">
                  Currently pointing to <code className="text-amber-300">{currentConfig.projectId}</code>. You can inspect or customize your Firebase Web App credentials below.
                </p>
              </div>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-stone-300 font-medium">Firebase API Key</label>
            <input
              type="text"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="AIzaSy..."
              className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-xs font-mono text-stone-200 focus:outline-none focus:border-amber-500/60"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-stone-300 font-medium">Project ID</label>
              <input
                type="text"
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                placeholder="my-firebase-project"
                className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-xs font-mono text-stone-200 focus:outline-none focus:border-amber-500/60"
              />
            </div>

            <div className="space-y-1">
              <label className="text-stone-300 font-medium">Auth Domain</label>
              <input
                type="text"
                value={authDomain}
                onChange={(e) => setAuthDomain(e.target.value)}
                placeholder="my-project.firebaseapp.com"
                className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-xs font-mono text-stone-200 focus:outline-none focus:border-amber-500/60"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-stone-300 font-medium">App ID</label>
              <input
                type="text"
                value={appId}
                onChange={(e) => setAppId(e.target.value)}
                placeholder="1:123456789:web:abcdef"
                className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-xs font-mono text-stone-200 focus:outline-none focus:border-amber-500/60"
              />
            </div>

            <div className="space-y-1">
              <label className="text-stone-300 font-medium">Firestore Database ID</label>
              <input
                type="text"
                value={databaseId}
                onChange={(e) => setDatabaseId(e.target.value)}
                placeholder="(default) or custom databaseId"
                className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-xs font-mono text-stone-200 focus:outline-none focus:border-amber-500/60"
              />
            </div>
          </div>

          {statusMessage && (
            <p className="text-xs text-rose-400 font-medium">{statusMessage}</p>
          )}

          <div className="pt-2 flex items-center justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-xl font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-stone-950 font-semibold rounded-xl transition-all shadow-sm"
            >
              Apply & Reload App
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
