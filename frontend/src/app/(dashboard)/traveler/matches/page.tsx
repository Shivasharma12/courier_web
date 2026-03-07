'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api-client';
import { Package, MapPin, Weight, Ruler, Loader2, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

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
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const active = data.filter((p: any) => {
                const travelDate = new Date(p.travelDate);
                // Status must be active_travel AND date must be today or future
                return p.status === 'active_travel' && travelDate >= today;
            });
            setTravelPlans(active);
            if (active.length > 0) {
                // Auto-select the latest one (backend already sorts by DESC createdAt)
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
                <Package className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-foreground mb-2">No Active Routes</h2>
                <p className="text-muted-foreground mb-6">Post a travel route first to see matching parcels</p>
                <button
                    onClick={() => router.push('/traveler/post-route')}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-xl shadow-lg shadow-blue-500/20"
                >
                    Post My First Route
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-8 pb-20">
            <div>
                <h1 className="text-3xl font-bold text-foreground tracking-tight">Available Direct Matches</h1>
                <p className="text-muted-foreground mt-1 font-medium italic">Showing parcels matching your exact route.</p>
            </div>

            {/* Route Selector Hidden - Automatically using latest active route */}
            {false && (
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
            )}

            {/* Current Route Info */}
            {travelPlans.length > 0 && (
                <div className="bg-blue-600 rounded-[2rem] shadow-xl shadow-blue-500/20 p-8 text-white">
                    <p className="text-[10px] font-black opacity-60 uppercase tracking-widest mb-2">Active Route</p>
                    <div className="flex items-center justify-between flex-wrap gap-4">
                        <div className="flex items-center gap-4">
                            <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
                                <MapPin className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold">
                                    {travelPlans[0].fromLocation} → {travelPlans[0].toLocation}
                                </h3>
                                <p className="text-sm opacity-80 font-medium">
                                    Planned for {new Date(travelPlans[0].travelDate).toLocaleDateString()}
                                </p>
                            </div>
                        </div>
                        <div className="bg-white/10 px-4 py-2 rounded-lg backdrop-blur-sm text-xs font-bold uppercase tracking-wider">
                            Auto-Matched
                        </div>
                    </div>
                </div>
            )}

            {/* Matches */}
            <div className="space-y-4">
                {matches.length === 0 ? (
                    <div className="bg-background dark:bg-slate-900 rounded-2xl shadow-sm border border-border p-12 text-center">
                        <Package className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
                        <p className="text-muted-foreground">No matching parcels for this route yet</p>
                    </div>
                ) : (
                    matches.map((match) => (
                        <div
                            key={match.parcel.id}
                            className="bg-background dark:bg-slate-900 rounded-2xl shadow-sm border border-border p-6"
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-3">
                                        <span className="bg-blue-600 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest shadow-sm">
                                            {match.matchType.toUpperCase()} MATCH
                                        </span>
                                        <Link
                                            href={`/track?number=${match.parcel.trackingNumber}`}
                                            className="text-[10px] font-mono font-bold text-blue-600 dark:text-blue-400 hover:underline bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded transition-colors"
                                        >
                                            #{match.parcel.trackingNumber}
                                        </Link>
                                    </div>

                                    <div className="grid md:grid-cols-2 gap-6 mb-6">
                                        <div className="relative pl-6 before:content-[''] before:absolute before:left-0 before:top-2 before:bottom-2 before:w-1 before:bg-amber-400 before:rounded-full">
                                            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Pickup From</p>
                                            <p className="text-sm text-foreground flex items-center gap-1 font-bold">
                                                {match.parcel.currentHub?.name || match.parcel.senderAddress}
                                            </p>
                                            {match.parcel.currentHub && (
                                                <div className="flex flex-col gap-0.5 mt-0.5">
                                                    <p className="text-[10px] text-muted-foreground font-medium">{match.parcel.senderAddress}</p>
                                                    {match.pickupHubDistance !== undefined && (
                                                        <p className="text-[10px] font-bold text-blue-600 dark:text-blue-400">
                                                            {match.pickupHubDistance.toFixed(1)} km from your start
                                                        </p>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                        <div className="relative pl-6 before:content-[''] before:absolute before:left-0 before:top-2 before:bottom-2 before:w-1 before:bg-blue-500 before:rounded-full">
                                            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Deliver To</p>
                                            <p className="text-sm text-foreground flex items-center gap-1 font-bold">
                                                {match.parcel.destinationHub?.name || match.parcel.receiverAddress}
                                            </p>
                                            {match.parcel.destinationHub && (
                                                <div className="flex flex-col gap-0.5 mt-0.5">
                                                    <p className="text-[10px] text-muted-foreground font-medium">{match.parcel.receiverAddress}</p>
                                                    {match.deliveryHubDistance !== undefined && (
                                                        <p className="text-[10px] font-bold text-blue-600 dark:text-blue-400">
                                                            {match.deliveryHubDistance.toFixed(1)} km from your destination
                                                        </p>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-6 text-xs text-muted-foreground font-bold uppercase tracking-wider">
                                        <span className="flex items-center gap-1.5 bg-muted px-3 py-1.5 rounded-lg">
                                            <Weight className="h-4 w-4 text-muted-foreground/60" />
                                            {match.parcel.weight} kg
                                        </span>
                                        <span className="flex items-center gap-1.5 bg-muted px-3 py-1.5 rounded-lg">
                                            <Ruler className="h-4 w-4 text-muted-foreground/60" />
                                            {match.parcel.length}×{match.parcel.width}×{match.parcel.height} cm
                                        </span>
                                    </div>
                                </div>

                                <div className="flex flex-col items-center gap-2">
                                    <p className="text-xl font-black text-blue-600">${(match.parcel.weight * 5).toFixed(2)}</p>
                                    <button
                                        onClick={() => handleAccept(match.parcel.id)}
                                        className="bg-green-600 hover:bg-green-700 text-white font-black py-3 px-8 rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-green-500/20 hover:scale-105"
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
