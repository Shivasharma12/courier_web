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
    Menu,
    X,
    ArrowLeftRight,
    Loader2,
    CheckCircle,
    Bell,
    CheckCircle2,
    XCircle,
    Info
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import api from '@/lib/api-client';
import { toast } from 'sonner';
import { ThemeToggle } from './theme-toggle';

// ─── Notification Bell ─────────────────────────────────────────────────────
function NotificationBell({ userId, onNavigate }: { userId: string; onNavigate: (link: string) => void }) {
    const qc = useQueryClient();
    const [open, setOpen] = useState(false);

    const { data: notifs = [] } = useQuery<any[]>({
        queryKey: ['notifications', userId],
        queryFn: async () => {
            const { data } = await api.get('/notifications');
            return data;
        },
        refetchInterval: 30_000, // poll every 30s
    });

    const markAllRead = useMutation({
        mutationFn: () => api.patch('/notifications/mark-all-read'),
        onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications', userId] }),
    });

    const unread = notifs.filter((n) => !n.isRead).length;

    const iconFor = (type: string) => {
        if (type === 'success') return <CheckCircle2 className="h-4 w-4 text-green-500" />;
        if (type === 'error') return <XCircle className="h-4 w-4 text-red-500" />;
        return <Info className="h-4 w-4 text-blue-400" />;
    };

    return (
        <div className="relative">
            <button
                onClick={() => { setOpen(o => !o); if (unread > 0) markAllRead.mutate(); }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-all text-sm font-medium"
            >
                <div className="relative">
                    <Bell className="h-5 w-5" />
                    {unread > 0 && (
                        <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full flex items-center justify-center text-[9px] font-black text-white">
                            {unread > 9 ? '9+' : unread}
                        </span>
                    )}
                </div>
                Notifications
                {unread > 0 && <span className="ml-auto bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full">{unread}</span>}
            </button>

            {open && (
                <div className="absolute bottom-14 left-0 w-72 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden z-50">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800">
                        <p className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-widest">Notifications</p>
                        <button onClick={() => setOpen(false)}>
                            <X className="h-4 w-4 text-slate-400 hover:text-slate-600 dark:hover:text-white transition" />
                        </button>
                    </div>
                    {notifs.length === 0 ? (
                        <div className="p-6 text-center">
                            <Bell className="h-6 w-6 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                            <p className="text-xs text-slate-500 font-medium">No notifications yet</p>
                        </div>
                    ) : (
                        <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/50">
                            {notifs.map((n: any) => (
                                <button
                                    key={n.id}
                                    className={`w-full text-left px-4 py-3 flex items-start gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all ${!n.isRead ? 'bg-blue-50/50 dark:bg-slate-800/30' : ''}`}
                                    onClick={() => n.link && onNavigate(n.link)}
                                >
                                    <div className="flex-shrink-0 mt-0.5">{iconFor(n.type)}</div>
                                    <div className="min-w-0">
                                        <p className="text-xs font-bold text-slate-900 dark:text-white leading-tight">{n.title}</p>
                                        <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed line-clamp-2">{n.message}</p>
                                        <p className="text-[9px] text-slate-400 dark:text-slate-600 mt-1">{new Date(n.createdAt).toLocaleString()}</p>
                                    </div>
                                    {!n.isRead && <div className="h-2 w-2 rounded-full bg-blue-500 flex-shrink-0 mt-1" />}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}


export default function DashboardSidebar() {
    const pathname = usePathname();
    const router = useRouter();
    const qc = useQueryClient();
    const logout = useAuthStore((state) => state.logout);
    const user = useAuthStore((state) => state.user);
    const updateAuth = useAuthStore((state) => state.updateAuth);

    const [isOpen, setIsOpen] = useState(false);
    const [switching, setSwitching] = useState(false);
    const [showNotifs, setShowNotifs] = useState(false);

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
                    { name: 'Hub Approvals', href: '/admin/hubs/approvals', icon: CheckCircle },
                    { name: 'Travel Plans', href: '/admin/travel-plans', icon: Truck },
                    { name: 'Parcels', href: '/admin/parcels', icon: Package },
                    { name: 'Pricing Rules', href: '/admin/pricing', icon: Settings },
                    { name: 'My Profile', href: '/profile', icon: User },
                ];
            case 'customer':
                return [
                    { name: 'Overview', href: '/customer', icon: LayoutDashboard },
                    { name: 'Create Parcel', href: '/customer/create', icon: PlusCircle },
                    { name: 'My Parcels', href: '/customer/history', icon: History },
                    { name: 'Tracking', href: '/track', icon: MapPin },
                    { name: 'My Profile', href: '/profile', icon: User },
                ];
            case 'traveler':
                return [
                    { name: 'Dashboard', href: '/traveler', icon: LayoutDashboard },
                    { name: 'Post Route', href: '/traveler/post-route', icon: PlusCircle },
                    { name: 'View Matches', href: '/traveler/matches', icon: Package },
                    { name: 'My Deliveries', href: '/traveler/deliveries', icon: Truck },
                    { name: 'My Profile', href: '/profile', icon: User },
                ];
            case 'hub_manager':
                return [
                    { name: 'Hub Status', href: '/hub', icon: LayoutDashboard },
                    { name: 'Inventory', href: '/hub/inventory', icon: Package },
                    { name: 'Dispatch', href: '/hub/dispatch', icon: Truck },
                    { name: 'Hub Profile', href: '/hub/profile', icon: MapPin },
                    { name: 'My Profile', href: '/profile', icon: User },
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

    // Dual-role switch: only show for customer/traveler who have both roles
    // Also parse from token as fallback (handles old persisted sessions)
    const getTokenRoles = (): string[] => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return [];
            const payload = JSON.parse(atob(token.split('.')[1]));
            if (Array.isArray(payload.roles)) return payload.roles;
            return [];
        } catch { return []; }
    };
    // Hardened role detection
    const rawRoles = user?.roles || [];
    const userRoles: string[] = Array.isArray(rawRoles)
        ? rawRoles
        : (typeof rawRoles === 'string' ? JSON.parse(rawRoles) : [user?.role]);

    // Ensure all roles are strings and trimmed
    const normalizedRoles = Array.from(new Set(
        userRoles.map(r => String(r).trim().toLowerCase()).filter(Boolean)
    ));

    // Also check token roles as a final fallback
    const finalRoles = normalizedRoles.length > 0 ? normalizedRoles : Array.from(new Set(getTokenRoles().map(r => r.toLowerCase())));

    const hasMultipleRoles = finalRoles.length > 1;

    // Filter out the CURRENT role to find other available roles
    const currentRoleLower = String(user?.role || '').toLowerCase();
    const otherRoles = finalRoles.filter(r => r !== currentRoleLower);

    // For switching, we pick the first "other" role. 
    // In a more complex setup, this could be a dropdown, 
    // but for 2-3 roles, simple cycling is often fine.
    const nextRole = otherRoles[0];

    const getRoleLabel = (r: string) => {
        switch (r) {
            case 'customer': return 'Sender';
            case 'traveler': return 'Traveler';
            case 'hub_manager': return 'Hub Manager';
            case 'admin': return 'Admin';
            default: return r.charAt(0).toUpperCase() + r.slice(1);
        }
    };

    const targetLabel = nextRole ? `Switch to ${getRoleLabel(nextRole)} Dashboard` : '';
    const targetPath = nextRole === 'customer' ? '/customer' :
        nextRole === 'traveler' ? '/traveler' :
            nextRole === 'hub_manager' ? '/hub' :
                nextRole === 'admin' ? '/admin' : '/';

    const handleSwitchRole = async () => {
        if (!nextRole || switching) return;
        setSwitching(true);
        try {
            const { data } = await api.post('/users/switch-role', { role: nextRole });
            updateAuth(data.user, data.access_token);
            toast.success(`Switched to ${getRoleLabel(nextRole)} mode`);
            router.replace(targetPath);
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to switch role');
        } finally {
            setSwitching(false);
        }
    };

    return (
        <>
            {/* Mobile Toggle Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="lg:hidden fixed top-4 right-4 z-50 p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-lg shadow-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
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
                "fixed inset-y-0 left-0 z-40 w-64 bg-white dark:bg-slate-950 border-r border-slate-200 dark:border-slate-900 min-h-screen p-4 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:h-screen",
                isOpen ? "translate-x-0" : "-translate-x-full"
            )}>
                <div className="flex items-center justify-between mb-10 mt-2 px-2">
                    <div className="flex items-center gap-3">
                        <div className="bg-blue-600 p-2 rounded-lg">
                            <Truck className="h-6 w-6 text-white" />
                        </div>
                        <span className="text-xl font-black text-slate-900 dark:text-white tracking-tight">ExpressLine</span>
                    </div>
                    <ThemeToggle className="flex lg:hidden" />
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
                                        : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
                                )}
                            >
                                <Icon className={cn("h-5 w-5", isActive ? "text-white" : "text-slate-400 dark:text-slate-500 group-hover:text-slate-900 dark:group-hover:text-white")} />
                                {item.name}
                            </Link>
                        );
                    })}
                </nav>

                <div className="mt-auto space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex items-center justify-between gap-2 px-2">
                        <ThemeToggle className="hidden lg:flex" />
                        <div className="flex-1 flex items-center gap-3 px-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800/50">
                            <div className="min-w-0">
                                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Active Role</p>
                                <p className="text-xs font-bold text-blue-600 dark:text-blue-400 truncate">{getRoleLabel(user?.role || '')}</p>
                            </div>
                        </div>
                    </div>

                    {hasMultipleRoles && nextRole && (
                        <button
                            onClick={handleSwitchRole}
                            disabled={switching}
                            className="w-full flex items-center justify-center gap-3 px-4 py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-500 hover:to-indigo-500 shadow-lg shadow-blue-900/20 transition-all text-xs font-bold disabled:opacity-60"
                        >
                            {switching ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowLeftRight className="h-4 w-4" />}
                            {switching ? 'Switching...' : targetLabel}
                        </button>
                    )}

                    {/* Notification Bell */}
                    {user && (
                        <NotificationBell userId={user.id} onNavigate={(link) => { router.push(link); setShowNotifs(false); }} />
                    )}

                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-500 transition-all text-sm font-medium"
                    >
                        <LogOut className="h-5 w-5" />
                        Logout
                    </button>
                </div>
            </div>
        </>
    );
}
