import React, { useRef, useState, useEffect } from 'react';
import HTMLFlipBook from 'react-pageflip';
import visitorBookCoverImg from '../assets/visitor-book-cover.png';
import './PDFBook.css';

export interface VisitorRecord {
  id: string;
  visitorName: string;
  visitDate: string;
  country?: string;
  designation?: string;
  purpose?: string;
  department?: string;
  year?: number;
  autographPath?: string;
  visitorImagePath?: string;
  notes?: string;
  aboutVisitor?: string;
}

interface RealisticVisitorBookReaderProps {
  title?: string;
  visitors: VisitorRecord[];
  initialPage?: number;
  onClose: () => void;
}

const getAuthToken = () => {
  if (typeof window === 'undefined') return '';
  return (
    localStorage.getItem('dl_token') ||
    localStorage.getItem('token') ||
    localStorage.getItem('adminToken') ||
    ''
  );
};

const getImageUrl = (url?: string) => {
  if (!url) return '';
  if (url.startsWith('data:') || url.startsWith('blob:')) return url;
  if (url.includes('token=')) return url;
  const token = getAuthToken();
  return (token && token !== 'null' && token !== 'undefined')
    ? `${url}${url.includes('?') ? '&' : '?'}token=${token}`
    : url;
};

export const getLibraryName = (visitDate?: string, year?: number) => {
  let visitYear: number | null = year || null;
  if (!visitYear && visitDate) {
    const match = String(visitDate).match(/\b(17\d\d|18\d\d|19\d\d|20\d\d)\b/);
    if (match) {
      visitYear = parseInt(match[1], 10);
    }
  }
  if (visitYear && visitYear < 1960) {
    return 'Lytton Library';
  }
  return 'Maulana Azad Library';
};

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
              {visitors.map((visitor, idx) => {
                const vName = visitor.visitorName || (visitor as any).name || (visitor as any).title || 'Historic Visitor Record';
                return (
                  <div key={visitor.id || idx} className="pdf-book-page" style={{
                    backgroundColor: '#f6f0e4',
                    backgroundImage: 'radial-gradient(ellipse at center, #fcf8f0 0%, #f1e6d3 100%)',
                    padding: '12px',
                    boxSizing: 'border-box'
                  }}>
                    <div style={{
                      border: '1px solid #d4c4a8',
                      outline: '1px solid rgba(212, 196, 168, 0.4)',
                      outlineOffset: '-4px',
                      padding: '16px 18px',
                      height: '100%',
                      width: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      boxSizing: 'border-box',
                      position: 'relative',
                      overflowY: 'auto'
                    }}>
                      {/* 1. Header Block (Guaranteed Top Visibility) */}
                      <div style={{ textAlign: 'center', width: '100%', flexShrink: 0, marginBottom: '6px' }}>
                        <div style={{
                          fontFamily: "'Georgia', serif",
                          fontSize: '0.72rem',
                          color: '#8b7b6b',
                          letterSpacing: '1.5px',
                          textTransform: 'uppercase',
                          fontWeight: 700,
                          marginBottom: '2px'
                        }}>
                          {getLibraryName(visitor.visitDate, visitor.year)} • AMU
                        </div>

                        <h3 style={{
                          margin: '2px 0 4px 0',
                          fontSize: '1.35rem',
                          fontFamily: "'Georgia', 'Playfair Display', serif",
                          fontWeight: 700,
                          color: '#1a0e05',
                          lineHeight: 1.25,
                          wordBreak: 'break-word'
                        }}>
                          {vName}
                        </h3>

                        {/* Ornate Divider */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', margin: '4px 0 6px 0' }}>
                          <div style={{ height: '1px', flex: 1, backgroundColor: '#d4c4a8' }}></div>
                          <span style={{ color: '#d4af37', fontSize: '0.75rem' }}>✦</span>
                          <div style={{ height: '1px', flex: 1, backgroundColor: '#d4c4a8' }}></div>
                        </div>
                      </div>

                      {/* 2. Metadata Grid */}
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                        gap: '6px 12px',
                        padding: '8px 12px',
                        backgroundColor: 'rgba(255, 255, 255, 0.5)',
                        borderRadius: '6px',
                        border: '1px solid rgba(212, 196, 168, 0.7)',
                        marginBottom: '8px',
                        width: '100%',
                        boxSizing: 'border-box',
                        flexShrink: 0
                      }}>
                        {visitor.designation && (
                          <div style={{ gridColumn: '1 / -1', lineHeight: 1.3 }}>
                            <span style={{ textTransform: 'uppercase', fontSize: '0.65rem', letterSpacing: '0.8px', color: '#8b7b6b', fontWeight: 700 }}>Designation: </span>
                            <span style={{ fontWeight: 600, color: '#1a0e05', fontSize: '0.85rem' }}>{visitor.designation}</span>
                          </div>
                        )}
                        {visitor.country && (
                          <div style={{ lineHeight: 1.3 }}>
                            <span style={{ textTransform: 'uppercase', fontSize: '0.65rem', letterSpacing: '0.8px', color: '#8b7b6b', fontWeight: 700 }}>Country: </span>
                            <span style={{ fontWeight: 600, color: '#1a0e05', fontSize: '0.85rem' }}>{visitor.country}</span>
                          </div>
                        )}
                        {visitor.visitDate && (
                          <div style={{ lineHeight: 1.3 }}>
                            <span style={{ textTransform: 'uppercase', fontSize: '0.65rem', letterSpacing: '0.8px', color: '#8b7b6b', fontWeight: 700 }}>Date of Visit: </span>
                            <span style={{ fontWeight: 600, color: '#1a0e05', fontSize: '0.85rem' }}>{visitor.visitDate}</span>
                          </div>
                        )}
                        {visitor.purpose && (
                          <div style={{ lineHeight: 1.3 }}>
                            <span style={{ textTransform: 'uppercase', fontSize: '0.65rem', letterSpacing: '0.8px', color: '#8b7b6b', fontWeight: 700 }}>Purpose: </span>
                            <span style={{ fontWeight: 600, color: '#1a0e05', fontSize: '0.85rem' }}>{visitor.purpose}</span>
                          </div>
                        )}
                        {visitor.department && (
                          <div style={{ lineHeight: 1.3 }}>
                            <span style={{ textTransform: 'uppercase', fontSize: '0.65rem', letterSpacing: '0.8px', color: '#8b7b6b', fontWeight: 700 }}>Department: </span>
                            <span style={{ fontWeight: 600, color: '#1a0e05', fontSize: '0.85rem' }}>{visitor.department}</span>
                          </div>
                        )}
                      </div>

                      {/* 3. Visual Media Block (Portrait & Autograph) */}
                      {(visitor.visitorImagePath || visitor.autographPath) && (
                        <div style={{
                          display: 'flex',
                          flexDirection: 'row',
                          alignItems: 'center',
                          justify: 'center',
                          gap: '12px',
                          width: '100%',
                          marginBottom: '8px',
                          flexShrink: 0
                        }}>
                          {/* Visitor Photo Frame */}
                          {visitor.visitorImagePath && (
                            <div style={{
                              padding: '4px',
                              background: '#fff',
                              border: '1px solid #d4c4a8',
                              borderRadius: '4px',
                              boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
                              display: 'flex',
                              alignItems: 'center',
                              justify: 'center',
                              flexShrink: 0
                            }}>
                              <img
                                src={getImageUrl(visitor.visitorImagePath)}
                                alt={vName}
                                style={{ maxHeight: '110px', maxWidth: '120px', objectFit: 'contain', borderRadius: '2px' }}
                                onError={(e) => { (e.target as HTMLElement).parentElement!.style.display = 'none'; }}
                              />
                            </div>
                          )}

                          {/* Autograph Signature Strip */}
                          {visitor.autographPath && (
                            <div style={{
                              flex: 1,
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              justify: 'center',
                              padding: '6px 10px',
                              backgroundColor: '#fff',
                              borderRadius: '4px',
                              border: '1px solid #d4c4a8',
                              boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
                            }}>
                              <img
                                src={getImageUrl(visitor.autographPath)}
                                alt={`${vName} autograph`}
                                style={{
                                  maxHeight: '60px',
                                  maxWidth: '100%',
                                  objectFit: 'contain',
                                  mixBlendMode: 'multiply',
                                  filter: 'contrast(1.2) brightness(0.95)'
                                }}
                                onError={(e) => { (e.target as HTMLElement).parentElement!.style.display = 'none'; }}
                              />
                              <span style={{
                                fontStyle: 'italic',
                                fontSize: '0.68rem',
                                color: '#8b7b6b',
                                marginTop: '2px',
                                fontFamily: '"Georgia", serif'
                              }}>
                                Original Autograph
                              </span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* 4. Historical Registry & Biographical Notes Block (Fills remaining height) */}
                      <div style={{
                        flex: 1,
                        width: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        justify: 'space-between',
                        minHeight: '110px',
                        backgroundColor: 'rgba(255, 255, 255, 0.65)',
                        borderRadius: '6px',
                        border: '1px solid rgba(212, 196, 168, 0.8)',
                        padding: '10px 12px',
                        boxSizing: 'border-box',
                        overflowY: 'auto'
                      }}>
                        <div>
                          <div style={{
                            display: 'flex',
                            justify: 'space-between',
                            alignItems: 'center',
                            borderBottom: '1px solid rgba(212, 196, 168, 0.6)',
                            paddingBottom: '4px',
                            marginBottom: '6px'
                          }}>
                            <span style={{ fontWeight: 700, color: '#8b7b6b', fontSize: '0.68rem', letterSpacing: '1px', textTransform: 'uppercase' }}>
                              📜 Archival Registry Record
                            </span>
                            {visitor.pageNumber && (
                              <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#b8860b' }}>
                                Folio #{visitor.pageNumber}
                              </span>
                            )}
                          </div>

                          <div style={{
                            fontSize: '0.82rem',
                            color: '#2a1a08',
                            lineHeight: '1.4',
                            fontFamily: "'Georgia', serif"
                          }}>
                            {visitor.aboutVisitor || visitor.notes || (
                              `Official historical visitor record cataloged in ${getLibraryName(visitor.visitDate, visitor.year)} Archives. Entry recorded for distinguished guest ${vName}${visitor.country ? ` hailing from ${visitor.country}` : ''}.`
                            )}
                          </div>
                        </div>

                        {/* Official Seal / Badge Footer */}
                        <div style={{
                          display: 'flex',
                          justify: 'space-between',
                          alignItems: 'center',
                          marginTop: '8px',
                          paddingTop: '4px',
                          borderTop: '1px dashed rgba(212, 196, 168, 0.7)',
                          fontSize: '0.65rem',
                          color: '#8b7b6b',
                          fontStyle: 'italic'
                        }}>
                          <span>Verified University Archival Entry</span>
                          <span style={{ color: '#b8860b', fontWeight: 600, fontStyle: 'normal' }}>AMU Archives</span>
                        </div>
                      </div>

                      {/* Page Number Badge */}
                      <div className="pdf-book-page-number" style={{ position: 'absolute', bottom: '6px', right: '10px' }}>
                        {idx + 2}
                      </div>
                    </div>
                  </div>
                );
              })}

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
