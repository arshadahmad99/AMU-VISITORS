import React, { useState } from 'react';
import authorImg from '../assets/author-shabahat-husain.png';

export const AuthorBioSection: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <section
      id="author-biography"
      style={{
        width: '100%',
        marginTop: '48px',
        backgroundColor: '#fcfbf9',
        borderRadius: '12px',
        border: '1px solid #e6dbcb',
        boxShadow: '0 8px 30px rgba(0, 0, 0, 0.05)',
        overflow: 'hidden',
        position: 'relative'
      }}
    >
      {/* Top Banner Accent */}
      <div
        style={{
          height: '6px',
          background: 'linear-gradient(90deg, #3b0f1b 0%, #b8860b 50%, #3b0f1b 100%)'
        }}
      />

      <div style={{ padding: '40px 48px' }}>
        {/* Section Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 700, letterSpacing: '1.5px', color: '#b8860b', textTransform: 'uppercase' }}>
            AUTHOR BIOGRAPHY
          </span>
          <div style={{ flex: 1, height: '1px', background: 'rgba(184, 134, 11, 0.25)' }} />
        </div>

        {/* Author Main Layout */}
        <div style={{ display: 'flex', gap: '36px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
          {/* Left Column: Portrait & Highlights */}
          <div style={{ flex: '0 0 260px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
            <div
              style={{
                width: '220px',
                height: '260px',
                borderRadius: '8px',
                overflow: 'hidden',
                boxShadow: '0 12px 28px rgba(0, 0, 0, 0.18), 0 0 0 4px #ffffff, 0 0 0 6px #b8860b',
                marginBottom: '18px',
                backgroundColor: '#0f172a'
              }}
            >
              <img
                src={authorImg}
                alt="Prof. (Dr.) Shabahat Husain"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  objectPosition: 'top center',
                  display: 'block'
                }}
              />
            </div>

            <h3
              style={{
                fontFamily: '"Playfair Display", "Georgia", serif',
                fontSize: '1.4rem',
                fontWeight: 700,
                color: '#2e1219',
                margin: '0 0 4px 0'
              }}
            >
              Prof. (Dr.) Shabahat Husain
            </h3>
            <span style={{ fontSize: '0.82rem', color: '#64748b', fontStyle: 'italic', marginBottom: '14px', fontFamily: 'var(--font-calibre)' }}>
              M.Sc., M.L.I.S (Alig) M.Phil (England) Ph.D. (Lucknow)
            </span>

            {/* Badges */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%', fontFamily: 'var(--font-calibre)' }}>
              <div
                style={{
                  background: 'rgba(59, 15, 27, 0.06)',
                  border: '1px solid rgba(59, 15, 27, 0.12)',
                  borderRadius: '6px',
                  padding: '6px 10px',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  color: '#3b0f1b',
                  fontFamily: 'var(--font-calibre)'
                }}
              >
                🏛 Former Dean & University Librarian, AMU
              </div>
              <div
                style={{
                  background: 'rgba(184, 134, 11, 0.08)',
                  border: '1px solid rgba(184, 134, 11, 0.25)',
                  borderRadius: '6px',
                  padding: '6px 10px',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  color: '#855800',
                  fontFamily: 'var(--font-calibre)'
                }}
              >
                🏆 3x Lifetime Achievement Awardee
              </div>
              <div
                style={{
                  background: 'rgba(16, 185, 129, 0.08)',
                  border: '1px solid rgba(16, 185, 129, 0.25)',
                  borderRadius: '6px',
                  padding: '6px 10px',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  color: '#047857',
                  fontFamily: 'var(--font-calibre)'
                }}
              >
                🌐 Founder, World's 1st Social Science Cybrary
              </div>
            </div>
          </div>

          {/* Right Column: Narrative Biography */}
          <div style={{ flex: '1 1 500px', display: 'flex', flexDirection: 'column', fontFamily: 'var(--font-calibre)' }}>
            <h2
              style={{
                fontFamily: '"Playfair Display", "Georgia", serif',
                fontSize: '2rem',
                fontWeight: 600,
                color: '#1a0e05',
                margin: '0 0 16px 0',
                lineHeight: 1.25
              }}
            >
              About the Author
            </h2>

            <div
              style={{
                fontFamily: 'var(--font-calibre)',
                fontSize: '0.98rem',
                color: '#334155',
                lineHeight: 1.75,
                display: 'flex',
                flexDirection: 'column',
                gap: '14px'
              }}
            >
              <p style={{ margin: 0, fontFamily: 'var(--font-calibre)' }}>
                <strong>Prof. Shabahat Husain</strong> is a distinguished scholar of Library and Information Science, with over four decades of service at Aligarh Muslim University (AMU). He earned his M.Sc. and M.Lib.Sc. with first‑class distinction, followed by an M.Phil. in Information Technology from Loughborough University, England, as a Commonwealth Fellow, and a Ph.D. from Lucknow University.
              </p>

              <p style={{ margin: 0, fontFamily: 'var(--font-calibre)' }}>
                At AMU, he served as Chairman of the Department for 12 years, University Librarian for 4 years, and Dean of the Faculty of Social Sciences for one full term. He also held key administrative positions, including Acting Vice‑Chancellor, Provost, and Officer on Special Duty.
              </p>

              <p style={{ margin: 0, fontFamily: 'var(--font-calibre)' }}>
                Beyond AMU, Prof. Husain was entrusted with several prestigious national responsibilities, including membership of the Search Committee for Director, INFLIBNET (UGC), UGC Expert Committees for Accreditation, and as Government of India nominee on the governing bodies of the Khuda Baksh Oriental Public Library, Patna, the Allahabad Museum, and the Raja Ram Mohan Roy Library Foundation, Kolkata. He also served as MHRD nominee on the University Court of Allahabad University and as Governor’s nominee on selection committees of several state universities.
              </p>

              {/* Collapsible / Expandable Details for cleaner mobile & desktop presentation */}
              {isExpanded && (
                <>
                  <p style={{ margin: 0, fontFamily: 'var(--font-calibre)' }}>
                    Internationally, he represented India by presenting papers and chairing sessions at conferences in Canada, Spain, Sweden, Germany, Singapore, and India, and taught at the University of Maiduguri, Nigeria. He has organised numerous national and international conferences in India.
                  </p>

                  <p style={{ margin: 0, fontFamily: 'var(--font-calibre)' }}>
                    A prolific author, Prof. Husain has published eight books and over fifty research articles. His notable works include <em>Library Classification</em> (Tata McGraw Hill), <em>Dewey Decimal Classification</em> (translated into Arabic at Al‑Azhar University, Cairo), and two recent volumes on <em>Knowledge Management Systems</em> (Emerald, 2021; Routledge, 2025). He has supervised 12 M.Phil./Ph.D. scholars and is the Founding Editor of the <em>Collnet Journal of Information Management and Scientometrics</em> (Taylor & Francis, UK).
                  </p>

                  <p style={{ margin: 0, fontFamily: 'var(--font-calibre)' }}>
                    Under his leadership, the Department was awarded the UGC Special Assistance Programme (SAP‑DRS I). He was elected unopposed as President of the Indian Library Association (2016–19).
                  </p>

                  <p style={{ margin: 0, fontFamily: 'var(--font-calibre)' }}>
                    Prof. Husain’s pioneering projects include the <strong>Social Science Cyber Library</strong> — the first in the world, inaugurated by H.E. Pranab Mukherjee, the President of India, in 2013, ISO‑certified, and listed in the <strong>LIMCA Book of Records</strong>. The Cybrary is currently accessed in 179 countries. He also developed the Knowledge Management System Portal (<a href="http://www.libraryknowledgemanagement.org" target="_blank" rel="noreferrer" style={{ color: '#b8860b', textDecoration: 'underline' }}>www.libraryknowledgemanagement.org</a>) and the Indian Library Association website (<a href="http://www.ilaindia.net" target="_blank" rel="noreferrer" style={{ color: '#b8860b', textDecoration: 'underline' }}>www.ilaindia.net</a>).
                  </p>

                  <p style={{ margin: 0, fontFamily: 'var(--font-calibre)' }}>
                    His contributions have been recognised with numerous honours, including the <strong>Prof. S.P. Narang Research Promotion Award</strong> (2014) and <strong>three Lifetime Achievement Awards</strong> from the Satija Research Foundation (2017), the Asian Library Association (2020), and the Indian Library Association (2023).
                  </p>
                </>
              )}
            </div>

            <button
              onClick={() => setIsExpanded(!isExpanded)}
              style={{
                marginTop: '18px',
                alignSelf: 'flex-start',
                background: 'none',
                border: '1px solid #b8860b',
                color: '#b8860b',
                padding: '8px 18px',
                borderRadius: '20px',
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.2s ease',
                fontFamily: 'var(--font-calibre)'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = '#b8860b';
                e.currentTarget.style.color = '#ffffff';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = '#b8860b';
              }}
            >
              {isExpanded ? 'Show Less ▲' : 'Read Full Biography ▼'}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
