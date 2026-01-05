import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './supabase';
import { Session } from '@supabase/supabase-js';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Clients from './pages/Clients';
import PetsPage from './pages/PetsPage';
import ServicesPage from './pages/ServicesPage';
import Agenda from './pages/Agenda';
import Auth from './pages/Auth';
import SettingsPage from './pages/SettingsPage';
import Financeiro from './pages/Financeiro';
import DrexPage from './pages/DrexPage';
import ProductsPage from './pages/ProductsPage';
import ClientLayout from './components/ClientLayout';
import ClientDashboard from './pages/ClientDashboard';
import ClientScheduling from './pages/ClientScheduling';

const App: React.FC = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isGuest, setIsGuest] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') === 'dark' ||
        (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return false;
  });

  const [userRole, setUserRole] = useState<'admin' | 'employee' | 'client' | null>(null);

  useEffect(() => {
    // Check current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchUserRole(session.user.id);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchUserRole(session.user.id);
      else setUserRole(null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserRole = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();

      if (data) setUserRole(data.role);
    } catch (error) {
      console.error("Error fetching role:", error);
    }
  };

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  const handleLogout = async () => {
    if (isGuest) {
      setIsGuest(false);
    }
    await supabase.auth.signOut();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark">
        <div className="flex flex-col items-center gap-4">
          <div className="size-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-500 dark:text-slate-400 font-medium animate-pulse">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        <Route path="/auth" element={!session && !isGuest ? <Auth onGuestLogin={() => setIsGuest(true)} /> : <Navigate to="/" />} />

        <Route
          path="/*"
          element={
            session || isGuest ? (
              userRole === 'client' ? (
                <ClientLayout
                  darkMode={darkMode}
                  setDarkMode={setDarkMode}
                  userEmail={session?.user.email || 'Cliente'}
                  onLogout={handleLogout}
                >
                  <Routes>
                    <Route path="/portal" element={<ClientDashboard />} />
                    <Route path="/agendar" element={<ClientScheduling />} />
                    <Route path="*" element={<Navigate to="/portal" replace />} />
                  </Routes>
                </ClientLayout>
              ) : (
                <Layout
                  darkMode={darkMode}
                  setDarkMode={setDarkMode}
                  userEmail={session?.user.email || 'Visitante'}
                  isGuest={isGuest}
                  onLogout={handleLogout}
                >
                  <Routes>
                    <Route path="/" element={<Dashboard isGuest={isGuest} />} />
                    <Route path="/clientes" element={<Clients />} />
                    <Route path="/pets" element={<PetsPage />} />
                    <Route path="/produtos" element={<ProductsPage />} />
                    <Route path="/servicos" element={<ServicesPage />} />
                    <Route path="/agenda" element={<Agenda />} />
                    <Route path="/configuracoes" element={<SettingsPage darkMode={darkMode} setDarkMode={setDarkMode} />} />
                    <Route path="/financeiro" element={<Financeiro />} />
                    <Route path="/drex" element={<DrexPage />} />
                    <Route path="*" element={<Navigate to="/" />} />
                  </Routes>
                </Layout>
              )
            ) : (
              <Navigate to="/auth" />
            )
          }
        />
      </Routes>
    </Router>
  );
};

export default App;
