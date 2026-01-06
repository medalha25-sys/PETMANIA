import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';

interface OpenRegisterModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export const OpenRegisterModal: React.FC<OpenRegisterModalProps> = ({ isOpen, onClose, onSuccess }) => {
    const [amount, setAmount] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleOpen = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            // 1. Verify Password
            const { data: { user } } = await supabase.auth.getUser();
            if (!user || !user.email) throw new Error('Usuário não autenticado.');

            const { error: authError } = await supabase.auth.signInWithPassword({
                email: user.email,
                password: password
            });

            if (authError) {
                throw new Error('Senha incorreta.');
            }

            // 2. Open Register
            const { error: dbError } = await supabase.from('daily_cash_registers').insert({
                initial_amount: parseFloat(amount),
                opened_by: user.id,
                status: 'open'
            });

            if (dbError) throw dbError;

            onSuccess();
            onClose();
        } catch (err: any) {
            setError(err.message || 'Erro ao abrir o caixa.');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-surface-dark w-full max-w-md rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary">lock_open</span>
                        Abrir Caixa
                    </h3>
                </div>
                <form onSubmit={handleOpen} className="p-6 space-y-4">
                    {error && (
                        <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-lg flex items-center gap-2">
                            <span className="material-symbols-outlined text-sm">error</span>
                            {error}
                        </div>
                    )}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Fundo de Troco Inicial (R$)</label>
                        <input
                            type="number"
                            step="0.01"
                            required
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            className="w-full h-11 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent px-4 dark:text-white focus:ring-2 focus:ring-primary/50 outline-none font-bold text-lg"
                            placeholder="0.00"
                            autoFocus
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Sua Senha (Confirmação)</label>
                        <input
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full h-11 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent px-4 dark:text-white focus:ring-2 focus:ring-primary/50 outline-none"
                            placeholder="Digite sua senha..."
                        />
                    </div>
                    <div className="flex justify-end gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-bold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-6 py-2 bg-primary hover:bg-primary-dark text-slate-900 font-bold rounded-xl shadow-lg shadow-primary/20 transition-all flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Verificando...' : 'Confirmar Abertura'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

interface CloseRegisterModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    registerId: string;
    initialAmount: number;
    totalIncome: number;
    totalExpense: number;
}

