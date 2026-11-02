import express from 'express';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';

import authRoutes from './routes/auth.routes';
import bookRoutes from './routes/book.routes';
import visitorRoutes from './routes/visitor.routes';
import orderRoutes from './routes/order.routes';
import adminRoutes from './routes/admin.routes';
import statsRoutes from './routes/stats.routes';

import fs from 'fs';
import { UPLOADS_DIR, WEBSITE_PUBLIC_UPLOADS_DIR, SECURE_UPLOADS_DIR } from './config/paths';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Static file hosting for /uploads with MIME detection, security sandboxing, audit logging & fallback image handling
app.use('/uploads', (req, res, next) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    return next();
  }

  // Parse path without query params
  const rawPath = req.path.split('?')[0];
  const safePath = path.normalize(decodeURIComponent(rawPath)).replace(/^(\.\.[\/\\])+/, '');
  const targetFile = path.resolve(UPLOADS_DIR, safePath.replace(/^[/\\]+/, ''));

  // Security Sandboxing: Strictly ensure target is inside UPLOADS_DIR and never inside SECURE_UPLOADS_DIR
  if (!targetFile.startsWith(UPLOADS_DIR) || targetFile.startsWith(SECURE_UPLOADS_DIR)) {
    console.warn(`[Security Alert] Blocked attempt to access file outside public uploads: ${req.originalUrl}`);
    return res.status(403).json({ error: 'Access denied' });
  }

  // Check file in primary UPLOADS_DIR
  let fileToServe: string | null = null;
  if (fs.existsSync(targetFile) && fs.statSync(targetFile).isFile()) {
    fileToServe = targetFile;
  } else if (fs.existsSync(WEBSITE_PUBLIC_UPLOADS_DIR)) {
    // Development helper: check website public uploads
    const fallbackCandidate = path.resolve(WEBSITE_PUBLIC_UPLOADS_DIR, safePath.replace(/^[/\\]+/, ''));
    if (fallbackCandidate.startsWith(WEBSITE_PUBLIC_UPLOADS_DIR) && fs.existsSync(fallbackCandidate) && fs.statSync(fallbackCandidate).isFile()) {
      fileToServe = fallbackCandidate;
    }
  }

  if (fileToServe) {
    const ext = path.extname(fileToServe).toLowerCase();
    const mimeMap: Record<string, string> = {
      '.bmp': 'image/bmp',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.svg': 'image/svg+xml',
      '.webp': 'image/webp',
      '.json': 'application/json',
      '.pdf': 'application/pdf',
    };

    if (mimeMap[ext]) {
      res.setHeader('Content-Type', mimeMap[ext]);
    }
    res.setHeader('Cache-Control', 'public, max-age=86400, stale-while-revalidate=604800');
    return res.sendFile(fileToServe);
  }

  // File is missing: Log warning for VPS deployment audit
  console.warn(`[Uploads 404] Missing file requested: "${req.originalUrl}" (Expected at: "${targetFile}")`);

  const isAutograph = safePath.toLowerCase().includes('autograph');
  const fallbackSvgName = isAutograph ? 'fallback-autograph.svg' : 'fallback-visitor.svg';
  const fallbackSvgPath = path.join(UPLOADS_DIR, fallbackSvgName);

  // If query specifies ?fallback=true
  if (req.query.fallback === 'true') {
    if (fs.existsSync(fallbackSvgPath)) {
      res.setHeader('Content-Type', 'image/svg+xml');
      res.setHeader('Cache-Control', 'no-cache');
      return res.sendFile(fallbackSvgPath);
    }
  }

  return res.status(404).json({
    error: 'File not found',
    requestedUrl: req.originalUrl,
    fallbackUrl: `/uploads/${fallbackSvgName}`
  });
});

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    service: 'Digital Library & University Visitor Archive API',
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/books', bookRoutes);
app.use('/api/visitors', visitorRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/stats', statsRoutes);

// Start server
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`====================================================`);
    console.log(`🚀 Digital Library API running on http://localhost:${PORT}`);
    console.log(`📖 Health Check: http://localhost:${PORT}/api/health`);
    console.log(`====================================================`);
  });
}

export default app;
