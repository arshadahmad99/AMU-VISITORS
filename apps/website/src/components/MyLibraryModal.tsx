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
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        padding: '16px',
        background: 'rgba(11, 19, 43, 0.55)',
        backdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1100,
      }}
    >
      <div
        className="glass-card"
        style={{
          maxWidth: purchasedBooks.length <= 1 ? '540px' : '700px',
          width: '100%',
          padding: '28px',
          borderRadius: '16px',
          position: 'relative',
          background: '#ffffff',
          border: '1px solid rgba(212, 175, 55, 0.35)',
          boxShadow: '0 24px 60px rgba(11, 19, 43, 0.25)',
          boxSizing: 'border-box',
        }}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close My Library"
          style={{
            position: 'absolute',
            top: 18,
            right: 18,
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            color: '#475569',
            fontSize: '1rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
          }}
        >
          ✕
        </button>

        <h2 style={{ fontSize: '1.35rem', fontWeight: 800, fontFamily: 'var(--font-heading)', color: '#0b132b', margin: '0 36px 6px 0' }}>
          📖 My Personal eBook Library
        </h2>
        <p style={{ fontSize: '0.88rem', color: '#64748b', margin: '0 0 22px 0', lineHeight: 1.5 }}>
          Your purchased academic & research digital books with saved reading positions.
        </p>

        {purchasedBooks.length === 0 ? (
          <div style={{ padding: '36px 20px', textAlign: 'center', color: '#64748b', fontWeight: 500, background: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
            You haven't purchased any eBooks yet. Browse the catalog on the left to buy access!
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: purchasedBooks.length === 1 ? '1fr' : 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '16px',
              maxHeight: '65vh',
              overflowY: 'auto',
            }}
          >
            {purchasedBooks.map((book) => (
              <div
                key={book.id}
                style={{
                  padding: '18px',
                  borderRadius: '12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px',
                  background: '#fdfaf4',
                  border: '1px solid rgba(212, 175, 55, 0.35)',
                  boxShadow: '0 4px 16px rgba(15, 23, 42, 0.05)',
                }}
              >
                <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                  <img
                    src={book.coverImage}
                    alt={`Cover of ${book.title}`}
                    width={76}
                    height={106}
                    loading="lazy"
                    decoding="async"
                    style={{
                      width: '76px',
                      height: '106px',
                      borderRadius: '8px',
                      objectFit: 'cover',
                      border: '1.5px solid #d4af37',
                      boxShadow: '0 6px 14px rgba(0, 0, 0, 0.14)',
                      flexShrink: 0,
                    }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h3 style={{ fontSize: '1.02rem', fontWeight: 700, fontFamily: 'var(--font-heading)', color: '#0b132b', lineHeight: 1.35, margin: 0 }}>
                      {book.title}
                    </h3>
                    <p style={{ fontSize: '0.84rem', color: '#475569', margin: '6px 0 0 0', fontWeight: 500 }}>
                      {book.author}
                    </p>
                    <span
                      style={{
                        fontSize: '0.74rem',
                        color: '#0f5257',
                        background: 'rgba(15, 82, 87, 0.1)',
                        border: '1px solid rgba(15, 82, 87, 0.2)',
                        padding: '3px 10px',
                        borderRadius: '999px',
                        marginTop: '10px',
                        display: 'inline-block',
                        fontWeight: 700,
                      }}
                    >
                      ✓ Full Access
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onReadBook(book);
                  }}
                  className="btn-gradient"
                  style={{
                    width: '100%',
                    padding: '11px 16px',
                    fontSize: '0.84rem',
                    borderRadius: '8px',
                    marginTop: 'auto',
                  }}
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
