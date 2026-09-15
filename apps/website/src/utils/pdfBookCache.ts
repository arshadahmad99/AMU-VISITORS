// IndexedDB Cache Utility for fast PDF page rendering and instant eBook loading

const DB_NAME = 'DigitalLibraryPdfCache_v1';
const STORE_NAME = 'pdf_pages';
const DB_VERSION = 1;

export interface CachedPage {
  pageNumber: number;
  dataUrl: string;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return reject(new Error('IndexedDB not supported'));
    }
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event: any) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };

    request.onsuccess = (event: any) => resolve(event.target.result);
    request.onerror = (event: any) => reject(event.target.error);
  });
}

// In-Memory Session Cache Map for 0ms instant retrieval within same session
const memoryCache = new Map<string, CachedPage[]>();

export async function getCachedPdfPages(pdfKey: string): Promise<CachedPage[] | null> {
  if (!pdfKey) return null;

  // 1. Check in-memory cache
  if (memoryCache.has(pdfKey)) {
    return memoryCache.get(pdfKey)!;
  }

  // 2. Check IndexedDB persistent cache
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(pdfKey);

      request.onsuccess = () => {
        const result = request.result;
        if (result && Array.isArray(result.pages) && result.pages.length > 0) {
          memoryCache.set(pdfKey, result.pages);
          resolve(result.pages);
        } else {
          resolve(null);
        }
      };

      request.onerror = () => resolve(null);
    });
  } catch (err) {
    return null;
  }
}

export async function setCachedPdfPages(pdfKey: string, pages: CachedPage[]): Promise<void> {
  if (!pdfKey || !pages || pages.length === 0) return;

  // Update in-memory cache
  memoryCache.set(pdfKey, pages);

  // Update IndexedDB persistent cache
  try {
    const db = await openDB();
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    store.put({ id: pdfKey, pages, updatedAt: Date.now() });
  } catch (err) {
    console.warn('Failed to save to IndexedDB cache:', err);
  }
}

export async function saveSingleCachedPage(pdfKey: string, pageNumber: number, dataUrl: string): Promise<void> {
  if (!pdfKey || !dataUrl) return;

  const existing = memoryCache.get(pdfKey) || [];
  const idx = existing.findIndex(p => p.pageNumber === pageNumber);
  if (idx >= 0) {
    existing[idx] = { pageNumber, dataUrl };
  } else {
    existing.push({ pageNumber, dataUrl });
    existing.sort((a, b) => a.pageNumber - b.pageNumber);
  }
  memoryCache.set(pdfKey, existing);

  try {
    const db = await openDB();
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    store.put({ id: pdfKey, pages: existing, updatedAt: Date.now() });
  } catch (err) {}
}
