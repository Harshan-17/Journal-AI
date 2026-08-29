import React, { useState, useMemo } from 'react';
import {
  Plus,
  Search,
  BookOpen,
  Sparkles,
  Lightbulb,
  CheckSquare,
  FileText,
  Star,
  Trash2,
  Calendar,
  X,
  MapPin,
  Compass,
  Flame,
} from 'lucide-react';
import { JournalEntry, ReflectionMode } from '../types';
import { formatRelativeDate, getDateGroup } from '../utils/sanitize';
import { useAppTheme } from '../context/ThemeContext';

interface HistorySidebarProps {
  entries: JournalEntry[];
  selectedEntryId: string | null;
  onSelectEntry: (entry: JournalEntry) => void;
  onNewEntry: () => void;
  onDeleteEntry: (entryId: string) => Promise<void>;
  onToggleFavorite: (entry: JournalEntry) => Promise<void>;
  onOpenMapView?: () => void;
  isOpen: boolean;
  onCloseMobile: () => void;
}

export const HistorySidebar: React.FC<HistorySidebarProps> = ({
  entries,
  selectedEntryId,
  onSelectEntry,
  onNewEntry,
  onDeleteEntry,
  onToggleFavorite,
  onOpenMapView,
  isOpen,
  onCloseMobile,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<string>('all');
  const [entryToDelete, setEntryToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const { themeConfig, celebrate } = useAppTheme();

  // Count entries with locations & favorites
  const locationEntriesCount = useMemo(() => {
    return entries.filter((e) => Boolean(e.location?.latitude)).length;
  }, [entries]);

  const favoritesCount = useMemo(() => {
    return entries.filter((e) => Boolean(e.isFavorite)).length;
  }, [entries]);

  // Filter and search entries
  const filteredEntries = useMemo(() => {
    return entries.filter((entry) => {
      // Search filter
      const matchesSearch =
        searchQuery.trim() === '' ||
        entry.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entry.messages.some((m) => m.content.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (entry.tags && entry.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()))) ||
        (entry.location?.name && entry.location.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (entry.location?.formattedAddress && entry.location.formattedAddress.toLowerCase().includes(searchQuery.toLowerCase()));

      if (!matchesSearch) return false;

      // Mode / Favorite / Location filter
      if (filterMode === 'all') return true;
      if (filterMode === 'favorites') return Boolean(entry.isFavorite);
      if (filterMode === 'locations') return Boolean(entry.location?.latitude);
      return entry.mode === filterMode;
    });
  }, [entries, searchQuery, filterMode]);

  // Group entries by chronological category (Today, Yesterday, Previous 7 Days, Earlier)
  const groupedEntries = useMemo(() => {
    const groups: { [key: string]: JournalEntry[] } = {};
    filteredEntries.forEach((entry) => {
      const groupName = getDateGroup(entry.updatedAt || entry.createdAt);
      if (!groups[groupName]) {
        groups[groupName] = [];
      }
      groups[groupName].push(entry);
    });
    return groups;
  }, [filteredEntries]);

  const handleDeleteConfirm = async (entryId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      setIsDeleting(true);
      await onDeleteEntry(entryId);
      setEntryToDelete(null);
    } catch (err) {
      console.error('Failed to delete entry:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  const getModeBadge = (mode: ReflectionMode) => {
    switch (mode) {
      case 'brainstorm':
        return {
          icon: <Lightbulb className="w-3.5 h-3.5 text-cyan-400" />,
          bg: 'bg-cyan-950/60 border-cyan-500/30 text-cyan-300',
        };
      case 'actionable':
        return {
          icon: <CheckSquare className="w-3.5 h-3.5 text-emerald-400" />,
          bg: 'bg-emerald-950/60 border-emerald-500/30 text-emerald-300',
        };
      case 'summarize':
        return {
          icon: <FileText className="w-3.5 h-3.5 text-fuchsia-400" />,
          bg: 'bg-fuchsia-950/60 border-fuchsia-500/30 text-fuchsia-300',
        };
      default:
        return {
          icon: <Sparkles className="w-3.5 h-3.5 text-violet-400" />,
          bg: 'bg-violet-950/60 border-violet-500/30 text-violet-300',
        };
    }
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-stone-950/80 backdrop-blur-sm z-20 md:hidden animate-in fade-in"
        />
      )}

      <aside
        className={`fixed md:static inset-y-0 left-0 z-20 w-80 md:w-72 lg:w-80 h-full max-h-full min-h-0 bg-stone-950/90 backdrop-blur-xl border-r border-stone-800/80 flex flex-col transition-all duration-200 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        } pt-16 md:pt-0`}
      >
        {/* Sidebar Header & New Entry Button */}
        <div className="shrink-0 p-4 border-b border-stone-800/80 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-stone-300 flex items-center space-x-1.5">
              <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
              <span>Reflections</span>
            </h2>
            <div className="flex items-center space-x-1.5">
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-stone-900 border border-stone-800 text-stone-300">
                {entries.length} {entries.length === 1 ? 'log' : 'logs'}
              </span>
              <button
                onClick={onCloseMobile}
                className="md:hidden p-1 text-stone-400 hover:text-stone-200 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              id="btn-sidebar-new-entry"
              onClick={() => {
                onNewEntry();
                onCloseMobile();
              }}
              className={`flex-1 flex items-center justify-center space-x-2 py-2.5 px-3 ${themeConfig.accentBg} text-xs font-bold rounded-xl shadow-md transition-all active:scale-95 cursor-pointer`}
            >
              <Plus className="w-4 h-4" />
              <span>New Entry</span>
            </button>

            {onOpenMapView && (
              <button
                id="btn-open-atlas"
                onClick={() => {
                  onOpenMapView();
                  onCloseMobile();
                }}
                className={`flex items-center space-x-1.5 py-2.5 px-3 bg-stone-900 hover:bg-stone-850 hover:${themeConfig.accentText} border border-stone-800 hover:${themeConfig.accentBorder} text-xs font-semibold rounded-xl transition-all active:scale-95 cursor-pointer`}
                title="View places on interactive map"
              >
                <Compass className="w-4 h-4 text-cyan-400" />
                <span className="hidden sm:inline">Places</span>
              </button>
            )}
          </div>

          {/* Search Input */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-2.5" />
            <input
              id="input-search-history"
              type="text"
              placeholder="Search thoughts, tags, places..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-stone-900/90 border border-stone-800/80 rounded-xl pl-9 pr-3 py-1.5 text-xs text-stone-200 placeholder-stone-400 focus:outline-none focus:border-cyan-500/50 transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2 text-stone-400 hover:text-stone-200 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center space-x-1 overflow-x-auto pb-1 text-[11px] scrollbar-none">
            {[
              { id: 'all', label: 'All' },
              { id: 'favorites', label: `⭐ (${favoritesCount})` },
              { id: 'locations', label: `📍 (${locationEntriesCount})` },
              { id: 'reflect', label: 'Perspective' },
              { id: 'brainstorm', label: 'Ideas' },
              { id: 'actionable', label: 'Actions' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilterMode(tab.id)}
                className={`px-2.5 py-1 rounded-lg font-medium whitespace-nowrap transition-all cursor-pointer ${
                  filterMode === tab.id
                    ? `${themeConfig.accentBorder} ${themeConfig.accentText} bg-stone-900/90 shadow-xs border`
                    : 'text-stone-400 hover:text-stone-200 hover:bg-stone-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Chronologically Grouped Entries List */}
        <div className="flex-1 min-h-0 overflow-y-auto p-3 space-y-4 overscroll-contain">
          {filteredEntries.length === 0 ? (
            <div className="text-center py-12 px-4 space-y-2">
              <Calendar className="w-8 h-8 text-stone-500 mx-auto opacity-60" />
              <p className="text-xs font-semibold text-stone-300">
                {searchQuery ? 'No matching reflections.' : 'No entries yet.'}
              </p>
              <p className="text-[11px] text-stone-400">
                {searchQuery ? 'Try another keyword or filter.' : 'Click "New Entry" to start reflecting.'}
              </p>
            </div>
          ) : (
            Object.entries(groupedEntries).map(([groupTitle, groupItems]) => (
              <div key={groupTitle} className="space-y-1.5">
                <div className="px-2 py-1 text-[10px] font-bold tracking-wider uppercase text-stone-400">
                  {groupTitle}
                </div>
                <div className="space-y-1.5">
                  {groupItems.map((entry) => {
                    const isSelected = entry.id === selectedEntryId;
                    const isConfirmingDelete = entryToDelete === entry.id;
                    const badge = getModeBadge(entry.mode);

                    return (
                      <div
                        key={entry.id}
                        id={`entry-card-${entry.id}`}
                        onClick={() => {
                          onSelectEntry(entry);
                          onCloseMobile();
                        }}
                        className={`group relative p-3 rounded-2xl border text-left cursor-pointer transition-all ${
                          isSelected
                            ? `${themeConfig.sidebarActive} ring-1 ring-white/10 shadow-md backdrop-blur-md`
                            : 'bg-stone-900/40 border-stone-800/80 hover:bg-stone-900/80 hover:border-stone-700'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center space-x-2 min-w-0">
                            <span className={`p-1 rounded-lg border ${badge.bg}`}>
                              {badge.icon}
                            </span>
                            <h4
                              className={`text-xs font-semibold truncate ${
                                isSelected ? themeConfig.accentText : 'text-stone-100 group-hover:text-white'
                              }`}
                            >
                              {entry.title || 'Untitled Reflection'}
                            </h4>
                          </div>

                          {/* Star favorite with interactive confetti */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (!entry.isFavorite) celebrate(30);
                              onToggleFavorite(entry);
                            }}
                            className={`p-1 rounded-lg hover:bg-stone-800 transition-all active:scale-90 cursor-pointer ${
                              entry.isFavorite ? 'text-amber-400' : 'text-stone-400 hover:text-amber-300'
                            }`}
                            title={entry.isFavorite ? 'Remove from favorites' : 'Mark as favorite'}
                          >
                            <Star className={`w-3.5 h-3.5 ${entry.isFavorite ? 'fill-amber-400' : ''}`} />
                          </button>
                        </div>

                        {/* Message preview snippet */}
                        <p className="text-[11px] text-stone-400 line-clamp-2 mt-1.5 leading-relaxed">
                          {entry.messages.length > 0
                            ? entry.messages[entry.messages.length - 1].content.replace(/[#*`]/g, '')
                            : 'Empty session'}
                        </p>

                        {/* Tags preview */}
                        {entry.tags && entry.tags.length > 0 && (
                          <div className="flex items-center gap-1 mt-2 flex-wrap">
                            {entry.tags.slice(0, 3).map((tag) => (
                              <span
                                key={tag}
                                className="px-2 py-0.5 rounded-md bg-stone-900 border border-stone-800/80 text-stone-300 text-[10px] font-mono"
                              >
                                #{tag}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Metadata footer */}
                        <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-stone-800/60 text-[10px] text-stone-400">
                          <span className="truncate">{formatRelativeDate(entry.updatedAt || entry.createdAt)}</span>

                          <div className="flex items-center space-x-1.5 shrink-0">
                            {entry.location && (
                              <span
                                className="px-1.5 py-0.5 rounded-md bg-cyan-950/50 border border-cyan-800/40 text-cyan-300 flex items-center space-x-1 max-w-[85px]"
                                title={entry.location.name || entry.location.formattedAddress || 'Pinned Location'}
                              >
                                <MapPin className="w-2.5 h-2.5 text-cyan-400 shrink-0" />
                                <span className="truncate text-[9px]">{entry.location.name || 'Pin'}</span>
                              </span>
                            )}

                            <span className="px-1.5 py-0.5 rounded-md bg-stone-900 border border-stone-800 text-stone-300">
                              {entry.messages.length} msg{entry.messages.length === 1 ? '' : 's'}
                            </span>

                            {/* Delete button */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setEntryToDelete(entry.id);
                              }}
                              className="opacity-0 group-hover:opacity-100 hover:text-rose-400 p-0.5 rounded transition-opacity cursor-pointer"
                              title="Delete reflection"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Inline Delete Confirmation */}
                        {isConfirmingDelete && (
                          <div
                            onClick={(e) => e.stopPropagation()}
                            className="absolute inset-0 bg-stone-950/95 border border-rose-800/80 rounded-2xl p-3 flex flex-col justify-between z-10 animate-in fade-in duration-150 backdrop-blur-md"
                          >
                            <p className="text-xs text-rose-200 font-semibold">Delete this reflection?</p>
                            <div className="flex items-center justify-end space-x-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEntryToDelete(null);
                                }}
                                className="px-2.5 py-1 text-[11px] text-stone-300 hover:bg-stone-800 rounded-lg cursor-pointer"
                              >
                                Cancel
                              </button>
                              <button
                                disabled={isDeleting}
                                onClick={(e) => handleDeleteConfirm(entry.id, e)}
                                className="px-2.5 py-1 text-[11px] bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-lg disabled:opacity-50 cursor-pointer"
                              >
                                {isDeleting ? 'Deleting...' : 'Delete'}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Sidebar Footer count */}
        <div className="shrink-0 p-3 border-t border-stone-800/80 text-center text-[11px] text-stone-400 bg-stone-950/60">
          <span>{entries.length} reflection{entries.length === 1 ? '' : 's'} logged</span>
        </div>
      </aside>
    </>
  );
};


