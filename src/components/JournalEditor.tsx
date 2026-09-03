import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  Send,
  Sparkles,
  Copy,
  Check,
  AlertCircle,
  RefreshCw,
  Clock,
  Volume2,
  Square,
  PanelLeftClose,
  PanelLeftOpen,
  MapPin,
  Compass,
} from 'lucide-react';
import Markdown from 'react-markdown';
import { JournalEntry, ReflectionMode, PromptIdea } from '../types';
import { formatTimestamp } from '../utils/sanitize';
import { LocationPickerModal } from './LocationPickerModal';
import { SessionToolsPopover } from './SessionToolsPopover';
import ParticleText from './ParticleText';
import { Button as MovingBorderButton } from './ui/moving-border';
import { useAppTheme } from '../context/ThemeContext';

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
  isSidebarOpen?: boolean;
  onToggleSidebar?: () => void;
  userName?: string;
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
  isSidebarOpen = true,
  onToggleSidebar,
  userName,
}) => {
  const [inputText, setInputText] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
  const [promptIdeas, setPromptIdeas] = useState<PromptIdea[]>([]);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
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

  const renderComposer = () => (
    <motion.form 
      layoutId="composer-form"
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      onSubmit={handleSubmit} 
      className="max-w-3xl mx-auto w-full space-y-2"
    >
      <div className="relative flex items-end bg-black/40 border border-white/20 focus-within:border-white/50 focus-within:shadow-[0_0_20px_rgba(255,255,255,0.15)] transition-all p-2.5 backdrop-blur-2xl w-full rounded-xl shadow-[0_0_10px_rgba(255,255,255,0.05)]">
        <textarea
          autoFocus
          id="input-journal-message"
          ref={textareaRef}
          rows={1}
          value={inputText}
          onChange={(e) => {
            setInputText(e.target.value);
            e.target.style.height = 'auto';
            e.target.style.height = `${Math.min(e.target.scrollHeight, 160)}px`;
          }}
          onKeyDown={handleKeyDown}
          placeholder="What are you contemplating right now?..."
          disabled={isGenerating}
          className="flex-1 bg-transparent px-2 py-1.5 text-[14px] sm:text-[15px] text-white placeholder-neutral-600 resize-none focus:outline-none max-h-40 min-h-[40px] leading-relaxed font-serif"
        />

        <button
          id="btn-send-message"
          type="submit"
          disabled={!inputText.trim() || isGenerating}
          className={`p-2.5 ${themeConfig.accentBg} rounded-none shadow-xl disabled:opacity-20 disabled:cursor-not-allowed transition-all shrink-0 cursor-pointer active:scale-95 ml-2`}
          title="Send message [Enter]"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>

      <div className="flex items-center justify-between text-[10px] text-neutral-600 px-2 uppercase tracking-widest font-mono">
        <span>
          <kbd className="px-1 border border-neutral-700 text-neutral-400">Enter</kbd> send, <kbd className="px-1 border border-neutral-700 text-neutral-400">Shift+Enter</kbd> newline
        </span>
        <span>{inputText.length} chars</span>
      </div>
    </motion.form>
  );



  // Auto-focus the input on mount
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, []);

  // Fetch prompt ideas for welcome state
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

  return (
    <div className="flex-1 flex flex-col h-full min-h-0 w-full bg-black backdrop-blur-md text-white overflow-hidden relative z-10">
      {/* Streamlined Minimalist Header Bar */}
      <div className="shrink-0 px-4 sm:px-8 py-3.5 border-b border-white/10 bg-black/80 backdrop-blur-xl flex items-center justify-between gap-4 relative z-40">
        {/* Left: Sidebar Toggle & Clean Inline Title */}
        <div className="flex-1 min-w-0 flex items-center space-x-3">
          {onToggleSidebar && (
            <button
              id="btn-journal-toggle-sidebar"
              onClick={onToggleSidebar}
              className={`p-1.5 rounded-none border transition-all duration-150 active:scale-95 cursor-pointer shrink-0 ${
                !isSidebarOpen
                  ? 'bg-white/5 border-white/20 text-white hover:bg-white/10'
                  : 'bg-transparent border-transparent text-neutral-400 hover:text-white hover:bg-white/5'
              }`}
              title="Toggle sidebar [Ctrl+B]"
              aria-label="Toggle sidebar"
            >
              {isSidebarOpen ? (
                <PanelLeftClose className="w-4 h-4" />
              ) : (
                <PanelLeftOpen className="w-4 h-4" />
              )}
            </button>
          )}

          <div className="flex-1 min-w-0 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
            <input
              id="input-entry-title"
              type="text"
              value={entry.title}
              onChange={(e) => onUpdateEntry({ title: e.target.value })}
              placeholder="Untitled Journal Gem..."
              className="bg-transparent font-serif text-base sm:text-lg text-white placeholder-neutral-600 focus:outline-none focus:text-white transition-colors truncate max-w-sm sm:max-w-md w-full"
            />
          </div>
        </div>

        {/* Right: Discreet Pinned Tag & All-in-One Options Popover */}
        <div className="flex items-center space-x-2.5 shrink-0">
          <span className="hidden sm:flex text-[11px] text-neutral-500 items-center space-x-1 shrink-0 uppercase tracking-widest font-mono mr-2">
            <Clock className="w-3 h-3 opacity-70" />
            <span>{formatTimestamp(entry.createdAt)}</span>
          </span>

          <button
            onClick={() => setIsLocationModalOpen(true)}
            className="hidden sm:flex items-center space-x-1.5 px-2.5 py-1 rounded-none border border-white/20 text-white text-xs hover:bg-white/10 transition-colors cursor-pointer"
            title={entry.location ? (entry.location.formattedAddress || 'Pinned Location') : 'Pin a place'}
          >
            <MapPin className={`w-3 h-3 ${entry.location ? 'text-cyan-400' : 'text-neutral-400'}`} />
            <span className="truncate max-w-[120px] font-medium text-[11px] uppercase tracking-wider">
              {entry.location ? (entry.location.name || 'Pinned') : 'Pin Place'}
            </span>
          </button>

          {/* Clean Tools & Options Popover */}
          <SessionToolsPopover
            entry={entry}
            onUpdateEntry={onUpdateEntry}
            onOpenLocationModal={() => setIsLocationModalOpen(true)}
            onOpenSummaryModal={onOpenSummaryModal}
            onGenerateSummary={onGenerateSummary}
            isSummarizing={isSummarizing}
            onExportTranscript={handleExportTranscript}
          />
        </div>
      </div>

      {/* Error Notice */}
      {error && (
        <div className="shrink-0 mx-4 sm:mx-8 mt-3 p-3 bg-red-950/40 border border-red-500/50 rounded-none text-xs text-red-200 flex items-center justify-between animate-in fade-in duration-150 backdrop-blur-md">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={onRetry}
            className="flex items-center space-x-1 px-2.5 py-1 bg-red-900 hover:bg-red-800 text-white rounded-none border border-red-500/50 text-[11px] font-semibold transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Retry</span>
          </button>
        </div>
      )}

      {/* Main Conversation Stream */}
      <div className="flex-1 min-h-0 overflow-y-auto px-4 sm:px-8 py-8 overscroll-contain">
        {entry.messages.length === 0 ? (
          /* Empty / Welcome State with MovingBorder Component */
          <div className="max-w-2xl mx-auto py-12 text-center space-y-12 animate-in fade-in duration-300">
            <div className="space-y-4">
              <div style={{ width: '100%', height: 180, display: 'flex', justifyContent: 'center' }}>
                <ParticleText
                  text={`hello${userName ? `, ${userName}` : '.'}`.toLowerCase()}
                  particleSize={2}
                  density={4}
                  color="#ffffff"
                  highlightColor="#ffffff"
                  scatter={180}
                  gatherDuration={1200}
                  stagger={200}
                  trigger="mount"
                  fontSize="clamp(2.5rem, 8vw, 4rem)"
                  fontWeight={300}
                  fontFamily="Inter, sans-serif"
                  glow={false}
                />
              </div>
              <p className="text-sm sm:text-base text-neutral-400 max-w-md mx-auto leading-relaxed font-sans font-light">
                How are you feeling today? Explore an intuition, unpack a complex decision, or reflect on your day to start a conversation.
              </p>
            </div>

            
            {/* Input Composer in Center */}
            <div className="flex justify-center w-full px-4">
              {renderComposer()}
            </div>


            {/* Subtle Inspiration Sparks */}
            {promptIdeas.length > 0 && (
              <div className="pt-12 flex flex-col items-center gap-4 max-w-2xl mx-auto text-center">
                <span className="text-xs uppercase tracking-widest text-neutral-600 font-semibold mb-2">Or start with</span>
                <div className="flex flex-col gap-3 w-full">
                  {promptIdeas.slice(0, 3).map((idea) => (
                    <button
                      key={idea.id}
                      onClick={() => {
                        setInputText(idea.text);
                        textareaRef.current?.focus();
                      }}
                      className="group flex items-center justify-center space-x-3 text-neutral-500 hover:text-white transition-colors cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5 opacity-50 group-hover:opacity-100 transition-opacity" />
                      <span className="font-sans text-sm leading-relaxed text-center">
                        {idea.text}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Stream of Messages */
          <div className="max-w-3xl mx-auto w-full space-y-8">
            {entry.messages.map((msg) => {
              const isUser = msg.role === 'user';
              const isCopied = copiedId === msg.id;
              const isSpeaking = speakingMessageId === msg.id;

              return (
                <div
                  key={msg.id}
                  className={`flex flex-col w-full group ${isUser ? "items-end" : "items-start"}`}
                >
                  {/* Sender & Timestamp */}
                  <div className={`flex items-center space-x-1.5 text-[10px] text-neutral-500 mb-2 px-1 uppercase tracking-widest font-mono ${isUser ? "flex-row-reverse space-x-reverse" : ""}`}>
                    <span className="font-bold text-neutral-400">
                      {isUser ? 'You' : 'Reflect AI'}
                    </span>
                    <span className="opacity-50">•</span>
                    <span className="bg-white/10 text-white px-2 py-0.5 rounded-md font-bold tracking-wider shadow-[0_0_8px_rgba(255,255,255,0.1)]">{msg.timestamp}</span>
                  </div>

                  {/* Message Body */}
                  {isUser ? (
                    /* User Message: Uses Dynamic Theme Config */
                    <div className="journal-text relative max-w-[85%] px-4 py-3 bg-gray-900/60 backdrop-blur-md border border-cyan-500/40 shadow-[0_0_15px_rgba(6,182,212,0.15)] rounded-2xl rounded-tr-sm text-[14px] sm:text-[15px] leading-relaxed">
                      <p className="whitespace-pre-wrap break-words">{msg.content}</p>

                      <div className="absolute top-2 right-2 flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleCopyMessage(msg.id, msg.content)}
                          className="p-1 text-white/50 hover:text-white transition-colors cursor-pointer"
                          title="Copy text"
                        >
                          {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* AI Message: Pure Editorial Typography */
                    <div className="journal-text relative w-full px-5 py-4 bg-gray-900/60 backdrop-blur-md border border-white/10 rounded-2xl text-[14px] sm:text-[15px] leading-loose shadow-sm">
                      <div className="prose prose-invert prose-neutral max-w-none prose-p:my-4 prose-p:leading-loose prose-p:font-light prose-headings:my-3 prose-headings:text-white prose-headings:font-serif prose-headings:font-medium prose-h1:text-lg prose-h2:text-base prose-h3:text-[15px] prose-li:my-1 prose-ul:my-4 prose-ol:my-4 prose-strong:text-white prose-strong:font-semibold prose-code:text-white prose-code:bg-white/10 prose-code:px-1.5 prose-code:py-0.5 prose-code:border prose-code:border-white/20 prose-code:font-mono prose-pre:my-4 prose-pre:p-4 prose-pre:bg-white/5 prose-pre:border prose-pre:border-white/20 prose-pre:rounded-none">
                        <Markdown>{msg.content}</Markdown>
                      </div>

                      {/* Action buttons (Copy & Speech) on Hover */}
                      <div className="flex items-center space-x-3 mt-4 pt-2 opacity-0 group-hover:opacity-100 transition-opacity text-neutral-500 text-xs font-mono uppercase tracking-wider">
                        <button
                          onClick={() => handleToggleSpeak(msg.id, msg.content)}
                          className={`flex items-center space-x-1.5 hover:text-white transition-colors cursor-pointer ${
                            isSpeaking ? 'text-white' : 'hover:text-white'
                          }`}
                          title={isSpeaking ? 'Stop speech' : 'Read aloud'}
                        >
                          {isSpeaking ? (
                            <>
                              <Square className="w-3 h-3 text-white fill-white animate-pulse" />
                              <span>Speaking</span>
                            </>
                          ) : (
                            <>
                              <Volume2 className="w-3 h-3" />
                              <span>Listen</span>
                            </>
                          )}
                        </button>

                        <button
                          onClick={() => handleCopyMessage(msg.id, msg.content)}
                          className="flex items-center space-x-1.5 hover:text-white transition-colors cursor-pointer"
                          title="Copy message"
                        >
                          {isCopied ? (
                            <>
                              <Check className="w-3 h-3 text-white" />
                              <span className="text-white">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>Copy</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Generating Thought Indicator */}
            {isGenerating && (
              <div className="flex flex-col items-start w-full animate-in fade-in duration-200 pt-4">
                <div className="flex items-center space-x-1.5 text-[10px] text-neutral-500 mb-2 px-1 uppercase tracking-widest font-mono">
                  <span className="font-bold text-neutral-400">Reflect AI</span>
                  <span>•</span>
                  <span>Thinking</span>
                </div>
                <div className="flex items-center space-x-3 py-2 text-white text-xs">
                  <div className="flex space-x-1.5">
                    <span className="w-1.5 h-1.5 bg-white animate-pulse" />
                    <span className="w-1.5 h-1.5 bg-white/60 animate-pulse [animation-delay:-0.15s]" />
                    <span className="w-1.5 h-1.5 bg-white/30 animate-pulse [animation-delay:-0.3s]" />
                  </div>
                  <span className="font-mono uppercase tracking-widest text-[10px] text-neutral-500">Drafting</span>
                </div>
              </div>
            )}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      
      {/* Floating Minimalist Input Composer */}
      {entry.messages.length > 0 && (
        <div className="shrink-0 sticky bottom-0 z-20 w-full px-4 sm:px-8 pb-6 pt-4 bg-gradient-to-t from-black via-black/90 to-transparent pointer-events-auto">
          {renderComposer()}
        </div>
      )}
      
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
