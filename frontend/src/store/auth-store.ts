import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
    id: string;
    email: string;
    name: string;
    role: 'admin' | 'customer' | 'delivery_partner' | 'hub_manager' | 'traveler';
    vehicleType?: string;
    hubId?: string;
}

interface AuthState {
    user: User | null;
    token: string | null;
    _hasHydrated: boolean;
    setHasHydrated: (state: boolean) => void;
    setAuth: (user: User, token: string) => void;
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
                localStorage.setItem('token', token);
                set({ user, token });
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
