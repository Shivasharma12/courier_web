'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api-client';
import { Package2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function RegisterPage() {
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        name: '',
        phone: '',
        role: 'customer',
    });
    const [enableDualRole, setEnableDualRole] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
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
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 py-12">
            <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-2xl shadow-xl border border-slate-100">
                <div className="text-center">
                    <div className="flex justify-center">
                        <div className="bg-blue-600 p-3 rounded-xl shadow-lg shadow-blue-200">
                            <Package2 className="h-8 w-8 text-white" />
                        </div>
                    </div>
                    <h2 className="mt-6 text-3xl font-extrabold text-slate-900 tracking-tight">Create Account</h2>
                    <p className="mt-2 text-sm text-slate-500">Join our delivery network</p>
                </div>

                <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
                    {error && (
                        <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg border border-red-100">
                            {error}
                        </div>
                    )}
                    <div className="space-y-4">
                        <div>
                            <label className="text-sm font-medium text-slate-700 block mb-1">Full Name</label>
                            <input
                                type="text"
                                required
                                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                placeholder="John Doe"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium text-slate-700 block mb-1">Email Address</label>
                            <input
                                type="email"
                                required
                                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                placeholder="name@company.com"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium text-slate-700 block mb-1">Phone Number</label>
                            <input
                                type="tel"
                                required
                                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                placeholder="+1 234 567 890"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium text-slate-700 block mb-1">Choose Your Role</label>
                            <select
                                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all bg-white font-medium"
                                value={formData.role}
                                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                            >
                                <option value="customer">Customer (Sender)</option>
                                <option value="traveler">Traveler</option>
                                <option value="both">⚡ Sender + Traveler (Both)</option>
                                <option value="hub_manager">Hub Manager</option>
                            </select>
                            {formData.role === 'both' && (
                                <p className="text-xs text-blue-600 mt-1 font-medium">
                                    ✅ You will have access to both Sender and Traveler dashboards
                                </p>
                            )}
                        </div>
                        <div>
                            <label className="text-sm font-medium text-slate-700 block mb-1">Password</label>
                            <input
                                type="password"
                                required
                                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                placeholder="••••••••"
                                autoComplete="new-password"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-xl transition-all shadow-lg shadow-blue-200 flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed mt-4"
                    >
                        {loading ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : null}
                        Create Account
                    </button>

                    <p className="text-center text-sm text-slate-600">
                        Already have an account?{' '}
                        <a href="/login" className="font-medium text-blue-600 hover:text-blue-500 underline underline-offset-4">
                            Sign in
                        </a>
                    </p>
                </form>
            </div>
        </div>
    );
}
