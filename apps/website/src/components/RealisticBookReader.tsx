import React, { useRef, useState, useEffect } from 'react';
import PDFBook, { PDFBookRefHandle } from './PDFBook';
import assetEbookPdf from '../assets/EbookPdf-compressed.pdf';

interface ChapterItem {
  id: string;
  name: string;
  targetPage: number;
  bookPages?: string;
  isSubPart?: boolean;
}

const BOOK_TOC: ChapterItem[] = [
  { id: 'toc-i', name: '(i) Title page', targetPage: 1 },
  { id: 'toc-ii', name: '(ii) Prayer', targetPage: 2 },
  { id: 'toc-iii', name: '(iii) Dedication', targetPage: 3 },
  { id: 'toc-iv', name: '(iv) Foreword', targetPage: 4 },
  { id: 'toc-v', name: '(v) About the Author', targetPage: 4 },
  { id: 'toc-vi', name: '(vi) Preface', targetPage: 6 },
  { id: 'toc-vii', name: '(vii) Contents Page', targetPage: 7 },
  { id: 'chap-1', name: 'Chapter 1: Lytton Library & Khalifa Mohammad Asadullah', targetPage: 9, bookPages: '1-12' },
  { id: 'chap-2', name: 'Chapter 2: Maulana Azad Library & Syed Bashiruddin Ahmad', targetPage: 21, bookPages: '13-26' },
  { id: 'chap-3', name: 'Chapter 3: Maulana Azad Library & Mohd Fayazuddin Nizami', targetPage: 35, bookPages: '27-36' },
  { id: 'chap-4', name: 'Chapter 4: Maulana Azad Library & Syed Sadequain Ahmed', targetPage: 45, bookPages: '37-50' },
  { id: 'chap-5', name: 'Chapter 5: Maulana Azad Library & Moazzam Ali Khan', targetPage: 59, bookPages: '51-66' },
  { id: 'chap-6', name: 'Chapter 6: Shifting Lytton Library to M.A. Library (1960)', targetPage: 75, bookPages: '67-84' },
  { id: 'chap-7', name: 'Chapter 7: Rare Manuscripts & Publication of Nahjul Blagha', targetPage: 93, bookPages: '85-94' },
  { id: 'chap-8', name: 'Chapter 8: Department of Library & Information Science', targetPage: 105, bookPages: '95-114' },
  { id: 'chap-9', name: 'Chapter 9: Social Science Cyber Library: First in the World', targetPage: 125, bookPages: '115-128' },
  { id: 'chap-10', name: 'Chapter 10: Modernisation of Maulana Azad Library', targetPage: 139 },
  { id: 'chap-10-p1', name: 'Part 1: Library Services & Facelift', targetPage: 139, bookPages: '129-140', isSubPart: true },
  { id: 'chap-10-p2', name: 'Part 2: Sir Syed Personal Library, Manuscripts', targetPage: 151, bookPages: '141-162', isSubPart: true },
  { id: 'chap-10-p3', name: 'Part 3: Digital Resource Centre, OPAC', targetPage: 173, bookPages: '163-194', isSubPart: true },
];

interface RealisticBookReaderProps {
  title: string;
  pageImages?: { pageNum: number; imageUrl: string }[];
  pdfUrl?: string;
  chapters?: { id?: string; name: string; url?: string; startPage?: number; endPage?: number; totalPages?: number }[];
  initialPage?: number;
  onPageChange?: (page: number) => void;
  bookmarks?: number[];
  onToggleBookmark?: (page: number) => void;
  onClose?: () => void;
}

