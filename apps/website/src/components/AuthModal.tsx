import React, { useState } from 'react';
import { loginWithEmail, socialLogin, setAuthToken, setSavedUser } from '../services/api';
import { User } from '@digital-library/types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: User) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    try {
      const data = await loginWithEmail(email, password);
      setAuthToken(data.token);
      setSavedUser(data.user);
      onSuccess(data.user);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSocialAuth = async (provider: 'google' | 'microsoft' | 'apple' | 'facebook') => {
    setLoading(true);
    setErrorMsg('');
    try {
      const data = await socialLogin(provider);
      setAuthToken(data.token);
      setSavedUser(data.user);
      onSuccess(data.user);
      onClose();
    } catch (err: any) {
      setErrorMsg('Social login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(27, 42, 74, 0.45)',
        backdropFilter: 'blur(12px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 200,
      }}
    >
      <div
        className="glass-card"
        style={{
          width: '100%',
          maxWidth: '440px',
          padding: '32px',
          position: 'relative',
          background: 'rgba(255, 255, 255, 0.96)',
          border: '1px solid rgba(212, 175, 55, 0.4)',
          boxShadow: '0 20px 48px -10px rgba(184, 134, 11, 0.25)',
        }}
      >
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: 'none',
            border: 'none',
            color: '#5c6b73',
            fontSize: '1.4rem',
            cursor: 'pointer',
          }}
        >
          ✕
        </button>

        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1b2a4a', marginBottom: '8px', textAlign: 'center', fontFamily: 'Outfit, sans-serif' }}>
          Welcome to Digital Library
        </h2>
        <p style={{ color: '#5c6b73', fontSize: '0.85rem', textAlign: 'center', marginBottom: '24px' }}>
          Choose your preferred login method to access eBooks & archives
        </p>

        {errorMsg && (
          <div
            style={{
              background: 'rgba(239, 68, 68, 0.12)',
              color: '#dc2626',
              padding: '10px 14px',
              borderRadius: '10px',
              fontSize: '0.85rem',
              marginBottom: '16px',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              fontWeight: 600,
            }}
          >
            ⚠️ {errorMsg}
          </div>
        )}

        {/* Social Login Options */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
          <button
            onClick={() => handleSocialAuth('google')}
            disabled={loading}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              padding: '10px',
              borderRadius: '10px',
              border: '1px solid rgba(212, 175, 55, 0.35)',
              background: '#fff',
              color: '#1b2a4a',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
            }}
          >
            🌐 Continue with Google Login
          </button>

          <button
            onClick={() => handleSocialAuth('microsoft')}
            disabled={loading}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              padding: '10px',
              borderRadius: '10px',
              border: '1px solid rgba(212, 175, 55, 0.35)',
              background: '#fff',
              color: '#1b2a4a',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
            }}
          >
            🪟 Continue with Microsoft Login
          </button>

          <button
            onClick={() => handleSocialAuth('apple')}
            disabled={loading}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              padding: '10px',
              borderRadius: '10px',
              border: '1px solid rgba(212, 175, 55, 0.35)',
              background: '#fff',
              color: '#1b2a4a',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
            }}
          >
            🍎 Continue with Apple Login
          </button>

          <button
            onClick={() => handleSocialAuth('facebook')}
            disabled={loading}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              padding: '10px',
              borderRadius: '10px',
              border: '1px solid rgba(212, 175, 55, 0.35)',
              background: '#fff',
              color: '#1b2a4a',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
            }}
          >
            📘 Continue with Facebook Login
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', margin: '20px 0', opacity: 0.5 }}>
          <div style={{ flex: 1, borderBottom: '1px solid #b8860b' }} />
          <span style={{ padding: '0 10px', fontSize: '0.78rem', color: '#1b2a4a', fontWeight: 700 }}>OR EMAIL</span>
          <div style={{ flex: 1, borderBottom: '1px solid #b8860b' }} />
        </div>

        {/* Email & Password Form */}
        <form onSubmit={handleEmailSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ fontSize: '0.8rem', color: '#1b2a4a', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@university.edu"
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '10px',
                border: '1px solid rgba(212, 175, 55, 0.4)',
                background: 'rgba(248, 245, 238, 0.9)',
                color: '#1b2a4a',
                fontSize: '0.9rem',
                outline: 'none',
              }}
            />
          </div>

          <div>
            <label style={{ fontSize: '0.8rem', color: '#1b2a4a', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '10px',
                border: '1px solid rgba(212, 175, 55, 0.4)',
                background: 'rgba(248, 245, 238, 0.9)',
                color: '#1b2a4a',
                fontSize: '0.9rem',
                outline: 'none',
              }}
            />
          </div>

          <button type="submit" disabled={loading} className="btn-gradient" style={{ width: '100%', marginTop: '8px' }}>
            {loading ? 'Authenticating...' : 'Sign In with Email'}
          </button>
        </form>
      </div>
    </div>
  );
};
