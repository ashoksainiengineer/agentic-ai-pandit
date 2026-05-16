/**
 * BirthPlacePicker Component - Optimized
 * Sacred Ivory Light Theme - Compact God Tier Design
 */

'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { MapPin, Search, Crosshair, Globe, X } from 'lucide-react';
import { logger } from '@/lib/secure-logger';

const InteractiveMap = dynamic(() => import('./InteractiveMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-48 bg-[var(--prism-canvas)] rounded-lg flex items-center justify-center border border-[#E8E0D5]">
      <div className="text-center">
        <div className="w-6 h-6 border-2 border-[#000000] border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-black/60 text-xs mt-2">Loading map...</p>
      </div>
    </div>
  )
});

interface LocationResult {
  id: string;
  city: string;
  district: string;
  state: string;
  country: string;
  pincode: string;
  latitude: number;
  longitude: number;
  timezone: string;
  displayName: string;
}

interface BirthPlacePickerProps {
  birthPlace: string;
  latitude: number;
  longitude: number;
  timezone: number;
  onUpdate: (updates: { birthPlace: string; latitude: number; longitude: number; timezone: number; }) => void;
}

type InputMode = 'search' | 'manual' | 'map';

// Cache for search results
const searchCache = new Map<string, { results: LocationResult[]; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Timezone lookup
const getTimezoneForCountry = (country: string, lng: number): string => {
  const countryTimezones: Record<string, string> = {
    'India': '5.5', 'Nepal': '5.75', 'Pakistan': '5', 'Bangladesh': '6',
    'Sri Lanka': '5.5', 'Myanmar': '6.5', 'Thailand': '7', 'Vietnam': '7',
    'Malaysia': '8', 'Singapore': '8', 'Indonesia': '7', 'Philippines': '8',
    'China': '8', 'Japan': '9', 'South Korea': '9', 'Australia': '10',
    'New Zealand': '12', 'United Kingdom': '0', 'United States': '-5',
    'Canada': '-5', 'Brazil': '-3', 'Germany': '1', 'France': '1',
    'Italy': '1', 'Spain': '1', 'Russia': '3', 'UAE': '4',
    'Saudi Arabia': '3', 'South Africa': '2', 'Egypt': '2', 'Kenya': '3',
    'Nigeria': '1',
  };
  for (const [countryName, tz] of Object.entries(countryTimezones)) {
    if (country.toLowerCase().includes(countryName.toLowerCase())) return tz;
  }
  const offset = Math.round(lng / 15 * 2) / 2;
  return offset.toString();
};

export default function BirthPlacePicker({ birthPlace, latitude, longitude, timezone, onUpdate }: BirthPlacePickerProps) {
  const [mode, setMode] = useState<InputMode>('search');
  const [searchQuery, setSearchQuery] = useState(birthPlace);
  const [searchResults, setSearchResults] = useState<LocationResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<LocationResult | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);

  const [manualLat, setManualLat] = useState(latitude ? latitude.toString() : '');
  const [manualLng, setManualLng] = useState(longitude ? longitude.toString() : '');
  const [manualTimezone, setManualTimezone] = useState(timezone ? timezone.toString() : '5.5');

  const [mapQuery, setMapQuery] = useState('');
  const [mapCenter, setMapCenter] = useState({ lat: latitude || 28.6139, lng: longitude || 77.2090 });
  const [mapZoom, setMapZoom] = useState(5);
  const [mapMarker, setMapMarker] = useState<{ lat: number; lng: number } | null>(latitude && longitude ? { lat: latitude, lng: longitude } : null);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Click outside handler
  useEffect(() => {
    const closeDropdownOnOutsideClick = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', closeDropdownOnOutsideClick);
    return () => document.removeEventListener('mousedown', closeDropdownOnOutsideClick);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      if (abortControllerRef.current) abortControllerRef.current.abort();
    };
  }, []);

  // Search cities with debounce and cancellation
  const searchCities = useCallback(async (query: string) => {
    if (query.length < 2) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }

    // Check cache
    const cached = searchCache.get(query);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      setSearchResults(cached.results);
      setShowDropdown(cached.results.length > 0);
      return;
    }

    setIsSearching(true);
    setSearchError(null);

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1&accept-language=en`,
        {
          headers: { 'User-Agent': 'AIPandit/1.0' },
          signal: abortControllerRef.current.signal
        }
      );

      if (!response.ok) throw new Error('Search failed');
      interface NominatimResult {
        place_id: number;
        name?: string;
        display_name: string;
        lat: string;
        lon: string;
        address?: {
          city?: string;
          town?: string;
          village?: string;
          municipality?: string;
          county?: string;
          state_district?: string;
          state?: string;
          country?: string;
          postcode?: string;
        };
      }
      const data: NominatimResult[] = await response.json();
      const results: LocationResult[] = data.map((item, index) => ({
        id: `${index}-${item.place_id}`,
        city: item.address?.city || item.address?.town || item.address?.village || item.address?.municipality || item.name || '',
        district: item.address?.county || item.address?.state_district || '',
        state: item.address?.state || '',
        country: item.address?.country || '',
        pincode: item.address?.postcode || '',
        latitude: parseFloat(item.lat),
        longitude: parseFloat(item.lon),
        timezone: getTimezoneForCountry(item.address?.country || '', parseFloat(item.lon)),
        displayName: item.display_name
      }));

      // Cache results
      searchCache.set(query, { results, timestamp: Date.now() });
      setSearchResults(results);
      setShowDropdown(results.length > 0);
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return;
      logger.error('City search failed', error instanceof Error ? error : new Error(String(error)));
      setSearchError('Search failed. Please try again.');
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Debounced search handler
  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);
    setSearchError(null);

    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      searchCities(value);
    }, 400);
  }, [searchCities]);

  // Clear search
  const clearSearch = useCallback(() => {
    setSearchQuery('');
    setSearchResults([]);
    setShowDropdown(false);
    setSearchError(null);
    inputRef.current?.focus();
  }, []);

  const updateBirthLocation = (location: LocationResult) => {
    setSelectedLocation(location);
    const formattedPlace = [location.city, location.district, location.state, location.country].filter(Boolean).join(', ');
    setSearchQuery(formattedPlace);
    setShowDropdown(false);
    onUpdate({ birthPlace: formattedPlace, latitude: location.latitude, longitude: location.longitude, timezone: parseFloat(location.timezone) });
  };

  const applyManualLocationInput = () => {
    const lat = parseFloat(manualLat);
    const lng = parseFloat(manualLng);
    const tz = parseFloat(manualTimezone);
    if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) return;
    onUpdate({ birthPlace: `${lat.toFixed(4)}°N, ${lng.toFixed(4)}°E`, latitude: lat, longitude: lng, timezone: tz });
  };

  const handleMapSearch = async () => {
    if (!mapQuery.trim()) return;
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(mapQuery)}&limit=1&addressdetails=1`, { headers: { 'User-Agent': 'AIPandit/1.0' } });
      const data = await response.json();
      if (data.length > 0) {
        const result = data[0];
        const lat = parseFloat(result.lat);
        const lng = parseFloat(result.lon);
        setMapCenter({ lat, lng });
        setMapZoom(12);
        setMapMarker({ lat, lng });
        const location: LocationResult = { id: result.place_id, city: result.address?.city || result.address?.town || result.name || '', district: result.address?.county || '', state: result.address?.state || '', country: result.address?.country || '', pincode: result.address?.postcode || '', latitude: lat, longitude: lng, timezone: getTimezoneForCountry(result.address?.country || '', lng), displayName: result.display_name };
        const formattedPlace = [location.city, location.district, location.state, location.country].filter(Boolean).join(', ');
        onUpdate({ birthPlace: formattedPlace, latitude: lat, longitude: lng, timezone: parseFloat(location.timezone) });
      }
    } catch (error) { logger.error('Map search failed', error instanceof Error ? error : new Error(String(error))); setSearchError('Map search failed. Please try again.'); }
  };

  return (
    <div className="space-y-3">
      {/* Mode Selector - Compact Tabs */}
      <div className="flex gap-1 p-1 bg-[var(--prism-canvas)] rounded-lg border border-[#E8E0D5]">
        {[
          { id: 'search', label: 'Search', icon: Search },
          { id: 'manual', label: 'Manual Coordinates', icon: Crosshair },
          { id: 'map', label: 'Map', icon: MapPin }
        ].map((m) => {
          const Icon = m.icon;
          return (
            <button key={m.id} type="button" onClick={() => setMode(m.id as InputMode)} className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-md text-xs font-medium transition-all ${mode === m.id ? 'bg-white text-black shadow-sm border border-[#E8E0D5]' : 'text-black/60 hover:text-black/60'}`}>
              <Icon className="w-3.5 h-3.5" />
              <span>{m.label}</span>
            </button>
          );
        })}
      </div>

      {/* Mode 1: City Search */}
      {mode === 'search' && (
        <div className="relative" ref={dropdownRef}>
          <div className="relative">
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              onFocus={() => searchResults.length > 0 && setShowDropdown(true)}
              className="w-full h-10 px-4 pr-20 bg-white border border-[#E8E0D5] rounded-lg text-black text-sm placeholder-[#959595] focus:border-[#000000] focus:ring-2 focus:ring-[#000000]/10 outline-none"
              placeholder="Type city name..."
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
              {searchQuery && (
                <button
                  type="button"
                  onClick={clearSearch}
                  className="p-1 hover:bg-[var(--prism-canvas)] rounded-full transition-colors"
                >
                  <X className="w-4 h-4 text-[#959595]" />
                </button>
              )}
              {isSearching && (
                <div className="w-4 h-4 border-2 border-[#000000] border-t-transparent rounded-full animate-spin" />
              )}
            </div>
          </div>

          {/* Error Message */}
          {searchError && (
            <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600">
              {searchError}
            </div>
          )}

          {showDropdown && searchResults.length > 0 && (
            <div className="absolute z-50 w-full mt-2 bg-white border border-[#E8E0D5] rounded-lg shadow-lg max-h-64 overflow-y-auto">
              {searchResults.map((result) => (
                <button
                  key={result.id}
                  type="button"
                  onClick={() => updateBirthLocation(result)}
                  className="w-full text-left px-4 py-3 hover:bg-[var(--prism-canvas)] transition-colors border-b border-[rgba(0,0,0,0.08)] last:border-0"
                >
                  <div className="font-medium text-black text-sm">{result.city || 'Unknown Location'}{result.district && <span className="text-black/60"> • {result.district}</span>}</div>
                  <div className="text-xs text-black/60">{[result.state, result.country].filter(Boolean).join(', ')}</div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-black">
                    <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {result.latitude.toFixed(4)}°, {result.longitude.toFixed(4)}°</span>
                    <span className="flex items-center gap-1"><Globe className="w-3 h-3" /> UTC{parseFloat(result.timezone) >= 0 ? '+' : ''}{result.timezone}</span>
                  </div>
                </button>
              ))}
            </div>
          )}

          {selectedLocation && (
            <div className="mt-3 p-3 bg-[#184131]/5 border border-[#184131]/20 rounded-lg">
              <div className="flex items-center gap-2 text-[#184131] text-xs font-medium mb-2"><span>✓</span><span>Location Selected</span></div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                <div><span className="text-black/60">City:</span><span className="text-black ml-1 font-medium">{selectedLocation.city}</span></div>
                {selectedLocation.district && (<div><span className="text-black/60">District:</span><span className="text-black ml-1">{selectedLocation.district}</span></div>)}
                <div><span className="text-black/60">State:</span><span className="text-black ml-1">{selectedLocation.state}</span></div>
                <div><span className="text-black/60">Country:</span><span className="text-black ml-1">{selectedLocation.country}</span></div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Mode 2: Manual Coordinates - Compact */}
      {mode === 'manual' && (
        <div className="space-y-3">
          <div className="p-3 bg-[#000000]/5 border border-[#000000]/20 rounded-lg text-xs text-black/60">
            <span className="font-medium">💡 Tip:</span> Find coordinates from Google Maps
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] text-black/60 mb-1 uppercase tracking-wider">Latitude</label>
              <input type="number" step="0.0001" min="-90" max="90" value={manualLat} onChange={(e) => setManualLat(e.target.value)} className="w-full h-10 px-3 bg-white border border-[#E8E0D5] rounded-lg text-black text-sm font-mono focus:border-[#000000] outline-none" placeholder="28.6139" />
            </div>
            <div>
              <label className="block text-[10px] text-black/60 mb-1 uppercase tracking-wider">Longitude</label>
              <input type="number" step="0.0001" min="-180" max="180" value={manualLng} onChange={(e) => setManualLng(e.target.value)} className="w-full h-10 px-3 bg-white border border-[#E8E0D5] rounded-lg text-black text-sm font-mono focus:border-[#000000] outline-none" placeholder="77.2090" />
            </div>
          </div>
          <div>
            <label className="block text-[10px] text-black/60 mb-1 uppercase tracking-wider">Timezone</label>
            <select value={manualTimezone} onChange={(e) => setManualTimezone(e.target.value)} className="w-full h-10 px-3 bg-white border border-[#E8E0D5] rounded-lg text-black text-sm focus:border-[#000000] outline-none">
              <option value="-12">UTC-12:00</option>
              <option value="-11">UTC-11:00</option>
              <option value="-10">UTC-10:00 (Hawaii)</option>
              <option value="-9">UTC-09:00 (Alaska)</option>
              <option value="-8">UTC-08:00 (Pacific)</option>
              <option value="-7">UTC-07:00 (Mountain)</option>
              <option value="-6">UTC-06:00 (Central)</option>
              <option value="-5">UTC-05:00 (Eastern)</option>
              <option value="-4">UTC-04:00 (Atlantic)</option>
              <option value="-3">UTC-03:00 (Brazil)</option>
              <option value="-2">UTC-02:00</option>
              <option value="-1">UTC-01:00</option>
              <option value="0">UTC+00:00 (London)</option>
              <option value="1">UTC+01:00 (Paris)</option>
              <option value="2">UTC+02:00 (Cairo)</option>
              <option value="3">UTC+03:00 (Moscow)</option>
              <option value="3.5">UTC+03:30 (Tehran)</option>
              <option value="4">UTC+04:00 (Dubai)</option>
              <option value="4.5">UTC+04:30 (Kabul)</option>
              <option value="5">UTC+05:00 (Pakistan)</option>
              <option value="5.5">UTC+05:30 (India)</option>
              <option value="5.75">UTC+05:45 (Nepal)</option>
              <option value="6">UTC+06:00 (Bangladesh)</option>
              <option value="6.5">UTC+06:30 (Myanmar)</option>
              <option value="7">UTC+07:00 (Bangkok)</option>
              <option value="8">UTC+08:00 (Singapore)</option>
              <option value="9">UTC+09:00 (Japan)</option>
              <option value="9.5">UTC+09:30 (Australia)</option>
              <option value="10">UTC+10:00 (Sydney)</option>
              <option value="11">UTC+11:00</option>
              <option value="12">UTC+12:00 (New Zealand)</option>
            </select>
          </div>
          <button type="button" onClick={applyManualLocationInput} className="w-full h-10 bg-black text-white font-medium rounded-lg hover:shadow-md transition-all text-sm">Apply Coordinates</button>
          {latitude !== undefined && longitude !== undefined && latitude !== 0 && longitude !== 0 && (
            <div className="p-3 bg-[#184131]/5 border border-[#184131]/20 rounded-lg text-xs">
              <span className="text-[#184131] font-medium">✓ Current:</span>
              <span className="text-black ml-2 font-mono">{latitude.toFixed(4)}°, {longitude.toFixed(4)}° (UTC{timezone >= 0 ? '+' : ''}{timezone})</span>
            </div>
          )}
        </div>
      )}

      {/* Mode 3: Map Picker - Compact */}
      {mode === 'map' && (
        <div className="space-y-3">
          <div className="flex gap-2">
            <input type="text" value={mapQuery} onChange={(e) => setMapQuery(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleMapSearch()} className="flex-1 h-10 px-4 bg-white border border-[#E8E0D5] rounded-lg text-black text-sm focus:border-[#000000] outline-none" placeholder="Search location..." />
            <button type="button" onClick={handleMapSearch} className="px-4 h-10 bg-black text-white font-medium rounded-lg hover:shadow-md transition-all text-sm">Search</button>
          </div>
          <InteractiveMap center={mapCenter} zoom={mapZoom} marker={mapMarker} onLocationSelect={async (lat, lng) => {
            setMapMarker({ lat, lng });
            try {
              const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`, { headers: { 'User-Agent': 'AIPandit/1.0' } });
              const data = await response.json();
              const country = data.address?.country || '';
              const city = data.address?.city || data.address?.town || data.address?.village || '';
              const state = data.address?.state || '';
              const formattedPlace = [city, state, country].filter(Boolean).join(', ') || `${lat.toFixed(4)}°N, ${lng.toFixed(4)}°E`;
              onUpdate({ birthPlace: formattedPlace, latitude: lat, longitude: lng, timezone: parseFloat(getTimezoneForCountry(country, lng)) });
            } catch {
              onUpdate({ birthPlace: `${lat.toFixed(4)}°N, ${lng.toFixed(4)}°E`, latitude: lat, longitude: lng, timezone: parseFloat(getTimezoneForCountry('', lng)) });
            }
          }} onCenterChange={setMapCenter} />
          {mapMarker && (
            <div className="p-3 bg-[#184131]/5 border border-[#184131]/20 rounded-lg">
              <div className="flex items-center gap-2 text-[#184131] text-xs font-medium mb-1"><MapPin className="w-3.5 h-3.5" /><span>Selected</span></div>
              <div className="font-mono text-xs text-black">Lat: {mapMarker.lat.toFixed(6)}°, Lng: {mapMarker.lng.toFixed(6)}°</div>
            </div>
          )}
          <p className="text-[10px] text-black/60 flex items-center gap-1"><span>💡</span> Search city, then click map to fine-tune</p>
        </div>
      )}

      {/* Current Selection */}
      {(latitude && longitude && mode !== 'search') && (
        <div className="p-3 bg-[var(--prism-canvas)] rounded-lg border border-[#E8E0D5]">
          <div className="text-[10px] text-black/60 mb-1 uppercase tracking-wider">Selected Location</div>
          <div className="text-sm text-black font-medium">{birthPlace || 'Not set'}</div>
          <div className="text-xs text-black font-mono mt-1">{latitude.toFixed(4)}°N, {longitude.toFixed(4)}°E • UTC{timezone >= 0 ? '+' : ''}{timezone}</div>
        </div>
      )}
    </div>
  );
}
