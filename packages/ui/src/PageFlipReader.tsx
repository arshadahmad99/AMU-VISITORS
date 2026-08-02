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
  onClose?: () => void;
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
  onClose,
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

  const leftPageIndex = isSinglePage ? currentPage : currentPage % 2 === 0 ? currentPage - 1 : currentPage;
  const rightPageIndex = isSinglePage ? null : leftPageIndex + 1 <= totalPages ? leftPageIndex + 1 : null;

  const leftPageData = pages[leftPageIndex - 1];
  const rightPageData = rightPageIndex ? pages[rightPageIndex - 1] : null;

  // Custom textures and colors
  const bgColor = '#021634';
  const topBarBg = '#01122a';
  const bottomBarBg = '#000000';
  const goldText = '#dfb76c';
  const inputBg = '#041731';

  return (
    <div
      ref={containerRef}
      style={{
        display: 'flex',
        flexDirection: 'column',
        flex: 1,
        minHeight: 0,
        width: '100%',
        backgroundColor: bgColor,
        fontFamily: "'Inter', sans-serif",
        borderRadius: isFullscreen ? '0px' : '0px',
        overflow: 'hidden',
        userSelect: 'none',
      }}
    >
      {/* Top Toolbar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 24px',
          background: topBarBg,
          borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <div onClick={onClose} style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
            <span style={{ color: '#fff', fontSize: '1.2rem' }}>←</span>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '0.65rem', fontWeight: 800, color: '#fff', letterSpacing: '1px' }}>BACK TO</span>
              <span style={{ fontSize: '0.65rem', fontWeight: 800, color: '#fff', letterSpacing: '1px' }}>LIBRARY</span>
            </div>
          </div>
          <div style={{ width: '1px', height: '32px', background: 'rgba(255,255,255,0.1)' }} />
          <h1 style={{ 
            fontSize: '1.4rem', 
            fontWeight: 400, 
            color: goldText, 
            fontFamily: 'var(--font-heading)',
            margin: 0,
            lineHeight: 1.2
          }}>
            {title || "Quantum Computing Foundations &\nArchitecture"}
          </h1>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          {/* Search */}
          <div style={{ display: 'flex', alignItems: 'center', background: inputBg, borderRadius: '4px', padding: '8px 12px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <span style={{ color: '#556885', marginRight: '8px', fontSize: '0.9rem' }}>🔍</span>
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
                width: '180px',
              }}
            />
          </div>

          {/* Tools */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', background: inputBg, borderRadius: '4px', padding: '8px 16px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <button onClick={() => onToggleBookmark && onToggleBookmark(currentPage)} style={{ background: 'none', border: 'none', color: isCurrentBookmarked ? goldText : '#fff', cursor: 'pointer', fontSize: '1rem' }}>🔖</button>
            <div style={{ width: '1px', height: '16px', background: 'rgba(255,255,255,0.1)' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <button onClick={() => setZoomLevel((z) => Math.max(0.7, z - 0.1))} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '1rem' }}>-</button>
              <span style={{ color: '#fff', fontSize: '0.75rem', fontWeight: 700 }}>{Math.round(zoomLevel * 100)}%</span>
              <button onClick={() => setZoomLevel((z) => Math.min(1.5, z + 0.1))} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '1rem' }}>+</button>
            </div>
            <div style={{ width: '1px', height: '16px', background: 'rgba(255,255,255,0.1)' }} />
            <button onClick={() => setIsSinglePage(!isSinglePage)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '1rem' }}>📖</button>
            <button onClick={toggleFullscreen} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '1rem' }}>⛶</button>
          </div>
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
          padding: '40px',
          perspective: '2000px',
          overflowY: 'auto',
          overflowX: 'hidden',
          minHeight: 0,
          cursor: isDragging ? 'grabbing' : 'grab',
          background: bgColor,
        }}
      >
        <div
          style={{
            display: 'flex',
            transform: `scale(${zoomLevel})`,
            transition: isDragging ? 'none' : 'transform 0.3s ease',
            boxShadow: '0 25px 60px rgba(0,0,0,0.5)',
            maxWidth: '1200px',
            width: '100%',
            height: '650px',
            position: 'relative',
          }}
        >
          {/* Paper Texture Overlay for entire book */}
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'none', zIndex: 5,
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.08'/%3E%3C/svg%3E")`,
            mixBlendMode: 'multiply'
          }} />

          {/* LEFT PAGE */}
          <div
            onClick={goToPrevPage}
            style={{
              flex: 1,
              backgroundColor: '#f6f6f6',
              color: '#0a1d3f',
              padding: '40px 50px',
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
              fontFamily: "'Georgia', serif",
              borderRight: '1px solid rgba(0,0,0,0.05)',
              transformOrigin: 'right center',
              transform: turningState === 'turning-prev' ? 'rotateY(25deg)' : `rotateY(${Math.max(0, dragOffset * 0.05)}deg)`,
              transition: isDragging ? 'none' : 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: '#888', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '40px', fontFamily: "'Inter', sans-serif" }}>
              <span>{title.toUpperCase()} - CHAPTER 3 Page {leftPageIndex}</span>
            </div>

            {/* Content */}
            <div style={{ flex: 1, fontSize: '1.05rem', lineHeight: '1.8', overflowY: 'auto', paddingRight: '8px' }}>
              <h2 style={{ fontSize: '2rem', fontWeight: 600, color: '#0a1d3f', marginBottom: '32px', lineHeight: '1.3' }}>
                {leftPageData?.header || "CHAPTER 3: Grover's Search Algorithm"}
              </h2>
              <div style={{ whiteSpace: 'pre-wrap' }} dangerouslySetInnerHTML={{ __html: leftPageData?.content?.replace('quadratic speedup', '<span style="background: rgba(234, 179, 8, 0.3); padding: 0 4px;">quadratic speedup</span>') || "Grover's algorithm provides <span style=\"background: rgba(234, 179, 8, 0.3); padding: 0 4px;\">quadratic speedup</span> for unstructured database query problems. In the classical realm, searching through an unsorted database of N items requires O(N) queries in the worst case.\n\nThrough the principles of quantum superposition and interference, Grover's algorithm achieves this in O(√N) time complexity, representing one of the most fundamental advantages of quantum computing for generic search tasks." }} />
            </div>

            {/* Footer */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.65rem', color: '#aaa', fontStyle: 'italic', fontFamily: "'Inter', sans-serif" }}>
              <span>← CLICK OR DRAG TO FLIP BACK</span>
              <span style={{ fontWeight: 600, fontStyle: 'normal' }}>{leftPageIndex}</span>
            </div>
          </div>

          {/* RIGHT PAGE */}
          {!isSinglePage && (
            <div
              onClick={goToNextPage}
              style={{
                flex: 1,
                backgroundColor: '#f6f6f6',
                color: '#0a1d3f',
                padding: '40px 50px',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                fontFamily: "'Georgia', serif",
                transformOrigin: 'left center',
                transform: turningState === 'turning-next' ? 'rotateY(-25deg)' : `rotateY(${Math.min(0, dragOffset * 0.05)}deg)`,
                transition: isDragging ? 'none' : 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
            >
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: '#888', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '40px', fontFamily: "'Inter', sans-serif" }}>
                <span>Page {rightPageIndex}</span>
                <span>THEORY & APPLICATIONS</span>
              </div>

              {/* Content */}
              <div style={{ flex: 1, fontSize: '1.05rem', lineHeight: '1.8', overflowY: 'auto', paddingRight: '8px' }}>
                <h2 style={{ fontSize: '2rem', fontWeight: 600, color: '#0a1d3f', marginBottom: '32px', lineHeight: '1.3' }}>
                  {rightPageData?.header || "CHAPTER 3 (Cont.): Phase Inversion & Diffusion"}
                </h2>
                <div style={{ whiteSpace: 'pre-wrap' }}>
                  {rightPageData?.content || "The core of the algorithm lies in the Grover iteration, which consists of two primary operations: the Oracle (Phase Inversion) and the Diffusion operator.\n\nThe amplitude amplification process iteratively reflects state vectors about the mean amplitude to isolate target search keys. By the end of approximately π/4 √N iterations, the probability of measuring the correct state is maximized."}
                </div>
              </div>

              {/* Footer */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.65rem', color: '#aaa', fontStyle: 'italic', fontFamily: "'Inter', sans-serif" }}>
                <span style={{ fontWeight: 600, fontStyle: 'normal' }}>{rightPageIndex}</span>
                <span>CLICK OR DRAG TO FLIP NEXT →</span>
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
              width: '40px',
              transform: 'translateX(-50%)',
              background: 'linear-gradient(to right, rgba(0,0,0,0.15) 0%, rgba(255,255,255,0.4) 15%, rgba(0,0,0,0.02) 40%, rgba(0,0,0,0.02) 60%, rgba(255,255,255,0.4) 85%, rgba(0,0,0,0.15) 100%)',
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
          padding: '16px 24px',
          background: bottomBarBg,
        }}
      >
        <button
          onClick={goToPrevPage}
          disabled={currentPage <= 1}
          style={{
            background: currentPage <= 1 ? '#333' : goldText,
            color: '#000',
            border: 'none',
            padding: '12px 24px',
            cursor: currentPage <= 1 ? 'not-allowed' : 'pointer',
            fontWeight: 800,
            fontSize: '0.75rem',
            letterSpacing: '1px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <span>&lt;</span> PREVIOUS PAGE
        </button>

        {/* Page Counter & Jump Form */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#666', letterSpacing: '2px' }}>
            LOCATION <strong style={{ color: goldText, fontSize: '1rem' }}>{currentPage}</strong> OF {totalPages}
          </span>

          <form onSubmit={handleJumpToPage} style={{ display: 'flex', alignItems: 'center' }}>
            <input
              type="text"
              value={jumpPageInput}
              onChange={(e) => setJumpPageInput(e.target.value)}
              style={{
                width: '50px',
                padding: '10px',
                border: '1px solid #333',
                background: '#000',
                color: '#fff',
                fontSize: '0.85rem',
                textAlign: 'center',
                fontWeight: 700,
              }}
            />
            <button
              type="submit"
              style={{
                background: '#111',
                color: goldText,
                border: '1px solid #333',
                borderLeft: 'none',
                padding: '10px 16px',
                fontSize: '0.75rem',
                fontWeight: 800,
                letterSpacing: '1px',
                cursor: 'pointer',
              }}
            >
              JUMP
            </button>
          </form>
        </div>

        <button
          onClick={goToNextPage}
          disabled={currentPage >= totalPages}
          style={{
            background: currentPage >= totalPages ? '#333' : goldText,
            color: '#000',
            border: 'none',
            padding: '12px 24px',
            cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer',
            fontWeight: 800,
            fontSize: '0.75rem',
            letterSpacing: '1px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          NEXT PAGE <span>&gt;</span>
        </button>
      </div>
    </div>
  );
};
