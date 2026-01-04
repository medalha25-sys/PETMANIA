import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';

interface Client {
  id: string;
  full_name: string;
  cpf: string;
  rg: string;
  birth_date: string;
  gender: string;
  email: string;
  mobile: string;
  phone: string;
  cep: string;
  city: string;
  address: string;
  number: string;
  avatar_url: string | null;
}

const Clients: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);

  // Form State
  const [editingClient, setEditingClient] = useState<string | null>(null);
  const [fullName, setFullName] = useState('');
  const [cpf, setCpf] = useState('');
  const [rg, setRg] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [gender, setGender] = useState('');
  const [email, setEmail] = useState('');
  const [celular, setCelular] = useState('');
  const [telefone, setTelefone] = useState('');
  const [cep, setCep] = useState('');
  const [city, setCity] = useState('');
  const [address, setAddress] = useState('');
  const [number, setNumber] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    if (data) setClients(data);
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      if (!event.target.files || event.target.files.length === 0) {
        return;
      }

      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('client-avatars')
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      const { data } = supabase.storage.from('client-avatars').getPublicUrl(filePath);
      setAvatarUrl(data.publicUrl);
    } catch (error) {
      alert('Erro ao fazer upload da imagem!');
      console.error(error);
    } finally {
      setUploading(false);
    }
  };

  const handleEdit = (client: Client) => {
    setEditingClient(client.id);
    setFullName(client.full_name);
    setCpf(client.cpf || '');
    setRg(client.rg || '');
    setBirthDate(client.birth_date || '');
    setGender(client.gender || '');
    setEmail(client.email || '');
    setCelular(client.mobile || '');
    setTelefone(client.phone || '');
    setCep(client.cep || '');
    setCity(client.city || '');
    setAddress(client.address || '');
    setNumber(client.number || '');
    setAvatarUrl(client.avatar_url);

    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancel = () => {
    setEditingClient(null);
    setFullName('');
    setCpf('');
    setRg('');
    setBirthDate('');
    setGender('');
    setEmail('');
    setCelular('');
    setTelefone('');
    setCep('');
    setCity('');
    setAddress('');
    setNumber('');
    setAvatarUrl(null);
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const clientData = {
        full_name: fullName,
        cpf,
        rg,
        birth_date: birthDate || null,
        gender,
        email,
        mobile: celular,
        phone: telefone,
        cep,
        city,
        address,
        number,
        avatar_url: avatarUrl
      };

      let error;

      if (editingClient) {
        const { error: updateError } = await supabase
          .from('clients')
          .update(clientData)
          .eq('id', editingClient);
        error = updateError;
      } else {
        const { error: insertError } = await supabase
          .from('clients')
          .insert(clientData);
        error = insertError;
      }

      if (error) throw error;

      alert(editingClient ? 'Cliente atualizado com sucesso!' : 'Cliente cadastrado com sucesso!');
      handleCancel(); // Reset form
      fetchClients();
    } catch (error) {
      console.error('Erro ao salvar:', error);
      alert('Erro ao salvar cliente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-[1200px] mx-auto w-full pb-24">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-2 text-sm text-slate-500">
        <button onClick={() => navigate('/')} className="hover:text-primary transition-colors">Início</button>
        <span>/</span>
        <button className="hover:text-primary transition-colors">Clientes</button>
        <span>/</span>
        <span className="text-slate-900 dark:text-white font-medium">{editingClient ? 'Editar Cliente' : 'Novo Cadastro'}</span>
      </nav>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-slate-900 dark:text-white text-3xl font-black tracking-tight">{editingClient ? 'Editar Cliente' : 'Novo Cliente'}</h1>
          <p className="text-slate-500 text-base">{editingClient ? 'Atualize os dados do cliente abaixo.' : 'Preencha os dados abaixo para registrar um novo tutor.'}</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleCancel}
            className="px-6 h-10 rounded-xl bg-transparent border border-slate-200 dark:border-slate-800 text-slate-500 font-bold text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            {editingClient ? 'Cancelar Edição' : 'Cancelar'}
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="flex items-center gap-2 px-6 h-10 rounded-xl bg-primary text-slate-900 hover:bg-primary-dark transition-all font-bold text-sm shadow-lg shadow-primary/20 disabled:opacity-70"
          >
            {loading ? <span className="material-symbols-outlined animate-spin">refresh</span> : <span className="material-symbols-outlined text-[20px]">save</span>}
            <span>{loading ? 'Salvando...' : (editingClient ? 'Atualizar Cliente' : 'Salvar Cadastro')}</span>
          </button>
        </div>
      </div>

      {/* Form Container */}
      <div className="bg-white dark:bg-surface-dark rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="border-b border-slate-100 dark:border-slate-800 px-6">
          <div className="flex gap-8 overflow-x-auto hide-scrollbar">
            {['Dados Pessoais', 'Contato', 'Endereço', 'Histórico & Notas'].map((tab, idx) => (
              <button
                key={tab}
                className={`pt-4 pb-3 border-b-[3px] transition-colors whitespace-nowrap text-sm font-bold ${idx === 0 ? 'border-primary text-slate-900 dark:text-white' : 'border-transparent text-slate-400'
                  }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        <div className="p-6 md:p-8 space-y-8">
          {/* Profile Picture Upload */}
          <div className="flex flex-col sm:flex-row gap-6 items-center p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
            <div
              className="relative group cursor-pointer size-24 rounded-full bg-cover bg-center ring-4 ring-white dark:ring-slate-800 shadow-sm"
              style={{ backgroundImage: `url("${avatarUrl || 'https://lh3.googleusercontent.com/aida-public/AB6AXuBzPW8hpGYUfs9wPDvvZr-0or7ZgBY1O86avqQ46pK_SmgdIo8O6li4B1YJ0rrDoGL5K2XgJFbvG0ioAaicjNbvqDVfoRcRwC24Xj8ELkyG_EI0yeQJLk8Rv9MI7NBWoyc1abETZ_8hyQUN-TOSwsoLorc3yx0Yeo1-IKgIaWK0mNg3j_fMH57etBVdTzPRqXxmX3WhllSe0NyIU0qTrJRaxTS1Lzy2iaHfJruzFLrYyGwJNdJmMG6BWi9tSYsioOAsaZ7VYtwxsA'}")` }}
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="material-symbols-outlined text-white">photo_camera</span>
              </div>
            </div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleAvatarUpload}
              className="hidden"
              accept="image/*"
            />
            <div className="text-center sm:text-left">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Foto do Perfil</h3>
              <p className="text-sm text-slate-500 mb-2">
                {uploading ? 'Carregando imagem...' : 'Carregue uma foto para identificar o tutor.'}
              </p>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="text-primary font-bold text-sm hover:underline"
              >
                {uploading ? 'Aguarde...' : 'Carregar imagem'}
              </button>
            </div>
          </div>

          {/* Form Fields: Identification */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            <div className="md:col-span-12 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">id_card</span>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Identificação</h2>
            </div>

            <div className="md:col-span-8 space-y-1.5">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Nome Completo</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full h-11 rounded-lg border border-slate-200 dark:border-slate-800 bg-transparent px-4 focus:ring-primary focus:border-primary dark:text-white"
                placeholder="Ex: Ana Clara da Silva"
              />
            </div>
            <div className="md:col-span-4 space-y-1.5">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">CPF</label>
              <input
                type="text"
                value={cpf}
                onChange={(e) => setCpf(e.target.value)}
                className="w-full h-11 rounded-lg border border-slate-200 dark:border-slate-800 bg-transparent px-4 focus:ring-primary focus:border-primary dark:text-white"
                placeholder="000.000.000-00"
              />
            </div>

            <div className="md:col-span-4 space-y-1.5">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">RG</label>
              <input
                type="text"
                value={rg}
                onChange={(e) => setRg(e.target.value)}
                className="w-full h-11 rounded-lg border border-slate-200 dark:border-slate-800 bg-transparent px-4 focus:ring-primary focus:border-primary dark:text-white"
                placeholder="00.000.000-0"
              />
            </div>
            <div className="md:col-span-4 space-y-1.5">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Data de Nascimento</label>
              <input
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                className="w-full h-11 rounded-lg border border-slate-200 dark:border-slate-800 bg-transparent px-4 focus:ring-primary focus:border-primary text-slate-500 dark:text-slate-400"
              />
            </div>
            <div className="md:col-span-4 space-y-1.5">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Gênero</label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="w-full h-11 rounded-lg border border-slate-200 dark:border-slate-800 bg-transparent px-4 focus:ring-primary focus:border-primary appearance-none dark:text-white"
              >
                <option value="">Selecione</option>
                <option value="f">Feminino</option>
                <option value="m">Masculino</option>
                <option value="o">Outro</option>
              </select>
            </div>
          </div>

          <hr className="border-slate-100 dark:border-slate-800" />

          {/* Form Fields: Contact */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">call</span>
                <h2 className="text-lg font-bold dark:text-white">Contato</h2>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-11 rounded-lg border border-slate-200 dark:border-slate-800 bg-transparent px-4 focus:ring-primary focus:border-primary dark:text-white"
                  placeholder="cliente@email.com"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Celular</label>
                  <input
                    type="tel"
                    value={celular}
                    onChange={(e) => setCelular(e.target.value)}
                    className="w-full h-11 rounded-lg border border-slate-200 dark:border-slate-800 bg-transparent px-4 focus:ring-primary focus:border-primary dark:text-white"
                    placeholder="(00) 00000-0000"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Telefone</label>
                  <input
                    type="tel"
                    value={telefone}
                    onChange={(e) => setTelefone(e.target.value)}
                    className="w-full h-11 rounded-lg border border-slate-200 dark:border-slate-800 bg-transparent px-4 focus:ring-primary focus:border-primary dark:text-white"
                    placeholder="(00) 0000-0000"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">location_on</span>
                <h2 className="text-lg font-bold dark:text-white">Endereço Principal</h2>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-1 space-y-1.5">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">CEP</label>
                  <input
                    type="text"
                    value={cep}
                    onChange={(e) => setCep(e.target.value)}
                    className="w-full h-11 rounded-lg border border-slate-200 dark:border-slate-800 bg-transparent px-4 focus:ring-primary focus:border-primary dark:text-white"
                    placeholder="00000-000"
                  />
                </div>
                <div className="col-span-2 space-y-1.5">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Cidade</label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full h-11 rounded-lg border border-slate-200 dark:border-slate-800 bg-transparent px-4 focus:ring-primary focus:border-primary dark:text-white"
                    placeholder="Cidade"
                  />
                </div>
              </div>
              <div className="grid grid-cols-4 gap-4">
                <div className="col-span-3 space-y-1.5">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Rua</label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full h-11 rounded-lg border border-slate-200 dark:border-slate-800 bg-transparent px-4 focus:ring-primary focus:border-primary dark:text-white"
                    placeholder="Nome da rua"
                  />
                </div>
                <div className="col-span-1 space-y-1.5">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Nº</label>
                  <input
                    type="text"
                    value={number}
                    onChange={(e) => setNumber(e.target.value)}
                    className="w-full h-11 rounded-lg border border-slate-200 dark:border-slate-800 bg-transparent px-4 focus:ring-primary focus:border-primary dark:text-white"
                    placeholder="123"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-slate-50 dark:bg-slate-900/30 px-6 py-4 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center text-xs text-slate-500">
          <p className="flex items-center gap-1"><span className="material-symbols-outlined text-sm">info</span> Campos criptografados</p>
        </div>
      </div>

      {/* Recent Clients List (Optional/Bonus) */}
      {clients.length > 0 && (
        <div className="bg-white dark:bg-surface-dark rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Clientes Recentes</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-gray-50 dark:bg-gray-800/50">
                <tr>
                  <th className="px-6 py-3 font-semibold text-slate-700 dark:text-slate-300">Cliente</th>
                  <th className="px-6 py-3 font-semibold text-slate-700 dark:text-slate-300">Email</th>
                  <th className="px-6 py-3 font-semibold text-slate-700 dark:text-slate-300">Celular</th>
                  <th className="px-6 py-3 font-semibold text-slate-700 dark:text-slate-300 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {clients.map(client => (
                  <tr key={client.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30">
                    <td className="px-6 py-3 flex items-center gap-3">
                      <div
                        className="size-8 rounded-full bg-cover bg-center border border-gray-200 dark:border-gray-700"
                        style={{ backgroundImage: `url("${client.avatar_url || 'https://lh3.googleusercontent.com/aida-public/AB6AXuBzPW8hpGYUfs9wPDvvZr-0or7ZgBY1O86avqQ46pK_SmgdIo8O6li4B1YJ0rrDoGL5K2XgJFbvG0ioAaicjNbvqDVfoRcRwC24Xj8ELkyG_EI0yeQJLk8Rv9MI7NBWoyc1abETZ_8hyQUN-TOSwsoLorc3yx0Yeo1-IKgIaWK0mNg3j_fMH57etBVdTzPRqXxmX3WhllSe0NyIU0qTrJRaxTS1Lzy2iaHfJruzFLrYyGwJNdJmMG6BWi9tSYsioOAsaZ7VYtwxsA'}")` }}
                      />
                      <span className="font-medium text-slate-900 dark:text-white">{client.full_name}</span>
                    </td>
                    <td className="px-6 py-3 text-slate-600 dark:text-slate-400">{client.email}</td>
                    <td className="px-6 py-3 text-slate-600 dark:text-slate-400">{client.mobile}</td>
                    <td className="px-6 py-3 text-right">
                      <button
                        onClick={() => handleEdit(client)}
                        className="p-2 text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/40 rounded-lg transition-colors"
                        title="Editar cliente"
                      >
                        <span className="material-symbols-outlined text-[20px]">edit</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Clients;
