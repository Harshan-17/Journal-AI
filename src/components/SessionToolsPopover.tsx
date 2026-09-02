import React, { useState, useRef, useEffect } from 'react';
import {
  SlidersHorizontal,
  Brain,
  Lightbulb,
  CheckSquare,
  FileText,
  MapPin,
  Tag,
  Download,
  Sparkles,
  X,
  Plus,
  Check,
} from 'lucide-react';
import { JournalEntry, ReflectionMode } from '../types';
import { useAppTheme } from '../context/ThemeContext';
import { Button as MovingBorderButton } from './ui/moving-border';
import { MOOD_TAGS } from '../utils/theme';

interface SessionToolsPopoverProps {
  entry: JournalEntry;
  onUpdateEntry: (updated: Partial<JournalEntry>) => void;
  onOpenLocationModal: () => void;
  onOpenSummaryModal: () => void;
  onGenerateSummary: () => Promise<void>;
  isSummarizing: boolean;
  onExportTranscript: () => void;
}

export const SessionToolsPopover: React.FC<SessionToolsPopoverProps> = ({
  entry,
  onUpdateEntry,
  onOpenLocationModal,
  onOpenSummaryModal,
  onGenerateSummary,
  isSummarizing,
  onExportTranscript,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [newTagInput, setNewTagInput] = useState('');
  const popoverRef = useRef<HTMLDivElement>(null);
  const { themeConfig, celebrate } = useAppTheme();

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const modes: { id: ReflectionMode; label: string; icon: any; desc: string }[] = [
    { id: 'reflect', label: 'Perspective', icon: Brain, desc: 'Deep clarity & cognitive reframing' },
    { id: 'brainstorm', label: 'Brainstorm', icon: Lightbulb, desc: 'Creative exploration & possibilities' },
    { id: 'actionable', label: 'Action Items', icon: CheckSquare, desc: 'Pragmatic steps & milestones' },
    { id: 'summarize', label: 'Synthesis', icon: FileText, desc: 'Core takeaways & synthesis' },
  ];

  const handleAddTag = () => {
    const tag = newTagInput.trim().replace(/^#/, '');
    if (!tag) return;
    const currentTags = entry.tags || [];
    if (!currentTags.includes(tag)) {
      onUpdateEntry({ tags: [...currentTags, tag] });
      celebrate(20);
    }
    setNewTagInput('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    const currentTags = entry.tags || [];
    onUpdateEntry({ tags: currentTags.filter((t) => t !== tagToRemove) });
  };

  const currentModeObj = modes.find((m) => m.id === entry.mode) || modes[0];
  const ModeIcon = currentModeObj.icon;

  return (
    <div className="relative" ref={popoverRef}>
            {/* Trigger Button */}
      <button
        id="btn-session-tools-trigger"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`h-8 flex items-center space-x-2 px-3 py-1.5 rounded-xl border text-xs font-medium transition-all duration-300 active:scale-95 cursor-pointer backdrop-blur-md hover:shadow-[0_0_15px_rgba(255,255,255,0.2)] ${
          isOpen
            ? 'bg-neutral-850 border-neutral-600 text-neutral-100 ring-1 ring-white/10 shadow-[0_0_20px_rgba(255,255,255,0.2)]'
            : 'bg-black border-white/20 text-neutral-300 hover:text-white hover:border-white/40'
        }`}
        title="Session focus and tools"
      >
        <SlidersHorizontal className="w-3.5 h-3.5 text-neutral-400" />
        <span className="font-semibold text-neutral-200">Options</span>
      </button>

      {/* Popover Dropdown */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 p-4 rounded-2xl bg-black border border-neutral-800 shadow-2xl ring-1 ring-white/10 z-50 animate-in fade-in zoom-in-95 duration-150 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-neutral-800/80">
            <div className="flex items-center space-x-2">
              <SlidersHorizontal className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-200">
                Reflection Tools
              </span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-neutral-400 hover:text-neutral-200 p-1 rounded-lg cursor-pointer transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* 1. Focus Mode Segmented Selector */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
              Focus Angle
            </span>
            <div className="grid grid-cols-2 gap-1.5">
              {modes.map((m) => {
                const Icon = m.icon;
                const isSelected = entry.mode === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => {
                      onUpdateEntry({ mode: m.id });
                    }}
                    className={`flex items-center space-x-2 p-2 rounded-xl text-xs font-medium text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-neutral-800 text-neutral-100 border border-neutral-700 shadow-xs'
                        : 'bg-neutral-900/60 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900 border border-transparent'
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-cyan-400' : 'text-neutral-500'}`} />
                    <span className="truncate">{m.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Mood State */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
              Mood & State
            </span>
            <div className="flex flex-wrap gap-1.5">
              {MOOD_TAGS.map((mood) => {
                const hasTag = entry.tags?.includes(mood.id);
                return (
                  <button
                    key={mood.id}
                    type="button"
                    onClick={() => {
                      if (hasTag) {
                        handleRemoveTag(mood.id);
                      } else {
                        onUpdateEntry({ tags: [...(entry.tags || []), mood.id] });
                        celebrate(20);
                      }
                    }}
                    className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs transition-all cursor-pointer ${
                      hasTag
                        ? 'bg-neutral-800 text-neutral-100 border border-neutral-600 font-medium'
                        : 'bg-neutral-900/60 text-neutral-400 hover:text-neutral-200 border border-neutral-850'
                    }`}
                  >
                    <span>{mood.emoji}</span>
                    <span>{mood.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 4. Tags */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
              Tags
            </span>
            <div className="flex flex-wrap items-center gap-1.5">
              {entry.tags?.map((t) => (
                <span
                  key={t}
                  className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md bg-neutral-900 border border-neutral-800 text-[11px] font-mono text-neutral-300"
                >
                  <span>#{t}</span>
                  <button
                    onClick={() => handleRemoveTag(t)}
                    className="text-neutral-500 hover:text-rose-400 ml-0.5 cursor-pointer"
                  >
                    <X className="w-2.5 h-2.5" />
                  </button>
                </span>
              ))}
              <div className="inline-flex items-center space-x-1">
                <input
                  type="text"
                  value={newTagInput}
                  onChange={(e) => setNewTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddTag();
                    }
                  }}
                  placeholder="add tag..."
                  className="bg-neutral-900 border border-neutral-800 rounded px-2 py-0.5 text-[11px] text-neutral-200 focus:outline-none focus:border-neutral-600 w-24"
                />
                <button
                  type="button"
                  onClick={handleAddTag}
                  className="text-neutral-400 hover:text-neutral-200 p-1 cursor-pointer"
                  title="Add tag"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>

          {/* 5. Summary & Export Actions */}
          <div className="pt-2 border-t border-neutral-800/80 flex items-center justify-between gap-2">
            {entry.summary ? (
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  onOpenSummaryModal();
                }}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-fuchsia-950/40 hover:bg-fuchsia-900/40 border border-fuchsia-800/50 text-xs font-semibold text-fuchsia-300 transition-colors cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>View Summary</span>
              </button>
            ) : (
              <button
                type="button"
                disabled={entry.messages.length < 2 || isSummarizing}
                onClick={async () => {
                  setIsOpen(false);
                  await onGenerateSummary();
                }}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 disabled:opacity-40 text-xs font-medium text-neutral-300 hover:text-white transition-colors cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-neutral-400" />
                <span>{isSummarizing ? 'Synthesizing...' : 'Generate Summary'}</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                onExportTranscript();
              }}
              disabled={entry.messages.length === 0}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 disabled:opacity-40 text-xs font-medium text-neutral-300 hover:text-white transition-colors cursor-pointer"
              title="Download as Markdown"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
