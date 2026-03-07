'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api-client';
import { useAuthStore } from '@/store/auth-store';
import {
    User, Mail, Phone, Shield, Loader2, Save,
    CheckCircle2, AlertCircle, Camera, BadgeCheck
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

function PasswordChangeForm() {
    const [passwords, setPasswords] = useState({
        oldPassword: '',
        newPassword: '',
        confirmPassword: '',
    });

    const mutation = useMutation({
        mutationFn: (data: any) => api.patch('/users/change-password', data),
        onSuccess: () => {
            toast.success('Password updated successfully!');
            setPasswords({ oldPassword: '', newPassword: '', confirmPassword: '' });
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.message || 'Failed to change password');
        }
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (passwords.newPassword !== passwords.confirmPassword) {
            toast.error('New passwords do not match');
            return;
        }
        mutation.mutate({
            oldPassword: passwords.oldPassword,
            newPassword: passwords.newPassword,
        });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6 max-w-xl">
            <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest pl-1">Current Password</label>
                <div className="relative">
                    <Shield className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                        type="password"
                        value={passwords.oldPassword}
                        onChange={(e) => setPasswords({ ...passwords, oldPassword: e.target.value })}
                        className="w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-bold text-slate-900 dark:text-white"
                        placeholder="••••••••"
                        required
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <label className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest pl-1">New Password</label>
                    <input
                        type="password"
                        value={passwords.newPassword}
                        onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
                        className="w-full px-4 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-bold text-slate-900 dark:text-white"
                        placeholder="••••••••"
                        required
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest pl-1">Confirm New Password</label>
                    <input
                        type="password"
                        value={passwords.confirmPassword}
                        onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })}
                        className="w-full px-4 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-bold text-slate-900 dark:text-white"
                        placeholder="••••••••"
                        required
                    />
                </div>
            </div>

            <button
                type="submit"
                disabled={mutation.isPending}
                className="w-full md:w-auto px-10 py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black rounded-2xl shadow-xl transition-all flex items-center justify-center gap-2 hover:-translate-y-0.5 disabled:opacity-50"
            >
                {mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {mutation.isPending ? 'Updating...' : 'Update Password'}
            </button>
        </form>
    );
}

export default function ProfilePage() {
    const queryClient = useQueryClient();
    const { user, patchUser } = useAuthStore();

    const [formData, setFormData] = useState({
        name: user?.name || '',
        phone: user?.phone || '',
    });

    useEffect(() => {
        if (user) {
            setFormData({
                name: user.name || '',
                phone: user.phone || '',
            });
        }
    }, [user]);

    const updateProfile = useMutation({
        mutationFn: (updates: any) => api.patch('/users/profile', updates),
        onSuccess: (res) => {
            patchUser(res.data);
            queryClient.invalidateQueries({ queryKey: ['profile'] });
            toast.success('Profile updated successfully!');
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.message || 'Failed to update profile');
        }
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        updateProfile.mutate(formData);
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="flex items-center gap-6">
                    <div className="relative group">
                        <div className="h-24 w-24 rounded-[2rem] bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-xl shadow-blue-500/20 border-4 border-white dark:border-slate-900 overflow-hidden">
                            <User className="h-10 w-10" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                                <Camera className="h-5 w-5 text-white" />
                            </div>
                        </div>
                        <div className="absolute -bottom-1 -right-1 bg-green-500 p-1.5 rounded-full border-2 border-white dark:border-slate-900 shadow-lg">
                            <BadgeCheck className="h-4 w-4 text-white" />
                        </div>
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight leading-none mb-2">{user?.name}</h1>
                        <div className="flex items-center gap-2">
                            <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full text-[10px] font-black uppercase tracking-wider">
                                {user?.role?.replace('_', ' ')}
                            </span>
                            <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">Member since {new Date().getFullYear()}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Profile Form */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-8 shadow-sm">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                                <User className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                            </div>
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Personal Information</h2>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest pl-1">Full Name</label>
                                    <div className="relative group">
                                        <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                                        <input
                                            type="text"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            className="w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-bold text-slate-900 dark:text-white"
                                            placeholder="Your full name"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest pl-1">Phone Number</label>
                                    <div className="relative group">
                                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                                        <input
                                            type="tel"
                                            value={formData.phone}
                                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                            className="w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-bold text-slate-900 dark:text-white"
                                            placeholder="e.g. +91 9876543210"
                                            required
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest pl-1">Email Address</label>
                                <div className="relative group opacity-60">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                    <input
                                        type="email"
                                        value={user?.email || ''}
                                        readOnly
                                        className="w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 cursor-not-allowed font-bold text-slate-500 dark:text-slate-400"
                                    />
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                        <Shield className="h-4 w-4 text-slate-400" />
                                    </div>
                                </div>
                                <p className="text-[10px] text-slate-400 dark:text-slate-500 pl-1 font-medium italic">Email cannot be changed for security reasons.</p>
                            </div>

                            <div className="pt-4">
                                <button
                                    type="submit"
                                    disabled={updateProfile.isPending}
                                    className="w-full md:w-auto px-10 py-4 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-2xl shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-2 hover:-translate-y-0.5 disabled:opacity-50"
                                >
                                    {updateProfile.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                    {updateProfile.isPending ? 'Saving Changes...' : 'Save Profile Changes'}
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* Change Password Section */}
                    <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-8 shadow-sm transition-all duration-300">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl">
                                <Shield className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                            </div>
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Security & Password</h2>
                        </div>
                        <PasswordChangeForm />
                    </div>
                </div>

                {/* Sidebar Cards */}
                <div className="space-y-6">
                    {/* Account Status */}
                    <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[2.5rem] p-8 text-white shadow-xl shadow-blue-500/10">
                        <div className="flex items-start justify-between mb-8">
                            <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-md">
                                <Shield className="h-6 w-6 text-white" />
                            </div>
                            <div className="flex items-center gap-1.5 px-3 py-1 bg-green-500/20 backdrop-blur-md border border-green-500/30 rounded-full">
                                <div className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
                                <span className="text-[10px] font-black uppercase tracking-wider">Secure</span>
                            </div>
                        </div>
                        <h3 className="text-xl font-bold mb-2">Account Security</h3>
                        <p className="text-blue-100 text-xs font-medium leading-relaxed mb-6">Your profile data is protected with end-to-end encryption and multi-layer verification protocols.</p>
                        <div className="space-y-3">
                            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-blue-200">
                                <CheckCircle2 className="h-4 w-4 text-green-400" /> Identity Verified
                            </div>
                            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-blue-200">
                                <CheckCircle2 className="h-4 w-4 text-green-400" /> Phone Linked
                            </div>
                        </div>
                    </div>

                    {/* Support Box */}
                    <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-8 shadow-sm">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-amber-50 dark:bg-amber-900/20 rounded-xl">
                                <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Need Help?</h3>
                        </div>
                        <p className="text-slate-500 dark:text-slate-400 text-xs font-medium leading-relaxed mb-6">If you need to change your email or have issues with your account, please contact our support team.</p>
                        <button className="w-full py-3 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                            Contact Support
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
