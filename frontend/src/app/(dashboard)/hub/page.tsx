'use client';

import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api-client';
import { Package, Truck, Inbox, Send, AlertTriangle, TrendingUp, Box, Users, DollarSign, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function HubDashboard() {
    const { data: hubStats, isLoading } = useQuery({
        queryKey: ['hub-stats'],
        queryFn: async () => {
            const { data } = await api.get('/hubs/my-hub-stats');
            return data;
        }
    });

    const capacityPercentage = hubStats ? (hubStats.inventory / hubStats.capacity) * 100 : 0;

    if (isLoading) return <div className="p-8"><Activity className="h-8 w-8 animate-spin text-blue-600" /></div>;

    return (
        <div className="space-y-8 pb-20">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Hub Management</h1>
                    <p className="text-slate-500 mt-1">Real-time inventory and capacity tracking for your location.</p>
                </div>
                <div className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-lg shadow-blue-200">
                    Live Status: Healthy
                </div>
            </div>

            {/* Main Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col gap-4 group hover:border-blue-200 transition-all">
                    <div className="flex items-center gap-4">
                        <div className="bg-blue-50 p-3 rounded-xl text-blue-600 group-hover:scale-110 transition-transform">
                            <DollarSign className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-slate-500">Total Earnings</p>
                            <p className="text-2xl font-bold text-slate-900">${hubStats?.earnings?.toLocaleString()}</p>
                        </div>
                    </div>
                    <div className="text-[10px] font-bold text-green-600 flex items-center gap-1 uppercase tracking-wider">
                        <TrendingUp className="h-3 w-3" /> +12% from last month
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col gap-4 group hover:border-amber-200 transition-all">
                    <div className="flex items-center gap-4">
                        <div className="bg-amber-50 p-3 rounded-xl text-amber-600 group-hover:scale-110 transition-transform">
                            <Package className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-slate-500">Current Load</p>
                            <p className="text-2xl font-bold text-slate-900">{hubStats?.inventory} Parcels</p>
                        </div>
                    </div>
                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mt-1">
                        <div
                            className={cn("h-full transition-all duration-1000", capacityPercentage > 80 ? "bg-red-500" : "bg-blue-600")}
                            style={{ width: `${capacityPercentage}%` }}
                        />
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col gap-4">
                    <div className="flex items-center gap-4">
                        <div className="bg-slate-50 p-3 rounded-xl text-slate-600">
                            <Box className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-slate-500">Hub Capacity</p>
                            <p className="text-2xl font-bold text-slate-900">{hubStats?.capacity} Units</p>
                        </div>
                    </div>
                    <p className="text-[10px] text-slate-400 font-medium uppercase tracking-widest">{capacityPercentage.toFixed(1)}% Storage Occupied</p>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col gap-4 group hover:border-purple-200 transition-all">
                    <div className="flex items-center gap-4">
                        <div className="bg-purple-50 p-3 rounded-xl text-purple-600 group-hover:scale-110 transition-transform">
                            <Activity className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-slate-500">Activity Score</p>
                            <p className="text-2xl font-bold text-slate-900">8.4/10</p>
                        </div>
                    </div>
                    <p className="text-[10px] text-slate-400 font-medium uppercase tracking-widest">Optimized Dispatch Level</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Incoming vs Outgoing */}
                <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                    <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                        <h3 className="font-bold text-slate-900 flex items-center gap-2">
                            <Activity className="h-5 w-5 text-blue-600" /> Recent Traffic
                        </h3>
                        <div className="flex gap-4">
                            <div className="flex items-center gap-2">
                                <span className="w-3 h-3 bg-amber-400 rounded-full"></span>
                                <span className="text-xs font-bold text-slate-500">Incoming ({hubStats?.incoming})</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="w-3 h-3 bg-blue-500 rounded-full"></span>
                                <span className="text-xs font-bold text-slate-500">Outgoing ({hubStats?.outgoing})</span>
                            </div>
                        </div>
                    </div>
                    <div className="p-12 text-center">
                        <div className="max-w-xs mx-auto space-y-4">
                            <div className="bg-slate-50 rounded-full p-8 inline-block">
                                <Users className="h-10 w-10 text-slate-300" />
                            </div>
                            <p className="text-slate-500 italic text-sm">Traffic monitoring system is standing by. All recent transfers have been successfully sorted.</p>
                        </div>
                    </div>
                </div>

                {/* Alerts & Critical Info */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <h3 className="font-bold text-slate-900 flex items-center gap-2 mb-6">
                        <AlertTriangle className="h-5 w-5 text-amber-500" /> Hub Alerts
                    </h3>
                    <div className="space-y-4">
                        <div className="bg-amber-50 p-4 rounded-xl border border-amber-100 relative overflow-hidden group">
                            <div className="absolute top-0 left-0 w-1 h-full bg-amber-500"></div>
                            <p className="text-xs font-bold text-amber-800 uppercase tracking-wider mb-1">Delayed Shipment</p>
                            <p className="text-sm text-amber-700">3 Parcels haven't moved for 12h. Priority sorting required.</p>
                        </div>
                        <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
                            <p className="text-xs font-bold text-blue-800 uppercase tracking-wider mb-1">Capacity Notice</p>
                            <p className="text-sm text-blue-700">Your hub is at {capacityPercentage.toFixed(0)}% capacity. Consider increasing dispatch frequency.</p>
                        </div>
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-center cursor-pointer hover:bg-slate-100 transition-colors">
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">View All Notifications</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
