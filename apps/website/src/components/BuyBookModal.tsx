import React, { useState } from 'react';
import { Book } from '@digital-library/types';
import { formatCurrency } from '@digital-library/utils';
import { purchaseBook } from '../services/api';

interface BuyBookModalProps {
  book: Book | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (bookId: string) => void;
}

export const BuyBookModal: React.FC<BuyBookModalProps> = ({ book, isOpen, onClose, onSuccess }) => {
  const [paymentMethod, setPaymentMethod] = useState('Credit Card');
  const [loading, setLoading] = useState(false);

  if (!isOpen || !book) return null;

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await purchaseBook(book.id, paymentMethod);
      onSuccess(book.id);
      onClose();
    } catch (err) {
      console.error(err);
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
          maxWidth: '440px',
          width: '100%',
          padding: '28px',
          position: 'relative',
          background: 'rgba(255, 255, 255, 0.96)',
          border: '1px solid rgba(212, 175, 55, 0.4)',
          boxShadow: '0 20px 48px -10px rgba(184, 134, 11, 0.25)',
        }}
      >
        <button
          onClick={onClose}
          style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', color: '#5c6b73', fontSize: '1.2rem', cursor: 'pointer' }}
        >
          ✕
        </button>

        <h3 style={{ fontSize: '1.3rem', fontWeight: 800, fontFamily: 'Outfit, sans-serif', color: '#1b2a4a', marginBottom: '8px' }}>
          🛒 Complete eBook Purchase
        </h3>
        <p style={{ fontSize: '0.85rem', color: '#5c6b73', marginBottom: '20px' }}>
          Instant digital access will be granted to your personal library upon confirmation.
        </p>

        {/* Order Summary Box */}
        <div style={{ display: 'flex', gap: '14px', background: 'rgba(253, 250, 245, 0.95)', padding: '14px', borderRadius: '12px', marginBottom: '20px', border: '1px solid rgba(212, 175, 55, 0.3)' }}>
          <img src={book.coverImage} alt={book.title} style={{ width: '60px', height: '80px', borderRadius: '8px', objectFit: 'cover', border: '1px solid #d4af37' }} />
          <div style={{ flex: 1 }}>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#1b2a4a', marginBottom: '4px' }}>{book.title}</h4>
            <p style={{ fontSize: '0.8rem', color: '#5c6b73' }}>By {book.author}</p>
            <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#b8860b', marginTop: '8px', fontFamily: 'Outfit, sans-serif' }}>{formatCurrency(book.price)}</div>
          </div>
        </div>

        {/* Payment Method Selector */}
        <form onSubmit={handleCheckout} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ fontSize: '0.8rem', color: '#1b2a4a', fontWeight: 700, display: 'block', marginBottom: '6px' }}>Select Payment Method</label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '10px',
                border: '1px solid rgba(212, 175, 55, 0.4)',
                background: '#fff',
                color: '#1b2a4a',
                fontSize: '0.9rem',
                fontWeight: 600,
                outline: 'none',
              }}
            >
              <option value="Credit Card">💳 Credit / Debit Card</option>
              <option value="Google Pay">🌐 Google Pay</option>
              <option value="Apple Pay">🍎 Apple Pay</option>
              <option value="PayPal">🅿️ PayPal Express</option>
            </select>
          </div>

          <button type="submit" disabled={loading} className="btn-gradient" style={{ width: '100%', marginTop: '10px', padding: '12px' }}>
            {loading ? 'Processing Payment...' : `Confirm & Pay ${formatCurrency(book.price)}`}
          </button>
        </form>
      </div>
    </div>
  );
};