export const RealisticBookReader: React.FC<RealisticBookReaderProps> = ({
  title, pdfUrl = '', chapters = [], initialPage = 1, onPageChange, bookmarks = [], onToggleBookmark, onClose
}) => {
  const [isSinglePage, setIsSinglePage] = useState(window.innerWidth < 768);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [selectedChapterUrl, setSelectedChapterUrl] = useState<string>(
    chapters.length > 0 && chapters[0].url ? chapters[0].url : (pdfUrl || assetEbookPdf)
  );
  const [viewMode, setViewMode] = useState<'flipbook' | 'pdf'>('flipbook');
  const [isTocOpen, setIsTocOpen] = useState<boolean>(window.innerWidth >= 992);
  const pdfBookRef = useRef<PDFBookRefHandle>(null);

  useEffect(() => {
    const handleResize = () => {
      setIsSinglePage(window.innerWidth < 768);
      if (window.innerWidth < 992) setIsTocOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleChapterClick = (targetPage: number, url?: string) => {
    if (url) setSelectedChapterUrl(url);
    if (pdfBookRef.current) {
      pdfBookRef.current.jumpToPage(targetPage);
    }
    setCurrentPage(targetPage);
    if (onPageChange) onPageChange(targetPage);
    if (window.innerWidth < 768) setIsTocOpen(false);
  };

  const getAuthToken = () => {
    if (typeof window === 'undefined') return '';
    return (
      localStorage.getItem('dl_token') ||
      localStorage.getItem('token') ||
      localStorage.getItem('adminToken') ||
      ''
    );
  };

  const getImageUrl = (url: string) => {
    if (!url) return '';
    if (url.startsWith('data:') || url.startsWith('blob:')) return url;
    if (url.includes('token=')) return url;
    const token = getAuthToken();
    return (token && token !== 'null' && token !== 'undefined')
      ? `${url}${url.includes('?') ? '&' : '?'}token=${token}`
      : url;
  };

  const pdfSource = selectedChapterUrl || pdfUrl || assetEbookPdf;

  // Find active chapter based on current page
  const activeTocItem = [...BOOK_TOC].reverse().find(item => currentPage >= item.targetPage);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100vw', background: '#0f172a', overflow: 'hidden' }}>
      {/* Top Header Navigation Toolbar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 24px',
        background: '#1e293b',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        color: '#f8fafc',
        flexWrap: 'nowrap',
        gap: '16px',
        zIndex: 100,
        boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
        minHeight: '60px'
      }}>
        {/* Left Section: Back Button + TOC Toggle + Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexShrink: 0 }}>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.15)',
              color: '#f8fafc',
              padding: '6px 14px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '0.9rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'background 0.2s'
            }}
            onMouseOver={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.15)')}
            onMouseOut={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.08)')}
          >
            ← Back
          </button>

          {/* Table of Contents Drawer Toggle Button */}
          <button
            onClick={() => setIsTocOpen(!isTocOpen)}
            style={{
              background: isTocOpen ? '#f59e0b' : 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.15)',
              color: isTocOpen ? '#0f172a' : '#f8fafc',
              padding: '6px 14px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '0.85rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s'
            }}
          >
            📖 Table of Contents
          </button>

          <h2 style={{
            margin: 0,
            fontSize: '1.15rem',
            color: '#f59e0b',
            fontFamily: 'var(--font-heading)',
            fontWeight: 700,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            maxWidth: '220px'
          }}>
            {title}
          </h2>
        </div>

        {/* Middle Section: Toggle View Mode */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 1, overflow: 'hidden' }}>
          <button
            onClick={() => setViewMode(v => v === 'flipbook' ? 'pdf' : 'flipbook')}
            style={{
              padding: '6px 16px',
              borderRadius: '6px',
              background: viewMode === 'pdf' ? '#d97706' : '#2563eb',
              color: '#ffffff',
              border: 'none',
              fontWeight: 600,
              fontSize: '0.85rem',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
              transition: 'opacity 0.2s'
            }}
          >
            {viewMode === 'pdf' ? '📖 View 3D Reader' : '📄 View Full PDF'}
          </button>
        </div>
        
        {/* Right Section: Zoom + Bookmark */}
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexShrink: 0 }}>
          {viewMode === 'flipbook' && (
            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                onClick={() => setZoomLevel(z => Math.min(2, z + 0.15))}
                style={{
                  padding: '5px 12px',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  background: '#334155',
                  color: '#f8fafc',
                  border: '1px solid #475569',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                Zoom In
              </button>
              <button
                onClick={() => setZoomLevel(z => Math.max(0.6, z - 0.15))}
                style={{
                  padding: '5px 12px',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  background: '#334155',
                  color: '#f8fafc',
                  border: '1px solid #475569',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                Zoom Out
              </button>
            </div>
          )}

          <button
            onClick={() => onToggleBookmark?.(currentPage)}
            style={{
              padding: '6px 14px',
              background: bookmarks.includes(currentPage) ? '#f59e0b' : '#334155',
              color: bookmarks.includes(currentPage) ? '#0f172a' : '#f8fafc',
              border: '1px solid #475569',
              borderRadius: '6px',
              fontSize: '0.82rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            {bookmarks.includes(currentPage) ? '★ Bookmarked' : '☆ Bookmark'}
          </button>
        </div>
      </div>

      {/* Main Body Area: Left Sidebar TOC + Main Flipbook Stage */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative' }}>
        
        {/* LEFT SIDEBAR TABLE OF CONTENTS */}
        {isTocOpen && (
          <div style={{
            width: '320px',
            background: '#0f172a',
            borderRight: '1px solid rgba(255, 255, 255, 0.12)',
            display: 'flex',
            flexDirection: 'column',
            zIndex: 80,
            boxShadow: '4px 0 20px rgba(0,0,0,0.4)',
            transition: 'all 0.3s ease',
            flexShrink: 0
          }}>
            {/* TOC Header */}
            <div style={{
              padding: '14px 18px',
              background: '#1e293b',
              borderBottom: '1px solid rgba(255,255,255,0.1)',
              display: 'flex',
              justify: 'space-between',
              alignItems: 'center'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: '#f59e0b', fontSize: '1.1rem' }}>📋</span>
                <h3 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 700, color: '#f8fafc', letterSpacing: '0.5px' }}>
                  Table of Contents
                </h3>
              </div>
              <button
                onClick={() => setIsTocOpen(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#94a3b8',
                  fontSize: '1.1rem',
                  cursor: 'pointer',
                  padding: '2px 6px'
                }}
              >
                ✕
              </button>
            </div>

            {/* Sub-header Instruction */}
            <div style={{ padding: '8px 18px', background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', fontSize: '0.78rem', fontWeight: 600, borderBottom: '1px solid rgba(245, 158, 11, 0.2)' }}>
              Click on any chapter below to jump to that page
            </div>

            {/* Chapter Items Scrollable List */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '10px 8px' }}>
              {BOOK_TOC.map((item) => {
                const isActive = activeTocItem?.id === item.id;
                return (
                  <div
                    key={item.id}
                    onClick={() => handleChapterClick(item.targetPage)}
                    style={{
                      padding: item.isSubPart ? '8px 14px 8px 30px' : '10px 14px',
                      marginBottom: '4px',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      background: isActive ? '#f59e0b' : 'transparent',
                      color: isActive ? '#0f172a' : (item.isSubPart ? '#cbd5e1' : '#f8fafc'),
                      borderLeft: isActive ? '4px solid #ffffff' : (item.isSubPart ? '2px solid #334155' : 'none'),
                      fontSize: item.isSubPart ? '0.82rem' : '0.88rem',
                      fontWeight: isActive ? 700 : (item.isSubPart ? 500 : 600),
                      display: 'flex',
                      justify: 'space-between',
                      alignItems: 'center',
                      transition: 'all 0.15s ease'
                    }}
                    onMouseOver={(e) => {
                      if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.07)';
                    }}
                    onMouseOut={(e) => {
                      if (!isActive) e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    <span style={{ lineHeight: '1.35', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {item.name}
                    </span>
                    <span style={{
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      opacity: isActive ? 1 : 0.75,
                      background: isActive ? 'rgba(0,0,0,0.15)' : 'rgba(255,255,255,0.1)',
                      padding: '2px 8px',
                      borderRadius: '10px',
                      flexShrink: 0,
                      marginLeft: '8px'
                    }}>
                      Pg {item.targetPage}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Main Reader Stage Area */}
        <div style={{
          flex: 1,
          display: 'flex',
          justify: 'center',
          alignItems: 'center',
          overflow: 'hidden',
          padding: viewMode === 'pdf' ? 0 : '16px',
          position: 'relative'
        }}>
          {viewMode === 'pdf' ? (
            pdfSource ? (
              <iframe
                src={getImageUrl(pdfSource)}
                style={{ width: '100%', height: '100%', border: 'none' }}
                title={`${title} - Chapter PDF`}
              />
            ) : (
              <div style={{ color: '#94a3b8', fontSize: '1rem' }}>No PDF file selected for this chapter.</div>
            )
          ) : (
            <div style={{
              transform: `scale(${zoomLevel})`,
              transition: 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              width: '100%',
              height: '100%',
              display: 'flex',
              justify: 'center',
              alignItems: 'center'
            }}>
              <PDFBook
                ref={pdfBookRef}
                source={pdfSource}
                width={isSinglePage ? 380 : 460}
                height={isSinglePage ? 560 : 640}
                initialPage={initialPage}
                onPageChange={(page) => {
                  setCurrentPage(page);
                  if (onPageChange) onPageChange(page);
                }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
