'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api-client';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Package, MapPin, User, Phone, Loader2, CheckCircle2,
    Clock, Truck, ShieldCheck, ChevronRight, AlertCircle,
    LayoutGrid, History as HistoryIcon
} from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

// ─── Status config ────────────────────────────────────────────────────────────
const STATUS_CONFIG = {
    waiting_for_drop: {
        label: 'Waiting for Drop',
        sublabel: 'Customer must drop the parcel at the origin hub',
        color: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-900/40',
        icon: Clock,
        dot: 'bg-yellow-400',
        card: 'border-l-yellow-400',
    },
    at_hub: {
        label: 'Awaiting Dispatch',
        sublabel: 'Hub manager needs to dispatch this parcel to you',
        color: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-900/40',
        icon: Clock,
        dot: 'bg-amber-400',
        card: 'border-l-amber-400',
    },
    in_transit: {
        label: 'Ongoing',
        sublabel: 'You are currently carrying this parcel',
        color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-900/40',
        icon: Truck,
        dot: 'bg-blue-500',
        card: 'border-l-blue-500',
    },
    delivered: {
        label: 'Delivered',
        sublabel: 'Successfully delivered',
        color: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-900/40',
        icon: CheckCircle2,
        dot: 'bg-green-500',
        card: 'border-l-green-500',
    },
    out_for_delivery: {
        label: 'Out for Delivery',
        sublabel: 'Last-mile delivery in progress',
        color: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-900/40',
        icon: Truck,
        dot: 'bg-orange-400',
        card: 'border-l-orange-400',
    },
} as const;

