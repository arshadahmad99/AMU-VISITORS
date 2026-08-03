import React, { useState } from 'react';
import { adminLogin } from '../services/adminApi';

interface LoginPageProps {
  onLogin: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = await adminLogin(email.trim(), password.trim());
      localStorage.setItem('adminToken', data.token);
      onLogin();
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Invalid email or password');
    }
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      backgroundColor: 'var(--bg-primary)',
      padding: '20px'
    }}>
      <div className="admin-card" style={{
        maxWidth: '400px',
        width: '100%',
        padding: '32px',
        textAlign: 'center'
      }}>
        <div style={{
          width: '48px',
          height: '48px',
          borderRadius: '2px',
          background: 'var(--accent-gold)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '1.5rem',
          margin: '0 auto 16px auto'
        }}>
          🏛
        </div>
        
        <h2 style={{
          fontSize: '1.8rem',
          fontWeight: 700,
          fontFamily: 'var(--font-heading)',
          color: 'var(--text-primary)',
          marginBottom: '8px'
        }}>
          Admin Portal
        </h2>
        <p style={{
          color: 'var(--text-secondary)',
          fontSize: '0.9rem',
          marginBottom: '24px'
        }}>
          Sign in to manage the Digital Library
        </p>

        {error && (
          <div style={{
            padding: '10px',
            backgroundColor: 'rgba(220, 38, 38, 0.1)',
            color: '#dc2626',
            borderRadius: '2px',
            marginBottom: '16px',
            fontSize: '0.85rem',
            fontWeight: 600
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ textAlign: 'left' }}>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '2px',
                border: '1px solid var(--border-light)',
                background: 'var(--bg-card-alt)',
                color: 'var(--text-primary)',
                fontFamily: 'var(--font-body)'
              }}
              placeholder="admin@example.com"
            />
          </div>

          <div style={{ textAlign: 'left' }}>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '2px',
                border: '1px solid var(--border-light)',
                background: 'var(--bg-card-alt)',
                color: 'var(--text-primary)',
                fontFamily: 'var(--font-body)'
              }}
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '8px', padding: '12px' }}
          >
            Sign In
          </button>
        </form>
      </div>
    </div>
  );
};
