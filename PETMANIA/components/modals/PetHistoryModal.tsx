import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabase';

interface Pet {
    id: string;
    name: string;
    species: string;
    breed: string | null;
    owner_id: string | null;
    owner?: {
        full_name: string;
    };
    avatar_url: string | null;
}

interface PetHistoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    pet: Pet | null;
}

const PetHistoryModal: React.FC<PetHistoryModalProps> = ({ isOpen, onClose, pet }) => {
    const [history, setHistory] = useState<any[]>([]);
    const [loadingHistory, setLoadingHistory] = useState(false);
    const [companyInfo, setCompanyInfo] = useState<{ name: string, logo_url: string | null }>({ name: 'PetManager', logo_url: null });

    useEffect(() => {
        if (isOpen && pet) {
            handleOpenHistory(pet);
            fetchCompanyInfo();
        }
    }, [isOpen, pet]);

    const fetchCompanyInfo = async () => {
        const { data } = await supabase.from('company_info').select('name, logo_url').single();
        if (data) {
            setCompanyInfo(data);
        }
    };

    const handleOpenHistory = async (petData: Pet) => {
        setLoadingHistory(true);
        try {
            let query = supabase
                .from('appointments')
                .select('*')
                .eq('status', 'completed')
                .order('date', { ascending: false });

            if (petData.owner_id) {
                query = query.eq('client_id', petData.owner_id);
            } else {
                setHistory([]);
                return;
            }

            const { data, error } = await query;
            if (error) throw error;
            setHistory(data || []);

        } catch (error) {
            console.error('Error fetching history:', error);
        } finally {
            setLoadingHistory(false);
        }
    };

    const handlePrintHistory = () => {
        if (!pet || history.length === 0) return;

        const printWindow = window.open('', '', 'width=800,height=600');
        if (!printWindow) return;

        const htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Prontuário Médico - ${pet.name}</title>
                <style>
                    body { font-family: sans-serif; padding: 20px; line-height: 1.5; color: #333; }
                    .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #eee; padding-bottom: 20px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 10px; }
                    .logo { width: 80px; height: 80px; object-fit: contain; border-radius: 50%; margin-bottom: 5px; }
                    .company-name { font-size: 1.5em; font-weight: bold; color: #222; margin: 0; }
                    .doc-title { font-size: 1.2em; color: #666; margin: 0; }
                    .pet-info { margin-bottom: 30px; background: #f9f9f9; padding: 15px; border-radius: 8px; }
                    .record-item { margin-bottom: 20px; page-break-inside: avoid; border: 1px solid #eee; padding: 15px; border-radius: 8px; }
                    .date { font-weight: bold; color: #666; font-size: 0.9em; }
                    .service-type { font-size: 1.2em; font-weight: bold; margin: 5px 0; color: #000; }
                    .notes { background: #f0f7ff; padding: 10px; border-radius: 4px; margin-top: 10px; font-style: italic; }
                    .footer { margin-top: 40px; font-size: 0.8em; text-align: center; color: #999; border-top: 1px solid #eee; padding-top: 20px; }
                    @media print {
                        body { padding: 0; }
                        .record-item { border: none; border-bottom: 1px solid #ccc; border-radius: 0; }
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    ${companyInfo.logo_url ? `<img src="${companyInfo.logo_url}" class="logo" />` : ''}
                    <h1 class="company-name">${companyInfo.name}</h1>
                    <p class="doc-title">Prontuário Médico Veterinário</p>
                </div>

                <div class="pet-info">
                    <h2>Dados do Paciente</h2>
                    <p><strong>Nome:</strong> ${pet.name}</p>
                    <p><strong>Espécie/Raça:</strong> ${pet.species} - ${pet.breed || 'N/A'}</p>
                    <p><strong>Tutor:</strong> ${pet.owner?.full_name || 'N/A'}</p>
                </div>

                <div class="history-list">
                    <h3>Histórico de Atendimentos</h3>
                    ${history.map(record => `
                        <div class="record-item">
                            <div class="date">${new Date(record.date).toLocaleDateString('pt-BR')} às ${record.start_time}</div>
                            <div class="service-type">${record.service_type}</div>
                            ${record.notes ? `<div class="notes">" ${record.notes} "</div>` : ''}
                        </div>
                    `).join('')}
                </div>

                <div class="footer">
                    <p>Documento gerado em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}</p>
                </div>
                <script>
                    window.onload = function() { window.print(); }
                </script>
            </body>
            </html>
        `;

        printWindow.document.write(htmlContent);
        printWindow.document.close();
    };

    if (!isOpen || !pet) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-surface-dark rounded-2xl shadow-2xl w-full max-w-2xl h-[80vh] flex flex-col animate-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
                    <div className="flex items-center gap-4">
                        <div
                            className="size-12 rounded-full bg-slate-200 dark:bg-slate-800 bg-cover bg-center border-2 border-white dark:border-slate-700 shadow-sm"
                            style={{ backgroundImage: pet.avatar_url ? `url("${pet.avatar_url}")` : undefined }}
                        >
                            {!pet.avatar_url && <span className="material-symbols-outlined text-xl flex items-center justify-center h-full text-slate-400">pets</span>}
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Prontuário Médico</h2>
                            <p className="text-sm text-slate-500 dark:text-slate-400">{pet.name} - {pet.owner?.full_name || 'Sem Tutor'}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handlePrintHistory}
                            disabled={history.length === 0}
                            className="p-2 text-slate-500 hover:text-primary hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors rounded-lg flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Imprimir Prontuário"
                        >
                            <span className="material-symbols-outlined">print</span>
                            <span className="text-sm font-bold hidden sm:inline">Imprimir</span>
                        </button>
                        <button
                            onClick={onClose}
                            className="p-2 text-slate-400 hover:text-red-500 transition-colors rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                        >
                            <span className="material-symbols-outlined">close</span>
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6 bg-slate-50 dark:bg-[#0f1c15]">
                    {loadingHistory ? (
                        <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-2">
                            <div className="size-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                            <p className="text-sm">Carregando histórico...</p>
                        </div>
                    ) : history.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-3">
                            <div className="size-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                                <span className="material-symbols-outlined text-3xl opacity-50">history_edu</span>
                            </div>
                            <p>Nenhum registro médico encontrado.</p>
                        </div>
                    ) : (
                        <div className="space-y-6 relative before:absolute before:left-[19px] before:top-4 before:bottom-4 before:w-[2px] before:bg-slate-200 dark:before:bg-slate-800">
                            {history.map((record, idx) => (
                                <div key={record.id} className="relative pl-12 group">
                                    <div className="absolute left-0 top-0 size-10 rounded-full bg-white dark:bg-surface-dark border-4 border-slate-100 dark:border-slate-800 flex items-center justify-center z-10 shadow-sm group-hover:border-primary/30 transition-colors">
                                        <span className="material-symbols-outlined text-[18px] text-primary">
                                            {record.service_type.includes('Vacina') ? 'vaccines' : record.service_type.includes('Exame') ? 'monitor_heart' : 'medical_services'}
                                        </span>
                                    </div>

                                    <div className="bg-white dark:bg-surface-dark p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
                                        <div className="flex flex-wrap items-start justify-between gap-4 mb-2">
                                            <div>
                                                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">
                                                    {record.service_type}
                                                </span>
                                                <h4 className="text-slate-900 dark:text-white font-bold">
                                                    {new Date(record.date).toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
                                                </h4>
                                            </div>
                                            <div className="text-sm text-slate-500 font-medium bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full">
                                                {record.start_time}
                                            </div>
                                        </div>
                                        {record.notes && (
                                            <p className="text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl text-sm italic border-l-2 border-primary/30">
                                                "{record.notes}"
                                            </p>
                                        )}
                                        <div className="mt-3 flex items-center gap-2 text-xs text-slate-400">
                                            <span className="material-symbols-outlined text-sm">person</span>
                                            {record.veterinarian || 'Veterinário Responsável'}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PetHistoryModal;
