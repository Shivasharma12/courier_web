'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api-client';
import { Plane, MapPin, Calendar, User, Loader2, Edit, Trash } from 'lucide-react';
import { toast } from 'sonner';

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
                <h1 className="text-3xl font-bold text-slate-900">Travel Plans Management</h1>
                <p className="text-slate-500 mt-1">Oversee all traveler and partner routes</p>
            </div>

            {/* Stats */}
            <div className="grid md:grid-cols-3 gap-6">
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                    <p className="text-sm font-medium text-slate-500">Total Plans</p>
                    <p className="text-3xl font-bold text-slate-900 mt-1">{travelPlans.length}</p>
                </div>
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                    <p className="text-sm font-medium text-slate-500">Active</p>
                    <p className="text-3xl font-bold text-green-600 mt-1">
                        {travelPlans.filter(p => p.status === 'active').length}
                    </p>
                </div>
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                    <p className="text-sm font-medium text-slate-500">Completed</p>
                    <p className="text-3xl font-bold text-slate-600 mt-1">
                        {travelPlans.filter(p => p.status === 'completed').length}
                    </p>
                </div>
            </div>

            {/* Travel Plans List */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                <h2 className="text-xl font-bold text-slate-900 mb-4">All Travel Plans</h2>

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
                                className="border border-slate-200 rounded-xl p-4 hover:border-blue-300 transition-all"
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className="bg-blue-100 p-2 rounded-lg">
                                                <Plane className="h-5 w-5 text-blue-600" />
                                            </div>
                                            <div>
                                                <p className="font-semibold text-slate-900">
                                                    {plan.startHub?.name} → {plan.endHub?.name}
                                                </p>
                                                <div className="flex items-center gap-4 mt-1 text-sm text-slate-500">
                                                    <span className="flex items-center gap-1">
                                                        <User className="h-4 w-4" />
                                                        {plan.user?.name}
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <Calendar className="h-4 w-4" />
                                                        {new Date(plan.travelDate).toLocaleDateString()}
                                                    </span>
                                                    <span className="capitalize">{plan.mode}</span>
                                                    <span>Capacity: {plan.capacity}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <select
                                            value={plan.status}
                                            onChange={(e) => handleStatusChange(plan.id, e.target.value)}
                                            className="px-3 py-1 rounded-lg border border-slate-200 text-sm font-medium"
                                        >
                                            <option value="active">Active</option>
                                            <option value="completed">Completed</option>
                                            <option value="cancelled">Cancelled</option>
                                        </select>
                                        <button
                                            onClick={() => handleDelete(plan.id)}
                                            className="p-2 rounded-lg hover:bg-red-50 text-red-600 transition-all"
                                        >
                                            <Trash className="h-4 w-4" />
                                        </button>
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
