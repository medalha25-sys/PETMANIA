import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { useNavigate } from 'react-router-dom';

const ClientDashboard: React.FC = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [appointments, setAppointments] = useState<any[]>([]);
    const [userName, setUserName] = useState('');

    useEffect(() => {
        fetchAppointments();
    }, []);

    const fetchAppointments = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        setUserName(user.user_metadata.full_name || 'Cliente');

        // Fetch appointments linked to user
        const { data, error } = await supabase
            .from('appointments')
            .select(`
                *,
                pet:pets (
                    name,
                    avatar_url,
                    species
                )
            `)
            .eq('client_id', user.id)
            .order('date', { ascending: true })
            .order('start_time', { ascending: true });

        if (data) {
            setAppointments(data);
        }
        setLoading(false);
    };

    const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case 'confirmado': return 'bg-green-100 text-green-700 border-green-200';
            case 'cancelado': return 'bg-red-100 text-red-700 border-red-200';
            case 'pendente': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
            default: return 'bg-slate-100 text-slate-700 border-slate-200';
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
            {/* Header / Welcome */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                        Olá, {userName.split(' ')[0]}!
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">
                        Aqui estão os agendamentos dos seus pets.
                    </p>
                </div>
                <button
                    onClick={() => navigate('/agendar')}
                    className="px-6 py-3 bg-primary text-slate-900 font-bold rounded-xl shadow-lg shadow-primary/20 hover:bg-primary-dark transition-all transform hover:scale-105 active:scale-95 flex items-center gap-2"
                >
                    <span className="material-symbols-outlined">add_circle</span>
                    Novo Agendamento
                </button>
            </div>

            {/* Quick Stats or Next Appointment Highlight */}
            {appointments.length > 0 && (
                <div className="bg-gradient-to-r from-violet-500 to-primary rounded-3xl p-6 text-white shadow-xl shadow-violet-500/20 relative overflow-hidden">
                    <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                        <div>
                            <span className="inline-block px-3 py-1 rounded-full bg-white/20 text-xs font-bold mb-2 backdrop-blur-sm">
                                Próximo Serviço
                            </span>
                            <h2 className="text-2xl font-bold mb-1">
                                {appointments[0].service_type} para {appointments[0].pet?.name}
                            </h2>
                            <p className="text-white/80 flex items-center gap-2">
                                <span className="material-symbols-outlined text-lg">calendar_today</span>
                                {new Date(appointments[0].date).toLocaleDateString('pt-BR')} às {appointments[0].start_time}
                            </p>
                        </div>
                        <div className="bg-white/10 p-4 rounded-2xl backdrop-blur-md border border-white/20 text-center min-w-[120px]">
                            <p className="text-sm font-medium opacity-80">Faltam</p>
                            <p className="text-3xl font-black">{
                                Math.ceil((new Date(appointments[0].date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
                            } dias</p>
                        </div>
                    </div>
                    {/* Decorative Background Circles */}
                    <div className="absolute top-0 right-0 -mr-10 -mt-10 size-64 bg-white/10 rounded-full blur-3xl"></div>
                    <div className="absolute bottom-0 left-0 -ml-10 -mb-10 size-40 bg-black/10 rounded-full blur-2xl"></div>
                </div>
            )}

            {/* Appointments List */}
            <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">event_note</span>
                    Histórico e Agendamentos
                </h3>

                <div className="grid gap-4">
                    {loading ? (
                        <div className="text-center py-12 text-slate-500 flex flex-col items-center gap-3">
                            <div className="size-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                            Carregando...
                        </div>
                    ) : appointments.length === 0 ? (
                        <div className="bg-white dark:bg-surface-dark rounded-2xl p-12 text-center border-2 border-dashed border-slate-200 dark:border-slate-800">
                            <div className="size-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                <span className="material-symbols-outlined text-4xl text-primary">calendar_today</span>
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Nenhum agendamento encontrado</h3>
                            <p className="text-slate-500 mb-6 max-w-md mx-auto">
                                Seu histórico está vazio. Que tal agendar um momento especial para o seu pet hoje?
                            </p>
                            <button
                                onClick={() => navigate('/agendar')}
                                className="text-primary font-bold hover:underline"
                            >
                                Agendar agora
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {appointments.map((apt) => (
                                <div key={apt.id} className="bg-white dark:bg-surface-dark p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 hover:shadow-md transition-all group">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex items-center gap-3">
                                            <div
                                                className="size-12 rounded-full bg-slate-100 bg-cover bg-center border-2 border-white dark:border-slate-700 shadow-sm"
                                                style={{ backgroundImage: `url(${apt.pet?.avatar_url || 'https://placedog.net/100/100'})` }}
                                            ></div>
                                            <div>
                                                <h4 className="font-bold text-slate-900 dark:text-white">{apt.pet?.name}</h4>
                                                <p className="text-xs text-slate-500">{apt.pet?.species || 'Pet'}</p>
                                            </div>
                                        </div>
                                        <span className={`px-2 py-1 rounded-lg text-xs font-bold border ${getStatusColor(apt.status)}`}>
                                            {apt.status}
                                        </span>
                                    </div>

                                    <div className="space-y-2 mb-4">
                                        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                                            <span className="material-symbols-outlined text-[18px] text-primary">medical_services</span>
                                            <span className="text-sm font-medium">{apt.service_type}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                                            <span className="material-symbols-outlined text-[18px] text-primary">calendar_month</span>
                                            <span className="text-sm">{new Date(apt.date).toLocaleDateString('pt-BR')}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                                            <span className="material-symbols-outlined text-[18px] text-primary">schedule</span>
                                            <span className="text-sm">{apt.start_time} - {apt.end_time}</span>
                                        </div>
                                    </div>

                                    {apt.notes && (
                                        <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded-xl text-xs text-slate-500 italic mb-4">
                                            "{apt.notes}"
                                        </div>
                                    )}

                                    {apt.status === 'Pendente' && (
                                        <button className="w-full py-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-lg text-sm font-bold transition-colors">
                                            Cancelar
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ClientDashboard;
