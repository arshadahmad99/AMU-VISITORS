import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, optionalAuthenticateToken, AuthenticatedRequest } from '../middleware/auth';
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

// Standard Razorpay Order Creation Handler
export const createOrderHandler = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { bookId, currency, receipt } = req.body;
    let amount = req.body.amount !== undefined ? parseInt(String(req.body.amount), 10) : undefined;

    if (amount === undefined) {
      const targetBookId = bookId || 'book-1';
      let book = await prisma.book.findUnique({ where: { id: targetBookId } });
      if (!book) {
        book = await prisma.book.findFirst();
      }
      amount = Math.round((book?.price || 499) * 100);
    }

    // Validation: Minimum amount must be at least 100 paise (1 INR)
    if (isNaN(amount) || amount < 100) {
      return res.status(400).json({ error: 'Minimum amount must be at least 100 paise (1 INR)' });
    }

    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
      return res.status(500).json({ error: 'Razorpay credentials not configured on server' });
    }

    const shortId = (bookId || 'order').substring(0, 8);
    const userId = (req.user?.id || 'guest').substring(0, 8);
    const orderReceipt = receipt || `rcpt_${shortId}_${userId}_${Date.now().toString().slice(-6)}`;

    const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });
    const order = await razorpay.orders.create({
      amount,
      currency: currency || 'INR',
      receipt: orderReceipt,
    });

    return res.status(200).json({
      order_id: order.id,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      key_id: keyId,
      keyId: keyId,
      isDemo: false
    });
  } catch (err: any) {
    console.error('Razorpay Create Order Error:', err);
    return res.status(500).json({
      error: 'Failed to create Razorpay order',
      details: err?.message || err
    });
  }
};

// Standard Razorpay Payment Verification Handler
export const verifyPaymentHandler = async (req: AuthenticatedRequest, res: Response) => {
  const {
    bookId,
    isAlumni,
    course,
    passingYear,
    position,
    country
  } = req.body;

  // Support both snake_case and razorpay_ standard parameter names
  const orderId = req.body.razorpay_order_id || req.body.order_id;
  const paymentId = req.body.razorpay_payment_id || req.body.payment_id;
  const signature = req.body.razorpay_signature || req.body.signature;

  // Step 1: Validate required fields
  if (!orderId || !paymentId || !signature) {
    return res.status(400).json({
      error: 'Missing required payment verification fields (order_id, payment_id, and signature)'
    });
  }

  // Step 2: Ensure secret is available
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret) {
    return res.status(500).json({ error: 'Razorpay key secret not configured on server' });
  }

  // Step 3: Verify HMAC-SHA256 signature
  const body = `${orderId}|${paymentId}`;
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(body)
    .digest('hex');

  if (expectedSignature !== signature) {
    return res.status(400).json({
      success: false,
      error: 'Invalid payment signature'
    });
  }

  // Step 4: Record purchase in PostgreSQL DB if user or book context is present
  try {
    let formattedPurchase: any = null;
    const rawUserId = req.user?.id;

    if (rawUserId || bookId) {
      let dbUser: any = null;
      if (rawUserId) {
        dbUser = await prisma.user.findUnique({ where: { id: rawUserId } });
      }
      if (!dbUser && req.user?.email) {
        dbUser = await prisma.user.findUnique({ where: { email: req.user.email.toLowerCase() } });
      }
      if (!dbUser && rawUserId) {
        const defaultHash = await bcrypt.hash('Password123!', 10);
        dbUser = await prisma.user.create({
          data: {
            id: rawUserId,
            name: req.user?.name || 'Library Member',
            email: (req.user?.email || `user_${Date.now()}@library.org`).toLowerCase(),
            passwordHash: defaultHash,
            role: 'USER',
            provider: 'local',
          }
        });
      }

      const targetBookId = bookId || 'book-1';
      let book = await prisma.book.findUnique({ where: { id: targetBookId } });
      if (!book) {
        book = await prisma.book.findFirst();
      }

      if (book && dbUser) {
        const newPurchase = await prisma.purchase.create({
          data: {
            userId: dbUser.id,
            bookId: book.id,
            amount: book.price || 499,
            paymentMethod: 'Razorpay',
            status: 'COMPLETED',
            isAlumni: Boolean(isAlumni),
            course: course ? String(course) : null,
            passingYear: passingYear ? String(passingYear) : null,
            position: position ? String(position) : null,
            country: country ? String(country) : null,
          },
          include: { user: true, book: true }
        });

        // Initialize reading history
        const existingHistory = await prisma.readingHistory.findFirst({
          where: { userId: dbUser.id, bookId: book.id }
        });

        if (!existingHistory) {
          await prisma.readingHistory.create({
            data: {
              userId: dbUser.id,
              bookId: book.id,
              lastPage: 1,
              totalPages: book.totalPages || 131,
              progressPercent: Math.round((1 / (book.totalPages || 131)) * 100)
            }
          });
        }

        formattedPurchase = {
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
          isAlumni: newPurchase.isAlumni,
          course: newPurchase.course,
          passingYear: newPurchase.passingYear,
          position: newPurchase.position,
          country: newPurchase.country
        };
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Payment verified successfully',
      order_id: orderId,
      payment_id: paymentId,
      purchase: formattedPurchase || undefined
    });
  } catch (err: any) {
    console.error('Error recording purchase after verification:', err);
    return res.status(200).json({
      success: true,
      message: 'Payment signature verified successfully',
      order_id: orderId,
      payment_id: paymentId,
      details: err?.message
    });
  }
};

