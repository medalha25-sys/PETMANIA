import React, { useState } from 'react';
import { supabase } from '../supabase';
import { useNavigate, useLocation } from 'react-router-dom';

interface AuthProps {
    onGuestLogin?: () => void;
}

const Auth: React.FC<AuthProps> = ({ onGuestLogin }) => {
    const navigate = useNavigate();
    const location = useLocation();

    // Check if we were redirected with a request to register
    const initialIsRegister = location.state?.isRegister || false;

    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isRegister, setIsRegister] = useState(initialIsRegister);
    const [isRecovery, setIsRecovery] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [logoUrl, setLogoUrl] = useState<string | null>(null);
    const [companyName, setCompanyName] = useState('PetMania');

    React.useEffect(() => {
        const fetchCompanyInfo = async () => {
            const { data } = await supabase
                .from('company_info')
                .select('logo_url, name')
                .single();
            if (data) {
                if (data.logo_url) setLogoUrl(data.logo_url);
                if (data.name) setCompanyName(data.name);
            }
        };
        fetchCompanyInfo();
    }, []);

    const handleGoogleLogin = async () => {
        try {
            setLoading(true);
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    queryParams: {
                        access_type: 'offline',
                        prompt: 'consent',
                    },
                    redirectTo: window.location.origin,
                },
            });
            if (error) throw error;
        } catch (err: any) {
            console.error("Google Login Error:", err);
            let msg = 'Erro ao conectar com Google.';
            if (err.message?.includes('provider is not enabled')) {
                msg = 'O login com Google não está ativado no sistema (Supabase).';
            } else if (err.message?.includes('configuration')) {
                msg = 'Erro de configuração do Google. Verifique o painel.';
            }
            setError(msg);
            setLoading(false);
        }
    };

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            if (isRecovery) {
                const { error } = await supabase.auth.resetPasswordForEmail(email, {
                    redirectTo: window.location.origin + '/update-password',
                });
                if (error) throw error;
                alert('Link de recuperação enviado para o seu e-mail!');
                setIsRecovery(false);
            } else {
                let authEmail = email;

                if (!isRegister && !email.includes('@')) {
                    // Try to resolve name to email
                    const { data, error: profileError } = await supabase
                        .from('profiles')
                        .select('email')
                        .ilike('full_name', email) // Case insensitive match
                        .single();

                    if (profileError || !data) {
                        throw new Error('Usuário não encontrado. Tente usar o e-mail ou verifique o nome.');
                    }
                    authEmail = data.email;
                }

                if (isRegister) {
                    const { error } = await supabase.auth.signUp({ email: authEmail, password });
                    if (error) throw error;
                    alert('Confirme seu e-mail para completar o cadastro!');
                } else {
                    const { error } = await supabase.auth.signInWithPassword({ email: authEmail, password });
                    if (error) throw error;
                    navigate('/');
                }
            }
        } catch (err: any) {
            console.error(err);
            let errorMessage = 'Erro na autenticação';
            if (err.message === 'Invalid login credentials') {
                errorMessage = 'Email ou senha incorretos.';
            } else if (err.message.includes('Email not confirmed')) {
                errorMessage = 'Por favor, confirme seu email antes de entrar.';
            } else if (err.message.includes('User already registered')) {
                errorMessage = 'Este email já está registrado. Tente fazer login.';
            }
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark p-4">
            <div className="w-full max-w-md">
                <div className="bg-white dark:bg-surface-dark rounded-3xl shadow-2xl p-8 border border-gray-100 dark:border-gray-800 transition-all">
                    <div className="flex flex-col items-center mb-8">
                        <div className="size-20 bg-transparent rounded-2xl flex items-center justify-center mb-4 overflow-hidden">
                            {logoUrl ? (
                                <img src={logoUrl} alt="Logo" className="w-full h-full object-contain" />
                            ) : (
                                <div className="size-16 bg-primary rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20">
                                    <span className="material-symbols-outlined text-3xl text-slate-900">pets</span>
                                </div>
                            )}
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tight text-center">{companyName}</h1>
                        <p className="text-slate-500 dark:text-slate-400 mt-3 text-center text-sm font-medium">
                            {isRecovery
                                ? 'Recupere sua senha'
                                : isRegister
                                    ? 'Crie sua conta para gerenciar seu petshop'
                                    : 'Bem-vindo de volta! Acesse sua conta'}
                        </p>
                    </div>

                    {error && (
                        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/50 rounded-xl flex items-center gap-3 text-red-600 dark:text-red-400 text-sm">
                            <span className="material-symbols-outlined text-[18px]">error</span>
                            <p>{error}</p>
                        </div>
                    )}

                    <form onSubmit={handleAuth} className="space-y-4">
                        <div className="space-y-1">
                            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">
                                {isRecovery ? 'E-mail cadastrado' : 'E-mail ou Nome'}
                            </label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-400 text-[20px]">
                                    {isRecovery ? 'mail' : 'person'}
                                </span>
                                <input
                                    type={isRecovery ? 'email' : 'text'}
                                    required
                                    placeholder={isRecovery ? "seu@email.com" : "seu@email.com ou seu nome"}
                                    className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all dark:text-white"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                        </div>

                        {!isRecovery && (
                            <div className="space-y-1">
                                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">Senha</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-400 text-[20px]">lock</span>
                                    <input
                                        type="password"
                                        required
                                        placeholder="••••••••"
                                        className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all dark:text-white"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                    />
                                </div>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 bg-primary hover:bg-primary-dark text-slate-900 font-bold rounded-xl shadow-lg shadow-primary/30 transform active:scale-[0.98] transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <span className="size-5 border-2 border-slate-900/30 border-t-slate-900 rounded-full animate-spin"></span>
                            ) : (
                                <>
                                    <span className="material-symbols-outlined text-[20px]">
                                        {isRecovery ? 'send' : isRegister ? 'person_add' : 'login'}
                                    </span>
                                    {isRecovery ? 'Enviar Link' : isRegister ? 'Cadastrar' : 'Entrar'}
                                </>
                            )}
                        </button>

                        {!isRecovery && !isRegister && (
                            <>
                                <div className="relative flex items-center py-2">
                                    <div className="flex-grow border-t border-slate-200 dark:border-slate-700"></div>
                                    <span className="flex-shrink-0 mx-4 text-xs font-bold text-slate-400 uppercase">ou continue com</span>
                                    <div className="flex-grow border-t border-slate-200 dark:border-slate-700"></div>
                                </div>

                                <button
                                    type="button"
                                    onClick={handleGoogleLogin}
                                    disabled={loading}
                                    className="w-full py-3 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-all transform active:scale-[0.98] flex items-center justify-center gap-2"
                                >
                                    <img
                                        src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                                        alt="Google"
                                        className="w-5 h-5"
                                    />
                                    Entrar com Google
                                </button>
                            </>
                        )}

                        {!isRecovery && !isRegister && onGuestLogin && (
                            <button
                                type="button"
                                onClick={onGuestLogin}
                                className="w-full py-3 mt-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-all"
                            >
                                Entrar como Visitante
                            </button>
                        )}
                    </form>

                    <div className="mt-2 pt-2 border-t border-gray-100 dark:border-gray-800 text-center space-y-1">
                        {!isRecovery && (
                            <button
                                onClick={() => setIsRegister(!isRegister)}
                                className="text-sm font-medium text-primary-dark dark:text-primary hover:underline block w-full"
                            >
                                {isRegister ? 'Já tem uma conta? Entre aqui' : 'Não tem uma conta? Cadastre-se'}
                            </button>
                        )}

                        <button
                            onClick={() => {
                                setIsRecovery(!isRecovery);
                                setIsRegister(false);
                                setError(null);
                            }}
                            className="text-sm font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:underline block w-full"
                        >
                            {isRecovery ? 'Voltar para o Login' : 'Esqueceu a senha?'}
                        </button>
                    </div>

                    <div className="mt-6 pt-4 border-t border-gray-50 dark:border-gray-800/50">
                        <p className="text-center text-[10px] text-slate-400 dark:text-slate-600">
                            PetMania v2.4.0 • Sistema Seguro
                        </p>
                        <p className="mt-0.5 text-center text-[10px] text-slate-300 dark:text-slate-600 font-medium">
                            Desenvolvido por: Wesley Luis De Jesus
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Auth;
