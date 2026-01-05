import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';

interface Profile {
    id: string;
    email: string;
    full_name: string;
    role: string;
    // avatar_url might not be in profiles based on UserModal, but we'll try to use it if available or fallback
}

interface SwitchUserModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const SwitchUserModal: React.FC<SwitchUserModalProps> = ({ isOpen, onClose }) => {
    const [step, setStep] = useState<'list' | 'password'>('list');
    const [profiles, setProfiles] = useState<Profile[]>([]);
    const [selectedUser, setSelectedUser] = useState<Profile | null>(null);
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Fetch users when modal opens
    useEffect(() => {
        if (isOpen) {
            setStep('list');
            setSelectedUser(null);
            setPassword('');
            setError(null);
            fetchProfiles();
        }
    }, [isOpen]);

    const fetchProfiles = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .order('full_name');

            if (error) throw error;
            setProfiles(data || []);
        } catch (err: any) {
            console.error('Error fetching profiles:', err);
            setError('Erro ao carregar lista de usuários.');
        } finally {
            setLoading(false);
        }
    };

    const handleUserSelect = (user: Profile) => {
        setSelectedUser(user);
        setStep('password');
        setError(null);
    };

    const handleSwitch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedUser) return;

        setLoading(true);
        setError(null);

        try {
            const { error } = await supabase.auth.signInWithPassword({
                email: selectedUser.email,
                password: password,
            });

            if (error) throw error;

            // Success - Auth listener in App.tsx will handle the rest
            onClose();
        } catch (err: any) {
            console.error('Login error:', err);
            setError('Senha incorreta ou erro ao entrar.');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-surface-dark w-full max-w-md rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary">switch_account</span>
                        Trocar Usuário
                    </h3>
                    <button onClick={onClose} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700/50 rounded-full transition-colors">
                        <span className="material-symbols-outlined text-slate-500">close</span>
                    </button>
                </div>

                <div className="p-6">
                    {step === 'list' ? (
                        <div className="space-y-4">
                            <p className="text-sm text-slate-500 dark:text-slate-400">Selecione um usuário para entrar:</p>

                            {loading ? (
                                <div className="flex justify-center py-8">
                                    <div className="size-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                                </div>
                            ) : profiles.length > 0 ? (
                                <div className="max-h-[300px] overflow-y-auto space-y-2 pr-2">
                                    {profiles.map(user => (
                                        <button
                                            key={user.id}
                                            onClick={() => handleUserSelect(user)}
                                            className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-all text-left group"
                                        >
                                            <div className="size-10 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 font-bold group-hover:bg-primary group-hover:text-slate-900 transition-colors">
                                                {user.full_name.charAt(0).toUpperCase()}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-bold text-slate-900 dark:text-white truncate">{user.full_name}</p>
                                                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{user.email}</p>
                                            </div>
                                            <span className="material-symbols-outlined text-slate-300 group-hover:text-primary">chevron_right</span>
                                        </button>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8 text-slate-500">
                                    <span className="material-symbols-outlined text-4xl mb-2 opacity-50">person_off</span>
                                    <p>Nenhum usuário encontrado.</p>
                                    {error && <p className="text-red-500 text-xs mt-2">{error}</p>}
                                </div>
                            )}
                        </div>
                    ) : (
                        <form onSubmit={handleSwitch} className="space-y-4 animate-in slide-in-from-right-10 duration-200">
                            <div className="flex items-center gap-3 mb-6 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-800">
                                <div className="size-10 rounded-full bg-primary flex items-center justify-center text-white font-bold shrink-0">
                                    {selectedUser?.full_name.charAt(0).toUpperCase()}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-bold text-slate-900 dark:text-white truncate">{selectedUser?.full_name}</p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{selectedUser?.email}</p>
                                </div>
                                <button type="button" onClick={() => setStep('list')} className="text-xs font-bold text-primary hover:underline">
                                    Trocar
                                </button>
                            </div>

                            <div className="space-y-1">
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Senha</label>
                                <input
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full h-12 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/50 outline-none"
                                    placeholder="Digite a senha..."
                                    autoFocus
                                />
                            </div>

                            {error && (
                                <div className="p-3 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-lg text-sm flex items-center gap-2">
                                    <span className="material-symbols-outlined text-sm">error</span>
                                    {error}
                                </div>
                            )}

                            <div className="pt-2">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full h-12 bg-primary text-slate-900 font-bold rounded-xl shadow-lg hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-70 flex items-center justify-center gap-2"
                                >
                                    {loading ? (
                                        <span className="material-symbols-outlined animate-spin">refresh</span>
                                    ) : (
                                        <>
                                            <span>Entrar</span>
                                            <span className="material-symbols-outlined">login</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SwitchUserModal;
