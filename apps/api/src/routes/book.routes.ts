import { Router, Request, Response } from 'express';
import multer from 'multer';
import { PrismaClient } from '@prisma/client';
import { searchInBookPages } from '@digital-library/utils';
import { authenticateToken, requireAdmin, AuthenticatedRequest } from '../middleware/auth';
import path from 'path';
import { processPdfToImages } from '../utils/pdfProcessor';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();
const router = Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.fieldname === 'pdfFile' || file.fieldname === 'pdfFiles') {
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
const upload = multer({
  storage,
  limits: {
    fileSize: 200 * 1024 * 1024, // 200 MB per file limit
    fieldSize: 200 * 1024 * 1024, // 200 MB field size limit
    files: 100 // Allow up to 100 files at once
  }
});

const handleUpload = (req: Request, res: Response, next: any) => {
  upload.any()(req, res, (err: any) => {
    if (err) {
      console.error('Multer upload error:', err);
      return res.status(400).json({ error: 'File upload error', details: err.message });
    }
    next();
  });
};

const sortPdfFiles = (files: Express.Multer.File[]) => {
  return [...files].sort((a, b) =>
    a.originalname.localeCompare(b.originalname, undefined, { numeric: true, sensitivity: 'base' })
  );
};

async function processMultiplePdfsToImages(bookId: string, pdfFiles: Express.Multer.File[]) {
  const sortedFiles = sortPdfFiles(pdfFiles);
  let globalPageNum = 1;
  let totalExtractedPages = 0;
  const chapterDetails: { id: string; name: string; url: string; startPage: number; endPage: number; totalPages: number }[] = [];

  for (const pdfFile of sortedFiles) {
    const pdfFilePath = path.join(__dirname, '../../secure_uploads/books', pdfFile.filename);
    try {
      const pageImages = await processPdfToImages(pdfFilePath);
      const startPage = globalPageNum;
      for (const img of pageImages) {
        await prisma.$executeRaw`INSERT INTO "PageImage" ("id", "bookId", "pageNum", "imageUrl") VALUES (${uuidv4()}, ${bookId}, ${globalPageNum}, ${img.imageUrl})`;
        globalPageNum++;
        totalExtractedPages++;
      }
      const endPage = globalPageNum > startPage ? globalPageNum - 1 : startPage;
      chapterDetails.push({
        id: uuidv4(),
        name: pdfFile.originalname,
        url: `/api/books/secure-pdf/${pdfFile.filename}`,
        startPage,
        endPage,
        totalPages: pageImages.length
      });
    } catch (e) {
      console.error(`Error processing PDF file ${pdfFile.originalname}:`, e);
    }
  }

  return { totalExtractedPages, chapterDetails };
}

async function getPdfPageCount(pdfFilePath: string): Promise<number> {
  try {
    const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');
    const data = new Uint8Array(require('fs').readFileSync(pdfFilePath));
    const loadingTask = pdfjsLib.getDocument({ data });
    const pdfDoc = await loadingTask.promise;
    return pdfDoc.numPages || 1;
  } catch (err) {
    console.error('Error reading PDF page count:', err);
    return 1;
  }
}

export async function recalculateBookTotalPages(bookId: string) {
  const pdfs = await prisma.bookPDF.findMany({
    where: { bookId },
    orderBy: { order: 'asc' }
  });

  const totalPages = pdfs.reduce((sum, p) => sum + p.pageCount, 0);

  let currentStart = 1;
  const chapters = pdfs.map((p) => {
    const startPage = currentStart;
    const endPage = currentStart + p.pageCount - 1;
    currentStart = endPage + 1;
    return {
      id: p.id,
      name: p.originalName,
      url: `/api/books/pdfs/${p.id}/content`,
      order: p.order,
      startPage,
      endPage,
      totalPages: p.pageCount,
      fileSize: p.fileSize,
      filename: p.filename
    };
  });

  const primaryPdfUrl = chapters.length > 0 ? chapters[0].url : '';

  await prisma.book.update({
    where: { id: bookId },
    data: {
      totalPages: totalPages || 1,
      pdfUrl: primaryPdfUrl,
      pdfUrlsJson: JSON.stringify(chapters)
    }
  });

  return { totalPages, pdfs, chapters };
}

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
    const books = await prisma.book.findMany({
      where,
      include: { bookPdfs: { orderBy: { order: 'asc' } } },
      orderBy: { createdAt: 'desc' }
    });
    const formattedBooks = await Promise.all(books.map(async (b) => {
      let chapters = [];
      if (b.pdfUrlsJson) {
        try { chapters = JSON.parse(b.pdfUrlsJson); } catch (e) {}
      }
      const pageImages = await prisma.$queryRaw`SELECT * FROM "PageImage" WHERE "bookId" = ${b.id} ORDER BY "pageNum" ASC`;
      return { ...b, pageImages, chapters };
    }));
    return res.json(formattedBooks);
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to fetch books', details: err.message });
  }
});

