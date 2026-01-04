import React, { useState, useEffect } from 'react';

interface ReceiptModalProps {
    isOpen: boolean;
    onClose: () => void;
    companyName: string;
    companyLogo: string | null;
    companyCity?: string;
    companyDetails?: any;
    initialData?: {
        clientName: string;
        amount: number;
        description: string;
        date: string;
    };
}

const ReceiptModal: React.FC<ReceiptModalProps> = ({
    isOpen,
    onClose,
    companyName,
    companyLogo,
    companyCity,
    companyDetails,
    initialData
}) => {
    const [clientName, setClientName] = useState('');
    const [amount, setAmount] = useState<string>('');
    const [description, setDescription] = useState('');
    const [date, setDate] = useState('');
    const [city, setCity] = useState(companyCity || 'Montes Claros'); // Fallback default if not provided

    useEffect(() => {
        if (isOpen) {
            setClientName(initialData?.clientName || '');
            setAmount(initialData?.amount?.toString() || '');
            setDescription(initialData?.description || '');
            setDate(initialData?.date ? new Date(initialData.date).toLocaleDateString('pt-BR') : new Date().toLocaleDateString('pt-BR'));
            if (companyCity) setCity(companyCity);
        }
    }, [isOpen, initialData, companyCity]);

    const handlePrint = () => {
        window.print();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm print:p-0 print:absolute print:inset-0 print:bg-white print:z-auto">

            {/* Modal Container */}
            <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] print:max-w-none print:shadow-none print:rounded-none print:h-auto print:max-h-none print:w-full">

                {/* Screen Header - Hidden on Print */}
                <div className="flex items-center justify-between p-4 border-b border-gray-100 print:hidden">
                    <h3 className="text-lg font-bold text-gray-800">Emitir Recibo</h3>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <span className="material-symbols-outlined text-gray-500">close</span>
                    </button>
                </div>

                {/* Content - Scrollable on Screen */}
                <div className="flex-1 overflow-y-auto p-8 print:p-0 print:overflow-visible">

                    {/* Receipt Layout */}
                    <div className="border-2 border-slate-800 p-8 max-w-[800px] mx-auto bg-white print:border-2 print:border-black print:w-full print:max-w-none">

                        {/* Header */}
                        <div className="flex items-center gap-6 mb-8 border-b-2 border-slate-800 pb-6 print:border-black">
                            {companyLogo && (
                                <img src={companyLogo} alt="Logo" className="w-24 h-24 object-contain" />
                            )}
                            <div>
                                <h1 className="text-3xl font-black text-slate-900 uppercase tracking-wide print:text-black">{companyName}</h1>
                                {companyDetails && (
                                    <div className="text-xs text-slate-500 mt-1 space-y-0.5 print:text-gray-600">
                                        {companyDetails.cnpj && <p>CNPJ: {companyDetails.cnpj}</p>}
                                        {(companyDetails.street || companyDetails.neighborhood) && (
                                            <p>
                                                {companyDetails.street}{companyDetails.number ? `, ${companyDetails.number}` : ''}
                                                {companyDetails.neighborhood ? ` - ${companyDetails.neighborhood}` : ''}
                                            </p>
                                        )}
                                        <div className="flex gap-2">
                                            {companyDetails.phone && <p>Tel: {companyDetails.phone}</p>}
                                            {companyDetails.whatsapp && <p>Zap: {companyDetails.whatsapp}</p>}
                                        </div>
                                        {companyDetails.email && <p>{companyDetails.email}</p>}
                                    </div>
                                )}
                                {!companyDetails && <p className="text-sm text-slate-500 font-medium print:text-gray-600">Comprovante de Pagamento</p>}
                            </div>
                            <div className="ml-auto text-right">
                                <h2 className="text-4xl font-black text-slate-200 print:text-gray-200">RECIBO</h2>
                            </div>
                        </div>

                        {/* Amount */}
                        <div className="flex justify-end mb-8">
                            <div className="bg-slate-100 px-6 py-3 rounded-lg border border-slate-200 print:bg-gray-100 print:border-gray-300">
                                <span className="text-sm font-bold text-slate-500 uppercase mr-3 print:text-black">Valor</span>
                                <span className="text-2xl font-black text-slate-900 print:text-black">
                                    R$ <input
                                        type="number"
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                        className="bg-transparent border-b border-dashed border-slate-400 w-32 text-right focus:outline-none focus:border-primary print:border-none"
                                        placeholder="0,00"
                                    />
                                </span>
                            </div>
                        </div>

                        {/* Body Text */}
                        <div className="space-y-6 text-lg leading-relaxed text-slate-800 print:text-black">
                            <p>
                                Recebemos de <input
                                    type="text"
                                    value={clientName}
                                    onChange={(e) => setClientName(e.target.value)}
                                    className="font-bold border-b border-dashed border-slate-400 px-2 w-[60%] focus:outline-none focus:border-primary print:border-none print:w-auto min-w-[200px]"
                                    placeholder="Nome do Cliente"
                                />
                            </p>

                            <p>
                                A importância supramencionada, referente a:
                            </p>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="w-full p-3 bg-slate-50 rounded-lg border border-slate-200 text-slate-700 font-medium focus:outline-none focus:border-primary resize-none print:bg-transparent print:border-none print:p-0 print:font-bold print:text-black"
                                rows={3}
                                placeholder="Descrição dos serviços ou produtos..."
                            />
                        </div>

                        {/* Date and Signature */}
                        <div className="mt-12 flex flex-col md:flex-row justify-between items-end gap-12 print:flex-row print:gap-0">
                            <div className="text-slate-600 print:text-black">
                                <div className="flex items-center gap-2">
                                    <input
                                        type="text"
                                        value={city}
                                        onChange={(e) => setCity(e.target.value)}
                                        className="border-b border-dashed border-slate-400 w-32 text-right focus:outline-none print:border-none print:text-right"
                                    />,
                                    <input
                                        type="text"
                                        value={date}
                                        onChange={(e) => setDate(e.target.value)}
                                        className="border-b border-dashed border-slate-400 w-32 text-center focus:outline-none print:border-none"
                                    />
                                </div>
                            </div>

                            <div className="text-center group">
                                <div className="w-64 border-b border-slate-900 mb-2 print:border-black"></div>
                                <p className="font-bold text-slate-900 print:text-black">{companyName}</p>
                                <p className="text-xs text-slate-500 uppercase tracking-widest print:text-gray-600">Assinatura</p>
                            </div>
                        </div>

                    </div>
                </div>

                {/* Footer Actions - Hidden on Print */}
                <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3 print:hidden">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-slate-600 font-bold text-sm hover:text-slate-800 transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handlePrint}
                        className="px-6 py-2 bg-slate-900 text-white font-bold rounded-lg shadow-lg hover:bg-slate-800 transition-all flex items-center gap-2"
                    >
                        <span className="material-symbols-outlined text-[20px]">print</span>
                        Imprimir Recibo
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ReceiptModal;
