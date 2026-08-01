import React, { useState, useEffect } from 'react';
import { VisitorRecord } from '@digital-library/types';
import { fetchAdminVisitors, importMdbFile } from '../services/adminApi';
import api from '../../../website/src/services/api';

export const VisitorManagementPage: React.FC = () => {
  const [records, setRecords] = useState<VisitorRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [importing, setImporting] = useState(false);
  const [importMsg, setImportMsg] = useState('');

  const loadRecords = (q?: string) => {
    fetchAdminVisitors(q).then((data) => setRecords(data));
  };

  useEffect(() => {
    loadRecords();
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    setImporting(true);
    setImportMsg('');

    try {
      const res = await importMdbFile(file);
      setImportMsg(`✅ ${res.message || 'MDB Database parsed successfully!'}`);
      loadRecords();
    } catch (err: any) {
      setImportMsg(`❌ Conversion failed: ${err.message}`);
    } finally {
      setImporting(false);
    }
  };

  const handleExport = (format: 'csv' | 'json') => {
    window.open(`/api/visitors/export?format=${format}`, '_blank');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, fontFamily: 'Outfit, sans-serif', color: '#fff' }}>
            University Visitor Book (.mdb Import & Management)
          </h2>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Convert legacy Microsoft Access (.mdb) databases into PostgreSQL records.</p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={() => handleExport('csv')} className="btn btn-amber">
            📥 Export CSV
          </button>
          <button onClick={() => handleExport('json')} className="btn btn-primary">
            📥 Export JSON
          </button>
        </div>
      </div>

      {/* MDB Upload Box */}
      <div className="admin-card" style={{ border: '2px dashed rgba(245, 158, 11, 0.4)', background: 'rgba(245, 158, 11, 0.05)', textAlign: 'center', padding: '24px' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f59e0b', marginBottom: '8px' }}>
          🗄 Import Microsoft Access (.mdb) Database File
        </h3>
        <p style={{ fontSize: '0.85rem', color: '#cbd5e1', marginBottom: '16px' }}>
          Select a legacy `.mdb` or `.accdb` file. The engine will extract historical guest rows and map them into PostgreSQL table schema.
        </p>

        <label className="btn btn-amber" style={{ display: 'inline-block', cursor: 'pointer' }}>
          {importing ? 'Converting MDB File...' : '📁 Choose .MDB File to Import'}
          <input type="file" accept=".mdb,.accdb,.csv,.txt" onChange={handleFileUpload} style={{ display: 'none' }} />
        </label>

        {importMsg && (
          <div style={{ marginTop: '14px', fontSize: '0.85rem', color: importMsg.includes('✅') ? '#10b981' : '#ef4444', fontWeight: 600 }}>
            {importMsg}
          </div>
        )}
      </div>

      {/* Search Input */}
      <div style={{ display: 'flex', gap: '12px' }}>
        <input
          type="text"
          placeholder="Filter records by visitor name, department, year, or purpose..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            loadRecords(e.target.value);
          }}
          style={{ flex: 1, padding: '10px 14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.15)', background: '#0f172a', color: '#fff' }}
        />
      </div>

      {/* Table */}
      <div className="table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Visitor Name</th>
              <th>Visit Date & Year</th>
              <th>Department</th>
              <th>Purpose of Visit</th>
              <th>MDB Reference ID</th>
            </tr>
          </thead>
          <tbody>
            {records.map((r) => (
              <tr key={r.id}>
                <td style={{ fontWeight: 700, color: '#fff' }}>{r.visitorName}</td>
                <td>
                  <span className="badge badge-info">{r.year}</span> <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>({r.visitDate})</span>
                </td>
                <td>{r.department}</td>
                <td>{r.purpose}</td>
                <td>
                  <span style={{ fontSize: '0.78rem', fontFamily: 'monospace', color: '#f59e0b' }}>{r.originalMdbId || 'POSTGRES_LIVE'}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
