import React from 'react';

export type AdminTab = 'dashboard' | 'users' | 'books' | 'visitors' | 'orders';

interface SidebarProps {
  activeTab: AdminTab;
  onSelectTab: (tab: AdminTab) => void;
  onLogout: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, onSelectTab, onLogout }) => {
  const menuItems: { id: AdminTab; label: string; icon: string }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'users', label: 'User Management', icon: '👥' },
    { id: 'books', label: 'Book Management', icon: '📚' },
    { id: 'visitors', label: 'Visitor Records (.mdb)', icon: '🏛' },
    { id: 'orders', label: 'Orders & Sales', icon: '🛒' },
  ];

  return (
    <aside
      style={{
        width: '260px',
        backgroundColor: 'var(--bg-sidebar)',
        borderRight: '1px solid var(--border-light)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '24px 16px',
        height: '100vh',
        position: 'sticky',
        top: 0,
      }}
    >
      <div>
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px', paddingLeft: '8px' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '2px',
              background: 'var(--accent-gold)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.2rem',
            }}
          >
            🏛
          </div>
          <div>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, fontFamily: 'var(--font-heading)', color: 'var(--text-primary)' }}>
              ADMIN PANEL
            </h2>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Digital Library System</span>
          </div>
        </div>

        {/* Menu Items */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {menuItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 16px',
                  borderRadius: '2px',
                  border: 'none',
                  background: isActive ? 'var(--primary-blue)' : 'transparent',
                  color: isActive ? '#fff' : 'var(--text-secondary)',
                  fontWeight: isActive ? 600 : 500,
                  fontSize: '0.9rem',
                  fontFamily: 'var(--font-body)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.2s ease',
                }}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer Link back to Website */}
      <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <a
          href="http://localhost:3000"
          target="_blank"
          rel="noreferrer"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            color: 'var(--primary-blue)',
            textDecoration: 'none',
            fontSize: '0.85rem',
            fontWeight: 600,
            padding: '8px 12px',
            borderRadius: '2px',
            background: 'var(--bg-blue-tint)',
            fontFamily: 'var(--font-body)'
          }}
        >
          🌐 View Public Website ↗
        </a>
        <button
          onClick={onLogout}
          className="btn"
          style={{
            background: 'rgba(220, 38, 38, 0.1)',
            color: '#dc2626',
            width: '100%',
            textAlign: 'left'
          }}
        >
          🚪 Logout
        </button>
      </div>
    </aside>
  );
};
