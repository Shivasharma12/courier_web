'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api-client';
import { Plane, MapPin, Calendar, User, Loader2, Edit, Trash, Package, Clock, CheckCircle, Bike, Car, Truck, Train, Info } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function AdminTravelPlansPage() {
    const [travelPlans, setTravelPlans] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchTravelPlans();
    }, []);

    const fetchTravelPlans = async () => {
        try {
            const { data } = await api.get('/travel-plans');
            setTravelPlans(data);
        } catch (err) {
            console.error(err);
            toast.error('Failed to load travel plans');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this travel plan?')) return;

        try {
            await api.delete(`/travel-plans/${id}`);
            toast.success('Travel plan deleted');
            fetchTravelPlans();
        } catch (err: any) {
            console.error(err);
            toast.error(err.response?.data?.message || 'Failed to delete');
        }
    };

    const handleStatusChange = async (id: string, status: string) => {
        try {
            await api.put(`/travel-plans/${id}`, { status });
            toast.success(`Travel plan marked as ${status}`);
            fetchTravelPlans();
        } catch (err: any) {
            console.error(err);
            toast.error(err.response?.data?.message || 'Failed to update');
        }
    };

    const modeIcons: any = {
        bike: Bike,
        car: Car,
        van: Truck,
        plane: Plane,
        train: Train
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
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Travel Plans Management</h1>
                <p className="text-slate-500 dark:text-slate-400 mt-1">Oversee all traveler and partner routes</p>
            </div>

            {/* Stats */}
            <div className="grid md:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-6">
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Plans</p>
                    <p className="text-3xl font-bold text-slate-900 dark:text-white mt-1">{travelPlans.length}</p>
                </div>
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-6">
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Active Routes</p>
                    <p className="text-3xl font-bold text-green-600 mt-1">
                        {travelPlans.filter(p => {
                            const isStatusActive = p.status === 'active';
                            const travelTime = new Date(p.travelDate).getTime();
                            const todayTime = new Date().setHours(0, 0, 0, 0);
                            return isStatusActive && travelTime >= todayTime;
                        }).length}
                    </p>
                </div>
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-6">
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Completed</p>
                    <p className="text-3xl font-bold text-slate-600 mt-1">
                        {travelPlans.filter(p => p.status === 'completed').length}
                    </p>
                </div>
            </div>

            {/* Travel Plans List */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-6">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">All Travel Plans</h2>

                {travelPlans.length === 0 ? (
                    <div className="text-center py-12">
                        <Plane className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                        <p className="text-slate-500">No travel plans yet</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {travelPlans.map((plan) => (
                            <div
                                key={plan.id}
                                className="border border-slate-200 dark:border-slate-700 rounded-xl p-4 hover:border-blue-300 dark:hover:border-blue-600 transition-all"
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-start gap-4 mb-4">
                                            {(() => {
                                                const ModeIcon = modeIcons[plan.mode] || Plane;
                                                return (
                                                    <div className="bg-blue-600 p-3 rounded-2xl shadow-lg shadow-blue-500/20 group-hover:scale-110 transition-transform">
                                                        <ModeIcon className="h-6 w-6 text-white" />
                                                    </div>
                                                );
                                            })()}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center flex-wrap gap-2 mb-1">
                                                    <h3 className="text-lg font-black text-slate-900 dark:text-white truncate">
                                                        {plan.startHub?.name || plan.fromLocation?.split(',')[0] || 'Start'} → {plan.endHub?.name || plan.toLocation?.split(',')[0] || 'End'}
                                                    </h3>
                                                    {(() => {
                                                        const isExpired = new Date(plan.travelDate).getTime() < new Date().setHours(0, 0, 0, 0);
                                                        const isActive = plan.status === 'active' || plan.status === 'active_travel';

                                                        return (
                                                            <span className={cn(
                                                                "px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest border",
                                                                (isActive && isExpired) ? "bg-slate-100 text-slate-500 border-slate-200" :
                                                                    isActive ? "bg-green-50 text-green-600 border-green-200" :
                                                                        plan.status === 'completed' ? "bg-slate-100 text-slate-600 border-slate-200" :
                                                                            "bg-red-50 text-red-600 border-red-200"
                                                            )}>
                                                                {(isActive && isExpired) ? 'expired' : plan.status.replace('_', ' ')}
                                                            </span>
                                                        );
                                                    })()}
                                                </div>
                                                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-bold text-slate-500 dark:text-slate-400">
                                                    <span className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400">
                                                        <User className="h-3.5 w-3.5" />
                                                        {plan.user?.name}
                                                    </span>
                                                    <span className="flex items-center gap-1.5">
                                                        <Calendar className="h-3.5 w-3.5" />
                                                        {new Date(plan.travelDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                                    </span>
                                                    {plan.departureTime && (
                                                        <span className="flex items-center gap-1.5">
                                                            <Clock className="h-3.5 w-3.5" />
                                                            {plan.departureTime}
                                                        </span>
                                                    )}
                                                    <span className="flex items-center gap-1.5 capitalize rounded-md bg-slate-100 dark:bg-slate-800 px-2 py-0.5">
                                                        {(() => {
                                                            const Icon = modeIcons[plan.mode] || Plane;
                                                            return <Icon className="h-3.5 w-3.5" />;
                                                        })()}
                                                        {plan.mode}
                                                    </span>
                                                    <span className="bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded-md">
                                                        Capacity: {plan.capacity}
                                                    </span>
                                                </div>
                                                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                                                    <div className="flex items-start gap-2.5 p-3 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800 transition-all hover:border-blue-200 dark:hover:border-blue-800 group/hub">
                                                        <div className="h-8 w-8 rounded-xl bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center shrink-0 mt-0.5 group-hover/hub:scale-110 transition-transform">
                                                            <MapPin className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                                        </div>
                                                        <div className="flex flex-col min-w-0">
                                                            <div className="flex items-center justify-between mb-1">
                                                                <span className="text-[9px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest">Pickup Hub</span>
                                                            </div>
                                                            <div className="bg-white/50 dark:bg-slate-900/40 p-1.5 rounded-lg border border-slate-200/50 dark:border-slate-800/50 mb-2 group-hover/hub:bg-white dark:group-hover/hub:bg-slate-900 transition-colors">
                                                                <span className="text-slate-900 dark:text-slate-100 font-extrabold text-[10px] block">
                                                                    {plan.startHub?.name || 'No Hub Assigned'}
                                                                </span>
                                                            </div>
                                                            <div className="flex flex-col px-0.5">
                                                                <span className="text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase mb-0.5">Original Home/Pickup Point</span>
                                                                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                                                                    {plan.fromLocation}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-start gap-2.5 p-3 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800 transition-all hover:border-indigo-200 dark:hover:border-indigo-800 group/hub">
                                                        <div className="h-8 w-8 rounded-xl bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center shrink-0 mt-0.5 group-hover/hub:scale-110 transition-transform">
                                                            <MapPin className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                                                        </div>
                                                        <div className="flex flex-col min-w-0">
                                                            <div className="flex items-center justify-between mb-1">
                                                                <span className="text-[9px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">Drop-off Hub</span>
                                                            </div>
                                                            <div className="bg-white/50 dark:bg-slate-900/40 p-1.5 rounded-lg border border-slate-200/50 dark:border-slate-800/50 mb-2 group-hover/hub:bg-white dark:group-hover/hub:bg-slate-900 transition-colors">
                                                                <span className="text-slate-900 dark:text-slate-100 font-extrabold text-[10px] block">
                                                                    {plan.endHub?.name || 'No Hub Assigned'}
                                                                </span>
                                                            </div>
                                                            <div className="flex flex-col px-0.5">
                                                                <span className="text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase mb-0.5">Final Home/Destination Hub</span>
                                                                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                                                                    {plan.toLocation}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Capacity & Progress Section */}
                                        <div className="mt-4 p-4 bg-slate-50 dark:bg-slate-900/30 rounded-2xl border border-slate-100 dark:border-slate-800">
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center gap-2">
                                                    <Package className="h-4 w-4 text-slate-400" />
                                                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Load Capacity</span>
                                                </div>
                                                <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300">
                                                    {plan.matchedParcels?.length || 0} / {plan.capacity} Units
                                                </span>
                                            </div>
                                            <div className="h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                                                <div
                                                    className={cn(
                                                        "h-full transition-all duration-500",
                                                        (plan.matchedParcels?.length / plan.capacity) > 0.8 ? "bg-amber-500" : "bg-blue-600"
                                                    )}
                                                    style={{ width: `${Math.min(((plan.matchedParcels?.length || 0) / plan.capacity) * 100, 100)}%` }}
                                                />
                                            </div>
                                        </div>

                                        {/* Matched Parcels Section */}
                                        {plan.matchedParcels && plan.matchedParcels.length > 0 ? (
                                            <div className="mt-6">
                                                <div className="flex items-center justify-between mb-3 px-1">
                                                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                                        Active Assignments
                                                    </h3>
                                                    <span className="text-[10px] font-bold text-blue-600 bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 rounded-full">
                                                        {plan.matchedParcels.length} Parcels
                                                    </span>
                                                </div>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                    {plan.matchedParcels.map((parcel: any) => (
                                                        <div key={parcel.id} className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 hover:shadow-md transition-all">
                                                            <div className="flex items-center justify-between mb-2">
                                                                <span className="text-[11px] font-black text-blue-600">#{parcel.trackingNumber}</span>
                                                                <span className="text-[9px] font-bold text-slate-400 uppercase">{parcel.status.replace(/_/g, ' ')}</span>
                                                            </div>
                                                            <div className="flex items-center gap-2 mb-2">
                                                                <div className="h-6 w-6 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[10px] font-bold text-slate-600 dark:text-slate-400">
                                                                    {parcel.senderName?.[0] || 'U'}
                                                                </div>
                                                                <div className="min-w-0">
                                                                    <p className="text-[10px] font-bold text-slate-700 dark:text-slate-300 truncate">{parcel.senderName || parcel.sender?.name || 'Unknown'}</p>
                                                                    <p className="text-[8px] text-slate-400 font-medium">Customer</p>
                                                                </div>
                                                            </div>
                                                            <div className="pt-2 border-t border-slate-50 dark:border-slate-800 mt-2 flex items-center justify-between">
                                                                <div className="flex items-center gap-1">
                                                                    <MapPin className="h-3 w-3 text-slate-300" />
                                                                    <span className="text-[9px] font-bold text-slate-500 truncate w-24">
                                                                        {parcel.destinationHub?.name || 'TBD'}
                                                                    </span>
                                                                </div>
                                                                {parcel.actualDeliveryDate && <CheckCircle className="h-3 w-3 text-green-500" />}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="mt-4 p-6 border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-2xl text-center">
                                                <Info className="h-6 w-6 text-slate-200 mx-auto mb-2" />
                                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">No Active Assignments</p>
                                                <p className="text-[9px] text-slate-500 mt-1 max-w-[200px] mx-auto">This route is currently available for matching with parcels at {plan.startHub?.name || 'the start location'}.</p>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-2">
                                        {(() => {
                                            const isExpired = new Date(plan.travelDate).getTime() < new Date().setHours(0, 0, 0, 0);
                                            const isActive = plan.status === 'active' || plan.status === 'active_travel';
                                            const isFinalized = plan.status === 'completed' || plan.status === 'cancelled';
                                            const selectDisabled = (isExpired && isActive) || isFinalized;
                                            const deleteDisabled = plan.status === 'completed';

                                            return (
                                                <>
                                                    <select
                                                        value={plan.status}
                                                        disabled={selectDisabled}
                                                        onChange={(e) => handleStatusChange(plan.id, e.target.value)}
                                                        className={cn(
                                                            "px-3 py-1 rounded-lg border text-sm font-medium transition-all",
                                                            selectDisabled
                                                                ? "bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700 cursor-not-allowed opacity-60"
                                                                : "bg-white dark:bg-slate-700 text-slate-900 dark:text-white border-slate-200 dark:border-slate-600"
                                                        )}
                                                    >
                                                        <option value="active">Active</option>
                                                        <option value="active_travel">Active (Traveling)</option>
                                                        <option value="completed">Completed</option>
                                                        <option value="cancelled">Cancelled</option>
                                                    </select>
                                                    <button
                                                        onClick={() => handleDelete(plan.id)}
                                                        disabled={deleteDisabled}
                                                        className={cn(
                                                            "p-2 rounded-lg transition-all",
                                                            deleteDisabled
                                                                ? "text-slate-300 dark:text-slate-600 cursor-not-allowed"
                                                                : "hover:bg-red-50 dark:hover:bg-red-900/30 text-red-600"
                                                        )}
                                                    >
                                                        <Trash className="h-4 w-4" />
                                                    </button>
                                                </>
                                            );
                                        })()}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
