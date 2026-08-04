import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer
      style={{
        width: '100%',
        backgroundColor: '#040b16', // Dark navy background matching the image
        padding: '40px 60px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 'auto',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <h2
          style={{
            color: '#fdfcf0', // Off-white text
            fontFamily: 'var(--font-heading)',
            fontSize: '1.6rem',
            margin: 0,
            fontWeight: 400,
          }}
        >
          AMUMALibrary
        </h2>
        <p
          style={{
            color: '#8c95a3',
            fontFamily: 'var(--font-body)',
            fontSize: '0.85rem',
            margin: 0,
          }}
        >
          © 2024 University Digital Heritage Archive. Preservation through Innovation.
        </p>
      </div>

      <div style={{ display: 'flex', gap: '32px' }}>
        {['Terms', 'Privacy', 'Ethics', 'Contact'].map((link) => (
          <a
            key={link}
            href={`#${link.toLowerCase()}`}
            style={{
              color: '#8c95a3',
              fontFamily: 'var(--font-body)',
              fontSize: '0.85rem',
              textDecoration: 'none',
              transition: 'color 0.2s',
            }}
            onMouseOver={(e) => (e.target as HTMLAnchorElement).style.color = '#fdfcf0'}
            onMouseOut={(e) => (e.target as HTMLAnchorElement).style.color = '#8c95a3'}
          >
            {link}
          </a>
        ))}
      </div>
    </footer>
  );
};
