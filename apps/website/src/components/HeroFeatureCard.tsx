import React from 'react';
import ebookCoverImg from '../assets/ebook-cover.png';

interface HeroFeatureCardProps {
  onEnterLibrary?: () => void;
  onSeeCollection?: () => void;
}

export const HeroFeatureCard: React.FC<HeroFeatureCardProps> = ({
  onEnterLibrary,
  onSeeCollection,
}) => {
  const scrollToLibrary = () => {
    const element = document.querySelector('.three-col-layout');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div
      style={{
        width: '100%',
        margin: '24px 0 32px',
        backgroundColor: '#f6f0e4',
        backgroundImage: `
          linear-gradient(rgba(212, 196, 168, 0.18) 1px, transparent 1px),
          linear-gradient(90deg, rgba(212, 196, 168, 0.18) 1px, transparent 1px)
        `,
        backgroundSize: '28px 28px',
        borderRadius: '12px',
        border: '1px solid #e6dbcb',
        padding: '48px 64px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: '0 8px 30px rgba(0, 0, 0, 0.04)',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Left Text Block */}
      <div style={{ flex: 1, maxWidth: '580px', zIndex: 2 }}>
        <div
          style={{
            fontSize: '0.85rem',
            fontWeight: 600,
            color: '#b08d57',
            letterSpacing: '0.5px',
            fontFamily: 'var(--font-body)'
          }}
        >
          Est. 1920 · Aligarh Muslim University
        </div>

        <h1
          style={{
            fontSize: '2.7rem',
            fontWeight: 400,
            fontFamily: '"Playfair Display", "Georgia", serif',
            color: '#2e1219',
            lineHeight: '1.2',
            margin: '14px 0 18px',
            letterSpacing: '-0.5px'
          }}
        >
          The Maulana Azad Library, preserved and reopened.
        </h1>

        <p
          style={{
            fontSize: '1.02rem',
            color: '#5c4a40',
            lineHeight: '1.65',
            margin: '0 0 28px 0',
            maxWidth: '500px',
            fontFamily: 'var(--font-body)'
          }}
        >
          A century of institutional history and a visitors' register spanning 1906 to 2008, digitised page by page — read the way they were meant to be read.
        </p>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
          <button
            onClick={onEnterLibrary || scrollToLibrary}
            style={{
              backgroundColor: '#2b0c14',
              color: '#ffffff',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '4px',
              fontSize: '0.9rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: '0 4px 12px rgba(43, 12, 20, 0.25)'
            }}
            onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#421420')}
            onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#2b0c14')}
          >
            Enter the library
          </button>

          <button
            onClick={onSeeCollection || scrollToLibrary}
            style={{
              backgroundColor: 'rgba(238, 230, 218, 0.6)',
              color: '#36151e',
              border: '1px solid #dcd0bf',
              padding: '12px 24px',
              borderRadius: '4px',
              fontSize: '0.9rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseOver={(e) => (e.currentTarget.style.backgroundColor = 'rgba(230, 220, 205, 0.8)')}
            onMouseOut={(e) => (e.currentTarget.style.backgroundColor = 'rgba(238, 230, 218, 0.6)')}
          >
            See the collection
          </button>
        </div>
      </div>

      {/* Right 3D Floating Book Visual */}
      <div
        style={{
          perspective: '1200px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          paddingRight: '20px',
          zIndex: 2
        }}
      >
        <div
          style={{
            width: '240px',
            height: '340px',
            borderRadius: '4px 8px 8px 4px',
            transform: 'rotateY(-16deg) rotateX(4deg) rotateZ(1deg)',
            boxShadow: '25px 25px 50px rgba(40, 20, 10, 0.35), 8px 8px 15px rgba(0, 0, 0, 0.15)',
            transition: 'transform 0.4s ease, box-shadow 0.4s ease',
            position: 'relative',
            overflow: 'hidden',
            backgroundColor: '#3b0f1b'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.transform = 'rotateY(-8deg) rotateX(2deg) translateY(-6px)';
            e.currentTarget.style.boxShadow = '30px 30px 60px rgba(40, 20, 10, 0.4), 10px 10px 20px rgba(0, 0, 0, 0.2)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.transform = 'rotateY(-16deg) rotateX(4deg) rotateZ(1deg)';
            e.currentTarget.style.boxShadow = '25px 25px 50px rgba(40, 20, 10, 0.35), 8px 8px 15px rgba(0, 0, 0, 0.15)';
          }}
        >
          <img
            src={ebookCoverImg}
            alt="The Maulana Azad Library Book Cover"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              display: 'block'
            }}
          />
        </div>
      </div>
    </div>
  );
};
