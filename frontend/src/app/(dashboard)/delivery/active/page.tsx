'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import api from '@/lib/api-client';
import {
    Truck,
    MapPin,
    CheckCircle,
    Package,
    Clock,
    Loader2,
    AlertCircle,
    Phone,
    User as UserIcon,
    ArrowRight
} from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

export default function ActiveOrdersPage() {
    const queryClient = useQueryClient();
    const [otp, setOtp] = useState<{ [key: string]: string }>({});

    const { data: activeOrders, isLoading } = useQuery({
        queryKey: ['active-orders-partner'],
        queryFn: async () => {
            const { data } = await api.get('/deliveries/mine');
            // Filter only in_progress ones for this page
            return data.filter((d: any) => d.status === 'in_progress');
        },
    });

    const updateStatusMutation = useMutation({
        mutationFn: async ({ deliveryId, status, otp }: { deliveryId: string; status: string; otp?: string }) => {
            await api.patch(`/deliveries/${deliveryId}/status`, { status, otp });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['active-orders-partner'] });
            toast.success('Status updated successfully');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to update status');
        }
    });

    if (isLoading) return <div className="flex justify-center py-20"><Loader2 className="h-10 w-10 animate-spin text-blue-600" /></div>;

    return (
        <div className="space-y-8 pb-20">
            <div>
                <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Active Orders</h1>
                <p className="text-slate-500 mt-1">Manage and track your current delivery assignments.</p>
            </div>

            {activeOrders && activeOrders.length > 0 ? (
                <div className="grid gap-6">
                    {activeOrders.map((delivery: any) => (
                        <div key={delivery.id} className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                            <div className="p-8">
                                <div className="flex flex-col lg:flex-row justify-between gap-8">
                                    <div className="flex-1 space-y-6">
                                        <div className="flex items-center gap-4">
                                            <div className="bg-blue-600 p-3 rounded-2xl text-white">
                                                <Truck className="h-6 w-6" />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-3">
                                                    <h2 className="text-2xl font-bold text-slate-900">#{delivery.parcel?.trackingNumber}</h2>
                                                    <span className="bg-blue-100 text-blue-700 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">
                                                        {delivery.type?.replace('_', ' ')}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-slate-500 mt-0.5">Assigned on {new Date(delivery.createdAt).toLocaleDateString()}</p>
                                            </div>
                                        </div>

                                        <div className="grid md:grid-cols-2 gap-8 pt-4">
                                            <div className="space-y-4">
                                                <div className="flex items-start gap-3">
                                                    <div className="bg-amber-100 p-2 rounded-lg mt-1">
                                                        <MapPin className="h-4 w-4 text-amber-600" />
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Pickup From</p>
                                                        <p className="text-sm font-bold text-slate-800">{delivery.parcel?.senderName}</p>
                                                        <p className="text-xs text-slate-500 mt-0.5 italic">{delivery.parcel?.senderAddress}</p>
                                                        <div className="flex items-center gap-2 mt-2">
                                                            <Phone className="h-3 w-3 text-slate-400" />
                                                            <span className="text-xs text-slate-600 font-medium">{delivery.parcel?.senderPhone}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="space-y-4">
                                                <div className="flex items-start gap-3">
                                                    <div className="bg-green-100 p-2 rounded-lg mt-1">
                                                        <MapPin className="h-4 w-4 text-green-600" />
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Deliver To</p>
                                                        <p className="text-sm font-bold text-slate-800">{delivery.parcel?.receiverName || 'Destination Hub'}</p>
                                                        <p className="text-xs text-slate-500 mt-0.5 italic">{delivery.parcel?.receiverAddress || delivery.parcel?.destinationHub?.name}</p>
                                                        {delivery.parcel?.receiverPhone && (
                                                            <div className="flex items-center gap-2 mt-2">
                                                                <Phone className="h-3 w-3 text-slate-400" />
                                                                <span className="text-xs text-slate-600 font-medium">{delivery.parcel?.receiverPhone}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="lg:w-80 bg-slate-50 rounded-2xl p-6 border border-slate-100 flex flex-col justify-between">
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-2 text-blue-600">
                                                <AlertCircle className="h-5 w-5" />
                                                <span className="font-bold text-sm uppercase tracking-wider">Action Required</span>
                                            </div>
                                            <p className="text-xs text-slate-500 leading-relaxed font-medium">
                                                Please confirm once you've arrived at the destination. For final deliveries, you'll need the receiver's OTP.
                                            </p>

                                            <div className="pt-2">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Receiver OTP (If Required)</label>
                                                <input
                                                    type="text"
                                                    placeholder="Enter 6-digit OTP"
                                                    value={otp[delivery.id] || ''}
                                                    onChange={(e) => setOtp({ ...otp, [delivery.id]: e.target.value })}
                                                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold tracking-[0.2em] focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                                />
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => updateStatusMutation.mutate({
                                                deliveryId: delivery.id,
                                                status: 'completed',
                                                otp: otp[delivery.id]
                                            })}
                                            disabled={updateStatusMutation.isPending}
                                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl mt-6 flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-200 disabled:opacity-50"
                                        >
                                            {updateStatusMutation.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : <CheckCircle className="h-5 w-5" />}
                                            Complete Delivery
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="bg-white rounded-3xl border-2 border-dashed border-slate-100 p-20 text-center">
                    <Package className="h-16 w-16 text-slate-200 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-slate-900">No active orders</h3>
                    <p className="text-slate-500 mt-1 mb-8">Go to your dashboard to find and accept new delivery tasks.</p>
                    <Link
                        href="/delivery"
                        className="inline-flex items-center gap-2 bg-blue-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-100"
                    >
                        Go to Dashboard <ArrowRight className="h-4 w-4" />
                    </Link>
                </div>
            )}
        </div>
    );
}
