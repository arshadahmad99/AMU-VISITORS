import React, { useState, useEffect } from 'react';
import { Book, BookPDF } from '@digital-library/types';
import {
  fetchAdminBooks,
  updateBook,
  fetchBookPdfs,
  uploadBookPdfs,
  replaceBookPdf,
  deleteBookPdf,
  reorderBookPdfs,
} from '../services/adminApi';
import { formatCurrency } from '@digital-library/utils';

export const BookManagementPage: React.FC = () => {
  const [book, setBook] = useState<Book | null>(null);
  const [bookPdfs, setBookPdfs] = useState<BookPDF[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [replaceTargetPdf, setReplaceTargetPdf] = useState<BookPDF | null>(null);
  const [deleteTargetPdf, setDeleteTargetPdf] = useState<BookPDF | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [category, setCategory] = useState('History & Library Science');
  const [price, setPrice] = useState('29.99');
  const [description, setDescription] = useState('');
  const [coverFile, setCoverFile] = useState<File | null>(null);

  // PDF Upload state
  const [selectedUploadFiles, setSelectedUploadFiles] = useState<File[]>([]);
  const [selectedReplaceFile, setSelectedReplaceFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const books = await fetchAdminBooks();
      if (books.length > 0) {
        const targetBook = books[0];
        setBook(targetBook);

        const pdfData = await fetchBookPdfs(targetBook.id);
        if (pdfData && pdfData.bookPdfs) {
          setBookPdfs(pdfData.bookPdfs);
          if (pdfData.book) setBook(pdfData.book);
        }
      }
    } catch (err) {
      console.error('Failed to load book data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenEditModal = () => {
    if (!book) return;
    setTitle(book.title);
    setAuthor(book.author);
    setCategory(book.category);
    setPrice(book.price.toString());
    setDescription(book.description);
    setCoverFile(null);
    setIsEditModalOpen(true);
  };

  const handleEditBookSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!book) return;
    setIsSubmitting(true);
    setStatusMessage('Updating book metadata...');

    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('author', author);
      formData.append('category', category);
      formData.append('price', price);
      formData.append('description', description);
      if (coverFile) formData.append('coverFile', coverFile);

      await updateBook(book.id, formData as any);
      setIsEditModalOpen(false);
      await loadData();
    } catch (err: any) {
      alert('Failed to update book: ' + (err?.message || 'Error'));
    } finally {
      setIsSubmitting(false);
      setStatusMessage('');
    }
  };

  const handleUploadPdfsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!book || selectedUploadFiles.length === 0) return;

    setIsSubmitting(true);
    setStatusMessage('Uploading and parsing PDF page counts...');

    try {
      const formData = new FormData();
      selectedUploadFiles.forEach((f) => formData.append('pdfFiles', f));

      await uploadBookPdfs(book.id, formData);
      setIsUploadModalOpen(false);
      setSelectedUploadFiles([]);
      await loadData();
    } catch (err: any) {
      alert('Failed to upload PDF: ' + (err?.message || 'Upload error'));
    } finally {
      setIsSubmitting(false);
      setStatusMessage('');
    }
  };

  const handleReplacePdfSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replaceTargetPdf || !selectedReplaceFile) return;

    setIsSubmitting(true);
    setStatusMessage(`Replacing ${replaceTargetPdf.originalName}...`);

    try {
      const formData = new FormData();
      formData.append('pdfFile', selectedReplaceFile);

      await replaceBookPdf(replaceTargetPdf.id, formData);
      setReplaceTargetPdf(null);
      setSelectedReplaceFile(null);
      await loadData();
    } catch (err: any) {
      alert('Failed to replace PDF: ' + (err?.message || 'Error'));
    } finally {
      setIsSubmitting(false);
      setStatusMessage('');
    }
  };

  const handleDeletePdfConfirm = async () => {
    if (!deleteTargetPdf) return;
    setIsSubmitting(true);
    setStatusMessage(`Deleting ${deleteTargetPdf.originalName}...`);

    try {
      await deleteBookPdf(deleteTargetPdf.id);
      setDeleteTargetPdf(null);
      await loadData();
    } catch (err: any) {
      alert('Failed to delete PDF: ' + (err?.message || 'Error'));
    } finally {
      setIsSubmitting(false);
      setStatusMessage('');
    }
  };

  const handleMoveOrder = async (index: number, direction: 'up' | 'down') => {
    if (!book || bookPdfs.length < 2) return;
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= bookPdfs.length) return;

    const newPdfs = [...bookPdfs];
    const temp = newPdfs[index];
    newPdfs[index] = newPdfs[targetIdx];
    newPdfs[targetIdx] = temp;

    const reorderedPayload = newPdfs.map((p, idx) => ({
      id: p.id,
      order: idx + 1,
    }));

    try {
      setStatusMessage('Re-sequencing PDF order...');
      await reorderBookPdfs(book.id, reorderedPayload);
      await loadData();
    } catch (err: any) {
      alert('Failed to reorder PDFs: ' + (err?.message || 'Error'));
    } finally {
      setStatusMessage('');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  if (loading && !book) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
        ⏳ Loading Single Paid eBook details & PDF Manager...
      </div>
    );
  }

  const totalCalculatedPages = bookPdfs.reduce((sum, p) => sum + (p.pageCount || 0), 0) || book?.totalPages || 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 700, fontFamily: 'var(--font-heading)', color: 'var(--text-primary)', margin: 0 }}>
            Manage Paid eBook
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: '4px 0 0 0' }}>
            Single Paid eBook • Manage metadata, upload PDF parts, reorder chapters, and control access.
          </p>
        </div>
      </div>

      {/* Book Summary Card */}
      {book && (
        <div className="admin-card" style={{ display: 'flex', gap: '24px', alignItems: 'center', flexWrap: 'wrap' }}>
          <img
            src={book.coverImage && !book.coverImage.includes('unsplash.com') ? book.coverImage : '/uploads/ebook-cover.png'}
            alt={book.title}
            onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/uploads/ebook-cover.png'; }}
            style={{ width: '100px', height: '140px', borderRadius: '6px', objectFit: 'cover', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}
          />

          <div style={{ flex: 1, minWidth: '240px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
              <h3 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-heading)' }}>
                {book.title}
              </h3>
              <span className="badge badge-info">{book.category}</span>
            </div>

            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: '0 0 12px 0' }}>
              Author: <strong>{book.author}</strong>
            </p>

            <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', fontSize: '0.9rem' }}>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Price: </span>
                <span style={{ fontWeight: 700, color: 'var(--accent-gold)' }}>{formatCurrency(book.price)}</span>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Total Calculated Pages: </span>
                <span style={{ fontWeight: 700, color: 'var(--primary-blue)' }}>{totalCalculatedPages} pages</span>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>PDF Parts: </span>
                <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{bookPdfs.length} files</span>
              </div>
            </div>
          </div>

          <button onClick={handleOpenEditModal} className="btn btn-amber" style={{ padding: '10px 18px', fontWeight: 600 }}>
            ✏️ Edit Book Metadata
          </button>
        </div>
      )}

      {/* Status Alert Banner */}
      {statusMessage && (
        <div style={{ padding: '12px 16px', background: 'rgba(52, 152, 219, 0.15)', border: '1px solid rgba(52, 152, 219, 0.4)', borderRadius: '6px', color: 'var(--primary-blue)', fontSize: '0.88rem', fontWeight: 600 }}>
          ⏳ {statusMessage}
        </div>
      )}

      {/* PDF MANAGER SECTION */}
      <div className="admin-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: 'var(--primary-blue)', fontFamily: 'var(--font-heading)' }}>
              📄 PDF Manager (Single Continuous eBook Parts)
            </h3>
            <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Uploaded PDFs are rendered continuously as ONE single book from page 1 to {totalCalculatedPages}.
            </p>
          </div>

          <button onClick={() => { setSelectedUploadFiles([]); setIsUploadModalOpen(true); }} className="btn btn-primary" style={{ padding: '10px 18px' }}>
            ➕ Upload PDF Part(s)
          </button>
        </div>

        {/* PDF Parts Table */}
        <div className="table-container" style={{ marginTop: '8px' }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th style={{ width: '70px', textAlign: 'center' }}>Order</th>
                <th>Original PDF Filename</th>
                <th style={{ width: '100px' }}>Pages</th>
                <th style={{ width: '100px' }}>Size</th>
                <th style={{ width: '140px' }}>Uploaded</th>
                <th style={{ width: '220px', textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {bookPdfs.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                    No PDF parts uploaded yet. Click <strong>"➕ Upload PDF Part(s)"</strong> to add chapters.
                  </td>
                </tr>
              ) : (
                bookPdfs.map((pdf, idx) => (
                  <tr key={pdf.id}>
                    <td style={{ textAlign: 'center' }}>
                      <span className="badge badge-info" style={{ fontWeight: 700, fontSize: '0.85rem' }}>
                        #{pdf.order || idx + 1}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, color: 'var(--text-primary)' }}>
                        <span>📄</span> {pdf.originalName}
                      </div>
                    </td>
                    <td>
                      <span style={{ fontWeight: 700, color: 'var(--accent-gold)' }}>{pdf.pageCount} pages</span>
                    </td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                      {formatFileSize(pdf.fileSize)}
                    </td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                      {new Date(pdf.createdAt).toLocaleDateString()}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                        <button
                          onClick={() => handleMoveOrder(idx, 'up')}
                          disabled={idx === 0 || isSubmitting}
                          className="btn"
                          title="Move Up"
                          style={{ padding: '4px 8px', fontSize: '0.75rem', opacity: idx === 0 ? 0.4 : 1 }}
                        >
                          ↑
                        </button>

                        <button
                          onClick={() => handleMoveOrder(idx, 'down')}
                          disabled={idx === bookPdfs.length - 1 || isSubmitting}
                          className="btn"
                          title="Move Down"
                          style={{ padding: '4px 8px', fontSize: '0.75rem', opacity: idx === bookPdfs.length - 1 ? 0.4 : 1 }}
                        >
                          ↓
                        </button>

                        <button
                          onClick={() => { setSelectedReplaceFile(null); setReplaceTargetPdf(pdf); }}
                          disabled={isSubmitting}
                          className="btn btn-amber"
                          style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                        >
                          Replace
                        </button>

                        <button
                          onClick={() => setDeleteTargetPdf(pdf)}
                          disabled={isSubmitting}
                          className="btn btn-danger"
                          style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                        >
                          Delete
                        </button>

                        <a
                          href={`/api/books/pdfs/${pdf.id}/content?token=${localStorage.getItem('adminToken') || ''}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn"
                          style={{ padding: '4px 8px', fontSize: '0.75rem', textDecoration: 'none' }}
                          title="Preview PDF Content"
                        >
                          👁️
                        </a>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* EDIT BOOK METADATA MODAL */}
      {isEditModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300 }}>
          <div className="admin-card" style={{ maxWidth: '520px', width: '100%', position: 'relative' }}>
            <button onClick={() => setIsEditModalOpen(false)} style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '1.2rem', cursor: 'pointer' }}>✕</button>

            <h3 style={{ fontSize: '1.3rem', fontWeight: 700, fontFamily: 'var(--font-heading)', color: 'var(--primary-blue)', marginBottom: '16px' }}>
              ✏️ Edit Book Details
            </h3>

            <form onSubmit={handleEditBookSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                  Book Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '4px', border: '1px solid var(--border-light)', background: 'var(--bg-card-alt)', color: 'var(--text-primary)' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                  Author
                </label>
                <input
                  type="text"
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  required
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '4px', border: '1px solid var(--border-light)', background: 'var(--bg-card-alt)', color: 'var(--text-primary)' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '16px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                    Category
                  </label>
                  <input
                    type="text"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '4px', border: '1px solid var(--border-light)', background: 'var(--bg-card-alt)', color: 'var(--text-primary)' }}
                  />
                </div>

                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                    Price ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    required
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '4px', border: '1px solid var(--border-light)', background: 'var(--bg-card-alt)', color: 'var(--text-primary)' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '4px', border: '1px solid var(--border-light)', background: 'var(--bg-card-alt)', color: 'var(--text-primary)', fontFamily: 'inherit' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                  Cover Image (Upload new image file)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setCoverFile(e.target.files?.[0] || null)}
                  style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid var(--border-light)', background: 'var(--bg-card-alt)', color: 'var(--text-primary)' }}
                />
              </div>

              <button type="submit" disabled={isSubmitting} className="btn btn-primary" style={{ width: '100%', padding: '12px', fontWeight: 700 }}>
                {isSubmitting ? 'Saving...' : 'UPDATE BOOK METADATA'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* UPLOAD PDF MODAL */}
      {isUploadModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300 }}>
          <div className="admin-card" style={{ maxWidth: '520px', width: '100%', position: 'relative' }}>
            <button onClick={() => setIsUploadModalOpen(false)} style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '1.2rem', cursor: 'pointer' }}>✕</button>

            <h3 style={{ fontSize: '1.3rem', fontWeight: 700, fontFamily: 'var(--font-heading)', color: 'var(--primary-blue)', marginBottom: '12px' }}>
              ➕ Upload PDF Part(s) to Single eBook
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '16px' }}>
              Select single or multiple PDF files. Files will be appended in order and page counts will be computed automatically.
            </p>

            <form onSubmit={handleUploadPdfsSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <input
                  type="file"
                  accept=".pdf,application/pdf"
                  multiple
                  required
                  onChange={(e) => setSelectedUploadFiles(Array.from(e.target.files || []))}
                  style={{ width: '100%', padding: '12px', borderRadius: '4px', border: '1px dashed var(--primary-blue)', background: 'var(--bg-card-alt)', color: 'var(--text-primary)' }}
                />

                {selectedUploadFiles.length > 0 && (
                  <div style={{ marginTop: '12px', padding: '10px', background: 'rgba(212, 175, 55, 0.1)', borderRadius: '6px', border: '1px solid rgba(212, 175, 55, 0.3)' }}>
                    <div style={{ fontWeight: 700, color: 'var(--accent-gold)', fontSize: '0.85rem', marginBottom: '6px' }}>
                      📄 {selectedUploadFiles.length} file(s) selected:
                    </div>
                    <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '0.8rem', color: 'var(--text-primary)', maxHeight: '120px', overflowY: 'auto' }}>
                      {selectedUploadFiles.map((f, i) => (
                        <li key={i}>{f.name} ({formatFileSize(f.size)})</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <button type="submit" disabled={isSubmitting || selectedUploadFiles.length === 0} className="btn btn-primary" style={{ width: '100%', padding: '12px', fontWeight: 700 }}>
                {isSubmitting ? 'Processing PDF pages...' : 'UPLOAD & APPEND TO EBOOK'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* REPLACE PDF MODAL */}
      {replaceTargetPdf && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300 }}>
          <div className="admin-card" style={{ maxWidth: '480px', width: '100%', position: 'relative' }}>
            <button onClick={() => setReplaceTargetPdf(null)} style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '1.2rem', cursor: 'pointer' }}>✕</button>

            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--primary-blue)', marginBottom: '12px' }}>
              🔄 Replace PDF Part
            </h3>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
              Target: <strong>{replaceTargetPdf.originalName}</strong> (Order #{replaceTargetPdf.order})
            </div>

            <form onSubmit={handleReplacePdfSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                  Select replacement PDF file *
                </label>
                <input
                  type="file"
                  accept=".pdf,application/pdf"
                  required
                  onChange={(e) => setSelectedReplaceFile(e.target.files?.[0] || null)}
                  style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid var(--border-light)', background: 'var(--bg-card-alt)', color: 'var(--text-primary)' }}
                />
              </div>

              <button type="submit" disabled={isSubmitting || !selectedReplaceFile} className="btn btn-amber" style={{ width: '100%', padding: '12px', fontWeight: 700 }}>
                {isSubmitting ? 'Replacing PDF file...' : 'CONFIRM FILE REPLACEMENT'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteTargetPdf && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300 }}>
          <div className="admin-card" style={{ maxWidth: '440px', width: '100%', position: 'relative' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#e74c3c', marginBottom: '12px' }}>
              ⚠️ Delete PDF Part?
            </h3>
            <p style={{ color: 'var(--text-primary)', fontSize: '0.9rem', lineHeight: 1.4 }}>
              Are you sure you want to delete <strong>"{deleteTargetPdf.originalName}"</strong> (Order #{deleteTargetPdf.order}, {deleteTargetPdf.pageCount} pages)?
            </p>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
              The database record and physical disk file will be permanently removed. Remaining PDF parts will be re-sequenced and total book pages will be updated.
            </p>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '20px' }}>
              <button onClick={() => setDeleteTargetPdf(null)} className="btn" style={{ padding: '8px 16px' }}>
                Cancel
              </button>
              <button onClick={handleDeletePdfConfirm} disabled={isSubmitting} className="btn btn-danger" style={{ padding: '8px 16px', fontWeight: 700 }}>
                {isSubmitting ? 'Deleting...' : 'CONFIRM DELETE'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

