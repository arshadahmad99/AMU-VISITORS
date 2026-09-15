import React, { useRef, useState, useEffect } from 'react';
// @ts-ignore
import HTMLFlipBook from 'react-pageflip';

interface RealisticBookReaderProps {
  title: string;
  pageImages: { pageNum: number; imageUrl: string }[];
  chapters?: { id?: string; name: string; url: string; startPage?: number; endPage?: number; totalPages?: number }[];
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
  title, pageImages, chapters = [], initialPage = 1, onPageChange, bookmarks = [], onToggleBookmark, onClose
}) => {
  const bookRef = useRef<any>(null);
  const [isSinglePage, setIsSinglePage] = useState(window.innerWidth < 768);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [jumpPage, setJumpPage] = useState(initialPage.toString());
  const [selectedChapterUrl, setSelectedChapterUrl] = useState<string>(chapters.length > 0 ? chapters[0].url : '');
  const [viewMode, setViewMode] = useState<'flipbook' | 'pdf'>('flipbook');

  useEffect(() => {
    const handleResize = () => setIsSinglePage(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (chapters.length > 0 && !selectedChapterUrl) {
      setSelectedChapterUrl(chapters[0].url);
    }
  }, [chapters]);

  const onFlip = (e: any) => {
    const page = e.data + 1; // e.data is 0-indexed
    setCurrentPage(page);
    setJumpPage(page.toString());
    if (onPageChange) onPageChange(page);

    // Sync chapter selection with flip page number if available
    if (chapters.length > 0) {
      const match = chapters.find(c => c.startPage && c.endPage && page >= c.startPage && page <= c.endPage);
      if (match && match.url !== selectedChapterUrl) {
        setSelectedChapterUrl(match.url);
      }
    }
  };

  const jumpToPage = (e: React.FormEvent) => {
    e.preventDefault();
    const page = parseInt(jumpPage);
    if (page > 0 && page <= pageImages.length && bookRef.current) {
      bookRef.current.pageFlip().turnToPage(page - 1);
    }
  };

  const handleChapterSelect = (url: string) => {
    setSelectedChapterUrl(url);
    const chap = chapters.find(c => c.url === url);
    if (chap && chap.startPage && bookRef.current) {
      try {
        bookRef.current.pageFlip().turnToPage(chap.startPage - 1);
      } catch (e) {}
    }
  };

  useEffect(() => {
    if (bookRef.current && initialPage > 1) {
      setTimeout(() => {
        try {
          bookRef.current.pageFlip().turnToPage(initialPage - 1);
        } catch(e) {}
      }, 500);
    }
  }, [initialPage]);

  const token = localStorage.getItem('dl_token');
  const getImageUrl = (url: string) => {
    if (!url) return '';
    return url.includes('token=') ? url : `${url}${url.includes('?') ? '&' : '?'}token=${token || ''}`;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%', background: '#f5f5f5' }}>
      {/* Toolbar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 20px', background: '#1c2833', color: '#fff', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '1.1rem', fontWeight: 600 }}>← Back</button>
          <h2 style={{ margin: 0, fontSize: '1.1rem', color: '#f1c40f', fontFamily: 'var(--font-heading)' }}>{title}</h2>
        </div>

        {/* Chapter / PDF Selector */}
        {chapters.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.8rem', color: '#bdc3c7', fontWeight: 600 }}>Chapter / PDF:</span>
            <select
              value={selectedChapterUrl}
              onChange={(e) => handleChapterSelect(e.target.value)}
              style={{
                padding: '5px 10px',
                borderRadius: '4px',
                background: '#2c3e50',
                color: '#ecf0f1',
                border: '1px solid #34495e',
                fontSize: '0.82rem',
                maxWidth: '260px',
                cursor: 'pointer'
              }}
            >
              {chapters.map((chap, idx) => (
                <option key={chap.id || idx} value={chap.url}>
                  {chap.name} {chap.startPage ? `(Pg ${chap.startPage}-${chap.endPage})` : ''}
                </option>
              ))}
            </select>

            <button
              onClick={() => setViewMode(v => v === 'flipbook' ? 'pdf' : 'flipbook')}
              style={{
                padding: '5px 12px',
                borderRadius: '4px',
                background: viewMode === 'pdf' ? '#e67e22' : '#2980b9',
                color: '#fff',
                border: 'none',
                fontWeight: 600,
                fontSize: '0.8rem',
                cursor: 'pointer'
              }}
            >
              {viewMode === 'pdf' ? '📖 View 3D Reader' : '📄 View Chapter PDF'}
            </button>
          </div>
        )}
        
        <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
          {viewMode === 'flipbook' && (
            <form onSubmit={jumpToPage} style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
              <input 
                type="number" 
                value={jumpPage} 
                onChange={e => setJumpPage(e.target.value)} 
                style={{ width: '50px', padding: '4px', textAlign: 'center', borderRadius: '3px', border: '1px solid #7f8c8d' }}
              />
              <span style={{ color: '#aaa', fontSize: '0.85rem' }}>/ {pageImages.length}</span>
              <button type="submit" style={{ padding: '4px 8px', fontSize: '0.8rem' }}>Go</button>
            </form>
          )}

          {viewMode === 'flipbook' && (
            <>
              <button onClick={() => setZoomLevel(z => Math.min(2, z + 0.2))} style={{ padding: '4px 8px', fontSize: '0.8rem' }}>Zoom In</button>
              <button onClick={() => setZoomLevel(z => Math.max(0.5, z - 0.2))} style={{ padding: '4px 8px', fontSize: '0.8rem' }}>Zoom Out</button>
            </>
          )}

          <button onClick={() => onToggleBookmark?.(currentPage)} style={{ padding: '4px 10px', background: bookmarks.includes(currentPage) ? '#f39c12' : '#fff', color: bookmarks.includes(currentPage) ? '#fff' : '#333', border: 'none', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}>
            {bookmarks.includes(currentPage) ? '★ Bookmarked' : '☆ Bookmark'}
          </button>
        </div>
      </div>

      {/* Main Content View Area */}
      <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'hidden', padding: viewMode === 'pdf' ? 0 : '20px', position: 'relative' }}>
        {viewMode === 'pdf' ? (
          selectedChapterUrl ? (
            <iframe
              src={getImageUrl(selectedChapterUrl)}
              style={{ width: '100%', height: '100%', border: 'none' }}
              title={`${title} - Chapter PDF`}
            />
          ) : (
            <div style={{ color: '#7f8c8d', fontSize: '1rem' }}>No PDF file selected for this chapter.</div>
          )
        ) : (
          <div style={{ transform: `scale(${zoomLevel})`, transition: 'transform 0.2s', display: 'flex', justifyContent: 'center', width: '100%', height: '100%', alignItems: 'center' }}>
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
        )}
      </div>
      
      {/* Navigation Controls for 3D Flipbook */}
      {viewMode === 'flipbook' && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', padding: '12px', background: '#2c3e50' }}>
          <button onClick={() => bookRef.current?.pageFlip()?.turnToPage(0)} style={{ padding: '6px 14px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}>«« First Page</button>
          <button onClick={() => bookRef.current?.pageFlip()?.flipPrev()} style={{ padding: '6px 14px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}>« Previous Page</button>
          <button onClick={() => bookRef.current?.pageFlip()?.flipNext()} style={{ padding: '6px 14px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}>Next Page »</button>
          <button onClick={() => bookRef.current?.pageFlip()?.turnToPage(pageImages.length - 1)} style={{ padding: '6px 14px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}>Last Page »»</button>
        </div>
      )}
    </div>
  );
};
