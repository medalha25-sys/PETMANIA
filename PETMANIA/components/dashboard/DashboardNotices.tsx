import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabase';

const DashboardNotices: React.FC = () => {
    const [notices, setNotices] = useState<{
        id: string;
        type: 'inventory' | 'expiration';
        title: string;
        description: string;
        time: string;
        priority: 'low' | 'medium' | 'high' | 'critical';
    }[]>([]);

    useEffect(() => {
        fetchNotices();
    }, []);

    const fetchNotices = async () => {
        try {
            const { data: products } = await supabase
                .from('products')
                .select('id, name, stock, expiration_date');

            if (!products) return;

            const newNotices: typeof notices = [];
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            products.forEach(product => {
                // 1. Low Stock Logic
                if (product.stock <= 10) {
                    newNotices.push({
                        id: `stock-${product.id}`,
                        type: 'inventory',
                        title: 'Estoque Baixo',
                        description: `${product.name} (${product.stock} un.)`,
                        time: 'Agora',
                        priority: 'medium'
                    });
                }

                // 2. Expiration Logic
                if (product.expiration_date) {
                    const expDate = new Date(product.expiration_date);
                    expDate.setHours(0, 0, 0, 0);
                    const diffTime = expDate.getTime() - today.getTime();
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                    if (diffDays <= 15) {
                        let priority: 'low' | 'medium' | 'high' | 'critical' = 'medium';
                        if (diffDays <= 5) priority = 'critical';
                        else if (diffDays <= 10) priority = 'high';

                        newNotices.push({
                            id: `exp-${product.id}`,
                            type: 'expiration',
                            title: diffDays < 0 ? 'Produto Vencido' : 'Vencimento Próximo',
                            description: `${product.name} ${diffDays < 0 ? `venceu há ${Math.abs(diffDays)} dias` : `vence em ${diffDays} dias`}`,
                            time: new Date(product.expiration_date).toLocaleDateString('pt-BR'),
                            priority
                        });
                    }
                }
            });

            // Sort: Critical > High > Medium > Low
            const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
            newNotices.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

            setNotices(newNotices);
        } catch (error) {
            console.error('Error fetching notices:', error);
        }
    };

    return (
        <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between px-1">
                <h3 className="text-slate-900 dark:text-white text-lg font-bold leading-tight tracking-[-0.015em]">Avisos Recentes</h3>
                <button
                    onClick={fetchNotices}
                    className="text-sm text-primary-dark font-medium hover:underline"
                    title="Atualizar avisos"
                >
                    Atualizar
                </button>
            </div>
            <div className="rounded-xl p-6 bg-white dark:bg-surface-dark border border-gray-100 dark:border-gray-800 shadow-sm">
                <div className="flex flex-col gap-6 max-h-[400px] overflow-y-auto pr-2 scrollbar-hide">
                    {/* Expiration Section */}
                    {notices.filter(n => n.type === 'expiration').length > 0 && (
                        <div className="flex flex-col gap-3">
                            <div className="sticky top-0 z-10 bg-red-50 dark:bg-red-900/20 px-3 py-2 -mx-3 border-y border-red-100 dark:border-red-900/30 backdrop-blur-sm">
                                <h4 className="text-xs font-bold text-red-600 dark:text-red-400 uppercase tracking-wider flex items-center gap-2">
                                    <span className="material-symbols-outlined text-sm">warning</span>
                                    Vencimentos
                                </h4>
                            </div>
                            {notices.filter(n => n.type === 'expiration').map((notice) => (
                                <div key={notice.id} className="flex gap-3 items-start px-2">
                                    <div className={`shrink-0 size-10 rounded-full flex items-center justify-center ${notice.priority === 'critical' ? 'bg-red-100 dark:bg-red-900/40 text-red-600' :
                                        notice.priority === 'high' ? 'bg-orange-100 dark:bg-orange-900/40 text-orange-600' :
                                            'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-600'
                                        }`}>
                                        <span className="material-symbols-outlined text-[20px]">event_busy</span>
                                    </div>
                                    <div className="flex-1">
                                        <p className={`text-sm font-bold ${notice.priority === 'critical' ? 'text-red-600 dark:text-red-400' :
                                            'text-slate-900 dark:text-white'
                                            }`}>{notice.title}</p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{notice.description}</p>
                                    </div>
                                    <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${notice.priority === 'critical' ? 'bg-red-50 text-red-600 border border-red-100' :
                                        notice.priority === 'high' ? 'bg-orange-50 text-orange-600 border border-orange-100' :
                                            'bg-slate-50 text-slate-500 border border-slate-100'
                                        }`}>{notice.time}</span>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Stock Section */}
                    {notices.filter(n => n.type === 'inventory').length > 0 && (
                        <div className="flex flex-col gap-3">
                            <div className="sticky top-0 z-10 bg-yellow-50 dark:bg-yellow-900/20 px-3 py-2 -mx-3 border-y border-yellow-100 dark:border-yellow-900/30 backdrop-blur-sm">
                                <h4 className="text-xs font-bold text-yellow-700 dark:text-yellow-400 uppercase tracking-wider flex items-center gap-2">
                                    <span className="material-symbols-outlined text-sm">inventory_2</span>
                                    Estoque Baixo
                                </h4>
                            </div>
                            {notices.filter(n => n.type === 'inventory').map((notice) => (
                                <div key={notice.id} className="flex gap-3 items-start px-2">
                                    <div className="shrink-0 size-10 rounded-full flex items-center justify-center bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600">
                                        <span className="material-symbols-outlined text-[20px]">inventory_2</span>
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-bold text-slate-900 dark:text-white">{notice.title}</p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{notice.description}</p>
                                    </div>
                                    <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-slate-50 text-slate-500 border border-slate-100">
                                        {notice.time}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}

                    {notices.length === 0 && (
                        <div className="text-center py-8 text-slate-400">
                            <span className="material-symbols-outlined text-3xl mb-2">check_circle</span>
                            <p className="text-sm">Tudo certo por aqui!</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DashboardNotices;
