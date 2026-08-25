import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import Cookies from 'js-cookie';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export const api: AxiosInstance = axios.create({
  baseURL: `${BASE_URL}/api`,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
  withCredentials: true,
});

// Request interceptor – attach token
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = Cookies.get('accessToken') || (typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null);
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor – handle 401 refresh
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const refreshToken = Cookies.get('refreshToken') || localStorage.getItem('refreshToken');
        if (!refreshToken) throw new Error('No refresh token');
        const { data } = await axios.post(`${BASE_URL}/api/auth/refresh`, { refreshToken });
        const newToken = data.data.accessToken;
        Cookies.set('accessToken', newToken, { expires: 7, secure: true, sameSite: 'lax' });
        localStorage.setItem('accessToken', newToken);
        if (original.headers) original.headers.Authorization = `Bearer ${newToken}`;
        return api(original);
      } catch {
        Cookies.remove('accessToken');
        Cookies.remove('refreshToken');
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        if (typeof window !== 'undefined') window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const setAuthTokens = (accessToken: string, refreshToken: string) => {
  Cookies.set('accessToken', accessToken, { expires: 7, secure: process.env.NODE_ENV === 'production', sameSite: 'lax' });
  Cookies.set('refreshToken', refreshToken, { expires: 30, secure: process.env.NODE_ENV === 'production', sameSite: 'lax' });
  localStorage.setItem('accessToken', accessToken);
  localStorage.setItem('refreshToken', refreshToken);
};

export const clearAuthTokens = () => {
  Cookies.remove('accessToken');
  Cookies.remove('refreshToken');
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
};

// ---- API helpers ----
export const menuApi = {
  getFullMenu: (restaurantId: string) => api.get(`/menu/public/${restaurantId}/full`),
  getCategories: (restaurantId: string) => api.get(`/menu/public/${restaurantId}/categories`),
  getDashboardItems: (params?: Record<string, unknown>) => api.get('/menu/items', { params }),
  getDashboardCategories: () => api.get('/menu/categories'),
  createItem: (data: FormData | Record<string, unknown>) => api.post('/menu/items', data),
  updateItem: (id: string, data: Record<string, unknown>) => api.put(`/menu/items/${id}`, data),
  deleteItem: (id: string) => api.delete(`/menu/items/${id}`),
  toggleAvailability: (id: string) => api.patch(`/menu/items/${id}/toggle-availability`),
  createCategory: (data: Record<string, unknown>) => api.post('/menu/categories', data),
  updateCategory: (id: string, data: Record<string, unknown>) => api.put(`/menu/categories/${id}`, data),
  deleteCategory: (id: string) => api.delete(`/menu/categories/${id}`),
};

export const orderApi = {
  create: (data: Record<string, unknown>) => api.post('/orders', data),
  track: (orderNumber: string) => api.get(`/orders/track/${orderNumber}`),
  getAll: (params?: Record<string, unknown>) => api.get('/orders', { params }),
  getStats: () => api.get('/orders/stats'),
  updateStatus: (id: string, status: string, note?: string) =>
    api.patch(`/orders/${id}/status`, { status, note }),
};

export const paymentApi = {
  initiate: (data: { orderId: string; method: string; returnUrl?: string }) =>
    api.post('/payments/initiate', data),
  verify: (referenceId: string) => api.post('/payments/verify', { referenceId }),
  confirmMock: (referenceId: string) => api.post('/payments/mock/confirm', { referenceId }),
  validatePromo: (data: { restaurantId: string; code: string; orderTotal: number }) =>
    api.post('/discounts/validate', data),
};

export const restaurantApi = {
  getPublic: (slug: string) => api.get(`/restaurants/public/${slug}`),
  getProfile: () => api.get('/restaurants/profile'),
  updateProfile: (data: Record<string, unknown>) => api.put('/restaurants/profile', data),
  getTables: () => api.get('/restaurants/tables'),
  createTable: (data: { tableNumber: string; capacity: number }) =>
    api.post('/restaurants/tables', data),
};

export const analyticsApi = {
  getOverview: () => api.get('/analytics/overview'),
  getSales: (period: string) => api.get('/analytics/sales', { params: { period } }),
  getPayments: () => api.get('/analytics/payments'),
  getTopItems: (limit?: number) => api.get('/analytics/top-items', { params: { limit } }),
  getRating: () => api.get('/analytics/rating'),
};

export const qrApi = {
  generate: (label?: string) => api.post('/qrcodes/restaurant', { label }),
  generateTable: (tableId: string) => api.post(`/qrcodes/table/${tableId}`),
  generateAll: () => api.post('/qrcodes/tables/all'),
  getAll: () => api.get('/qrcodes'),
  deactivate: (id: string) => api.delete(`/qrcodes/${id}`),
};

export const reviewApi = {
  getPublic: (restaurantId: string, params?: Record<string, unknown>) =>
    api.get(`/reviews/public/${restaurantId}`, { params }),
  getAll: (params?: Record<string, unknown>) => api.get('/reviews', { params }),
  submit: (data: Record<string, unknown>) => api.post('/reviews', data),
  reply: (id: string, reply: string) => api.patch(`/reviews/${id}/reply`, { reply }),
};

export const discountApi = {
  getAll: () => api.get('/discounts'),
  create: (data: Record<string, unknown>) => api.post('/discounts', data),
  update: (id: string, data: Record<string, unknown>) => api.put(`/discounts/${id}`, data),
  delete: (id: string) => api.delete(`/discounts/${id}`),
  getPromoCodes: () => api.get('/discounts/promo-codes'),
  createPromoCode: (data: Record<string, unknown>) => api.post('/discounts/promo-codes', data),
};

export const uploadApi = {
  upload: (type: string, file: File) => {
    const form = new FormData();
    form.append('image', file);
    return api.post(`/upload/${type}`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};
