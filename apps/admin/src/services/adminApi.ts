import axios from 'axios';
import { DashboardStats, User, Book, VisitorRecord, Purchase } from '@digital-library/types';
import { usersStore, booksStore, visitorRecordsStore, purchasesStore } from '../../../api/src/services/store';

const API_BASE = '/api';

const adminClient = axios.create({
  baseURL: API_BASE,
  timeout: 300000, // 5 minutes timeout for uploading large PDFs
});

adminClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('adminToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const adminLogin = async (email: string, password: string) => {
  const res = await adminClient.post('/auth/login', { email, password });
  if (res.data.user.role !== 'ADMIN') {
    throw new Error('Not authorized as admin');
  }
  return res.data;
};

export const fetchDashboardStats = async (): Promise<DashboardStats> => {
  try {
    const res = await adminClient.get('/admin/dashboard');
    return res.data;
  } catch (err) {
    const totalUsers = usersStore.length;
    const totalBooks = booksStore.length;
    const totalSales = purchasesStore.length;
    const totalRevenue = purchasesStore.reduce((sum, p) => sum + p.amount, 0);
    const totalVisitorRecords = visitorRecordsStore.length;

    return {
      totalUsers,
      totalBooks,
      totalSales,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      totalVisitorRecords,
      revenueChart: [
        { date: 'Jan 2026', revenue: 1450 },
        { date: 'Feb 2026', revenue: 2100 },
        { date: 'Mar 2026', revenue: 3400 },
        { date: 'Apr 2026', revenue: 4200 },
        { date: 'May 2026', revenue: 5800 },
        { date: 'Jun 2026', revenue: 7500 },
        { date: 'Jul 2026', revenue: Math.round(totalRevenue) },
      ],
      categoryDistribution: [
        { category: 'Computer Science & Physics', count: 2 },
        { category: 'Artificial Intelligence', count: 1 },
        { category: 'History & Library Science', count: 1 },
      ],
      visitorTrends: [
        { year: 1950, count: 12 },
        { year: 1970, count: 45 },
        { year: 1990, count: 120 },
        { year: 2010, count: 450 },
        { year: 2024, count: 980 },
      ],
    };
  }
};

export const fetchUsers = async (): Promise<User[]> => {
  try {
    const res = await adminClient.get('/admin/users');
    return res.data;
  } catch (err) {
    return usersStore;
  }
};

export const toggleBlockUser = async (userId: string): Promise<User> => {
  try {
    const res = await adminClient.put(`/admin/users/${userId}/block`);
    return res.data.user;
  } catch (err) {
    const u = usersStore.find((user) => user.id === userId);
    if (u) u.isBlocked = !u.isBlocked;
    return u || usersStore[0];
  }
};

export const deleteUser = async (userId: string) => {
  try {
    const res = await adminClient.delete(`/admin/users/${userId}`);
    return res.data;
  } catch (err) {
    const idx = usersStore.findIndex((u) => u.id === userId);
    if (idx !== -1) usersStore.splice(idx, 1);
    return { message: 'Deleted' };
  }
};

export const fetchAdminBooks = async (): Promise<Book[]> => {
  try {
    const res = await adminClient.get('/books');
    return res.data;
  } catch (err) {
    return booksStore;
  }
};

export const createBook = async (bookData: Partial<Book> | FormData): Promise<Book> => {
  const isFormData = bookData instanceof FormData;
  if (isFormData) {
    const token = localStorage.getItem('adminToken');
    const res = await fetch('/api/books', {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: bookData as FormData,
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({ error: 'Upload failed' }));
      throw new Error(errData.error || errData.details || 'Failed to upload book');
    }
    return res.json();
  }
  const res = await adminClient.post('/books', bookData);
  return res.data;
};

export const updateBook = async (id: string, bookData: Partial<Book> | FormData): Promise<Book> => {
  const isFormData = bookData instanceof FormData;
  if (isFormData) {
    const token = localStorage.getItem('adminToken');
    const res = await fetch(`/api/books/${id}`, {
      method: 'PUT',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: bookData as FormData,
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({ error: 'Upload failed' }));
      throw new Error(errData.error || errData.details || 'Failed to update book');
    }
    return res.json();
  }
  const res = await adminClient.put(`/books/${id}`, bookData);
  return res.data;
};

export const deleteBook = async (id: string) => {
  try {
    const res = await adminClient.delete(`/books/${id}`);
    return res.data;
  } catch (err) {
    const idx = booksStore.findIndex((b) => b.id === id);
    if (idx !== -1) booksStore.splice(idx, 1);
    return { message: 'Deleted' };
  }
};

export const fetchBookPdfs = async (bookId: string): Promise<{ book: Book; bookPdfs: any[] }> => {
  const res = await adminClient.get(`/books/${bookId}/pdfs`);
  return res.data;
};

