import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';
import { SERVICES } from '../constants';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [showRevenue, setShowRevenue] = useState(true);

  // Real Data States
  const [appointments, setAppointments] = useState<any[]>([]);
  const [dailyRevenue, setDailyRevenue] = useState(0);
  const [todayCount, setTodayCount] = useState(0);

  const [openMenuId, setOpenMenuId] = useState<number | null>(null);

  // Dynamic Notices State
  const [notices, setNotices] = useState<{
    id: string;
    type: 'inventory' | 'expiration';
    title: string;
    description: string;
    time: string;
    priority: 'low' | 'medium' | 'high' | 'critical';
  }[]>([]);

  const [itemsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const toggleMenu = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setOpenMenuId(openMenuId === id ? null : id);
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setOpenMenuId(null);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  useEffect(() => {
    fetchAppointments();
    fetchNotices();
    fetchNotes();
    fetchDailyStats();
  }, []);

  const fetchDailyStats = async () => {
    const today = new Date().toISOString().split('T')[0];

    // Revenue
    const { data: revenueData } = await supabase
      .from('financial_records')
      .select('amount')
      .eq('type', 'income')
      .eq('date', today);

    const revenue = revenueData?.reduce((acc, curr) => acc + (curr.amount || 0), 0) || 0;
    setDailyRevenue(revenue);

    // Appointment Count
    const { count } = await supabase
      .from('appointments')
      .select('*', { count: 'exact', head: true })
      .eq('date', today)
      .neq('status', 'cancelled');

    setTodayCount(count || 0);
  };

  const fetchAppointments = async () => {
    const { data } = await supabase
      .from('appointments')
      .select('*, client:clients(full_name, avatar_url)')
      .neq('status', 'completed')
      .order('date', { ascending: true })
      .order('start_time', { ascending: true })
      .limit(20);

    if (data) {
      const formatted = data.map(app => ({
        id: app.id,
        time: app.start_time.slice(0, 5),
        pet: app.client?.full_name || 'Cliente',
        avatar: app.client?.avatar_url || '',
        service: app.service_type,
        status: app.status === 'confirmed' ? 'Confirmado' :
          app.status === 'pending' ? 'Pendente' :
            app.status === 'cancelled' ? 'Cancelado' :
              app.status === 'completed' ? 'Concluído' : app.status,
        original_date: app.date
      }));
      setAppointments(formatted);
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    setOpenMenuId(null);

    // Map UI status to DB status
    let dbStatus = 'pending';
    if (newStatus === 'Confirmado') dbStatus = 'confirmed';
    if (newStatus === 'Cancelado') dbStatus = 'cancelled';
    if (newStatus === 'Pendente') dbStatus = 'pending';
    if (newStatus === 'Concluído') dbStatus = 'completed';

    try {
      if (dbStatus === 'completed') {
        // 1. Get Appointment Details
        const app = appointments.find(a => a.id === id);
        if (!app) return;

        // 2. Find Price
        const service = SERVICES.find(s => s.name === app.service);
        const price = service ? service.price : 0;

        // 3. Insert into Financial Records
        const { error: finError } = await supabase.from('financial_records').insert({
          description: `${app.service} - ${app.pet}`,
          amount: price,
          type: 'income',
          category: 'Serviços',
          date: new Date().toISOString().split('T')[0],
          appointment_id: id
        });
        if (finError) console.error('Error creating financial record:', finError);

        // 4. Update Appointment Status
        await supabase.from('appointments').update({ status: 'completed' }).eq('id', id);

        // 5. Remove from list (visual "delete" from agenda view)
        setAppointments(prev => prev.filter(a => a.id !== id));

        // 6. Update Stats
        fetchDailyStats();

      } else {
        // Optimistic Update
        setAppointments(prev => prev.map(app =>
          app.id === id ? { ...app, status: newStatus } : app
        ));

        // Update DB
        await supabase.from('appointments').update({ status: dbStatus }).eq('id', id);
      }
    } catch (err) {
      console.error("Error updating status:", err);
      fetchAppointments(); // Revert on error
    }
  };

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

  // Notes Logic
  const [notes, setNotes] = useState<{ id: string; content: string; is_completed: boolean }[]>([]);
  const [newNoteContent, setNewNoteContent] = useState('');
  const [expandedNoteId, setExpandedNoteId] = useState<string | null>(null);

  const fetchNotes = async () => {
    const { data } = await supabase
      .from('dashboard_notes')
      .select('*')
      .order('created_at', { ascending: false });

    if (data) setNotes(data);
  };

  const handleAddNote = async () => {
    if (!newNoteContent.trim()) return;

    const { data, error } = await supabase
      .from('dashboard_notes')
      .insert([{ content: newNoteContent }])
      .select()
      .single();

    if (data) {
      setNotes([data, ...notes]);
      setNewNoteContent('');
    }
  };

  const handleToggleNote = async (id: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from('dashboard_notes')
      .update({ is_completed: !currentStatus })
      .eq('id', id);

    if (!error) {
      setNotes(notes.map(n => n.id === id ? { ...n, is_completed: !currentStatus } : n));
    }
  };

  const handleDeleteNote = async (id: string) => {
    const { error } = await supabase
      .from('dashboard_notes')
      .delete()
      .eq('id', id);

    if (!error) {
      setNotes(notes.filter(n => n.id !== id));
    }
  };

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = appointments.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(appointments.length / itemsPerPage);

  const handlePreviousPage = () => {
    setCurrentPage(prev => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    setCurrentPage(prev => Math.min(prev + 1, totalPages));
  };

  return (
    <div className="p-4 md:p-8 space-y-8 max-w-[1400px] mx-auto w-full pb-24 lg:pb-8">
      {/* Page Header */}
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-slate-900 dark:text-white tracking-tight text-[28px] sm:text-[32px] font-bold leading-tight">Visão Geral</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm font-normal">Bem-vindo de volta, Admin. Aqui está o resumo de hoje.</p>
        </div>
        <div className="flex gap-3">
          <button className="flex cursor-pointer items-center justify-center gap-2 overflow-hidden rounded-xl h-10 px-4 bg-white dark:bg-surface-dark border border-gray-200 dark:border-gray-800 text-slate-700 dark:text-slate-200 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm">
            <span className="material-symbols-outlined text-[18px]">download</span>
            <span className="hidden sm:inline">Relatórios</span>
          </button>
        </div>
      </header>

      {/* Stats Grid */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: 'calendar_today', label: 'Agendamentos Hoje', value: todayCount.toString(), trend: 'Hoje', color: 'blue' },
          { icon: 'person_add', label: 'Novos Clientes', value: '4', trend: 'Semana', color: 'purple' },
          { icon: 'payments', label: 'Faturamento Dia', value: dailyRevenue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }), trend: 'Hoje', color: 'green' },
          { icon: 'pets', label: 'Animais na Loja', value: '8', trend: '75% lotação', color: 'orange' },
        ].map((stat, idx) => (
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
                {stat.label === 'Faturamento Dia' && !showRevenue ? '••••••' : stat.value}
              </h3>
            </div>
          </div>
        ))
        }
      </section >

      {/* Main Content Area */}
      < div className="grid grid-cols-1 xl:grid-cols-3 gap-8" >
        {/* Table Section */}
        < section className="xl:col-span-2 flex flex-col gap-4" >
          <div className="flex items-center justify-between px-1">
            <h3 className="text-slate-900 dark:text-white text-lg font-bold leading-tight tracking-[-0.015em]">Próximos Agendamentos</h3>
            <button className="text-sm font-medium text-primary-dark hover:underline">Ver todos</button>
          </div>
          <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-surface-dark shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800">
                  <tr>
                    <th className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-300">Horário</th>
                    <th className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-300">Pet</th>
                    <th className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-300">Serviço</th>
                    <th className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-300">Status</th>
                    <th className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-300 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {currentItems.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                        Nenhum agendamento pendente encontrado.
                      </td>
                    </tr>
                  ) : (
                    currentItems.map((app) => (
                      <tr key={app.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors relative">
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
                                  onClick={() => handleStatusChange(app.id, 'Confirmado')}
                                  className="w-full px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-gray-700 text-left flex items-center gap-2"
                                >
                                  <span className="w-2 h-2 rounded-full bg-green-500"></span>
                                  Confirmado
                                </button>
                                <button
                                  onClick={() => handleStatusChange(app.id, 'Pendente')}
                                  className="w-full px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-gray-700 text-left flex items-center gap-2"
                                >
                                  <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
                                  Pendente
                                </button>
                                <button
                                  onClick={() => handleStatusChange(app.id, 'Cancelado')}
                                  className="w-full px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 text-left flex items-center gap-2"
                                >
                                  <span className="w-2 h-2 rounded-full bg-red-500"></span>
                                  Cancelado
                                </button>
                                <div className="my-1 border-t border-slate-100 dark:border-slate-700"></div>
                                <button
                                  onClick={() => handleStatusChange(app.id, 'Concluído')}
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
                    )))}
                </tbody>
              </table>
            </div>
            <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800/20 border-t border-gray-100 dark:border-gray-800 flex justify-between items-center text-xs text-slate-500">
              <p>Mostrando {currentItems.length > 0 ? indexOfFirstItem + 1 : 0}-{Math.min(indexOfLastItem, appointments.length)} de {appointments.length} agendamentos</p>
              <div className="flex gap-2">
                <button
                  onClick={handlePreviousPage}
                  disabled={currentPage === 1}
                  className="p-1 rounded bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <span className="material-symbols-outlined text-sm">chevron_left</span>
                </button>
                <button
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages}
                  className="p-1 rounded bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <span className="material-symbols-outlined text-sm">chevron_right</span>
                </button>
              </div>
            </div>

          </div>
        </section >

        {/* Sidebar Cards */}
        <aside className="space-y-6">
          {/* Notifications Card */}
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

          {/* User Notes Section */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-slate-900 dark:text-white text-lg font-bold leading-tight tracking-[-0.015em]">Minhas Anotações</h3>
            </div>
            <div className="rounded-xl p-6 bg-white dark:bg-surface-dark border border-gray-100 dark:border-gray-800 shadow-sm">
              <div className="flex gap-2 mb-4">
                <input
                  type="text"
                  placeholder="Adicionar nova anotação..."
                  value={newNoteContent}
                  onChange={(e) => setNewNoteContent(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddNote()}
                  className="flex-1 h-10 px-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-slate-900 dark:text-white placeholder:text-slate-400"
                />
                <button
                  onClick={handleAddNote}
                  className="h-10 px-4 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-dark transition-colors"
                >
                  Adicionar
                </button>
              </div>

              <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto pr-1 scrollbar-hide">
                {notes.length === 0 ? (
                  <p className="text-center text-xs text-slate-400 py-4">Nenhuma anotação ainda.</p>
                ) : (
                  notes.map((note) => (
                    <div
                      key={note.id}
                      onDoubleClick={() => setExpandedNoteId(expandedNoteId === note.id ? null : note.id)}
                      className={`group flex items-start justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-900/30 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors border border-transparent hover:border-gray-200 dark:hover:border-gray-700 cursor-pointer select-none`}
                      title="Clique duas vezes para expandir/colapsar"
                    >
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleNote(note.id, note.is_completed);
                          }}
                          className={`shrink-0 size-5 rounded border flex items-center justify-center transition-colors mt-0.5 ${note.is_completed
                            ? 'bg-green-500 border-green-500 text-white'
                            : 'border-gray-300 dark:border-gray-600 hover:border-primary text-transparent'
                            }`}
                        >
                          <span className="material-symbols-outlined text-[16px]">check</span>
                        </button>
                        <span className={`text-sm transition-all duration-200 ${note.is_completed
                          ? 'text-slate-400 line-through decoration-slate-400'
                          : 'text-slate-700 dark:text-slate-300'
                          } ${expandedNoteId === note.id ? 'whitespace-pre-wrap break-words' : 'truncate'}`}>
                          {note.content}
                        </span>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteNote(note.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-all self-start"
                        title="Excluir"
                      >
                        <span className="material-symbols-outlined text-[18px]">delete</span>
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Marketing Card */}
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
        </aside>
      </div>
    </div>
  );
};

export default Dashboard;
