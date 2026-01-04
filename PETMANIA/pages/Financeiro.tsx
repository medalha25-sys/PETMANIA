import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';
import ReceiptModal from '../components/ReceiptModal';

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

    // ... (rest of simple states) ...
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

    useEffect(() => {
        fetchCompanyInfo();
    }, []);

    useEffect(() => {
        fetchTransactions();
    }, [startDate, endDate]);

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
                const formatted = data.map(record => ({
                    id: record.id,
                    client: record.appointment?.client?.full_name || (record.type === 'expense' ? '-' : 'Cliente Avulso'),
                    description: record.appointment ? record.appointment.service_type : record.description,
                    date: new Date(record.date).toLocaleDateString('pt-BR'),
                    // Ensure date is valid for sorting if needed, but we rely on SQL sort
                    rawDate: record.date,
                    value: Number(record.amount),
                    status: 'Concluído',
                    type: record.type,
                    category: record.category || (record.type === 'income' ? 'Serviços' : 'Outros')
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

        setSaving(true);
        try {
            const { error } = await supabase.from('financial_records').insert({
                description: formDesc,
                amount: parseFloat(formAmount),
                type: modalType,
                date: formDate,
                category: formCategory || (modalType === 'income' ? 'Receita Avulsa' : 'Despesa Operacional'),
                created_at: new Date().toISOString()
            });

            if (error) throw error;

            setShowModal(false);
            setFormDesc('');
            setFormAmount('');
            setFormCategory('');
            setFormDate(new Date().toISOString().split('T')[0]);
            fetchTransactions();
        } catch (error) {
            console.error('Error saving transaction:', error);
            alert('Erro ao salvar transação.');
        } finally {
            setSaving(false);
        }
    };

    const openModal = (type: 'income' | 'expense') => {
        setModalType(type);
        setFormDesc('');
        setFormAmount('');
        setFormCategory('');
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
                date: transaction.rawDate // or standard date
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
            {/* Print Header */}
            <div className="hidden print:flex items-center gap-4 mb-8 border-b border-black pb-4">
                {companyLogo && <img src={companyLogo} alt="Logo" className="h-16 w-16 object-contain" />}
                <div>
                    <h1 className="text-2xl font-bold text-black">{companyName} - Relatório Financeiro</h1>
                    <p className="text-sm text-gray-600">Período: {new Date(startDate).toLocaleDateString('pt-BR')} até {new Date(endDate).toLocaleDateString('pt-BR')}</p>
                </div>
            </div>

            <header className="flex flex-col gap-6 print:hidden">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
                            <button onClick={() => navigate('/')} className="hover:text-primary transition-colors">Início</button>
                            <span>/</span>
                            <span className="font-medium text-slate-900 dark:text-white">Financeiro</span>
                        </div>
                        <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Financeiro</h1>
                    </div>

                    <div className="flex gap-3">
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
            </header>

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
        </div>
    );
};

export default Financeiro;
