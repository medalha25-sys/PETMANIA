import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';
import CheckoutModal from '../components/CheckoutModal';

interface Appointment {
  id: string;
  client_id: string;
  client?: {
    full_name: string;
    avatar_url: string | null;
    mobile: string | null;
  };
  pet_id?: string;
  pet?: {
    name: string;
  };
  date: string;
  start_time: string;
  end_time: string;
  service_type: string;
  status: string;
  notes: string;
}

interface Client {
  id: string;
  full_name: string;
}

const Agenda: React.FC = () => {
  const navigate = useNavigate();

  // State
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [checkoutData, setCheckoutData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // Form State
  const [selectedClient, setSelectedClient] = useState('');
  const [selectedPet, setSelectedPet] = useState('');
  const [clientPets, setClientPets] = useState<{ id: string, name: string }[]>([]);
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [serviceType, setServiceType] = useState('Banho & Tosa');
  const [notes, setNotes] = useState('');

  // View State
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'month'>('week');
  const [currentDate, setCurrentDate] = useState(new Date());

  // Helper: Get range for week/month
  const getDaysInView = () => {
    const days = [];
    const curr = new Date(currentDate);

    if (viewMode === 'day') {
      days.push(new Date(curr));
    } else if (viewMode === 'week') {
      // Start from Monday (or Sunday if preferred, doing Monday here)
      const day = curr.getDay();
      const diff = curr.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
      const monday = new Date(curr.setDate(diff));

      for (let i = 0; i < 7; i++) {
        const next = new Date(monday);
        next.setDate(monday.getDate() + i);
        days.push(next);
      }
    } else {
      // Month view logic later if needed, focusing on Week/Day Grid first
      const year = curr.getFullYear();
      const month = curr.getMonth();
      const date = new Date(year, month, 1);
      while (date.getMonth() === month) {
        days.push(new Date(date));
        date.setDate(date.getDate() + 1);
      }
    }
    return days;
  };

  const daysInView = getDaysInView();
  const hours = Array.from({ length: 13 }, (_, i) => i + 8); // 08:00 - 20:00

  // Fetch Data
  useEffect(() => {
    fetchAppointments();
    fetchClients();
  }, []);

  const fetchAppointments = async () => {
    const { data } = await supabase
      .from('appointments')
      .select('*, client:clients(full_name, avatar_url, mobile), pet:pets(name)')
      .neq('status', 'cancelled');
    if (data) setAppointments(data);
  };

  const fetchClients = async () => {
    const { data } = await supabase.from('clients').select('id, full_name');
    if (data) setClients(data);
  };

  // Form Helpers
  useEffect(() => {
    if (selectedClient) {
      const fetchPets = async () => {
        const { data } = await supabase.from('pets').select('id, name').eq('owner_id', selectedClient);
        if (data) setClientPets(data);
      };
      fetchPets();
    } else {
      setClientPets([]);
      setSelectedPet('');
    }
  }, [selectedClient]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.from('appointments').insert({
        client_id: selectedClient,
        pet_id: selectedPet || null,
        date,
        start_time: startTime,
        end_time: endTime,
        service_type: serviceType,
        notes,
        status: 'confirmed'
      });
      if (error) throw error;
      alert('Agendamento criado com sucesso!');
      setIsModalOpen(false);
      fetchAppointments();
      // Reset
      setSelectedClient('');
      setSelectedPet('');
      setClientPets([]);
      setDate('');
      setStartTime('');
      setEndTime('');
      setNotes('');
    } catch (error) {
      console.error(error);
      alert('Erro ao criar agendamento');
    } finally {
      setLoading(false);
    }
  };

  // Component Helpers
  const getLocalDateString = (date: Date) => {
    const offset = date.getTimezoneOffset() * 60000;
    const local = new Date(date.getTime() - offset);
    return local.toISOString().split('T')[0];
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear();
  };

  const getServiceColor = (type: string) => {
    switch (type) {
      case 'Banho & Tosa': return 'bg-blue-50 border-blue-500 text-blue-700 dark:bg-blue-900/20 dark:border-blue-700 dark:text-blue-300';
      case 'Consulta Veterinária': return 'bg-purple-50 border-purple-500 text-purple-700 dark:bg-purple-900/20 dark:border-purple-700 dark:text-purple-300';
      case 'Vacinação': return 'bg-orange-50 border-orange-500 text-orange-700 dark:bg-orange-900/20 dark:border-orange-700 dark:text-orange-300';
      case 'Exame': return 'bg-emerald-50 border-emerald-500 text-emerald-700 dark:bg-emerald-900/20 dark:border-emerald-700 dark:text-emerald-300';
      default: return 'bg-slate-50 border-slate-500 text-slate-700 dark:bg-slate-800 dark:border-slate-600 dark:text-slate-300';
    }
  };

  const getServiceIcon = (type: string) => {
    switch (type) {
      case 'Banho & Tosa': return 'shower';
      case 'Consulta Veterinária': return 'stethoscope';
      case 'Vacinação': return 'vaccines';
      case 'Exame': return 'lab_panel';
      default: return 'event';
    }
  };

  const getUpcomingAppointments = () => {
    const todayStr = getLocalDateString(new Date());
    return appointments
      .filter(a => a.date >= todayStr && a.status !== 'cancelled')
      .sort((a, b) => {
        if (a.date !== b.date) return a.date.localeCompare(b.date);
        return a.start_time.localeCompare(b.start_time);
      })
      .slice(0, 4);
  };

  return (
    <div className="flex flex-col h-screen bg-white dark:bg-background-dark">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-surface-dark">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Calendário de Agendamentos</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Gerencie os horários de banho, tosa e consultas veterinárias.</p>
        </div>

        <div className="flex items-center gap-4">
          {/* Date Navigation */}
          <div className="flex items-center bg-gray-50 dark:bg-gray-800 rounded-full px-1 p-1 border border-gray-100 dark:border-gray-700">
            <button onClick={() => {
              const newDate = new Date(currentDate);
              newDate.setDate(newDate.getDate() - (viewMode === 'week' ? 7 : 1));
              setCurrentDate(newDate);
            }} className="p-1 rounded-full hover:bg-white dark:hover:bg-gray-700 hover:shadow-sm transition-all text-slate-500 dark:text-slate-400">
              <span className="material-symbols-outlined text-[20px]">chevron_left</span>
            </button>
            <span className="px-4 text-sm font-bold text-slate-700 dark:text-slate-200 min-w-[140px] text-center capitalize">
              {currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
            </span>
            <button onClick={() => {
              const newDate = new Date(currentDate);
              newDate.setDate(newDate.getDate() + (viewMode === 'week' ? 7 : 1));
              setCurrentDate(newDate);
            }} className="p-1 rounded-full hover:bg-white dark:hover:bg-gray-700 hover:shadow-sm transition-all text-slate-500 dark:text-slate-400">
              <span className="material-symbols-outlined text-[20px]">chevron_right</span>
            </button>
          </div>

          <div className="h-6 w-px bg-gray-200 dark:bg-gray-700 mx-2"></div>

          <button className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-surface-dark border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
            <span className="material-symbols-outlined text-[18px]">ios_share</span>
            Exportar
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#10b981] text-white rounded-xl text-sm font-bold hover:bg-[#059669] shadow-lg shadow-emerald-200/50 transition-all hover:scale-105"
          >
            <span className="material-symbols-outlined text-[20px]">add</span>
            Novo Agendamento
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Calendar Grid */}
        <div className="flex-1 flex flex-col overflow-y-auto overflow-x-auto relative bg-white dark:bg-[#15281e]">
          {/* View Toggle */}
          <div className="flex items-center gap-2 px-6 py-3 border-b border-gray-50 dark:border-gray-800 bg-white dark:bg-[#15281e]">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-2">Visualização:</span>
            <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
              {['Dia', 'Semana', 'Mês'].map(m => {
                const val = m === 'Dia' ? 'day' : m === 'Semana' ? 'week' : 'month';
                return (
                  <button
                    key={m}
                    onClick={() => setViewMode(val as any)}
                    className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${viewMode === val ? 'bg-white dark:bg-surface-dark text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                      }`}
                  >
                    {m}
                  </button>
                );
              })}
            </div>

            <div className="ml-auto flex gap-2">
              {['Banho & Tosa', 'Veterinário', 'Hospedagem'].map(f => (
                <button key={f} className="px-3 py-1 rounded-full border border-gray-200 dark:border-gray-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center gap-1">
                  <span className={`w-2 h-2 rounded-full ${f === 'Banho & Tosa' ? 'bg-blue-500' :
                    f === 'Veterinário' ? 'bg-purple-500' : 'bg-orange-500'
                    }`}></span>
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* Grid Header */}
          <div className="flex border-b border-gray-100 dark:border-gray-800 min-w-[800px] bg-white dark:bg-[#15281e]">
            <div className="w-20 shrink-0 border-r border-gray-50 dark:border-gray-800 bg-white dark:bg-surface-dark/50"></div> {/* Time Col Header */}
            {daysInView.map((day, i) => (
              <div key={i} className={`flex-1 py-3 text-center border-r border-gray-50 dark:border-gray-800 last:border-r-0 ${isToday(day) ? 'bg-emerald-50/30 dark:bg-emerald-900/10' : 'bg-white dark:bg-surface-dark'}`}>
                <p className="text-xs font-bold text-slate-400 uppercase">{day.toLocaleDateString('pt-BR', { weekday: 'short' })}</p>
                <p className={`text-xl font-black mt-1 ${isToday(day) ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-900 dark:text-white'}`}>
                  {day.getDate()}
                </p>
              </div>
            ))}
          </div>

          {/* Grid Body */}
          <div className="flex-1 relative min-w-[800px] bg-white dark:bg-[#15281e]">
            {/* Time Rows */}
            {hours.map((h, i) => (
              <div key={h} className="flex h-[120px] border-b border-gray-50 dark:border-gray-800 group">
                <div className="w-20 shrink-0 border-r border-gray-50 dark:border-gray-800 flex justify-center py-2 relative bg-white dark:bg-[#15281e]">
                  <span className="text-xs font-bold text-slate-400 -mt-2.5 bg-white dark:bg-[#15281e] px-1 relative z-10">
                    {h.toString().padStart(2, '0')}:00
                  </span>
                </div>
                {daysInView.map((d, j) => (
                  <div key={j} className="flex-1 border-r border-gray-50 dark:border-gray-800 last:border-r-0 relative group-hover:bg-gray-50/30 dark:group-hover:bg-white/5 transition-colors">
                    {/* Render Appointments here */}
                    {appointments.filter(a =>
                      a.date === getLocalDateString(d) &&
                      parseInt(a.start_time.split(':')[0]) === h
                    ).map(apt => {
                      const startMin = parseInt(apt.start_time.split(':')[1]);
                      // const duration = 60; 

                      const style = {
                        top: `${(startMin / 60) * 100}%`,
                        height: '90%',
                        minHeight: '40px'
                      };

                      return (
                        <div
                          key={apt.id}
                          className={`absolute left-1 right-1 rounded-lg border-l-4 p-2 shadow-sm cursor-pointer hover:shadow-md transition-all z-10 ${getServiceColor(apt.service_type)} bg-white dark:bg-surface-dark`}
                          style={style}
                          onClick={() => {
                            setCheckoutData({
                              name: apt.service_type,
                              price: 0,
                              clientName: apt.client?.full_name,
                              clientId: apt.client_id,
                              petName: apt.pet?.name,
                              appointmentId: apt.id
                            });
                            setIsCheckoutOpen(true);
                          }}
                        >
                          <div className="flex items-start gap-2 h-full overflow-hidden">
                            <div className="shrink-0 pt-0.5">
                              {apt.client?.avatar_url ? (
                                <img src={apt.client.avatar_url} className="w-6 h-6 rounded-full object-cover" alt="" />
                              ) : (
                                <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-[10px] font-bold dark:text-white">
                                  {apt.client?.full_name.charAt(0)}
                                </div>
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-bold truncate leading-tight dark:text-white">{apt.client?.full_name}</p>
                              <p className="text-[10px] opacity-80 truncate leading-tight mt-0.5 dark:text-slate-300">{apt.service_type}</p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            ))}

            {/* Current Time Line (Mocked position for visual) */}
            <div className="absolute left-20 right-0 top-[350px] border-t-2 border-red-500 z-20 pointer-events-none opacity-50">
              <div className="absolute -left-1.5 -top-1.5 w-3 h-3 bg-red-500 rounded-full"></div>
            </div>
          </div>
        </div>

        {/* Sidebar Navigation (Right) */}
        <div className="w-[300px] border-l border-gray-100 dark:border-gray-800 bg-white dark:bg-surface-dark flex flex-col">
          <div className="p-6">
            <h3 className="font-bold text-slate-900 dark:text-white mb-4">Próximos</h3>
            <div className="space-y-4">
              {getUpcomingAppointments().length === 0 ? (
                <p className="text-sm text-slate-400">Nenhum agendamento próximo.</p>
              ) : (
                getUpcomingAppointments().map(apt => (
                  <div key={apt.id} className="p-4 rounded-2xl border border-red-100 dark:border-red-900/30 bg-red-50/30 dark:bg-red-900/10 flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-white dark:bg-surface-dark border border-red-100 dark:border-red-900/30 flex items-center justify-center shrink-0 shadow-sm text-red-500 dark:text-red-400">
                      <span className="material-symbols-outlined text-[20px]">{getServiceIcon(apt.service_type)}</span>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-red-500 dark:text-red-400 mb-0.5">
                        {new Date(apt.date + 'T' + apt.start_time).getTime() - new Date().getTime() < 3600000 ? 'Começa em breve' : apt.start_time}
                      </p>
                      <h4 className="font-bold text-slate-900 dark:text-white">{apt.pet?.name || 'Pet'}</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{apt.service_type}</p>
                    </div>
                    <div className="ml-auto w-2 h-2 rounded-full bg-red-400 mt-1.5"></div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="p-6 border-t border-gray-100 dark:border-gray-800">
            <h3 className="font-bold text-slate-900 dark:text-white mb-4">Equipe Disponível</h3>
            <div className="space-y-4">
              {[
                { name: 'Ana Souza', role: 'Banho e Tosa', status: 'online' },
                { name: 'Carlos M.', role: 'Veterinário', status: 'busy' },
                { name: 'Julia P.', role: 'Recepcionista', status: 'online' }
              ].map((staff, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
                      <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${staff.name}`} alt="" />
                    </div>
                    <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white dark:border-surface-dark ${staff.status === 'online' ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">{staff.name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{staff.role}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-auto p-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800">
            <button className="w-full py-2 flex items-center justify-center gap-2 text-sm font-bold text-slate-500 hover:text-primary transition-colors dark:text-slate-400 dark:hover:text-primary">
              <span className="material-symbols-outlined text-[18px]">history</span>
              Ver histórico recente
            </button>
          </div>
        </div>
      </div>

      {/* Checkout Modal */}
      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        appointmentData={checkoutData}
        onSuccess={() => {
          setIsCheckoutOpen(false);
          fetchAppointments();
        }}
      />

      {/* Modal Novo Agendamento */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-surface-dark rounded-2xl shadow-2xl w-full max-w-md p-6 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Novo Agendamento</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-500 hover:text-red-500 transition-colors"><span className="material-symbols-outlined">close</span></button>
            </div>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Cliente</label>
                <select
                  value={selectedClient}
                  onChange={e => setSelectedClient(e.target.value)}
                  className="w-full h-11 rounded-xl border-gray-200 bg-gray-50 px-3 dark:bg-gray-800 dark:border-gray-700 dark:text-white focus:ring-primary focus:border-primary"
                  required
                >
                  <option value="" className="dark:bg-surface-dark">Selecione...</option>
                  {clients.map(c => <option key={c.id} value={c.id} className="dark:bg-surface-dark">{c.full_name}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Data</label>
                  <input
                    type="date"
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    className="w-full h-11 rounded-xl border-gray-200 bg-gray-50 px-3 dark:bg-gray-800 dark:border-gray-700 dark:text-white focus:ring-primary focus:border-primary"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Hora</label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={e => setStartTime(e.target.value)}
                    className="w-full h-11 rounded-xl border-gray-200 bg-gray-50 px-3 dark:bg-gray-800 dark:border-gray-700 dark:text-white focus:ring-primary focus:border-primary"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Serviço</label>
                <select
                  value={serviceType}
                  onChange={e => setServiceType(e.target.value)}
                  className="w-full h-11 rounded-xl border-gray-200 bg-gray-50 px-3 dark:bg-gray-800 dark:border-gray-700 dark:text-white focus:ring-primary focus:border-primary"
                >
                  <option className="dark:bg-surface-dark">Banho & Tosa</option>
                  <option className="dark:bg-surface-dark">Consulta Veterinária</option>
                  <option className="dark:bg-surface-dark">Vacinação</option>
                  <option className="dark:bg-surface-dark">Exame</option>
                </select>
              </div>

              <button type="submit" className="w-full h-12 bg-primary text-white font-bold rounded-xl mt-4 hover:bg-primary-dark transition-colors shadow-lg shadow-primary/20">Confirmar</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Agenda;
