import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import MobileNav from './MobileNav';
import BirthdayCelebration from './BirthdayCelebration';
import CheckoutModal from './CheckoutModal';
import { supabase } from '../supabase';
import { OpenRegisterModal, RegisterClosedModal } from './CashRegisterModals';

interface LayoutProps {
  children: React.ReactNode;
  darkMode: boolean;
  setDarkMode: (dark: boolean) => void;
  userEmail?: string;
  isGuest?: boolean;
  onLogout?: () => Promise<void>;
}

const Layout: React.FC<LayoutProps> = ({ children, darkMode, setDarkMode, userEmail, isGuest = false, onLogout }) => {
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [cashRegisterStatus, setCashRegisterStatus] = useState<'open' | 'closed' | null>(null);
  const [showRegisterClosedModal, setShowRegisterClosedModal] = useState(false);
  const [showOpenRegisterModal, setShowOpenRegisterModal] = useState(false);

  useEffect(() => {
    fetchCashRegisterStatus();
  }, []);

  const fetchCashRegisterStatus = async () => {
    try {
      const { data } = await supabase
        .from('daily_cash_registers')
        .select('status')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (data) {
        setCashRegisterStatus(data.status);
      } else {
        setCashRegisterStatus(null);
      }
    } catch (error) {
      console.error('Error fetching register status:', error);
    }
  };

  const handleOpenCheckout = () => {
    if (cashRegisterStatus === 'open') {
      setIsCheckoutOpen(true);
    } else {
      fetchCashRegisterStatus().then(() => {
        // Re-check after fresh fetch to be sure
        supabase.from('daily_cash_registers').select('status').order('created_at', { ascending: false }).limit(1).single().then(({ data }) => {
          if (data?.status === 'open') {
            setIsCheckoutOpen(true);
            setCashRegisterStatus('open');
          } else {
            setShowRegisterClosedModal(true);
          }
        });
      });
    }
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background-light dark:bg-background-dark">
      {/* Desktop Sidebar */}
      <div className="print:hidden">
        <Sidebar onOpenCheckout={handleOpenCheckout} isGuest={isGuest} />
      </div>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full relative overflow-hidden print:h-auto print:overflow-visible">
        {/* Sticky Header */}
        <div className="print:hidden">
          <Header darkMode={darkMode} setDarkMode={setDarkMode} userEmail={userEmail} onLogout={onLogout} />
        </div>

        {/* Page Content Scroll Area */}
        <div className="flex-1 overflow-y-auto pb-24 lg:pb-8 print:overflow-visible print:pb-0">
          {children}
          <BirthdayCelebration />
        </div>

        {/* Mobile Navigation Bottom Bar */}
        <div className="print:hidden">
          <MobileNav isGuest={isGuest} />
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

      <RegisterClosedModal
        isOpen={showRegisterClosedModal}
        onClose={() => setShowRegisterClosedModal(false)}
        onOpenRegister={() => setShowOpenRegisterModal(true)}
      />

      <OpenRegisterModal
        isOpen={showOpenRegisterModal}
        onClose={() => setShowOpenRegisterModal(false)}
        onSuccess={() => {
          fetchCashRegisterStatus();
          setCashRegisterStatus('open');
          // Optional: Auto-open checkout after opening register?
          // setIsCheckoutOpen(true); 
        }}
      />
    </div>
  );
};

export default Layout;
