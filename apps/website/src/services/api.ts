import axios from 'axios';
import { Book, VisitorRecord, User, Purchase, BookPDF } from '@digital-library/types';

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

// Cache & Deduplication Stores
let booksCache: Book[] | null = null;
let booksPromise: Promise<Book[]> | null = null;

let visitorsCache: VisitorRecord[] | null = null;
let visitorsPromise: Promise<VisitorRecord[]> | null = null;

let recentBuyersCache: Purchase[] | null = null;
let recentBuyersPromise: Promise<Purchase[]> | null = null;

export const clearApiCaches = () => {
  booksCache = null;
  visitorsCache = null;
  recentBuyersCache = null;
  myPurchasesCache = null;
};

// Strictly fetch from API with deduplication & caching
export const fetchBooks = async (params?: { search?: string; category?: string; maxPrice?: number }): Promise<Book[]> => {
  if (!params && booksCache) return booksCache;
  if (!params && booksPromise) return booksPromise;

  const req = api.get('/books', { params }).then((res) => {
    if (!params) booksCache = res.data;
    booksPromise = null;
    return res.data;
  }).catch((err) => {
    booksPromise = null;
    throw err;
  });

  if (!params) booksPromise = req;
  return req;
};

export const fetchBookPdfs = async (bookId: string): Promise<BookPDF[]> => {
  const res = await api.get(`/books/${bookId}/pdfs`);
  return res.data;
};

export const fetchVisitorBook = async (params?: { name?: string; year?: number }) => {
  const res = await api.get('/visitors/book-format', { params });
  return res.data;
};

export const fetchVisitors = async (params?: { search?: string; name?: string; year?: number }): Promise<VisitorRecord[]> => {
  if (!params && visitorsCache) return visitorsCache;
  if (!params && visitorsPromise) return visitorsPromise;

  const req = api.get('/visitors', { params }).then((res) => {
    if (!params) visitorsCache = res.data;
    visitorsPromise = null;
    return res.data;
  }).catch((err) => {
    visitorsPromise = null;
    throw err;
  });

  if (!params) visitorsPromise = req;
  return req;
};

export const fetchRecentBuyers = async (): Promise<Purchase[]> => {
  if (recentBuyersCache) return recentBuyersCache;
  if (recentBuyersPromise) return recentBuyersPromise;

  recentBuyersPromise = api.get('/orders/recent-buyers').then((res) => {
    recentBuyersCache = res.data;
    recentBuyersPromise = null;
    return res.data;
  }).catch((err) => {
    recentBuyersPromise = null;
    throw err;
  });

  return recentBuyersPromise;
};

let myPurchasesCache: any = null;
let myPurchasesPromise: Promise<any> | null = null;

export const fetchMyPurchases = async () => {
  if (myPurchasesCache) return myPurchasesCache;
  if (myPurchasesPromise) return myPurchasesPromise;

  myPurchasesPromise = api.get('/orders/my-purchases').then((res) => {
    myPurchasesCache = res.data;
    myPurchasesPromise = null;
    return res.data;
  }).catch((err) => {
    myPurchasesPromise = null;
    throw err;
  });

  return myPurchasesPromise;
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
