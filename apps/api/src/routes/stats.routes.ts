import { Router, Request, Response } from 'express';
import fs from 'fs';
import path from 'path';

const router = Router();
const statsFilePath = path.join(__dirname, '../../uploads/site-stats.json');

const getStats = (): { views: number } => {
  try {
    if (fs.existsSync(statsFilePath)) {
      const data = JSON.parse(fs.readFileSync(statsFilePath, 'utf-8'));
      if (typeof data.views === 'number') {
        return data;
      }
    }
  } catch (err) {
    console.error('Error reading stats file:', err);
  }
  return { views: 0 };
};

const saveStats = (stats: { views: number }) => {
  try {
    const dir = path.dirname(statsFilePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(statsFilePath, JSON.stringify(stats, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving stats file:', err);
  }
};

// GET current views count
router.get('/views', (req: Request, res: Response) => {
  const stats = getStats();
  res.json({ views: stats.views });
});

// POST increment views count on site visit
router.post('/visit', (req: Request, res: Response) => {
  const stats = getStats();
  stats.views += 1;
  saveStats(stats);
  res.json({ views: stats.views });
});

export default router;
