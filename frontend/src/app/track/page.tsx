'use client';

import { useState, useEffect, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api-client';
import dynamic from 'next/dynamic';
import { Search, Package, MapPin, Map as MapIcon, Loader2, ArrowLeft, Truck } from 'lucide-react';
import { io } from 'socket.io-client';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { ThemeToggle } from '@/components/theme-toggle';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { useAuthStore } from '@/store/auth-store';
import DashboardSidebar from '@/components/dashboard-sidebar';

const LiveMap = dynamic(() => import('@/components/live-map'), {
    ssr: false,
    loading: () => (
        <div className="w-full h-full flex items-center justify-center bg-muted/20">
            <Loader2 className="h-8 w-8 animate-spin text-primary/40" />
        </div>
    )
});

function TrackContent() {
    const { token, user } = useAuthStore();
    const authenticated = !!token;

    const [trackingNumber, setTrackingNumber] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPos, setCurrentPos] = useState<{ lat: number; lng: number } | undefined>();

    const searchParams = useSearchParams();
    const queryNumber = searchParams.get('number');

    useEffect(() => {
        if (queryNumber) {
            setTrackingNumber(queryNumber);
            setSearchQuery(queryNumber);
        }
    }, [queryNumber]);

    const queryClient = useQueryClient();

    const { data: parcel, isLoading, isError } = useQuery({
        queryKey: ['track', searchQuery],
        queryFn: async () => {
            if (!searchQuery) return null;
            const clean = searchQuery.startsWith('#') ? searchQuery.slice(1) : searchQuery;
            const { data } = await api.get(`/parcels/track/${clean}`);
            return data;
        },
        enabled: !!searchQuery,
        refetchInterval: 10000,
    });

    const { data: logs } = useQuery({
        queryKey: ['tracking-logs', parcel?.id],
        queryFn: async () => {
            const { data } = await api.get(`/parcels/${parcel.id}/tracking-logs`);
            return data;
        },
        enabled: !!parcel?.id,
        refetchInterval: 5000,
    });

    useEffect(() => {
        if (!searchQuery || !parcel) return;
        const socket = io(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001');
        socket.emit('joinTracking', parcel.trackingNumber);
        socket.on('locationUpdated', (data) => {
            setCurrentPos({ lat: data.lat, lng: data.lng });
        });
        socket.on('logUpdated', () => {
            queryClient.invalidateQueries({ queryKey: ['tracking-logs', parcel.id] });
            queryClient.invalidateQueries({ queryKey: ['track', searchQuery] });
        });
        return () => { socket.disconnect(); };
    }, [searchQuery, parcel, queryClient]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setSearchQuery(trackingNumber);
    };

    return (
        <div className={cn(
            "min-h-screen bg-background text-foreground selection:bg-primary/10 selection:text-primary",
            authenticated && "flex bg-slate-50 dark:bg-slate-950"
        )}>
            {authenticated && <DashboardSidebar />}

            <div className={cn("flex-1 flex flex-col min-w-0", authenticated ? "max-h-screen overflow-y-auto p-8" : "")}>
                {/* Header - Only for guests */}
                {!authenticated && (
                    <nav className="border-b bg-background/80 backdrop-blur-md sticky top-0 z-50">
                        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex justify-between items-center">
                            <Link href="/" className="flex items-center gap-2.5 group">
                                <div className="bg-primary p-2 rounded-xl shadow-lg shadow-primary/20 group-hover:scale-105 transition-transform text-white">
                                    <Truck className="h-5 w-5" />
                                </div>
                                <span className="text-xl font-bold tracking-tight">
                                    Courier<span className="text-primary">Hub</span>
                                </span>
                            </Link>
                            <div className="flex items-center gap-4">
                                <Link href="/login" className="text-sm font-medium hover:text-primary transition-colors">Sign In</Link>
                                <ThemeToggle />
                            </div>
                        </div>
                    </nav>
                )}

                <main className={cn("flex-1", authenticated ? "" : "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12")}>
                    <div className="mb-12">
                        <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors mb-6">
                            <ArrowLeft className="h-4 w-4" /> Back to Home
                        </Link>
                        <h1 className="text-4xl font-extrabold tracking-tight text-foreground">Track Your Shipment</h1>
                        <p className="text-muted-foreground mt-2 text-lg">Real-time transparency for every parcel in our network.</p>
                    </div>

                    {/* Search bar */}
                    <div className="bg-card p-8 rounded-3xl shadow-xl shadow-primary/5 border border-border mb-12">
                        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4">
                            <div className="flex-1 relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                <input
                                    type="text"
                                    placeholder="Enter Tracking Number (e.g. TRK1234567890)"
                                    className="w-full pl-12 pr-4 py-4 rounded-2xl border border-border bg-muted/30 text-foreground placeholder-muted-foreground focus:ring-2 focus:ring-primary outline-none transition-all"
                                    value={trackingNumber}
                                    onChange={(e) => setTrackingNumber(e.target.value)}
                                />
                            </div>
                            <button
                                type="submit"
                                className="bg-primary hover:bg-primary/90 text-primary-foreground px-10 py-4 rounded-2xl font-bold transition-all shadow-lg shadow-primary/20 hover:-translate-y-0.5"
                            >
                                Track Now
                            </button>
                        </form>
                    </div>

                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-24 gap-4">
                            <Loader2 className="h-12 w-12 animate-spin text-primary" />
                            <p className="text-muted-foreground font-medium">Fetching shipment details...</p>
                        </div>
                    ) : parcel ? (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            {/* Map */}
                            <div className="lg:col-span-2 bg-card rounded-3xl shadow-xl border border-border h-[600px] overflow-hidden relative">
                                <LiveMap
                                    trackingNumber={parcel.trackingNumber}
                                    destinationPos={{ lat: parseFloat(parcel.receiverLat), lng: parseFloat(parcel.receiverLng) }}
                                    currentPos={currentPos}
                                />
                            </div>

                            <div className="space-y-6">
                                {/* Parcel Details */}
                                <div className="bg-card p-8 rounded-3xl shadow-xl border border-border">
                                    <h3 className="text-xl font-bold text-foreground flex items-center gap-3 mb-6">
                                        <div className="bg-primary/10 p-2 rounded-lg">
                                            <Package className="h-5 w-5 text-primary" />
                                        </div>
                                        Parcel Details
                                    </h3>
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center py-3 border-b border-border/50">
                                            <span className="text-muted-foreground font-medium">Status</span>
                                            <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-bold uppercase tracking-wider">
                                                {parcel.status.replace(/_/g, ' ')}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center py-3 border-b border-border/50">
                                            <span className="text-muted-foreground font-medium">Receiver</span>
                                            <span className="font-bold text-foreground">{parcel.receiverName}</span>
                                        </div>
                                        <div className="flex justify-between items-center py-3">
                                            <span className="text-muted-foreground font-medium">Weight</span>
                                            <span className="font-bold text-foreground">{parcel.weight} kg</span>
                                        </div>

                                        {parcel.assignedTo && (
                                            <div className="mt-6 pt-6 border-t border-border flex items-center gap-4">
                                                <div className="bg-green-100 dark:bg-green-900/30 p-3 rounded-2xl">
                                                    <Truck className="h-5 w-5 text-green-600 dark:text-green-400" />
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest leading-none mb-1">In Transit With</p>
                                                    <p className="text-base font-bold text-foreground leading-none">{parcel.assignedTo.name}</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Journey Log */}
                                <div className="bg-card p-8 rounded-3xl shadow-xl border border-border overflow-hidden">
                                    <h3 className="text-xl font-bold text-foreground flex items-center gap-3 mb-8">
                                        <div className="bg-primary/10 p-2 rounded-lg">
                                            <MapPin className="h-5 w-5 text-primary" />
                                        </div>
                                        Journey Timeline
                                    </h3>
                                    <div className="space-y-8 relative ml-4 border-l-2 border-primary/20 pl-8 pb-4">
                                        {logs?.map((log: any, index: number) => (
                                            <div key={log.id} className="relative">
                                                <div className={cn(
                                                    "absolute -left-[45px] top-0 p-2 rounded-full ring-4 ring-background",
                                                    index === 0
                                                        ? "bg-primary shadow-lg shadow-primary/20"
                                                        : "bg-muted border border-border"
                                                )}>
                                                    <div className={cn("w-2 h-2 rounded-full", index === 0 ? "bg-white" : "bg-muted-foreground/30")}></div>
                                                </div>
                                                <p className={cn("text-sm font-bold leading-tight mb-1", index === 0 ? "text-foreground" : "text-muted-foreground")}>
                                                    {log.description}
                                                </p>
                                                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">
                                                    {new Date(log.timestamp).toLocaleString(undefined, {
                                                        month: 'short',
                                                        day: 'numeric',
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    })}
                                                </p>
                                            </div>
                                        ))}
                                        {!logs?.length && (
                                            <div className="relative">
                                                <div className="absolute -left-[45px] top-0 bg-primary p-2 rounded-full ring-4 ring-background">
                                                    <div className="w-2 h-2 bg-white rounded-full"></div>
                                                </div>
                                                <p className="text-sm font-bold text-foreground leading-tight mb-1">Order Placed</p>
                                                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">
                                                    {new Date(parcel.createdAt).toLocaleString(undefined, {
                                                        month: 'short',
                                                        day: 'numeric',
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    })}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : searchQuery ? (
                        <div className="text-center py-24 bg-card rounded-3xl border border-dashed border-border shadow-inner">
                            <div className="bg-destructive/5 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                                <Search className="h-8 w-8 text-destructive/50" />
                            </div>
                            <h3 className="text-xl font-bold mb-2">Shipment Not Found</h3>
                            <p className="text-muted-foreground max-w-sm mx-auto">We couldn't find any parcel with tracking number <span className="text-foreground font-bold">"{searchQuery}"</span>. Please check the number and try again.</p>
                        </div>
                    ) : (
                        <div className="text-center py-32 bg-card rounded-[3rem] border border-border shadow-2xl flex flex-col items-center">
                            <div className="relative mb-8">
                                <MapIcon className="h-24 w-24 text-primary/10" />
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <Package className="h-10 w-10 text-primary opacity-20" />
                                </div>
                            </div>
                            <h3 className="text-2xl font-extrabold mb-3">Ready to track?</h3>
                            <p className="text-muted-foreground text-lg max-w-md">Enter your tracking number above to see the real-time location and status of your parcel.</p>
                        </div>
                    )}
                </main>

                {!authenticated && (
                    <footer className="mt-24 border-t border-border py-12 bg-muted/30">
                        <div className="max-w-7xl mx-auto px-4 text-center">
                            <p className="text-sm text-muted-foreground">© 2026 CourierHub Technologies, Inc. All rights reserved.</p>
                        </div>
                    </footer>
                )}
            </div>
        </div>
    );
}

export default function PublicTrackPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-background">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
        }>
            <TrackContent />
        </Suspense>
    );
}
