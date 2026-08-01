import React, { useState, useEffect } from 'react';
import { User } from '@digital-library/types';
import { fetchUsers, toggleBlockUser, deleteUser } from '../services/adminApi';
import { formatCurrency, formatDate } from '@digital-library/utils';

export const UserManagementPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUserPurchases, setSelectedUserPurchases] = useState<any[] | null>(null);

  const loadUsers = () => {
    fetchUsers().then((data) => setUsers(data));
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleToggleBlock = async (userId: string) => {
    await toggleBlockUser(userId);
    loadUsers();
  };

  const handleDelete = async (userId: string) => {
    if (window.confirm('Are you sure you want to delete this user account?')) {
      await deleteUser(userId);
      loadUsers();
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <h2 style={{ fontSize: '1.6rem', fontWeight: 800, fontFamily: 'Outfit, sans-serif', color: '#fff' }}>
          User Management
        </h2>
        <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Inspect registered scholars, block suspicious access, and review purchase history.</p>
      </div>

      <div className="table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Email</th>
              <th>Provider</th>
              <th>Role</th>
              <th>Status</th>
              <th>Joined Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <img src={u.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.name}`} alt={u.name} style={{ width: '32px', height: '32px', borderRadius: '50%' }} />
                    <span style={{ fontWeight: 600, color: '#fff' }}>{u.name}</span>
                  </div>
                </td>
                <td>{u.email}</td>
                <td>
                  <span className="badge badge-info">{u.provider.toUpperCase()}</span>
                </td>
                <td>
                  <span className={`badge ${u.role === 'ADMIN' ? 'badge-warning' : 'badge-success'}`}>{u.role}</span>
                </td>
                <td>
                  <span className={`badge ${u.isBlocked ? 'badge-danger' : 'badge-success'}`}>{u.isBlocked ? 'BLOCKED' : 'ACTIVE'}</span>
                </td>
                <td>{formatDate(u.createdAt)}</td>
                <td>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      onClick={() => handleToggleBlock(u.id)}
                      className={`btn ${u.isBlocked ? 'btn-success' : 'btn-amber'}`}
                      style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                    >
                      {u.isBlocked ? 'Unblock' : 'Block'}
                    </button>

                    <button
                      onClick={() => handleDelete(u.id)}
                      className="btn btn-danger"
                      style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