// GET all PDF parts for a book
router.get('/:bookId/pdfs', async (req: Request, res: Response) => {
  try {
    const bookId = req.params.bookId;
    const bookPdfs = await prisma.bookPDF.findMany({
      where: { bookId },
      orderBy: { order: 'asc' }
    });
    const book = await prisma.book.findUnique({ where: { id: bookId } });
    return res.json({ book, bookPdfs });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to fetch book PDFs', details: err.message });
  }
});

// GET secure PDF content stream by PDF ID
router.get('/pdfs/:pdfId/content', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const pdfId = req.params.pdfId;
    const pdf = await prisma.bookPDF.findUnique({ where: { id: pdfId } });

    if (!pdf) {
      return res.status(404).json({ error: 'PDF record not found' });
    }

    const book = await prisma.book.findUnique({ where: { id: pdf.bookId } });
    if (!book) {
      return res.status(404).json({ error: 'Book not found' });
    }

    // Purchase / Role Access Check
    if (req.user?.role !== 'ADMIN' && book.price !== 0) {
      const purchase = await prisma.purchase.findFirst({
        where: { userId: req.user?.id, bookId: book.id, status: 'COMPLETED' }
      });
      if (!purchase) {
        return res.status(403).json({ error: 'Access denied. You have not purchased this book.' });
      }
    }

    const filePath = path.join(__dirname, '../../secure_uploads/books', pdf.filename);
    if (!require('fs').existsSync(filePath)) {
      return res.status(404).json({ error: 'PDF file not found on disk' });
    }

    res.setHeader('Content-Type', pdf.mimeType || 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(pdf.originalName)}"`);
    return res.sendFile(filePath);
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to serve PDF content', details: err.message });
  }
});

// GET secure PDF file by filename (legacy route compatibility)
router.get('/secure-pdf/:filename', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const filename = req.params.filename;
    
    // Find matching PDF record or book
    const pdf = await prisma.bookPDF.findFirst({ where: { filename } });
    let book = pdf ? await prisma.book.findUnique({ where: { id: pdf.bookId } }) : null;

    if (!book) {
      const books = await prisma.book.findMany();
      book = books.find(b => 
        (b.pdfUrl && b.pdfUrl.includes(filename)) || 
        (b.pdfUrlsJson && b.pdfUrlsJson.includes(filename))
      ) || null;
    }

    if (!book) {
      return res.status(404).json({ error: 'Book not found for this PDF' });
    }

    // Access check: Admin or free book (price === 0) or user has purchased book
    if (req.user?.role !== 'ADMIN' && book.price !== 0) {
      const purchase = await prisma.purchase.findFirst({
        where: { userId: req.user?.id, bookId: book.id, status: 'COMPLETED' }
      });
      if (!purchase) {
        return res.status(403).json({ error: 'Access denied. You have not purchased this book.' });
      }
    }

    const filePath = path.join(__dirname, '../../secure_uploads/books', filename);
    if (!require('fs').existsSync(filePath)) {
      return res.status(404).json({ error: 'PDF file not found on disk' });
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
    return res.sendFile(filePath);
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to serve PDF', details: err.message });
  }
});

