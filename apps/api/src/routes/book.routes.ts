import { Router, Request, Response } from 'express';
import multer from 'multer';
import { PrismaClient } from '@prisma/client';
import { searchInBookPages } from '@digital-library/utils';
import { authenticateToken, requireAdmin, AuthenticatedRequest } from '../middleware/auth';
import path from 'path';

const prisma = new PrismaClient();
const router = Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.fieldname === 'pdfFile') {
      const p = path.join(__dirname, '../../secure_uploads/books');
      if (!require('fs').existsSync(p)) {
        require('fs').mkdirSync(p, { recursive: true });
      }
      cb(null, p);
    } else {
      cb(null, path.join(__dirname, '../../uploads'));
    }
  },
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
});
const upload = multer({ storage });

// GET all books with search & filter
router.get('/', async (req: Request, res: Response) => {
  const { search, category, author, maxPrice } = req.query;

  let where: any = {};

  if (search && typeof search === 'string') {
    const q = search;
    where.OR = [
      { title: { contains: q } },
      { author: { contains: q } },
      { description: { contains: q } }
    ];
  }

  if (category && typeof category === 'string' && category !== 'All') {
    where.category = { contains: category };
  }

  if (author && typeof author === 'string') {
    where.author = { contains: author };
  }

  if (maxPrice && !isNaN(Number(maxPrice))) {
    where.price = { lte: Number(maxPrice) };
  }

  try {
    const books = await prisma.book.findMany({ where, orderBy: { createdAt: 'desc' } });
    return res.json(books);
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to fetch books', details: err.message });
  }
});

// GET secure page image
router.get('/pages/:filename', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const filename = req.params.filename;
    const imageUrl = `/api/books/pages/${filename}`;
    
    // Find the book id for this image
    const pageImage: any[] = await prisma.$queryRaw`SELECT * FROM "PageImage" WHERE "imageUrl" = ${imageUrl} LIMIT 1`;
    if (!pageImage || pageImage.length === 0) {
      return res.status(404).json({ error: 'Page image not found' });
    }
    
    const bookId = pageImage[0].bookId;
    
    // Check access
    if (req.user?.role !== 'ADMIN') {
      const purchase = await prisma.purchase.findFirst({
        where: { userId: req.user?.id, bookId, status: 'COMPLETED' }
      });
      if (!purchase) {
        return res.status(403).json({ error: 'Access denied. You have not purchased this book.' });
      }
    }
    
    const filePath = path.join(__dirname, '../../secure_uploads/pages', filename);
    if (!require('fs').existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found on disk' });
    }
    
    return res.sendFile(filePath);
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to serve image', details: err.message });
  }
});

// GET single book by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const book = await prisma.book.findUnique({ where: { id: req.params.id } });
    if (!book) {
      return res.status(404).json({ error: 'Book not found' });
    }
    
    // Fetch page images manually since Prisma client might not be regenerated
    const pageImages = await prisma.$queryRaw`SELECT * FROM "PageImage" WHERE "bookId" = ${book.id} ORDER BY "pageNum" ASC`;
    
    return res.json({ ...book, pageImages });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to fetch book', details: err.message });
  }
});

// SEARCH inside book page text
router.get('/:id/search-inside', async (req: Request, res: Response) => {
  const { q } = req.query;
  try {
    const book = await prisma.book.findUnique({ where: { id: req.params.id } });
    if (!book) {
      return res.status(404).json({ error: 'Book not found' });
    }

    if (!q || typeof q !== 'string') {
      return res.status(400).json({ error: 'Query parameter q is required' });
    }

    const pagesText = JSON.parse(book.pagesTextJson || '[]');
    const matches = searchInBookPages(pagesText, q);
    return res.json({ bookId: book.id, query: q, totalMatches: matches.length, matches });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to search inside book', details: err.message });
  }
});

import { processPdfToImages } from '../utils/pdfProcessor';
import { v4 as uuidv4 } from 'uuid';

// GET reading progress
router.get('/:id/progress', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const history = await prisma.readingHistory.findFirst({
      where: { userId: req.user?.id, bookId: req.params.id }
    });
    return res.json(history || { lastPage: 1 });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to fetch progress', details: err.message });
  }
});

// POST update reading progress
router.post('/:id/progress', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { lastPage, totalPages, progressPercent } = req.body;
    
    // Check if history exists
    const existing = await prisma.readingHistory.findFirst({
      where: { userId: req.user?.id, bookId: req.params.id }
    });
    
    if (existing) {
      const updated = await prisma.readingHistory.update({
        where: { id: existing.id },
        data: { lastPage, totalPages, progressPercent }
      });
      return res.json(updated);
    } else {
      const created = await prisma.readingHistory.create({
        data: {
          userId: req.user!.id,
          bookId: req.params.id,
          lastPage,
          totalPages,
          progressPercent
        }
      });
      return res.json(created);
    }
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to update progress', details: err.message });
  }
});

// POST Admin Create Book
router.post('/', authenticateToken, requireAdmin, upload.fields([{ name: 'pdfFile', maxCount: 1 }, { name: 'coverFile', maxCount: 1 }]), async (req: AuthenticatedRequest, res: Response) => {
  const { title, author, category, price, description, totalPages, pagesText } = req.body;

  if (!title || !author || !price) {
    return res.status(400).json({ error: 'Title, author, and price are required' });
  }

  const files = req.files as { [fieldname: string]: Express.Multer.File[] };
  const coverUrl = files?.['coverFile'] ? `/uploads/${files['coverFile'][0].filename}` : req.body.coverImage || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600';
  const pdfUrl = files?.['pdfFile'] ? `/uploads/${files['pdfFile'][0].filename}` : req.body.pdfUrl || '';

  try {
    const newBook = await prisma.book.create({
      data: {
        title,
        author,
        category: category || 'General',
        price: Number(price),
        coverImage: coverUrl,
        pdfUrl: pdfUrl,
        description: description || 'Digital library catalog item.',
        totalPages: Number(totalPages) || 5,
        rating: 5.0,
        pagesTextJson: JSON.stringify(Array.isArray(pagesText) ? pagesText : ['Page 1 Content', 'Page 2 Content', 'Page 3 Content']),
      }
    });

    if (files?.['pdfFile']) {
      const pdfFilePath = path.join(__dirname, '../../secure_uploads/books', files['pdfFile'][0].filename);
      const pageImages = await processPdfToImages(pdfFilePath);
      
      if (!totalPages && pageImages.length > 0) {
        await prisma.book.update({ where: { id: newBook.id }, data: { totalPages: pageImages.length } });
      }

      for (const img of pageImages) {
        await prisma.$executeRaw`INSERT INTO "PageImage" ("id", "bookId", "pageNum", "imageUrl") VALUES (${uuidv4()}, ${newBook.id}, ${img.pageNum}, ${img.imageUrl})`;
      }
    }

    return res.status(201).json(newBook);
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to create book', details: err.message });
  }
});

// PUT Admin Edit Book
router.put('/:id', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const updatedBook = await prisma.book.update({
      where: { id: req.params.id },
      data: req.body,
    });
    return res.json(updatedBook);
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to update book', details: err.message });
  }
});

// DELETE Admin Delete Book
router.delete('/:id', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const deleted = await prisma.book.delete({
      where: { id: req.params.id },
    });
    return res.json({ message: 'Book deleted successfully', deletedBook: deleted });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to delete book', details: err.message });
  }
});

export default router;
