import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

/**
 * Serves and emits pdf.js module worker with a standard `.js` extension (`/pdf.worker.min.js`)
 * so reverse proxies and web servers that lack an `.mjs` MIME mapping serve it as
 * `application/javascript` instead of blocking dynamic ES module worker imports.
 */
function pdfWorkerJsPlugin(): Plugin {
  const workerPath = require.resolve('pdfjs-dist/build/pdf.worker.min.mjs');

  return {
    name: 'pdf-worker-js',
    configureServer(server) {
      server.middlewares.use('/pdf.worker.min.js', (_req, res, next) => {
        try {
          const content = fs.readFileSync(workerPath);
          res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
          res.end(content);
        } catch (err) {
          next(err);
        }
      });
    },
    generateBundle() {
      this.emitFile({
        type: 'asset',
        fileName: 'pdf.worker.min.js',
        source: fs.readFileSync(workerPath),
      });
    },
  };
}

/**
 * Build-time prerender shell for the public landing route (`/`).
 * Ensures search engine crawlers and non-JS clients receive semantic HTML
 * content (H1, navigation links, archive summary, author details, and contact
 * metadata) immediately inside `#root` while React replaces it on mount.
 * Paid PDF paths and private routes are strictly excluded.
 */
function seoPrerenderPlugin(): Plugin {
  const prerenderShell = `
    <div id="root">
      <div class="seo-prerender-shell" style="font-family:Inter,system-ui,sans-serif;color:#1e293b;background:#faf8f5;">
        <header style="padding:1rem 1.5rem;background:#ffffff;border-bottom:1px solid #e2e8f0;">
          <a href="/" style="font-family:Cinzel,Georgia,serif;font-weight:700;color:#0f172a;text-decoration:none;font-size:1.15rem;">
            MAULANA AZAD LIBRARY
          </a>
          <nav aria-label="Primary sections" style="margin-top:0.5rem;display:flex;gap:1.25rem;flex-wrap:wrap;font-size:0.875rem;">
            <a href="#ebook-collection" style="color:#1e293b;text-decoration:none;">eBook</a>
            <a href="#visitor-book-archive" style="color:#1e293b;text-decoration:none;">Visitor Book</a>
            <a href="#author-biography" style="color:#1e293b;text-decoration:none;">About Author</a>
          </nav>
        </header>
        <main style="max-width:1100px;margin:0 auto;padding:2rem 1.5rem;">
          <section aria-labelledby="hero-heading">
            <p style="font-size:0.75rem;letter-spacing:0.15em;text-transform:uppercase;color:#92400e;">Aligarh Muslim University</p>
            <h1 id="hero-heading" style="font-family:Cinzel,Georgia,serif;font-size:2rem;color:#0f172a;margin:0.5rem 0;">
              Maulana Azad Library — AMU Digital Library &amp; University Visitor Archive
            </h1>
            <p style="line-height:1.65;color:#334155;">
              Explore the historical heritage of the Maulana Azad Library (originally founded in 1877 as the Lytton Library and inaugurated in 1960), Aligarh Muslim University, India.
            </p>
          </section>
          <section id="ebook-collection" style="margin-top:2rem;">
            <h2 style="font-family:Cinzel,Georgia,serif;font-size:1.5rem;color:#0f172a;">
              Lytton to Maulana Azad Library (Vision and Mission)
            </h2>
            <p style="line-height:1.65;color:#334155;">
              Digital historical publication authored by Prof. (Dr.) Shabahat Husain documenting the origins, rare manuscript collections, modernization, and academic mission of the AMU Central Library.
            </p>
          </section>
          <section id="visitor-book-archive" style="margin-top:2rem;">
            <h2 style="font-family:Cinzel,Georgia,serif;font-size:1.5rem;color:#0f172a;">
              A Visual Bibliography of Celebrated Visitors (1877–2008)
            </h2>
            <p style="line-height:1.65;color:#334155;">
              Browse the digitized historical register of distinguished statesmen, scholars, scientists, and international dignitaries who visited the Lytton Library and Maulana Azad Library between 1877 and 2008.
            </p>
          </section>
          <section id="author-biography" style="margin-top:2rem;">
            <h2 style="font-family:Cinzel,Georgia,serif;font-size:1.5rem;color:#0f172a;">
              About the Author — Prof. (Dr.) Shabahat Husain
            </h2>
            <p style="line-height:1.65;color:#334155;">
              Former Dean, University Librarian of Maulana Azad Library, and Chairman of the Department of Library &amp; Information Science at Aligarh Muslim University.
            </p>
          </section>
        </main>
        <footer style="max-width:1100px;margin:2rem auto 0;padding:1.5rem;border-top:1px solid #e2e8f0;font-size:0.875rem;color:#475569;">
          <p>
            Maulana Azad Library Digital Archive — A non-commercial historical research project. Inquiries: husains.shabahat@gmail.com.
          </p>
        </footer>
      </div>
    </div>`.trim();

  return {
    name: 'seo-prerender-shell',
    apply: 'build',
    transformIndexHtml(html) {
      return html.replace('<div id="root"></div>', prerenderShell);
    },
  };
}

export default defineConfig({
  plugins: [react(), seoPrerenderPlugin(), pdfWorkerJsPlugin()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
  resolve: {
    alias: {
      '@digital-library/types': path.resolve(__dirname, '../../packages/types/src'),
      '@digital-library/ui': path.resolve(__dirname, '../../packages/ui/src'),
      '@digital-library/utils': path.resolve(__dirname, '../../packages/utils/src'),
    },
  },
});
