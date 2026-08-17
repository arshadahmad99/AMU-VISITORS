import React, { useState, useEffect, useRef } from 'react';
import { VisitorRecord } from '@digital-library/types';
import { fetchVisitors } from '../services/api';
// @ts-ignore
import HTMLFlipBook from 'react-pageflip';

import visitorBookCoverImg from '../assets/visitor-book-cover.png';

const PageCover = React.forwardRef<HTMLDivElement, { children?: React.ReactNode; isBack?: boolean }>((props, ref) => {
  if (!props.isBack) {
    return (
      <div 
        className="demoPage" 
        ref={ref}
        style={{
          backgroundColor: '#2d1b0f',
          position: 'relative',
          height: '100%',
          overflow: 'hidden',
          boxShadow: 'inset 4px 0 10px rgba(0,0,0,0.6), 8px 8px 24px rgba(0,0,0,0.5)',
          borderRadius: '0 6px 6px 0',
        }}
      >
        <img 
          src={visitorBookCoverImg} 
          alt="102 Years Old Visitors Book - Maulana Azad Library Aligarh Muslim University 1906-2008" 
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: 'block'
          }} 
        />
      </div>
    );
  }

  return (
    <div 
      className="demoPage" 
      ref={ref}
      style={{
        backgroundColor: '#2b1a0d',
        backgroundImage: 'linear-gradient(135deg, rgba(30,18,9,0.95) 0%, rgba(55,34,18,0.95) 50%, rgba(20,12,6,0.98) 100%)',
        color: '#dfb45b',
        display: 'flex', 
        flexDirection: 'column',
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100%', 
        border: '1px solid #1a0e06', 
        boxShadow: 'inset 0 0 100px rgba(0,0,0,0.9), -10px 0 20px rgba(0,0,0,0.6)',
        padding: '24px',
        position: 'relative',
        borderRadius: '6px 0 0 6px'
      }}
    >
      <div style={{
        border: '3px double #b8860b',
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        boxShadow: 'inset 0 0 30px rgba(0,0,0,0.7)',
        background: 'rgba(0,0,0,0.15)'
      }}>
        {props.children || (
          <div style={{ textAlign: 'center', fontFamily: '"Georgia", serif', color: '#c5a059' }}>
            <div style={{ fontSize: '1.5rem', marginBottom: '12px' }}>✦</div>
            <div style={{ fontSize: '1.05rem', letterSpacing: '2px', fontWeight: 'bold', textTransform: 'uppercase' }}>MAULANA AZAD LIBRARY</div>
            <div style={{ fontSize: '0.85rem', letterSpacing: '1px', opacity: 0.85, marginTop: '4px' }}>ALIGARH MUSLIM UNIVERSITY</div>
            <div style={{ marginTop: '28px', fontSize: '0.8rem', fontStyle: 'italic', opacity: 0.7 }}>102 Years Old Visitors Book (1906 - 2008)</div>
          </div>
        )}
      </div>
    </div>
  );
});

