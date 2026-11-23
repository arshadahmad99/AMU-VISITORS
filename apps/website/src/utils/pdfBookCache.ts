// IndexedDB & Memory PDF File Blob & Rendered Page Cache Engine

const DB_NAME = 'DigitalLibraryPdfCache_v5';
const PDF_STORE = 'pdf_blobs';
const PAGE_STORE = 'rendered_pages';
const DB_VERSION = 1;

// Tier 1: In-Memory JS RAM Cache for 0ms Instant Reloads during session
const ramArrayBufferCache = new Map<string, ArrayBuffer>();
const ramPageUrlCache = new Map<string, string>();

let dbPromise: Promise<IDBDatabase> | null = null;

function openDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
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
      if (!db.objectStoreNames.contains(PAGE_STORE)) {
        const pageStore = db.createObjectStore(PAGE_STORE, { keyPath: 'pageKey' });
        pageStore.createIndex('bookKey', 'bookKey', { unique: false });
      }
    };

    request.onsuccess = (event: any) => resolve(event.target.result);
    request.onerror = (event: any) => {
      dbPromise = null;
      reject(event.target.error);
    };
  });

  return dbPromise;
}

// In-flight request registry to prevent duplicate network downloads for the same PDF
const inFlightPdfRequests = new Map<string, Promise<ArrayBuffer>>();

export function isValidPdfBuffer(buffer: ArrayBuffer | null | undefined): boolean {
  if (!buffer || buffer.byteLength < 5) return false;
  const bytes = new Uint8Array(buffer, 0, Math.min(buffer.byteLength, 1024));
  for (let i = 0; i <= bytes.length - 5; i++) {
    // Check for "%PDF-" magic bytes
    if (
      bytes[i] === 0x25 &&
      bytes[i + 1] === 0x50 &&
      bytes[i + 2] === 0x44 &&
      bytes[i + 3] === 0x46 &&
      bytes[i + 4] === 0x2d
    ) {
      return true;
    }
  }
  return false;
}

/**
 * Invalidates a specific cached PDF blob from RAM and IndexedDB.
 */
export async function invalidateCachedPdfBlob(cacheKey: string): Promise<void> {
  if (!cacheKey) return;
  ramArrayBufferCache.delete(cacheKey);
  try {
    const db = await openDB();
    const tx = db.transaction(PDF_STORE, 'readwrite');
    tx.objectStore(PDF_STORE).delete(cacheKey);
  } catch (_) {}
}

/**
 * Prunes obsolete versions of a PDF from IndexedDB so disk space is preserved
 * and old cached versions are never served.
 */
export async function pruneOldPdfVersions(pdfId: string, currentEffectiveKey: string): Promise<void> {
  if (!pdfId) return;
  try {
    const db = await openDB();
    const tx = db.transaction(PDF_STORE, 'readwrite');
    const store = tx.objectStore(PDF_STORE);
    const index = store.index('pdfId');
    const req = index.getAllKeys(pdfId);

    req.onsuccess = () => {
      const keys = req.result;
      if (Array.isArray(keys)) {
        for (const k of keys) {
          if (k !== currentEffectiveKey) {
            store.delete(k);
            ramArrayBufferCache.delete(String(k));
          }
        }
      }
    };
  } catch (_) {}
}

/**
 * Prunes obsolete rendered page images from IndexedDB when a book/PDF version changes.
 */
export async function pruneOldRenderedPages(baseBookKey: string, currentCacheKey: string): Promise<void> {
  if (!baseBookKey) return;
  try {
    const db = await openDB();
    const tx = db.transaction(PAGE_STORE, 'readwrite');
    const store = tx.objectStore(PAGE_STORE);
    const req = store.openCursor();

    req.onsuccess = (e: any) => {
      const cursor = e.target.result;
      if (cursor) {
        const entry = cursor.value;
        if (
          entry.bookKey &&
          entry.bookKey.startsWith(baseBookKey) &&
          entry.bookKey !== currentCacheKey
        ) {
          cursor.delete();
          ramPageUrlCache.delete(entry.pageKey);
        }
        cursor.continue();
      }
    };
  } catch (_) {}
}

/**
 * Invalidate all cached data for a given book or PDF across RAM and IndexedDB.
 */
export async function invalidateBookCache(identifier: string): Promise<void> {
  if (!identifier) return;

  // Clear matching in-memory caches
  for (const k of Array.from(ramArrayBufferCache.keys())) {
    if (k.includes(identifier)) {
      ramArrayBufferCache.delete(k);
    }
  }
  for (const k of Array.from(ramPageUrlCache.keys())) {
    if (k.includes(identifier)) {
      ramPageUrlCache.delete(k);
    }
  }

  try {
    const db = await openDB();
    // Clear matching PDF blobs
    const pdfTx = db.transaction(PDF_STORE, 'readwrite');
    const pdfStore = pdfTx.objectStore(PDF_STORE);
    const pdfCursorReq = pdfStore.openCursor();
    pdfCursorReq.onsuccess = (e: any) => {
      const cursor = e.target.result;
      if (cursor) {
        if (cursor.key.toString().includes(identifier) || cursor.value?.pdfId === identifier) {
          cursor.delete();
        }
        cursor.continue();
      }
    };

    // Clear matching rendered pages
    const pageTx = db.transaction(PAGE_STORE, 'readwrite');
    const pageStore = pageTx.objectStore(PAGE_STORE);
    const pageCursorReq = pageStore.openCursor();
    pageCursorReq.onsuccess = (e: any) => {
      const cursor = e.target.result;
      if (cursor) {
        if (cursor.key.toString().includes(identifier) || cursor.value?.bookKey?.includes(identifier)) {
          cursor.delete();
        }
        cursor.continue();
      }
    };
  } catch (_) {}
}

