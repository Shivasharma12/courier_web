'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api-client';
import { Package, MapPin, User, Loader2, Edit } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminParcelsPage() {
    const [parcels, setParcels] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchParcels();
    }, []);

    const fetchParcels = async () => {
        try {
            const { data } = await api.get('/parcels');
            setParcels(data);
        } catch (err) {
            console.error(err);
            toast.error('Failed to load parcels');
        } finally {
            setLoading(false);
        }
    };

    const handleStatusChange = async (id: string, status: string) => {
        try {
            await api.put(`/parcels/${id}`, { status });
            toast.success(`Parcel status updated to ${status}`);
            fetchParcels();
        } catch (err: any) {
            console.error(err);
            toast.error(err.response?.data?.message || 'Failed to update');
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-slate-900">Parcels Management</h1>
                <p className="text-slate-500 mt-1">Oversee all parcels and assignments</p>
            </div>

            {/* Stats */}
            <div className="grid md:grid-cols-4 gap-6">
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                    <p className="text-sm font-medium text-slate-500">Total</p>
                    <p className="text-3xl font-bold text-slate-900 mt-1">{parcels.length}</p>
                </div>
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                    <p className="text-sm font-medium text-slate-500">Pending</p>
                    <p className="text-3xl font-bold text-amber-600 mt-1">
                        {parcels.filter(p => p.status === 'pending').length}
                    </p>
                </div>
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                    <p className="text-sm font-medium text-slate-500">In Transit</p>
                    <p className="text-3xl font-bold text-blue-600 mt-1">
                        {parcels.filter(p => p.status === 'in_transit').length}
                    </p>
                </div>
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                    <p className="text-sm font-medium text-slate-500">Delivered</p>
                    <p className="text-3xl font-bold text-green-600 mt-1">
                        {parcels.filter(p => p.status === 'delivered').length}
                    </p>
                </div>
            </div>

            {/* Parcels List */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                <h2 className="text-xl font-bold text-slate-900 mb-4">All Parcels</h2>

                <div className="space-y-4">
                    {parcels.map((parcel) => (
                        <div
                            key={parcel.id}
                            className="border border-slate-200 rounded-xl p-4 hover:border-blue-300 transition-all"
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-3">
                                        <span className="text-sm font-mono text-slate-500">#{parcel.trackingNumber}</span>
                                        {parcel.assignedTo && (
                                            <span className="bg-blue-100 text-blue-700 text-xs font-bold px-3 py-1 rounded-full">
                                                Assigned to {parcel.assignedTo.name}
                                            </span>
                                        )}
                                    </div>

                                    <div className="grid md:grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-xs font-bold text-slate-500 uppercase mb-1">From</p>
                                            <p className="text-sm text-slate-900">{parcel.senderAddress}</p>
                                            <p className="text-xs text-slate-500 mt-1">
                                                <User className="inline h-3 w-3 mr-1" />
                                                {parcel.senderName}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-slate-500 uppercase mb-1">To</p>
                                            <p className="text-sm text-slate-900">{parcel.receiverAddress}</p>
                                            <p className="text-xs text-slate-500 mt-1">
                                                <User className="inline h-3 w-3 mr-1" />
                                                {parcel.receiverName}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <select
                                        value={parcel.status}
                                        onChange={(e) => handleStatusChange(parcel.id, e.target.value)}
                                        className="px-3 py-1 rounded-lg border border-slate-200 text-sm font-medium"
                                    >
                                        <option value="pending">Pending</option>
                                        <option value="at_hub">At Hub</option>
                                        <option value="in_transit">In Transit</option>
                                        <option value="delivered">Delivered</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
