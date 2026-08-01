import React from 'react';
import { Book } from '@digital-library/types';
import { formatCurrency } from '@digital-library/utils';

interface EBookLibraryProps {
  books: Book[];
  purchasedBookIds: string[];
  onBuyBook: (book: Book) => void;
  onReadBook: (book: Book) => void;
}

export const EBookLibrary: React.FC<EBookLibraryProps> = ({
  books,
  purchasedBookIds,
  onBuyBook,
  onReadBook,
}) => {
  const featuredBook = books[0];
  const isOwned = featuredBook ? purchasedBookIds.includes(featuredBook.id) : false;

  const mockChapters = [
    { title: 'Chapter I: The Prima Materia', page: '04' },
    { title: 'Chapter II: Calcination', page: '28' },
    { title: 'Chapter III: Dissolution', page: '52' },
    { title: 'Chapter IV: Separation', page: '81' },
    { title: 'Chapter V: Conjunction', page: '114' },
    { title: 'Chapter VI: Distillation', page: '143' },
    { title: 'Chapter VII: Coagulation', page: '172' },
    { title: 'Chapter VIII: The Philosopher\'s Stone', page: '201' },
    { title: 'Chapter IX: Transmutation', page: '235' },
    { title: 'Chapter X: Immortality', page: '270' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', height: '100%', fontFamily: 'var(--font-body)' }}>

      {/* Header Section */}
      {/* Header Section */}
      <div style={{ textAlign: 'center', height: '160px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', paddingBottom: '16px' }}>
        <p style={{ fontSize: '0.65rem', fontWeight: 700, color: '#a0a0a0', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '16px' }}>
          FEATURED MANUSCRIPT
        </p>
        <h2 style={{ fontSize: '2.4rem', fontWeight: 400, color: '#0b132b', margin: '0 0 12px 0', fontFamily: 'var(--font-heading)', lineHeight: '1.2' }}>
          The Alchemist's<br />Compendium
        </h2>
        <p style={{ fontSize: '0.65rem', fontWeight: 600, color: '#8c8c8c', letterSpacing: '1px', textTransform: 'uppercase' }}>
          ATTRIBUTED TO NICOLAS FLAMEL
        </p>
      </div>

      {/* <div style={{ width: '100%', height: '1px', background: 'linear-gradient(90deg, transparent, #d4cfc1, transparent)' }} /> */}

      {/* Table of Contents - Graph Paper Style */}
      <div
        style={{
          backgroundColor: '#ede9de',
          backgroundImage: 'linear-gradient(rgba(176, 184, 193, 0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(176, 184, 193, 0.3) 1px, transparent 1px)',
          backgroundSize: '2.2em 2.2em',
          padding: '25px 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
          border: '1px solid rgba(212, 207, 193, 0.6)',
          boxShadow: '0 4px 15px rgba(0,0,0,0.06)',
          position: 'relative',
        }}
      >
        {/* Vertical dark line for margin effect */}
        <div style={{ position: 'absolute', top: 0, bottom: 0, left: '60px', width: '1px', background: 'rgba(0,0,0,0.2)' }} />

        <div style={{ zIndex: 1 }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#0b132b', fontFamily: 'var(--font-heading)', marginBottom: '24px' }}>
            Table of Contents
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {mockChapters.map((chapter, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', fontSize: '0.85rem', color: '#1a1a1a', lineHeight: '2.2em' }}>
                <span style={{ color: '#8c8c8c', width: '36px', fontSize: '0.75rem', fontFamily: 'var(--font-body)' }}>
                  {String(idx + 1).padStart(2, '0')}
                </span>
                <span style={{ paddingLeft: '16px' }}>{chapter.title}</span>
                <div style={{ flex: 1 }} />
                <span style={{ color: '#8c8c8c', fontSize: '0.75rem' }}>
                  p. {chapter.page}
                </span>
              </div>
            ))}
          </div>

          <div style={{ marginTop: '32px' }}>
            {isOwned ? (
              <button
                onClick={() => onReadBook(featuredBook)}
                style={{ width: '100%', background: '#0b132b', color: '#fff', border: 'none', padding: '16px', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', cursor: 'pointer', transition: 'background 0.2s' }}
                onMouseOver={(e) => (e.target as HTMLButtonElement).style.background = '#1c2541'}
                onMouseOut={(e) => (e.target as HTMLButtonElement).style.background = '#0b132b'}
              >
                BEGIN READING
              </button>
            ) : (
              <button
                onClick={() => onBuyBook(featuredBook)}
                style={{ width: '100%', background: '#0b132b', color: '#fff', border: 'none', padding: '16px', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', cursor: 'pointer', transition: 'background 0.2s' }}
                onMouseOver={(e) => (e.target as HTMLButtonElement).style.background = '#1c2541'}
                onMouseOut={(e) => (e.target as HTMLButtonElement).style.background = '#0b132b'}
              >
                {featuredBook ? (featuredBook.price < 50 ? `ACQUIRE FOR ₹${Math.round(featuredBook.price * 10)}` : `ACQUIRE FOR ${formatCurrency(featuredBook.price)}`) : 'ACQUIRE'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

