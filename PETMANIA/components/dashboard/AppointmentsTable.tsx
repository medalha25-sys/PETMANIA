import React, { useState, useEffect } from 'react';
import { SERVICES } from '../../constants';
import { useAppointments } from '../../hooks/useAppointments';
import TableSkeleton from '../skeletons/TableSkeleton';

// Alias for clarity if we want specific props, or just use TableSkeleton directly
const AppointmentsTableSkeleton = () => <TableSkeleton rows={5} cols={5} />;

interface AppointmentsTableProps {
    isGuest: boolean;
    onUpdate?: () => void; // Callback to refresh stats if needed
}

const AppointmentsTable: React.FC<AppointmentsTableProps> = ({ isGuest, onUpdate }) => {
    // Hook usage
    const { appointments, loading, fetchAppointments, updateStatus, cancelAppointments } = useAppointments();

    // UI State
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [openMenuId, setOpenMenuId] = useState<string | null>(null);

    // Initial fetch triggered by hook effect, but we might want to condition it on isGuest
    useEffect(() => {
        if (isGuest) return;
        // Hook fetches on mount, we rely on that. 
        // If isGuest changes (login), the component remounts or we can force fetch.
        // Actually hook runs on mount. If we want to disable it for guest we'd need to pass enabled flag to hook.
        // For now, let's just let it run or return early if guest (but hook runs logic).
        // Since isGuest usually implies restricted access, maybe the component isn't even rendered?
        // Checking parent Dashboard: it passes isGuest.
    }, [isGuest]);

    // Keyboard Listener for Delete
    useEffect(() => {
        const handleKeyDown = async (e: KeyboardEvent) => {
            if ((e.key === 'Delete' || e.key === 'Backspace') && selectedIds.size > 0) {
                // Prevent on inputs
                if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

                if (confirm(`Tem certeza que deseja cancelar ${selectedIds.size} agendamento(s)?`)) {
                    const idsToDelete = Array.from(selectedIds) as string[];
                    const success = await cancelAppointments(idsToDelete);

                    if (success) {
                        setSelectedIds(new Set());
                        if (onUpdate) onUpdate();
                    }
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedIds, cancelAppointments, onUpdate]);

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = () => setOpenMenuId(null);
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, []);

    const handleRowClick = (id: string, e: React.MouseEvent) => {
        const isMultiSelect = e.ctrlKey || e.metaKey;
        if (isMultiSelect) {
            const newSelected = new Set(selectedIds);
            if (newSelected.has(id)) newSelected.delete(id);
            else newSelected.add(id);
            setSelectedIds(newSelected);
        } else {
            if (selectedIds.has(id) && selectedIds.size === 1) setSelectedIds(new Set());
            else setSelectedIds(new Set([id]));
        }
    };

    const toggleMenu = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setOpenMenuId(openMenuId === id ? null : id);
    };

    const handleStatusUpdate = async (id: string, newStatus: string) => {
        setOpenMenuId(null);
        let financialData = undefined;

        if (newStatus === 'Concluído') {
            const app = appointments.find(a => a.id === id);
            if (!app) return;

            const serviceName = app.service_type; // Raw DB field name
            // find in constants matching name
            const service = SERVICES.find(s => s.name === serviceName);
            const price = service ? service.price : 0;
            const petName = app.pet?.name || 'Pet'; // Relation from hook

            financialData = {
                description: `${serviceName} - ${petName}`,
                amount: price,
                type: 'income',
                category: 'Serviços',
                date: new Date().toISOString().split('T')[0]
            };
        }

        const success = await updateStatus(id, newStatus === 'Concluído' ? 'completed' : newStatus, financialData);
        if (success && onUpdate) onUpdate();
    };

    // Format for Display
    // The hook returns raw data (snake_case generally). We map it here or in hook.
    // Let's assume raw data for a moment and map to display.
    const displayItems = appointments.map(app => ({
        id: app.id,
        time: app.start_time.slice(0, 5),
        pet: app.pet?.name || 'Cliente',
        avatar: app.client?.avatar_url || '',
        service: app.service_type,
        status: app.status === 'confirmed' ? 'Confirmado' :
            app.status === 'pending' ? 'Pendente' :
                app.status === 'cancelled' ? 'Cancelado' :
                    app.status === 'completed' ? 'Concluído' : app.status,
        original_date: app.date
    }));

    // Pagination
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = displayItems.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(displayItems.length / itemsPerPage);

    return (
        <section className="xl:col-span-2 flex flex-col gap-4">
            <div className="flex items-center justify-between px-1">
                <h3 className="text-slate-900 dark:text-white text-lg font-bold leading-tight tracking-[-0.015em]">Próximos Agendamentos</h3>
                <button onClick={() => fetchAppointments()} className="text-sm font-medium text-primary-dark hover:underline">
                    {loading ? 'Atualizando...' : 'Atualizar'}
                </button>
            </div>
            <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-surface-dark shadow-sm">
                <div className="overflow-x-auto">
                    {loading ? (
                        <div className="p-4">
                            <AppointmentsTableSkeleton />
                        </div>
                    ) : (
                        <table className="w-full text-left text-sm whitespace-nowrap">
                            <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800">
                                <tr>
                                    <th className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-300">Horário</th>
                                    <th className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-300">Pet</th>
                                    <th className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-300">Serviço</th>
                                    <th className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-300">Status</th>
                                    {!isGuest && <th className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-300 text-right">Ações</th>}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                {currentItems.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                                            {loading ? 'Carregando...' : 'Nenhum agendamento pendente encontrado.'}
                                        </td>
                                    </tr>
                                ) : (
                                    currentItems.map((app) => (
                                        <tr
                                            key={app.id}
                                            onClick={(e) => handleRowClick(app.id, e)}
                                            className={`transition-colors relative cursor-pointer select-none ${selectedIds.has(app.id)
                                                ? 'bg-blue-50 dark:bg-blue-900/20 border-l-2 border-l-blue-500'
                                                : 'hover:bg-gray-50 dark:hover:bg-gray-800/30 border-l-2 border-l-transparent'
                                                }`}
                                        >
                                            <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">{app.time}</td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="size-10 rounded-full bg-cover bg-center border border-gray-100 dark:border-gray-700" style={{ backgroundImage: `url("${app.avatar}")` }}></div>
                                                    <span className="font-medium text-slate-900 dark:text-white">{app.pet}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{app.service}</td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${app.status === 'Confirmado' ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300' :
                                                    app.status === 'Em Andamento' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300' :
                                                        app.status === 'Pendente' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300' :
                                                            'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300'
                                                    }`}>
                                                    <span className={`size-1.5 rounded-full ${app.status === 'Confirmado' ? 'bg-green-500' :
                                                        app.status === 'Em Andamento' ? 'bg-blue-500 animate-pulse' :
                                                            app.status === 'Pendente' ? 'bg-yellow-500' :
                                                                'bg-red-500'
                                                        }`}></span>
                                                    {app.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="relative">
                                                    <button
                                                        onClick={(e) => toggleMenu(app.id, e)}
                                                        className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
                                                    >
                                                        <span className="material-symbols-outlined text-[20px]">more_vert</span>
                                                    </button>
                                                    {openMenuId === app.id && (
                                                        <div className="absolute right-0 top-full mt-1 w-32 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-100 dark:border-gray-700 z-50 py-1 text-left">
                                                            <button
                                                                onClick={() => handleStatusUpdate(app.id, 'Confirmado')}
                                                                className="w-full px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-gray-700 text-left flex items-center gap-2"
                                                            >
                                                                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                                                                Confirmado
                                                            </button>
                                                            <button
                                                                onClick={() => handleStatusUpdate(app.id, 'Pendente')}
                                                                className="w-full px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-gray-700 text-left flex items-center gap-2"
                                                            >
                                                                <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
                                                                Pendente
                                                            </button>
                                                            <button
                                                                onClick={() => handleStatusUpdate(app.id, 'Cancelado')}
                                                                className="w-full px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 text-left flex items-center gap-2"
                                                            >
                                                                <span className="w-2 h-2 rounded-full bg-red-500"></span>
                                                                Cancelado
                                                            </button>
                                                            <div className="my-1 border-t border-slate-100 dark:border-slate-700"></div>
                                                            <button
                                                                onClick={() => handleStatusUpdate(app.id, 'Concluído')}
                                                                className="w-full px-4 py-2 text-sm text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/10 text-left flex items-center gap-2 font-bold"
                                                            >
                                                                <span className="material-symbols-outlined text-sm">check_circle</span>
                                                                Concluir
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    )}
                </div>
                <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800/20 border-t border-gray-100 dark:border-gray-800 flex justify-between items-center text-xs text-slate-500">
                    <p>Mostrando {currentItems.length > 0 ? indexOfFirstItem + 1 : 0}-{Math.min(indexOfLastItem, displayItems.length)} de {displayItems.length} agendamentos</p>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1}
                            className="p-1 rounded bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                        >
                            <span className="material-symbols-outlined text-sm">chevron_left</span>
                        </button>
                        <button
                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                            disabled={currentPage === totalPages}
                            className="p-1 rounded bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                        >
                            <span className="material-symbols-outlined text-sm">chevron_right</span>
                        </button>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default AppointmentsTable;
