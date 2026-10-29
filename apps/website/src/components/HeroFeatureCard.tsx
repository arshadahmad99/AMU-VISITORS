import React, { useState, useEffect, useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import ebookCoverImg from '../assets/ebook-cover.png';
import banner2Img from '../assets/banner2.png';

const QUOTES = [
  {
    text: '"The seed that we sow today may grow up a mighty tree whose branches, like the Banyan of the soil, may take firm roots in the ground and in their turn, themselves send forth fresh vigorous saplings and its alumni may go forth to the length and breadth of the land, preaching the gospel of truth, honesty, piety and large-hearted tolerance."',
    author: 'Sir Syed Ahmad Khan',
    role: 'Foundation Ceremony Speech of MAO College (January 8, 1877)',
  },
  {
    text: '"The College may expand into a University whose sons shall go forth throughout the length and breadth of the land to preach the gospel of free inquiry, large-hearted tolerance, and pure morality."',
    author: 'Sir Syed Ahmad Khan',
    role: 'Foundation Ceremony Speech of MAO College (January 8, 1877)',
  },
  {
    text: '"A library is the best society to which any man can be admitted, for it is an assemblage of the world\'s greatest benefactors—the wise and the good of all ages. Here live those who are worthy to live. I esteem it a privilege to lay the foundation of a building under whose sheltering roof the number of such worthies is likely to increase."',
    author: 'Edward Robert Bulwer-Lytton',
    role: 'Viceroy of India (1876–1880)',
  },
  {
    text: '"Education imparted by heart can bring revolution in society."',
    author: 'Maulana Abul Kalam Azad',
    role: '',
  },
  {
    text: '"Educationists should build the capacities of the spirit of inquiry, creativity, entrepreneurial and moral leadership among students and become their role model."',
    author: 'Maulana Abul Kalam Azad',
    role: '',
  },
  {
    text: '"By education, I mean an all-round drawing out of the best in the child and man—body, mind and spirit."',
    author: 'Mahatma Gandhi',
    role: '',
  },
  {
    text: '"An education which does not teach us to discriminate between good and bad, to assimilate the one and eschew the other, is a misnomer."',
    author: 'Mahatma Gandhi',
    role: '',
  },
];

interface HeroFeatureCardProps {
  onEnterLibrary?: () => void;
  onSeeCollection?: () => void;
}

export const HeroFeatureCard: React.FC<HeroFeatureCardProps> = ({
  onEnterLibrary,
  onSeeCollection,
}) => {
  const heroBookRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const scrollTrackRef = useRef<HTMLDivElement>(null);
  const animFrameRef = useRef<number | null>(null);
  const posRef = useRef(0);

  const [scrollRange, setScrollRange] = useState<[number, number]>([480, 880]);
  const [targetOffset, setTargetOffset] = useState({ x: 0, y: 0, scale: 1 });

  useEffect(() => {
    const calculateOffset = () => {
      const heroEl = heroBookRef.current;
      const targetEl = document.getElementById('ebook-cover-target');
      const cardEl = cardRef.current;

      if (heroEl && targetEl && cardEl) {
        const heroRect = heroEl.getBoundingClientRect();
        const targetRect = targetEl.getBoundingClientRect();

        const deltaX = targetRect.left - heroRect.left;
        const deltaY = targetRect.top - heroRect.top;
        const scaleFactor = targetRect.width / (heroRect.width || 240);

        setTargetOffset({
          x: deltaX,
          y: deltaY,
          scale: scaleFactor > 0 ? scaleFactor : 1,
        });

        const cardTop = cardEl.offsetTop;
        const startScroll = Math.max(350, cardTop + 60);
        const endScroll = startScroll + 400;
        setScrollRange([startScroll, endScroll]);
      }
    };

    calculateOffset();
    window.addEventListener('resize', calculateOffset);

    const timer1 = setTimeout(calculateOffset, 300);
    const timer2 = setTimeout(calculateOffset, 800);

    return () => {
      window.removeEventListener('resize', calculateOffset);
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, []);

  const { scrollY } = useScroll();

  // Animation ONLY starts when user has scrolled down past the hero feature card (e.g. 450px+)
  const translateX = useTransform(scrollY, scrollRange, [0, targetOffset.x]);
  const translateY = useTransform(scrollY, scrollRange, [0, targetOffset.y]);
  const rotateY = useTransform(scrollY, scrollRange, [-16, 0]);
  const rotateX = useTransform(scrollY, scrollRange, [4, 0]);
  const rotateZ = useTransform(scrollY, scrollRange, [1, 0]);
  const scale = useTransform(scrollY, scrollRange, [1, targetOffset.scale]);

  // Smoothly fade out floating book right as it reaches the destination to prevent double-image overlap
  const opacity = useTransform(scrollY, [scrollRange[1] - 100, scrollRange[1]], [1, 0]);

  // ── Quotes auto-scroll ──
  useEffect(() => {
    const track = scrollTrackRef.current;
    if (!track) return;

    const speed = 0.55;

    const step = () => {
      posRef.current += speed;
      const halfHeight = track.scrollHeight / 2;
      if (posRef.current >= halfHeight) {
        posRef.current = 0;
      }
      track.style.transform = `translateY(-${posRef.current}px)`;
      animFrameRef.current = requestAnimationFrame(step);
    };

    animFrameRef.current = requestAnimationFrame(step);

    return () => {
      if (animFrameRef.current !== null) cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  const pauseScroll = () => {
    if (animFrameRef.current !== null) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
  };

  const resumeScroll = () => {
    if (animFrameRef.current !== null) return;
    const track = scrollTrackRef.current;
    if (!track) return;
    const speed = 0.55;
    const step = () => {
      posRef.current += speed;
      const halfHeight = track.scrollHeight / 2;
      if (posRef.current >= halfHeight) posRef.current = 0;
      track.style.transform = `translateY(-${posRef.current}px)`;
      animFrameRef.current = requestAnimationFrame(step);
    };
    animFrameRef.current = requestAnimationFrame(step);
  };

  const scrollToLibrary = () => {
    const element = document.querySelector('.three-col-layout');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const doubledQuotes = [...QUOTES, ...QUOTES];

  return (
    <div
      ref={cardRef}
      id="hero-feature-card"
      style={{
        width: '100%',
        margin: '24px 0 32px',
        backgroundColor: '#f6f0e4',
        backgroundImage: `
          linear-gradient(rgba(212, 196, 168, 0.18) 1px, transparent 1px),
          linear-gradient(90deg, rgba(212, 196, 168, 0.18) 1px, transparent 1px)
        `,
        backgroundSize: '28px 28px',
        borderRadius: '12px',
        border: '1px solid #e6dbcb',
        padding: '48px 64px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: '0 8px 30px rgba(0, 0, 0, 0.04)',
        position: 'relative',
        overflow: 'visible',
      }}
    >
      {/* Left Text Block — identical to original */}
      <div style={{ flex: 1, maxWidth: '580px', zIndex: 2 }}>
        <div
          style={{
            fontSize: '0.85rem',
            fontWeight: 600,
            color: '#b08d57',
            letterSpacing: '0.5px',
            fontFamily: 'var(--font-body)',
          }}
        >
          Lytton Library
        </div>

        {/* banner2.png image replacing the h1 title */}
        <div
          style={{
            margin: '14px 0 18px',
            borderRadius: '8px',
            overflow: 'hidden',
            width: '100%',
            maxWidth: '500px',
            height: '240px',
            position: 'relative',
          }}
        >
          <img
            src={banner2Img}
            alt="Maulana Azad Library"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              objectPosition: 'center',
              display: 'block',
            }}
          />
        </div>

        {/* ── Scrolling quotes replace the static paragraph ── */}
        <div
          style={{
            position: 'relative',
            height: '180px',
            overflow: 'hidden',
            margin: '0 0 28px 0',
            maxWidth: '500px',
          }}
          onMouseEnter={pauseScroll}
          onMouseLeave={resumeScroll}
        >
          {/* Top fade */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '22px',
              background: 'linear-gradient(to bottom, #f6f0e4, transparent)',
              zIndex: 2,
              pointerEvents: 'none',
            }}
          />

          {/* Scrolling track */}
          <div ref={scrollTrackRef} style={{ willChange: 'transform' }}>
            {doubledQuotes.map((q, i) => (
              <div key={i} style={{ paddingBottom: '16px' }}>
                <p
                  style={{
                    fontSize: '1.02rem',
                    color: '#5c4a40',
                    lineHeight: '1.65',
                    margin: 0,
                    fontFamily: 'var(--font-body)',
                    fontStyle: 'italic',
                  }}
                >
                  {q.text}
                </p>
                <span
                  style={{
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    color: '#b08d57',
                    fontFamily: 'var(--font-body)',
                    display: 'block',
                    marginTop: '4px',
                  }}
                >
                  — {q.author}
                  {q.role ? `, ${q.role}` : ''}
                </span>
              </div>
            ))}
          </div>

          {/* Bottom fade */}
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: '28px',
              background: 'linear-gradient(to top, #f6f0e4, transparent)',
              zIndex: 2,
              pointerEvents: 'none',
            }}
          />
        </div>


      </div>

      {/* 3D Book Visual — identical to original */}
      <div
        ref={heroBookRef}
        style={{
          perspective: '1200px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          paddingRight: '20px',
          zIndex: 99,
          pointerEvents: 'none',
        }}
      >
        <motion.div
          style={{
            width: '240px',
            height: '340px',
            borderRadius: '4px 8px 8px 4px',
            x: translateX,
            y: translateY,
            rotateY: rotateY,
            rotateX: rotateX,
            rotateZ: rotateZ,
            scale: scale,
            opacity: opacity,
            boxShadow: '25px 25px 50px rgba(40, 20, 10, 0.35), 8px 8px 15px rgba(0, 0, 0, 0.15)',
            position: 'relative',
            backgroundColor: '#3b0f1b',
            transformOrigin: 'top left',
            pointerEvents: 'none',
          }}
        >
          <img
            src={ebookCoverImg}
            alt="The Maulana Azad Library Book Cover"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              display: 'block',
            }}
          />
        </motion.div>
      </div>
    </div>
  );
};
