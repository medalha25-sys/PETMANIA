import React, { useState } from 'react';
import { supabase } from '../supabase';

interface UserModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

const UserModal: React.FC<UserModalProps> = ({ isOpen, onClose, onSuccess }) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState<'admin' | 'employee'>('employee');
    const [cnhCategory, setCnhCategory] = useState('');
    const [phone, setPhone] = useState('');
    const [address, setAddress] = useState('');
    const [birthDate, setBirthDate] = useState('');

    // New Fields
    const [profession, setProfession] = useState('');
    const [admissionDate, setAdmissionDate] = useState('');
    const [isProbation, setIsProbation] = useState(false);

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const { data, error: signUpError } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        full_name: fullName,
                        role: role,
                        cnh_category: cnhCategory,
                        phone: phone,
                        address: address,
                        birth_date: birthDate,
                        profession: profession,
                        admission_date: admissionDate,
                        is_probation: isProbation
                    }
                }
            });

            if (signUpError) throw signUpError;

            // Create Profile in public table
            if (data.user) {
                const { error: profileError } = await supabase
                    .from('profiles')
                    .insert([{
                        id: data.user.id,
                        email: email,
                        full_name: fullName,
                        role: role,
                        profession: profession,
                        admission_date: admissionDate || null,
                        is_probation: isProbation,
                        phone: phone,
                        address: address,
                        birth_date: birthDate || null,
                        cnh_category: cnhCategory
                    }]);

                if (profileError) {
                    console.error('Erro ao criar perfil:', profileError);
                }
            }

            // Success
            onSuccess();
            onClose();
            // Reset form
            setFullName('');
            setEmail('');
            setPassword('');
            setRole('employee');
            setCnhCategory('');
            setPhone('');
            setAddress('');
            setBirthDate('');
            setProfession('');
            setAdmissionDate('');
            setIsProbation(false);

            alert('Colaborador cadastrado com sucesso! Verifique o email para confirmação se necessário.');

        } catch (err: any) {
            console.error(err);
            console.error(err);
            let errorMessage = 'Erro ao cadastrar usuário.';
            if (err.message === 'User already registered') {
                errorMessage = 'Este email já está cadastrado.';
            } else if (err.message.includes('Password')) {
                errorMessage = 'A senha deve ter pelo menos 6 caracteres.';
            } else if (err.message.includes('valid email')) {
                errorMessage = 'Por favor, insira um email válido.';
            }
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-800 w-full max-w-lg rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">Novo Colaborador</h3>
                    <button onClick={onClose} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors">
                        <span className="material-symbols-outlined text-slate-500">close</span>
                    </button>
                </div>

                <form onSubmit={handleRegister} className="p-6 space-y-4">
                    {error && (
                        <div className="p-3 bg-red-100 text-red-700 rounded-lg text-sm">
                            {error}
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Nome Completo</label>
                            <input
                                type="text"
                                required
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                className="w-full h-10 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 text-sm dark:text-white focus:ring-2 focus:ring-primary/50 outline-none"
                                placeholder="Nome do colaborador"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Profissão / Cargo</label>
                            <input
                                type="text"
                                value={profession}
                                onChange={(e) => setProfession(e.target.value)}
                                className="w-full h-10 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 text-sm dark:text-white focus:ring-2 focus:ring-primary/50 outline-none"
                                placeholder="Ex: Veterinário, Tosador"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Email</label>
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full h-10 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 text-sm dark:text-white focus:ring-2 focus:ring-primary/50 outline-none"
                                placeholder="email@exemplo.com"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Senha</label>
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full h-10 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 text-sm dark:text-white focus:ring-2 focus:ring-primary/50 outline-none"
                                placeholder="********"
                                minLength={6}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Função (Sistema)</label>
                            <select
                                value={role}
                                onChange={(e) => setRole(e.target.value as 'admin' | 'employee')}
                                className="w-full h-10 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 text-sm dark:text-white focus:ring-2 focus:ring-primary/50 outline-none"
                            >
                                <option value="employee">Funcionário (Acesso Limitado)</option>
                                <option value="admin">Administrador (Acesso Total)</option>
                            </select>
                        </div>
                        <div className="space-y-1">
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Data de Admissão</label>
                            <input
                                type="date"
                                value={admissionDate}
                                onChange={(e) => setAdmissionDate(e.target.value)}
                                className="w-full h-10 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 text-sm dark:text-white focus:ring-2 focus:ring-primary/50 outline-none"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Data de Nascimento</label>
                            <input
                                type="date"
                                required
                                value={birthDate}
                                onChange={(e) => setBirthDate(e.target.value)}
                                className="w-full h-10 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 text-sm dark:text-white focus:ring-2 focus:ring-primary/50 outline-none"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Telefone</label>
                            <input
                                type="text"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                className="w-full h-10 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 text-sm dark:text-white focus:ring-2 focus:ring-primary/50 outline-none"
                                placeholder="(00) 00000-0000"
                            />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Endereço Completo</label>
                        <input
                            type="text"
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                            className="w-full h-10 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 text-sm dark:text-white focus:ring-2 focus:ring-primary/50 outline-none"
                            placeholder="Rua, Número, Bairro, Cidade - UF"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Carteira de Habilitação (CNH)</label>
                            <select
                                value={cnhCategory}
                                onChange={(e) => setCnhCategory(e.target.value)}
                                className="w-full h-10 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 text-sm dark:text-white focus:ring-2 focus:ring-primary/50 outline-none"
                            >
                                <option value="">Não possui</option>
                                <option value="A">A - Moto</option>
                                <option value="B">B - Carro</option>
                                <option value="AB">AB - Moto e Carro</option>
                                <option value="C">C - Caminhão</option>
                                <option value="D">D - Ônibus</option>
                                <option value="E">E - Carreta</option>
                            </select>
                        </div>
                        <div className="flex items-center gap-3 pt-6">
                            <input
                                type="checkbox"
                                id="probation"
                                checked={isProbation}
                                onChange={(e) => setIsProbation(e.target.checked)}
                                className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary"
                            />
                            <label htmlFor="probation" className="text-sm font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
                                Em período de teste
                            </label>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-700 mt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-bold text-slate-600 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-6 py-2 bg-primary text-slate-900 font-bold rounded-xl shadow-lg hover:bg-primary-dark transition-all disabled:opacity-70 flex items-center gap-2"
                        >
                            {loading ? 'Cadastrando...' : 'Cadastrar Colaborador'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default UserModal;
