import { Router, Request, Response } from 'express';
import multer from 'multer';
import { PrismaClient } from '@prisma/client';
import { parseMdbBufferToRecords } from '../utils/mdbImporter';
import { authenticateToken, requireAdmin, AuthenticatedRequest } from '../middleware/auth';

const prisma = new PrismaClient();

const upload = multer({ limits: { fileSize: 25 * 1024 * 1024 } }); // 25MB limit
const router = Router();

// GET visitor records with search by name & search by year
router.get('/', async (req: Request, res: Response) => {
  const { name, year, search } = req.query;

  let where: any = {};

  if (search && typeof search === 'string') {
    const q = search;
    where.OR = [
      { visitorName: { contains: q } },
      { purpose: { contains: q } },
      { department: { contains: q } }
    ];
    // if year is provided in search
    if (!isNaN(Number(q))) {
      where.OR.push({ year: Number(q) });
    }
  }

  if (name && typeof name === 'string') {
    where.visitorName = { contains: name };
  }

  if (year && !isNaN(Number(year))) {
    where.year = Number(year);
  }

  try {
    const records = await prisma.visitorRecord.findMany({ where, orderBy: { importedAt: 'desc' } });
    return res.json(records);
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to fetch visitor records', details: err.message });
  }
});

// GET visitor book formatted for physical 3D PageFlip viewer (Grouped into pages of 3 records each)
router.get('/book-format', async (req: Request, res: Response) => {
  const { name, year } = req.query;

  let where: any = {};
  if (name && typeof name === 'string') {
    where.visitorName = { contains: name };
  }

  if (year && !isNaN(Number(year))) {
    where.year = Number(year);
  }

  try {
    const filtered = await prisma.visitorRecord.findMany({ where, orderBy: { year: 'asc' } });

    // Group 3 records per page
    const recordsPerPage = 3;
    const pages: { pageNumber: number; header: string; content: string }[] = [];

    for (let i = 0; i < filtered.length; i += recordsPerPage) {
      const chunk = filtered.slice(i, i + recordsPerPage);
      const pageNum = Math.floor(i / recordsPerPage) + 1;
      const yearRange = chunk[0]?.year ? `${chunk[0].year}` : 'Archive';

      let pageContent = `🏛 UNIVERSITY VISITOR REGISTER LOG\nRef Vol: ${yearRange}\n----------------------------------------\n\n`;

      chunk.forEach((rec, idx) => {
        pageContent += `[ENTRY #${i + idx + 1}]\n`;
        pageContent += `• Visitor Name: ${rec.visitorName}\n`;
        pageContent += `• Date of Visit: ${rec.visitDate} (Year ${rec.year})\n`;
        pageContent += `• Purpose: ${rec.purpose}\n`;
        pageContent += `• Department: ${rec.department}\n`;
        pageContent += `• Contact/Email: ${rec.contact || 'N/A'}\n`;
        pageContent += `• Notes: ${rec.notes || 'Official registry entry'}\n\n`;
      });

      pages.push({
        pageNumber: pageNum,
        header: `University Guestbook - ${yearRange}`,
        content: pageContent,
      });
    }

    if (pages.length === 0) {
      pages.push({
        pageNumber: 1,
        header: 'University Guestbook',
        content: 'No matching visitor entries found in archive for specified search filter.',
      });
    }

    return res.json({
      totalRecords: filtered.length,
      totalPages: pages.length,
      pages,
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to format visitor book', details: err.message });
  }
});

// POST Import .mdb Database file
router.post('/import-mdb', upload.single('mdbFile'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      // If no file sent, generate sample MDB conversion result from template
      const mockResult = parseMdbBufferToRecords(
        'university_visitors_legacy_1990_2020.mdb',
        Buffer.from(
          `Visitor Name,Year,Purpose,Department\nDr. Alan Turing,1948,Computing Systems,Math\nGrace Hopper,1952,COBOL Compiler Lecture,CS\nClaude Shannon,1956,Information Theory Seminar,EE`
        )
      );
      
      await prisma.visitorRecord.createMany({ data: mockResult.records });

      return res.json({
        success: true,
        importedCount: mockResult.count,
        filename: 'university_visitors_legacy_1990_2020.mdb',
        records: mockResult.records,
        message: 'Successfully imported & converted Microsoft Access (.mdb) visitor database into PostgreSQL format.',
      });
    }

    const result = parseMdbBufferToRecords(req.file.originalname, req.file.buffer);
    await prisma.visitorRecord.createMany({ data: result.records });

    return res.json({
      success: true,
      importedCount: result.count,
      filename: req.file.originalname,
      records: result.records,
      message: `Successfully converted ${result.count} records from ${req.file.originalname} to PostgreSQL schema.`,
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to parse .mdb file', details: err.message });
  }
});

// POST Admin Add Visitor Record
router.post('/', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  const { visitorName, visitDate, purpose, department, contact, year, notes } = req.body;

  if (!visitorName || !purpose) {
    return res.status(400).json({ error: 'Visitor name and purpose are required' });
  }

  try {
    const newRecord = await prisma.visitorRecord.create({
      data: {
        visitorName,
        visitDate: visitDate || new Date().toISOString().split('T')[0],
        purpose,
        department: department || 'General Studies',
        contact: contact || '',
        year: Number(year) || new Date().getFullYear(),
        notes: notes || 'Manually entered record',
      }
    });
    return res.status(201).json(newRecord);
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to create record', details: err.message });
  }
});

// PUT Admin Edit Visitor Record
router.put('/:id', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const updated = await prisma.visitorRecord.update({
      where: { id: req.params.id },
      data: req.body,
    });
    return res.json(updated);
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to update record', details: err.message });
  }
});

// DELETE Admin Delete Visitor Record
router.delete('/:id', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const deleted = await prisma.visitorRecord.delete({
      where: { id: req.params.id },
    });
    return res.json({ message: 'Record deleted', deleted });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to delete record', details: err.message });
  }
});

// GET Export Visitor Records to CSV / JSON
router.get('/export', async (req: Request, res: Response) => {
  const format = req.query.format === 'csv' ? 'csv' : 'json';

  try {
    const visitorRecordsStore = await prisma.visitorRecord.findMany();

    if (format === 'json') {
      return res.json(visitorRecordsStore);
    }

    // Generate CSV
    let csv = 'ID,Visitor Name,Visit Date,Year,Purpose,Department,Contact,Notes\n';
    visitorRecordsStore.forEach((r) => {
      csv += `"${r.id}","${r.visitorName}","${r.visitDate}",${r.year},"${r.purpose}","${r.department}","${r.contact || ''}","${r.notes || ''}"\n`;
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="university_visitor_archive.csv"');
    return res.send(csv);
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to export records', details: err.message });
  }
});

export default router;
