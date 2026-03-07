'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import api from '@/lib/api-client';
import { Check, X, Clock, User, Home, Info, AlertCircle, Loader2, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminHubRequestsPage() {
    const queryClient = useQueryClient();
    const [comment, setComment] = useState('');
    const [processingId, setProcessingId] = useState<string | null>(null);

    const { data: requests, isLoading } = useQuery({
        queryKey: ['admin-hub-requests'],
        queryFn: async () => {
            const { data } = await api.get('/hubs/requests/all');
            return data;
        },
    });

    const approveMutation = useMutation({
        mutationFn: ({ id, comment }: { id: string; comment: string }) =>
            api.patch(`/hubs/requests/${id}/approve`, { comment }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-hub-requests'] });
            queryClient.invalidateQueries({ queryKey: ['admin-hubs'] });
            toast.success('Request approved successfully');
            setComment('');
            setProcessingId(null);
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to approve request');
            setProcessingId(null);
        }
    });

    const rejectMutation = useMutation({
        mutationFn: ({ id, comment }: { id: string; comment: string }) =>
            api.patch(`/hubs/requests/${id}/reject`, { comment }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-hub-requests'] });
            toast.success('Request rejected');
            setComment('');
            setProcessingId(null);
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to reject request');
            setProcessingId(null);
        }
    });

    if (isLoading) return <div className="flex justify-center py-20"><Loader2 className="h-10 w-10 animate-spin text-blue-600" /></div>;

    const pendingRequests = requests?.filter((r: any) => r.status === 'pending') || [];
    const historyRequests = requests?.filter((r: any) => r.status !== 'pending') || [];

    return (
        <div className="space-y-8 pb-20">
            <div>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Hub Management Requests</h1>
                <p className="text-slate-500 dark:text-slate-400 mt-1">Review operational change requests submitted by Hub Managers.</p>
            </div>

            {/* Pending Requests */}
            <div className="space-y-6">
                <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-blue-500" />
                    <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest">Pending Review ({pendingRequests.length})</h2>
                </div>

                {pendingRequests.length === 0 ? (
                    <div className="bg-white dark:bg-slate-800 rounded-3xl p-12 text-center border border-slate-100 dark:border-slate-700 shadow-sm">
                        <div className="bg-slate-50 dark:bg-slate-700 h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100 dark:border-slate-600">
                            <Check className="h-8 w-8 text-slate-300" />
                        </div>
                        <p className="text-slate-500 font-medium">All caught up! No pending hub requests.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-6">
                        {pendingRequests.map((request: any) => (
                            <div key={request.id} className="bg-white dark:bg-slate-800 rounded-[2.5rem] p-8 border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-md transition-all">
                                <div className="flex flex-col lg:flex-row gap-8">
                                    {/* Left: Hub Info */}
                                    <div className="lg:w-1/3 space-y-4">
                                        <div className="flex items-start gap-4">
                                            <div className="bg-blue-50 p-4 rounded-2xl">
                                                <Home className="h-6 w-6 text-blue-600" />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-slate-900 dark:text-white text-lg">{request.hub?.name}</h3>
                                                <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-1">
                                                    <User className="h-3 w-3" />
                                                    <span>Managed by {request.manager?.name}</span>
                                                </div>
                                                <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-0.5">
                                                    <Clock className="h-3 w-3" />
                                                    <span>{new Date(request.createdAt).toLocaleString()}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="bg-slate-50 dark:bg-slate-700/50 rounded-2xl p-4 border border-slate-100 dark:border-slate-600">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Original Data</p>
                                            <div className="space-y-1.5">
                                                <p className="text-[10px] text-slate-600 dark:text-slate-400"><strong>Hours:</strong> {request.hub?.operatingHours || 'Not set'}</p>
                                                <p className="text-[10px] text-slate-600 dark:text-slate-400"><strong>Cap:</strong> {request.hub?.capacity || 1000}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Middle: Requested Changes */}
                                    <div className="lg:w-1/3 flex-1 flex flex-col">
                                        <div className="flex items-center gap-2 mb-3">
                                            <AlertCircle className="h-4 w-4 text-amber-500" />
                                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Requested Changes</h4>
                                        </div>
                                        <div className="bg-amber-50/50 dark:bg-amber-900/10 rounded-3xl p-6 border border-amber-100/50 dark:border-amber-700/30 flex-1 space-y-4">
                                            {request.requestedData.name && request.requestedData.name !== request.hub?.name && (
                                                <div>
                                                    <p className="text-[10px] text-amber-600 font-bold uppercase tracking-wider mb-1">Rename Hub</p>
                                                    <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{request.requestedData.name}</p>
                                                </div>
                                            )}
                                            {request.requestedData.description && (
                                                <div>
                                                    <p className="text-[10px] text-amber-600 font-bold uppercase tracking-wider mb-1">Description</p>
                                                    <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-medium line-clamp-3">{request.requestedData.description}</p>
                                                </div>
                                            )}
                                            <div className="grid grid-cols-2 gap-4">
                                                {request.requestedData.operatingHours && (
                                                    <div>
                                                        <p className="text-[10px] text-amber-600 font-bold uppercase tracking-wider mb-1">Hours</p>
                                                        <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{request.requestedData.operatingHours}</p>
                                                    </div>
                                                )}
                                                {request.requestedData.capacity && (
                                                    <div>
                                                        <p className="text-[10px] text-amber-600 font-bold uppercase tracking-wider mb-1">Capacity</p>
                                                        <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{request.requestedData.capacity}</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Right: Actions */}
                                    <div className="lg:w-1/3 space-y-4 flex flex-col justify-center">
                                        <div className="relative">
                                            <textarea
                                                placeholder="Admin feedback (required for rejection)"
                                                className="w-full bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-2xl p-4 text-sm font-medium text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 transition-all resize-none placeholder-slate-400 dark:placeholder-slate-500"
                                                rows={2}
                                                value={processingId === request.id ? comment : ''}
                                                onChange={(e) => {
                                                    setProcessingId(request.id);
                                                    setComment(e.target.value);
                                                }}
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <button
                                                onClick={() => {
                                                    setProcessingId(request.id);
                                                    approveMutation.mutate({ id: request.id, comment });
                                                }}
                                                disabled={approveMutation.isPending && processingId === request.id}
                                                className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-xl shadow-lg shadow-green-500/20 flex items-center justify-center gap-2 transition-all"
                                            >
                                                {approveMutation.isPending && processingId === request.id ? (
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                ) : (
                                                    <Check className="h-4 w-4" />
                                                )}
                                                Approve
                                            </button>
                                            <button
                                                onClick={() => {
                                                    if (!comment) {
                                                        toast.error('Please provide a reason for rejection');
                                                        return;
                                                    }
                                                    setProcessingId(request.id);
                                                    rejectMutation.mutate({ id: request.id, comment });
                                                }}
                                                disabled={rejectMutation.isPending && processingId === request.id}
                                                className="bg-red-50 text-red-600 hover:bg-red-100 font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all"
                                            >
                                                {rejectMutation.isPending && processingId === request.id ? (
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                ) : (
                                                    <X className="h-4 w-4" />
                                                )}
                                                Reject
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* History */}
            {historyRequests.length > 0 && (
                <div className="space-y-6 pt-10 border-t border-slate-100 dark:border-slate-700">
                    <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-slate-300" />
                        <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest">Processsed History</h2>
                    </div>

                    <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 overflow-hidden shadow-sm">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 dark:bg-slate-700/50 border-b border-slate-100 dark:border-slate-700">
                                <tr>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Hub</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Date</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Admin Note</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 dark:divide-slate-700">
                                {historyRequests.slice(0, 10).map((req: any) => (
                                    <tr key={req.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/30 transition-colors">
                                        <td className="px-6 py-4">
                                            <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{req.hub?.name}</p>
                                            <p className="text-[10px] text-slate-400 dark:text-slate-500">{req.manager?.name}</p>
                                        </td>
                                        <td className="px-6 py-4 text-xs font-medium text-slate-500">
                                            {new Date(req.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${req.status === 'approved' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                                                }`}>
                                                {req.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-start gap-2 max-w-xs">
                                                <MessageSquare className="h-3 w-3 text-slate-300 mt-1 flex-shrink-0" />
                                                <p className="text-[10px] font-medium text-slate-500 line-clamp-2 italic">
                                                    {req.adminComment || 'No comment provided'}
                                                </p>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
