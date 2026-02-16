'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api-client';
import { MapPin, Clock, Box, Save, Loader2, Info } from 'lucide-react';
import { toast } from 'sonner';
import LocationPicker from '@/components/location-picker';

export default function HubProfilePage() {
    const queryClient = useQueryClient();
    const [formData, setFormData] = useState({
        name: '',
        address: '',
        lat: 0,
        lng: 0,
        capacity: 1000,
        operatingHours: '',
        description: ''
    });

    const { data: hub, isLoading } = useQuery({
        queryKey: ['my-hub'],
        queryFn: async () => {
            const { data } = await api.get('/hubs/my-hub-stats'); // We might need a direct hub fetch if stats doesn't include everything
            // Let's assume stats gives basic info, but we might need a dedicated my-hub endpoint
            // For now, let's try to get more details if needed
            return data;
        }
    });

    useEffect(() => {
        if (hub) {
            setFormData({
                name: hub.name || '',
                address: hub.address || '',
                lat: hub.lat || 0,
                lng: hub.lng || 0,
                capacity: hub.capacity || 1000,
                operatingHours: hub.operatingHours || '',
                description: hub.description || ''
            });
        }
    }, [hub]);

    const updateMutation = useMutation({
        mutationFn: (data: any) => api.patch('/hubs/my-hub', data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['hub-stats'] });
            queryClient.invalidateQueries({ queryKey: ['my-hub'] });
            toast.success('Hub profile updated successfully!');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to update hub profile');
        }
    });

    const handleLocationSelect = (address: string, lat: number, lng: number) => {
        setFormData(prev => ({ ...prev, address, lat, lng }));
    };

    const handleLocationData = (data: any) => {
        const addr = data.address;
        const area = addr?.suburb || addr?.neighbourhood || addr?.village || addr?.town || addr?.city || '';
        if (area && (!formData.name || formData.name === 'Hub Name' || formData.name === '')) {
            setFormData(prev => ({ ...prev, name: `${area} Express Hub` }));
            toast.info(`Suggested hub name based on ${area}`);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        updateMutation.mutate(formData);
    };

    if (isLoading) return <div className="p-8"><Loader2 className="h-8 w-8 animate-spin text-blue-600" /></div>;

    return (
        <div className="max-w-4xl mx-auto space-y-8 pb-20">
            <div>
                <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Hub Profile</h1>
                <p className="text-slate-500 mt-1">Manage your hub's public details and operational capacity.</p>
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="md:col-span-2 space-y-6">
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 space-y-6 text-slate-900">
                        <div className="space-y-2">
                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <Info className="h-3 w-3" /> Basic Information
                            </label>
                            <div className="grid grid-cols-1 gap-4">
                                <input
                                    type="text"
                                    placeholder="Hub Name"
                                    className="w-full bg-slate-50 border-0 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    required
                                    disabled={!!hub?.name}
                                />
                                <textarea
                                    placeholder="Hub Description (Services, accessibility, etc.)"
                                    rows={4}
                                    className="w-full bg-slate-50 border-0 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500 transition-all resize-none"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <MapPin className="h-3 w-3" /> Location & Address
                            </label>
                            <div className="space-y-4">
                                {(!hub?.lat || !hub?.lng) ? (
                                    <LocationPicker
                                        placeholder="Search for your hub location..."
                                        onLocationSelect={handleLocationSelect}
                                        onLocationData={handleLocationData}
                                    />
                                ) : (
                                    <div className="p-4 bg-blue-50/50 border border-blue-100/50 rounded-xl flex items-start gap-3">
                                        <Info className="h-4 w-4 text-blue-500 mt-0.5" />
                                        <p className="text-[10px] text-blue-700 font-medium leading-relaxed">
                                            The hub location is fixed for security. If you need to move the hub, please contact the System Administrator.
                                        </p>
                                    </div>
                                )}
                                {formData.address && (
                                    <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl">
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Selected Address</p>
                                        <p className="text-sm font-medium text-slate-700">{formData.address}</p>
                                        <div className="flex gap-4 mt-2">
                                            <p className="text-[10px] text-slate-400 font-mono">Lat: {formData.lat.toFixed(4)}</p>
                                            <p className="text-[10px] text-slate-400 font-mono">Lng: {formData.lng.toFixed(4)}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 space-y-6 text-slate-900">
                        <div className="space-y-2">
                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <Clock className="h-3 w-3" /> Operating Hours
                            </label>
                            <input
                                type="text"
                                placeholder="e.g., 9AM - 9PM or 24/7"
                                className="w-full bg-slate-50 border-0 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                value={formData.operatingHours}
                                onChange={(e) => setFormData({ ...formData, operatingHours: e.target.value })}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <Box className="h-3 w-3" /> Max Capacity
                            </label>
                            <input
                                type="number"
                                placeholder="Storage Capacity"
                                className="w-full bg-slate-50 border-0 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                value={formData.capacity}
                                onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) })}
                                required
                            />
                            <p className="text-[10px] text-slate-400 font-medium">Maximum volume of parcels your hub can hold.</p>
                        </div>

                        <button
                            type="submit"
                            disabled={updateMutation.isPending}
                            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-100 transition-all flex items-center justify-center gap-2"
                        >
                            {updateMutation.isPending ? (
                                <Loader2 className="h-5 w-5 animate-spin" />
                            ) : (
                                <Save className="h-5 w-5" />
                            )}
                            Save Changes
                        </button>
                    </div>

                    <div className="bg-blue-50 rounded-2xl p-6 border border-blue-100">
                        <h4 className="text-sm font-bold text-blue-900 mb-2">Manager View</h4>
                        <p className="text-xs text-blue-700 leading-relaxed">
                            Once updated, these details will be visible to Customers and Travelers for selecting this hub as a transit point.
                        </p>
                    </div>
                </div>
            </form>
        </div>
    );
}
