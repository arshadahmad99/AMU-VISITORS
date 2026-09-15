import React, { useState, useEffect } from 'react';
import { Book } from '@digital-library/types';
import { fetchAdminBooks, createBook, updateBook, deleteBook } from '../services/adminApi';
import { formatCurrency } from '@digital-library/utils';

export const BookManagementPage: React.FC = () => {
  const [books, setBooks] = useState<Book[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [category, setCategory] = useState('Computer Science & Physics');
  const [price, setPrice] = useState('29.99');
  
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [pdfFiles, setPdfFiles] = useState<File[]>([]);
  const [coverImage, setCoverImage] = useState(''); // Keep for existing URLs
  const [pdfUrl, setPdfUrl] = useState(''); // Keep for existing URLs
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [description, setDescription] = useState('');
  const [totalPages, setTotalPages] = useState('5');

  const loadBooks = () => {
    fetchAdminBooks().then((data) => setBooks(data));
  };

  useEffect(() => {
    loadBooks();
  }, []);

  const handleOpenAddModal = () => {
    setEditingBook(null);
    setTitle('');
    setAuthor('');
    setCategory('Computer Science & Physics');
    setPrice('29.99');
    setCoverFile(null);
    setPdfFiles([]);
    setCoverImage('');
    setPdfUrl('');
    setDescription('');
    setTotalPages('5');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (book: Book) => {
    setEditingBook(book);
    setTitle(book.title);
    setAuthor(book.author);
    setCategory(book.category);
    setPrice(book.price.toString());
    setCoverFile(null);
    setPdfFiles([]);
    setCoverImage(book.coverImage);
    setPdfUrl(book.pdfUrl || '');
    setDescription(book.description);
    setTotalPages(book.totalPages.toString());
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('author', author);
      formData.append('category', category);
      formData.append('price', price);
      formData.append('description', description);
      formData.append('totalPages', totalPages);
      if (coverFile) formData.append('coverFile', coverFile);

      if (pdfFiles.length > 0) {
        pdfFiles.forEach((file) => {
          formData.append('pdfFiles', file);
        });
      }

      if (!coverFile) formData.append('coverImage', coverImage);
      if (pdfFiles.length === 0) formData.append('pdfUrl', pdfUrl);

      if (editingBook) {
        await updateBook(editingBook.id, formData as any);
      } else {
        await createBook(formData as any);
      }

      setIsModalOpen(false);
      loadBooks();
    } catch (err: any) {
      alert('Failed to save book: ' + (err?.message || 'Error processing request'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Delete this book from catalog?')) {
      await deleteBook(id);
      loadBooks();
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 700, fontFamily: 'var(--font-heading)', color: 'var(--text-primary)' }}>
            Book Management
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Add new paid eBooks, manage catalog prices, upload covers & PDFs.</p>
        </div>

        <button onClick={handleOpenAddModal} className="btn btn-primary" style={{ padding: '10px 18px' }}>
          ➕ Add New Book
        </button>
      </div>

      <div className="table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Cover</th>
              <th>Title & Author</th>
              <th>Category</th>
              <th>Price</th>
              <th>Pages</th>
              <th>Rating</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {books.map((b) => (
              <tr key={b.id}>
                <td>
                  <img src={b.coverImage} alt={b.title} style={{ width: '40px', height: '55px', borderRadius: '4px', objectFit: 'cover' }} />
                </td>
                <td>
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{b.title}</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>By {b.author}</div>
                </td>
                <td>
                  <span className="badge badge-info">{b.category}</span>
                </td>
                <td>
                  <span style={{ fontWeight: 700, color: 'var(--accent-gold)' }}>{formatCurrency(b.price)}</span>
                </td>
                <td>{b.totalPages} pages</td>
                <td>★ {b.rating}</td>
                <td>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button onClick={() => handleOpenEditModal(b)} className="btn btn-amber" style={{ padding: '4px 8px', fontSize: '0.75rem' }}>Edit</button>
                    <button onClick={() => handleDelete(b.id)} className="btn btn-danger" style={{ padding: '4px 8px', fontSize: '0.75rem' }}>Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add / Edit Book Modal */}
      {isModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300 }}>
          <div className="admin-card" style={{ maxWidth: '520px', width: '100%', position: 'relative' }}>
            <button onClick={() => setIsModalOpen(false)} style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '1.2rem', cursor: 'pointer' }}>✕</button>

            <h3 style={{ fontSize: '1.3rem', fontWeight: 700, fontFamily: 'var(--font-heading)', color: 'var(--primary-blue)', marginBottom: '16px' }}>
              {editingBook ? '✏️ Edit Book Details' : '📚 Add New eBook'}
            </h3>

            <form onSubmit={handleFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                  Book Title (Optional - auto-generated from PDF if left empty)
                </label>
                <input
                  type="text"
                  value={title}
                  placeholder="e.g. Maulana Azad Library History"
                  onChange={(e) => setTitle(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '4px', border: '1px solid var(--border-light)', background: 'var(--bg-card-alt)', color: 'var(--text-primary)', fontSize: '0.9rem' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                  eBook PDF Chapters (Select single or multiple .pdf files) *
                </label>
                <input
                  type="file"
                  accept=".pdf"
                  multiple
                  required={!editingBook && pdfFiles.length === 0}
                  onChange={(e) => {
                    const selected = Array.from(e.target.files || []);
                    setPdfFiles(selected);
                  }}
                  style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid var(--border-light)', background: 'var(--bg-card-alt)', color: 'var(--text-primary)' }}
                />
                {pdfFiles.length > 0 && (
                  <div style={{ fontSize: '0.8rem', background: 'rgba(212, 175, 55, 0.12)', border: '1px solid rgba(212, 175, 55, 0.3)', padding: '10px 12px', borderRadius: '6px', marginTop: '10px' }}>
                    <div style={{ fontWeight: 700, color: 'var(--accent-gold)', marginBottom: '6px' }}>
                      📄 {pdfFiles.length} PDF File{pdfFiles.length > 1 ? 's' : ''} Selected (processed in natural chapter order):
                    </div>
                    <ul style={{ margin: 0, paddingLeft: '18px', maxHeight: '140px', overflowY: 'auto' }}>
                      {pdfFiles.map((f, i) => (
                        <li key={i} style={{ color: 'var(--text-primary)', marginBottom: '2px' }}>{f.name} ({(f.size / 1024).toFixed(0)} KB)</li>
                      ))}
                    </ul>
                  </div>
                )}
                {pdfUrl && pdfFiles.length === 0 && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '6px' }}>Current Primary PDF: {pdfUrl}</div>}
              </div>

              {isSubmitting ? (
                <div style={{ padding: '12px', background: 'rgba(52, 152, 219, 0.1)', border: '1px solid rgba(52, 152, 219, 0.3)', borderRadius: '4px', textAlign: 'center', color: 'var(--primary-blue)', fontSize: '0.85rem', fontWeight: 600 }}>
                  ⏳ Processing PDF pages & converting to 3D flipbook reader... Please wait.
                </div>
              ) : (
                <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '12px', fontSize: '0.95rem', fontWeight: 700, letterSpacing: '0.5px' }}>
                  {editingBook ? 'UPDATE EBOOK DETAILS' : 'PUBLISH BOOK TO CATALOG'}
                </button>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
