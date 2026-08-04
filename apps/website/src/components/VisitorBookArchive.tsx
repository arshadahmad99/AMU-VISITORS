import React, { useState } from 'react';
import { VisitorBookReaderModal } from './VisitorBookReaderModal';
import scrollBg from '../assets/royal-scroll-new.jpg';

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
          style={{
            backgroundColor: 'transparent',
            backgroundImage: `url(${scrollBg})`,
            backgroundSize: '135% 95%',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            padding: '24px 0',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100%',
            minHeight: '480px',
            // boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
            position: 'relative',
            borderRadius: '8px',
            perspective: '1500px',
            overflow: 'hidden'
          }}
        >
          {/* Inner container to perfectly align with the parchment area of the scroll */}
          <div style={{
            position: 'absolute',
            zIndex: 10,
            display: 'flex',
            flexDirection: 'column',
            top: '8%',
            bottom: '8%',
            left: '10%',
            right: '10%',
            padding: '24px',
            justifyContent: 'space-between',
            fontFamily: 'Georgia, serif',
            color: '#2b2013' // Dark ink color
          }}>
            {/* Search Bar - Styled minimally for the scroll */}
            <div style={{ position: 'relative', marginBottom: '16px', zIndex: 10 }}>
              <input
                type="text"
                placeholder="Search royal archives..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 0 8px 32px',
                  background: 'transparent',
                  border: 'none',
                  borderBottom: '1px solid rgba(43,32,19,0.3)',
                  fontSize: '1rem',
                  fontStyle: 'italic',
                  color: '#2b2013',
                  outline: 'none',
                  fontFamily: 'Georgia, serif',
                  transition: 'border-color 0.2s'
                }}
                onFocus={(e) => e.target.style.borderBottom = '1px solid rgba(43,32,19,0.8)'}
                onBlur={(e) => e.target.style.borderBottom = '1px solid rgba(43,32,19,0.3)'}
              />
              <span style={{ position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)', color: '#544230', fontSize: '1rem' }}>
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
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#544230', letterSpacing: '2px', textTransform: 'uppercase' }}>
                    100 years old visitor book of M.A Library AMU
                  </span>
                  <span style={{ fontSize: '1rem', color: '#2b2013', fontStyle: 'italic' }}>
                    1906-2008
                  </span>
                  <div style={{ height: '1px', width: '60px', background: '#544230', margin: '8px auto' }} />
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
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#68543f', letterSpacing: '2px', textTransform: 'uppercase' }}>
                    Designation
                  </span>
                  <span style={{ fontSize: '1.1rem', color: '#2b2013', fontStyle: 'italic' }}>
                    Chief Justice, Allahabad High Court
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '8px' }}>
                  <span style={{ fontSize: '1rem', color: '#2b2013' }}>
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
                <span style={{ fontSize: '0.7rem', color: '#68543f', letterSpacing: '3px', textTransform: 'uppercase', marginBottom: '8px' }}>
                  Autograph
                </span>
                <div style={{
                  fontFamily: 'cursive',
                  fontSize: '2.5rem',
                  color: '#1a140d',
                  transform: 'rotate(-4deg)',
                  opacity: 0.9,
                  borderBottom: '2px dashed rgba(43,32,19,0.3)',
                  paddingBottom: '8px',
                  paddingRight: '16px'
                }}>
                  H.L. Gokhale
                </div>
              </div>
            </div>

            {/* Footer Navigation */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: '16px' }}>
              <button
                onClick={handlePrev}
                disabled={currentIndex <= 1 || flipState !== 'none'}
                style={{
                  background: 'none',
                  border: 'none',
                  color: currentIndex <= 1 ? 'rgba(43,32,19,0.3)' : '#2b2013',
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
              <span style={{ fontSize: '0.85rem', color: '#544230', fontWeight: 600, fontStyle: 'italic' }}>
                Scroll {currentIndex} / {totalEntries}
              </span>
              <button
                onClick={handleNext}
                disabled={currentIndex >= totalEntries || flipState !== 'none'}
                style={{
                  background: 'none',
                  border: 'none',
                  color: currentIndex >= totalEntries ? 'rgba(43,32,19,0.3)' : '#2b2013',
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
