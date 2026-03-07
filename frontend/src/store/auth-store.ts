import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
    id: string;
    email: string;
    name: string;
    role: 'admin' | 'customer' | 'hub_manager' | 'traveler';
    roles?: string[];
    hubId?: string;
    phone?: string;
}

interface AuthState {
    user: User | null;
    token: string | null;
    _hasHydrated: boolean;
    setHasHydrated: (state: boolean) => void;
    setAuth: (user: User, token: string) => void;
    updateAuth: (user: User, token: string) => void;
    patchUser: (updates: Partial<User>) => void;
    logout: () => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            user: null,
            token: null,
            _hasHydrated: false,
            setHasHydrated: (state) => set({ _hasHydrated: state }),
            setAuth: (user, token) => {
                console.log('DEBUG: AuthStore setAuth received user:', JSON.stringify(user));
                const roles = Array.isArray(user.roles) ? user.roles : (user.role ? [user.role] : []);
                localStorage.setItem('token', token);
                set({ user: { ...user, roles }, token });
            },
            updateAuth: (user, token) => {
                console.log('DEBUG: AuthStore updateAuth received user:', JSON.stringify(user));
                const roles = Array.isArray(user.roles) ? user.roles : (user.role ? [user.role] : []);
                localStorage.setItem('token', token);
                set({ user: { ...user, roles }, token });
            },
            patchUser: (updates) => {
                set((state) => ({
                    user: state.user ? { ...state.user, ...updates } : state.user,
                }));
            },
            logout: () => {
                localStorage.removeItem('token');
                set({ user: null, token: null });
            },
        }),
        {
            name: 'auth-storage',
            onRehydrateStorage: () => (state) => {
                state?.setHasHydrated(true);
            },
        }
    )
);
