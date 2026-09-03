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
          height: '380px',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
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
            onLoadedMetadata={() => {
              if (videoRef.current) {
                videoRef.current.playbackRate = 0.7;
              }
            }}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
          {/* Subtle dark gradient for text readability */}
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 60%)' }} />
        </div>

        {/* Foreground Content */}
        <div style={{ position: 'absolute', bottom: '40px', left: '48px', zIndex: 1, textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
          <p style={{ fontSize: '0.75rem', fontWeight: 700, color: '#e6e2d8', letterSpacing: '3px', textTransform: 'uppercase', marginBottom: '8px' }}>
            CENTRAL REPOSITORY
          </p>
          <h2
            style={{
              fontSize: '3.2rem',
              fontWeight: 400,
              fontFamily: 'var(--font-heading)',
              color: '#ffffff',
              lineHeight: '1.1',
              margin: 0
            }}
          >
            Maulana Azad Library
          </h2>
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
          padding: '12px 32px',
          borderRadius: '30px',
          boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
          zIndex: 2,
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}
      >
        <span style={{ fontFamily: 'var(--font-cursive)', fontSize: '1.4rem', color: '#0b132b' }}>Est. 1920</span>
        <span style={{ fontSize: '1.2rem', color: '#c5a880' }}>•</span>
        <span style={{ fontFamily: 'var(--font-cursive)', fontSize: '1.4rem', color: '#0b132b' }}>Preserving Universal Wisdom</span>
      </div>
    </div>
  );
};
