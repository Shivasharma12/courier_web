'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import api from '@/lib/api-client';
import { useAuthStore } from '@/store/auth-store';
import {
    Package, Truck, ArrowRight, Loader2, MapPin, Search,
    CheckCircle2, Clock, Send, Inbox, AlertCircle, Eye,
    History as HistoryIcon, List, TimerReset, ChevronRight, User, Ban, Phone,
    FileText, UserCircle, Map as MapIcon, ClipboardList
} from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

// ─── Status Badge ─────────────────────────────────────────────────────────────
const STATUS_META: Record<string, { label: string; color: string }> = {
    waiting_for_drop: { label: 'Waiting for Drop', color: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400' },
    pending_match: { label: 'Pending Match', color: 'bg-muted text-muted-foreground' },
    matched: { label: 'Matched', color: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400' },
    booked: { label: 'Booked', color: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400' },
    at_hub: { label: 'At Hub', color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' },
    in_transit: { label: 'In Transit', color: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400' },
    out_for_delivery: { label: 'Out for Delivery', color: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400' },
    delivered: { label: 'Delivered', color: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' },
    cancelled: { label: 'Cancelled', color: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400' },
    expired: { label: 'Expired', color: 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400' },
};

function StatusBadge({ status }: { status: string }) {
    const meta = STATUS_META[status] || { label: status, color: 'bg-muted text-muted-foreground' };
    return (
        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${meta.color}`}>
            {meta.label}
        </span>
    );
}

// ─── Countdown Timer ──────────────────────────────────────────────────────────
function ExpiryCountdown({ deadline }: { deadline: string }) {
    const [timeLeft, setTimeLeft] = useState('');

    useEffect(() => {
        const update = () => {
            const diff = new Date(deadline).getTime() - Date.now();
            if (diff <= 0) { setTimeLeft('Expired'); return; }
            const h = Math.floor(diff / 3600000);
            const m = Math.floor((diff % 3600000) / 60000);
            setTimeLeft(`${h}h ${m}m left`);
        };
        update();
        const t = setInterval(update, 60000);
        return () => clearInterval(t);
    }, [deadline]);

    const isUrgent = new Date(deadline).getTime() - Date.now() < 6 * 3600000;

    return (
        <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-lg ${isUrgent
            ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'
            : 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400'
            }`}>
            <Clock className="h-3 w-3" />
            {timeLeft}
        </span>
    );
}

// ─── Parcel Table Row ─────────────────────────────────────────────────────────
function ParcelRow({
    parcel, tab, onAcceptDrop, onReceiveIncoming, onDispatch, onCompleteDelivery, onViewDetails, loading, readOnly
}: {
    parcel: any;
    tab: string;
    onAcceptDrop: (id: string) => void;
    onReceiveIncoming: (id: string) => void;
    onDispatch: (id: string) => void;
    onCompleteDelivery: (id: string) => void;
    onViewDetails: (parcel: any) => void;
    loading: boolean;
    readOnly?: boolean;
}) {
    const isPending = parcel.status === 'waiting_for_drop';
    const isAtHub = parcel.status === 'at_hub';
    const isInTransit = parcel.status === 'in_transit';
    const isDelivered = parcel.status === 'delivered';
    const hasAssignedTraveler = !!parcel.assignedTo;
    const isAtDestinationHub = parcel.currentHub?.id === parcel.destinationHub?.id;

    return (
        <motion.tr
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: -10 }}
            className="hover:bg-muted/30 transition-colors group border-b border-border last:border-0"
        >
            {/* Parcel */}
            <td className="px-5 py-4">
                <div className="flex items-center gap-3">
                    <div className="bg-blue-100 dark:bg-blue-900/30 group-hover:bg-blue-600 group-hover:text-white text-blue-600 dark:text-blue-400 p-2.5 rounded-xl transition-all">
                        <Package className="h-4 w-4" />
                    </div>
                    <div>
                        <p className="font-bold text-foreground text-sm font-mono">#{parcel.trackingNumber}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{parcel.senderName || parcel.sender?.name || '—'}</p>
                        {parcel.assignedTo && (
                            <div className="flex items-center gap-1.5 mt-1 text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 w-fit px-2 py-0.5 rounded-lg border border-blue-100 dark:border-blue-800">
                                <Truck className="h-3 w-3" />
                                Traveler: {parcel.assignedTo.name}
                            </div>
                        )}
                    </div>
                </div>
            </td>

            {/* Status */}
            <td className="px-5 py-4">
                <div className="flex flex-col gap-1.5">
                    <StatusBadge status={parcel.status} />
                    {isPending && parcel.dropDeadline && (
                        <ExpiryCountdown deadline={parcel.dropDeadline} />
                    )}
                    {isDelivered && parcel.actualDeliveryDate && (
                        <span className="text-[10px] font-bold text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/10 px-2 py-0.5 rounded-lg border border-green-100 dark:border-green-800">
                            Delivered on {new Date(parcel.actualDeliveryDate).toLocaleDateString()}
                        </span>
                    )}
                </div>
            </td>

            {/* Route */}
            <td className="px-5 py-4">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <span className="font-semibold text-foreground truncate max-w-[90px]">{parcel.currentHub?.name || 'Origin'}</span>
                    <ArrowRight className="h-3 w-3 flex-shrink-0" />
                    <span className="font-semibold text-foreground truncate max-w-[90px]">{parcel.destinationHub?.name || parcel.receiverAddress?.split(',')[0] || '—'}</span>
                </div>
                <p className="text-[10px] text-muted-foreground mt-1 truncate max-w-[200px]">To: {parcel.receiverName}</p>
                <motion.div
                    whileHover={{ scale: 1.02 }}
                    className="mt-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-2 flex flex-col gap-1 cursor-default"
                >
                    <div className="flex items-center gap-1 text-[10px] font-bold text-green-700 dark:text-green-400">
                        <User className="h-3 w-3" />
                        <span>{parcel.receiverName}</span>
                    </div>
                    <div className="flex items-center gap-1 text-[10px] font-bold text-green-700 dark:text-green-400">
                        <Phone className="h-3 w-3" />
                        <span>{parcel.receiverPhone}</span>
                    </div>
                </motion.div>
            </td>

            {/* Weight */}
            <td className="px-5 py-4">
                <p className="text-sm font-bold text-foreground">{parcel.weight} kg</p>
            </td>

            {/* Actions */}
            <td className="px-5 py-4">
                <div className="flex items-center gap-2 flex-wrap">
                    {/* Pending Requests tab: Accept Drop-off */}
                    {isPending && tab === 'pending' && !readOnly && (
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => onAcceptDrop(parcel.id)}
                            disabled={loading}
                            className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-3 py-2 rounded-xl text-[11px] font-black flex items-center gap-1.5 transition-all"
                        >
                            <Inbox className="h-3.5 w-3.5" />
                            Accept Drop-off
                        </motion.button>
                    )}

                    {/* At Hub tab: Dispatch or Confirm Order */}
                    {isAtHub && (tab === 'at_hub' || tab === 'ready') && (
                        <>
                            {isAtDestinationHub ? (
                                !readOnly && (
                                    <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => onCompleteDelivery(parcel.id)}
                                        disabled={loading}
                                        className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-3 py-2 rounded-xl text-[11px] font-black flex items-center gap-1.5 transition-all shadow-lg shadow-green-500/20"
                                    >
                                        <CheckCircle2 className="h-4 w-4" />
                                        Confirm Order
                                    </motion.button>
                                )
                            ) : hasAssignedTraveler ? (
                                !readOnly && (
                                    <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => onDispatch(parcel.id)}
                                        disabled={loading}
                                        className="bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white px-3 py-2 rounded-xl text-[11px] font-black flex items-center gap-1.5 transition-all"
                                    >
                                        <Send className="h-3.5 w-3.5" />
                                        Dispatch
                                    </motion.button>
                                )
                            ) : (
                                tab === 'at_hub' && <span className="text-[10px] text-muted-foreground italic">Awaiting traveler</span>
                            )}
                        </>
                    )}

                    {/* Incoming tab: Receive Parcel or Complete Delivery */}
                    {isInTransit && tab === 'incoming' && !readOnly && (
                        <>
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => onReceiveIncoming(parcel.id)}
                                disabled={loading}
                                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-3 py-2 rounded-xl text-[11px] font-black flex items-center gap-1.5 transition-all"
                            >
                                <Inbox className="h-3.5 w-3.5" />
                                Receive
                            </motion.button>
                        </>
                    )}

                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => onViewDetails(parcel)}
                        className="bg-blue-50 hover:bg-blue-100 text-blue-600 px-3 py-2 rounded-xl text-[11px] font-bold flex items-center gap-1.5 transition-all dark:bg-blue-900/20 dark:hover:bg-blue-900/30 dark:text-blue-400"
                    >
                        <FileText className="h-3.5 w-3.5" />
                        Details
                    </motion.button>

                    {/* Track link always visible */}
                    <Link
                        href={`/track?number=${parcel.trackingNumber}`}
                        className="bg-muted hover:bg-muted/80 text-muted-foreground px-3 py-2 rounded-xl text-[11px] font-bold flex items-center gap-1.5 transition-all"
                    >
                        <Eye className="h-3.5 w-3.5" />
                        Track
                    </Link>
                </div>
            </td>
        </motion.tr>
    );
}

// ─── Section Header (used in Incoming tab) ────────────────────────────────────
function SectionHeader({ label, count }: { label: string; count: number }) {
    if (count === 0) return null;
    return (
        <tr className="bg-muted/30">
            <td colSpan={5} className="px-5 py-2 text-[10px] font-black text-muted-foreground uppercase tracking-widest border-y border-border">
                {label} <span className="ml-2 bg-muted-foreground/20 px-1.5 py-0.5 rounded-full">{count}</span>
            </td>
        </tr>
    );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function HubInventoryPage() {
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState<'pending' | 'at_hub' | 'ready' | 'incoming' | 'all' | 'history' | 'successful'>('pending');
    const [selectedParcel, setSelectedParcel] = useState<any>(null);
    const [showDetails, setShowDetails] = useState(false);
    const user = useAuthStore((s) => s.user);
    const patchUser = useAuthStore((s) => s.patchUser);
    const qc = useQueryClient();

    // Fallback: fetch hubId from backend if not in auth store
    const { data: hubStats } = useQuery({
        queryKey: ['my-hub-stats-fallback'],
        queryFn: async () => { const { data } = await api.get('/hubs/my-hub-stats'); return data; },
        enabled: !user?.hubId,
        retry: false,
    });
    useEffect(() => {
        if (hubStats?.id && !user?.hubId) patchUser({ hubId: hubStats.id });
    }, [hubStats, user?.hubId, patchUser]);

    const hubId = user?.hubId || hubStats?.id || null;

    const invalidateAll = () => {
        qc.invalidateQueries({ queryKey: ['hub-pending'] });
        qc.invalidateQueries({ queryKey: ['hub-inventory'] });
        qc.invalidateQueries({ queryKey: ['hub-ready'] });
        qc.invalidateQueries({ queryKey: ['hub-incoming'] });
        qc.invalidateQueries({ queryKey: ['hub-all'] });
        qc.invalidateQueries({ queryKey: ['hub-history'] });
    };

    // ─── Data ─────────────────────────────────────────────────────────
    const { data: pending = [] } = useQuery<any[]>({
        queryKey: ['hub-pending', hubId],
        queryFn: async () => { const { data } = await api.get(`/parcels/hub-pending/${hubId}`); return data; },
        enabled: !!hubId,
        refetchInterval: 30000,
    });
    const { data: inventory = [], isLoading } = useQuery<any[]>({
        queryKey: ['hub-inventory', hubId],
        queryFn: async () => { const { data } = await api.get(`/parcels/hub-inventory/${hubId}`); return data; },
        enabled: !!hubId,
        refetchInterval: 30000,
    });
    const { data: ready = [] } = useQuery<any[]>({
        queryKey: ['hub-ready', hubId],
        queryFn: async () => { const { data } = await api.get(`/parcels/hub-ready/${hubId}`); return data; },
        enabled: !!hubId,
        refetchInterval: 30000,
    });
    const { data: incoming = [] } = useQuery<any[]>({
        queryKey: ['hub-incoming', hubId],
        queryFn: async () => { const { data } = await api.get(`/parcels/hub-incoming/${hubId}`); return data; },
        enabled: !!hubId,
        refetchInterval: 30000,
    });
    const { data: allParcels = [] } = useQuery<any[]>({
        queryKey: ['hub-all', hubId],
        queryFn: async () => { const { data } = await api.get(`/parcels/hub-all/${hubId}`); return data; },
        enabled: !!hubId && activeTab === 'all',
    });
    const { data: history = [] } = useQuery<any[]>({
        queryKey: ['hub-history', hubId],
        queryFn: async () => { const { data } = await api.get(`/parcels/hub-history/${hubId}`); return data; },
        enabled: !!hubId, // Need this always so we can count successful deliveries
    });

    const { data: traceData, isLoading: isTraceLoading } = useQuery<any>({
        queryKey: ['parcel-trace', selectedParcel?.id],
        queryFn: async () => { const { data } = await api.get(`/parcels/admin/${selectedParcel.id}/trace`); return data; },
        enabled: !!selectedParcel?.id && showDetails,
    });

    // ─── Mutations ─────────────────────────────────────────────────────
    const acceptDropMutation = useMutation({
        mutationFn: (id: string) => api.post(`/parcels/${id}/accept-dropoff`),
        onSuccess: () => { invalidateAll(); toast.success('✅ Parcel accepted into inventory. Customer notified!'); },
        onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed to accept drop-off'),
    });
    const receiveIncomingMutation = useMutation({
        mutationFn: (id: string) => api.post(`/parcels/${id}/receive-incoming`),
        onSuccess: () => { invalidateAll(); toast.success('📦 Incoming parcel received into inventory!'); },
        onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed to receive parcel'),
    });
    const dispatchMutation = useMutation({
        mutationFn: (id: string) => api.post(`/parcels/${id}/dispatch-parcel`),
        onSuccess: () => { invalidateAll(); toast.success('🚀 Parcel dispatched! Traveler & customer notified.'); },
        onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed to dispatch parcel'),
    });
    const completeDeliveryMutation = useMutation({
        mutationFn: (id: string) => api.post(`/parcels/${id}/complete-delivery`),
        onSuccess: () => { invalidateAll(); toast.success('🎉 Delivery confirmed! Customer notified.'); },
        onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed to complete delivery'),
    });

    const isAnyLoading = acceptDropMutation.isPending || receiveIncomingMutation.isPending ||
        dispatchMutation.isPending || completeDeliveryMutation.isPending;

    // ─── Tab config ────────────────────────────────────────────────────
    const tabs = [
        { id: 'pending' as const, label: 'Pending Requests', icon: TimerReset, count: pending.length, color: 'amber' },
        { id: 'at_hub' as const, label: 'At Hub', icon: Package, count: inventory.length, color: 'blue' },
        { id: 'ready' as const, label: 'Ready to Dispatch', icon: Send, count: ready.length, color: 'green' },
        { id: 'incoming' as const, label: 'Incoming', icon: Truck, count: incoming.length, color: 'purple' },
        { id: 'successful' as const, label: 'Successful', icon: CheckCircle2, count: history.filter((p: any) => p.status === 'delivered').length, color: 'green' },
        { id: 'all' as const, label: 'All Parcels', icon: List, count: 0, color: 'slate' },
        { id: 'history' as const, label: 'History', icon: HistoryIcon, count: 0, color: 'slate' },
    ];

    // ─── Active data for current tab ───────────────────────────────────
    const tabData: Record<string, any[]> = {
        pending, at_hub: inventory, ready, incoming, all: allParcels, history,
        successful: history.filter((p: any) => p.status === 'delivered')
    };
    const raw = tabData[activeTab] || [];

    const filtered = raw.filter((p: any) =>
        p.trackingNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.receiverName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.senderName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.sender?.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // ─── No Hub ─────────────────────────────────────────────────────────
    if (!hubId && user?.role !== 'admin') {
        return (
            <div className="p-8 flex flex-col items-center justify-center pt-20">
                <div className="bg-amber-50 dark:bg-amber-900/10 p-10 rounded-[40px] border border-amber-100 dark:border-amber-900/30 flex flex-col items-center gap-6 max-w-md text-center">
                    <div className="p-4 bg-amber-100 dark:bg-amber-900/30 rounded-full"><MapPin className="h-10 w-10 text-amber-600 dark:text-amber-400" /></div>
                    <h2 className="text-2xl font-black text-amber-900 dark:text-amber-200">Inventory Unavailable</h2>
                    <p className="text-amber-700 dark:text-amber-300 font-medium">You must be assigned to a hub to manage inventory.</p>
                    <a href="/hub/profile" className="bg-blue-600 text-white font-bold px-8 py-4 rounded-2xl flex items-center gap-2 shadow-lg shadow-blue-500/20">
                        Set Up Your Hub <ArrowRight className="h-5 w-5" />
                    </a>
                </div>
            </div>
        );
    }

    const tabBadgeColor: Record<string, string> = {
        amber: 'bg-amber-500', blue: 'bg-blue-600', green: 'bg-green-600',
        purple: 'bg-purple-600', slate: 'bg-slate-500',
    };

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            {/* ── Header ── */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-foreground tracking-tight">Hub Inventory</h1>
                    <p className="text-muted-foreground text-sm mt-1">
                        Full parcel lifecycle management — accept, dispatch, receive, complete delivery.
                    </p>
                </div>
                <div className="relative w-64">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Search tracking # or name..."
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

            {/* ── Stats Row ── */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {[
                    { label: 'Pending Drop-off', val: pending.length, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/10 border-amber-100 dark:border-amber-900/30' },
                    { label: 'At Hub', val: inventory.length, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-900/30' },
                    { label: 'Ready for Travel', val: ready.length, color: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-50 dark:bg-indigo-900/10 border-indigo-100 dark:border-indigo-900/30' },
                    { label: 'Incoming', val: incoming.length, color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-900/10 border-purple-100 dark:border-purple-900/30' },
                    { label: 'Successful', val: history.filter((p: any) => p.status === 'delivered').length, color: 'text-green-600 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-900/10 border-green-100 dark:border-green-900/30' },
                ].map((s, idx) => (
                    <motion.div
                        key={s.label}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        whileHover={{ y: -4, scale: 1.02 }}
                        className={`rounded-2xl p-4 border shadow-sm hover:shadow-md transition-shadow ${s.bg}`}
                    >
                        <p className={`text-3xl font-black ${s.color}`}>{s.val}</p>
                        <p className="text-xs text-muted-foreground font-medium mt-1">{s.label}</p>
                    </motion.div>
                ))}
            </div>

            {/* ── Tabs ── */}
            <div className="flex gap-1 border-b border-border pb-0 overflow-x-auto">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`relative flex items-center gap-2 px-4 py-3 text-sm font-bold transition-all whitespace-nowrap ${activeTab === tab.id
                            ? 'text-blue-600'
                            : 'text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-t-xl'
                            }`}
                    >
                        <tab.icon className="h-4 w-4 relative z-10" />
                        <span className="relative z-10">{tab.label}</span>
                        {tab.count > 0 && (
                            <span className={`relative z-10 text-[10px] font-black px-2 py-0.5 rounded-full text-white ${activeTab === tab.id ? tabBadgeColor[tab.color] : 'bg-muted text-muted-foreground'}`}>
                                {tab.count}
                            </span>
                        )}
                        {activeTab === tab.id && (
                            <motion.div
                                layoutId="activeTab"
                                className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full"
                                transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                            />
                        )}
                        {activeTab === tab.id && (
                            <motion.div
                                layoutId="activeTabBg"
                                className="absolute inset-0 bg-blue-50/50 dark:bg-blue-900/20 rounded-t-xl"
                                transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                            />
                        )}
                    </button>
                ))}
            </div>

            {/* ── Tab context banners ── */}
            {activeTab === 'pending' && pending.length > 0 && (
                <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 rounded-2xl px-5 py-3.5 flex items-center gap-3">
                    <TimerReset className="h-4 w-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
                    <p className="text-xs text-amber-800 dark:text-amber-300 font-medium">
                        These customers have <strong>confirmed they will drop off</strong> a parcel at your hub. Click <strong>Accept Drop-off</strong> once the parcel has been physically received. Parcels expire after 48h if not accepted.
                    </p>
                </div>
            )}
            {activeTab === 'incoming' && incoming.length > 0 && (
                <div className="bg-purple-50 dark:bg-purple-900/10 border border-purple-100 dark:border-purple-900/30 rounded-2xl px-5 py-3.5 flex items-center gap-3">
                    <Truck className="h-4 w-4 text-purple-600 dark:text-purple-400 flex-shrink-0" />
                    <p className="text-xs text-purple-800 dark:text-purple-300 font-medium">
                        These parcels are <strong>in transit from another hub</strong> via a traveler. Click <strong>Receive</strong> to add to this hub's inventory, or <strong>Complete Delivery</strong> if this is the final destination and the receiver is present.
                    </p>
                </div>
            )}
            {activeTab === 'ready' && ready.length > 0 && (
                <div className="bg-green-50 dark:bg-green-900/10 border border-green-100 dark:border-green-900/30 rounded-2xl px-5 py-3.5 flex items-center gap-3">
                    <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                    <p className="text-xs text-green-800 dark:text-green-300 font-medium">
                        These parcels have an assigned traveler and are <strong>ready to dispatch</strong>. Click <strong>Dispatch</strong> to hand them to the traveler.
                    </p>
                </div>
            )}

            {/* ── Table ── */}
            {isLoading ? (
                <div className="flex justify-center py-20"><Loader2 className="h-10 w-10 animate-spin text-blue-600" /></div>
            ) : (
                <div className="bg-background dark:bg-slate-900 rounded-2xl shadow-sm border border-border overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-muted/50 border-b border-border">
                                    <th className="px-5 py-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Parcel</th>
                                    <th className="px-5 py-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Status</th>
                                    <th className="px-5 py-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Route</th>
                                    <th className="px-5 py-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Weight</th>
                                    <th className="px-5 py-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Actions</th>
                                </tr>
                            </thead>
                            <AnimatePresence mode="popLayout">
                                <tbody key={activeTab}>
                                    {activeTab === 'incoming' ? (
                                        <>
                                            <SectionHeader label="In Transit — Arriving from Other Hub" count={filtered.filter(p => p.status === 'in_transit').length} />
                                            {filtered.filter(p => p.status === 'in_transit').map((parcel: any) => (
                                                <ParcelRow key={parcel.id} parcel={parcel} tab="incoming"
                                                    onAcceptDrop={id => acceptDropMutation.mutate(id)}
                                                    onReceiveIncoming={id => receiveIncomingMutation.mutate(id)}
                                                    onDispatch={id => dispatchMutation.mutate(id)}
                                                    onCompleteDelivery={id => completeDeliveryMutation.mutate(id)}
                                                    onViewDetails={p => { setSelectedParcel(p); setShowDetails(true); }}
                                                    loading={isAnyLoading}
                                                    readOnly={user?.role === 'admin'} />
                                            ))}
                                        </>
                                    ) : activeTab === 'at_hub' ? (
                                        <>
                                            <SectionHeader label="Awaiting Traveler (Further Transit)" count={filtered.filter(p => !p.destinationHub || p.currentHub?.id !== p.destinationHub?.id).length} />
                                            {filtered.filter(p => !p.destinationHub || p.currentHub?.id !== p.destinationHub?.id).map((parcel: any) => (
                                                <ParcelRow key={parcel.id} parcel={parcel} tab="at_hub"
                                                    onAcceptDrop={id => acceptDropMutation.mutate(id)}
                                                    onReceiveIncoming={id => receiveIncomingMutation.mutate(id)}
                                                    onDispatch={id => dispatchMutation.mutate(id)}
                                                    onCompleteDelivery={id => completeDeliveryMutation.mutate(id)}
                                                    onViewDetails={p => { setSelectedParcel(p); setShowDetails(true); }}
                                                    loading={isAnyLoading}
                                                    readOnly={user?.role === 'admin'} />
                                            ))}
                                            <SectionHeader label="Awaiting Receiver Pickup" count={filtered.filter(p => p.destinationHub && p.currentHub?.id === p.destinationHub?.id).length} />
                                            {filtered.filter(p => p.destinationHub && p.currentHub?.id === p.destinationHub?.id).map((parcel: any) => (
                                                <ParcelRow key={parcel.id} parcel={parcel} tab="at_hub"
                                                    onAcceptDrop={id => acceptDropMutation.mutate(id)}
                                                    onReceiveIncoming={id => receiveIncomingMutation.mutate(id)}
                                                    onDispatch={id => dispatchMutation.mutate(id)}
                                                    onCompleteDelivery={id => completeDeliveryMutation.mutate(id)}
                                                    onViewDetails={p => { setSelectedParcel(p); setShowDetails(true); }}
                                                    loading={isAnyLoading}
                                                    readOnly={user?.role === 'admin'} />
                                            ))}
                                        </>
                                    ) : (
                                        filtered.map((parcel: any) => (
                                            <ParcelRow key={parcel.id} parcel={parcel} tab={activeTab}
                                                onAcceptDrop={id => acceptDropMutation.mutate(id)}
                                                onReceiveIncoming={id => receiveIncomingMutation.mutate(id)}
                                                onDispatch={id => dispatchMutation.mutate(id)}
                                                onCompleteDelivery={id => completeDeliveryMutation.mutate(id)}
                                                onViewDetails={p => { setSelectedParcel(p); setShowDetails(true); }}
                                                loading={isAnyLoading} />
                                        ))
                                    )}
                                    {filtered.length === 0 && (
                                        <motion.tr
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                        >
                                            <td colSpan={5} className="py-20 text-center">
                                                <div className="flex flex-col items-center gap-3">
                                                    <div className="bg-muted p-5 rounded-full">
                                                        <Package className="h-8 w-8 text-muted-foreground/20" />
                                                    </div>
                                                    <p className="text-muted-foreground font-medium text-sm">
                                                        {activeTab === 'pending' ? 'No pending drop-off requests.'
                                                            : activeTab === 'incoming' ? 'No parcels in transit to this hub.'
                                                                : activeTab === 'ready' ? 'No parcels with assigned travelers yet.'
                                                                    : activeTab === 'history' ? 'No delivery history yet.'
                                                                        : activeTab === 'at_hub' ? 'No parcels currently in inventory.'
                                                                            : 'No parcels found.'}
                                                    </p>
                                                </div>
                                            </td>
                                        </motion.tr>
                                    )}
                                </tbody>
                            </AnimatePresence>
                        </table>
                    </div>
                </div>
            )}
            {/* ── Details Modal ── */}
            <AnimatePresence>
                {showDetails && selectedParcel && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4"
                    >
                        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setShowDetails(false)} />
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            className="relative bg-background border border-border w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-[32px] shadow-2xl flex flex-col"
                        >
                            {/* Modal Header */}
                            <div className="p-6 border-b border-border flex items-center justify-between bg-muted/30">
                                <div>
                                    <h3 className="text-xl font-black text-foreground flex items-center gap-2">
                                        <Package className="h-6 w-6 text-blue-600" />
                                        Parcel Details
                                    </h3>
                                    <p className="text-xs text-muted-foreground font-mono mt-0.5">#{selectedParcel.trackingNumber}</p>
                                </div>
                                <button onClick={() => setShowDetails(false)} className="bg-muted hover:bg-muted/80 p-2 rounded-xl transition-all">
                                    <Ban className="h-5 w-5 text-muted-foreground" />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-6 space-y-8">
                                {isTraceLoading ? (
                                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                                        <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
                                        <p className="text-sm font-bold text-muted-foreground">Gathering journey details...</p>
                                    </div>
                                ) : !traceData ? (
                                    <p className="text-center py-10 text-muted-foreground">Failed to load details.</p>
                                ) : (
                                    <>
                                        {/* 1. Participants Directory */}
                                        <div className="grid md:grid-cols-3 gap-4">
                                            {[
                                                { label: 'Sender', data: traceData.parcel.sender, icon: UserCircle, color: 'blue' },
                                                { label: 'Receiver', data: traceData.parcel, icon: UserCircle, color: 'green', isReceiver: true },
                                                { label: 'Assigned Traveler', data: traceData.parcel.assignedTo, icon: Truck, color: 'purple' },
                                            ].map(p => (
                                                <motion.div
                                                    key={p.label}
                                                    whileHover={{ y: -2 }}
                                                    className="bg-muted/30 border border-border rounded-2xl p-4 flex flex-col gap-3"
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <div className={`p-2 rounded-lg bg-${p.color}-100 dark:bg-${p.color}-900/30 text-${p.color}-600 dark:text-${p.color}-400`}>
                                                            <p.icon className="h-4 w-4" />
                                                        </div>
                                                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{p.label}</p>
                                                    </div>
                                                    {p.data ? (
                                                        <div className="space-y-1.5">
                                                            <p className="text-sm font-black text-foreground">{p.isReceiver ? p.data.receiverName : p.data.name}</p>
                                                            <p className="text-[11px] font-bold text-muted-foreground flex items-center gap-1.5">
                                                                <Phone className="h-3 w-3" />
                                                                {p.isReceiver ? p.data.receiverPhone : p.data.phone || 'No phone'}
                                                            </p>
                                                            <p className="text-[10px] font-mono text-muted-foreground truncate opacity-60">ID: {p.data.id}</p>
                                                        </div>
                                                    ) : (
                                                        <p className="text-xs italic text-muted-foreground py-2">Not assigned yet</p>
                                                    )}
                                                </motion.div>
                                            ))}
                                        </div>

                                        {/* 2. Journey History */}
                                        <div className="space-y-4">
                                            <h4 className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                                <MapIcon className="h-4 w-4" />
                                                Travel Chain & Hubs
                                            </h4>
                                            <div className="space-y-3">
                                                {traceData.legs?.length > 0 ? traceData.legs.map((leg: any, idx: number) => (
                                                    <motion.div
                                                        key={leg.id}
                                                        initial={{ opacity: 0, x: -10 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        transition={{ delay: idx * 0.1 }}
                                                        className="relative pl-6 before:content-[''] before:absolute before:left-[11px] before:top-8 before:bottom-[-12px] before:w-0.5 before:bg-border last:before:hidden"
                                                    >
                                                        <div className="absolute left-0 top-1.5 w-6 h-6 rounded-full bg-background border-2 border-blue-500 flex items-center justify-center z-10">
                                                            <span className="text-[10px] font-black">{idx + 1}</span>
                                                        </div>
                                                        <div className="bg-muted/20 border border-border rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                                            <div className="flex items-center gap-3">
                                                                <div className="text-xs">
                                                                    <p className="font-black text-foreground">{leg.fromHub?.name || 'Origin'}</p>
                                                                    <p className="text-[10px] text-muted-foreground">Departed: {new Date(leg.dispatchedAt).toLocaleString()}</p>
                                                                </div>
                                                                <ArrowRight className="h-4 w-4 text-muted-foreground" />
                                                                <div className="text-xs">
                                                                    <p className="font-black text-foreground">{leg.toHub?.name || 'Destination'}</p>
                                                                    <p className="text-[10px] text-muted-foreground">Arrived: {leg.receivedAt ? new Date(leg.receivedAt).toLocaleString() : 'In Progress'}</p>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-2 bg-background/50 px-3 py-1.5 rounded-lg border border-border">
                                                                <UserCircle className="h-3.5 w-3.5 text-blue-600" />
                                                                <div>
                                                                    <p className="text-[10px] font-black leading-none">Traveler: {leg.traveler?.name}</p>
                                                                    <p className="text-[9px] text-muted-foreground font-bold mt-0.5">{leg.traveler?.phone}</p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </motion.div>
                                                )) : (
                                                    <div className="bg-muted/20 border border-dashed border-border rounded-xl p-8 text-center">
                                                        <p className="text-xs text-muted-foreground italic">No legs recorded yet. This parcel is either waiting for its first traveler or at its origin hub.</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* 3. Full Tracking Logs */}
                                        <div className="space-y-4">
                                            <h4 className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                                <ClipboardList className="h-4 w-4" />
                                                Tracking Log (Events)
                                            </h4>
                                            <div className="bg-muted/30 border border-border rounded-2xl overflow-hidden text-[11px]">
                                                <table className="w-full text-left">
                                                    <thead>
                                                        <tr className="bg-muted border-b border-border text-[9px] font-black uppercase tracking-tighter text-muted-foreground">
                                                            <th className="px-4 py-2">Time</th>
                                                            <th className="px-4 py-2">Status</th>
                                                            <th className="px-4 py-2">Event</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {traceData.logs?.map((log: any) => (
                                                            <tr key={log.id} className="border-b border-border/50 last:border-0 hover:bg-background/50 transition-colors">
                                                                <td className="px-4 py-2 whitespace-nowrap opacity-60 font-medium">{new Date(log.createdAt).toLocaleString()}</td>
                                                                <td className="px-4 py-2">
                                                                    <StatusBadge status={log.status} />
                                                                </td>
                                                                <td className="px-4 py-2 font-medium text-foreground/80">{log.description}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>

                            {/* Modal Footer */}
                            <div className="p-4 border-t border-border bg-muted/30 flex justify-end">
                                <button onClick={() => setShowDetails(false)} className="bg-foreground text-background font-black px-6 py-2.5 rounded-2xl text-xs transition-all hover:opacity-90">
                                    Close
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
