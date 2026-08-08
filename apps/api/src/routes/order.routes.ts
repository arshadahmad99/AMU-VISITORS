import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';
import { purchasesStore, booksStore, readingHistoryStore, bookmarksStore } from '../services/store';
import { Bookmark, ReadingHistory } from '@digital-library/types';
import Razorpay from 'razorpay';
import crypto from 'crypto';

const prisma = new PrismaClient();
const router = Router();

// (Razorpay instantiated inside routes to ensure dotenv is loaded)

// GET Center Section: Latest 10 users who purchased books
router.get('/recent-buyers', async (req, res) => {
  try {
    const recent = await prisma.purchase.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: {
        user: { select: { id: true, name: true, email: true, avatar: true } },
        book: { select: { id: true, title: true, coverImage: true, price: true } }
      }
    });

    const formatted = recent.map(r => ({
      id: r.id,
      userId: r.userId,
      userName: r.user.name,
      userEmail: r.user.email,
      userAvatar: r.user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(r.user.name)}`,
      bookId: r.bookId,
      bookTitle: r.book.title,
      bookCover: r.book.coverImage,
      amount: r.amount,
      paymentMethod: r.paymentMethod,
      status: r.status,
      createdAt: r.createdAt,
      // Pass the alumni data to the frontend
      isAlumni: r.isAlumni,
      course: r.course,
      passingYear: r.passingYear,
      position: r.position,
      country: r.country,
    }));

    return res.json(formatted);
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to fetch buyers', details: err.message });
  }
});

// POST Create Razorpay Order
router.post('/create-razorpay-order', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  const { bookId } = req.body;
  if (!bookId) return res.status(400).json({ error: 'Book ID is required' });

  try {
    const book = await prisma.book.findUnique({ where: { id: bookId } });
    if (!book) return res.status(404).json({ error: 'Book not found' });

    // Razorpay amount is in smallest currency unit (paise). 1 INR = 100 paise
    const amount = book.price * 100;
    
    // Razorpay receipt length must be <= 40 chars
    const shortBookId = bookId.substring(0, 8);
    const shortUserId = req.user?.id.substring(0, 8);
    const options = {
      amount,
      currency: 'INR',
      receipt: `rcpt_${shortBookId}_${shortUserId}`,
    };

    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder',
      key_secret: process.env.RAZORPAY_KEY_SECRET || 'rzp_test_secret_placeholder',
    });

    const order = await razorpay.orders.create(options);
    
    res.status(200).json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
    });
  } catch (err: any) {
    console.error('Razorpay Error:', JSON.stringify(err, null, 2));
    res.status(500).json({ error: 'Failed to create order', details: err });
  }
});

// POST Verify Razorpay Payment and Checkout
router.post('/verify-razorpay-payment', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  const { 
    razorpay_order_id, 
    razorpay_payment_id, 
    razorpay_signature, 
    bookId, 
    isAlumni, 
    course, 
    passingYear, 
    position, 
    country 
  } = req.body;

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !bookId) {
    return res.status(400).json({ error: 'Missing payment or book details' });
  }

  try {
    // 1. Verify Signature securely
    const secret = process.env.RAZORPAY_KEY_SECRET || 'rzp_test_secret_placeholder';
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto.createHmac('sha256', secret)
                                    .update(body.toString())
                                    .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ error: 'Invalid payment signature' });
    }

    // 2. Fetch Book to ensure it exists
    const book = await prisma.book.findUnique({ where: { id: bookId } });
    if (!book) {
      return res.status(404).json({ error: 'Book not found' });
    }

    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    // 3. Create Purchase record in Database
    const newPurchase = await prisma.purchase.create({
      data: {
        userId,
        bookId,
        amount: book.price,
        paymentMethod: 'Razorpay',
        status: 'COMPLETED',
        isAlumni: Boolean(isAlumni),
        course: course || null,
        passingYear: passingYear || null,
        position: position || null,
        country: country || null,
      },
      include: { user: true, book: true }
    });

    // 4. Initialize reading history
    const existingHistory = await prisma.readingHistory.findFirst({
      where: { userId, bookId }
    });
    
    if (!existingHistory) {
      await prisma.readingHistory.create({
        data: {
          userId,
          bookId,
          lastPage: 1,
          totalPages: book.totalPages,
          progressPercent: Math.round((1 / book.totalPages) * 100)
        }
      });
    }

    const formattedPurchase = {
      id: newPurchase.id,
      userId: newPurchase.userId,
      userName: newPurchase.user.name,
      userEmail: newPurchase.user.email,
      userAvatar: newPurchase.user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(newPurchase.user.name)}`,
      bookId: newPurchase.bookId,
      bookTitle: newPurchase.book.title,
      bookCover: newPurchase.book.coverImage,
      amount: newPurchase.amount,
      paymentMethod: newPurchase.paymentMethod,
      status: newPurchase.status,
      createdAt: newPurchase.createdAt,
    };

    return res.status(201).json({
      message: 'Payment verified and purchase successful!',
      purchase: formattedPurchase,
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Payment verification failed', details: err.message });
  }
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
