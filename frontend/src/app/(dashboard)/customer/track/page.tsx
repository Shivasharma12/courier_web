'use client';

import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api-client';
import LiveMap from '@/components/live-map';
import { Search, Package, MapPin, Map as MapIcon, Loader2 } from 'lucide-react';
import { io } from 'socket.io-client';
import { cn } from '@/lib/utils';

export default function TrackParcelPage() {
    const [trackingNumber, setTrackingNumber] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPos, setCurrentPos] = useState<{ lat: number; lng: number } | undefined>();

    const queryClient = useQueryClient();

    const { data: parcel, isLoading, isError } = useQuery({
        queryKey: ['track', searchQuery],
        queryFn: async () => {
            if (!searchQuery) return null;
            // Handle prefix if user types #
            const clean = searchQuery.startsWith('#') ? searchQuery.slice(1) : searchQuery;
            const { data } = await api.get(`/parcels/track/${clean}`);
            return data;
        },
        enabled: !!searchQuery,
        refetchInterval: 10000, // Poll every 10s for status changes
    });

    const { data: logs } = useQuery({
        queryKey: ['tracking-logs', parcel?.id],
        queryFn: async () => {
            const { data } = await api.get(`/parcels/${parcel.id}/tracking-logs`);
            return data;
        },
        enabled: !!parcel?.id,
        refetchInterval: 5000, // Poll logs every 5s
    });

    useEffect(() => {
        if (!searchQuery || !parcel) return;

        const socket = io('http://localhost:3001');
        socket.emit('joinTracking', parcel.trackingNumber);

        socket.on('locationUpdated', (data) => {
            setCurrentPos({ lat: data.lat, lng: data.lng });
        });

        socket.on('logUpdated', () => {
            queryClient.invalidateQueries({ queryKey: ['tracking-logs', parcel.id] });
            queryClient.invalidateQueries({ queryKey: ['track', searchQuery] });
        });

        return () => {
            socket.disconnect();
        };
    }, [searchQuery, parcel, queryClient]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setSearchQuery(trackingNumber);
    };

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-slate-900">Live Tracking</h1>
                <p className="text-slate-500 mt-1">Get real-time updates on your parcel's journey.</p>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <form onSubmit={handleSearch} className="flex gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Enter Tracking Number (e.g. TRK1234567890)"
                            className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                            value={trackingNumber}
                            onChange={(e) => setTrackingNumber(e.target.value)}
                        />
                    </div>
                    <button
                        type="submit"
                        className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-semibold transition-all shadow-lg shadow-blue-200"
                    >
                        Track
                    </button>
                </form>
            </div>

            {isLoading ? (
                <div className="flex justify-center py-20"><Loader2 className="h-10 w-10 animate-spin text-blue-600" /></div>
            ) : parcel ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-100 h-[600px] overflow-hidden relative">
                        <LiveMap
                            trackingNumber={parcel.trackingNumber}
                            destinationPos={{ lat: parseFloat(parcel.receiverLat), lng: parseFloat(parcel.receiverLng) }}
                            currentPos={currentPos}
                        />
                    </div>
                    <div className="space-y-6">
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2 mb-4">
                                <Package className="h-5 w-5 text-blue-600" /> Parcel Details
                            </h3>
                            <div className="space-y-3">
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-500">Status</span>
                                    <span className="font-semibold text-blue-600 uppercase">{parcel.status.replace('_', ' ')}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-500">Receiver</span>
                                    <span className="font-medium text-slate-900">{parcel.receiverName}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-500">Weight</span>
                                    <span className="font-medium text-slate-900">{parcel.weight} kg</span>
                                </div>
                                {parcel.assignedTo && (
                                    <div className="pt-4 border-t border-slate-100 flex items-center gap-3">
                                        <div className="bg-green-100 p-2 rounded-full">
                                            <Package className="h-4 w-4 text-green-600" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Carried By</p>
                                            <p className="text-sm font-bold text-slate-900">{parcel.assignedTo.name}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 overflow-y-auto max-h-[400px]">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2 mb-4">
                                <MapPin className="h-5 w-5 text-blue-600" /> Journey
                            </h3>
                            <div className="space-y-6 relative ml-3 border-l-2 border-slate-100 pl-6 pb-2">
                                {logs?.map((log: any, index: number) => (
                                    <div key={log.id} className="relative">
                                        <div className={cn(
                                            "absolute -left-[31px] top-0 p-1.5 rounded-full ring-4",
                                            index === 0 ? "bg-blue-600 ring-blue-50" : "bg-white border-2 border-slate-200"
                                        )}>
                                            <div className={cn("w-1.5 h-1.5 rounded-full", index === 0 ? "bg-white" : "bg-slate-300")}></div>
                                        </div>
                                        <p className={cn("text-sm font-bold", index === 0 ? "text-slate-900" : "text-slate-500")}>
                                            {log.description}
                                        </p>
                                        <p className="text-[10px] text-slate-400 font-medium">
                                            {new Date(log.timestamp).toLocaleString()}
                                        </p>
                                    </div>
                                ))}
                                {!logs?.length && (
                                    <div className="relative">
                                        <div className="absolute -left-[31px] top-0 bg-blue-600 p-1.5 rounded-full ring-4 ring-blue-50">
                                            <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                                        </div>
                                        <p className="text-sm font-bold text-slate-900">Order Placed</p>
                                        <p className="text-xs text-slate-500">{new Date(parcel.createdAt).toLocaleString()}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            ) : searchQuery ? (
                <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-300">
                    <p className="text-slate-500">No parcel found with number "{searchQuery}"</p>
                </div>
            ) : (
                <div className="text-center py-20 bg-white rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center">
                    <MapIcon className="h-16 w-16 text-slate-200 mb-4" />
                    <p className="text-slate-500 font-medium">Search for a tracking number to see location</p>
                </div>
            )}
        </div>
    );
}
