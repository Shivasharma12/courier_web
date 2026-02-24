'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api-client';
import { useAuthStore } from '@/store/auth-store';
import {
    Package, Truck, ArrowRight, Loader2, MapPin, Search,
    CheckCircle2, Clock, Send, Inbox, AlertCircle, Eye, History as HistoryIcon
} from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

// ─── Status Badge ─────────────────────────────────────────────────────────────
const STATUS_META: Record<string, { label: string; color: string }> = {
    pending_match: { label: 'Pending Match', color: 'bg-muted text-muted-foreground' },
    matched: { label: 'Matched', color: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400' },
    booked: { label: 'Booked', color: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400' },
    picked_up: { label: 'Picked Up', color: 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-400' },
    at_hub: { label: 'At Hub', color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' },
    in_transit: { label: 'In Transit', color: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400' },
    out_for_delivery: { label: 'Out for Delivery', color: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400' },
    delivered: { label: 'Delivered', color: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' },
    cancelled: { label: 'Cancelled', color: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400' },
};

function StatusBadge({ status }: { status: string }) {
    const meta = STATUS_META[status] || { label: status, color: 'bg-muted text-muted-foreground' };
    return (
        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${meta.color}`}>
            {meta.label}
        </span>
    );
}

// ─── Parcel Row ───────────────────────────────────────────────────────────────
function ParcelRow({ parcel, onAccept, onDispatch, onDeliver, loading }: any) {
    // All statuses that mean the parcel is en-route and can be accepted into hub inventory
    const isIncoming = ['pending_match', 'matched', 'booked', 'picked_up', 'in_transit'].includes(parcel.status);
    const isAtHub = parcel.status === 'at_hub';
    const isInTransit = parcel.status === 'in_transit';

    return (
        <tr className="hover:bg-muted/30 transition-colors group border-b border-border last:border-0">
            <td className="px-6 py-5">
                <div className="flex items-center gap-3">
                    <div className="bg-blue-100 dark:bg-blue-900/30 group-hover:bg-blue-600 group-hover:text-white text-blue-600 dark:text-blue-400 p-2.5 rounded-xl transition-all">
                        <Package className="h-4 w-4" />
                    </div>
                    <div>
                        <p className="font-bold text-foreground text-sm">#{parcel.trackingNumber}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{parcel.senderName || parcel.sender?.name || '—'}</p>
                        {parcel.assignedTo && (
                            <div className="flex items-center gap-1.5 mt-1 text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 w-fit px-2 py-0.5 rounded-lg border border-blue-100 dark:border-blue-800">
                                <Truck className="h-3 w-3" />
                                Assigned: {parcel.assignedTo.name}
                            </div>
                        )}
                    </div>
                </div>
            </td>
            <td className="px-6 py-5">
                <StatusBadge status={parcel.status} />
            </td>
            <td className="px-6 py-5">
                <p className="text-xs font-semibold text-foreground">{parcel.receiverName}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5 truncate max-w-[130px]">{parcel.receiverAddress}</p>
            </td>
            <td className="px-6 py-5">
                <p className="text-sm font-bold text-foreground">{parcel.weight} kg</p>
            </td>
            <td className="px-6 py-5">
                <div className="flex items-center gap-2 flex-wrap">
                    {/* Accept = customer dropped parcel → moves it to AT_HUB, notifies sender */}
                    {isIncoming && (
                        <button
                            onClick={() => onAccept(parcel.id)}
                            disabled={loading}
                            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-3 py-2 rounded-xl text-[11px] font-black flex items-center gap-1.5 transition-all"
                        >
                            <Inbox className="h-3.5 w-3.5" />
                            Accept
                        </button>
                    )}
                    {/* Dispatch = hub sends with traveler → IN_TRANSIT, notifies sender & dest hub */}
                    {isAtHub && (
                        <button
                            onClick={() => onDispatch(parcel.id)}
                            disabled={loading}
                            className="bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white px-3 py-2 rounded-xl text-[11px] font-black flex items-center gap-1.5 transition-all"
                        >
                            <Send className="h-3.5 w-3.5" />
                            Dispatch
                        </button>
                    )}
                    {/* Confirm Delivery — parcel arrived at destination */}
                    {isInTransit && (
                        <button
                            onClick={() => onDeliver(parcel.id)}
                            disabled={loading}
                            className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-3 py-2 rounded-xl text-[11px] font-black flex items-center gap-1.5 transition-all"
                        >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Confirm Delivery
                        </button>
                    )}
                    {/* Track link */}
                    <Link
                        href={`/hub/track/${parcel.trackingNumber}`}
                        className="bg-muted hover:bg-muted/80 text-muted-foreground px-3 py-2 rounded-xl text-[11px] font-bold flex items-center gap-1.5 transition-all"
                    >
                        <Eye className="h-3.5 w-3.5" />
                        Track
                    </Link>
                </div>
            </td>
        </tr>
    );
}


// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function HubInventoryPage() {
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState<'at_hub' | 'incoming' | 'history' | 'all'>('at_hub');
    const user = useAuthStore((s) => s.user);
    const patchUser = useAuthStore((s) => s.patchUser);
    const qc = useQueryClient();

    // ─── Fallback: fetch hubId from backend if auth store doesn't have it ──
    const { data: hubStats } = useQuery({
        queryKey: ['my-hub-stats-fallback'],
        queryFn: async () => { const { data } = await api.get('/hubs/my-hub-stats'); return data; },
        enabled: !user?.hubId,
        retry: false,
    });

    // Patch auth store so subsequent pages also know
    useEffect(() => {
        if (hubStats?.id && !user?.hubId) patchUser({ hubId: hubStats.id });
    }, [hubStats, user?.hubId, patchUser]);

    const activeHubId = user?.hubId || hubStats?.id || null;

    // At-hub inventory
    const { data: inventory = [], isLoading } = useQuery<any[]>({
        queryKey: ['hub-inventory', activeHubId],
        queryFn: async () => { const { data } = await api.get(`/parcels/hub-inventory/${activeHubId}`); return data; },
        enabled: !!activeHubId,
    });

    // Incoming parcels
    const { data: incoming = [] } = useQuery<any[]>({
        queryKey: ['hub-incoming', activeHubId],
        queryFn: async () => { const { data } = await api.get(`/parcels/hub-incoming/${activeHubId}`); return data; },
        enabled: !!activeHubId,
    });

    // Hub history
    const { data: history = [] } = useQuery<any[]>({
        queryKey: ['hub-history', activeHubId],
        queryFn: async () => { const { data } = await api.get(`/parcels/hub-history/${activeHubId}`); return data; },
        enabled: !!activeHubId,
    });

    // ─── Mutations ─────────────────────────────────────────────────────────
    const acceptMutation = useMutation({
        mutationFn: (id: string) => api.post(`/parcels/${id}/confirmed-dropoff`),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['hub-inventory'] });
            qc.invalidateQueries({ queryKey: ['hub-incoming'] });
            toast.success('✅ Parcel accepted into inventory. Customer has been notified!');
        },
        onError: () => toast.error('Failed to accept parcel'),
    });

    const dispatchMutation = useMutation({
        mutationFn: (id: string) => api.post(`/parcels/${id}/dispatch-parcel`),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['hub-inventory'] });
            qc.invalidateQueries({ queryKey: ['hub-dispatch'] });
            qc.invalidateQueries({ queryKey: ['hub-history'] });
            toast.success('🚀 Parcel dispatched! Customer has been notified.');
        },
        onError: () => toast.error('Failed to dispatch parcel'),
    });

    const deliverMutation = useMutation({
        mutationFn: (id: string) => api.put(`/parcels/${id}`, { status: 'delivered' }),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['hub-inventory'] });
            toast.success('🎉 Delivery confirmed! Customer has been notified.');
        },
        onError: () => toast.error('Failed to confirm delivery'),
    });

    // ─── Tabs ───────────────────────────────────────────────────────────────
    const tabs = [
        { id: 'at_hub' as const, label: 'At Hub', icon: Package, count: inventory.length, badge: 'blue' },
        { id: 'incoming' as const, label: 'Incoming', icon: Truck, count: incoming.length, badge: 'amber' },
        { id: 'history' as const, label: 'History', icon: HistoryIcon, count: history.length, badge: 'green' },
        { id: 'all' as const, label: 'All Parcels', icon: AlertCircle, count: inventory.length + incoming.length, badge: 'slate' },
    ];

    const displayed = activeTab === 'at_hub' ? inventory
        : activeTab === 'incoming' ? incoming
            : activeTab === 'history' ? history
                : [...inventory, ...incoming];

    const filtered = displayed.filter((p: any) =>
        p.trackingNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.receiverName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.senderName?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const isAnyLoading = acceptMutation.isPending || dispatchMutation.isPending || deliverMutation.isPending;

    // ─── No Hub ─────────────────────────────────────────────────────────────
    if (!activeHubId) {
        return (
            <div className="p-8 flex flex-col items-center justify-center pt-20">
                <div className="bg-amber-50 dark:bg-amber-900/10 p-10 rounded-[40px] border border-amber-100 dark:border-amber-900/30 flex flex-col items-center gap-6 max-w-md text-center">
                    <div className="p-4 bg-amber-100 dark:bg-amber-900/30 rounded-full"><MapPin className="h-10 w-10 text-amber-600 dark:text-amber-400" /></div>
                    <h2 className="text-2xl font-black text-amber-900 dark:text-amber-200">Inventory Unavailable</h2>
                    <p className="text-amber-700 dark:text-amber-300 font-medium">You must be assigned to a hub to manage inventory.</p>
                    <a href="/hub/profile" className="bg-blue-600 text-white font-bold px-8 py-4 rounded-2xl flex items-center gap-2 shadow-lg shadow-blue-100/20">
                        Set Up Your Hub <ArrowRight className="h-5 w-5" />
                    </a>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-6xl mx-auto">
            {/* ── Header ── */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-foreground tracking-tight">Hub Inventory</h1>
                    <p className="text-muted-foreground text-sm mt-1">Accept parcels, dispatch them, and track delivery. Customers are notified automatically.</p>
                </div>
                <div className="relative w-64">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Search tracking # or name"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-background"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* ── Info Banner ── */}
            <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-2xl px-5 py-3.5 flex items-center gap-3">
                <AlertCircle className="h-4 w-4 text-blue-500 flex-shrink-0" />
                <p className="text-xs text-blue-700 dark:text-blue-300 font-medium">
                    <strong>Auto-notifications:</strong> Customers are automatically notified when you accept a parcel, dispatch it, or confirm delivery.
                </p>
            </div>

            {/* ── Tabs ── */}
            <div className="flex gap-2 border-b border-border pb-0 overflow-x-auto">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 px-5 py-3 text-sm font-bold rounded-t-xl -mb-px border-b-2 transition-all whitespace-nowrap ${activeTab === tab.id
                            ? 'border-blue-600 text-blue-600 bg-blue-50/50 dark:bg-blue-900/20'
                            : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50'
                            }`}
                    >
                        <tab.icon className="h-4 w-4" />
                        {tab.label}
                        {tab.count > 0 && (
                            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${activeTab === tab.id ? 'bg-blue-600 text-white' : 'bg-muted text-muted-foreground'
                                }`}>
                                {tab.count}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* ── Table ── */}
            {isLoading ? (
                <div className="flex justify-center py-20"><Loader2 className="h-10 w-10 animate-spin text-blue-600" /></div>
            ) : (
                <div className="bg-background dark:bg-slate-900 rounded-2xl shadow-sm border border-border overflow-hidden">
                    {/* Incoming notice */}
                    {activeTab === 'incoming' && incoming.length > 0 && (
                        <div className="bg-amber-50 dark:bg-amber-900/10 border-b border-amber-100 dark:border-amber-900/30 px-6 py-3 flex items-center gap-2">
                            <Inbox className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                            <p className="text-xs font-bold text-amber-800 dark:text-amber-300">
                                When the customer physically drops a parcel at your hub, click <strong>Accept</strong> to move it to inventory and notify the customer.
                            </p>
                        </div>
                    )}
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-muted/50 border-b border-border">
                                    <th className="px-6 py-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Parcel</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Status</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Recipient</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Weight</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {activeTab === 'incoming' ? (
                                    <>
                                        {/* Group 1: Drop-off Pending (from customers) */}
                                        {filtered.filter(p => ['booked', 'matched', 'pending_match'].includes(p.status)).length > 0 && (
                                            <tr className="bg-muted/30"><td colSpan={5} className="px-6 py-2 text-[10px] font-black text-muted-foreground uppercase tracking-widest border-y border-border">Drop-off Pending (From Customer)</td></tr>
                                        )}
                                        {/* ... (rows) ... */}
                                        {/* Group 2: Inbound Transit (from other hubs) */}
                                        {filtered.filter(p => ['in_transit', 'picked_up'].includes(p.status)).length > 0 && (
                                            <tr className="bg-muted/30"><td colSpan={5} className="px-6 py-2 text-[10px] font-black text-muted-foreground uppercase tracking-widest border-y border-border">Inbound Transit (From Other Hub)</td></tr>
                                        )}
                                        {filtered.filter(p => ['in_transit', 'picked_up'].includes(p.status)).map((parcel: any) => (
                                            <ParcelRow
                                                key={parcel.id}
                                                parcel={parcel}
                                                loading={isAnyLoading}
                                                onAccept={(id: string) => acceptMutation.mutate(id)}
                                                onDispatch={(id: string) => dispatchMutation.mutate(id)}
                                                onDeliver={(id: string) => deliverMutation.mutate(id)}
                                            />
                                        ))}
                                    </>
                                ) : (
                                    filtered.map((parcel: any) => (
                                        <ParcelRow
                                            key={parcel.id}
                                            parcel={parcel}
                                            loading={isAnyLoading}
                                            onAccept={(id: string) => acceptMutation.mutate(id)}
                                            onDispatch={(id: string) => dispatchMutation.mutate(id)}
                                            onDeliver={(id: string) => deliverMutation.mutate(id)}
                                        />
                                    ))
                                )}
                                {filtered.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="py-20 text-center">
                                            <div className="flex flex-col items-center gap-3">
                                                <div className="bg-muted p-5 rounded-full">
                                                    <Package className="h-8 w-8 text-muted-foreground/20" />
                                                </div>
                                                <p className="text-muted-foreground font-medium">
                                                    {activeTab === 'incoming' ? 'No incoming parcels right now.'
                                                        : activeTab === 'history' ? 'No transaction history found.'
                                                            : 'No parcels in inventory.'}
                                                </p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
