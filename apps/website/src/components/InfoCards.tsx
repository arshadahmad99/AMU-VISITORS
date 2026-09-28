import React from 'react';

export const InfoCards: React.FC = () => {
  return (
    <section style={{ 
      display: 'flex', 
      gap: '24px', 
      width: '100%', 
      marginTop: '48px',
      flexWrap: 'wrap' 
    }}>
      {/* Primary Acquisition Card */}
      <div className="glass-card" style={{ 
        flex: '1 1 480px',
        padding: '32px',
        borderTop: '6px solid #3b0f1b',
        backgroundColor: '#fcfbf9',
        borderRadius: '8px',
        boxShadow: '0 4px 15px rgba(0,0,0,0.05)',
        display: 'flex',
        flexDirection: 'column'
      }}>
        <div style={{ 
          fontSize: '0.8rem', 
          fontWeight: 700, 
          letterSpacing: '1px', 
          color: '#b8860b', 
          textTransform: 'uppercase',
          marginBottom: '12px'
        }}>
          Primary Acquisition · About the Book
        </div>
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
          fontFamily: 'var(--font-body)',
          fontSize: '0.95rem',
          color: '#475569',
          lineHeight: 1.7,
          display: 'flex',
          flexDirection: 'column',
          gap: '14px'
        }}>
          <p style={{ margin: 0 }}>
            The famous proverb <em>“Rome was not built in a day”</em> aptly applies to the making of great institutions, which evolve through the vision, dedication, and sacrifices of extraordinary individuals. Yet, history often consigns such contributors to obscurity, leaving later generations to admire the grandeur of the institution without recognizing the human effort behind it.
          </p>
          <p style={{ margin: 0 }}>
            The saga of the Maulana Azad Library is one such story. While the library stands today as an iconic symbol of knowledge and scholarship, its journey to this stature was shaped by unsung heroes, including architects, librarians, administrators, artists, and visionaries — whose foresight and commitment ensured that the institution was not only functional but also inspiring. Their contributions, though totally forgotten, remain embedded in the very fabric of the library.
          </p>
          <p style={{ margin: 0 }}>
            This book is a rare combination of historical narrative and biographical tribute, weaving together the library’s past with the stories of those overlooked figures whose mission and vision brought it to its present form. By documenting their legacies, it seeks to restore their rightful place in memory and highlight the enduring truth that institutions are built not merely of stone and mortar, but of human devotion and intellectual labor.
          </p>
        </div>
      </div>

      {/* Included Free Card */}
      <div className="glass-card" style={{ 
        flex: '1 1 480px',
        padding: '32px',
        backgroundColor: '#ffffff',
        borderRadius: '8px',
        boxShadow: '0 4px 15px rgba(0,0,0,0.05)',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
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

        <div style={{ 
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
          alignSelf: 'flex-start'
        }}>
          Included Free · About the Visual Bibliography
        </div>
        <h2 style={{ 
          fontFamily: '"Playfair Display", "Georgia", serif',
          fontSize: '1.8rem',
          fontWeight: 600,
          color: '#1a0e05',
          margin: '0 0 16px 0',
          lineHeight: 1.3
        }}>
          131 Years Old Visitors Book (1877–2008)
        </h2>
        <div style={{ 
          fontFamily: 'var(--font-body)',
          fontSize: '0.95rem',
          color: '#475569',
          lineHeight: 1.7,
          display: 'flex',
          flexDirection: 'column',
          gap: '14px'
        }}>
          <p style={{ margin: 0 }}>
            The prestige of an institution is often measured by the distinguished personalities who visit and honour it. From the days of MAO College to the present Aligarh Muslim University, eminent figures including kings, nobles, governor generals, statesmen, and scholars, have graced it, leaving their signatures in the official Visitors’ Book. Sir Syed Ahmad Khan himself set this tradition, inviting and commemorating celebrated guests, and even naming buildings after luminaries such as Lord Lytton, Sir Strachey, Siddons, Theodore Beck and Queen Victoria, thereby embedding their presence into the very fabric of the campus.
          </p>
          <p style={{ margin: 0 }}>
            The Visual Bibliography of Celebrated Visitors is a novel effort to document this legacy. Spanning 131 years (1877–2008), it presents the signatures and records of nationally and internationally renowned personalities who added glory to the institution by their presence. The antique Visitors’ Book itself is a priceless artifact, equal in historical value to rare manuscripts, embodying both heritage and continuity.
          </p>
          <p style={{ margin: 0 }}>
            This compilation is not only a record but also a living testimony to the esteem in which the institution has been held across generations, reminding the AMU community of the illustrious company that has shaped its identity and enriched its legacy.
          </p>
        </div>
      </div>
    </section>
  );
};
