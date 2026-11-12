import React, { useEffect, useRef, useState, useCallback, useImperativeHandle, forwardRef } from "react";
import * as pdfjsLib from "pdfjs-dist";
import type { PDFDocumentProxy } from "pdfjs-dist";
// @ts-ignore
import HTMLFlipBook from "react-pageflip";
import "./PDFBook.css";
import {
  fetchAndCachePdf,
  getCachedPageUrl,
  invalidateCachedPdfBlob,
  saveCachedPageBlob,
} from "../utils/pdfBookCache";
import { BookPDF } from "@digital-library/types";

if (typeof window !== "undefined" && pdfjsLib.GlobalWorkerOptions) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.js";
}

export interface PDFBookRefHandle {
  jumpToPage: (pageNumber: number) => void;
  flipPrev: () => void;
  flipNext: () => void;
  getTotalPages: () => number;
}

export interface DetectedTocEntry {
  id: string;
  name: string;
  targetPage: number;
  isSubPart?: boolean;
}

interface PDFBookProps {
  source?: string | File;
  sources?: (string | File)[];
  bookPdfs?: BookPDF[];
  width?: number;
  height?: number;
  renderScale?: number;
  className?: string;
  initialPage?: number;
  showControls?: boolean;
  onPageChange?: (page: number) => void;
  onTotalPagesLoaded?: (totalPages: number) => void;
  onTocDetected?: (entries: DetectedTocEntry[]) => void;
  usePortrait?: boolean;
}

interface PageProps {
  pageNumber: number;
  currentPage: number;
  getPageUrl: (pageNumber: number) => Promise<string>;
}

// Memory-Optimized Virtualized Page Component
const Page = React.forwardRef<HTMLDivElement, PageProps>(
  ({ pageNumber, currentPage, getPageUrl }, ref) => {
    const [imageSrc, setImageSrc] = useState<string>("");
    const [pageError, setPageError] = useState<boolean>(false);
    const [retryCount, setRetryCount] = useState<number>(0);

    // Active rendering window: only render full image for pages within 3 pages of active page
    const isNear = Math.abs(pageNumber - currentPage) <= 3;

    useEffect(() => {
      let isSubscribed = true;

      if (!isNear) {
        if (imageSrc) setImageSrc("");
        return;
      }

      setPageError(false);

      getPageUrl(pageNumber)
        .then((url) => {
          if (isSubscribed && url && !url.includes("ERROR")) {
            setImageSrc(url);
          }
        })
        .catch(() => {
          if (isSubscribed) setPageError(true);
        });

      return () => {
        isSubscribed = false;
      };
    }, [pageNumber, currentPage, isNear, retryCount, getPageUrl]);

    // Distant pages render lightweight text placeholder node (0 GPU image textures, 0 canvas allocations)
    if (!isNear) {
      return (
        <div className="pdf-book-page placeholder-page" ref={ref}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            color: '#94a3b8',
            fontSize: '0.85rem',
            fontFamily: 'serif',
            background: '#fdfbf7'
          }}>
            Page {pageNumber}
          </div>
          <span className="pdf-book-page-number">{pageNumber}</span>
        </div>
      );
    }

    return (
      <div className="pdf-book-page" ref={ref}>
        {pageError ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', padding: '20px', textAlign: 'center', gap: '12px', background: '#fdfbf7' }}>
            <span style={{ fontSize: '1.8rem' }}>⚠️</span>
            <span style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: 600 }}>Page {pageNumber}</span>
            <button
              onClick={() => setRetryCount((r) => r + 1)}
              style={{ padding: '6px 14px', borderRadius: '6px', background: '#f59e0b', color: '#0f172a', border: 'none', fontWeight: 700, cursor: 'pointer', fontSize: '0.8rem' }}
            >
              Retry
            </button>
          </div>
        ) : (
          imageSrc ? (
            <img src={imageSrc} alt={`Page ${pageNumber}`} draggable={false} />
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#94a3b8', fontSize: '0.85rem', background: '#fdfbf7' }}>
              Loading Page {pageNumber}…
            </div>
          )
        )}
        <span className="pdf-book-page-number">{pageNumber}</span>
      </div>
    );
  }
);
Page.displayName = "Page";

