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
  ChevronDown,
  MapPin,
  X,
} from 'lucide-react';
import Markdown from 'react-markdown';
import { JournalEntry, JournalMessage, ReflectionMode, PromptIdea, JournalLocation } from '../types';
import { formatTimestamp } from '../utils/sanitize';
import { LocationPickerModal } from './LocationPickerModal';

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
  const [promptIdeas, setPromptIdeas] = useState<PromptIdea[]>([]);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom of conversation
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [entry.messages, isGenerating]);

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

  const handleExportTranscript = () => {
    let transcript = `# ${entry.title || 'Journal Reflection'}\n`;
    transcript += `Date: ${formatTimestamp(entry.createdAt)}\n`;
    if (entry.location) {
      transcript += `Location: ${entry.location.name || 'Pinned Location'} (${entry.location.formattedAddress || `${entry.location.latitude}, ${entry.location.longitude}`})\n`;
    }
    transcript += `Mode: ${entry.mode}\n\n---\n\n`;

    entry.messages.forEach((msg) => {
      const sender = msg.role === 'user' ? 'You' : 'Gemini 3.6 Flash';
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
  };

  const modes: { id: ReflectionMode; label: string; icon: any; desc: string }[] = [
    { id: 'reflect', label: 'Answers & Insights', icon: Brain, desc: 'Direct answers, cognitive clarity & deep perspectives' },
    { id: 'brainstorm', label: 'Brainstorming', icon: Lightbulb, desc: 'Direct solutions, innovative ideas & alternative paths' },
    { id: 'actionable', label: 'Action Items', icon: CheckSquare, desc: 'Direct answers with concrete checklists & milestones' },
    { id: 'summarize', label: 'Synthesis', icon: FileText, desc: 'Core takeaways & structured overview' },
  ];

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-4rem)] bg-stone-950 text-stone-100 overflow-hidden">
      {/* Top Header / Metadata Bar */}
      <div className="p-4 sm:px-6 border-b border-stone-800/80 bg-stone-900/50 backdrop-blur-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Title Editor */}
        <div className="flex-1 min-w-0">
          <input
            id="input-entry-title"
            type="text"
            value={entry.title}
            onChange={(e) => onUpdateEntry({ title: e.target.value })}
            placeholder="Name your reflection session..."
            className="w-full bg-transparent font-semibold text-lg sm:text-xl text-stone-100 placeholder-stone-400 focus:outline-none focus:border-b focus:border-amber-500/80 pb-0.5 transition-colors"
          />
          <div className="flex items-center space-x-3 text-xs text-stone-400 mt-1">
            <span className="flex items-center space-x-1">
              <Clock className="w-3 h-3" />
              <span>{formatTimestamp(entry.createdAt)}</span>
            </span>
            <span>•</span>
            <span className="font-mono text-[11px] text-emerald-400">
              Isolated Firestore Record
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-2 shrink-0 flex-wrap gap-y-2">
          {/* Location Pin Pill / Action */}
          {entry.location ? (
            <div className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium text-amber-300 bg-amber-950/60 hover:bg-amber-900/60 border border-amber-800/60 rounded-xl transition-colors group">
              <button
                id="btn-edit-location"
                type="button"
                onClick={() => setIsLocationModalOpen(true)}
                className="flex items-center space-x-1.5 min-w-0"
                title="View or change pinned location on Google Map"
              >
                <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className="truncate max-w-[130px] sm:max-w-[180px]">
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
                className="text-stone-400 hover:text-rose-400 p-0.5 rounded transition-colors ml-1"
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
              className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium text-stone-300 hover:text-stone-100 bg-stone-800 hover:bg-stone-700 rounded-xl transition-colors"
              title="Pin a location to this reflection using Google Maps"
            >
              <MapPin className="w-3.5 h-3.5 text-amber-400" />
              <span>Pin Location</span>
            </button>
          )}

          {entry.summary ? (
            <button
              id="btn-view-summary"
              onClick={onOpenSummaryModal}
              className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium text-sky-300 bg-sky-950/60 hover:bg-sky-900/60 border border-sky-800/60 rounded-xl transition-colors"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>View Summary</span>
            </button>
          ) : (
            <button
              id="btn-generate-summary"
              disabled={entry.messages.length < 2 || isSummarizing}
              onClick={onGenerateSummary}
              className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium text-stone-300 hover:text-stone-100 bg-stone-800 hover:bg-stone-700 disabled:opacity-40 disabled:hover:bg-stone-800 rounded-xl transition-colors"
              title={entry.messages.length < 2 ? 'Write at least 1 turn to generate a summary' : 'Synthesize reflection into insights'}
            >
              {isSummarizing ? (
                <div className="w-3.5 h-3.5 border-2 border-stone-300 border-t-transparent rounded-full animate-spin" />
              ) : (
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              )}
              <span>{isSummarizing ? 'Synthesizing...' : 'Summarize Insights'}</span>
            </button>
          )}

          <button
            id="btn-export-transcript"
            onClick={handleExportTranscript}
            disabled={entry.messages.length === 0}
            className="p-2 text-stone-400 hover:text-stone-200 hover:bg-stone-800/80 rounded-xl transition-colors disabled:opacity-40"
            title="Export full transcript as Markdown file"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Mode Selector Tabs */}
      <div className="px-4 sm:px-6 py-2.5 bg-stone-900/30 border-b border-stone-800/40 flex items-center justify-between overflow-x-auto scrollbar-none">
        <div className="flex items-center space-x-2">
          <span className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider hidden sm:inline mr-1">
            Focus:
          </span>
          {modes.map((m) => {
            const Icon = m.icon;
            const isActive = entry.mode === m.id;
            return (
              <button
                key={m.id}
                id={`btn-mode-${m.id}`}
                onClick={() => onUpdateEntry({ mode: m.id })}
                className={`flex items-center space-x-1.5 px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 shadow-xs'
                    : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/50'
                }`}
                title={m.desc}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{m.label}</span>
              </button>
            );
          })}
        </div>

        <span className="text-[11px] text-stone-400 hidden lg:inline">
          {modes.find((m) => m.id === entry.mode)?.desc}
        </span>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="mx-4 sm:mx-6 mt-3 p-3 bg-rose-950/60 border border-rose-800/80 rounded-xl text-xs text-rose-200 flex items-center justify-between animate-in fade-in duration-150">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={onRetry}
            className="flex items-center space-x-1 px-2.5 py-1 bg-rose-900/80 hover:bg-rose-800 text-rose-100 rounded-lg text-[11px] font-medium transition-colors"
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
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mx-auto">
              <Sparkles className="w-6 h-6" />
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-stone-100">
                What's on your mind today?
              </h3>
              <p className="text-sm text-stone-400 max-w-md mx-auto leading-relaxed">
                Ask a question, brainstorm a problem, or write your reflections. Gemini 3.6 Flash will give you direct answers, insights, and actionable guidance based on your selected focus.
              </p>
            </div>

            {/* Prompt Inspiration Chips */}
            {promptIdeas.length > 0 && (
              <div className="pt-4 space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-stone-400">
                  Or pick a reflection prompt to start:
                </p>
                <div className="flex flex-col sm:flex-row flex-wrap justify-center gap-2 max-w-xl mx-auto">
                  {promptIdeas.slice(0, 4).map((idea) => (
                    <button
                      key={idea.id}
                      onClick={() => setInputText(idea.text)}
                      className="text-left px-3.5 py-2 rounded-xl bg-stone-900 border border-stone-800 hover:border-amber-500/40 hover:bg-stone-800/80 text-xs text-stone-300 hover:text-amber-200 transition-all text-balance"
                    >
                      <span className="font-semibold text-amber-400/90 block mb-0.5">{idea.title}</span>
                      <span className="text-stone-400 text-[11px]">{idea.text}</span>
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

            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} max-w-3xl ${
                  isUser ? 'ml-auto' : 'mr-auto'
                }`}
              >
                {/* Sender tag & timestamp */}
                <div className="flex items-center space-x-2 text-[11px] text-stone-400 mb-1 px-1">
                  <span className="font-medium text-stone-300">
                    {isUser ? 'You' : 'Gemini 3.6 Flash'}
                  </span>
                  <span>•</span>
                  <span>{msg.timestamp}</span>
                  {msg.modelUsed && !isUser && (
                    <>
                      <span>•</span>
                      <span className="font-mono text-[10px] text-amber-400/80">
                        {msg.modelUsed}
                      </span>
                    </>
                  )}
                </div>

                {/* Message Box */}
                <div
                  className={`group relative p-4 sm:p-5 rounded-2xl text-sm leading-relaxed ${
                    isUser
                      ? 'bg-amber-500 text-stone-950 font-medium rounded-br-xs shadow-md shadow-amber-950/20'
                      : 'bg-stone-900 border border-stone-800 text-stone-200 rounded-bl-xs shadow-sm'
                  }`}
                >
                  {isUser ? (
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  ) : (
                    <div className="prose prose-invert max-w-none text-stone-200 prose-headings:text-stone-100 prose-p:text-stone-200 prose-li:text-stone-200 prose-strong:text-amber-300 prose-code:text-amber-300 prose-pre:bg-stone-950 prose-pre:border prose-pre:border-stone-800">
                      <Markdown>{msg.content}</Markdown>
                    </div>
                  )}

                  {/* Copy Button */}
                  <button
                    onClick={() => handleCopyMessage(msg.id, msg.content)}
                    className={`absolute top-2 right-2 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity ${
                      isUser
                        ? 'text-stone-800 hover:bg-amber-600/30'
                        : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800'
                    }`}
                    title="Copy text"
                  >
                    {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            );
          })
        )}

        {/* Streaming / Generation state bubble */}
        {isGenerating && (
          <div className="flex flex-col items-start max-w-3xl mr-auto animate-in fade-in duration-200">
            <div className="flex items-center space-x-2 text-[11px] text-stone-400 mb-1 px-1">
              <span className="font-medium text-stone-300">Gemini 3.6 Flash</span>
              <span>•</span>
              <span className="text-amber-400 animate-pulse">Thinking & Reflecting...</span>
            </div>
            <div className="bg-stone-900 border border-stone-800 p-4 rounded-2xl rounded-bl-xs text-sm text-stone-300 flex items-center space-x-3 shadow-sm">
              <div className="flex space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-bounce [animation-delay:-0.3s]" />
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-bounce [animation-delay:-0.15s]" />
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-bounce" />
              </div>
              <span className="text-xs text-stone-400">Synthesizing thoughtful reflection...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Composer Box */}
      <div className="p-4 sm:px-6 bg-stone-900/60 border-t border-stone-800/80 backdrop-blur-md">
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-2">
          <div className="relative flex items-end rounded-2xl bg-stone-950 border border-stone-800 focus-within:border-amber-500/60 focus-within:ring-1 focus-within:ring-amber-500/30 transition-all p-2">
            <textarea
              id="input-journal-message"
              ref={textareaRef}
              rows={2}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask a question, write a thought, or share a topic (Shift+Enter for newline)..."
              disabled={isGenerating}
              className="flex-1 bg-transparent px-3 py-2 text-sm text-stone-100 placeholder-stone-400 resize-none focus:outline-none max-h-40 min-h-[52px] leading-relaxed"
            />

            <button
              id="btn-send-message"
              type="submit"
              disabled={!inputText.trim() || isGenerating}
              className="p-3 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-stone-950 font-bold rounded-xl shadow-md shadow-amber-950/20 disabled:opacity-40 disabled:cursor-not-allowed transition-all shrink-0 cursor-pointer"
              title="Send to Gemini"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center justify-between text-[11px] text-stone-400 px-2">
            <span>Press <kbd className="px-1.5 py-0.5 rounded bg-stone-800 text-stone-300 font-mono text-[10px]">Enter</kbd> to send, <kbd className="px-1.5 py-0.5 rounded bg-stone-800 text-stone-300 font-mono text-[10px]">Shift+Enter</kbd> for line break</span>
            <span>{inputText.length} chars</span>
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
        }}
      />
    </div>
  );
};
