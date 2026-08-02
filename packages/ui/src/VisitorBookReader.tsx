import React, { useState, useRef, useEffect } from 'react';

export interface VisitorBookReaderProps {
  title?: string;
  pages: { 
    pageNumber: number; 
    name?: string; 
    date?: string; 
    country?: string; 
    designation?: string; 
    imageUrl1?: string;
    imageUrl2?: string;
  }[];
  initialPage?: number;
  onPageChange?: (page: number) => void;
  onClose?: () => void;
}

export const VisitorBookReader: React.FC<VisitorBookReaderProps> = ({
  title = "Visitor Archives Vol. IV",
  pages = [],
  initialPage = 1,
  onPageChange,
  onClose,
}) => {
  const [currentPage, setCurrentPage] = useState<number>(initialPage);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [isSinglePage, setIsSinglePage] = useState<boolean>(false);
  const [turningState, setTurningState] = useState<'none' | 'turning-next' | 'turning-prev'>('none');
  const [dragOffset, setDragOffset] = useState<number>(0);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const totalPages = pages.length || 1;

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setIsSinglePage(true);
      } else {
        setIsSinglePage(false);
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

  const goToFirstPage = () => {
    if (currentPage > 1) {
      setTurningState('turning-prev');
      setTimeout(() => {
        setCurrentPage(1);
        setTurningState('none');
      }, 400);
    }
  };

  const goToLastPage = () => {
    const target = totalPages % 2 === 0 ? totalPages - 1 : totalPages;
    if (currentPage < target) {
      setTurningState('turning-next');
      setTimeout(() => {
        setCurrentPage(target);
        setTurningState('none');
      }, 400);
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

  const leftPageIndex = isSinglePage ? currentPage : currentPage % 2 === 0 ? currentPage - 1 : currentPage;
  const rightPageIndex = isSinglePage ? null : leftPageIndex + 1 <= totalPages ? leftPageIndex + 1 : null;

  const leftPageData = pages[leftPageIndex - 1] || {};
  const rightPageData = rightPageIndex ? (pages[rightPageIndex - 1] || {}) : null;

  const bgColor = '#021634';
  const paperColor = '#fcfbf8';
  const goldHeader = '#b8924b';
  const darkText = '#111827';
  const dividerColor = 'rgba(0,0,0,0.06)';

  // Reusable sub-components for the left page fields
  const Field = ({ label, value }: { label: string, value?: string }) => (
    <div style={{ marginBottom: '24px' }}>
      <div style={{ fontSize: '0.65rem', fontWeight: 800, color: goldHeader, letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '8px', fontFamily: "'Inter', sans-serif" }}>
        {label}
      </div>
      <div style={{ fontSize: '1.4rem', color: darkText, fontFamily: "'Georgia', serif", minHeight: '32px' }}>
        {value || '—'}
      </div>
    </div>
  );

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
        overflow: 'hidden',
        userSelect: 'none',
        position: 'relative',
      }}
    >
      {/* Close button (top right) */}
      {onClose && (
        <button 
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '24px',
            right: '32px',
            background: 'rgba(255,255,255,0.1)',
            border: '1px solid rgba(255,255,255,0.2)',
            color: '#fff',
            padding: '8px 16px',
            borderRadius: '24px',
            cursor: 'pointer',
            zIndex: 100,
            fontSize: '0.8rem',
            fontWeight: 700,
            letterSpacing: '1px',
          }}
        >
          ✕ CLOSE ARCHIVE
        </button>
      )}

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
          padding: '40px 40px 100px 40px', // Extra padding at bottom for the floating pill
          perspective: '2000px',
          overflowY: 'auto',
          overflowX: 'hidden',
          minHeight: 0,
          cursor: isDragging ? 'grabbing' : 'grab',
        }}
      >
        <div
          style={{
            display: 'flex',
            transform: `scale(${zoomLevel})`,
            transition: isDragging ? 'none' : 'transform 0.3s ease',
            boxShadow: '0 30px 60px rgba(0,0,0,0.6)',
            maxWidth: '1200px',
            width: '100%',
            height: '650px',
            position: 'relative',
          }}
        >
          {/* Paper Texture Overlay */}
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'none', zIndex: 5,
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.08'/%3E%3C/svg%3E")`,
            mixBlendMode: 'multiply'
          }} />

          {/* LEFT PAGE - Data Fields */}
          <div
            onClick={goToPrevPage}
            style={{
              flex: 1,
              backgroundColor: paperColor,
              color: darkText,
              padding: '60px 70px',
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
            {/* Entry Serial */}
            <Field label="ENTRY SERIAL" value={title} />
            <div style={{ width: '100%', height: '1px', background: dividerColor, marginBottom: '40px' }} />

            {/* Name */}
            <Field label="FULL NAME" value={leftPageData.name || "H.L. Gokhale"} />
            <div style={{ width: '100%', height: '1px', background: dividerColor, marginBottom: '40px', borderStyle: 'dashed' }} />

            {/* Date & Country */}
            <div style={{ display: 'flex', gap: '64px' }}>
              <div style={{ flex: 1 }}>
                <Field label="VISITING DATE" value={leftPageData.date || "17 February 2008"} />
              </div>
              <div style={{ flex: 1 }}>
                <Field label="COUNTRY" value={leftPageData.country || "India"} />
              </div>
            </div>
            <div style={{ width: '100%', height: '1px', background: dividerColor, marginBottom: '40px' }} />

            {/* Designation */}
            <Field label="DESIGNATION" value={leftPageData.designation || "Chief Justice, Allahabad High Court"} />

            <div style={{ flex: 1 }} />

            {/* Footer */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '40px' }}>
              <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#666', letterSpacing: '1px', fontFamily: "'Inter', sans-serif" }}>
                FOLIO NO. {leftPageIndex + 229}
              </span>
              <span style={{ fontSize: '1.6rem', color: '#9ca3af', fontFamily: "'Georgia', serif", fontStyle: 'italic' }}>
                Registry Record
              </span>
            </div>
          </div>

          {/* RIGHT PAGE - Images */}
          {!isSinglePage && (
            <div
              onClick={goToNextPage}
              style={{
                flex: 1,
                backgroundColor: paperColor,
                color: darkText,
                padding: '60px 70px',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                fontFamily: "'Georgia', serif",
                transformOrigin: 'left center',
                transform: turningState === 'turning-next' ? 'rotateY(-25deg)' : `rotateY(${Math.min(0, dragOffset * 0.05)}deg)`,
                transition: isDragging ? 'none' : 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
            >
              {/* Gold Ribbon / Bookmark */}
              <div style={{ position: 'absolute', top: 0, right: '40px', width: '28px', height: '120px', background: '#b48a3b', zIndex: 10, boxShadow: '0 4px 8px rgba(0,0,0,0.2)' }}>
                <div style={{ width: '8px', height: '8px', background: '#333', borderRadius: '50%', margin: '10px auto' }} />
              </div>

              {/* Title */}
              <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                <h3 style={{ fontSize: '1.8rem', color: '#1f2937', fontStyle: 'italic', margin: 0 }}>
                  Official Signature & Record
                </h3>
              </div>

              {/* Image Container */}
              <div style={{ flex: 1, background: '#e5e7eb', borderRadius: '4px', padding: '32px', display: 'flex', flexDirection: 'column', alignItems: 'center', boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.05)' }}>
                
                {/* Main Card */}
                <div style={{ width: '100%', maxWidth: '380px', height: '220px', background: '#fff', borderRadius: '12px', boxShadow: '0 8px 20px rgba(0,0,0,0.15)', border: '4px solid #fff', overflow: 'hidden', marginBottom: '32px' }}>
                  <div style={{ width: '100%', height: '100%', background: '#ccc', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#666', fontSize: '0.8rem' }}>
                    [MAIN ID SCAN]
                  </div>
                </div>

                <div style={{ width: '80%', height: '1px', background: 'rgba(0,0,0,0.1)', marginBottom: '32px' }} />

                {/* Sub Card */}
                <div style={{ width: '180px', height: '100px', background: '#fff', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', border: '2px solid #fff', overflow: 'hidden' }}>
                  <div style={{ width: '100%', height: '100%', background: '#ccc', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#666', fontSize: '0.7rem' }}>
                    [THUMBNAIL SCAN]
                  </div>
                </div>

              </div>

              {/* Footer */}
              <div style={{ textAlign: 'center', marginTop: '32px' }}>
                <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#6b7280', letterSpacing: '2px', fontFamily: "'Inter', sans-serif" }}>
                  VERIFIED ARCHIVAL SCAN
                </span>
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
              width: '50px',
              transform: 'translateX(-50%)',
              background: 'linear-gradient(to right, rgba(0,0,0,0.15) 0%, rgba(255,255,255,0.3) 15%, rgba(0,0,0,0.02) 40%, rgba(0,0,0,0.02) 60%, rgba(255,255,255,0.3) 85%, rgba(0,0,0,0.15) 100%)',
              pointerEvents: 'none',
              zIndex: 10,
            }}
          />
        </div>
      </div>

      {/* Floating Pill Pagination */}
      <div
        style={{
          position: 'absolute',
          bottom: '32px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(220, 223, 227, 0.95)',
          backdropFilter: 'blur(8px)',
          borderRadius: '32px',
          padding: '12px 32px',
          display: 'flex',
          alignItems: 'center',
          gap: '32px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
          border: '1px solid rgba(255,255,255,0.4)',
        }}
      >
        <button onClick={goToFirstPage} style={{ background: 'none', border: 'none', color: '#6b7280', fontSize: '0.9rem', cursor: 'pointer', fontWeight: 800 }}>
          |&lt;
        </button>

        <button onClick={goToPrevPage} disabled={currentPage <= 1} style={{ background: 'none', border: 'none', color: currentPage <= 1 ? '#9ca3af' : '#4b5563', fontSize: '0.75rem', fontWeight: 800, letterSpacing: '1px', cursor: currentPage <= 1 ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>&lt;</span> PREVIOUS
        </button>

        <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#9ca3af', letterSpacing: '1px' }}>
          <span style={{ color: '#b8924b', borderBottom: '2px solid #b8924b', paddingBottom: '2px' }}>{currentPage + 229}</span> / {totalPages + 229}
        </div>

        <button onClick={goToNextPage} disabled={currentPage >= totalPages} style={{ background: 'none', border: 'none', color: currentPage >= totalPages ? '#9ca3af' : '#4b5563', fontSize: '0.75rem', fontWeight: 800, letterSpacing: '1px', cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
          NEXT <span>&gt;</span>
        </button>

        <button onClick={goToLastPage} style={{ background: 'none', border: 'none', color: '#6b7280', fontSize: '0.9rem', cursor: 'pointer', fontWeight: 800 }}>
          &gt;|
        </button>
      </div>
    </div>
  );
};
