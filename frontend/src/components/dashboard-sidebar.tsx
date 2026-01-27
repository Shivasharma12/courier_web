'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import {
    BarChart3,
    Package,
    Truck,
    MapPin,
    User,
    LogOut,
    LayoutDashboard,
    Settings,
    PlusCircle,
    History,
    Box,
    Menu,
    X
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function DashboardSidebar() {
    const pathname = usePathname();
    const router = useRouter();
    const logout = useAuthStore((state) => state.logout);
    const user = useAuthStore((state) => state.user);

    const [isOpen, setIsOpen] = useState(false);

    // Close menu when route changes
    useEffect(() => {
        setIsOpen(false);
    }, [pathname]);

    const getMenuByType = () => {
        switch (user?.role) {
            case 'admin':
                return [
                    { name: 'Analytics', href: '/admin', icon: BarChart3 },
                    { name: 'User Management', href: '/admin/users', icon: User },
                    { name: 'Hubs', href: '/admin/hubs', icon: MapPin },
                    { name: 'Travel Plans', href: '/admin/travel-plans', icon: Truck },
                    { name: 'Parcels', href: '/admin/parcels', icon: Package },
                    { name: 'Pricing Rules', href: '/admin/pricing', icon: Settings },
                ];
            case 'customer':
                return [
                    { name: 'Overview', href: '/customer', icon: LayoutDashboard },
                    { name: 'Create Parcel', href: '/customer/create', icon: PlusCircle },
                    { name: 'My Parcels', href: '/customer/history', icon: History },
                    { name: 'Tracking', href: '/customer/track', icon: MapPin },
                ];
            case 'traveler':
                return [
                    { name: 'Dashboard', href: '/traveler', icon: LayoutDashboard },
                    { name: 'Post Route', href: '/traveler/post-route', icon: PlusCircle },
                    { name: 'View Matches', href: '/traveler/matches', icon: Package },
                    { name: 'My Deliveries', href: '/traveler/deliveries', icon: Truck },
                ];
            case 'delivery_partner':
                return [
                    { name: 'Dashboard', href: '/delivery', icon: LayoutDashboard },
                    { name: 'Active Orders', href: '/delivery/active', icon: Truck },
                    { name: 'Earnings', href: '/delivery/earnings', icon: Box },
                ];
            case 'hub_manager':
                return [
                    { name: 'Hub Status', href: '/hub', icon: LayoutDashboard },
                    { name: 'Inventory', href: '/hub/inventory', icon: Package },
                    { name: 'Dispatch', href: '/hub/dispatch', icon: Truck },
                ];
            default:
                return [];
        }
    };

    const currentMenu = getMenuByType();

    const handleLogout = () => {
        logout();
        router.replace('/login');
    };

    return (
        <>
            {/* Mobile Toggle Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="lg:hidden fixed top-4 right-4 z-50 p-2 bg-slate-900 text-white rounded-lg shadow-lg hover:bg-slate-800 transition-colors"
            >
                {isOpen ? (
                    <X className="h-6 w-6" />
                ) : (
                    <Menu className="h-6 w-6" />
                )}
            </button>

            {/* Mobile Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm transition-opacity"
                    onClick={() => setIsOpen(false)}
                />
            )}

            {/* Sidebar */}
            <div className={cn(
                "fixed inset-y-0 left-0 z-40 w-64 bg-slate-900 min-h-screen p-4 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:h-screen",
                isOpen ? "translate-x-0" : "-translate-x-full"
            )}>
                <div className="flex items-center gap-3 px-2 mb-10 mt-2">
                    <div className="bg-blue-600 p-2 rounded-lg">
                        <Truck className="h-6 w-6 text-white" />
                    </div>
                    <span className="text-xl font-bold text-white tracking-tight">ExpressLine</span>
                </div>

                <nav className="flex-1 space-y-2 overflow-y-auto">
                    {currentMenu.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group text-sm font-medium",
                                    isActive
                                        ? "bg-blue-600 text-white shadow-lg shadow-blue-500/30"
                                        : "text-slate-400 hover:bg-slate-800 hover:text-white"
                                )}
                            >
                                <Icon className={cn("h-5 w-5", isActive ? "text-white" : "text-slate-400 group-hover:text-white")} />
                                {item.name}
                            </Link>
                        );
                    })}
                </nav>

                <div className="mt-auto space-y-4 pt-4 border-t border-slate-800">
                    <div className="px-4 py-3 rounded-xl bg-slate-800/50">
                        <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Account</p>
                        <p className="text-sm font-medium text-white mt-1 truncate">{user?.name}</p>
                        <p className="text-xs text-slate-400 capitalize">{user?.role?.replace('_', ' ')}</p>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:bg-red-500/10 hover:text-red-500 transition-all text-sm font-medium"
                    >
                        <LogOut className="h-5 w-5" />
                        Logout
                    </button>
                </div>
            </div>
        </>
    );
}
