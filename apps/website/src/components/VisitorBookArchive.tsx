import React, { useState, useEffect } from 'react';
import { VisitorRecord } from '@digital-library/types';
import { fetchVisitors } from '../services/api';

export const VisitorBookArchive: React.FC = () => {
  const [visitors, setVisitors] = useState<VisitorRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

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
        // If there's a duplicate visit, prefer the record that has an autograph image
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
          height: '600px', // Fixed height with scrollable interior
          boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
      }}>
        
        {/* Header & Search */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ margin: 0, fontSize: '1.5rem', color: 'var(--text-primary)', fontWeight: 600 }}>
            Distinguished Visitors Archive
          </h2>
          <div style={{ position: 'relative', width: '300px' }}>
            <input
              type="text"
              placeholder="Search by name, designation..."
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

        {/* List Content */}
        <div style={{ overflowY: 'auto', flex: 1, paddingRight: '8px' }}>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
              <span style={{ color: 'var(--text-muted)' }}>Loading visitor records...</span>
            </div>
          ) : filteredVisitors.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#888', padding: '40px' }}>
              No visitors found matching your search.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {filteredVisitors.map((visitor) => (
                <div key={visitor.id} style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  padding: '20px', 
                  border: '1px solid var(--border-light, #eaeaea)', 
                  borderRadius: '8px',
                  backgroundColor: 'var(--bg-primary, #fafafa)',
                  transition: 'box-shadow 0.2s',
                }}
                onMouseOver={(e) => e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.05)'}
                onMouseOut={(e) => e.currentTarget.style.boxShadow = 'none'}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
                    <h3 style={{ margin: 0, fontSize: '1.25rem', color: 'var(--text-primary)' }}>{visitor.visitorName}</h3>
                    <div style={{ display: 'flex', gap: '16px', color: 'var(--text-secondary)', fontSize: '0.9rem', flexWrap: 'wrap' }}>
                      {visitor.designation && <span><strong>Designation:</strong> {visitor.designation}</span>}
                      {visitor.country && <span><strong>Country:</strong> {visitor.country}</span>}
                      <span><strong>Date:</strong> {visitor.visitDate}</span>
                      {visitor.pageNumber && <span><strong>Page No:</strong> {visitor.pageNumber}</span>}
                    </div>
                  </div>
                  
                  {visitor.visitorImagePath && (
                    <div style={{ 
                      marginTop: '16px', 
                      width: '100%',
                      display: 'flex', 
                      justifyContent: 'center', 
                      alignItems: 'center', 
                      backgroundColor: '#fff', 
                      border: '1px solid #eee', 
                      borderRadius: '8px', 
                      overflow: 'hidden',
                      padding: '16px'
                    }}>
                      <img 
                        src={visitor.visitorImagePath} 
                        alt={`${visitor.visitorName} photo`}
                        style={{ maxWidth: '200px', maxHeight: '200px', objectFit: 'cover', borderRadius: '4px' }}
                        onError={(e) => {
                          e.currentTarget.src = `http://localhost:5000${visitor.visitorImagePath}`;
                        }}
                      />
                    </div>
                  )}
                  {visitor.autographPath && (
                    <div style={{ 
                      marginTop: '16px', 
                      width: '100%',
                      display: 'flex', 
                      justifyContent: 'center', 
                      alignItems: 'center', 
                      backgroundColor: '#fff', 
                      border: '1px solid #eee', 
                      borderRadius: '8px', 
                      overflow: 'hidden',
                      padding: '16px'
                    }}>
                      <img 
                        src={visitor.autographPath} 
                        alt={`${visitor.visitorName} autograph`}
                        style={{ maxWidth: '100%', maxHeight: '300px', objectFit: 'contain' }}
                        onError={(e) => {
                          e.currentTarget.src = `http://localhost:5000${visitor.autographPath}`;
                        }}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
