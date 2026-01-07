import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabase';
import { User } from '@supabase/supabase-js';
import UserModal from '../UserModal';

const UserManagement: React.FC = () => {
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [profiles, setProfiles] = useState<any[]>([]);
    const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
    const [showUserModal, setShowUserModal] = useState(false);
    const [currentUser, setCurrentUser] = useState<User | null>(null);

    useEffect(() => {
        fetchCurrentUser();
        fetchProfiles();
    }, [showUserModal]);

    const fetchCurrentUser = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        setCurrentUser(user);
    };

    const fetchProfiles = async () => {
        const { data: profilesData } = await supabase
            .from('profiles')
            .select('*')
            .neq('role', 'client') // Filter out clients
            .order('full_name');

        if (profilesData) {
            setProfiles(profilesData);
        }
    };

    const handleResetPassword = async (email: string, name: string) => {
        if (confirm(`Deseja enviar um email de redefinição de senha para ${name}?`)) {
            setLoading(true);
            try {
                const { error } = await supabase.auth.resetPasswordForEmail(email, {
                    redirectTo: window.location.origin + '/update-password'
                });
                if (error) throw error;
                setMessage({ type: 'success', text: `Email de redefinição enviado para ${email}` });
            } catch (err: any) {
                setMessage({ type: 'error', text: 'Erro ao enviar email.' });
            } finally {
                setLoading(false);
                setActiveMenuId(null);
            }
        }
    };

    const handleDeleteUser = async (id: string, name: string) => {
        if (confirm(`Tem certeza que deseja excluir o usuário ${name}? Essa ação não pode ser desfeita.`)) {
            setLoading(true);
            try {
                const { error } = await supabase.rpc('delete_user_by_admin', {
                    target_user_id: id
                });

                if (error) throw error;

                setMessage({ type: 'success', text: 'Usuário excluído com sucesso.' });
                setProfiles(profiles.filter(p => p.id !== id));
            } catch (err: any) {
                console.error(err);
                setMessage({ type: 'error', text: err.message || 'Erro ao excluir usuário.' });
            } finally {
                setLoading(false);
            }
        }
    };

    return (
        <section className="bg-white dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm animate-in fade-in duration-300">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">Gerenciar Colaboradores</h3>
                    <p className="text-sm text-slate-500">Adicione e gerencie sua equipe.</p>
                </div>
                <button
                    onClick={() => setShowUserModal(true)}
                    className="p-2 bg-primary text-slate-900 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-primary-dark transition-colors"
                >
                    <span className="material-symbols-outlined text-xl">add</span>
                    Novo Colaborador
                </button>
            </div>

            {message && (
                <div className={`mb-4 p-3 rounded-lg text-sm font-medium ${message.type === 'success' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
                    {message.text}
                </div>
            )}

            <div className="space-y-4">
                {profiles.map((profile) => (
                    <div key={profile.id} className="relative flex items-center justify-between p-4 bg-white dark:bg-surface-dark rounded-xl border border-slate-100 dark:border-slate-800 hover:border-primary/30 transition-colors animate-in fade-in slide-in-from-bottom-2">
                        <div className="flex items-center gap-4">
                            <div className={`size-10 rounded-full flex items-center justify-center font-bold ${profile.role === 'admin'
                                ? 'bg-primary/20 text-primary'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                                }`}>
                                {profile.full_name ? profile.full_name.charAt(0).toUpperCase() : 'U'}
                            </div>
                            <div>
                                <p className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                    {profile.full_name || 'Usuário Sem Nome'}
                                    {profile.id === currentUser?.id && <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full">Você</span>}
                                </p>
                                <div className="flex items-center gap-2 text-xs text-slate-500">
                                    <span>{profile.email}</span>
                                    {profile.profession && (
                                        <>
                                            <span>•</span>
                                            <span>{profile.profession}</span>
                                        </>
                                    )}
                                    {profile.is_probation && (
                                        <span className="text-amber-600 bg-amber-50 dark:bg-amber-900/20 px-1.5 py-0.5 rounded">Em Teste</span>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <span className={`px-2 py-1 rounded-md text-xs font-bold ${profile.role === 'admin'
                                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                                }`}>
                                {profile.role === 'admin' ? 'Administrador' : 'Colaborador'}
                            </span>

                            <div className="relative">
                                <button
                                    onClick={() => setActiveMenuId(activeMenuId === profile.id ? null : profile.id)}
                                    className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-400 hover:text-primary transition-colors"
                                >
                                    <span className="material-symbols-outlined">more_vert</span>
                                </button>

                                {activeMenuId === profile.id && (
                                    <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-surface-dark rounded-xl shadow-xl border border-slate-100 dark:border-slate-800 z-10 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                                        <button
                                            onClick={() => handleResetPassword(profile.email, profile.full_name)}
                                            className="w-full text-left px-4 py-2.5 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-primary flex items-center gap-2"
                                        >
                                            <span className="material-symbols-outlined text-[18px]">lock_reset</span>
                                            Redefinir Senha
                                        </button>
                                        {profile.id !== currentUser?.id && (
                                            <button
                                                onClick={() => handleDeleteUser(profile.id, profile.full_name)}
                                                className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                                            >
                                                <span className="material-symbols-outlined text-[18px]">delete</span>
                                                Excluir Colaborador
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ))}

                {profiles.length === 0 && (
                    <div className="text-center py-12 text-slate-500">
                        Nenhum colaborador encontrado.
                    </div>
                )}
            </div>

            <UserModal
                isOpen={showUserModal}
                onClose={() => setShowUserModal(false)}
                onSuccess={() => {
                    setShowUserModal(false);
                    fetchProfiles(); // Refresh list on success
                }}
            />
        </section>
    );
};

export default UserManagement;
