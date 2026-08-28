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
            status === google.maps.places.PlacesServiceStatus.OK &&
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

      // 3. Client-Side Google Geocoder (Runs directly in browser)
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

      // 4. Backend Proxy Geocoding (with OSM fallback built in)
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

      setErrorMsg(`No locations found for "${query}". Try searching a city, country, or specific landmark.`);
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
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
              <input
                id="input-location-search"
                type="text"
                placeholder="Search country, city, landmark, or address (e.g. India, Paris, Kyoto)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => {
                  if (predictions.length > 0) setShowPredictions(true);
                }}
                className="w-full pl-10 pr-4 py-2.5 bg-stone-950/90 border border-stone-700/80 rounded-xl text-xs sm:text-sm text-stone-100 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 shadow-inner"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setPredictions([]);
                    setShowPredictions(false);
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-200"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <button
              id="btn-search-location"
              type="submit"
              disabled={isSearching || !searchQuery.trim()}
              className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-semibold rounded-xl transition-all shadow-md shadow-amber-500/20 flex items-center space-x-1.5 disabled:opacity-50"
            >
              {isSearching ? (
                <div className="w-3.5 h-3.5 border-2 border-stone-900 border-t-transparent rounded-full animate-spin" />
              ) : (
                <Search className="w-3.5 h-3.5" />
              )}
              <span>Search</span>
            </button>
          </form>

          {/* Autocomplete Predictions Dropdown */}
          {showPredictions && predictions.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1.5 bg-stone-900 border border-stone-700 rounded-xl shadow-2xl overflow-hidden z-40 animate-in fade-in slide-in-from-top-1 duration-150">
              <div className="py-1">
                {predictions.map((p) => (
                  <button
                    key={p.placeId}
                    type="button"
                    onClick={() => {
                      setSearchQuery(p.description);
                      executeSearch(p.description, p.placeId);
                    }}
                    className="w-full text-left px-3.5 py-2.5 hover:bg-stone-800 flex items-start space-x-2.5 transition-colors border-b border-stone-800/60 last:border-0"
                  >
                    <MapPin className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-stone-100 truncate">{p.mainText}</p>
                      {p.secondaryText && (
                        <p className="text-[11px] text-stone-400 truncate">{p.secondaryText}</p>
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
          className="px-4 py-2.5 bg-stone-800 hover:bg-stone-700 text-amber-300 border border-amber-500/30 text-xs font-semibold rounded-xl transition-colors flex items-center justify-center space-x-2 disabled:opacity-50 shrink-0"
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
      <div className="relative w-full h-80 sm:h-96 rounded-xl border border-stone-700/80 overflow-hidden bg-stone-950 shadow-inner">
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
                  background="#f59e0b"
                  borderColor="#78350f"
                  glyphColor="#451a03"
                  scale={1.2}
                />
              </AdvancedMarker>
            )}
        </Map>

        {/* Overlay Helper Badge */}
        <div className="absolute bottom-3 left-3 bg-stone-900/90 backdrop-blur-sm border border-stone-700/80 px-3 py-1.5 rounded-lg text-[11px] text-stone-300 flex items-center space-x-2 pointer-events-none shadow-lg">
          <Layers className="w-3.5 h-3.5 text-amber-400" />
          <span>Click anywhere on the map to drop or move the pin</span>
        </div>
      </div>

      {/* Selected Pin Details Display */}
      {selectedLocation && (
        <div className="bg-stone-950/90 border border-stone-800 p-4 rounded-xl flex items-start justify-between gap-4 animate-in fade-in slide-in-from-bottom-2 duration-150">
          <div className="flex items-start space-x-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
              <MapPinned className="w-4 h-4" />
            </div>
            <div className="min-w-0 space-y-0.5">
              <div className="flex items-center space-x-2">
                <h4 className="text-xs sm:text-sm font-semibold text-stone-100 truncate">
                  {selectedLocation.name || 'Pinned Location'}
                </h4>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-950/60 text-amber-300 border border-amber-800/40">
                  Attached
                </span>
              </div>
              <p className="text-xs text-stone-400 truncate">
                {selectedLocation.formattedAddress || 'No address details'}
              </p>
              <p className="text-[11px] font-mono text-stone-400">
                {selectedLocation.latitude.toFixed(5)}, {selectedLocation.longitude.toFixed(5)}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setSelectedLocation(null)}
            className="text-stone-400 hover:text-rose-400 p-1.5 rounded-lg hover:bg-stone-800 transition-colors"
            title="Clear pin"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Footer Actions */}
      <div className="flex items-center justify-between pt-2 border-t border-stone-800/80">
        <div>
          {currentLocation && (
            <button
              type="button"
              onClick={() => {
                setSelectedLocation(null);
                onSaveLocation(null);
                onClose();
              }}
              className="text-xs text-rose-400 hover:text-rose-300 flex items-center space-x-1.5 px-3 py-2 rounded-xl hover:bg-rose-950/30 transition-colors"
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
            className="px-4 py-2 text-xs font-medium text-stone-400 hover:text-stone-200 hover:bg-stone-800 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            id="btn-confirm-attach-location"
            type="button"
            onClick={handleConfirm}
            className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-stone-950 font-semibold text-xs rounded-xl shadow-lg shadow-amber-500/20 transition-all flex items-center space-x-1.5"
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-stone-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-stone-900 border border-stone-800 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-800 bg-stone-900/90">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-stone-100 flex items-center space-x-2">
                <span>Location Pinning</span>
                <span className="text-[10px] font-medium tracking-wide uppercase px-2 py-0.5 rounded-full bg-stone-800 text-stone-400 border border-stone-700">
                  Google Maps Platform
                </span>
              </h2>
              <p className="text-xs text-stone-400">
                Pin a physical or inspirational place to your reflection entry
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-stone-400 hover:text-stone-200 hover:bg-stone-800 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body with Google Maps API Provider */}
        {effectiveApiKey ? (
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
        ) : (
          <div className="p-8 flex flex-col items-center justify-center text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Compass className="w-6 h-6 animate-pulse" />
            </div>
            <div className="max-w-md space-y-1.5">
              <h3 className="text-sm font-semibold text-stone-200">
                Google Maps API Configuration
              </h3>
              <p className="text-xs text-stone-400 leading-relaxed">
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
                  className="flex-1 px-3 py-2 bg-stone-950 border border-stone-700 rounded-xl text-xs text-stone-200 placeholder-stone-400 focus:outline-none focus:border-amber-500"
                />
                <button
                  type="button"
                  onClick={() => handleSaveCustomKey(customKey)}
                  disabled={!customKey.trim()}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-semibold rounded-xl transition-colors disabled:opacity-50"
                >
                  Save
                </button>
              </div>

              <div className="flex items-center justify-center text-[11px] text-stone-400 pt-2">
                <a
                  href="https://mapsplatform.google.com/maps-demo-key?utm_campaign=gmp_mcp_codeassist_v1_aistudio"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-amber-400 hover:text-amber-300 flex items-center space-x-1"
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
