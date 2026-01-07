import React, { useState } from 'react';
import { supabase } from '../../supabase';

const SecuritySettings: React.FC = () => {
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const handleUpdatePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);

        if (newPassword !== confirmPassword) {
            setMessage({ type: 'error', text: 'As senhas não conferem.' });
            setLoading(false);
            return;
        }

        if (newPassword.length < 6) {
            setMessage({ type: 'error', text: 'A senha deve ter pelo menos 6 caracteres.' });
            setLoading(false);
            return;
        }

        try {
            const { error } = await supabase.auth.updateUser({ password: newPassword });
            if (error) throw error;
            setMessage({ type: 'success', text: 'Senha atualizada com sucesso!' });
            setNewPassword('');
            setConfirmPassword('');
        } catch (error: any) {
            setMessage({ type: 'error', text: error.message || 'Erro ao atualizar senha.' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <section className="bg-white dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm animate-in fade-in duration-300">
            <div className="flex items-center gap-2 mb-6">
                <span className="material-symbols-outlined text-slate-400">shield_lock</span>
                <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">Segurança da Conta</h3>
                    <p className="text-sm text-slate-500">Mantenha sua conta protegida.</p>
                </div>
            </div>

            {message && (
                <div className={`mb-4 p-3 rounded-lg text-sm font-medium ${message.type === 'success' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
                    {message.text}
                </div>
            )}

            <form onSubmit={handleUpdatePassword} className="space-y-6">
                <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary text-xl">lock</span>
                        Alterar Senha
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Nova Senha</label>
                            <input
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className="w-full h-10 rounded-lg border border-slate-200 dark:border-slate-800 bg-transparent px-3 text-sm dark:text-white focus:ring-2 focus:ring-primary/50 outline-none"
                                placeholder="Mínimo 6 caracteres"
                                autoComplete="new-password"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Confirmar Senha</label>
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full h-10 rounded-lg border border-slate-200 dark:border-slate-800 bg-transparent px-3 text-sm dark:text-white focus:ring-2 focus:ring-primary/50 outline-none"
                                placeholder="Repita a nova senha"
                                autoComplete="new-password"
                            />
                        </div>
                    </div>
                    <div className="flex justify-end pt-4">
                        <button
                            type="submit"
                            disabled={loading || !newPassword}
                            className="px-4 py-2 bg-primary text-slate-900 font-bold rounded-lg shadow-sm hover:bg-primary-dark transition-colors disabled:opacity-50 text-sm flex items-center gap-2"
                        >
                            {loading ? <span className="material-symbols-outlined animate-spin text-sm">rotate_right</span> : <span className="material-symbols-outlined text-sm">save</span>}
                            Atualizar Senha
                        </button>
                    </div>
                </div>

                <div className="border-t border-slate-100 dark:border-slate-800 pt-6">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary text-xl">verified_user</span>
                        Autenticação em Duas Etapas (2FA)
                    </h4>
                    <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-800">
                        <div className="flex items-center gap-3">
                            <div className="size-10 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 flex items-center justify-center">
                                <span className="material-symbols-outlined">smartphone</span>
                            </div>
                            <div>
                                <p className="font-bold text-slate-900 dark:text-white">Autenticador</p>
                                <p className="text-xs text-slate-500">Adicione uma camada extra de segurança.</p>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={() => alert('Funcionalidade em desenvolvimento!')}
                            className="px-3 py-1.5 bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold rounded-lg text-xs hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors"
                        >
                            Configurar
                        </button>
                    </div>
                </div>

                <div className="border-t border-slate-100 dark:border-slate-800 pt-6">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary text-xl">history</span>
                        Atividade Recente
                    </h4>
                    <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
                            <div className="flex items-center gap-2">
                                <span className="material-symbols-outlined text-green-500 text-sm">login</span>
                                <span className="text-slate-700 dark:text-slate-300">Login realizado com sucesso</span>
                            </div>
                            <span className="text-slate-400">Hoje, 09:23</span>
                        </div>
                        <div className="flex items-center justify-between text-xs p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
                            <div className="flex items-center gap-2">
                                <span className="material-symbols-outlined text-blue-500 text-sm">edit</span>
                                <span className="text-slate-700 dark:text-slate-300">Perfil atualizado</span>
                            </div>
                            <span className="text-slate-400">Ontem, 14:15</span>
                        </div>
                    </div>
                </div>
            </form>
        </section>
    );
};

export default SecuritySettings;
