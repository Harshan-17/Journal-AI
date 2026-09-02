import React, { useState } from 'react';
import { X, Sparkles, Copy, Check, Download, Brain } from 'lucide-react';
import Markdown from 'react-markdown';
import { useAppTheme } from '../context/ThemeContext';

interface SummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  summary: string;
}

export const SummaryModal: React.FC<SummaryModalProps> = ({
  isOpen,
  onClose,
  title,
  summary,
}) => {
  const [copied, setCopied] = useState(false);
  const { themeConfig, celebrate } = useAppTheme();

  if (!isOpen) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(summary);
      setCopied(true);
      celebrate(25);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy summary:', err);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([`# ${title || 'Reflection'} - Summary\n\n${summary}`], {
      type: 'text/markdown;charset=utf-8;',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(title || 'reflection').toLowerCase().replace(/[^a-z0-9]+/g, '-')}-summary.md`;
    a.click();
    URL.revokeObjectURL(url);
    celebrate(35);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
      <div className="bg-neutral-900/95 border border-neutral-800 rounded-3xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl shadow-neutral-950 overflow-hidden text-neutral-100 backdrop-blur-xl">
        {/* Header */}
        <div className="p-5 border-b border-neutral-800/80 flex items-center justify-between bg-black/80">
          <div className="flex items-center space-x-3">
            <div className={`w-9 h-9 rounded-xl bg-gradient-to-tr ${themeConfig.primaryGradient} flex items-center justify-center text-neutral-950 font-bold shadow-md`}>
              <Brain className="w-5 h-5" />
            </div>
            <div>
              <h3 className={`text-base font-serif font-semibold bg-gradient-to-r ${themeConfig.textGradient} bg-clip-text text-transparent`}>
                Key Takeaways & Synthesis
              </h3>
              <p className="text-xs text-neutral-400 truncate max-w-md">{title || 'Untitled Reflection'}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-neutral-100 hover:bg-neutral-800 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Markdown Content */}
        <div className="p-6 overflow-y-auto space-y-4 text-neutral-200 text-sm leading-relaxed">
          <div className="prose prose-invert max-w-none prose-headings:text-neutral-100 prose-p:text-neutral-300 prose-li:text-neutral-300 prose-strong:text-cyan-300 prose-code:text-cyan-300">
            <Markdown>{summary}</Markdown>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-neutral-800/80 flex items-center justify-between bg-black/80">
          <div className="flex items-center space-x-1.5 text-xs text-neutral-400">
            <Sparkles className={`w-3.5 h-3.5 ${themeConfig.accentText}`} />
            <span>Synthesized Insights</span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleCopy}
              className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold text-neutral-300 hover:text-neutral-100 bg-neutral-850 hover:bg-neutral-800 border border-neutral-750 rounded-xl transition-all active:scale-95 cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>

            <button
              onClick={handleDownload}
              className={`flex items-center space-x-1.5 px-3.5 py-1.5 text-xs font-bold ${themeConfig.accentBg} rounded-xl shadow-md transition-all active:scale-95 cursor-pointer`}
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};


