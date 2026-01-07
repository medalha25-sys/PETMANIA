import React from 'react';

const MarketingWidget: React.FC = () => {
    return (
        <div className="relative overflow-hidden rounded-xl p-6 bg-gradient-to-br from-green-600 to-green-800 text-white shadow-md">
            <div className="relative z-10 flex flex-col items-start gap-4 h-full justify-center">
                <div>
                    <h3 className="text-xl font-bold mb-1">Campanha de Vacinação</h3>
                    <p className="text-green-100 text-sm">Envie lembretes para 45 clientes com vacinas pendentes este mês.</p>
                </div>
                <button className="px-4 py-2 bg-white text-green-700 rounded-lg text-sm font-bold shadow hover:bg-gray-100 transition-colors">
                    Iniciar Campanha
                </button>
            </div>
            <div className="absolute right-[-20px] bottom-[-20px] opacity-20 pointer-events-none">
                <span className="material-symbols-outlined text-[150px]">pets</span>
            </div>
        </div>
    );
};

export default MarketingWidget;
