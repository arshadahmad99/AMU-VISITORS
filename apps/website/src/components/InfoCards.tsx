import React, { useState } from 'react';
import authorImg from '../assets/author-portrait.png';
import forewordImg from '../assets/foreword-by.png';

export const InfoCards: React.FC = () => {
  const [isExpandedBook, setIsExpandedBook] = useState(false);
  const [isExpandedBib, setIsExpandedBib] = useState(false);

  return (
    <div style={{ width: '100%', marginTop: '36px' }}>
      {/* Centered Heading: FOREWORD BY */}
      <div style={{
        width: '100%',
        textAlign: 'center',
        marginBottom: '24px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <h2 style={{
          fontFamily: '"Playfair Display", "Cinzel", "Georgia", serif',
          fontSize: 'clamp(1.4rem, 4.5vw, 2.1rem)',
          fontWeight: 700,
          color: '#8b1e2d',
          letterSpacing: 'clamp(1px, 0.5vw, 3px)',
          textTransform: 'uppercase',
          margin: 0,
          whiteSpace: 'nowrap'
        }}>
          FOREWORDS BY
        </h2>
        <div style={{
          width: '70px',
          height: '3.5px',
          backgroundColor: '#dfb76c',
          marginTop: '10px',
          borderRadius: '2px'
        }} />
      </div>

      <section style={{
        display: 'flex',
        gap: '24px',
        width: '100%',
        flexWrap: 'wrap'
      }}>
        {/* Left Column: Author Image + Primary Acquisition Card */}
        <div style={{
          flex: '1 1 300px',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px'
        }}>
          {/* Full-width Author Image */}
          <div style={{
            width: '100%',
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            overflow: 'hidden',
            boxShadow: '0 4px 15px rgba(0,0,0,0.06)',
            border: '1px solid #eaeaea',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <div style={{
              width: '100%',
              height: 'clamp(280px, 45vh, 420px)',
              overflow: 'hidden',
              backgroundColor: '#f7f4ed',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <img
                src={authorImg}
                alt="Prof. P.K. Abdul Azis (Foreword By)"
                style={{
                  maxHeight: '100%',
                  maxWidth: '100%',
                  objectFit: 'contain',
                  display: 'block'
                }}
              />
            </div>
            <div style={{
              padding: '14px 20px',
              backgroundColor: '#fcfbf9',
              borderTop: '1px solid #f0e6d6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '8px'
            }}>
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#8b1e2d', letterSpacing: '0.8px', textTransform: 'uppercase' }}></span>
                <h3 style={{ margin: '2px 0 0 0', fontSize: '1.15rem', fontWeight: 600, color: '#1a0e05', fontFamily: '"Playfair Display", "Georgia", serif' }}>
                  Prof. (Dr.)P. K. Abdul Azis.
                </h3>
              </div>
              <span style={{ fontSize: '0.84rem', color: '#7a6855', fontStyle: 'italic', fontFamily: 'Georgia, serif' }}>
                Former Vice Chancellor, AMU
              </span>
            </div>
          </div>

          {/* Primary Acquisition Card */}
          <div className="glass-card" style={{
            flex: 1,
            padding: 'clamp(20px, 4vw, 32px)',
            borderTop: '6px solid #3b0f1b',
            backgroundColor: '#fcfbf9',
            borderRadius: '8px',
            boxShadow: '0 4px 15px rgba(0,0,0,0.05)',
            display: 'flex',
            flexDirection: 'column',
            fontFamily: 'var(--font-calibre)'
          }}>
            {/* <div style={{
              fontSize: '0.8rem',
              fontWeight: 700,
              letterSpacing: '1px',
              color: '#b8860b',
              textTransform: 'uppercase',
              marginBottom: '12px',
              fontFamily: 'var(--font-calibre)'
            }}>
              Primary Acquisition · About the Book
            </div> */}
            <h2 style={{
              fontFamily: '"Playfair Display", "Georgia", serif',
              fontSize: '1.8rem',
              fontWeight: 600,
              color: '#1a0e05',
              margin: '0 0 16px 0',
              lineHeight: 1.3
            }}>
              Lytton to Maulana Azad Library (Vision and Mission)
            </h2>
            <div style={{
              fontFamily: 'var(--font-calibre)',
              fontSize: '0.96rem',
              color: '#475569',
              lineHeight: 1.7,
              display: 'flex',
              flexDirection: 'column',
              gap: '14px'
            }}>
              <p style={{ margin: 0, fontFamily: 'var(--font-calibre)' }}>
                The famous proverb <em>“Rome was not built in a day”</em> aptly applies to the making of great institutions, which evolve through the vision, dedication, and sacrifices of extraordinary individuals. Yet, history often consigns such contributors to obscurity, leaving later generations to admire the grandeur of the institution without recognizing the human effort behind it.
              </p>
              {isExpandedBook && (
                <>
                  <p style={{ margin: 0, fontFamily: 'var(--font-calibre)' }}>
                    The saga of the Maulana Azad Library is one such story. While the library stands today as an iconic symbol of knowledge and scholarship, its journey to this stature was shaped by unsung heroes, including architects, librarians, administrators, artists, and visionaries — whose foresight and commitment ensured that the institution was not only functional but also inspiring. Their contributions, though totally forgotten, remain embedded in the very fabric of the library.
                  </p>
                  <p style={{ margin: 0, fontFamily: 'var(--font-calibre)' }}>
                    This book is a rare combination of historical narrative and biographical tribute, weaving together the library’s past with the stories of those overlooked figures whose mission and vision brought it to its present form. By documenting their legacies, it seeks to restore their rightful place in memory and highlight the enduring truth that institutions are built not merely of stone and mortar, but of human devotion and intellectual labor.
                  </p>
                </>
              )}
            </div>

            <button
              onClick={() => setIsExpandedBook(!isExpandedBook)}
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
              {isExpandedBook ? 'Show Less ▲' : 'Read More ▼'}
            </button>
          </div>
        </div>

        {/* Right Column: Foreword Image + Included Free Card */}
        <div style={{
          flex: '1 1 300px',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px'
        }}>
          {/* Full-width Foreword Image */}
          <div style={{
            width: '100%',
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            overflow: 'hidden',
            boxShadow: '0 4px 15px rgba(0,0,0,0.06)',
            border: '1px solid #eaeaea',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <div style={{
              width: '100%',
              height: 'clamp(280px, 45vh, 420px)',
              overflow: 'hidden',
              backgroundColor: '#f7f4ed',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <img
                src={forewordImg}
                alt="Lt. Gen. Zameer Uddin Shah (Foreword By)"
                style={{
                  maxHeight: '100%',
                  maxWidth: '100%',
                  objectFit: 'contain',
                  display: 'block'
                }}
              />
            </div>
            <div style={{
              padding: '14px 20px',
              backgroundColor: '#fcfbf9',
              borderTop: '1px solid #f0e6d6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '8px'
            }}>
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#8b1e2d', letterSpacing: '0.8px', textTransform: 'uppercase' }}></span>
                <h3 style={{ margin: '2px 0 0 0', fontSize: '1.15rem', fontWeight: 600, color: '#1a0e05', fontFamily: '"Playfair Display", "Georgia", serif' }}>
                  Lt. Gen. Zamiruddin Shah (Veteran)
                </h3>
              </div>
              <span style={{ fontSize: '0.84rem', color: '#7a6855', fontStyle: 'italic', fontFamily: 'Georgia, serif' }}>
                Former Vice-Chancellor, AMU
              </span>
            </div>
          </div>

          {/* Included Free Card */}
          <div className="glass-card" style={{
            flex: 1,
            padding: 'clamp(20px, 4vw, 32px)',
            backgroundColor: '#ffffff',
            borderRadius: '8px',
            boxShadow: '0 4px 15px rgba(0,0,0,0.05)',
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            fontFamily: 'var(--font-calibre)'
          }}>
            {/* Star Badge top right */}
            <div style={{
              position: 'absolute',
              top: '-25px',
              right: '-25px',
              width: '80px',
              height: '80px',
              background: '#fdf8f0',
              transform: 'rotate(45deg)',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'flex-end',
              paddingBottom: '12px'
            }}>
              <div style={{
                width: '20px',
                height: '20px',
                borderRadius: '50%',
                background: '#b8860b',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                transform: 'rotate(-45deg)'
              }}>
                <span style={{ color: '#fff', fontSize: '12px' }}>★</span>
              </div>
            </div>

            {/* <div style={{
              fontSize: '0.8rem',
              fontWeight: 700,
              letterSpacing: '1px',
              color: '#3e2a14',
              backgroundColor: '#fcdb8b',
              display: 'inline-block',
              padding: '4px 12px',
              borderRadius: '4px',
              textTransform: 'uppercase',
              marginBottom: '16px',
              alignSelf: 'flex-start',
              fontFamily: 'var(--font-calibre)'
            }}>
              Included Free · Visitors' Book
            </div> */}
            <h2 style={{
              fontFamily: '"Playfair Display", "Georgia", serif',
              fontSize: '1.8rem',
              fontWeight: 600,
              color: '#1a0e05',
              margin: '0 0 16px 0',
              lineHeight: 1.3
            }}>
              About the Visual Bibliography
            </h2>
            <div style={{
              fontFamily: 'var(--font-calibre)',
              fontSize: '0.96rem',
              color: '#475569',
              lineHeight: 1.7,
              display: 'flex',
              flexDirection: 'column',
              gap: '14px'
            }}>
              <p style={{ margin: 0, fontFamily: 'var(--font-calibre)' }}>
                The prestige of an institution is often reflected in the distinguished personalities who visit and honour it. From the days of MAO College to the present Aligarh Muslim University, eminent figures, including kings, nobles, governor generals, statesmen, artists, and scholars have graced the institution. Sir Syed Ahmad Khan himself established this tradition, inviting and commemorating celebrated guests, and even naming buildings after luminaries such as Lord Lytton, Sir Strachey, Siddons, Theodore Beck, and Queen Victoria, thereby embedding their presence into the very fabric of the campus.
              </p>
              {isExpandedBib && (
                <>
                  <p style={{ margin: 0, fontFamily: 'var(--font-calibre)' }}>
                    The Visual Bibliography of Celebrated Visitors is a novel effort to document this legacy. It presents the life history of nationally and internationally renowned personalities whose visits added glory to the institution. The antique Visitors’ Book itself is a priceless artifact, equal in historical value to rare manuscripts, embodying both heritage and continuity.
                  </p>
                  <p style={{ margin: 0, fontFamily: 'var(--font-calibre)' }}>
                    This compilation is more than a record; it is a living testimony to the esteem in which the institution has been held across generations, reminding the AMU community of the illustrious company that has shaped its identity and enriched its legacy.
                  </p>
                </>
              )}
            </div>

            <button
              onClick={() => setIsExpandedBib(!isExpandedBib)}
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
              {isExpandedBib ? 'Show Less ▲' : 'Read More ▼'}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
