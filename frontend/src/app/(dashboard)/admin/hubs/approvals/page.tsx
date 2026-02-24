'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api-client';
import { CheckCircle2, XCircle, Clock, MapPin, Building2, FileText, Image as ImageIcon, Loader2, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function AdminHubApprovalsPage() {
    const queryClient = useQueryClient();
    const [rejectModal, setRejectModal] = useState<{ open: boolean; hubId: string | null }>({ open: false, hubId: null });
    const [rejectReason, setRejectReason] = useState('');
    const [previewImg, setPreviewImg] = useState<string | null>(null);

    const { data: pendingHubs = [], isLoading } = useQuery({
        queryKey: ['pending-hubs'],
        queryFn: async () => {
            const { data } = await api.get('/hubs/pending');
            return data;
        },
    });

    const approveMutation = useMutation({
        mutationFn: (hubId: string) => api.patch(`/hubs/${hubId}/approve`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['pending-hubs'] });
            toast.success('Hub approved and activated!');
        },
        onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to approve hub'),
    });

    const rejectMutation = useMutation({
        mutationFn: ({ hubId, reason }: { hubId: string; reason: string }) =>
            api.patch(`/hubs/${hubId}/reject`, { reason }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['pending-hubs'] });
            setRejectModal({ open: false, hubId: null });
            setRejectReason('');
            toast.success('Hub application rejected. Manager has been notified.');
        },
        onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to reject hub'),
    });

    const handleReject = () => {
        if (!rejectReason.trim()) { toast.error('Please enter a rejection reason'); return; }
        if (!rejectModal.hubId) return;
        rejectMutation.mutate({ hubId: rejectModal.hubId, reason: rejectReason.trim() });
    };

    if (isLoading) return (
        <div className="p-8 flex items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <span className="text-slate-500 font-medium">Loading pending approvals...</span>
        </div>
    );

    return (
        <div className="max-w-5xl mx-auto space-y-8 pb-20">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Hub Approvals</h1>
                    <p className="text-slate-500 mt-1">Review and approve hub applications from managers.</p>
                </div>
                <div className="bg-amber-50 border border-amber-200 rounded-2xl px-5 py-3 flex items-center gap-2.5">
                    <Clock className="h-4 w-4 text-amber-600" />
                    <span className="text-sm font-black text-amber-700">{pendingHubs.length} Pending</span>
                </div>
            </div>

            {pendingHubs.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-16 flex flex-col items-center text-center gap-4">
                    <div className="bg-green-50 rounded-full p-6">
                        <CheckCircle2 className="h-12 w-12 text-green-500" />
                    </div>
                    <div>
                        <p className="text-lg font-black text-slate-800">All Caught Up!</p>
                        <p className="text-sm text-slate-400 mt-1">There are no pending hub applications right now.</p>
                    </div>
                </div>
            ) : (
                <div className="space-y-6">
                    {pendingHubs.map((hub: any) => {
                        const docs: string[] = hub.documentUrls ? JSON.parse(hub.documentUrls) : [];
                        return (
                            <div key={hub.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                                {/* Shop Photo Banner */}
                                {hub.shopPhoto ? (
                                    <div className="relative h-48 bg-slate-100 cursor-pointer" onClick={() => setPreviewImg(hub.shopPhoto)}>
                                        <img src={hub.shopPhoto} alt={hub.name} className="w-full h-full object-cover" />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                                        <div className="absolute bottom-3 right-3 bg-white/90 rounded-lg px-3 py-1.5 flex items-center gap-1.5">
                                            <Eye className="h-3 w-3 text-slate-600" />
                                            <span className="text-xs font-bold text-slate-700">View Full</span>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="h-32 bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
                                        <div className="flex flex-col items-center gap-2 text-slate-400">
                                            <ImageIcon className="h-8 w-8" />
                                            <span className="text-xs font-bold">No shop photo uploaded</span>
                                        </div>
                                    </div>
                                )}

                                <div className="p-8 space-y-6">
                                    {/* Hub Details */}
                                    <div className="flex flex-col md:flex-row md:items-start gap-6">
                                        <div className="flex-1 space-y-3">
                                            <div className="flex items-center gap-3">
                                                <div className="bg-blue-100 rounded-xl p-2.5">
                                                    <Building2 className="h-5 w-5 text-blue-600" />
                                                </div>
                                                <div>
                                                    <h2 className="text-lg font-black text-slate-900">{hub.name}</h2>
                                                    <p className="text-xs text-slate-400 font-mono">{hub.id}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-start gap-2">
                                                <MapPin className="h-4 w-4 text-slate-400 flex-shrink-0 mt-0.5" />
                                                <p className="text-sm text-slate-600">{hub.address || 'No address provided'}</p>
                                            </div>
                                            {hub.description && (
                                                <p className="text-sm text-slate-500 leading-relaxed">{hub.description}</p>
                                            )}
                                            <div className="flex flex-wrap gap-3">
                                                <span className="bg-slate-100 text-slate-600 text-xs font-bold rounded-xl px-3 py-1.5">
                                                    ⏰ {hub.operatingHours || 'Hours not set'}
                                                </span>
                                                <span className="bg-slate-100 text-slate-600 text-xs font-bold rounded-xl px-3 py-1.5">
                                                    📦 Capacity: {hub.capacity}
                                                </span>
                                                {hub.lat && hub.lng && (
                                                    <span className="bg-blue-50 text-blue-600 text-xs font-bold rounded-xl px-3 py-1.5">
                                                        📍 {hub.lat.toFixed(4)}, {hub.lng.toFixed(4)}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Documents */}
                                        <div className="md:w-64 space-y-3">
                                            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Submitted Documents</p>
                                            {docs.length > 0 ? (
                                                <div className="space-y-2">
                                                    {docs.map((url, i) => (
                                                        <a key={i} href={url} target="_blank" rel="noreferrer"
                                                            className="flex items-center gap-2.5 bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-200 rounded-xl px-3.5 py-2.5 transition-all">
                                                            <FileText className="h-4 w-4 text-blue-500" />
                                                            <span className="text-xs font-bold text-slate-700">Document {i + 1}</span>
                                                        </a>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 flex items-center gap-2">
                                                    <XCircle className="h-4 w-4 text-amber-500 flex-shrink-0" />
                                                    <p className="text-xs text-amber-700 font-medium">No documents uploaded yet.</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex gap-3 pt-2 border-t border-slate-100">
                                        <button
                                            onClick={() => approveMutation.mutate(hub.id)}
                                            disabled={approveMutation.isPending}
                                            className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-green-100"
                                        >
                                            {approveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                                            Approve Hub
                                        </button>
                                        <button
                                            onClick={() => setRejectModal({ open: true, hubId: hub.id })}
                                            className="flex-1 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2"
                                        >
                                            <XCircle className="h-4 w-4" />
                                            Reject
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Reject Modal */}
            {rejectModal.open && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full space-y-6">
                        <div className="flex items-start gap-4">
                            <div className="bg-red-100 rounded-2xl p-3">
                                <XCircle className="h-6 w-6 text-red-600" />
                            </div>
                            <div>
                                <h2 className="text-xl font-black text-slate-900">Reject Hub Application</h2>
                                <p className="text-sm text-slate-400 mt-1">Provide a clear reason so the manager can address the issue.</p>
                            </div>
                        </div>
                        <textarea
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                            placeholder="e.g., Incomplete documentation, invalid address, blurry photos..."
                            rows={4}
                            className="w-full border border-slate-200 rounded-2xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-red-400 resize-none text-slate-800"
                        />
                        <div className="flex gap-3">
                            <button
                                onClick={() => { setRejectModal({ open: false, hubId: null }); setRejectReason(''); }}
                                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 rounded-xl transition"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleReject}
                                disabled={rejectMutation.isPending}
                                className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition flex items-center justify-center gap-2"
                            >
                                {rejectMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                                Confirm Reject
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Full Image Preview */}
            {previewImg && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setPreviewImg(null)}>
                    <img src={previewImg} alt="Full preview" className="max-w-3xl max-h-[80vh] object-contain rounded-2xl shadow-2xl" />
                </div>
            )}
        </div>
    );
}
