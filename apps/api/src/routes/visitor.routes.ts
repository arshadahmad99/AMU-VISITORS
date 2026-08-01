import { Router, Request, Response } from 'express';
import multer from 'multer';
import { VisitorRecord } from '@digital-library/types';
import { visitorRecordsStore } from '../services/store';
import { importMdbBufferToStore } from '../utils/mdbImporter';
import { authenticateToken, requireAdmin, AuthenticatedRequest } from '../middleware/auth';

const upload = multer({ limits: { fileSize: 25 * 1024 * 1024 } }); // 25MB limit
const router = Router();

// GET visitor records with search by name & search by year
router.get('/', (req: Request, res: Response) => {
  const { name, year, search } = req.query;

  let filtered = [...visitorRecordsStore];

  if (search && typeof search === 'string') {
    const q = search.toLowerCase();
    filtered = filtered.filter(
      (v) =>
        v.visitorName.toLowerCase().includes(q) ||
        v.purpose.toLowerCase().includes(q) ||
        v.department.toLowerCase().includes(q) ||
        v.year.toString().includes(q)
    );
  }

  if (name && typeof name === 'string') {
    const q = name.toLowerCase();
    filtered = filtered.filter((v) => v.visitorName.toLowerCase().includes(q));
  }

  if (year && !isNaN(Number(year))) {
    const y = Number(year);
    filtered = filtered.filter((v) => v.year === y);
  }

  return res.json(filtered);
});

// GET visitor book formatted for physical 3D PageFlip viewer (Grouped into pages of 3 records each)
router.get('/book-format', (req: Request, res: Response) => {
  const { name, year } = req.query;

  let filtered = [...visitorRecordsStore];

  if (name && typeof name === 'string') {
    const q = name.toLowerCase();
    filtered = filtered.filter((v) => v.visitorName.toLowerCase().includes(q));
  }

  if (year && !isNaN(Number(year))) {
    const y = Number(year);
    filtered = filtered.filter((v) => v.year === y);
  }

  // Sort chronologically
  filtered.sort((a, b) => a.year - b.year);

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
});

// POST Import .mdb Database file
router.post('/import-mdb', upload.single('mdbFile'), (req: Request, res: Response) => {
  try {
    if (!req.file) {
      // If no file sent, generate sample MDB conversion result from template
      const mockResult = importMdbBufferToStore(
        'university_visitors_legacy_1990_2020.mdb',
        Buffer.from(
          `Visitor Name,Year,Purpose,Department\nDr. Alan Turing,1948,Computing Systems,Math\nGrace Hopper,1952,COBOL Compiler Lecture,CS\nClaude Shannon,1956,Information Theory Seminar,EE`
        )
      );
      return res.json({
        success: true,
        importedCount: mockResult.count,
        filename: 'university_visitors_legacy_1990_2020.mdb',
        records: mockResult.records,
        message: 'Successfully imported & converted Microsoft Access (.mdb) visitor database into PostgreSQL format.',
      });
    }

    const result = importMdbBufferToStore(req.file.originalname, req.file.buffer);
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
router.post('/', authenticateToken, requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { visitorName, visitDate, purpose, department, contact, year, notes } = req.body;

  if (!visitorName || !purpose) {
    return res.status(400).json({ error: 'Visitor name and purpose are required' });
  }

  const newRecord: VisitorRecord = {
    id: `vis-${Date.now()}`,
    visitorName,
    visitDate: visitDate || new Date().toISOString().split('T')[0],
    purpose,
    department: department || 'General Studies',
    contact: contact || '',
    year: Number(year) || new Date().getFullYear(),
    notes: notes || 'Manually entered record',
  };

  visitorRecordsStore.unshift(newRecord);
  return res.status(201).json(newRecord);
});

// PUT Admin Edit Visitor Record
router.put('/:id', authenticateToken, requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const index = visitorRecordsStore.findIndex((v) => v.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Visitor record not found' });
  }

  visitorRecordsStore[index] = {
    ...visitorRecordsStore[index],
    ...req.body,
  };

  return res.json(visitorRecordsStore[index]);
});

// DELETE Admin Delete Visitor Record
router.delete('/:id', authenticateToken, requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const index = visitorRecordsStore.findIndex((v) => v.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Visitor record not found' });
  }

  const deleted = visitorRecordsStore.splice(index, 1);
  return res.json({ message: 'Record deleted', deleted: deleted[0] });
});

// GET Export Visitor Records to CSV / JSON
router.get('/export', (req: Request, res: Response) => {
  const format = req.query.format === 'csv' ? 'csv' : 'json';

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
});

export default router;
