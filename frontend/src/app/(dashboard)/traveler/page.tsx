'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api-client';
import { Plane, MapPin, Calendar, Package, Users, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function TravelerDashboard() {
    const [travelPlans, setTravelPlans] = useState<any[]>([]);
    const [stats, setStats] = useState({ active: 0, completed: 0, parcels: 0 });
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const { data } = await api.get('/travel-plans/mine');
            setTravelPlans(data);

            const active = data.filter((p: any) => p.status === 'active_travel').length;
            const completed = data.filter((p: any) => p.status === 'completed').length;

            setStats({ active, completed, parcels: 0 });
        } catch (err) {
            console.error(err);
            toast.error('Failed to load travel plans');
        } finally {
            setLoading(false);
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
                <h1 className="text-3xl font-bold text-slate-900">Traveler Dashboard</h1>
                <p className="text-slate-500 mt-1">Manage your travel routes and deliveries</p>
            </div>

            {/* Stats */}
            <div className="grid md:grid-cols-3 gap-6">
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-slate-500">Active Routes</p>
                            <p className="text-3xl font-bold text-slate-900 mt-1">{stats.active}</p>
                        </div>
                        <div className="bg-blue-100 p-3 rounded-xl">
                            <Plane className="h-6 w-6 text-blue-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-slate-500">Completed Trips</p>
                            <p className="text-3xl font-bold text-slate-900 mt-1">{stats.completed}</p>
                        </div>
                        <div className="bg-green-100 p-3 rounded-xl">
                            <Package className="h-6 w-6 text-green-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-slate-500">Parcels Delivered</p>
                            <p className="text-3xl font-bold text-slate-900 mt-1">{stats.parcels}</p>
                        </div>
                        <div className="bg-purple-100 p-3 rounded-xl">
                            <Users className="h-6 w-6 text-purple-600" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="grid md:grid-cols-2 gap-6">
                <button
                    onClick={() => router.push('/traveler/post-route')}
                    className="bg-blue-600 hover:bg-blue-700 text-white p-6 rounded-2xl shadow-lg shadow-blue-200 transition-all text-left"
                >
                    <Plane className="h-8 w-8 mb-3" />
                    <h3 className="text-xl font-bold">Post New Route</h3>
                    <p className="text-blue-100 text-sm mt-1">Share your travel plans and earn by delivering parcels</p>
                </button>

                <button
                    onClick={() => router.push('/traveler/matches')}
                    className="bg-white hover:bg-slate-50 border-2 border-slate-200 p-6 rounded-2xl transition-all text-left"
                >
                    <Package className="h-8 w-8 text-slate-700 mb-3" />
                    <h3 className="text-xl font-bold text-slate-900">View Matches</h3>
                    <p className="text-slate-500 text-sm mt-1">See parcels that match your routes</p>
                </button>
            </div>

            {/* Recent Travel Plans */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                <h2 className="text-xl font-bold text-slate-900 mb-4">Your Travel Plans</h2>

                {travelPlans.length === 0 ? (
                    <div className="text-center py-12">
                        <Plane className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                        <p className="text-slate-500">No travel plans yet</p>
                        <button
                            onClick={() => router.push('/traveler/post-route')}
                            className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
                        >
                            Post your first route →
                        </button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {travelPlans.map((plan) => (
                            <div
                                key={plan.id}
                                className="border border-slate-200 rounded-xl p-4 hover:border-blue-300 transition-all cursor-pointer"
                                onClick={() => router.push(`/traveler/routes/${plan.id}`)}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="bg-blue-100 p-2 rounded-lg">
                                            <MapPin className="h-5 w-5 text-blue-600" />
                                        </div>
                                        <div>
                                            <p className="font-semibold text-slate-900">
                                                {plan.startHub?.name} → {plan.endHub?.name}
                                            </p>
                                            <div className="flex items-center gap-4 mt-1 text-sm text-slate-500">
                                                <span className="flex items-center gap-1">
                                                    <Calendar className="h-4 w-4" />
                                                    {new Date(plan.travelDate).toLocaleDateString()}
                                                </span>
                                                <span className="capitalize">{plan.mode}</span>
                                                <span>Capacity: {plan.capacity}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${plan.status === 'active_travel' ? 'bg-green-100 text-green-700' :
                                        plan.status === 'completed' ? 'bg-slate-100 text-slate-700' :
                                            'bg-red-100 text-red-700'
                                        }`}>
                                        {plan.status}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
