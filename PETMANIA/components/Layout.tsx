import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import MobileNav from './MobileNav';
import BirthdayCelebration from './BirthdayCelebration';
import CheckoutModal from './CheckoutModal';

interface LayoutProps {
  children: React.ReactNode;
  darkMode: boolean;
  setDarkMode: (dark: boolean) => void;
  userEmail?: string;
}

const Layout: React.FC<LayoutProps> = ({ children, darkMode, setDarkMode, userEmail }) => {
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background-light dark:bg-background-dark">
      {/* Desktop Sidebar */}
      <div className="print:hidden">
        <Sidebar onOpenCheckout={() => setIsCheckoutOpen(true)} />
      </div>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full relative overflow-hidden print:h-auto print:overflow-visible">
        {/* Sticky Header */}
        <div className="print:hidden">
          <Header darkMode={darkMode} setDarkMode={setDarkMode} userEmail={userEmail} />
        </div>

        {/* Page Content Scroll Area */}
        <div className="flex-1 overflow-y-auto pb-24 lg:pb-8 print:overflow-visible print:pb-0">
          {children}
          <BirthdayCelebration />
        </div>

        {/* Mobile Navigation Bottom Bar */}
        <div className="print:hidden">
          <MobileNav />
        </div>
      </main>

      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        initialService={null} // Generic sale
        onSuccess={() => {
          // Optional: maybe refresh dashboard or notify
        }}
      />
    </div>
  );
};

export default Layout;
