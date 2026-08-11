import React, { useRef, useState, useEffect } from 'react';
// @ts-ignore
import HTMLFlipBook from 'react-pageflip';

interface RealisticBookReaderProps {
  title: string;
  pageImages: { pageNum: number; imageUrl: string }[];
  initialPage?: number;
  onPageChange?: (page: number) => void;
  bookmarks?: number[];
  onToggleBookmark?: (page: number) => void;
  onClose?: () => void;
}

const Page = React.forwardRef<HTMLDivElement, { imageUrl: string, number: number, title: string }>((props, ref) => {
  return (
    <div className="demoPage" ref={ref} style={{ backgroundColor: '#fff', border: '1px solid #ddd', overflow: 'hidden' }}>
      <img 
        src={props.imageUrl} 
        alt={`${props.title} - Page ${props.number}`} 
        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
        loading="lazy"
      />
    </div>
  );
});

export const RealisticBookReader: React.FC<RealisticBookReaderProps> = ({
  title, pageImages, initialPage = 1, onPageChange, bookmarks = [], onToggleBookmark, onClose
}) => {
  const bookRef = useRef<any>(null);
  const [isSinglePage, setIsSinglePage] = useState(window.innerWidth < 768);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [jumpPage, setJumpPage] = useState(initialPage.toString());

  useEffect(() => {
    const handleResize = () => setIsSinglePage(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const onFlip = (e: any) => {
    const page = e.data + 1; // e.data is 0-indexed
    setCurrentPage(page);
    setJumpPage(page.toString());
    if (onPageChange) onPageChange(page);
  };

  const jumpToPage = (e: React.FormEvent) => {
    e.preventDefault();
    const page = parseInt(jumpPage);
    if (page > 0 && page <= pageImages.length && bookRef.current) {
      bookRef.current.pageFlip().turnToPage(page - 1);
    }
  };

  // Pre-load logic can be added by prefetching URLs
  useEffect(() => {
    if (bookRef.current && initialPage > 1) {
      setTimeout(() => {
        try {
          bookRef.current.pageFlip().turnToPage(initialPage - 1);
        } catch(e) {}
      }, 500);
    }
  }, [initialPage]);

  // Auth token should be attached if images are protected.
  // Actually, standard <img> tags will not send Authorization headers automatically.
  // For secure images, we can fetch them as blob URLs or just use a session cookie.
  // Since the user asked for a protected original PDF, protecting images with a token is tricky for <img src>.
  // But wait, our API route `/api/books/pages/:filename` requires `authenticateToken`.
  // To use `<img>` with auth, we can append `?token=...` if our backend supports it, or fetch the blob.
  // We will assume the API uses cookies or we append a token for simplicity, or we fetch blobs.
  const token = localStorage.getItem('dl_token');
  const getImageUrl = (url: string) => `${url}?token=${token}`;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#f5f5f5' }}>
      {/* Toolbar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 24px', background: '#222', color: '#fff', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '1.2rem' }}>← Back</button>
          <h2 style={{ margin: 0, fontSize: '1.2rem' }}>{title}</h2>
        </div>
        
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
          <form onSubmit={jumpToPage} style={{ display: 'flex', gap: '8px' }}>
            <input 
              type="number" 
              value={jumpPage} 
              onChange={e => setJumpPage(e.target.value)} 
              style={{ width: '60px', padding: '4px', textAlign: 'center' }}
            />
            <span style={{ color: '#aaa' }}>/ {pageImages.length}</span>
            <button type="submit" style={{ padding: '4px 8px' }}>Go</button>
          </form>

          <button onClick={() => setZoomLevel(z => Math.min(2, z + 0.2))} style={{ padding: '4px 8px' }}>Zoom In</button>
          <button onClick={() => setZoomLevel(z => Math.max(0.5, z - 0.2))} style={{ padding: '4px 8px' }}>Zoom Out</button>
          
          <button onClick={() => onToggleBookmark?.(currentPage)} style={{ padding: '4px 8px', background: bookmarks.includes(currentPage) ? 'gold' : '#fff' }}>
            Bookmark
          </button>
        </div>
      </div>

      {/* Reader */}
      <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'auto', padding: '20px' }}>
        <div style={{ transform: `scale(${zoomLevel})`, transition: 'transform 0.2s', display: 'flex', justifyContent: 'center' }}>
          {pageImages.length > 0 ? (
            <HTMLFlipBook
              width={isSinglePage ? 400 : 450}
              height={isSinglePage ? 600 : 650}
              size="fixed"
              minWidth={315}
              maxWidth={1000}
              minHeight={400}
              maxHeight={1533}
              maxShadowOpacity={0.5}
              showCover={true}
              mobileScrollSupport={true}
              usePortrait={isSinglePage}
              onFlip={onFlip}
              ref={bookRef}
              className="realistic-book"
            >
              {pageImages.map((page) => (
                <Page 
                  key={page.pageNum} 
                  number={page.pageNum} 
                  imageUrl={getImageUrl(page.imageUrl)} 
                  title={title} 
                />
              ))}
            </HTMLFlipBook>
          ) : (
            <div style={{ color: '#888' }}>No pages found for this book.</div>
          )}
        </div>
      </div>
      
      {/* Navigation Controls */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', padding: '16px', background: '#333' }}>
        <button onClick={() => bookRef.current?.pageFlip().flipPrev()} style={{ padding: '8px 16px', borderRadius: '4px' }}>Previous Page</button>
        <button onClick={() => bookRef.current?.pageFlip().flipNext()} style={{ padding: '8px 16px', borderRadius: '4px' }}>Next Page</button>
      </div>
    </div>
  );
};