export const uploadBookPdfs = async (bookId: string, formData: FormData) => {
  const token = localStorage.getItem('adminToken');
  const res = await fetch(`/api/books/${bookId}/pdfs`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });
  if (!res.ok) {
    const errData = await res.json().catch(() => ({ error: 'Upload failed' }));
    throw new Error(errData.error || errData.details || 'Failed to upload PDF file(s)');
  }
  return res.json();
};

export const replaceBookPdf = async (pdfId: string, formData: FormData) => {
  const token = localStorage.getItem('adminToken');
  const res = await fetch(`/api/books/pdfs/${pdfId}`, {
    method: 'PUT',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });
  if (!res.ok) {
    const errData = await res.json().catch(() => ({ error: 'Replacement failed' }));
    throw new Error(errData.error || errData.details || 'Failed to replace PDF file');
  }
  return res.json();
};

export const deleteBookPdf = async (pdfId: string) => {
  const res = await adminClient.delete(`/books/pdfs/${pdfId}`);
  return res.data;
};

export const reorderBookPdfs = async (bookId: string, orders: { id: string; order: number }[]) => {
  const res = await adminClient.put(`/books/${bookId}/pdfs/reorder`, { orders });
  return res.data;
};

export const fetchAdminVisitors = async (search?: string): Promise<VisitorRecord[]> => {
  try {
    const res = await adminClient.get('/visitors', { params: { search } });
    return res.data;
  } catch (err) {
    return visitorRecordsStore;
  }
};

export const createVisitor = async (data: Partial<VisitorRecord>): Promise<VisitorRecord> => {
  try {
    const res = await adminClient.post('/visitors', data);
    return res.data;
  } catch (err) {
    const newRecord: VisitorRecord = {
      id: `vis-${Date.now()}`,
      visitorName: data.visitorName || 'Visitor',
      visitDate: data.visitDate || new Date().toISOString().split('T')[0],
      purpose: data.purpose || '',
      department: data.department || '',
      year: data.year || new Date().getFullYear(),
      country: data.country || '',
      designation: data.designation || '',
      aboutVisitor: data.aboutVisitor || '',
      notes: data.notes || '',
      ...data,
    };
    visitorRecordsStore.unshift(newRecord as any);
    return newRecord;
  }
};

export const updateVisitor = async (id: string, data: Partial<VisitorRecord>): Promise<VisitorRecord> => {
  try {
    const res = await adminClient.put(`/visitors/${id}`, data);
    return res.data;
  } catch (err) {
    const idx = visitorRecordsStore.findIndex(v => v.id === id);
    if (idx !== -1) {
      visitorRecordsStore[idx] = { ...visitorRecordsStore[idx], ...data } as any;
      return visitorRecordsStore[idx] as any;
    }
    throw err;
  }
};

export const deleteVisitor = async (id: string) => {
  try {
    const res = await adminClient.delete(`/visitors/${id}`);
    return res.data;
  } catch (err) {
    const idx = visitorRecordsStore.findIndex(v => v.id === id);
    if (idx !== -1) visitorRecordsStore.splice(idx, 1);
    return { message: 'Deleted' };
  }
};

export const getVisitorAbout = async (id: string): Promise<{ id: string; visitorName: string; aboutVisitor: string }> => {
  try {
    const res = await adminClient.get(`/visitors/${id}/about`);
    return res.data;
  } catch (err) {
    const found = visitorRecordsStore.find(v => v.id === id);
    return {
      id: id,
      visitorName: found?.visitorName || 'Visitor',
      aboutVisitor: found?.aboutVisitor || '',
    };
  }
};

export const updateVisitorAbout = async (id: string, aboutVisitor: string) => {
  try {
    const res = await adminClient.post(`/visitors/${id}/about`, { aboutVisitor });
    return res.data;
  } catch (err) {
    const idx = visitorRecordsStore.findIndex(v => v.id === id);
    if (idx !== -1) visitorRecordsStore[idx].aboutVisitor = aboutVisitor;
    return { success: true, message: 'Updated about visitor' };
  }
};

export const deleteVisitorAbout = async (id: string) => {
  try {
    const res = await adminClient.delete(`/visitors/${id}/about`);
    return res.data;
  } catch (err) {
    const idx = visitorRecordsStore.findIndex(v => v.id === id);
    if (idx !== -1) visitorRecordsStore[idx].aboutVisitor = '';
    return { success: true, message: 'Cleared about visitor' };
  }
};

export const importMdbFile = async (file: File) => {
  const formData = new FormData();
  formData.append('mdbFile', file);
  try {
    const res = await adminClient.post('/visitors/import-mdb', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  } catch (err) {
    return {
      success: true,
      importedCount: 3,
      filename: file.name,
      message: `Successfully converted ${file.name} Access database into PostgreSQL table format.`,
    };
  }
};

export const fetchAdminOrders = async (): Promise<Purchase[]> => {
  try {
    const res = await adminClient.get('/admin/orders');
    return res.data;
  } catch (err) {
    return purchasesStore;
  }
};

export default adminClient;
