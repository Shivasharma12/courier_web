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
                <h1 className="text-3xl font-bold text-foreground">Traveler Dashboard</h1>
                <p className="text-muted-foreground mt-1">Manage your travel routes and deliveries</p>
            </div>

            {/* Stats */}
            <div className="grid md:grid-cols-3 gap-6">
                <div className="bg-background dark:bg-slate-900 rounded-2xl shadow-sm border border-border p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Active Routes</p>
                            <p className="text-3xl font-bold text-foreground mt-1">{stats.active}</p>
                        </div>
                        <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-xl">
                            <Plane className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                        </div>
                    </div>
                </div>

                <div className="bg-background dark:bg-slate-900 rounded-2xl shadow-sm border border-border p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Completed Trips</p>
                            <p className="text-3xl font-bold text-foreground mt-1">{stats.completed}</p>
                        </div>
                        <div className="bg-green-100 dark:bg-green-900/30 p-3 rounded-xl">
                            <Package className="h-6 w-6 text-green-600 dark:text-green-400" />
                        </div>
                    </div>
                </div>

                <div className="bg-background dark:bg-slate-900 rounded-2xl shadow-sm border border-border p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Parcels Delivered</p>
                            <p className="text-3xl font-bold text-foreground mt-1">{stats.parcels}</p>
                        </div>
                        <div className="bg-purple-100 dark:bg-purple-900/30 p-3 rounded-xl">
                            <Users className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="grid md:grid-cols-2 gap-6">
                <button
                    onClick={() => router.push('/traveler/post-route')}
                    className="bg-blue-600 hover:bg-blue-700 text-white p-6 rounded-2xl shadow-lg shadow-blue-500/20 transition-all text-left"
                >
                    <Plane className="h-8 w-8 mb-3" />
                    <h3 className="text-xl font-bold">Post New Route</h3>
                    <p className="text-blue-100/80 text-sm mt-1">Share your travel plans and earn by delivering parcels</p>
                </button>

                <button
                    onClick={() => router.push('/traveler/matches')}
                    className="bg-background dark:bg-slate-900/50 hover:bg-muted border-2 border-border p-6 rounded-2xl transition-all text-left"
                >
                    <Package className="h-8 w-8 text-foreground/70 mb-3" />
                    <h3 className="text-xl font-bold text-foreground">View Matches</h3>
                    <p className="text-muted-foreground text-sm mt-1">See parcels that match your routes</p>
                </button>
            </div>

            {/* Recent Travel Plans */}
            <div className="bg-background dark:bg-slate-900 rounded-2xl shadow-sm border border-border p-6">
                <h2 className="text-xl font-bold text-foreground mb-4">Your Travel Plans</h2>

                {travelPlans.length === 0 ? (
                    <div className="text-center py-12">
                        <Plane className="h-16 w-16 text-muted-foreground/20 mx-auto mb-4" />
                        <p className="text-muted-foreground">No travel plans yet</p>
                        <button
                            onClick={() => router.push('/traveler/post-route')}
                            className="mt-4 text-blue-600 dark:text-blue-400 hover:text-blue-700 font-medium"
                        >
                            Post your first route →
                        </button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {travelPlans.map((plan) => (
                            <div
                                key={plan.id}
                                className="border border-border rounded-xl p-4 hover:border-blue-300 dark:hover:border-blue-700 transition-all cursor-pointer"
                                onClick={() => router.push(`/traveler/routes/${plan.id}`)}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-lg">
                                            <MapPin className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                        </div>
                                        <div>
                                            <p className="font-semibold text-foreground">
                                                {plan.startHub?.name} → {plan.endHub?.name}
                                            </p>
                                            <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                                                <span className="flex items-center gap-1">
                                                    <Calendar className="h-4 w-4" />
                                                    {new Date(plan.travelDate).toLocaleDateString()}
                                                </span>
                                                <span className="capitalize">{plan.mode}</span>
                                                <span>Capacity: {plan.capacity}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${plan.status === 'active_travel' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' :
                                        plan.status === 'completed' ? 'bg-muted text-muted-foreground' :
                                            'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
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
