import React, { useState, useEffect, useRef } from 'react';
import { VisitorRecord } from '@digital-library/types';
import { fetchVisitors } from '../services/api';
// @ts-ignore
import HTMLFlipBook from 'react-pageflip';

const PageCover = React.forwardRef<HTMLDivElement, { children?: React.ReactNode; isBack?: boolean }>((props, ref) => {
  return (
    <div 
      className="demoPage" 
      ref={ref}
      style={{
        backgroundColor: '#2e1a09', 
        backgroundImage: 'url(/images/leather-cover.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        color: '#d4af37', // Gold color
        display: 'flex', 
        flexDirection: 'column',
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100%', 
        border: '1px solid #1a0f05', 
        boxShadow: props.isBack ? 'inset 0 0 100px rgba(0,0,0,0.8), 10px 0 20px rgba(0,0,0,0.5)' : 'inset 0 0 100px rgba(0,0,0,0.8), -10px 0 20px rgba(0,0,0,0.5)',
        textShadow: '1px 1px 2px rgba(0,0,0,0.8), 0 0 10px rgba(212,175,55,0.3)',
        padding: '40px'
      }}
    >
      {props.children}
    </div>
  );
});

const Page = React.forwardRef<HTMLDivElement, { children: React.ReactNode; number: number }>((props, ref) => {
  return (
    <div 
      className="demoPage" 
      ref={ref}
      style={{
        backgroundColor: '#ffffff', // Basic white page color
        boxShadow: 'inset 0 0 40px rgba(0,0,0,0.05)', // Subtle inner shadow
        border: '1px solid #e0e0e0', 
        padding: '32px',
        height: '100%',
        overflow: 'hidden',
        fontFamily: '"Playfair Display", "Georgia", serif',
        color: '#3e2a14',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <div style={{
        position: 'absolute',
        top: 0,
        bottom: 0,
        left: props.number % 2 === 0 ? 'auto' : 0,
        right: props.number % 2 === 0 ? 0 : 'auto',
        width: '30px',
        background: props.number % 2 === 0 
          ? 'linear-gradient(to left, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0) 100%)' 
          : 'linear-gradient(to right, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0) 100%)',
        pointerEvents: 'none'
      }} />
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {props.children}
      </div>
      <div style={{ 
        position: 'absolute', 
        bottom: '16px', 
        right: props.number % 2 === 0 ? 'auto' : '16px',
        left: props.number % 2 === 0 ? '16px' : 'auto',
        fontSize: '0.8rem',
        color: '#8b7b6b'
      }}>
        {props.number}
      </div>
    </div>
  );
});

export const VisitorBookArchive: React.FC = () => {
  const [visitors, setVisitors] = useState<VisitorRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  const bookRef = useRef<any>(null);

  useEffect(() => {
    loadVisitors();
  }, []);

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

  const filteredVisitors = visitors
    .filter(v => 
      v.visitorName.toLowerCase().includes(searchQuery.toLowerCase()) || 
      (v.designation && v.designation.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (v.country && v.country.toLowerCase().includes(searchQuery.toLowerCase()))
    )
    .reduce((unique, current) => {
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
          height: '750px', // Fixed height
          boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
      }}>
        
        {/* Header & Search */}
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '24px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'center' }}>
            <div style={{ position: 'relative', width: '300px' }}>
              <input
                type="text"
                placeholder="Search by name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
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
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1, backgroundColor: '#e9e4df', borderRadius: '8px', overflow: 'hidden' }}>
          {loading ? (
            <div style={{ color: 'var(--text-muted)' }}>Loading visitor records...</div>
          ) : filteredVisitors.length === 0 ? (
            <div style={{ color: '#888' }}>No visitors found matching your search.</div>
          ) : (
            <HTMLFlipBook 
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
              style={{ margin: '0 auto', boxShadow: '0 0 20px rgba(0,0,0,0.5)' }}
            >
              {/* Cover Page */}
              <PageCover>
                <div style={{ textAlign: 'center', letterSpacing: '2px', lineHeight: '1.5', fontFamily: '"Arial", sans-serif' }}>
                  <h2 style={{ fontSize: '1.4rem', margin: 0, fontWeight: 500, fontFamily: 'Arial, sans-serif' }}>
                    MAULANA AZAD LIBRARY<br/>
                    ALIGARH MUSLIM UNIVERSITY
                  </h2>
                  
                  <div style={{ margin: '60px 0', fontSize: '1.2rem', fontFamily: 'Arial, sans-serif' }}>
                    102 YEARS OLD
                  </div>
                  
                  <h1 style={{ fontSize: '2.5rem', margin: 0, fontWeight: 700, fontFamily: 'Arial, sans-serif', letterSpacing: '4px' }}>
                    VISITORS BOOK
                  </h1>
                  
                  <div style={{ marginTop: '20px', fontSize: '1.5rem', fontFamily: 'Arial, sans-serif' }}>
                    1906 - 2008
                  </div>
                </div>
              </PageCover>

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
                      <h3 style={{ 
                        margin: '0 0 12px 0', 
                        fontSize: '1.8rem', 
                        fontFamily: '"Playfair Display", "Georgia", serif',
                        fontStyle: 'italic', 
                        fontWeight: 700, 
                        color: '#2e1a09', 
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
                      fontSize: '0.95rem', 
                      fontFamily: '"Georgia", serif',
                      color: '#4a3622', 
                      marginBottom: '24px',
                      textAlign: 'center'
                    }}>
                      {visitor.designation && <div><span style={{ textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '1px', color: '#8b7b6b' }}>Designation:</span> {visitor.designation}</div>}
                      {visitor.country && <div><span style={{ textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '1px', color: '#8b7b6b' }}>Country:</span> {visitor.country}</div>}
                      <div><span style={{ textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '1px', color: '#8b7b6b' }}>Date of Visit:</span> {visitor.visitDate}</div>
                    </div>
                    
                    {/* Media Container */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px', width: '100%' }}>
                      {visitor.visitorImagePath && (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                          <div style={{
                            padding: '10px 10px 30px 10px',
                            backgroundColor: '#fff',
                            border: '1px solid #e0d0b8',
                            boxShadow: '0 4px 15px rgba(0,0,0,0.1), 0 1px 3px rgba(0,0,0,0.05)',
                            transform: 'rotate(-2deg)',
                            position: 'relative'
                          }}>
                            <img 
                              src={visitor.visitorImagePath} 
                              alt={`${visitor.visitorName}`}
                              style={{ width: '160px', height: '200px', objectFit: 'cover', filter: 'sepia(20%)' }}
                              onError={(e) => { e.currentTarget.src = `http://localhost:5000${visitor.visitorImagePath}`; }}
                            />
                            <div style={{ position: 'absolute', bottom: '8px', width: '100%', textAlign: 'center', left: 0, fontSize: '0.7rem', color: '#888', fontStyle: 'italic', fontFamily: '"Courier New", Courier, monospace' }}>
                              Distinguished Guest
                            </div>
                          </div>
                        </div>
                      )}

                      {visitor.autographPath && (
                        <div style={{ width: '100%', marginTop: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                          <span style={{ fontFamily: '"Georgia", serif', fontStyle: 'italic', fontSize: '0.8rem', color: '#8b7b6b', marginBottom: '8px' }}>Original Signature</span>
                          <img 
                            src={visitor.autographPath} 
                            alt={`${visitor.visitorName} autograph`}
                            onClick={() => setZoomedImage(visitor.autographPath)}
                            title="Click to zoom"
                            style={{ maxWidth: '100%', maxHeight: '100px', objectFit: 'contain', mixBlendMode: 'multiply', opacity: 0.85, cursor: 'zoom-in' }}
                            onError={(e) => { e.currentTarget.src = `http://localhost:5000${visitor.autographPath}`; }}
                          />
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
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '24px' }}>
          <div style={{ display: 'flex', gap: '16px' }}>
            <button 
              onClick={() => bookRef.current?.pageFlip()?.flipPrev()} 
              style={{ 
                padding: '6px 20px', 
                cursor: 'pointer', 
                backgroundColor: '#fdf8f0', 
                color: '#3e2a14', 
                border: '1px solid #d4c4a8', 
                borderRadius: '4px', 
                fontFamily: '"Playfair Display", "Georgia", serif',
                fontWeight: 600,
                fontSize: '0.9rem',
                whiteSpace: 'nowrap',
                boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                transition: 'all 0.2s ease'
              }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f4ebd8'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#fdf8f0'}
            >
              « Previous Page
            </button>
            <button 
              onClick={() => bookRef.current?.pageFlip()?.flipNext()} 
              style={{ 
                padding: '6px 20px', 
                cursor: 'pointer', 
                backgroundColor: '#fdf8f0', 
                color: '#3e2a14', 
                border: '1px solid #d4c4a8', 
                borderRadius: '4px', 
                fontFamily: '"Playfair Display", "Georgia", serif',
                fontWeight: 600,
                fontSize: '0.9rem',
                whiteSpace: 'nowrap',
                boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                transition: 'all 0.2s ease'
              }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f4ebd8'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#fdf8f0'}
            >
              Next Page »
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
