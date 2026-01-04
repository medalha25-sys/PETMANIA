import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';
import CalendarModal from '../components/CalendarModal';
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
  // Current Week State (Simplified for MVP: Hardcoded days but mapped to real dates if needed, or just visual)
  // For MVP, we will stick to a visual representation but allow creating appointments on specific dates.
  // Ideally, we should generate the days dynamically.

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  // Checkout State
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

  const [filter, setFilter] = useState('all'); // 'all', 'bath', 'vet'
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'month'>('month'); // Default to month view
  const [expandedDay, setExpandedDay] = useState<string | null>(null); // For double-click detail view

  const hours = Array.from({ length: 15 }, (_, i) => i + 7); // 7am to 9pm

  // Helper for local date string YYYY-MM-DD
  const getLocalDateString = (date: Date) => {
    const offset = date.getTimezoneOffset() * 60000;
    const local = new Date(date.getTime() - offset);
    return local.toISOString().split('T')[0];
  };

  // Helper to get days for Month View (6 weeks grid)
  const getMonthDays = () => {
    const curr = new Date(); // Ideally use a selected date state for navigation
    const year = curr.getFullYear();
    const month = curr.getMonth();

    const firstDay = new Date(year, month, 1);

    // Start from the Sunday before the first day
    const startDate = new Date(firstDay);
    startDate.setDate(firstDay.getDate() - firstDay.getDay()); // 0 is Sunday

    const days = [];
    // 6 weeks * 7 days = 42 days to ensure full grid
    for (let i = 0; i < 42; i++) {
      const d = new Date(startDate);
      d.setDate(startDate.getDate() + i);
      days.push({
        name: d.toLocaleDateString('pt-BR', { weekday: 'short' }),
        dateNum: d.getDate(),
        fullDate: getLocalDateString(d),
        isCurrentMonth: d.getMonth() === month,
        active: d.getDate() === new Date().getDate() && d.getMonth() === new Date().getMonth()
      });
    }
    return days;
  };

  // Generate dates based on view mode (Day/Week)
  const getVisibleDays = () => {
    if (viewMode === 'month') return [];

    const curr = new Date();
    const days = [];

    if (viewMode === 'day') {
      days.push({
        name: curr.toLocaleDateString('pt-BR', { weekday: 'long' }),
        dateNum: curr.getDate(),
        fullDate: getLocalDateString(curr),
        active: true
      });
    } else {
      const first = curr.getDate() - curr.getDay(); // Start Week on Sunday (0) to match month view standard
      for (let i = 0; i < 7; i++) {
        let next = new Date(curr.getTime());
        next.setDate(first + i);
        days.push({
          name: next.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', ''),
          dateNum: next.getDate(),
          fullDate: getLocalDateString(next),
          active: next.getDate() === curr.getDate()
        });
      }
    }
    return days;
  };

  const [days, setDays] = useState(getVisibleDays());
  const [monthGrid, setMonthGrid] = useState(getMonthDays());

  useEffect(() => {
    if (viewMode === 'month') {
      setMonthGrid(getMonthDays());
    } else {
      setDays(getVisibleDays());
    }
  }, [viewMode]);

  useEffect(() => {
    fetchAppointments();
    fetchClients();
  }, []);

  const fetchAppointments = async () => {
    const { data, error } = await supabase
      .from('appointments')
      .select('*, client:clients(full_name, avatar_url, mobile), pet:pets(name)')
      .neq('status', 'completed');
    if (data) setAppointments(data);
  };

  const fetchClients = async () => {
    const { data } = await supabase.from('clients').select('id, full_name');
    if (data) setClients(data);
  };

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

  const handleWhatsAppReminder = (apt: Appointment) => {
    if (!apt.client?.mobile) {
      alert('Cliente sem número de celular cadastrado.');
      return;
    }

    const cleanNumber = apt.client.mobile.replace(/\D/g, '');
    const message = `Olá ${apt.client.full_name}, lembrete do seu agendamento para ${apt.service_type} no dia ${new Date(apt.date + 'T00:00:00').toLocaleDateString('pt-BR')} às ${apt.start_time}.`;

    window.open(`https://wa.me/55${cleanNumber}?text=${encodeURIComponent(message)}`, '_blank');
  };

  // Bulk Delete State
  const [selectedApps, setSelectedApps] = useState<Set<string>>(new Set());
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | 'selected' | null>(null);

  const toggleSelection = (id: string) => {
    const newSet = new Set(selectedApps);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedApps(newSet);
  };

  const handleDeleteAppointment = (id: string) => {
    setDeleteTarget(id);
    setShowDeleteConfirm(true);
  };

  const triggerBulkDelete = () => {
    if (selectedApps.size === 0) return;
    setDeleteTarget('selected');
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;

    try {
      let idsToDelete: string[] = [];

      if (deleteTarget === 'selected') {
        idsToDelete = Array.from(selectedApps);
      } else {
        idsToDelete = [deleteTarget];
      }

      const { error } = await supabase.from('appointments').delete().in('id', idsToDelete);

      if (error) throw error;

      // Update local state by removing the deleted appointments
      setAppointments(prev => prev.filter(a => !idsToDelete.includes(a.id)));

      // Clear selection logic
      if (deleteTarget === 'selected') {
        setSelectedApps(new Set());
      } else if (selectedApps.has(deleteTarget)) {
        const newSet = new Set(selectedApps);
        newSet.delete(deleteTarget);
        setSelectedApps(newSet);
      }

      setShowDeleteConfirm(false);
      setDeleteTarget(null);

    } catch (error) {
      console.error('Error deleting appointment(s):', error);
      alert('Erro ao excluir agendamento(s).');
    }
  };

  // Temp Data Generator
  const generateMockData = async () => {
    if (!confirm('Isso vai gerar agendamentos para os próximos 5 dias. Continuar?')) return;
    setLoading(true);
    try {
      // Get all clients
      const { data: clientsData } = await supabase.from('clients').select('id');
      if (!clientsData || clientsData.length === 0) {
        alert('Precisa de clientes cadastrados primeiro!');
        return;
      }

      const today = new Date();
      const newAppointments = [];
      const services = ['Banho & Tosa', 'Consulta Veterinária', 'Vacinação', 'Exame'];

      // Generate for the next 5 days
      for (let i = 0; i < 5; i++) {
        const currentDate = new Date(today);
        currentDate.setDate(today.getDate() + i);

        // Create 10-15 random appointments per day
        const count = Math.floor(Math.random() * 6) + 10; // 10 to 15

        for (let j = 0; j < count; j++) {
          const client = clientsData[Math.floor(Math.random() * clientsData.length)];
          const service = services[Math.floor(Math.random() * services.length)];

          // Random time between 8 and 18
          const startHour = Math.floor(Math.random() * 10) + 8;
          const startMin = Math.random() > 0.5 ? '00' : '30';
          const endHour = startMin === '30' ? startHour + 1 : startHour + 1;
          const endMin = startMin;

          const dateStr = getLocalDateString(currentDate);

          newAppointments.push({
            client_id: client.id,
            date: dateStr,
            start_time: `${startHour}:${startMin}`,
            end_time: `${endHour}:${endMin}`, // 1h duration approx
            service_type: service,
            status: 'confirmed',
            notes: 'Gerado automaticamente'
          });
        }
      }

      // Batch insert (chunks of 100 just to be safe)
      for (let i = 0; i < newAppointments.length; i += 100) {
        const chunk = newAppointments.slice(i, i + 100);
        const { error } = await supabase.from('appointments').insert(chunk);
        if (error) console.error('Error inserting chunk', error);
      }

      alert('Dados gerados para 5 dias com sucesso!');
      fetchAppointments();
    } catch (err) {
      console.error(err);
      alert('Erro ao gerar dados');
    } finally {
      setLoading(false);
    }
  };

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
        status: 'confirmed' // Default status
      });

      if (error) throw error;

      alert('Agendamento criado com sucesso!');
      setIsModalOpen(false);
      fetchAppointments();
      // Reset form
      alert('Agendamento criado com sucesso!');
      setIsModalOpen(false);
      fetchAppointments();
      // Reset form
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

  // Helper to calculate position and height of appointment card
  const getAppointmentStyle = (apt: Appointment) => {
    const startHour = parseInt(apt.start_time.split(':')[0]);
    const startMin = parseInt(apt.start_time.split(':')[1]);
    const endHour = parseInt(apt.end_time.split(':')[0]);
    const endMin = parseInt(apt.end_time.split(':')[1]);

    const startTotalMinutes = (startHour - 7) * 60 + startMin; // 7 is start of day
    const durationMinutes = ((endHour * 60) + endMin) - ((startHour * 60) + startMin);

    // Increased height for better readability
    const hourHeight = 120;

    // px per hour
    const top = (startTotalMinutes / 60) * hourHeight;
    const height = (durationMinutes / 60) * hourHeight;

    return {
      top: `${top}px`,
      height: `${height}px`
    };
  };

  // Helpers for Month View styling
  const getServiceColor = (type: string) => {
    switch (type) {
      case 'Banho & Tosa': return 'bg-blue-600 border-blue-700 text-white';
      case 'Consulta Veterinária': return 'bg-purple-600 border-purple-700 text-white';
      case 'Vacinação': return 'bg-orange-500 border-orange-600 text-white';
      case 'Exame': return 'bg-emerald-600 border-emerald-700 text-white';
      default: return 'bg-slate-600 border-slate-700 text-white';
    }
  };

  return (
    <div className="flex flex-col min-h-full bg-background-light dark:bg-background-dark relative">
      {/* Page Header */}
      <div className="flex flex-col gap-4 px-6 py-5 border-b border-slate-200 dark:border-slate-800 shrink-0">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight">Calendário de Agendamentos</h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Gerencie os horários de banho, tosa e consultas veterinárias.</p>
          </div>
          <div className="flex gap-3">
            <button onClick={generateMockData} className="hidden sm:flex h-10 items-center px-4 rounded-xl border border-pink-200 bg-pink-50 text-pink-700 text-sm font-bold hover:bg-pink-100 transition-colors mr-2">
              <span className="material-symbols-outlined mr-2 text-[18px]">science</span>
              Gerar Teste
            </button>
            <button onClick={() => setIsCalendarOpen(true)} className="hidden sm:flex h-10 items-center px-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-surface-dark text-sm font-bold hover:bg-slate-50 transition-colors text-slate-700 dark:text-slate-200">
              <span className="material-symbols-outlined mr-2 text-[18px]">calendar_month</span>
              Calendário
            </button>
            <button className="hidden sm:flex h-10 items-center px-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-surface-dark text-sm font-bold hover:bg-slate-50 transition-colors text-slate-700 dark:text-slate-200">
              <span className="material-symbols-outlined mr-2 text-[18px]">ios_share</span>
              Exportar
            </button>
            <button onClick={() => setIsModalOpen(true)} className="h-10 px-4 bg-primary hover:bg-primary-dark text-slate-900 text-sm font-bold rounded-xl flex items-center shadow-lg shadow-primary/20 transition-all">
              <span className="material-symbols-outlined mr-2 text-[20px]">add</span>
              Novo Agendamento
            </button>
          </div>
        </div>

        {/* Filters Row */}
        <div className="flex flex-wrap items-center justify-between gap-4 mt-2">
          <div className="flex items-center bg-white dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-slate-800 p-1 shadow-sm">
            <button className="size-8 flex items-center justify-center rounded-lg hover:bg-slate-50 text-slate-900 dark:text-white transition-colors">
              <span className="material-symbols-outlined text-[20px]">chevron_left</span>
            </button>
            <span className="px-4 text-sm font-bold text-slate-900 dark:text-white min-w-[140px] text-center">
              {new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
            </span>
            <button className="size-8 flex items-center justify-center rounded-lg hover:bg-slate-50 text-slate-900 dark:text-white transition-colors">
              <span className="material-symbols-outlined text-[20px]">chevron_right</span>
            </button>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1 hide-scrollbar">
            {/* View Mode Toggle */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg p-1 mr-4">
              <button
                onClick={() => setViewMode('day')}
                className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${viewMode === 'day'
                  ? 'bg-white dark:bg-surface-dark text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
              >
                Dia
              </button>
              <button
                onClick={() => setViewMode('week')}
                className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${viewMode === 'week'
                  ? 'bg-white dark:bg-surface-dark text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
              >
                Semana
              </button>
              <button
                onClick={() => setViewMode('month')}
                className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${viewMode === 'month'
                  ? 'bg-white dark:bg-surface-dark text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
              >
                Mês
              </button>
            </div>

            <button
              onClick={() => setFilter('all')}
              className={`flex h-8 items-center gap-2 px-3 rounded-lg text-xs font-bold transition-colors ${filter === 'all'
                ? 'bg-primary text-slate-900 ring-2 ring-primary ring-offset-1 dark:ring-offset-background-dark'
                : 'bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:border-primary/50'
                }`}
            >
              <span className="material-symbols-outlined text-[16px]">check</span> Todos
            </button>
            <button
              onClick={() => setFilter('bath')}
              className={`flex h-8 items-center gap-2 px-3 rounded-lg text-xs font-medium transition-colors ${filter === 'bath'
                ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                : 'bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:border-primary/50'
                }`}
            >
              <span className="material-symbols-outlined text-[16px] text-blue-500">shower</span> Banho & Tosa
            </button>
            <button
              onClick={() => setFilter('vet')}
              className={`flex h-8 items-center gap-2 px-3 rounded-lg text-xs font-medium transition-colors ${filter === 'vet'
                ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800'
                : 'bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:border-primary/50'
                }`}
            >
              <span className="material-symbols-outlined text-[16px] text-red-500">stethoscope</span> Veterinário
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 relative">
        <div className="flex flex-col flex-1 bg-slate-50 dark:bg-[#15281e] p-4">
          <div className={`grid gap-px bg-slate-200 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden shadow-sm ${viewMode === 'day' ? 'grid-cols-1' : 'grid-cols-7'}`}>

            {/* Headers - Show for Week and Month modes, or adapted for Day */}
            {viewMode !== 'day' && ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
              <div key={day} className="bg-white dark:bg-surface-dark py-2 text-center text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                {day}
              </div>
            ))}

            {/* Days Grid */}
            {(viewMode === 'month' ? monthGrid : days).map((day, idx) => (
              <div
                key={`${day.dateNum}-${idx}`}
                onDoubleClick={() => setExpandedDay(day.fullDate)}
                className={`min-h-[80px] bg-white dark:bg-surface-dark p-2 flex flex-col gap-1 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50 ${!day.isCurrentMonth && viewMode === 'month' ? 'bg-slate-50/50 dark:bg-slate-900/40 text-slate-400' : ''}`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-sm font-bold w-7 h-7 flex items-center justify-center rounded-full ${day.active ? 'bg-primary text-slate-900' : 'text-slate-700 dark:text-slate-300'}`}>
                    {day.dateNum}
                  </span>
                  {viewMode === 'day' && <span className="text-sm font-bold text-slate-500 uppercase">{day.name}</span>}
                </div>

                {/* Appointment Stack */}
                <div className="flex flex-col gap-1">
                  {appointments
                    .filter(apt => apt.date === day.fullDate)
                    .filter(apt => {
                      if (filter === 'all') return true;
                      if (filter === 'bath') return apt.service_type === 'Banho & Tosa';
                      if (filter === 'vet') return ['Consulta Veterinária', 'Vacinação', 'Exame'].includes(apt.service_type);
                      return true;
                    })
                    .map(apt => (
                      <div key={apt.id} className={`group relative flex items-center gap-3 p-3 rounded-xl border shadow-sm cursor-pointer hover:opacity-100 hover:shadow-md transition-all ${getServiceColor(apt.service_type)}`}>
                        <div className="shrink-0 size-9 bg-white/20 rounded-full flex items-center justify-center overflow-hidden">
                          {apt.client?.avatar_url ? (
                            <img src={apt.client.avatar_url} alt="Av" className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-xs font-bold text-white">{apt.client?.full_name.charAt(0)}</span>
                          )}
                        </div>
                        <div className="flex flex-col overflow-hidden w-full pr-6">
                          <span className="text-sm font-bold leading-tight truncate">{apt.client?.full_name}</span>
                          <span className="text-xs opacity-90 leading-tight truncate mt-0.5">
                            {apt.service_type}
                            {apt.pet?.name && <span className="opacity-75"> - {apt.pet.name}</span>}
                          </span>
                        </div>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteAppointment(apt.id);
                          }}
                          className="absolute right-2 top-1/2 -translate-y-1/2 size-7 bg-white/20 hover:bg-red-500 hover:text-white text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all z-10"
                          title="Excluir"
                        >
                          <span className="material-symbols-outlined text-[16px]">close</span>
                        </button>
                      </div>
                    ))
                  }
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {
        expandedDay && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-surface-dark w-full max-w-2xl max-h-[80vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
              {/* Header */}
              <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white capitalize">
                    {new Date(expandedDay + 'T00:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
                  </h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {appointments.filter(a => a.date === expandedDay).length} agendamentos
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {selectedApps.size > 0 && (
                    <button
                      onClick={triggerBulkDelete}
                      className="px-3 py-1.5 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-sm font-bold rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors animate-in fade-in slide-in-from-right-4"
                    >
                      Excluir ({selectedApps.size})
                    </button>
                  )}
                  <button onClick={() => { setExpandedDay(null); setSelectedApps(new Set()); }} className="size-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center hover:bg-slate-300 transition-all">
                    <span className="material-symbols-outlined text-sm">close</span>
                  </button>
                </div>
              </div>
              {/* Content */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-100 dark:bg-[#0f1c15]">
                {appointments.filter(a => a.date === expandedDay).length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-48 text-slate-400">
                    <span className="material-symbols-outlined text-4xl mb-2">event_busy</span>
                    <p>Sem agendamentos para este dia</p>
                  </div>
                ) : (
                  appointments.filter(a => a.date === expandedDay).sort((a, b) => a.start_time.localeCompare(b.start_time)).map(apt => (
                    // Detailed Card
                    <div
                      key={apt.id}
                      className={`bg-white dark:bg-surface-dark p-4 rounded-xl shadow-sm border flex gap-4 hover:shadow-md transition-all cursor-pointer ${selectedApps.has(apt.id) ? 'border-primary ring-1 ring-primary' : 'border-slate-200 dark:border-slate-800'}`}
                      onClick={() => toggleSelection(apt.id)}
                    >
                      <div className="flex items-center justify-center shrink-0">
                        <input
                          type="checkbox"
                          checked={selectedApps.has(apt.id)}
                          onChange={() => toggleSelection(apt.id)}
                          className="w-5 h-5 rounded border-slate-300 text-primary focus:ring-primary cursor-pointer"
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                      <div className="flex flex-col items-center justify-center w-14 shrink-0 border-r border-slate-100 dark:border-slate-800 pr-4">
                        <span className="text-lg font-bold text-slate-900 dark:text-white">{apt.start_time}</span>
                        <span className="text-xs text-slate-400">{apt.end_time}</span>
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-bold text-slate-900 dark:text-white text-lg leading-tight">{apt.client?.full_name}</h3>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium mt-1 ${getServiceColor(apt.service_type).replace('border-', 'border ')}`}>
                              {apt.service_type}
                            </span>
                            {apt.pet?.name && (
                              <span className="ml-2 text-xs text-slate-500 font-medium bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full border border-slate-200 dark:border-slate-700">
                                {apt.pet.name}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="size-10 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden shrink-0">
                              {apt.client?.avatar_url ? <img src={apt.client.avatar_url} alt="Ava" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center font-bold text-slate-500">{apt.client?.full_name && apt.client.full_name.charAt(0)}</div>}
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleWhatsAppReminder(apt);
                              }}
                              className="size-9 rounded-full bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 hover:bg-green-100 hover:text-green-700 dark:hover:bg-green-900/40 flex items-center justify-center transition-all group"
                              title="Enviar Lembrete WhatsApp"
                            >
                              <span className="material-symbols-outlined text-[18px]">chat</span>
                            </button>

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setCheckoutData({
                                  name: apt.service_type,
                                  price: 0, // Should come from service catalog ideally
                                  clientName: apt.client?.full_name,
                                  clientId: apt.client_id,
                                  petName: apt.pet?.name,
                                  appointmentId: apt.id
                                });
                                setIsCheckoutOpen(true);
                              }}
                              className="size-9 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 hover:text-blue-700 dark:hover:bg-blue-900/40 flex items-center justify-center transition-all group"
                              title="Finalizar / Pagar"
                            >
                              <span className="material-symbols-outlined text-[20px]">point_of_sale</span>
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteAppointment(apt.id);
                              }}
                              className="size-9 rounded-full bg-slate-50 dark:bg-slate-800 text-slate-400 hover:bg-red-50 hover:text-red-500 flex items-center justify-center transition-all group"
                              title="Excluir Agendamento"
                            >
                              <span className="material-symbols-outlined text-[20px]">delete</span>
                            </button>
                          </div>
                        </div>
                        {apt.notes && (
                          <div className="mt-3 text-sm text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/50 p-2 rounded-lg border border-slate-100 dark:border-slate-800/50">
                            <span className="font-bold mr-1">Nota:</span> {apt.notes}
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
              {/* Footer Actions */}
              <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-surface-dark flex justify-end">
                <button
                  onClick={() => {
                    setDate(expandedDay);
                    setIsModalOpen(true);
                    setExpandedDay(null);
                  }}
                  className="px-4 py-2 bg-primary text-slate-900 rounded-lg font-bold shadow-lg shadow-primary/20 hover:scale-105 transition-transform flex items-center gap-2"
                >
                  <span className="material-symbols-outlined">add</span>
                  Adicionar neste dia
                </button>
              </div>
            </div>
          </div>
        )
      }

      {/* Modal Novo Agendamento */}
      {
        isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-surface-dark rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto p-6 animate-in fade-in zoom-in duration-200">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Novo Agendamento</h2>
                <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-red-500 transition-colors">
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              <form onSubmit={handleSave} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Cliente</label>
                  <select
                    required
                    value={selectedClient}
                    onChange={(e) => setSelectedClient(e.target.value)}
                    className="w-full h-11 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent px-4 focus:ring-primary focus:border-primary dark:text-white"
                  >
                    <option value="" className="text-slate-900 bg-white dark:bg-surface-dark dark:text-white">Selecione um cliente</option>
                    {clients.map(client => (
                      <option key={client.id} value={client.id} className="text-slate-900 bg-white dark:bg-surface-dark dark:text-white">{client.full_name}</option>
                    ))}
                  </select>
                </div>

                {selectedClient && (
                  <div className="space-y-1 animate-in fade-in slide-in-from-top-2">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Pet (Opcional)</label>
                    <select
                      value={selectedPet}
                      onChange={(e) => setSelectedPet(e.target.value)}
                      className="w-full h-11 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent px-4 focus:ring-primary focus:border-primary dark:text-white"
                    >
                      <option value="" className="text-slate-900 bg-white dark:bg-surface-dark dark:text-white">Selecione o pet...</option>
                      {clientPets.map(pet => (
                        <option key={pet.id} value={pet.id} className="text-slate-900 bg-white dark:bg-surface-dark dark:text-white">{pet.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Data</label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full h-11 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent px-4 focus:ring-primary focus:border-primary dark:text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Início</label>
                    <input
                      type="time"
                      required
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="w-full h-11 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent px-4 focus:ring-primary focus:border-primary dark:text-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Fim</label>
                    <input
                      type="time"
                      required
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="w-full h-11 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent px-4 focus:ring-primary focus:border-primary dark:text-white"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Tipo de Serviço</label>
                  <select
                    value={serviceType}
                    onChange={(e) => setServiceType(e.target.value)}
                    className="w-full h-11 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent px-4 focus:ring-primary focus:border-primary dark:text-white"
                  >
                    <option value="Banho & Tosa" className="text-slate-900 bg-white dark:bg-surface-dark dark:text-white">Banho & Tosa</option>
                    <option value="Consulta Veterinária" className="text-slate-900 bg-white dark:bg-surface-dark dark:text-white">Consulta Veterinária</option>
                    <option value="Vacinação" className="text-slate-900 bg-white dark:bg-surface-dark dark:text-white">Vacinação</option>
                    <option value="Exame" className="text-slate-900 bg-white dark:bg-surface-dark dark:text-white">Exame</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Notas</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full h-24 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent p-4 focus:ring-primary focus:border-primary dark:text-white resize-none"
                    placeholder="Observações importantes..."
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-12 rounded-xl bg-primary hover:bg-primary-dark text-slate-900 font-bold shadow-lg shadow-primary/20 flex items-center justify-center gap-2 mt-4"
                >
                  {loading && <span className="material-symbols-outlined animate-spin text-sm">refresh</span>}
                  {loading ? 'Agendando...' : 'Confirmar Agendamento'}
                </button>
              </form>
            </div>
          </div>
        )
      }

      {/* Calendar Modal */}
      <CalendarModal
        isOpen={isCalendarOpen}
        onClose={() => setIsCalendarOpen(false)}
        onSelectDate={(date) => {
          setDate(date);
          setIsModalOpen(true);
          setIsCalendarOpen(false);
        }}
        appointments={appointments}
      />

      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        initialService={checkoutData}
        onSuccess={() => {
          fetchAppointments();
        }}
      />

      {/* Confirmation Modal */}
      {
        showDeleteConfirm && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-surface-dark rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden p-6 animate-in zoom-in-95 duration-200 border border-slate-200 dark:border-slate-800">
              <div className="flex flex-col items-center text-center gap-4">
                <div className="size-12 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 flex items-center justify-center">
                  <span className="material-symbols-outlined text-2xl">delete</span>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    {deleteTarget === 'selected'
                      ? `Excluir ${selectedApps.size} agendamentos?`
                      : 'Excluir agendamento?'}
                  </h3>
                  <p className="text-sm text-slate-500 mt-1">
                    Essa ação não pode ser desfeita. Os dados serão removidos permanentemente.
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3 w-full mt-2">
                  <button
                    onClick={() => { setShowDeleteConfirm(false); setDeleteTarget(null); }}
                    className="h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-sm hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={confirmDelete}
                    className="h-10 rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold text-sm shadow-lg shadow-red-500/20 transition-all"
                  >
                    Excluir
                  </button>
                </div>
              </div>
            </div>
          </div>
        )
      }

    </div >
  );
};

export default Agenda;