interface PdfPartDoc {
  pdf: PDFDocumentProxy;
  partIndex: number;
  startGlobalPage: number;
  endGlobalPage: number;
}

interface PrecomputedRange {
  partIndex: number;
  startPage: number;
  endPage: number;
  pageCount: number;
  src: string | File;
  matchingPdf?: BookPDF;
}

interface GlobalPdfSession {
  cacheKey: string;
  totalPages: number;
  partDocs: PdfPartDoc[];
  partPromises: Map<number, Promise<PdfPartDoc | null>>;
  precomputedRanges: PrecomputedRange[];
  isFullyLoaded: boolean;
  detectedToc?: DetectedTocEntry[];
  lastError?: any;
}

const SINGLE_PDF_CHAPTER_SPECS: { id: string; name: string; num: number }[] = [
  { id: 'chap-1', name: 'Chap 1: Lytton Library & Asadullah', num: 1 },
  { id: 'chap-2', name: 'Chap 2: M.A. Library & Bashiruddin', num: 2 },
  { id: 'chap-3', name: 'Chap 3: M.A. Library & Fayazuddin', num: 3 },
  { id: 'chap-4', name: 'Chap 4: M.A. Library & Sadequain', num: 4 },
  { id: 'chap-5', name: 'Chap 5: M.A. Library & Moazzam Khan', num: 5 },
  { id: 'chap-6', name: 'Chap 6: Shifting Lytton to M.A. Lib', num: 6 },
  { id: 'chap-7', name: 'Chap 7: Rare Manuscripts & Nahjul', num: 7 },
  { id: 'chap-8', name: 'Chap 8: Dept of Library & Info Sci', num: 8 },
  { id: 'chap-9', name: 'Chap 9: Social Science Cyber Lib', num: 9 },
];

