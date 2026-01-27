'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import api from '@/lib/api-client';
import { MapPin, Plus, Trash2, Edit3, Loader2, Globe, Navigation } from 'lucide-react';
import LocationPicker from '@/components/location-picker';

export default function HubManagementPage() {
    const queryClient = useQueryClient();
    const [showAddForm, setShowAddForm] = useState(false);
    const [newHub, setNewHub] = useState({ name: '', address: '', lat: 0, lng: 0 });

    const { data: hubs, isLoading } = useQuery({
        queryKey: ['admin-hubs'],
        queryFn: async () => {
            const { data } = await api.get('/hubs');
            return data;
        },
    });

    const createMutation = useMutation({
        mutationFn: (data: any) => api.post('/hubs', data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-hubs'] });
            setShowAddForm(false);
            setNewHub({ name: '', address: '', lat: 0, lng: 0 });
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => api.delete(`/hubs/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-hubs'] });
        },
    });

    if (isLoading) return <div className="flex justify-center py-20"><Loader2 className="h-10 w-10 animate-spin text-blue-600" /></div>;

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Hub Network</h1>
                    <p className="text-slate-500 mt-1">Configure your distribution nodes and routing hubs.</p>
                </div>
                <button
                    onClick={() => setShowAddForm(!showAddForm)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold shadow-lg shadow-blue-200 flex items-center gap-2 transition-all"
                >
                    <Plus className="h-5 w-5" />
                    {showAddForm ? 'Cancel' : 'Register New Hub'}
                </button>
            </div>

            {showAddForm && (
                <div className="bg-white p-8 rounded-2xl shadow-xl border border-blue-100 animate-in fade-in slide-in-from-top-4 duration-300">
                    <h3 className="text-xl font-bold text-slate-900 mb-6">Register New Delivery Hub</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div>
                            <label className="text-sm font-medium text-slate-700 block mb-1">Hub Name</label>
                            <input
                                type="text"
                                placeholder="e.g. Central Logistics - New York"
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                value={newHub.name}
                                onChange={(e) => setNewHub({ ...newHub, name: e.target.value })}
                            />
                        </div>
                        <div>
                            <LocationPicker
                                defaultLabel="Hub Location"
                                placeholder="Search hub address..."
                                onLocationSelect={(address, lat, lng) => setNewHub({ ...newHub, address, lat, lng })}
                            />
                        </div>
                    </div>
                    <button
                        disabled={!newHub.name || !newHub.address || createMutation.isPending}
                        onClick={() => createMutation.mutate(newHub)}
                        className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold shadow-lg shadow-blue-200 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {createMutation.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Globe className="h-5 w-5" />}
                        Initialize Hub
                    </button>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {hubs?.map((hub: any) => (
                    <div key={hub.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:border-blue-200 transition-all group">
                        <div className="flex justify-between items-start mb-4">
                            <div className="bg-blue-50 p-3 rounded-xl text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all">
                                <Navigation className="h-6 w-6" />
                            </div>
                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg">
                                    <Edit3 className="h-4 w-4" />
                                </button>
                                <button
                                    onClick={() => { if (confirm('Delete hub?')) deleteMutation.mutate(hub.id); }}
                                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                        <h3 className="font-bold text-slate-900 text-lg mb-1">{hub.name}</h3>
                        <div className="flex items-start gap-2 text-sm text-slate-500">
                            <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0 text-slate-400" />
                            <p className="line-clamp-2">{hub.address}</p>
                        </div>
                        <div className="mt-4 pt-4 border-t border-slate-50 flex justify-between items-center">
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Active Status</span>
                            <div className="flex items-center gap-1.5">
                                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                <span className="text-xs font-bold text-green-600 uppercase">Online</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
