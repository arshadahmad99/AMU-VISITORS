import React, { useState, useEffect, lazy, Suspense } from 'react';
import { Header } from './components/Header';
import { EBookLibrary } from './components/EBookLibrary';
import { HeroBanner } from './components/HeroBanner';
import { HeroFeatureCard } from './components/HeroFeatureCard';
import { RecentBuyersFeed } from './components/RecentBuyersFeed';
import { VisitorBookArchive } from './components/VisitorBookArchive';
import { Footer } from './components/Footer';
import { fetchBooks, fetchRecentBuyers, fetchMyPurchases, getSavedUser, getAuthToken, removeAuthToken, clearApiCaches } from './services/api';
import { Book, Purchase, User } from '@digital-library/types';
import { InfoCards } from './components/InfoCards';
import { AuthorBioSection } from './components/AuthorBioSection';
import { VisitorMarquee } from './components/VisitorMarquee';
import { applySeoMetadata, EBOOK_READER_SEO, HOME_SEO, NOT_FOUND_SEO } from './utils/seo';

const AuthModal = lazy(() => import('./components/AuthModal').then((m) => ({ default: m.AuthModal })));
const BuyBookModal = lazy(() => import('./components/BuyBookModal').then((m) => ({ default: m.BuyBookModal })));
const MyLibraryModal = lazy(() => import('./components/MyLibraryModal').then((m) => ({ default: m.MyLibraryModal })));
const EBookReaderModal = lazy(() => import('./components/EBookReaderModal').then((m) => ({ default: m.EBookReaderModal })));
const ChangePasswordModal = lazy(() => import('./components/ChangePasswordModal').then((m) => ({ default: m.ChangePasswordModal })));

const normalizePathname = (rawPath: string) => {
  if (rawPath === '/index.html') return '/';
  if (rawPath.length > 1 && rawPath.endsWith('/')) return rawPath.slice(0, -1);
  return rawPath || '/';
};

const extractPurchasedBookIds = (purchases: any[]): string[] => {
  if (!Array.isArray(purchases)) return [];
  const ids = purchases
    .map((p: any) => p?.book?.id || p?.bookId)
    .filter((id): id is string => typeof id === 'string' && id.length > 0);
  return Array.from(new Set(ids));
};

const canReadBookWithoutBuying = (book: Book, ownedIds: string[], user: User | null): boolean =>
  ownedIds.includes(book.id) || book.price === 0 || user?.role === 'ADMIN';

