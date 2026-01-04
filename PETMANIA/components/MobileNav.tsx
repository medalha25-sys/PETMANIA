import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const MobileNav: React.FC = () => {
    const location = useLocation();

    return (
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-surface-dark border-t border-gray-200 dark:border-gray-800 flex justify-around p-3 z-50 safe-area-bottom shadow-lg">
            <Link to="/" className={`flex flex-col items-center gap-1 ${location.pathname === '/' ? 'text-primary' : 'text-slate-400 dark:text-slate-500'}`}>
                <span className="material-symbols-outlined">dashboard</span>
                <span className="text-[10px] font-medium">Home</span>
            </Link>
            <Link to="/agenda" className={`flex flex-col items-center gap-1 ${location.pathname === '/agenda' ? 'text-primary' : 'text-slate-400 dark:text-slate-500'}`}>
                <span className="material-symbols-outlined">calendar_month</span>
                <span className="text-[10px] font-medium">Agenda</span>
            </Link>
            <Link to="/agendar" className="flex items-center justify-center size-12 bg-primary rounded-full text-slate-900 -mt-6 shadow-lg border-4 border-white dark:border-surface-dark transform active:scale-95 transition-transform">
                <span className="material-symbols-outlined">add</span>
            </Link>
            <Link to="/pets" className={`flex flex-col items-center gap-1 ${location.pathname === '/pets' ? 'text-primary' : 'text-slate-400 dark:text-slate-500'}`}>
                <span className="material-symbols-outlined">pets</span>
                <span className="text-[10px] font-medium">Pets</span>
            </Link>
            <Link to="/perfil" className={`flex flex-col items-center gap-1 ${location.pathname === '/perfil' ? 'text-primary' : 'text-slate-400 dark:text-slate-500'}`}>
                <span className="material-symbols-outlined">person</span>
                <span className="text-[10px] font-medium">Perfil</span>
            </Link>
        </nav>
    );
};

export default MobileNav;
