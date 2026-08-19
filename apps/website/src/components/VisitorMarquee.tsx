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
      backgroundColor: 'transparent',
      padding: '12px 0',
      overflow: 'hidden',
      position: 'relative'
    }}>
      <div className="marquee-container" style={{ display: 'flex' }}>
        {/* We use two sets of the same content to create a seamless loop */}
        <div className="marquee-content" style={{ display: 'flex', gap: '48px', paddingRight: '48px', color: '#3e2a14', fontFamily: '"Playfair Display", serif', fontSize: '1.25rem', fontStyle: 'italic', animation: 'scrollMarquee 40s linear infinite' }}>
          {visitors.map((v, i) => (
            <span key={`a-${i}`} style={{ whiteSpace: 'nowrap' }}>
              <span style={{ color: '#b8860b', marginRight: '8px' }}>✦</span>
              {v.visitorName} {v.country ? <span style={{ fontSize: '0.9em', opacity: 0.8 }}>({v.country})</span> : ''}
            </span>
          ))}
        </div>
        <div className="marquee-content" style={{ display: 'flex', gap: '48px', paddingRight: '48px', color: '#3e2a14', fontFamily: '"Playfair Display", serif', fontSize: '1.25rem', fontStyle: 'italic', animation: 'scrollMarquee 40s linear infinite' }}>
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
