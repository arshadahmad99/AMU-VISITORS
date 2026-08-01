import React, { useState } from 'react';
import { Sidebar, AdminTab } from './components/Sidebar';
import { DashboardPage } from './pages/DashboardPage';
import { UserManagementPage } from './pages/UserManagementPage';
import { BookManagementPage } from './pages/BookManagementPage';
import { VisitorManagementPage } from './pages/VisitorManagementPage';
import { OrdersPage } from './pages/OrdersPage';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');

  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardPage />;
      case 'users':
        return <UserManagementPage />;
      case 'books':
        return <BookManagementPage />;
      case 'visitors':
        return <VisitorManagementPage />;
      case 'orders':
        return <OrdersPage />;
      default:
        return <DashboardPage />;
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#0b1120' }}>
      <Sidebar activeTab={activeTab} onSelectTab={(tab) => setActiveTab(tab)} />
      <main style={{ flex: 1, padding: '32px', overflowY: 'auto' }}>
        {renderTabContent()}
      </main>
    </div>
  );
};
