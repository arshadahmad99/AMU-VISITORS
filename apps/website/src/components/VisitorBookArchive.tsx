import React, { useState, useEffect, useRef, useMemo } from 'react';
import { VisitorRecord } from '@digital-library/types';
import { fetchVisitors } from '../services/api';
import { getLibraryName } from './RealisticVisitorBookReader';
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
          alt="131 Years Old Visitors Book - Maulana Azad Library Aligarh Muslim University 1877-2008"
          loading="lazy"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transform: 'scaleY(1.06)',
            transformOrigin: 'center',
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
        backgroundColor: '#f6d3b2',
        backgroundImage: 'none',
        boxShadow: props.number % 2 === 0
          ? 'inset 15px 0 25px -10px rgba(0,0,0,0.15), inset -5px 0 10px rgba(0,0,0,0.05)'
          : 'inset -15px 0 25px -10px rgba(0,0,0,0.15), inset 5px 0 10px rgba(0,0,0,0.05)',
        border: '1px solid #dcd1b5',
        padding: '16px 16px 28px 16px',
        height: '100%',
        overflow: 'hidden',
        fontFamily: '"Playfair Display", "Georgia", serif',
        color: '#2e1c0c',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        boxSizing: 'border-box'
      }}
    >
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
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {props.children}
      </div>
      <div style={{
        position: 'absolute',
        bottom: '6px',
        right: props.number % 2 === 0 ? 'auto' : '20px',
        left: props.number % 2 === 0 ? '20px' : 'auto',
        fontSize: '0.82rem',
        fontFamily: '"Playfair Display", "Georgia", serif',
        fontStyle: 'italic',
        color: '#7a6246',
        zIndex: 10,
        fontWeight: 600
      }}>
        — {props.number} —
      </div>
    </div>
  );
});

const failedUrlsSet = new Set<string>();

const VisitorImageComponent = ({ visitor, compact }: { visitor: VisitorRecord; compact?: boolean }) => {
  const path = visitor.visitorImagePath;
  const [, forceUpdate] = useState({});

  if (!path || failedUrlsSet.has(path)) return null;

  const width = compact ? '110px' : '130px';
  const height = compact ? '135px' : '160px';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: compact ? '4px' : '8px' }}>
      <div style={{
        padding: compact ? '6px 6px 18px 6px' : '8px 8px 24px 8px',
        backgroundColor: '#fff',
        border: '1px solid #e0d0b8',
        boxShadow: '0 4px 15px rgba(0,0,0,0.1), 0 1px 3px rgba(0,0,0,0.05)',
        transform: 'rotate(-2deg)',
        position: 'relative'
      }}>
        <img
          src={path}
          alt={`${visitor.visitorName}`}
          loading="lazy"
          style={{ width, height, objectFit: 'cover', filter: 'sepia(20%)' }}
          onError={(e) => {
            e.currentTarget.onerror = null;
            failedUrlsSet.add(path);
            forceUpdate({});
          }}
        />
        <div style={{ position: 'absolute', bottom: compact ? '3px' : '6px', width: '100%', textAlign: 'center', left: 0, fontSize: compact ? '0.7rem' : '0.75rem', color: '#888', fontStyle: 'italic', fontFamily: "'Dancing Script', cursive" }}>
          Distinguished Guest
        </div>
      </div>
    </div>
  );
};

