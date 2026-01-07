import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDashboardStats } from "../../hooks/useDashboardStats";
import CardSkeleton from '../skeletons/CardSkeleton';

interface StatCardsProps {
    isGuest: boolean;
    refreshTrigger?: number;
}

const StatCards: React.FC<StatCardsProps> = ({ isGuest, refreshTrigger = 0 }) => {
    const navigate = useNavigate();
    const [showRevenue, setShowRevenue] = useState(true);

    // Using the new hook
    const { stats, loading } = useDashboardStats(isGuest ? 0 : refreshTrigger);

    if (isGuest) return null;

    if (loading) {
        return (
            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                    <CardSkeleton key={i} />
                ))}
            </section>
        );
    }

    const statItems = [
        { icon: 'calendar_today', label: 'Agendamentos Hoje', value: stats.appointmentsCount.toString(), trend: 'Hoje', color: 'blue' },
        { icon: 'person_add', label: 'Novos Clientes', value: '4', trend: 'Semana', color: 'purple' }, // Static for now as per original
        { icon: 'payments', label: 'Faturamento Dia', value: stats.revenue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }), trend: 'Hoje', color: 'green' },
        { icon: 'pets', label: 'Animais na Loja', value: '8', trend: '75% lotação', color: 'orange' }, // Static per original
    ];

    return (
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {statItems.map((stat, idx) => (
                <div
                    key={idx}
                    className={`flex flex-col gap-3 rounded-xl p-5 bg-white dark:bg-surface-dark border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md transition-shadow relative group`}
                >
                    <div className="flex justify-between items-start">
                        <div
                            onClick={(e) => {
                                if (stat.label === 'Novos Clientes') {
                                    e.stopPropagation();
                                    navigate('/clientes');
                                }
                                if (stat.label === 'Agendamentos Hoje') {
                                    e.stopPropagation();
                                    navigate('/agenda');
                                }
                                if (stat.label === 'Faturamento Dia') {
                                    e.stopPropagation();
                                    navigate('/financeiro');
                                }
                                if (stat.label === 'Animais na Loja') {
                                    e.stopPropagation();
                                    navigate('/pets');
                                }
                            }}
                            className={`p-2 rounded-lg bg-${stat.color}-50 dark:bg-${stat.color}-900/20 text-${stat.color}-600 dark:text-${stat.color}-400 ${['Novos Clientes', 'Agendamentos Hoje', 'Faturamento Dia', 'Animais na Loja'].includes(stat.label) ? 'cursor-pointer hover:ring-2 hover:ring-offset-1 hover:ring-primary transition-all' : ''}`}
                        >
                            <span className="material-symbols-outlined">{stat.icon}</span>
                        </div>
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">{stat.label}</p>
                            {stat.label === 'Faturamento Dia' && (
                                <button onClick={() => setShowRevenue(!showRevenue)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
                                    <span className="material-symbols-outlined text-[16px]">{showRevenue ? 'visibility' : 'visibility_off'}</span>
                                </button>
                            )}
                        </div>
                        <h3 className="text-slate-900 dark:text-white text-2xl font-bold mt-1">
                            {loading ? (
                                <span className="animate-pulse bg-gray-200 dark:bg-gray-700 h-6 w-20 rounded inline-block"></span>
                            ) : (
                                stat.label === 'Faturamento Dia' && !showRevenue ? '••••••' : stat.value
                            )}
                        </h3>
                    </div>
                </div>
            ))}
        </section>
    );
};

export default StatCards;
