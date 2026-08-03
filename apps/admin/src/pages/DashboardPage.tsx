import React, { useState, useEffect } from 'react';
import { DashboardStats } from '@digital-library/types';
import { formatCurrency } from '@digital-library/utils';
import { fetchDashboardStats } from '../services/adminApi';

export const DashboardPage: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats()
      .then((data) => setStats(data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading || !stats) {
    return <div style={{ padding: '24px', color: 'var(--text-secondary)' }}>Loading Dashboard Analytics...</div>;
  }

  const statCards = [
    { title: 'Total Users', value: stats.totalUsers, icon: '👥', color: '#3b82f6', change: '+12% this month' },
    { title: 'Total Books', value: stats.totalBooks, icon: '📚', color: '#818cf8', change: 'Catalog active' },
    { title: 'Total Sales', value: stats.totalSales, icon: '🛒', color: '#10b981', change: 'Orders processed' },
    { title: 'Total Revenue', value: formatCurrency(stats.totalRevenue), icon: '💰', color: '#f59e0b', change: 'Gross revenue' },
    { title: 'Total Visitor Records', value: stats.totalVisitorRecords, icon: '🏛', color: '#ec4899', change: '.mdb Archive records' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h2 style={{ fontSize: '1.6rem', fontWeight: 700, fontFamily: 'var(--font-heading)', color: 'var(--text-primary)' }}>
          Dashboard Overview
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Real-time stats across users, sales, eBook catalog, and university archives.</p>
      </div>

      {/* Metric Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        {statCards.map((card, idx) => (
          <div key={idx} className="admin-card" style={{ borderLeft: `4px solid ${card.color}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>{card.title}</span>
              <span style={{ fontSize: '1.5rem' }}>{card.icon}</span>
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>{card.value}</div>
            <div style={{ fontSize: '0.75rem', color: '#059669', fontWeight: 600 }}>{card.change}</div>
          </div>
        ))}
      </div>

      {/* Analytics Charts & Summaries */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
        {/* Revenue Growth Timeline */}
        <div className="admin-card">
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '16px', color: 'var(--text-primary)' }}>
            📈 Revenue Growth Breakdown
          </h3>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '16px', height: '180px', paddingTop: '20px' }}>
            {stats.revenueChart.map((item, idx) => (
              <div key={idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--primary-blue)', fontWeight: 700 }}>${item.revenue}</span>
                <div
                  style={{
                    width: '100%',
                    maxWidth: '36px',
                    height: `${Math.max(20, (item.revenue / 8000) * 140)}px`,
                    background: 'linear-gradient(to top, var(--primary-blue), var(--primary-blue-hover))',
                    borderRadius: '6px 6px 0 0',
                  }}
                />
                <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>{item.date.split(' ')[0]}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Catalog Categories Distribution */}
        <div className="admin-card">
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '16px', color: 'var(--text-primary)' }}>
            📊 Catalog Categories
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {stats.categoryDistribution.map((cat, idx) => (
              <div key={idx}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '4px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>{cat.category}</span>
                  <span style={{ color: 'var(--accent-gold)', fontWeight: 700 }}>{cat.count} items</span>
                </div>
                <div style={{ background: 'var(--border-light)', borderRadius: '4px', height: '8px', overflow: 'hidden' }}>
                  <div style={{ width: `${(cat.count / stats.totalBooks) * 100}%`, height: '100%', background: 'var(--accent-gold)' }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
