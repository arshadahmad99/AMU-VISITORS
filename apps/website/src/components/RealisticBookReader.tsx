import React, { useRef, useState, useEffect } from 'react';
import { BookPDF } from '@digital-library/types';
import PDFBook, { PDFBookRefHandle } from './PDFBook';
import assetEbookPdf from '../assets/EbookPdf-compressed.pdf';
import './PDFBook.css';

interface ChapterItem {
  id: string;
  name: string;
  targetPage: number;
  bookPages?: string;
  isSubPart?: boolean;
}

const BOOK_TOC: ChapterItem[] = [
  { id: 'toc-i', name: 'Title page', targetPage: 1 },
  { id: 'toc-ii', name: 'Prayer', targetPage: 2 },
  { id: 'toc-iii', name: 'Dedication', targetPage: 3 },
  { id: 'toc-v', name: 'About the Author', targetPage: 4 },
  { id: 'toc-vi', name: 'Preface', targetPage: 6 },
  { id: 'toc-vii', name: 'Contents Page', targetPage: 7 },
  { id: 'chap-1', name: 'Chap 1: Lytton Library & Asadullah', targetPage: 9, bookPages: '1-12' },
  { id: 'chap-2', name: 'Chap 2: M.A. Library & Bashiruddin', targetPage: 21, bookPages: '13-26' },
  { id: 'chap-3', name: 'Chap 3: M.A. Library & Fayazuddin', targetPage: 35, bookPages: '27-36' },
  { id: 'chap-4', name: 'Chap 4: M.A. Library & Sadequain', targetPage: 45, bookPages: '37-50' },
  { id: 'chap-5', name: 'Chap 5: M.A. Library & Moazzam Khan', targetPage: 59, bookPages: '51-66' },
  { id: 'chap-6', name: 'Chap 6: Shifting Lytton to M.A. Lib', targetPage: 75, bookPages: '67-84' },
  { id: 'chap-7', name: 'Chap 7: Rare Manuscripts & Nahjul', targetPage: 93, bookPages: '85-94' },
  { id: 'chap-8', name: 'Chap 8: Dept of Library & Info Sci', targetPage: 105, bookPages: '95-114' },
  { id: 'chap-9', name: 'Chap 9: Social Science Cyber Lib', targetPage: 125, bookPages: '115-128' },
  { id: 'chap-10', name: 'Chap 10: Modernisation of M.A. Lib', targetPage: 139 },
  { id: 'chap-10-p1', name: 'Part 1: Services & Facelift', targetPage: 139, bookPages: '129-140', isSubPart: true },
  { id: 'chap-10-p2', name: 'Part 2: Sir Syed Personal Lib', targetPage: 151, bookPages: '141-162', isSubPart: true },
  { id: 'chap-10-p3', name: 'Part 3: Digital Resource Centre', targetPage: 173, bookPages: '163-194', isSubPart: true },
];

interface RealisticBookReaderProps {
  title: string;
  pageImages?: { pageNum: number; imageUrl: string }[];
  pdfUrl?: string;
  bookPdfs?: BookPDF[];
  chapters?: { id?: string; name: string; url?: string; startPage?: number; endPage?: number; totalPages?: number }[];
  initialPage?: number;
  onPageChange?: (page: number) => void;
  bookmarks?: number[];
  onToggleBookmark?: (page: number) => void;
  onClose?: () => void;
}