// POST Create Order (both endpoint aliases)
router.post('/create-order', optionalAuthenticateToken, createOrderHandler);
router.post('/create-razorpay-order', optionalAuthenticateToken, createOrderHandler);

// POST Verify Payment Signature (both endpoint aliases)
router.post('/verify-payment', optionalAuthenticateToken, verifyPaymentHandler);
router.post('/verify-razorpay-payment', optionalAuthenticateToken, verifyPaymentHandler);

// GET My Library / Purchased Books
router.get('/my-purchases', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const rawUserId = req.user?.id;
    const rawEmail = req.user?.email?.trim().toLowerCase();

    // Find dbUser by id or email
    let dbUser = rawUserId ? await prisma.user.findUnique({ where: { id: rawUserId } }) : null;
    if (!dbUser && rawEmail) {
      dbUser = await prisma.user.findUnique({ where: { email: rawEmail } });
    }

    const userId = dbUser?.id || rawUserId;
    const email = dbUser?.email || rawEmail;

    if (!userId && !email) {
      return res.json([]);
    }

    // Sync any purchases belonging to this email to the active userId
    if (userId && email) {
      await prisma.purchase.updateMany({
        where: {
          user: { email: { equals: email, mode: 'insensitive' } },
          userId: { not: userId }
        },
        data: { userId }
      });
    }

    const myPurchases = await prisma.purchase.findMany({
      where: {
        status: 'COMPLETED',
        OR: [
          ...(userId ? [{ userId }] : []),
          ...(email ? [{ user: { email: { equals: email, mode: 'insensitive' as const } } }] : [])
        ]
      },
      include: { book: true }
    });
    
    const purchasedBooks = await Promise.all(myPurchases.map(async (p) => {
      const history = await prisma.readingHistory.findFirst({
        where: {
          bookId: p.bookId,
          OR: [
            ...(userId ? [{ userId }] : []),
            ...(email ? [{ user: { email: { equals: email, mode: 'insensitive' as const } } }] : [])
          ]
        }
      });
      return {
        purchaseId: p.id,
        purchasedAt: p.createdAt,
        lastPage: history?.lastPage || 1,
        progressPercent: history?.progressPercent || 0,
        book: p.book,
      };
    }));

    return res.json(purchasedBooks);
  } catch (err: any) {
    console.error('Failed to fetch purchases:', err);
    return res.status(500).json({ error: 'Failed to fetch purchases', details: err.message });
  }
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
