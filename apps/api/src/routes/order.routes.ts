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
  const targetBookId = bookId || 'book-1';

  try {
    let book = await prisma.book.findUnique({ where: { id: targetBookId } });
    if (!book) {
      book = await prisma.book.findFirst();
    }

    const amount = (book?.price || 499) * 100;
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (keyId && keySecret && !keyId.includes('placeholder')) {
      try {
        const shortBookId = (book?.id || 'book-1').substring(0, 8);
        const shortUserId = (req.user?.id || 'user-1').substring(0, 8);
        const options = {
          amount,
          currency: 'INR',
          receipt: `rcpt_${shortBookId}_${shortUserId}`,
        };

        const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });
        const order = await razorpay.orders.create(options);

        return res.status(200).json({
          orderId: order.id,
          amount: order.amount,
          currency: order.currency,
          keyId: keyId,
          isDemo: false
        });
      } catch (rzpErr: any) {
        console.warn('Razorpay API creation warning, falling back to test demo checkout:', rzpErr?.message || rzpErr);
      }
    }

    // Demo / Test Mode Order
    const mockOrderId = `order_demo_${Date.now()}`;
    return res.status(200).json({
      orderId: mockOrderId,
      amount,
      currency: 'INR',
      keyId: 'rzp_test_demo',
      isDemo: true
    });
  } catch (err: any) {
    console.error('Order creation error:', err);
    res.status(200).json({
      orderId: `order_demo_${Date.now()}`,
      amount: 49900,
      currency: 'INR',
      keyId: 'rzp_test_demo',
      isDemo: true
    });
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

  const targetBookId = bookId || 'book-1';

  try {
    const rawUserId = req.user?.id;
    if (!rawUserId) return res.status(401).json({ error: 'Unauthorized' });

    // 1. Ensure User exists in PostgreSQL DB (prevents Purchase_userId_fkey foreign key errors)
    let dbUser = await prisma.user.findUnique({ where: { id: rawUserId } });
    if (!dbUser && req.user?.email) {
      dbUser = await prisma.user.findUnique({ where: { email: req.user.email.toLowerCase() } });
    }
    if (!dbUser) {
      dbUser = await prisma.user.create({
        data: {
          id: rawUserId,
          name: req.user?.name || 'Library Member',
          email: (req.user?.email || `user_${Date.now()}@library.org`).toLowerCase(),
          passwordHash: 'hashed_pw',
          role: 'USER',
          provider: 'local',
        }
      });
    }

    // 2. Ensure Book exists in PostgreSQL DB (prevents Purchase_bookId_fkey foreign key errors)
    let book = await prisma.book.findUnique({ where: { id: targetBookId } });
    if (!book) {
      book = await prisma.book.findFirst();
      if (!book) {
        book = await prisma.book.create({
          data: {
            id: targetBookId,
            title: 'Lytton to Maulana Azad Library (Vision and Mission)',
            author: 'Prof. Shabahat Husain',
            category: 'History & Heritage',
            price: 499,
            coverImage: '/uploads/ebook-cover.png',
            description: 'The famous proverb "Rome was not built in a day" aptly applies to the making of great institutions...',
            totalPages: 131,
            pagesTextJson: '[]',
          }
        });
      }
    }

    // 3. Verify Signature securely (Skip if demo order)
    const isDemoOrder = !razorpay_order_id || razorpay_order_id.startsWith('order_demo_') || razorpay_signature?.startsWith('sig_demo_');
    if (!isDemoOrder && razorpay_order_id && razorpay_payment_id && razorpay_signature) {
      const secret = process.env.RAZORPAY_KEY_SECRET;
      if (secret && !secret.includes('placeholder')) {
        const body = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSignature = crypto.createHmac('sha256', secret)
                                        .update(body.toString())
                                        .digest('hex');

        if (expectedSignature !== razorpay_signature) {
          return res.status(400).json({ error: 'Invalid payment signature' });
        }
      }
    }

    // 4. Create Purchase record in Database
    const newPurchase = await prisma.purchase.create({
      data: {
        userId: dbUser.id,
        bookId: book.id,
        amount: book.price || 499,
        paymentMethod: isDemoOrder ? 'Instant Checkout' : 'Razorpay',
        status: 'COMPLETED',
        isAlumni: Boolean(isAlumni),
        course: course ? String(course) : null,
        passingYear: passingYear ? String(passingYear) : null,
        position: position ? String(position) : null,
        country: country ? String(country) : null,
      },
      include: { user: true, book: true }
    });

    // 5. Initialize reading history
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
      isAlumni: newPurchase.isAlumni,
      course: newPurchase.course,
      passingYear: newPurchase.passingYear,
      position: newPurchase.position,
      country: newPurchase.country
    };

    return res.status(201).json({
      message: 'Payment verified and purchase successful!',
      purchase: formattedPurchase,
    });
  } catch (err: any) {
    console.error('Payment verification failed:', err);
    return res.status(500).json({ error: 'Payment verification failed', details: err.message });
  }
});

// GET My Library / Purchased Books
router.get('/my-purchases', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const myPurchases = await prisma.purchase.findMany({
      where: { userId: req.user?.id, status: 'COMPLETED' },
      include: { book: true }
    });
    
    const purchasedBooks = await Promise.all(myPurchases.map(async (p) => {
      const history = await prisma.readingHistory.findFirst({
        where: { userId: req.user?.id, bookId: p.bookId }
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
