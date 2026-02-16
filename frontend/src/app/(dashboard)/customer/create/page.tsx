'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api-client';
import LocationPicker from '@/components/location-picker';
import ImageUpload from '@/components/ui/image-upload';
import { Package, Send, Info, Loader2, MapPin, Camera, Ruler, Weight } from 'lucide-react';
import { toast } from 'sonner';

export default function CreateParcelPage() {
    const [hubs, setHubs] = useState<any[]>([]);
    const [formData, setFormData] = useState({
        senderAddress: '',
        senderLat: 0,
        senderLng: 0,
        receiverName: '',
        receiverPhone: '',
        receiverAddress: '',
        receiverLat: 0,
        receiverLng: 0,
        weight: 1,
        length: 10,
        width: 10,
        height: 10,
        description: '',
        images: [] as string[],
        pickupMode: 'direct' as 'hub' | 'direct',
        deliveryMode: 'hub' as 'hub' | 'direct',
        currentHubId: '',
        destinationHubId: '',
    });
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    useEffect(() => {
        const fetchHubs = async () => {
            try {
                const { data } = await api.get('/hubs');
                setHubs(data);
            } catch (err) {
                console.error('Failed to fetch hubs:', err);
                toast.error('Failed to load hubs');
            }
        };
        fetchHubs();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            // Convert images array to string for backward compatibility with entity
            const dataToSubmit = {
                ...formData,
                images: JSON.stringify(formData.images)
            };
            await api.post('/parcels', dataToSubmit);
            toast.success('Parcel created successfully!');
            router.push('/customer/history');
        } catch (err: any) {
            console.error(err);
            toast.error(err.response?.data?.message || 'Failed to create parcel');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8 pb-20">
            <div>
                <h1 className="text-3xl font-bold text-slate-900">Ship Your Parcel</h1>
                <p className="text-slate-500 mt-1">Provide shipment details and connect with global travelers.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
                {/* Locations Section */}
                <div className="grid md:grid-cols-2 gap-6">
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 space-y-4">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                                <span className="bg-blue-100 text-blue-600 p-1.5 rounded-lg"><MapPin className="h-4 w-4" /></span>
                                Pickup Location
                            </h3>
                            <div className="flex bg-slate-100 p-1 rounded-lg">
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, pickupMode: 'direct', currentHubId: '' })}
                                    className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all ${formData.pickupMode === 'direct' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                >
                                    Direct
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, pickupMode: 'hub', senderAddress: '', senderLat: 0, senderLng: 0 })}
                                    className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all ${formData.pickupMode === 'hub' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                >
                                    Hub
                                </button>
                            </div>
                        </div>
                        {formData.pickupMode === 'direct' ? (
                            <LocationPicker
                                placeholder="Home or pickup address..."
                                onLocationSelect={(address, lat, lng) => setFormData({ ...formData, senderAddress: address, senderLat: lat, senderLng: lng })}
                            />
                        ) : (
                            <select
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-bold text-slate-700"
                                value={formData.currentHubId}
                                onChange={(e) => setFormData({ ...formData, currentHubId: e.target.value })}
                            >
                                <option value="">Select pickup hub</option>
                                {hubs.map(hub => (
                                    <option key={hub.id} value={hub.id}>{hub.name} - {hub.address}</option>
                                ))}
                            </select>
                        )}
                    </div>

                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 space-y-4">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                                <span className="bg-red-100 text-red-600 p-1.5 rounded-lg"><MapPin className="h-4 w-4" /></span>
                                Drop-off Location
                            </h3>
                            <div className="flex bg-slate-100 p-1 rounded-lg">
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, deliveryMode: 'direct', destinationHubId: '' })}
                                    className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all ${formData.deliveryMode === 'direct' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                >
                                    Direct
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, deliveryMode: 'hub', receiverAddress: '', receiverLat: 0, receiverLng: 0 })}
                                    className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all ${formData.deliveryMode === 'hub' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                >
                                    Hub
                                </button>
                            </div>
                        </div>
                        {formData.deliveryMode === 'direct' ? (
                            <LocationPicker
                                placeholder="Final destination address..."
                                onLocationSelect={(address, lat, lng) => setFormData({ ...formData, receiverAddress: address, receiverLat: lat, receiverLng: lng })}
                            />
                        ) : (
                            <select
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-bold text-slate-700"
                                value={formData.destinationHubId}
                                onChange={(e) => setFormData({ ...formData, destinationHubId: e.target.value })}
                            >
                                <option value="">Select destination hub</option>
                                {hubs.map(hub => (
                                    <option key={hub.id} value={hub.id}>{hub.name} - {hub.address}</option>
                                ))}
                            </select>
                        )}
                    </div>
                </div>

                {/* Receiver & Parcel Details */}
                <div className="grid md:grid-cols-2 gap-6">
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 space-y-4">
                        <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                            <span className="bg-slate-100 text-slate-600 p-1.5 rounded-lg"><Info className="h-4 w-4" /></span>
                            Receiver Details
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Full Name</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                    value={formData.receiverName}
                                    onChange={(e) => setFormData({ ...formData, receiverName: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Phone Number</label>
                                <input
                                    type="tel"
                                    required
                                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                    value={formData.receiverPhone}
                                    onChange={(e) => setFormData({ ...formData, receiverPhone: e.target.value })}
                                />
                            </div>
                            {formData.destinationHubId && formData.deliveryMode === 'hub' && (
                                <div className="p-3 bg-blue-50 rounded-xl border border-blue-100 italic text-[10px] text-blue-700 font-medium leading-relaxed">
                                    <Info className="h-3 w-3 inline mr-1 mb-0.5" />
                                    Selected hub details: {hubs.find(h => h.id === formData.destinationHubId)?.description || 'Reliable transit point with 24/7 security.'}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 space-y-4">
                    <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                        <span className="bg-blue-100 text-blue-600 p-1.5 rounded-lg"><Package className="h-4 w-4" /></span>
                        Parcel Specifications
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block flex items-center gap-1">
                                <Weight className="h-3 w-3" /> Weight (kg)
                            </label>
                            <input
                                type="number"
                                required
                                min="0.1"
                                step="0.1"
                                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                                value={formData.weight}
                                onChange={(e) => setFormData({ ...formData, weight: parseFloat(e.target.value) })}
                            />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block flex items-center gap-1">
                                <Ruler className="h-3 w-3" /> Length (cm)
                            </label>
                            <input
                                type="number"
                                required
                                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                                value={formData.length}
                                onChange={(e) => setFormData({ ...formData, length: parseFloat(e.target.value) })}
                            />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block flex items-center gap-1">
                                <Ruler className="h-3 w-3" /> Width (cm)
                            </label>
                            <input
                                type="number"
                                required
                                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                                value={formData.width}
                                onChange={(e) => setFormData({ ...formData, width: parseFloat(e.target.value) })}
                            />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block flex items-center gap-1">
                                <Ruler className="h-3 w-3" /> Height (cm)
                            </label>
                            <input
                                type="number"
                                required
                                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                                value={formData.height}
                                onChange={(e) => setFormData({ ...formData, height: parseFloat(e.target.value) })}
                            />
                        </div>
                    </div>
                </div>

                {/* Photos & Description */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 space-y-6">
                    <div className="grid md:grid-cols-2 gap-12">
                        <div className="space-y-4">
                            <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                                <span className="bg-blue-100 text-blue-600 p-1.5 rounded-lg"><Camera className="h-4 w-4" /></span>
                                Parcel Photos
                            </h3>
                            <ImageUpload onImagesChange={(urls) => setFormData({ ...formData, images: urls })} />
                        </div>
                        <div className="space-y-4">
                            <h3 className="font-semibold text-slate-900">Description</h3>
                            <textarea
                                className="w-full h-32 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition-all resize-none"
                                placeholder="Describe the contents of your parcel..."
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            />
                            <div className="p-4 bg-blue-50 rounded-xl border border-blue-100 flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-bold text-blue-600 uppercase tracking-widest">Estimated Shipping Cost</p>
                                    <p className="text-2xl font-bold text-blue-900">${(formData.weight * 12.5).toFixed(2)}</p>
                                </div>
                                <Send className="h-6 w-6 text-blue-400 opacity-50" />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-4">
                    <button
                        type="button"
                        onClick={() => router.back()}
                        className="px-8 py-3 rounded-xl border border-slate-200 font-semibold hover:bg-slate-50 transition-all"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={
                            loading ||
                            (formData.pickupMode === 'direct' && !formData.senderAddress) ||
                            (formData.pickupMode === 'hub' && !formData.currentHubId) ||
                            (formData.deliveryMode === 'direct' && !formData.receiverAddress) ||
                            (formData.deliveryMode === 'hub' && !formData.destinationHubId)
                        }
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-12 rounded-xl transition-all shadow-lg shadow-blue-200 flex items-center gap-2 disabled:opacity-50"
                    >
                        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                        Confirm Order
                    </button>
                </div>
            </form >
        </div >
    );
}
