import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, optionalAuthenticateToken, AuthenticatedRequest } from '../middleware/auth';
import { purchasesStore, booksStore, readingHistoryStore, bookmarksStore } from '../services/store';
import { Bookmark, ReadingHistory } from '@digital-library/types';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import { resolveUserIdentity, buildCompletedPurchaseWhere } from '../utils/purchaseAccess';

const prisma = new PrismaClient();
const router = Router();

const INTERNATIONAL_USD_PRICE = 10;
const USD_TO_INR_RATE = Number(process.env.USD_TO_INR_RATE || 85);

const extractCountryHeader = (req: any): string | null => {
  const headerNames = [
    'cf-ipcountry',
    'x-vercel-ip-country',
    'cloudfront-viewer-country',
    'x-country-code',
    'x-geo-country',
  ];
  for (const name of headerNames) {
    const raw = req.headers?.[name];
    if (typeof raw === 'string') {
      const code = raw.trim().toUpperCase();
      if (/^[A-Z]{2}$/.test(code) && code !== 'XX' && code !== 'T1') {
        return code;
      }
    }
  }
  return null;
};

const isIndiaRequest = (req: any, timezone?: string): boolean => {
  const countryCode = extractCountryHeader(req);
  if (countryCode) {
    return countryCode === 'IN';
  }
  const tz = String(timezone || req.headers?.['x-timezone'] || '').trim();
  if (tz) {
    return tz === 'Asia/Kolkata' || tz === 'Asia/Calcutta';
  }
  return true;
};

// (Razorpay instantiated inside routes to ensure dotenv is loaded)

