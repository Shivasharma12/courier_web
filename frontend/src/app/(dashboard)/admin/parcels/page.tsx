'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api-client';
import { Package, MapPin, User, Loader2, Calendar, Phone, Truck } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';


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

    const formatDate = (dateString: string) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleString('en-US', {
            month: 'short', day: 'numeric', year: 'numeric',
            hour: 'numeric', minute: '2-digit', hour12: true
        });
    };

    const getStatusText = (status: string) => {
        switch (status) {
            case 'waiting_for_drop': return 'Waiting for Drop';
            case 'at_hub': return 'At Hub';
            case 'in_transit': return 'In Transit';
            case 'delivered': return 'Delivered';
            case 'expired': return 'Expired';
            default: return status.replace(/_/g, ' ');
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
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Parcels Management</h1>
                <p className="text-slate-500 dark:text-slate-400 mt-1">Oversee all parcels and assignments</p>
            </div>

            {/* Stats */}
            <div className="grid md:grid-cols-4 gap-6">
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-6">
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total</p>
                    <p className="text-3xl font-bold text-slate-900 dark:text-white mt-1">{parcels.length}</p>
                </div>
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-6">
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Pending</p>
                    <p className="text-3xl font-bold text-amber-600 mt-1">
                        {parcels.filter(p => p.status === 'pending').length}
                    </p>
                </div>
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-6">
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">In Transit</p>
                    <p className="text-3xl font-bold text-blue-600 mt-1">
                        {parcels.filter(p => p.status === 'in_transit').length}
                    </p>
                </div>
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-6">
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Delivered</p>
                    <p className="text-3xl font-bold text-green-600 mt-1">
                        {parcels.filter(p => p.status === 'delivered').length}
                    </p>
                </div>
            </div>

            {/* Parcels List */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-6">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">All Parcels</h2>

                <div className="space-y-4">
                    {parcels.map((parcel) => (
                        <div
                            key={parcel.id}
                            className="border border-slate-200 dark:border-slate-700 rounded-xl p-4 hover:border-blue-300 dark:hover:border-blue-600 transition-all"
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-3">
                                        <Link
                                            href={`/track?number=${parcel.trackingNumber}`}
                                            className="text-sm font-mono font-bold text-blue-600 dark:text-blue-400 hover:underline"
                                        >
                                            #{parcel.trackingNumber}
                                        </Link>
                                        <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                                            <Calendar className="h-3 w-3" />
                                            {formatDate(parcel.createdAt)}
                                        </span>
                                    </div>

                                    <div className="grid md:grid-cols-2 gap-4 mb-4">
                                        <div>
                                            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">From (Sender)</p>
                                            <p className="text-sm text-slate-900 dark:text-slate-200">{parcel.senderAddress}</p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                                <User className="inline h-3 w-3 mr-1" />
                                                {parcel.senderName} ({parcel.senderPhone})
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">To (Receiver)</p>
                                            <p className="text-sm text-slate-900 dark:text-slate-200">{parcel.receiverAddress}</p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                                <User className="inline h-3 w-3 mr-1" />
                                                {parcel.receiverName} ({parcel.receiverPhone})
                                            </p>
                                        </div>
                                    </div>

                                    <div className="grid md:grid-cols-2 gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                                        <div className="space-y-2">
                                            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Hub Details</p>
                                            <div className="flex flex-col gap-1">
                                                <p className="text-xs text-slate-700 dark:text-slate-300">
                                                    <span className="font-semibold text-slate-500 dark:text-slate-400">Current Hub: </span>
                                                    {parcel.currentHub?.name || 'Customer / In Transit'}
                                                </p>
                                                <p className="text-xs text-slate-700 dark:text-slate-300">
                                                    <span className="font-semibold text-slate-500 dark:text-slate-400">Destination Hub: </span>
                                                    {parcel.destinationHub?.name || 'N/A'}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Traveler Details</p>
                                            {parcel.assignedTo ? (
                                                <div className="bg-blue-50/50 dark:bg-blue-900/10 p-2 rounded-lg border border-blue-100/50 dark:border-blue-900/30">
                                                    <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1 flex items-center gap-1.5">
                                                        <Truck className="h-3.5 w-3.5" />
                                                        {parcel.assignedTo.name}
                                                    </p>
                                                    <p className="text-xs text-blue-700 dark:text-blue-300 flex items-center gap-2">
                                                        <Phone className="h-3 w-3" /> {parcel.assignedTo.phone || 'No phone'}
                                                        <span className="opacity-50">|</span>
                                                        <span>{parcel.assignedTo.email}</span>
                                                    </p>
                                                </div>
                                            ) : (
                                                <p className="text-xs text-slate-500 dark:text-slate-400 italic bg-slate-50 dark:bg-slate-800/50 p-2 rounded-lg border border-slate-100 dark:border-slate-800">
                                                    No traveler assigned yet.
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-col items-end gap-2 ml-4">
                                    <span className="bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-600 uppercase tracking-wider whitespace-nowrap">
                                        {getStatusText(parcel.status)}
                                    </span>
                                </div>
                            </div>

                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
