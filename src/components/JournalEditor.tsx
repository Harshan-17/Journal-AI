import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Sparkles,
  Brain,
  Lightbulb,
  CheckSquare,
  FileText,
  Copy,
  Check,
  Download,
  AlertCircle,
  RefreshCw,
  Clock,
  MapPin,
  X,
  Volume2,
  Square,
  Tag,
  Flame,
  Zap,
  VolumeX,
} from 'lucide-react';
import Markdown from 'react-markdown';
import { JournalEntry, ReflectionMode, PromptIdea } from '../types';
import { formatTimestamp } from '../utils/sanitize';
import { LocationPickerModal } from './LocationPickerModal';
import { useAppTheme } from '../context/ThemeContext';
import { MOOD_TAGS } from '../utils/theme';

interface JournalEditorProps {
  entry: JournalEntry;
  onUpdateEntry: (updated: Partial<JournalEntry>) => void;
  onSendMessage: (userText: string, mode: ReflectionMode) => Promise<void>;
  onGenerateSummary: () => Promise<void>;
  isGenerating: boolean;
  isSummarizing: boolean;
  error: string | null;
  onRetry: () => void;
  onOpenSummaryModal: () => void;
}

export const JournalEditor: React.FC<JournalEditorProps> = ({
  entry,
  onUpdateEntry,
  onSendMessage,
  onGenerateSummary,
  isGenerating,
  isSummarizing,
  error,
  onRetry,
  onOpenSummaryModal,
}) => {
  const [inputText, setInputText] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
  const [promptIdeas, setPromptIdeas] = useState<PromptIdea[]>([]);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [isTagInputVisible, setIsTagInputVisible] = useState(false);
  const [newTagText, setNewTagText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { themeConfig, celebrate } = useAppTheme();

  // Auto-scroll to bottom of conversation
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [entry.messages, isGenerating]);

  // Clean up speech synthesis on unmount
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Fetch prompt ideas
  useEffect(() => {
    const fetchPrompts = async () => {
      try {
        const res = await fetch('/api/gemini/prompts');
        if (res.ok) {
          const data = await res.json();
          setPromptIdeas(data.prompts || []);
        }
      } catch (e) {
        console.warn('Failed to load prompts:', e);
      }
    };
    fetchPrompts();
  }, []);

  // Handle message submission
  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const text = inputText.trim();
    if (!text || isGenerating) return;

    setInputText('');
    await onSendMessage(text, entry.mode);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleCopyMessage = async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error('Copy failed:', err);
    }
  };

  const handleToggleSpeak = (id: string, text: string) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;

    if (speakingMessageId === id) {
      window.speechSynthesis.cancel();
      setSpeakingMessageId(null);
      return;
    }

    window.speechSynthesis.cancel();
    const cleanText = text.replace(/[*#`_\[\]]/g, '');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.0;
    utterance.onend = () => setSpeakingMessageId(null);
    utterance.onerror = () => setSpeakingMessageId(null);
    setSpeakingMessageId(id);
    window.speechSynthesis.speak(utterance);
  };

  const handleAddTag = (tagToAdd: string) => {
    const trimmed = tagToAdd.trim().replace(/^#/, '');
    if (!trimmed) return;
    const currentTags = entry.tags || [];
    if (!currentTags.includes(trimmed)) {
      onUpdateEntry({ tags: [...currentTags, trimmed] });
      celebrate(25);
    }
    setNewTagText('');
    setIsTagInputVisible(false);
  };

  const handleRemoveTag = (tagToRemove: string) => {
    const currentTags = entry.tags || [];
    onUpdateEntry({ tags: currentTags.filter((t) => t !== tagToRemove) });
  };

  const handleExportTranscript = () => {
    let transcript = `# ${entry.title || 'Journal Reflection'}\n`;
    transcript += `Date: ${formatTimestamp(entry.createdAt)}\n`;
    if (entry.location) {
      transcript += `Location: ${entry.location.name || 'Pinned Location'} (${entry.location.formattedAddress || `${entry.location.latitude}, ${entry.location.longitude}`})\n`;
    }
    if (entry.tags && entry.tags.length > 0) {
      transcript += `Tags: ${entry.tags.map((t) => `#${t}`).join(' ')}\n`;
    }
    transcript += `Mode: ${entry.mode}\n\n---\n\n`;

    entry.messages.forEach((msg) => {
      const sender = msg.role === 'user' ? 'You' : 'Reflect AI';
      transcript += `### ${sender} (${msg.timestamp})\n\n${msg.content}\n\n`;
    });

    if (entry.summary) {
      transcript += `\n---\n\n## Executive Summary\n\n${entry.summary}\n`;
    }

    const blob = new Blob([transcript], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(entry.title || 'reflection').toLowerCase().replace(/[^a-z0-9]+/g, '-')}-transcript.md`;
    a.click();
    URL.revokeObjectURL(url);
    celebrate(35);
  };

  const modes: { id: ReflectionMode; label: string; icon: any; desc: string; gradient: string }[] = [
    { id: 'reflect', label: 'Perspective', icon: Brain, desc: 'Deep clarity & cognitive reframing', gradient: 'from-violet-500 to-indigo-500' },
    { id: 'brainstorm', label: 'Brainstorm', icon: Lightbulb, desc: 'Creative ideas & multi-angle thinking', gradient: 'from-cyan-400 to-teal-400' },
    { id: 'actionable', label: 'Action Items', icon: CheckSquare, desc: 'Concrete execution & checklists', gradient: 'from-emerald-400 to-green-500' },
    { id: 'summarize', label: 'Synthesis', icon: FileText, desc: 'Core takeaways & structured overview', gradient: 'from-fuchsia-500 to-pink-500' },
  ];

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-3.75rem)] bg-stone-950/60 backdrop-blur-md text-stone-100 overflow-hidden relative z-10">
      {/* Top Header / Metadata Bar */}
      <div className="p-4 sm:px-6 border-b border-stone-800/80 bg-stone-950/85 backdrop-blur-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Title & Metadata Editor */}
        <div className="flex-1 min-w-0 space-y-1">
          <input
            id="input-entry-title"
            type="text"
            value={entry.title}
            onChange={(e) => onUpdateEntry({ title: e.target.value })}
            placeholder="Name your reflection session..."
            className="w-full bg-transparent font-serif text-lg sm:text-xl text-stone-100 placeholder-stone-400 focus:outline-none pb-0.5 transition-colors"
          />
          <div className="flex flex-wrap items-center gap-2 text-xs text-stone-400">
            <span className="flex items-center space-x-1">
              <Clock className="w-3 h-3" />
              <span>{formatTimestamp(entry.createdAt)}</span>
            </span>

            {/* Tags Pills */}
            {entry.tags && entry.tags.length > 0 && (
              <div className="flex items-center gap-1.5 flex-wrap">
                {entry.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-lg bg-stone-900/90 border border-stone-800 text-[11px] font-mono text-stone-300 shadow-xs"
                  >
                    <span>#{tag}</span>
                    <button
                      onClick={() => handleRemoveTag(tag)}
                      className="text-stone-400 hover:text-rose-400 transition-colors cursor-pointer"
                      title="Remove tag"
                    >
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Add Tag Trigger */}
            {isTagInputVisible ? (
              <div className="inline-flex items-center space-x-1">
                <input
                  type="text"
                  value={newTagText}
                  onChange={(e) => setNewTagText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddTag(newTagText);
                    } else if (e.key === 'Escape') {
                      setIsTagInputVisible(false);
                    }
                  }}
                  placeholder="tag..."
                  autoFocus
                  className="bg-stone-900 border border-cyan-500/50 rounded-md px-2 py-0.5 text-[11px] text-stone-200 focus:outline-none w-24"
                />
                <button
                  onClick={() => handleAddTag(newTagText)}
                  className={`${themeConfig.accentText} font-bold text-[11px] cursor-pointer`}
                >
                  Add
                </button>
                <button
                  onClick={() => setIsTagInputVisible(false)}
                  className="text-stone-400 hover:text-stone-200 cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsTagInputVisible(true)}
                className="inline-flex items-center space-x-1 text-[11px] text-stone-400 hover:text-stone-200 transition-colors cursor-pointer"
                title="Add a tag to this reflection"
              >
                <Tag className="w-2.5 h-2.5" />
                <span>+ Tag</span>
              </button>
            )}
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-2 shrink-0 flex-wrap gap-y-2">
          {/* Location Pin Pill / Action */}
          {entry.location ? (
            <div className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold text-cyan-300 bg-cyan-950/40 hover:bg-cyan-900/40 border border-cyan-800/50 rounded-xl transition-all group backdrop-blur-md">
              <button
                id="btn-edit-location"
                type="button"
                onClick={() => setIsLocationModalOpen(true)}
                className="flex items-center space-x-1.5 min-w-0 cursor-pointer"
                title="View or change pinned location on map"
              >
                <MapPin className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span className="truncate max-w-[130px] sm:max-w-[170px]">
                  {entry.location.name || entry.location.formattedAddress || 'Pinned Location'}
                </span>
              </button>
              <button
                id="btn-remove-location-quick"
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onUpdateEntry({ location: undefined });
                }}
                className="text-stone-400 hover:text-rose-400 p-0.5 rounded transition-colors ml-1 cursor-pointer"
                title="Remove location"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <button
              id="btn-pin-location"
              type="button"
              onClick={() => setIsLocationModalOpen(true)}
              className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium text-stone-300 hover:text-white bg-stone-900/80 hover:bg-stone-850 border border-stone-800 rounded-xl transition-all active:scale-95 cursor-pointer backdrop-blur-md"
              title="Pin a place or memory"
            >
              <MapPin className="w-3.5 h-3.5 text-cyan-400" />
              <span>Pin Place</span>
            </button>
          )}

          {entry.summary ? (
            <button
              id="btn-view-summary"
              onClick={onOpenSummaryModal}
              className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold text-fuchsia-300 bg-fuchsia-950/40 hover:bg-fuchsia-900/40 border border-fuchsia-800/50 rounded-xl transition-all active:scale-95 cursor-pointer backdrop-blur-md"
            >
              <FileText className="w-3.5 h-3.5 text-fuchsia-400" />
              <span>Summary</span>
            </button>
          ) : (
            <button
              id="btn-generate-summary"
              disabled={entry.messages.length < 2 || isSummarizing}
              onClick={async () => {
                await onGenerateSummary();
                celebrate(40);
              }}
              className={`flex items-center space-x-1.5 px-3 py-1.5 text-xs font-bold ${themeConfig.accentBg} disabled:opacity-40 rounded-xl transition-all active:scale-95 cursor-pointer shadow-md`}
              title={entry.messages.length < 2 ? 'Write at least 1 turn to generate a summary' : 'Synthesize reflection into insights'}
            >
              {isSummarizing ? (
                <div className="w-3.5 h-3.5 border-2 border-stone-950 border-t-transparent rounded-full animate-spin" />
              ) : (
                <Sparkles className="w-3.5 h-3.5 fill-current" />
              )}
              <span>{isSummarizing ? 'Synthesizing...' : 'Summarize'}</span>
            </button>
          )}

          <button
            id="btn-export-transcript"
            onClick={handleExportTranscript}
            disabled={entry.messages.length === 0}
            className="p-2 text-stone-400 hover:text-white hover:bg-stone-900 border border-transparent hover:border-stone-800 rounded-xl transition-all disabled:opacity-40 active:scale-95 cursor-pointer"
            title="Export as Markdown"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Mode Selector Tabs */}
      <div className="px-4 sm:px-6 py-2 bg-stone-950/90 border-b border-stone-800/50 flex items-center justify-between overflow-x-auto scrollbar-none">
        <div className="flex items-center space-x-1.5">
          <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider hidden sm:inline mr-1">
            Focus:
          </span>
          {modes.map((m) => {
            const Icon = m.icon;
            const isActive = entry.mode === m.id;
            return (
              <button
                key={m.id}
                id={`btn-mode-${m.id}`}
                onClick={() => {
                  onUpdateEntry({ mode: m.id });
                }}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? `${themeConfig.accentBorder} ${themeConfig.accentText} bg-stone-900/90 shadow-xs border ring-1 ring-white/10`
                    : 'text-stone-400 hover:text-stone-200 hover:bg-stone-900/60'
                }`}
                title={m.desc}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{m.label}</span>
              </button>
            );
          })}
        </div>

        <span className="text-[11px] text-stone-400 hidden lg:inline font-mono">
          {modes.find((m) => m.id === entry.mode)?.desc}
        </span>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="mx-4 sm:mx-6 mt-3 p-3 bg-rose-950/70 border border-rose-800/80 rounded-xl text-xs text-rose-200 flex items-center justify-between animate-in fade-in duration-150 backdrop-blur-md">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={onRetry}
            className="flex items-center space-x-1 px-2.5 py-1 bg-rose-900 hover:bg-rose-800 text-rose-100 rounded-lg text-[11px] font-bold transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Retry</span>
          </button>
        </div>
      )}

      {/* Conversation Stream & Empty State */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 space-y-6">
        {entry.messages.length === 0 ? (
          <div className="max-w-2xl mx-auto py-8 text-center space-y-6">
            <div
              className={`w-14 h-14 rounded-2xl bg-gradient-to-tr ${themeConfig.primaryGradient} flex items-center justify-center text-stone-950 shadow-xl mx-auto animate-pulse`}
            >
              <Sparkles className="w-6 h-6 fill-stone-950/20" />
            </div>

            <div className="space-y-2">
              <h3 className={`text-2xl font-serif font-normal bg-gradient-to-r ${themeConfig.textGradient} bg-clip-text text-transparent`}>
                What would you like to explore today?
              </h3>
              <p className="text-sm text-stone-400 max-w-md mx-auto leading-relaxed">
                Write freely, explore a problem, or capture a sudden insight. The assistant will offer questions, perspective, and structured clarity.
              </p>
            </div>

            {/* Quick Inspiration Prompts with colorful hover borders */}
            {promptIdeas.length > 0 && (
              <div className="pt-2 space-y-3">
                <p className="text-xs font-bold uppercase tracking-wider text-stone-400">
                  Or begin with a spark:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-xl mx-auto text-left">
                  {promptIdeas.slice(0, 4).map((idea) => (
                    <button
                      key={idea.id}
                      onClick={() => setInputText(idea.text)}
                      className={`p-3.5 rounded-2xl bg-stone-900/60 border border-stone-800/80 hover:${themeConfig.accentBorder} hover:bg-stone-900/90 text-left transition-all group cursor-pointer active:scale-[0.98] backdrop-blur-md`}
                    >
                      <span className={`font-bold text-xs ${themeConfig.accentText} block mb-1`}>
                        {idea.title}
                      </span>
                      <span className="text-stone-300 text-xs line-clamp-2 leading-relaxed">
                        {idea.text}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          entry.messages.map((msg) => {
            const isUser = msg.role === 'user';
            const isCopied = copiedId === msg.id;
            const isSpeaking = speakingMessageId === msg.id;

            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} max-w-3xl ${
                  isUser ? 'ml-auto' : 'mr-auto'
                }`}
              >
                {/* Sender tag & timestamp */}
                <div className="flex items-center space-x-2 text-[11px] text-stone-400 mb-1 px-1">
                  <span className="font-semibold text-stone-300">
                    {isUser ? 'You' : 'Reflect AI'}
                  </span>
                  <span>•</span>
                  <span>{msg.timestamp}</span>
                </div>

                {/* Message Box */}
                <div
                  className={`group relative p-4 sm:p-5 rounded-2xl text-sm leading-relaxed ${
                    isUser
                      ? `${themeConfig.bubbleUser} rounded-br-xs shadow-md`
                      : `${themeConfig.bubbleAi} rounded-bl-xs shadow-md`
                  }`}
                >
                  {isUser ? (
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  ) : (
                    <div className="prose prose-invert max-w-none text-stone-200 prose-headings:text-stone-100 prose-p:text-stone-200 prose-li:text-stone-200 prose-strong:text-cyan-300 prose-code:text-cyan-300 prose-pre:bg-stone-950 prose-pre:border prose-pre:border-stone-800">
                      <Markdown>{msg.content}</Markdown>
                    </div>
                  )}

                  {/* Interactive Message Actions (Copy & Text-to-Speech) */}
                  <div className="absolute top-2 right-2 flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {!isUser && (
                      <button
                        onClick={() => handleToggleSpeak(msg.id, msg.content)}
                        className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                          isSpeaking
                            ? 'bg-cyan-500/20 text-cyan-300'
                            : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800'
                        }`}
                        title={isSpeaking ? 'Stop reading' : 'Read aloud'}
                      >
                        {isSpeaking ? <Square className="w-3.5 h-3.5 text-cyan-400 fill-cyan-400 animate-pulse" /> : <Volume2 className="w-3.5 h-3.5" />}
                      </button>
                    )}

                    <button
                      onClick={() => handleCopyMessage(msg.id, msg.content)}
                      className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                        isUser
                          ? 'text-stone-900 hover:bg-black/10'
                          : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800'
                      }`}
                      title="Copy message"
                    >
                      {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}

        {/* Streaming / Generation state bubble with animated gradient glowing wave */}
        {isGenerating && (
          <div className="flex flex-col items-start max-w-3xl mr-auto animate-in fade-in duration-200">
            <div className="flex items-center space-x-2 text-[11px] text-stone-400 mb-1 px-1">
              <span className="font-bold text-stone-300">Reflect AI</span>
              <span>•</span>
              <span className={`${themeConfig.accentText} animate-pulse font-mono`}>Generating insights...</span>
            </div>
            <div className={`bg-stone-900/90 border ${themeConfig.accentBorder} p-4 rounded-2xl rounded-bl-xs text-sm text-stone-200 flex items-center space-x-3 shadow-lg backdrop-blur-md`}>
              <div className="flex space-x-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-bounce [animation-delay:-0.3s]" />
                <span className="w-2.5 h-2.5 rounded-full bg-fuchsia-400 animate-bounce [animation-delay:-0.15s]" />
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-bounce" />
              </div>
              <span className="text-xs text-stone-300 font-medium">Reframing perspective...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Composer Box with Quick Mood Selector Pills */}
      <div className="p-4 sm:px-6 bg-stone-950/85 backdrop-blur-xl border-t border-stone-800/80">
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-2.5">
          {/* Quick Mood Reaction Chips */}
          <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 scrollbar-none">
            <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider shrink-0 mr-1">
              Mood:
            </span>
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
                      handleAddTag(mood.id);
                    }
                  }}
                  className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer active:scale-95 whitespace-nowrap ${
                    hasTag
                      ? `bg-gradient-to-r ${mood.color} text-stone-950 shadow-xs font-bold`
                      : 'bg-stone-900/80 hover:bg-stone-850 text-stone-300 border border-stone-800/80 hover:border-stone-700'
                  }`}
                >
                  <span>{mood.emoji}</span>
                  <span>{mood.label}</span>
                </button>
              );
            })}
          </div>

          <div className={`relative flex items-end rounded-2xl bg-stone-900/90 border border-stone-800 focus-within:${themeConfig.accentBorder} focus-within:ring-1 focus-within:ring-white/10 transition-all p-2 shadow-inner backdrop-blur-md`}>
            <textarea
              id="input-journal-message"
              ref={textareaRef}
              rows={2}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your reflection, question, or thought (Shift+Enter for newline)..."
              disabled={isGenerating}
              className="flex-1 bg-transparent px-3 py-2 text-sm text-stone-100 placeholder-stone-400 resize-none focus:outline-none max-h-40 min-h-[52px] leading-relaxed"
            />

            <button
              id="btn-send-message"
              type="submit"
              disabled={!inputText.trim() || isGenerating}
              className={`p-3 ${themeConfig.accentBg} font-bold rounded-xl shadow-md disabled:opacity-30 disabled:cursor-not-allowed transition-all shrink-0 cursor-pointer active:scale-95`}
              title="Send to assistant"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center justify-between text-[11px] text-stone-400 px-2">
            <span>Press <kbd className="px-1.5 py-0.5 rounded bg-stone-900 border border-stone-800 text-stone-300 font-mono text-[10px]">Enter</kbd> to send, <kbd className="px-1.5 py-0.5 rounded bg-stone-900 border border-stone-800 text-stone-300 font-mono text-[10px]">Shift+Enter</kbd> for newline</span>
            <span className="font-mono">{inputText.length} chars</span>
          </div>
        </form>
      </div>

      {/* Location Picker Modal */}
      <LocationPickerModal
        isOpen={isLocationModalOpen}
        onClose={() => setIsLocationModalOpen(false)}
        currentLocation={entry.location}
        onSaveLocation={(loc) => {
          onUpdateEntry({ location: loc || undefined });
          if (loc) celebrate(30);
        }}
      />
    </div>
  );
};


