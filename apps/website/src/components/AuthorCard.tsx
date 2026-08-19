import React from 'react';

export const AuthorCard: React.FC = () => {
  return (
    <section style={{ 
      width: '100%', 
      display: 'flex',
      justifyContent: 'center',
      marginTop: '48px',
      marginBottom: '24px'
    }}>
      <div className="glass-card" style={{
        maxWidth: '800px',
        width: '100%',
        backgroundColor: '#3b0f1b',
        borderRadius: '8px',
        padding: '40px',
        boxShadow: '0 8px 30px rgba(0,0,0,0.15)',
        border: '1px solid rgba(212, 175, 55, 0.3)',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Decorative elements */}
        <div style={{ position: 'absolute', top: '10px', left: '10px', color: 'rgba(212, 175, 55, 0.2)', fontSize: '2rem' }}>✥</div>
        <div style={{ position: 'absolute', top: '10px', right: '10px', color: 'rgba(212, 175, 55, 0.2)', fontSize: '2rem' }}>✥</div>
        <div style={{ position: 'absolute', bottom: '10px', left: '10px', color: 'rgba(212, 175, 55, 0.2)', fontSize: '2rem' }}>✥</div>
        <div style={{ position: 'absolute', bottom: '10px', right: '10px', color: 'rgba(212, 175, 55, 0.2)', fontSize: '2rem' }}>✥</div>

        <div style={{ 
          fontSize: '0.9rem', 
          fontWeight: 600, 
          letterSpacing: '2px', 
          color: '#e8d6b3', 
          textTransform: 'uppercase',
          marginBottom: '16px'
        }}>
          About the Author & Founder
        </div>
        
        <h2 style={{ 
          fontFamily: '"Playfair Display", "Georgia", serif',
          fontSize: '2.5rem',
          color: '#dfb76c',
          margin: '0 0 16px 0',
          lineHeight: 1.2,
          fontWeight: 600
        }}>
          Prof. (Dr.) Shabahat Husain, retd
        </h2>
        
        <p style={{ 
          fontFamily: 'var(--font-body)',
          fontSize: '1.1rem',
          color: '#f4ebd8',
          lineHeight: 1.6,
          margin: 0,
          fontWeight: 400
        }}>
          M.Sc., M.L.I.S (Alig) M.Phil (England) PhD (Lucknow)
        </p>
      </div>
    </section>
  );
};
