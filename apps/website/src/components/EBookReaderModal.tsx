import React, { useState, useEffect } from 'react';
import { PageFlipReader } from '@digital-library/ui';
import { Book } from '@digital-library/types';
import api from '../services/api';
import { RealisticBookReader } from './RealisticBookReader';

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
  const [fullBook, setFullBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (book && isOpen) {
      setLoading(true);
      // Fetch full book data to get pageImages
      api.get(`/books/${book.id}`)
        .then((res) => {
          setFullBook(res.data);
        })
        .catch(() => {})
        .finally(() => setLoading(false));

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

  if (loading) {
    return (
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: '#021634',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 300,
        }}
      >
        <div style={{ color: '#fff', fontSize: '1.2rem' }}>Loading Book...</div>
      </div>
    );
  }

  const activeBook = fullBook || book;

  // Format book text pages into reader structure
  const formattedPages = (activeBook.pagesText || []).map((text, idx) => ({
    pageNumber: idx + 1,
    header: `${activeBook.title} - Chapter ${idx + 1}`,
    content: text,
  }));

  if (formattedPages.length === 0) {
    for (let i = 1; i <= activeBook.totalPages; i++) {
      formattedPages.push({
        pageNumber: i,
        header: `${activeBook.title} - Section ${i}`,
        content: `CHAPTER ${i}\n\nSample high-resolution text content for ${activeBook.title}. Features physical paper curl animations, multi-touch drag gestures, bookmarking, and instant full-text search capability.`,
      });
    }
  }

  const handlePageChange = (newPage: number) => {
    // Auto-save last read page (Continue Reading feature)
    api.post(`/books/${activeBook.id}/progress`, {
      lastPage: newPage,
      totalPages: activeBook.totalPages,
    }).catch(() => {});
  };

  const handleToggleBookmark = (pageNumber: number) => {
    api.post('/orders/bookmarks', { bookId: activeBook.id, pageNumber })
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
    api.get(`/books/${activeBook.id}/search-inside`, { params: { q: query } })
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
        background: '#021634',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 300,
      }}
    >
      {/* Main 3D Reader Engine */}
      <div style={{ flex: 1, position: 'relative', display: 'flex', minHeight: 0 }}>
        <RealisticBookReader
          title={activeBook.title}
          pageImages={activeBook.pageImages || []}
          initialPage={initialPage}
          onPageChange={handlePageChange}
          bookmarks={bookmarks}
          onToggleBookmark={handleToggleBookmark}
          onClose={onClose}
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
