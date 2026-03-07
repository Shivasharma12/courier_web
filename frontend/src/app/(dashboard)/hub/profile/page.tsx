'use client';

import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api-client';
import { useAuthStore } from '@/store/auth-store';
import {
    MapPin, Clock, Box, Loader2, Info, Upload, CheckCircle2,
    XCircle, AlertCircle, FileText, ImageIcon, X, Send, RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';
import LocationPicker from '@/components/location-picker';

// ─── Status Badge ────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status?: string }) {
    if (status === 'active') return (
        <div className="bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-900/30 rounded-2xl px-5 py-2.5 flex items-center gap-2.5">
            <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
            <span className="text-xs font-black text-green-700 dark:text-green-400 uppercase tracking-wider">Approved & Active</span>
        </div>
    );
    if (status === 'rejected') return (
        <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30 rounded-2xl px-5 py-2.5 flex items-center gap-2.5">
            <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
            <span className="text-xs font-black text-red-700 dark:text-red-400 uppercase tracking-wider">Rejected — Please Resubmit</span>
        </div>
    );
    return (
        <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/30 rounded-2xl px-5 py-2.5 flex items-center gap-2.5">
            <div className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
            <span className="text-xs font-black text-amber-700 dark:text-amber-400 uppercase tracking-wider">Pending Admin Approval</span>
        </div>
    );
}

