import React, { useState } from 'react';
import { Book } from '@digital-library/types';
import { formatCurrency } from '@digital-library/utils';
import { createRazorpayOrder, verifyRazorpayPayment } from '../services/api';

interface BuyBookModalProps {
  book: Book | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (bookId: string) => void;
}

export const BuyBookModal: React.FC<BuyBookModalProps> = ({ book, isOpen, onClose, onSuccess }) => {
  const [paymentMethod, setPaymentMethod] = useState('Credit Card');
  const [loading, setLoading] = useState(false);

  const [isAlumni, setIsAlumni] = useState(false);
  const [position, setPosition] = useState('');
  const [country, setCountry] = useState('');
  const [course, setCourse] = useState('');
  const [passingYear, setPassingYear] = useState('');

  if (!isOpen || !book) return null;

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if ((window as any).Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => {
        resolve(true);
      };
      script.onerror = () => {
        resolve(false);
      };
      document.body.appendChild(script);
    });
  };

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Load Razorpay dynamically
      const res = await loadRazorpayScript();
      if (!res) {
        alert('Razorpay SDK failed to load. Are you offline?');
        setLoading(false);
        return;
      }

      // 1. Create order on backend
      const orderData = await createRazorpayOrder(book.id);

      // Create an SVG Data URL for the Razorpay logo to match the maroon hardcover design
      const bookCoverSvg = `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
        <rect width="200" height="200" fill="#5a1827" />
        <rect x="0" y="0" width="15" height="200" fill="#3a0f18" />
        <rect x="10" y="10" width="180" height="180" fill="none" stroke="#d4af37" stroke-width="4" />
        <text x="105" y="70" font-family="Times New Roman, serif" font-size="32" fill="#dfb76c" text-anchor="middle" font-weight="bold">Lytton</text>
        <text x="105" y="100" font-family="Times New Roman, serif" font-size="18" fill="#dfb76c" text-anchor="middle" font-style="italic">to</text>
        <text x="105" y="135" font-family="Times New Roman, serif" font-size="28" fill="#dfb76c" text-anchor="middle" font-weight="bold">Maulana</text>
        <text x="105" y="165" font-family="Times New Roman, serif" font-size="28" fill="#dfb76c" text-anchor="middle" font-weight="bold">Azad</text>
      </svg>`;
      const base64Cover = `data:image/svg+xml;base64,${btoa(bookCoverSvg)}`;

      // 2. Initialize Razorpay popup
      const options = {
        key: orderData.keyId, // Dynamically use the key provided by the backend
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'AMU Library',
        description: `Purchase: ${book.title}`,
        image: base64Cover,
        order_id: orderData.orderId,
        handler: async function (response: any) {
          try {
            // 3. Verify payment on backend
            const verifyData = {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              bookId: book.id,
              isAlumni,
              course,
              passingYear,
              position,
              country
            };
            
            await verifyRazorpayPayment(verifyData);
            onSuccess(book.id);
            onClose();
          } catch (err) {
            console.error('Payment verification failed', err);
            alert('Payment verification failed. Please contact support.');
          }
        },
        prefill: {
          name: 'Library User',
          email: 'user@example.com'
        },
        theme: {
          color: '#5a1827'
        }
      };

      // @ts-ignore
      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (response: any){
        console.error('Payment failed', response.error);
        alert('Payment failed. Please try again.');
      });
      rzp.open();

    } catch (err) {
      console.error(err);
      alert('Failed to initiate checkout. Please try again.');
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
          maxHeight: '90vh',
          overflowY: 'auto',
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
          <div style={{
            width: '64px',
            minWidth: '64px',
            height: '84px',
            backgroundColor: '#5a1827',
            backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.85\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\' opacity=\'0.05\'/%3E%3C/svg%3E")',
            borderRadius: '2px 6px 6px 2px',
            boxShadow: 'inset 2px 0 4px rgba(0,0,0,0.5), inset -1px 0 1px rgba(255,255,255,0.2), 2px 2px 6px rgba(0,0,0,0.2)',
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '4px',
            border: '1px solid rgba(212, 175, 55, 0.4)'
          }}>
            <div style={{
              position: 'absolute',
              left: '0',
              top: '0',
              bottom: '0',
              width: '4px',
              background: 'linear-gradient(to right, rgba(255,255,255,0.1) 0%, rgba(0,0,0,0.2) 40%, rgba(0,0,0,0.4) 100%)',
              borderRight: '1px solid rgba(0,0,0,0.5)',
              zIndex: 2
            }} />
            <div style={{
              border: '1px solid #d4af37',
              width: '100%',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '2px',
              boxSizing: 'border-box'
            }}>
              <div style={{ fontSize: '7px', color: '#dfb76c', fontFamily: 'Cinzel, serif', textAlign: 'center', lineHeight: '1.2', fontWeight: 700 }}>
                Lytton<br/>to<br/>Maulana<br/>Azad
              </div>
            </div>
          </div>
          <div style={{ flex: 1 }}>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#1b2a4a', marginBottom: '4px' }}>{book.title}</h4>
            <p style={{ fontSize: '0.8rem', color: '#5c6b73' }}>By {book.author}</p>
            <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#b8860b', marginTop: '8px', fontFamily: 'Outfit, sans-serif' }}>499 INR</div>
          </div>
        </div>

        {/* Payment Method Selector and Alumni Form */}
        <form onSubmit={handleCheckout} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          
          <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <label style={{ fontSize: '0.85rem', color: '#1b2a4a', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input type="checkbox" checked={isAlumni} onChange={(e) => setIsAlumni(e.target.checked)} />
              Are you an Alumni of AMU? (Optional)
            </label>

            {isAlumni && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', color: '#475569', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Course passed out from AMU</label>
                  <input type="text" value={course} onChange={(e) => setCourse(e.target.value)} placeholder="e.g. B.Tech, MBA" style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem', outline: 'none' }} />
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', color: '#475569', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Year of Passing</label>
                  <input type="text" value={passingYear} onChange={(e) => setPassingYear(e.target.value)} placeholder="e.g. 2015" style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem', outline: 'none' }} />
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', color: '#475569', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Current Position</label>
                  <input type="text" value={position} onChange={(e) => setPosition(e.target.value)} placeholder="e.g. Software Engineer" style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem', outline: 'none' }} />
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', color: '#475569', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Country</label>
                  <input type="text" value={country} onChange={(e) => setCountry(e.target.value)} placeholder="e.g. India, USA" style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem', outline: 'none' }} />
                </div>
              </div>
            )}
          </div>
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

          <button type="submit" disabled={loading} className="btn-gradient" style={{ width: '100%', marginTop: '10px', padding: '12px', textTransform: 'uppercase' }}>
            {loading ? 'Processing Payment...' : `Confirm & Pay 499 INR`}
          </button>
        </form>
      </div>
    </div>
  );
};