const SignatureZoom = ({ visitor, setZoomedImage }: any) => {
  const imgRef = useRef<HTMLImageElement>(null);
  const [, forceUpdate] = useState({});
  const path = visitor.autographPath;

  useEffect(() => {
    const el = imgRef.current;
    if (!el) return;
    const stop = (e: Event) => {
      e.stopPropagation();
    };
    el.addEventListener('pointerdown', stop);
    el.addEventListener('mousedown', stop);
    el.addEventListener('touchstart', stop);

    return () => {
      el.removeEventListener('pointerdown', stop);
      el.removeEventListener('mousedown', stop);
      el.removeEventListener('touchstart', stop);
    };
  }, []);

  if (!path || failedUrlsSet.has(path)) return null;

  return (
    <div style={{ width: '100%', marginTop: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <span style={{ fontFamily: '"Playfair Display", "Georgia", serif', fontStyle: 'italic', fontSize: '0.8rem', color: '#8b7b6b', marginBottom: '4px' }}>Original Signature</span>
      <img
        ref={imgRef}
        src={path}
        alt={`${visitor.visitorName} autograph`}
        loading="lazy"
        onClick={(e) => {
          e.stopPropagation();
          setZoomedImage(path);
        }}
        title="Click to zoom"
        style={{ maxWidth: '100%', maxHeight: '90px', objectFit: 'contain', mixBlendMode: 'multiply', opacity: 0.85, cursor: 'zoom-in', position: 'relative', zIndex: 10 }}
        onError={(e) => {
          e.currentTarget.onerror = null;
          failedUrlsSet.add(path);
          forceUpdate({});
        }}
      />
    </div>
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
        } catch (e) { }
      }, 300);
    }
  }, [searchQuery, filteredVisitors.length]);

  if (!hasPurchased) {
    return (
      <div id="visitor-book-archive" className="glass-card" style={{ padding: '24px', flex: 1, display: 'flex', flexDirection: 'column', height: '100%' }}>
        {/* Header Title */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700, color: '#1b2a4a', fontFamily: 'var(--font-heading)' }}>
              📜 Visitor Registry
            </h2>
            <span style={{ fontSize: '0.72rem', color: '#fff', background: '#b8860b', padding: '2px 8px', borderRadius: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              1877–2008
            </span>
          </div>
          <span style={{ fontSize: '0.75rem', color: '#8c95a3', fontFamily: 'var(--font-body)' }}>
            🔒 Sealed Archive
          </span>
        </div>

        {/* Large Full-Bleed Book Cover Presentation Container */}
        <div
          onClick={!isLoggedIn ? onRequireAuth : () => window.scrollTo({ top: 400, behavior: 'smooth' })}
          style={{
            flex: 1,
            position: 'relative',
            width: '100%',
            minHeight: '540px',
            borderRadius: '8px',
            overflow: 'hidden',
            cursor: 'pointer',
            boxShadow: '0 8px 30px rgba(0,0,0,0.15)',
            border: '1px solid #d4c4a8',
            backgroundColor: '#2d1b0f',
            transition: 'transform 0.25s ease, box-shadow 0.25s ease',
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 12px 35px rgba(0,0,0,0.22)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 8px 30px rgba(0,0,0,0.15)';
          }}
        >
          {/* Book Spine Edge effect */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              bottom: 0,
              width: '24px',
              background: 'linear-gradient(to right, rgba(0,0,0,0.65), rgba(255,255,255,0.12) 40%, rgba(0,0,0,0.45))',
              zIndex: 3,
            }}
          />

          {/* Book Cover Image - Full Fill */}
          <img
            src={visitorBookCoverImg}
            alt="102 Years Old Visitors Book Cover Page"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              display: 'block',
            }}
          />

          {/* Subtle Gradient Overlay to accentuate locked status & button */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'linear-gradient(to top, rgba(11, 19, 43, 0.94) 0%, rgba(11, 19, 43, 0.45) 50%, rgba(0,0,0,0.15) 100%)',
              zIndex: 2,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'flex-end',
              alignItems: 'center',
              padding: '28px 24px',
              textAlign: 'center',
            }}
          >
            {/* Lock Badge */}
            <div
              style={{
                width: '52px',
                height: '52px',
                borderRadius: '50%',
                backgroundColor: 'rgba(212, 175, 55, 0.25)',
                border: '1.5px solid #dfb76c',
                backdropFilter: 'blur(8px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '14px',
                fontSize: '1.5rem',
                boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
              }}
            >
              🔒
            </div>

            <h3
              style={{
                margin: '0 0 6px 0',
                color: '#fdfcf0',
                fontSize: '1.45rem',
                fontFamily: 'var(--font-heading)',
                fontWeight: 600,
                letterSpacing: '0.5px',
              }}
            >
              102 Years Old Visitors Book
            </h3>

            <p
              style={{
                margin: '0 0 20px 0',
                color: '#c5a880',
                fontSize: '0.9rem',
                fontFamily: 'var(--font-body)',
                lineHeight: 1.4,
              }}
            >
              Historical signatures & entries (1906–2008)
            </p>

            {!isLoggedIn ? (
              <button
                className="btn-gradient"
                onClick={(e) => {
                  e.stopPropagation();
                  onRequireAuth();
                }}
                style={{
                  width: '100%',
                  maxWidth: '320px',
                  padding: '14px 20px',
                  fontSize: '0.88rem',
                  fontWeight: 700,
                  letterSpacing: '1px',
                  borderRadius: '4px',
                  backgroundColor: '#dfb76c',
                  color: '#0b132b',
                  border: 'none',
                  boxShadow: '0 4px 18px rgba(223, 183, 108, 0.35)',
                  cursor: 'pointer',
                }}
              >
                LOG IN TO UNLOCK REGISTRY
              </button>
            ) : (
              <button
                className="btn-gradient"
                onClick={(e) => {
                  e.stopPropagation();
                  window.scrollTo({ top: 400, behavior: 'smooth' });
                }}
                style={{
                  width: '100%',
                  maxWidth: '320px',
                  padding: '14px 20px',
                  fontSize: '0.88rem',
                  fontWeight: 700,
                  letterSpacing: '1px',
                  borderRadius: '4px',
                  backgroundColor: '#dfb76c',
                  color: '#0b132b',
                  border: 'none',
                  boxShadow: '0 4px 18px rgba(223, 183, 108, 0.35)',
                  cursor: 'pointer',
                }}
              >
                ACQUIRE E-BOOK TO UNLOCK
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div id="visitor-book-archive" style={{ display: 'flex', flexDirection: 'column', height: '100%', fontFamily: 'var(--font-body)', padding: '24px 0' }}>
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
                    backgroundColor: '#f6f0e4',
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
                        {getLibraryName(visitor.visitDate, visitor.year)}
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
                      gap: '4px',
                      fontSize: '1.05rem',
                      color: '#4a3622',
                      marginBottom: visitor.aboutVisitor ? '10px' : '18px',
                      textAlign: 'center'
                    }}>
                      {visitor.designation && (
                        <div>
                          <span style={{ fontFamily: '"Playfair Display", "Georgia", serif', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '1px', color: '#8b7b6b', fontWeight: 600 }}>Designation: </span>
                          <span style={{ fontFamily: "'Dancing Script', cursive", fontSize: '1.2rem', fontWeight: 600, color: '#1a0e05' }}>{visitor.designation}</span>
                        </div>
                      )}
                      {visitor.country && (
                        <div>
                          <span style={{ fontFamily: '"Playfair Display", "Georgia", serif', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '1px', color: '#8b7b6b', fontWeight: 600 }}>Country: </span>
                          <span style={{ fontFamily: "'Dancing Script', cursive", fontSize: '1.2rem', fontWeight: 600, color: '#1a0e05' }}>{visitor.country}</span>
                        </div>
                      )}
                      <div>
                        <span style={{ fontFamily: '"Playfair Display", "Georgia", serif', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '1px', color: '#8b7b6b', fontWeight: 600 }}>Date of Visit: </span>
                        <span style={{ fontFamily: "'Dancing Script', cursive", fontSize: '1.2rem', fontWeight: 600, color: '#1a0e05' }}>{visitor.visitDate}</span>
                      </div>
                    </div>

                    {/* Media Container */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', width: '100%', flex: 1 }}>
                      <VisitorImageComponent visitor={visitor} compact={true} />

                      <div style={{
                        width: '100%',
                        marginTop: 'auto',
                        marginBottom: '4px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        padding: '8px 12px',
                        backgroundColor: 'rgba(255, 255, 255, 0.45)',
                        borderRadius: '6px',
                        border: '1px solid rgba(212, 196, 168, 0.6)',
                        height: '90px',
                        maxHeight: '100px',
                        overflowY: 'auto',
                        boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.04)',
                        boxSizing: 'border-box'
                      }}>
                        {/* <span style={{ fontFamily: '"Playfair Display", "Georgia", serif', fontStyle: 'italic', fontSize: '0.8rem', color: '#8b7b6b', marginBottom: '8px' }}>Original Signature</span> */}
                        {/* <SignatureZoom visitor={visitor} setZoomedImage={setZoomedImage} /> */}
                        <div style={{ width: '100%', textAlign: 'left' }}>
                          <span style={{ fontFamily: '"Playfair Display", "Georgia", serif', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '1px', color: '#8b7b6b', fontWeight: 600 }}>About Visitor: </span>
                          {visitor.aboutVisitor && (
                            <span style={{ fontFamily: "'Dancing Script', cursive", fontSize: '1.15rem', fontWeight: 600, color: '#1a0e05', lineHeight: '1.35' }}>{visitor.aboutVisitor}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', width: '100%', flex: 1 }}>
                      <VisitorImageComponent visitor={visitor} />

                      {visitor.autographPath && (
                        <div style={{ width: '100%', marginTop: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                          <span style={{ fontFamily: '"Playfair Display", "Georgia", serif', fontStyle: 'italic', fontSize: '0.8rem', color: '#8b7b6b', marginBottom: '8px' }}>Original Signature</span>
                          <SignatureZoom visitor={visitor} setZoomedImage={setZoomedImage} />
                        </div>
                      )}
                    </div> */}
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
              onError={(e) => {
                e.currentTarget.onerror = null;
                setZoomedImage(null);
              }}
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
