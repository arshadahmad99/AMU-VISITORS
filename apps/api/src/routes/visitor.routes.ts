import { Router, Request, Response } from 'express';
import multer from 'multer';
import { PrismaClient } from '@prisma/client';
import { parseMdbBufferToRecords } from '../utils/mdbImporter';
import { authenticateToken, requireAdmin, AuthenticatedRequest } from '../middleware/auth';
import { visitorRecordsStore } from '../services/store';

const prisma = new PrismaClient();

const upload = multer({ limits: { fileSize: 100 * 1024 * 1024 } }); // 100MB limit
const router = Router();

const sanitizeVisitorData = (body: any) => {
  const allowedKeys = [
    'visitorName', 'visitDate', 'country', 'designation', 'purpose',
    'department', 'contact', 'year', 'pageNumber', 'autographPath',
    'visitorImagePath', 'notes', 'aboutVisitor', 'originalMdbId', 'isHidden'
  ];
  const cleanData: any = {};
  for (const key of allowedKeys) {
    if (body[key] !== undefined) {
      if (key === 'year' || key === 'pageNumber') {
        cleanData[key] = body[key] !== null && body[key] !== '' && !isNaN(Number(body[key])) ? Number(body[key]) : null;
      } else if (key === 'isHidden') {
        cleanData[key] = Boolean(body[key]);
      } else {
        cleanData[key] = body[key];
      }
    }
  }
  return cleanData;
};

// GET visitor records with search by name & search by year (Hides hidden records unless includeHidden=true)
router.get('/', async (req: Request, res: Response) => {
  const { name, year, search, includeHidden } = req.query;

  let where: any = {};

  // Public requests only see non-hidden records
  if (includeHidden !== 'true') {
    where.isHidden = false;
  }

  if (search && typeof search === 'string' && search.trim() !== '') {
    const q = search.trim();
    where.OR = [
      { visitorName: { contains: q } },
      { purpose: { contains: q } },
      { department: { contains: q } },
      { designation: { contains: q } },
      { country: { contains: q } },
      { notes: { contains: q } },
      { aboutVisitor: { contains: q } }
    ];
    if (!isNaN(Number(q))) {
      where.OR.push({ year: Number(q) });
    }
  }

  if (name && typeof name === 'string' && name.trim() !== '') {
    where.visitorName = { contains: name.trim() };
  }

  if (year && !isNaN(Number(year))) {
    where.year = Number(year);
  }

  try {
    const records = await prisma.visitorRecord.findMany({ where, orderBy: { importedAt: 'desc' } });
    return res.json(records);
  } catch (err: any) {
    let records = [...visitorRecordsStore];
    if (includeHidden !== 'true') {
      records = records.filter(r => !r.isHidden);
    }
    if (search && typeof search === 'string' && search.trim() !== '') {
      const q = search.toLowerCase().trim();
      records = records.filter(r =>
        (r.visitorName && r.visitorName.toLowerCase().includes(q)) ||
        (r.purpose && r.purpose.toLowerCase().includes(q)) ||
        (r.department && r.department.toLowerCase().includes(q)) ||
        (r.designation && r.designation.toLowerCase().includes(q)) ||
        (r.country && r.country.toLowerCase().includes(q)) ||
        (r.notes && r.notes.toLowerCase().includes(q)) ||
        (r.aboutVisitor && r.aboutVisitor.toLowerCase().includes(q)) ||
        (r.year && String(r.year).includes(q))
      );
    }
    return res.json(records);
  }
});

