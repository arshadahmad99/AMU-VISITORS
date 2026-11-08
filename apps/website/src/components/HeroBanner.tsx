import React, { useRef, useEffect } from 'react';
import heroVideo from '../assets/Create_video_which_zooms_in_on.mp4';

export const HeroBanner: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = 0.7;
    }
  }, []);

  return (
    <div
      style={{
        width: '100%',
        position: 'relative',
        overflow: 'visible',
        marginBottom: '40px' // Space for the floating badge
      }}
    >
      <div
        style={{
          width: '100%',
          height: '480px',
          maxHeight: '55vh',
          position: 'relative',
          overflow: 'hidden',
          borderRadius: '12px',
          boxShadow: '0 8px 30px rgba(0,0,0,0.15)',
          backgroundColor: '#040b16'
        }}
      >
        {/* Video Background */}
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0 }}>
          <video
            ref={videoRef}
            src={heroVideo}
            autoPlay
            loop
            muted
            playsInline
            preload="metadata"
            onLoadedMetadata={() => {
              if (videoRef.current) {
                videoRef.current.playbackRate = 0.7;
              }
            }}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
          {/* Subtle dark gradient for text readability */}
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.1) 40%, transparent 70%)' }} />
        </div>

        {/* Foreground Content */}
        <div style={{ position: 'absolute', bottom: 'clamp(24px, 4vw, 44px)', left: 'clamp(24px, 4vw, 48px)', zIndex: 1, textShadow: '0 2px 8px rgba(0,0,0,0.7)' }}>
          <h2
            style={{
              fontSize: 'clamp(2rem, 4vw, 3.2rem)',
              fontWeight: 700,
              fontFamily: 'var(--font-heading, "Cinzel", serif)',
              color: '#dfb76c',
              lineHeight: '1.1',
              margin: '0 0 6px 0',
              letterSpacing: '0.5px',
            }}
          >
            Maulana Azad Library
          </h2>
          <div
            style={{
              fontSize: 'clamp(0.95rem, 1.8vw, 1.25rem)',
              color: '#e2e8f0',
              fontWeight: 500,
              letterSpacing: '0.3px',
              fontFamily: 'var(--font-body)',
            }}
          >
            {/* ( Founded 1955, Inaugurated 1960) */}
          </div>
        </div>
      </div>

      {/* Floating Cursive Badge */}
      <div
        style={{
          position: 'absolute',
          bottom: '-24px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: '#ffffff',
          padding: 'clamp(8px, 1.8vw, 12px) clamp(16px, 3.5vw, 32px)',
          borderRadius: '30px',
          boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
          zIndex: 2,
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          maxWidth: '92%',
          whiteSpace: 'nowrap',
          boxSizing: 'border-box'
        }}
      >
        <span style={{ fontFamily: 'var(--font-cursive)', fontSize: 'clamp(1.05rem, 3.2vw, 1.4rem)', color: '#0b132b' }}></span>
        {/* <span style={{ fontSize: '1.2rem', color: '#c5a880' }}>•</span> */}
        <span style={{ fontFamily: 'var(--font-cursive)', fontSize: 'clamp(1.05rem, 3.2vw, 1.4rem)', color: '#0b132b' }}>Founded 1955, Inaugurated 1960</span>
      </div>
    </div>
  );
};
