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
  PanelLeftClose,
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
          icon: <Lightbulb className="w-3.5 h-3.5 text-white" />,
          bg: 'bg-white/10 border-white/30 text-white',
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
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-20 md:hidden animate-in fade-in"
        />
      )}

      <aside
        className={`fixed md:relative inset-y-0 left-0 z-20 h-full max-h-full min-h-0 bg-black/90 backdrop-blur-xl border-r border-neutral-800/80 flex flex-col transition-all duration-300 ease-in-out shrink-0 overflow-hidden ${
          isOpen
            ? 'w-80 md:w-72 lg:w-80 opacity-100 translate-x-0'
            : '-translate-x-full md:translate-x-0 md:w-0 opacity-0 md:opacity-0 pointer-events-none border-r-0'
        } pt-16 md:pt-0`}
      >
        {/* Sidebar Header & New Entry Button */}
        <div className="shrink-0 p-4 border-b border-neutral-800/80 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-300 flex items-center space-x-1.5">
              <BookOpen className="w-3.5 h-3.5 text-white" />
              <span>Reflections</span>
            </h2>
            <div className="flex items-center space-x-1.5">
              <button
                id="btn-sidebar-collapse"
                onClick={onCloseMobile}
                className="p-1 text-neutral-400 hover:text-white hover:bg-neutral-900 rounded-lg transition-all active:scale-95 cursor-pointer"
                title="Collapse sidebar [Ctrl+B]"
              >
                <PanelLeftClose className="w-4 h-4 hidden md:block" />
                <X className="w-4 h-4 md:hidden" />
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
                className={`flex items-center space-x-1.5 py-2.5 px-3 bg-neutral-900 hover:bg-neutral-850 hover:${themeConfig.accentText} border border-neutral-800 hover:${themeConfig.accentBorder} text-xs font-semibold rounded-xl transition-all active:scale-95 cursor-pointer`}
                title="View places on interactive map"
              >
                <Compass className="w-4 h-4 text-white" />
                <span className="hidden sm:inline">Places</span>
              </button>
            )}
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-2.5 pointer-events-none" />
            <input
              id="input-search-history"
              type="text"
              placeholder="Search by title, tag, or content..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-neutral-900/90 border border-neutral-800/80 rounded-xl pl-9 pr-8 py-2 text-xs text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-white/60 focus:ring-1 focus:ring-white/20 transition-all"
            />
            {searchQuery ? (
              <button
                id="btn-clear-history-search"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2.5 text-neutral-400 hover:text-neutral-200 cursor-pointer p-0.5 rounded transition-colors"
                title="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            ) : null}
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
                    ? `${themeConfig.accentBorder} ${themeConfig.accentText} bg-neutral-900/90 shadow-xs border`
                    : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Chronologically Grouped Entries List */}
        <div className="flex-1 min-h-0 overflow-y-auto px-2 py-3 space-y-4 overscroll-contain">
          {filteredEntries.length === 0 ? (
            <div className="text-center py-12 px-4 space-y-2">
              <Calendar className="w-8 h-8 text-neutral-500 mx-auto opacity-60" />
              <p className="text-xs font-semibold text-neutral-300">
                {searchQuery ? 'No matching reflections.' : 'No entries yet.'}
              </p>
              <p className="text-[11px] text-neutral-400">
                {searchQuery ? 'Try another keyword or filter.' : 'Click "New Entry" to start reflecting.'}
              </p>
            </div>
          ) : (
            Object.entries(groupedEntries).map(([groupTitle, groupItems]) => (
              <div key={groupTitle} className="space-y-1">
                <div className="px-2.5 py-1 text-[10px] font-bold tracking-wider uppercase text-neutral-400">
                  {groupTitle}
                </div>
                <div className="space-y-0.5">
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
                        className={`group relative px-3 py-2.5 rounded-xl text-left cursor-pointer transition-all flex items-center justify-between gap-2 ${
                          isSelected
                            ? `${themeConfig.sidebarActive} ring-1 ring-white/10 shadow-xs backdrop-blur-md`
                            : 'hover:bg-neutral-900/80 text-neutral-300 hover:text-neutral-100 border border-transparent hover:border-neutral-800/80'
                        }`}
                      >
                        {/* Left Topic Section with Mode Icon */}
                        <div className="flex items-center space-x-2.5 min-w-0 flex-1">
                          <span className="shrink-0 text-neutral-400 group-hover:text-neutral-300">
                            {badge.icon}
                          </span>
                          <span
                            className={`text-xs font-medium truncate ${
                              isSelected ? `${themeConfig.accentText} font-semibold` : 'text-neutral-200 group-hover:text-white'
                            }`}
                            title={entry.title || 'Untitled Reflection'}
                          >
                            {entry.title || 'Untitled Reflection'}
                          </span>
                        </div>

                        {/* Right Quick Action / Indicators */}
                        <div className="flex items-center space-x-1 shrink-0">
                          {entry.location && (
                            <span
                              className="text-white/80 hover:text-white"
                              title={entry.location.name || entry.location.formattedAddress || 'Pinned Location'}
                            >
                              <MapPin className="w-3 h-3 shrink-0" />
                            </span>
                          )}

                          {/* Star favorite */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (!entry.isFavorite) celebrate(30);
                              onToggleFavorite(entry);
                            }}
                            className={`p-1 rounded-md transition-all active:scale-90 cursor-pointer ${
                              entry.isFavorite
                                ? 'text-amber-400'
                                : 'opacity-0 group-hover:opacity-100 text-neutral-400 hover:text-amber-300 hover:bg-neutral-800'
                            }`}
                            title={entry.isFavorite ? 'Remove from favorites' : 'Mark as favorite'}
                          >
                            <Star className={`w-3.5 h-3.5 ${entry.isFavorite ? 'fill-amber-400' : ''}`} />
                          </button>

                          {/* Delete button */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setEntryToDelete(entry.id);
                            }}
                            className="opacity-0 group-hover:opacity-100 text-neutral-400 hover:text-rose-400 p-1 rounded-md hover:bg-neutral-800 transition-all cursor-pointer"
                            title="Delete reflection"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Inline Delete Confirmation */}
                        {isConfirmingDelete && (
                          <div
                            onClick={(e) => e.stopPropagation()}
                            className="absolute inset-0 bg-black/98 border border-rose-800/90 rounded-xl px-3 py-1.5 flex items-center justify-between z-10 animate-in fade-in duration-150 backdrop-blur-md"
                          >
                            <span className="text-xs text-rose-200 font-semibold truncate mr-2">Delete chat?</span>
                            <div className="flex items-center space-x-1.5 shrink-0">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEntryToDelete(null);
                                }}
                                className="px-2 py-0.5 text-[11px] text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900 rounded-md cursor-pointer"
                              >
                                Cancel
                              </button>
                              <button
                                disabled={isDeleting}
                                onClick={(e) => handleDeleteConfirm(entry.id, e)}
                                className="px-2 py-0.5 text-[11px] bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-md disabled:opacity-50 cursor-pointer"
                              >
                                {isDeleting ? '...' : 'Delete'}
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
        <div className="shrink-0 p-3 border-t border-neutral-800/80 text-center text-[11px] text-neutral-400 bg-black/60">
          <span>{entries.length} reflection{entries.length === 1 ? '' : 's'} logged</span>
        </div>
      </aside>
    </>
  );
};


