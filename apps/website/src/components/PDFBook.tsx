import React, { useEffect, useRef, useState, useCallback, useImperativeHandle, forwardRef } from "react";
import * as pdfjsLib from "pdfjs-dist";
import type { PDFDocumentProxy } from "pdfjs-dist";
// @ts-ignore
import HTMLFlipBook from "react-pageflip";
import "./PDFBook.css";
import { getCachedPdfPages, setCachedPdfPages, CachedPage } from "../utils/pdfBookCache";

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
  source: string | File;
  width?: number;
  height?: number;
  renderScale?: number;
  className?: string;
  initialPage?: number;
  showControls?: boolean;
  onPageChange?: (page: number) => void;
  onTotalPagesLoaded?: (totalPages: number) => void;
}

const Page = React.forwardRef<HTMLDivElement, { image: string; pageNumber: number }>(
  ({ image, pageNumber }, ref) => {
    return (
      <div className="pdf-book-page" ref={ref}>
        <img src={image} alt={`Page ${pageNumber}`} draggable={false} />
        <span className="pdf-book-page-number">{pageNumber}</span>
      </div>
    );
  }
);
Page.displayName = "Page";

export const PDFBook = forwardRef<PDFBookRefHandle, PDFBookProps>(({
  source,
  width = 540,
  height = 760,
  renderScale = 1.8,
  className,
  initialPage = 1,
  showControls = false,
  onPageChange,
  onTotalPagesLoaded
}, ref) => {
  const [pages, setPages] = useState<CachedPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [jumpInput, setJumpInput] = useState(initialPage.toString());
  const flipBookRef = useRef<any>(null);
  const isCancelledRef = useRef<boolean>(false);

  useImperativeHandle(ref, () => ({
    jumpToPage: (pageNumber: number) => {
      if (flipBookRef.current && pageNumber >= 1) {
        try {
          flipBookRef.current.pageFlip().turnToPage(pageNumber - 1);
          setCurrentPage(pageNumber);
          setJumpInput(pageNumber.toString());
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
    getTotalPages: () => pages.length
  }));

  const getAuthToken = () => {
    if (typeof window === "undefined") return "";
    return (
      localStorage.getItem("dl_token") ||
      localStorage.getItem("token") ||
      localStorage.getItem("adminToken") ||
      ""
    );
  };

  const getFullUrl = (src: string) => {
    if (!src) return "";
    if (src.startsWith("data:") || src.startsWith("blob:")) return src;
    const token = getAuthToken();
    if (token && token !== "null" && token !== "undefined" && !src.includes("token=")) {
      return `${src}${src.includes("?") ? "&" : "?"}token=${token}`;
    }
    return src;
  };

  const getCacheKey = (src: string | File): string => {
    if (typeof src === "string") return src.split("?")[0];
    return `${src.name}_${src.size}_${src.lastModified}`;
  };

  const loadPdf = useCallback(async () => {
    if (!source) return;
    isCancelledRef.current = false;
    const cacheKey = getCacheKey(source);

    // STEP 1: Check IndexedDB / Memory Cache for Instant Loading (<50ms)
    try {
      const cached = await getCachedPdfPages(cacheKey);
      if (cached && cached.length > 0) {
        setPages(cached);
        setLoading(false);
        setProgress(100);
        if (onTotalPagesLoaded) onTotalPagesLoaded(cached.length);
        return;
      }
    } catch (e) {}

    setLoading(true);
    setError(null);
    setPages([]);
    setProgress(0);

    try {
      let loadingTask;
      if (typeof source === "string") {
        const fullUrl = getFullUrl(source);
        if (!fullUrl) throw new Error("No PDF URL provided");
        loadingTask = pdfjsLib.getDocument({ url: fullUrl });
      } else {
        const arrayBuffer = await source.arrayBuffer();
        loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
      }

      const pdf: PDFDocumentProxy = await loadingTask.promise;
      if (isCancelledRef.current) return;

      const numPages = pdf.numPages;
      if (onTotalPagesLoaded) onTotalPagesLoaded(numPages);

      const rendered: CachedPage[] = [];

      // STEP 2: Fast Initial Batch (Render first 8 pages for instant display)
      const INITIAL_BATCH_SIZE = Math.min(8, numPages);
      for (let pageNum = 1; pageNum <= INITIAL_BATCH_SIZE; pageNum++) {
        if (isCancelledRef.current) return;
        const page = await pdf.getPage(pageNum);
        const viewport = page.getViewport({ scale: renderScale });

        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");
        canvas.width = viewport.width;
        canvas.height = viewport.height;

        if (context) {
          await page.render({ canvasContext: context, viewport, canvas }).promise;
          rendered.push({ pageNumber: pageNum, dataUrl: canvas.toDataURL("image/jpeg", 0.85) });
        }
        setProgress(Math.round((pageNum / numPages) * 100));
      }

      setPages([...rendered]);
      setLoading(false);

      // STEP 3: Background Progressive Render (Remaining Pages)
      if (INITIAL_BATCH_SIZE < numPages) {
        const renderRemaining = async () => {
          for (let pageNum = INITIAL_BATCH_SIZE + 1; pageNum <= numPages; pageNum++) {
            if (isCancelledRef.current) return;
            const page = await pdf.getPage(pageNum);
            const viewport = page.getViewport({ scale: renderScale });

            const canvas = document.createElement("canvas");
            const context = canvas.getContext("2d");
            canvas.width = viewport.width;
            canvas.height = viewport.height;

            if (context) {
              await page.render({ canvasContext: context, viewport, canvas }).promise;
              rendered.push({ pageNumber: pageNum, dataUrl: canvas.toDataURL("image/jpeg", 0.85) });
            }

            setProgress(Math.round((pageNum / numPages) * 100));

            if (pageNum % 4 === 0 || pageNum === numPages) {
              setPages([...rendered]);
              await new Promise((res) => setTimeout(res, 10));
            }
          }

          if (!isCancelledRef.current && rendered.length === numPages) {
            setCachedPdfPages(cacheKey, rendered);
          }
        };

        setTimeout(renderRemaining, 100);
      } else {
        setCachedPdfPages(cacheKey, rendered);
      }

    } catch (err) {
      if (!isCancelledRef.current) {
        console.error("Failed to load PDF:", err);
        setError(err instanceof Error ? err.message : "Failed to load PDF");
        setLoading(false);
      }
    }
  }, [source, renderScale]);

  useEffect(() => {
    loadPdf();
    return () => {
      isCancelledRef.current = true;
    };
  }, [loadPdf]);

  const onFlip = (e: any) => {
    const page = e.data + 1;
    setCurrentPage(page);
    setJumpInput(page.toString());
    if (onPageChange) onPageChange(page);
  };

  const handleJump = (e: React.FormEvent) => {
    e.preventDefault();
    const p = parseInt(jumpInput, 10);
    if (p > 0 && p <= pages.length && flipBookRef.current) {
      try {
        flipBookRef.current.pageFlip().turnToPage(p - 1);
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
        <p style={{ fontWeight: 600, fontSize: '1.05rem', color: '#f8fafc' }}>
          Opening 3D Book… {progress}%
        </p>
      </div>
    );
  }

  if (pages.length === 0) {
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
        {pages.map((p) => (
          <Page key={p.pageNumber} image={p.dataUrl} pageNumber={p.pageNumber} />
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
              max={pages.length}
              value={jumpInput}
              onChange={(e) => setJumpInput(e.target.value)}
              className="pdf-book-jump-input"
            />
            <span>/ {pages.length}</span>
            <button type="submit" style={{ padding: '4px 10px', fontSize: '12px' }}>Go</button>
          </form>

          <button onClick={() => flipBookRef.current?.pageFlip().flipNext()}>
            Next »
          </button>
          <button onClick={() => flipBookRef.current?.pageFlip().turnToPage(pages.length - 1)}>
            Last »»
          </button>
        </div>
      )}
    </div>
  );
});

PDFBook.displayName = "PDFBook";

export default PDFBook;
