'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api-client';
import { Package2, Loader2, Plane, Zap, CheckCircle2, Building2, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';

export default function RegisterPage() {
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        name: '',
        phone: '',
        role: 'customer',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [isRoleOpen, setIsRoleOpen] = useState(false);
    const router = useRouter();

    const roles = [
        {
            id: 'customer',
            title: 'Customer (Sender)',
            description: 'Send parcels safely and track them in real-time.',
            icon: Package2,
        },
        {
            id: 'traveler',
            title: 'Traveler',
            description: 'Earn by delivering parcels on your existing routes.',
            icon: Plane,
        },
        {
            id: 'both',
            title: 'Dual Mode (Sender + Traveler)',
            description: 'Full access to both sending and delivering roles.',
            icon: Zap,
            isRecommended: true
        },
        {
            id: 'hub_manager',
            title: 'Hub Manager',
            description: 'Manage hub inventory and coordinate local logistics.',
            icon: Building2,
        }
    ];

    const selectedRole = roles.find(r => r.id === formData.role) || roles[0];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (formData.phone.length !== 10) {
            setError('Please enter a valid 10-digit Indian phone number');
            toast.error('Invalid phone number');
            return;
        }

        setLoading(true);
        setError('');
        try {
            const { role, ...rest } = formData;
            const payload = role === 'both'
                ? { ...rest, role: 'customer', roles: ['customer', 'traveler'] }
                : { ...rest, role, roles: [role] };

            await api.post('/auth/register', payload);
            toast.success('Account created! Please sign in.');
            router.push('/login');
        } catch (err: any) {
            const msg = err.response?.data?.message || 'Registration failed';
            setError(msg);
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4 py-12 font-sans">
            <div className="max-w-xl w-full space-y-8 bg-white dark:bg-slate-900 p-8 md:p-10 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 transition-all duration-300">
                <div className="text-center space-y-3">
                    <div className="flex justify-center">
                        <div className="bg-blue-600 p-3.5 rounded-2xl shadow-xl shadow-blue-500/20 group hover:scale-110 transition-transform duration-300">
                            <Package2 className="h-9 w-9 text-white" />
                        </div>
                    </div>
                    <div className="space-y-1">
                        <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Create Account</h2>
                        <p className="text-slate-500 dark:text-slate-400 font-medium tracking-tight">Join the next generation of parcel delivery</p>
                    </div>
                </div>

                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    {error && (
                        <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm p-4 rounded-xl border border-red-100 dark:border-red-800/50 flex items-center gap-3 animate-in fade-in slide-in-from-top-1 duration-300">
                            <span className="h-2 w-2 rounded-full bg-red-500 shrink-0" />
                            {error}
                        </div>
                    )}

                    <div className="space-y-5">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div className="space-y-1.5">
                                <label className="text-[11px] uppercase tracking-widest font-bold text-slate-400 dark:text-slate-500 ml-1">Full Name</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full px-5 py-3.5 rounded-2xl border-2 border-slate-50 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all duration-200"
                                    placeholder="Enter your name"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[11px] uppercase tracking-widest font-bold text-slate-400 dark:text-slate-500 ml-1">Phone Number</label>
                                <input
                                    type="tel"
                                    required
                                    maxLength={10}
                                    className="w-full px-5 py-3.5 rounded-2xl border-2 border-slate-50 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all duration-200"
                                    placeholder="9876543210"
                                    value={formData.phone}
                                    onChange={(e) => {
                                        const value = e.target.value.replace(/\D/g, '');
                                        if (value.length <= 10) {
                                            setFormData({ ...formData, phone: value });
                                        }
                                    }}
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[11px] uppercase tracking-widest font-bold text-slate-400 dark:text-slate-500 ml-1">Email Address</label>
                            <input
                                type="email"
                                required
                                className="w-full px-5 py-3.5 rounded-2xl border-2 border-slate-50 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all duration-200"
                                placeholder="name@company.com"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            />
                        </div>

                        <div className="space-y-1.5 relative">
                            <label className="text-[11px] uppercase tracking-widest font-bold text-slate-400 dark:text-slate-500 ml-1">Choose Your Experience</label>
                            <button
                                type="button"
                                onClick={() => setIsRoleOpen(!isRoleOpen)}
                                className={`w-full flex items-center justify-between px-5 py-4 rounded-2xl border-2 transition-all duration-300 outline-none group bg-slate-50/50 dark:bg-slate-800/50 ${isRoleOpen ? 'border-blue-500 ring-4 ring-blue-500/10' : 'border-slate-50 dark:border-slate-800'
                                    }`}
                            >
                                <div className="flex items-center gap-4">
                                    <div className="p-2.5 rounded-xl bg-blue-500 text-white shadow-lg shadow-blue-500/20 group-hover:scale-110 transition-transform duration-300">
                                        <selectedRole.icon className="h-5 w-5" />
                                    </div>
                                    <div className="text-left">
                                        <p className="text-sm font-bold text-slate-900 dark:text-white">{selectedRole.title}</p>
                                        <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium line-clamp-1">{selectedRole.description}</p>
                                    </div>
                                </div>
                                <ChevronDown className={`h-5 w-5 text-slate-400 transition-transform duration-500 ease-out ${isRoleOpen ? 'rotate-180' : ''}`} />
                            </button>

                            {isRoleOpen && (
                                <div className="absolute z-50 top-full mt-3 w-full bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-300">
                                    <div className="p-2 space-y-1">
                                        {roles.map((role) => (
                                            <button
                                                key={role.id}
                                                type="button"
                                                onClick={() => {
                                                    setFormData({ ...formData, role: role.id });
                                                    setIsRoleOpen(false);
                                                }}
                                                className={`w-full flex items-center justify-between p-4 rounded-xl transition-all duration-200 ${formData.role === role.id
                                                    ? 'bg-blue-600 text-white shadow-xl shadow-blue-600/20'
                                                    : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-900 dark:text-white'
                                                    }`}
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className={`p-2 rounded-lg transition-colors ${formData.role === role.id ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                                                        <role.icon className="h-4 w-4" />
                                                    </div>
                                                    <div className="text-left">
                                                        <div className="flex items-center gap-2">
                                                            <p className="text-sm font-bold leading-none">{role.title}</p>
                                                            {role.isRecommended && (
                                                                <span className={`text-[9px] px-2 py-0.5 rounded-full font-black uppercase tracking-tighter ${formData.role === role.id ? 'bg-white text-blue-600' : 'bg-amber-500/10 text-amber-500'}`}>Recommended</span>
                                                            )}
                                                        </div>
                                                        <p className={`text-[10px] mt-1 font-medium ${formData.role === role.id ? 'text-blue-50' : 'text-slate-500'}`}>{role.description}</p>
                                                    </div>
                                                </div>
                                                {formData.role === role.id && <CheckCircle2 className="h-5 w-5 animate-in zoom-in duration-300" />}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[11px] uppercase tracking-widest font-bold text-slate-400 dark:text-slate-500 ml-1">Password</label>
                            <input
                                type="password"
                                required
                                className="w-full px-5 py-3.5 rounded-2xl border-2 border-slate-50 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all duration-200"
                                placeholder="Create a secure password"
                                autoComplete="new-password"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="pt-2">
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-4.5 rounded-2xl transition-all duration-300 shadow-xl shadow-blue-500/25 active:scale-[0.98] disabled:opacity-70 flex items-center justify-center group"
                        >
                            {loading ? (
                                <Loader2 className="h-5 w-5 animate-spin mr-3 text-white/70" />
                            ) : null}
                            <span className="text-lg tracking-tight">Register Account</span>
                        </button>
                    </div>

                    <p className="text-center text-sm font-medium text-slate-500 dark:text-slate-400">
                        Already have an account?{' '}
                        <a href="/login" className="text-blue-600 hover:text-blue-500 font-bold underline decoration-2 underline-offset-4 decoration-blue-500/20 hover:decoration-blue-500/50 transition-all duration-300">
                            Sign in instead
                        </a>
                    </p>
                </form>
            </div>
        </div>
    );
}
