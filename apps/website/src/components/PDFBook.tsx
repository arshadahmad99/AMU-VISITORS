import React, { useEffect, useRef, useState, useCallback, useImperativeHandle, forwardRef } from "react";
import * as pdfjsLib from "pdfjs-dist";
import type { PDFDocumentProxy } from "pdfjs-dist";
// @ts-ignore
import HTMLFlipBook from "react-pageflip";
import "./PDFBook.css";
import {
  fetchAndCachePdf,
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
  startGlobalPage: number;
  endGlobalPage: number;
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
  onTotalPagesLoaded
}, ref) => {
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
  const renderPromisesRef = useRef<Map<number, Promise<string>>>(new Map());
  const activeRenderTasksRef = useRef<Map<number, any>>(new Map());
  const cacheKeyRef = useRef<string>("");

  // Revoke Object URLs for distant pages to cap RAM under 15MB
  const revokeDistantObjectUrls = useCallback((currentPg: number) => {
    const KEEP_WINDOW = 3;
    memoryCacheRef.current.forEach((url, pageNum) => {
      if (Math.abs(pageNum - currentPg) > KEEP_WINDOW && url && url.startsWith("blob:")) {
        try { URL.revokeObjectURL(url); } catch (e) {}
        memoryCacheRef.current.delete(pageNum);
      }
    });
  }, []);

  // High-performance page getter with Blobs & Object URL revocation
  const getPageUrl = useCallback(async (globalPageNum: number): Promise<string> => {
    // 1. Check in-memory Object URL cache
    if (memoryCacheRef.current.has(globalPageNum)) {
      return memoryCacheRef.current.get(globalPageNum)!;
    }

    // 2. Return ongoing promise if already rendering
    if (renderPromisesRef.current.has(globalPageNum)) {
      return renderPromisesRef.current.get(globalPageNum)!;
    }

    // 3. Create single execution promise for canvas rendering
    const renderPromise = (async (): Promise<string> => {
      const docPart = pdfDocsRef.current.find(
        (d) => globalPageNum >= d.startGlobalPage && globalPageNum <= d.endGlobalPage
      );
      if (!docPart) return "";

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
            canvas.toBlob((b) => res(b), "image/jpeg", 0.65);
          });

          // Instantly release canvas memory
          canvas.width = 0;
          canvas.height = 0;

          try { page.cleanup(); } catch (e) {}

          if (blob) {
            const objectUrl = URL.createObjectURL(blob);
            memoryCacheRef.current.set(globalPageNum, objectUrl);
            renderPromisesRef.current.delete(globalPageNum);
            return objectUrl;
          }
        }
      } catch (e: any) {
        activeRenderTasksRef.current.delete(globalPageNum);
        if (e?.name !== "RenderingCancelledException") {
          console.warn(`Failed to render page ${globalPageNum}:`, e);
        }
      }

      renderPromisesRef.current.delete(globalPageNum);
      return "";
    })();

    renderPromisesRef.current.set(globalPageNum, renderPromise);
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
    if (cacheKey === cacheKeyRef.current && pdfDocsRef.current.length > 0) {
      setLoading(false);
      return;
    }

    isCancelledRef.current = false;
    cacheKeyRef.current = cacheKey;

    setLoading(true);
    setError(null);
    setProgress(25);

    // Revoke previous Object URLs
    memoryCacheRef.current.forEach((url) => {
      if (url && url.startsWith("blob:")) try { URL.revokeObjectURL(url); } catch (e) {}
    });
    pdfDocsRef.current = [];
    memoryCacheRef.current.clear();
    renderPromisesRef.current.clear();
    activeRenderTasksRef.current.clear();

    try {
      if (listToLoad.length === 0) {
        setLoading(false);
        if (onTotalPagesLoaded) onTotalPagesLoaded(0);
        return;
      }
      let currentGlobalOffset = 1;
      const sortedPdfs = [...bookPdfs].sort((a, b) => a.order - b.order);

      // Fast PDF Document Loading with 2-Tier Caching (RAM + IndexedDB)
      for (let srcIdx = 0; srcIdx < listToLoad.length; srcIdx++) {
        if (isCancelledRef.current) return;
        const currentSrc = listToLoad[srcIdx];
        let arrayBuffer: ArrayBuffer;

        if (typeof currentSrc === "string") {
          const matchingBookPdf = sortedPdfs[srcIdx];
          const pdfId = matchingBookPdf ? matchingBookPdf.id : `pdf_${srcIdx}`;
          const versionKey = matchingBookPdf ? (matchingBookPdf.updatedAt || matchingBookPdf.createdAt) : 'v1';

          arrayBuffer = await fetchAndCachePdf(currentSrc, pdfId, versionKey);
        } else {
          arrayBuffer = await currentSrc.arrayBuffer();
        }

        const pdf: PDFDocumentProxy = await pdfjsLib.getDocument({ data: arrayBuffer.slice(0) }).promise;
        if (isCancelledRef.current) return;

        const numPages = pdf.numPages;
        pdfDocsRef.current.push({
          pdf,
          startGlobalPage: currentGlobalOffset,
          endGlobalPage: currentGlobalOffset + numPages - 1,
        });
        currentGlobalOffset += numPages;
      }

      const totalNumPages = currentGlobalOffset - 1;
      if (totalNumPages === 0) {
        throw new Error("No pages found in PDF document.");
      }

      if (onTotalPagesLoaded) onTotalPagesLoaded(totalNumPages);
      setProgress(75);

      // Pre-render active page asynchronously
      getPageUrl(initialPage);
      getPageUrl(initialPage + 1);

      const nums = Array.from({ length: totalNumPages }, (_, i) => i + 1);
      setPageNumbers(nums);

      // Open book viewer immediately!
      setLoading(false);
      setProgress(100);

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
        ref={flipBookRef}
        width={width}
        height={height}
        size="stretch"
        minWidth={300}
        maxWidth={1200}
        minHeight={450}
        maxHeight={1600}
        maxShadowOpacity={0.5}
        showCover={true}
        mobileScrollSupport={true}
        className="pdf-book"
        style={{}}
        startPage={initialPage > 1 ? initialPage - 1 : 0}
        drawShadow={true}
        flippingTime={700}
        usePortrait={false}
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
