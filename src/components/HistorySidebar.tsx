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
  ChevronRight,
  MapPin,
  Compass,
} from 'lucide-react';
import { JournalEntry, ReflectionMode } from '../types';
import { formatRelativeDate } from '../utils/sanitize';

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

  // Count entries with locations
  const locationEntriesCount = useMemo(() => {
    return entries.filter((e) => Boolean(e.location?.latitude)).length;
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

  const getModeIcon = (mode: ReflectionMode) => {
    switch (mode) {
      case 'brainstorm':
        return <Lightbulb className="w-3.5 h-3.5 text-amber-400" />;
      case 'actionable':
        return <CheckSquare className="w-3.5 h-3.5 text-emerald-400" />;
      case 'summarize':
        return <FileText className="w-3.5 h-3.5 text-sky-400" />;
      default:
        return <Sparkles className="w-3.5 h-3.5 text-amber-400" />;
    }
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-stone-950/70 backdrop-blur-xs z-20 md:hidden"
        />
      )}

      <aside
        className={`fixed md:static inset-y-0 left-0 z-20 w-80 md:w-72 lg:w-80 bg-stone-900 border-r border-stone-800 flex flex-col transition-transform duration-200 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        } pt-16 md:pt-0`}
      >
        {/* Sidebar Header & New Entry Button */}
        <div className="p-4 border-b border-stone-800 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-stone-400 flex items-center space-x-1.5">
              <BookOpen className="w-4 h-4 text-amber-400" />
              <span>Reflection History</span>
            </h2>
            <button
              onClick={onCloseMobile}
              className="md:hidden p-1 text-stone-400 hover:text-stone-200 rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex gap-2">
            <button
              id="btn-sidebar-new-entry"
              onClick={() => {
                onNewEntry();
                onCloseMobile();
              }}
              className="flex-1 flex items-center justify-center space-x-2 py-2.5 px-3 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-stone-950 font-semibold text-xs rounded-xl shadow-sm transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>New Session</span>
            </button>

            {onOpenMapView && (
              <button
                id="btn-open-atlas"
                onClick={() => {
                  onOpenMapView();
                  onCloseMobile();
                }}
                className="flex items-center space-x-1.5 py-2.5 px-3 bg-stone-800 hover:bg-stone-700 text-amber-300 border border-stone-700 text-xs font-semibold rounded-xl transition-all"
                title="View all pinned reflections on the global map"
              >
                <Compass className="w-4 h-4 text-amber-400" />
                <span className="hidden sm:inline">Atlas</span>
              </button>
            )}
          </div>

          {/* Search Input */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-2.5" />
            <input
              id="input-search-history"
              type="text"
              placeholder="Search entries or locations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-stone-950/80 border border-stone-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-stone-200 placeholder-stone-400 focus:outline-none focus:border-amber-500/60 transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2 text-stone-400 hover:text-stone-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filter Pills */}
          <div className="flex items-center space-x-1 overflow-x-auto pb-1 text-[11px] scrollbar-none">
            {[
              { id: 'all', label: 'All' },
              { id: 'favorites', label: '★ Favorites' },
              { id: 'locations', label: `📍 Places (${locationEntriesCount})` },
              { id: 'reflect', label: 'Reflect' },
              { id: 'brainstorm', label: 'Ideas' },
              { id: 'actionable', label: 'Actions' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilterMode(tab.id)}
                className={`px-2.5 py-1 rounded-lg font-medium whitespace-nowrap transition-colors ${
                  filterMode === tab.id
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/60'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Entries List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {filteredEntries.length === 0 ? (
            <div className="text-center py-12 px-4 space-y-2">
              <Calendar className="w-8 h-8 text-stone-400 mx-auto" />
              <p className="text-xs font-medium text-stone-400">
                {searchQuery ? 'No matching entries found.' : 'No reflections saved yet.'}
              </p>
              <p className="text-[11px] text-stone-400">
                {searchQuery ? 'Try adjusting your search query.' : 'Click "New Reflection" to start your first session with Gemini.'}
              </p>
            </div>
          ) : (
            filteredEntries.map((entry) => {
              const isSelected = entry.id === selectedEntryId;
              const isConfirmingDelete = entryToDelete === entry.id;

              return (
                <div
                  key={entry.id}
                  id={`entry-card-${entry.id}`}
                  onClick={() => {
                    onSelectEntry(entry);
                    onCloseMobile();
                  }}
                  className={`group relative p-3 rounded-xl border text-left cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-stone-800/90 border-amber-500/50 shadow-sm'
                      : 'bg-stone-900/40 border-stone-800/60 hover:bg-stone-800/40 hover:border-stone-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center space-x-1.5 min-w-0">
                      <span className="p-1 rounded-md bg-stone-950/60 border border-stone-800">
                        {getModeIcon(entry.mode)}
                      </span>
                      <h4
                        className={`text-xs font-medium truncate ${
                          isSelected ? 'text-amber-300 font-semibold' : 'text-stone-200 group-hover:text-stone-100'
                        }`}
                      >
                        {entry.title || 'Untitled Reflection'}
                      </h4>
                    </div>

                    {/* Star favorite */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleFavorite(entry);
                      }}
                      className={`p-1 rounded hover:bg-stone-800 transition-colors ${
                        entry.isFavorite ? 'text-amber-400' : 'text-stone-400 hover:text-stone-300'
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

                  {/* Metadata footer */}
                  <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-stone-800/60 text-[10px] text-stone-400">
                    <span className="truncate">{formatRelativeDate(entry.updatedAt || entry.createdAt)}</span>

                    <div className="flex items-center space-x-1.5 shrink-0">
                      {entry.location && (
                        <span
                          className="px-1.5 py-0.5 rounded bg-amber-950/60 border border-amber-800/50 text-amber-300 flex items-center space-x-1 max-w-[90px]"
                          title={entry.location.name || entry.location.formattedAddress || 'Pinned Location'}
                        >
                          <MapPin className="w-2.5 h-2.5 text-amber-400 shrink-0" />
                          <span className="truncate text-[9px]">{entry.location.name || 'Pin'}</span>
                        </span>
                      )}

                      <span className="px-1.5 py-0.5 rounded bg-stone-950 border border-stone-800 text-stone-400">
                        {entry.messages.length} msg{entry.messages.length === 1 ? '' : 's'}
                      </span>

                      {entry.summary && (
                        <span className="px-1.5 py-0.5 rounded bg-sky-950/60 border border-sky-800/50 text-sky-400">
                          Summary
                        </span>
                      )}

                      {/* Delete button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEntryToDelete(entry.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 hover:text-rose-400 p-0.5 rounded transition-opacity"
                        title="Delete reflection"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Inline Delete Confirmation Popover */}
                  {isConfirmingDelete && (
                    <div
                      onClick={(e) => e.stopPropagation()}
                      className="absolute inset-0 bg-stone-950/95 border border-rose-800/80 rounded-xl p-3 flex flex-col justify-between z-10 animate-in fade-in duration-150"
                    >
                      <p className="text-xs text-rose-200 font-medium">Delete this reflection from Firestore?</p>
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEntryToDelete(null);
                          }}
                          className="px-2.5 py-1 text-[11px] text-stone-300 hover:bg-stone-800 rounded-lg"
                        >
                          Cancel
                        </button>
                        <button
                          disabled={isDeleting}
                          onClick={(e) => handleDeleteConfirm(entry.id, e)}
                          className="px-2.5 py-1 text-[11px] bg-rose-600 hover:bg-rose-500 text-white font-medium rounded-lg disabled:opacity-50"
                        >
                          {isDeleting ? 'Deleting...' : 'Delete'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Sidebar Footer count */}
        <div className="p-3 border-t border-stone-800 text-center text-[11px] text-stone-400 font-mono">
          {entries.length} Isolated Firestore Document{entries.length === 1 ? '' : 's'}
        </div>
      </aside>
    </>
  );
};
