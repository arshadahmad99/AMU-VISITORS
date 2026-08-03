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
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [coverImage, setCoverImage] = useState(''); // Keep for existing URLs
  const [pdfUrl, setPdfUrl] = useState(''); // Keep for existing URLs

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
    setPdfFile(null);
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
    setPdfFile(null);
    setCoverImage(book.coverImage);
    setPdfUrl(book.pdfUrl || '');
    setDescription(book.description);
    setTotalPages(book.totalPages.toString());
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Use FormData for file uploads
    const formData = new FormData();
    formData.append('title', title);
    formData.append('author', author);
    formData.append('category', category);
    formData.append('price', price);
    formData.append('description', description);
    formData.append('totalPages', totalPages);
    if (coverFile) formData.append('coverFile', coverFile);
    if (pdfFile) formData.append('pdfFile', pdfFile);

    if (!coverFile) formData.append('coverImage', coverImage);
    if (!pdfFile) formData.append('pdfUrl', pdfUrl);

    if (editingBook) {
      await updateBook(editingBook.id, formData as any); // Assuming updateBook takes any payload right now
    } else {
      await createBook(formData as any);
    }

    setIsModalOpen(false);
    loadBooks();
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

            <form onSubmit={handleFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Book Title</label>
                <input type="text" required value={title} onChange={(e) => setTitle(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '2px', border: '1px solid var(--border-light)', background: 'var(--bg-card-alt)', color: 'var(--text-primary)' }} />
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Author Name</label>
                  <input type="text" required value={author} onChange={(e) => setAuthor(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '2px', border: '1px solid var(--border-light)', background: 'var(--bg-card-alt)', color: 'var(--text-primary)' }} />
                </div>
                <div style={{ width: '120px' }}>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Price ($)</label>
                  <input type="number" step="0.01" required value={price} onChange={(e) => setPrice(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '2px', border: '1px solid var(--border-light)', background: 'var(--bg-card-alt)', color: 'var(--text-primary)' }} />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Category</label>
                <select value={category} onChange={(e) => setCategory(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '2px', border: '1px solid var(--border-light)', background: 'var(--bg-card-alt)', color: 'var(--text-primary)' }}>
                  <option value="Computer Science & Physics">Computer Science & Physics</option>
                  <option value="Artificial Intelligence">Artificial Intelligence</option>
                  <option value="History & Library Science">History & Library Science</option>
                  <option value="Software Engineering">Software Engineering</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Cover Image Upload</label>
                  <input type="file" accept="image/*" onChange={(e) => setCoverFile(e.target.files?.[0] || null)} style={{ width: '100%', padding: '8px', borderRadius: '2px', border: '1px solid var(--border-light)', background: 'var(--bg-card-alt)', color: 'var(--text-primary)' }} />
                  {coverImage && !coverFile && <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px' }}>Current: {coverImage}</div>}
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>eBook File (.pdf / .mdb)</label>
                  <input type="file" accept=".pdf,.mdb" onChange={(e) => setPdfFile(e.target.files?.[0] || null)} style={{ width: '100%', padding: '8px', borderRadius: '2px', border: '1px solid var(--border-light)', background: 'var(--bg-card-alt)', color: 'var(--text-primary)' }} />
                  {pdfUrl && !pdfFile && <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px' }}>Current: {pdfUrl}</div>}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ flex: 1 }}></div>
                <div style={{ width: '100px' }}>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Total Pages</label>
                  <input type="number" value={totalPages} onChange={(e) => setTotalPages(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '2px', border: '1px solid var(--border-light)', background: 'var(--bg-card-alt)', color: 'var(--text-primary)' }} />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Description</label>
                <textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '2px', border: '1px solid var(--border-light)', background: 'var(--bg-card-alt)', color: 'var(--text-primary)' }} />
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '10px' }}>
                {editingBook ? 'Save Book Changes' : 'Publish Book to Catalog'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