// POST Admin Upload PDF(s) to Book
router.post('/:bookId/pdfs', authenticateToken, requireAdmin, handleUpload, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const bookId = req.params.bookId;
    const book = await prisma.book.findUnique({ where: { id: bookId } });
    if (!book) {
      return res.status(404).json({ error: 'Book not found' });
    }

    const rawFiles = (req.files as Express.Multer.File[]) || [];
    const pdfFilesList = sortPdfFiles(
      rawFiles.filter(f => f.fieldname === 'pdfFiles' || f.fieldname === 'pdfFile' || f.originalname.endsWith('.pdf'))
    );

    if (pdfFilesList.length === 0) {
      return res.status(400).json({ error: 'Please select at least one valid PDF file to upload' });
    }

    // Find current highest order index
    const existingPdfs = await prisma.bookPDF.findMany({
      where: { bookId },
      orderBy: { order: 'desc' },
      take: 1
    });
    let nextOrder = existingPdfs.length > 0 ? existingPdfs[0].order + 1 : 1;

    const createdPdfs = [];

    for (const pdfFile of pdfFilesList) {
      const filePath = path.join(__dirname, '../../secure_uploads/books', pdfFile.filename);
      const pageCount = await getPdfPageCount(filePath);

      const pdfRecord = await prisma.bookPDF.create({
        data: {
          id: uuidv4(),
          bookId,
          originalName: pdfFile.originalname,
          filename: pdfFile.filename,
          storageKey: pdfFile.filename,
          order: nextOrder++,
          pageCount,
          fileSize: pdfFile.size,
          mimeType: pdfFile.mimetype || 'application/pdf'
        }
      });
      createdPdfs.push(pdfRecord);
    }

    const { totalPages, pdfs, chapters } = await recalculateBookTotalPages(bookId);

    return res.status(201).json({
      message: `Successfully uploaded ${createdPdfs.length} PDF part(s)`,
      createdPdfs,
      bookPdfs: pdfs,
      totalPages,
      chapters
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to upload PDF part(s)', details: err.message });
  }
});

// PUT Admin Replace Single PDF
router.put('/pdfs/:pdfId', authenticateToken, requireAdmin, handleUpload, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const pdfId = req.params.pdfId;
    const existingPdf = await prisma.bookPDF.findUnique({ where: { id: pdfId } });

    if (!existingPdf) {
      return res.status(404).json({ error: 'PDF record not found' });
    }

    const rawFiles = (req.files as Express.Multer.File[]) || [];
    const newPdfFile = rawFiles.find(f => f.fieldname === 'pdfFile' || f.fieldname === 'pdfFiles' || f.originalname.endsWith('.pdf'));

    if (!newPdfFile) {
      return res.status(400).json({ error: 'Please select a replacement PDF file' });
    }

    const newFilePath = path.join(__dirname, '../../secure_uploads/books', newPdfFile.filename);
    const newPageCount = await getPdfPageCount(newFilePath);

    // Save old filename for safe cleanup
    const oldFilename = existingPdf.filename;

    const updatedPdf = await prisma.bookPDF.update({
      where: { id: pdfId },
      data: {
        originalName: newPdfFile.originalname,
        filename: newPdfFile.filename,
        storageKey: newPdfFile.filename,
        pageCount: newPageCount,
        fileSize: newPdfFile.size,
        mimeType: newPdfFile.mimetype || 'application/pdf',
        updatedAt: new Date()
      }
    });

    // Clean up old file from disk safely
    if (oldFilename && oldFilename !== newPdfFile.filename) {
      const oldPath = path.join(__dirname, '../../secure_uploads/books', oldFilename);
      if (require('fs').existsSync(oldPath)) {
        try { require('fs').unlinkSync(oldPath); } catch (e) {}
      }
    }

    await recalculateBookTotalPages(existingPdf.bookId);

    return res.json({
      message: 'PDF part replaced successfully',
      updatedPdf
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to replace PDF part', details: err.message });
  }
});

// DELETE Admin Delete Single PDF
router.delete('/pdfs/:pdfId', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const pdfId = req.params.pdfId;
    const existingPdf = await prisma.bookPDF.findUnique({ where: { id: pdfId } });

    if (!existingPdf) {
      return res.status(404).json({ error: 'PDF record not found' });
    }

    const bookId = existingPdf.bookId;

    // Delete DB Record
    await prisma.bookPDF.delete({ where: { id: pdfId } });

    // Clean up disk file
    const filePath = path.join(__dirname, '../../secure_uploads/books', existingPdf.filename);
    if (require('fs').existsSync(filePath)) {
      try { require('fs').unlinkSync(filePath); } catch (e) {}
    }

    // Re-sequence remaining PDFs safely
    const remainingPdfs = await prisma.bookPDF.findMany({
      where: { bookId },
      orderBy: { order: 'asc' }
    });

    for (let i = 0; i < remainingPdfs.length; i++) {
      const targetOrder = i + 1;
      if (remainingPdfs[i].order !== targetOrder) {
        await prisma.bookPDF.update({
          where: { id: remainingPdfs[i].id },
          data: { order: targetOrder }
        });
      }
    }

    const { totalPages, pdfs, chapters } = await recalculateBookTotalPages(bookId);

    return res.json({
      message: 'PDF part deleted successfully',
      remainingPdfs: pdfs,
      totalPages,
      chapters
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to delete PDF part', details: err.message });
  }
});

