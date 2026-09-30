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

const getInitials = (name: string) => {
  if (!name) return 'U';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return parts[0].slice(0, 2).toUpperCase();
};

export const RecentBuyersFeed: React.FC<RecentBuyersFeedProps> = ({ purchases }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', height: '100%', fontFamily: 'var(--font-body)' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginBottom: '16px', padding: '6px 0' }}>
        <span style={{ fontSize: '1.4rem', color: '#0b132b', display: 'flex', alignItems: 'center' }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
          </svg>
        </span>
        <h3 style={{ fontSize: '1.4rem', fontWeight: 600, color: '#0b132b', fontFamily: '"Georgia", serif', margin: 0 }}>
          Recent Subscribers
        </h3>
      </div>

      {/* Ledger List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', flex: 1 }}>
        {purchases.length === 0 ? (
          <div
            style={{
              background: '#ffffff',
              padding: '32px 16px',
              textAlign: 'center',
              borderRadius: '8px',
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
            const isAlumni = item.isAlumni === true || Boolean(item.course || item.position || item.passingYear);
            const timeAgo = getRelativeTime(item.createdAt);
            const initials = getInitials(displayName);

            return (
              <div
                key={item.id || index}
                style={{
                  background: '#ffffff',
                  padding: '18px 20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '14px',
                  borderRadius: '10px',
                  boxShadow: '0 4px 15px rgba(0,0,0,0.04)',
                  border: isAlumni ? '1px solid rgba(184, 134, 11, 0.35)' : '1px solid #eaeaea',
                  position: 'relative'
                }}
              >
                {/* Top Section: Monogram Avatar, Name & Alumni Tag */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  {/* Monogram Circle Avatar */}
                  <div
                    style={{
                      width: '46px',
                      height: '46px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #4a1521 0%, #2b0b13 100%)',
                      color: '#f3e5ab',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      fontSize: '1rem',
                      letterSpacing: '1px',
                      boxShadow: '0 3px 8px rgba(74, 21, 33, 0.25)',
                      border: '1.5px solid #d4af37',
                      flexShrink: 0
                    }}
                  >
                    {initials}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap' }}>
                      <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: '#1a1a1a', letterSpacing: '-0.2px' }}>
                        {displayName}
                      </h4>
                      <span
                        style={{
                          fontSize: '0.68rem',
                          fontWeight: 700,
                          background: isAlumni ? 'rgba(212, 175, 55, 0.12)' : '#f2f3f4',
                          color: isAlumni ? '#b8860b' : '#7f8c8d',
                          border: isAlumni ? '1px solid rgba(184, 134, 11, 0.4)' : '1px solid #d5dbdb',
                          padding: '3px 10px',
                          borderRadius: '20px',
                          letterSpacing: '0.8px',
                          display: 'inline-flex',
                          alignItems: 'center'
                        }}
                      >
                        {isAlumni ? (
                          <>
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '4px' }}>
                              <path d="M22 10v6M2 10l10-5 10 5-10 5z"></path>
                              <path d="M6 12v5c3 3 9 3 12 0v-5"></path>
                            </svg>
                            ALUMNI
                          </>
                        ) : (
                          'MEMBER'
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Alumni Metadata Panel with Modern SVG Vector Icons */}
                {isAlumni && (
                  <div
                    style={{
                      background: '#faf7f2',
                      borderRadius: '8px',
                      padding: '12px 14px',
                      borderLeft: '3px solid #d4af37',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px'
                    }}
                  >
                    {item.position && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.88rem', color: '#2c3e50', fontWeight: 600 }}>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#b8860b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                          <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                          <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
                        </svg>
                        <span>{item.position}</span>
                      </div>
                    )}

                    {(item.course || item.passingYear) && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.84rem', color: '#4a5568' }}>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#4a1521" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                          <path d="M22 10v6M2 10l10-5 10 5-10 5z"></path>
                          <path d="M6 12v5c3 3 9 3 12 0v-5"></path>
                        </svg>
                        <span>
                          {item.course || 'Alumni'}
                          {item.passingYear ? ` (Passing Year: ${item.passingYear})` : ''}
                        </span>
                      </div>
                    )}

                    {item.country && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.84rem', color: '#718096' }}>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#e53e3e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                          <circle cx="12" cy="10" r="3"></circle>
                        </svg>
                        <span>Location: {item.country}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Bottom Bar: Amount & Relative Time */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '4px', borderTop: '1px dashed #eedfcc' }}>
                  <span style={{ fontSize: '0.92rem', fontWeight: 700, color: '#b8860b', letterSpacing: '0.2px' }}>
                    {formatCurrency(item.amount || 499)}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: '#888888', fontWeight: 500 }}>
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
