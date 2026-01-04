import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';

interface CalendarModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelectDate: (date: string) => void;
    appointments: any[];
}

const CalendarModal: React.FC<CalendarModalProps> = ({ isOpen, onClose, onSelectDate, appointments }) => {
    const [currentDate, setCurrentDate] = useState(new Date());

    if (!isOpen) return null;

    const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay(); // 0 = Sunday

    // Helpers
    const getMonthName = (date: Date) => date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

    const prevMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    };

    const nextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    };

    // Brazilian Holidays (Fixed dates + visual mock for movable)
    // For production, a proper library or comprehensive Easter algorithm is best.
    // Using simplified fixed dates for demo.
    const getHoliday = (day: number, month: number, year: number) => {
        const str = `${day}/${month + 1}`;
        const holidays: Record<string, string> = {
            '1/1': 'Confraternização Universal',
            '25/1': 'Aniversário de SP',
            '21/4': 'Tiradentes',
            '1/5': 'Dia do Trabalho',
            '7/9': 'Independência do Brasil',
            '12/10': 'Nossa Senhora Aparecida',
            '2/11': 'Finados',
            '15/11': 'Proclamação da República',
            '25/12': 'Natal',
        };
        // Mock movable for 2026 (User time is 2026)
        if (year === 2026) {
            if (str === '17/2') return 'Carnaval';
            if (str === '3/4') return 'Sexta-feira Santa';
        }
        return holidays[str];
    };

    // Moon Phase (Approximate)
    const getMoonPhase = (date: Date) => {
        // Simple mock cyclic function
        const cycle = 29.53;
        const knownNewMoon = new Date('2023-01-21').getTime();
        const diffDays = (date.getTime() - knownNewMoon) / (1000 * 60 * 60 * 24);
        const phase = (diffDays % cycle);

        if (phase < 1.84) return { icon: 'brightness_empty', name: 'Nova' }; // New
        if (phase < 5.53) return { icon: 'mode_night', name: 'Crescente' }; // Waxing Crescent (using generalized icon)
        if (phase < 9.22) return { icon: 'circle', name: 'Quarto Crescente' }; // First Quarter (approx)
        if (phase < 12.91) return { icon: 'brightness_5', name: 'Crescente Gibosa' };
        if (phase < 16.61) return { icon: 'brightness_7', name: 'Cheia' }; // Full
        if (phase < 20.30) return { icon: 'brightness_6', name: 'Minguante Gibosa' };
        if (phase < 23.99) return { icon: 'contrast', name: 'Quarto Minguante' }; // Last Quarter
        return { icon: 'dark_mode', name: 'Minguante' };
    };

    const renderDays = () => {
        const days = [];
        // Padding for first week
        for (let i = 0; i < firstDayOfMonth; i++) {
            days.push(<div key={`empty-${i}`} className="h-24 bg-gray-50/50 dark:bg-gray-800/20 border border-gray-100 dark:border-gray-800 rounded-lg"></div>);
        }

        for (let d = 1; d <= daysInMonth; d++) {
            const dateObj = new Date(currentDate.getFullYear(), currentDate.getMonth(), d);
            const dateStr = dateObj.toISOString().split('T')[0];
            const isToday = new Date().toDateString() === dateObj.toDateString();
            const holiday = getHoliday(d, currentDate.getMonth(), currentDate.getFullYear());
            const moon = getMoonPhase(dateObj);

            // Count appointments
            const dayAppts = appointments.filter(a => a.date === dateStr);
            const hasAppts = dayAppts.length > 0;

            days.push(
                <div
                    key={d}
                    onClick={() => {
                        onSelectDate(dateStr);
                        onClose();
                    }}
                    className={`relative group h-24 p-2 rounded-xl border transition-all cursor-pointer hover:shadow-md
                    ${isToday
                            ? 'bg-primary/10 border-primary dark:border-primary/50'
                            : 'bg-white dark:bg-surface-dark border-gray-100 dark:border-gray-800 hover:border-primary/50 dark:hover:border-primary/50'
                        }
                `}
                >
                    {/* Header: Day Num + Holiday */}
                    <div className="flex justify-between items-start">
                        <span className={`text-sm font-bold w-6 h-6 flex items-center justify-center rounded-full ${isToday ? 'bg-primary text-white' : 'text-slate-700 dark:text-slate-300'}`}>
                            {d}
                        </span>
                        {holiday && (
                            <span className="text-[10px] items-center flex gap-1 font-semibold text-red-500 bg-red-50 dark:bg-red-900/20 px-1.5 py-0.5 rounded-md truncate max-w-[80px]" title={holiday}>
                                {holiday}
                            </span>
                        )}
                    </div>

                    {/* Body: Moon + Dots */}
                    <div className="absolute bottom-2 left-2 right-2 flex justify-between items-end">
                        <div className="text-slate-400" title={`Lua ${moon.name}`}>
                            <span className="material-symbols-outlined text-[14px]">{moon.icon}</span>
                        </div>

                        {hasAppts && (
                            <div className="flex gap-0.5">
                                {dayAppts.slice(0, 3).map((_, i) => (
                                    <div key={i} className="w-1.5 h-1.5 rounded-full bg-primary"></div>
                                ))}
                                {dayAppts.length > 3 && <span className="text-[8px] text-slate-400">+</span>}
                            </div>
                        )}
                    </div>
                </div>
            );
        }
        return days;
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-[#121214] rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-white dark:bg-[#121214]">
                    <div className="flex items-center gap-4">
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white capitalize">
                            {getMonthName(currentDate)}
                        </h2>
                        <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
                            <button onClick={prevMonth} className="p-1 hover:bg-white dark:hover:bg-gray-700 rounded-md shadow-sm transition-all text-slate-600 dark:text-slate-300">
                                <span className="material-symbols-outlined text-lg">chevron_left</span>
                            </button>
                            <button onClick={nextMonth} className="p-1 hover:bg-white dark:hover:bg-gray-700 rounded-md shadow-sm transition-all text-slate-600 dark:text-slate-300">
                                <span className="material-symbols-outlined text-lg">chevron_right</span>
                            </button>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full text-slate-400 hover:text-red-500 transition-colors">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                {/* Days Header */}
                <div className="grid grid-cols-7 bg-gray-50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-800">
                    {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
                        <div key={day} className="py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                            {day}
                        </div>
                    ))}
                </div>

                {/* Calendar Grid */}
                <div className="flex-1 overflow-y-auto p-4 bg-gray-50/30 dark:bg-[#0d0d0f]">
                    <div className="grid grid-cols-7 gap-3">
                        {renderDays()}
                    </div>
                </div>

                {/* Footer Legend */}
                <div className="p-4 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-[#121214] flex gap-6 text-xs text-slate-500">
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-primary"></span>
                        <span>Agendamentos</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-[14px]">brightness_7</span>
                        <span>Fases da Lua</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-red-500 font-bold">Feriado</span>
                        <span>Feriado Nacional</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CalendarModal;
