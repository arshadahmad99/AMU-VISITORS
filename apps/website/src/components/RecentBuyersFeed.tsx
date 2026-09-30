import React from 'react';
import { Purchase } from '@digital-library/types';
import { formatCurrency } from '@digital-library/utils';

interface RecentBuyersFeedProps {
  purchases: Purchase[];
}

const getRelativeTime = (dateStr?: string) => {
  if (!dateStr) return 'Recently';
  const diffMs = Date.now() - new Date(dateStr).getTime();
  if (isNaN(diffMs) || diffMs < 0) return 'Recently';
  const diffMins = Math.floor(diffMs / (1000 * 60));
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
};

export const RecentBuyersFeed: React.FC<RecentBuyersFeedProps> = ({ purchases }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', height: '100%', fontFamily: 'var(--font-body)' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginBottom: '16px', padding: '6px 0' }}>
        <span style={{ fontSize: '1.4rem', color: '#0b132b', display: 'flex', alignItems: 'center' }}>
          {/* SVG Icon matching the design */}
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
          </svg>
        </span>
        <h3 style={{ fontSize: '1.4rem', fontWeight: 600, color: '#0b132b', fontFamily: '"Georgia", serif', margin: 0 }}>
          Recent Subscribers
        </h3>
      </div>

      {/* Ledger List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
        {purchases.length === 0 ? (
          <div
            style={{
              background: '#ffffff',
              padding: '32px 16px',
              textAlign: 'center',
              borderRadius: '6px',
              boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
              color: '#8c8c8c',
              fontSize: '0.9rem'
            }}
          >
            No recent subscribers yet. Be the first to subscribe!
          </div>
        ) : (
          purchases.slice(0, 10).map((item, index) => {
            const displayName = item.userName || item.userEmail || 'Subscriber';
            const isAlumni = (item as any).isAlumni || (item as any).course;
            const tagText = isAlumni ? 'ALUMNI' : 'MEMBER';
            const tagBg = isAlumni ? '#f2f3f4' : '#fdf2e9';
            const tagColor = isAlumni ? '#a6acaf' : '#f5b041';
            const timeAgo = getRelativeTime(item.createdAt);

            return (
              <div
                key={item.id || index}
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
                    {displayName.charAt(0).toUpperCase()}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <span style={{ fontSize: '0.9rem', color: '#333333', fontWeight: 600 }}>
                      {displayName}
                    </span>
                    <div style={{ display: 'flex' }}>
                      <span
                        style={{
                          fontSize: '0.6rem',
                          fontWeight: 700,
                          background: tagBg,
                          color: tagColor,
                          padding: '3px 6px',
                          borderRadius: '2px',
                          letterSpacing: '0.5px'
                        }}
                      >
                        {tagText}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bottom Row: Amount & Time */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                  <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#1a1a1a' }}>
                    {formatCurrency(item.amount || 499)}
                  </span>
                  <span style={{ fontSize: '0.7rem', color: '#888888' }}>
                    {timeAgo}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
