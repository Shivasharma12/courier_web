'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api-client';
import { Package, MapPin, User, Phone, Loader2, CheckCircle, XCircle, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import QRVerification from '@/components/qr-verification';

export default function TravelerDeliveriesPage() {
    const [deliveries, setDeliveries] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [verifyingParcel, setVerifyingParcel] = useState<any>(null);
    const [handoverData, setHandoverData] = useState<any>(null);

    useEffect(() => {
        fetchDeliveries();
    }, []);

    const fetchDeliveries = async () => {
        try {
            const { data } = await api.get('/parcels/assigned-to-me');
            // Filter parcels already assigned and in transit
            const myDeliveries = data.filter((p: any) => p.status === 'in_transit');
            setDeliveries(myDeliveries);
        } catch (err) {
            console.error(err);
            toast.error('Failed to load deliveries');
        } finally {
            setLoading(false);
        }
    };

    const startVerification = async (parcel: any) => {
        try {
            // Create a handover record first
            const { data } = await api.post('/handovers', {
                parcelId: parcel.id,
                toUserId: parcel.senderId, // For simplicity, delivering back to sender or receiver?
                type: 'delivery'
            });
            setHandoverData(data);
            setVerifyingParcel(parcel);
        } catch (err: any) {
            toast.error('Failed to initiate verification');
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
                <h1 className="text-3xl font-bold text-slate-900">My Deliveries</h1>
                <p className="text-slate-500 mt-1">Parcels you're currently delivering</p>
            </div>

            {deliveries.length === 0 ? (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-12 text-center">
                    <Package className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-500">No active deliveries</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {deliveries.map((parcel) => (
                        <div
                            key={parcel.id}
                            className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6"
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div>
                                    <p className="text-sm font-mono text-slate-500 mb-2">#{parcel.trackingNumber}</p>
                                    <span className="bg-blue-100 text-blue-700 text-xs font-bold px-3 py-1 rounded-full">
                                        IN TRANSIT
                                    </span>
                                </div>
                                <button
                                    onClick={() => startVerification(parcel)}
                                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-xl transition-all flex items-center gap-2"
                                >
                                    <ShieldCheck className="h-4 w-4" />
                                    Verify Delivery
                                </button>
                            </div>

                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="space-y-3">
                                    <div>
                                        <p className="text-xs font-bold text-slate-500 uppercase mb-1">Pickup From</p>
                                        <p className="text-sm text-slate-900 flex items-center gap-1">
                                            <MapPin className="h-4 w-4 text-blue-600" />
                                            {parcel.senderAddress}
                                        </p>
                                        <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                                            <User className="h-3 w-3" />
                                            {parcel.senderName}
                                        </p>
                                        <p className="text-xs text-slate-500 flex items-center gap-1">
                                            <Phone className="h-3 w-3" />
                                            {parcel.senderPhone}
                                        </p>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <div>
                                        <p className="text-xs font-bold text-slate-500 uppercase mb-1">Deliver To</p>
                                        <p className="text-sm text-slate-900 flex items-center gap-1">
                                            <MapPin className="h-4 w-4 text-red-600" />
                                            {parcel.receiverAddress}
                                        </p>
                                        <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                                            <User className="h-3 w-3" />
                                            {parcel.receiverName}
                                        </p>
                                        <p className="text-xs text-slate-500 flex items-center gap-1">
                                            <Phone className="h-3 w-3" />
                                            {parcel.receiverPhone}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {parcel.description && (
                                <div className="mt-4 p-3 bg-slate-50 rounded-lg">
                                    <p className="text-xs font-bold text-slate-500 uppercase mb-1">Description</p>
                                    <p className="text-sm text-slate-700">{parcel.description}</p>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
            {verifyingParcel && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <QRVerification
                        handoverId={handoverData?.id}
                        verifyCode={handoverData?.verificationCode}
                        role="sender"
                        title="Delivery Verification"
                        onSuccess={() => {
                            setVerifyingParcel(null);
                            fetchDeliveries();
                        }}
                        onCancel={() => setVerifyingParcel(null)}
                    />
                </div>
            )}
        </div>
    );
}
