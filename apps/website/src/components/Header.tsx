import React from 'react';
import { User } from '@digital-library/types';

interface HeaderProps {
  currentUser: User | null;
  onOpenAuth: () => void;
  onLogout: () => void;
  onOpenMyLibrary: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  onOpenAuth,
  onLogout,
}) => {
  return (
    <header
      style={{
        width: '100%',
        background: '#fcfcfc',
        borderBottom: '1px solid rgba(212, 207, 193, 0.4)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '24px 48px',
          width: '100%',
          maxWidth: '1400px',
          margin: '0 auto',
        }}
      >
      {/* 1. Left: Brand Logo & Title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {/* Custom SVG Icon to match the screenshot */}
        <svg 
          width="28" 
          height="28" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="#0b132b" 
          strokeWidth="1.5" 
          strokeLinecap="round" 
          strokeLinejoin="round"
        >
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
          <path d="M8 2v10l3-3 3 3V2" />
        </svg>
        <h1 
          style={{ 
            fontSize: '1.25rem', 
            fontWeight: 700, 
            fontFamily: 'var(--font-heading)', 
            color: '#0b132b', 
            letterSpacing: '2.5px',
            textTransform: 'uppercase',
            margin: 0,
            marginTop: '2px'
          }}
        >
          AMUMALibrary
        </h1>
      </div>

      {/* 2. Right: Auth Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
        {currentUser ? (
          <>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#4a4a4a', letterSpacing: '1px', textTransform: 'uppercase' }}>
              {currentUser.name}
            </span>
            <button
              onClick={onLogout}
              style={{
                background: '#0b132b',
                color: '#fff',
                border: 'none',
                padding: '10px 24px',
                fontSize: '0.75rem',
                fontWeight: 700,
                letterSpacing: '1px',
                textTransform: 'uppercase',
                cursor: 'pointer',
                transition: 'background 0.2s'
              }}
              onMouseOver={(e) => (e.target as HTMLButtonElement).style.background = '#1c2541'}
              onMouseOut={(e) => (e.target as HTMLButtonElement).style.background = '#0b132b'}
            >
              LOGOUT
            </button>
          </>
        ) : (
          <>
            <button 
              onClick={onOpenAuth}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '0.75rem',
                fontWeight: 700,
                color: '#4a4a4a',
                letterSpacing: '1.5px',
                cursor: 'pointer',
                textTransform: 'uppercase',
                padding: '10px 0'
              }}
            >
              LOGIN
            </button>
            <button 
              onClick={onOpenAuth}
              style={{
                background: '#0b132b',
                color: '#fff',
                border: 'none',
                padding: '12px 28px',
                fontSize: '0.75rem',
                fontWeight: 700,
                letterSpacing: '1.5px',
                textTransform: 'uppercase',
                cursor: 'pointer',
                transition: 'background 0.2s',
                marginLeft: '8px'
              }}
              onMouseOver={(e) => (e.target as HTMLButtonElement).style.background = '#1c2541'}
              onMouseOut={(e) => (e.target as HTMLButtonElement).style.background = '#0b132b'}
            >
              SIGN UP
            </button>
          </>
        )}
      </div>
      </div>
    </header>
  );
};