// PUT Admin Reorder PDFs for Book
router.put('/:bookId/pdfs/reorder', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const bookId = req.params.bookId;
    const { orders } = req.body as { orders: { id: string; order: number }[] };

    if (!Array.isArray(orders) || orders.length === 0) {
      return res.status(400).json({ error: 'Orders payload must be a non-empty array of { id, order }' });
    }

    // Step 1: Set temporary negative order values to avoid unique constraint collisions
    for (let i = 0; i < orders.length; i++) {
      const item = orders[i];
      await prisma.bookPDF.update({
        where: { id: item.id },
        data: { order: -1 * (i + 1) }
      });
    }

    // Step 2: Set final positive order values
    for (const item of orders) {
      await prisma.bookPDF.update({
        where: { id: item.id },
        data: { order: Math.abs(Number(item.order)) }
      });
    }

    const { totalPages, pdfs, chapters } = await recalculateBookTotalPages(bookId);

    return res.json({
      message: 'PDF order updated successfully',
      bookPdfs: pdfs,
      totalPages,
      chapters
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to reorder PDF parts', details: err.message });
  }
});

// GET single book by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const book = await prisma.book.findUnique({
      where: { id: req.params.id },
      include: { bookPdfs: { orderBy: { order: 'asc' } } }
    });
    if (!book) {
      return res.status(404).json({ error: 'Book not found' });
    }
    
    const pageImages = await prisma.$queryRaw`SELECT * FROM "PageImage" WHERE "bookId" = ${book.id} ORDER BY "pageNum" ASC`;
    
    let chapters = [];
    if (book.pdfUrlsJson) {
      try { chapters = JSON.parse(book.pdfUrlsJson); } catch (e) {}
    }

    return res.json({ ...book, pageImages, chapters });
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

// GET reading progress
router.get('/:id/progress', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const bookId = req.params.id;

    const progress = await prisma.readingHistory.findFirst({
      where: { userId, bookId }
    });

    return res.json(progress || { lastPage: 1 });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to fetch progress', details: err.message });
  }
});

// POST update reading progress
router.post('/:id/progress', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const bookId = req.params.id;
    const { lastPage, totalPages } = req.body;

    const lastPageNum = Number(lastPage) || 1;
    const totalPagesNum = Number(totalPages) || 1;
    const progressPercent = Math.min(100, Math.max(0, Math.round((lastPageNum / totalPagesNum) * 100)));

    const existing = await prisma.readingHistory.findFirst({
      where: { userId, bookId }
    });

    if (existing) {
      const updated = await prisma.readingHistory.update({
        where: { id: existing.id },
        data: { lastPage: lastPageNum, totalPages: totalPagesNum, progressPercent, updatedAt: new Date() }
      });
      return res.json(updated);
    } else {
      const created = await prisma.readingHistory.create({
        data: { userId, bookId, lastPage: lastPageNum, totalPages: totalPagesNum, progressPercent }
      });
      return res.json(created);
    }
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to save progress', details: err.message });
  }
});