// GET Regional Pricing (INR for India, $10 USD outside India)
router.get('/pricing', async (req, res) => {
  try {
    const tz = typeof req.query.tz === 'string' ? req.query.tz : undefined;
    const isIndia = isIndiaRequest(req, tz);
    let inrPrice = 499;
    try {
      const book = await prisma.book.findFirst({ select: { price: true } });
      if (book?.price && book.price > 0) {
        inrPrice = Math.round(book.price);
      }
    } catch (_) {}

    if (isIndia) {
      return res.json({
        isIndia: true,
        currency: 'INR',
        amount: inrPrice,
        displayPrice: `${inrPrice} INR`,
      });
    }

    return res.json({
      isIndia: false,
      currency: 'USD',
      amount: INTERNATIONAL_USD_PRICE,
      displayPrice: `$${INTERNATIONAL_USD_PRICE} USD`,
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to determine pricing', details: err?.message });
  }
});

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
    const { bookId, timezone } = req.body;

    // Security: Calculate currency and amount strictly on the server.
    // Client-supplied amount and currency are ignored.
    const isIndia = isIndiaRequest(req, timezone);
    const targetCurrency = isIndia ? 'INR' : 'USD';

    const targetBookId = bookId || 'book-1';
    let book = await prisma.book.findUnique({ where: { id: targetBookId } });
    if (!book) {
      book = await prisma.book.findFirst();
    }
    const bookPriceInr = book?.price || 499;

    // Fixed price logic:
    // Indian customers: bookPriceInr * 100 paise (e.g. 49900 paise = 499 INR)
    // International customers: INTERNATIONAL_USD_PRICE (10) * 100 cents = 1000 cents ($10.00 USD)
    const amount = isIndia
      ? Math.round(bookPriceInr * 100)
      : Math.round(INTERNATIONAL_USD_PRICE * 100);

    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
      return res.status(500).json({ error: 'Razorpay credentials not configured on server' });
    }

    const shortId = (bookId || 'order').substring(0, 8);
    const userId = (req.user?.id || 'guest').substring(0, 8);
    const orderReceipt = (req.body.receipt || `rcpt_${shortId}_${userId}_${Date.now().toString().slice(-6)}`).slice(0, 40);

    const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });

    const order = await razorpay.orders.create({
      amount,
      currency: targetCurrency,
      receipt: orderReceipt,
    });

    return res.status(200).json({
      order_id: order.id,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      displayCurrency: targetCurrency,
      displayAmount: targetCurrency === 'USD' ? INTERNATIONAL_USD_PRICE : bookPriceInr,
      key_id: keyId,
      keyId: keyId,
      isDemo: false
    });
  } catch (err: any) {
    console.error('Razorpay Create Order Error:', err);
    const details = err?.error?.description || err?.message || String(err);
    return res.status(500).json({
      error: 'Failed to create Razorpay order',
      details
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

  // Step 2: Ensure credentials are available
  const secret = process.env.RAZORPAY_KEY_SECRET;
  const keyId = process.env.RAZORPAY_KEY_ID;
  if (!secret || !keyId) {
    return res.status(500).json({ error: 'Razorpay credentials not configured on server' });
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

  // Step 4: Idempotency check - prevent duplicate payments
  try {
    const existingPayment = await prisma.payment.findUnique({
      where: { transactionId: paymentId },
      include: {
        purchase: {
          include: { user: true, book: true }
        }
      }
    });

    if (existingPayment) {
      const p = existingPayment.purchase;
      return res.status(200).json({
        success: true,
        message: 'Payment already verified',
        order_id: orderId,
        payment_id: paymentId,
        purchase: {
          id: p.id,
          userId: p.userId,
          userName: p.user.name,
          userEmail: p.user.email,
          userAvatar: p.user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(p.user.name)}`,
          bookId: p.bookId,
          bookTitle: p.book.title,
          bookCover: p.book.coverImage,
          amount: p.amount,
          paymentMethod: p.paymentMethod,
          status: p.status,
          createdAt: p.createdAt,
          isAlumni: p.isAlumni,
          course: p.course,
          passingYear: p.passingYear,
          position: p.position,
          country: p.country
        }
      });
    }

    // Step 5: Fetch payment directly from Razorpay to verify status & method
    const razorpay = new Razorpay({ key_id: keyId, key_secret: secret });
    let rzpPayment: any = null;
    try {
      rzpPayment = await razorpay.payments.fetch(paymentId);
    } catch (fetchErr: any) {
      console.error('Failed to fetch payment details from Razorpay:', fetchErr);
      return res.status(400).json({
        success: false,
        error: 'Failed to verify payment status with gateway',
        details: fetchErr?.error?.description || fetchErr?.message
      });
    }

    // Step 6: Validate payment status from gateway
    if (!rzpPayment || (rzpPayment.status !== 'captured' && rzpPayment.status !== 'authorized')) {
      return res.status(400).json({
        success: false,
        error: `Payment is not successful (status: ${rzpPayment?.status || 'unknown'})`
      });
    }

    // Verify order ID match
    if (rzpPayment.order_id && rzpPayment.order_id !== orderId) {
      return res.status(400).json({
        success: false,
        error: 'Payment order ID mismatch'
      });
    }

    // Determine gateway and payment method label
    const isPayPal = rzpPayment.wallet === 'paypal' || (rzpPayment.method === 'wallet' && String(rzpPayment.wallet).toLowerCase().includes('paypal'));
    const paymentGateway = isPayPal ? 'PAYPAL' : 'CREDIT_CARD';
    const paymentMethodLabel = isPayPal ? 'PayPal' : 'Razorpay';

    // Step 7: Record purchase and payment in database
    let formattedPurchase: any = null;
    const rawUserId = req.user?.id;

    let dbUser: any = null;
    if (rawUserId) {
      dbUser = await prisma.user.findUnique({ where: { id: rawUserId } });
    }
    if (!dbUser && req.user?.email) {
      dbUser = await prisma.user.findFirst({
        where: { email: { equals: req.user.email.trim(), mode: 'insensitive' } }
      });
    }
    if (!dbUser && rzpPayment.email) {
      dbUser = await prisma.user.findFirst({
        where: { email: { equals: rzpPayment.email.trim(), mode: 'insensitive' } }
      });
    }
    if (!dbUser && rawUserId) {
      const defaultHash = await bcrypt.hash('Password123!', 10);
      dbUser = await prisma.user.create({
        data: {
          id: rawUserId,
          name: req.user?.name || 'Library Member',
          email: (req.user?.email || rzpPayment.email || `user_${Date.now()}@library.org`).toLowerCase(),
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
      // Check if user already owns completed purchase for this book
      const existingUserPurchase = await prisma.purchase.findFirst({
        where: {
          userId: dbUser.id,
          bookId: book.id,
          status: { in: ['COMPLETED', 'completed', 'SUCCESS', 'success', 'PAID', 'paid'] }
        },
        include: { user: true, book: true }
      });

      if (existingUserPurchase) {
        // Idempotently create payment record if not yet linked
        try {
          await prisma.payment.create({
            data: {
              purchaseId: existingUserPurchase.id,
              transactionId: paymentId,
              amount: rzpPayment.currency === 'USD' ? INTERNATIONAL_USD_PRICE : (rzpPayment.amount ? rzpPayment.amount / 100 : (book.price || 499)),
              gateway: paymentGateway,
              status: 'SUCCESS'
            }
          });
        } catch (_) {}

        return res.status(200).json({
          success: true,
          message: 'Purchase already completed for this user',
          order_id: orderId,
          payment_id: paymentId,
          purchase: {
            id: existingUserPurchase.id,
            userId: existingUserPurchase.userId,
            userName: existingUserPurchase.user.name,
            userEmail: existingUserPurchase.user.email,
            userAvatar: existingUserPurchase.user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(existingUserPurchase.user.name)}`,
            bookId: existingUserPurchase.bookId,
            bookTitle: existingUserPurchase.book.title,
            bookCover: existingUserPurchase.book.coverImage,
            amount: existingUserPurchase.amount,
            paymentMethod: existingUserPurchase.paymentMethod,
            status: existingUserPurchase.status,
            createdAt: existingUserPurchase.createdAt,
            isAlumni: existingUserPurchase.isAlumni,
            course: existingUserPurchase.course,
            passingYear: existingUserPurchase.passingYear,
            position: existingUserPurchase.position,
            country: existingUserPurchase.country
          }
        });
      }

      // Calculate amounts:
      // For USD orders: recorded purchase amount uses USD_TO_INR_RATE for feed display
      // Payment amount stores the actual USD or INR amount
      const isUsdPayment = rzpPayment.currency === 'USD';
      const recordedPaymentAmount = isUsdPayment
        ? INTERNATIONAL_USD_PRICE
        : (rzpPayment.amount ? rzpPayment.amount / 100 : (book.price || 499));

      const recordedPurchaseAmount = isUsdPayment
        ? Math.round(INTERNATIONAL_USD_PRICE * USD_TO_INR_RATE)
        : Math.round(recordedPaymentAmount);

      const newPurchase = await prisma.purchase.create({
        data: {
          userId: dbUser.id,
          bookId: book.id,
          amount: recordedPurchaseAmount,
          paymentMethod: paymentMethodLabel,
          status: 'COMPLETED',
          isAlumni: Boolean(isAlumni),
          course: course ? String(course) : null,
          passingYear: passingYear ? String(passingYear) : null,
          position: position ? String(position) : null,
          country: country ? String(country) : null,
          payment: {
            create: {
              transactionId: paymentId,
              amount: recordedPaymentAmount,
              gateway: paymentGateway,
              status: 'SUCCESS'
            }
          }
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

    return res.status(200).json({
      success: true,
      message: 'Payment verified successfully',
      order_id: orderId,
      payment_id: paymentId,
      purchase: formattedPurchase || undefined
    });
  } catch (err: any) {
    console.error('Error recording purchase after verification:', err);
    return res.status(500).json({
      success: false,
      error: 'Error recording purchase after verification',
      details: err?.message
    });
  }
};

// Webhook for Razorpay notifications with signature verification & duplicate protection
router.post('/webhook', async (req, res) => {
  try {
    const signature = req.headers['x-razorpay-signature'] as string;
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || process.env.RAZORPAY_KEY_SECRET;

    if (!signature || !webhookSecret) {
      return res.status(400).json({ error: 'Missing webhook signature or secret' });
    }

    const rawBody = (req as any).rawBody || JSON.stringify(req.body);
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(rawBody)
      .digest('hex');

    if (expectedSignature !== signature) {
      return res.status(400).json({ error: 'Invalid webhook signature' });
    }

    const event = req.body?.event;
    const payload = req.body?.payload;

    if (event === 'payment.captured' || event === 'order.paid') {
      const paymentEntity = payload?.payment?.entity;
      if (paymentEntity && paymentEntity.id) {
        // Prevent duplicate processing
        const existingPayment = await prisma.payment.findUnique({
          where: { transactionId: paymentEntity.id }
        });
        if (existingPayment) {
          return res.status(200).json({ status: 'already_processed' });
        }
      }
    }

    return res.status(200).json({ status: 'ok' });
  } catch (err: any) {
    console.error('Webhook processing error:', err);
    return res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// POST Create Order (both endpoint aliases)
router.post('/create-order', optionalAuthenticateToken, createOrderHandler);
router.post('/create-razorpay-order', optionalAuthenticateToken, createOrderHandler);

// POST Verify Payment Signature (both endpoint aliases)
router.post('/verify-payment', optionalAuthenticateToken, verifyPaymentHandler);
router.post('/verify-razorpay-payment', optionalAuthenticateToken, verifyPaymentHandler);

// GET My Library / Purchased Books
router.get('/my-purchases', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { userId, email } = await resolveUserIdentity(prisma, req.user);

    if (!userId && !email) {
      return res.json([]);
    }

    const myPurchases = await prisma.purchase.findMany({
      where: buildCompletedPurchaseWhere(userId, email),
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
