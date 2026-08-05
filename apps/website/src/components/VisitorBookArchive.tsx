import React, { useState, useEffect, useRef } from 'react';
import { VisitorRecord } from '@digital-library/types';
import { fetchVisitors } from '../services/api';
// @ts-ignore
import HTMLFlipBook from 'react-pageflip';

const Page = React.forwardRef<HTMLDivElement, { children: React.ReactNode; number: number }>((props, ref) => {
  return (
    <div 
      className="demoPage" 
      ref={ref}
      style={{
        backgroundColor: '#ffffff', // Basic white page color
        boxShadow: 'inset 0 0 40px rgba(0,0,0,0.05)', // Subtle inner shadow
        border: '1px solid #e0e0e0', 
        padding: '32px',
        height: '100%',
        overflow: 'hidden',
        fontFamily: '"Playfair Display", "Georgia", serif',
        color: '#3e2a14',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <div style={{
        position: 'absolute',
        top: 0,
        bottom: 0,
        left: props.number % 2 === 0 ? 'auto' : 0,
        right: props.number % 2 === 0 ? 0 : 'auto',
        width: '30px',
        background: props.number % 2 === 0 
          ? 'linear-gradient(to left, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0) 100%)' 
          : 'linear-gradient(to right, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0) 100%)',
        pointerEvents: 'none'
      }} />
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {props.children}
      </div>
      <div style={{ 
        position: 'absolute', 
        bottom: '16px', 
        right: props.number % 2 === 0 ? 'auto' : '16px',
        left: props.number % 2 === 0 ? '16px' : 'auto',
        fontSize: '0.8rem',
        color: '#8b7b6b'
      }}>
        {props.number}
      </div>
    </div>
  );
});

export const VisitorBookArchive: React.FC = () => {
  const [visitors, setVisitors] = useState<VisitorRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const bookRef = useRef<any>(null);

  useEffect(() => {
    loadVisitors();
  }, []);

  const loadVisitors = async () => {
    setLoading(true);
    try {
      const data = await fetchVisitors();
      setVisitors(data);
    } catch (err) {
      console.error('Failed to load visitors', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredVisitors = visitors
    .filter(v => 
      v.visitorName.toLowerCase().includes(searchQuery.toLowerCase()) || 
      (v.designation && v.designation.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (v.country && v.country.toLowerCase().includes(searchQuery.toLowerCase()))
    )
    .reduce((unique, current) => {
      const existingIdx = unique.findIndex(u => u.visitorName === current.visitorName);
      if (existingIdx !== -1) {
        if (!unique[existingIdx].autographPath && current.autographPath) {
          unique[existingIdx] = current;
        }
      } else {
        unique.push(current);
      }
      return unique;
    }, [] as VisitorRecord[]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', fontFamily: 'var(--font-body)', padding: '24px 0' }}>
      {/* Container */}
      <div style={{
          backgroundColor: 'var(--bg-card, #ffffff)',
          border: '1px solid var(--border-light, #eaeaea)',
          borderRadius: '12px',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          height: '750px', // Fixed height
          boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
      }}>
        
        {/* Header & Search */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ margin: 0, fontSize: '1.5rem', color: 'var(--text-primary)', fontWeight: 600 }}>
            Distinguished Visitors Archive
          </h2>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button onClick={() => bookRef.current?.pageFlip()?.flipPrev()} style={{ padding: '8px 16px', cursor: 'pointer' }}>Previous Page</button>
            <button onClick={() => bookRef.current?.pageFlip()?.flipNext()} style={{ padding: '8px 16px', cursor: 'pointer' }}>Next Page</button>
            <div style={{ position: 'relative', width: '250px', marginLeft: '12px' }}>
              <input
                type="text"
                placeholder="Search by name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 16px 10px 40px',
                  borderRadius: '24px',
                  border: '1px solid var(--border-light)',
                  fontSize: '0.95rem',
                  outline: 'none',
                }}
              />
              <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#999', fontSize: '1.1rem' }}>
                ⚲
              </span>
            </div>
          </div>
        </div>

        {/* List Content */}
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1, backgroundColor: '#e9e4df', borderRadius: '8px', overflow: 'hidden' }}>
          {loading ? (
            <div style={{ color: 'var(--text-muted)' }}>Loading visitor records...</div>
          ) : filteredVisitors.length === 0 ? (
            <div style={{ color: '#888' }}>No visitors found matching your search.</div>
          ) : (
            <HTMLFlipBook 
              width={450} 
              height={600} 
              size="stretch"
              minWidth={315}
              maxWidth={1000}
              minHeight={400}
              maxHeight={800}
              maxShadowOpacity={0.5}
              showCover={true}
              mobileScrollSupport={true}
              ref={bookRef}
              className="visitor-flipbook"
              style={{ margin: '0 auto', boxShadow: '0 0 20px rgba(0,0,0,0.5)' }}
            >
              {/* Cover Page */}
              <div className="demoPage" style={{ backgroundColor: '#4a2c11', color: '#d4af37', display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', border: '4px solid #2e1a09', borderRadius: '4px 12px 12px 4px' }}>
                <h1 style={{ fontFamily: '"Playfair Display", serif', textAlign: 'center', border: '2px solid #d4af37', padding: '24px' }}>
                  Maulana Azad Library<br/><br/>Distinguished<br/>Visitor Registry
                </h1>
              </div>

              {/* Data Pages */}
              {filteredVisitors.map((visitor, index) => (
                <Page key={visitor.id} number={index + 1}>
                  {/* Text Details */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderBottom: '2px dotted #e0e0e0', paddingBottom: '16px' }}>
                    <h3 style={{ margin: 0, fontSize: '1.6rem', fontStyle: 'italic', fontWeight: 700, color: '#2c1e0e', lineHeight: 1.2 }}>
                      {visitor.visitorName}
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.9rem', fontStyle: 'italic', color: '#5a4634', marginTop: '8px' }}>
                      {visitor.designation && <span><strong>Designation:</strong> {visitor.designation}</span>}
                      {visitor.country && <span><strong>Country:</strong> {visitor.country}</span>}
                      <span><strong>Date:</strong> {visitor.visitDate}</span>
                      {visitor.pageNumber && <span><strong>Original Page No:</strong> {visitor.pageNumber}</span>}
                    </div>
                  </div>
                  
                  {/* Images Container */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', marginTop: '16px' }}>
                    {visitor.visitorImagePath && (
                      <div style={{
                        padding: '8px',
                        backgroundColor: '#fff',
                        border: '1px solid #e0d0b8',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
                        transform: 'rotate(-2deg)' 
                      }}>
                        <img 
                          src={visitor.visitorImagePath} 
                          alt={`${visitor.visitorName} photo`}
                          style={{ maxWidth: '150px', maxHeight: '150px', objectFit: 'cover' }}
                          onError={(e) => {
                            e.currentTarget.src = `http://localhost:5000${visitor.visitorImagePath}`;
                          }}
                        />
                      </div>
                    )}

                    {visitor.autographPath && (
                      <div style={{ 
                        width: '100%',
                        display: 'flex', 
                        justifyContent: 'center', 
                        alignItems: 'center', 
                        padding: '8px'
                      }}>
                        <img 
                          src={visitor.autographPath} 
                          alt={`${visitor.visitorName} autograph`}
                          style={{ maxWidth: '100%', maxHeight: '200px', objectFit: 'contain', mixBlendMode: 'multiply' }}
                          onError={(e) => {
                            e.currentTarget.src = `http://localhost:5000${visitor.autographPath}`;
                          }}
                        />
                      </div>
                    )}
                  </div>
                </Page>
              ))}

              {/* Back Cover */}
              <div className="demoPage" style={{ backgroundColor: '#4a2c11', height: '100%', border: '4px solid #2e1a09', borderRadius: '12px 4px 4px 12px' }}>
              </div>
            </HTMLFlipBook>
          )}
        </div>
      </div>
    </div>
  );
};
