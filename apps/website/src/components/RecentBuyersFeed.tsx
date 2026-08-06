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
      <div style={{ height: '80px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', paddingBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
          <span style={{ fontSize: '1.8rem', color: '#0b132b' }}>
            {/* SVG Icon matching the design */}
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
            </svg>
          </span>
          <h3 style={{ fontSize: '1.8rem', fontWeight: 500, color: '#0b132b', fontFamily: '"Georgia", serif', margin: 0 }}>
            Recent Subscribers
          </h3>
        </div>
      </div>

      {/* Ledger List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1, justifyContent: 'space-between' }}>
        {list.map((item, index) => (
          <div
            key={index}
            style={{
              background: '#ffffff',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              borderRadius: '2px',
              boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
            }}
          >
            {/* Top Row: Avatar & Info */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  background: '#e8e9ea',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 600,
                  color: '#0b132b',
                  fontSize: '1rem',
                  borderRadius: '6px'
                }}
              >
                {item.name.charAt(0)}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ fontSize: '0.9rem', color: '#333333' }}>
                  {item.name}
                </span>
                <div style={{ display: 'flex' }}>
                  <span
                    style={{
                      fontSize: '0.6rem',
                      fontWeight: 700,
                      background: item.tagBg,
                      color: item.tagColor,
                      padding: '3px 6px',
                      borderRadius: '2px',
                      letterSpacing: '0.5px'
                    }}
                  >
                    {item.tag}
                  </span>
                </div>
              </div>
            </div>

            {/* Bottom Row: Amount & Time */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
              <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#1a1a1a' }}>
                {item.amount < 50 ? `$${item.amount.toFixed(2)}` : formatCurrency(item.amount)}
              </span>
              <span style={{ fontSize: '0.7rem', color: '#888888' }}>
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