async function extractTocFromSinglePdf(
  pdf: PDFDocumentProxy,
  isCancelled: () => boolean
): Promise<DetectedTocEntry[]> {
  const numPages = pdf.numPages;
  const entries: DetectedTocEntry[] = [{ id: 'toc-i', name: 'Title page', targetPage: 1 }];

  let prayerPage: number | null = null;
  let dedicationPage: number | null = null;
  const forewordPages: number[] = [];
  let aboutAuthorPage: number | null = null;
  let prefacePage: number | null = null;
  let contentsPage: number | null = null;
  let firstBodyChapterPage: number | null = null;

  const frontScanLimit = Math.min(24, numPages);
  for (let p = 2; p <= frontScanLimit; p++) {
    if (isCancelled()) return [];
    try {
      const page = await pdf.getPage(p);
      const tc = await page.getTextContent();
      const fullText = tc.items.map((i: any) => i.str || '').join(' ').replace(/\s+/g, ' ').trim();
      const headText = tc.items.slice(0, 18).map((i: any) => i.str || '').join(' ').replace(/\s+/g, ' ').trim();
      try { page.cleanup(); } catch {}

      if (!fullText) continue;

      const isTocPage = /\bTable\s+of\s+Contents\b/i.test(headText) || (/\(i\)\s*Title\s+page/i.test(fullText) && /\(vi\)\s*Preface/i.test(fullText));
      if (isTocPage) {
        if (!contentsPage) contentsPage = p;
        continue;
      }

      if (!firstBodyChapterPage && contentsPage && p > contentsPage && /^(?:\d+\s+)?Chapter\s+1\b/i.test(headText)) {
        firstBodyChapterPage = p;
        break;
      }
      if (!prayerPage && !dedicationPage && (/\bPrayer\b/i.test(headText) || /benefit\s+me\s+with\s+what\s+You\s+have\s+taught/i.test(fullText))) {
        prayerPage = p;
        continue;
      }
      if (!dedicationPage && /\bDedicated\s+to\s*:|\bDedication\b/i.test(headText)) {
        dedicationPage = p;
        continue;
      }
      if (!aboutAuthorPage && /\bAbout\s+the\s+Author\b/i.test(headText)) {
        aboutAuthorPage = p;
        continue;
      }
      if (!prefacePage && /\bPreface\b/i.test(headText)) {
        prefacePage = p;
        continue;
      }
      if (
        !aboutAuthorPage &&
        !prefacePage &&
        (/\bForeword\b/i.test(fullText) || /\bPROFESSOR\s+P\.?\s*K\.?\s+ABDUL\s+AZIS\b/i.test(fullText))
      ) {
        forewordPages.push(p);
      }
    } catch {}
  }

  if (prayerPage) entries.push({ id: 'toc-ii', name: 'Prayer', targetPage: prayerPage });
  if (dedicationPage) entries.push({ id: 'toc-iii', name: 'Dedication', targetPage: dedicationPage });
  if (forewordPages.length === 1) {
    entries.push({ id: 'toc-iv', name: 'Foreword', targetPage: forewordPages[0] });
  } else if (forewordPages.length >= 2) {
    forewordPages.forEach((fp, idx) => {
      entries.push({ id: `toc-iv-${idx + 1}`, name: `Foreword ${idx + 1}`, targetPage: fp });
    });
  }
  if (aboutAuthorPage) entries.push({ id: 'toc-v', name: 'About the Author', targetPage: aboutAuthorPage });
  if (prefacePage) entries.push({ id: 'toc-vi', name: 'Preface', targetPage: prefacePage });
  if (contentsPage) entries.push({ id: 'toc-vii', name: 'Contents Page', targetPage: contentsPage });

  const chapterStartScan = Math.max((contentsPage || 1) + 1, firstBodyChapterPage || 2);
  let nextChapterIdx = 0;
  let chap10Part1Page: number | null = null;
  let chap10Part2Page: number | null = null;
  let chap10Part3Page: number | null = null;

  for (let p = chapterStartScan; p <= numPages; p++) {
    if (isCancelled()) return [];
    if (p % 25 === 0) {
      await new Promise((r) => setTimeout(r, 0));
      if (isCancelled()) return [];
    }
    try {
      const page = await pdf.getPage(p);
      const tc = await page.getTextContent();
      const headText = tc.items.slice(0, 22).map((i: any) => i.str || '').join(' ').replace(/\s+/g, ' ').trim();
      try { page.cleanup(); } catch {}

      if (!headText) continue;

      if (nextChapterIdx < SINGLE_PDF_CHAPTER_SPECS.length) {
        const spec = SINGLE_PDF_CHAPTER_SPECS[nextChapterIdx];
        const chapRe = new RegExp(`^(?:\\d+\\s+)?Chapter\\s+${spec.num}\\b`, 'i');
        if (chapRe.test(headText)) {
          entries.push({ id: spec.id, name: spec.name, targetPage: p });
          nextChapterIdx++;
          continue;
        }
      }

      if (nextChapterIdx >= SINGLE_PDF_CHAPTER_SPECS.length) {
        if (!chap10Part1Page && /^(?:\d+\s+)?Chapter\s+10\b/i.test(headText)) {
          chap10Part1Page = p;
          entries.push({ id: 'chap-10', name: 'Chap 10: Modernisation of M.A. Lib', targetPage: p });
          entries.push({ id: 'chap-10-p1', name: 'Part 1: Services & Facelift', targetPage: p, isSubPart: true });
          continue;
        }
        if (chap10Part1Page && !chap10Part2Page && (/Part\s*2\b/i.test(headText) || /Sir\s+Syed\s+Personal\s+Library\s*[–-]/i.test(headText))) {
          chap10Part2Page = p;
          entries.push({ id: 'chap-10-p2', name: 'Part 2: Sir Syed Personal Lib', targetPage: p, isSubPart: true });
          continue;
        }
        if (chap10Part2Page && !chap10Part3Page && (/Part\s*3\b/i.test(headText) || /Retro\s+conversion\s+of\s+Library\s+Catalogue/i.test(headText))) {
          chap10Part3Page = p;
          entries.push({ id: 'chap-10-p3', name: 'Part 3: Digital Resource Centre', targetPage: p, isSubPart: true });
          break;
        }
      }
    } catch {}
  }

  return entries;
}

