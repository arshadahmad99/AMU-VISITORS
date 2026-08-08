import React from 'react';
import { Book, User } from '@digital-library/types';
import { formatCurrency } from '@digital-library/utils';

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
      background: 'linear-gradient(to bottom, #fdf8f0, #f4ebd8)',
      borderRadius: '4px',
      padding: '24px',
      boxShadow: '0 8px 30px rgba(0,0,0,0.05)',
      alignItems: 'center',
      border: '1px solid rgba(255,255,255,0.6)'
    }}>
      {/* Hardcover Book Design */}
      <div style={{
        width: '100%',
        maxWidth: '350px',
        margin: '0 auto',
        backgroundColor: '#5a1827', // Maroon red
        backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.85\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\' opacity=\'0.05\'/%3E%3C/svg%3E")',
        borderRadius: '2px 8px 8px 2px',
        boxShadow: 'inset 4px 0 10px rgba(0,0,0,0.5), inset -1px 0 2px rgba(255,255,255,0.2), 5px 5px 15px rgba(0,0,0,0.3)',
        padding: '16px',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        aspectRatio: '0.75'
      }}>
        {/* Book Spine Shadow */}
        <div style={{
          position: 'absolute',
          left: '0',
          top: '0',
          bottom: '0',
          width: '12px',
          background: 'linear-gradient(to right, rgba(255,255,255,0.1) 0%, rgba(0,0,0,0.2) 40%, rgba(0,0,0,0.4) 100%)',
          borderRight: '1px solid rgba(0,0,0,0.5)',
          zIndex: 1
        }}></div>

        {/* Double Gold Border */}
        <div style={{
          border: '3px solid #d4af37',
          outline: '1px solid #d4af37',
          outlineOffset: '-6px',
          padding: '40px 20px',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          color: '#d4af37',
          fontFamily: '"Georgia", "Times New Roman", serif',
          textShadow: '1px 1px 2px rgba(0,0,0,0.5)',
          zIndex: 2,
          position: 'relative'
        }}>
          
          <div style={{ marginBottom: '40px' }}>
            <h2 style={{ fontSize: '2.2rem', margin: '0', fontWeight: 'normal', lineHeight: '1.2' }}>Lytton</h2>
            <div style={{ fontSize: '1.2rem', margin: '8px 0', fontStyle: 'italic' }}>to</div>
            <h2 style={{ fontSize: '1.8rem', margin: '0', fontWeight: 'normal', lineHeight: '1.2' }}>Maulana Azad Library</h2>
            <div style={{ fontSize: '1.1rem', margin: '12px 0 0 0', fontStyle: 'italic' }}>(Vision and Mission)</div>
          </div>

          <div style={{ fontSize: '1.2rem', marginBottom: '30px', fontStyle: 'italic' }}>By</div>

          <div>
            <div style={{ fontSize: '1.1rem', marginBottom: '6px' }}>Prof. (Dr.) Shababat Husain, retd</div>
            <div style={{ fontSize: '0.7rem', letterSpacing: '0.5px' }}>M.Sc., M.L.I.S (Alig) M.Phil (England) PhD (Lucknow)</div>
          </div>
        </div>
      </div>



      <div style={{
        width: '100%',
        maxWidth: '350px',
        margin: '24px auto 0',
        backgroundColor: '#3b0f1b',
        padding: '16px 20px',
        borderRadius: '8px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        boxShadow: '0 4px 15px rgba(0,0,0,0.15)',
        border: '1px solid rgba(212, 175, 55, 0.2)'
      }}>
        {isOwned ? (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#e8d6b3', fontSize: '0.9rem', fontWeight: 500 }}>Access Granted</span>
              <span style={{ color: '#dfb76c', fontSize: '1.2rem', fontFamily: 'var(--font-heading)', fontWeight: 600 }}>Available</span>
            </div>
            <button
              onClick={() => onReadBook(featuredBook)}
              style={{
                width: '100%',
                background: '#dfb76c',
                color: '#000000',
                border: 'none',
                padding: '14px',
                borderRadius: '2px',
                fontSize: '0.9rem',
                fontWeight: 600,
                letterSpacing: '1px',
                cursor: 'pointer',
                transition: 'opacity 0.2s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
              onMouseOver={(e) => (e.target as HTMLButtonElement).style.opacity = '0.9'}
              onMouseOut={(e) => (e.target as HTMLButtonElement).style.opacity = '1'}
            >
              <span>📖</span> Read Manuscript
            </button>
            <div style={{ textAlign: 'center', color: '#a38a6d', fontSize: '0.65rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
              <span>✓</span> Added to your Personal Library
            </div>
          </>
        ) : (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#e8d6b3', fontSize: '0.8rem', fontWeight: 500 }}>Total Amount</span>
              <span style={{ color: '#dfb76c', fontSize: '1.2rem', fontFamily: 'var(--font-heading)', fontWeight: 600, letterSpacing: '1px' }}>
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
                width: '100%',
                background: '#dfb76c',
                color: '#000000',
                border: 'none',
                padding: '10px',
                borderRadius: '4px',
                fontSize: '0.85rem',
                fontWeight: 600,
                letterSpacing: '0.5px',
                cursor: 'pointer',
                transition: 'opacity 0.2s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px'
              }}
              onMouseOver={(e) => (e.target as HTMLButtonElement).style.opacity = '0.9'}
              onMouseOut={(e) => (e.target as HTMLButtonElement).style.opacity = '1'}
            >
              <span style={{ fontSize: '1.2rem', transform: 'rotate(-45deg)' }}>🖋️</span> Buy Now
            </button>
            <div style={{ textAlign: 'center', color: '#a38a6d', fontSize: '0.65rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
              <span>🔒</span> Encrypted & Secure Transaction
            </div>
          </>
        )}
      </div>
    </div>
  );
};
