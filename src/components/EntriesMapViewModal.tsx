import React, { useState, useMemo, useEffect } from 'react';
import {
  APIProvider,
  Map,
  AdvancedMarker,
  Pin,
  InfoWindow,
} from '@vis.gl/react-google-maps';
import {
  MapPin,
  X,
  Calendar,
  ExternalLink,
  BookOpen,
  Compass,
  AlertCircle,
} from 'lucide-react';
import { JournalEntry } from '../types';
import { isValidCoordinate, formatTimestamp } from '../utils/sanitize';
import { useAppTheme } from '../context/ThemeContext';

interface EntriesMapViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  entries: JournalEntry[];
  onSelectEntry: (entry: JournalEntry) => void;
}

export const EntriesMapViewModal: React.FC<EntriesMapViewModalProps> = ({
  isOpen,
  onClose,
  entries,
  onSelectEntry,
}) => {
  const envKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';
  const [serverKey, setServerKey] = useState<string>('');
  const [customKey, setCustomKey] = useState<string>(() => {
    return localStorage.getItem('user_google_maps_api_key') || '';
  });
  const effectiveApiKey = envKey || serverKey || customKey;
  const { themeConfig, celebrate } = useAppTheme();

  const [mapAuthError, setMapAuthError] = useState(false);

  useEffect(() => {
    (window as any).gm_authFailure = () => {
      setMapAuthError(true);
    };
  }, []);

  // Auto-fetch API key from backend if not defined in build env or storage
  useEffect(() => {
    if (!envKey && !customKey) {
      fetch('/api/maps/config')
        .then((res) => res.json())
        .then((data) => {
          if (data?.apiKey) {
            setServerKey(data.apiKey);
          }
        })
        .catch(() => {
          // ignore network error
        });
    }
  }, [envKey, customKey]);

  const [activeEntry, setActiveEntry] = useState<JournalEntry | null>(null);

  // Filter entries that have valid location coordinates
  const locationEntries = useMemo(() => {
    return entries.filter(
      (e) =>
        e.location &&
        isValidCoordinate(e.location.latitude, e.location.longitude)
    );
  }, [entries]);

  // Compute map center from entries or fallback
  const mapCenter = useMemo(() => {
    if (locationEntries.length > 0) {
      const first = locationEntries[0].location!;
      return { lat: first.latitude, lng: first.longitude };
    }
    return { lat: 37.7749, lng: -122.4194 };
  }, [locationEntries]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-neutral-900/95 border border-neutral-800 rounded-3xl w-full max-w-5xl h-[85vh] flex flex-col shadow-2xl overflow-hidden backdrop-blur-xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800/80 bg-black/80">
          <div className="flex items-center space-x-3">
            <div className={`w-9 h-9 rounded-xl bg-gradient-to-tr ${themeConfig.primaryGradient} flex items-center justify-center text-neutral-950 font-bold shadow-md`}>
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-serif font-semibold text-neutral-100 flex items-center space-x-2">
                <span>Reflections Atlas</span>
                <span className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full ${themeConfig.badgeBg} ${themeConfig.accentText} border`}>
                  {locationEntries.length} {locationEntries.length === 1 ? 'place' : 'places'}
                </span>
              </h2>
              <p className="text-xs text-neutral-400">
                Memories and thoughts pinned across the world
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Map Body */}
        <div className="flex-1 relative w-full h-full bg-black">
          {mapAuthError && (
            <div className="absolute inset-0 z-50 flex items-center justify-center p-6 bg-black/90 backdrop-blur-sm text-center">
              <div className="max-w-md p-6 bg-neutral-900 border border-red-900/50 rounded-2xl space-y-4">
                <div className="w-12 h-12 rounded-full bg-red-950/50 flex items-center justify-center mx-auto text-red-500">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-serif font-semibold text-white">Google Maps API Error</h3>
                <p className="text-sm text-neutral-400">
                  Billing is not enabled for the provided Google Maps API key, or the key is invalid.
                </p>
                <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-neutral-500 text-left">
                  <p>For zero-cost prototyping, get a free Maps Demo Key here:</p>
                  <a href="https://mapsplatform.google.com/maps-demo-key?utm_campaign=gmp_mcp_codeassist_v1_aistudio" target="_blank" rel="noreferrer" className="text-emerald-400 hover:underline mt-1 block truncate">
                    mapsplatform.google.com/maps-demo-key
                  </a>
                </div>
                <p className="text-xs text-neutral-500">
                  Set this key in your AI Studio Secrets as <code className="text-emerald-400 font-mono">VITE_GOOGLE_MAPS_API_KEY</code> or update it below.
                </p>
                <div className="w-full max-w-sm space-y-2 mt-4 mx-auto">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Paste Google Maps Demo Key"
                      value={customKey}
                      onChange={(e) => setCustomKey(e.target.value)}
                      className="flex-1 px-3 py-2 bg-black border border-neutral-700 rounded-xl text-xs text-neutral-200 placeholder-neutral-400 focus:outline-none focus:border-cyan-500"
                    />
                    <button
                      onClick={() => {
                        localStorage.setItem('user_google_maps_api_key', customKey.trim());
                        window.location.reload();
                      }}
                      disabled={!customKey.trim()}
                      className={`px-4 py-2 ${themeConfig.accentBg} ${themeConfig.accentText} font-semibold rounded-xl text-xs`}
                    >
                      Reload
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
          {effectiveApiKey ? (
            <APIProvider apiKey={effectiveApiKey} libraries={['marker', 'geometry']}>
              <Map
                defaultCenter={mapCenter}
                defaultZoom={locationEntries.length > 0 ? 10 : 3}
                mapId="DEMO_MAP_ID"
                internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
                className="w-full h-full"
                gestureHandling="greedy"
                disableDefaultUI={false}
                colorScheme="DARK"
              >
                {locationEntries.map((entry) => (
                  <AdvancedMarker
                    key={entry.id}
                    position={{
                      lat: entry.location!.latitude,
                      lng: entry.location!.longitude,
                    }}
                    title={entry.title || 'Journal Entry'}
                    onClick={() => setActiveEntry(entry)}
                  >
                    <Pin
                      background="#06b6d4"
                      borderColor="#083344"
                      glyphColor="#164e63"
                      scale={1.2}
                    />
                  </AdvancedMarker>
                ))}

                {activeEntry && activeEntry.location && (
                  <InfoWindow
                    position={{
                      lat: activeEntry.location.latitude,
                      lng: activeEntry.location.longitude,
                    }}
                    onCloseClick={() => setActiveEntry(null)}
                  >
                    <div className="p-2.5 min-w-[220px] max-w-[280px] text-neutral-900 bg-white rounded-xl">
                      <div className="flex items-center space-x-1.5 text-xs text-cyan-700 font-bold mb-1">
                        <MapPin className="w-3.5 h-3.5 text-cyan-600" />
                        <span className="truncate">
                          {activeEntry.location.name || 'Pinned Location'}
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-neutral-950 mb-1 leading-tight line-clamp-2">
                        {activeEntry.title || 'Untitled Reflection'}
                      </h4>
                      <p className="text-xs text-neutral-600 mb-2 line-clamp-2">
                        {activeEntry.location.formattedAddress ||
                          activeEntry.messages[0]?.content ||
                          'No details recorded.'}
                      </p>
                      <div className="flex items-center justify-between pt-2 border-t border-neutral-200">
                        <span className="text-[10px] text-neutral-500 font-medium">
                          {formatTimestamp(activeEntry.createdAt)}
                        </span>
                        <button
                          onClick={() => {
                            celebrate(20);
                            onSelectEntry(activeEntry);
                            onClose();
                          }}
                          className={`px-3 py-1 ${themeConfig.accentBg} text-xs font-bold rounded-lg transition-all active:scale-95 flex items-center space-x-1 cursor-pointer`}
                        >
                          <BookOpen className="w-3 h-3" />
                          <span>Open</span>
                        </button>
                      </div>
                    </div>
                  </InfoWindow>
                )}
              </Map>
            </APIProvider>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center space-y-4">
              <div className={`w-12 h-12 rounded-2xl bg-gradient-to-tr ${themeConfig.primaryGradient} text-neutral-950 flex items-center justify-center shadow-lg font-bold`}>
                <Compass className="w-6 h-6 animate-pulse" />
              </div>
              <div className="max-w-md space-y-2">
                <h3 className="text-base font-serif font-semibold text-neutral-200">
                  Google Maps API Configuration
                </h3>
                <p className="text-xs text-neutral-400 leading-relaxed">
                  To view your pinned reflections on the global atlas, configure your Google Maps API key or use the free Maps Demo Key.
                </p>
              </div>
            </div>
          )}

          {/* Location Entries Drawer / Overlay */}
          {locationEntries.length === 0 && (
            <div className="absolute top-4 left-4 right-4 sm:right-auto sm:max-w-sm bg-neutral-900/90 backdrop-blur-md border border-neutral-800 p-4 rounded-2xl shadow-xl space-y-2 pointer-events-auto">
              <div className="flex items-center space-x-2 text-xs font-semibold text-cyan-400">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>No pinned locations yet</span>
              </div>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Open any journal entry and click <strong>"Pin Location"</strong> to attach a place on the map.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
