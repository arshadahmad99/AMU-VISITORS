import React, { useState, useEffect, useRef } from 'react';
import { User } from '@digital-library/types';

interface HeaderProps {
  currentUser: User | null;
  onOpenAuth: (mode?: 'login' | 'register') => void;
  onLogout: () => void;
  onOpenMyLibrary: () => void;
  onOpenChangePassword?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  onOpenAuth,
  onLogout,
  onOpenMyLibrary,
  onOpenChangePassword,
}) => {
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsProfileOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const getUserInitials = (name?: string) => {
    const parts = (name || 'User').trim().split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return (parts[0] || 'U').slice(0, 2).toUpperCase();
  };

  const scrollToSection = (targetId: string) => {
    setIsMobileMenuOpen(false);
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
        position: 'sticky',
        top: 0,
        zIndex: 500,
        boxShadow: '0 2px 10px rgba(0,0,0,0.03)'
      }}
    >
      <div
        className="header-container"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '18px 48px',
          width: '100%',
          maxWidth: '1400px',
          margin: '0 auto',
          gap: '16px',
          boxSizing: 'border-box'
        }}
      >
        {/* 1. Left: Brand Logo & Title */}
        <a
          href="/"
          onClick={(e) => {
            if (window.location.pathname === '/') {
              e.preventDefault();
              setIsMobileMenuOpen(false);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }
          }}
          style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', textDecoration: 'none' }}
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
            aria-hidden="true"
          >
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
            <path d="M8 2v10l3-3 3 3V2" />
          </svg>
          <span
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
            Maulana Azad Library
          </span>
        </a>

        {/* 2. Middle: Desktop Navigation Links */}
        <nav className="header-nav-desktop" aria-label="Primary navigation">
          {[
            { id: 'ebook-collection', label: 'Ebook' },
            { id: 'visitor-book-archive', label: 'Visitors Book' },
            { id: 'author-biography', label: 'About Author' },
          ].map((item) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              className="header-nav-link"
              onClick={(e) => {
                e.preventDefault();
                scrollToSection(item.id);
              }}
            >
              {item.label}
            </a>
          ))}
        </nav>

        {/* 3. Right: Desktop Auth Controls */}
        <div className="header-auth-desktop" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {currentUser ? (
            <div ref={profileDropdownRef} style={{ position: 'relative' }}>
              <button
                type="button"
                onClick={() => setIsProfileOpen((prev) => !prev)}
                aria-expanded={isProfileOpen}
                aria-haspopup="menu"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  background: '#ffffff',
                  border: '1px solid rgba(11, 19, 43, 0.12)',
                  borderRadius: '999px',
                  padding: '5px 14px 5px 6px',
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
                  transition: 'box-shadow 0.2s ease, border-color 0.2s ease',
                }}
              >
                <span
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: '#0b132b',
                    color: '#ffffff',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    letterSpacing: '0.5px',
                    flexShrink: 0,
                  }}
                >
                  {getUserInitials(currentUser.name)}
                </span>
                <span
                  style={{
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    color: '#111827',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {currentUser.name}
                </span>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#9ca3af"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{
                    transform: isProfileOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.2s ease',
                    flexShrink: 0,
                  }}
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>

              {isProfileOpen && (
                <div
                  role="menu"
                  aria-label="Profile options"
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 8px)',
                    right: 0,
                    width: '260px',
                    background: '#ffffff',
                    borderRadius: '14px',
                    boxShadow: '0 14px 36px rgba(15, 23, 42, 0.16), 0 2px 8px rgba(15, 23, 42, 0.06)',
                    border: '1px solid rgba(0, 0, 0, 0.06)',
                    overflow: 'hidden',
                    zIndex: 600,
                  }}
                >
                  {/* Profile Card Header */}
                  <button
                    type="button"
                    onClick={() => setIsProfileOpen(false)}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '16px 18px 12px',
                      background: '#ffffff',
                      border: 'none',
                      cursor: 'pointer',
                      textAlign: 'left',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                      <span
                        style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '50%',
                          background: '#0b132b',
                          color: '#ffffff',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.82rem',
                          fontWeight: 700,
                          letterSpacing: '0.5px',
                          flexShrink: 0,
                        }}
                      >
                        {getUserInitials(currentUser.name)}
                      </span>
                      <span
                        style={{
                          fontSize: '0.95rem',
                          fontWeight: 700,
                          color: '#111827',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {currentUser.name}
                      </span>
                    </div>
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#9ca3af"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      style={{ flexShrink: 0 }}
                    >
                      <polyline points="18 15 12 9 6 15" />
                    </svg>
                  </button>

                  {/* Menu Items */}
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setIsProfileOpen(false);
                      onOpenMyLibrary();
                    }}
                    style={{
                      width: '100%',
                      display: 'block',
                      textAlign: 'left',
                      padding: '14px 18px',
                      background: '#ffffff',
                      border: 'none',
                      borderBottom: '1px solid #f0f0f0',
                      fontSize: '0.92rem',
                      fontWeight: 700,
                      color: '#111827',
                      cursor: 'pointer',
                      transition: 'background 0.15s ease',
                    }}
                    onMouseOver={(e) => (e.currentTarget.style.background = '#f9fafb')}
                    onMouseOut={(e) => (e.currentTarget.style.background = '#ffffff')}
                  >
                    My Library
                  </button>

                  {onOpenChangePassword && (
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setIsProfileOpen(false);
                        onOpenChangePassword();
                      }}
                      style={{
                        width: '100%',
                        display: 'block',
                        textAlign: 'left',
                        padding: '14px 18px',
                        background: '#ffffff',
                        border: 'none',
                        borderBottom: '1px solid #f0f0f0',
                        fontSize: '0.92rem',
                        fontWeight: 700,
                        color: '#111827',
                        cursor: 'pointer',
                        transition: 'background 0.15s ease',
                      }}
                      onMouseOver={(e) => (e.currentTarget.style.background = '#f9fafb')}
                      onMouseOut={(e) => (e.currentTarget.style.background = '#ffffff')}
                    >
                      Change Password
                    </button>
                  )}

                  {/* Footer Log Out Row */}
                  <div
                    style={{
                      padding: '14px 18px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'flex-end',
                      background: '#ffffff',
                    }}
                  >
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setIsProfileOpen(false);
                        setShowLogoutConfirm(true);
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        padding: 0,
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        letterSpacing: '0.8px',
                        textTransform: 'uppercase',
                        color: '#e06356',
                        textDecoration: 'underline',
                        textUnderlineOffset: '3px',
                        cursor: 'pointer',
                      }}
                    >
                      LOG OUT
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <>
              <button
                onClick={() => onOpenAuth('login')}
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
                onClick={() => onOpenAuth('register')}
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

        {/* 4. Mobile Hamburger Button */}
        <button
          className="header-hamburger-btn"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Toggle navigation menu"
        >
          {isMobileMenuOpen ? (
            /* Close X Icon */
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          ) : (
            /* Hamburger 3-line Icon */
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          )}
        </button>
      </div>

      {/* 5. Mobile Dropdown Drawer */}
      {isMobileMenuOpen && (
        <nav className="header-mobile-drawer" aria-label="Mobile navigation">
          <a
            href="#ebook-collection"
            onClick={(e) => {
              e.preventDefault();
              scrollToSection('ebook-collection');
            }}
            style={{
              background: 'none',
              border: 'none',
              textAlign: 'left',
              fontSize: '0.9rem',
              fontWeight: 700,
              color: '#1a1a1a',
              letterSpacing: '1px',
              textTransform: 'uppercase',
              cursor: 'pointer',
              padding: '8px 0',
              borderBottom: '1px solid #f1f1f1',
              textDecoration: 'none'
            }}
          >
            📖 Ebook
          </a>

          <a
            href="#visitor-book-archive"
            onClick={(e) => {
              e.preventDefault();
              scrollToSection('visitor-book-archive');
            }}
            style={{
              background: 'none',
              border: 'none',
              textAlign: 'left',
              fontSize: '0.9rem',
              fontWeight: 700,
              color: '#1a1a1a',
              letterSpacing: '1px',
              textTransform: 'uppercase',
              cursor: 'pointer',
              padding: '8px 0',
              borderBottom: '1px solid #f1f1f1',
              textDecoration: 'none'
            }}
          >
            📜 Visitors Book
          </a>

          <a
            href="#author-biography"
            onClick={(e) => {
              e.preventDefault();
              scrollToSection('author-biography');
            }}
            style={{
              background: 'none',
              border: 'none',
              textAlign: 'left',
              fontSize: '0.9rem',
              fontWeight: 700,
              color: '#1a1a1a',
              letterSpacing: '1px',
              textTransform: 'uppercase',
              cursor: 'pointer',
              padding: '8px 0',
              borderBottom: '1px solid #f1f1f1',
              textDecoration: 'none'
            }}
          >
            ✍️ About Author
          </a>

          {currentUser && (
            <button
              onClick={() => {
                setIsMobileMenuOpen(false);
                onOpenMyLibrary();
              }}
              style={{
                background: 'none',
                border: 'none',
                textAlign: 'left',
                fontSize: '0.9rem',
                fontWeight: 700,
                color: '#3b0f1b',
                letterSpacing: '1px',
                textTransform: 'uppercase',
                cursor: 'pointer',
                padding: '8px 0',
                borderBottom: '1px solid #f1f1f1'
              }}
            >
              📚 My Library
            </button>
          )}

          {/* Mobile Auth Section */}
          <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {currentUser ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', paddingTop: '4px' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#4a4a4a', textTransform: 'uppercase' }}>
                  👤 {currentUser.name}
                </span>
                <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
                  {onOpenChangePassword && (
                    <button
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        onOpenChangePassword();
                      }}
                      style={{
                        flex: 1,
                        background: 'none',
                        border: '1px solid #d4cfc1',
                        padding: '8px 12px',
                        fontSize: '0.74rem',
                        fontWeight: 700,
                        letterSpacing: '0.8px',
                        textTransform: 'uppercase',
                        color: '#1a1a1a',
                        cursor: 'pointer',
                        borderRadius: '4px',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      🔑 Password
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      setShowLogoutConfirm(true);
                    }}
                    style={{
                      flex: 1,
                      background: '#0b132b',
                      color: '#fff',
                      border: 'none',
                      padding: '8px 20px',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      letterSpacing: '1px',
                      textTransform: 'uppercase',
                      cursor: 'pointer',
                      borderRadius: '4px'
                    }}
                  >
                    LOGOUT
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: '10px', width: '100%' }}>
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    onOpenAuth('login');
                  }}
                  style={{
                    flex: 1,
                    background: 'none',
                    border: '1px solid #0b132b',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    color: '#0b132b',
                    letterSpacing: '1.2px',
                    cursor: 'pointer',
                    textTransform: 'uppercase',
                    padding: '10px',
                    borderRadius: '4px'
                  }}
                >
                  LOGIN
                </button>
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    onOpenAuth('register');
                  }}
                  style={{
                    flex: 1,
                    background: '#0b132b',
                    color: '#fff',
                    border: 'none',
                    padding: '10px',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    letterSpacing: '1.2px',
                    textTransform: 'uppercase',
                    cursor: 'pointer',
                    borderRadius: '4px'
                  }}
                >
                  SIGN UP
                </button>
              </div>
            )}
          </div>
        </nav>
      )}

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
            <h2 style={{ fontSize: '1.25rem', color: '#1b2a4a', marginBottom: '16px', fontWeight: 800 }}>
              Confirm Logout
            </h2>
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
