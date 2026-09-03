import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  APIProvider,
  Map,
  AdvancedMarker,
  Pin,
  MapMouseEvent,
  useMap,
  useMapsLibrary,
} from '@vis.gl/react-google-maps';
import {
  MapPin,
  Navigation,
  Search,
  X,
  Check,
  Trash2,
  Compass,
  AlertCircle,
  ExternalLink,
  Layers,
  Sparkles,
  MapPinned,
  Building,
} from 'lucide-react';
import { JournalLocation } from '../types';
import { isValidCoordinate, sanitizePayload } from '../utils/sanitize';
import { useAppTheme } from '../context/ThemeContext';

interface LocationPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLocation?: JournalLocation;
  onSaveLocation: (location: JournalLocation | null) => void;
}

interface AutocompletePrediction {
  placeId: string;
  description: string;
  mainText: string;
  secondaryText?: string;
}

// Default fallback coordinates (San Francisco center)
const DEFAULT_CENTER = { lat: 37.7749, lng: -122.4194 };

// Inner component inside APIProvider with access to Google Maps SDK hooks
const LocationPickerInner: React.FC<{
  currentLocation?: JournalLocation;
  onClose: () => void;
  onSaveLocation: (location: JournalLocation | null) => void;
  effectiveApiKey: string;
  onSaveCustomKey: (key: string) => void;
}> = ({
  currentLocation,
  onClose,
  onSaveLocation,
  effectiveApiKey,
  onSaveCustomKey,
}) => {
  const map = useMap();
  const geocodingLib = useMapsLibrary('geocoding');
  const placesLib = useMapsLibrary('places');
  const { themeConfig, celebrate } = useAppTheme();

  const [selectedLocation, setSelectedLocation] = useState<JournalLocation | null>(
    currentLocation || null
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [predictions, setPredictions] = useState<AutocompletePrediction[]>([]);
  const [showPredictions, setShowPredictions] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Map camera state
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number }>(
    currentLocation && isValidCoordinate(currentLocation.latitude, currentLocation.longitude)
      ? { lat: currentLocation.latitude, lng: currentLocation.longitude }
      : DEFAULT_CENTER
  );
  const [mapZoom, setMapZoom] = useState<number>(currentLocation ? 14 : 11);

  const autocompleteServiceRef = useRef<google.maps.places.AutocompleteService | null>(null);
  const placesServiceRef = useRef<google.maps.places.PlacesService | null>(null);

  // Initialize Places services
  useEffect(() => {
    if (placesLib) {
      autocompleteServiceRef.current = new placesLib.AutocompleteService();
      if (map) {
        placesServiceRef.current = new placesLib.PlacesService(map);
      }
    }
  }, [placesLib, map]);

  // Sync current location on open
  useEffect(() => {
    if (currentLocation && isValidCoordinate(currentLocation.latitude, currentLocation.longitude)) {
      setSelectedLocation(currentLocation);
      setMapCenter({ lat: currentLocation.latitude, lng: currentLocation.longitude });
      setMapZoom(14);
      if (map) {
        map.panTo({ lat: currentLocation.latitude, lng: currentLocation.longitude });
        map.setZoom(14);
      }
    } else {
      setSelectedLocation(null);
    }
    setErrorMsg(null);
  }, [currentLocation, map]);

  // Fetch Autocomplete predictions as user types
  useEffect(() => {
    if (!autocompleteServiceRef.current || !searchQuery.trim() || searchQuery.trim().length < 2) {
      setPredictions([]);
      return;
    }

    const timer = setTimeout(() => {
      autocompleteServiceRef.current?.getPlacePredictions(
        { input: searchQuery.trim() },
        (results, status) => {
          if (
            status === 'OK' &&
            results &&
            results.length > 0
          ) {
            setPredictions(
              results.slice(0, 5).map((r) => ({
                placeId: r.place_id,
                description: r.description,
                mainText: r.structured_formatting?.main_text || r.description,
                secondaryText: r.structured_formatting?.secondary_text,
              }))
            );
            setShowPredictions(true);
          } else {
            setPredictions([]);
          }
        }
      );
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Reverse Geocoding helper with multi-tier fallback
  const reverseGeocode = async (lat: number, lng: number): Promise<{ formattedAddress: string; name: string; placeId?: string }> => {
    // 1. Client-Side Google Geocoder (Uses browser session & referrer)
    if (geocodingLib) {
      try {
        const geocoder = new geocodingLib.Geocoder();
        const res = await geocoder.geocode({ location: { lat, lng } });
        if (res.results && res.results.length > 0) {
          const first = res.results[0];
          return {
            formattedAddress: first.formatted_address || `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
            placeId: first.place_id,
            name: first.address_components?.[0]?.long_name || 'Pinned Location',
          };
        }
      } catch (err) {
        console.warn('Client Google reverse geocoding fallback:', err);
      }
    }

    // 2. Backend Proxy Geocoding
    try {
      const res = await fetch(`/api/maps/geocode?latlng=${lat},${lng}`);
      const data = await res.json();
      if (data.status === 'OK' && Array.isArray(data.results) && data.results.length > 0) {
        const first = data.results[0];
        return {
          formattedAddress: first.formatted_address || `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
          placeId: first.place_id,
          name: first.address_components?.[0]?.long_name || 'Pinned Location',
        };
      }
    } catch (err) {
      console.warn('Backend proxy reverse geocoding fallback:', err);
    }

    return {
      formattedAddress: `Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)}`,
      name: 'Pinned Point',
    };
  };

  // Perform Forward Search (supports query string or placeId)
  const executeSearch = async (query: string, placeId?: string) => {
    if (!query.trim() && !placeId) return;

    setIsSearching(true);
    setErrorMsg(null);
    setShowPredictions(false);

    try {
      // 1. If placeId provided, fetch place details using client PlacesService or Geocoder
      if (placeId && geocodingLib) {
        try {
          const geocoder = new geocodingLib.Geocoder();
          const response = await geocoder.geocode({ placeId });
          if (response.results && response.results.length > 0) {
            const result = response.results[0];
            const lat = result.geometry.location.lat();
            const lng = result.geometry.location.lng();

            if (isValidCoordinate(lat, lng)) {
              const loc: JournalLocation = {
                latitude: lat,
                longitude: lng,
                formattedAddress: result.formatted_address || query,
                placeId: result.place_id,
                name: result.address_components?.[0]?.long_name || query,
              };
              setSelectedLocation(loc);
              setMapCenter({ lat, lng });
              setMapZoom(14);
              if (map) {
                map.panTo({ lat, lng });
                map.setZoom(14);
              }
              setIsSearching(false);
              return;
            }
          }
        } catch (e) {
          console.warn('Geocoder placeId lookup fallback:', e);
        }
      }

      // 2. Direct coordinate query detection (e.g. "28.6139, 77.2090")
      const coordMatch = query.match(/^(-?\d+(\.\d+)?),\s*(-?\d+(\.\d+)?)$/);
      if (coordMatch) {
        const lat = parseFloat(coordMatch[1]);
        const lng = parseFloat(coordMatch[3]);
        if (isValidCoordinate(lat, lng)) {
          const details = await reverseGeocode(lat, lng);
          const loc: JournalLocation = {
            latitude: lat,
            longitude: lng,
            formattedAddress: details.formattedAddress,
            placeId: details.placeId,
            name: details.name,
          };
          setSelectedLocation(loc);
          setMapCenter({ lat, lng });
          setMapZoom(14);
          if (map) {
            map.panTo({ lat, lng });
            map.setZoom(14);
          }
          setIsSearching(false);
          return;
        }
      }

      // 3. Client-Side Google Places TextSearch (Best for POIs, cities, landmarks)
      if (placesServiceRef.current) {
        try {
          const placesResult = await new Promise<google.maps.places.PlaceResult[] | null>((resolve) => {
            placesServiceRef.current?.textSearch({ query }, (results, status) => {
              if (status === 'OK' && results && results.length > 0) {
                resolve(results);
              } else {
                resolve(null);
              }
            });
          });

          if (placesResult && placesResult.length > 0) {
            const first = placesResult[0];
            if (first.geometry?.location) {
              const lat = first.geometry.location.lat();
              const lng = first.geometry.location.lng();
              if (isValidCoordinate(lat, lng)) {
                const loc: JournalLocation = {
                  latitude: lat,
                  longitude: lng,
                  formattedAddress: first.formatted_address || query,
                  placeId: first.place_id,
                  name: first.name || query,
                };
                setSelectedLocation(loc);
                setMapCenter({ lat, lng });
                setMapZoom(14);
                if (map) {
                  map.panTo({ lat, lng });
                  map.setZoom(14);
                }
                setIsSearching(false);
                return;
              }
            }
          }
        } catch (placesErr) {
          console.warn('Places textSearch issue, proceeding to geocoder:', placesErr);
        }
      }

      // 4. Client-Side Google Geocoder (Runs directly in browser)
      if (geocodingLib) {
        try {
          const geocoder = new geocodingLib.Geocoder();
          const response = await geocoder.geocode({ address: query });
          if (response.results && response.results.length > 0) {
            const result = response.results[0];
            const lat = result.geometry.location.lat();
            const lng = result.geometry.location.lng();

            if (isValidCoordinate(lat, lng)) {
              const loc: JournalLocation = {
                latitude: lat,
                longitude: lng,
                formattedAddress: result.formatted_address || query,
                placeId: result.place_id,
                name: result.address_components?.[0]?.long_name || query,
              };
              setSelectedLocation(loc);
              setMapCenter({ lat, lng });
              setMapZoom(14);
              if (map) {
                map.panTo({ lat, lng });
                map.setZoom(14);
              }
              setIsSearching(false);
              return;
            }
          }
        } catch (clientGeocodeErr) {
          console.warn('Client Google geocode issue, trying backend proxy:', clientGeocodeErr);
        }
      }

      // 5. Backend Proxy Geocoding & Global Place Resolution
      const res = await fetch(`/api/maps/geocode?address=${encodeURIComponent(query)}`);
      const data = await res.json();

      if (data.status === 'OK' && Array.isArray(data.results) && data.results.length > 0) {
        const result = data.results[0];
        const lat = typeof result.geometry.location.lat === 'function'
          ? result.geometry.location.lat()
          : Number(result.geometry.location.lat);
        const lng = typeof result.geometry.location.lng === 'function'
          ? result.geometry.location.lng()
          : Number(result.geometry.location.lng);

        if (isValidCoordinate(lat, lng)) {
          const loc: JournalLocation = {
            latitude: lat,
            longitude: lng,
            formattedAddress: result.formatted_address || query,
            placeId: result.place_id,
            name: result.address_components?.[0]?.long_name || query,
          };
          setSelectedLocation(loc);
          setMapCenter({ lat, lng });
          setMapZoom(14);
          if (map) {
            map.panTo({ lat, lng });
            map.setZoom(14);
          }
          setIsSearching(false);
          return;
        }
      }

      setErrorMsg(`No locations found for "${query}". Try typing a city, country, or landmark name.`);
    } catch (err: any) {
      console.error('Location search error:', err);
      setErrorMsg('Search encountered an issue. You can click anywhere on the map to pin a place directly.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    executeSearch(searchQuery.trim());
  };

  // Handle map click to place pin
  const handleMapClick = useCallback(async (event: MapMouseEvent) => {
    if (!event.detail.latLng) return;
    const lat = event.detail.latLng.lat;
    const lng = event.detail.latLng.lng;

    if (!isValidCoordinate(lat, lng)) return;

    // Optimistically pin location
    setSelectedLocation({
      latitude: lat,
      longitude: lng,
      name: 'Selected Pin',
      formattedAddress: `Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)}`,
    });

    // Lookup address in background
    const details = await reverseGeocode(lat, lng);
    setSelectedLocation({
      latitude: lat,
      longitude: lng,
      formattedAddress: details.formattedAddress,
      placeId: details.placeId,
      name: details.name,
    });
  }, [geocodingLib]);

  // Current Geolocation trigger
  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setErrorMsg('Geolocation is not supported by your browser.');
      return;
    }

    setIsLocating(true);
    setErrorMsg(null);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;

        if (isValidCoordinate(lat, lng)) {
          setMapCenter({ lat, lng });
          setMapZoom(16);
          if (map) {
            map.panTo({ lat, lng });
            map.setZoom(16);
          }

          const details = await reverseGeocode(lat, lng);
          setSelectedLocation({
            latitude: lat,
            longitude: lng,
            formattedAddress: details.formattedAddress,
            placeId: details.placeId,
            name: details.name || 'Current Location',
          });
        }
        setIsLocating(false);
      },
      (err) => {
        console.warn('Geolocation error:', err);
        setIsLocating(false);
        if (err.code === 1) {
          setErrorMsg('Location permission was denied. Please allow location access in your browser.');
        } else {
          setErrorMsg('Unable to retrieve current location.');
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  };

  const handleConfirm = () => {
    if (selectedLocation) {
      if (isValidCoordinate(selectedLocation.latitude, selectedLocation.longitude)) {
        onSaveLocation(sanitizePayload(selectedLocation));
        celebrate(30);
      } else {
        setErrorMsg('Invalid coordinates. Please re-pin on the map.');
        return;
      }
    } else {
      onSaveLocation(null);
    }
    onClose();
  };

  return (
    <div className="flex-1 flex flex-col p-5 sm:p-6 space-y-4 overflow-y-auto">
      {/* Search & Location Controls Bar */}
      <div className="flex flex-col sm:flex-row gap-3 relative z-30">
        <div className="relative flex-1">
          <form onSubmit={handleSearchSubmit} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <input
                id="input-location-search"
                type="text"
                placeholder="Search country, city, landmark, or address (e.g. India, Paris, Kyoto)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => {
                  if (predictions.length > 0) setShowPredictions(true);
                }}
                className="w-full pl-10 pr-4 py-2.5 bg-black/90 border border-neutral-700/80 rounded-xl text-xs sm:text-sm text-neutral-100 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 shadow-inner"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setPredictions([]);
                    setShowPredictions(false);
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-200"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <button
              id="btn-search-location"
              type="submit"
              disabled={isSearching || !searchQuery.trim()}
              className={`px-4 py-2.5 ${themeConfig.accentBg} text-xs font-bold rounded-xl transition-all shadow-md flex items-center space-x-1.5 disabled:opacity-50 cursor-pointer active:scale-95`}
            >
              {isSearching ? (
                <div className="w-3.5 h-3.5 border-2 border-neutral-950 border-t-transparent rounded-full animate-spin" />
              ) : (
                <Search className="w-3.5 h-3.5" />
              )}
              <span>Search</span>
            </button>
          </form>

          {/* Autocomplete Predictions Dropdown */}
          {showPredictions && predictions.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1.5 bg-neutral-900 border border-neutral-700 rounded-xl shadow-2xl overflow-hidden z-40 animate-in fade-in slide-in-from-top-1 duration-150">
              <div className="py-1">
                {predictions.map((p) => (
                  <button
                    key={p.placeId}
                    type="button"
                    onClick={() => {
                      setSearchQuery(p.description);
                      executeSearch(p.description, p.placeId);
                    }}
                    className="w-full text-left px-3.5 py-2.5 hover:bg-neutral-800 flex items-start space-x-2.5 transition-colors border-b border-neutral-800/60 last:border-0 cursor-pointer"
                  >
                    <MapPin className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-neutral-100 truncate">{p.mainText}</p>
                      {p.secondaryText && (
                        <p className="text-[11px] text-neutral-400 truncate">{p.secondaryText}</p>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <button
          id="btn-use-current-location"
          type="button"
          onClick={handleUseCurrentLocation}
          disabled={isLocating}
          className="px-4 py-2.5 bg-neutral-800 hover:bg-neutral-750 text-cyan-300 border border-cyan-500/30 text-xs font-semibold rounded-xl transition-colors flex items-center justify-center space-x-2 disabled:opacity-50 shrink-0 cursor-pointer active:scale-95"
        >
          <Navigation className={`w-3.5 h-3.5 ${isLocating ? 'animate-spin' : ''}`} />
          <span>{isLocating ? 'Locating...' : 'Current Location'}</span>
        </button>
      </div>

      {/* Error / Alert Banner */}
      {errorMsg && (
        <div className="flex items-center space-x-2 p-3 bg-rose-950/40 border border-rose-800/60 rounded-xl text-xs text-rose-300 animate-in fade-in">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Interactive Google Map Area */}
      <div className="relative w-full h-80 sm:h-96 rounded-2xl border border-neutral-700/80 overflow-hidden bg-black shadow-inner">
        <Map
          center={mapCenter}
          zoom={mapZoom}
          onCameraChanged={(ev) => {
            setMapCenter(ev.detail.center);
            setMapZoom(ev.detail.zoom);
          }}
          onClick={handleMapClick}
          mapId="DEMO_MAP_ID"
          internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
          className="w-full h-full"
          gestureHandling="greedy"
          disableDefaultUI={false}
          colorScheme="DARK"
        >
          {selectedLocation &&
            isValidCoordinate(selectedLocation.latitude, selectedLocation.longitude) && (
              <AdvancedMarker
                position={{
                  lat: selectedLocation.latitude,
                  lng: selectedLocation.longitude,
                }}
                title={selectedLocation.name || 'Pinned Location'}
              >
                <Pin
                  background="#06b6d4"
                  borderColor="#083344"
                  glyphColor="#164e63"
                  scale={1.2}
                />
              </AdvancedMarker>
            )}
        </Map>

        {/* Overlay Helper Badge */}
        <div className="absolute bottom-3 left-3 bg-neutral-900/90 backdrop-blur-md border border-neutral-700/80 px-3 py-1.5 rounded-xl text-[11px] text-neutral-300 flex items-center space-x-2 pointer-events-none shadow-lg">
          <Layers className="w-3.5 h-3.5 text-cyan-400" />
          <span>Click anywhere on the map to drop or move the pin</span>
        </div>
      </div>

      {/* Selected Pin Details Display */}
      {selectedLocation && (
        <div className="bg-black/90 border border-neutral-800 p-4 rounded-2xl flex items-start justify-between gap-4 animate-in fade-in slide-in-from-bottom-2 duration-150">
          <div className="flex items-start space-x-3 min-w-0">
            <div className={`w-9 h-9 rounded-xl bg-gradient-to-tr ${themeConfig.primaryGradient} text-neutral-950 flex items-center justify-center shrink-0 mt-0.5 font-bold shadow-md`}>
              <MapPinned className="w-4 h-4" />
            </div>
            <div className="min-w-0 space-y-0.5">
              <div className="flex items-center space-x-2">
                <h4 className="text-xs sm:text-sm font-semibold text-neutral-100 truncate">
                  {selectedLocation.name || 'Pinned Location'}
                </h4>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-cyan-950/60 text-cyan-300 border border-cyan-800/40 font-bold">
                  Attached
                </span>
              </div>
              <p className="text-xs text-neutral-400 truncate">
                {selectedLocation.formattedAddress || 'No address details'}
              </p>
              <p className="text-[11px] font-mono text-neutral-500">
                {selectedLocation.latitude.toFixed(5)}, {selectedLocation.longitude.toFixed(5)}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setSelectedLocation(null)}
            className="text-neutral-400 hover:text-rose-400 p-1.5 rounded-lg hover:bg-neutral-800 transition-colors cursor-pointer"
            title="Clear pin"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Footer Actions */}
      <div className="flex items-center justify-between pt-2 border-t border-neutral-800/80">
        <div>
          {currentLocation && (
            <button
              type="button"
              onClick={() => {
                setSelectedLocation(null);
                onSaveLocation(null);
                onClose();
              }}
              className="text-xs text-rose-400 hover:text-rose-300 flex items-center space-x-1.5 px-3 py-2 rounded-xl hover:bg-rose-950/30 transition-all active:scale-95 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Remove Pin</span>
            </button>
          )}
        </div>

        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 rounded-xl transition-all active:scale-95 cursor-pointer"
          >
            Cancel
          </button>
          <button
            id="btn-confirm-attach-location"
            type="button"
            onClick={handleConfirm}
            className={`px-5 py-2.5 ${themeConfig.accentBg} font-bold text-xs rounded-xl shadow-md transition-all active:scale-95 flex items-center space-x-1.5 cursor-pointer`}
          >
            <Check className="w-3.5 h-3.5" />
            <span>Attach Location</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export const LocationPickerModal: React.FC<LocationPickerModalProps> = ({
  isOpen,
  onClose,
  currentLocation,
  onSaveLocation,
}) => {
  const envKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';
  const [serverKey, setServerKey] = useState<string>('');
  const [customKey, setCustomKey] = useState<string>(() => {
    return localStorage.getItem('user_google_maps_api_key') || '';
  });
  const effectiveApiKey = envKey || serverKey || customKey;
  const { themeConfig } = useAppTheme();

  const [mapAuthError, setMapAuthError] = useState(false);

  useEffect(() => {
    (window as any).gm_authFailure = () => {
      setMapAuthError(true);
    };
  }, []);

  // Auto-fetch API key from backend if not defined in client env or storage
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

  const handleSaveCustomKey = (key: string) => {
    setCustomKey(key.trim());
    localStorage.setItem('user_google_maps_api_key', key.trim());
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-neutral-900/95 border border-neutral-800 rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden backdrop-blur-xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800/80 bg-black/80">
          <div className="flex items-center space-x-3">
            <div className={`w-9 h-9 rounded-xl bg-gradient-to-tr ${themeConfig.primaryGradient} flex items-center justify-center text-neutral-950 font-bold shadow-md`}>
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-serif font-semibold text-neutral-100 flex items-center space-x-2">
                <span>Attach Location</span>
              </h2>
              <p className="text-xs text-neutral-400">
                Pin a physical or inspirational place to your reflection entry
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

        {/* Modal Body with Google Maps API Provider */}
        {effectiveApiKey && !mapAuthError ? (
          <APIProvider
            apiKey={effectiveApiKey}
            libraries={['places', 'marker', 'geometry', 'geocoding']}
          >
            <LocationPickerInner
              currentLocation={currentLocation}
              onClose={onClose}
              onSaveLocation={onSaveLocation}
              effectiveApiKey={effectiveApiKey}
              onSaveCustomKey={handleSaveCustomKey}
            />
          </APIProvider>
        ) : mapAuthError ? (
          <div className="p-8 flex flex-col items-center justify-center text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-red-950/50 flex items-center justify-center mx-auto text-red-500">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-serif font-semibold text-white">Google Maps API Error</h3>
            <p className="text-sm text-neutral-400 max-w-md">
              Billing is not enabled for the provided Google Maps API key, or the key is invalid.
            </p>
            <div className="p-4 bg-black border border-white/10 rounded-none text-xs text-neutral-500 text-left max-w-md w-full mt-4">
              <p>For zero-cost prototyping, get a free Maps Demo Key here:</p>
              <a href="https://mapsplatform.google.com/maps-demo-key?utm_campaign=gmp_mcp_codeassist_v1_aistudio" target="_blank" rel="noreferrer" className="text-white hover:underline mt-1 block truncate">
                mapsplatform.google.com/maps-demo-key
              </a>
            </div>
            <p className="text-xs text-neutral-500 max-w-md">
              Set this key in your AI Studio Secrets as <code className="text-white font-mono">VITE_GOOGLE_MAPS_API_KEY</code> or update it below.
            </p>
            <div className="w-full max-w-sm space-y-2 mt-4">
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
                    handleSaveCustomKey(customKey);
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
        ) : (
          <div className="p-8 flex flex-col items-center justify-center text-center space-y-4">
            <div className={`w-12 h-12 rounded-2xl bg-gradient-to-tr ${themeConfig.primaryGradient} text-neutral-950 flex items-center justify-center shadow-lg font-bold`}>
              <Compass className="w-6 h-6 animate-pulse" />
            </div>
            <div className="max-w-md space-y-1.5">
              <h3 className="text-sm font-semibold text-neutral-200">
                Google Maps API Configuration
              </h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                To enable interactive location search and mapping, paste your Google Maps API key or free demo key.
              </p>
            </div>

            <div className="w-full max-w-sm space-y-2">
              <div className="flex gap-2">
                <input
                  type="password"
                  placeholder="Paste Google Maps API Key"
                  value={customKey}
                  onChange={(e) => setCustomKey(e.target.value)}
                  className="flex-1 px-3 py-2 bg-black border border-neutral-700 rounded-xl text-xs text-neutral-200 placeholder-neutral-400 focus:outline-none focus:border-cyan-500"
                />
                <button
                  type="button"
                  onClick={() => handleSaveCustomKey(customKey)}
                  disabled={!customKey.trim()}
                  className={`px-4 py-2 ${themeConfig.accentBg} text-xs font-bold rounded-xl transition-colors disabled:opacity-50 cursor-pointer`}
                >
                  Save
                </button>
              </div>

              <div className="flex items-center justify-center text-[11px] text-neutral-400 pt-2">
                <a
                  href="https://mapsplatform.google.com/maps-demo-key?utm_campaign=gmp_mcp_codeassist_v1_aistudio"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${themeConfig.accentText} hover:underline flex items-center space-x-1 font-semibold`}
                >
                  <span>Get free Maps Demo Key</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
