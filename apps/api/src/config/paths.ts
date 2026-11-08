import path from 'path';
import fs from 'fs';

/**
 * Robust helper to locate the @digital-library/api package directory root.
 * Works seamlessly in both:
 * - TypeScript ts-node dev (where __dirname is <root>/src/config)
 * - Compiled Node.js dist (where __dirname is <root>/dist/src/config)
 */
const findApiRoot = (): string => {
  let current = __dirname;
  while (current !== path.dirname(current)) {
    const pkgPath = path.join(current, 'package.json');
    if (fs.existsSync(pkgPath)) {
      try {
        const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
        if (pkg.name === '@digital-library/api') {
          return current;
        }
      } catch (e) {
        // Continue searching upwards
      }
    }
    current = path.dirname(current);
  }

  // Fallback checks
  const cwdCandidates = [
    path.resolve(process.cwd(), 'apps/api'),
    process.cwd(),
    path.resolve(__dirname, '../../..'),
  ];
  for (const c of cwdCandidates) {
    if (fs.existsSync(path.join(c, 'prisma/schema.prisma')) || fs.existsSync(path.join(c, 'src/server.ts'))) {
      return c;
    }
  }

  return process.cwd();
};

export const API_ROOT = findApiRoot();

/**
 * Public Uploads Directory (Covers, Visitor Autographs & Photos, Public Assets)
 * In Docker: /app/apps/api/uploads (mounted from uploads_data persistent volume)
 */
export const UPLOADS_DIR = process.env.UPLOADS_DIR
  ? path.resolve(process.env.UPLOADS_DIR)
  : path.resolve(API_ROOT, 'uploads');

/**
 * Directory specifically holding visitor autographs and photos
 */
export const AUTOGRAPHS_DIR = path.resolve(UPLOADS_DIR, 'autographs');

/**
 * Secure Uploads Directory (Private eBooks & Rendered Page Images)
 * Never served directly via public static Express routes.
 * In Docker: /app/apps/api/secure_uploads (mounted from secure_uploads_data volume)
 */
export const SECURE_UPLOADS_DIR = process.env.SECURE_UPLOADS_DIR
  ? path.resolve(process.env.SECURE_UPLOADS_DIR)
  : path.resolve(API_ROOT, 'secure_uploads');

export const SECURE_BOOKS_DIR = path.resolve(SECURE_UPLOADS_DIR, 'books');
export const SECURE_PAGES_DIR = path.resolve(SECURE_UPLOADS_DIR, 'pages');

// Fallback search directories for local development (e.g. apps/website/public/uploads)
export const WEBSITE_PUBLIC_UPLOADS_DIR = path.resolve(API_ROOT, '../website/public/uploads');

// Ensure all essential directories exist on disk
[UPLOADS_DIR, AUTOGRAPHS_DIR, SECURE_UPLOADS_DIR, SECURE_BOOKS_DIR, SECURE_PAGES_DIR].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    try {
      fs.mkdirSync(dir, { recursive: true });
    } catch (err) {
      console.warn(`[Paths] Could not create directory ${dir}:`, err);
    }
  }
});
