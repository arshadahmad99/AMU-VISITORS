import React, { useState } from 'react';
import { VisitorBookReaderModal } from './VisitorBookReaderModal';
export const VisitorBookArchive: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(230);
  const totalEntries = 842;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [flipState, setFlipState] = useState<'none' | 'turning-out-next' | 'turning-in-next' | 'turning-out-prev' | 'turning-in-prev'>('none');

  const handlePrev = () => {
    if (currentIndex <= 1) return;
    setFlipState('turning-out-prev');
    setTimeout(() => {
      setCurrentIndex(prev => Math.max(1, prev - 1));
      setFlipState('turning-in-prev');
      setTimeout(() => {
        setFlipState('none');
      }, 50);
    }, 400); // Increased for realistic flip duration
  };

  const handleNext = () => {
    if (currentIndex >= totalEntries) return;
    setFlipState('turning-out-next');
    setTimeout(() => {
      setCurrentIndex(prev => Math.min(totalEntries, prev + 1));
      setFlipState('turning-in-next');
      setTimeout(() => {
        setFlipState('none');
      }, 50);
    }, 400); // Increased for realistic flip duration
  };

  let transform = 'rotateY(0deg) translateZ(0)';
  let transition = 'transform 0.4s cubic-bezier(0.25, 1, 0.5, 1), opacity 0.4s ease';
  let opacity = 1;
  let transformOrigin = 'left center';

  if (flipState === 'turning-out-next') {
    transform = 'rotateY(-90deg) translateZ(50px)';
    transformOrigin = 'left center';
    opacity = 0;
  } else if (flipState === 'turning-in-next') {
    transform = 'rotateY(90deg) translateZ(50px)';
    transformOrigin = 'right center';
    transition = 'none';
    opacity = 0;
  } else if (flipState === 'turning-out-prev') {
    transform = 'rotateY(90deg) translateZ(50px)';
    transformOrigin = 'right center';
    opacity = 0;
  } else if (flipState === 'turning-in-prev') {
    transform = 'rotateY(-90deg) translateZ(50px)';
    transformOrigin = 'left center';
    transition = 'none';
    opacity = 0;
  }

  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', fontFamily: 'var(--font-body)', padding: '16px 0' }}>

        {/* Main Card */}
        <div
          className="glass-card"
          style={{
            padding: '32px 24px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            alignItems: 'center',
            height: '100%',
            minHeight: '480px',
            position: 'relative',
            borderRadius: '12px',
            perspective: '1500px',
            overflow: 'hidden',
            fontFamily: 'var(--font-body)',
            color: 'var(--text-primary)'
          }}
        >
          {/* Inner container */}
          <div style={{
            position: 'relative',
            zIndex: 10,
            display: 'flex',
            flexDirection: 'column',
            width: '100%',
            height: '100%',
            justifyContent: 'space-between',
          }}>
            {/* Search Bar */}
            <div style={{ position: 'relative', marginBottom: '16px', zIndex: 10 }}>
              <input
                type="text"
                placeholder="Search visitor archives..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 0 10px 32px',
                  background: 'transparent',
                  border: 'none',
                  borderBottom: '1px solid var(--border-light)',
                  fontSize: '0.95rem',
                  color: 'var(--text-primary)',
                  outline: 'none',
                  transition: 'border-color 0.2s'
                }}
                onFocus={(e) => e.target.style.borderBottom = '1px solid var(--accent-gold)'}
                onBlur={(e) => e.target.style.borderBottom = '1px solid var(--border-light)'}
              />
              <span style={{ position: 'absolute', left: 4, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: '1.2rem' }}>
                ⚲
              </span>
            </div>

            {/* Animated Page Content */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              transform,
              transition,
              opacity,
              transformOrigin,
              transformStyle: 'preserve-3d',
              willChange: 'transform, opacity'
            }}>
              {/* Header Section */}
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'center' }}>
                  <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))' }}>
                    {/* Dark outline */}
                    <rect x="6" y="8" width="36" height="32" fill="#3D2B1F" rx="2" />
                    
                    {/* Top wooden roller */}
                    <rect x="4" y="6" width="40" height="8" fill="#8B4513" rx="2" />
                    <rect x="6" y="8" width="36" height="4" fill="#A0522D" rx="1" />
                    
                    {/* Bottom wooden roller */}
                    <rect x="4" y="34" width="40" height="8" fill="#8B4513" rx="2" />
                    <rect x="6" y="36" width="36" height="4" fill="#A0522D" rx="1" />
                    
                    {/* Parchment Paper */}
                    <rect x="8" y="14" width="32" height="20" fill="#F4E4BC" />
                    
                    {/* Inner Paper Shadow */}
                    <rect x="8" y="14" width="32" height="2" fill="#DEB887" />
                    <rect x="8" y="32" width="32" height="2" fill="#DEB887" />
                    
                    {/* Text lines */}
                    <rect x="14" y="18" width="20" height="2" fill="#D2B48C" />
                    <rect x="14" y="22" width="16" height="2" fill="#D2B48C" />
                    <rect x="14" y="26" width="12" height="2" fill="#D2B48C" />
                  </svg>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', letterSpacing: '1px', textTransform: 'uppercase' }}>
                      100 Years Old Visitor Book
                    </span>
                    <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                      M.A Library AMU (1906-2008)
                    </span>
                    <div style={{ height: '1px', width: '40px', background: 'var(--accent-gold)', margin: '8px auto' }} />
                  </div>
                </div>
              </div>

              {/* Details Section */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', marginTop: '8px', textAlign: 'center' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#68543f', letterSpacing: '2px', textTransform: 'uppercase' }}>
                    Visitor's Name
                  </span>
                  <span style={{ fontSize: '1.8rem', color: '#1a140d', fontWeight: 500, lineHeight: 1.2 }}>
                    Hon. H.L. Gokhale
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '1.5px', textTransform: 'uppercase' }}>
                    Designation
                  </span>
                  <span style={{ fontSize: '1.1rem', color: 'var(--text-primary)' }}>
                    Chief Justice, Allahabad High Court
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '8px' }}>
                  <span style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>
                    17 February 2008
                  </span>
                </div>
              </div>

              {/* Autograph / Card Container */}
              <div
                onClick={() => setIsModalOpen(true)}
                style={{
                  width: '100%',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'transform 0.2s',
                  marginTop: '16px'
                }}
                onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.03)'}
                onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                title="Click to view full manuscript"
              >
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '8px' }}>
                  Autograph
                </span>
                <div style={{
                  fontFamily: 'var(--font-cursive)',
                  fontSize: '2.5rem',
                  color: 'var(--text-primary)',
                  transform: 'rotate(-4deg)',
                  opacity: 0.9,
                  borderBottom: '2px dashed var(--border-light)',
                  paddingBottom: '8px',
                  paddingRight: '16px'
                }}>
                  H.L. Gokhale
                </div>
              </div>
            </div>

            {/* Footer Navigation */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid var(--border-light)' }}>
              <button
                onClick={handlePrev}
                disabled={currentIndex <= 1 || flipState !== 'none'}
                style={{
                  background: 'none',
                  border: 'none',
                  color: currentIndex <= 1 ? 'var(--text-muted)' : 'var(--text-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: currentIndex <= 1 ? 'not-allowed' : 'pointer',
                  fontSize: '1.2rem',
                  fontWeight: 500,
                  transition: 'opacity 0.2s'
                }}
              >
                ⟵
              </button>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600, fontStyle: 'italic' }}>
                Record {currentIndex} / {totalEntries}
              </span>
              <button
                onClick={handleNext}
                disabled={currentIndex >= totalEntries || flipState !== 'none'}
                style={{
                  background: 'none',
                  border: 'none',
                  color: currentIndex >= totalEntries ? 'var(--text-muted)' : 'var(--text-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: currentIndex >= totalEntries ? 'not-allowed' : 'pointer',
                  fontSize: '1.2rem',
                  fontWeight: 500,
                  transition: 'opacity 0.2s'
                }}
              >
                ⟶
              </button>
            </div>
          </div>
        </div>
      </div>

      <VisitorBookReaderModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
};
