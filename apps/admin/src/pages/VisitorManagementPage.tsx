import React, { useState, useEffect } from 'react';
import { VisitorRecord } from '@digital-library/types';
import {
  fetchAdminVisitors,
  importMdbFile,
  createVisitor,
  updateVisitor,
  deleteVisitor,
  deleteVisitorAbout
} from '../services/adminApi';

export const VisitorManagementPage: React.FC = () => {
  const [records, setRecords] = useState<VisitorRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [importing, setImporting] = useState(false);
  const [importMsg, setImportMsg] = useState('');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVisitor, setEditingVisitor] = useState<VisitorRecord | null>(null);
  const [formData, setFormData] = useState({
    visitorName: '',
    visitDate: '',
    year: '',
    country: '',
    designation: '',
    department: '',
    purpose: '',
    aboutVisitor: '',
    notes: '',
  });

  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const loadRecords = (q?: string) => {
    fetchAdminVisitors(q).then((data) => setRecords(data));
  };

  useEffect(() => {
    loadRecords();
  }, []);

  const handleOpenAddModal = () => {
    setEditingVisitor(null);
    setFormData({
      visitorName: '',
      visitDate: new Date().toISOString().split('T')[0],
      year: new Date().getFullYear().toString(),
      country: '',
      designation: '',
      department: '',
      purpose: '',
      aboutVisitor: '',
      notes: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (visitor: VisitorRecord) => {
    setEditingVisitor(visitor);
    setFormData({
      visitorName: visitor.visitorName || '',
      visitDate: visitor.visitDate || '',
      year: visitor.year ? String(visitor.year) : '',
      country: visitor.country || '',
      designation: visitor.designation || '',
      department: visitor.department || '',
      purpose: visitor.purpose || '',
      aboutVisitor: visitor.aboutVisitor || '',
      notes: visitor.notes || '',
    });
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.visitorName.trim()) {
      alert('Visitor Name is required');
      return;
    }

    setLoading(true);
    const payload: Partial<VisitorRecord> = {
      visitorName: formData.visitorName,
      visitDate: formData.visitDate || new Date().toISOString().split('T')[0],
      year: formData.year ? Number(formData.year) : undefined,
      country: formData.country,
      designation: formData.designation,
      department: formData.department,
      purpose: formData.purpose,
      aboutVisitor: formData.aboutVisitor,
      notes: formData.notes,
    };

    try {
      if (editingVisitor) {
        await updateVisitor(editingVisitor.id, payload);
      } else {
        await createVisitor(payload);
      }
      setIsModalOpen(false);
      loadRecords(searchQuery);
    } catch (err: any) {
      alert('Failed to save visitor: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRecord = async (id: string) => {
    try {
      await deleteVisitor(id);
      setDeleteConfirmId(null);
      loadRecords(searchQuery);
    } catch (err: any) {
      alert('Failed to delete visitor record: ' + err.message);
    }
  };

  const handleClearAboutText = async (id: string) => {
    if (confirm('Are you sure you want to clear/delete the About info for this visitor?')) {
      try {
        await deleteVisitorAbout(id);
        loadRecords(searchQuery);
      } catch (err: any) {
        alert('Failed to clear about text: ' + err.message);
      }
    }
  };

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
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 700, fontFamily: 'var(--font-heading)', color: 'var(--text-primary)' }}>
            University Visitor Book (.mdb Import & Management)
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Manage historical guest records, custom visitor biographies, and import legacy Access (.mdb) files.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button onClick={handleOpenAddModal} className="btn btn-amber" style={{ fontWeight: 700 }}>
            ➕ Add Visitor Record
          </button>
          <button onClick={() => handleExport('csv')} className="btn btn-secondary">
            📥 Export CSV
          </button>
          <button onClick={() => handleExport('json')} className="btn btn-primary">
            📥 Export JSON
          </button>
        </div>
      </div>

      {/* MDB Upload Box */}
      <div className="admin-card" style={{ border: '2px dashed var(--accent-gold)', background: 'var(--bg-card-alt)', textAlign: 'center', padding: '24px' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--accent-gold)', marginBottom: '8px' }}>
          🗄 Import Microsoft Access (.mdb) Database File
        </h3>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
          Select a legacy `.mdb` or `.accdb` file. The engine will extract historical guest rows and map them into PostgreSQL table schema.
        </p>

        <label className="btn btn-amber" style={{ display: 'inline-block', cursor: 'pointer' }}>
          {importing ? 'Converting MDB File...' : '📁 Choose .MDB File to Import'}
          <input type="file" accept=".mdb,.accdb,.csv,.txt" onChange={handleFileUpload} style={{ display: 'none' }} />
        </label>

        {importMsg && (
          <div style={{ marginTop: '14px', fontSize: '0.85rem', color: importMsg.includes('✅') ? '#059669' : '#dc2626', fontWeight: 600 }}>
            {importMsg}
          </div>
        )}
      </div>

      {/* Search Input */}
      <div style={{ display: 'flex', gap: '12px' }}>
        <input
          type="text"
          placeholder="Filter records by visitor name, department, year, designation, or biography..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            loadRecords(e.target.value);
          }}
          style={{ flex: 1, padding: '10px 14px', borderRadius: '4px', border: '1px solid var(--border-light)', background: 'var(--bg-card-alt)', color: 'var(--text-primary)' }}
        />
      </div>

      {/* Table */}
      <div className="table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Visitor Name</th>
              <th>Visit Date & Year</th>
              <th>Designation / Country</th>
              <th>Purpose & Dept</th>
              <th>About Visitor (Bio)</th>
              <th style={{ textAlign: 'center' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {records.map((r) => (
              <tr key={r.id}>
                <td style={{ fontWeight: 600, color: 'var(--text-primary)', minWidth: '160px' }}>
                  {r.visitorName}
                  {r.originalMdbId && (
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>MDB ID: #{r.originalMdbId}</div>
                  )}
                </td>
                <td style={{ minWidth: '130px' }}>
                  <span className="badge badge-info">{r.year || 'N/A'}</span>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: '2px' }}>{r.visitDate}</div>
                </td>
                <td style={{ minWidth: '140px', fontSize: '0.88rem' }}>
                  {r.designation && <div style={{ fontWeight: 600 }}>{r.designation}</div>}
                  {r.country && <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>📍 {r.country}</div>}
                </td>
                <td style={{ minWidth: '140px', fontSize: '0.88rem' }}>
                  {r.department && <div><strong>Dept:</strong> {r.department}</div>}
                  {r.purpose && <div style={{ color: 'var(--text-secondary)' }}><strong>Purpose:</strong> {r.purpose}</div>}
                </td>
                <td style={{ maxWidth: '250px', fontSize: '0.85rem' }}>
                  {r.aboutVisitor ? (
                    <div style={{ background: 'rgba(217, 119, 6, 0.08)', padding: '6px 10px', borderRadius: '4px', borderLeft: '3px solid var(--accent-gold)' }}>
                      <p style={{ margin: 0, fontStyle: 'italic', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {r.aboutVisitor}
                      </p>
                      <button
                        onClick={() => handleClearAboutText(r.id)}
                        style={{ background: 'none', border: 'none', color: '#dc2626', fontSize: '0.75rem', cursor: 'pointer', padding: 0, marginTop: '4px', textDecoration: 'underline' }}
                      >
                        🗑 Clear Bio
                      </button>
                    </div>
                  ) : (
                    <span style={{ color: 'var(--text-secondary)', fontStyle: 'italic', fontSize: '0.8rem' }}>No about bio added</span>
                  )}
                </td>
                <td style={{ textAlign: 'center', minWidth: '120px' }}>
                  <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                    <button
                      onClick={() => handleOpenEditModal(r)}
                      title="Edit Visitor & About Bio"
                      style={{ padding: '6px 10px', borderRadius: '4px', border: '1px solid var(--accent-gold)', background: 'transparent', color: 'var(--accent-gold)', cursor: 'pointer', fontWeight: 600 }}
                    >
                      ✏️ Edit
                    </button>
                    <button
                      onClick={() => setDeleteConfirmId(r.id)}
                      title="Delete Record"
                      style={{ padding: '6px 10px', borderRadius: '4px', border: '1px solid #ef4444', background: 'transparent', color: '#ef4444', cursor: 'pointer', fontWeight: 600 }}
                    >
                      🗑 Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="modal-backdrop" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div className="admin-card" style={{ width: '100%', maxWidth: '650px', maxHeight: '90vh', overflowY: 'auto', background: 'var(--bg-card)', borderRadius: '8px', padding: '28px', border: '1px solid var(--border-light)' }}>
            <h3 style={{ fontSize: '1.4rem', fontWeight: 700, fontFamily: 'var(--font-heading)', color: 'var(--text-primary)', marginBottom: '20px' }}>
              {editingVisitor ? '✏️ Edit Visitor Record & Biography' : '➕ Add New Visitor Record'}
            </h3>

            <form onSubmit={handleFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px', color: 'var(--text-primary)' }}>
                  Visitor Name <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.visitorName}
                  onChange={(e) => setFormData({ ...formData, visitorName: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '4px', border: '1px solid var(--border-light)', background: 'var(--bg-card-alt)', color: 'var(--text-primary)' }}
                  placeholder="e.g. Prince Hari Singh, 1895-1961"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px', color: 'var(--text-primary)' }}>Visit Date</label>
                  <input
                    type="date"
                    value={formData.visitDate}
                    onChange={(e) => setFormData({ ...formData, visitDate: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '4px', border: '1px solid var(--border-light)', background: 'var(--bg-card-alt)', color: 'var(--text-primary)' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px', color: 'var(--text-primary)' }}>Year</label>
                  <input
                    type="number"
                    value={formData.year}
                    onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '4px', border: '1px solid var(--border-light)', background: 'var(--bg-card-alt)', color: 'var(--text-primary)' }}
                    placeholder="1910"
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px', color: 'var(--text-primary)' }}>Designation</label>
                  <input
                    type="text"
                    value={formData.designation}
                    onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '4px', border: '1px solid var(--border-light)', background: 'var(--bg-card-alt)', color: 'var(--text-primary)' }}
                    placeholder="e.g. Heir-apparent J & K"
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px', color: 'var(--text-primary)' }}>Country</label>
                  <input
                    type="text"
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '4px', border: '1px solid var(--border-light)', background: 'var(--bg-card-alt)', color: 'var(--text-primary)' }}
                    placeholder="e.g. India"
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px', color: 'var(--text-primary)' }}>Department</label>
                  <input
                    type="text"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '4px', border: '1px solid var(--border-light)', background: 'var(--bg-card-alt)', color: 'var(--text-primary)' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px', color: 'var(--text-primary)' }}>Purpose of Visit</label>
                  <input
                    type="text"
                    value={formData.purpose}
                    onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '4px', border: '1px solid var(--border-light)', background: 'var(--bg-card-alt)', color: 'var(--text-primary)' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px', color: 'var(--accent-gold)' }}>
                  📖 About Visitor (Biography & Historical Information)
                </label>
                <textarea
                  rows={4}
                  value={formData.aboutVisitor}
                  onChange={(e) => setFormData({ ...formData, aboutVisitor: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '4px', border: '1px solid var(--border-light)', background: 'var(--bg-card-alt)', color: 'var(--text-primary)', fontFamily: 'inherit' }}
                  placeholder="Enter detailed biographical summary, background, or notable achievements of this visitor..."
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px', color: 'var(--text-primary)' }}>Notes</label>
                <input
                  type="text"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '4px', border: '1px solid var(--border-light)', background: 'var(--bg-card-alt)', color: 'var(--text-primary)' }}
                  placeholder="Additional archival notes"
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn btn-amber"
                  style={{ fontWeight: 700 }}
                >
                  {loading ? 'Saving...' : editingVisitor ? 'Save Changes' : 'Create Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="modal-backdrop" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div className="admin-card" style={{ width: '100%', maxWidth: '420px', background: 'var(--bg-card)', borderRadius: '8px', padding: '24px', textAlign: 'center', border: '1px solid var(--border-light)' }}>
            <h4 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#ef4444', marginBottom: '12px' }}>🗑 Confirm Deletion</h4>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '20px' }}>
              Are you sure you want to permanently delete this visitor record and its biography?
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
              <button onClick={() => setDeleteConfirmId(null)} className="btn btn-secondary">
                Cancel
              </button>
              <button onClick={() => handleDeleteRecord(deleteConfirmId)} className="btn btn-danger" style={{ background: '#ef4444', color: '#fff', fontWeight: 700 }}>
                Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

