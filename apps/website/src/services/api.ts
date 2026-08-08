import axios from 'axios';
import { Book, VisitorRecord, User, Purchase } from '@digital-library/types';
import { Book, VisitorRecord, User, Purchase } from '@digital-library/types';

const API_BASE = '/api';

// Get Token from localStorage
export const getAuthToken = () => localStorage.getItem('dl_token');
export const setAuthToken = (token: string) => localStorage.setItem('dl_token', token);
export const removeAuthToken = () => localStorage.removeItem('dl_token');
export const getSavedUser = (): User | null => {
  const u = localStorage.getItem('dl_user');
  return u ? JSON.parse(u) : null;
};
export const setSavedUser = (user: User) => localStorage.setItem('dl_user', JSON.stringify(user));

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Strictly fetch from API
export const fetchBooks = async (params?: { search?: string; category?: string; maxPrice?: number }): Promise<Book[]> => {
  const res = await api.get('/books', { params });
  return res.data;
};

export const fetchVisitorBook = async (params?: { name?: string; year?: number }) => {
  const res = await api.get('/visitors/book-format', { params });
  return res.data;
};

export const fetchVisitors = async (params?: { search?: string; name?: string; year?: number }): Promise<VisitorRecord[]> => {
  const res = await api.get('/visitors', { params });
  return res.data;
};

export const fetchRecentBuyers = async (): Promise<Purchase[]> => {
  const res = await api.get('/orders/recent-buyers');
  return res.data;
};

export const loginWithEmail = async (email: string, password: string) => {
  const res = await api.post('/auth/login', { email, password });
  return res.data;
};

export const registerWithEmail = async (name: string, email: string, password: string) => {
  const res = await api.post('/auth/register', { name, email, password });
  return res.data;
};

export const socialLogin = async (provider: 'google' | 'microsoft' | 'apple' | 'facebook') => {
  const res = await api.post('/auth/social-login', { provider });
  return res.data;
};

export const createRazorpayOrder = async (bookId: string) => {
  const res = await api.post('/orders/create-razorpay-order', { bookId });
  return res.data;
};

export const verifyRazorpayPayment = async (paymentData: any) => {
  const res = await api.post('/orders/verify-razorpay-payment', paymentData);
  return res.data;
};

export default api;
