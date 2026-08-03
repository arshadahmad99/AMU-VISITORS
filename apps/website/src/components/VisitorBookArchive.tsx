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
    }, 250);
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
    }, 250);
  };

  let transform = 'rotateY(0deg)';
  let transition = 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s ease';
  let opacity = 1;

  if (flipState === 'turning-out-next') {
    transform = 'rotateY(-90deg)';
    opacity = 0;
  } else if (flipState === 'turning-in-next') {
    transform = 'rotateY(90deg)';
    transition = 'none';
    opacity = 0;
  } else if (flipState === 'turning-out-prev') {
    transform = 'rotateY(90deg)';
    opacity = 0;
  } else if (flipState === 'turning-in-prev') {
    transform = 'rotateY(-90deg)';
    transition = 'none';
    opacity = 0;
  }

  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', fontFamily: 'var(--font-body)', padding: '16px 0' }}>
        
        {/* Main Card */}
        <div
          style={{
            backgroundColor: '#ffffff',
            padding: '12px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            height: '100%',
            boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
            border: '1px solid rgba(0,0,0,0.05)',
            position: 'relative',
            borderRadius: '4px',
            perspective: '1500px'
          }}
        >
          {/* Search Bar */}
          <div style={{ position: 'relative', marginBottom: '8px', zIndex: 10 }}>
            <input
              type="text"
              placeholder="Search visitor archives..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 0 12px 32px',
                background: 'transparent',
                border: 'none',
                borderBottom: '1px solid rgba(0,0,0,0.1)',
                fontSize: '0.9rem',
                fontStyle: 'italic',
                color: '#334155',
                outline: 'none',
                fontFamily: 'var(--font-body)',
                transition: 'border-color 0.2s'
              }}
              onFocus={(e) => e.target.style.borderBottom = '1px solid #b8924b'}
              onBlur={(e) => e.target.style.borderBottom = '1px solid rgba(0,0,0,0.1)'}
            />
            <span style={{ position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', fontSize: '1rem' }}>
              🔍
            </span>
          </div>

          {/* Animated Page Content */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '32px',
            transform,
            transition,
            opacity,
            transformOrigin: 'center',
            transformStyle: 'preserve-3d',
            willChange: 'transform, opacity'
          }}>
            {/* Header Section */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#b8924b', letterSpacing: '2px' }}>
                  OFFICIAL VISITOR ENTRY • VOL. XVIII
                </span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '12px' }}>
                  <span style={{ fontSize: '0.9rem', color: '#4b6c9b', fontFamily: 'var(--font-heading)', fontWeight: 600 }}>
                    Maulana Azad Library
                  </span>
                  <span style={{ fontSize: '0.65rem', color: '#6b7280', letterSpacing: '1px', textTransform: 'uppercase' }}>
                    ALIGARH MUSLIM UNIVERSITY
                  </span>
                </div>
              </div>
              
              {/* Passport Photo Placeholder */}
              <div style={{ 
                width: '60px', 
                height: '80px', 
                background: '#e5e7eb', 
                padding: '4px',
                backgroundColor: '#fff',
                border: '1px solid #d1d5db',
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                transform: 'rotate(2deg)'
              }}>
                <div style={{ width: '100%', height: '100%', backgroundColor: '#9ca3af', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '0.7rem', textAlign: 'center' }}>
                  [PHOTO]
                </div>
              </div>
            </div>

            {/* Details Section */}
            <div style={{ display: 'flex', gap: '40px', marginTop: '16px' }}>
              {/* Left Column */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ fontSize: '0.6rem', fontWeight: 600, color: '#9ca3af', letterSpacing: '1px', textTransform: 'uppercase' }}>
                    VISITOR'S NAME
                  </span>
                  <span style={{ fontSize: '1.4rem', color: '#032b5e', fontFamily: 'var(--font-heading)', fontWeight: 500 }}>
                    Hon. H.L. Gokhale
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <span style={{ fontSize: '0.65rem', fontWeight: 600, color: '#9ca3af', letterSpacing: '1.5px', textTransform: 'uppercase' }}>
                    VISITING DATE
                  </span>
                  <span style={{ fontSize: '0.95rem', color: '#032b5e', fontFamily: 'var(--font-heading)' }}>
                    17 February 2008
                  </span>
                </div>
              </div>

              {/* Right Column */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <span style={{ fontSize: '0.65rem', fontWeight: 600, color: '#9ca3af', letterSpacing: '1.5px', textTransform: 'uppercase' }}>
                    DESIGNATION
                  </span>
                  <span style={{ fontSize: '0.95rem', color: '#032b5e', fontFamily: 'var(--font-heading)', fontStyle: 'italic', lineHeight: '1.4' }}>
                    Chief Justice,<br/>Allahabad High Court
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '16px', marginTop: 'auto' }}>
                  <span style={{ fontSize: '0.7rem', color: '#6b7280' }}>Page No. {currentIndex}</span>
                  <span style={{ fontSize: '0.7rem', color: '#6b7280' }}>Ref: #AMU-LIB-2008-0{currentIndex}</span>
                </div>
              </div>
            </div>

            {/* Autograph Divider */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', margin: '16px 0' }}>
              <div style={{ flex: 1, height: '1px', background: 'rgba(0,0,0,0.06)' }} />
              <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#b8924b', letterSpacing: '3px', textTransform: 'uppercase' }}>
                AUTOGRAPH OF VISITOR
              </span>
              <div style={{ flex: 1, height: '1px', background: 'rgba(0,0,0,0.06)' }} />
            </div>

            {/* Autograph / Card Container */}
            <div 
              onClick={() => setIsModalOpen(true)}
              style={{ 
                width: '100%', 
                backgroundColor: '#f8fafc',
                border: '1px solid #f1f5f9',
                padding: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                cursor: 'pointer',
                minHeight: '100px',
                boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.02)'
              }}
              title="Click to open 3D Visitor Book"
            >
              {/* The main screenshot mockup box */}
              <div style={{ 
                width: '90%', 
                height: '60px', 
                background: '#e5e7eb', 
                border: '2px solid #fff', 
                boxShadow: '0 8px 20px rgba(0,0,0,0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#9ca3af',
                fontSize: '0.9rem',
                fontWeight: 600
              }}>
                [AUTOGRAPH RECORD SCREENSHOT]
              </div>

              {/* Archival Stamp */}
              <div style={{
                position: 'absolute',
                bottom: '20px',
                right: '20px',
                transform: 'rotate(-15deg)',
                border: '2px solid #94a3b8',
                padding: '8px 16px',
                color: '#94a3b8',
                fontSize: '1.2rem',
                fontFamily: 'var(--font-heading)',
                fontWeight: 700,
                letterSpacing: '4px',
                opacity: 0.6
              }}>
                ARCHIVAL ENTRY
              </div>
            </div>
          </div>

          {/* Footer Navigation */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px', paddingTop: '12px', borderTop: '1px solid rgba(0,0,0,0.06)' }}>
            <button 
              onClick={handlePrev}
              disabled={currentIndex <= 1 || flipState !== 'none'}
              style={{ background: 'none', border: 'none', color: currentIndex <= 1 ? '#cbd5e1' : '#334155', display: 'flex', alignItems: 'center', gap: '8px', cursor: currentIndex <= 1 ? 'not-allowed' : 'pointer', fontSize: '0.85rem', fontWeight: 500 }}
            >
              ← Previous
            </button>
            <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 500 }}>
              Entry {currentIndex} of {totalEntries}
            </span>
            <button 
              onClick={handleNext}
              disabled={currentIndex >= totalEntries || flipState !== 'none'}
              style={{ background: 'none', border: 'none', color: currentIndex >= totalEntries ? '#cbd5e1' : '#334155', display: 'flex', alignItems: 'center', gap: '8px', cursor: currentIndex >= totalEntries ? 'not-allowed' : 'pointer', fontSize: '0.85rem', fontWeight: 500 }}
            >
              Next →
            </button>
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
