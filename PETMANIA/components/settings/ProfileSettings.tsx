import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabase';
import { User } from '@supabase/supabase-js';

const ProfileSettings: React.FC = () => {
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const [user, setUser] = useState<User | null>(null);
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [birthDate, setBirthDate] = useState('');
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
    const [userCity, setUserCity] = useState('');
    const [userState, setUserState] = useState('');

    useEffect(() => {
        fetchUser();
    }, []);

    const fetchUser = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            setUser(user);
            setEmail(user.email || '');
            setFullName(user.user_metadata?.full_name || '');
            setBirthDate(user.user_metadata?.birth_date || '');
            setAvatarUrl(user.user_metadata?.avatar_url || null);
            setUserCity(user.user_metadata?.city || '');
            setUserState(user.user_metadata?.state || '');
        }
    };

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);

        try {
            const updates: any = {
                data: {
                    full_name: fullName,
                    birth_date: birthDate,
                    avatar_url: avatarUrl,
                    city: userCity,
                    state: userState
                }
            };

            const { error } = await supabase.auth.updateUser(updates);

            if (error) throw error;

            setMessage({ type: 'success', text: 'Perfil atualizado com sucesso!' });
        } catch (error: any) {
            setMessage({ type: 'error', text: error.message || 'Erro ao atualizar perfil.' });
        } finally {
            setLoading(false);
        }
    };

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

            setMessage({ type: 'success', text: 'Foto de perfil atualizada!' });
        } catch (error: any) {
            console.error(error);
            setMessage({ type: 'error', text: 'Erro ao fazer upload da foto.' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <section className="bg-white dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm animate-in fade-in duration-300">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">Perfil do Usuário</h3>
                    <p className="text-sm text-slate-500">Gerencie suas informações pessoais.</p>
                </div>
                <span className="material-symbols-outlined text-slate-400">person</span>
            </div>

            {message && (
                <div className={`mb-4 p-3 rounded-lg text-sm font-medium ${message.type === 'success' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
                    {message.text}
                </div>
            )}

            <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div className="flex items-center gap-4 mb-6">
                    <div className="relative group cursor-pointer">
                        <div
                            className="size-20 rounded-full bg-cover bg-center ring-4 ring-slate-100 dark:ring-slate-800"
                            style={{ backgroundImage: `url("${avatarUrl || 'https://lh3.googleusercontent.com/aida-public/AB6AXuAJpvoMEtHNU3hRIV5Rf2enFvLFvWeQGXgex2q8QvtmKwcbwaxl1mAuz7DHzOBhQukklyrJSu4aRyQTLbnr2fPj7wXuhp1U8E_a-ludyY2BbE9jfVpDzXS0djANgwwdjsH5YgFbcZ-ockl6POI9hWbKqATWSln0bMlDMOlQ9wv3_AedtcdyIXui-sHrXWOqqdewlqy09D0e_-7x7KVYEgjGTeub9MEqKDowScUAcqlMHDJtmUIQ8cCD4P-rH2eHdVMLDq8oWZQxYA'}")` }}
                        />
                        <label className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-white">
                            <span className="material-symbols-outlined text-sm">edit</span>
                            <input type="file" className="hidden" accept="image/*" onChange={handleAvatarUpload} />
                        </label>
                    </div>
                    <div>
                        <p className="text-sm font-bold text-slate-900 dark:text-white">Foto do Perfil</p>
                        <p className="text-xs text-slate-500">Clique para alterar</p>
                    </div>
                </div>

                <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Nome Completo</label>
                    <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="w-full h-10 rounded-lg border border-slate-200 dark:border-slate-800 bg-transparent px-3 text-sm dark:text-white focus:ring-2 focus:ring-primary/50 outline-none"
                        placeholder="Seu nome"
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Email</label>
                        <input
                            type="email"
                            value={email}
                            disabled
                            className="w-full h-10 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-3 text-sm text-slate-500 cursor-not-allowed"
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Data de Nascimento</label>
                        <input
                            type="date"
                            value={birthDate}
                            onChange={(e) => setBirthDate(e.target.value)}
                            className="w-full h-10 rounded-lg border border-slate-200 dark:border-slate-800 bg-transparent px-3 text-sm text-slate-500 dark:text-slate-300 focus:ring-2 focus:ring-primary/50 outline-none"
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Cidade</label>
                        <input
                            type="text"
                            value={userCity}
                            onChange={(e) => setUserCity(e.target.value)}
                            className="w-full h-10 rounded-lg border border-slate-200 dark:border-slate-800 bg-transparent px-3 text-sm dark:text-white focus:ring-2 focus:ring-primary/50 outline-none"
                            placeholder="Sua cidade"
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Estado (UF)</label>
                        <input
                            type="text"
                            value={userState}
                            onChange={(e) => setUserState(e.target.value)}
                            className="w-full h-10 rounded-lg border border-slate-200 dark:border-slate-800 bg-transparent px-3 text-sm dark:text-white focus:ring-2 focus:ring-primary/50 outline-none"
                            placeholder="UF"
                            maxLength={2}
                        />
                    </div>
                </div>



                <div className="flex justify-end pt-2">
                    <button
                        type="submit"
                        disabled={loading}
                        className="px-4 py-2 bg-primary text-slate-900 font-bold rounded-lg shadow-sm hover:bg-primary-dark transition-colors disabled:opacity-70 text-sm"
                    >
                        {loading ? 'Salvando...' : 'Salvar Alterações'}
                    </button>
                </div>
            </form>
        </section>
    );
};

export default ProfileSettings;
