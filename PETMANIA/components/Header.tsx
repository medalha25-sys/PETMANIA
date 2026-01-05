import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import SwitchUserModal from './SwitchUserModal';

interface HeaderProps {
    darkMode: boolean;
    setDarkMode: (dark: boolean) => void;
    userEmail?: string;
    onLogout?: () => Promise<void>;
    isClientPortal?: boolean;
}

const Header: React.FC<HeaderProps> = ({ darkMode, setDarkMode, userEmail, onLogout, isClientPortal = false }) => {
    const [loading, setLoading] = useState(false);
    const [userName, setUserName] = useState<string>('Admin');
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

    React.useEffect(() => {
        const updateState = (session: any) => {
            const user = session?.user;
            if (user?.user_metadata) {
                setUserName(user.user_metadata.full_name || 'Admin');
                setAvatarUrl(user.user_metadata.avatar_url || null);
            } else {
                // Reset for guest or no session
                setUserName(userEmail === 'Visitante' ? 'Visitante' : 'Admin');
                setAvatarUrl(null);
            }
        };

        // Initial fetch
        supabase.auth.getSession().then(({ data: { session } }) => {
            updateState(session);
        });

        // Listen for changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            updateState(session);
        });

        return () => {
            subscription.unsubscribe();
        };
    }, [userEmail]); // Re-run if userEmail changes (e.g. to 'Visitante')

    const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        try {
            if (!event.target.files || event.target.files.length === 0) return;
            setLoading(true);

            const file = event.target.files[0];
            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random()}.${fileExt}`;
            const filePath = `${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('user-avatars')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data } = supabase.storage.from('user-avatars').getPublicUrl(filePath);
            setAvatarUrl(data.publicUrl);

            // Auto-save metadata after upload
            const { error: updateError } = await supabase.auth.updateUser({
                data: { avatar_url: data.publicUrl }
            });

            if (updateError) throw updateError;

        } catch (error: any) {
            console.error('Error uploading avatar:', error);
        } finally {
            setLoading(false);
        }
    };

    const [showSwitchUser, setShowSwitchUser] = useState(false);
    const [showMenu, setShowMenu] = useState(false);

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (showMenu && !(event.target as Element).closest('.user-menu-container')) {
                setShowMenu(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showMenu]);

    const handleLogout = async () => {
        try {
            setLoading(true);
            if (onLogout) {
                await onLogout();
            } else {
                await supabase.auth.signOut();
            }
        } catch (error) {
            console.error('Error signing out:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <header className="sticky top-0 z-30 flex items-center justify-between gap-4 p-4 md:px-8 md:py-6 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md">
                <div className="flex flex-col gap-1">
                    {/* Mobile Logo/Title (Hidden on Desktop) */}
                    <div className="lg:hidden flex items-center gap-2 mb-1">
                        <div className="size-8 bg-primary rounded-full flex items-center justify-center">
                            <span className="material-symbols-outlined text-sm text-slate-900">pets</span>
                        </div>
                        <h1 className="text-slate-900 dark:text-white text-lg font-bold">PetManager</h1>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <button
                        onClick={() => setDarkMode(!darkMode)}
                        className="size-10 flex items-center justify-center rounded-xl bg-white dark:bg-surface-dark border border-slate-200 dark:border-gray-800 shadow-sm text-slate-600 dark:text-slate-300 hover:scale-105 transition-transform"
                        title={darkMode ? 'Mudar para modo claro' : 'Mudar para modo escuro'}
                    >
                        <span className="material-symbols-outlined">
                            {darkMode ? 'light_mode' : 'dark_mode'}
                        </span>
                    </button>

                    <div className="flex items-center gap-2 sm:gap-4 pl-4 border-l border-gray-200 dark:border-gray-800">
                        <div className="hidden sm:flex flex-col items-end">
                            <p className="text-sm font-bold text-slate-900 dark:text-white max-w-[150px] truncate">{userName}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[150px]">{userEmail || 'Usuário'}</p>
                        </div>

                        {/* User Avatar & Menu */}
                        <div className="relative user-menu-container">
                            <div
                                onClick={() => setShowMenu(!showMenu)}
                                className="relative cursor-pointer size-10 active:scale-95 transition-transform"
                            >
                                <div
                                    className="bg-center bg-no-repeat aspect-square bg-cover rounded-full w-full h-full ring-2 ring-white dark:ring-surface-dark shadow-md"
                                    style={{ backgroundImage: `url("${avatarUrl || 'https://lh3.googleusercontent.com/aida-public/AB6AXuAJpvoMEtHNU3hRIV5Rf2enFvLFvWeQGXgex2q8QvtmKwcbwaxl1mAuz7DHzOBhQukklyrJSu4aRyQTLbnr2fPj7wXuhp1U8E_a-ludyY2BbE9jfVpDzXS0djANgwwdjsH5YgFbcZ-ockl6POI9hWbKqATWSln0bMlDMOlQ9wv3_AedtcdyIXui-sHrXWOqqdewlqy09D0e_-7x7KVYEgjGTeub9MEqKDowScUAcqlMHDJtmUIQ8cCD4P-rH2eHdVMLDq8oWZQxYA'}")` }}
                                />
                                <div className="absolute -bottom-1 -right-1 bg-white dark:bg-surface-dark rounded-full p-0.5 shadow-sm border border-slate-100 dark:border-slate-700">
                                    <span className="material-symbols-outlined text-sm text-slate-600 dark:text-slate-400">expand_more</span>
                                </div>
                            </div>

                            {/* Dropdown Menu */}
                            {showMenu && (
                                <div className="absolute right-0 top-14 w-56 bg-white dark:bg-surface-dark rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800 overflow-hidden animate-in fade-in slide-in-from-top-2 z-50">
                                    <div className="p-2 border-b border-slate-100 dark:border-slate-800">
                                        <label className="flex items-center gap-3 w-full p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer group">
                                            <div className="size-8 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center group-hover:bg-primary/20 group-hover:text-primary transition-colors">
                                                <span className="material-symbols-outlined text-sm">edit</span>
                                            </div>
                                            <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Alterar Foto</span>
                                            <input type="file" className="hidden" accept="image/*" onChange={(e) => { handleAvatarUpload(e); setShowMenu(false); }} />
                                        </label>
                                    </div>
                                    <div className="p-2 space-y-1">
                                        <button
                                            onClick={() => { setShowSwitchUser(true); setShowMenu(false); }}
                                            className={`flex items-center gap-3 w-full p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors group text-left ${isClientPortal ? 'hidden' : ''}`}
                                        >
                                            <div className="size-8 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center group-hover:bg-blue-100 group-hover:text-blue-600 dark:group-hover:bg-blue-900/30 dark:group-hover:text-blue-400 transition-colors">
                                                <span className="material-symbols-outlined text-sm">switch_account</span>
                                            </div>
                                            <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Trocar Usuário</span>
                                        </button>
                                        <button
                                            onClick={handleLogout}
                                            disabled={loading}
                                            className="flex items-center gap-3 w-full p-3 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors group text-left text-red-600 dark:text-red-400"
                                        >
                                            <div className="size-8 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
                                                <span className="material-symbols-outlined text-sm">logout</span>
                                            </div>
                                            <span className="text-sm font-bold">Sair do Sistema</span>
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            <SwitchUserModal
                isOpen={showSwitchUser}
                onClose={() => setShowSwitchUser(false)}
            />
        </>
    );
};

export default Header;
