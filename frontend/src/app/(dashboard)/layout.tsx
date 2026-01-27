'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import DashboardSidebar from '@/components/dashboard-sidebar';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { token, _hasHydrated } = useAuthStore();
    const router = useRouter();

    useEffect(() => {
        if (_hasHydrated && !token) {
            router.push('/login');
        }
    }, [_hasHydrated, token, router]);

    if (!_hasHydrated || !token) return null;

    return (
        <div className="flex bg-slate-50 min-h-screen">
            <DashboardSidebar />
            <main className="flex-1 p-8 overflow-y-auto max-h-screen">
                <div className="max-w-7xl mx-auto">
                    {children}
                </div>
            </main>
        </div>
    );
}
