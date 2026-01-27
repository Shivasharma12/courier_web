'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api-client';
import { Package, Truck, CheckCircle, Clock, Check, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

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

    if (isLoading) return <div className="p-8 text-center text-slate-500 font-medium">Loading your shipments...</div>;

    return (
        <div className="space-y-8 pb-20">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Shipment History</h1>
                    <p className="text-slate-500 mt-1 font-medium">Manage and track all your parcel bookings.</p>
                </div>
            </div>

            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden shadow-xl shadow-slate-200/50">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-100">
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Tracking Info</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Destination</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Current Status</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Booking Date</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {parcels?.map((parcel: any) => (
                                <tr key={parcel.id} className="hover:bg-slate-50/50 transition-colors group">
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-3">
                                            <div className="bg-blue-50 p-2 rounded-xl text-blue-600">
                                                <Package className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <p className="font-mono text-xs font-bold text-blue-600">#{parcel.trackingNumber}</p>
                                                <p className="text-sm font-bold text-slate-800 mt-0.5">{parcel.receiverName}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <p className="text-sm text-slate-600 font-medium line-clamp-1 max-w-[240px] italic">
                                            {parcel.receiverAddress}
                                        </p>
                                    </td>
                                    <td className="px-8 py-6">
                                        <span className={cn(
                                            "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-tighter",
                                            parcel.status === 'delivered' ? "bg-green-100 text-green-700" :
                                                parcel.status === 'in_transit' ? "bg-amber-100 text-amber-700" :
                                                    parcel.status === 'matched' ? "bg-purple-100 text-purple-700 border border-purple-200 animate-pulse" :
                                                        parcel.status === 'booked' ? "bg-blue-600 text-white shadow-md shadow-blue-100" :
                                                            "bg-slate-100 text-slate-600"
                                        )}>
                                            {parcel.status === 'matched' && <Clock className="h-3 w-3" />}
                                            {parcel.status === 'booked' && <CheckCircle className="h-3 w-3" />}
                                            {parcel.status.replace('_', ' ')}
                                        </span>
                                    </td>
                                    <td className="px-8 py-6 text-sm text-slate-500 font-medium font-mono">
                                        {new Date(parcel.createdAt).toLocaleDateString()}
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                        {parcel.status === 'matched' && (
                                            <button
                                                onClick={() => confirmMutation.mutate(parcel.id)}
                                                disabled={confirmMutation.isPending}
                                                className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-6 rounded-xl text-xs flex items-center gap-2 ml-auto shadow-lg shadow-purple-100 transition-all transform hover:scale-105"
                                            >
                                                {confirmMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                                                CONFIRM TRAVELER
                                            </button>
                                        )}
                                        {parcel.status === 'pending_match' && (
                                            <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Searching...</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {!parcels?.length && (
                                <tr>
                                    <td colSpan={5} className="px-8 py-20 text-center">
                                        <div className="flex flex-col items-center gap-4">
                                            <div className="bg-slate-50 p-6 rounded-full">
                                                <Package className="h-12 w-12 text-slate-200" />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-slate-900">No shipments found</h3>
                                                <p className="text-slate-500 text-sm mt-1">Book your first parcel to get started!</p>
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
