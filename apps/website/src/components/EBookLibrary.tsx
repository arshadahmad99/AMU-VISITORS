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

  const chapters = [
    "Introduction: The Tech Landscape",
    "Artificial Intelligence Explained",
    "Internet of Things (IoT) in Daily Life",
    "Blockchain & Cryptocurrency Fundamentals",
    "Cybersecurity: Protecting Your Data",
    "The Future of Work & Automation",
    "Emerging Technologies & Social Impact",
    "Cloud Computing & Big Data",
    "Sustainable Tech & Green Innovation",
    "Conclusion: Embracing the Digital Age",
  ];

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      height: '100%',
      fontFamily: 'var(--font-body)',
      background: 'linear-gradient(to bottom, #dbe6f6, #f2f5fc)',
      borderRadius: '4px',
      padding: '24px',
      boxShadow: '0 8px 30px rgba(0,0,0,0.05)',
      alignItems: 'center',
      border: '1px solid rgba(255,255,255,0.6)'
    }}>
      {/* Header Section */}
      <div style={{ textAlign: 'center', marginBottom: '24px', marginTop: '8px' }}>
        <h2 style={{
          fontSize: '1.8rem',
          fontWeight: 400,
          color: '#0a1d3f',
          margin: '0 0 8px 0',
          fontFamily: 'var(--font-heading)',
          lineHeight: '1.2',
          textTransform: 'uppercase',
          letterSpacing: '1px'
        }}>
          THE DIGITAL FRONTIER:<br />NAVIGATING TOMORROW'S<br />TECHNOLOGY
        </h2>
        <p style={{
          fontSize: '0.75rem',
          fontWeight: 600,
          color: '#7086a3',
          letterSpacing: '2px',
          textTransform: 'uppercase',
          margin: 0
        }}>
          AN ESSENTIAL GUIDE
        </p>
      </div>

      {/* Table of Contents - White Card */}
      <div style={{
        background: '#ffffff',
        width: '100%',
        padding: '24px',
        borderRadius: '2px',
        boxShadow: '0 4px 15px rgba(0,0,0,0.04)',
        marginBottom: '24px'
      }}>
        <h3 style={{
          fontSize: '0.8rem',
          fontWeight: 700,
          color: '#5a6b82',
          letterSpacing: '2px',
          textTransform: 'uppercase',
          textAlign: 'center',
          margin: '0 0 16px 0'
        }}>
          TABLE OF CONTENTS:
        </h3>

        <div style={{ width: '100%', height: '1px', background: '#eef1f5', marginBottom: '16px' }} />

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {chapters.map((title, idx) => (
            <div key={idx} style={{ display: 'flex', fontSize: '0.8rem', color: '#4a5568', lineHeight: '1.4' }}>
              <span style={{ fontWeight: 600, width: '24px' }}>{idx + 1}.</span>
              <span>{title}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{
        marginTop: '16px',
        width: '100%',
        backgroundColor: '#031738',
        padding: '24px',
        borderRadius: '4px',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
      }}>
        {isOwned ? (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#8fa9c9', fontSize: '0.9rem', fontWeight: 500 }}>Access Granted</span>
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
            <div style={{ textAlign: 'center', color: '#4a6485', fontSize: '0.65rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
              <span>✓</span> Added to your Personal Library
            </div>
          </>
        ) : (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#8fa9c9', fontSize: '0.9rem', fontWeight: 500 }}>Total Amount</span>
              <span style={{ color: '#dfb76c', fontSize: '1.4rem', fontFamily: 'var(--font-heading)', fontWeight: 600, letterSpacing: '1px' }}>
                499 INR
              </span>
            </div>
            <button
              onClick={() => onBuyBook(featuredBook)}
              style={{
                width: '100%',
                background: '#dfb76c',
                color: '#000000',
                border: 'none',
                padding: '14px',
                borderRadius: '2px',
                fontSize: '0.95rem',
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
            <div style={{ textAlign: 'center', color: '#4a6485', fontSize: '0.65rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
              <span>🔒</span> Encrypted & Secure Transaction
            </div>
          </>
        )}
      </div>
    </div>
  );
};
