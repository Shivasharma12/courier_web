'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api-client';
import {
    Package, MapPin, User, Phone, Loader2, CheckCircle2,
    Clock, Truck, ShieldCheck, ChevronRight, AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

// ─── Status config ────────────────────────────────────────────────────────────
const STATUS_CONFIG = {
    at_hub: {
        label: 'Awaiting Dispatch',
        sublabel: 'Hub manager needs to approve & dispatch this parcel to you',
        color: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-900/40',
        icon: Clock,
        dot: 'bg-amber-400',
        card: 'border-l-amber-400',
    },
    in_transit: {
        label: 'In Transit',
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
        <div className={`bg-background dark:bg-slate-900 rounded-2xl shadow-sm border border-border border-l-4 ${borderColor} overflow-hidden`}>
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
                    href={`/customer/track?tracking=${parcel.trackingNumber}`}
                    className="ml-auto flex items-center gap-1 text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:opacity-80 transition-colors"
                >
                    Track <ChevronRight className="h-3.5 w-3.5" />
                </Link>
            </div>
        </div>
    );
}

// ─── Section ──────────────────────────────────────────────────────────────────
function Section({ title, count, dotColor, children }: {
    title: string; count: number; dotColor: string; children: React.ReactNode;
}) {
    return (
        <div className="space-y-3">
            <div className="flex items-center gap-2">
                <span className={`h-2.5 w-2.5 rounded-full ${dotColor}`} />
                <h2 className="text-sm font-black text-foreground/70 uppercase tracking-widest">{title}</h2>
                <span className="bg-muted text-muted-foreground text-[10px] font-black px-2 py-0.5 rounded-full">{count}</span>
            </div>
            {children}
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function TravelerDeliveriesPage() {
    const [parcels, setParcels] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

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

    const awaitingDispatch = parcels.filter(p => p.status === 'at_hub' && p.currentHub?.id !== p.destinationHub?.id);
    const inTransit = parcels.filter(p => p.status === 'in_transit' || p.status === 'out_for_delivery');
    const completed = parcels.filter(p =>
        p.status === 'delivered' ||
        (p.status === 'at_hub' && p.currentHub?.id === p.destinationHub?.id)
    );

    const totalActive = awaitingDispatch.length + inTransit.length;

    return (
        <div className="space-y-8 max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-foreground tracking-tight">My Deliveries</h1>
                    <p className="text-muted-foreground text-sm mt-1">
                        Parcels you've claimed — wait for hub manager to dispatch them
                    </p>
                </div>
                {totalActive > 0 && (
                    <div className="bg-blue-600 text-white font-black px-4 py-2 rounded-2xl text-sm shadow-lg shadow-blue-500/20">
                        {totalActive} Active
                    </div>
                )}
            </div>

            {parcels.length === 0 ? (
                <div className="bg-background dark:bg-slate-900 rounded-2xl shadow-sm border border-border p-16 text-center">
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
                <div className="space-y-8">
                    {/* Awaiting Dispatch */}
                    {awaitingDispatch.length > 0 && (
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
                    )}

                    {/* In Transit */}
                    {inTransit.length > 0 && (
                        <Section title="In Transit" count={inTransit.length} dotColor="bg-blue-500">
                            <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-xl px-4 py-3 flex items-start gap-2 mb-2">
                                <ShieldCheck className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                                <p className="text-xs text-blue-700 dark:text-blue-300 font-medium">
                                    Hub dispatched ✓ — You are now carrying these parcels. Deliver them safely.
                                </p>
                            </div>
                            <div className="space-y-3">
                                {inTransit.map(p => <ParcelCard key={p.id} parcel={p} />)}
                            </div>
                        </Section>
                    )}

                    {/* Completed */}
                    {completed.length > 0 && (
                        <Section title="Completed" count={completed.length} dotColor="bg-green-500">
                            <div className="space-y-3">
                                {completed.map(p => <ParcelCard key={p.id} parcel={p} />)}
                            </div>
                        </Section>
                    )}
                </div>
            )}
        </div>
    );
}
