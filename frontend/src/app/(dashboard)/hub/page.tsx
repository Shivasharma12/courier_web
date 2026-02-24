'use client';

import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api-client';
import { Package, Truck, Inbox, Send, AlertTriangle, TrendingUp, Box, Users, DollarSign, Activity, MapPin, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/auth-store';

export default function HubDashboard() {
    const user = useAuthStore((state) => state.user);
    const activeHubId = user?.hubId || null;

    const { data: hubStats, isLoading, error } = useQuery({
        queryKey: ['hub-stats', activeHubId],
        queryFn: async () => {
            const params = activeHubId ? `?hubId=${activeHubId}` : '';
            const { data } = await api.get(`/hubs/my-hub-stats${params}`);
            return data;
        },
        enabled: !!activeHubId,
        retry: false,
    });

    const capacityPercentage = hubStats ? (hubStats.inventory / hubStats.capacity) * 100 : 0;

    if (isLoading) return (
        <div className="p-8 flex items-center gap-3">
            <Activity className="h-8 w-8 animate-spin text-blue-600" />
            <span className="text-muted-foreground font-medium">Loading statistics...</span>
        </div>
    );

    if (error && !activeHubId) {
        return (
            <div className="p-8 flex flex-col items-center justify-center space-y-6 pt-20">
                <div className="bg-amber-50 dark:bg-amber-900/10 p-10 rounded-[40px] border border-amber-100 dark:border-amber-900/30 flex flex-col items-center gap-6 shadow-2xl shadow-amber-50/50 dark:shadow-none max-w-md text-center">
                    <div className="p-4 bg-amber-100 dark:bg-amber-900/30 rounded-full">
                        <MapPin className="h-10 w-10 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-amber-900 dark:text-amber-200 uppercase tracking-tight">Hub Not Found</h2>
                        <p className="text-amber-700 dark:text-amber-300 font-medium mt-2 leading-relaxed">
                            You are not assigned to any existing hub and no hubs were detected nearby.
                        </p>
                    </div>
                    <a
                        href="/hub/profile"
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 py-4 rounded-2xl shadow-lg shadow-blue-100/20 transition-all flex items-center gap-2 group"
                    >
                        Set Up Your Hub Now
                        <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                    </a>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-8 flex flex-col items-center justify-center space-y-4">
                <div className="bg-red-50 dark:bg-red-900/10 p-6 rounded-3xl border border-red-100 dark:border-red-900/30 text-red-600 dark:text-red-400 font-bold text-center">
                    {(error as any).response?.data?.message || 'Access Denied: Please ensure you are assigned to a hub.'}
                </div>
            </div>
        );
    }

    // Show pending approval screen
    if (hubStats?.status === 'pending') {
        return (
            <div className="p-8 flex flex-col items-center justify-center space-y-6 pt-20">
                <div className="bg-amber-50 dark:bg-amber-900/10 p-10 rounded-[40px] border border-amber-100 dark:border-amber-900/30 flex flex-col items-center gap-6 shadow-2xl shadow-amber-50/50 dark:shadow-none max-w-md text-center">
                    <div className="p-4 bg-amber-100 dark:bg-amber-900/30 rounded-full">
                        <Activity className="h-10 w-10 text-amber-600 dark:text-amber-400 animate-pulse" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-amber-900 dark:text-amber-200 uppercase tracking-tight">Awaiting Approval</h2>
                        <p className="text-amber-700 dark:text-amber-300 font-medium mt-2 leading-relaxed">
                            <strong>{hubStats.name}</strong> has been submitted and is currently under review by an administrator. You will be able to manage your hub once it is approved.
                        </p>
                    </div>
                    <a href="/hub/profile" className="text-sm font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1">
                        View & Update Hub Details <ArrowRight className="h-4 w-4" />
                    </a>
                </div>
            </div>
        );
    }

    // Show rejection screen
    if (hubStats?.status === 'rejected') {
        return (
            <div className="p-8 flex flex-col items-center justify-center space-y-6 pt-20">
                <div className="bg-red-50 dark:bg-red-900/10 p-10 rounded-[40px] border border-red-100 dark:border-red-900/30 flex flex-col items-center gap-6 shadow-2xl shadow-red-50/50 dark:shadow-none max-w-md text-center">
                    <div className="p-4 bg-red-100 dark:bg-red-900/30 rounded-full">
                        <MapPin className="h-10 w-10 text-red-600 dark:text-red-400" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-red-900 dark:text-red-200 uppercase tracking-tight">Hub Rejected</h2>
                        <p className="text-red-700 dark:text-red-300 font-medium mt-2 leading-relaxed">
                            Your hub application was rejected.{hubStats.rejectionReason ? ` Reason: "${hubStats.rejectionReason}"` : ''} Please update your details and re-submit.
                        </p>
                    </div>
                    <a
                        href="/hub/profile"
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 py-4 rounded-2xl shadow-lg shadow-blue-100/20 transition-all flex items-center gap-2 group"
                    >
                        Update & Resubmit <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                    </a>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8 pb-20">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold text-foreground tracking-tight">{hubStats?.name || 'Hub Management'}</h1>
                    <p className="text-muted-foreground mt-1">
                        {hubStats?.address ? `Active at: ${hubStats.address}` : 'Real-time inventory and capacity tracking for your location.'}
                    </p>
                </div>
                <div className="flex flex-col items-end gap-2">
                    <div className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-lg shadow-blue-100/20">
                        Live Status: Healthy
                    </div>
                </div>
            </div>

            {/* Main Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-background dark:bg-slate-900/50 p-6 rounded-2xl shadow-sm border border-border flex flex-col gap-4 group hover:border-blue-200 dark:hover:border-blue-800 transition-all">
                    <div className="flex items-center gap-4">
                        <div className="bg-blue-50 dark:bg-blue-900/30 p-3 rounded-xl text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
                            <DollarSign className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Total Earnings</p>
                            <p className="text-2xl font-bold text-foreground">${hubStats?.earnings?.toLocaleString()}</p>
                        </div>
                    </div>
                    <div className="text-[10px] font-bold text-green-600 dark:text-green-400 flex items-center gap-1 uppercase tracking-wider">
                        <TrendingUp className="h-3 w-3" /> +12% from last month
                    </div>
                </div>

                <div className="bg-background dark:bg-slate-900/50 p-6 rounded-2xl shadow-sm border border-border flex flex-col gap-4 group hover:border-amber-200 dark:hover:border-amber-800 transition-all">
                    <div className="flex items-center gap-4">
                        <div className="bg-amber-50 dark:bg-amber-900/30 p-3 rounded-xl text-amber-600 dark:text-amber-400 group-hover:scale-110 transition-transform">
                            <Package className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Current Load</p>
                            <p className="text-2xl font-bold text-foreground">{hubStats?.inventory} Parcels</p>
                        </div>
                    </div>
                    <div className="w-full bg-muted h-1.5 rounded-full overflow-hidden mt-1">
                        <div
                            className={cn("h-full transition-all duration-1000", capacityPercentage > 80 ? "bg-red-500" : "bg-blue-600 dark:bg-blue-500")}
                            style={{ width: `${capacityPercentage}%` }}
                        />
                    </div>
                </div>

                <div className="bg-background dark:bg-slate-900/50 p-6 rounded-2xl shadow-sm border border-border flex flex-col gap-4">
                    <div className="flex items-center gap-4">
                        <div className="bg-muted p-3 rounded-xl text-foreground/70">
                            <Box className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Hub Capacity</p>
                            <p className="text-2xl font-bold text-foreground">{hubStats?.capacity} Units</p>
                        </div>
                    </div>
                    <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest">{capacityPercentage.toFixed(1)}% Storage Occupied</p>
                </div>

                <div className="bg-background dark:bg-slate-900/50 p-6 rounded-2xl shadow-sm border border-border flex flex-col gap-4 group hover:border-purple-200 dark:hover:border-purple-800 transition-all">
                    <div className="flex items-center gap-4">
                        <div className="bg-purple-50 dark:bg-purple-900/30 p-3 rounded-xl text-purple-600 dark:text-purple-400 group-hover:scale-110 transition-transform">
                            <Activity className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Activity Score</p>
                            <p className="text-2xl font-bold text-foreground">8.4/10</p>
                        </div>
                    </div>
                    <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest">Optimized Dispatch Level</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Incoming vs Outgoing */}
                <div className="lg:col-span-2 bg-background dark:bg-slate-900/50 rounded-2xl shadow-sm border border-border overflow-hidden">
                    <div className="p-6 border-b border-border flex justify-between items-center">
                        <h3 className="font-bold text-foreground flex items-center gap-2">
                            <Activity className="h-5 w-5 text-blue-600" /> Recent Traffic
                        </h3>
                        <div className="flex gap-4">
                            <div className="flex items-center gap-2">
                                <span className="w-3 h-3 bg-amber-400 rounded-full"></span>
                                <span className="text-xs font-bold text-muted-foreground">Incoming ({hubStats?.incoming})</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="w-3 h-3 bg-blue-500 rounded-full"></span>
                                <span className="text-xs font-bold text-muted-foreground">Outgoing ({hubStats?.outgoing})</span>
                            </div>
                        </div>
                    </div>
                    <div className="p-12 text-center">
                        <div className="max-w-xs mx-auto space-y-4">
                            <div className="bg-muted p-8 inline-block rounded-full">
                                <Users className="h-10 w-10 text-muted-foreground/30" />
                            </div>
                            <p className="text-muted-foreground italic text-sm">Traffic monitoring system is standing by. All recent transfers have been successfully sorted.</p>
                        </div>
                    </div>
                </div>

                {/* Alerts & Critical Info */}
                <div className="bg-background dark:bg-slate-900/50 p-6 rounded-2xl shadow-sm border border-border">
                    <h3 className="font-bold text-foreground flex items-center gap-2 mb-6">
                        <AlertTriangle className="h-5 w-5 text-amber-500" /> Hub Alerts
                    </h3>
                    <div className="space-y-4">
                        <div className="bg-amber-50 dark:bg-amber-900/10 p-4 rounded-xl border border-amber-100 dark:border-amber-900/30 relative overflow-hidden group">
                            <div className="absolute top-0 left-0 w-1 h-full bg-amber-500"></div>
                            <p className="text-xs font-bold text-amber-800 dark:text-amber-400 uppercase tracking-wider mb-1">Delayed Shipment</p>
                            <p className="text-sm text-amber-700 dark:text-amber-300">3 Parcels haven't moved for 12h. Priority sorting required.</p>
                        </div>
                        <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-xl border border-blue-100 dark:border-blue-900/30 relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
                            <p className="text-xs font-bold text-blue-800 dark:text-blue-400 uppercase tracking-wider mb-1">Capacity Notice</p>
                            <p className="text-sm text-blue-700 dark:text-blue-300">Your hub is at {capacityPercentage.toFixed(0)}% capacity. Consider increasing dispatch frequency.</p>
                        </div>
                        <div className="bg-muted p-4 rounded-xl border border-border text-center cursor-pointer hover:bg-secondary transition-colors">
                            <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">View All Notifications</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
