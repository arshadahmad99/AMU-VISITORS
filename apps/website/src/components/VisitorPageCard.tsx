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

export const getImageUrl = (url?: string | null) => {
  if (!url) return '';
  if (url.startsWith('data:') || url.startsWith('blob:')) return url;
  if (url.includes('token=')) return url;
  const token = getAuthToken();
  return (token && token !== 'null' && token !== 'undefined')
    ? `${url}${url.includes('?') ? '&' : '?'}token=${token}`
    : url;
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
    return visitor.aboutVisitor.trim();
  }
  if (visitor.notes && visitor.notes.trim().length > 0) {
    return visitor.notes.trim();
  }
  const name = visitor.visitorName || 'Distinguished Guest';
  const role = visitor.designation || visitor.department || '';
  const country = visitor.country ? ` hailing from ${visitor.country}` : '';
  const dateStr = formatVisitDate(visitor.visitDate);
  const library = getLibraryName(visitor.visitDate, visitor.year);
  return `Official archival record of ${name}${role ? `, ${role}` : ''}${country}, recorded in the ${library} Visitors' Book on ${dateStr}. Preserved as part of the historical university archives documenting eminent visitors.`;
};

export const DisclaimerFooter = () => (
  <div style={{
    marginTop: 'auto',
    paddingTop: '8px',
    fontFamily: '"Georgia", "Times New Roman", serif',
    color: '#2e2014',
    boxSizing: 'border-box',
    userSelect: 'none',
    flexShrink: 0
  }}>
    <div style={{
      fontSize: '10.5px',
      lineHeight: '1.4',
      textAlign: 'center',
      color: '#2e2014'
    }}>
      <strong style={{ fontWeight: 700 }}>Disclaimer:</strong> This entry forms part of a non-commercial historical research project.
    </div>
    <div style={{
      textAlign: 'center',
      fontSize: '10.5px',
      lineHeight: '1.4',
      marginTop: '3px',
      color: '#2e2014'
    }}>
      For inquiries, contact: <a href="mailto:husains.shabahat@gmail.com" style={{ color: 'inherit', textDecoration: 'none', fontWeight: 500 }}>husains.shabahat@gmail.com</a>
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
    <div style={{
      height: '100%',
      width: '100%',
      flex: 1,
      minHeight: 0,
      display: 'flex',
      flexDirection: 'column',
      boxSizing: 'border-box',
      backgroundColor: '#f6efe3',
      color: '#2e2014',
      fontFamily: '"Georgia", "Times New Roman", serif'
    }}>
      {/* Double Border Frame - Encloses all sides of the page */}
      <div style={{
        border: '2px solid #2e2014',
        padding: '3px',
        boxSizing: 'border-box',
        flex: 1,
        minHeight: 0,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#f6efe3'
      }}>
        <div style={{
          border: '1px solid #2e2014',
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
          <div style={{
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
            <span style={{
              fontSize: '15px',
              fontWeight: 700,
              color: '#2e1c0d',
              letterSpacing: '1.6px',
              textTransform: 'uppercase',
              textAlign: 'center',
              fontFamily: '"Cinzel", "Playfair Display", "Georgia", serif',
              textShadow: '0 1px 0 rgba(255, 255, 255, 0.6)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}>
              {libraryName}
            </span>
          </div>

          {/* TOP SECTION: Form Rows (Left) & Oval Portrait (Top-Right Corner) */}
          <div style={{
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
            <div style={{
              flex: 1,
              minWidth: 0,
              display: 'flex',
              flexDirection: 'column',
              gap: '8px'
            }}>
              {/* Row 1: Visitors Name */}
              <div style={{ display: 'flex', alignItems: 'baseline', width: '100%', lineHeight: 1.3 }}>
                <span style={{ fontSize: '13px', fontWeight: 600, color: '#2e2014', whiteSpace: 'nowrap', paddingRight: '5px', flexShrink: 0 }}>
                  Visitors Name :
                </span>
                <span style={{
                  flex: 1,
                  fontStyle: 'italic',
                  fontWeight: 700,
                  fontSize: '13px',
                  lineHeight: '1.3',
                  color: '#1a0e05',
                  paddingLeft: '3px',
                  borderBottom: '1.5px solid #2e2014',
                  textDecoration: 'underline',
                  textDecorationColor: '#2e2014',
                  textUnderlineOffset: '3px',
                  textDecorationThickness: '1.5px',
                  whiteSpace: 'normal',
                  wordBreak: 'break-word'
                }}>
                  {visitor.visitorName || '—'}
                </span>
              </div>

              {/* Row 2: Date of Visit */}
              <div style={{ display: 'flex', alignItems: 'baseline', width: '100%', lineHeight: 1.3 }}>
                <span style={{ fontSize: '13px', fontWeight: 600, color: '#2e2014', whiteSpace: 'nowrap', paddingRight: '5px', flexShrink: 0 }}>
                  Date of Visit :
                </span>
                <span style={{
                  flex: 1,
                  fontStyle: 'italic',
                  fontWeight: 700,
                  fontSize: '13px',
                  lineHeight: '1.3',
                  color: '#1a0e05',
                  paddingLeft: '3px',
                  borderBottom: '1.5px solid #2e2014',
                  textDecoration: 'underline',
                  textDecorationColor: '#2e2014',
                  textUnderlineOffset: '3px',
                  textDecorationThickness: '1.5px',
                  whiteSpace: 'normal',
                  wordBreak: 'break-word'
                }}>
                  {formatVisitDate(visitor.visitDate)}
                </span>
              </div>

              {/* Row 3: Native Country */}
              <div style={{ display: 'flex', alignItems: 'baseline', width: '100%', lineHeight: 1.3 }}>
                <span style={{ fontSize: '13px', fontWeight: 600, color: '#2e2014', whiteSpace: 'nowrap', paddingRight: '5px', flexShrink: 0 }}>
                  Native Country :
                </span>
                <span style={{
                  flex: 1,
                  fontStyle: 'italic',
                  fontWeight: 700,
                  fontSize: '13px',
                  lineHeight: '1.3',
                  color: '#1a0e05',
                  paddingLeft: '3px',
                  borderBottom: '1.5px solid #2e2014',
                  textDecoration: 'underline',
                  textDecorationColor: '#2e2014',
                  textUnderlineOffset: '3px',
                  textDecorationThickness: '1.5px',
                  whiteSpace: 'normal',
                  wordBreak: 'break-word'
                }}>
                  {visitor.country || '—'}
                </span>
              </div>

              {/* Row 4: Title/Position */}
              <div style={{ display: 'flex', alignItems: 'baseline', width: '100%', lineHeight: 1.3 }}>
                <span style={{ fontSize: '13px', fontWeight: 600, color: '#2e2014', whiteSpace: 'nowrap', paddingRight: '5px', flexShrink: 0 }}>
                  Title/Position :
                </span>
                <span style={{
                  flex: 1,
                  fontStyle: 'italic',
                  fontWeight: 700,
                  fontSize: '13px',
                  lineHeight: '1.3',
                  color: '#1a0e05',
                  paddingLeft: '3px',
                  borderBottom: '1.5px solid #2e2014',
                  textDecoration: 'underline',
                  textDecorationColor: '#2e2014',
                  textUnderlineOffset: '3px',
                  textDecorationThickness: '1.5px',
                  whiteSpace: 'normal',
                  wordBreak: 'break-word'
                }}>
                  {visitor.designation || visitor.department || '—'}
                </span>
              </div>
            </div>

            {/* Right: Oval Portrait in Top-Right Corner */}
            <div style={{
              flex: '0 0 110px',
              width: '110px',
              maxWidth: '110px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'flex-start',
              paddingTop: '0px',
              flexShrink: 0
            }}>
              <div style={{
                width: '110px',
                aspectRatio: '0.86 / 1',
                border: '2px solid #2e2014',
                borderRadius: '50%',
                padding: '3px',
                boxSizing: 'border-box',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#f6efe3',
                boxShadow: '0 2px 8px rgba(46, 32, 20, 0.12)'
              }}>
                <div style={{
                  width: '100%',
                  height: '100%',
                  border: '1px solid #2e2014',
                  borderRadius: '50%',
                  overflow: 'hidden',
                  position: 'relative',
                  backgroundColor: '#ede3d1',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <img
                    src={portraitSrc}
                    alt={visitor.visitorName}
                    loading="lazy"
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: isSignature ? 'contain' : 'cover',
                      filter: isSignature ? 'contrast(1.2)' : 'sepia(10%) contrast(1.04)',
                      mixBlendMode: isSignature ? 'multiply' : 'normal'
                    }}
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = DEFAULT_SILHOUETTE;
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* MIDDLE SECTION: About the Visitor (FULL WIDTH OF THE PAGE!) */}
          <div style={{
            flex: 1,
            minHeight: 0,
            display: 'flex',
            flexDirection: 'column',
            width: '100%',
            marginBottom: '10px'
          }}>
            <div style={{
              fontSize: '15px',
              fontWeight: 600,
              color: '#2e2014',
              marginBottom: '6px',
              flexShrink: 0
            }}>
              About the Visitor :
            </div>

            {/* Biographical Box - FULL WIDTH, EXPANDS TO FILL REMAINING SPACE */}
            <div style={{
              border: '1.5px solid #2e2014',
              padding: '12px 14px',
              boxSizing: 'border-box',
              flex: 1,
              minHeight: '120px',
              width: '100%',
              overflowY: 'auto',
              backgroundColor: 'rgba(255, 255, 255, 0.25)'
            }}>
              <p style={{
                margin: 0,
                fontSize: '13px',
                lineHeight: '1.5',
                color: '#1a0e05',
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
