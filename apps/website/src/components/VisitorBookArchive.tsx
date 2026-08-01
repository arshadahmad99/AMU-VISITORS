import React, { useState } from 'react';

export const VisitorBookArchive: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Search:', searchQuery);
  };

  const inscriptions = [
    { name: 'Arthur C. Wickham', quote: '"A magnificent sanctuary of knowledge..."', date: '12 OCT 2023' },
    { name: 'Prof. Elena Moretti', quote: '"The digital interface is significantly more efficient."', date: '08 OCT 2023' },
    { name: 'Sir Reginald Hargreeves', quote: '"A wondrous collection for the curious mind."', date: '15 SEP 2023' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', height: '100%', fontFamily: 'var(--font-body)' }}>
      {/* Header */}
      {/* Header */}
      <div style={{ height: '160px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', paddingBottom: '16px' }}>
        <p style={{ fontSize: '0.65rem', fontWeight: 700, color: '#a0a0a0', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '8px' }}>
          UNIVERSITY ARCHIVE
        </p>
        <h2 style={{ fontSize: '1.8rem', fontWeight: 600, color: '#0b132b', margin: 0, fontFamily: 'var(--font-heading)' }}>
          Visitor Registry
        </h2>
      </div>

      {/* Main Content Area with Paper Texture */}
      <div
        style={{
          backgroundColor: '#ede9de',
          backgroundImage: 'linear-gradient(rgba(176, 184, 193, 0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(176, 184, 193, 0.3) 1px, transparent 1px)',
          backgroundSize: '2.2em 2.2em',
          padding: '32px 24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '24px',
          boxShadow: '0 4px 15px rgba(0,0,0,0.06)',
          border: '1px solid rgba(212, 207, 193, 0.6)',
          position: 'relative',
        }}
      >
        {/* Vertical dark line for margin effect */}
        <div style={{ position: 'absolute', top: 0, bottom: 0, left: '60px', width: '1px', background: 'rgba(0,0,0,0.2)' }} />

        {/* Form area */}
        <div style={{ zIndex: 1 }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#0b132b', fontFamily: 'var(--font-heading)', marginBottom: '16px', paddingLeft: '16px' }}>
            Archive Queries
          </h3>
          
          <form onSubmit={handleSearchSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px', paddingLeft: '16px' }}>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                placeholder="Search Nominee..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 0',
                  background: 'transparent',
                  border: 'none',
                  borderBottom: '1px solid rgba(0,0,0,0.2)',
                  fontSize: '0.85rem',
                  fontStyle: 'italic',
                  color: '#1a1a1a',
                  outline: 'none',
                }}
              />
              <span style={{ position: 'absolute', right: '0', top: '50%', transform: 'translateY(-50%)', color: '#8c8c8c', fontSize: '1rem' }}>
                🔍
              </span>
            </div>
            
            <button
              type="submit"
              style={{
                background: '#0b132b',
                color: '#fff',
                border: 'none',
                padding: '12px',
                fontSize: '0.75rem',
                fontWeight: 700,
                letterSpacing: '2px',
                textTransform: 'uppercase',
                cursor: 'pointer',
                transition: 'background 0.2s'
              }}
              onMouseOver={(e) => (e.target as HTMLButtonElement).style.background = '#1c2541'}
              onMouseOut={(e) => (e.target as HTMLButtonElement).style.background = '#0b132b'}
            >
              CONSULT RECORDS
            </button>
          </form>
        </div>

        <div style={{ width: '100%', height: '1px', background: 'rgba(0,0,0,0.1)', margin: '8px 0' }} />

        {/* Inscriptions list */}
        <div style={{ zIndex: 1, paddingLeft: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h3 style={{ fontSize: '2rem', fontWeight: 400, color: '#4a4a4a', fontFamily: 'var(--font-cursive)', margin: 0 }}>
              Recent Inscriptions
            </h3>
            <span style={{ fontSize: '1.2rem', color: '#0b132b' }}>✍️</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            {inscriptions.map((item, index) => (
              <div key={index} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <h4 style={{ fontSize: '1.6rem', fontWeight: 400, color: '#4a4a4a', margin: 0, fontFamily: 'var(--font-cursive)' }}>
                  {item.name}
                </h4>
                <p style={{ fontSize: '0.8rem', color: '#8c8c8c', fontStyle: 'italic', margin: 0, lineHeight: '1.5' }}>
                  {item.quote}
                </p>
                <span style={{ fontSize: '0.55rem', color: '#a0a0a0', fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase', marginTop: '4px' }}>
                  {item.date}
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};
