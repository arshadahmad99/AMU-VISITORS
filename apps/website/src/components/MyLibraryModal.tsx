import React from 'react';
import { Book } from '@digital-library/types';

interface MyLibraryModalProps {
  purchasedBooks: Book[];
  isOpen: boolean;
  onClose: () => void;
  onReadBook: (book: Book) => void;
}

export const MyLibraryModal: React.FC<MyLibraryModalProps> = ({ purchasedBooks, isOpen, onClose, onReadBook }) => {
  if (!isOpen) return null;

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
        zIndex: 220,
      }}
    >
      <div
        className="glass-card"
        style={{
          maxWidth: '650px',
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

        <h3 style={{ fontSize: '1.4rem', fontWeight: 800, fontFamily: 'Outfit, sans-serif', color: '#1b2a4a', marginBottom: '6px' }}>
          📖 My Personal eBook Library
        </h3>
        <p style={{ fontSize: '0.85rem', color: '#5c6b73', marginBottom: '20px' }}>
          Your purchased academic & research digital books with saved reading positions.
        </p>

        {purchasedBooks.length === 0 ? (
          <div style={{ padding: '40px 20px', textAlign: 'center', color: '#5c6b73', fontWeight: 500 }}>
            You haven't purchased any eBooks yet. Browse the catalog on the left to buy access!
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '16px', maxHeight: '450px', overflowY: 'auto' }}>
            {purchasedBooks.map((book) => (
              <div
                key={book.id}
                className="glass-card"
                style={{
                  padding: '12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                  background: 'rgba(253, 250, 245, 0.95)',
                  border: '1px solid rgba(212, 175, 55, 0.3)',
                }}
              >
                <div style={{ display: 'flex', gap: '10px' }}>
                  <img src={book.coverImage} alt={book.title} style={{ width: '65px', height: '90px', borderRadius: '6px', objectFit: 'cover', border: '1px solid #d4af37' }} />
                  <div style={{ flex: 1 }}>
                    <h4 style={{ fontSize: '0.88rem', fontWeight: 700, color: '#1b2a4a', lineHeight: '1.3' }}>{book.title}</h4>
                    <p style={{ fontSize: '0.78rem', color: '#5c6b73', marginTop: '2px' }}>{book.author}</p>
                    <span style={{ fontSize: '0.72rem', color: '#0f5257', background: 'rgba(15, 82, 87, 0.1)', padding: '2px 8px', borderRadius: '6px', marginTop: '6px', display: 'inline-block', fontWeight: 700 }}>
                      ✓ Full Access
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    onClose();
                    onReadBook(book);
                  }}
                  className="btn-gradient"
                  style={{ width: '100%', padding: '8px', fontSize: '0.85rem', marginTop: 'auto' }}
                >
                  📖 Continue Reading
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
