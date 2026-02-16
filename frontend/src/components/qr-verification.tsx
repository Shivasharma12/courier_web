'use client';

import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { CheckCircle, XCircle, ShieldCheck, Loader2 } from 'lucide-react';
import api from '@/lib/api-client';
import { toast } from 'sonner';

interface QRVerificationProps {
    handoverId: string;
    verifyCode?: string; // Optional: if provided, this side IS the one showing the QR
    onSuccess?: () => void;
    onCancel?: () => void;
    title?: string;
    role: 'sender' | 'receiver';
}

export default function QRVerification({
    handoverId,
    verifyCode,
    onSuccess,
    onCancel,
    title = "Handover Verification",
    role
}: QRVerificationProps) {
    const [inputCode, setInputCode] = useState('');
    const [loading, setLoading] = useState(false);

    const handleVerify = async () => {
        if (!inputCode) return;
        setLoading(true);
        try {
            await api.post(`/handovers/${handoverId}/verify`, { code: inputCode });
            toast.success('Verification successful!');
            if (onSuccess) onSuccess();
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Invalid verification code');
        } finally {
            setLoading(false);
        }
    };

    const qrValue = JSON.stringify({ handoverId, code: verifyCode });

    return (
        <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-2xl flex flex-col items-center gap-8 max-w-sm mx-auto">
            <div className="text-center space-y-2">
                <div className="bg-blue-50 p-3 rounded-2xl inline-block">
                    <ShieldCheck className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-black text-slate-900 leading-tight">{title}</h3>
                <p className="text-xs text-slate-400 font-medium uppercase tracking-widest">
                    {role === 'sender' ? 'Show this to the receiver' : 'Enter the code from the sender'}
                </p>
            </div>

            {role === 'sender' && verifyCode ? (
                <div className="space-y-6 flex flex-col items-center w-full">
                    <div className="bg-white p-6 rounded-[2rem] shadow-xl shadow-slate-100 border border-slate-50 relative group">
                        <QRCodeSVG
                            value={qrValue}
                            size={200}
                            className="transition-transform group-hover:scale-105"
                        />
                        <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[10px] font-black px-4 py-1.5 rounded-full shadow-lg">
                            VERIFICATION QR
                        </div>
                    </div>
                    <div className="text-center">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Backup Code</p>
                        <p className="text-3xl font-black text-blue-600 tracking-[0.5em]">{verifyCode}</p>
                    </div>
                </div>
            ) : (
                <div className="space-y-6 w-full text-slate-900">
                    <div className="space-y-2">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Enter 6-Digit Code</p>
                        <input
                            type="text"
                            maxLength={6}
                            placeholder="000 000"
                            className="w-full bg-slate-50 border-0 rounded-2xl px-6 py-5 text-2xl font-black text-blue-600 text-center tracking-[0.5em] outline-none focus:ring-4 focus:ring-blue-500/10 transition-all placeholder:tracking-normal placeholder:opacity-30"
                            value={inputCode}
                            onChange={(e) => setInputCode(e.target.value)}
                        />
                    </div>
                    <button
                        onClick={handleVerify}
                        disabled={loading || inputCode.length < 6}
                        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-100 disabled:text-slate-400 text-white font-black py-4 rounded-2xl shadow-xl shadow-blue-100 transition-all flex items-center justify-center gap-2 active:scale-95"
                    >
                        {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <CheckCircle className="h-5 w-5" />}
                        VERIFY HANDOVER
                    </button>
                </div>
            )}

            <button
                onClick={onCancel}
                className="text-xs font-bold text-slate-400 hover:text-red-500 transition-colors uppercase tracking-widest flex items-center gap-2"
            >
                <XCircle className="h-4 w-4" />
                Cancel Process
            </button>
        </div>
    );
}
