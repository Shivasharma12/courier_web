'use client';

import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api-client';
import {
    Users,
    Package,
    MapPin,
    TrendingUp,
    AlertCircle,
    Activity,
    ArrowUpRight,
    Globe,
    Shield,
    Database,
    Zap,
    Plus,
    LayoutDashboard
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

export default function AdminDashboard() {
    const { data: parcels, isLoading: loadingParcels } = useQuery({
        queryKey: ['all-parcels'],
        queryFn: async () => {
            const { data } = await api.get('/parcels');
            return data;
        }
    });

    const { data: hubs } = useQuery({
        queryKey: ['all-hubs'],
        queryFn: async () => {
            const { data } = await api.get('/hubs');
            return data;
        }
    });

    const stats = [
        { name: 'System Revenue', value: '$42,850.20', trend: '+18.2%', trendType: 'up', icon: TrendingUp, color: 'text-green-600 bg-green-50' },
        { name: 'Total Shipments', value: parcels?.length || 0, trend: '+5.2%', trendType: 'up', icon: Package, color: 'text-blue-600 bg-blue-50' },
        { name: 'Traveler Partners', value: '1,240', trend: '+12.4%', trendType: 'up', icon: Users, color: 'text-purple-600 bg-purple-50' },
        { name: 'Global Hubs', value: hubs?.length || 0, trend: '0%', trendType: 'neutral', icon: MapPin, color: 'text-amber-600 bg-amber-50' },
    ];

    return (
        <div className="space-y-8 pb-20">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">System Oversight</h1>
                    <p className="text-slate-500 mt-1 flex items-center gap-2">
                        <Globe className="h-4 w-4 text-blue-500" /> Global logistics performance and infrastructure management.
                    </p>
                </div>
                <div className="flex gap-3">
                    <Link href="/admin/users" className="bg-slate-900 text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-slate-800 transition-all shadow-lg shadow-slate-200">
                        <Users className="h-4 w-4" /> Manage Users
                    </Link>
                    <Link href="/admin/hubs" className="bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-blue-700 transition-all shadow-lg shadow-blue-200">
                        <Plus className="h-4 w-4" /> New Hub
                    </Link>
                </div>
            </div>

            {/* Top Level Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat) => {
                    const Icon = stat.icon;
                    return (
                        <div key={stat.name} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col gap-4 group hover:scale-[1.02] transition-all">
                            <div className="flex justify-between items-start">
                                <div className={cn("p-3 rounded-xl transition-transform group-hover:scale-110", stat.color)}>
                                    <Icon className="h-6 w-6" />
                                </div>
                                <div className={cn(
                                    "flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-lg uppercase tracking-wider",
                                    stat.trendType === 'up' ? "text-green-600 bg-green-50" : "text-slate-500 bg-slate-50"
                                )}>
                                    {stat.trendType === 'up' ? <ArrowUpRight className="h-3 w-3" /> : null}
                                    {stat.trend}
                                </div>
                            </div>
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{stat.name}</p>
                                <p className="text-2xl font-bold text-slate-900 mt-1">{stat.value}</p>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Logistics Flow Chart Mockup */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
                        <div className="flex justify-between items-center mb-8">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                <Activity className="h-5 w-5 text-blue-600" /> Operational Throughput
                            </h3>
                            <div className="flex bg-slate-100 p-1 rounded-lg gap-1">
                                <button className="px-3 py-1 bg-white text-xs font-bold rounded-md shadow-sm">Daily</button>
                                <button className="px-3 py-1 text-xs font-bold text-slate-400">Weekly</button>
                            </div>
                        </div>
                        <div className="h-64 flex items-end justify-between gap-3 px-4">
                            {[65, 80, 45, 95, 70, 85, 60, 75, 50, 90, 85, 70].map((h, i) => (
                                <div key={i} className="flex-1 group relative">
                                    <div
                                        className="bg-blue-600/10 group-hover:bg-blue-600 transition-all rounded-full w-full"
                                        style={{ height: `${h}%` }}
                                    >
                                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap font-bold">
                                            {h}% Utilized
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="flex justify-between mt-4 px-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            <span>00:00</span>
                            <span>06:00</span>
                            <span>12:00</span>
                            <span>18:00</span>
                            <span>23:59</span>
                        </div>
                    </div>

                    {/* Infrastructure Status */}
                    <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
                        <h3 className="font-bold text-slate-900 flex items-center gap-2 mb-6">
                            <Database className="h-5 w-5 text-purple-600" /> Infrastructure Health
                        </h3>
                        <div className="grid md:grid-cols-3 gap-6">
                            {[
                                { name: 'Main API', status: 'Operational', latency: '24ms', color: 'bg-green-500' },
                                { name: 'Matching Engine', status: 'High Load', latency: '142ms', color: 'bg-amber-500' },
                                { name: 'Payment Gateway', status: 'Operational', latency: '89ms', color: 'bg-green-500' },
                            ].map((svc) => (
                                <div key={svc.name} className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-2">
                                    <div className="flex items-center justify-between">
                                        <p className="text-xs font-bold text-slate-900">{svc.name}</p>
                                        <div className={cn("w-2 h-2 rounded-full animate-pulse", svc.color)}></div>
                                    </div>
                                    <div className="flex justify-between items-end">
                                        <p className="text-[10px] text-slate-500 uppercase tracking-widest">{svc.status}</p>
                                        <p className="text-xs font-mono font-bold text-slate-400">{svc.latency}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right Column: Alerts and Active Hubs */}
                <div className="space-y-6">
                    <div className="bg-slate-900 rounded-2xl p-6 text-white overflow-hidden relative">
                        <div className="relative z-10">
                            <div className="flex items-center gap-2 text-blue-400 mb-4">
                                <Zap className="h-4 w-4 fill-current" />
                                <span className="text-[10px] font-bold uppercase tracking-widest">Predictive Alert</span>
                            </div>
                            <h4 className="font-bold text-lg mb-2">High Demand Spike Expected</h4>
                            <p className="text-xs text-slate-400 leading-relaxed mb-6">
                                Seasonal trends suggest a 40% increase in cross-border parcels between Europe and Asia over the next 48 hours.
                            </p>
                            <button className="w-full bg-blue-600 py-3 rounded-xl text-xs font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20">
                                Allocate Backup Capacity
                            </button>
                        </div>
                        <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-blue-600/20 rounded-full blur-3xl"></div>
                    </div>

                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                        <h3 className="font-bold text-slate-900 flex items-center justify-between mb-6">
                            <span className="flex items-center gap-2">
                                <LayoutDashboard className="h-5 w-5 text-blue-600" /> Active Hubs
                            </span>
                            <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded-lg">View All</span>
                        </h3>
                        <div className="space-y-4">
                            {hubs?.slice(0, 5).map((hub: any) => (
                                <div key={hub.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors group cursor-pointer">
                                    <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-sm">
                                        {hub.name.charAt(0)}
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-bold text-slate-900">{hub.name}</p>
                                        <p className="text-[10px] text-slate-500 truncate">{hub.address}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] font-bold text-slate-900 tracking-tighter">{(hub.currentLoad / hub.capacity * 100).toFixed(0)}% Full</p>
                                        <div className="w-8 h-1 bg-slate-100 rounded-full mt-1 overflow-hidden">
                                            <div className="h-full bg-blue-600" style={{ width: `${hub.currentLoad / hub.capacity * 100}%` }}></div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
