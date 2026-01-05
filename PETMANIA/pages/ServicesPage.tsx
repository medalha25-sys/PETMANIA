import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';

interface Service {
  id: string;
  name: string;
  description: string;
  category: string;
  duration: string;
  price: number;
  active: boolean;
}

const ServicesPage: React.FC = () => {
  const navigate = useNavigate();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Estética');
  const [duration, setDuration] = useState('30 min');
  const [price, setPrice] = useState('');

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .order('created_at', { ascending: false });

    if (data) {
      setServices(data);
    }
    setLoading(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase.from('services').insert({
        name,
        description,
        category,
        duration,
        price: parseFloat(price.replace(',', '.')),
        active: true
      });

      if (error) throw error;

      alert('Serviço criado com sucesso!');
      setIsModalOpen(false);
      fetchServices();
      // Reset form
      setName('');
      setDescription('');
      setCategory('Estética');
      setDuration('30 min');
      setPrice('');
    } catch (error) {
      console.error(error);
      alert('Erro ao criar serviço');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este serviço?')) return;

    try {
      const { error } = await supabase.from('services').delete().eq('id', id);
      if (error) throw error;
      fetchServices();
    } catch (error) {
      console.error(error);
      alert('Erro ao excluir serviço');
    }
  };

  return (
    <div className="p-4 md:p-8 space-y-8 max-w-[1400px] mx-auto w-full pb-24">
      <header className="flex flex-wrap justify-between items-end gap-4">
        <div className="flex flex-col gap-2 max-w-2xl">
          <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
            <button className="hover:text-primary transition-colors">Home</button>
            <span>/</span>
            <span className="font-medium text-slate-900 dark:text-white">Gerenciamento de Serviços</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight">Catálogo de Serviços</h2>
          <p className="text-slate-500 text-base">Gerencie os preços, durações e detalhes técnicos dos serviços oferecidos.</p>
        </div>
        <button
          onClick={async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
              navigate('/auth', { state: { isRegister: true } });
              return;
            }
            setIsModalOpen(true);
          }}
          className="flex items-center justify-center gap-2 h-12 px-6 rounded-xl bg-primary hover:bg-primary-dark text-slate-900 text-sm font-bold shadow-lg shadow-primary/25 transition-all transform hover:scale-105 active:scale-95"
        >
          <span className="material-symbols-outlined">add</span>
          <span>Novo Serviço</span>
        </button>
      </header>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: 'Total de Serviços', value: services.length.toString(), icon: 'inventory_2', color: 'primary' },
          { label: 'Mais Popular', value: 'Banho Completo', icon: 'trending_up', color: 'orange' },
          { label: 'Preço Médio', value: `R$ ${(services.reduce((acc, curr) => acc + curr.price, 0) / (services.length || 1)).toFixed(2).replace('.', ',')}`, icon: 'analytics', color: 'blue' },
        ].map((stat, idx) => (
          <div key={idx} className="flex flex-col gap-1 rounded-xl p-6 bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-slate-500 text-sm font-medium">{stat.label}</p>
              <span className={`material-symbols-outlined p-2 rounded-lg ${stat.color === 'primary' ? 'text-primary bg-primary/10' :
                stat.color === 'orange' ? 'text-orange-500 bg-orange-500/10' :
                  'text-blue-500 bg-blue-500/10'
                }`}>{stat.icon}</span>
            </div>
            <p className="text-slate-900 dark:text-white text-3xl font-bold mt-2">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4 bg-white dark:bg-surface-dark p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="relative flex-1 min-w-[240px]">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-400">search</span>
          <input className="w-full pl-12 pr-4 h-12 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-primary focus:border-transparent outline-none dark:text-white" placeholder="Buscar por nome do serviço..." />
        </div>
        <select className="pl-4 pr-10 h-12 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-primary outline-none cursor-pointer text-slate-600 dark:text-slate-300">
          <option>Todas Categorias</option>
          <option>Estética</option>
          <option>Saúde</option>
          <option>Higiene</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                <th className="py-4 px-6 text-xs font-semibold uppercase tracking-wider text-slate-400">Nome do Serviço</th>
                <th className="py-4 px-6 text-xs font-semibold uppercase tracking-wider text-slate-400">Categoria</th>
                <th className="py-4 px-6 text-xs font-semibold uppercase tracking-wider text-slate-400">Duração</th>
                <th className="py-4 px-6 text-xs font-semibold uppercase tracking-wider text-slate-400">Preço</th>
                <th className="py-4 px-6 text-xs font-semibold uppercase tracking-wider text-slate-400">Status</th>
                <th className="py-4 px-6 text-xs font-semibold uppercase tracking-wider text-slate-400 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-slate-500">Carregando serviços...</td>
                </tr>
              ) : services.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-slate-500">Nenhum serviço encontrado.</td>
                </tr>
              ) : (
                services.map((svc) => (
                  <tr key={svc.id} className="group hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex flex-col">
                        <span className="font-medium text-slate-900 dark:text-white">{svc.name}</span>
                        <span className="text-xs text-slate-400">{svc.description}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${svc.category === 'Estética' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300' :
                        svc.category === 'Saúde' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' :
                          'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                        }`}>
                        {svc.category}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-1 text-sm text-slate-600 dark:text-slate-300">
                        <span className="material-symbols-outlined text-xs text-slate-400">schedule</span>
                        {svc.duration}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className="font-bold text-slate-900 dark:text-white">R$ {svc.price.toFixed(2).replace('.', ',')}</span>
                    </td>
                    <td className="py-4 px-6">
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" checked={svc.active} className="sr-only peer" readOnly />
                        <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-slate-600 peer-checked:bg-primary"></div>
                      </label>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                        <button className="p-2 rounded-lg text-slate-400 hover:text-primary hover:bg-primary/10 transition-colors">
                          <span className="material-symbols-outlined text-[20px]">edit</span>
                        </button>
                        <button
                          onClick={() => handleDelete(svc.id)}
                          className="p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                        >
                          <span className="material-symbols-outlined text-[20px]">delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Novo Serviço */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-surface-dark rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto p-6 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Novo Serviço</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-red-500 transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Nome do Serviço</label>
                <input
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full h-11 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent px-4 focus:ring-primary focus:border-primary dark:text-white"
                  placeholder="Ex: Banho Completo"
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Descrição</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full h-20 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent p-4 focus:ring-primary focus:border-primary dark:text-white resize-none"
                  placeholder="Breve descrição do serviço..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Categoria</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full h-11 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent px-4 focus:ring-primary focus:border-primary dark:text-white"
                  >
                    <option value="Estética" className="text-slate-900 bg-white dark:bg-surface-dark dark:text-white">Estética</option>
                    <option value="Saúde" className="text-slate-900 bg-white dark:bg-surface-dark dark:text-white">Saúde</option>
                    <option value="Higiene" className="text-slate-900 bg-white dark:bg-surface-dark dark:text-white">Higiene</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Duração</label>
                  <select
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    className="w-full h-11 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent px-4 focus:ring-primary focus:border-primary dark:text-white"
                  >
                    <option value="15 min" className="text-slate-900 bg-white dark:bg-surface-dark dark:text-white">15 min</option>
                    <option value="30 min" className="text-slate-900 bg-white dark:bg-surface-dark dark:text-white">30 min</option>
                    <option value="45 min" className="text-slate-900 bg-white dark:bg-surface-dark dark:text-white">45 min</option>
                    <option value="60 min" className="text-slate-900 bg-white dark:bg-surface-dark dark:text-white">60 min</option>
                    <option value="90 min" className="text-slate-900 bg-white dark:bg-surface-dark dark:text-white">90 min</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Preço (R$)</label>
                <input
                  required
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-full h-11 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent px-4 focus:ring-primary focus:border-primary dark:text-white"
                  placeholder="0,00"
                />
              </div>

              <button
                type="submit"
                className="w-full h-12 rounded-xl bg-primary hover:bg-primary-dark text-slate-900 font-bold shadow-lg shadow-primary/20 flex items-center justify-center gap-2 mt-4"
              >
                Salvar Serviço
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ServicesPage;
