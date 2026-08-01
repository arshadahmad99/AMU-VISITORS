import { Router, Response } from 'express';
import { Purchase, Bookmark, ReadingHistory } from '@digital-library/types';
import { purchasesStore, booksStore, usersStore, bookmarksStore, readingHistoryStore } from '../services/store';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// GET Center Section: Latest 10 users who purchased books
router.get('/recent-buyers', (req, res) => {
  // Sort descending by date and limit to 10
  const sorted = [...purchasesStore].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const recent10 = sorted.slice(0, 10);
  return res.json(recent10);
});

// POST Checkout / Buy eBook
router.post('/checkout', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const { bookId, paymentMethod } = req.body;

  if (!bookId) {
    return res.status(400).json({ error: 'Book ID is required' });
  }

  const book = booksStore.find((b) => b.id === bookId);
  if (!book) {
    return res.status(404).json({ error: 'Book not found' });
  }

  const user = usersStore.find((u) => u.id === req.user?.id);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  // Create Purchase record
  const newPurchase: Purchase = {
    id: `purch-${Date.now()}`,
    userId: user.id,
    userName: user.name,
    userEmail: user.email,
    userAvatar: user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user.name)}`,
    bookId: book.id,
    bookTitle: book.title,
    bookCover: book.coverImage,
    amount: book.price,
    paymentMethod: paymentMethod || 'Credit Card',
    status: 'COMPLETED',
    createdAt: new Date().toISOString(),
  };

  purchasesStore.unshift(newPurchase);

  // Initialize reading history for user
  const existingHistory = readingHistoryStore.find((rh) => rh.userId === user.id && rh.bookId === book.id);
  if (!existingHistory) {
    readingHistoryStore.push({
      id: `rh-${Date.now()}`,
      userId: user.id,
      bookId: book.id,
      lastPage: 1,
      totalPages: book.totalPages,
      progressPercent: Math.round((1 / book.totalPages) * 100),
      updatedAt: new Date().toISOString(),
    });
  }

  return res.status(201).json({
    message: 'Purchase successful! Book added to My Library.',
    purchase: newPurchase,
  });
});

// GET My Library / Purchased Books
router.get('/my-purchases', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const myPurchases = purchasesStore.filter((p) => p.userId === req.user?.id && p.status === 'COMPLETED');
  
  const purchasedBooks = myPurchases.map((p) => {
    const book = booksStore.find((b) => b.id === p.bookId);
    const history = readingHistoryStore.find((rh) => rh.userId === req.user?.id && rh.bookId === p.bookId);
    return {
      purchaseId: p.id,
      purchasedAt: p.createdAt,
      lastPage: history?.lastPage || 1,
      progressPercent: history?.progressPercent || 0,
      book: book || { id: p.bookId, title: p.bookTitle, coverImage: p.bookCover, price: p.amount },
    };
  });

  return res.json(purchasedBooks);
});

// BOOKMARKS: Add or toggle bookmark
router.post('/bookmarks', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const { bookId, pageNumber, note } = req.body;
  if (!bookId || !pageNumber) {
    return res.status(400).json({ error: 'Book ID and page number are required' });
  }

  const existingIdx = bookmarksStore.findIndex(
    (bm) => bm.userId === req.user?.id && bm.bookId === bookId && bm.pageNumber === Number(pageNumber)
  );

  if (existingIdx !== -1) {
    // Remove bookmark
    bookmarksStore.splice(existingIdx, 1);
    return res.json({ message: 'Bookmark removed', isBookmarked: false });
  }

  const newBookmark: Bookmark = {
    id: `bm-${Date.now()}`,
    userId: req.user!.id,
    bookId,
    pageNumber: Number(pageNumber),
    note: note || `Page ${pageNumber} Bookmark`,
    createdAt: new Date().toISOString(),
  };

  bookmarksStore.push(newBookmark);
  return res.json({ message: 'Bookmark added', isBookmarked: true, bookmark: newBookmark });
});

// GET user bookmarks for a book
router.get('/bookmarks/:bookId', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const myBookmarks = bookmarksStore.filter((bm) => bm.userId === req.user?.id && bm.bookId === req.params.bookId);
  return res.json(myBookmarks.map((bm) => bm.pageNumber));
});

// READING HISTORY: Save last read page & continue reading progress
router.post('/reading-history', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const { bookId, pageNumber, totalPages } = req.body;
  if (!bookId || !pageNumber) {
    return res.status(400).json({ error: 'Book ID and page number are required' });
  }

  const page = Number(pageNumber);
  const total = Number(totalPages) || 10;
  const progress = Math.min(100, Math.round((page / total) * 100));

  const existingIdx = readingHistoryStore.findIndex((rh) => rh.userId === req.user?.id && rh.bookId === bookId);

  if (existingIdx !== -1) {
    readingHistoryStore[existingIdx].lastPage = page;
    readingHistoryStore[existingIdx].progressPercent = progress;
    readingHistoryStore[existingIdx].updatedAt = new Date().toISOString();
    return res.json(readingHistoryStore[existingIdx]);
  }

  const newHistory: ReadingHistory = {
    id: `rh-${Date.now()}`,
    userId: req.user!.id,
    bookId,
    lastPage: page,
    totalPages: total,
    progressPercent: progress,
    updatedAt: new Date().toISOString(),
  };

  readingHistoryStore.push(newHistory);
  return res.json(newHistory);
});

// GET last read page for continue reading
router.get('/reading-history/:bookId', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const history = readingHistoryStore.find((rh) => rh.userId === req.user?.id && rh.bookId === req.params.bookId);
  return res.json(history || { lastPage: 1, progressPercent: 0 });
});

export default router;
