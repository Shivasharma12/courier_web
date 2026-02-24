'use client';

import { useEffect, useRef, useState } from 'react';
import { MapPin, Loader2, Crosshair } from 'lucide-react';
import { toast } from 'sonner';

interface LocationPickerProps {
    onLocationSelect: (address: string, lat: number, lng: number) => void;
    onLocationData?: (data: NominatimResult) => void;
    placeholder?: string;
    defaultLabel?: string;
    value?: string;
    hideGPS?: boolean;
}

interface NominatimResult {
    display_name: string;
    lat: string;
    lon: string;
    place_id: number;
    address?: {
        suburb?: string;
        neighbourhood?: string;
        colony?: string;
        village?: string;
        town?: string;
        city?: string;
        county?: string;
        state?: string;
        postcode?: string;
        country?: string;
    };
}

export default function LocationPicker({ onLocationSelect, onLocationData, placeholder, defaultLabel, value, hideGPS }: LocationPickerProps) {
    const [address, setAddress] = useState(value || '');
    const [suggestions, setSuggestions] = useState<NominatimResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const debounceTimer = useRef<NodeJS.Timeout | undefined>(undefined);

    useEffect(() => {
        if (value !== undefined) {
            setAddress(value);
        }
    }, [value]);

    const searchAddress = async (query: string) => {
        if (query.length < 3) {
            setSuggestions([]);
            return;
        }

        setLoading(true);
        try {
            // Using our backend geocoding proxy with the correct /api prefix
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
            const response = await fetch(`${apiUrl}/geocoding/search?q=${encodeURIComponent(query)}`);

            if (response.ok) {
                const data = await response.json();
                setSuggestions(data);
                setShowSuggestions(true);
            } else {
                // If proxy fails (e.g. 404, 500), try direct fallback
                console.warn('Proxy fetch returned non-ok status, attempting direct fallback...');
                const fallbackResponse = await fetch(
                    `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5&addressdetails=1`,
                    { headers: { 'User-Agent': 'CourierWebApp/1.0' } }
                );

                if (fallbackResponse.ok) {
                    const fallbackData = await fallbackResponse.json();
                    setSuggestions(fallbackData);
                    setShowSuggestions(true);
                } else {
                    console.error('Both proxy and direct fallback failed');
                    setSuggestions([]);
                }
            }
        } catch (error) {
            // This catches network errors (failed to fetch)
            console.error('Location search network error:', error);
            setSuggestions([]);
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (value: string) => {
        setAddress(value);

        // Debounce search requests
        if (debounceTimer.current) {
            clearTimeout(debounceTimer.current);
        }

        debounceTimer.current = setTimeout(() => {
            searchAddress(value);
        }, 500);
    };

    const handleSelectSuggestion = (suggestion: NominatimResult) => {
        const lat = parseFloat(suggestion.lat);
        const lng = parseFloat(suggestion.lon);
        setAddress(suggestion.display_name);
        setSuggestions([]);
        setShowSuggestions(false);
        onLocationSelect(suggestion.display_name, lat, lng);
        if (onLocationData) {
            onLocationData(suggestion);
        }
    };

    return (
        <div className="relative">
            {defaultLabel && <label className="text-sm font-medium text-slate-700 block mb-1">{defaultLabel}</label>}
            <div className="relative">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <input
                    type="text"
                    placeholder={placeholder || "Search address..."}
                    className="w-full pl-12 pr-12 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                    value={address}
                    onChange={(e) => handleInputChange(e.target.value)}
                    onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                />
                {loading && (
                    <Loader2 className="absolute right-12 top-1/2 -translate-y-1/2 h-5 w-5 text-blue-500 animate-spin" />
                )}
                {!hideGPS && (
                    <button
                        type="button"
                        title="Detect my location"
                        onClick={(e) => {
                            e.preventDefault();
                            if (!navigator.geolocation) {
                                toast.error('Geolocation is not supported by your browser');
                                return;
                            }
                            setLoading(true);
                            navigator.geolocation.getCurrentPosition(
                                async (position) => {
                                    const { latitude, longitude } = position.coords;
                                    // Reverse geocode to get address
                                    try {
                                        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
                                        const response = await fetch(`${apiUrl}/geocoding/reverse?lat=${latitude}&lng=${longitude}`);
                                        if (response.ok) {
                                            const data = await response.json();
                                            const displayName = data.display_name;
                                            setAddress(displayName);
                                            onLocationSelect(displayName, latitude, longitude);
                                            if (onLocationData) onLocationData(data);
                                        } else {
                                            // Simple lat/lng if reverse geocode fails
                                            const addr = `Coordinates: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
                                            setAddress(addr);
                                            onLocationSelect(addr, latitude, longitude);
                                        }
                                    } catch (error) {
                                        console.error('Reverse geocode error:', error);
                                    } finally {
                                        setLoading(false);
                                    }
                                },
                                (error) => {
                                    setLoading(false);
                                    let message = 'Failed to detect location';
                                    switch (error.code) {
                                        case error.PERMISSION_DENIED:
                                            message = 'Location permission denied. Please enable it in your browser.';
                                            break;
                                        case error.POSITION_UNAVAILABLE:
                                            message = 'Location information is unavailable.';
                                            break;
                                        case error.TIMEOUT:
                                            message = 'Location request timed out.';
                                            break;
                                    }
                                    console.error('Geolocation error:', message, error);
                                    toast.error(message);
                                },
                                { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
                            );
                        }}
                        className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-blue-600 transition-colors"
                    >
                        <Crosshair className="h-4 w-4" />
                    </button>
                )}
            </div>

            {/* Suggestions Dropdown */}
            {showSuggestions && suggestions.length > 0 && (
                <div className="absolute z-50 w-full mt-2 bg-white border border-slate-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                    {suggestions.map((suggestion) => {
                        const addr = suggestion.address;
                        const localArea = addr?.neighbourhood || addr?.suburb || addr?.village || addr?.colony || addr?.county;
                        const mainCity = addr?.city || addr?.town || addr?.state;

                        return (
                            <button
                                key={suggestion.place_id}
                                onClick={() => handleSelectSuggestion(suggestion)}
                                className="w-full px-4 py-3 text-left hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-b-0 flex items-start gap-3"
                            >
                                <MapPin className="h-4 w-4 text-blue-500 mt-1 flex-shrink-0" />
                                <div className="flex flex-col">
                                    <span className="text-sm font-bold text-slate-700">
                                        {localArea ? `${localArea}, ` : ''}{mainCity}
                                    </span>
                                    <span className="text-[10px] text-slate-400 line-clamp-1">{suggestion.display_name}</span>
                                </div>
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
