'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api-client';
import LocationPicker from '@/components/location-picker';
import ImageUpload from '@/components/ui/image-upload';
import { Package, Send, Info, Loader2, MapPin, Camera, Ruler, Weight, Crosshair } from 'lucide-react';
import { toast } from 'sonner';
import { calculateDistance, cn } from '@/lib/utils';

export default function CreateParcelPage() {
    const [hubs, setHubs] = useState<any[]>([]);
    const [formData, setFormData] = useState({
        senderAddress: '',
        senderLat: 0,
        senderLng: 0,
        receiverName: '',
        receiverPhone: '',
        receiverAddress: '',
        receiverLat: 0,
        receiverLng: 0,
        weight: 1,
        length: 10,
        width: 10,
        height: 10,
        description: '',
        images: [] as string[],
        pickupMode: 'hub' as 'hub' | 'direct',
        deliveryMode: 'hub' as 'hub' | 'direct',
        currentHubId: '',
        destinationHubId: '',
    });
    const [senderCoords, setSenderCoords] = useState<{ lat: number, lng: number } | null>(null);
    const [receiverCoords, setReceiverCoords] = useState<{ lat: number, lng: number } | null>(null);
    const [detectingSender, setDetectingSender] = useState(false);
    const [detectingReceiver, setDetectingReceiver] = useState(false);
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    useEffect(() => {
        const fetchHubs = async () => {
            try {
                const { data } = await api.get('/hubs');
                setHubs(data);
            } catch (err) {
                console.error('Failed to fetch hubs:', err);
                toast.error('Failed to load hubs');
            }
        };
        fetchHubs();
    }, []);

    const detectSenderLocation = () => {
        if (!navigator.geolocation) {
            toast.error('Geolocation is not supported');
            return;
        }
        setDetectingSender(true);
        navigator.geolocation.getCurrentPosition(
            async (pos) => {
                const { latitude, longitude } = pos.coords;
                setSenderCoords({ lat: latitude, lng: longitude });
                try {
                    const { data } = await api.get(`/geocoding/reverse?lat=${latitude}&lng=${longitude}`);
                    setFormData(prev => ({ ...prev, senderAddress: data.display_name, senderLat: latitude, senderLng: longitude }));
                } catch (e) { console.error(e); }
                finally { setDetectingSender(false); toast.success('Starting location detected!'); }
            },
            () => { setDetectingSender(false); toast.error('Failed to detect starting location'); },
            { enableHighAccuracy: true }
        );
    };

    const detectReceiverLocation = () => {
        if (!navigator.geolocation) {
            toast.error('Geolocation is not supported');
            return;
        }
        setDetectingReceiver(true);
        navigator.geolocation.getCurrentPosition(
            async (pos) => {
                const { latitude, longitude } = pos.coords;
                setReceiverCoords({ lat: latitude, lng: longitude });
                try {
                    const { data } = await api.get(`/geocoding/reverse?lat=${latitude}&lng=${longitude}`);
                    setFormData(prev => ({ ...prev, receiverAddress: data.display_name, receiverLat: latitude, receiverLng: longitude }));
                } catch (e) { console.error(e); }
                finally { setDetectingReceiver(false); toast.success('Destination location detected!'); }
            },
            () => { setDetectingReceiver(false); toast.error('Failed to detect destination location'); },
            { enableHighAccuracy: true }
        );
    };

    const sortedHubs = (coords: { lat: number, lng: number } | null) => {
        if (!coords) return hubs;
        return [...hubs]
            .map(hub => ({ ...hub, dist: calculateDistance(coords.lat, coords.lng, hub.lat, hub.lng) }))
            .filter(hub => hub.dist <= 50)
            .sort((a, b) => a.dist - b.dist);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const dataToSubmit = {
                ...formData,
                images: JSON.stringify(formData.images)
            };
            const { data: created } = await api.post('/parcels', dataToSubmit);
            const hubName = hubs.find(h => h.id === formData.currentHubId)?.name || 'the selected hub';
            toast.success(`Parcel request created! Drop it at ${hubName} within 48 hours.`, { duration: 6000 });
            router.push('/customer/history');
        } catch (err: any) {
            console.error(err);
            toast.error(err.response?.data?.message || 'Failed to create parcel');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8 pb-20">
            <div>
                <h1 className="text-3xl font-bold text-foreground">Ship Your Parcel</h1>
                <p className="text-muted-foreground mt-1">Provide shipment details and connect with global travelers.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
                {/* Locations Section */}
                <div className="grid md:grid-cols-2 gap-6">
                    <div className="bg-background rounded-2xl shadow-sm border border-border p-6 space-y-4">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="font-semibold text-foreground flex items-center gap-2">
                                <span className="bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 p-1.5 rounded-lg"><MapPin className="h-4 w-4" /></span>
                                Pickup Location
                            </h3>
                            {senderCoords ? (
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] text-green-600 dark:text-green-400 font-bold flex items-center gap-1 bg-green-50 dark:bg-green-900/20 px-2 py-0.5 rounded-md">
                                        <MapPin className="h-3 w-3" /> Location Set
                                    </span>
                                    <button
                                        type="button"
                                        onClick={detectSenderLocation}
                                        className="p-1 px-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg text-[10px] font-bold flex items-center gap-1 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                                    >
                                        <Crosshair className={cn("h-3 w-3", detectingSender && "animate-spin")} />
                                        Update GPS
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setSenderCoords(null)}
                                        className="p-1 px-2 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-bold hover:bg-slate-200 transition-colors"
                                    >
                                        Reset
                                    </button>
                                </div>
                            ) : (
                                <button
                                    type="button"
                                    onClick={detectSenderLocation}
                                    className="p-1 px-2 bg-muted text-muted-foreground rounded-lg text-[10px] font-bold flex items-center gap-1 hover:bg-muted/80 transition-colors"
                                >
                                    <Crosshair className={cn("h-3 w-3", detectingSender && "animate-spin")} />
                                    Detect Location
                                </button>
                            )}
                        </div>
                        {senderCoords && (
                            <div className="px-1 py-2 border-t border-border mt-1">
                                <p className="text-[11px] font-semibold text-foreground leading-tight">
                                    <span className="text-muted-foreground font-medium">Selected:</span> {formData.senderAddress}
                                </p>
                            </div>
                        )}
                        <div className="space-y-4">
                            {!senderCoords && (
                                <div className="space-y-2">
                                    <p className="text-[10px] text-muted-foreground font-medium px-1">
                                        Search your area to find hubs:
                                    </p>
                                    <LocationPicker
                                        placeholder="Enter your address or city..."
                                        value={formData.senderAddress}
                                        onLocationSelect={(address, lat, lng) => {
                                            setSenderCoords({ lat, lng });
                                            setFormData(prev => ({ ...prev, senderAddress: address, senderLat: lat, senderLng: lng }));
                                        }}
                                    />
                                </div>
                            )}
                            {senderCoords && (
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">
                                        Select Starting Hub ({sortedHubs(senderCoords).length} within 50km)
                                    </label>
                                    <select
                                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-bold text-foreground disabled:opacity-50"
                                        value={formData.currentHubId}
                                        onChange={(e) => setFormData({ ...formData, currentHubId: e.target.value })}
                                    >
                                        <option value="">Select pickup hub</option>
                                        {sortedHubs(senderCoords).map(hub => (
                                            <option key={hub.id} value={hub.id}>
                                                {hub.name} ({hub.dist.toFixed(1)}km away)
                                            </option>
                                        ))}
                                    </select>
                                    {sortedHubs(senderCoords).length === 0 && (
                                        <p className="text-[10px] text-red-500 font-bold px-1 animate-pulse">
                                            No hubs found near this location.
                                        </p>
                                    )}
                                    <p className="text-[10px] text-muted-foreground font-medium px-1 italic">
                                        Note: You must drop the parcel at a hub.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="bg-background rounded-2xl shadow-sm border border-border p-6 space-y-4">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="font-semibold text-foreground flex items-center gap-2">
                                <span className="bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 p-1.5 rounded-lg"><MapPin className="h-4 w-4" /></span>
                                Drop-off Location
                            </h3>
                            {receiverCoords ? (
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] text-red-600 dark:text-red-400 font-bold flex items-center gap-1 bg-red-50 dark:bg-red-900/20 px-2 py-0.5 rounded-md">
                                        <MapPin className="h-3 w-3" /> Location Set
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => setReceiverCoords(null)}
                                        className="p-1 px-2 bg-muted text-muted-foreground rounded-lg text-[10px] font-bold hover:bg-muted/80 transition-colors"
                                    >
                                        Reset
                                    </button>
                                </div>
                            ) : null}
                        </div>
                        {receiverCoords && (
                            <div className="px-1 py-2 border-t border-border mt-1">
                                <p className="text-[11px] font-semibold text-foreground leading-tight">
                                    <span className="text-muted-foreground font-medium">Selected:</span> {formData.receiverAddress}
                                </p>
                            </div>
                        )}
                        <div className="space-y-2">
                            {!receiverCoords && (
                                <div className="space-y-2">
                                    <p className="text-[10px] text-muted-foreground font-medium px-1">
                                        Search your area to find hubs:
                                    </p>
                                    <LocationPicker
                                        placeholder="Enter drop-off address or city..."
                                        value={formData.receiverAddress}
                                        hideGPS
                                        onLocationSelect={(address, lat, lng) => {
                                            setReceiverCoords({ lat, lng });
                                            setFormData(prev => ({ ...prev, receiverAddress: address, receiverLat: lat, receiverLng: lng }));
                                        }}
                                    />
                                </div>
                            )}
                            {receiverCoords && (
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">
                                        Select Destination Hub ({sortedHubs(receiverCoords).length} within 50km)
                                    </label>
                                    <select
                                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-bold text-foreground"
                                        value={formData.destinationHubId}
                                        onChange={(e) => setFormData({ ...formData, destinationHubId: e.target.value })}
                                    >
                                        <option value="">Select destination hub</option>
                                        {sortedHubs(receiverCoords).map(hub => (
                                            <option key={hub.id} value={hub.id}>
                                                {hub.name} ({hub.dist.toFixed(1)}km away)
                                            </option>
                                        ))}
                                    </select>
                                    {sortedHubs(receiverCoords).length === 0 && (
                                        <p className="text-[10px] text-red-500 font-bold px-1 animate-pulse">
                                            No hubs within 50km. Try a different location.
                                        </p>
                                    )}
                                    <p className="text-[10px] text-muted-foreground font-medium px-1 italic">
                                        Parcels must be delivered to a destination hub for safe collection.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Receiver & Parcel Details */}
                <div className="grid md:grid-cols-2 gap-6">
                    <div className="bg-background rounded-2xl shadow-sm border border-border p-6 space-y-4">
                        <h3 className="font-semibold text-foreground flex items-center gap-2">
                            <span className="bg-muted text-muted-foreground p-1.5 rounded-lg"><Info className="h-4 w-4" /></span>
                            Receiver Details
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1 block">Full Name</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900/50 border border-border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-foreground"
                                    value={formData.receiverName}
                                    onChange={(e) => setFormData({ ...formData, receiverName: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1 block">Phone Number</label>
                                <input
                                    type="tel"
                                    required
                                    className="w-full px-4 py-2 bg-muted/30 border border-border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-foreground"
                                    value={formData.receiverPhone}
                                    onChange={(e) => setFormData({ ...formData, receiverPhone: e.target.value })}
                                />
                            </div>
                            {formData.destinationHubId && formData.deliveryMode === 'hub' && (
                                <div className="p-3 bg-blue-50 dark:bg-blue-900/10 rounded-xl border border-blue-100 dark:border-blue-900/30 italic text-[10px] text-blue-700 dark:text-blue-300 font-medium leading-relaxed">
                                    <Info className="h-3 w-3 inline mr-1 mb-0.5" />
                                    Selected hub details: {hubs.find(h => h.id === formData.destinationHubId)?.description || 'Reliable transit point with 24/7 security.'}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="bg-background rounded-2xl shadow-sm border border-border p-6 space-y-4">
                    <h3 className="font-semibold text-foreground flex items-center gap-2">
                        <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 p-1.5 rounded-lg"><Package className="h-4 w-4" /></span>
                        Parcel Specifications
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1 block flex items-center gap-1">
                                <Weight className="h-3 w-3" /> Weight (kg)
                            </label>
                            <input
                                type="number"
                                required
                                min="0.1"
                                step="0.1"
                                className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900/50 border border-border rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-foreground"
                                value={formData.weight}
                                onChange={(e) => setFormData({ ...formData, weight: parseFloat(e.target.value) })}
                            />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1 block flex items-center gap-1">
                                <Ruler className="h-3 w-3" /> Length (cm)
                            </label>
                            <input
                                type="number"
                                required
                                className="w-full px-4 py-2 bg-muted/30 border border-border rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-foreground"
                                value={formData.length}
                                onChange={(e) => setFormData({ ...formData, length: parseFloat(e.target.value) })}
                            />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1 block flex items-center gap-1">
                                <Ruler className="h-3 w-3" /> Width (cm)
                            </label>
                            <input
                                type="number"
                                required
                                className="w-full px-4 py-2 bg-muted/30 border border-border rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-foreground"
                                value={formData.width}
                                onChange={(e) => setFormData({ ...formData, width: parseFloat(e.target.value) })}
                            />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1 block flex items-center gap-1">
                                <Ruler className="h-3 w-3" /> Height (cm)
                            </label>
                            <input
                                type="number"
                                required
                                className="w-full px-4 py-2 bg-muted/30 border border-border rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-foreground"
                                value={formData.height}
                                onChange={(e) => setFormData({ ...formData, height: parseFloat(e.target.value) })}
                            />
                        </div>
                    </div>
                </div>

                {/* Photos & Description */}
                <div className="bg-background rounded-2xl shadow-sm border border-border p-6 space-y-6">
                    <div className="grid md:grid-cols-2 gap-12">
                        <div className="space-y-4">
                            <h3 className="font-semibold text-foreground flex items-center gap-2">
                                <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 p-1.5 rounded-lg"><Camera className="h-4 w-4" /></span>
                                Parcel Photos
                            </h3>
                            <ImageUpload onImagesChange={(urls) => setFormData({ ...formData, images: urls })} />
                        </div>
                        <div className="space-y-4">
                            <h3 className="font-semibold text-foreground">Description</h3>
                            <textarea
                                className="w-full h-32 px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-border rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition-all resize-none text-foreground"
                                placeholder="Describe the contents of your parcel..."
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            />
                            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-900/30 flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest">Estimated Shipping Cost</p>
                                    <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">${(formData.weight * 12.5).toFixed(2)}</p>
                                </div>
                                <Send className="h-6 w-6 text-blue-400 opacity-50" />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-4">
                    <button
                        type="button"
                        onClick={() => router.back()}
                        className="px-8 py-3 rounded-xl border border-border font-semibold hover:bg-muted/50 transition-all text-foreground"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={
                            loading ||
                            (formData.pickupMode === 'direct' && !formData.senderAddress) ||
                            (formData.pickupMode === 'hub' && !formData.currentHubId) ||
                            (formData.deliveryMode === 'direct' && !formData.receiverAddress) ||
                            (formData.deliveryMode === 'hub' && !formData.destinationHubId)
                        }
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-12 rounded-xl transition-all shadow-lg shadow-blue-500/20 flex items-center gap-2 disabled:opacity-50"
                    >
                        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                        Confirm Order
                    </button>
                </div>
            </form >
        </div >
    );
}
