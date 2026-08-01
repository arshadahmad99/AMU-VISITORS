import React, { useState, useEffect } from 'react';
import { PageFlipReader } from '@digital-library/ui';
import { Book } from '@digital-library/types';
import api from '../services/api';

interface EBookReaderModalProps {
  book: Book | null;
  isOpen: boolean;
  onClose: () => void;
}

export const EBookReaderModal: React.FC<EBookReaderModalProps> = ({ book, isOpen, onClose }) => {
  const [initialPage, setInitialPage] = useState<number>(1);
  const [bookmarks, setBookmarks] = useState<number[]>([]);
  const [searchMatches, setSearchMatches] = useState<any[]>([]);
  const [showSearchModal, setShowSearchModal] = useState<boolean>(false);

  useEffect(() => {
    if (book && isOpen) {
      // Fetch saved continue reading progress and bookmarks
      api.get(`/orders/reading-history/${book.id}`)
        .then((res) => {
          if (res.data?.lastPage) {
            setInitialPage(res.data.lastPage);
          }
        })
        .catch(() => {});

      api.get(`/orders/bookmarks/${book.id}`)
        .then((res) => {
          if (Array.isArray(res.data)) {
            setBookmarks(res.data);
          }
        })
        .catch(() => {});
    }
  }, [book, isOpen]);

  if (!isOpen || !book) return null;

  // Format book text pages into reader structure
  const formattedPages = (book.pagesText || []).map((text, idx) => ({
    pageNumber: idx + 1,
    header: `${book.title} - Chapter ${idx + 1}`,
    content: text,
  }));

  if (formattedPages.length === 0) {
    for (let i = 1; i <= book.totalPages; i++) {
      formattedPages.push({
        pageNumber: i,
        header: `${book.title} - Section ${i}`,
        content: `CHAPTER ${i}\n\nSample high-resolution text content for ${book.title}. Features physical paper curl animations, multi-touch drag gestures, bookmarking, and instant full-text search capability.`,
      });
    }
  }

  const handlePageChange = (newPage: number) => {
    // Auto-save last read page (Continue Reading feature)
    api.post('/orders/reading-history', {
      bookId: book.id,
      pageNumber: newPage,
      totalPages: book.totalPages,
    }).catch(() => {});
  };

  const handleToggleBookmark = (pageNumber: number) => {
    api.post('/orders/bookmarks', { bookId: book.id, pageNumber })
      .then((res) => {
        if (res.data?.isBookmarked) {
          setBookmarks((prev) => [...prev, pageNumber]);
        } else {
          setBookmarks((prev) => prev.filter((p) => p !== pageNumber));
        }
      })
      .catch(() => {
        setBookmarks((prev) =>
          prev.includes(pageNumber) ? prev.filter((p) => p !== pageNumber) : [...prev, pageNumber]
        );
      });
  };

  const handleSearchInside = (query: string) => {
    if (!query.trim()) return;
    api.get(`/books/${book.id}/search-inside`, { params: { q: query } })
      .then((res) => {
        setSearchMatches(res.data.matches || []);
        setShowSearchModal(true);
      })
      .catch(() => {
        const matches: any[] = [];
        formattedPages.forEach((p, idx) => {
          if (p.content.toLowerCase().includes(query.toLowerCase())) {
            matches.push({ pageNumber: idx + 1, snippet: p.content.substring(0, 100) });
          }
        });
        setSearchMatches(matches);
        setShowSearchModal(true);
      });
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(27, 42, 74, 0.75)',
        backdropFilter: 'blur(12px)',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 300,
        padding: '16px',
      }}
    >
      {/* Header bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', color: '#fff' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.2)',
              color: '#fff',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 700,
            }}
          >
            ← Back to Library
          </button>
          <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fef08a', fontFamily: 'Outfit, sans-serif' }}>{book.title}</span>
        </div>

        <div style={{ fontSize: '0.85rem', color: '#f8fafc', fontWeight: 600 }}>
          {bookmarks.length > 0 && <span>🔖 {bookmarks.length} Bookmarks saved</span>}
        </div>
      </div>

      {/* Main 3D Reader Engine */}
      <div style={{ flex: 1, position: 'relative' }}>
        <PageFlipReader
          title={book.title}
          pages={formattedPages}
          initialPage={initialPage}
          onPageChange={handlePageChange}
          bookmarks={bookmarks}
          onToggleBookmark={handleToggleBookmark}
          onSearchInside={handleSearchInside}
        />
      </div>

      {/* Search Matches Overlay Modal */}
      {showSearchModal && (
        <div
          style={{
            position: 'absolute',
            top: '80px',
            right: '30px',
            width: '320px',
            background: 'rgba(255, 255, 255, 0.96)',
            border: '1px solid rgba(212, 175, 55, 0.5)',
            borderRadius: '12px',
            padding: '16px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
            zIndex: 350,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#1b2a4a' }}>🔍 Search Results ({searchMatches.length})</h4>
            <button onClick={() => setShowSearchModal(false)} style={{ background: 'none', border: 'none', color: '#5c6b73', cursor: 'pointer' }}>✕</button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '300px', overflowY: 'auto' }}>
            {searchMatches.length === 0 ? (
              <p style={{ fontSize: '0.8rem', color: '#5c6b73' }}>No occurrences found in book pages.</p>
            ) : (
              searchMatches.map((m, idx) => (
                <div
                  key={idx}
                  onClick={() => {
                    setInitialPage(m.pageNumber);
                    setShowSearchModal(false);
                  }}
                  style={{
                    padding: '8px 10px',
                    borderRadius: '8px',
                    background: 'rgba(248, 245, 238, 0.9)',
                    border: '1px solid rgba(212, 175, 55, 0.3)',
                    cursor: 'pointer',
                    fontSize: '0.8rem',
                    color: '#1b2a4a',
                  }}
                >
                  <strong style={{ color: '#b8860b' }}>Page {m.pageNumber}:</strong> {m.snippet}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