// POST Admin Create Book
router.post('/', authenticateToken, requireAdmin, handleUpload, async (req: AuthenticatedRequest, res: Response) => {
  const { title, author, category, price, description, totalPages, pagesText } = req.body;
  const rawFiles = (req.files as Express.Multer.File[]) || [];
  const pdfFilesList = rawFiles.filter(f => f.fieldname === 'pdfFiles' || f.fieldname === 'pdfFile' || f.originalname.endsWith('.pdf'));
  const coverFileObj = rawFiles.find(f => f.fieldname === 'coverFile' || f.mimetype.startsWith('image/'));

  if (!title && pdfFilesList.length === 0) {
    return res.status(400).json({ error: 'Please select at least one PDF file to upload' });
  }

  let bookTitle = title;
  if (!bookTitle) {
    if (pdfFilesList.length > 0) {
      const rawName = pdfFilesList[0].originalname;
      const cleanName = rawName.replace(/\.[^/.]+$/, '').replace(/^\([a-z0-9]+\)\s*/i, '');
      bookTitle = cleanName || 'Digital Library eBook';
    } else {
      bookTitle = 'Digital Library eBook';
    }
  }

  const bookAuthor = author || 'Maulana Azad Library';
  const bookCategory = category || 'History & Library Science';
  const bookPrice = price !== undefined && price !== '' ? Number(price) : 0;
  const bookDescription = description || 'Digital library catalog item.';
  const coverUrl = coverFileObj ? `/uploads/${coverFileObj.filename}` : req.body.coverImage || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600';
  const pdfUrl = pdfFilesList.length > 0 ? `/uploads/${pdfFilesList[0].filename}` : req.body.pdfUrl || '';

  try {
    const newBook = await prisma.book.create({
      data: {
        title: bookTitle,
        author: bookAuthor,
        category: bookCategory,
        price: bookPrice,
        coverImage: coverUrl,
        pdfUrl: pdfUrl,
        description: bookDescription,
        totalPages: Number(totalPages) || 5,
        rating: 5.0,
        pagesTextJson: JSON.stringify(Array.isArray(pagesText) ? pagesText : ['Page 1 Content']),
      }
    });

    if (pdfFilesList.length > 0) {
      const { totalExtractedPages, chapterDetails } = await processMultiplePdfsToImages(newBook.id, pdfFilesList);
      if (totalExtractedPages > 0) {
        const primaryPdfUrl = chapterDetails.length > 0 ? chapterDetails[0].url : pdfUrl;

        await prisma.book.update({
          where: { id: newBook.id },
          data: {
            totalPages: totalExtractedPages,
            pdfUrl: primaryPdfUrl,
            pdfUrlsJson: JSON.stringify(chapterDetails)
          }
        });
      }
    }

    const createdBook = await prisma.book.findUnique({ where: { id: newBook.id } });
    const pageImages = await prisma.$queryRaw`SELECT * FROM "PageImage" WHERE "bookId" = ${newBook.id} ORDER BY "pageNum" ASC`;
    let chapters = [];
    if (createdBook?.pdfUrlsJson) {
      try { chapters = JSON.parse(createdBook.pdfUrlsJson); } catch (e) {}
    }

    return res.status(201).json({ ...createdBook, pageImages, chapters });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to create book', details: err.message });
  }
});

// PUT Admin Edit Book
router.put('/:id', authenticateToken, requireAdmin, handleUpload, async (req: AuthenticatedRequest, res: Response) => {
  const { title, author, category, price, description, totalPages } = req.body;
  const rawFiles = (req.files as Express.Multer.File[]) || [];
  const pdfFilesList = rawFiles.filter(f => f.fieldname === 'pdfFiles' || f.fieldname === 'pdfFile' || f.originalname.endsWith('.pdf'));
  const coverFileObj = rawFiles.find(f => f.fieldname === 'coverFile' || f.mimetype.startsWith('image/'));

  try {
    const dataToUpdate: any = {};
    if (title) dataToUpdate.title = title;
    if (author) dataToUpdate.author = author;
    if (category) dataToUpdate.category = category;
    if (price !== undefined) dataToUpdate.price = Number(price);
    if (description) dataToUpdate.description = description;
    if (totalPages) dataToUpdate.totalPages = Number(totalPages);

    if (coverFileObj) {
      dataToUpdate.coverImage = `/uploads/${coverFileObj.filename}`;
    }

    if (pdfFilesList.length > 0) {
      dataToUpdate.pdfUrl = `/api/books/secure-pdf/${pdfFilesList[0].filename}`;
    }

    const updatedBook = await prisma.book.update({
      where: { id: req.params.id },
      data: dataToUpdate,
    });

    if (pdfFilesList.length > 0) {
      await prisma.$executeRaw`DELETE FROM "PageImage" WHERE "bookId" = ${updatedBook.id}`;
      const { totalExtractedPages, chapterDetails } = await processMultiplePdfsToImages(updatedBook.id, pdfFilesList);
      if (totalExtractedPages > 0) {
        const primaryPdfUrl = chapterDetails.length > 0 ? chapterDetails[0].url : dataToUpdate.pdfUrl;
        await prisma.book.update({
          where: { id: updatedBook.id },
          data: {
            totalPages: totalExtractedPages,
            pdfUrl: primaryPdfUrl,
            pdfUrlsJson: JSON.stringify(chapterDetails)
          }
        });
      }
    }

    const bookWithImages = await prisma.book.findUnique({ where: { id: updatedBook.id } });
    const pageImages = await prisma.$queryRaw`SELECT * FROM "PageImage" WHERE "bookId" = ${updatedBook.id} ORDER BY "pageNum" ASC`;
    let chapters = [];
    if (bookWithImages?.pdfUrlsJson) {
      try { chapters = JSON.parse(bookWithImages.pdfUrlsJson); } catch (e) {}
    }

    return res.json({ ...bookWithImages, pageImages, chapters });
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
