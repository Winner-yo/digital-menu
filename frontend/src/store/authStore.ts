import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '@/types';
import { api, setAuthTokens, clearAuthTokens } from '@/lib/api';

interface AuthStore {
  user: User | null;
  restaurantId: string | null;
  accessToken: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  loadProfile: () => Promise<void>;
}

interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  restaurantName?: string;
  restaurantAddress?: string;
  restaurantPhone?: string;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      restaurantId: null,
      accessToken: null,
      isLoading: false,
      isAuthenticated: false,

      login: async (email, password) => {
        set({ isLoading: true });
        try {
          const { data } = await api.post('/auth/login', { email, password });
          const { user, accessToken, refreshToken, restaurantId } = data.data;
          setAuthTokens(accessToken, refreshToken);
          set({ user, accessToken, restaurantId, isAuthenticated: true, isLoading: false });
        } catch (err: unknown) {
          set({ isLoading: false });
          const error = err as { response?: { data?: { error?: string } } };
          throw new Error(error.response?.data?.error || 'Invalid email or password');
        }
      },

      register: async (registerData) => {
        set({ isLoading: true });
        try {
          const { data } = await api.post('/auth/register', registerData);
          const { user, accessToken, refreshToken, restaurantId } = data.data;
          setAuthTokens(accessToken, refreshToken);
          set({ user, accessToken, restaurantId, isAuthenticated: true, isLoading: false });
        } catch (err: unknown) {
          set({ isLoading: false });
          const error = err as { response?: { data?: { error?: string } } };
          throw new Error(error.response?.data?.error || 'Registration failed');
        }
      },

      logout: () => {
        clearAuthTokens();
        set({ user: null, restaurantId: null, accessToken: null, isAuthenticated: false });
      },

      loadProfile: async () => {
        try {
          const { data } = await api.get('/auth/profile');
          const profile = data.data;
          set({
            user: profile,
            restaurantId: profile.restaurantUsers?.[0]?.restaurantId || get().restaurantId,
            isAuthenticated: true,
          });
        } catch {
          get().logout();
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        restaurantId: state.restaurantId,
        accessToken: state.accessToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
