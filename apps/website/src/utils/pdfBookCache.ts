// IndexedDB & Memory PDF File Blob Cache, Deduplication & Instant Reload Engine

const DB_NAME = 'DigitalLibraryPdfCache_v4';
const PDF_STORE = 'pdf_blobs';
const DB_VERSION = 1;

// Tier 1: In-Memory JS RAM Cache for 0ms Instant Reloads during session
const ramArrayBufferCache = new Map<string, ArrayBuffer>();

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

export async function getCachedPdfBlob(cacheKey: string): Promise<ArrayBuffer | null> {
  if (!cacheKey) return null;
  // Tier 1: JS RAM Check
  if (ramArrayBufferCache.has(cacheKey)) {
    const ramData = ramArrayBufferCache.get(cacheKey);
    if (ramData && ramData.byteLength > 0) {
      return ramData.slice(0);
    }
  }

  // Tier 2: IndexedDB Persistent Storage Check
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(PDF_STORE, 'readonly');
      const store = tx.objectStore(PDF_STORE);
      const req = store.get(cacheKey);

      req.onsuccess = () => {
        if (req.result && req.result.data && req.result.data.byteLength > 0) {
          const buffer = req.result.data.slice(0);
          ramArrayBufferCache.set(cacheKey, buffer.slice(0));
          resolve(buffer);
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

export async function setCachedPdfBlob(cacheKey: string, pdfId: string, data: ArrayBuffer): Promise<void> {
  if (!cacheKey || !data || data.byteLength === 0) return;

  const dataCopy = data.slice(0);
  // Store in Tier 1 RAM Cache
  ramArrayBufferCache.set(cacheKey, dataCopy);

  // Store in Tier 2 IndexedDB
  try {
    const db = await openDB();
    const tx = db.transaction(PDF_STORE, 'readwrite');
    const store = tx.objectStore(PDF_STORE);
    store.put({ cacheKey, pdfId, data: dataCopy.slice(0), updatedAt: Date.now() });
  } catch (err) {
    console.warn('Failed to cache PDF in IndexedDB:', err);
  }
}

// Fetch PDF ArrayBuffer with Auth, Deduplication, and Persistent 2-Tier Caching
export async function fetchAndCachePdf(url: string, pdfId?: string, versionKey?: string): Promise<ArrayBuffer> {
  const cleanUrl = url ? url.split('?')[0] : 'default_pdf';
  const effectiveKey = pdfId ? `${pdfId}_${versionKey || 'v1'}` : `url_${cleanUrl}`;

  // 1. Check Tier 1 RAM & Tier 2 IndexedDB
  const cached = await getCachedPdfBlob(effectiveKey);
  if (cached && cached.byteLength > 0) {
    return cached.slice(0);
  }

  // 2. Check in-flight requests (Request Deduplication)
  if (inFlightPdfRequests.has(effectiveKey)) {
    const buf = await inFlightPdfRequests.get(effectiveKey)!;
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

      let fullUrl = url;
      if (token && token !== 'null' && token !== 'undefined' && !url.includes('token=')) {
        fullUrl = `${url}${url.includes('?') ? '&' : '?'}token=${token}`;
      }

      const res = await fetch(fullUrl, { headers });
      if (!res.ok) {
        throw new Error(`Failed to fetch PDF (${res.status} ${res.statusText})`);
      }

      const arrayBuffer = await res.arrayBuffer();

      // Background save to Tier 1 RAM & Tier 2 IndexedDB
      setCachedPdfBlob(effectiveKey, pdfId || 'pdf', arrayBuffer.slice(0)).catch(() => {});

      inFlightPdfRequests.delete(effectiveKey);
      return arrayBuffer;
    } catch (err) {
      inFlightPdfRequests.delete(effectiveKey);
      throw err;
    }
  })();

  inFlightPdfRequests.set(effectiveKey, fetchPromise);
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
