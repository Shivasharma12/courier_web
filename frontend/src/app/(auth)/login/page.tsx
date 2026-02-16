'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import api from '@/lib/api-client';
import { Package2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const router = useRouter();
    const { setAuth, token, _hasHydrated, user } = useAuthStore();

    useEffect(() => {
        if (_hasHydrated && token && user) {
            const role = user.role;
            if (role === 'admin') router.replace('/admin');
            else if (role === 'customer') router.replace('/customer');
            else if (role === 'traveler') router.replace('/traveler');
            else if (role === 'delivery_partner') router.replace('/delivery');
            else if (role === 'hub_manager') router.replace('/hub');
        }
    }, [_hasHydrated, token, user, router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const { data } = await api.post('/auth/login', { email, password });
            setAuth(data.user, data.access_token);
            toast.success('Welcome back!');

            // Redirect based on role
            const role = data.user.role;
            if (role === 'admin') router.replace('/admin');
            else if (role === 'customer') router.replace('/customer');
            else if (role === 'traveler') router.replace('/traveler');
            else if (role === 'delivery_partner') router.replace('/delivery');
            else if (role === 'hub_manager') router.replace('/hub');
        } catch (err: any) {
            const msg = err.response?.data?.message || 'Login failed';
            setError(msg);
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
            <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-2xl shadow-xl border border-slate-100">
                <div className="text-center">
                    <div className="flex justify-center">
                        <div className="bg-blue-600 p-3 rounded-xl shadow-lg shadow-blue-200">
                            <Package2 className="h-8 w-8 text-white" />
                        </div>
                    </div>
                    <h2 className="mt-6 text-3xl font-extrabold text-slate-900 tracking-tight">Welcome Back</h2>
                    <p className="mt-2 text-sm text-slate-500">Sign in to your account</p>
                </div>

                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    {error && (
                        <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg border border-red-100">
                            {error}
                        </div>
                    )}
                    <div className="space-y-4">
                        <div>
                            <label className="text-sm font-medium text-slate-700 block mb-1">Email Address</label>
                            <input
                                type="email"
                                required
                                autoComplete="email"
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                placeholder="name@company.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium text-slate-700 block mb-1">Password</label>
                            <input
                                type="password"
                                required
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                placeholder="••••••••"
                                autoComplete="current-password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-xl transition-all shadow-lg shadow-blue-200 flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {loading ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : null}
                        Sign In
                    </button>

                    <p className="text-center text-sm text-slate-600">
                        Don't have an account?{' '}
                        <a href="/register" className="font-medium text-blue-600 hover:text-blue-500 underline underline-offset-4">
                            Register now
                        </a>
                    </p>
                </form>
            </div>
        </div>
    );
}
