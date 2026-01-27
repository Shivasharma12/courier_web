'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api-client';
import { Truck, MapPin, Package, ArrowRight, Loader2, Route, CheckCircle2 } from 'lucide-react';
import { useState } from 'react';

export default function DispatchPage() {
    const queryClient = useQueryClient();
    const hubId = '0000-0000-0000'; // Mocked
    const [selectedParcels, setSelectedParcels] = useState<string[]>([]);

    const { data: parcels, isLoading } = useQuery({
        queryKey: ['hub-dispatch', hubId],
        queryFn: async () => {
            const { data } = await api.get(`/parcels/hub-inventory/${hubId}`);
            return data;
        },
    });

    const dispatchMutation = useMutation({
        mutationFn: async (data: any) => api.post('/deliveries', data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['hub-dispatch'] });
            setSelectedParcels([]);
        },
    });

    const toggleSelect = (id: string) => {
        setSelectedParcels(prev => prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]);
    };

    if (isLoading) return <div className="flex justify-center py-20"><Loader2 className="h-10 w-10 animate-spin text-blue-600" /></div>;

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-slate-900">Dispatch Queue</h1>
                <p className="text-slate-500 mt-1">Assign parcels to delivery partners or transit routes.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                <div className="lg:col-span-3 space-y-4">
                    {parcels?.map((parcel: any) => (
                        <div
                            key={parcel.id}
                            onClick={() => toggleSelect(parcel.id)}
                            className={`bg-white p-6 rounded-3xl border-2 transition-all cursor-pointer flex justify-between items-center ${selectedParcels.includes(parcel.id) ? 'border-blue-600 ring-4 ring-blue-50' : 'border-slate-100 hover:border-slate-200'
                                }`}
                        >
                            <div className="flex items-center gap-4">
                                <div className={`p-4 rounded-2xl ${selectedParcels.includes(parcel.id) ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                                    <Package className="h-6 w-6" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-900">#{parcel.trackingNumber}</h4>
                                    <p className="text-sm text-slate-500">{parcel.receiverAddress}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="text-right">
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Type</p>
                                    <p className="text-sm font-bold text-slate-900">Final Delivery</p>
                                </div>
                                {selectedParcels.includes(parcel.id) && <CheckCircle2 className="h-6 w-6 text-blue-600" />}
                            </div>
                        </div>
                    ))}
                    {!parcels?.length && (
                        <div className="py-20 bg-slate-50 rounded-3xl text-center border-2 border-dashed border-slate-200">
                            <p className="text-slate-500 font-medium">Clear for now. All parcels dispatched.</p>
                        </div>
                    )}
                </div>

                <div className="space-y-6">
                    <div className="bg-slate-900 p-8 rounded-3xl text-white shadow-2xl space-y-8">
                        <h3 className="text-xl font-bold flex items-center gap-2">
                            <Route className="h-5 w-5 text-blue-500" /> Route Action
                        </h3>

                        <div className="space-y-4">
                            <div className="flex justify-between items-center border-b border-white/10 pb-4">
                                <span className="text-slate-400 text-sm">Selected Parcels</span>
                                <span className="font-bold text-2xl">{selectedParcels.length}</span>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Assignment Type</label>
                                <select className="w-full bg-white/10 border-none rounded-xl px-4 py-3 outline-none text-white font-medium">
                                    <option className="bg-slate-900">Final Mile Delivery</option>
                                    <option className="bg-slate-900">Next Hub Transit</option>
                                </select>
                            </div>
                        </div>

                        <button
                            disabled={selectedParcels.length === 0 || dispatchMutation.isPending}
                            onClick={() => dispatchMutation.mutate({ parcels: selectedParcels })}
                            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white py-4 rounded-2xl font-bold transition-all flex items-center justify-center gap-2 shadow-xl shadow-blue-500/20"
                        >
                            {dispatchMutation.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Truck className="h-5 w-5" />}
                            Confirm Dispatch
                        </button>
                    </div>

                    <div className="bg-amber-50 p-6 rounded-3xl border border-amber-100 flex gap-4">
                        <Package className="h-6 w-6 text-amber-600 flex-shrink-0" />
                        <p className="text-xs text-amber-800 leading-relaxed font-medium">
                            Parcels will be visible to available delivery partners immediately after confirmation.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
