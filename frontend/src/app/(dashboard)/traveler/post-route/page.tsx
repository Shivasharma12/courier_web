'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api-client';
import { MapPin, Calendar, Plane, Car, Bike, Truck, Train, Loader2, Package, Crosshair, Clock, Info, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { calculateDistance, cn } from '@/lib/utils';

import LocationPicker from '@/components/location-picker';

export default function PostRoutePage() {
    const [hubs, setHubs] = useState<any[]>([]);
    const [detecting, setDetecting] = useState(false);
    const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
    const [availableParcels, setAvailableParcels] = useState<any[]>([]);
    const [fetchingParcels, setFetchingParcels] = useState(false);
    const [selectedParcelIds, setSelectedParcelIds] = useState<Set<string>>(new Set());

    const [formData, setFormData] = useState({
        fromLocation: '',
        fromLat: 0,
        fromLng: 0,
        toLocation: '',
        toLat: 0,
        toLng: 0,
        startMode: 'hub' as 'hub' | 'direct',
        endMode: 'hub' as 'hub' | 'direct',
        startHubId: '',
        endHubId: '',
        travelDate: '',
        departureTime: '',
        mode: 'car',
        capacity: 5
    });
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    useEffect(() => {
        const fetchHubs = async () => {
            try {
                const { data } = await api.get('/hubs');
                setHubs(data);
            } catch (err) {
                console.error(err);
            }
        };
        fetchHubs();
    }, []);

    // Fetch parcels at the selected starting hub
    useEffect(() => {
        if (formData.startHubId) {
            const fetchParcelsAtHub = async () => {
                setFetchingParcels(true);
                try {
                    // Use hub-inventory endpoint (accessible to all roles, not admin-only)
                    const { data } = await api.get(`/parcels/hub-inventory/${formData.startHubId}`);
                    // Only show at_hub parcels that haven't been assigned to a traveler yet
                    setAvailableParcels(data.filter((p: any) => p.status === 'at_hub' && !p.assignedTo));
                } catch (err) {
                    console.error('Failed to fetch parcels at hub:', err);
                } finally {
                    setFetchingParcels(false);
                }
            };
            fetchParcelsAtHub();
        } else {
            setAvailableParcels([]);
        }
    }, [formData.startHubId]);

    const toggleParcel = (id: string) => {
        setSelectedParcelIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id); else next.add(id);
            return next;
        });
    };

    const detectGPS = (type: 'start' | 'end') => {
        setDetecting(true);
        if (!navigator.geolocation) {
            toast.error("Geolocation is not supported by your browser");
            setDetecting(false);
            return;
        }

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                if (type === 'start') setUserCoords({ lat: latitude, lng: longitude });

                try {
                    const { data } = await api.get(`/geocoding/reverse?lat=${latitude}&lng=${longitude}`);
                    const address = data.display_name;
                    setFormData(prev => ({
                        ...prev,
                        [type === 'start' ? 'fromLocation' : 'toLocation']: address,
                        [type === 'start' ? 'fromLat' : 'toLat']: latitude,
                        [type === 'start' ? 'fromLng' : 'toLng']: longitude
                    }));
                } catch (error) {
                    console.error('Reverse geocode failed:', error);
                    const coordsStr = `Coordinates: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
                    setFormData(prev => ({
                        ...prev,
                        [type === 'start' ? 'fromLocation' : 'toLocation']: coordsStr,
                        [type === 'start' ? 'fromLat' : 'toLat']: latitude,
                        [type === 'start' ? 'fromLng' : 'toLng']: longitude
                    }));
                } finally {
                    setDetecting(false);
                    toast.success("Location detected!");
                }
            },
            () => {
                toast.error("Unable to detect location. Please use manual search.");
                setDetecting(false);
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
    };

    const sortedHubsByDistance = (lat: number, lng: number) => {
        return [...hubs]
            .map(hub => ({
                ...hub,
                distance: calculateDistance(lat, lng, hub.lat, hub.lng)
            }))
            .sort((a, b) => a.distance - b.distance);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.post('/travel-plans', formData);
            // Claim any selected parcels — hub manager will dispatch to confirm
            if (selectedParcelIds.size > 0) {
                await Promise.all(
                    [...selectedParcelIds].map(id => api.post(`/parcels/${id}/assign-traveler`))
                );
                toast.success(`Route posted! ${selectedParcelIds.size} parcel(s) claimed — awaiting hub dispatch.`);
            } else {
                toast.success('Travel route posted successfully!');
            }
            router.push('/traveler/deliveries');
        } catch (err: any) {
            console.error(err);
            toast.error(err.response?.data?.message || 'Failed to post route');
        } finally {
            setLoading(false);
        }
    };

    const modeIcons: any = {
        bike: Bike,
        car: Car,
        van: Truck,
        plane: Plane,
        train: Train
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8 pb-32">
            <div>
                <h1 className="text-3xl font-bold text-foreground tracking-tight">Post Your Travel Route</h1>
                <p className="text-muted-foreground mt-1 font-medium">Share your journey and help deliver parcels along the way.</p>
            </div>

            <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-xl shadow-border/50 border border-border p-10 space-y-8">
                {/* Pickup Section */}
                <div className="grid md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                                <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 p-1.5 rounded-lg"><MapPin className="h-4 w-4" /></span>
                                <h3 className="font-bold text-foreground/80 uppercase text-[10px] tracking-widest">Start Point</h3>
                            </div>
                            <button
                                type="button"
                                onClick={() => detectGPS('start')}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl text-[10px] font-bold hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-all"
                            >
                                <Crosshair className={cn("h-3.5 w-3.5", detecting && "animate-spin")} />
                                {userCoords ? "Update GPS" : "Detect Location"}
                            </button>
                        </div>

                        <div className="space-y-4">
                            <LocationPicker
                                placeholder="Search starting area..."
                                value={formData.fromLocation}
                                onLocationSelect={(address, lat, lng) => {
                                    setUserCoords({ lat, lng });
                                    setFormData(prev => ({ ...prev, fromLocation: address, fromLat: lat, fromLng: lng }));
                                }}
                            />

                            {userCoords && (
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">
                                        Select Starting Hub
                                    </label>
                                    <select
                                        className="w-full bg-muted/30 border border-border rounded-2xl px-4 py-3 text-sm font-bold text-foreground focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                        value={formData.startHubId}
                                        onChange={(e) => setFormData({ ...formData, startHubId: e.target.value })}
                                    >
                                        <option value="">Choose nearest hub</option>
                                        {sortedHubsByDistance(userCoords.lat, userCoords.lng).map(hub => (
                                            <option key={hub.id} value={hub.id}>
                                                {hub.name} ({hub.distance.toFixed(1)}km away)
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 p-1.5 rounded-lg"><MapPin className="h-4 w-4" /></span>
                            <h3 className="font-bold text-foreground/80 uppercase text-[10px] tracking-widest">Destination</h3>
                        </div>
                        <div className="space-y-4">
                            <LocationPicker
                                placeholder="Search destination..."
                                value={formData.toLocation}
                                hideGPS
                                onLocationSelect={(address, lat, lng) => {
                                    setFormData(prev => ({ ...prev, toLocation: address, toLat: lat, toLng: lng }));
                                }}
                            />
                            {formData.toLat > 0 && (
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">
                                        Select Destination Hub
                                    </label>
                                    <select
                                        className="w-full bg-muted/30 border border-border rounded-2xl px-4 py-3 text-sm font-bold text-foreground focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                        value={formData.endHubId}
                                        onChange={(e) => setFormData({ ...formData, endHubId: e.target.value })}
                                    >
                                        <option value="">Choose nearest hub</option>
                                        {sortedHubsByDistance(formData.toLat, formData.toLng).map(hub => (
                                            <option key={hub.id} value={hub.id}>
                                                {hub.name} ({hub.distance.toFixed(1)}km away)
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {formData.startHubId && (
                    <div className="bg-muted/30 rounded-[2rem] p-6 space-y-4 border border-border">
                        <div className="flex items-center justify-between">
                            <h4 className="text-xs font-black text-foreground uppercase tracking-widest flex items-center gap-2">
                                <Package className="h-4 w-4 text-blue-500" />
                                Select Parcels to Carry
                            </h4>
                            <span className="bg-blue-100 text-blue-600 px-3 py-1 rounded-full text-[10px] font-bold">
                                {fetchingParcels ? 'Refreshing...' : `${availableParcels.length} Available`}
                            </span>
                        </div>
                        <p className="text-[10px] text-muted-foreground font-medium -mt-2">
                            Check the parcels you want to carry. Hub manager will dispatch them to you.
                        </p>

                        {fetchingParcels ? (
                            <div className="flex justify-center py-4">
                                <Loader2 className="h-6 w-6 text-blue-500 animate-spin" />
                            </div>
                        ) : availableParcels.length > 0 ? (
                            <div className="grid md:grid-cols-2 gap-3">
                                {availableParcels.map((parcel: any) => {
                                    const isSelected = selectedParcelIds.has(parcel.id);
                                    return (
                                        <button
                                            key={parcel.id}
                                            type="button"
                                            onClick={() => toggleParcel(parcel.id)}
                                            className={`text-left p-3 rounded-xl border-2 flex items-center gap-3 transition-all ${isSelected
                                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-sm'
                                                : 'border-border bg-background dark:bg-slate-800 hover:border-blue-300'
                                                }`}
                                        >
                                            <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${isSelected ? 'border-blue-600 bg-blue-600' : 'border-border'
                                                }`}>
                                                {isSelected && <CheckCircle2 className="h-3.5 w-3.5 text-white" />}
                                            </div>
                                            <div className="flex flex-col min-w-0">
                                                <span className="text-[11px] font-bold text-foreground truncate">
                                                    #{parcel.trackingNumber}
                                                </span>
                                                <span className="text-[10px] text-muted-foreground">
                                                    To: {parcel.destinationHub?.name || parcel.receiverAddress?.split(',')[0] || 'Destination'}
                                                </span>
                                                <span className="text-[9px] text-muted-foreground/80">{parcel.weight}kg</span>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="text-center py-4">
                                <p className="text-[10px] text-muted-foreground font-bold italic">No parcels currently waiting at this hub.</p>
                                <p className="text-[9px] text-muted-foreground mt-1">Post your route anyway to get notified when one arrives!</p>
                            </div>
                        )}
                        {selectedParcelIds.size > 0 && (
                            <div className="bg-blue-600 text-white rounded-xl px-4 py-2 text-[11px] font-bold text-center">
                                ✓ {selectedParcelIds.size} parcel{selectedParcelIds.size > 1 ? 's' : ''} selected — hub manager will dispatch them to you
                            </div>
                        )}
                    </div>
                )}

                <div className="grid md:grid-cols-3 gap-8">
                    {/* Travel Date */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">
                            Travel Date
                        </label>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <Calendar className="h-5 w-5 text-muted-foreground/50 group-focus-within:text-blue-600 transition-colors" />
                            </div>
                            <input
                                type="date"
                                required
                                min={new Date().toISOString().split('T')[0]}
                                className="w-full bg-muted/30 border border-border rounded-2xl pl-12 pr-4 py-4 text-sm font-bold text-foreground focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:[color-scheme:dark]"
                                value={formData.travelDate}
                                onChange={(e) => setFormData({ ...formData, travelDate: e.target.value })}
                            />
                        </div>
                    </div>

                    {/* Departure Time */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">
                            Departure Time
                        </label>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <Clock className="h-5 w-5 text-muted-foreground/50 group-focus-within:text-blue-600 transition-colors" />
                            </div>
                            <input
                                type="time"
                                required
                                className="w-full bg-muted/30 border border-border rounded-2xl pl-12 pr-4 py-4 text-sm font-bold text-foreground focus:ring-2 focus:ring-blue-500 outline-none transition-all [color-scheme:light] dark:[color-scheme:dark]"
                                value={formData.departureTime}
                                onChange={(e) => setFormData({ ...formData, departureTime: e.target.value })}
                            />
                        </div>
                    </div>

                    {/* Capacity */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">
                            Capacity
                        </label>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <Package className="h-5 w-5 text-muted-foreground/50 group-focus-within:text-blue-600 transition-colors" />
                            </div>
                            <input
                                type="number"
                                required
                                min="1"
                                max="50"
                                className="w-full bg-muted/30 border border-border rounded-2xl pl-12 pr-4 py-4 text-sm font-bold text-foreground focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                value={formData.capacity || ''}
                                onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) || 0 })}
                            />
                        </div>
                    </div>
                </div>

                {/* Mode of Transport */}
                <div className="space-y-4">
                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1 text-center block">Mode of Transport</label>
                    <div className="grid grid-cols-5 gap-4">
                        {['bike', 'car', 'van', 'plane', 'train'].map((mode) => {
                            const Icon = modeIcons[mode];
                            const isActive = formData.mode === mode;
                            return (
                                <button
                                    key={mode}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, mode })}
                                    className={`p-6 rounded-[2rem] border-2 transition-all group flex flex-col items-center gap-3 ${isActive
                                        ? 'border-blue-600 bg-blue-600 text-white shadow-lg shadow-blue-500/20 scale-105'
                                        : 'border-border bg-muted/30 hover:bg-background hover:border-blue-400'
                                        }`}
                                >
                                    <Icon className={`h-8 w-8 ${isActive ? 'text-white' : 'text-muted-foreground/40 group-hover:text-blue-500'} transition-colors`} />
                                    <p className={`text-[10px] font-black uppercase tracking-widest ${isActive ? 'text-white' : 'text-muted-foreground'}`}>
                                        {mode}
                                    </p>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Security Note */}
                <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-2xl p-4 flex gap-3">
                    <Info className="h-5 w-5 text-blue-500 shrink-0" />
                    <p className="text-[10px] text-blue-700 dark:text-blue-300 font-medium leading-relaxed">
                        To maintain security, travelers only move parcels between designated hubs. Our route matching will show you parcels at your starting hub and any intermediate hubs along your journey.
                    </p>
                </div>

                {/* Submit */}
                <div className="flex gap-4 pt-4">
                    <button
                        type="button"
                        onClick={() => router.back()}
                        className="flex-1 px-8 py-5 rounded-3xl border-2 border-border text-sm font-black text-muted-foreground uppercase tracking-widest hover:bg-muted/50 hover:border-blue-200 transition-all"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={loading || !formData.startHubId || !formData.endHubId}
                        className="flex-[2] bg-blue-600 hover:bg-blue-700 text-white font-black py-5 px-8 rounded-3xl text-sm uppercase tracking-widest transition-all shadow-xl shadow-blue-500/20 disabled:opacity-50 flex items-center justify-center gap-3 transform hover:scale-[1.02] active:scale-95"
                    >
                        {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <MapPin className="h-5 w-5" />}
                        Post My Route
                    </button>
                </div>
            </form>
        </div>
    );
}
