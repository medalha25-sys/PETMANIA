import React, { useState } from 'react';
import { supabase } from '../supabase';

interface HeaderProps {
    darkMode: boolean;
    setDarkMode: (dark: boolean) => void;
    userEmail?: string;
}

const Header: React.FC<HeaderProps> = ({ darkMode, setDarkMode, userEmail }) => {
    const [loading, setLoading] = useState(false);
    const [userName, setUserName] = useState<string>('Admin');
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

    React.useEffect(() => {
        const updateState = (session: any) => {
            const user = session?.user;
            if (user?.user_metadata) {
                setUserName(user.user_metadata.full_name || 'Admin');
                setAvatarUrl(user.user_metadata.avatar_url || null);
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
    }, []);

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

    const handleLogout = async () => {
        try {
            setLoading(true);
            await supabase.auth.signOut();
        } catch (error) {
            console.error('Error signing out:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
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
                        <p className="text-sm font-bold text-slate-900 dark:text-white">{userName}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[150px]">{userEmail || 'Usuário'}</p>
                    </div>
                    <div className="relative group cursor-pointer size-10">
                        <div
                            className="bg-center bg-no-repeat aspect-square bg-cover rounded-full w-full h-full ring-2 ring-white dark:ring-surface-dark shadow-md"
                            style={{ backgroundImage: `url("${avatarUrl || 'https://lh3.googleusercontent.com/aida-public/AB6AXuAJpvoMEtHNU3hRIV5Rf2enFvLFvWeQGXgex2q8QvtmKwcbwaxl1mAuz7DHzOBhQukklyrJSu4aRyQTLbnr2fPj7wXuhp1U8E_a-ludyY2BbE9jfVpDzXS0djANgwwdjsH5YgFbcZ-ockl6POI9hWbKqATWSln0bMlDMOlQ9wv3_AedtcdyIXui-sHrXWOqqdewlqy09D0e_-7x7KVYEgjGTeub9MEqKDowScUAcqlMHDJtmUIQ8cCD4P-rH2eHdVMLDq8oWZQxYA'}")` }}
                        />
                        <label className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                            <span className="material-symbols-outlined text-[10px] text-white">edit</span>
                            <input type="file" className="hidden" accept="image/*" onChange={handleAvatarUpload} />
                        </label>
                    </div>

                    <button
                        onClick={handleLogout}
                        disabled={loading}
                        className="flex items-center justify-center size-10 rounded-xl bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                        title="Sair do sistema"
                    >
                        <span className="material-symbols-outlined">logout</span>
                    </button>
                </div>
            </div>
        </header>
    );
};

export default Header;
