import React, { useState, useEffect } from 'react';
import {
  loginWithEmail,
  registerWithEmail,
  sendPasswordResetOtp,
  resetPasswordWithOtp,
  setAuthToken,
  setSavedUser
} from '../services/api';
import { User } from '@digital-library/types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: User) => void;
}

type AuthMode = 'login' | 'register' | 'forgot_email' | 'forgot_otp';

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [toastMsg, setToastMsg] = useState('');
  const [infoMsg, setInfoMsg] = useState('');

  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [name, setName] = useState('');
  const [resendTimer, setResendTimer] = useState<number>(0);

  useEffect(() => {
    if (!isOpen) {
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      setOtp('');
      setShowPassword(false);
      setLoading(false);
      setErrorMsg('');
      setToastMsg('');
      setInfoMsg('');
      setAuthMode('login');
      setName('');
      setResendTimer(0);
    }
  }, [isOpen]);

  // Countdown timer for OTP resend
  useEffect(() => {
    let interval: any = null;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [resendTimer]);

  if (!isOpen) return null;

  // Step 1: Send OTP to User's Email
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setErrorMsg('Please enter your registered email address');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setInfoMsg('');

    try {
      const data = await sendPasswordResetOtp(email);
      setInfoMsg(`A 6-digit verification code was sent to ${email}`);
      setToastMsg('OTP sent successfully!');
      setAuthMode('forgot_otp');
      setResendTimer(60);
      setPassword('');
      setConfirmPassword('');
      setOtp('');
      setTimeout(() => setToastMsg(''), 2500);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || 'Failed to send OTP. Please check the email address.');
    } finally {
      setLoading(false);
    }
  };

  // Step 1b: Resend OTP
  const handleResendOtp = async () => {
    if (resendTimer > 0 || loading) return;
    setLoading(true);
    setErrorMsg('');
    try {
      await sendPasswordResetOtp(email);
      setToastMsg('New OTP code sent!');
      setResendTimer(60);
      setTimeout(() => setToastMsg(''), 2500);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || 'Failed to resend OTP.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP & Reset Password
  const handleResetWithOtp = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!otp.trim() || otp.trim().length !== 6) {
      setErrorMsg('Please enter the 6-digit verification code');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('New password must be at least 6 characters long');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const data = await resetPasswordWithOtp(email, otp.trim(), password);
      setToastMsg(data.message || 'Password reset successfully! Please sign in.');
      setPassword('');
      setConfirmPassword('');
      setOtp('');
      setInfoMsg('');
      setTimeout(() => {
        setToastMsg('');
        setAuthMode('login');
      }, 1800);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || 'Failed to reset password. Please check the OTP.');
    } finally {
      setLoading(false);
    }
  };

  // Normal Login / Register Submit
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (authMode === 'register') {
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
      if (authMode === 'login') {
        data = await loginWithEmail(email, password);
      } else {
        data = await registerWithEmail(name, email, password);
      }
      setAuthToken(data.token);
      setSavedUser(data.user);

      setToastMsg(authMode === 'login' ? 'Successfully logged in!' : 'Successfully signed up!');
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
          {authMode === 'login'
            ? 'Welcome to Digital Library'
            : authMode === 'register'
            ? 'Create an Account'
            : authMode === 'forgot_email'
            ? 'Forgot Password'
            : 'Enter OTP & Reset Password'}
        </h2>

        <p style={{ color: '#5c6b73', fontSize: '0.85rem', textAlign: 'center', marginBottom: '22px' }}>
          {authMode === 'login'
            ? 'Choose your preferred login method to access eBooks & archives'
            : authMode === 'register'
            ? 'Join us to purchase and access eBooks & archives'
            : authMode === 'forgot_email'
            ? 'Enter your registered email to receive a 6-digit verification code'
            : `Enter the 6-digit OTP code sent to your email and your new password`}
        </p>

        {infoMsg && (
          <div
            style={{
              background: 'rgba(217, 119, 6, 0.1)',
              color: '#b45309',
              padding: '10px 14px',
              borderRadius: '10px',
              fontSize: '0.82rem',
              marginBottom: '16px',
              border: '1px solid rgba(217, 119, 6, 0.25)',
              fontWeight: 600,
              textAlign: 'center'
            }}
          >
            ✉️ {infoMsg}
          </div>
        )}

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

        {/* ========================================================================= */}
        {/* MODE: FORGOT PASSWORD - STEP 1: ENTER EMAIL TO RECEIVE OTP               */}
        {/* ========================================================================= */}
        {authMode === 'forgot_email' && (
          <form onSubmit={handleSendOtp} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ fontSize: '0.8rem', color: '#1b2a4a', fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                Registered Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your.email@university.edu"
                style={{
                  width: '100%',
                  padding: '11px 14px',
                  borderRadius: '10px',
                  border: '1px solid rgba(212, 175, 55, 0.4)',
                  background: 'rgba(248, 245, 238, 0.9)',
                  color: '#1b2a4a',
                  fontSize: '0.9rem',
                  outline: 'none',
                }}
              />
            </div>

            <button type="submit" disabled={loading} className="btn-gradient" style={{ width: '100%', marginTop: '6px' }}>
              {loading ? 'Sending Verification OTP...' : 'Send OTP Code'}
            </button>

            <div style={{ textAlign: 'center', marginTop: '10px' }}>
              <button
                type="button"
                onClick={() => {
                  setAuthMode('login');
                  setErrorMsg('');
                  setInfoMsg('');
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#5a1827',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  textDecoration: 'underline'
                }}
              >
                ← Back to Sign In
              </button>
            </div>
          </form>
        )}

        {/* ========================================================================= */}
        {/* MODE: FORGOT PASSWORD - STEP 2: ENTER OTP & NEW PASSWORD                  */}
        {/* ========================================================================= */}
        {authMode === 'forgot_otp' && (
          <form onSubmit={handleResetWithOtp} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <label style={{ fontSize: '0.8rem', color: '#1b2a4a', fontWeight: 700 }}>
                  6-Digit OTP Code
                </label>
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={resendTimer > 0 || loading}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: resendTimer > 0 ? '#94a3b8' : '#5a1827',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    cursor: resendTimer > 0 ? 'default' : 'pointer',
                    textDecoration: resendTimer > 0 ? 'none' : 'underline'
                  }}
                >
                  {resendTimer > 0 ? `Resend OTP in ${resendTimer}s` : 'Resend OTP'}
                </button>
              </div>
              <input
                type="text"
                required
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="• • • • • •"
                style={{
                  width: '100%',
                  padding: '11px 14px',
                  borderRadius: '10px',
                  border: '1.5px solid rgba(212, 175, 55, 0.6)',
                  background: 'rgba(248, 245, 238, 0.9)',
                  color: '#1b2a4a',
                  fontSize: '1.25rem',
                  letterSpacing: '6px',
                  textAlign: 'center',
                  fontWeight: 800,
                  fontFamily: 'monospace',
                  outline: 'none',
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', color: '#1b2a4a', fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                New Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => {
                    const val = e.target.value;
                    setPassword(val);
                    if (val.length > 0 && val.length < 6) {
                      setErrorMsg('New password must be at least 6 characters long');
                    } else if (confirmPassword && val !== confirmPassword) {
                      setErrorMsg('Passwords do not match');
                    } else {
                      setErrorMsg('');
                    }
                  }}
                  placeholder="•••••••• (min 6 characters)"
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

            <div>
              <label style={{ fontSize: '0.8rem', color: '#1b2a4a', fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                Confirm New Password
              </label>
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

            <button type="submit" disabled={loading} className="btn-gradient" style={{ width: '100%', marginTop: '6px' }}>
              {loading ? 'Verifying & Resetting...' : 'Verify OTP & Reset Password'}
            </button>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
              <button
                type="button"
                onClick={() => {
                  setAuthMode('forgot_email');
                  setErrorMsg('');
                  setInfoMsg('');
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#5c6b73',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  textDecoration: 'underline'
                }}
              >
                Change Email
              </button>

              <button
                type="button"
                onClick={() => {
                  setAuthMode('login');
                  setErrorMsg('');
                  setInfoMsg('');
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#5a1827',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  textDecoration: 'underline'
                }}
              >
                ← Back to Sign In
              </button>
            </div>
          </form>
        )}

        {/* ========================================================================= */}
        {/* MODE: NORMAL LOGIN & REGISTER FORM                                        */}
        {/* ========================================================================= */}
        {(authMode === 'login' || authMode === 'register') && (
          <form onSubmit={handleEmailSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {authMode === 'register' && (
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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <label style={{ fontSize: '0.8rem', color: '#1b2a4a', fontWeight: 700 }}>Password</label>
                {authMode === 'login' && (
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode('forgot_email');
                      setErrorMsg('');
                      setInfoMsg('');
                      setPassword('');
                      setConfirmPassword('');
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#5a1827',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      textDecoration: 'underline',
                      padding: 0
                    }}
                  >
                    Forgot Password?
                  </button>
                )}
              </div>
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
                    } else if (authMode !== 'login' && confirmPassword && val !== confirmPassword) {
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

            {authMode === 'register' && (
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
              {loading
                ? 'Authenticating...'
                : authMode === 'login'
                ? 'Sign In with Email'
                : 'Sign Up with Email'}
            </button>
          </form>
        )}

        {(authMode === 'login' || authMode === 'register') && (
          <div style={{ marginTop: '20px', textAlign: 'center' }}>
            <button
              type="button"
              onClick={() => {
                setAuthMode(authMode === 'login' ? 'register' : 'login');
                setErrorMsg('');
                setInfoMsg('');
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
              {authMode === 'login' ? "Don't have an account? Sign Up" : 'Already have an account? Sign In'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
