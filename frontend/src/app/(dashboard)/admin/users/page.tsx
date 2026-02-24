'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api-client';
import {
    Users,
    Search,
    Filter,
    Edit2,
    Trash2,
    UserCheck,
    UserX,
    Mail,
    Phone,
    Calendar,
    Shield,
    Truck,
    MapPin,
    Package,
    MoreVertical,
    X,
    Loader2,
    AlertCircle,
    UserPlus
} from 'lucide-react';
import { cn } from '@/lib/utils';

type UserRole = 'all' | 'customer' | 'hub_manager' | 'traveler' | 'admin';

interface User {
    id: string;
    name: string;
    email: string;
    phone: string;
    role: string;
    roles?: string[];
    createdAt: string;
    hubId?: string;
}

export default function AdminUsersPage() {
    const queryClient = useQueryClient();
    const [selectedRole, setSelectedRole] = useState<UserRole>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
    const [showCreateModal, setShowCreateModal] = useState(false);

    // Fetch all users
    const { data: users, isLoading } = useQuery({
        queryKey: ['admin-users', selectedRole],
        queryFn: async () => {
            const endpoint = selectedRole === 'all'
                ? '/users'
                : `/users/role/${selectedRole}`;
            const { data } = await api.get(endpoint);
            return data;
        }
    });

    // Fetch user statistics
    const { data: stats } = useQuery({
        queryKey: ['user-stats'],
        queryFn: async () => {
            const { data } = await api.get('/users/stats');
            return data;
        }
    });

    // Delete user mutation
    const deleteMutation = useMutation({
        mutationFn: async (userId: string) => {
            await api.delete(`/users/${userId}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-users'] });
            queryClient.invalidateQueries({ queryKey: ['user-stats'] });
            setShowDeleteConfirm(null);
        }
    });

    const roleFilters = [
        { value: 'all', label: 'All Users', icon: Users, count: stats?.total || 0 },
        { value: 'customer', label: 'Customers', icon: Package, count: stats?.byRole?.customer || 0 },
        { value: 'traveler', label: 'Travelers', icon: MapPin, count: stats?.byRole?.traveler || 0 },
        { value: 'hub_manager', label: 'Hub Managers', icon: Shield, count: stats?.byRole?.hub_manager || 0 },
    ];

    const filteredUsers = users?.filter((user: User) =>
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.phone.includes(searchQuery)
    ) || [];

    const getRoles = (user: User): { label: string; color: string; icon?: typeof Package }[] => {
        let rawRoles = user.roles;
        if (typeof rawRoles === 'string') {
            try { rawRoles = JSON.parse(rawRoles); } catch (e) { rawRoles = []; }
        }

        const roles = Array.isArray(rawRoles) ? [...rawRoles] : [];
        const primaryRole = String(user?.role || '').toLowerCase();

        // Ensure primary role is in the list for mapping
        if (primaryRole && !roles.map(r => String(r).toLowerCase()).includes(primaryRole)) {
            roles.push(primaryRole);
        }

        const rLower = roles.map(s => String(s || '').toLowerCase());
        const badges: { label: string; color: string; icon?: typeof Package }[] = [];

        if (rLower.includes('customer')) {
            badges.push({
                label: 'Sender',
                color: 'bg-blue-50 text-blue-700 border-blue-200',
                icon: Package
            });
        }
        if (rLower.includes('traveler')) {
            badges.push({
                label: 'Traveler',
                color: 'bg-pink-50 text-pink-700 border-pink-200',
                icon: MapPin
            });
        }

        if (primaryRole === 'hub_manager' || rLower.includes('hub_manager')) {
            if (!badges.find(b => b.label === 'Hub Manager')) {
                badges.push({
                    label: 'Hub Manager',
                    color: 'bg-amber-50 text-amber-700 border-amber-200',
                    icon: Shield
                });
            }
        }
        if (primaryRole === 'admin' || rLower.includes('admin')) {
            if (!badges.find(b => b.label === 'Admin')) {
                badges.push({
                    label: 'Admin',
                    color: 'bg-purple-50 text-purple-700 border-purple-200',
                    icon: Shield
                });
            }
        }

        if (badges.length === 0) {
            badges.push({
                label: (user?.role || 'User').replace('_', ' '),
                color: 'bg-slate-50 text-slate-700 border-slate-200'
            });
        }

        return badges;
    };

    return (
        <div className="space-y-6 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">User Management</h1>
                    <p className="text-slate-500 mt-1">Manage all platform users and their roles</p>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"
                >
                    <UserPlus className="h-4 w-4" /> Create User
                </button>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {roleFilters.map((filter) => {
                    const Icon = filter.icon;
                    return (
                        <button
                            key={filter.value}
                            onClick={() => setSelectedRole(filter.value as UserRole)}
                            className={cn(
                                "p-4 rounded-xl border-2 transition-all text-left",
                                selectedRole === filter.value
                                    ? "bg-blue-50 border-blue-500 shadow-lg shadow-blue-100"
                                    : "bg-white border-slate-200 hover:border-slate-300"
                            )}
                        >
                            <div className="flex items-center gap-2 mb-2">
                                <Icon className={cn(
                                    "h-4 w-4",
                                    selectedRole === filter.value ? "text-blue-600" : "text-slate-400"
                                )} />
                                <span className={cn(
                                    "text-xs font-bold uppercase tracking-wider",
                                    selectedRole === filter.value ? "text-blue-600" : "text-slate-400"
                                )}>
                                    {filter.label}
                                </span>
                            </div>
                            <p className="text-2xl font-bold text-slate-900">{filter.count}</p>
                        </button>
                    );
                })}
            </div>

            {/* Search Bar */}
            <div className="bg-white p-4 rounded-xl border border-slate-200">
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search by name, email, or phone..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    />
                </div>
            </div>

            {/* Users Table */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                {isLoading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                    </div>
                ) : filteredUsers.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <Users className="h-12 w-12 text-slate-300 mb-4" />
                        <p className="text-slate-500 font-medium">No users found</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">User</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Contact</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Role</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Joined</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredUsers.map((user: User) => (
                                    <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                                                    {user.name.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-900">{user.name}</p>
                                                    <p className="text-xs text-slate-500">{user.id.slice(0, 8)}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2 text-sm text-slate-600">
                                                    <Mail className="h-3 w-3" />
                                                    {user.email}
                                                </div>
                                                <div className="flex items-center gap-2 text-sm text-slate-600">
                                                    <Phone className="h-3 w-3" />
                                                    {user.phone}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-2">
                                                <div className="flex flex-wrap gap-1.5">
                                                    {getRoles(user).map((badge, idx) => {
                                                        const Icon = badge.icon;
                                                        return (
                                                            <span key={idx} className={cn(
                                                                "px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border flex items-center gap-1.5 whitespace-nowrap",
                                                                badge.color
                                                            )}>
                                                                {Icon && <Icon className="h-3 w-3" />}
                                                                {badge.label}
                                                            </span>
                                                        );
                                                    })}
                                                </div>
                                                {/* Show current active role indicator if multiple roles exist */}
                                                {(user.roles || []).length > 1 && (
                                                    <div className="flex items-center gap-1.5 px-1">
                                                        <span className="flex h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse"></span>
                                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">
                                                            Current: {String(user.role).toLowerCase() === 'customer' ? 'Sender' : 'Traveler'} Mode
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 text-sm text-slate-600">
                                                <Calendar className="h-3 w-3" />
                                                {new Date(user.createdAt).toLocaleDateString()}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => setSelectedUser(user)}
                                                    className="p-2 hover:bg-blue-50 rounded-lg transition-colors text-blue-600"
                                                    title="Edit user"
                                                >
                                                    <Edit2 className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => setShowDeleteConfirm(user.id)}
                                                    className="p-2 hover:bg-red-50 rounded-lg transition-colors text-red-600"
                                                    title="Delete user"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl p-6 max-w-md w-full">
                        <div className="flex items-start gap-4 mb-6">
                            <div className="p-3 bg-red-100 rounded-xl">
                                <AlertCircle className="h-6 w-6 text-red-600" />
                            </div>
                            <div>
                                <h3 className="font-bold text-lg text-slate-900 mb-1">Delete User</h3>
                                <p className="text-sm text-slate-600">
                                    Are you sure you want to delete this user? This action cannot be undone.
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowDeleteConfirm(null)}
                                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 font-bold text-slate-700 hover:bg-slate-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => deleteMutation.mutate(showDeleteConfirm)}
                                disabled={deleteMutation.isPending}
                                className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 text-white font-bold hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {deleteMutation.isPending ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Deleting...
                                    </>
                                ) : (
                                    'Delete User'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit User Modal */}
            {selectedUser && (
                <UserEditModal
                    user={selectedUser}
                    onClose={() => setSelectedUser(null)}
                    onSuccess={() => {
                        queryClient.invalidateQueries({ queryKey: ['admin-users'] });
                        setSelectedUser(null);
                    }}
                />
            )}

            {/* Create User Modal */}
            {showCreateModal && (
                <UserCreateModal
                    onClose={() => setShowCreateModal(false)}
                    onSuccess={() => {
                        queryClient.invalidateQueries({ queryKey: ['admin-users'] });
                        queryClient.invalidateQueries({ queryKey: ['user-stats'] });
                        setShowCreateModal(false);
                    }}
                />
            )}
        </div>
    );
}

// User Create Modal Component
function UserCreateModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        phone: '',
    });
    const [roles, setRoles] = useState<string[]>(['customer']);
    const [primaryRole, setPrimaryRole] = useState('customer');

    const toggleRole = (r: string) => {
        setRoles(prev => prev.includes(r) ? prev.filter(x => x !== r) : [...prev, r]);
    };

    const createMutation = useMutation({
        mutationFn: async (userData: any) => {
            await api.post('/users/create', userData);
        },
        onSuccess: () => {
            onSuccess();
        }
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const finalRoles = roles.length > 0 ? roles : [primaryRole];
        const payload = {
            ...formData,
            role: primaryRole,
            roles: finalRoles
        };
        createMutation.mutate(payload);
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h3 className="font-bold text-xl text-slate-900">Create New User</h3>
                        <p className="text-sm text-slate-500 mt-1">Add a new user to the platform</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Full Name</label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                            placeholder="John Doe"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Email Address</label>
                        <input
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                            placeholder="john@example.com"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Password</label>
                        <input
                            type="password"
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                            placeholder="••••••••"
                            required
                            minLength={6}
                        />
                        <p className="text-xs text-slate-500 mt-1">Minimum 6 characters</p>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Phone Number</label>
                        <input
                            type="tel"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                            placeholder="+1234567890"
                            required
                        />
                    </div>

                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
                        <label className="block text-sm font-bold text-slate-700">Account Access Modes</label>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                type="button"
                                onClick={() => toggleRole('customer')}
                                className={cn(
                                    "flex items-center gap-2 p-3 rounded-xl border-2 transition-all hover:border-slate-300",
                                    roles.includes('customer') ? "bg-blue-50 border-blue-500 text-blue-700" : "bg-white border-slate-200 text-slate-600"
                                )}
                            >
                                <div className={cn("h-4 w-4 rounded border-2 flex items-center justify-center", roles.includes('customer') ? "bg-blue-600 border-blue-600" : "border-slate-300")}>
                                    {roles.includes('customer') && <Users className="h-3 w-3 text-white" />}
                                </div>
                                <span className="text-sm font-bold">Sender</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => toggleRole('traveler')}
                                className={cn(
                                    "flex items-center gap-2 p-3 rounded-xl border-2 transition-all hover:border-slate-300",
                                    roles.includes('traveler') ? "bg-pink-50 border-pink-500 text-pink-700" : "bg-white border-slate-200 text-slate-600"
                                )}
                            >
                                <div className={cn("h-4 w-4 rounded border-2 flex items-center justify-center", roles.includes('traveler') ? "bg-pink-600 border-pink-600" : "border-slate-300")}>
                                    {roles.includes('traveler') && <Users className="h-3 w-3 text-white" />}
                                </div>
                                <span className="text-sm font-bold">Traveler</span>
                            </button>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Primary Display Role & Admin Access</label>
                            <select
                                value={primaryRole}
                                onChange={(e) => {
                                    setPrimaryRole(e.target.value);
                                    if (!['admin', 'hub_manager'].includes(e.target.value) && !roles.includes(e.target.value)) {
                                        setRoles(prev => [...prev, e.target.value]);
                                    }
                                }}
                                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white font-medium"
                            >
                                <option value="customer">Sender</option>
                                <option value="traveler">Traveler</option>
                                <option value="admin">Platform Administrator</option>
                                <option value="hub_manager">Hub Manager</option>
                            </select>
                        </div>
                    </div>

                    {createMutation.isError && (
                        <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-start gap-2">
                            <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                            <p className="text-sm text-red-700">
                                {((createMutation.error as any)?.response?.data?.message) || 'Failed to create user. Please try again.'}
                            </p>
                        </div>
                    )}

                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 font-bold text-slate-700 hover:bg-slate-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={createMutation.isPending}
                            className="flex-1 px-4 py-2.5 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {createMutation.isPending ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Creating...
                                </>
                            ) : (
                                <>
                                    <UserPlus className="h-4 w-4" />
                                    Create User
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// User Edit Modal Component
function UserEditModal({ user, onClose, onSuccess }: { user: User; onClose: () => void; onSuccess: () => void }) {
    const [formData, setFormData] = useState({
        name: user.name,
        email: user.email,
        phone: user.phone,
    });
    const [roles, setRoles] = useState<string[]>(Array.isArray(user.roles) ? user.roles : [user.role]);
    const [primaryRole, setPrimaryRole] = useState(user.role);

    const toggleRole = (r: string) => {
        setRoles(prev => prev.includes(r) ? prev.filter(x => x !== r) : [...prev, r]);
    };

    const updateMutation = useMutation({
        mutationFn: async (updates: any) => {
            await api.patch(`/users/${user.id}`, updates);
        },
        onSuccess: () => {
            onSuccess();
        }
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const finalRoles = roles.length > 0 ? roles : [primaryRole];
        const payload = {
            ...formData,
            role: primaryRole,
            roles: finalRoles
        };
        updateMutation.mutate(payload);
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="font-bold text-xl text-slate-900">Edit User</h3>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Name</label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Email</label>
                        <input
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Phone</label>
                        <input
                            type="tel"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                            required
                        />
                    </div>

                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
                        <label className="block text-sm font-bold text-slate-700">Account Access Modes</label>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                type="button"
                                onClick={() => toggleRole('customer')}
                                className={cn(
                                    "flex items-center gap-2 p-3 rounded-xl border-2 transition-all hover:border-slate-300",
                                    roles.includes('customer') ? "bg-blue-50 border-blue-500 text-blue-700" : "bg-white border-slate-200 text-slate-600"
                                )}
                            >
                                <div className={cn("h-4 w-4 rounded border-2 flex items-center justify-center", roles.includes('customer') ? "bg-blue-600 border-blue-600" : "border-slate-300")}>
                                    {roles.includes('customer') && <Users className="h-3 w-3 text-white" />}
                                </div>
                                <span className="text-sm font-bold">Sender</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => toggleRole('traveler')}
                                className={cn(
                                    "flex items-center gap-2 p-3 rounded-xl border-2 transition-all hover:border-slate-300",
                                    roles.includes('traveler') ? "bg-pink-50 border-pink-500 text-pink-700" : "bg-white border-slate-200 text-slate-600"
                                )}
                            >
                                <div className={cn("h-4 w-4 rounded border-2 flex items-center justify-center", roles.includes('traveler') ? "bg-pink-600 border-pink-600" : "border-slate-300")}>
                                    {roles.includes('traveler') && <Users className="h-3 w-3 text-white" />}
                                </div>
                                <span className="text-sm font-bold">Traveler</span>
                            </button>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Primary Display Role & Admin Access</label>
                            <select
                                value={primaryRole}
                                onChange={(e) => {
                                    setPrimaryRole(e.target.value);
                                    if (!['admin', 'hub_manager'].includes(e.target.value) && !roles.includes(e.target.value)) {
                                        setRoles(prev => Array.from(new Set([...prev, e.target.value])));
                                    }
                                }}
                                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white font-medium"
                            >
                                <option value="customer">Sender</option>
                                <option value="traveler">Traveler</option>
                                <option value="admin">Platform Administrator</option>
                                <option value="hub_manager">Hub Manager</option>
                            </select>
                        </div>
                    </div>

                    {updateMutation.isError && (
                        <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-start gap-2">
                            <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                            <p className="text-sm text-red-700">
                                {((updateMutation.error as any)?.response?.data?.message) || 'Failed to update user.'}
                            </p>
                        </div>
                    )}

                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 font-bold text-slate-700 hover:bg-slate-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={updateMutation.isPending}
                            className="flex-1 px-4 py-2.5 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {updateMutation.isPending ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                'Save Changes'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