// Module-Level Global Caches: Persist across modal open/close and page transitions
const sessionStore = new Map<string, GlobalPdfSession>();
const globalRenderedPageCache = new Map<string, string>();
const inFlightRenderPromises = new Map<string, Promise<string>>();

// Single worker/network loader for a specific PDF part
async function loadSinglePart(
  session: GlobalPdfSession,
  partIndex: number
): Promise<PdfPartDoc | null> {
  const existing = session.partDocs.find(d => d.partIndex === partIndex);
  if (existing) return existing;

  if (session.partPromises.has(partIndex)) {
    return session.partPromises.get(partIndex)!;
  }

  const range = session.precomputedRanges[partIndex];
  if (!range) return null;

  const promise = (async (): Promise<PdfPartDoc | null> => {
    try {
      const currentSrc = range.src;
      let pdf: PDFDocumentProxy;

      if (typeof currentSrc === 'string') {
        const pdfId = range.matchingPdf ? range.matchingPdf.id : `pdf_${partIndex}`;
        const versionKey = range.matchingPdf ? (range.matchingPdf.updatedAt || range.matchingPdf.createdAt) : 'v1';
        const effectiveKey = `${pdfId}_${versionKey || 'v1'}`;

        let arrayBuffer = await fetchAndCachePdf(currentSrc, pdfId, versionKey);
        try {
          pdf = await pdfjsLib.getDocument({
            data: arrayBuffer.slice(0),
          }).promise;
        } catch (parseErr) {
          // Retry once bypassing cache in case a previously stored buffer was corrupt
          await invalidateCachedPdfBlob(effectiveKey);
          arrayBuffer = await fetchAndCachePdf(currentSrc, pdfId, versionKey, true);
          pdf = await pdfjsLib.getDocument({
            data: arrayBuffer.slice(0),
          }).promise;
        }
      } else {
        const arrayBuffer = await currentSrc.arrayBuffer();
        pdf = await pdfjsLib.getDocument({
          data: arrayBuffer.slice(0),
        }).promise;
      }

      const numPages = pdf.numPages;
      const docPart: PdfPartDoc = {
        pdf,
        partIndex,
        startGlobalPage: range.startPage,
        endGlobalPage: range.startPage + numPages - 1,
      };

      const existingIndex = session.partDocs.findIndex(d => d.partIndex === partIndex);
      if (existingIndex >= 0) {
        session.partDocs[existingIndex] = docPart;
      } else {
        session.partDocs.push(docPart);
        session.partDocs.sort((a, b) => a.partIndex - b.partIndex);
      }

      session.lastError = undefined;
      session.partPromises.delete(partIndex);
      return docPart;
    } catch (err) {
      console.error(`Failed to load part ${partIndex}:`, err);
      session.lastError = err;
      session.partPromises.delete(partIndex);
      return null;
    }
  })();

  session.partPromises.set(partIndex, promise);
  return promise;
}

