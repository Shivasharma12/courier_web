'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api-client';
import { Truck, MapPin, Package, ArrowRight, Loader2, CheckCircle2, Send, AlertCircle, Eye } from 'lucide-react';
import { useAuthStore } from '@/store/auth-store';
import { toast } from 'sonner';
import Link from 'next/link';

const STATUS_COLOR: Record<string, string> = {
    at_hub: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
    in_transit: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400',
    pending_match: 'bg-muted text-muted-foreground',
    matched: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400',
    delivered: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
};

export default function DispatchPage() {
    const qc = useQueryClient();
    const user = useAuthStore((s) => s.user);
    const patchUser = useAuthStore((s) => s.patchUser);
    const [selectedParcels, setSelectedParcels] = useState<string[]>([]);

    // ─── Fallback: resolve hubId from backend if auth store is stale ──────
    const { data: hubStats } = useQuery({
        queryKey: ['my-hub-stats-dispatch-fallback'],
        queryFn: async () => { const { data } = await api.get('/hubs/my-hub-stats'); return data; },
        enabled: !user?.hubId,
        retry: false,
    });

    useEffect(() => {
        if (hubStats?.id && !user?.hubId) patchUser({ hubId: hubStats.id });
    }, [hubStats, user?.hubId, patchUser]);

    const activeHubId = user?.hubId || hubStats?.id || null;

    // Load all parcels at this hub
    const { data: parcels = [], isLoading, isError } = useQuery<any[]>({
        queryKey: ['hub-dispatch', activeHubId],
        queryFn: async () => { const { data } = await api.get(`/parcels/hub-inventory/${activeHubId}`); return data; },
        enabled: !!activeHubId,
        retry: false,
    });


    // Only show parcels that are ready to dispatch (at_hub)
    const readyForDispatch = parcels.filter((p: any) => p.status === 'at_hub');

    // ─── Single parcel dispatch ───────────────────────────────────────────
    const dispatchOneMutation = useMutation({
        mutationFn: (id: string) => api.post(`/parcels/${id}/dispatch-parcel`),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['hub-dispatch'] });
            qc.invalidateQueries({ queryKey: ['hub-inventory'] });
            setSelectedParcels([]);
            toast.success('🚀 Parcel dispatched! Customer has been notified automatically.');
        },
        onError: () => toast.error('Dispatch failed'),
    });

    // ─── Batch dispatch ───────────────────────────────────────────────────
    const batchDispatchMutation = useMutation({
        mutationFn: async (ids: string[]) => {
            await Promise.all(ids.map(id => api.post(`/parcels/${id}/dispatch-parcel`)));
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['hub-dispatch'] });
            qc.invalidateQueries({ queryKey: ['hub-inventory'] });
            setSelectedParcels([]);
            toast.success(`🚀 ${selectedParcels.length} parcel(s) dispatched! Customers have been notified.`);
        },
        onError: () => toast.error('Batch dispatch failed'),
    });

    const toggleSelect = (id: string) =>
        setSelectedParcels(prev => prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]);

    if (!activeHubId) {
        return (
            <div className="p-8 flex flex-col items-center justify-center pt-20">
                <div className="bg-amber-50 dark:bg-amber-900/10 p-10 rounded-[40px] border border-amber-100 dark:border-amber-900/30 flex flex-col items-center gap-6 max-w-md text-center">
                    <div className="p-4 bg-amber-100 dark:bg-amber-900/30 rounded-full"><MapPin className="h-10 w-10 text-amber-600 dark:text-amber-400" /></div>
                    <h2 className="text-2xl font-black text-amber-900 dark:text-amber-200">Queue Unavailable</h2>
                    <p className="text-amber-700 dark:text-amber-300 font-medium">You must be assigned to a hub to manage dispatch.</p>
                    <a href="/hub/profile" className="bg-blue-600 text-white font-bold px-8 py-4 rounded-2xl flex items-center gap-2 shadow-lg shadow-blue-500/20">
                        Set Up Your Hub <ArrowRight className="h-5 w-5" />
                    </a>
                </div>
            </div>
        );
    }

    if (isLoading) return <div className="flex justify-center py-20"><Loader2 className="h-10 w-10 animate-spin text-blue-600" /></div>;
    if (isError) return <div className="flex justify-center py-20 text-red-500 font-bold">Failed to load dispatch queue.</div>;

    return (
        <div className="space-y-6 max-w-6xl mx-auto">
            {/* ── Header ── */}
            <div>
                <h1 className="text-3xl font-bold text-foreground tracking-tight">Dispatch Queue</h1>
                <p className="text-muted-foreground text-sm mt-1">Dispatch ready parcels. Customers are automatically notified when their parcel leaves the hub.</p>
            </div>

            {/* ── Auto-notify Banner ── */}
            <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-2xl px-5 py-3.5 flex items-center gap-3">
                <AlertCircle className="h-4 w-4 text-blue-500 flex-shrink-0" />
                <p className="text-xs text-blue-700 dark:text-blue-300 font-medium">
                    <strong>Auto-notifications:</strong> Dispatching a parcel automatically notifies the customer with a tracking link.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* ── Parcel List ── */}
                <div className="lg:col-span-3 space-y-3">
                    {readyForDispatch.length === 0 ? (
                        <div className="py-20 bg-muted/30 rounded-3xl border-2 border-dashed border-border text-center flex flex-col items-center gap-3">
                            <div className="bg-muted p-5 rounded-full">
                                <Truck className="h-8 w-8 text-muted-foreground/30" />
                            </div>
                            <p className="text-muted-foreground font-medium">No parcels ready for dispatch.</p>
                            <p className="text-xs text-muted-foreground/60">Accept parcels in Inventory first, then dispatch them here.</p>
                            <Link href="/hub/inventory" className="text-blue-600 dark:text-blue-400 text-sm font-bold underline mt-1">Go to Inventory →</Link>
                        </div>
                    ) : (
                        readyForDispatch.map((parcel: any) => {
                            const isSelected = selectedParcels.includes(parcel.id);
                            return (
                                <div
                                    key={parcel.id}
                                    onClick={() => toggleSelect(parcel.id)}
                                    className={`bg-background dark:bg-slate-900 p-5 rounded-2xl border-2 cursor-pointer transition-all flex items-center gap-4 ${isSelected ? 'border-blue-600 ring-4 ring-blue-50 dark:ring-blue-900/20 shadow-md shadow-blue-50 dark:shadow-none' : 'border-border hover:border-blue-300 dark:hover:border-blue-800'
                                        }`}
                                >
                                    <div className={`p-3.5 rounded-2xl flex-shrink-0 transition-all ${isSelected ? 'bg-blue-600 text-white' : 'bg-muted text-muted-foreground/40'}`}>
                                        <Package className="h-5 w-5" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-3">
                                            <p className="font-bold text-foreground">#{parcel.trackingNumber}</p>
                                            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase ${STATUS_COLOR[parcel.status] || 'bg-muted text-muted-foreground'}`}>
                                                {parcel.status.replace('_', ' ')}
                                            </span>
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-0.5 truncate">To: {parcel.receiverName} — {parcel.receiverAddress}</p>
                                        {parcel.assignedTo && (
                                            <div className="flex items-center gap-1.5 mt-1.5 text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 w-fit px-2 py-0.5 rounded-lg border border-blue-100 dark:border-blue-800">
                                                <Truck className="h-3 w-3" />
                                                Assigned Traveler: {parcel.assignedTo.name}
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-3 flex-shrink-0">
                                        {/* Quick single dispatch */}
                                        <button
                                            onClick={(e) => { e.stopPropagation(); dispatchOneMutation.mutate(parcel.id); }}
                                            disabled={dispatchOneMutation.isPending}
                                            className="bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white px-4 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all"
                                        >
                                            <Send className="h-3.5 w-3.5" />
                                            Dispatch
                                        </button>
                                        <Link
                                            href={`/hub/track/${parcel.trackingNumber}`}
                                            onClick={e => e.stopPropagation()}
                                            className="p-2 bg-muted hover:bg-muted/80 rounded-xl text-muted-foreground transition"
                                        >
                                            <Eye className="h-4 w-4" />
                                        </Link>
                                        {isSelected && <CheckCircle2 className="h-5 w-5 text-blue-600" />}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* ── Batch Action Panel ── */}
                <div className="space-y-4">
                    <div className="bg-slate-900 dark:bg-slate-950 p-6 rounded-3xl text-white shadow-2xl space-y-6">
                        <h3 className="text-lg font-bold flex items-center gap-2">
                            <Truck className="h-5 w-5 text-blue-400" /> Batch Dispatch
                        </h3>

                        <div className="space-y-3 border-b border-white/10 pb-4">
                            <div className="flex justify-between items-center">
                                <span className="text-slate-400 text-sm">Ready for dispatch</span>
                                <span className="font-black text-2xl">{readyForDispatch.length}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-slate-400 text-sm">Selected</span>
                                <span className="font-black text-2xl text-blue-400">{selectedParcels.length}</span>
                            </div>
                        </div>

                        <button
                            disabled={selectedParcels.length === 0 || batchDispatchMutation.isPending}
                            onClick={() => batchDispatchMutation.mutate(selectedParcels)}
                            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all shadow-xl shadow-blue-500/20"
                        >
                            {batchDispatchMutation.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Truck className="h-5 w-5" />}
                            Dispatch Selected ({selectedParcels.length})
                        </button>
                    </div>

                    <div className="bg-amber-50 dark:bg-amber-900/10 p-5 rounded-2xl border border-amber-100 dark:border-amber-900/30 flex gap-3">
                        <Package className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                        <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed font-medium">
                            Each customer receives an automatic push notification with a direct tracking link when their parcel is dispatched.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