export async function getCachedPdfBlob(cacheKey: string): Promise<ArrayBuffer | null> {
  if (!cacheKey) return null;
  // Tier 1: JS RAM Check
  if (ramArrayBufferCache.has(cacheKey)) {
    const ramData = ramArrayBufferCache.get(cacheKey);
    if (ramData && isValidPdfBuffer(ramData)) {
      return ramData.slice(0);
    }
    ramArrayBufferCache.delete(cacheKey);
  }

  // Tier 2: IndexedDB Persistent Storage Check
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(PDF_STORE, 'readonly');
      const store = tx.objectStore(PDF_STORE);
      const req = store.get(cacheKey);

      req.onsuccess = () => {
        if (req.result && req.result.data && isValidPdfBuffer(req.result.data)) {
          const buffer = req.result.data.slice(0);
          ramArrayBufferCache.set(cacheKey, buffer.slice(0));
          resolve(buffer);
        } else {
          if (req.result) {
            void invalidateCachedPdfBlob(cacheKey);
          }
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
  if (!cacheKey || !isValidPdfBuffer(data)) return;

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

// Fetch PDF ArrayBuffer with Auth, Deduplication, Version Detection, and Persistent 2-Tier Caching
export async function fetchAndCachePdf(
  url: string,
  pdfId?: string,
  versionKey?: string,
  forceRefresh = false
): Promise<ArrayBuffer> {
  // Extract version fingerprint from query parameter if versionKey not explicitly provided
  const urlVer = typeof url === 'string' ? (url.match(/[?&](?:v|t|ver|updatedAt)=([^&]+)/)?.[1]) : null;
  const effectiveVersion = versionKey || urlVer || 'v1';
  const cleanUrl = url ? url.split('?')[0] : 'default_pdf';
  const effectiveKey = pdfId ? `${pdfId}_${effectiveVersion}` : `${cleanUrl}_${effectiveVersion}`;

  if (forceRefresh) {
    await invalidateCachedPdfBlob(effectiveKey);
  } else {
    // 1. Check Tier 1 RAM & Tier 2 IndexedDB
    const cached = await getCachedPdfBlob(effectiveKey);
    if (cached && cached.byteLength > 0) {
      return cached.slice(0);
    }
  }

  // 2. Check in-flight requests (Request Deduplication)
  if (inFlightPdfRequests.has(effectiveKey)) {
    const buf = await inFlightPdfRequests.get(effectiveKey)!;
    return buf.slice(0);
  }

  // 3. Fetch from Network with Bearer Token and Cache-Validation
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

      // Use cache: 'no-cache' so browser validates conditional headers instead of serving stale disk response
      const res = await fetch(fullUrl, { headers, cache: 'no-cache' });
      if (!res.ok) {
        let serverError = '';
        try {
          const parsed = await res.json();
          serverError = parsed?.error || parsed?.message || '';
        } catch (_) {}
        const err: any = new Error(
          serverError || `Failed to fetch PDF (${res.status} ${res.statusText})`
        );
        err.status = res.status;
        throw err;
      }

      const arrayBuffer = await res.arrayBuffer();
      if (!isValidPdfBuffer(arrayBuffer)) {
        throw new Error('Server returned an invalid or empty PDF document.');
      }

      // Background save to Tier 1 RAM & Tier 2 IndexedDB
      setCachedPdfBlob(effectiveKey, pdfId || cleanUrl, arrayBuffer.slice(0)).catch(() => {});

      // Automatically prune older versions of this PDF from IndexedDB to maintain optimal performance
      if (pdfId) {
        pruneOldPdfVersions(pdfId, effectiveKey).catch(() => {});
      }

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

// Tier 1 & Tier 2 Rendered Page Image Cache
export async function getCachedPageUrl(pageKey: string): Promise<string | null> {
  if (!pageKey) return null;

  // Tier 1: In-memory Object URL cache
  if (ramPageUrlCache.has(pageKey)) {
    return ramPageUrlCache.get(pageKey)!;
  }

  // Tier 2: IndexedDB Persistent Storage
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(PAGE_STORE, 'readonly');
      const store = tx.objectStore(PAGE_STORE);
      const req = store.get(pageKey);

      req.onsuccess = () => {
        if (req.result && req.result.blob) {
          const url = URL.createObjectURL(req.result.blob);
          ramPageUrlCache.set(pageKey, url);
          resolve(url);
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

export async function saveCachedPageBlob(pageKey: string, bookKey: string, blob: Blob): Promise<string> {
  const url = URL.createObjectURL(blob);
  ramPageUrlCache.set(pageKey, url);

  try {
    const db = await openDB();
    const tx = db.transaction(PAGE_STORE, 'readwrite');
    const store = tx.objectStore(PAGE_STORE);
    store.put({ pageKey, bookKey, blob, updatedAt: Date.now() });
  } catch (err) {
    console.warn('Failed to save page image in IndexedDB:', err);
  }

  return url;
}

export async function getCachedPageBlob(pageKey: string): Promise<Blob | null> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(PAGE_STORE, 'readonly');
      const store = tx.objectStore(PAGE_STORE);
      const req = store.get(pageKey);
      req.onsuccess = () => resolve(req.result?.blob || null);
      req.onerror = () => resolve(null);
    });
  } catch (e) {
    return null;
  }
}
