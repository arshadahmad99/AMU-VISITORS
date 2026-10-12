import React, { useRef, useState, useEffect } from 'react';
import HTMLFlipBook from 'react-pageflip';
import visitorBookCoverImg from '../assets/visitor-book-cover.png';
import './PDFBook.css';

import {
  VisitorRecord,
  getAuthToken,
  getImageUrl,
  getLibraryName,
  formatVisitDate,
  DEFAULT_SILHOUETTE,
  getAboutText,
  DisclaimerFooter,
  VisitorPageCard
} from './VisitorPageCard';

export type { VisitorRecord };
export {
  getAuthToken,
  getImageUrl,
  getLibraryName,
  formatVisitDate,
  DEFAULT_SILHOUETTE,
  getAboutText,
  DisclaimerFooter,
  VisitorPageCard
};

interface RealisticVisitorBookReaderProps {
  title?: string;
  visitors: VisitorRecord[];
  initialPage?: number;
  onClose: () => void;
}

export const RealisticVisitorBookReader: React.FC<RealisticVisitorBookReaderProps> = ({
  title = '102 Years Old Visitors Book (1906 - 2008)',
  visitors = [],
  initialPage = 1,
  onClose,
}) => {
  const [isSinglePage, setIsSinglePage] = useState(window.innerWidth < 768);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [jumpInput, setJumpInput] = useState(initialPage.toString());
  const [isTocOpen, setIsTocOpen] = useState<boolean>(window.innerWidth >= 992);
  const [searchQuery, setSearchQuery] = useState('');
  const [bookmarks, setBookmarks] = useState<number[]>([]);
  const bookRef = useRef<any>(null);

  useEffect(() => {
    const handleResize = () => {
      setIsSinglePage(window.innerWidth < 768);
      if (window.innerWidth < 992) setIsTocOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const totalPages = visitors.length + 2; // Cover + Visitor pages + Back cover

  const handleJumpToPage = (page: number) => {
    const p = Math.max(1, Math.min(page, totalPages));
    if (bookRef.current) {
      try {
        bookRef.current.pageFlip().turnToPage(p - 1);
      } catch (e) {}
    }
    setCurrentPage(p);
    setJumpInput(p.toString());
    if (window.innerWidth < 768) setIsTocOpen(false);
  };

  const handleJumpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const p = parseInt(jumpInput, 10);
    if (!isNaN(p)) {
      handleJumpToPage(p);
    }
  };

  const filteredTocVisitors = visitors.filter(v => {
    const name = v.visitorName || (v as any).name || '';
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (name && name.toLowerCase().includes(q)) ||
      (v.country && v.country.toLowerCase().includes(q)) ||
      (v.designation && v.designation.toLowerCase().includes(q)) ||
      (v.visitDate && v.visitDate.includes(q))
    );
  });

  const handleToggleBookmark = (page: number) => {
    setBookmarks(prev =>
      prev.includes(page) ? prev.filter(p => p !== page) : [...prev, page]
    );
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      background: '#0b1329',
      display: 'flex',
      flexDirection: 'column',
      zIndex: 9999,
      overflow: 'hidden'
    }}>
      {/* Main Container Stage */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative', width: '100%', minHeight: 0 }}>
        
        {/* COMPACT LEFT SIDEBAR */}
        {isTocOpen && (
          <div style={{
            width: '280px',
            background: '#0f172a',
            borderRight: '1px solid rgba(255, 255, 255, 0.12)',
            display: 'flex',
            flexDirection: 'column',
            zIndex: 95,
            boxShadow: '4px 0 24px rgba(0,0,0,0.5)',
            transition: 'all 0.25s ease',
            flexShrink: 0
          }}>
            {/* TOC Header */}
            <div style={{
              padding: '12px 14px',
              background: '#1e293b',
              borderBottom: '1px solid rgba(255,255,255,0.1)',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ color: '#f59e0b', fontSize: '1rem' }}>📜</span>
                  <h3 style={{ margin: 0, fontSize: '0.88rem', fontWeight: 700, color: '#f8fafc', letterSpacing: '0.3px' }}>
                    Visitor Registry Index
                  </h3>
                </div>
                <button
                  onClick={() => setIsTocOpen(false)}
                  style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '1rem', cursor: 'pointer', padding: '2px 4px' }}
                >
                  ✕
                </button>
              </div>

              {/* Search Filter */}
              <input
                type="text"
                placeholder="Search visitor by name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  border: '1px solid #334155',
                  background: '#0f172a',
                  color: '#f8fafc',
                  fontSize: '0.8rem',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            {/* Visitors TOC List */}
            <div style={{ flex: 1, padding: '8px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {/* Cover Item */}
              <div
                onClick={() => handleJumpToPage(1)}
                style={{
                  padding: '8px 12px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  background: currentPage === 1 ? '#f59e0b' : 'rgba(255,255,255,0.03)',
                  color: currentPage === 1 ? '#0f172a' : '#f8fafc',
                  fontSize: '0.8rem',
                  fontWeight: currentPage === 1 ? 700 : 600,
                  display: 'flex',
                  justify: 'space-between',
                  alignItems: 'center',
                  border: currentPage === 1 ? '1px solid #fbbf24' : '1px solid rgba(255,255,255,0.06)',
                  boxShadow: currentPage === 1 ? '0 2px 8px rgba(245,158,11,0.3)' : 'none',
                  transition: 'all 0.15s ease'
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>📘</span> Title Cover Page
                </span>
                <span style={{
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  background: currentPage === 1 ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.1)',
                  padding: '2px 7px',
                  borderRadius: '10px'
                }}>
                  Pg 1
                </span>
              </div>

              {/* Section Header */}
              <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px', margin: '4px 4px 0 4px' }}>
                Historical Entries ({filteredTocVisitors.length})
              </div>

              {/* Visitor List Items */}
              {filteredTocVisitors.map((v, idx) => {
                const actualPage = visitors.findIndex(item => item.id === v.id) + 2;
                const isActive = currentPage === actualPage;
                const visitorName = v.visitorName || (v as any).name || 'Historic Visitor Entry';

                return (
                  <div
                    key={v.id || idx}
                    onClick={() => handleJumpToPage(actualPage)}
                    style={{
                      padding: '8px 12px',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      background: isActive ? '#f59e0b' : 'rgba(255,255,255,0.03)',
                      color: isActive ? '#0f172a' : '#cbd5e1',
                      borderLeft: isActive ? '4px solid #ffffff' : '1px solid rgba(255,255,255,0.05)',
                      fontSize: '0.78rem',
                      fontWeight: isActive ? 700 : 500,
                      display: 'flex',
                      justify: 'space-between',
                      alignItems: 'center',
                      lineHeight: '1.35',
                      transition: 'all 0.15s ease',
                      boxShadow: isActive ? '0 2px 8px rgba(245,158,11,0.35)' : 'none'
                    }}
                    onMouseOver={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
                        e.currentTarget.style.color = '#ffffff';
                      }
                    }}
                    onMouseOut={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                        e.currentTarget.style.color = '#cbd5e1';
                      }
                    }}
                  >
                    <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, paddingRight: '8px' }}>
                      <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: isActive ? 700 : 600 }}>{visitorName}</div>
                      {v.visitDate && (
                        <div style={{ fontSize: '0.66rem', opacity: isActive ? 0.9 : 0.6, color: isActive ? '#1e293b' : '#94a3b8' }}>
                          {v.visitDate} {v.country ? `• ${v.country}` : ''}
                        </div>
                      )}
                    </div>

                    <span style={{
                      fontSize: '0.68rem',
                      fontWeight: 700,
                      background: isActive ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.1)',
                      color: isActive ? '#0f172a' : '#94a3b8',
                      padding: '2px 7px',
                      borderRadius: '10px',
                      flexShrink: 0
                    }}>
                      Pg {actualPage}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Main 3D Book Stage Area */}
        <div style={{
          flex: 1,
          display: 'flex',
          justify: 'center',
          alignItems: 'center',
          overflow: 'hidden',
          padding: '12px',
          position: 'relative',
          width: '100%',
          height: '100%'
        }}>
          <div style={{
            transform: `scale(${zoomLevel})`,
            transition: 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            width: '100%',
            height: '100%',
            display: 'flex',
            justify: 'center',
            alignItems: 'center'
          }}>
            {/* @ts-ignore */}
            <HTMLFlipBook
              ref={bookRef}
              width={isSinglePage ? 460 : 530}
              height={isSinglePage ? 660 : 730}
              size="stretch"
              minWidth={320}
              maxWidth={1100}
              minHeight={450}
              maxHeight={1400}
              maxShadowOpacity={0.5}
              showCover={true}
              mobileScrollSupport={true}
              className="pdf-book"
              onFlip={(e: any) => {
                const page = e.data + 1;
                setCurrentPage(page);
                setJumpInput(page.toString());
              }}
            >
              {/* Front Cover Page */}
              <div className="pdf-book-page" style={{ background: '#2d1b0f', padding: 0 }}>
                <img
                  src={visitorBookCoverImg}
                  alt="102 Years Old Visitors Book Cover"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>

              {/* Visitor Record Pages */}
              {visitors.map((visitor, idx) => (
                <div key={visitor.id || idx} className="pdf-book-page" style={{
                  backgroundColor: '#f6efe3',
                  padding: '12px 14px',
                  boxSizing: 'border-box',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'stretch',
                  height: '100%',
                  width: '100%'
                }}>
                  <VisitorPageCard visitor={visitor} pageNumber={idx + 1} />
                </div>
              ))}

              {/* Back Cover */}
              <div className="pdf-book-page" style={{ background: '#1c1007', color: '#d4c4a8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ textAlign: 'center', padding: '20px' }}>
                  <h3 style={{ fontFamily: 'Georgia', color: '#f59e0b' }}>Maulana Azad Library</h3>
                  <p style={{ fontSize: '0.85rem' }}>102 Years Old Visitors Book (1906 - 2008)</p>
                  <p style={{ fontSize: '0.75rem', color: '#8c7355' }}>Aligarh Muslim University, Aligarh</p>
                </div>
              </div>
            </HTMLFlipBook>
          </div>
        </div>
      </div>

      {/* DEDICATED BOTTOM CONTROL DOCK */}
      <div className="reader-bottom-dock">
        {/* Left Action Buttons */}
        <div className="reader-dock-group">
          <button onClick={onClose} className="reader-dock-btn">
            <span>←</span> <span className="reader-btn-label">Back</span>
          </button>
          
          <button
            onClick={() => setIsTocOpen(!isTocOpen)}
            className={`reader-dock-btn ${isTocOpen ? 'reader-dock-btn-active' : ''}`}
          >
            <span>📜</span> <span className="reader-btn-label">TOC</span>
          </button>
        </div>

        {/* Center Page Navigation Pod */}
        <div className="reader-nav-pod">
          <button
            onClick={() => handleJumpToPage(1)}
            className="reader-nav-btn"
            title="First Page"
          >
            «« <span className="reader-btn-label">First</span>
          </button>

          <button
            onClick={() => {
              if (bookRef.current) {
                try { bookRef.current.pageFlip().flipPrev(); } catch (e) {}
              }
            }}
            className="reader-nav-btn"
            title="Previous Page"
          >
            « <span className="reader-btn-label">Prev</span>
          </button>

          {/* Page Jump Form */}
          <form onSubmit={handleJumpSubmit} className="reader-page-form">
            <input
              type="number"
              min={1}
              max={totalPages}
              value={jumpInput}
              onChange={(e) => setJumpInput(e.target.value)}
              className="reader-page-input"
            />
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#94a3b8', margin: '0 2px' }}>
              / {totalPages}
            </span>
            <button type="submit" className="reader-nav-btn" style={{ padding: '3px 8px', fontSize: '11px', background: '#475569' }}>
              Go
            </button>
          </form>

          <button
            onClick={() => {
              if (bookRef.current) {
                try { bookRef.current.pageFlip().flipNext(); } catch (e) {}
              }
            }}
            className="reader-nav-btn"
            title="Next Page"
          >
            <span className="reader-btn-label">Next</span> »
          </button>

          <button
            onClick={() => handleJumpToPage(totalPages)}
            className="reader-nav-btn"
            title="Last Page"
          >
            <span className="reader-btn-label">Last</span> »»
          </button>
        </div>

        {/* Right Zoom & Bookmark Group */}
        <div className="reader-dock-group">
          <div className="reader-zoom-pod">
            <button
              onClick={() => setZoomLevel(z => Math.max(0.6, z - 0.15))}
              className="reader-zoom-btn"
              title="Zoom Out"
            >
              -
            </button>

            <span
              onClick={() => setZoomLevel(1)}
              className="reader-zoom-badge"
              title="Click to reset zoom"
            >
              {Math.round(zoomLevel * 100)}%
            </span>

            <button
              onClick={() => setZoomLevel(z => Math.min(2, z + 0.15))}
              className="reader-zoom-btn"
              title="Zoom In"
            >
              +
            </button>
          </div>

          <button
            onClick={() => handleToggleBookmark(currentPage)}
            className={`reader-dock-btn ${bookmarks.includes(currentPage) ? 'reader-dock-btn-active' : ''}`}
          >
            <span>{bookmarks.includes(currentPage) ? '★' : '☆'}</span>
            <span className="reader-btn-label">{bookmarks.includes(currentPage) ? 'Bookmarked' : 'Bookmark'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
