'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api-client';
import { Package, Truck, CheckCircle, Clock, Check, Loader2, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import Link from 'next/link';

export default function CustomerHistory() {
    const queryClient = useQueryClient();
    const { data: parcels, isLoading } = useQuery({
        queryKey: ['my-parcels-history'],
        queryFn: async () => {
            const { data } = await api.get('/parcels/my-parcels');
            return data;
        },
    });

    const confirmMutation = useMutation({
        mutationFn: async (parcelId: string) => {
            await api.post(`/parcels/${parcelId}/confirm-match`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['my-parcels-history'] });
            toast.success('Booking confirmed! Your traveler is ready.');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to confirm match');
        }
    });

    if (isLoading) return <div className="p-8 text-center text-muted-foreground font-medium">Loading your shipments...</div>;

    return (
        <div className="space-y-8 pb-20">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold text-foreground tracking-tight">Shipment History</h1>
                    <p className="text-muted-foreground mt-1 font-medium">Manage and track all your parcel bookings.</p>
                </div>
            </div>

            <div className="bg-background rounded-3xl shadow-sm border border-border overflow-hidden shadow-xl shadow-slate-200/5 dark:shadow-none">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-muted/50 border-b border-border">
                                <th className="px-8 py-5 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Tracking Info</th>
                                <th className="px-8 py-5 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Destination</th>
                                <th className="px-8 py-5 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Current Status</th>
                                <th className="px-8 py-5 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Booking Date</th>
                                <th className="px-8 py-5 text-[10px] font-black text-muted-foreground uppercase tracking-widest text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {parcels?.map((parcel: any) => (
                                <tr key={parcel.id} className="hover:bg-muted/30 transition-colors group">
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-3">
                                            <div className="bg-blue-50 dark:bg-blue-900/20 p-2 rounded-xl text-blue-600 dark:text-blue-400">
                                                <Package className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <p className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400">#{parcel.trackingNumber}</p>
                                                <p className="text-sm font-bold text-foreground mt-0.5">{parcel.receiverName}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <p className="text-sm text-muted-foreground font-medium line-clamp-1 max-w-[240px] italic">
                                            {parcel.receiverAddress}
                                        </p>
                                    </td>
                                    <td className="px-8 py-6">
                                        <span className={cn(
                                            "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-tighter",
                                            parcel.status === 'waiting_for_drop' ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-900/40 animate-pulse" :
                                                parcel.status === 'delivered' ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400" :
                                                    parcel.status === 'in_transit' ? "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400" :
                                                        parcel.status === 'at_hub' ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400" :
                                                            parcel.status === 'out_for_delivery' ? "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400" :
                                                                parcel.status === 'matched' ? "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 border border-purple-200 dark:border-purple-800 animate-pulse" :
                                                                    parcel.status === 'booked' ? "bg-blue-600 text-white shadow-md shadow-blue-500/10" :
                                                                        parcel.status === 'expired' ? "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 line-through" :
                                                                            "bg-muted text-muted-foreground"
                                        )}>
                                            {parcel.status === 'matched' && <Clock className="h-3 w-3" />}
                                            {parcel.status === 'delivered' && <CheckCircle className="h-3 w-3" />}
                                            {parcel.status.replace(/_/g, ' ')}
                                        </span>
                                    </td>
                                    <td className="px-8 py-6 text-sm text-muted-foreground font-medium font-mono">
                                        {new Date(parcel.createdAt).toLocaleDateString()}
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                        {parcel.status === 'matched' && (
                                            <button
                                                onClick={() => confirmMutation.mutate(parcel.id)}
                                                disabled={confirmMutation.isPending}
                                                className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-6 rounded-xl text-xs flex items-center gap-2 ml-auto shadow-lg shadow-purple-500/20 transition-all transform hover:scale-105"
                                            >
                                                {confirmMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                                                CONFIRM TRAVELER
                                            </button>
                                        )}
                                        {parcel.status === 'pending_match' && (
                                            <span className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-widest">Searching...</span>
                                        )}
                                        {/* Track button — always visible */}
                                        <Link
                                            href={`/track?number=${parcel.trackingNumber}`}
                                            className="flex items-center gap-1.5 text-[10px] font-black text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 uppercase tracking-wider ml-auto"
                                        >
                                            <ExternalLink className="h-3 w-3" /> Track
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                            {!parcels?.length && (
                                <tr>
                                    <td colSpan={5} className="px-8 py-20 text-center">
                                        <div className="flex flex-col items-center gap-4">
                                            <div className="bg-muted p-6 rounded-full">
                                                <Package className="h-12 w-12 text-muted-foreground/20" />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-foreground">No shipments found</h3>
                                                <p className="text-muted-foreground text-sm mt-1">Book your first parcel to get started!</p>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