export const CloseRegisterModal: React.FC<CloseRegisterModalProps> = ({
    isOpen, onClose, onSuccess, registerId, initialAmount, totalIncome, totalExpense
}) => {
    const [finalAmount, setFinalAmount] = useState('');
    const [notes, setNotes] = useState('');
    const [loading, setLoading] = useState(false);

    const expectedAmount = initialAmount + totalIncome - totalExpense;
    const difference = finalAmount ? parseFloat(finalAmount) - expectedAmount : 0 - expectedAmount;
    const isMatched = Math.abs(difference) < 0.01;

    const handleClose = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Usuário não autenticado.');

            const { error } = await supabase.from('daily_cash_registers').update({
                final_amount: parseFloat(finalAmount),
                expected_amount: expectedAmount,
                closed_at: new Date().toISOString(),
                closed_by: user.id,
                status: 'closed',
                notes: notes
            }).eq('id', registerId);

            if (error) throw error;

            onSuccess();
            onClose();
        } catch (error) {
            console.error(error);
            alert('Erro ao fechar caixa.');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-surface-dark w-full max-w-lg rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <span className="material-symbols-outlined text-red-500">lock</span>
                        Fechar Caixa
                    </h3>
                </div>
                <form onSubmit={handleClose} className="p-6 space-y-6">
                    <div className="grid grid-cols-3 gap-4 text-center">
                        <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                            <span className="text-xs text-slate-500 uppercase font-bold block mb-1">Inicial</span>
                            <span className="text-sm font-bold text-slate-900 dark:text-white">
                                {initialAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            </span>
                        </div>
                        <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-xl">
                            <span className="text-xs text-green-600 dark:text-green-400 uppercase font-bold block mb-1">Entradas</span>
                            <span className="text-sm font-bold text-green-700 dark:text-green-300">
                                + {totalIncome.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            </span>
                        </div>
                        <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-xl">
                            <span className="text-xs text-red-600 dark:text-red-400 uppercase font-bold block mb-1">Saídas</span>
                            <span className="text-sm font-bold text-red-700 dark:text-red-300">
                                - {totalExpense.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            </span>
                        </div>
                    </div>

                    <div className="p-4 bg-slate-100 dark:bg-slate-800/50 rounded-xl flex justify-between items-center">
                        <span className="font-bold text-slate-700 dark:text-slate-300">Valor Esperado em Caixa:</span>
                        <span className="text-xl font-black text-slate-900 dark:text-white">
                            {expectedAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </span>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Valor Contado em Dinheiro (R$)</label>
                        <input
                            type="number"
                            step="0.01"
                            required
                            value={finalAmount}
                            onChange={(e) => setFinalAmount(e.target.value)}
                            className="w-full h-14 rounded-xl border-2 border-slate-200 dark:border-slate-800 bg-transparent px-4 dark:text-white focus:ring-4 focus:ring-primary/20 focus:border-primary outline-none font-black text-2xl text-right"
                            placeholder="0.00"
                            autoFocus
                        />
                    </div>

                    {finalAmount && (
                        <div className={`p-4 rounded-xl border ${isMatched
                            ? 'bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-300'
                            : 'bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-900/20 dark:border-yellow-800 dark:text-yellow-300'
                            }`}>
                            <div className="flex justify-between items-center">
                                <span className="font-bold text-sm">Diferença (Quebra de Caixa):</span>
                                <span className="font-black text-lg">
                                    {difference.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                </span>
                            </div>
                            {!isMatched && (
                                <p className="text-xs mt-1 opacity-80">
                                    {difference > 0 ? 'Sobrando dinheiro no caixa.' : 'Faltando dinheiro no caixa.'}
                                </p>
                            )}
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Observações de Fechamento</label>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            className="w-full h-20 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent p-3 dark:text-white focus:ring-2 focus:ring-primary/50 outline-none resize-none"
                            placeholder="Justificativa de divergências, etc..."
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-bold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className={`px-6 py-2 font-bold rounded-xl shadow-lg transition-all flex items-center gap-2 text-white ${difference < 0 ? 'bg-red-500 hover:bg-red-600 shadow-red-500/20' : 'bg-green-600 hover:bg-green-700 shadow-green-600/20'}`}
                        >
                            {loading ? 'Fechando...' : 'Confirmar Fechamento'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

interface RegisterClosedModalProps {
    isOpen: boolean;
    onClose: () => void;
    onOpenRegister: () => void;
}

export const RegisterClosedModal: React.FC<RegisterClosedModalProps> = ({ isOpen, onClose, onOpenRegister }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-surface-dark w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-200 dark:border-slate-700">
                <div className="p-6 flex flex-col items-center text-center gap-4">
                    <div className="size-16 rounded-full bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center text-amber-500 animate-bounce">
                        <span className="material-symbols-outlined text-3xl">lock</span>
                    </div>
                    <div className="space-y-2">
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white">Caixa Fechado</h3>
                        <p className="text-slate-500 dark:text-slate-400 text-sm">
                            Para registrar uma nova venda, é necessário abrir o caixa do dia primeiro.
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3 w-full mt-2">
                        <button
                            onClick={onClose}
                            className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold text-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={() => {
                                onClose();
                                onOpenRegister();
                            }}
                            className="px-4 py-2.5 rounded-xl bg-green-500 hover:bg-green-600 text-white font-bold text-sm shadow-lg shadow-green-500/20 transition-all flex items-center justify-center gap-2"
                        >
                            <span className="material-symbols-outlined text-lg">lock_open</span>
                            Abrir Caixa
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

