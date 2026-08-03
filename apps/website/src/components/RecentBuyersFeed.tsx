import React from 'react';
import { Purchase } from '@digital-library/types';
import { formatCurrency } from '@digital-library/utils';

interface RecentBuyersFeedProps {
  purchases: Purchase[];
}

export const RecentBuyersFeed: React.FC<RecentBuyersFeedProps> = ({ purchases }) => {
  const mockPurchasers = [
    { name: 'Abraham V. Van Helsing', amount: 450, time: '2m ago', tag: 'MEMBER', tagColor: '#f5b041', tagBg: '#fdf2e9' },
    { name: 'Lady Gwendolyn', amount: 1200, time: '15m ago', tag: 'ALUMNI', tagColor: '#a6acaf', tagBg: '#f2f3f4' },
    { name: 'Trinity College', amount: 5000, time: '1h ago', tag: 'INSTITUTIONAL', tagColor: '#5dade2', tagBg: '#ebf5fb' },
    { name: 'Dr. Elena Moretti', amount: 180, time: '3h ago', tag: 'SCHOLAR', tagColor: '#a6acaf', tagBg: '#f2f3f4' },
    { name: 'Arthur C. Wickham', amount: 450, time: '5h ago', tag: 'MEMBER', tagColor: '#f5b041', tagBg: '#fdf2e9' },
  ];

  const list = purchases.length > 0
    ? purchases.slice(0, 10).map((p, i) => {
      const mock = mockPurchasers[i % mockPurchasers.length];
      return {
        name: p.userName || mock.name,
        amount: p.amount || mock.amount,
        time: mock.time,
        tag: mock.tag,
        tagColor: mock.tagColor,
        tagBg: mock.tagBg,
      };
    })
    : mockPurchasers;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', height: '100%', fontFamily: 'var(--font-body)' }}>

      {/* Header */}
      <div style={{ height: '100px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', paddingBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
          <span style={{ fontSize: '1.6rem' }}>📜</span>
          <h3 style={{ fontSize: '1.7rem', fontWeight: 600, color: '#0b132b', fontFamily: 'var(--font-heading)', lineHeight: '1.1', margin: 0 }}>
            Recent<br />Subscriber
          </h3>
        </div>
      </div>

      {/* <div style={{ width: '100%', height: '1px', background: 'rgba(0,0,0,0.06)', marginBottom: '8px' }} /> */}

      {/* Ledger List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1, justifyContent: 'space-between' }}>
        {list.map((item, index) => (
          <div
            key={index}
            style={{
              background: '#ffffff',
              padding: '12px 16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
              position: 'relative',
              border: '1px solid #f9f9f9'
            }}
          >
            {/* Top Row: Avatar & Tag */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  background: '#f0ede5',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 600,
                  color: '#4a4a4a',
                  fontSize: '0.9rem'
                }}
              >
                {item.name.charAt(0)}
              </div>
              <span
                style={{
                  fontSize: '0.65rem',
                  fontWeight: 700,
                  background: item.tagBg,
                  color: item.tagColor,
                  padding: '4px 8px',
                  borderRadius: '2px',
                  letterSpacing: '0.5px'
                }}
              >
                {item.tag}
              </span>
            </div>

            {/* Name */}
            <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#1a1a1a', margin: 0 }}>
              {item.name}
            </h4>

            {/* Bottom Row: Amount & Time */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#4a4a4a' }}>
                {item.amount < 50 ? `$${item.amount.toFixed(2)}` : formatCurrency(item.amount)}
              </span>
              <span style={{ fontSize: '0.7rem', color: '#a0a0a0' }}>
                {item.time}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Footer text */}
      <div style={{ textAlign: 'center', marginTop: '24px' }}>
        <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#a0a0a0', letterSpacing: '2px', textTransform: 'uppercase' }}>
          SHOWING LATEST 10
        </span>
      </div>
    </div>
  );
};
