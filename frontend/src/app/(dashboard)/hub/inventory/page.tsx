'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api-client';
import { Package, Truck, ArrowRight, Loader2, MapPin, Search } from 'lucide-react';
import { useAuthStore } from '@/store/auth-store';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export default function HubInventoryPage() {
    const [searchTerm, setSearchTerm] = useState('');
    const user = useAuthStore((state) => state.user);
    const hubId = user?.hubId || '0000-0000-0000';

    const queryClient = useQueryClient();

    const fetchInventory = async () => {
        const { data } = await api.get(`/parcels/hub-inventory/${hubId}`);
        return data;
    };

    const { data: parcels, isLoading, isError } = useQuery({
        queryKey: ['hub-inventory', hubId],
        queryFn: fetchInventory,
        enabled: !!user?.hubId,
    });

    const dropoffMutation = useMutation({
        mutationFn: (id: string) => api.post(`/parcels/${id}/confirmed-dropoff`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['hub-inventory'] });
            toast.success('Parcel drop-off confirmed');
        }
    });

    const pickupMutation = useMutation({
        mutationFn: (id: string) => api.post(`/parcels/${id}/confirmed-pickup`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['hub-inventory'] });
            toast.success('Parcel dispatched');
        }
    });

    const deliveryMutation = useMutation({
        mutationFn: (id: string) => api.put(`/parcels/${id}`, { status: 'delivered' }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['hub-inventory'] });
            toast.success('Parcel delivered');
        }
    });

    const handleDropoff = (id: string) => dropoffMutation.mutate(id);
    const handlePickup = (id: string) => pickupMutation.mutate(id);
    const handleFinalDelivery = (id: string) => deliveryMutation.mutate(id);

    const filteredParcels = parcels?.filter((p: any) =>
        p.trackingNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.receiverName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (isLoading) return <div className="flex justify-center py-20"><Loader2 className="h-10 w-10 animate-spin text-blue-600" /></div>;
    if (isError) return <div className="flex justify-center py-20 text-red-500">Failed to load inventory. Please try refreshing.</div>;
    if (!user?.hubId) return <div className="flex justify-center py-20 text-slate-500">No hub assigned. Please contact administrator.</div>;

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Hub Inventory</h1>
                    <p className="text-slate-500 mt-1">Real-time status of all parcels currently at this facility.</p>
                </div>
                <div className="relative w-72">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search tracking # or name"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-600 transition-all text-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-100">
                                <th className="px-8 py-5 text-xs font-bold text-slate-500 uppercase tracking-widest">Parcel details</th>
                                <th className="px-8 py-5 text-xs font-bold text-slate-500 uppercase tracking-widest">Storage Location</th>
                                <th className="px-8 py-5 text-xs font-bold text-slate-500 uppercase tracking-widest">Destination</th>
                                <th className="px-8 py-5 text-xs font-bold text-slate-500 uppercase tracking-widest">Weight</th>
                                <th className="px-8 py-5 text-xs font-bold text-slate-500 uppercase tracking-widest">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredParcels?.map((parcel: any) => (
                                <tr key={parcel.id} className="hover:bg-slate-50/50 transition-colors group">
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-4">
                                            <div className="bg-blue-100 p-3 rounded-2xl group-hover:bg-blue-600 group-hover:text-white transition-all text-blue-600">
                                                <Package className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-900">#{parcel.trackingNumber}</p>
                                                <p className="text-xs text-slate-500">{parcel.receiverName}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6 text-sm">
                                        <span className="bg-slate-100 text-slate-700 px-3 py-1.5 rounded-lg font-bold">Shelf A-2</span>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-2 text-sm text-slate-600">
                                            <MapPin className="h-3.5 w-3.5" />
                                            <span className="truncate max-w-[150px]">{parcel.receiverAddress}</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <p className="text-sm font-bold text-slate-900">{parcel.weight} kg</p>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex gap-2">
                                            {parcel.status === 'matched' && (
                                                <button
                                                    onClick={() => handleDropoff(parcel.id)}
                                                    className="bg-amber-600 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-amber-700 transition-all flex items-center gap-2"
                                                >
                                                    Confirm Drop-off
                                                </button>
                                            )}
                                            {parcel.status === 'at_hub' && (
                                                <button
                                                    onClick={() => handlePickup(parcel.id)}
                                                    className="bg-blue-600 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-blue-700 transition-all flex items-center gap-2"
                                                >
                                                    Dispatch <ArrowRight className="h-3.5 w-3.5" />
                                                </button>
                                            )}
                                            {parcel.status === 'in_transit' && (
                                                <button
                                                    onClick={() => handleFinalDelivery(parcel.id)}
                                                    className="bg-green-600 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-green-700 transition-all flex items-center gap-2"
                                                >
                                                    Confirm Delivery
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {!filteredParcels?.length && (
                                <tr>
                                    <td colSpan={5} className="px-8 py-20 text-center">
                                        <div className="bg-slate-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <Truck className="h-8 w-8 text-slate-300" />
                                        </div>
                                        <p className="text-slate-500 font-medium tracking-tight">Inventory is empty.</p>
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