// ─── Step Indicator ──────────────────────────────────────────────────────────
function StepIndicator({ step, current }: { step: number; current: number }) {
    const done = current > step;
    const active = current === step;
    return (
        <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-black border-2 transition-all
            ${done ? 'bg-blue-600 border-blue-600 text-white' : active ? 'bg-background border-blue-600 text-blue-600' : 'bg-muted border-border text-muted-foreground'}`}>
            {done ? <CheckCircle2 className="h-4 w-4" /> : step}
        </div>
    );
}

export default function HubProfilePage() {
    const queryClient = useQueryClient();
    const user = useAuthStore((s) => s.user);
    const patchUser = useAuthStore((s) => s.patchUser);
    const shopPhotoRef = useRef<HTMLInputElement>(null);
    const docsRef = useRef<HTMLInputElement>(null);

    // Step 1 = Hub details, Step 2 = Upload docs, Step 3 = Done/submitted
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        name: '', address: '', lat: 0, lng: 0,
        capacity: 1000, operatingHours: '', description: ''
    });
    const [shopPhotoFile, setShopPhotoFile] = useState<File | null>(null);
    const [shopPhotoPreview, setShopPhotoPreview] = useState<string | null>(null);
    const [documentFiles, setDocumentFiles] = useState<File[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [createdHubId, setCreatedHubId] = useState<string | null>(null);

    // ─── Fetch existing hub ───────────────────────────────────────────────
    const { data: hub, isLoading, error } = useQuery({
        queryKey: ['my-hub-profile'],
        queryFn: async () => {
            const { data } = await api.get('/hubs/my-hub-stats');
            return data;
        },
        retry: false,
    });

    const isUnassigned = !hub && (error as any)?.response?.data?.message === 'User is not assigned to a hub.';

    useEffect(() => {
        if (hub) {
            setFormData({
                name: hub.name || '', address: hub.address || '',
                lat: hub.lat || 0, lng: hub.lng || 0,
                capacity: hub.capacity || 1000,
                operatingHours: hub.operatingHours || '',
                description: hub.description || ''
            });
            if (hub.shopPhoto) setShopPhotoPreview(hub.shopPhoto);
            // Existing hub already past step 1
            if (hub.status) setStep(3);
        }
    }, [hub]);

    // ─── Mutations ────────────────────────────────────────────────────────
    const createMutation = useMutation({
        mutationFn: (data: any) => api.post('/hubs/my-hub', data),
        onSuccess: (res) => {
            const newHubId = res.data.id;
            setCreatedHubId(newHubId);
            // ✅ Immediately update auth store so Inventory/Dispatch knows the hubId
            patchUser({ hubId: newHubId });
            queryClient.invalidateQueries({ queryKey: ['my-hub-profile'] });
            queryClient.invalidateQueries({ queryKey: ['hub-stats'] });
            toast.success('Hub created! Now add your photos and documents.');
            setStep(2);
        },
        onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to create hub'),
    });

    const updateMutation = useMutation({
        mutationFn: (data: any) => api.patch('/hubs/my-hub', data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['my-hub-profile'] });
            toast.success('Profile updated and submitted for review!');
        },
        onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to update hub'),
    });

    // ─── Upload files ─────────────────────────────────────────────────────
    const uploadFiles = async (): Promise<boolean> => {
        if (!shopPhotoFile && documentFiles.length === 0) return true;
        const form = new FormData();
        if (shopPhotoFile) form.append('shopPhoto', shopPhotoFile);
        documentFiles.forEach(f => form.append('documents', f));
        try {
            await api.post('/hubs/my-hub/upload', form, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            return true;
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'File upload failed');
            return false;
        }
    };

    // ─── Step 1: Details Submit ───────────────────────────────────────────
    const handleDetailsSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.address) { toast.error('Please select a location.'); return; }
        if (isUnassigned) {
            createMutation.mutate(formData);
        } else {
            // Editing existing hub
            setStep(2);
        }
    };

    // ─── Step 2: Upload + Final Submit ────────────────────────────────────
    const handleFinalSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const uploaded = await uploadFiles();
            if (!uploaded) { setIsSubmitting(false); return; }

            if (!isUnassigned && hub) {
                await updateMutation.mutateAsync(formData);
            }

            queryClient.invalidateQueries({ queryKey: ['my-hub-profile'] });
            queryClient.invalidateQueries({ queryKey: ['hub-stats'] });
            toast.success('🎉 Hub submitted! An admin will review it shortly.');
            setStep(3);
        } finally {
            setIsSubmitting(false);
        }
    };

    // ─── Handlers ────────────────────────────────────────────────────────
    const handleLocationSelect = (address: string, lat: number, lng: number) =>
        setFormData(prev => ({ ...prev, address, lat, lng }));

    const handleLocationData = (data: any) => {
        const addr = data.address;
        const area = addr?.suburb || addr?.neighbourhood || addr?.village || addr?.town || addr?.city || '';
        if (area && !formData.name) {
            const suggested = `${area} Express Hub`;
            setFormData(prev => ({ ...prev, name: suggested }));
            toast.info(`Hub name suggested: ${suggested}`);
        }
    };

    const handleShopPhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setShopPhotoFile(file);
        setShopPhotoPreview(URL.createObjectURL(file));
    };

    const handleDocumentsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        setDocumentFiles(prev => [...prev, ...files].slice(0, 5));
    };

    // ─── Loading State ────────────────────────────────────────────────────
    if (isLoading) return (
        <div className="flex items-center gap-3 p-10">
            <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
            <span className="text-muted-foreground font-medium">Loading your hub...</span>
        </div>
    );

    if (error && !isUnassigned) return (
        <div className="p-10 text-red-500 font-bold">{(error as any).response?.data?.message || 'Failed to load hub.'}</div>
    );

    const hubStatus = hub?.status;
    const documentsList: string[] = (() => { try { return JSON.parse(hub?.documentUrls || '[]'); } catch { return []; } })();
    const isExistingHub = !!hub && !isUnassigned;
    const isRejected = hubStatus === 'rejected';
    const isPending = hubStatus === 'pending';

    return (
        <div className="max-w-3xl mx-auto space-y-8 pb-24">

            {/* ── Header ── */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-foreground tracking-tight">
                        {isUnassigned ? '🏪 Create Your Hub' : '🏪 Hub Profile'}
                    </h1>
                    <p className="text-muted-foreground text-sm mt-1">
                        {isUnassigned
                            ? 'Fill in your hub details, upload documents, and submit for admin review.'
                            : 'View and update your hub profile. Changes go through admin review.'}
                    </p>
                </div>
                {isExistingHub && <StatusBadge status={hubStatus} />}
            </div>

            {/* ── Alert: Rejection ── */}
            {isRejected && hub?.rejectionReason && (
                <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30 rounded-2xl p-5 flex items-start gap-3">
                    <XCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <div>
                        <p className="text-sm font-black text-red-800 dark:text-red-300">Application Rejected</p>
                        <p className="text-sm text-red-700 dark:text-red-400 mt-0.5"><strong>Reason:</strong> {hub.rejectionReason}</p>
                        <p className="text-xs text-red-500 dark:text-red-400/60 mt-1.5">Please fix the issues below and resubmit.</p>
                    </div>
                </div>
            )}

            {/* ── Alert: Pending ── */}
            {isPending && (
                <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/30 rounded-2xl p-5 flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                    <div>
                        <p className="text-sm font-black text-amber-800 dark:text-amber-300">Under Admin Review</p>
                        <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">Your hub is awaiting administrator approval. You will receive a notification once a decision is made.</p>
                    </div>
                </div>
            )}

            {/* ── Step Progress (only for new hub creation) ── */}
            {isUnassigned && (
                <div className="flex items-center gap-0">
                    {[1, 2, 3].map((s, i) => (
                        <div key={s} className="flex items-center">
                            <div className="flex flex-col items-center gap-1">
                                <StepIndicator step={s} current={step} />
                                <span className={`text-[10px] font-bold uppercase tracking-wider ${step === s ? 'text-blue-600' : 'text-muted-foreground'}`}>
                                    {s === 1 ? 'Details' : s === 2 ? 'Documents' : 'Submitted'}
                                </span>
                            </div>
                            {i < 2 && <div className={`h-0.5 w-12 sm:w-24 mx-2 mb-5 rounded ${step > s ? 'bg-blue-600' : 'bg-muted'}`} />}
                        </div>
                    ))}
                </div>
            )}

            {/* ══════════════════════════════════════════════════════════════ */}
            {/* STEP 1: Hub Details                                           */}
            {/* ══════════════════════════════════════════════════════════════ */}
            {(step === 1 || isExistingHub) && (
                <form onSubmit={handleDetailsSubmit} className="space-y-6 text-foreground">
                    <div className="bg-background rounded-2xl border border-border shadow-sm p-8 space-y-6">
                        <p className="text-xs font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                            <Info className="h-3 w-3" /> Hub Information
                        </p>

                        <div className="grid grid-cols-1 gap-4">
                            <div>
                                <label className="text-xs font-bold text-muted-foreground mb-1.5 block">Hub Name *</label>
                                <input
                                    type="text" required
                                    placeholder="e.g. Koramangala Express Hub"
                                    className="w-full bg-muted/30 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500 border border-border transition-all"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-muted-foreground mb-1.5 block">Description</label>
                                <textarea
                                    rows={3}
                                    placeholder="Brief description: services, accessibility, features..."
                                    className="w-full bg-muted/30 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500 border border-border resize-none transition-all"
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-bold text-muted-foreground mb-1.5 flex items-center gap-1.5">
                                    <Clock className="h-3 w-3" /> Operating Hours *
                                </label>
                                <input
                                    type="text" required
                                    placeholder="e.g. 9AM – 9PM"
                                    className="w-full bg-muted/30 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500 border border-border"
                                    value={formData.operatingHours}
                                    onChange={e => setFormData({ ...formData, operatingHours: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-muted-foreground mb-1.5 flex items-center gap-1.5">
                                    <Box className="h-3 w-3" /> Max Capacity *
                                </label>
                                <input
                                    type="number" required min={1}
                                    className="w-full bg-muted/30 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500 border border-border"
                                    value={formData.capacity}
                                    onChange={e => setFormData({ ...formData, capacity: parseInt(e.target.value) || 0 })}
                                />
                            </div>
                        </div>

                        {/* Location */}
                        <div>
                            <label className="text-xs font-bold text-muted-foreground mb-1.5 flex items-center gap-1.5">
                                <MapPin className="h-3 w-3" /> Hub Location *
                            </label>
                            {(!hub?.lat || !hub?.lng || isUnassigned) ? (
                                <LocationPicker
                                    placeholder="Search for your hub's address..."
                                    onLocationSelect={handleLocationSelect}
                                    onLocationData={handleLocationData}
                                />
                            ) : (
                                <div className="p-4 bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-xl flex items-start gap-2.5">
                                    <Info className="h-4 w-4 text-blue-500 flex-shrink-0 mt-0.5" />
                                    <p className="text-xs text-blue-700 dark:text-blue-300 font-medium">Location is fixed. Contact admin to change it.</p>
                                </div>
                            )}
                            {formData.address && (
                                <div className="mt-3 p-3 bg-muted/30 rounded-xl border border-border">
                                    <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider mb-0.5">Selected Address</p>
                                    <p className="text-sm font-medium text-foreground">{formData.address}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Next / Save */}
                    {isUnassigned ? (
                        <button
                            type="submit" disabled={createMutation.isPending}
                            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold py-4 rounded-2xl shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-2"
                        >
                            {createMutation.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : null}
                            Continue to Documents →
                        </button>
                    ) : (
                        <div className="flex gap-3">
                            <button
                                type="submit"
                                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-2xl shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-2"
                                onClick={() => setStep(2)}
                            >
                                Update Details & Upload Docs →
                            </button>
                        </div>
                    )}
                </form>
            )}

            {/* ══════════════════════════════════════════════════════════════ */}
            {/* STEP 2: Upload Documents                                      */}
            {/* ══════════════════════════════════════════════════════════════ */}
            {step === 2 && (
                <form onSubmit={handleFinalSubmit} className="space-y-6 text-foreground">
                    <div className="bg-background rounded-2xl border border-border shadow-sm p-8 space-y-8">
                        <p className="text-xs font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                            <Upload className="h-3 w-3" /> Hub Photos & Verification Documents
                        </p>
                        <p className="text-xs text-muted-foreground -mt-6">These help the admin verify your hub. Photos and PDFs accepted, max 10MB each.</p>

                        {/* Shop Photo */}
                        <div className="space-y-3">
                            <p className="text-sm font-bold text-foreground flex items-center gap-2">
                                <ImageIcon className="h-4 w-4 text-blue-500" /> Shop / Hub Photo
                            </p>
                            {shopPhotoPreview ? (
                                <div className="relative">
                                    <img src={shopPhotoPreview} alt="Shop" className="w-full h-52 object-cover rounded-2xl border border-border" />
                                    <button
                                        type="button"
                                        onClick={() => { setShopPhotoPreview(null); setShopPhotoFile(null); }}
                                        className="absolute top-3 right-3 bg-background rounded-full p-1.5 shadow-md hover:bg-red-50 dark:hover:bg-red-900/20 transition"
                                    >
                                        <X className="h-4 w-4 text-red-500" />
                                    </button>
                                    {shopPhotoFile && <div className="absolute bottom-3 left-3 bg-green-600 text-white text-[10px] font-black px-3 py-1 rounded-full">New photo selected</div>}
                                </div>
                            ) : (
                                <button
                                    type="button"
                                    onClick={() => shopPhotoRef.current?.click()}
                                    className="w-full border-2 border-dashed border-border hover:border-blue-400 rounded-2xl p-10 flex flex-col items-center gap-3 text-muted-foreground hover:text-blue-500 transition-all"
                                >
                                    <Upload className="h-8 w-8" />
                                    <span className="text-sm font-bold">Click to upload hub photo</span>
                                    <span className="text-xs">JPG, PNG, WEBP — max 10MB</span>
                                </button>
                            )}
                            <input ref={shopPhotoRef} type="file" accept="image/*" className="hidden" onChange={handleShopPhotoChange} />
                        </div>

                        {/* Verification Documents */}
                        <div className="space-y-3">
                            <p className="text-sm font-bold text-foreground flex items-center gap-2">
                                <FileText className="h-4 w-4 text-blue-500" /> Verification Documents
                                <span className="text-xs font-normal text-muted-foreground">(up to 5 files)</span>
                            </p>
                            <button
                                type="button"
                                onClick={() => docsRef.current?.click()}
                                disabled={documentFiles.length >= 5}
                                className="w-full border-2 border-dashed border-border hover:border-blue-400 disabled:opacity-40 disabled:cursor-not-allowed rounded-2xl p-6 flex flex-col items-center gap-2 text-muted-foreground hover:text-blue-500 transition-all"
                            >
                                <FileText className="h-6 w-6" />
                                <span className="text-sm font-bold">Add documents</span>
                                <span className="text-xs">Business license, ownership proof, ID, etc.</span>
                            </button>
                            <input ref={docsRef} type="file" accept="image/*,.pdf" multiple className="hidden" onChange={handleDocumentsChange} />

                            {documentFiles.map((f, i) => (
                                <div key={i} className="flex items-center justify-between bg-muted/30 border border-border rounded-xl px-4 py-2.5">
                                    <div className="flex items-center gap-2 min-w-0">
                                        <FileText className="h-4 w-4 text-blue-500 flex-shrink-0" />
                                        <span className="text-xs font-bold text-foreground truncate">{f.name}</span>
                                        <span className="text-[10px] text-muted-foreground flex-shrink-0">{(f.size / 1024 / 1024).toFixed(1)}MB</span>
                                    </div>
                                    <button type="button" onClick={() => setDocumentFiles(prev => prev.filter((_, j) => j !== i))}>
                                        <X className="h-4 w-4 text-muted-foreground hover:text-red-500 transition" />
                                    </button>
                                </div>
                            ))}

                            {documentsList.length > 0 && (
                                <div className="space-y-2">
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Previously Uploaded</p>
                                    {documentsList.map((url, i) => (
                                        <a key={i} href={url} target="_blank" rel="noreferrer"
                                            className="flex items-center gap-2 bg-green-50 border border-green-100 rounded-xl px-4 py-2.5 hover:bg-green-100 transition">
                                            <FileText className="h-4 w-4 text-green-500" />
                                            <span className="text-xs font-bold text-green-700">Document {i + 1} (click to view)</span>
                                        </a>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={() => setStep(1)}
                            className="px-6 py-4 bg-muted hover:bg-muted/80 text-muted-foreground font-bold rounded-2xl transition"
                        >
                            ← Back
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold py-4 rounded-2xl shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-2"
                        >
                            {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                            {isSubmitting ? 'Submitting...' : 'Submit for Admin Review'}
                        </button>
                    </div>
                </form>
            )}

            {/* ══════════════════════════════════════════════════════════════ */}
            {/* STEP 3: Submitted / Overview                                  */}
            {/* ══════════════════════════════════════════════════════════════ */}
            {step === 3 && isExistingHub && (
                <div className="space-y-6">
                    {/* Quick summary card */}
                    <div className="bg-background rounded-2xl border border-border shadow-sm p-8 space-y-5 text-foreground">
                        <p className="text-xs font-black text-muted-foreground uppercase tracking-widest">Hub Summary</p>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-muted/30 rounded-2xl p-4">
                                <p className="text-[10px] text-muted-foreground font-black uppercase tracking-wider mb-1">Hub Name</p>
                                <p className="text-sm font-bold text-foreground">{hub.name}</p>
                            </div>
                            <div className="bg-muted/30 rounded-2xl p-4">
                                <p className="text-[10px] text-muted-foreground font-black uppercase tracking-wider mb-1">Status</p>
                                <p className={`text-sm font-black capitalize ${hubStatus === 'active' ? 'text-green-600' : hubStatus === 'rejected' ? 'text-red-600' : 'text-amber-600'}`}>
                                    {hubStatus}
                                </p>
                            </div>
                            <div className="bg-muted/30 rounded-2xl p-4">
                                <p className="text-[10px] text-muted-foreground font-black uppercase tracking-wider mb-1">Operating Hours</p>
                                <p className="text-sm font-bold text-foreground">{hub.operatingHours || '—'}</p>
                            </div>
                            <div className="bg-muted/30 rounded-2xl p-4">
                                <p className="text-[10px] text-muted-foreground font-black uppercase tracking-wider mb-1">Capacity</p>
                                <p className="text-sm font-bold text-foreground">{hub.capacity} parcels</p>
                            </div>
                        </div>
                        {hub.address && (
                            <div className="bg-muted/30 rounded-2xl p-4 flex items-start gap-2.5">
                                <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                                <p className="text-sm font-medium text-muted-foreground">{hub.address}</p>
                            </div>
                        )}
                        {hub.shopPhoto && (
                            <img src={hub.shopPhoto} alt="Hub" className="w-full h-40 object-cover rounded-2xl border border-border" />
                        )}
                    </div>

                    {/* Update / Re-submit button */}
                    <button
                        onClick={() => setStep(1)}
                        className="w-full bg-slate-800 dark:bg-slate-700 hover:bg-slate-900 dark:hover:bg-slate-600 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 transition"
                    >
                        <RefreshCw className="h-5 w-5" />
                        {isRejected ? 'Update & Resubmit' : 'Edit Hub Profile'}
                    </button>
                </div>
            )}

            {/* ── Info box ── */}
            <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-2xl p-5">
                <p className="text-sm font-bold text-blue-900 dark:text-blue-300 mb-1">How it works</p>
                <ol className="text-xs text-blue-700 dark:text-blue-400/80 space-y-1 list-decimal list-inside leading-relaxed">
                    <li>Fill in your hub details and location</li>
                    <li>Upload a shop photo and verification documents</li>
                    <li>Submit — an admin will review within 24–48 hours</li>
                    <li>You'll receive an in-app notification with the decision</li>
                </ol>
            </div>
        </div>
    );
}
