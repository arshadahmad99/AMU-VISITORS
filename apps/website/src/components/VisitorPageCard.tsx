import React from 'react';
import { VisitorRecord } from '@digital-library/types';

export const getAuthToken = () => {
  if (typeof window === 'undefined') return '';
  return (
    localStorage.getItem('dl_token') ||
    localStorage.getItem('token') ||
    localStorage.getItem('adminToken') ||
    ''
  );
};

export const normalizeImageUrl = (url?: string | null) => {
  if (!url) return '';
  if (url.startsWith('data:') || url.startsWith('blob:') || url.startsWith('http://') || url.startsWith('https://')) return url;
  let clean = url.trim();
  if (!clean.startsWith('/')) {
    clean = '/' + clean;
  }
  return clean;
};

export const getImageUrl = (url?: string | null) => {
  if (!url) return '';
  const clean = normalizeImageUrl(url);
  if (clean.startsWith('data:') || clean.startsWith('blob:')) return clean;
  if (clean.startsWith('/uploads/')) return clean;
  if (clean.includes('token=')) return clean;
  const token = getAuthToken();
  return (token && token !== 'null' && token !== 'undefined')
    ? `${clean}${clean.includes('?') ? '&' : '?'}token=${token}`
    : clean;
};

export const getLibraryName = (visitDate?: string | null, year?: number | string | null) => {
  let visitYear: number | null = null;
  if (year != null && !isNaN(Number(year)) && Number(year) > 0) {
    visitYear = Number(year);
  }
  if (!visitYear && visitDate) {
    const match = String(visitDate).match(/\b(17\d\d|18\d\d|19\d\d|20\d\d)\b/);
    if (match) {
      visitYear = parseInt(match[1], 10);
    } else {
      const shortMatch = String(visitDate).match(/[-/](\d{2})$/);
      if (shortMatch) {
        const yy = parseInt(shortMatch[1], 10);
        visitYear = yy < 30 ? 2000 + yy : 1900 + yy;
      }
    }
  }
  if (visitYear && visitYear < 1960) {
    return 'Lytton Library';
  }
  return 'Maulana Azad Library';
};

export const formatVisitDate = (dateStr?: string | null): string => {
  if (!dateStr) return '—';
  const trimmed = dateStr.trim();
  if (!trimmed) return '—';

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Match YYYY-MM-DD
  const ymd = trimmed.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (ymd) {
    const year = parseInt(ymd[1], 10);
    const month = parseInt(ymd[2], 10) - 1;
    const day = parseInt(ymd[3], 10);
    if (month >= 0 && month < 12) {
      return `${day} ${months[month]}, ${year}`;
    }
  }

  // Match DD-MM-YYYY
  const dmy = trimmed.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
  if (dmy) {
    const day = parseInt(dmy[1], 10);
    const month = parseInt(dmy[2], 10) - 1;
    const year = parseInt(dmy[3], 10);
    if (month >= 0 && month < 12) {
      return `${day} ${months[month]}, ${year}`;
    }
  }

  // Match DD/MM/YYYY
  const dmySlash = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (dmySlash) {
    const day = parseInt(dmySlash[1], 10);
    const month = parseInt(dmySlash[2], 10) - 1;
    const year = parseInt(dmySlash[3], 10);
    if (month >= 0 && month < 12) {
      return `${day} ${months[month]}, ${year}`;
    }
  }

  return trimmed;
};

export const DEFAULT_SILHOUETTE = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 120 140' fill='%233c2a1a'><rect width='100%25' height='100%25' fill='%23ede3d1'/><ellipse cx='60' cy='52' rx='28' ry='32'/><path d='M20 135 C20 95 38 90 60 90 C82 90 100 95 100 135 Z'/></svg>";

export const getAboutText = (visitor: VisitorRecord) => {
  if (visitor.aboutVisitor && visitor.aboutVisitor.trim().length > 0) {
    const trimmed = visitor.aboutVisitor.trim();
    if (!trimmed.includes('Imported from') && !trimmed.includes('tblMaster')) {
      return trimmed;
    }
  }
  if (visitor.notes && visitor.notes.trim().length > 0) {
    const trimmed = visitor.notes.trim();
    if (!trimmed.includes('Imported from') && !trimmed.includes('tblMaster')) {
      return trimmed;
    }
  }
  return '';
};

