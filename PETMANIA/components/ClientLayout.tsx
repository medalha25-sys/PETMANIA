import React from 'react';
import Header from './Header';

interface ClientLayoutProps {
    children: React.ReactNode;
    darkMode: boolean;
    setDarkMode: (dark: boolean) => void;
    userEmail?: string;
    onLogout?: () => Promise<void>;
}

const ClientLayout: React.FC<ClientLayoutProps> = ({ children, darkMode, setDarkMode, userEmail, onLogout }) => {
    return (
        <div className="flex flex-col h-screen w-full bg-background-light dark:bg-background-dark">
            <Header
                darkMode={darkMode}
                setDarkMode={setDarkMode}
                userEmail={userEmail}
                onLogout={onLogout}
                isClientPortal={true} // We might need to adjust Header to accept this prop or handle it 
            />
            <main className="flex-1 container mx-auto px-4 py-8 overflow-y-auto">
                {children}
            </main>
        </div>
    );
};

export default ClientLayout;