export const RealisticBookReader: React.FC<RealisticBookReaderProps> = ({
  title, pdfUrl = '', bookPdfs = [], chapters = [], initialPage = 1, onPageChange, bookmarks = [], onToggleBookmark, onClose
}) => {
  const [isSinglePage, setIsSinglePage] = useState(window.innerWidth < 768);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [totalPages, setTotalPages] = useState(204);
  const [jumpInput, setJumpInput] = useState(initialPage.toString());
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
    setJumpInput(targetPage.toString());
    if (onPageChange) onPageChange(targetPage);
    if (window.innerWidth < 768) setIsTocOpen(false);
  };

  const handleJumpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const p = parseInt(jumpInput, 10);
    if (p > 0 && p <= totalPages && pdfBookRef.current) {
      pdfBookRef.current.jumpToPage(p);
    }
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
  const sortedPdfs = [...bookPdfs].sort((a, b) => a.order - b.order);
  const pdfSources: string[] = sortedPdfs.length > 0
    ? sortedPdfs.map(p => `/api/books/pdfs/${p.id}/content`)
    : [pdfSource];

  const getPartForPage = (page: number) => {
    if (sortedPdfs.length === 0) return null;
    let accum = 0;
    for (let i = 0; i < sortedPdfs.length; i++) {
      const p = sortedPdfs[i];
      const start = accum + 1;
      const end = accum + p.pageCount;
      if (page >= start && page <= end) {
        return { pdf: p, index: i, startPage: start, endPage: end };
      }
      accum = end;
    }
    return { pdf: sortedPdfs[0], index: 0, startPage: 1, endPage: sortedPdfs[0].pageCount };
  };

  const [selectedPdfPartIndex, setSelectedPdfPartIndex] = useState<number | null>(null);
  const currentPartInfo = getPartForPage(currentPage);
  const activePdfPartUrl = (selectedPdfPartIndex !== null && sortedPdfs[selectedPdfPartIndex])
    ? `/api/books/pdfs/${sortedPdfs[selectedPdfPartIndex].id}/content`
    : (currentPartInfo ? `/api/books/pdfs/${currentPartInfo.pdf.id}/content` : pdfSource);

  const activeTocItem = [...BOOK_TOC].reverse().find(item => currentPage >= item.targetPage);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100vw', background: '#0b1329', overflow: 'hidden', position: 'relative' }}>

      {/* Main Container Stage (Flex item above footer dock) */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative', width: '100%', minHeight: 0 }}>

        {/* ENHANCED COMPACT LEFT SIDEBAR */}
        {isTocOpen && (
          <div style={{
            width: '265px',
            background: '#0f172a',
            borderRight: '1px solid rgba(255, 255, 255, 0.12)',
            display: 'flex',
            flexDirection: 'column',
            zIndex: 95,
            boxShadow: '4px 0 24px rgba(0,0,0,0.5)',
            transition: 'all 0.25s ease',
            flexShrink: 0
          }}>
            {/* TOC Header */}
            <div style={{
              padding: '10px 14px',
              background: '#1e293b',
              borderBottom: '1px solid rgba(255,255,255,0.1)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ color: '#f59e0b', fontSize: '1rem' }}>📋</span>
                <h3 style={{ margin: 0, fontSize: '0.88rem', fontWeight: 700, color: '#f8fafc', letterSpacing: '0.3px' }}>
                  Table of Contents
                </h3>
              </div>
              <button
                onClick={() => setIsTocOpen(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#94a3b8',
                  fontSize: '1rem',
                  cursor: 'pointer',
                  padding: '2px 4px'
                }}
              >
                ✕
              </button>
            </div>

            {/* Chapter Items List */}
            <div style={{ flex: 1, padding: '6px 6px', overflow: 'hidden', display: 'flex', flexDirection: 'column', justifyContent: 'space-evenly' }}>
              {BOOK_TOC.map((item) => {
                const isActive = activeTocItem?.id === item.id;
                return (
                  <div
                    key={item.id}
                    onClick={() => handleChapterClick(item.targetPage)}
                    style={{
                      padding: item.isSubPart ? '3px 8px 3px 20px' : '4px 10px',
                      borderRadius: '5px',
                      cursor: 'pointer',
                      background: isActive ? '#f59e0b' : 'transparent',
                      color: isActive ? '#0f172a' : (item.isSubPart ? '#94a3b8' : '#f8fafc'),
                      borderLeft: isActive ? '3px solid #ffffff' : (item.isSubPart ? '2px solid #334155' : 'none'),
                      fontSize: item.isSubPart ? '0.70rem' : '0.74rem',
                      fontWeight: isActive ? 700 : (item.isSubPart ? 500 : 600),
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      lineHeight: '1.2',
                      transition: 'all 0.15s ease',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden'
                    }}
                    onMouseOver={(e) => {
                      if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.07)';
                    }}
                    onMouseOut={(e) => {
                      if (!isActive) e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {item.name}
                    </span>
                    <span style={{
                      fontSize: '0.68rem',
                      fontWeight: 700,
                      opacity: isActive ? 1 : 0.75,
                      background: isActive ? 'rgba(0,0,0,0.18)' : 'rgba(255,255,255,0.1)',
                      padding: '1px 6px',
                      borderRadius: '8px',
                      flexShrink: 0,
                      marginLeft: '6px'
                    }}>
                      Pg {item.targetPage}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Main 3D Book Stage Area */}
        <div style={{
          flex: 1,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          overflow: 'hidden',
          padding: viewMode === 'pdf' ? 0 : '12px',
          position: 'relative',
          width: '100%',
          height: '100%'
        }}>
          {viewMode === 'pdf' ? (
            <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
              {sortedPdfs.length > 1 && (
                <div style={{ background: '#0f172a', padding: '6px 12px', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600 }}>PDF Parts:</span>
                  {sortedPdfs.map((pdf, idx) => {
                    const isActive = (selectedPdfPartIndex === idx) || (selectedPdfPartIndex === null && currentPartInfo?.index === idx);
                    return (
                      <button
                        key={pdf.id}
                        onClick={() => setSelectedPdfPartIndex(idx)}
                        style={{
                          padding: '4px 10px',
                          borderRadius: '4px',
                          border: 'none',
                          background: isActive ? '#f59e0b' : '#1e293b',
                          color: isActive ? '#0f172a' : '#f8fafc',
                          fontSize: '0.75rem',
                          fontWeight: isActive ? 700 : 500,
                          cursor: 'pointer'
                        }}
                      >
                        Part {pdf.order + 1}: {pdf.originalName} ({pdf.pageCount} pgs)
                      </button>
                    );
                  })}
                </div>
              )}
              {activePdfPartUrl ? (
                <iframe
                  src={getImageUrl(activePdfPartUrl)}
                  style={{ width: '100%', flex: 1, border: 'none' }}
                  title={`${title} - PDF Viewer`}
                />
              ) : (
                <div style={{ color: '#94a3b8', fontSize: '1rem', padding: '20px' }}>No PDF file selected.</div>
              )}
            </div>
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
                sources={pdfSources}
                width={isSinglePage ? 460 : 540}
                height={isSinglePage ? 660 : 740}
                renderScale={1.8}
                showControls={false}
                initialPage={initialPage}
                onPageChange={(page) => {
                  setCurrentPage(page);
                  setJumpInput(page.toString());
                  if (onPageChange) onPageChange(page);
                }}
                onTotalPagesLoaded={(tot) => setTotalPages(tot)}
              />
            </div>
          )}
        </div>
      </div>

      {/* DEDICATED BOTTOM CONTROL DOCK (Structured Flex Footer - Zero Overlap) */}
      <div className="reader-bottom-dock">
        {/* Left Action Buttons */}
        <div className="reader-dock-group">
          <button onClick={onClose} className="reader-dock-btn">
            <span>←</span> <span className="reader-btn-label">Back</span>
          </button>

          <button
            onClick={() => setIsTocOpen(!isTocOpen)}
            className={`reader-dock-btn ${isTocOpen ? 'reader-dock-btn-active' : ''}`}
          >
            <span>📖</span> <span className="reader-btn-label">TOC</span>
          </button>

          <button
            onClick={() => setViewMode(v => v === 'flipbook' ? 'pdf' : 'flipbook')}
            className={`reader-dock-btn ${viewMode === 'pdf' ? 'reader-dock-btn-active' : 'reader-dock-btn-primary'}`}
          >
            <span>{viewMode === 'pdf' ? '📖' : '📄'}</span>
            <span className="reader-btn-label">{viewMode === 'pdf' ? '3D Reader' : 'Full PDF'}</span>
          </button>
        </div>

        {/* Center Page Navigation Pod */}
        {viewMode === 'flipbook' && (
          <div className="reader-nav-pod">
            <button
              onClick={() => pdfBookRef.current?.jumpToPage(1)}
              className="reader-nav-btn"
              title="First Page"
            >
              «« <span className="reader-btn-label">First</span>
            </button>

            <button
              onClick={() => pdfBookRef.current?.flipPrev()}
              className="reader-nav-btn"
              title="Previous Page"
            >
              « <span className="reader-btn-label">Prev</span>
            </button>

            {/* Page Jump Form */}
            <form onSubmit={handleJumpSubmit} className="reader-page-form">
              <input
                type="number"
                min={1}
                max={totalPages}
                value={jumpInput}
                onChange={(e) => setJumpInput(e.target.value)}
                className="reader-page-input"
              />
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#94a3b8', margin: '0 2px' }}>
                / {totalPages}
              </span>
              <button type="submit" className="reader-nav-btn" style={{ padding: '3px 8px', fontSize: '11px', background: '#475569' }}>
                Go
              </button>
            </form>

            <button
              onClick={() => pdfBookRef.current?.flipNext()}
              className="reader-nav-btn"
              title="Next Page"
            >
              <span className="reader-btn-label">Next</span> »
            </button>

            <button
              onClick={() => pdfBookRef.current?.jumpToPage(totalPages)}
              className="reader-nav-btn"
              title="Last Page"
            >
              <span className="reader-btn-label">Last</span> »»
            </button>
          </div>
        )}

        {/* Right Zoom & Bookmark Group */}
        <div className="reader-dock-group">
          {viewMode === 'flipbook' && (
            <div className="reader-zoom-pod">
              <button
                onClick={() => setZoomLevel(z => Math.max(0.6, z - 0.15))}
                className="reader-zoom-btn"
                title="Zoom Out"
              >
                -
              </button>

              <span
                onClick={() => setZoomLevel(1)}
                className="reader-zoom-badge"
                title="Click to reset zoom"
              >
                {Math.round(zoomLevel * 100)}%
              </span>

              <button
                onClick={() => setZoomLevel(z => Math.min(2, z + 0.15))}
                className="reader-zoom-btn"
                title="Zoom In"
              >
                +
              </button>
            </div>
          )}

          <button
            onClick={() => onToggleBookmark?.(currentPage)}
            className={`reader-dock-btn ${bookmarks.includes(currentPage) ? 'reader-dock-btn-active' : ''}`}
          >
            <span>{bookmarks.includes(currentPage) ? '★' : '☆'}</span>
            <span className="reader-btn-label">{bookmarks.includes(currentPage) ? 'Bookmarked' : 'Bookmark'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

