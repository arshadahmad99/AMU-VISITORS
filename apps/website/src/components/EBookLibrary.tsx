import React from 'react';
import { Book, User } from '@digital-library/types';
import ebookCoverImg from '../assets/ebook-cover.png';

interface EBookLibraryProps {
  books: Book[];
  purchasedBookIds: string[];
  currentUser: User | null;
  onRequireAuth: () => void;
  onBuyBook: (book: Book) => void;
  onReadBook: (book: Book) => void;
}

export const EBookLibrary: React.FC<EBookLibraryProps> = ({
  books,
  purchasedBookIds,
  currentUser,
  onRequireAuth,
  onBuyBook,
  onReadBook,
}) => {
  const featuredBook = books[0];
  const isOwned = featuredBook ? purchasedBookIds.includes(featuredBook.id) : false;


  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      fontFamily: 'var(--font-body)',
      background: '#ffffff',
      borderRadius: '4px',
      padding: '24px',
      boxShadow: '0 8px 30px rgba(0,0,0,0.05)',
      border: '1px solid rgba(255,255,255,0.6)',
      justifyContent: 'flex-start'
    }}>
      {/* Access / Purchase Action Card (Single Row Compact Layout) */}
      <div style={{
        width: '100%',
        maxWidth: '450px',
        margin: '0 auto 6px',
        backgroundColor: '#3b0f1b',
        padding: '10px 16px',
        borderRadius: '8px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: '0 4px 15px rgba(0,0,0,0.15)',
        border: '1px solid rgba(212, 175, 55, 0.2)'
      }}>
        {isOwned ? (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <span style={{ color: '#e8d6b3', fontSize: '0.75rem', fontWeight: 500 }}>Access Granted</span>
              <span style={{ color: '#dfb76c', fontSize: '0.95rem', fontFamily: 'var(--font-heading)', fontWeight: 600 }}>Available</span>
            </div>
            <button
              onClick={() => onReadBook(featuredBook)}
              style={{
                padding: '7px 18px',
                background: '#dfb76c',
                color: '#000000',
                border: 'none',
                borderRadius: '20px',
                fontSize: '0.8rem',
                fontWeight: 600,
                letterSpacing: '0.5px',
                cursor: 'pointer',
                transition: 'opacity 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
              onMouseOver={(e) => (e.target as HTMLButtonElement).style.opacity = '0.9'}
              onMouseOut={(e) => (e.target as HTMLButtonElement).style.opacity = '1'}
            >
              <span style={{ fontSize: '0.9rem' }}>📖</span> Read Manuscript
            </button>
          </>
        ) : (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <span style={{ color: '#e8d6b3', fontSize: '0.75rem', fontWeight: 500 }}>Total Amount</span>
              <span style={{ color: '#dfb76c', fontSize: '0.95rem', fontFamily: 'var(--font-heading)', fontWeight: 600, letterSpacing: '0.5px' }}>
                499 INR
              </span>
            </div>
            <button
              onClick={() => {
                if (!currentUser) {
                  onRequireAuth();
                } else {
                  onBuyBook(featuredBook);
                }
              }}
              style={{
                padding: '7px 18px',
                background: '#dfb76c',
                color: '#000000',
                border: 'none',
                borderRadius: '20px',
                fontSize: '0.8rem',
                fontWeight: 600,
                letterSpacing: '0.5px',
                cursor: 'pointer',
                transition: 'opacity 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
              onMouseOver={(e) => (e.target as HTMLButtonElement).style.opacity = '0.9'}
              onMouseOut={(e) => (e.target as HTMLButtonElement).style.opacity = '1'}
            >
              <span style={{ fontSize: '0.9rem', transform: 'rotate(-45deg)' }}>🖋️</span> Buy Now
            </button>
          </>
        )}
      </div>

      {/* Hardcover Book Design */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        flex: 1, 
        width: '100%',
        overflow: 'hidden'
      }}>
        <div style={{
          width: '100%',
          maxWidth: '450px',
          margin: '0 auto',
          borderRadius: '4px',
          boxShadow: '0 10px 25px rgba(0,0,0,0.25), 0 2px 8px rgba(0,0,0,0.15)',
          overflow: 'hidden',
          position: 'relative'
        }}>
          <img 
            src={ebookCoverImg} 
            alt="Lytton to Maulana Azad Library (Vision and Mission)" 
            style={{
              width: '100%',
              height: 'auto',
              maxHeight: '600px',
              display: 'block',
              objectFit: 'contain'
            }} 
          />
        </div>
      </div>
    </div>
  );
};
