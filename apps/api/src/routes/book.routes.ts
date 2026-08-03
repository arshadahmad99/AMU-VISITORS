import { Router, Request, Response } from 'express';
import multer from 'multer';
import { PrismaClient } from '@prisma/client';
import { searchInBookPages } from '@digital-library/utils';
import { authenticateToken, requireAdmin, AuthenticatedRequest } from '../middleware/auth';
import path from 'path';

const prisma = new PrismaClient();
const router = Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '../../uploads')),
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

// GET single book by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const book = await prisma.book.findUnique({ where: { id: req.params.id } });
    if (!book) {
      return res.status(404).json({ error: 'Book not found' });
    }
    return res.json(book);
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