function StatusBadge({ status }: { status: string }) {
    const cfg = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG];
    if (!cfg) return <span className="text-[10px] bg-muted text-muted-foreground px-2 py-1 rounded-full font-bold uppercase">{status}</span>;
    const Icon = cfg.icon;
    return (
        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${cfg.color}`}>
            <Icon className="h-3 w-3" />
            {cfg.label}
        </span>
    );
}

function ParcelCard({ parcel }: { parcel: any }) {
    const cfg = STATUS_CONFIG[parcel.status as keyof typeof STATUS_CONFIG];
    const borderColor = cfg?.card ?? 'border-l-border';

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            whileHover={{ y: -2 }}
            className={`bg-background dark:bg-slate-900 rounded-2xl shadow-sm border border-border border-l-4 ${borderColor} overflow-hidden`}
        >
            {/* Header */}
            <div className="px-6 py-4 flex items-start justify-between border-b border-border/50 gap-4">
                <div className="flex items-center gap-3 min-w-0">
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-2.5 rounded-xl flex-shrink-0">
                        <Package className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="min-w-0">
                        <p className="font-black text-foreground text-sm font-mono">#{parcel.trackingNumber}</p>
                        {parcel.currentHub?.name && (
                            <p className="text-[10px] text-muted-foreground mt-0.5">
                                From: <span className="font-bold text-foreground/80">{parcel.currentHub.name}</span>
                            </p>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                    <StatusBadge status={parcel.status} />
                </div>
            </div>

            {/* Body */}
            <div className="px-6 py-4 grid sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                    <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-blue-500" /> Pickup From
                    </p>
                    <p className="text-sm text-foreground font-semibold leading-tight">{parcel.senderAddress}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                        <User className="h-3 w-3" /> {parcel.senderName}
                    </p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Phone className="h-3 w-3" /> {parcel.senderPhone}
                    </p>
                </div>
                <div className="space-y-1">
                    <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-red-500" /> Deliver To
                    </p>
                    <p className="text-sm text-foreground font-semibold leading-tight">{parcel.receiverAddress}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                        <User className="h-3 w-3" /> {parcel.receiverName}
                    </p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Phone className="h-3 w-3" /> {parcel.receiverPhone}
                    </p>
                </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-3 bg-muted/30 flex items-center justify-between border-t border-border/50">
                {cfg && (
                    <p className="text-[10px] text-muted-foreground font-medium">{cfg.sublabel}</p>
                )}
                <Link
                    href={`/track?number=${parcel.trackingNumber}`}
                    className="ml-auto flex items-center gap-1 text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:opacity-80 transition-colors"
                >
                    Track <ChevronRight className="h-3.5 w-3.5" />
                </Link>
            </div>
        </motion.div>
    );
}

// ─── Section ──────────────────────────────────────────────────────────────────
function Section({ title, count, dotColor, children }: {
    title: string; count: number; dotColor: string; children: React.ReactNode;
}) {
    if (count === 0) return null;
    return (
        <motion.div
            layout
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-3"
        >
            <div className="flex items-center gap-2">
                <span className={`h-2.5 w-2.5 rounded-full ${dotColor}`} />
                <h2 className="text-sm font-black text-foreground/70 uppercase tracking-widest">{title}</h2>
                <span className="bg-muted text-muted-foreground text-[10px] font-black px-2 py-0.5 rounded-full">{count}</span>
            </div>
            {children}
        </motion.div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function TravelerDeliveriesPage() {
    const [parcels, setParcels] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'active' | 'ongoing' | 'completed' | 'all'>('active');

    useEffect(() => {
        fetchAll();
    }, []);

    const fetchAll = async () => {
        setLoading(true);
        try {
            const { data } = await api.get('/parcels/assigned-to-me');
            setParcels(data);
        } catch (err) {
            toast.error('Failed to load deliveries');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
            </div>
        );
    }

    const waitingForDrop = parcels.filter(p => p.status === 'waiting_for_drop');
    const awaitingDispatch = parcels.filter(p => p.status === 'at_hub' && p.currentHub?.id !== p.destinationHub?.id);
    const ongoing = parcels.filter(p => p.status === 'in_transit' || p.status === 'out_for_delivery');
    const completed = parcels.filter(p =>
        p.status === 'delivered' ||
        (p.status === 'at_hub' && p.currentHub?.id === p.destinationHub?.id)
    );

    const activeList = [...waitingForDrop, ...awaitingDispatch];
    const ongoingList = ongoing;
    const completedList = completed;

    const tabs = [
        { id: 'active', label: 'Active', icon: Clock, count: activeList.length, color: 'text-amber-600', bg: 'bg-amber-50' },
        { id: 'ongoing', label: 'Ongoing', icon: Truck, count: ongoingList.length, color: 'text-blue-600', bg: 'bg-blue-50' },
        { id: 'completed', label: 'Completed', icon: CheckCircle2, count: completedList.length, color: 'text-green-600', bg: 'bg-green-50' },
        { id: 'all', label: 'All', icon: LayoutGrid, count: parcels.length, color: 'text-slate-600', bg: 'bg-slate-50' },
    ] as const;

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-foreground tracking-tight">My Deliveries</h1>
                <p className="text-muted-foreground text-sm mt-1">
                    Manage your claimed parcels and track their status in real-time.
                </p>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {tabs.map((t, idx) => (
                    <motion.div
                        key={t.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        whileHover={{ y: -4, scale: 1.02 }}
                        className={`rounded-2xl p-4 border bg-background dark:bg-slate-900 border-border shadow-sm cursor-pointer transition-all ${activeTab === t.id ? 'ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-slate-950 shadow-md' : ''
                            }`}
                        onClick={() => setActiveTab(t.id)}
                    >
                        <div className="flex items-center justify-between mb-2">
                            <div className={`p-2 rounded-xl ${t.bg} dark:bg-opacity-10`}>
                                <t.icon className={`h-4 w-4 ${t.color}`} />
                            </div>
                            <p className={`text-2xl font-black ${t.color}`}>{t.count}</p>
                        </div>
                        <p className="text-xs text-muted-foreground font-medium">{t.label}</p>
                    </motion.div>
                ))}
            </div>

            {/* Tabs */}
            <div className="flex gap-1 border-b border-border pb-px overflow-x-auto relative">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`relative flex items-center gap-2 px-6 py-3 text-sm font-bold transition-all whitespace-nowrap ${activeTab === tab.id
                            ? 'text-blue-600'
                            : 'text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-t-xl'
                            }`}
                    >
                        <tab.icon className="h-4 w-4 relative z-10" />
                        <span className="relative z-10">{tab.label}</span>
                        {activeTab === tab.id && (
                            <motion.div
                                layoutId="travelerTab"
                                className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full"
                                transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                            />
                        )}
                        {activeTab === tab.id && (
                            <motion.div
                                layoutId="travelerTabBg"
                                className="absolute inset-0 bg-blue-50/50 dark:bg-blue-900/20 rounded-t-xl"
                                transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                            />
                        )}
                    </button>
                ))}
            </div>

            {/* Content Area */}
            <div className="min-h-[400px]">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.2 }}
                        className="space-y-6"
                    >
                        {parcels.length === 0 ? (
                            <div className="bg-background dark:bg-slate-900 rounded-[32px] shadow-sm border border-border p-16 text-center border-dashed">
                                <div className="bg-muted p-5 rounded-full w-fit mx-auto mb-4">
                                    <Package className="h-10 w-10 text-muted-foreground/30" />
                                </div>
                                <p className="text-muted-foreground font-medium mb-2">No deliveries yet</p>
                                <p className="text-muted-foreground/60 text-sm mb-6">Post a route and select parcels to carry</p>
                                <Link
                                    href="/traveler/post-route"
                                    className="bg-blue-600 text-white font-bold px-6 py-3 rounded-xl inline-flex items-center gap-2 hover:bg-blue-700 transition-colors"
                                >
                                    <Truck className="h-4 w-4" /> Post a Route
                                </Link>
                            </div>
                        ) : (
                            <>
                                {(activeTab === 'active' || activeTab === 'all') && (
                                    <>
                                        <Section title="Waiting for Customer Drop-off" count={waitingForDrop.length} dotColor="bg-yellow-400">
                                            <div className="bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-100 dark:border-yellow-900/30 rounded-xl px-4 py-3 flex items-start gap-2 mb-2">
                                                <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
                                                <p className="text-xs text-yellow-700 dark:text-yellow-300 font-medium">
                                                    The customer hasn't dropped these parcels yet. You'll see them in Awaiting Dispatch once accepted by the hub.
                                                </p>
                                            </div>
                                            <div className="space-y-3">
                                                {waitingForDrop.map(p => <ParcelCard key={p.id} parcel={p} />)}
                                            </div>
                                        </Section>

                                        <Section title="Awaiting Hub Dispatch" count={awaitingDispatch.length} dotColor="bg-amber-400">
                                            <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 rounded-xl px-4 py-3 flex items-start gap-2 mb-2">
                                                <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                                                <p className="text-xs text-amber-700 dark:text-amber-300 font-medium">
                                                    You've claimed these parcels. The hub manager will review and dispatch them to you shortly.
                                                </p>
                                            </div>
                                            <div className="space-y-3">
                                                {awaitingDispatch.map(p => <ParcelCard key={p.id} parcel={p} />)}
                                            </div>
                                        </Section>
                                    </>
                                )}

                                {(activeTab === 'ongoing' || activeTab === 'all') && (
                                    <Section title="In Transit / Ongoing" count={ongoingList.length} dotColor="bg-blue-500">
                                        <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-xl px-4 py-3 flex items-start gap-2 mb-2">
                                            <ShieldCheck className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                                            <p className="text-xs text-blue-700 dark:text-blue-300 font-medium">
                                                Hub dispatched ✓ — You are now carrying these parcels. Deliver them safely to the next hub.
                                            </p>
                                        </div>
                                        <div className="space-y-3">
                                            {ongoingList.map(p => <ParcelCard key={p.id} parcel={p} />)}
                                        </div>
                                    </Section>
                                )}

                                {(activeTab === 'completed' || activeTab === 'all') && (
                                    <Section title="Successfully Completed" count={completedList.length} dotColor="bg-green-500">
                                        <div className="space-y-3">
                                            {completedList.map(p => <ParcelCard key={p.id} parcel={p} />)}
                                        </div>
                                    </Section>
                                )}

                                {activeTab === 'active' && activeList.length === 0 && (
                                    <div className="py-20 text-center opacity-50">No active requests currently.</div>
                                )}
                                {activeTab === 'ongoing' && ongoingList.length === 0 && (
                                    <div className="py-20 text-center opacity-50">No parcels currently in transit.</div>
                                )}
                                {activeTab === 'completed' && completedList.length === 0 && (
                                    <div className="py-20 text-center opacity-50">No completed deliveries yet.</div>
                                )}
                            </>
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
}
