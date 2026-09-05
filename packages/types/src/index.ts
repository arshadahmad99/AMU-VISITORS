export type UserRole = 'USER' | 'ADMIN';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: UserRole;
  provider: 'local' | 'google' | 'microsoft' | 'apple' | 'facebook';
  isBlocked: boolean;
  createdAt: string;
}

export interface Book {
  id: string;
  title: string;
  author: string;
  category: string;
  price: number;
  coverImage: string;
  pdfUrl?: string;
  description: string;
  totalPages: number;
  rating: number;
  samplePages?: string[];
  pagesText?: string[]; // Array of strings representing full page text for in-book search & reading rendering
  pageImages?: { pageNum: number; imageUrl: string }[];
  createdAt: string;
}

export interface Purchase {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  userEmail: string;
  bookId: string;
  bookTitle: string;
  bookCover?: string;
  amount: number;
  paymentMethod: string;
  status: 'COMPLETED' | 'PENDING' | 'FAILED';
  createdAt: string;
}

export interface VisitorRecord {
  id: string;
  visitorName: string;
  visitDate: string;
  purpose?: string | null;
  department?: string | null;
  contact?: string | null;
  year?: number | null;
  country?: string | null;
  designation?: string | null;
  pageNumber?: number | null;
  autographPath?: string | null;
  notes?: string | null;
  aboutVisitor?: string | null;
  originalMdbId?: string | null;
  pageIndex?: number | null;
  visitorImagePath?: string | null;
  importedAt?: string;
}

export interface Bookmark {
  id: string;
  userId: string;
  bookId: string;
  pageNumber: number;
  title?: string;
  note?: string;
  createdAt: string;
}

export interface ReadingHistory {
  id: string;
  userId: string;
  bookId: string;
  lastPage: number;
  totalPages: number;
  progressPercent: number;
  updatedAt: string;
}

export interface Payment {
  id: string;
  orderId: string;
  transactionId: string;
  amount: number;
  gateway: 'STRIPE' | 'PAYPAL' | 'CREDIT_CARD' | 'MOCK';
  status: 'SUCCESS' | 'PENDING' | 'REFUNDED';
  createdAt: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface SocialAuthDTO {
  provider: 'google' | 'microsoft' | 'apple' | 'facebook';
  accessToken?: string;
  email?: string;
  name?: string;
}

export interface DashboardStats {
  totalUsers: number;
  totalBooks: number;
  totalSales: number;
  totalRevenue: number;
  totalVisitorRecords: number;
  revenueChart: { date: string; revenue: number }[];
  categoryDistribution: { category: string; count: number }[];
  visitorTrends: { year: number; count: number }[];
}

export interface MdbImportResult {
  success: boolean;
  importedCount: number;
  filename: string;
  records: VisitorRecord[];
  message: string;
}
