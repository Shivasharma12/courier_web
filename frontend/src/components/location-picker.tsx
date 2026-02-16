'use client';

import { useEffect, useRef, useState } from 'react';
import { MapPin, Loader2 } from 'lucide-react';

interface LocationPickerProps {
    onLocationSelect: (address: string, lat: number, lng: number) => void;
    onLocationData?: (data: NominatimResult) => void;
    placeholder?: string;
    defaultLabel?: string;
}

interface NominatimResult {
    display_name: string;
    lat: string;
    lon: string;
    place_id: number;
    address?: {
        suburb?: string;
        neighbourhood?: string;
        village?: string;
        town?: string;
        city?: string;
        county?: string;
        state?: string;
        postcode?: string;
        country?: string;
    };
}

export default function LocationPicker({ onLocationSelect, onLocationData, placeholder, defaultLabel }: LocationPickerProps) {
    const [address, setAddress] = useState('');
    const [suggestions, setSuggestions] = useState<NominatimResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const debounceTimer = useRef<NodeJS.Timeout | undefined>(undefined);

    const searchAddress = async (query: string) => {
        if (query.length < 3) {
            setSuggestions([]);
            return;
        }

        setLoading(true);
        try {
            // Using OpenStreetMap Nominatim API for geocoding
            const response = await fetch(
                `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5&addressdetails=1`,
                {
                    headers: {
                        'User-Agent': 'CourierWebApp/1.0'
                    }
                }
            );
            const data = await response.json();
            setSuggestions(data);
            setShowSuggestions(true);
        } catch (error) {
            console.error('Error fetching location suggestions:', error);
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
                    <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-blue-500 animate-spin" />
                )}
            </div>

            {/* Suggestions Dropdown */}
            {showSuggestions && suggestions.length > 0 && (
                <div className="absolute z-50 w-full mt-2 bg-white border border-slate-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                    {suggestions.map((suggestion) => (
                        <button
                            key={suggestion.place_id}
                            onClick={() => handleSelectSuggestion(suggestion)}
                            className="w-full px-4 py-3 text-left hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-b-0 flex items-start gap-3"
                        >
                            <MapPin className="h-4 w-4 text-blue-500 mt-1 flex-shrink-0" />
                            <span className="text-sm text-slate-700">{suggestion.display_name}</span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
