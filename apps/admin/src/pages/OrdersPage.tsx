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
        <h2 style={{ fontSize: '1.6rem', fontWeight: 800, fontFamily: 'Outfit, sans-serif', color: '#fff' }}>
          Orders & Payment History
        </h2>
        <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Financial transaction log of eBook library sales.</p>
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
                <td style={{ fontFamily: 'monospace', color: '#38bdf8' }}>{o.id}</td>
                <td>
                  <div style={{ fontWeight: 600, color: '#fff' }}>{o.userName}</div>
                  <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>{o.userEmail}</div>
                </td>
                <td style={{ color: '#cbd5e1' }}>{o.bookTitle}</td>
                <td style={{ fontWeight: 800, color: '#10b981' }}>{formatCurrency(o.amount)}</td>
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
