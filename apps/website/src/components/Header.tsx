import React, { useState } from 'react';
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
  onOpenMyLibrary,
}) => {
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const scrollToSection = (targetId: string) => {
    const el = document.getElementById(targetId) || document.querySelector(targetId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

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
          padding: '20px 48px',
          width: '100%',
          maxWidth: '1400px',
          margin: '0 auto',
          flexWrap: 'wrap',
          gap: '16px'
        }}
      >
      {/* 1. Left: Brand Logo & Title */}
      <div
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}
      >
        {/* Custom SVG Icon */}
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

      {/* 2. Middle: Navigation Links with Smooth Scrolling */}
      <nav style={{ display: 'flex', alignItems: 'center', gap: '28px', flexWrap: 'wrap' }}>
        <button
          onClick={() => scrollToSection('ebook-collection')}
          style={{
            background: 'none',
            border: 'none',
            fontSize: '0.78rem',
            fontWeight: 700,
            color: '#475569',
            letterSpacing: '1.2px',
            textTransform: 'uppercase',
            cursor: 'pointer',
            padding: '6px 0',
            transition: 'color 0.2s ease'
          }}
          onMouseOver={(e) => (e.currentTarget.style.color = '#b8860b')}
          onMouseOut={(e) => (e.currentTarget.style.color = '#475569')}
        >
          Ebook Collection
        </button>

        <button
          onClick={() => scrollToSection('visitor-book-archive')}
          style={{
            background: 'none',
            border: 'none',
            fontSize: '0.78rem',
            fontWeight: 700,
            color: '#475569',
            letterSpacing: '1.2px',
            textTransform: 'uppercase',
            cursor: 'pointer',
            padding: '6px 0',
            transition: 'color 0.2s ease'
          }}
          onMouseOver={(e) => (e.currentTarget.style.color = '#b8860b')}
          onMouseOut={(e) => (e.currentTarget.style.color = '#475569')}
        >
          Visitor Registry
        </button>

        <button
          onClick={() => scrollToSection('author-biography')}
          style={{
            background: 'none',
            border: 'none',
            fontSize: '0.78rem',
            fontWeight: 700,
            color: '#475569',
            letterSpacing: '1.2px',
            textTransform: 'uppercase',
            cursor: 'pointer',
            padding: '6px 0',
            transition: 'color 0.2s ease'
          }}
          onMouseOver={(e) => (e.currentTarget.style.color = '#b8860b')}
          onMouseOut={(e) => (e.currentTarget.style.color = '#475569')}
        >
          About Author
        </button>

        {currentUser && (
          <button
            onClick={onOpenMyLibrary}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '0.78rem',
              fontWeight: 700,
              color: '#3b0f1b',
              letterSpacing: '1.2px',
              textTransform: 'uppercase',
              cursor: 'pointer',
              padding: '6px 0',
              transition: 'color 0.2s ease'
            }}
            onMouseOver={(e) => (e.currentTarget.style.color = '#b8860b')}
            onMouseOut={(e) => (e.currentTarget.style.color = '#3b0f1b')}
          >
            📚 My Library
          </button>
        )}
      </nav>

      {/* 3. Right: Auth Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
        {currentUser ? (
          <>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#4a4a4a', letterSpacing: '1px', textTransform: 'uppercase' }}>
              {currentUser.name}
            </span>
            <button
              onClick={() => setShowLogoutConfirm(true)}
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

      {showLogoutConfirm && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(27, 42, 74, 0.45)', backdropFilter: 'blur(12px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div className="glass-card" style={{
            background: 'rgba(255, 255, 255, 0.96)', padding: '32px', borderRadius: '12px',
            boxShadow: '0 20px 48px -10px rgba(184, 134, 11, 0.25)', border: '1px solid rgba(212, 175, 55, 0.4)',
            maxWidth: '400px', width: '100%', textAlign: 'center'
          }}>
            <h3 style={{ fontSize: '1.25rem', color: '#1b2a4a', marginBottom: '16px', fontWeight: 800 }}>
              Confirm Logout
            </h3>
            <p style={{ color: '#5c6b73', marginBottom: '24px', fontSize: '0.9rem' }}>
              Are you sure you want to log out of your account?
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button 
                onClick={() => setShowLogoutConfirm(false)}
                style={{
                  padding: '10px 24px', borderRadius: '8px', border: '1px solid #d4cfc1',
                  background: '#fcfcfc', color: '#4a4a4a', fontWeight: 700, cursor: 'pointer'
                }}>
                Cancel
              </button>
              <button 
                onClick={() => {
                  setShowLogoutConfirm(false);
                  onLogout();
                }}
                style={{
                  padding: '10px 24px', borderRadius: '8px', border: 'none',
                  background: '#5a1827', color: '#fff', fontWeight: 700, cursor: 'pointer'
                }}>
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
