'use client';

import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api-client';
import { Package, Truck, CheckCircle, Clock, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export default function CustomerDashboard() {
    const { data: parcels, isLoading } = useQuery({
        queryKey: ['my-parcels'],
        queryFn: async () => {
            const { data } = await api.get('/parcels/my-parcels');
            return data;
        },
    });

    const stats = [
        { name: 'Total Parcels', value: parcels?.length || 0, icon: Package, color: 'bg-blue-50 text-blue-600' },
        { name: 'In Transit', value: parcels?.filter((p: any) => p.status === 'in_transit').length || 0, icon: Truck, color: 'bg-amber-50 text-amber-600' },
        { name: 'Delivered', value: parcels?.filter((p: any) => p.status === 'delivered').length || 0, icon: CheckCircle, color: 'bg-green-50 text-green-600' },
        { name: 'Pending', value: parcels?.filter((p: any) => p.status === 'pending').length || 0, icon: Clock, color: 'bg-slate-50 text-slate-600' },
    ];

    if (isLoading) return <div>Loading...</div>;

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-slate-900">Customer Dashboard</h1>
                <p className="text-slate-500 mt-1">Track your deliveries and manage your parcels.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat) => {
                    const Icon = stat.icon;
                    return (
                        <div key={stat.name} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
                            <div className={`${stat.color} p-3 rounded-xl`}>
                                <Icon className="h-6 w-6" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-slate-500">{stat.name}</p>
                                <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                    <h2 className="text-xl font-bold text-slate-900">Recent Parcels</h2>
                    <Link href="/customer/history" className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1">
                        View all <ArrowRight className="h-4 w-4" />
                    </Link>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50">
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Tracking #</th>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Receiver</th>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Destination</th>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Date</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {parcels?.slice(0, 5).map((parcel: any) => (
                                <tr key={parcel.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-4 font-mono text-sm text-blue-600 font-medium">#{parcel.trackingNumber}</td>
                                    <td className="px-6 py-4 text-sm text-slate-900 font-medium">{parcel.receiverName}</td>
                                    <td className="px-6 py-4 text-sm text-slate-600 truncate max-w-[200px]">{parcel.receiverAddress}</td>
                                    <td className="px-6 py-4">
                                        <span className={cn(
                                            "px-3 py-1 rounded-full text-xs font-semibold capitalize",
                                            parcel.status === 'delivered' ? "bg-green-100 text-green-700" :
                                                parcel.status === 'in_transit' ? "bg-amber-100 text-amber-700" :
                                                    "bg-blue-100 text-blue-700"
                                        )}>
                                            {parcel.status.replace('_', ' ')}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-500">
                                        {new Date(parcel.createdAt).toLocaleDateString()}
                                    </td>
                                </tr>
                            ))}
                            {!parcels?.length && (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                                        No parcels found. <Link href="/customer/create" className="text-blue-600 font-medium underline">Create your first order!</Link>
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
