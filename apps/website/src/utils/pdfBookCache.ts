// IndexedDB PDF Part File Blob Cache, Deduplication & Version Management

const DB_NAME = 'DigitalLibraryPdfCache_v3';
const PDF_STORE = 'pdf_blobs';
const DB_VERSION = 1;

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return reject(new Error('IndexedDB not supported'));
    }
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event: any) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(PDF_STORE)) {
        const store = db.createObjectStore(PDF_STORE, { keyPath: 'cacheKey' });
        store.createIndex('pdfId', 'pdfId', { unique: false });
      }
    };

    request.onsuccess = (event: any) => resolve(event.target.result);
    request.onerror = (event: any) => reject(event.target.error);
  });
}

// In-flight request registry to prevent duplicate network downloads for the same PDF
const inFlightPdfRequests = new Map<string, Promise<ArrayBuffer>>();

export async function getCachedPdfBlob(pdfId: string, versionKey: string): Promise<ArrayBuffer | null> {
  if (!pdfId) return null;
  const cacheKey = `${pdfId}_${versionKey}`;
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(PDF_STORE, 'readonly');
      const store = tx.objectStore(PDF_STORE);
      const req = store.get(cacheKey);

      req.onsuccess = () => {
        if (req.result && req.result.data) {
          resolve(req.result.data.slice(0));
        } else {
          resolve(null);
        }
      };
      req.onerror = () => resolve(null);
    });
  } catch (err) {
    return null;
  }
}

export async function setCachedPdfBlob(pdfId: string, versionKey: string, data: ArrayBuffer): Promise<void> {
  if (!pdfId || !data || data.byteLength === 0) return;
  const cacheKey = `${pdfId}_${versionKey}`;
  try {
    const db = await openDB();
    const tx = db.transaction(PDF_STORE, 'readwrite');
    const store = tx.objectStore(PDF_STORE);

    // Clean up older versions of the same pdfId first (Cache Invalidation)
    const index = store.index('pdfId');
    const oldReq = index.getAllKeys(pdfId);
    oldReq.onsuccess = () => {
      const keys = oldReq.result || [];
      keys.forEach((oldKey) => {
        if (oldKey !== cacheKey) {
          store.delete(oldKey);
        }
      });
    };

    store.put({ cacheKey, pdfId, versionKey, data: data.slice(0), updatedAt: Date.now() });
  } catch (err) {
    console.warn('Failed to cache PDF in IndexedDB:', err);
  }
}

// Fetch PDF ArrayBuffer with Auth, Deduplication, and Persistent IndexedDB Caching
export async function fetchAndCachePdf(url: string, pdfId: string, versionKey: string): Promise<ArrayBuffer> {
  const cacheKey = `${pdfId}_${versionKey}`;

  // 1. Check IndexedDB Persistent Cache
  const cached = await getCachedPdfBlob(pdfId, versionKey);
  if (cached && cached.byteLength > 0) {
    return cached.slice(0);
  }

  // 2. Check in-flight requests (Request Deduplication)
  if (inFlightPdfRequests.has(cacheKey)) {
    const buf = await inFlightPdfRequests.get(cacheKey)!;
    return buf.slice(0);
  }

  // 3. Fetch from Network with Bearer Token
  const fetchPromise = (async () => {
    try {
      const token = typeof window !== 'undefined'
        ? (localStorage.getItem('dl_token') || localStorage.getItem('token') || localStorage.getItem('adminToken') || '')
        : '';

      const headers: Record<string, string> = {};
      if (token && token !== 'null' && token !== 'undefined') {
        headers['Authorization'] = `Bearer ${token}`;
      }

      // Append token query param if needed as fallback for auth proxies
      let fullUrl = url;
      if (token && token !== 'null' && token !== 'undefined' && !url.includes('token=')) {
        fullUrl = `${url}${url.includes('?') ? '&' : '?'}token=${token}`;
      }

      const res = await fetch(fullUrl, { headers });
      if (!res.ok) {
        throw new Error(`Failed to fetch PDF (${res.status} ${res.statusText})`);
      }

      const arrayBuffer = await res.arrayBuffer();

      // Background save to IndexedDB
      setCachedPdfBlob(pdfId, versionKey, arrayBuffer.slice(0)).catch(() => {});

      inFlightPdfRequests.delete(cacheKey);
      return arrayBuffer;
    } catch (err) {
      inFlightPdfRequests.delete(cacheKey);
      throw err;
    }
  })();

  inFlightPdfRequests.set(cacheKey, fetchPromise);
  const resultBuf = await fetchPromise;
  return resultBuf.slice(0);
}

// Backward compatibility helpers
export async function getCachedPageBlob(pdfKey: string, pageNumber: number): Promise<Blob | null> {
  return null;
}
export async function saveCachedPageBlob(pdfKey: string, pageNumber: number, blob: Blob): Promise<void> {}
export async function getCachedPageCount(pdfKey: string): Promise<number> {
  return 0;
}
export async function setCachedPageCount(pdfKey: string, count: number): Promise<void> {}
