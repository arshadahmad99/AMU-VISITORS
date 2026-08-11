import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { EBookLibrary } from './components/EBookLibrary';
import { HeroBanner } from './components/HeroBanner';
import { RecentBuyersFeed } from './components/RecentBuyersFeed';
import { VisitorBookArchive } from './components/VisitorBookArchive';
import { AuthModal } from './components/AuthModal';
import { BuyBookModal } from './components/BuyBookModal';
import { MyLibraryModal } from './components/MyLibraryModal';
import { EBookReaderModal } from './components/EBookReaderModal';
import { Footer } from './components/Footer';
import { fetchBooks, fetchRecentBuyers, fetchMyPurchases, getSavedUser, removeAuthToken } from './services/api';
import { Book, Purchase, User } from '@digital-library/types';
import bgImage from './assets/amu-library.png';

export const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(getSavedUser());
  const [books, setBooks] = useState<Book[]>([]);
  const [recentBuyers, setRecentBuyers] = useState<Purchase[]>([]);
  const [purchasedBookIds, setPurchasedBookIds] = useState<string[]>([]);

  // Modals state
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [buyBookTarget, setBuyBookTarget] = useState<Book | null>(null);
  const [isMyLibraryOpen, setIsMyLibraryOpen] = useState(false);
  const [activeReadingBook, setActiveReadingBook] = useState<Book | null>(null);

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
      />

      {/* Main Application Layout */}
      <main style={{ flex: 1, padding: '20px 48px 60px', maxWidth: '1400px', margin: '0 auto', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        
        {/* Hero Banner Area */}
        <HeroBanner />

        <div className="three-col-layout" style={{ width: '100%', marginTop: '32px' }}>
          
          {/* LEFT COLUMN: Featured Manuscript */}
          <section style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <EBookLibrary
              books={books}
              purchasedBookIds={purchasedBookIds}
              currentUser={currentUser}
              onRequireAuth={() => setIsAuthOpen(true)}
              onBuyBook={(b) => setBuyBookTarget(b)}
              onReadBook={(b) => setActiveReadingBook(b)}
            />
          </section>

          {/* CENTER COLUMN: Patron Ledger (Recent Buyers) */}
          <section style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <RecentBuyersFeed purchases={recentBuyers} />
          </section>

          {/* RIGHT COLUMN: Visitor Registry */}
          <section style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <VisitorBookArchive 
              hasPurchased={purchasedBookIds.length > 0}
              isLoggedIn={!!currentUser}
              onRequireAuth={() => setIsAuthOpen(true)}
            />
          </section>

        </div>
      </main>

      {/* MODALS */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onSuccess={(u) => setCurrentUser(u)}
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
        onReadBook={(b) => setActiveReadingBook(b)}
      />

      <EBookReaderModal
        book={activeReadingBook}
        isOpen={Boolean(activeReadingBook)}
        onClose={() => setActiveReadingBook(null)}
      />

      <Footer />
    </div>
  );
};
