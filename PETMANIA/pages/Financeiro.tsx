import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';
import ReceiptModal from '../components/ReceiptModal';
import { OpenRegisterModal, CloseRegisterModal } from '../components/CashRegisterModals';

const Financeiro: React.FC = () => {
    const navigate = useNavigate();
    const [companyName, setCompanyName] = useState('PetManager');
    const [companyLogo, setCompanyLogo] = useState<string | null>(null);
    const [companyCity, setCompanyCity] = useState<string>('');
    const [companyDetails, setCompanyDetails] = useState<any>(null);
    const [transactions, setTransactions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Filters
    const [startDate, setStartDate] = useState(() => {
        const date = new Date();
        return new Date(date.getFullYear(), date.getMonth(), 1).toISOString().split('T')[0];
    });
    const [endDate, setEndDate] = useState(() => {
        const date = new Date();
        return new Date(date.getFullYear(), date.getMonth() + 1, 0).toISOString().split('T')[0];
    });

    // Modal State
    const [showModal, setShowModal] = useState(false);
    const [modalType, setModalType] = useState<'income' | 'expense'>('income');
    const [formDesc, setFormDesc] = useState('');
    const [formAmount, setFormAmount] = useState('');
    const [formCategory, setFormCategory] = useState('');
    const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);
    const [saving, setSaving] = useState(false);

    // Receipt Modal State
    const [showReceiptModal, setShowReceiptModal] = useState(false);
    const [receiptData, setReceiptData] = useState<any>(undefined);

    // Cash Register State
    const [cashRegister, setCashRegister] = useState<any>(null);
    const [showOpenRegister, setShowOpenRegister] = useState(false);
    const [showCloseRegister, setShowCloseRegister] = useState(false);

    // Form State additions
    const [formPaymentMethod, setFormPaymentMethod] = useState('Dinheiro');

    useEffect(() => {
        fetchCompanyInfo();
        fetchCashRegister();
    }, []);

    const fetchCashRegister = async () => {
        try {
            // Get latest register
            const { data, error } = await supabase
                .from('daily_cash_registers')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(1)
                .single();

            if (data) {
                // Check if it was closed today or if it's still open
                setCashRegister(data);
            } else {
                setCashRegister(null); // Never opened
            }
        } catch (error) {
            console.error('Error fetching register:', error);
        }
    };

    const fetchCompanyInfo = async () => {
        const { data } = await supabase.from('company_info').select('*').single();
        if (data) {
            setCompanyName(data.name || 'PetManager');
            setCompanyLogo(data.logo_url);
            setCompanyCity(data.city || '');
            setCompanyDetails(data);
        }
    };

    const fetchTransactions = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('financial_records')
                .select(`
                    *,
                    appointment:appointments (
                        service_type,
                        client:clients (
                            full_name
                        )
                    )
                `)
                .gte('date', startDate)
                .lte('date', endDate)
                .order('date', { ascending: false })
                .order('created_at', { ascending: false });

            if (error) throw error;

            if (data) {
                const formatted = data.map((record: any) => ({
                    id: record.id,
                    client: record.appointment?.client?.full_name || (record.type === 'expense' ? '-' : 'Cliente Avulso'),
                    description: record.appointment ? record.appointment.service_type : record.description,
                    date: new Date(record.date).toLocaleDateString('pt-BR'),
                    rawDate: record.date,
                    value: Number(record.amount),
                    status: 'Concluído',
                    type: record.type,
                    category: record.category || (record.type === 'income' ? 'Serviços' : 'Outros'),
                    payment_method: record.payment_method
                }));
                setTransactions(formatted);
            }
        } catch (error) {
            console.error('Error fetching transactions:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveTransaction = async () => {
        if (!formDesc || !formAmount || !formDate) {
            alert('Preencha todos os campos obrigatórios.');
            return;
        }

        if (cashRegister?.status === 'closed' && formDate === new Date().toISOString().split('T')[0]) {
            // Optional: Warn user that register is closed? 
            // But maybe they are adding a backdated transaction. 
            // Ideally, we shouldn't allow adding cash transactions to a closed register for the same day easily.
            // For now, let's allow it but it won't affect the 'closed' final amount.
        }

        setSaving(true);
        try {
            const { error } = await supabase.from('financial_records').insert({
                description: formDesc,
                amount: parseFloat(formAmount),
                type: modalType,
                date: formDate,
                category: formCategory || (modalType === 'income' ? 'Receita Avulsa' : 'Despesa Operacional'),
                payment_method: formPaymentMethod, // Add this column in DB
                created_at: new Date().toISOString()
            });

            if (error) throw error;

            setShowModal(false);
            setFormDesc('');
            setFormAmount('');
            setFormCategory('');
            setFormPaymentMethod('Dinheiro');
            setFormDate(new Date().toISOString().split('T')[0]);
            fetchTransactions();
        } catch (error) {
            console.error('Error saving transaction:', error);
            alert('Erro ao salvar transação.');
        } finally {
            setSaving(false);
        }
    };

    // Calculate totals for Cash ONLY for the Closing Modal
    const calculateCashTotals = () => {
        const cashTransactions = transactions.filter(t => t.payment_method === 'Dinheiro' || !t.payment_method); // Assume old records might be cash? Or default to cash.
        // Actually earlier I said 'default Dinheiro' in DB, so that helps.

        // Filter transactions strictly within the "Opened At" time if possible? 
        // Or simplified: transactions of the 'current day' since the register handles "Daily".
        // Let's rely on transactions visible in the current Date Range Filter (which defaults to Month). 
        // ideally we should pass only TODAY's transactions to the close modal.

        const today = new Date().toISOString().split('T')[0];
        const todaysTransactions = transactions.filter(t => t.rawDate === today && (t.payment_method === 'Dinheiro' || t.payment_method === null));

        const income = todaysTransactions.filter(t => t.type === 'income').reduce((acc, curr) => acc + curr.value, 0);
        const expense = todaysTransactions.filter(t => t.type === 'expense').reduce((acc, curr) => acc + curr.value, 0);

        return { income, expense };
    };

    const cashTotals = calculateCashTotals();

    const openModal = (type: 'income' | 'expense') => {
        setModalType(type);
        setFormDesc('');
        setFormAmount('');
        setFormCategory('');
        setFormPaymentMethod('Dinheiro');
        setFormDate(new Date().toISOString().split('T')[0]);
        setShowModal(true);
    };

    const handlePrint = () => {
        window.print();
    };

    const openReceiptModal = (transaction?: any) => {
        if (transaction) {
            setReceiptData({
                clientName: transaction.client && transaction.client !== '-' ? transaction.client : '',
                amount: transaction.value,
                description: transaction.description,
                date: transaction.rawDate
            });
        } else {
            setReceiptData(undefined);
        }
        setShowReceiptModal(true);
    };

    const totalIncome = transactions.filter(t => t.type === 'income').reduce((acc, curr) => acc + curr.value, 0);
    const totalExpense = transactions.filter(t => t.type === 'expense').reduce((acc, curr) => acc + curr.value, 0);
    const balance = totalIncome - totalExpense;
    return (
        <div className="p-4 md:p-8 space-y-8 max-w-[1400px] mx-auto w-full pb-24 lg:pb-8 relative">
            {/* Header Area with Cash Register Status */}
            <div className="flex flex-col gap-6 print:hidden">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        {/* Breadcrumbs ... */}
                        <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
                            <button onClick={() => navigate('/')} className="hover:text-primary transition-colors">Início</button>
                            <span>/</span>
                            <span className="font-medium text-slate-900 dark:text-white">Financeiro</span>
                        </div>
                        <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Financeiro</h1>
                    </div>
                </div>

                {/* Cash Register Banner */}
                <div className="bg-slate-900 dark:bg-black rounded-2xl p-6 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

                    <div className="flex items-center gap-4 z-10">
                        <div className={`size-16 rounded-2xl flex items-center justify-center text-3xl shadow-lg ${cashRegister?.status === 'open' ? 'bg-green-500 text-white' : 'bg-red-500/20 text-red-500'}`}>
                            <span className="material-symbols-outlined">{cashRegister?.status === 'open' ? 'lock_open' : 'lock'}</span>
                        </div>
                        <div>
                            <h2 className="text-xl font-bold">Fluxo de Caixa Diário</h2>
                            <div className="flex items-center gap-2 text-sm opacity-80">
                                <span className={`size-2 rounded-full ${cashRegister?.status === 'open' ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></span>
                                {cashRegister?.status === 'open'
                                    ? `Caixa Aberto (Início: ${new Date(cashRegister.opened_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })})`
                                    : 'Caixa Fechado'}
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-4 z-10">
                        {cashRegister?.status === 'open' ? (
                            <div className="text-right mr-4 hidden md:block">
                                <p className="text-xs opacity-70 uppercase font-bold tracking-wider">Fundo de Troco</p>
                                <p className="text-xl font-bold font-mono">
                                    {cashRegister.initial_amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                </p>
                            </div>
                        ) : cashRegister?.status === 'closed' && (
                            <div className="text-right mr-4 hidden md:block">
                                <p className="text-xs opacity-70 uppercase font-bold tracking-wider">Último Fechamento</p>
                                <div className={`text-xl font-bold font-mono flex items-center gap-2 justify-end ${(cashRegister.final_amount - cashRegister.expected_amount) === 0 ? 'text-green-400' : 'text-yellow-400'
                                    }`}>
                                    {(cashRegister.final_amount - cashRegister.expected_amount) !== 0 && (
                                        <span className="material-symbols-outlined text-sm">warning</span>
                                    )}
                                    {(cashRegister.final_amount - cashRegister.expected_amount).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                </div>
                                <p className="text-[10px] opacity-60">Diferença de Caixa</p>
                            </div>
                        )}

                        {(!cashRegister || cashRegister.status === 'closed') && (
                            <button
                                onClick={() => setShowOpenRegister(true)}
                                className="h-12 px-6 bg-green-500 hover:bg-green-600 text-white font-bold rounded-xl shadow-lg shadow-green-500/20 transition-all flex items-center gap-2"
                            >
                                <span className="material-symbols-outlined">lock_open</span>
                                Abrir Caixa
                            </button>
                        )}

                        {cashRegister?.status === 'open' && (
                            <button
                                onClick={() => setShowCloseRegister(true)}
                                className="h-12 px-6 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl shadow-lg shadow-red-500/20 transition-all flex items-center gap-2"
                            >
                                <span className="material-symbols-outlined">lock</span>
                                Fechar Caixa
                            </button>
                        )}
                    </div>
                </div>

                {/* Main Actions Row */}
                <div className="flex flex-wrap gap-3">
                    <button
                        onClick={() => openModal('income')}
                        className="h-10 px-4 bg-green-600 hover:bg-green-700 text-white text-sm font-bold rounded-xl flex items-center shadow-lg shadow-green-600/20 transition-all"
                    >
                        <span className="material-symbols-outlined mr-2 text-[20px]">add_circle</span>
                        Nova Receita
                    </button>
                    <button
                        onClick={() => openModal('expense')}
                        className="h-10 px-4 bg-red-600 hover:bg-red-700 text-white text-sm font-bold rounded-xl flex items-center shadow-lg shadow-red-600/20 transition-all"
                    >
                        <span className="material-symbols-outlined mr-2 text-[20px]">remove_circle</span>
                        Nova Despesa
                    </button>
                    <button
                        onClick={handlePrint}
                        className="h-10 px-4 bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600 text-white text-sm font-bold rounded-xl flex items-center shadow-lg transition-all"
                    >
                        <span className="material-symbols-outlined mr-2 text-[20px]">print</span>
                        Imprimir
                    </button>
                    <button
                        onClick={() => openReceiptModal()}
                        className="h-10 px-4 bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600 text-white text-sm font-bold rounded-xl flex items-center shadow-lg transition-all"
                    >
                        <span className="material-symbols-outlined mr-2 text-[20px]">receipt_long</span>
                        Emitir Recibo
                    </button>
                </div>

                {/* Filters & Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="md:col-span-1 bg-white dark:bg-surface-dark p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Período</label>
                        <div className="flex flex-col gap-2">
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="w-full h-9 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 text-sm dark:text-white"
                            />
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="w-full h-9 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 text-sm dark:text-white"
                            />
                        </div>
                    </div>

                    <div className="bg-green-50 dark:bg-green-900/10 p-4 rounded-xl border border-green-100 dark:border-green-900/30">
                        <p className="text-green-600 dark:text-green-400 text-sm font-medium mb-1">Receitas</p>
                        <p className="text-2xl font-black text-green-700 dark:text-green-400">
                            {totalIncome.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </p>
                    </div>
                    <div className="bg-red-50 dark:bg-red-900/10 p-4 rounded-xl border border-red-100 dark:border-red-900/30">
                        <p className="text-red-600 dark:text-red-400 text-sm font-medium mb-1">Despesas</p>
                        <p className="text-2xl font-black text-red-700 dark:text-red-400">
                            {totalExpense.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </p>
                    </div>
                    <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-xl border border-blue-100 dark:border-blue-900/30">
                        <p className="text-blue-600 dark:text-blue-400 text-sm font-medium mb-1">Saldo Líquido</p>
                        <p className={`text-2xl font-black ${balance >= 0 ? 'text-blue-700 dark:text-blue-400' : 'text-red-600 dark:text-red-400'}`}>
                            {balance.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </p>
                    </div>
                </div>
            </div>

            {/* Transactions Table */}
            <div className="bg-white dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden animate-in fade-in duration-300 print:shadow-none print:border-none print:bg-white">
                <div className="overflow-x-auto print:overflow-visible">
                    <table className="w-full text-left text-sm print:text-black">
                        <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 print:bg-gray-100 print:border-gray-300">
                            <tr>
                                <th className="px-6 py-4 font-bold text-slate-700 dark:text-slate-300 print:text-black">Data</th>
                                <th className="px-6 py-4 font-bold text-slate-700 dark:text-slate-300 print:text-black">Descrição / Serviço</th>
                                <th className="px-6 py-4 font-bold text-slate-700 dark:text-slate-300 print:text-black">Cliente / Entidade</th>
                                <th className="px-6 py-4 font-bold text-slate-700 dark:text-slate-300 print:text-black">Categoria</th>
                                <th className="px-6 py-4 font-bold text-slate-700 dark:text-slate-300 print:text-black text-right">Valor</th>
                                <th className="px-6 py-4 font-bold text-slate-700 dark:text-slate-300 print:text-black text-right w-12 print:hidden"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800 print:divide-gray-200">
                            {loading ? (
                                <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-500">Carregando...</td></tr>
                            ) : transactions.length === 0 ? (
                                <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-500">Nenhuma transação neste período.</td></tr>
                            ) : (
                                transactions.map((item) => (
                                    <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors print:hover:bg-transparent">
                                        <td className="px-6 py-4 text-slate-500 dark:text-slate-400 print:text-black whitespace-nowrap">{item.date}</td>
                                        <td className="px-6 py-4 font-medium text-slate-900 dark:text-white print:text-black">{item.description}</td>
                                        <td className="px-6 py-4 text-slate-600 dark:text-slate-300 print:text-black">{item.client}</td>
                                        <td className="px-6 py-4 text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">{item.category}</td>
                                        <td className={`px-6 py-4 font-bold text-right ${item.type === 'income' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'} print:text-black`}>
                                            {item.type === 'expense' && '- '}
                                            {item.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                        </td>
                                        <td className="px-6 py-4 text-right print:hidden">
                                            <button
                                                onClick={() => openReceiptModal(item)}
                                                className="p-2 text-slate-400 hover:text-primary transition-colors hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full"
                                                title="Emitir Recibo"
                                            >
                                                <span className="material-symbols-outlined">receipt</span>
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-surface-dark w-full max-w-md rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className={`px-6 py-4 border-b ${modalType === 'income' ? 'bg-green-50 border-green-100 dark:bg-green-900/20 dark:border-green-900/30' : 'bg-red-50 border-red-100 dark:bg-red-900/20 dark:border-red-900/30'}`}>
                            <h3 className={`text-lg font-bold ${modalType === 'income' ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}`}>
                                {modalType === 'income' ? 'Nova Receita' : 'Nova Despesa'}
                            </h3>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Descrição</label>
                                <input
                                    type="text"
                                    value={formDesc}
                                    onChange={(e) => setFormDesc(e.target.value)}
                                    className="w-full h-10 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                                    placeholder={modalType === 'income' ? 'Ex: Venda de Ração' : 'Ex: Conta de Luz'}
                                    autoFocus
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Valor (R$)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={formAmount}
                                        onChange={(e) => setFormAmount(e.target.value)}
                                        className="w-full h-10 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 dark:text-white"
                                        placeholder="0.00"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Data</label>
                                    <input
                                        type="date"
                                        value={formDate}
                                        onChange={(e) => setFormDate(e.target.value)}
                                        className="w-full h-10 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 dark:text-white"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Categoria (Opcional)</label>
                                <input
                                    type="text"
                                    value={formCategory}
                                    onChange={(e) => setFormCategory(e.target.value)}
                                    className="w-full h-10 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 dark:text-white"
                                    placeholder={modalType === 'income' ? 'Ex: Vendas' : 'Ex: Operacional'}
                                />
                            </div>

                            {/* Payment Method Selector */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Forma de Pagamento</label>
                                <select
                                    value={formPaymentMethod}
                                    onChange={(e) => setFormPaymentMethod(e.target.value)}
                                    className="w-full h-10 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 dark:text-white"
                                >
                                    <option value="Dinheiro">Dinheiro</option>
                                    <option value="Cartão de Crédito">Cartão de Crédito</option>
                                    <option value="Cartão de Débito">Cartão de Débito</option>
                                    <option value="Pix">Pix</option>
                                    <option value="Transferência">Transferência</option>
                                </select>
                            </div>

                        </div>
                        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900/50 flex justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
                            <button
                                onClick={() => setShowModal(false)}
                                className="px-4 py-2 text-sm font-bold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleSaveTransaction}
                                disabled={saving}
                                className={`px-5 py-2 text-sm font-bold text-white rounded-lg shadow-md transition-all ${modalType === 'income' ? 'bg-green-600 hover:bg-green-700 shadow-green-600/20' : 'bg-red-600 hover:bg-red-700 shadow-red-600/20'}`}
                            >
                                {saving ? 'Salvando...' : 'Salvar'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <ReceiptModal
                isOpen={showReceiptModal}
                onClose={() => setShowReceiptModal(false)}
                companyName={companyName}
                companyLogo={companyLogo}
                initialData={receiptData}
                companyCity={companyCity}
                companyDetails={companyDetails}
            />

            <OpenRegisterModal
                isOpen={showOpenRegister}
                onClose={() => setShowOpenRegister(false)}
                onSuccess={() => {
                    fetchCashRegister();
                    fetchTransactions();
                }}
            />

            {cashRegister && (
                <CloseRegisterModal
                    isOpen={showCloseRegister}
                    onClose={() => setShowCloseRegister(false)}
                    registerId={cashRegister.id}
                    initialAmount={cashRegister.initial_amount}
                    totalIncome={cashTotals.income}
                    totalExpense={cashTotals.expense}
                    onSuccess={() => {
                        fetchCashRegister();
                    }}
                />
            )}
        </div>
    );
};

export default Financeiro;
