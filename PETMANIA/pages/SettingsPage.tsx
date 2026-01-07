import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CompanySettings from '../components/settings/CompanySettings';
import ProfileSettings from '../components/settings/ProfileSettings';
import UserManagement from '../components/settings/UserManagement';
import NotificationSettings from '../components/settings/NotificationSettings';
import SecuritySettings from '../components/settings/SecuritySettings';
import SupportSettings from '../components/settings/SupportSettings';

interface SettingsPageProps {
    darkMode: boolean;
    setDarkMode: (dark: boolean) => void;
}

const SettingsPage: React.FC<SettingsPageProps> = ({ darkMode, setDarkMode }) => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('geral');

    return (
        <div className="p-4 md:p-8 space-y-8 max-w-[1000px] mx-auto w-full pb-24">
            <header className="flex flex-col gap-2">
                <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
                    <button onClick={() => navigate('/')} className="hover:text-primary transition-colors">Início</button>
                    <span>/</span>
                    <span className="font-medium text-slate-900 dark:text-white">Configurações</span>
                </div>
                <h1 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight">Configurações</h1>
                <p className="text-slate-500 text-base">Gerencie suas preferências de conta e sistema.</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Sidebar Navigation */}
                <nav className="space-y-2">
                    {[
                        { id: 'geral', label: 'Geral' },
                        { id: 'perfil', label: 'Perfil' },
                        { id: 'usuarios', label: 'Colaboradores' },
                        { id: 'notificacoes', label: 'Notificações' },
                        { id: 'seguranca', label: 'Segurança' },
                        { id: 'suporte', label: 'Suporte' }
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`w-full text-left px-4 py-3 rounded-xl font-bold text-sm transition-colors ${activeTab === tab.id
                                ? 'bg-primary/10 text-primary'
                                : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
                                }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </nav>

                {/* Content Area */}
                <div className="md:col-span-2 space-y-6">
                    {activeTab === 'geral' && (
                        <>
                            <CompanySettings />

                            {/* Theme Section - Kept here as it relies on props */}
                            <section className="bg-white dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm animate-in fade-in duration-300">
                                <div className="flex items-center justify-between mb-4">
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">Aparência</h3>
                                        <p className="text-sm text-slate-500">Personalize a aparência do sistema.</p>
                                    </div>
                                    <button
                                        onClick={() => setDarkMode(!darkMode)}
                                        className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-primary transition-colors"
                                        title="Alternar Tema"
                                    >
                                        <span className="material-symbols-outlined">palette</span>
                                    </button>
                                </div>
                                <div className="flex items-center justify-between py-3 border-t border-slate-100 dark:border-slate-800">
                                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Modo Escuro</span>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs text-slate-500">{darkMode ? 'Ativado' : 'Desativado'}</span>
                                        <button
                                            onClick={() => setDarkMode(!darkMode)}
                                            className={`w-11 h-6 flex items-center rounded-full transition-colors ${darkMode ? 'bg-primary' : 'bg-slate-300'}`}
                                        >
                                            <div className={`size-4 bg-white rounded-full shadow-md transform transition-transform ${darkMode ? 'translate-x-6' : 'translate-x-1'}`} />
                                        </button>
                                    </div>
                                </div>
                            </section>
                        </>
                    )}

                    {activeTab === 'perfil' && <ProfileSettings />}
                    {activeTab === 'usuarios' && <UserManagement />}
                    {activeTab === 'notificacoes' && <NotificationSettings />}
                    {activeTab === 'seguranca' && <SecuritySettings />}
                    {activeTab === 'suporte' && <SupportSettings />}
                </div>
            </div>
        </div>
    );
};

export default SettingsPage;
