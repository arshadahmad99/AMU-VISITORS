import fs from 'fs';
import path from 'path';
import { createCanvas } from 'canvas';
import { v4 as uuidv4 } from 'uuid';

export async function processPdfToImages(pdfFilePath: string): Promise<{ pageNum: number, imageUrl: string }[]> {
  try {
    const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');
    const data = new Uint8Array(fs.readFileSync(pdfFilePath));
    const loadingTask = pdfjsLib.getDocument({ data });
    const pdfDocument = await loadingTask.promise;
    const numPages = pdfDocument.numPages;
    
    const pageImages: { pageNum: number, imageUrl: string }[] = [];
    
    const uploadsDir = path.join(__dirname, '../../secure_uploads/pages');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    // Process pages sequentially to avoid memory overload on large PDFs
    for (let i = 1; i <= numPages; i++) {
      const page = await pdfDocument.getPage(i);
      // Scale 1.5 gives good readability
      const viewport = page.getViewport({ scale: 1.5 });
      
      const canvas = createCanvas(viewport.width, viewport.height);
      const context = canvas.getContext('2d');
      
      const renderContext: any = {
        canvasContext: context,
        viewport: viewport,
        canvas: canvas,
      };
      
      await page.render(renderContext).promise;
      
      const filename = `page_${uuidv4()}.jpg`;
      const outPath = path.join(uploadsDir, filename);
      
      await new Promise<void>((resolve, reject) => {
        const out = fs.createWriteStream(outPath);
        const stream = canvas.createJPEGStream({
          quality: 0.8,
          chromaSubsampling: false
        });
        stream.pipe(out);
        out.on('finish', () => resolve());
        out.on('error', reject);
      });
      
      pageImages.push({
        pageNum: i,
        imageUrl: `/api/books/pages/${filename}`
      });
      
      // Clear memory
      page.cleanup();
    }
    
    return pageImages;
  } catch (error) {
    console.error('Error processing PDF to images:', error);
    throw new Error('Failed to process PDF into page images');
  }
}
