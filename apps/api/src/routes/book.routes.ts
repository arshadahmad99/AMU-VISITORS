import { Router, Request, Response } from 'express';
import { Book } from '@digital-library/types';
import { searchInBookPages } from '@digital-library/utils';
import { booksStore } from '../services/store';
import { authenticateToken, requireAdmin, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// GET all books with search & filter
router.get('/', (req: Request, res: Response) => {
  const { search, category, author, maxPrice } = req.query;

  let filtered = [...booksStore];

  if (search && typeof search === 'string') {
    const q = search.toLowerCase();
    filtered = filtered.filter(
      (b) =>
        b.title.toLowerCase().includes(q) ||
        b.author.toLowerCase().includes(q) ||
        b.description.toLowerCase().includes(q)
    );
  }

  if (category && typeof category === 'string' && category !== 'All') {
    filtered = filtered.filter((b) => b.category.toLowerCase() === category.toLowerCase());
  }

  if (author && typeof author === 'string') {
    filtered = filtered.filter((b) => b.author.toLowerCase().includes(author.toLowerCase()));
  }

  if (maxPrice && !isNaN(Number(maxPrice))) {
    filtered = filtered.filter((b) => b.price <= Number(maxPrice));
  }

  return res.json(filtered);
});

// GET single book by ID
router.get('/:id', (req: Request, res: Response) => {
  const book = booksStore.find((b) => b.id === req.params.id);
  if (!book) {
    return res.status(404).json({ error: 'Book not found' });
  }
  return res.json(book);
});

// SEARCH inside book page text
router.get('/:id/search-inside', (req: Request, res: Response) => {
  const { q } = req.query;
  const book = booksStore.find((b) => b.id === req.params.id);
  if (!book) {
    return res.status(404).json({ error: 'Book not found' });
  }

  if (!q || typeof q !== 'string') {
    return res.status(400).json({ error: 'Query parameter q is required' });
  }

  const matches = searchInBookPages(book.pagesText || [], q);
  return res.json({ bookId: book.id, query: q, totalMatches: matches.length, matches });
});

// POST Admin Create Book
router.post('/', authenticateToken, requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { title, author, category, price, coverImage, pdfUrl, description, totalPages, pagesText } = req.body;

  if (!title || !author || !price) {
    return res.status(400).json({ error: 'Title, author, and price are required' });
  }

  const newBook: Book = {
    id: `book-${Date.now()}`,
    title,
    author,
    category: category || 'General',
    price: Number(price),
    coverImage: coverImage || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600',
    pdfUrl: pdfUrl || '',
    description: description || 'Digital library catalog item.',
    totalPages: Number(totalPages) || 5,
    rating: 5.0,
    pagesText: Array.isArray(pagesText) ? pagesText : ['Page 1 Content', 'Page 2 Content', 'Page 3 Content'],
    createdAt: new Date().toISOString(),
  };

  booksStore.unshift(newBook);
  return res.status(201).json(newBook);
});

// PUT Admin Edit Book
router.put('/:id', authenticateToken, requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const index = booksStore.findIndex((b) => b.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Book not found' });
  }

  const updatedBook = {
    ...booksStore[index],
    ...req.body,
  };

  booksStore[index] = updatedBook;
  return res.json(updatedBook);
});

// DELETE Admin Delete Book
router.delete('/:id', authenticateToken, requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const index = booksStore.findIndex((b) => b.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Book not found' });
  }

  const deleted = booksStore.splice(index, 1);
  return res.json({ message: 'Book deleted successfully', deletedBook: deleted[0] });
});

export default router;
