import React, { useRef, useState, useEffect } from 'react';
// @ts-ignore
import HTMLFlipBook from 'react-pageflip';
import PDFBook from './PDFBook';
import assetEbookPdf from '../assets/EbookPdf-compressed.pdf';

interface RealisticBookReaderProps {
  title: string;
  pageImages?: { pageNum: number; imageUrl: string }[];
  pdfUrl?: string;
  chapters?: { id?: string; name: string; url: string; startPage?: number; endPage?: number; totalPages?: number }[];
  initialPage?: number;
  onPageChange?: (page: number) => void;
  bookmarks?: number[];
  onToggleBookmark?: (page: number) => void;
  onClose?: () => void;
}

export const RealisticBookReader: React.FC<RealisticBookReaderProps> = ({
  title, pageImages = [], pdfUrl = '', chapters = [], initialPage = 1, onPageChange, bookmarks = [], onToggleBookmark, onClose
}) => {
  const [isSinglePage, setIsSinglePage] = useState(window.innerWidth < 768);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [selectedChapterUrl, setSelectedChapterUrl] = useState<string>(
    chapters.length > 0 ? chapters[0].url : (pdfUrl || assetEbookPdf)
  );
  const [viewMode, setViewMode] = useState<'flipbook' | 'pdf'>('flipbook');

  useEffect(() => {
    const handleResize = () => setIsSinglePage(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (chapters.length > 0 && !selectedChapterUrl) {
      setSelectedChapterUrl(chapters[0].url);
    } else if (!selectedChapterUrl) {
      setSelectedChapterUrl(pdfUrl || assetEbookPdf);
    }
  }, [chapters, pdfUrl]);

  const handleChapterSelect = (url: string) => {
    setSelectedChapterUrl(url);
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
        {/* Left Section: Back Button + Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexShrink: 0 }}>
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
          <h2 style={{
            margin: 0,
            fontSize: '1.15rem',
            color: '#f59e0b',
            fontFamily: 'var(--font-heading)',
            fontWeight: 700,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            maxWidth: '240px'
          }}>
            {title}
          </h2>
        </div>

        {/* Middle Section: Chapter Dropdown + Toggle View Button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 1, overflow: 'hidden' }}>
          {chapters.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: 600, whiteSpace: 'nowrap' }}>Chapter:</span>
              <select
                value={selectedChapterUrl}
                onChange={(e) => handleChapterSelect(e.target.value)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  background: '#0f172a',
                  color: '#f8fafc',
                  border: '1px solid #334155',
                  fontSize: '0.85rem',
                  maxWidth: '220px',
                  cursor: 'pointer',
                  outline: 'none',
                  textOverflow: 'ellipsis'
                }}
              >
                {chapters.map((chap, idx) => (
                  <option key={chap.id || idx} value={chap.url}>
                    {chap.name} {chap.startPage ? `(Pg ${chap.startPage}-${chap.endPage})` : ''}
                  </option>
                ))}
              </select>
            </div>
          )}

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
            onMouseOver={(e) => (e.currentTarget.style.opacity = '0.9')}
            onMouseOut={(e) => (e.currentTarget.style.opacity = '1')}
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

      {/* Main Reader Stage View Area */}
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
  );
};
