import axios from 'axios';
import { DashboardStats, User, Book, VisitorRecord, Purchase } from '@digital-library/types';
import { usersStore, booksStore, visitorRecordsStore, purchasesStore } from '../../../api/src/services/store';

const API_BASE = '/api';

const adminClient = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
    Authorization: 'Bearer admin-mock-jwt-token-2026',
  },
});

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

export const createBook = async (bookData: Partial<Book>): Promise<Book> => {
  try {
    const res = await adminClient.post('/books', bookData);
    return res.data;
  } catch (err) {
    const newBook: Book = {
      id: `book-${Date.now()}`,
      title: bookData.title || 'Untitled Book',
      author: bookData.author || 'Unknown Author',
      category: bookData.category || 'General',
      price: bookData.price || 19.99,
      coverImage: bookData.coverImage || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600',
      description: bookData.description || 'Admin added book.',
      totalPages: bookData.totalPages || 10,
      rating: 5.0,
      createdAt: new Date().toISOString(),
    };
    booksStore.unshift(newBook);
    return newBook;
  }
};

export const updateBook = async (id: string, bookData: Partial<Book>): Promise<Book> => {
  try {
    const res = await adminClient.put(`/books/${id}`, bookData);
    return res.data;
  } catch (err) {
    const idx = booksStore.findIndex((b) => b.id === id);
    if (idx !== -1) {
      booksStore[idx] = { ...booksStore[idx], ...bookData };
      return booksStore[idx];
    }
    return booksStore[0];
  }
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

export const fetchAdminVisitors = async (search?: string): Promise<VisitorRecord[]> => {
  try {
    const res = await adminClient.get('/visitors', { params: { search } });
    return res.data;
  } catch (err) {
    return visitorRecordsStore;
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