export const DisclaimerFooter = () => (
  <div className="visitor-card-disclaimer-footer" style={{
    marginTop: 'auto',
    paddingTop: '8px',
    fontFamily: '"Georgia", "Times New Roman", serif',
    color: '#4e3725',
    boxSizing: 'border-box',
    userSelect: 'none',
    flexShrink: 0
  }}>
    <div className="visitor-card-disclaimer-text" style={{
      fontSize: '10.5px',
      lineHeight: '1.4',
      textAlign: 'center',
      color: '#4e3725'
    }}>
      <strong style={{ fontWeight: 700 }}>Disclaimer:</strong> This entry forms part of a non-commercial historical research project.
    </div>
    <div className="visitor-card-disclaimer-contact" style={{
      textAlign: 'center',
      fontSize: '10.5px',
      lineHeight: '1.4',
      marginTop: '3px',
      color: '#4e3725'
    }}>
      For inquiries, contact: <a href="mailto:husains.shabahat@gmail.com" style={{ color: '#3e2817', textDecoration: 'none', fontWeight: 500 }}>husains.shabahat@gmail.com</a>
    </div>
  </div>
);

export const VisitorPageCard: React.FC<{ visitor: VisitorRecord; pageNumber: number }> = ({ visitor, pageNumber }) => {
  const photoUrl = visitor.visitorImagePath ? getImageUrl(visitor.visitorImagePath) : '';
  const autoUrl = visitor.autographPath ? getImageUrl(visitor.autographPath) : '';
  const portraitSrc = photoUrl || autoUrl || DEFAULT_SILHOUETTE;
  const isSignature = !photoUrl && Boolean(autoUrl);

  const displayPageNo = visitor.pageNumber ?? (visitor.pageIndex != null ? visitor.pageIndex : pageNumber);
  const libraryName = getLibraryName(visitor.visitDate, visitor.year);

  return (
    <div className="visitor-page-card" style={{
      height: '100%',
      width: '100%',
      flex: 1,
      minHeight: 0,
      display: 'flex',
      flexDirection: 'column',
      boxSizing: 'border-box',
      backgroundColor: '#f4eedb',
      backgroundImage: `radial-gradient(ellipse at 50% 50%, rgba(253, 248, 238, 0.95) 0%, rgba(245, 238, 222, 0.92) 58%, rgba(232, 220, 196, 0.88) 100%), url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix type='matrix' values='0 0 0 0 0.38 0 0 0 0 0.28 0 0 0 0 0.18 0 0 0 0.045 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
      color: '#3e2817',
      fontFamily: '"Georgia", "Times New Roman", serif',
      boxShadow: '0 4px 18px rgba(60, 42, 22, 0.14), 0 1px 4px rgba(60, 42, 22, 0.08)'
    }}>
      {/* Double Border Frame - Encloses all sides of the page */}
      <div className="visitor-card-outer-frame" style={{
        border: '2px solid #5a422d',
        padding: '3px',
        boxSizing: 'border-box',
        flex: 1,
        minHeight: 0,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'transparent'
      }}>
        <div className="visitor-card-inner-frame" style={{
          border: '1px solid #735439',
          padding: '10px 14px 10px 14px',
          boxSizing: 'border-box',
          flex: 1,
          minHeight: 0,
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          overflow: 'hidden'
        }}>
          {/* Top Header: Library Name (Center) Inside Border */}
          <div className="visitor-card-header" style={{
            position: 'relative',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '26px',
            marginBottom: '10px',
            paddingBottom: '4px',
            paddingLeft: '4px',
            paddingRight: '4px',
            userSelect: 'none',
            flexShrink: 0
          }}>
            {/* Center: Prestigious Archival Library Title */}
            <span className="visitor-card-library-title" style={{
              fontSize: '15px',
              fontWeight: 700,
              color: '#342111',
              letterSpacing: '1.6px',
              textTransform: 'uppercase',
              textAlign: 'center',
              fontFamily: '"Cinzel", "Playfair Display", "Georgia", serif',
              textShadow: '0 1px 1px rgba(255, 250, 240, 0.8)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}>
              {libraryName}
            </span>
          </div>

          {/* TOP SECTION: Form Rows (Left) & Oval Portrait (Top-Right Corner) */}
          <div className="visitor-card-top-section" style={{
            display: 'flex',
            flexDirection: 'row',
            gap: '12px',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            width: '100%',
            flexShrink: 0,
            marginBottom: '10px'
          }}>
            {/* Left: 4 Form Rows */}
            <div className="visitor-card-form-rows" style={{
              flex: 1,
              minWidth: 0,
              display: 'flex',
              flexDirection: 'column',
              gap: '8px'
            }}>
              {/* Row 1: Visitors Name */}
              <div className="visitor-card-form-row" style={{ display: 'flex', alignItems: 'baseline', width: '100%', lineHeight: 1.3 }}>
                <span className="visitor-card-label" style={{ fontSize: '13px', fontWeight: 600, color: '#3e2817', whiteSpace: 'nowrap', paddingRight: '5px', flexShrink: 0 }}>
                  Visitors Name :
                </span>
                <span className="visitor-card-value" style={{
                  flex: 1,
                  fontStyle: 'italic',
                  fontWeight: 700,
                  fontSize: '13px',
                  lineHeight: '1.3',
                  color: '#221307',
                  paddingLeft: '3px',
                  paddingBottom: '2px',
                  borderBottom: '1.5px solid #6b4e34',
                  whiteSpace: 'normal',
                  wordBreak: 'break-word'
                }}>
                  {visitor.visitorName || '—'}
                </span>
              </div>

              {/* Row 2: Date of Visit */}
              <div className="visitor-card-form-row" style={{ display: 'flex', alignItems: 'baseline', width: '100%', lineHeight: 1.3 }}>
                <span className="visitor-card-label" style={{ fontSize: '13px', fontWeight: 600, color: '#3e2817', whiteSpace: 'nowrap', paddingRight: '5px', flexShrink: 0 }}>
                  Date of Visit :
                </span>
                <span className="visitor-card-value" style={{
                  flex: 1,
                  fontStyle: 'italic',
                  fontWeight: 700,
                  fontSize: '13px',
                  lineHeight: '1.3',
                  color: '#221307',
                  paddingLeft: '3px',
                  paddingBottom: '2px',
                  borderBottom: '1.5px solid #6b4e34',
                  whiteSpace: 'normal',
                  wordBreak: 'break-word'
                }}>
                  {formatVisitDate(visitor.visitDate)}
                </span>
              </div>

              {/* Row 3: Native Country */}
              <div className="visitor-card-form-row" style={{ display: 'flex', alignItems: 'baseline', width: '100%', lineHeight: 1.3 }}>
                <span className="visitor-card-label" style={{ fontSize: '13px', fontWeight: 600, color: '#3e2817', whiteSpace: 'nowrap', paddingRight: '5px', flexShrink: 0 }}>
                  Native Country :
                </span>
                <span className="visitor-card-value" style={{
                  flex: 1,
                  fontStyle: 'italic',
                  fontWeight: 700,
                  fontSize: '13px',
                  lineHeight: '1.3',
                  color: '#221307',
                  paddingLeft: '3px',
                  paddingBottom: '2px',
                  borderBottom: '1.5px solid #6b4e34',
                  whiteSpace: 'normal',
                  wordBreak: 'break-word'
                }}>
                  {visitor.country || '—'}
                </span>
              </div>

              {/* Row 4: Title/Position */}
              <div className="visitor-card-form-row" style={{ display: 'flex', alignItems: 'baseline', width: '100%', lineHeight: 1.3 }}>
                <span className="visitor-card-label" style={{ fontSize: '13px', fontWeight: 600, color: '#3e2817', whiteSpace: 'nowrap', paddingRight: '5px', flexShrink: 0 }}>
                  Title/Position :
                </span>
                <span className="visitor-card-value" style={{
                  flex: 1,
                  fontStyle: 'italic',
                  fontWeight: 700,
                  fontSize: '13px',
                  lineHeight: '1.3',
                  color: '#221307',
                  paddingLeft: '3px',
                  paddingBottom: '2px',
                  borderBottom: '1.5px solid #6b4e34',
                  whiteSpace: 'normal',
                  wordBreak: 'break-word'
                }}>
                  {visitor.designation || visitor.department || '—'}
                </span>
              </div>
            </div>

            {/* Right: Oval Portrait in Top-Right Corner */}
            <div className="visitor-card-portrait-col" style={{
              flex: '0 0 148px',
              width: '148px',
              maxWidth: '155px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'flex-start',
              paddingTop: '0px',
              flexShrink: 0
            }}>
              <div className="visitor-card-portrait-frame" style={{
                width: '142px',
                maxWidth: '100%',
                aspectRatio: '0.82 / 1',
                border: '2px solid #543922',
                borderRadius: '50%',
                padding: '3.5px',
                boxSizing: 'border-box',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#f6ecdc',
                boxShadow: '0 3px 10px rgba(50, 32, 16, 0.22)'
              }}>
                <div style={{
                  width: '100%',
                  height: '100%',
                  border: '1.5px solid #543922',
                  borderRadius: '50%',
                  overflow: 'hidden',
                  position: 'relative',
                  backgroundColor: '#ebd9be',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <img
                    src={portraitSrc}
                    alt={
                      isSignature
                        ? `Original signature of ${visitor.visitorName} in AMU Library Visitors' Book`
                        : `${visitor.visitorName}${visitor.designation ? `, ${visitor.designation}` : ''} — AMU Library Visitors' Book portrait`
                    }
                    loading="lazy"
                    decoding="async"
                    style={{
                      width: '100%',
                      height: '100%',
                      borderRadius: '50%',
                      objectFit: isSignature ? 'contain' : 'cover',
                      objectPosition: 'center 15%',
                      filter: isSignature ? 'contrast(1.2)' : 'contrast(1.05) brightness(1.01)',
                      mixBlendMode: isSignature ? 'multiply' : 'normal',
                      display: 'block'
                    }}
                    onError={(e) => {
                      console.warn(`[Visitor Image Missing] File not found for "${visitor.visitorName}". Falling back. Failed URL:`, e.currentTarget.src);
                      e.currentTarget.onerror = null;
                      if (photoUrl && autoUrl && e.currentTarget.src.includes(photoUrl)) {
                        e.currentTarget.src = autoUrl;
                      } else {
                        e.currentTarget.src = DEFAULT_SILHOUETTE;
                      }
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* MIDDLE SECTION: About the Visitor (FULL WIDTH OF THE PAGE!) */}
          <div className="visitor-card-about-section" style={{
            flex: 1,
            minHeight: 0,
            display: 'flex',
            flexDirection: 'column',
            width: '100%',
            marginBottom: '10px'
          }}>
            <div className="visitor-card-about-title" style={{
              fontSize: '15px',
              fontWeight: 600,
              color: '#3e2817',
              marginBottom: '6px',
              flexShrink: 0
            }}>
              About the Visitor :
            </div>

            {/* Biographical Box - FULL WIDTH, EXPANDS TO FILL REMAINING SPACE */}
            <div className="visitor-card-about-box" style={{
              border: '1.5px solid #6b4e34',
              padding: '12px 14px',
              boxSizing: 'border-box',
              flex: 1,
              minHeight: '120px',
              width: '100%',
              overflowY: 'auto',
              backgroundColor: 'rgba(255, 252, 245, 0.45)',
              boxShadow: 'inset 0 1px 4px rgba(60, 42, 22, 0.06)'
            }}>
              <p className="visitor-card-about-text" style={{
                margin: 0,
                fontSize: '13px',
                lineHeight: '1.5',
                color: '#221307',
                textAlign: 'justify'
              }}>
                {getAboutText(visitor)}
              </p>
            </div>
          </div>

          {/* BOTTOM SECTION: Disclaimer on Every Page */}
          <DisclaimerFooter />
        </div>
      </div>
    </div>
  );
};
