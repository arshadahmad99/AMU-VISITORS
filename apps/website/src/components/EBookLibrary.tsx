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
  const featuredBook = books[0] || {
    id: 'book-1',
    title: 'Lytton to Maulana Azad Library (Vision and Mission)',
    author: 'Prof. Shabahat Husain',
    category: 'History & Heritage',
    price: 499,
    coverImage: '/assets/ebook-cover.png',
    description: 'The famous proverb "Rome was not built in a day" aptly applies to the making of great institutions...',
    totalPages: 131,
    rating: 5,
  };
  const isOwned = featuredBook ? purchasedBookIds.includes(featuredBook.id) : false;


  return (
    <div
      id="ebook-collection"
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        fontFamily: 'var(--font-body)',
        background: 'var(--bg-card, #ffffff)',
        borderRadius: '12px',
        padding: '24px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
        border: '1px solid var(--border-light, #eaeaea)',
        justifyContent: 'flex-start',
        boxSizing: 'border-box'
      }}
    >
      {/* Access / Purchase Action Card (Single Row Compact Layout) */}
      <div style={{
        width: '100%',
        maxWidth: '430px',
        height: '46px',
        margin: '0 auto 16px',
        backgroundColor: '#3b0f1b',
        padding: '6px 16px',
        borderRadius: '8px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: '0 4px 15px rgba(0,0,0,0.15)',
        border: '1px solid rgba(212, 175, 55, 0.2)',
        boxSizing: 'border-box'
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
        <div 
          id="ebook-cover-target"
          style={{
            width: '100%',
            maxWidth: '430px',
            height: '560px',
            margin: '0 auto',
            borderRadius: '10px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.22), 0 2px 8px rgba(0,0,0,0.12)',
            overflow: 'hidden',
            position: 'relative'
          }}
        >
          <img 
            src={ebookCoverImg} 
            alt="Lytton to Maulana Azad Library (Vision and Mission)" 
            style={{
              width: '100%',
              height: '100%',
              display: 'block',
              objectFit: 'cover'
            }} 
          />
        </div>
      </div>
    </div>
  );
};
