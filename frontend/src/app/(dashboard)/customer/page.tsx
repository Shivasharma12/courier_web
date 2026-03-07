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
        { name: 'Total Parcels', value: parcels?.length || 0, icon: Package, color: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' },
        { name: 'In Transit', value: parcels?.filter((p: any) => p.status === 'in_transit').length || 0, icon: Truck, color: 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400' },
        { name: 'Delivered', value: parcels?.filter((p: any) => p.status === 'delivered').length || 0, icon: CheckCircle, color: 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400' },
        { name: 'Pending', value: parcels?.filter((p: any) => p.status === 'pending').length || 0, icon: Clock, color: 'bg-slate-50 dark:bg-slate-900/20 text-slate-600 dark:text-slate-400' },
    ];

    if (isLoading) return <div>Loading...</div>;

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-foreground">Customer Dashboard</h1>
                <p className="text-muted-foreground mt-1">Track your deliveries and manage your parcels.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat) => {
                    const Icon = stat.icon;
                    return (
                        <div key={stat.name} className="bg-background p-6 rounded-2xl shadow-sm border border-border flex items-center gap-4">
                            <div className={cn(stat.color, "p-3 rounded-xl")}>
                                <Icon className="h-6 w-6" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">{stat.name}</p>
                                <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="bg-background rounded-2xl shadow-sm border border-border overflow-hidden">
                <div className="p-6 border-b border-border flex items-center justify-between">
                    <h2 className="text-xl font-bold text-foreground">Recent Parcels</h2>
                    <Link href="/customer/history" className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1">
                        View all <ArrowRight className="h-4 w-4" />
                    </Link>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-muted/50">
                                <th className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Tracking #</th>
                                <th className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Receiver</th>
                                <th className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Destination</th>
                                <th className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Date</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {parcels?.slice(0, 5).map((parcel: any) => (
                                <tr key={parcel.id} className="hover:bg-muted/30 transition-colors">
                                    <td className="px-6 py-4 font-mono text-sm">
                                        <Link
                                            href={`/track?number=${parcel.trackingNumber}`}
                                            className="text-blue-600 dark:text-blue-400 font-medium hover:underline"
                                        >
                                            #{parcel.trackingNumber}
                                        </Link>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-foreground font-medium">{parcel.receiverName}</td>
                                    <td className="px-6 py-4 text-sm text-muted-foreground truncate max-w-[200px]">{parcel.receiverAddress}</td>
                                    <td className="px-6 py-4">
                                        <span className={cn(
                                            "px-3 py-1 rounded-full text-xs font-semibold capitalize",
                                            parcel.status === 'delivered' ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400" :
                                                parcel.status === 'in_transit' ? "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400" :
                                                    "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400"
                                        )}>
                                            {parcel.status.replace('_', ' ')}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-muted-foreground">
                                        {new Date(parcel.createdAt).toLocaleDateString()}
                                    </td>
                                </tr>
                            ))}
                            {!parcels?.length && (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
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
