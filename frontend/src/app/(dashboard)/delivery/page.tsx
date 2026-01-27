'use client';

import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import api from '@/lib/api-client';
import {
    Truck,
    Package,
    DollarSign,
    Clock,
    MapPin,
    ChevronRight,
    Loader2,
    TrendingUp,
    CheckCircle2,
    Search
} from 'lucide-react';
import { useAuthStore } from '@/store/auth-store';
import Link from 'next/link';

export default function DeliveryDashboard() {
    const user = useAuthStore(state => state.user);
    const [isOnline, setIsOnline] = useState(true);

    const { data: availableOrders, isLoading: loadingAvailable } = useQuery({
        queryKey: ['available-orders'],
        queryFn: async () => {
            const { data } = await api.get('/deliveries/available');
            return data;
        },
        enabled: isOnline,
    });

    // Mock stats - in a real app these would come from an API
    const stats = [
        { name: "Today's Earnings", value: '$124.50', icon: DollarSign, color: 'text-green-600', bg: 'bg-green-100' },
        { name: 'Active Orders', value: '3', icon: Package, color: 'text-blue-600', bg: 'bg-blue-100' },
        { name: 'Daily Deliveries', value: '12', icon: Truck, color: 'text-purple-600', bg: 'bg-purple-100' },
        { name: 'Online Hours', value: '6.5h', icon: Clock, color: 'text-amber-600', bg: 'bg-amber-100' },
    ];

    if (loadingAvailable && isOnline) return <div className="flex justify-center py-20"><Loader2 className="h-10 w-10 animate-spin text-blue-600" /></div>;

    return (
        <div className="space-y-8 pb-20">
            {/* Header with Online/Offline Toggle */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Partner Dashboard</h1>
                    <p className="text-slate-500 mt-1">Welcome back, {user?.name}. Ready for your next delivery?</p>
                </div>
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => setIsOnline(!isOnline)}
                        className={`flex items-center gap-2 px-6 py-2.5 rounded-full font-bold transition-all shadow-sm ${isOnline
                                ? 'bg-green-500 text-white hover:bg-green-600'
                                : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                            }`}
                    >
                        <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-white animate-pulse' : 'bg-slate-400'}`}></div>
                        {isOnline ? 'GO OFFLINE' : 'GO ONLINE'}
                    </button>
                    <div className="bg-white px-4 py-2.5 rounded-full border border-slate-200 flex items-center gap-2 shadow-sm">
                        <TrendingUp className="h-4 w-4 text-green-500" />
                        <span className="text-sm font-bold text-slate-700">4.96 Rating</span>
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                {stats.map((stat, idx) => (
                    <div key={idx} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-all">
                        <div className="flex items-center justify-between mb-4">
                            <div className={`${stat.bg} p-2.5 rounded-xl`}>
                                <stat.icon className={`h-5 w-5 ${stat.color}`} />
                            </div>
                        </div>
                        <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">{stat.name}</p>
                        <p className="text-2xl font-black text-slate-900 mt-1">{stat.value}</p>
                    </div>
                ))}
            </div>

            {/* Main Content Area */}
            {isOnline ? (
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                            <Search className="h-5 w-5 text-blue-600" /> Nearby Orders
                        </h2>
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                            {availableOrders?.length || 0} discovered
                        </span>
                    </div>

                    {availableOrders && availableOrders.length > 0 ? (
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {availableOrders.map((delivery: any) => (
                                <Link
                                    href={`/delivery/active`} // In a real app, this might go to a detail or acceptance page
                                    key={delivery.id}
                                    className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden hover:border-blue-300 hover:shadow-lg transition-all group"
                                >
                                    <div className="p-6 space-y-4">
                                        <div className="flex justify-between items-start">
                                            <div className="flex items-center gap-3">
                                                <div className="bg-blue-50 p-2 rounded-xl text-blue-600">
                                                    <Package className="h-5 w-5" />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-900">#{delivery.parcel?.trackingNumber}</p>
                                                    <p className="text-[10px] text-slate-500 uppercase font-extrabold tracking-widest">{delivery.type?.replace('_', ' ')}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-lg font-black text-blue-600">${(delivery.parcel?.weight * 5).toFixed(2)}</p>
                                                <p className="text-[10px] text-slate-400 font-bold uppercase">Pickup Fee</p>
                                            </div>
                                        </div>

                                        <div className="space-y-3 relative before:content-[''] before:absolute before:left-2.5 before:top-4 before:bottom-4 before:w-0.5 before:bg-slate-100">
                                            <div className="flex items-start gap-4">
                                                <div className="w-5 h-5 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0 z-10 border-2 border-white">
                                                    <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Pickup Address</p>
                                                    <p className="text-xs text-slate-700 line-clamp-1 font-medium italic">{delivery.parcel?.senderAddress || 'Not specified'}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-start gap-4">
                                                <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 z-10 border-2 border-white">
                                                    <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Destination Hub</p>
                                                    <p className="text-xs text-slate-700 line-clamp-1 font-medium">{delivery.parcel?.destinationHub?.name || 'Local Distribution Hub'}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="bg-slate-50 px-6 py-4 flex items-center justify-between group-hover:bg-blue-600 transition-colors">
                                        <span className="text-xs font-bold text-slate-500 group-hover:text-white uppercase tracking-wider">Click to Accept</span>
                                        <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-white group-hover:translate-x-1 transition-all" />
                                    </div>
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <div className="bg-white rounded-3xl border-2 border-dashed border-slate-100 p-16 text-center">
                            <Truck className="h-16 w-16 text-slate-200 mx-auto mb-4" />
                            <h3 className="text-xl font-bold text-slate-900">Searching for Orders...</h3>
                            <p className="text-slate-500 mt-1 max-w-xs mx-auto">Sit tight! We're scanning your area for available delivery parcels.</p>
                        </div>
                    )}
                </div>
            ) : (
                <div className="bg-slate-900 rounded-3xl p-12 text-center text-white overflow-hidden relative">
                    <div className="relative z-10">
                        <div className="bg-white/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 backdrop-blur-md">
                            <Clock className="h-10 w-10 text-white" />
                        </div>
                        <h2 className="text-3xl font-bold mb-2">You are currently Offline</h2>
                        <p className="text-slate-400 max-w-sm mx-auto mb-8 font-medium">Toggle "Go Online" to start seeing available deliveries and earning money.</p>
                        <button
                            onClick={() => setIsOnline(true)}
                            className="bg-white text-slate-900 px-10 py-4 rounded-2xl font-bold hover:bg-blue-50 transition-all transform hover:scale-105 shadow-xl"
                        >
                            Get Started Now
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
