import React, { useState, useEffect } from 'react';
import { changePassword } from '../services/api';
import { User } from '@digital-library/types';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
}

export const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({ isOpen, onClose, user }) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [toastMsg, setToastMsg] = useState('');

  useEffect(() => {
    if (!isOpen) {
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowCurrent(false);
      setShowNew(false);
      setLoading(false);
      setErrorMsg('');
      setToastMsg('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentPassword) {
      setErrorMsg('Please enter your current password');
      return;
    }

    if (newPassword.length < 6) {
      setErrorMsg('New password must be at least 6 characters long');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg('New passwords do not match');
      return;
    }

    if (currentPassword === newPassword) {
      setErrorMsg('New password must be different from current password');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const res = await changePassword(currentPassword, newPassword);
      setToastMsg(res.message || 'Password changed successfully!');
      setTimeout(() => {
        setToastMsg('');
        onClose();
      }, 1500);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || 'Failed to change password');
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
        zIndex: 250,
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
          Change Password
        </h2>
        <p style={{ color: '#5c6b73', fontSize: '0.85rem', textAlign: 'center', marginBottom: '24px' }}>
          Update the password for <strong style={{ color: '#1b2a4a' }}>{user?.email || 'your account'}</strong>
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

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ fontSize: '0.8rem', color: '#1b2a4a', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Current Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showCurrent ? "text" : "password"}
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
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
                onClick={() => setShowCurrent(!showCurrent)}
                style={{
                  position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', color: '#5c6b73'
                }}
              >
                {showCurrent ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
          </div>

          <div>
            <label style={{ fontSize: '0.8rem', color: '#1b2a4a', fontWeight: 700, display: 'block', marginBottom: '4px' }}>New Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showNew ? "text" : "password"}
                required
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  if (e.target.value.length > 0 && e.target.value.length < 6) {
                    setErrorMsg('New password must be at least 6 characters long');
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
                onClick={() => setShowNew(!showNew)}
                style={{
                  position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', color: '#5c6b73'
                }}
              >
                {showNew ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
          </div>

          <div>
            <label style={{ fontSize: '0.8rem', color: '#1b2a4a', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Confirm New Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showNew ? "text" : "password"}
                required
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (e.target.value.length > 0 && e.target.value !== newPassword) {
                    setErrorMsg('New passwords do not match');
                  } else if (newPassword.length >= 6) {
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
                onClick={() => setShowNew(!showNew)}
                style={{
                  position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', color: '#5c6b73'
                }}
              >
                {showNew ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
          </div>

          <button type="submit" disabled={loading} className="btn-gradient" style={{ width: '100%', marginTop: '8px' }}>
            {loading ? 'Updating Password...' : 'Update Password'}
          </button>
        </form>
      </div>
    </div>
  );
};