export const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(getSavedUser());
  const [books, setBooks] = useState<Book[]>([]);
  const [recentBuyers, setRecentBuyers] = useState<Purchase[]>([]);
  const [purchasedBookIds, setPurchasedBookIds] = useState<string[]>([]);
  const [isPurchasesLoaded, setIsPurchasesLoaded] = useState<boolean>(() => !getSavedUser());
  const [pathname, setPathname] = useState<string>(() =>
    typeof window !== 'undefined' ? normalizePathname(window.location.pathname) : '/'
  );

  // Modals state
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authInitialMode, setAuthInitialMode] = useState<'login' | 'register'>('login');
  const [buyBookTarget, setBuyBookTarget] = useState<Book | null>(null);
  const [pendingBuyBook, setPendingBuyBook] = useState<Book | null>(null);
  const [isMyLibraryOpen, setIsMyLibraryOpen] = useState(false);
  const [activeReadingBook, setActiveReadingBook] = useState<Book | null>(null);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);

  const isEbookRoute = pathname === '/ebook' || pathname.startsWith('/ebook/');
  const isKnownRoute = pathname === '/' || isEbookRoute;
  const isNotFound = !isKnownRoute;

  // Normalize /index.html -> / cleanly in browser history
  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.pathname === '/index.html') {
      try {
        window.history.replaceState({}, '', '/');
        setPathname('/');
      } catch (e) {}
    }
  }, []);

  // Open / Close EBook handlers with URL state synchronization
  const handleOpenReadingBook = (b: Book) => {
    if (typeof window !== 'undefined' && window.location.pathname !== '/ebook') {
      try {
        window.history.pushState({ modal: 'ebook' }, '', '/ebook');
        setPathname('/ebook');
      } catch (e) {}
    }
    setActiveReadingBook(b);
  };

  const handleCloseReadingBook = () => {
    if (typeof window !== 'undefined' && window.location.pathname === '/ebook') {
      try {
        window.history.pushState({}, '', '/');
        setPathname('/');
      } catch (e) {}
    }
    setActiveReadingBook(null);
  };

  // Auto-open reader only after book catalog and user purchase ownership are verified
  useEffect(() => {
    if (books.length === 0 || typeof window === 'undefined') return;
    const currentPath = normalizePathname(window.location.pathname);
    const isEbookUrl = currentPath === '/ebook' || currentPath.startsWith('/ebook/');
    if (!isEbookUrl || activeReadingBook) return;

    const targetBook = books[0];
    if (!currentUser || !getAuthToken()) {
      setPendingBuyBook(targetBook);
      setAuthInitialMode('login');
      setIsAuthOpen(true);
      return;
    }

    if (!isPurchasesLoaded) return;

    if (canReadBookWithoutBuying(targetBook, purchasedBookIds, currentUser)) {
      setActiveReadingBook(targetBook);
    } else {
      setBuyBookTarget(targetBook);
    }
  }, [books, currentUser, isPurchasesLoaded, purchasedBookIds, activeReadingBook]);

  // Support browser Back / Forward buttons
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handlePopState = () => {
      const currentPath = normalizePathname(window.location.pathname);
      setPathname(currentPath);
      const isEbookUrl = currentPath === '/ebook' || currentPath.startsWith('/ebook/');
      if (isEbookUrl) {
        if (books.length > 0 && currentUser && canReadBookWithoutBuying(books[0], purchasedBookIds, currentUser)) {
          setActiveReadingBook(books[0]);
        }
      } else {
        setActiveReadingBook(null);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [books, currentUser, purchasedBookIds]);

  // Synchronize per-route & restricted-state SEO metadata
  useEffect(() => {
    if (isNotFound) {
      applySeoMetadata(NOT_FOUND_SEO);
    } else if (isEbookRoute || activeReadingBook) {
      applySeoMetadata(EBOOK_READER_SEO);
    } else if (isAuthOpen || Boolean(buyBookTarget) || isMyLibraryOpen || isChangePasswordOpen) {
      applySeoMetadata({
        ...HOME_SEO,
        canonicalUrl: undefined,
        robots: 'noindex, nofollow',
      });
    } else {
      applySeoMetadata(HOME_SEO);
    }
  }, [isNotFound, isEbookRoute, activeReadingBook, isAuthOpen, buyBookTarget, isMyLibraryOpen, isChangePasswordOpen]);

  const loadData = async () => {
    try {
      const bList = await fetchBooks();
      setBooks(bList);
    } catch (err) {
      console.error('Failed to load books from API', err);
    }

    try {
      const rList = await fetchRecentBuyers();
      setRecentBuyers(rList);
    } catch (err) {
      console.error('Failed to load recent buyers', err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    let cancelled = false;
    if (currentUser && getAuthToken()) {
      setIsPurchasesLoaded(false);
      fetchMyPurchases()
        .then((purchases) => {
          if (cancelled) return;
          setPurchasedBookIds(extractPurchasedBookIds(purchases));
          setIsPurchasesLoaded(true);
        })
        .catch((err) => {
          if (cancelled) return;
          console.error(err);
          const status = err?.response?.status;
          if (status === 401 || status === 403) {
            removeAuthToken();
            localStorage.removeItem('dl_user');
            setCurrentUser(null);
            setPurchasedBookIds([]);
            setActiveReadingBook(null);
          }
          setIsPurchasesLoaded(true);
        });
    } else {
      setPurchasedBookIds([]);
      setIsPurchasesLoaded(true);
    }
    return () => {
      cancelled = true;
    };
  }, [currentUser]);

  const handleLogout = () => {
    removeAuthToken();
    localStorage.removeItem('dl_user');
    setCurrentUser(null);
    setPurchasedBookIds([]);
    setIsPurchasesLoaded(true);
    setPendingBuyBook(null);
    setBuyBookTarget(null);
    setActiveReadingBook(null);
  };

  /**
   * Re-checks ownership against the server before opening the checkout modal so
   * already-purchased users (including right after sign-in or page reload) go straight to reading.
   */
  const openBuyBookIfNotOwned = async (bookToBuy: Book, userOverride?: User | null) => {
    const activeUser = userOverride ?? currentUser;
    if (canReadBookWithoutBuying(bookToBuy, purchasedBookIds, activeUser)) {
      setBuyBookTarget(null);
      handleOpenReadingBook(bookToBuy);
      return;
    }

    if (activeUser && getAuthToken()) {
      try {
        clearApiCaches();
        const purchases = await fetchMyPurchases();
        const latestIds = extractPurchasedBookIds(purchases);
        setPurchasedBookIds(latestIds);
        setIsPurchasesLoaded(true);
        if (canReadBookWithoutBuying(bookToBuy, latestIds, activeUser)) {
          setBuyBookTarget(null);
          handleOpenReadingBook(bookToBuy);
          return;
        }
      } catch (err: any) {
        const status = err?.response?.status;
        if (status === 401 || status === 403) {
          handleLogout();
          setPendingBuyBook(bookToBuy);
          setAuthInitialMode('login');
          setIsAuthOpen(true);
          return;
        }
      }
    }

    setBuyBookTarget(bookToBuy);
  };

  const handlePurchaseSuccess = (bookId: string) => {
    clearApiCaches();
    setPurchasedBookIds((prev) => Array.from(new Set([...prev, bookId])));
    setBuyBookTarget(null);
    loadData();
  };

  const purchasedBooksList = books.filter((b) => purchasedBookIds.includes(b.id));

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', position: 'relative' }}>

      {/* Top Navbar Header */}
      <Header
        currentUser={currentUser}
        onOpenAuth={(mode = 'login') => {
          setAuthInitialMode(mode);
          setIsAuthOpen(true);
        }}
        onLogout={handleLogout}
        onOpenMyLibrary={() => setIsMyLibraryOpen(true)}
        onOpenChangePassword={() => setIsChangePasswordOpen(true)}
      />

      {/* Main Application Layout */}
      <main className="app-main-content" style={{ flex: 1, padding: '20px clamp(12px, 3.5vw, 48px) 60px', maxWidth: '1400px', margin: '0 auto', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', boxSizing: 'border-box' }}>
        {isNotFound ? (
          <section
            style={{
              width: '100%',
              maxWidth: '640px',
              margin: '64px auto',
              padding: '48px 32px',
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              border: '1px solid var(--border-light)',
              boxShadow: 'var(--card-shadow)',
              textAlign: 'center',
            }}
          >
            <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '2.2rem', color: '#0b132b', marginBottom: '12px' }}>
              Page Not Found
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', lineHeight: 1.6, marginBottom: '28px' }}>
              The archive page you requested does not exist. Explore the Maulana Azad Library Digital Archive and Visitors&apos; Book from the home page.
            </p>
            <a
              href="/"
              onClick={(e) => {
                e.preventDefault();
                window.history.pushState({}, '', '/');
                setPathname('/');
              }}
              style={{
                display: 'inline-block',
                backgroundColor: '#0b132b',
                color: '#ffffff',
                padding: '12px 28px',
                borderRadius: '4px',
                fontWeight: 700,
                fontSize: '0.85rem',
                letterSpacing: '1px',
                textTransform: 'uppercase',
                textDecoration: 'none',
              }}
            >
              Return to Digital Archive
            </a>
          </section>
        ) : (
          <>
            {/* Hero Banner Area */}
            <HeroBanner />
            {/* Visitor Marquee */}

            {/* Featured History Section Card */}
            <HeroFeatureCard />

            <div style={{ width: '100%', margin: '16px 0', borderTop: '1px solid var(--border-light)', borderBottom: '1px solid var(--border-light)' }}>
              <VisitorMarquee />
            </div>

            <div className="three-col-layout" style={{ width: '100%', marginTop: '32px' }}>

              {/* LEFT COLUMN: Featured Manuscript */}
              <section style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                <EBookLibrary
                  books={books}
                  purchasedBookIds={purchasedBookIds}
                  currentUser={currentUser}
                  onRequireAuth={(b) => {
                    if (b) {
                      setPendingBuyBook(b);
                      setAuthInitialMode('register');
                    } else {
                      setAuthInitialMode('login');
                    }
                    setIsAuthOpen(true);
                  }}
                  onBuyBook={(b) => {
                    void openBuyBookIfNotOwned(b);
                  }}
                  onReadBook={handleOpenReadingBook}
                />
              </section>

              {/* CENTER COLUMN: Patron Ledger (Recent Buyers) */}
              <section style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                <RecentBuyersFeed purchases={recentBuyers} />
              </section>

              {/* RIGHT COLUMN: Visitor Registry */}
              <section style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                <VisitorBookArchive
                  hasPurchased={true}
                  isLoggedIn={!!currentUser}
                  onRequireAuth={() => {
                    setAuthInitialMode('login');
                    setIsAuthOpen(true);
                  }}
                />
              </section>

            </div>

            {/* Info Cards Section */}
            <InfoCards />

            {/* Author Biography Section */}
            <AuthorBioSection />

            {/* Heritage Image Showcase (Left & Right) */}
            <div
              style={{
                width: '100%',
                marginTop: '40px',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                gap: '24px',
              }}
            >

            </div>
          </>
        )}
      </main>

      {/* MODALS */}
      <Suspense fallback={null}>
        {isAuthOpen && (
          <AuthModal
            isOpen={isAuthOpen}
            initialMode={authInitialMode}
            onClose={() => {
              setIsAuthOpen(false);
              setPendingBuyBook(null);
              setAuthInitialMode('login');
            }}
            onSuccess={async (u) => {
              clearApiCaches();
              setCurrentUser(u);
              setAuthInitialMode('login');
              if (pendingBuyBook) {
                const targetBook = pendingBuyBook;
                setPendingBuyBook(null);
                await openBuyBookIfNotOwned(targetBook, u);
              }
            }}
          />
        )}

        {Boolean(buyBookTarget) && (
          <BuyBookModal
            book={buyBookTarget}
            isOpen={Boolean(buyBookTarget)}
            onClose={() => setBuyBookTarget(null)}
            onSuccess={handlePurchaseSuccess}
          />
        )}

        {isMyLibraryOpen && (
          <MyLibraryModal
            purchasedBooks={purchasedBooksList}
            isOpen={isMyLibraryOpen}
            onClose={() => setIsMyLibraryOpen(false)}
            onReadBook={handleOpenReadingBook}
          />
        )}

        {Boolean(activeReadingBook) && (
          <EBookReaderModal
            book={activeReadingBook}
            isOpen={Boolean(activeReadingBook)}
            onClose={handleCloseReadingBook}
          />
        )}

        {isChangePasswordOpen && (
          <ChangePasswordModal
            isOpen={isChangePasswordOpen}
            onClose={() => setIsChangePasswordOpen(false)}
            user={currentUser}
          />
        )}
      </Suspense>

      <Footer />
    </div>
  );
};
