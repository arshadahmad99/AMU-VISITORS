import React, { useEffect, useRef, useState, useCallback, useImperativeHandle, forwardRef } from "react";
import * as pdfjsLib from "pdfjs-dist";
import type { PDFDocumentProxy } from "pdfjs-dist";
// @ts-ignore
import HTMLFlipBook from "react-pageflip";
import "./PDFBook.css";

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
}

interface PDFBookProps {
  source: string | File;
  width?: number;
  height?: number;
  renderScale?: number;
  className?: string;
  initialPage?: number;
  onPageChange?: (page: number) => void;
}

interface PageImage {
  pageNumber: number;
  dataUrl: string;
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
  width = 460,
  height = 640,
  renderScale = 1.5,
  className,
  initialPage = 1,
  onPageChange,
}, ref) => {
  const [pages, setPages] = useState<PageImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [jumpInput, setJumpInput] = useState(initialPage.toString());
  const flipBookRef = useRef<any>(null);

  useImperativeHandle(ref, () => ({
    jumpToPage: (pageNumber: number) => {
      if (flipBookRef.current && pageNumber >= 1) {
        try {
          flipBookRef.current.pageFlip().turnToPage(pageNumber - 1);
          setCurrentPage(pageNumber);
          setJumpInput(pageNumber.toString());
        } catch (e) {}
      }
    }
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

  const loadPdf = useCallback(async () => {
    if (!source) return;
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
      const numPages = pdf.numPages;
      const rendered: PageImage[] = [];

      for (let pageNum = 1; pageNum <= numPages; pageNum++) {
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

      setPages(rendered);
    } catch (err) {
      console.error("Failed to load PDF:", err);
      setError(err instanceof Error ? err.message : "Failed to load PDF");
    } finally {
      setLoading(false);
    }
  }, [source, renderScale]);

  useEffect(() => {
    loadPdf();
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
        <p style={{ fontWeight: 600, fontSize: '1.05rem' }}>Rendering 3D Book Pages… {progress}%</p>
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
        minWidth={280}
        maxWidth={1000}
        minHeight={400}
        maxHeight={1400}
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

      {/* Floating Bottom Navigation Controls Bar */}
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
    </div>
  );
});

PDFBook.displayName = "PDFBook";

export default PDFBook;
