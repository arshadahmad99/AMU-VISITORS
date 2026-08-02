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
      height: '100%',
      fontFamily: 'var(--font-body)',
      background: 'linear-gradient(to bottom, #dbe6f6, #f2f5fc)',
      borderRadius: '4px',
      padding: '40px',
      boxShadow: '0 8px 30px rgba(0,0,0,0.05)',
      alignItems: 'center',
      border: '1px solid rgba(255,255,255,0.6)'
    }}>
      {/* Header Section */}
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <h2 style={{
          fontSize: '1.8rem',
          fontWeight: 400,
          color: '#0a1d3f',
          margin: '0 0 16px 0',
          fontFamily: 'var(--font-heading)',
          lineHeight: '1.3',
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
        padding: '32px',
        borderRadius: '2px',
        boxShadow: '0 4px 15px rgba(0,0,0,0.04)',
        marginBottom: '40px'
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
        
        <div style={{ width: '100%', height: '1px', background: '#eef1f5', marginBottom: '24px' }} />

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {chapters.map((title, idx) => (
            <div key={idx} style={{ display: 'flex', fontSize: '0.8rem', color: '#4a5568', lineHeight: '1.4' }}>
              <span style={{ fontWeight: 600, width: '24px' }}>{idx + 1}.</span>
              <span>{title}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ marginTop: 'auto', width: '100%', textAlign: 'center' }}>
        <p style={{
          fontSize: '0.6rem',
          fontWeight: 600,
          color: '#8da2bc',
          letterSpacing: '2px',
          textTransform: 'uppercase',
          margin: '0 0 24px 0'
        }}>
          WWW.TECHGUIDEBOOKS.COM
        </p>

        {isOwned ? (
          <button
            onClick={() => onReadBook(featuredBook)}
            style={{
              background: '#dfb76c',
              color: '#000000',
              border: 'none',
              padding: '14px 32px',
              borderRadius: '24px',
              fontSize: '0.8rem',
              fontWeight: 700,
              letterSpacing: '1.5px',
              textTransform: 'uppercase',
              cursor: 'pointer',
              transition: 'transform 0.2s, background 0.2s',
              boxShadow: '0 4px 12px rgba(223, 183, 108, 0.3)'
            }}
            onMouseOver={(e) => (e.target as HTMLButtonElement).style.transform = 'translateY(-2px)'}
            onMouseOut={(e) => (e.target as HTMLButtonElement).style.transform = 'translateY(0)'}
          >
            READ NOW
          </button>
        ) : (
          <button
            onClick={() => onBuyBook(featuredBook)}
            style={{
              background: '#dfb76c',
              color: '#000000',
              border: 'none',
              padding: '14px 32px',
              borderRadius: '24px',
              fontSize: '0.8rem',
              fontWeight: 700,
              letterSpacing: '1.5px',
              textTransform: 'uppercase',
              cursor: 'pointer',
              transition: 'transform 0.2s, background 0.2s',
              boxShadow: '0 4px 12px rgba(223, 183, 108, 0.3)'
            }}
            onMouseOver={(e) => (e.target as HTMLButtonElement).style.transform = 'translateY(-2px)'}
            onMouseOut={(e) => (e.target as HTMLButtonElement).style.transform = 'translateY(0)'}
          >
            DOWNLOAD NOW
          </button>
        )}
      </div>
    </div>
  );
};
