import React, { useState, useEffect } from 'react';
import { Purchase } from '@digital-library/types';
import { fetchAdminOrders } from '../services/adminApi';
import { formatCurrency, formatDate } from '@digital-library/utils';

export const OrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<Purchase[]>([]);

  useEffect(() => {
    fetchAdminOrders().then((data) => setOrders(data));
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <h2 style={{ fontSize: '1.6rem', fontWeight: 700, fontFamily: 'var(--font-heading)', color: 'var(--text-primary)' }}>
          Orders & Payment History
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Financial transaction log of eBook library sales.</p>
      </div>

      <div className="table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Customer</th>
              <th>Book Title</th>
              <th>Amount</th>
              <th>Payment Gateway</th>
              <th>Status</th>
              <th>Purchase Date</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id}>
                <td style={{ fontFamily: 'monospace', color: 'var(--primary-blue)' }}>{o.id}</td>
                <td>
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{o.userName}</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{o.userEmail}</div>
                </td>
                <td style={{ color: 'var(--text-secondary)' }}>{o.bookTitle}</td>
                <td style={{ fontWeight: 700, color: 'var(--accent-gold)' }}>{formatCurrency(o.amount)}</td>
                <td>
                  <span className="badge badge-info">{o.paymentMethod || 'Credit Card'}</span>
                </td>
                <td>
                  <span className="badge badge-success">{o.status}</span>
                </td>
                <td>{formatDate(o.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
