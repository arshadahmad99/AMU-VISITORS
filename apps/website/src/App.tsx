import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { EBookLibrary } from './components/EBookLibrary';
import { HeroBanner } from './components/HeroBanner';
import { HeroFeatureCard } from './components/HeroFeatureCard';
import { RecentBuyersFeed } from './components/RecentBuyersFeed';
import { VisitorBookArchive } from './components/VisitorBookArchive';
import { AuthModal } from './components/AuthModal';
import { BuyBookModal } from './components/BuyBookModal';
import { MyLibraryModal } from './components/MyLibraryModal';
import { EBookReaderModal } from './components/EBookReaderModal';
import { ChangePasswordModal } from './components/ChangePasswordModal';
import { Footer } from './components/Footer';
import { fetchBooks, fetchRecentBuyers, fetchMyPurchases, getSavedUser, removeAuthToken } from './services/api';
import { Book, Purchase, User } from '@digital-library/types';
import { InfoCards } from './components/InfoCards';
import { AuthorBioSection } from './components/AuthorBioSection';
import { VisitorMarquee } from './components/VisitorMarquee';
import amuLibraryImg from './assets/amu-library.png';
import banner2Img from './assets/banner2.png';

export const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(getSavedUser());
  const [books, setBooks] = useState<Book[]>([]);
  const [recentBuyers, setRecentBuyers] = useState<Purchase[]>([]);
  const [purchasedBookIds, setPurchasedBookIds] = useState<string[]>([]);

  // Modals state
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [buyBookTarget, setBuyBookTarget] = useState<Book | null>(null);
  const [pendingBuyBook, setPendingBuyBook] = useState<Book | null>(null);
  const [isMyLibraryOpen, setIsMyLibraryOpen] = useState(false);
  const [activeReadingBook, setActiveReadingBook] = useState<Book | null>(null);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);

  // Open / Close EBook handlers with URL state synchronization
  const handleOpenReadingBook = (b: Book) => {
    if (typeof window !== 'undefined' && window.location.pathname !== '/ebook') {
      try {
        window.history.pushState({ modal: 'ebook' }, '', '/ebook');
      } catch (e) {}
    }
    setActiveReadingBook(b);
  };

  const handleCloseReadingBook = () => {
    if (typeof window !== 'undefined' && window.location.pathname === '/ebook') {
      try {
        window.history.pushState({}, '', '/');
      } catch (e) {}
    }
    setActiveReadingBook(null);
  };

  // Auto-open reader if direct URL /ebook is accessed or reloaded
  useEffect(() => {
    if (books.length > 0 && typeof window !== 'undefined') {
      const isEbookUrl = window.location.pathname === '/ebook' || window.location.pathname.startsWith('/ebook');
      if (isEbookUrl && !activeReadingBook) {
        setActiveReadingBook(books[0]);
      }
    }
  }, [books]);

  // Support browser Back / Forward buttons
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handlePopState = () => {
      const isEbookUrl = window.location.pathname === '/ebook' || window.location.pathname.startsWith('/ebook');
      if (isEbookUrl) {
        if (books.length > 0) setActiveReadingBook(books[0]);
      } else {
        setActiveReadingBook(null);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [books]);

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
    if (currentUser) {
      fetchMyPurchases().then((purchases) => {
        setPurchasedBookIds(purchases.map((p: any) => p.book.id));
      }).catch(console.error);
    } else {
      setPurchasedBookIds([]);
    }
  }, [currentUser]);

  const handleLogout = () => {
    removeAuthToken();
    localStorage.removeItem('dl_user');
    setCurrentUser(null);
    setPurchasedBookIds([]);
    setPendingBuyBook(null);
    setBuyBookTarget(null);
  };

  const handlePurchaseSuccess = (bookId: string) => {
    setPurchasedBookIds((prev) => [...prev, bookId]);
    loadData();
  };

  const purchasedBooksList = books.filter((b) => purchasedBookIds.includes(b.id));

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', position: 'relative' }}>

      {/* Top Navbar Header */}
      <Header
        currentUser={currentUser}
        onOpenAuth={() => setIsAuthOpen(true)}
        onLogout={handleLogout}
        onOpenMyLibrary={() => setIsMyLibraryOpen(true)}
        onOpenChangePassword={() => setIsChangePasswordOpen(true)}
      />

      {/* Main Application Layout */}
      <main className="app-main-content" style={{ flex: 1, padding: '20px clamp(12px, 3.5vw, 48px) 60px', maxWidth: '1400px', margin: '0 auto', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', boxSizing: 'border-box' }}>

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
                if (b) setPendingBuyBook(b);
                setIsAuthOpen(true);
              }}
              onBuyBook={(b) => setBuyBookTarget(b)}
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
              onRequireAuth={() => setIsAuthOpen(true)}
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
      </main>

      {/* MODALS */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => {
          setIsAuthOpen(false);
          setPendingBuyBook(null);
        }}
        onSuccess={(u) => {
          setCurrentUser(u);
          if (pendingBuyBook) {
            setBuyBookTarget(pendingBuyBook);
            setPendingBuyBook(null);
          }
        }}
      />

      <BuyBookModal
        book={buyBookTarget}
        isOpen={Boolean(buyBookTarget)}
        onClose={() => setBuyBookTarget(null)}
        onSuccess={handlePurchaseSuccess}
      />

      <MyLibraryModal
        purchasedBooks={purchasedBooksList}
        isOpen={isMyLibraryOpen}
        onClose={() => setIsMyLibraryOpen(false)}
        onReadBook={handleOpenReadingBook}
      />

      <EBookReaderModal
        book={activeReadingBook}
        isOpen={Boolean(activeReadingBook)}
        onClose={handleCloseReadingBook}
      />

      <ChangePasswordModal
        isOpen={isChangePasswordOpen}
        onClose={() => setIsChangePasswordOpen(false)}
        user={currentUser}
      />

      <Footer />
    </div>
  );
};