// GET visitor book formatted for physical 3D PageFlip viewer (Hides hidden records)
router.get('/book-format', async (req: Request, res: Response) => {
  const { name } = req.query;

  let where: any = { isHidden: false };
  if (name && typeof name === 'string') {
    where.visitorName = { contains: name };
  }

  try {
    const filtered = await prisma.visitorRecord.findMany({ where, orderBy: { visitDate: 'asc' } });

    // Group 3 records per page
    const recordsPerPage = 3;
    const pages: { pageNumber: number; header: string; content: string }[] = [];

    for (let i = 0; i < filtered.length; i += recordsPerPage) {
      const chunk = filtered.slice(i, i + recordsPerPage);
      const pageNum = Math.floor(i / recordsPerPage) + 1;
      const yearRange = chunk[0]?.visitDate ? chunk[0].visitDate.substring(0, 4) : 'Archive';

      let pageContent = `🏛 UNIVERSITY VISITOR REGISTER LOG\nRef Vol: ${yearRange}\n----------------------------------------\n\n`;

      chunk.forEach((rec, idx) => {
        pageContent += `[ENTRY #${i + idx + 1}]\n`;
        pageContent += `• Visitor Name: ${rec.visitorName}\n`;
        pageContent += `• Date of Visit: ${rec.visitDate}\n`;
        if (rec.country) pageContent += `• Country: ${rec.country}\n`;
        if (rec.designation) pageContent += `• Designation: ${rec.designation}\n`;
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
    return res.json({
      totalRecords: visitorRecordsStore.length,
      totalPages: 1,
      pages: [],
    });
  }
});

// GET Export Visitor Records to CSV / JSON
router.get('/export', async (req: Request, res: Response) => {
  const format = req.query.format === 'csv' ? 'csv' : 'json';

  try {
    const visitorRecords = await prisma.visitorRecord.findMany();

    if (format === 'json') {
      return res.json(visitorRecords);
    }

    // Generate CSV
    let csv = 'ID,Visitor Name,Visit Date,Country,Designation,Page Number,Notes,About Visitor\n';
    visitorRecords.forEach((r) => {
      csv += `"${r.id}","${r.visitorName}","${r.visitDate}","${r.country || ''}","${r.designation || ''}","${r.pageNumber || ''}","${r.notes || ''}","${r.aboutVisitor || ''}"\n`;
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="university_visitor_archive.csv"');
    return res.send(csv);
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to export records', details: err.message });
  }
});

// POST Import .mdb Database file
router.post('/import-mdb', upload.single('mdbFile'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No .mdb file uploaded.' });
    }

    const result = parseMdbBufferToRecords(req.file.originalname, req.file.buffer);
    
    try {
      await prisma.visitorRecord.deleteMany({});
      await prisma.visitorRecord.createMany({ data: result.records });
    } catch (e) {
      visitorRecordsStore.length = 0;
      visitorRecordsStore.push(...result.records.map((r: any, idx: number) => ({
        id: `vis-mdb-${idx}`,
        visitorName: r.visitorName || '',
        visitDate: r.visitDate || '',
        purpose: r.purpose || '',
        department: r.department || '',
        year: r.year || 2026,
        ...r
      })));
    }

    return res.json({
      success: true,
      importedCount: result.count,
      filename: req.file.originalname,
      records: result.records,
      message: `Successfully converted ${result.count} records from ${req.file.originalname} into records.`,
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to parse .mdb file', details: err.message });
  }
});

// POST Admin Add Visitor Record
router.post('/', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  const cleanData = sanitizeVisitorData(req.body);

  if (!cleanData.visitorName) {
    return res.status(400).json({ error: 'Visitor name is required' });
  }

  if (!cleanData.visitDate) {
    cleanData.visitDate = new Date().toISOString().split('T')[0];
  }
  if (!cleanData.year) {
    cleanData.year = Number(cleanData.visitDate.substring(0, 4)) || new Date().getFullYear();
  }

  try {
    const newRecord = await prisma.visitorRecord.create({
      data: cleanData
    });
    return res.status(201).json(newRecord);
  } catch (err: any) {
    const newRecord: any = {
      id: `vis-${Date.now()}`,
      ...cleanData,
    };
    visitorRecordsStore.unshift(newRecord);
    return res.status(201).json(newRecord);
  }
});

// GET Single Visitor Record by ID
router.get('/:id', async (req: Request, res: Response) => {
  const targetId = req.params.id;
  try {
    const visitor = await prisma.visitorRecord.findUnique({ where: { id: targetId } });
    if (visitor) return res.json(visitor);
  } catch (e) {}

  const found = visitorRecordsStore.find(v => v.id === targetId);
  if (found) return res.json(found);

  return res.status(404).json({ error: 'Visitor record not found' });
});

// GET Visitor "About" info by Visitor ID
router.get('/:id/about', async (req: Request, res: Response) => {
  const targetId = req.params.id;
  try {
    const visitor = await prisma.visitorRecord.findUnique({ where: { id: targetId } });
    if (visitor) {
      return res.json({
        id: visitor.id,
        visitorName: visitor.visitorName,
        aboutVisitor: visitor.aboutVisitor || '',
      });
    }
  } catch (e) {}

  const found = visitorRecordsStore.find(v => v.id === targetId);
  if (found) {
    return res.json({
      id: found.id,
      visitorName: found.visitorName,
      aboutVisitor: found.aboutVisitor || '',
    });
  }

  return res.status(404).json({ error: 'Visitor record not found' });
});

// POST / PUT Dedicated API to Add/Update "About Visitor" by Visitor ID
const handleAboutUpdate = async (req: AuthenticatedRequest, res: Response) => {
  const targetId = req.params.id;
  const aboutText = req.body.aboutVisitor !== undefined ? req.body.aboutVisitor : req.body.about;

  if (aboutText === undefined) {
    return res.status(400).json({ error: 'aboutVisitor or about text field is required' });
  }

  try {
    const existing = await prisma.visitorRecord.findUnique({ where: { id: targetId } });
    if (existing) {
      const updated = await prisma.visitorRecord.update({
        where: { id: targetId },
        data: { aboutVisitor: aboutText },
      });
      return res.json({
        success: true,
        message: 'About visitor updated successfully',
        visitor: updated,
      });
    }
  } catch (err: any) {
    console.error('Prisma update error in /:id/about:', err.message);
  }

  const idx = visitorRecordsStore.findIndex(v => v.id === targetId);
  if (idx !== -1) {
    visitorRecordsStore[idx].aboutVisitor = aboutText;
    return res.json({
      success: true,
      message: 'About visitor updated successfully',
      visitor: visitorRecordsStore[idx],
    });
  }

  return res.status(404).json({ error: 'Visitor record not found' });
};

router.post('/:id/about', authenticateToken, requireAdmin, handleAboutUpdate);
router.put('/:id/about', authenticateToken, requireAdmin, handleAboutUpdate);

// DELETE Dedicated API to Delete/Clear "About Visitor" info by Visitor ID
router.delete('/:id/about', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  const targetId = req.params.id;

  try {
    const existing = await prisma.visitorRecord.findUnique({ where: { id: targetId } });
    if (existing) {
      const updated = await prisma.visitorRecord.update({
        where: { id: targetId },
        data: { aboutVisitor: null },
      });
      return res.json({ success: true, message: 'About visitor details cleared', visitor: updated });
    }
  } catch (err: any) {
    console.error('Prisma delete error in /:id/about:', err.message);
  }

  const idx = visitorRecordsStore.findIndex(v => v.id === targetId);
  if (idx !== -1) {
    visitorRecordsStore[idx].aboutVisitor = '';
    return res.json({ success: true, message: 'About visitor details cleared', visitor: visitorRecordsStore[idx] });
  }

  return res.status(404).json({ error: 'Visitor record not found' });
});

// PUT Admin Edit Visitor Record
router.put('/:id', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  const cleanData = sanitizeVisitorData(req.body);
  const targetId = req.params.id;

  try {
    const existing = await prisma.visitorRecord.findUnique({ where: { id: targetId } });
    if (existing) {
      const updated = await prisma.visitorRecord.update({
        where: { id: targetId },
        data: cleanData,
      });
      return res.json(updated);
    }
  } catch (err: any) {
    console.error('Prisma update error:', err.message);
  }

  const idx = visitorRecordsStore.findIndex(v => v.id === targetId);
  if (idx !== -1) {
    visitorRecordsStore[idx] = { ...visitorRecordsStore[idx], ...cleanData };
    return res.json(visitorRecordsStore[idx]);
  }

  try {
    const created = await prisma.visitorRecord.create({
      data: {
        id: targetId,
        visitorName: cleanData.visitorName || 'Visitor',
        visitDate: cleanData.visitDate || new Date().toISOString().split('T')[0],
        ...cleanData,
      },
    });
    return res.json(created);
  } catch (e) {
    const fallbackRecord = {
      id: targetId,
      visitorName: cleanData.visitorName || 'Visitor',
      visitDate: cleanData.visitDate || new Date().toISOString().split('T')[0],
      ...cleanData,
    };
    visitorRecordsStore.unshift(fallbackRecord);
    return res.json(fallbackRecord);
  }
});

// DELETE Admin Delete Visitor Record
router.delete('/:id', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  const targetId = req.params.id;

  try {
    const existing = await prisma.visitorRecord.findUnique({ where: { id: targetId } });
    if (existing) {
      const deleted = await prisma.visitorRecord.delete({ where: { id: targetId } });
      return res.json({ message: 'Record deleted', deleted });
    }
  } catch (err: any) {
    console.error('Prisma delete error:', err.message);
  }

  const idx = visitorRecordsStore.findIndex(v => v.id === targetId);
  if (idx !== -1) {
    const removed = visitorRecordsStore.splice(idx, 1)[0];
    return res.json({ message: 'Record deleted', deleted: removed });
  }

  return res.status(404).json({ error: 'Record not found' });
});

// PUT Toggle Hide/Unhide Visitor Record (Admin)
router.put('/:id/toggle-hide', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  const targetId = req.params.id;
  try {
    const existing = await prisma.visitorRecord.findUnique({ where: { id: targetId } });
    if (existing) {
      const updated = await prisma.visitorRecord.update({
        where: { id: targetId },
        data: { isHidden: !existing.isHidden }
      });
      return res.json({ success: true, isHidden: updated.isHidden, visitor: updated });
    }
  } catch (err: any) {
    console.error('Prisma toggle hide error:', err.message);
  }

  const idx = visitorRecordsStore.findIndex(v => v.id === targetId);
  if (idx !== -1) {
    visitorRecordsStore[idx].isHidden = !visitorRecordsStore[idx].isHidden;
    return res.json({ success: true, isHidden: visitorRecordsStore[idx].isHidden, visitor: visitorRecordsStore[idx] });
  }

  return res.status(404).json({ error: 'Visitor record not found' });
});

export default router;
