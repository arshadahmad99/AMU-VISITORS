import React from 'react';

export const InfoCards: React.FC = () => {
  return (
    <section style={{ 
      display: 'flex', 
      gap: '24px', 
      width: '100%', 
      marginTop: '48px',
      flexWrap: 'wrap' 
    }}>
      {/* Primary Acquisition Card */}
      <div className="glass-card" style={{ 
        flex: '1 1 400px',
        padding: '32px',
        borderTop: '6px solid #3b0f1b',
        backgroundColor: '#fcfbf9',
        borderRadius: '8px',
        boxShadow: '0 4px 15px rgba(0,0,0,0.05)',
        display: 'flex',
        flexDirection: 'column'
      }}>
        <div style={{ 
          fontSize: '0.8rem', 
          fontWeight: 700, 
          letterSpacing: '1px', 
          color: '#b8860b', 
          textTransform: 'uppercase',
          marginBottom: '12px'
        }}>
          Primary Acquisition
        </div>
        <h2 style={{ 
          fontFamily: '"Playfair Display", "Georgia", serif',
          fontSize: '1.8rem',
          fontWeight: 600,
          color: '#1a0e05',
          margin: '0 0 16px 0',
          lineHeight: 1.3
        }}>
          Lytton to Maulana Azad Library
        </h2>
        <p style={{ 
          fontFamily: 'var(--font-body)',
          fontSize: '1rem',
          color: '#5c6b73',
          lineHeight: 1.6,
          margin: 0
        }}>
          The definitive architectural and institutional history of the library's evolution. A companion piece essential for true bibliophiles.
        </p>
      </div>

      {/* Included Free Card */}
      <div className="glass-card" style={{ 
        flex: '1 1 400px',
        padding: '32px',
        backgroundColor: '#ffffff',
        borderRadius: '8px',
        boxShadow: '0 4px 15px rgba(0,0,0,0.05)',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        {/* Star Badge top right */}
        <div style={{
          position: 'absolute',
          top: '-25px',
          right: '-25px',
          width: '80px',
          height: '80px',
          background: '#fdf8f0',
          transform: 'rotate(45deg)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'flex-end',
          paddingBottom: '12px'
        }}>
          <div style={{ 
            width: '20px', 
            height: '20px', 
            borderRadius: '50%', 
            background: '#b8860b', 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center',
            transform: 'rotate(-45deg)' 
          }}>
            <span style={{ color: '#fff', fontSize: '12px' }}>★</span>
          </div>
        </div>

        <div style={{ 
          fontSize: '0.8rem', 
          fontWeight: 700, 
          letterSpacing: '1px', 
          color: '#3e2a14', 
          backgroundColor: '#fcdb8b',
          display: 'inline-block',
          padding: '4px 12px',
          borderRadius: '4px',
          textTransform: 'uppercase',
          marginBottom: '16px',
          alignSelf: 'flex-start'
        }}>
          Included Free
        </div>
        <h2 style={{ 
          fontFamily: '"Playfair Display", "Georgia", serif',
          fontSize: '1.8rem',
          fontWeight: 600,
          color: '#1a0e05',
          margin: '0 0 16px 0',
          lineHeight: 1.3
        }}>
          102 Years Old Visitors Book
        </h2>
        <p style={{ 
          fontFamily: 'var(--font-body)',
          fontSize: '1rem',
          color: '#5c6b73',
          lineHeight: 1.6,
          margin: 0
        }}>
          A meticulously preserved record spanning from 1906 to 2008. Witness the signatures and reflections of dignitaries, scholars, and historical figures who walked the halls of knowledge.
        </p>
      </div>
    </section>
  );
};