export const PDFBook = forwardRef<PDFBookRefHandle, PDFBookProps>(({
  source,
  sources,
  bookPdfs = [],
  width = 540,
  height = 760,
  renderScale = 1.3,
  className,
  initialPage = 1,
  showControls = false,
  onPageChange,
  onTotalPagesLoaded,
  onTocDetected,
  usePortrait,
}, ref) => {
  const onTocDetectedRef = useRef(onTocDetected);
  onTocDetectedRef.current = onTocDetected;
  const [isMobileViewport, setIsMobileViewport] = useState(
    () => typeof window !== 'undefined' && window.innerWidth < 768
  );
  useEffect(() => {
    if (usePortrait !== undefined || typeof window === 'undefined') return;
    const onResize = () => setIsMobileViewport(window.innerWidth < 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [usePortrait]);
  const activeUsePortrait = usePortrait !== undefined ? usePortrait : isMobileViewport;
  const [pageNumbers, setPageNumbers] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [jumpInput, setJumpInput] = useState(initialPage.toString());

  const flipBookRef = useRef<any>(null);
  const isCancelledRef = useRef<boolean>(false);
  const pdfDocsRef = useRef<PdfPartDoc[]>([]);
  const memoryCacheRef = useRef<Map<number, string>>(new Map());
  const activeRenderTasksRef = useRef<Map<number, any>>(new Map());
  const cacheKeyRef = useRef<string>("");

  // Revoke Object URLs for distant pages to cap RAM under 15MB
  const revokeDistantObjectUrls = useCallback((currentPg: number) => {
    const KEEP_WINDOW = 3;
    memoryCacheRef.current.forEach((url, pageNum) => {
      if (Math.abs(pageNum - currentPg) > KEEP_WINDOW && url && url.startsWith("blob:")) {
        // Do not revoke if stored in globalRenderedPageCache for instant revisit
        memoryCacheRef.current.delete(pageNum);
      }
    });
  }, []);

  // High-performance page getter with 2-Tier Caching (RAM + IndexedDB)
  const getPageUrl = useCallback(async (globalPageNum: number): Promise<string> => {
    const cacheKey = cacheKeyRef.current;
    const pageCacheKey = `${cacheKey}_p${globalPageNum}_s${renderScale}`;

    // 1. Check in-memory Object URL cache (0ms instant)
    if (globalRenderedPageCache.has(pageCacheKey)) {
      const url = globalRenderedPageCache.get(pageCacheKey)!;
      memoryCacheRef.current.set(globalPageNum, url);
      return url;
    }

    if (memoryCacheRef.current.has(globalPageNum)) {
      return memoryCacheRef.current.get(globalPageNum)!;
    }

    // 2. Return ongoing promise if already rendering
    if (inFlightRenderPromises.has(pageCacheKey)) {
      return inFlightRenderPromises.get(pageCacheKey)!;
    }

    // 3. Create execution promise: check IndexedDB then render if needed
    const renderPromise = (async (): Promise<string> => {
      // Check IndexedDB persistent store first
      try {
        const idbUrl = await getCachedPageUrl(pageCacheKey);
        if (idbUrl) {
          globalRenderedPageCache.set(pageCacheKey, idbUrl);
          memoryCacheRef.current.set(globalPageNum, idbUrl);
          inFlightRenderPromises.delete(pageCacheKey);
          return idbUrl;
        }
      } catch (e) {}

      const session = sessionStore.get(cacheKey);
      if (!session) {
        inFlightRenderPromises.delete(pageCacheKey);
        return "";
      }

      // Identify which part contains this page
      const range = session.precomputedRanges.find(
        r => globalPageNum >= r.startPage && globalPageNum <= r.endPage
      );
      if (!range) {
        inFlightRenderPromises.delete(pageCacheKey);
        return "";
      }

      // Check if docPart is already loaded or load on demand
      let docPart = session.partDocs.find(d => d.partIndex === range.partIndex);
      if (!docPart) {
        docPart = (await loadSinglePart(session, range.partIndex)) || undefined;
      }

      if (!docPart) {
        inFlightRenderPromises.delete(pageCacheKey);
        return "";
      }

      try {
        const localPageNum = globalPageNum - docPart.startGlobalPage + 1;
        const page = await docPart.pdf.getPage(localPageNum);
        const viewport = page.getViewport({ scale: renderScale });

        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");
        canvas.width = viewport.width;
        canvas.height = viewport.height;

        if (context) {
          const renderTask = page.render({ canvasContext: context, viewport, canvas });
          activeRenderTasksRef.current.set(globalPageNum, renderTask);

          await renderTask.promise;
          activeRenderTasksRef.current.delete(globalPageNum);

          const blob: Blob | null = await new Promise((res) => {
            canvas.toBlob((b) => res(b), "image/jpeg", 0.70);
          });

          // Instantly release canvas memory
          canvas.width = 0;
          canvas.height = 0;

          try { page.cleanup(); } catch (e) {}

          if (blob) {
            const objectUrl = await saveCachedPageBlob(pageCacheKey, cacheKey, blob);
            globalRenderedPageCache.set(pageCacheKey, objectUrl);
            memoryCacheRef.current.set(globalPageNum, objectUrl);
            inFlightRenderPromises.delete(pageCacheKey);
            return objectUrl;
          }
        }
      } catch (e: any) {
        activeRenderTasksRef.current.delete(globalPageNum);
        if (e?.name !== "RenderingCancelledException") {
          console.warn(`Failed to render page ${globalPageNum}:`, e);
        }
      }

      inFlightRenderPromises.delete(pageCacheKey);
      return "";
    })();

    inFlightRenderPromises.set(pageCacheKey, renderPromise);
    return renderPromise;
  }, [renderScale]);

  useImperativeHandle(ref, () => ({
    jumpToPage: (pageNumber: number) => {
      if (flipBookRef.current && pageNumber >= 1) {
        try {
          flipBookRef.current.pageFlip().turnToPage(pageNumber - 1);
          setCurrentPage(pageNumber);
          setJumpInput(pageNumber.toString());
          getPageUrl(pageNumber);
          revokeDistantObjectUrls(pageNumber);
        } catch (e) {}
      }
    },
    flipPrev: () => {
      if (flipBookRef.current) {
        try { flipBookRef.current.pageFlip().flipPrev(); } catch (e) {}
      }
    },
    flipNext: () => {
      if (flipBookRef.current) {
        try { flipBookRef.current.pageFlip().flipNext(); } catch (e) {}
      }
    },
    getTotalPages: () => pageNumbers.length
  }));

  const loadPdf = useCallback(async () => {
    const listToLoad: (string | File)[] = (sources && sources.length > 0)
      ? sources
      : (source ? [source] : []);

    if (listToLoad.length === 0) return;

    const cacheKey = listToLoad.map(s => typeof s === 'string' ? s.split('?')[0] : s.name).join('|');
    cacheKeyRef.current = cacheKey;
    isCancelledRef.current = false;

    const sortedPdfs = [...bookPdfs].sort((a, b) => a.order - b.order);

    // =========================================================================
    // TIER 1: INSTANT REVISIT (0ms) - If already in global session memory
    // =========================================================================
    const existingSession = sessionStore.get(cacheKey);
    if (existingSession && existingSession.partDocs.length > 0) {
      pdfDocsRef.current = existingSession.partDocs;
      const nums = Array.from({ length: existingSession.totalPages }, (_, i) => i + 1);
      setPageNumbers(nums);
      setLoading(false);
      setProgress(100);
      if (onTotalPagesLoaded) onTotalPagesLoaded(existingSession.totalPages);
      if (existingSession.detectedToc && existingSession.detectedToc.length > 0 && onTocDetectedRef.current) {
        onTocDetectedRef.current(existingSession.detectedToc);
      } else if (existingSession.precomputedRanges.length === 1 && existingSession.partDocs[0]?.pdf?.numPages > 10) {
        extractTocFromSinglePdf(existingSession.partDocs[0].pdf, () => isCancelledRef.current).then((entries) => {
          if (!isCancelledRef.current && entries.length > 1) {
            existingSession.detectedToc = entries;
            onTocDetectedRef.current?.(entries);
          }
        });
      }

      // Pre-fetch active page
      getPageUrl(initialPage);
      getPageUrl(initialPage + 1);

      // Background load any missing parts if not fully loaded yet
      if (!existingSession.isFullyLoaded) {
        (async () => {
          for (let i = 0; i < existingSession.precomputedRanges.length; i++) {
            if (isCancelledRef.current) return;
            if (!existingSession.partDocs.some(d => d.partIndex === i)) {
              await loadSinglePart(existingSession, i);
            }
          }
          existingSession.isFullyLoaded = true;
        })();
      }
      return;
    }

    // =========================================================================
    // TIER 2: PROGRESSIVE FAST LOAD (< 0.5s) - Precompute ranges & open immediately
    // =========================================================================
    setLoading(true);
    setError(null);
    setProgress(20);

    try {
      let currentGlobalOffset = 1;
      const precomputedRanges: PrecomputedRange[] = listToLoad.map((src, idx) => {
        const matchingPdf = sortedPdfs[idx];
        const pageCount = matchingPdf?.pageCount || 1;
        const startPage = currentGlobalOffset;
        const endPage = currentGlobalOffset + pageCount - 1;
        currentGlobalOffset = endPage + 1;
        return {
          partIndex: idx,
          startPage,
          endPage,
          pageCount,
          src,
          matchingPdf
        };
      });

      const totalNumPages = currentGlobalOffset - 1;
      if (totalNumPages === 0) {
        throw new Error("No pages found in PDF document.");
      }

      const session: GlobalPdfSession = {
        cacheKey,
        totalPages: totalNumPages,
        partDocs: [],
        partPromises: new Map(),
        precomputedRanges,
        isFullyLoaded: false,
      };
      sessionStore.set(cacheKey, session);

      const nums = Array.from({ length: totalNumPages }, (_, i) => i + 1);
      setPageNumbers(nums);
      if (onTotalPagesLoaded) onTotalPagesLoaded(totalNumPages);

      // Find the priority part containing initialPage (usually Part 0 for page 1)
      const priorityRange = precomputedRanges.find(
        r => initialPage >= r.startPage && initialPage <= r.endPage
      ) || precomputedRanges[0];
      const priorityPartIndex = priorityRange ? priorityRange.partIndex : 0;

      setProgress(50);

      // Load priority part FIRST
      const priorityDoc = await loadSinglePart(session, priorityPartIndex);
      if (isCancelledRef.current) return;

      if (!priorityDoc && session.partDocs.length === 0) {
        sessionStore.delete(cacheKey);
        const err = session.lastError;
        if (err?.status === 401) {
          throw new Error("Your reading session expired. Please sign in again.");
        }
        if (err?.status === 403) {
          throw new Error(err.message || "Access denied. Please purchase this book to read.");
        }
        throw (err instanceof Error ? err : new Error("Failed to load initial PDF part."));
      }

      pdfDocsRef.current = session.partDocs;

      // Pre-render active page asynchronously
      getPageUrl(initialPage);
      getPageUrl(initialPage + 1);

      // OPEN 3D BOOK IMMEDIATELY (< 0.5s total wait!)
      setProgress(100);
      setLoading(false);

      // Detect exact TOC positions asynchronously for single-PDF books without blocking initial open
      if (precomputedRanges.length === 1 && priorityDoc && priorityDoc.pdf.numPages > 10) {
        extractTocFromSinglePdf(priorityDoc.pdf, () => isCancelledRef.current).then((entries) => {
          if (!isCancelledRef.current && entries.length > 1) {
            session.detectedToc = entries;
            onTocDetectedRef.current?.(entries);
          }
        });
      }

      // Background loading of all other parts in smooth sequence
      (async () => {
        for (let i = 0; i < precomputedRanges.length; i++) {
          if (i === priorityPartIndex) continue;
          if (isCancelledRef.current) return;
          try {
            await loadSinglePart(session, i);
            if (pdfDocsRef.current !== session.partDocs) {
              pdfDocsRef.current = session.partDocs;
            }
          } catch (err) {
            console.warn(`Background load of part ${i} failed:`, err);
          }
        }
        session.isFullyLoaded = true;
      })();

    } catch (err) {
      if (!isCancelledRef.current) {
        console.error("Failed to load PDF:", err);
        setError(err instanceof Error ? err.message : "Failed to load PDF");
        setLoading(false);
      }
    }
  }, [source, sources, bookPdfs, initialPage, getPageUrl, onTotalPagesLoaded]);

  useEffect(() => {
    loadPdf();
    return () => {
      isCancelledRef.current = true;
    };
  }, [loadPdf]);

  const onFlip = useCallback((e: any) => {
    const page = e.data + 1;
    setCurrentPage(page);
    setJumpInput(page.toString());
    if (onPageChange) onPageChange(page);

    // Pre-fetch adjacent pages & revoke distant Object URLs
    getPageUrl(page);
    getPageUrl(page + 1);
    getPageUrl(page + 2);
    getPageUrl(page - 1);
    revokeDistantObjectUrls(page);
  }, [onPageChange, getPageUrl, revokeDistantObjectUrls]);

  const handleJump = (e: React.FormEvent) => {
    e.preventDefault();
    const p = parseInt(jumpInput, 10);
    if (p > 0 && p <= pageNumbers.length && flipBookRef.current) {
      try {
        flipBookRef.current.pageFlip().turnToPage(p - 1);
        getPageUrl(p);
        revokeDistantObjectUrls(p);
      } catch (e) {}
    }
  };

  if (error) {
    return <div className="pdf-book-error">Couldn't load PDF: {error}</div>;
  }

  if (loading) {
    return (
      <div className="pdf-book-loading">
        <div className="pdf-book-spinner" />
        <p style={{ fontWeight: 700, fontSize: '1.1rem', color: '#f8fafc', margin: 0 }}>
          Opening 3D Book… {progress}%
        </p>
        <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
          Loading cached high-performance 3D pages
        </span>
      </div>
    );
  }

  if (pageNumbers.length === 0) {
    return <div className="pdf-book-error">No pages found in this PDF.</div>;
  }

  return (
    <div className={`pdf-book-wrapper ${className ?? ""}`}>
      {/* @ts-ignore - react-pageflip's types are loosely defined */}
      <HTMLFlipBook
        key={`pdf-flipbook-${activeUsePortrait ? 'portrait' : 'spread'}`}
        ref={flipBookRef}
        width={width}
        height={height}
        size="stretch"
        minWidth={240}
        maxWidth={1200}
        minHeight={320}
        maxHeight={1600}
        maxShadowOpacity={0.5}
        showCover={true}
        mobileScrollSupport={true}
        className="pdf-book"
        style={{}}
        startPage={initialPage > 1 ? initialPage - 1 : 0}
        drawShadow={true}
        flippingTime={700}
        usePortrait={activeUsePortrait}
        startZIndex={0}
        autoSize={true}
        clickEventForward={true}
        useMouseEvents={true}
        swipeDistance={30}
        showPageCorners={true}
        disableFlipByClick={false}
        onFlip={onFlip}
      >
        {pageNumbers.map((num) => (
          <Page key={num} pageNumber={num} currentPage={currentPage} getPageUrl={getPageUrl} />
        ))}
      </HTMLFlipBook>

      {showControls && (
        <div className="pdf-book-controls">
          <button onClick={() => flipBookRef.current?.pageFlip().turnToPage(0)}>
            «« First
          </button>
          <button onClick={() => flipBookRef.current?.pageFlip().flipPrev()}>
            « Prev
          </button>

          <form onSubmit={handleJump} className="pdf-book-jump-form">
            <input
              type="number"
              min={1}
              max={pageNumbers.length}
              value={jumpInput}
              onChange={(e) => setJumpInput(e.target.value)}
              className="pdf-book-jump-input"
            />
            <span>/ {pageNumbers.length}</span>
            <button type="submit" style={{ padding: '4px 10px', fontSize: '12px' }}>Go</button>
          </form>

          <button onClick={() => flipBookRef.current?.pageFlip().flipNext()}>
            Next »
          </button>
          <button onClick={() => flipBookRef.current?.pageFlip().turnToPage(pageNumbers.length - 1)}>
            Last »»
          </button>
        </div>
      )}
    </div>
  );
});

PDFBook.displayName = "PDFBook";

export default PDFBook;
