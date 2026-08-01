import React, { useState, useRef, useEffect } from 'react';

export interface PageFlipReaderProps {
  title: string;
  pages: { pageNumber: number; content?: string; imageUrl?: string; header?: string }[];
  initialPage?: number;
  onPageChange?: (page: number) => void;
  bookmarks?: number[];
  onToggleBookmark?: (page: number) => void;
  onSearchInside?: (query: string) => void;
  isVisitorBook?: boolean;
}

export const PageFlipReader: React.FC<PageFlipReaderProps> = ({
  title,
  pages = [],
  initialPage = 1,
  onPageChange,
  bookmarks = [],
  onToggleBookmark,
  onSearchInside,
  isVisitorBook = false,
}) => {
  const [currentPage, setCurrentPage] = useState<number>(initialPage);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isSinglePage, setIsSinglePage] = useState<boolean>(false);
  const [turningState, setTurningState] = useState<'none' | 'turning-next' | 'turning-prev'>('none');
  const [dragOffset, setDragOffset] = useState<number>(0);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [jumpPageInput, setJumpPageInput] = useState<string>('');

  const containerRef = useRef<HTMLDivElement>(null);
  const totalPages = pages.length || 1;

  // Responsive mode check
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setIsSinglePage(true);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (onPageChange) {
      onPageChange(currentPage);
    }
  }, [currentPage, onPageChange]);

  const goToNextPage = () => {
    const step = isSinglePage ? 1 : 2;
    if (currentPage + step <= totalPages + 1) {
      setTurningState('turning-next');
      setTimeout(() => {
        setCurrentPage((prev) => Math.min(totalPages, prev + step));
        setTurningState('none');
      }, 400);
    }
  };

  const goToPrevPage = () => {
    const step = isSinglePage ? 1 : 2;
    if (currentPage - step >= 1) {
      setTurningState('turning-prev');
      setTimeout(() => {
        setCurrentPage((prev) => Math.max(1, prev - step));
        setTurningState('none');
      }, 400);
    }
  };

  const handleJumpToPage = (e: React.FormEvent) => {
    e.preventDefault();
    const p = parseInt(jumpPageInput);
    if (!isNaN(p) && p >= 1 && p <= totalPages) {
      setCurrentPage(p);
      setJumpPageInput('');
    }
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch((err) => console.log(err));
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch((err) => console.log(err));
      setIsFullscreen(false);
    }
  };

  // Mouse Drag / Touch Drag handling for physical curl
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragOffset(0);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setDragOffset((prev) => prev + e.movementX);
  };

  const handleMouseUp = () => {
    if (!isDragging) return;
    setIsDragging(false);
    if (dragOffset < -60) {
      goToNextPage();
    } else if (dragOffset > 60) {
      goToPrevPage();
    }
    setDragOffset(0);
  };

  const isCurrentBookmarked = bookmarks.includes(currentPage);

  // Calculate displayed pages in spread mode
  const leftPageIndex = isSinglePage ? currentPage : currentPage % 2 === 0 ? currentPage - 1 : currentPage;
  const rightPageIndex = isSinglePage ? null : leftPageIndex + 1 <= totalPages ? leftPageIndex + 1 : null;

  const leftPageData = pages[leftPageIndex - 1];
  const rightPageData = rightPageIndex ? pages[rightPageIndex - 1] : null;

  return (
    <div
      ref={containerRef}
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        width: '100%',
        backgroundColor: isVisitorBook ? '#1c1917' : '#0f172a',
        color: '#f8fafc',
        fontFamily: "'Inter', sans-serif",
        borderRadius: isFullscreen ? '0px' : '16px',
        overflow: 'hidden',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        userSelect: 'none',
      }}
    >
      {/* Top Toolbar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 20px',
          background: isVisitorBook
            ? 'linear-gradient(to right, #292524, #1c1917)'
            : 'linear-gradient(to right, #1e293b, #0f172a)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          flexWrap: 'wrap',
          gap: '10px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '1.2rem', fontWeight: 700, color: isVisitorBook ? '#f59e0b' : '#38bdf8' }}>
            📖 {title}
          </span>
          <span style={{ fontSize: '0.85rem', color: '#94a3b8', background: 'rgba(255,255,255,0.08)', padding: '3px 8px', borderRadius: '12px' }}>
            {isVisitorBook ? 'University Visitor Archive' : 'Interactive eBook'}
          </span>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* In-Book Search Input */}
          <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.08)', borderRadius: '8px', padding: '4px 8px' }}>
            <input
              type="text"
              placeholder="Search page content..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && onSearchInside) {
                  onSearchInside(searchQuery);
                }
              }}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#fff',
                fontSize: '0.85rem',
                outline: 'none',
                width: '140px',
              }}
            />
            <button
              onClick={() => onSearchInside && onSearchInside(searchQuery)}
              style={{ background: 'none', border: 'none', color: '#38bdf8', cursor: 'pointer' }}
            >
              🔍
            </button>
          </div>

          {/* Bookmark Button */}
          {onToggleBookmark && (
            <button
              onClick={() => onToggleBookmark(currentPage)}
              title={isCurrentBookmarked ? 'Remove Bookmark' : 'Add Bookmark'}
              style={{
                background: isCurrentBookmarked ? '#ef4444' : 'rgba(255,255,255,0.1)',
                color: '#fff',
                border: 'none',
                padding: '6px 12px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '0.85rem',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              🔖 {isCurrentBookmarked ? 'Bookmarked' : 'Bookmark'}
            </button>
          )}

          {/* Zoom Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(255,255,255,0.08)', borderRadius: '6px', padding: '2px 6px' }}>
            <button
              onClick={() => setZoomLevel((z) => Math.max(0.7, z - 0.1))}
              style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontWeight: 'bold' }}
            >
              -
            </button>
            <span style={{ fontSize: '0.8rem', width: '40px', textAlign: 'center' }}>{Math.round(zoomLevel * 100)}%</span>
            <button
              onClick={() => setZoomLevel((z) => Math.min(1.5, z + 0.1))}
              style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontWeight: 'bold' }}
            >
              +
            </button>
          </div>

          {/* Page Display Mode Toggle */}
          <button
            onClick={() => setIsSinglePage(!isSinglePage)}
            title="Toggle Single / Double Page"
            style={{
              background: 'rgba(255,255,255,0.1)',
              color: '#fff',
              border: 'none',
              padding: '6px 10px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '0.8rem',
            }}
          >
            {isSinglePage ? '📄 Single' : '📖 Spread'}
          </button>

          {/* Fullscreen Button */}
          <button
            onClick={toggleFullscreen}
            style={{
              background: 'rgba(255,255,255,0.1)',
              color: '#fff',
              border: 'none',
              padding: '6px 10px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '0.85rem',
            }}
          >
            {isFullscreen ? '📉 Exit Fullscreen' : '⛶ Fullscreen'}
          </button>
        </div>
      </div>

      {/* Main 3D Book Stage */}
      <div
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          perspective: '1500px',
          overflow: 'auto',
          cursor: isDragging ? 'grabbing' : 'grab',
          background: isVisitorBook
            ? 'radial-gradient(circle at center, #44403c 0%, #1c1917 100%)'
            : 'radial-gradient(circle at center, #1e293b 0%, #020617 100%)',
        }}
      >
        <div
          style={{
            display: 'flex',
            transform: `scale(${zoomLevel})`,
            transition: isDragging ? 'none' : 'transform 0.3s ease',
            boxShadow: '0 20px 40px rgba(0,0,0,0.6)',
            borderRadius: '8px',
            overflow: 'visible',
            maxWidth: '1000px',
            width: '100%',
            height: '520px',
            position: 'relative',
          }}
        >
          {/* LEFT PAGE */}
          <div
            onClick={goToPrevPage}
            style={{
              flex: 1,
              backgroundColor: isVisitorBook ? '#fef3c7' : '#f8fafc',
              color: isVisitorBook ? '#78350f' : '#1e293b',
              padding: '24px 30px',
              borderTopLeftRadius: '8px',
              borderBottomLeftRadius: '8px',
              boxShadow: 'inset -15px 0 20px -10px rgba(0,0,0,0.25), -5px 5px 15px rgba(0,0,0,0.3)',
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              fontFamily: isVisitorBook ? "'Courier New', Georgia, serif" : "'Inter', serif",
              borderRight: '2px solid rgba(0,0,0,0.15)',
              transformOrigin: 'right center',
              transform: turningState === 'turning-prev' ? 'rotateY(25deg)' : `rotateY(${Math.max(0, dragOffset * 0.05)}deg)`,
              transition: isDragging ? 'none' : 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          >
            {/* Corner Click Curl Prompt */}
            <div
              title="Click to turn back"
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '35px',
                height: '35px',
                background: 'linear-gradient(135deg, rgba(0,0,0,0.15) 0%, transparent 50%)',
                cursor: 'pointer',
                borderBottomRightRadius: '100%',
              }}
            />

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(0,0,0,0.1)', paddingBottom: '8px', marginBottom: '12px', fontSize: '0.8rem', opacity: 0.7 }}>
                <span>{leftPageData?.header || title}</span>
                <span>Page {leftPageIndex}</span>
              </div>
              <div style={{ fontSize: '0.95rem', lineHeight: '1.7', whiteSpace: 'pre-wrap' }}>
                {leftPageData?.content || `Page ${leftPageIndex} Content - Sample reading material with formatted typography, structured chapters, and interactive visitor records.`}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', opacity: 0.6, marginTop: '16px' }}>
              <span>⬅ Click left or drag to flip back</span>
              <span>{leftPageIndex}</span>
            </div>
          </div>

          {/* RIGHT PAGE (If Double Page Spread) */}
          {!isSinglePage && (
            <div
              onClick={goToNextPage}
              style={{
                flex: 1,
                backgroundColor: isVisitorBook ? '#fef3c7' : '#ffffff',
                color: isVisitorBook ? '#78350f' : '#1e293b',
                padding: '24px 30px',
                borderTopRightRadius: '8px',
                borderBottomRightRadius: '8px',
                boxShadow: 'inset 15px 0 20px -10px rgba(0,0,0,0.25), 5px 5px 15px rgba(0,0,0,0.3)',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                fontFamily: isVisitorBook ? "'Courier New', Georgia, serif" : "'Inter', serif",
                transformOrigin: 'left center',
                transform: turningState === 'turning-next' ? 'rotateY(-25deg)' : `rotateY(${Math.min(0, dragOffset * 0.05)}deg)`,
                transition: isDragging ? 'none' : 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
            >
              {/* Corner Click Curl Prompt */}
              <div
                title="Click to turn next"
                style={{
                  position: 'absolute',
                  top: 0,
                  right: 0,
                  width: '35px',
                  height: '35px',
                  background: 'linear-gradient(-135deg, rgba(0,0,0,0.15) 0%, transparent 50%)',
                  cursor: 'pointer',
                  borderBottomLeftRadius: '100%',
                }}
              />

              {rightPageData ? (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(0,0,0,0.1)', paddingBottom: '8px', marginBottom: '12px', fontSize: '0.8rem', opacity: 0.7 }}>
                    <span>Page {rightPageIndex}</span>
                    <span>{rightPageData.header || title}</span>
                  </div>
                  <div style={{ fontSize: '0.95rem', lineHeight: '1.7', whiteSpace: 'pre-wrap' }}>
                    {rightPageData.content || `Page ${rightPageIndex} Content - Detailed data representation.`}
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', opacity: 0.3, fontStyle: 'italic' }}>
                  End of Book Archive
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', opacity: 0.6, marginTop: '16px' }}>
                <span>{rightPageIndex || ''}</span>
                <span>Click right or drag to flip next ➡</span>
              </div>
            </div>
          )}

          {/* Book Spine Fold Overlay Effect */}
          <div
            style={{
              position: 'absolute',
              left: isSinglePage ? '0' : '50%',
              top: 0,
              bottom: 0,
              width: '16px',
              transform: 'translateX(-50%)',
              background: 'linear-gradient(to right, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.05) 50%, rgba(0,0,0,0.3) 100%)',
              pointerEvents: 'none',
              zIndex: 10,
            }}
          />
        </div>
      </div>

      {/* Bottom Page Navigation Controls */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 20px',
          background: isVisitorBook ? '#1c1917' : '#0f172a',
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        <button
          onClick={goToPrevPage}
          disabled={currentPage <= 1}
          style={{
            background: currentPage <= 1 ? 'rgba(255,255,255,0.05)' : '#3b82f6',
            color: '#fff',
            border: 'none',
            padding: '8px 16px',
            borderRadius: '6px',
            cursor: currentPage <= 1 ? 'not-allowed' : 'pointer',
            fontWeight: 600,
            opacity: currentPage <= 1 ? 0.4 : 1,
          }}
        >
          ◀ Previous Page
        </button>

        {/* Page Counter & Jump Form */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#cbd5e1' }}>
            Page <strong style={{ color: isVisitorBook ? '#f59e0b' : '#38bdf8' }}>{currentPage}</strong> of {totalPages}
          </span>

          <form onSubmit={handleJumpToPage} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <input
              type="number"
              min={1}
              max={totalPages}
              placeholder="Go to #"
              value={jumpPageInput}
              onChange={(e) => setJumpPageInput(e.target.value)}
              style={{
                width: '65px',
                padding: '4px 8px',
                borderRadius: '6px',
                border: '1px solid rgba(255,255,255,0.2)',
                background: 'rgba(0,0,0,0.3)',
                color: '#fff',
                fontSize: '0.85rem',
                textAlign: 'center',
              }}
            />
            <button
              type="submit"
              style={{
                background: 'rgba(255,255,255,0.15)',
                color: '#fff',
                border: 'none',
                padding: '4px 10px',
                borderRadius: '6px',
                fontSize: '0.85rem',
                cursor: 'pointer',
              }}
            >
              Jump
            </button>
          </form>
        </div>

        <button
          onClick={goToNextPage}
          disabled={currentPage >= totalPages}
          style={{
            background: currentPage >= totalPages ? 'rgba(255,255,255,0.05)' : '#3b82f6',
            color: '#fff',
            border: 'none',
            padding: '8px 16px',
            borderRadius: '6px',
            cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer',
            fontWeight: 600,
            opacity: currentPage >= totalPages ? 0.4 : 1,
          }}
        >
          Next Page ▶
        </button>
      </div>
    </div>
  );
};
