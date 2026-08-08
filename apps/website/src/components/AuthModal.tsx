import React, { useState, useEffect } from 'react';
import { loginWithEmail, registerWithEmail, socialLogin, setAuthToken, setSavedUser } from '../services/api';
import { User } from '@digital-library/types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: User) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [toastMsg, setToastMsg] = useState('');

  const [isLoginMode, setIsLoginMode] = useState(true);
  const [name, setName] = useState('');

  useEffect(() => {
    if (!isOpen) {
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      setShowPassword(false);
      setLoading(false);
      setErrorMsg('');
      setToastMsg('');
      setIsLoginMode(true);
      setName('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Form Validations
    if (!isLoginMode) {
      if (name.trim().length < 2) {
        setErrorMsg('Name must be at least 2 characters long');
        return;
      }
      if (!/^[a-zA-Z\s]+$/.test(name.trim())) {
        setErrorMsg('Name can only contain letters and spaces');
        return;
      }
      if (password.length < 6) {
        setErrorMsg('Password must be at least 6 characters long');
        return;
      }
      if (password !== confirmPassword) {
        setErrorMsg('Passwords do not match');
        return;
      }
    } else {
      if (password.length < 6) {
        setErrorMsg('Password must be at least 6 characters long');
        return;
      }
    }

    setLoading(true);
    setErrorMsg('');
    try {
      let data;
      if (isLoginMode) {
        data = await loginWithEmail(email, password);
      } else {
        data = await registerWithEmail(name, email, password);
      }
      setAuthToken(data.token);
      setSavedUser(data.user);
      
      setToastMsg(isLoginMode ? 'Successfully logged in!' : 'Successfully signed up!');
      setTimeout(() => {
        setToastMsg('');
        onSuccess(data.user);
        onClose();
      }, 1500);

    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || 'Authentication failed');
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
          {isLoginMode ? 'Welcome to Digital Library' : 'Create an Account'}
        </h2>
        <p style={{ color: '#5c6b73', fontSize: '0.85rem', textAlign: 'center', marginBottom: '24px' }}>
          {isLoginMode ? 'Choose your preferred login method to access eBooks & archives' : 'Join us to purchase and access eBooks & archives'}
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

        {/* Toast Message */}
        {toastMsg && (
          <div style={{
            position: 'absolute', top: '-60px', left: '50%', transform: 'translateX(-50%)',
            background: '#10b981', color: 'white', padding: '12px 24px', borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)', fontWeight: 700, zIndex: 1000, whiteSpace: 'nowrap'
          }}>
            ✅ {toastMsg}
          </div>
        )}

        {/* Email & Password Form */}
        <form onSubmit={handleEmailSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {!isLoginMode && (
            <div>
              <label style={{ fontSize: '0.8rem', color: '#1b2a4a', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Full Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => {
                  const val = e.target.value;
                  if (/[^a-zA-Z\s]/.test(val)) {
                    setErrorMsg('Name can only contain letters and spaces');
                  } else {
                    setErrorMsg('');
                  }
                  setName(val.replace(/[^a-zA-Z\s]/g, ''));
                }}
                placeholder="John Doe"
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
          )}
          
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
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => {
                  const val = e.target.value;
                  setPassword(val);
                  if (val.length > 0 && val.length < 6) {
                    setErrorMsg('Password must be at least 6 characters long');
                  } else if (!isLoginMode && confirmPassword && val !== confirmPassword) {
                    setErrorMsg('Passwords do not match');
                  } else {
                    setErrorMsg('');
                  }
                }}
                placeholder="••••••••"
                style={{
                  width: '100%',
                  padding: '10px 40px 10px 14px',
                  borderRadius: '10px',
                  border: '1px solid rgba(212, 175, 55, 0.4)',
                  background: 'rgba(248, 245, 238, 0.9)',
                  color: '#1b2a4a',
                  fontSize: '0.9rem',
                  outline: 'none',
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', color: '#5c6b73'
                }}
              >
                {showPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
          </div>

          {!isLoginMode && (
            <div>
              <label style={{ fontSize: '0.8rem', color: '#1b2a4a', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Confirm Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={confirmPassword}
                  onChange={(e) => {
                    const val = e.target.value;
                    setConfirmPassword(val);
                    if (val.length > 0 && val !== password) {
                      setErrorMsg('Passwords do not match');
                    } else if (password.length >= 6) {
                      setErrorMsg('');
                    }
                  }}
                  placeholder="••••••••"
                  style={{
                    width: '100%',
                    padding: '10px 40px 10px 14px',
                    borderRadius: '10px',
                    border: '1px solid rgba(212, 175, 55, 0.4)',
                    background: 'rgba(248, 245, 238, 0.9)',
                    color: '#1b2a4a',
                    fontSize: '0.9rem',
                    outline: 'none',
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', color: '#5c6b73'
                  }}
                >
                  {showPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
            </div>
          )}

          <button type="submit" disabled={loading} className="btn-gradient" style={{ width: '100%', marginTop: '8px' }}>
            {loading ? 'Authenticating...' : (isLoginMode ? 'Sign In with Email' : 'Sign Up with Email')}
          </button>
        </form>

        <div style={{ marginTop: '20px', textAlign: 'center' }}>
          <button 
            type="button" 
            onClick={() => {
              setIsLoginMode(!isLoginMode);
              setErrorMsg('');
            }}
            style={{
              background: 'none',
              border: 'none',
              color: '#5a1827',
              fontSize: '0.9rem',
              fontWeight: 700,
              cursor: 'pointer',
              textDecoration: 'underline'
            }}
          >
            {isLoginMode ? "Don't have an account? Sign Up" : 'Already have an account? Sign In'}
          </button>
        </div>
      </div>
    </div>
  );
};
