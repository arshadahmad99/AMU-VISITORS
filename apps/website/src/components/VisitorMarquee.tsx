import React, { useEffect, useState } from 'react';
import { fetchVisitors } from '../services/api';
import { VisitorRecord } from '@digital-library/types';

export const VisitorMarquee: React.FC = () => {
  const [visitors, setVisitors] = useState<VisitorRecord[]>([]);

  useEffect(() => {
    fetchVisitors()
      .then((data) => {
        // Shuffle the visitors to make it random
        const shuffled = [...data].sort(() => 0.5 - Math.random());
        // Pick 15 random ones
        setVisitors(shuffled.slice(0, 15));
      })
      .catch((err) => console.error('Failed to load visitors for marquee', err));
  }, []);

  if (visitors.length === 0) return null;

  return (
    <div style={{
      width: '100%',
      backgroundColor: 'rgba(255, 253, 248, 0.7)',
      borderTop: '1px solid rgba(184, 134, 11, 0.25)',
      borderBottom: '1px solid rgba(184, 134, 11, 0.25)',
      padding: '10px 0',
      overflow: 'hidden',
      position: 'relative',
      display: 'flex',
      alignItems: 'center',
      boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.03)'
    }}>
      {/* Left Badge Label for Visitors List */}
      <div style={{
        zIndex: 10,
        background: 'linear-gradient(135deg, #4a1521, #2b0b13)',
        color: '#f3e5ab',
        padding: '6px 16px',
        borderRadius: '0 20px 20px 0',
        fontWeight: 700,
        fontSize: '0.82rem',
        letterSpacing: '1.2px',
        textTransform: 'uppercase',
        fontFamily: '"Playfair Display", serif',
        boxShadow: '3px 0 12px rgba(0,0,0,0.2)',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        whiteSpace: 'nowrap',
        flexShrink: 0,
        marginRight: '12px'
      }}>
        <span>📜 HISTORIC VISITORS LIST</span>
      </div>

      <div className="marquee-container" style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* We use two sets of the same content to create a seamless loop */}
        <div className="marquee-content" style={{ display: 'flex', gap: '48px', paddingRight: '48px', color: '#3e2a14', fontFamily: '"Playfair Display", serif', fontSize: '1.2rem', fontStyle: 'italic', animation: 'scrollMarquee 40s linear infinite' }}>
          {visitors.map((v, i) => (
            <span key={`a-${i}`} style={{ whiteSpace: 'nowrap' }}>
              <span style={{ color: '#b8860b', marginRight: '8px' }}>✦</span>
              {v.visitorName} {v.country ? <span style={{ fontSize: '0.9em', opacity: 0.8 }}>({v.country})</span> : ''}
            </span>
          ))}
        </div>
        <div className="marquee-content" style={{ display: 'flex', gap: '48px', paddingRight: '48px', color: '#3e2a14', fontFamily: '"Playfair Display", serif', fontSize: '1.2rem', fontStyle: 'italic', animation: 'scrollMarquee 40s linear infinite' }}>
          {visitors.map((v, i) => (
            <span key={`b-${i}`} style={{ whiteSpace: 'nowrap' }}>
              <span style={{ color: '#b8860b', marginRight: '8px' }}>✦</span>
              {v.visitorName} {v.country ? <span style={{ fontSize: '0.9em', opacity: 0.8 }}>({v.country})</span> : ''}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};
