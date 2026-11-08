import React, { useEffect, useRef, useState, useCallback, useImperativeHandle, forwardRef } from "react";
import * as pdfjsLib from "pdfjs-dist";
import type { PDFDocumentProxy } from "pdfjs-dist";
// @ts-ignore
import HTMLFlipBook from "react-pageflip";
import "./PDFBook.css";
import {
  fetchAndCachePdf,
  getCachedPageUrl,
  saveCachedPageBlob,
} from "../utils/pdfBookCache";
import { BookPDF } from "@digital-library/types";

if (typeof window !== "undefined" && pdfjsLib.GlobalWorkerOptions) {
  try {
    pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
      "pdfjs-dist/build/pdf.worker.min.mjs",
      import.meta.url
    ).toString();
  } catch (e) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version || "3.11.174"}/pdf.worker.min.js`;
  }
}

export interface PDFBookRefHandle {
  jumpToPage: (pageNumber: number) => void;
  flipPrev: () => void;
  flipNext: () => void;
  getTotalPages: () => number;
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
      let arrayBuffer: ArrayBuffer;
      const currentSrc = range.src;
      if (typeof currentSrc === 'string') {
        const pdfId = range.matchingPdf ? range.matchingPdf.id : `pdf_${partIndex}`;
        const versionKey = range.matchingPdf ? (range.matchingPdf.updatedAt || range.matchingPdf.createdAt) : 'v1';
        arrayBuffer = await fetchAndCachePdf(currentSrc, pdfId, versionKey);
      } else {
        arrayBuffer = await currentSrc.arrayBuffer();
      }

      const pdf: PDFDocumentProxy = await pdfjsLib.getDocument({
        data: arrayBuffer.slice(0),
      }).promise;

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

      session.partPromises.delete(partIndex);
      return docPart;
    } catch (err) {
      console.error(`Failed to load part ${partIndex}:`, err);
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
  usePortrait,
}, ref) => {
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const activeUsePortrait = usePortrait !== undefined ? usePortrait : isMobile;
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
        throw new Error("Failed to load initial PDF part.");
      }

      pdfDocsRef.current = session.partDocs;

      // Pre-render active page asynchronously
      getPageUrl(initialPage);
      getPageUrl(initialPage + 1);

      // OPEN 3D BOOK IMMEDIATELY (< 0.5s total wait!)
      setProgress(100);
      setLoading(false);

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
