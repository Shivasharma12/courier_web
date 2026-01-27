'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api-client';
import { MapPin, Calendar, Plane, Car, Bike, Truck, Train, Loader2, Package } from 'lucide-react';
import { toast } from 'sonner';

import LocationPicker from '@/components/location-picker';

export default function PostRoutePage() {
    const [hubs, setHubs] = useState<any[]>([]);
    const [formData, setFormData] = useState({
        fromLocation: '',
        fromLat: 0,
        fromLng: 0,
        toLocation: '',
        toLat: 0,
        toLng: 0,
        startHubId: '',
        endHubId: '',
        travelDate: '',
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            await api.post('/travel-plans', formData);
            toast.success('Travel route posted successfully!');
            router.push('/traveler');
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
        <div className="max-w-4xl mx-auto space-y-8 pb-20">
            <div>
                <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Post Your Travel Route</h1>
                <p className="text-slate-500 mt-1 font-medium">Share your journey and help deliver parcels along the way.</p>
            </div>

            <form onSubmit={handleSubmit} className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 p-10 space-y-8">
                {/* Location Selection */}
                <div className="grid md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <span className="bg-blue-100 text-blue-600 p-1.5 rounded-lg"><MapPin className="h-4 w-4" /></span>
                            <h3 className="font-bold text-slate-800 uppercase text-[10px] tracking-widest">Pickup Location</h3>
                        </div>
                        <LocationPicker
                            placeholder="Dehradun, Delhi, etc."
                            onLocationSelect={(address, lat, lng) => setFormData({ ...formData, fromLocation: address, fromLat: lat, fromLng: lng })}
                        />
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <span className="bg-red-100 text-red-600 p-1.5 rounded-lg"><MapPin className="h-4 w-4" /></span>
                            <h3 className="font-bold text-slate-800 uppercase text-[10px] tracking-widest">Drop-off Location</h3>
                        </div>
                        <LocationPicker
                            placeholder="Where is it going?"
                            onLocationSelect={(address, lat, lng) => setFormData({ ...formData, toLocation: address, toLat: lat, toLng: lng })}
                        />
                    </div>
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                    {/* Travel Date */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                            Travel Date
                        </label>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <Calendar className="h-5 w-5 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                            </div>
                            <input
                                type="date"
                                required
                                min={new Date().toISOString().split('T')[0]}
                                className="w-full bg-slate-50 border-0 rounded-2xl pl-12 pr-4 py-4 text-sm font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                value={formData.travelDate}
                                onChange={(e) => setFormData({ ...formData, travelDate: e.target.value })}
                            />
                        </div>
                    </div>

                    {/* Capacity */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                            Available Parcel Capacity
                        </label>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <Package className="h-5 w-5 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                            </div>
                            <input
                                type="number"
                                required
                                min="1"
                                max="50"
                                className="w-full bg-slate-50 border-0 rounded-2xl pl-12 pr-4 py-4 text-sm font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                value={formData.capacity}
                                onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) })}
                            />
                        </div>
                    </div>
                </div>

                {/* Mode of Transport */}
                <div className="space-y-4">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 text-center block">Mode of Transport</label>
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
                                        ? 'border-blue-600 bg-blue-600 text-white shadow-lg shadow-blue-100 scale-105'
                                        : 'border-slate-50 bg-slate-50 hover:bg-white hover:border-slate-200'
                                        }`}
                                >
                                    <Icon className={`h-8 w-8 ${isActive ? 'text-white' : 'text-slate-300 group-hover:text-blue-500'} transition-colors`} />
                                    <p className={`text-[10px] font-black uppercase tracking-widest ${isActive ? 'text-white' : 'text-slate-500'}`}>
                                        {mode}
                                    </p>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Submit */}
                <div className="flex gap-4 pt-4">
                    <button
                        type="button"
                        onClick={() => router.back()}
                        className="flex-1 px-8 py-5 rounded-2xl border-2 border-slate-100 text-sm font-black text-slate-400 uppercase tracking-widest hover:bg-slate-50 hover:border-slate-200 transition-all"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={loading || (!formData.fromLocation && !formData.startHubId) || (!formData.toLocation && !formData.endHubId)}
                        className="flex-[2] bg-blue-600 hover:bg-blue-700 text-white font-black py-5 px-8 rounded-2xl text-sm uppercase tracking-widest transition-all shadow-xl shadow-blue-100 disabled:opacity-50 flex items-center justify-center gap-3 transform hover:scale-[1.02] active:scale-95"
                    >
                        {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <MapPin className="h-5 w-5" />}
                        Post My Route
                    </button>
                </div>
            </form>
        </div>
    );
}
