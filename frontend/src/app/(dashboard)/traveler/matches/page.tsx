'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api-client';
import { Package, MapPin, Weight, Ruler, Loader2, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function MatchesPage() {
    const [travelPlans, setTravelPlans] = useState<any[]>([]);
    const [selectedPlan, setSelectedPlan] = useState<string>('');
    const [matches, setMatches] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        fetchTravelPlans();
    }, []);

    useEffect(() => {
        if (selectedPlan) {
            fetchMatches(selectedPlan);
        }
    }, [selectedPlan]);

    const fetchTravelPlans = async () => {
        try {
            const { data } = await api.get('/travel-plans/mine');
            // Use 'active_travel' status
            const active = data.filter((p: any) => p.status === 'active_travel');
            setTravelPlans(active);
            if (active.length > 0) {
                setSelectedPlan(active[0].id);
            }
        } catch (err) {
            console.error(err);
            toast.error('Failed to load travel plans');
        } finally {
            setLoading(false);
        }
    };

    const fetchMatches = async (planId: string) => {
        try {
            const { data } = await api.get(`/travel-plans/${planId}/matches`);
            setMatches(data);
        } catch (err) {
            console.error(err);
            toast.error('Failed to load matches');
        }
    };

    const handleAccept = async (parcelId: string) => {
        try {
            await api.post(`/travel-plans/${selectedPlan}/assign/${parcelId}`);
            toast.success('Parcel accepted! Check your deliveries.');
            fetchMatches(selectedPlan);
        } catch (err: any) {
            console.error(err);
            toast.error(err.response?.data?.message || 'Failed to accept parcel');
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
        );
    }

    if (travelPlans.length === 0) {
        return (
            <div className="max-w-3xl mx-auto text-center py-16">
                <Package className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-slate-900 mb-2">No Active Routes</h2>
                <p className="text-slate-500 mb-6">Post a travel route first to see matching parcels</p>
                <button
                    onClick={() => router.push('/traveler/post-route')}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-xl shadow-lg shadow-blue-100"
                >
                    Post My First Route
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-8 pb-20">
            <div>
                <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Available Direct Matches</h1>
                <p className="text-slate-500 mt-1 font-medium italic">Showing parcels matching your exact route.</p>
            </div>

            {/* Route Selector */}
            <div className="bg-white rounded-[2rem] shadow-xl shadow-slate-100/50 border border-slate-100 p-8">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-4 ml-1">Select Your Travel Route</label>
                <select
                    className="w-full bg-slate-50 border-0 rounded-2xl px-6 py-4 text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500 transition-all appearance-none cursor-pointer"
                    value={selectedPlan}
                    onChange={(e) => setSelectedPlan(e.target.value)}
                >
                    {travelPlans.map(plan => (
                        <option key={plan.id} value={plan.id}>
                            {plan.fromLocation} → {plan.toLocation} ({new Date(plan.travelDate).toLocaleDateString()})
                        </option>
                    ))}
                </select>
            </div>

            {/* Matches */}
            <div className="space-y-4">
                {matches.length === 0 ? (
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-12 text-center">
                        <Package className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                        <p className="text-slate-500">No matching parcels for this route yet</p>
                    </div>
                ) : (
                    matches.map((match) => (
                        <div
                            key={match.parcel.id}
                            className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6"
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-3">
                                        <span className="bg-blue-600 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest shadow-sm">
                                            {match.matchType.toUpperCase()} MATCH
                                        </span>
                                        <span className="text-[10px] font-mono font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded">
                                            #{match.parcel.trackingNumber}
                                        </span>
                                    </div>

                                    <div className="grid md:grid-cols-2 gap-6 mb-6">
                                        <div className="relative pl-6 before:content-[''] before:absolute before:left-0 before:top-2 before:bottom-2 before:w-1 before:bg-amber-400 before:rounded-full">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Pickup From</p>
                                            <p className="text-sm text-slate-900 flex items-center gap-1 font-bold">
                                                {match.parcel.currentHub?.name || match.parcel.senderAddress}
                                            </p>
                                            {match.parcel.currentHub && (
                                                <p className="text-[10px] text-slate-500 font-medium">{match.parcel.senderAddress}</p>
                                            )}
                                        </div>
                                        <div className="relative pl-6 before:content-[''] before:absolute before:left-0 before:top-2 before:bottom-2 before:w-1 before:bg-blue-500 before:rounded-full">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Deliver To</p>
                                            <p className="text-sm text-slate-900 flex items-center gap-1 font-bold">
                                                {match.parcel.destinationHub?.name || match.parcel.receiverAddress}
                                            </p>
                                            {match.parcel.destinationHub && (
                                                <p className="text-[10px] text-slate-500 font-medium">{match.parcel.receiverAddress}</p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-6 text-xs text-slate-500 font-bold uppercase tracking-wider">
                                        <span className="flex items-center gap-1.5 bg-slate-100 px-3 py-1.5 rounded-lg">
                                            <Weight className="h-4 w-4 text-slate-400" />
                                            {match.parcel.weight} kg
                                        </span>
                                        <span className="flex items-center gap-1.5 bg-slate-100 px-3 py-1.5 rounded-lg">
                                            <Ruler className="h-4 w-4 text-slate-400" />
                                            {match.parcel.length}×{match.parcel.width}×{match.parcel.height} cm
                                        </span>
                                    </div>
                                </div>

                                <div className="flex flex-col items-center gap-2">
                                    <p className="text-xl font-black text-blue-600">${(match.parcel.weight * 5).toFixed(2)}</p>
                                    <button
                                        onClick={() => handleAccept(match.parcel.id)}
                                        className="bg-green-600 hover:bg-green-700 text-white font-black py-3 px-8 rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-green-100 hover:scale-105"
                                    >
                                        <CheckCircle className="h-4 w-4" />
                                        ACCEPT
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
