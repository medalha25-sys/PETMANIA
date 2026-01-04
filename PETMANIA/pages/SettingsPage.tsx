import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';
import { User } from '@supabase/supabase-js';
import UserModal from '../components/UserModal';

interface SettingsPageProps {
    darkMode: boolean;
    setDarkMode: (dark: boolean) => void;
}

const SettingsPage: React.FC<SettingsPageProps> = ({ darkMode, setDarkMode }) => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('geral'); // Default to general
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(false);

    // Profile State
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [birthDate, setBirthDate] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    // Company Settings State
    // Company Settings State
    const [companyName, setCompanyName] = useState('PetManager');
    const [companyLogo, setCompanyLogo] = useState<string | null>(null);
    const [companyId, setCompanyId] = useState<string | null>(null);
    const [companyCity, setCompanyCity] = useState('');
    const [companyState, setCompanyState] = useState('');
    const [companyCnpj, setCompanyCnpj] = useState('');
    const [companyStreet, setCompanyStreet] = useState('');
    const [companyNumber, setCompanyNumber] = useState('');
    const [companyNeighborhood, setCompanyNeighborhood] = useState('');
    const [companyPhone, setCompanyPhone] = useState('');
    const [companyWhatsapp, setCompanyWhatsapp] = useState('');
    const [companyEmail, setCompanyEmail] = useState('');

    // User Address State
    const [userCity, setUserCity] = useState('');
    const [userState, setUserState] = useState('');

    const [showUserModal, setShowUserModal] = useState(false);

    // User Management State
    const [profiles, setProfiles] = useState<any[]>([]);
    const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

    // Notification Preferences
    const [emailNotif, setEmailNotif] = useState(true);
    const [whatsappNotif, setWhatsappNotif] = useState(true);
    const [systemNotif, setSystemNotif] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            // Fetch User
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                setUser(user);
                setEmail(user.email || '');
                setFullName(user.user_metadata?.full_name || '');
                setBirthDate(user.user_metadata?.birth_date || '');
                setAvatarUrl(user.user_metadata?.avatar_url || null);
                setUserCity(user.user_metadata?.city || '');
                setUserState(user.user_metadata?.state || '');

                // Load Preferences
                const prefs = user.user_metadata?.preferences || {};
                if (prefs.email_notif !== undefined) setEmailNotif(prefs.email_notif);
                if (prefs.whatsapp_notif !== undefined) setWhatsappNotif(prefs.whatsapp_notif);
                if (prefs.system_notif !== undefined) setSystemNotif(prefs.system_notif);
            }

            // Fetch Company Info
            const { data: companyData } = await supabase
                .from('company_info')
                .select('id, name, logo_url, city, state, cnpj, street, number, neighborhood, phone, whatsapp, email')
                .single();

            if (companyData) {
                setCompanyId(companyData.id);
                setCompanyName(companyData.name);
                setCompanyLogo(companyData.logo_url);
                setCompanyCity(companyData.city || '');
                setCompanyState(companyData.state || '');
                setCompanyCnpj(companyData.cnpj || '');
                setCompanyStreet(companyData.street || '');
                setCompanyNumber(companyData.number || '');
                setCompanyNeighborhood(companyData.neighborhood || '');
                setCompanyPhone(companyData.phone || '');
                setCompanyWhatsapp(companyData.whatsapp || '');
                setCompanyEmail(companyData.email || '');
            }

            // Fetch Profiles
            const { data: profilesData } = await supabase
                .from('profiles')
                .select('*')
                .order('full_name');

            if (profilesData) {
                setProfiles(profilesData);
            }
        };
        fetchData();
    }, [showUserModal]); // Reload when modal closes (new user added)

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

            if (newPassword) {
                if (newPassword !== confirmPassword) {
                    throw new Error('As senhas não conferem.');
                }
                if (newPassword.length < 6) {
                    throw new Error('A senha deve ter pelo menos 6 caracteres.');
                }
                updates.password = newPassword;
            }

            const { error } = await supabase.auth.updateUser(updates);

            if (error) throw error;

            setMessage({ type: 'success', text: 'Perfil atualizado com sucesso!' });
            setNewPassword('');
            setConfirmPassword('');
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
                <div className="space-y-2">
                    <button
                        onClick={() => setActiveTab('geral')}
                        className={`w-full text-left px-4 py-3 rounded-xl font-bold text-sm transition-colors ${activeTab === 'geral' ? 'bg-primary/10 text-primary' : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'}`}
                    >
                        Geral
                    </button>
                    <button
                        onClick={() => setActiveTab('perfil')}
                        className={`w-full text-left px-4 py-3 rounded-xl font-bold text-sm transition-colors ${activeTab === 'perfil' ? 'bg-primary/10 text-primary' : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'}`}
                    >
                        Perfil
                    </button>
                    <button
                        onClick={() => setActiveTab('usuarios')}
                        className={`w-full text-left px-4 py-3 rounded-xl font-bold text-sm transition-colors ${activeTab === 'usuarios' ? 'bg-primary/10 text-primary' : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'}`}
                    >
                        Usuários
                    </button>
                    <button
                        onClick={() => setActiveTab('notificacoes')}
                        className={`w-full text-left px-4 py-3 rounded-xl font-bold text-sm transition-colors ${activeTab === 'notificacoes' ? 'bg-primary/10 text-primary' : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'}`}
                    >
                        Notificações
                    </button>
                    <button
                        onClick={() => setActiveTab('seguranca')}
                        className={`w-full text-left px-4 py-3 rounded-xl font-bold text-sm transition-colors ${activeTab === 'seguranca' ? 'bg-primary/10 text-primary' : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'}`}
                    >
                        Segurança
                    </button>
                    <button
                        onClick={() => setActiveTab('suporte')}
                        className={`w-full text-left px-4 py-3 rounded-xl font-bold text-sm transition-colors ${activeTab === 'suporte' ? 'bg-primary/10 text-primary' : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'}`}
                    >
                        Suporte
                    </button>
                </div>

                {/* Content Area */}
                <div className="md:col-span-2 space-y-6">
                    {message && (
                        <div className={`mb-4 p-3 rounded-lg text-sm font-medium ${message.type === 'success' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
                            {message.text}
                        </div>
                    )}

                    {activeTab === 'geral' && (
                        <section className="bg-white dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm animate-in fade-in duration-300 mb-6">
                            <div className="flex items-center gap-2 mb-4">
                                <span className="material-symbols-outlined text-slate-400">storefront</span>
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Dados da Empresa</h3>
                            </div>
                            <div className="space-y-4">
                                <div className="flex flex-col md:flex-row gap-6 items-start">
                                    <div className="relative group cursor-pointer flex-shrink-0">
                                        <div
                                            className="size-24 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center border-2 border-dashed border-slate-300 dark:border-slate-700 overflow-hidden"
                                            style={{ backgroundImage: companyLogo ? `url("${companyLogo}")` : undefined, backgroundSize: 'cover', backgroundPosition: 'center' }}
                                        >
                                            {!companyLogo && <span className="material-symbols-outlined text-slate-400 text-3xl">add_photo_alternate</span>}
                                        </div>
                                        <label className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-white">
                                            <span className="material-symbols-outlined text-sm">edit</span>
                                            <input
                                                type="file"
                                                className="hidden"
                                                accept="image/*"
                                                onChange={async (e) => {
                                                    if (!e.target.files || e.target.files.length === 0) return;
                                                    setLoading(true);
                                                    const file = e.target.files[0];
                                                    const fileExt = file.name.split('.').pop();
                                                    const fileName = `logo-${Date.now()}.${fileExt}`;

                                                    try {
                                                        const { error: uploadError } = await supabase.storage
                                                            .from('company-assets')
                                                            .upload(fileName, file);
                                                        if (uploadError) throw uploadError;

                                                        const { data } = supabase.storage.from('company-assets').getPublicUrl(fileName);
                                                        setCompanyLogo(data.publicUrl);

                                                        // Update DB
                                                        if (companyId) {
                                                            const { error: updateError } = await supabase
                                                                .from('company_info')
                                                                .update({ logo_url: data.publicUrl })
                                                                .eq('id', companyId);

                                                            if (updateError) throw updateError;
                                                        }

                                                        setMessage({ type: 'success', text: 'Logo atualizado!' });
                                                    } catch (err: any) {
                                                        console.error(err);
                                                        setMessage({ type: 'error', text: 'Erro ao enviar logo.' });
                                                    } finally {
                                                        setLoading(false);
                                                    }
                                                }}
                                            />
                                        </label>
                                        <div className="mt-1 text-xs text-center text-slate-500">1080x1080 px</div>
                                    </div>
                                    <div className="flex-1 space-y-4 w-full">
                                        <div>
                                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Nome do Petshop</label>
                                            <input
                                                type="text"
                                                value={companyName}
                                                onChange={(e) => setCompanyName(e.target.value)}
                                                className="w-full h-10 rounded-lg border border-slate-200 dark:border-slate-800 bg-transparent px-3 text-sm dark:text-white focus:ring-2 focus:ring-primary/50 outline-none mt-1"
                                                placeholder="Nome da sua empresa"
                                            />
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">CNPJ</label>
                                                <input
                                                    type="text"
                                                    value={companyCnpj}
                                                    onChange={(e) => setCompanyCnpj(e.target.value)}
                                                    className="w-full h-10 rounded-lg border border-slate-200 dark:border-slate-800 bg-transparent px-3 text-sm dark:text-white focus:ring-2 focus:ring-primary/50 outline-none mt-1"
                                                    placeholder="00.000.000/0000-00"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Email da Empresa</label>
                                                <input
                                                    type="email"
                                                    value={companyEmail}
                                                    onChange={(e) => setCompanyEmail(e.target.value)}
                                                    className="w-full h-10 rounded-lg border border-slate-200 dark:border-slate-800 bg-transparent px-3 text-sm dark:text-white focus:ring-2 focus:ring-primary/50 outline-none mt-1"
                                                    placeholder="contato@empresa.com"
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-[2fr_1fr] gap-4">
                                            <div>
                                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Rua / Logradouro</label>
                                                <input
                                                    type="text"
                                                    value={companyStreet}
                                                    onChange={(e) => setCompanyStreet(e.target.value)}
                                                    className="w-full h-10 rounded-lg border border-slate-200 dark:border-slate-800 bg-transparent px-3 text-sm dark:text-white focus:ring-2 focus:ring-primary/50 outline-none mt-1"
                                                    placeholder="Nome da rua"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Número</label>
                                                <input
                                                    type="text"
                                                    value={companyNumber}
                                                    onChange={(e) => setCompanyNumber(e.target.value)}
                                                    className="w-full h-10 rounded-lg border border-slate-200 dark:border-slate-800 bg-transparent px-3 text-sm dark:text-white focus:ring-2 focus:ring-primary/50 outline-none mt-1"
                                                    placeholder="Nº"
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Bairro</label>
                                            <input
                                                type="text"
                                                value={companyNeighborhood}
                                                onChange={(e) => setCompanyNeighborhood(e.target.value)}
                                                className="w-full h-10 rounded-lg border border-slate-200 dark:border-slate-800 bg-transparent px-3 text-sm dark:text-white focus:ring-2 focus:ring-primary/50 outline-none mt-1"
                                                placeholder="Bairro"
                                            />
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Telefone</label>
                                                <input
                                                    type="text"
                                                    value={companyPhone}
                                                    onChange={(e) => setCompanyPhone(e.target.value)}
                                                    className="w-full h-10 rounded-lg border border-slate-200 dark:border-slate-800 bg-transparent px-3 text-sm dark:text-white focus:ring-2 focus:ring-primary/50 outline-none mt-1"
                                                    placeholder="(00) 0000-0000"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">WhatsApp</label>
                                                <input
                                                    type="text"
                                                    value={companyWhatsapp}
                                                    onChange={(e) => setCompanyWhatsapp(e.target.value)}
                                                    className="w-full h-10 rounded-lg border border-slate-200 dark:border-slate-800 bg-transparent px-3 text-sm dark:text-white focus:ring-2 focus:ring-primary/50 outline-none mt-1"
                                                    placeholder="(00) 90000-0000"
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Cidade</label>
                                                <input
                                                    type="text"
                                                    value={companyCity}
                                                    onChange={(e) => setCompanyCity(e.target.value)}
                                                    className="w-full h-10 rounded-lg border border-slate-200 dark:border-slate-800 bg-transparent px-3 text-sm dark:text-white focus:ring-2 focus:ring-primary/50 outline-none mt-1"
                                                    placeholder="Cidade"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Estado (UF)</label>
                                                <input
                                                    type="text"
                                                    value={companyState}
                                                    onChange={(e) => setCompanyState(e.target.value)}
                                                    className="w-full h-10 rounded-lg border border-slate-200 dark:border-slate-800 bg-transparent px-3 text-sm dark:text-white focus:ring-2 focus:ring-primary/50 outline-none mt-1"
                                                    placeholder="UF"
                                                    maxLength={2}
                                                />
                                            </div>
                                        </div>

                                        <div className="flex justify-end">
                                            <button
                                                onClick={async () => {
                                                    setLoading(true);
                                                    try {
                                                        if (!companyId) throw new Error('Company ID not found');
                                                        const { error } = await supabase
                                                            .from('company_info')
                                                            .update({
                                                                name: companyName,
                                                                city: companyCity,
                                                                state: companyState,
                                                                cnpj: companyCnpj,
                                                                street: companyStreet,
                                                                number: companyNumber,
                                                                neighborhood: companyNeighborhood,
                                                                phone: companyPhone,
                                                                whatsapp: companyWhatsapp,
                                                                email: companyEmail
                                                            })
                                                            .eq('id', companyId);

                                                        if (error) throw error;
                                                        setMessage({ type: 'success', text: 'Dados da empresa atualizados!' });
                                                    } catch (err: any) {
                                                        console.error(err);
                                                        setMessage({ type: 'error', text: 'Erro ao atualizar dados.' });
                                                    } finally {
                                                        setLoading(false);
                                                    }
                                                }}
                                                disabled={loading}
                                                className="px-6 py-2 bg-primary text-slate-900 font-bold rounded-lg text-sm hover:bg-primary-dark transition-colors disabled:opacity-70"
                                            >
                                                Salvar Alterações
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </section>
                    )}

                    {/* Theme Section (Geral) */}
                    {activeTab === 'geral' && (
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
                    )}

                    {/* Profile Section */}
                    {activeTab === 'perfil' && (
                        <section className="bg-white dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm animate-in fade-in duration-300">
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">Perfil do Usuário</h3>
                                    <p className="text-sm text-slate-500">Gerencie suas informações pessoais.</p>
                                </div>
                                <span className="material-symbols-outlined text-slate-400">person</span>
                            </div>

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

                                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 mt-4">
                                    <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-3">Alterar Senha</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Nova Senha</label>
                                            <input
                                                type="password"
                                                value={newPassword}
                                                onChange={(e) => setNewPassword(e.target.value)}
                                                className="w-full h-10 rounded-lg border border-slate-200 dark:border-slate-800 bg-transparent px-3 text-sm dark:text-white focus:ring-2 focus:ring-primary/50 outline-none"
                                                placeholder="Mínimo 6 caracteres"
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
                                            />
                                        </div>
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
                    )}

                    {/* Users Section */}
                    {activeTab === 'usuarios' && (
                        <section className="bg-white dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm animate-in fade-in duration-300">
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">Gerenciar Usuários</h3>
                                    <p className="text-sm text-slate-500">Adicione e gerencie permissões de acesso.</p>
                                </div>
                                <button
                                    onClick={() => setShowUserModal(true)}
                                    className="p-2 bg-primary text-slate-900 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-primary-dark transition-colors"
                                >
                                    <span className="material-symbols-outlined text-xl">add</span>
                                    Novo Usuário
                                </button>
                            </div>

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
                                                    {profile.id === user?.id && <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full">Você</span>}
                                                </p>
                                                <p className="text-xs text-slate-500">{profile.email}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <span className={`px-2 py-1 rounded-md text-xs font-bold ${profile.role === 'admin'
                                                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                                : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                                                }`}>
                                                {profile.role === 'admin' ? 'Administrador' : 'Funcionário'}
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
                                                            onClick={async () => {
                                                                if (confirm(`Deseja enviar um email de redefinição de senha para ${profile.full_name}?`)) {
                                                                    setLoading(true);
                                                                    try {
                                                                        const { error } = await supabase.auth.resetPasswordForEmail(profile.email, {
                                                                            redirectTo: window.location.origin + '/update-password'
                                                                        });
                                                                        if (error) throw error;
                                                                        setMessage({ type: 'success', text: `Email de redefinição enviado para ${profile.email}` });
                                                                    } catch (err: any) {
                                                                        setMessage({ type: 'error', text: 'Erro ao enviar email.' });
                                                                    } finally {
                                                                        setLoading(false);
                                                                        setActiveMenuId(null);
                                                                    }
                                                                }
                                                            }}
                                                            className="w-full text-left px-4 py-2.5 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-primary flex items-center gap-2"
                                                        >
                                                            <span className="material-symbols-outlined text-[18px]">lock_reset</span>
                                                            Redefinir Senha
                                                        </button>
                                                        {profile.id !== user?.id && (
                                                            <button
                                                                onClick={() => {
                                                                    // Delete logic would go here (requires Edge Function usually for auth.users)
                                                                    alert('Para excluir o usuário, é necessário acesso administrativo ao Auth.');
                                                                }}
                                                                className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                                                            >
                                                                <span className="material-symbols-outlined text-[18px]">delete</span>
                                                                Excluir Usuário
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
                                        Nenhum usuário encontrado.
                                    </div>
                                )}
                            </div>

                            <UserModal
                                isOpen={showUserModal}
                                onClose={() => setShowUserModal(false)}
                                onSuccess={() => {
                                    setShowUserModal(false);
                                }}
                            />
                        </section>
                    )}

                    {/* Notifications Section */}
                    {activeTab === 'notificacoes' && (
                        <section className="bg-white dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm animate-in fade-in duration-300">
                            <div className="flex items-center gap-2 mb-6">
                                <span className="material-symbols-outlined text-slate-400">notifications</span>
                                <div>
                                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">Preferências de Notificação</h3>
                                    <p className="text-sm text-slate-500">Escolha como você deseja receber os alertas.</p>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-800">
                                    <div className="flex items-center gap-3">
                                        <div className="size-10 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                                            <span className="material-symbols-outlined">mail</span>
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-900 dark:text-white">Notificações por Email</p>
                                            <p className="text-xs text-slate-500">Receba resumos diários e alertas de segurança.</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setEmailNotif(!emailNotif)}
                                        className={`w-12 h-7 flex items-center rounded-full transition-colors ${emailNotif ? 'bg-primary' : 'bg-slate-300 dark:bg-slate-700'}`}
                                    >
                                        <div className={`size-5 bg-white rounded-full shadow-md transform transition-transform ${emailNotif ? 'translate-x-6' : 'translate-x-1'}`} />
                                    </button>
                                </div>

                                <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-800">
                                    <div className="flex items-center gap-3">
                                        <div className="size-10 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 flex items-center justify-center">
                                            <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current" xmlns="http://www.w3.org/2000/svg">
                                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-900 dark:text-white">Notificações por WhatsApp</p>
                                            <p className="text-xs text-slate-500">Receba lembretes de agenda e avisos importantes.</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setWhatsappNotif(!whatsappNotif)}
                                        className={`w-12 h-7 flex items-center rounded-full transition-colors ${whatsappNotif ? 'bg-primary' : 'bg-slate-300 dark:bg-slate-700'}`}
                                    >
                                        <div className={`size-5 bg-white rounded-full shadow-md transform transition-transform ${whatsappNotif ? 'translate-x-6' : 'translate-x-1'}`} />
                                    </button>
                                </div>

                                <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-800">
                                    <div className="flex items-center gap-3">
                                        <div className="size-10 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                                            <span className="material-symbols-outlined">desktop_windows</span>
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-900 dark:text-white">Alertas do Sistema</p>
                                            <p className="text-xs text-slate-500">Avisos de estoque baixo e novos agendamentos.</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setSystemNotif(!systemNotif)}
                                        className={`w-12 h-7 flex items-center rounded-full transition-colors ${systemNotif ? 'bg-primary' : 'bg-slate-300 dark:bg-slate-700'}`}
                                    >
                                        <div className={`size-5 bg-white rounded-full shadow-md transform transition-transform ${systemNotif ? 'translate-x-6' : 'translate-x-1'}`} />
                                    </button>
                                </div>
                            </div>

                            <div className="flex justify-end pt-6">
                                <button
                                    onClick={async () => {
                                        setLoading(true);
                                        try {
                                            const { error } = await supabase.auth.updateUser({
                                                data: {
                                                    preferences: {
                                                        email_notif: emailNotif,
                                                        whatsapp_notif: whatsappNotif,
                                                        system_notif: systemNotif
                                                    }
                                                }
                                            });

                                            if (error) throw error;
                                            setMessage({ type: 'success', text: 'Preferências salvas com sucesso!' });
                                        } catch (err: any) {
                                            console.error(err);
                                            setMessage({ type: 'error', text: 'Erro ao salvar preferências.' });
                                        } finally {
                                            setLoading(false);
                                        }
                                    }}
                                    disabled={loading}
                                    className="px-6 py-2 bg-primary text-slate-900 font-bold rounded-lg text-sm hover:bg-primary-dark transition-colors disabled:opacity-70 flex items-center gap-2"
                                >
                                    {loading ? <span className="material-symbols-outlined animate-spin text-sm">rotate_right</span> : null}
                                    Salvar Preferências
                                </button>
                            </div>
                        </section>
                    )}

                    {/* System Info (Also under Geral for now or its own tab) */}
                    {/* Security Section */}
                    {activeTab === 'seguranca' && (
                        <section className="bg-white dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm animate-in fade-in duration-300">
                            <div className="flex items-center gap-2 mb-6">
                                <span className="material-symbols-outlined text-slate-400">shield_lock</span>
                                <div>
                                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">Segurança da Conta</h3>
                                    <p className="text-sm text-slate-500">Mantenha sua conta protegida.</p>
                                </div>
                            </div>

                            <form onSubmit={handleUpdateProfile} className="space-y-6">
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
                    )}

                    {/* Support Section */}
                    {activeTab === 'suporte' && (
                        <section className="bg-white dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm animate-in fade-in duration-300">
                            <div className="flex items-center gap-2 mb-6">
                                <span className="material-symbols-outlined text-slate-400">headset_mic</span>
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Suporte Técnico</h3>
                            </div>

                            <div className="flex flex-col items-center justify-center p-8 border border-dashed border-slate-200 dark:border-slate-700 rounded-2xl bg-slate-50 dark:bg-slate-900/50">
                                <div className="mb-4 relative">
                                    <div className="size-24 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center shadow-lg shadow-green-500/20">
                                        <svg viewBox="0 0 24 24" className="w-12 h-12 fill-current" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                                        </svg>
                                    </div>
                                    <div className="absolute -bottom-2 -right-2 bg-slate-900 text-white text-[10px] font-bold px-2 py-0.5 rounded-full ring-2 ring-white dark:ring-surface-dark">
                                        Online
                                    </div>
                                </div>

                                <h4 className="text-2xl font-black text-slate-900 dark:text-white mb-1">Wesley Jesus</h4>
                                <p className="text-slate-500 text-sm mb-6 font-medium">Suporte Técnico Especializado</p>

                                <p className="text-slate-500 text-center max-w-sm mb-8">
                                    Encontrou algum problema ou tem alguma dúvida? Entre em contato diretamente pelo WhatsApp para atendimento rápido.
                                </p>

                                <a
                                    href="https://wa.me/5538984257511"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-3 px-8 py-4 bg-[#25D366] hover:bg-[#128C7E] text-white rounded-xl font-bold text-lg transition-all transform hover:scale-105 active:scale-95 shadow-lg shadow-green-500/30"
                                >
                                    <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                                    </svg>
                                    Falar com Wesley no WhatsApp
                                </a>
                                <p className="mt-4 text-xs text-slate-400 font-mono select-all bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-md">
                                    +55 38 98425-7511
                                </p>
                            </div>
                        </section>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SettingsPage;
