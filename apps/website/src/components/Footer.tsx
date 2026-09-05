import React, { useState } from 'react';

type ModalType = 'terms' | 'privacy' | 'ethics' | 'contact' | null;

export const Footer: React.FC = () => {
  const [activeModal, setActiveModal] = useState<ModalType>(null);

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id) || document.querySelector(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <footer
      style={{
        width: '100%',
        backgroundColor: '#040b16', // Dark navy background
        borderTop: '1px solid rgba(212, 175, 55, 0.25)',
        color: '#e2e8f0',
        padding: '60px 48px 30px',
        marginTop: 'auto',
        position: 'relative',
        boxSizing: 'border-box',
      }}
    >
      <div
        style={{
          maxWidth: '1400px',
          margin: '0 auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '48px',
        }}
      >
        {/* TOP BRANDING & INTRO SECTION */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: '32px',
            paddingBottom: '36px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          {/* Brand Info */}
          <div style={{ maxWidth: '520px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <svg
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#dfb76c"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                <path d="M8 2v10l3-3 3 3V2" />
              </svg>
              <h2
                style={{
                  color: '#fdfcf0',
                  fontFamily: 'var(--font-heading)',
                  fontSize: '1.8rem',
                  margin: 0,
                  fontWeight: 600,
                  letterSpacing: '1.5px',
                }}
              >
                AMUMALibrary
              </h2>
            </div>

            <p
              style={{
                color: '#c5a880',
                fontFamily: 'var(--font-heading)',
                fontStyle: 'italic',
                fontSize: '1rem',
                margin: 0,
              }}
            >
              Maulana Azad Library • Aligarh Muslim University
            </p>

            <p
              style={{
                color: '#94a3b8',
                fontFamily: 'var(--font-body)',
                fontSize: '0.92rem',
                lineHeight: 1.65,
                margin: 0,
              }}
            >
              A digital heritage repository dedicated to preserving over a century of institutional history, rare historic manuscripts, and the 102-year-old visitors’ register (1906–2008) digitised page-by-page.
            </p>

            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                marginTop: '4px',
                fontSize: '0.82rem',
                color: '#dfb76c',
                fontWeight: 500,
              }}
            >
              <span>Founded & Authored by Prof. (Dr.) Shabahat Husain, retd.</span>
            </div>
          </div>

          {/* Quick Action Badge & Nav */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'flex-start' }}>
            <div
              style={{
                background: 'rgba(223, 183, 108, 0.1)',
                border: '1px solid rgba(223, 183, 108, 0.3)',
                padding: '12px 20px',
                borderRadius: '6px',
                color: '#fdfcf0',
                fontSize: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
              }}
            >
              <span style={{ color: '#dfb76c', fontSize: '1rem' }}>✦</span>
              <span>Est. 1920 • Preserving Universal Wisdom</span>
            </div>

            <button
              onClick={() => scrollToSection('.three-col-layout')}
              style={{
                background: '#dfb76c',
                color: '#040b16',
                border: 'none',
                padding: '10px 22px',
                borderRadius: '4px',
                fontWeight: 700,
                fontSize: '0.82rem',
                letterSpacing: '1px',
                textTransform: 'uppercase',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
              onMouseOver={(e) => (e.currentTarget.style.background = '#eed49f')}
              onMouseOut={(e) => (e.currentTarget.style.background = '#dfb76c')}
            >
              Explore Digital Archives ↓
            </button>
          </div>
        </div>

        {/* CONTENT NAVIGATION GRID (4 COLUMNS) */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '40px',
          }}
        >
          {/* Column 1: Digital Collections */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3
              style={{
                color: '#fdfcf0',
                fontSize: '0.95rem',
                fontFamily: 'var(--font-heading)',
                letterSpacing: '1.5px',
                textTransform: 'uppercase',
                margin: 0,
                borderBottom: '2px solid #dfb76c',
                paddingBottom: '8px',
                width: 'max-content',
              }}
            >
              Digital Collections
            </h3>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <li>
                <button
                  onClick={() => scrollToSection('#hero-feature-card')}
                  style={linkButtonStyle}
                  onMouseOver={linkHoverIn}
                  onMouseOut={linkHoverOut}
                >
                  Lytton to Maulana Azad Library
                </button>
              </li>
              <li>
                <button
                  onClick={() => scrollToSection('.three-col-layout')}
                  style={linkButtonStyle}
                  onMouseOver={linkHoverIn}
                  onMouseOut={linkHoverOut}
                >
                  102 Years Visitors Book (1906–2008)
                </button>
              </li>
              <li>
                <button
                  onClick={() => scrollToSection('.three-col-layout')}
                  style={linkButtonStyle}
                  onMouseOver={linkHoverIn}
                  onMouseOut={linkHoverOut}
                >
                  Interactive Manuscript Reader
                </button>
              </li>
              <li>
                <button
                  onClick={() => scrollToSection('.three-col-layout')}
                  style={linkButtonStyle}
                  onMouseOver={linkHoverIn}
                  onMouseOut={linkHoverOut}
                >
                  Live Patron Acquisition Ledger
                </button>
              </li>
              <li>
                <button
                  onClick={() => scrollToSection('.three-col-layout')}
                  style={linkButtonStyle}
                  onMouseOver={linkHoverIn}
                  onMouseOut={linkHoverOut}
                >
                  Visitor Registry Search
                </button>
              </li>
            </ul>
          </div>

          {/* Column 2: University Heritage */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3
              style={{
                color: '#fdfcf0',
                fontSize: '0.95rem',
                fontFamily: 'var(--font-heading)',
                letterSpacing: '1.5px',
                textTransform: 'uppercase',
                margin: 0,
                borderBottom: '2px solid #dfb76c',
                paddingBottom: '8px',
                width: 'max-content',
              }}
            >
              Library Heritage
            </h3>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <li style={infoTextStyle}>Est. 1920 at Aligarh Muslim University</li>
              <li style={infoTextStyle}>Lytton Library Architectural Evolution</li>
              <li style={infoTextStyle}>Persian, Arabic & Urdu Rare Manuscripts</li>
              <li style={infoTextStyle}>Historic Signatures of World Leaders</li>
              <li style={infoTextStyle}>Digital Archival Conservation Program</li>
            </ul>
          </div>

          {/* Column 3: About Author & Research */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3
              style={{
                color: '#fdfcf0',
                fontSize: '0.95rem',
                fontFamily: 'var(--font-heading)',
                letterSpacing: '1.5px',
                textTransform: 'uppercase',
                margin: 0,
                borderBottom: '2px solid #dfb76c',
                paddingBottom: '8px',
                width: 'max-content',
              }}
            >
              Author & Research
            </h3>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <li style={{ ...infoTextStyle, color: '#e2e8f0', fontWeight: 600 }}>Prof. (Dr.) Shabahat Husain, retd.</li>
              <li style={infoTextStyle}>M.Sc., M.L.I.S (Alig), M.Phil (England)</li>
              <li style={infoTextStyle}>PhD (Lucknow)</li>
              <li style={infoTextStyle}>Academic Citation & Archival Standards</li>
              <li>
                <button
                  onClick={() => setActiveModal('ethics')}
                  style={linkButtonStyle}
                  onMouseOver={linkHoverIn}
                  onMouseOut={linkHoverOut}
                >
                  Digital Preservation Ethics
                </button>
              </li>
            </ul>
          </div>

          {/* Column 4: Contact & Access */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3
              style={{
                color: '#fdfcf0',
                fontSize: '0.95rem',
                fontFamily: 'var(--font-heading)',
                letterSpacing: '1.5px',
                textTransform: 'uppercase',
                margin: 0,
                borderBottom: '2px solid #dfb76c',
                paddingBottom: '8px',
                width: 'max-content',
              }}
            >
              Contact & Location
            </h3>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <li style={infoTextStyle}>📍 Maulana Azad Library, AMU</li>
              <li style={infoTextStyle}>Aligarh, Uttar Pradesh - 202002, India</li>
              <li style={infoTextStyle}>✉️ archive@amumalibrary.org</li>
              <li style={infoTextStyle}>📞 +91 (571) 2700920</li>
              <li>
                <button
                  onClick={() => setActiveModal('contact')}
                  style={{
                    ...linkButtonStyle,
                    color: '#dfb76c',
                    fontWeight: 600,
                    textDecoration: 'underline',
                  }}
                >
                  Open Contact & Support Desk →
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* BOTTOM COPYRIGHT & LEGAL LINKS BAR */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '20px',
            paddingTop: '28px',
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
            fontSize: '0.85rem',
            color: '#8c95a3',
          }}
        >
          <div>
            © {new Date().getFullYear()} AMUMALibrary. Maulana Azad Library Digital Heritage Archive. Preservation through Innovation.
          </div>


        </div>
      </div>

      {/* INTERACTIVE FOOTER MODALS */}
      {activeModal && (
        <FooterModal type={activeModal} onClose={() => setActiveModal(null)} />
      )}
    </footer>
  );
};

// Sub-styles for links and text
const linkButtonStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  color: '#94a3b8',
  fontFamily: 'var(--font-body)',
  fontSize: '0.88rem',
  cursor: 'pointer',
  padding: 0,
  textAlign: 'left',
  transition: 'color 0.2s ease',
};

const infoTextStyle: React.CSSProperties = {
  color: '#94a3b8',
  fontFamily: 'var(--font-body)',
  fontSize: '0.88rem',
  lineHeight: 1.4,
};

const linkHoverIn = (e: React.MouseEvent<HTMLButtonElement>) => {
  e.currentTarget.style.color = '#fdfcf0';
};

const linkHoverOut = (e: React.MouseEvent<HTMLButtonElement>) => {
  e.currentTarget.style.color = '#94a3b8';
};

// Modal Component for Terms, Privacy, Ethics, Contact
interface FooterModalProps {
  type: ModalType;
  onClose: () => void;
}

const FooterModal: React.FC<FooterModalProps> = ({ type, onClose }) => {
  if (!type) return null;

  const getModalContent = () => {
    switch (type) {
      case 'terms':
        return {
          title: 'Terms of Service',
          body: (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', color: '#4a4a4a', fontSize: '0.92rem', lineHeight: 1.6 }}>
              <p>
                Welcome to the <strong>Maulana Azad Library Digital Heritage Archive (AMUMALibrary)</strong>. By accessing our digital manuscript reader, visitor registers, or purchasing digital heritage accesses, you agree to these terms:
              </p>
              <h4 style={{ color: '#0b132b', margin: '4px 0 0' }}>1. Digital Content Usage</h4>
              <p>
                All digitised pages, historical signatures, and manuscript images are protected under intellectual property and library archive preservation rights. Content purchased or accessed is licensed strictly for personal reading and academic research.
              </p>
              <h4 style={{ color: '#0b132b', margin: '4px 0 0' }}>2. Patron Access & Accounts</h4>
              <p>
                Purchased accesses grant lifetime digital reading rights within the platform. Re-selling, scraping, or mass redistribution of original archive imagery is strictly prohibited.
              </p>
              <h4 style={{ color: '#0b132b', margin: '4px 0 0' }}>3. Institutional Integrity</h4>
              <p>
                This platform honours the 100+ year legacy of Maulana Azad Library at Aligarh Muslim University (AMU), preserving historic records page by page without modification.
              </p>
            </div>
          ),
        };

      case 'privacy':
        return {
          title: 'Privacy Policy',
          body: (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', color: '#4a4a4a', fontSize: '0.92rem', lineHeight: 1.6 }}>
              <p>
                Your privacy is paramount to the <strong>Maulana Azad Library Archive</strong>. We collect minimal information required to deliver high-quality digital library access:
              </p>
              <h4 style={{ color: '#0b132b', margin: '4px 0 0' }}>1. Data Collection</h4>
              <p>
                We only collect your name and email address upon registration to manage your library purchases, access tokens, and reading preferences.
              </p>
              <h4 style={{ color: '#0b132b', margin: '4px 0 0' }}>2. Financial Security</h4>
              <p>
                All transactions on the Patron Ledger are securely encrypted. Payment records never store sensitive credit card or banking details on our servers.
              </p>
              <h4 style={{ color: '#0b132b', margin: '4px 0 0' }}>3. Non-Disclosure</h4>
              <p>
                We do not sell, trade, or rent personal identification information to third parties.
              </p>
            </div>
          ),
        };

      case 'ethics':
        return {
          title: 'Digital Preservation Ethics',
          body: (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', color: '#4a4a4a', fontSize: '0.92rem', lineHeight: 1.6 }}>
              <p>
                Our digital conservation policy follows international academic archiving guidelines:
              </p>
              <h4 style={{ color: '#0b132b', margin: '4px 0 0' }}>1. Historical Fidelity</h4>
              <p>
                Every visitor entry, historical signature, and manuscript page from 1906 to 2008 is presented verbatim in high resolution without digital alteration or censorship.
              </p>
              <h4 style={{ color: '#0b132b', margin: '4px 0 0' }}>2. Cultural Heritage Preservation</h4>
              <p>
                Our mission is to democratise access to rare AMU library treasures, allowing scholars, alumni, and bibliophiles worldwide to experience India's rich academic history.
              </p>
              <h4 style={{ color: '#0b132b', margin: '4px 0 0' }}>3. Bibliographic Integrity</h4>
              <p>
                Founded under the scholarly guidance of Prof. (Dr.) Shabahat Husain, all metadata and visitor annotations undergo strict editorial verification.
              </p>
            </div>
          ),
        };

      case 'contact':
        return {
          title: 'Contact Maulana Azad Library Archive',
          body: (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', color: '#4a4a4a', fontSize: '0.92rem', lineHeight: 1.6 }}>
              <p style={{ margin: 0 }}>
                Have questions regarding digital book access, archival research, or bulk institutional access? Contact our archive desk:
              </p>
              <div style={{ background: '#f8f6f0', padding: '16px', borderRadius: '6px', border: '1px solid #e6dbcb' }}>
                <p style={{ margin: '0 0 6px 0', fontWeight: 700, color: '#0b132b' }}>📍 Physical Address:</p>
                <p style={{ margin: '0 0 12px 0' }}>Maulana Azad Library, Aligarh Muslim University, Aligarh - 202002, Uttar Pradesh, India</p>

                <p style={{ margin: '0 0 6px 0', fontWeight: 700, color: '#0b132b' }}>✉️ Digital Archive Inquiries:</p>
                <p style={{ margin: '0 0 12px 0' }}>archive@amumalibrary.org / support@amumalibrary.org</p>

                <p style={{ margin: '0 0 6px 0', fontWeight: 700, color: '#0b132b' }}>📞 Office Phone:</p>
                <p style={{ margin: 0 }}>+91 (571) 2700920 (Mon - Sat, 8:00 AM - 8:00 PM IST)</p>
              </div>
            </div>
          ),
        };

      default:
        return { title: '', body: null };
    }
  };

  const content = getModalContent();

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(4, 11, 22, 0.75)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2000,
        padding: '20px',
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '8px',
          maxWidth: '560px',
          width: '100%',
          maxHeight: '85vh',
          overflowY: 'auto',
          boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
          border: '1px solid #dfb76c',
          padding: '32px',
          position: 'relative',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '1px solid #e6e2d8',
            paddingBottom: '16px',
            marginBottom: '20px',
          }}
        >
          <h3
            style={{
              margin: 0,
              fontFamily: 'var(--font-heading)',
              fontSize: '1.4rem',
              color: '#0b132b',
              fontWeight: 600,
            }}
          >
            {content.title}
          </h3>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '1.5rem',
              color: '#8c8c8c',
              cursor: 'pointer',
              lineHeight: 1,
            }}
            onMouseOver={(e) => (e.currentTarget.style.color = '#0b132b')}
            onMouseOut={(e) => (e.currentTarget.style.color = '#8c8c8c')}
          >
            ×
          </button>
        </div>

        {content.body}

        <div style={{ marginTop: '24px', textAlign: 'right' }}>
          <button
            onClick={onClose}
            style={{
              backgroundColor: '#0b132b',
              color: '#ffffff',
              border: 'none',
              padding: '10px 24px',
              borderRadius: '4px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

