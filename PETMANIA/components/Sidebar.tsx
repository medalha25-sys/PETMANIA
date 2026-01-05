import React from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import { NAV_ITEMS } from '../constants';

import { supabase } from '../supabase';

interface SidebarProps {
    onOpenCheckout: () => void;
    isGuest?: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ onOpenCheckout, isGuest = false }) => {
    const location = useLocation();
    const [companyName, setCompanyName] = React.useState('PetManager');
    const [companyLogo, setCompanyLogo] = React.useState<string | null>(null);

    React.useEffect(() => {
        const fetchCompanyInfo = async () => {
            const { data } = await supabase.from('company_info').select('name, logo_url').single();
            if (data) {
                setCompanyName(data.name);
                setCompanyLogo(data.logo_url);
            }
        };
        fetchCompanyInfo();

        // Optional: Realtime subscription
        const channel = supabase
            .channel('company_info_changes')
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'company_info' }, (payload) => {
                const newData = payload.new as any;
                setCompanyName(newData.name);
                setCompanyLogo(newData.logo_url);
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const filteredNavItems = NAV_ITEMS.filter(item => {
        if (!isGuest) return true; // Show all for logged in users
        // For guests, show only specific items
        return ['/', '/agenda', '/produtos', '/servicos'].includes(item.to);
    });

    return (
        <aside className="hidden lg:flex w-72 flex-col border-r border-gray-200 dark:border-gray-800 bg-surface-light dark:bg-surface-dark transition-colors duration-200">
            <div className="flex h-full flex-col justify-between p-4">
                <div className="flex flex-col gap-6">
                    <div className="flex items-center gap-3 px-2 py-2">
                        {companyLogo ? (
                            <div
                                className="size-12 bg-white rounded-xl shadow-sm bg-cover bg-center border border-slate-200 dark:border-slate-700"
                                style={{ backgroundImage: `url("${companyLogo}")` }}
                            />
                        ) : (
                            <div className="size-12 bg-primary rounded-xl flex items-center justify-center shadow-sm">
                                <span className="material-symbols-outlined text-white text-2xl">pets</span>
                            </div>
                        )}
                        <div className="flex flex-col">
                            <h1 className="text-slate-900 dark:text-white text-lg font-bold leading-tight truncate max-w-[160px]">{companyName}</h1>
                            <p className="text-slate-500 dark:text-slate-400 text-xs font-medium">Gestão Integrada</p>
                        </div>
                    </div>

                    <nav className="flex flex-col gap-2">
                        {!isGuest && (
                            <button
                                onClick={onOpenCheckout}
                                className="flex w-full cursor-pointer items-center justify-center gap-2 overflow-hidden rounded-xl h-12 px-4 bg-primary hover:bg-primary-dark transition-all text-slate-900 text-sm font-bold leading-normal tracking-[0.015em] shadow-sm transform hover:scale-[1.02] mb-2"
                            >
                                <span className="material-symbols-outlined text-[20px]">point_of_sale</span>
                                <span className="truncate">Nova Venda</span>
                            </button>
                        )}
                        {filteredNavItems.map((item) => (
                            <NavLink
                                key={item.to}
                                to={item.to}
                                className={({ isActive }) =>
                                    `flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group ${isActive
                                        ? 'bg-primary/20 dark:bg-primary/10 text-primary-dark dark:text-primary shadow-sm'
                                        : 'text-slate-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                                    }`
                                }
                            >
                                <span className={`material-symbols-outlined transition-colors ${location.pathname === item.to ? 'text-green-800 dark:text-green-400' : 'text-slate-500 group-hover:text-slate-900 dark:text-slate-400 dark:group-hover:text-white'
                                    }`}>
                                    {item.icon}
                                </span>
                                <p className="text-sm font-medium leading-normal flex-1">{item.label}</p>
                                {/* @ts-ignore -Badge property might not be in generic type yet but works in runtime */}
                                {(item as any).badge && (
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm ${(item as any).badge.color}`}>
                                        {(item as any).badge.text}
                                    </span>
                                )}
                            </NavLink>
                        ))}
                    </nav>
                </div>

                <div className="flex flex-col gap-4">


                </div>
            </div>
        </aside>
    );
};

export default Sidebar;