const Page = React.forwardRef<HTMLDivElement, { children: React.ReactNode; number: number }>((props, ref) => {
  return (
    <div 
      className="demoPage" 
      ref={ref}
      style={{
        backgroundColor: '#f7f1e1', // Aged parchment paper color
        backgroundImage: 'radial-gradient(ellipse at center, rgba(255,255,255,0.4) 0%, rgba(220,205,175,0.35) 100%)',
        boxShadow: props.number % 2 === 0 
          ? 'inset 15px 0 25px -10px rgba(0,0,0,0.15), inset -5px 0 10px rgba(0,0,0,0.05)'
          : 'inset -15px 0 25px -10px rgba(0,0,0,0.15), inset 5px 0 10px rgba(0,0,0,0.05)',
        border: '1px solid #dcd1b5', 
        padding: '28px',
        height: '100%',
        overflow: 'hidden',
        fontFamily: '"Playfair Display", "Georgia", serif',
        color: '#2e1c0c',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      {/* Book Spine Shadow Overlay */}
      <div style={{
        position: 'absolute',
        top: 0,
        bottom: 0,
        left: props.number % 2 === 0 ? 'auto' : 0,
        right: props.number % 2 === 0 ? 0 : 'auto',
        width: '35px',
        background: props.number % 2 === 0 
          ? 'linear-gradient(to left, rgba(40,25,10,0.2) 0%, rgba(40,25,10,0.05) 50%, rgba(0,0,0,0) 100%)' 
          : 'linear-gradient(to right, rgba(40,25,10,0.2) 0%, rgba(40,25,10,0.05) 50%, rgba(0,0,0,0) 100%)',
        pointerEvents: 'none',
        zIndex: 5
      }} />
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {props.children}
      </div>
      <div style={{ 
        position: 'absolute', 
        bottom: '12px', 
        right: props.number % 2 === 0 ? 'auto' : '20px',
        left: props.number % 2 === 0 ? '20px' : 'auto',
        fontSize: '0.85rem',
        fontFamily: '"Playfair Display", "Georgia", serif',
        fontStyle: 'italic',
        color: '#8c7355',
        zIndex: 6
      }}>
        — {props.number} —
      </div>
    </div>
  );
});

const SignatureZoom = ({ visitor, setZoomedImage }: any) => {
  const imgRef = useRef<HTMLImageElement>(null);
  
  useEffect(() => {
    const el = imgRef.current;
    if (!el) return;
    const stop = (e: Event) => {
      e.stopPropagation();
    };
    // Use native events to stop propagation before react-pageflip catches them on the wrapper
    el.addEventListener('pointerdown', stop);
    el.addEventListener('mousedown', stop);
    el.addEventListener('touchstart', stop);
    
    return () => {
      el.removeEventListener('pointerdown', stop);
      el.removeEventListener('mousedown', stop);
      el.removeEventListener('touchstart', stop);
    };
  }, []);

  return (
    <img 
      ref={imgRef}
      src={visitor.autographPath} 
      alt={`${visitor.visitorName} autograph`}
      onClick={(e) => {
        // Also stop React's propagation just in case
        e.stopPropagation();
        setZoomedImage(visitor.autographPath);
      }}
      title="Click to zoom"
      style={{ maxWidth: '100%', maxHeight: '100px', objectFit: 'contain', mixBlendMode: 'multiply', opacity: 0.85, cursor: 'zoom-in', position: 'relative', zIndex: 10 }}
      onError={(e) => { e.currentTarget.src = `http://localhost:5000${visitor.autographPath}`; }}
    />
  );
};

interface VisitorBookArchiveProps {
  hasPurchased: boolean;
  isLoggedIn: boolean;
  onRequireAuth: () => void;
}

export const VisitorBookArchive: React.FC<VisitorBookArchiveProps> = ({ hasPurchased, isLoggedIn, onRequireAuth }) => {
  const [visitors, setVisitors] = useState<VisitorRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  const bookRef = useRef<any>(null);

  useEffect(() => {
    loadVisitors();
  }, []);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(searchInput);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const loadVisitors = async () => {
    setLoading(true);
    try {
      const data = await fetchVisitors();
      setVisitors(data);
    } catch (err) {
      console.error('Failed to load visitors', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredVisitors = visitors.filter(v => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      (v.visitorName && v.visitorName.toLowerCase().includes(q)) ||
      (v.country && v.country.toLowerCase().includes(q)) ||
      (v.designation && v.designation.toLowerCase().includes(q)) ||
      (v.visitDate && v.visitDate.includes(q))
    );
  }).reduce((unique, current) => {
      const existingIdx = unique.findIndex(u => u.visitorName === current.visitorName);
      if (existingIdx !== -1) {
        if (!unique[existingIdx].autographPath && current.autographPath) {
          unique[existingIdx] = current;
        }
      } else {
        unique.push(current);
      }
      return unique;
    }, [] as VisitorRecord[]);

  useEffect(() => {
    if (searchQuery.trim().length > 0) {
      setTimeout(() => {
        try {
          if (bookRef.current?.pageFlip()?.getCurrentPageIndex() === 0) {
            bookRef.current.pageFlip().turnToPage(1);
          }
        } catch (e) {}
      }, 300);
    }
  }, [searchQuery, filteredVisitors.length]);

  if (!hasPurchased) {
    return (
      <div className="glass-card" style={{ padding: '24px', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700, color: '#1b2a4a' }}>📜 Visitor Registry</h2>
          <span style={{ fontSize: '0.75rem', color: '#fff', background: '#d4af37', padding: '2px 8px', borderRadius: '12px', fontWeight: 600 }}>Exclusive</span>
        </div>
        
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '20px', background: 'rgba(255,255,255,0.5)', borderRadius: '8px', border: '1px dashed #d4c4a8' }}>
          <span style={{ fontSize: '3.5rem', marginBottom: '12px', filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.1))' }}>🔒</span>
          <h3 style={{ margin: '0 0 12px 0', color: '#1b2a4a', fontSize: '1.4rem', fontFamily: '"Outfit", sans-serif' }}>Access Restricted</h3>
          <p style={{ color: '#5c6b73', fontSize: '0.95rem', marginBottom: '24px', maxWidth: '80%', lineHeight: 1.5 }}>
            The historic Visitor Registry is a complimentary feature available exclusively to patrons who have purchased at least one eBook from our library.
          </p>
          {!isLoggedIn ? (
            <button className="btn-gradient" onClick={onRequireAuth} style={{ padding: '12px 28px', fontSize: '1rem', fontWeight: 600 }}>
              Log In to Access
            </button>
          ) : (
            <button 
              className="btn-gradient" 
              onClick={() => { window.scrollTo({ top: 0, behavior: 'smooth' }) }} 
              style={{ padding: '12px 28px', fontSize: '1rem', fontWeight: 600 }}
            >
              Browse Library
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', fontFamily: 'var(--font-body)', padding: '24px 0' }}>
      {/* Container */}
      <div style={{
          backgroundColor: 'var(--bg-card, #ffffff)',
          border: '1px solid var(--border-light, #eaeaea)',
          borderRadius: '12px',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
      }}>
        
        {/* Header & Search */}
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'center' }}>
            <div style={{ position: 'relative', width: '300px' }}>
              <input
                type="text"
                placeholder="Search by name..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 16px 8px 40px',
                  borderRadius: '4px',
                  border: '1px solid #d4c4a8',
                  backgroundColor: '#fdf8f0',
                  color: '#3e2a14',
                  fontFamily: '"Playfair Display", "Georgia", serif',
                  fontSize: '0.95rem',
                  outline: 'none',
                  boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.02)'
                }}
              />
              <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#8b7b6b', fontSize: '1.2rem' }}>
                ⚲
              </span>
            </div>
            <div style={{ display: 'flex', gap: '16px' }}>
              {/* Buttons moved to bottom */}
            </div>
          </div>
        </div>

        {/* List Content */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          flex: 1, 
          width: '100%',
          overflow: 'hidden' 
        }}>
          {loading ? (
            <div style={{ color: '#8c7355', fontFamily: '"Georgia", serif', fontStyle: 'italic' }}>Loading historic visitor records...</div>
          ) : filteredVisitors.length === 0 ? (
            <div style={{ color: '#8c7355', fontFamily: '"Georgia", serif' }}>No visitors found matching your search.</div>
          ) : (
            <HTMLFlipBook 
              key={searchQuery + filteredVisitors.length}
              width={450} 
              height={600} 
              size="stretch"
              minWidth={315}
              maxWidth={1000}
              minHeight={400}
              maxHeight={800}
              maxShadowOpacity={0.5}
              showCover={true}
              mobileScrollSupport={true}
              ref={bookRef}
              className="visitor-flipbook"
              style={{ margin: '0 auto', boxShadow: '0 10px 25px rgba(0,0,0,0.25), 0 2px 8px rgba(0,0,0,0.15)' }}
            >
              {/* Front Cover Page */}
              <PageCover key="front-cover" />

              {/* Data Pages */}
              {filteredVisitors.map((visitor, index) => (
                <Page key={visitor.id} number={index + 1}>
                  {/* Decorative Border & Content Wrapper */}
                  <div style={{
                    border: '1px solid #d4c4a8',
                    padding: '24px',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    background: 'linear-gradient(to bottom, transparent, rgba(212,196,168,0.1))',
                  }}>
                    
                    {/* Header: Visitor Name */}
                    <div style={{ textAlign: 'center', marginBottom: '16px', width: '100%' }}>
                      <div style={{
                        fontFamily: "'UnifrakturMaguntia', cursive",
                        fontSize: '1.2rem',
                        color: '#4a3622',
                        marginBottom: '4px',
                        letterSpacing: '0.5px'
                      }}>
                        Maulana Azad Library
                      </div>

                      <h3 style={{ 
                        margin: '0 0 12px 0', 
                        fontSize: '2.1rem', 
                        fontFamily: "'Dancing Script', cursive",
                        fontWeight: 700, 
                        color: '#1a0e05', 
                        lineHeight: 1.2 
                      }}>
                        {visitor.visitorName}
                      </h3>
                      {/* Ornamental Divider */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                        <div style={{ height: '1px', flex: 1, backgroundColor: '#d4c4a8' }}></div>
                        <span style={{ color: '#d4af37', fontSize: '0.8rem' }}>✦</span>
                        <div style={{ height: '1px', flex: 1, backgroundColor: '#d4c4a8' }}></div>
                      </div>
                    </div>

                    {/* Visitor Metadata */}
                    <div style={{ 
                      display: 'flex', 
                      flexDirection: 'column', 
                      alignItems: 'center',
                      gap: '6px', 
                      fontSize: '1.05rem', 
                      color: '#4a3622', 
                      marginBottom: '20px',
                      textAlign: 'center'
                    }}>
                      {visitor.designation && (
                        <div>
                          <span style={{ fontFamily: '"Playfair Display", "Georgia", serif', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '1px', color: '#8b7b6b', fontWeight: 600 }}>Designation: </span>
                          <span style={{ fontFamily: "'Dancing Script', cursive", fontSize: '1.25rem', fontWeight: 600, color: '#1a0e05' }}>{visitor.designation}</span>
                        </div>
                      )}
                      {visitor.country && (
                        <div>
                          <span style={{ fontFamily: '"Playfair Display", "Georgia", serif', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '1px', color: '#8b7b6b', fontWeight: 600 }}>Country: </span>
                          <span style={{ fontFamily: "'Dancing Script', cursive", fontSize: '1.25rem', fontWeight: 600, color: '#1a0e05' }}>{visitor.country}</span>
                        </div>
                      )}
                      <div>
                        <span style={{ fontFamily: '"Playfair Display", "Georgia", serif', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '1px', color: '#8b7b6b', fontWeight: 600 }}>Date of Visit: </span>
                        <span style={{ fontFamily: "'Dancing Script', cursive", fontSize: '1.25rem', fontWeight: 600, color: '#1a0e05' }}>{visitor.visitDate}</span>
                      </div>
                    </div>
                    
                    {/* Media Container */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', width: '100%', flex: 1 }}>
                      {visitor.visitorImagePath && (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                          <div style={{
                            padding: '8px 8px 24px 8px',
                            backgroundColor: '#fff',
                            border: '1px solid #e0d0b8',
                            boxShadow: '0 4px 15px rgba(0,0,0,0.1), 0 1px 3px rgba(0,0,0,0.05)',
                            transform: 'rotate(-2deg)',
                            position: 'relative'
                          }}>
                            <img 
                              src={visitor.visitorImagePath} 
                              alt={`${visitor.visitorName}`}
                              style={{ width: '150px', height: '190px', objectFit: 'cover', filter: 'sepia(20%)' }}
                              onError={(e) => { e.currentTarget.src = `http://localhost:5000${visitor.visitorImagePath}`; }}
                            />
                            <div style={{ position: 'absolute', bottom: '6px', width: '100%', textAlign: 'center', left: 0, fontSize: '0.75rem', color: '#888', fontStyle: 'italic', fontFamily: "'Dancing Script', cursive" }}>
                              Distinguished Guest
                            </div>
                          </div>
                        </div>
                      )}

                      {visitor.autographPath && (
                        <div style={{ width: '100%', marginTop: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                          <span style={{ fontFamily: '"Playfair Display", "Georgia", serif', fontStyle: 'italic', fontSize: '0.8rem', color: '#8b7b6b', marginBottom: '8px' }}>Original Signature</span>
                          <SignatureZoom visitor={visitor} setZoomedImage={setZoomedImage} />
                        </div>
                      )}
                    </div>
                  </div>
                </Page>
              ))}

              {/* Back Cover */}
              <PageCover isBack={true} />
            </HTMLFlipBook>
          )}
        </div>

        {/* Bottom Controls */}
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '16px', width: '100%' }}>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'nowrap', justifyContent: 'center', width: '100%' }}>
            <button 
              onClick={() => bookRef.current?.pageFlip()?.turnToPage(0)} 
              style={{ 
                padding: '6px 8px', 
                cursor: 'pointer', 
                backgroundColor: '#fdf8f0', 
                color: '#3e2a14', 
                border: '1px solid #d4c4a8', 
                borderRadius: '4px', 
                fontFamily: '"Playfair Display", "Georgia", serif',
                fontWeight: 600,
                fontSize: '0.8rem',
                whiteSpace: 'nowrap',
                boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                transition: 'all 0.2s ease',
                flex: '1 1 auto',
                textAlign: 'center'
              }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f4ebd8'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#fdf8f0'}
              title="Go to First Page"
            >
              «« First Page
            </button>
            <button 
              onClick={() => bookRef.current?.pageFlip()?.flipPrev()} 
              style={{ 
                padding: '6px 8px', 
                cursor: 'pointer', 
                backgroundColor: '#fdf8f0', 
                color: '#3e2a14', 
                border: '1px solid #d4c4a8', 
                borderRadius: '4px', 
                fontFamily: '"Playfair Display", "Georgia", serif',
                fontWeight: 600,
                fontSize: '0.8rem',
                whiteSpace: 'nowrap',
                boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                transition: 'all 0.2s ease',
                flex: '1 1 auto',
                textAlign: 'center'
              }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f4ebd8'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#fdf8f0'}
            >
              « Prev Page
            </button>
            <button 
              onClick={() => bookRef.current?.pageFlip()?.flipNext()} 
              style={{ 
                padding: '6px 8px', 
                cursor: 'pointer', 
                backgroundColor: '#fdf8f0', 
                color: '#3e2a14', 
                border: '1px solid #d4c4a8', 
                borderRadius: '4px', 
                fontFamily: '"Playfair Display", "Georgia", serif',
                fontWeight: 600,
                fontSize: '0.8rem',
                whiteSpace: 'nowrap',
                boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                transition: 'all 0.2s ease',
                flex: '1 1 auto',
                textAlign: 'center'
              }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f4ebd8'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#fdf8f0'}
            >
              Next Page »
            </button>
            <button 
              onClick={() => bookRef.current?.pageFlip()?.turnToPage(filteredVisitors.length + 1)} 
              style={{ 
                padding: '6px 8px', 
                cursor: 'pointer', 
                backgroundColor: '#fdf8f0', 
                color: '#3e2a14', 
                border: '1px solid #d4c4a8', 
                borderRadius: '4px', 
                fontFamily: '"Playfair Display", "Georgia", serif',
                fontWeight: 600,
                fontSize: '0.8rem',
                whiteSpace: 'nowrap',
                boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                transition: 'all 0.2s ease',
                flex: '1 1 auto',
                textAlign: 'center'
              }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f4ebd8'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#fdf8f0'}
              title="Go to Last Page"
            >
              Last Page »»
            </button>
          </div>
        </div>
      </div>

      {/* Zoom Modal Overlay */}
      {zoomedImage && (
        <div 
          onClick={() => setZoomedImage(null)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(0,0,0,0.85)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 9999,
            cursor: 'zoom-out'
          }}
        >
          <div style={{ position: 'relative', maxWidth: '90%', maxHeight: '90%' }}>
            <img 
              src={zoomedImage} 
              alt="Zoomed Signature"
              style={{ 
                maxWidth: '100%', 
                maxHeight: '80vh', 
                objectFit: 'contain',
                backgroundColor: '#fff',
                padding: '24px',
                borderRadius: '8px',
                boxShadow: '0 10px 40px rgba(0,0,0,0.5)'
              }}
              onError={(e) => { e.currentTarget.src = `http://localhost:5000${zoomedImage}`; }}
            />
            <div style={{ position: 'absolute', top: '-40px', right: 0, color: '#fff', fontSize: '1.2rem', fontFamily: 'sans-serif' }}>
              Click anywhere to close ✕
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
