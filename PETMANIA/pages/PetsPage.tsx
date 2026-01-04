import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';

interface Pet {
    id: string;
    name: string;
    species: string;
    breed: string | null;
    avatar_url: string | null;
    birth_date: string | null;
    owner_id: string | null;
    owner?: {
        full_name: string;
    };
}

interface Client {
    id: string;
    full_name: string;
}

const PetsPage: React.FC = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [pets, setPets] = useState<Pet[]>([]);
    const [editingPet, setEditingPet] = useState<Pet | null>(null);
    const [clients, setClients] = useState<Client[]>([]);
    const [showModal, setShowModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    // Form State
    const [name, setName] = useState('');
    const [species, setSpecies] = useState('Cachorro');
    const [breed, setBreed] = useState('');
    const [birthDate, setBirthDate] = useState('');
    const [weight, setWeight] = useState('');
    const [ownerId, setOwnerId] = useState('');
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
    const [tutorSearch, setTutorSearch] = useState('');
    const [showTutorList, setShowTutorList] = useState(false);

    // History State
    const [showHistoryModal, setShowHistoryModal] = useState(false);
    const [selectedPetHistory, setSelectedPetHistory] = useState<Pet | null>(null);
    const [history, setHistory] = useState<any[]>([]);
    const [loadingHistory, setLoadingHistory] = useState(false);

    // Company Info for Print
    const [companyInfo, setCompanyInfo] = useState<{ name: string, logo_url: string | null }>({ name: 'PetManager', logo_url: null });

    const handleOpenHistory = async (pet: Pet) => {
        setSelectedPetHistory(pet);
        setShowHistoryModal(true);
        setLoadingHistory(true);
        try {
            let query = supabase
                .from('appointments')
                .select('*')
                .eq('status', 'completed')
                .order('date', { ascending: false });

            if (pet.owner_id) {
                query = query.eq('client_id', pet.owner_id);
            } else {
                setHistory([]);
                setLoadingHistory(false);
                return;
            }

            const { data, error } = await query;
            if (error) throw error;
            setHistory(data || []);

        } catch (error) {
            console.error('Error fetching history:', error);
        } finally {
            setLoadingHistory(false);
        }
    };

    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        fetchPets();
        fetchClients();
        fetchCompanyInfo();
    }, []);

    const fetchCompanyInfo = async () => {
        const { data } = await supabase.from('company_info').select('name, logo_url').single();
        if (data) {
            setCompanyInfo(data);
        }
    };

    const fetchPets = async () => {
        const { data, error } = await supabase
            .from('pets')
            .select(`
                *,
                owner:clients (full_name)
            `)
            .order('created_at', { ascending: false });

        if (data) setPets(data);
    };

    const fetchClients = async () => {
        const { data } = await supabase
            .from('clients')
            .select('id, full_name')
            .order('full_name');
        if (data) setClients(data);
    };

    const handlePrintHistory = () => {
        if (!selectedPetHistory || history.length === 0) return;

        const printWindow = window.open('', '', 'width=800,height=600');
        if (!printWindow) return;

        const htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Prontuário Médico - ${selectedPetHistory.name}</title>
                <style>
                    body { font-family: sans-serif; padding: 20px; line-height: 1.5; color: #333; }
                    .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #eee; padding-bottom: 20px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 10px; }
                    .logo { width: 80px; height: 80px; object-fit: contain; border-radius: 50%; margin-bottom: 5px; }
                    .company-name { font-size: 1.5em; font-weight: bold; color: #222; margin: 0; }
                    .doc-title { font-size: 1.2em; color: #666; margin: 0; }
                    .pet-info { margin-bottom: 30px; background: #f9f9f9; padding: 15px; border-radius: 8px; }
                    .record-item { margin-bottom: 20px; page-break-inside: avoid; border: 1px solid #eee; padding: 15px; border-radius: 8px; }
                    .date { font-weight: bold; color: #666; font-size: 0.9em; }
                    .service-type { font-size: 1.2em; font-weight: bold; margin: 5px 0; color: #000; }
                    .notes { background: #f0f7ff; padding: 10px; border-radius: 4px; margin-top: 10px; font-style: italic; }
                    .footer { margin-top: 40px; font-size: 0.8em; text-align: center; color: #999; border-top: 1px solid #eee; padding-top: 20px; }
                    @media print {
                        body { padding: 0; }
                        .record-item { border: none; border-bottom: 1px solid #ccc; border-radius: 0; }
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    ${companyInfo.logo_url ? `<img src="${companyInfo.logo_url}" class="logo" />` : ''}
                    <h1 class="company-name">${companyInfo.name}</h1>
                    <p class="doc-title">Prontuário Médico Veterinário</p>
                </div>

                <div class="pet-info">
                    <h2>Dados do Paciente</h2>
                    <p><strong>Nome:</strong> ${selectedPetHistory.name}</p>
                    <p><strong>Espécie/Raça:</strong> ${selectedPetHistory.species} - ${selectedPetHistory.breed || 'N/A'}</p>
                    <p><strong>Tutor:</strong> ${selectedPetHistory.owner?.full_name || 'N/A'}</p>
                </div>

                <div class="history-list">
                    <h3>Histórico de Atendimentos</h3>
                    ${history.map(record => `
                        <div class="record-item">
                            <div class="date">${new Date(record.date).toLocaleDateString('pt-BR')} às ${record.start_time}</div>
                            <div class="service-type">${record.service_type}</div>
                            ${record.notes ? `<div class="notes">" ${record.notes} "</div>` : ''}
                        </div>
                    `).join('')}
                </div>

                <div class="footer">
                    <p>Documento gerado em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}</p>
                </div>
                <script>
                    window.onload = function() { window.print(); }
                </script>
            </body>
            </html>
        `;

        printWindow.document.write(htmlContent);
        printWindow.document.close();
    };

    const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        try {
            setUploading(true);
            if (!event.target.files || event.target.files.length === 0) return;

            const file = event.target.files[0];
            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random()}.${fileExt}`;
            const filePath = `${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('pet-avatars')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data } = supabase.storage.from('pet-avatars').getPublicUrl(filePath);
            setAvatarUrl(data.publicUrl);
        } catch (error) {
            console.error(error);
            alert('Erro ao fazer upload da imagem!');
        } finally {
            setUploading(false);
        }
    };

    const handleSave = async () => {
        if (!name) {
            alert('Nome é obrigatório');
            return;
        }

        setLoading(true);
        try {
            const petData = {
                name,
                species,
                breed,
                birth_date: birthDate || null,
                weight: weight ? parseFloat(weight) : null,
                owner_id: ownerId || null,
                avatar_url: avatarUrl
            };

            if (editingPet) {
                const { error } = await supabase
                    .from('pets')
                    .update(petData)
                    .eq('id', editingPet.id);
                if (error) throw error;
            } else {
                const { error } = await supabase.from('pets').insert(petData);
                if (error) throw error;
            }



            resetForm();
            setShowModal(false);
            fetchPets();
        } catch (error) {
            console.error(error);
            alert('Erro ao salvar pet');
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setName('');
        setSpecies('Cachorro');
        setBreed('');
        setBirthDate('');
        setWeight('');
        setOwnerId('');
        setAvatarUrl(null);
        setTutorSearch('');
        setAvatarUrl(null);
        setTutorSearch('');
        setEditingPet(null);
    };

    const handleEdit = (pet: Pet) => {
        setEditingPet(pet);
        setName(pet.name);
        setSpecies(pet.species || 'Cachorro');
        setBreed(pet.breed || '');
        setBirthDate(pet.birth_date || '');
        setWeight(pet.weight ? pet.weight.toString() : '');
        setOwnerId(pet.owner_id || '');
        setAvatarUrl(pet.avatar_url);
        if (pet.owner) {
            setTutorSearch(pet.owner.full_name);
        } else {
            setTutorSearch('');
        }
        setShowModal(true);
    };

    const filteredPets = pets.filter(pet =>
        pet.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pet.breed?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pet.owner?.full_name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-4 md:p-8 pb-24 space-y-6 max-w-[1600px] mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
                        <button onClick={() => navigate('/')} className="hover:text-primary transition-colors">Início</button>
                        <span>/</span>
                        <span className="font-medium text-slate-900 dark:text-white">Pets</span>
                    </div>
                    <h1 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight">Pets</h1>
                    <p className="text-slate-500 text-base">Gerencie os pets cadastrados no sistema.</p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="relative group">
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors">search</span>
                        <input
                            type="text"
                            placeholder="Buscar pet..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="h-12 pl-10 pr-4 rounded-xl bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-primary/50 outline-none w-full md:w-64 transition-all"
                        />
                    </div>
                    <button
                        onClick={() => setShowModal(true)}
                        className="h-12 px-6 bg-primary hover:bg-primary-dark text-slate-900 font-bold rounded-xl shadow-sm hover:shadow-md transition-all flex items-center gap-2"
                    >
                        <span className="material-symbols-outlined">add_circle</span>
                        <span>Novo Pet</span>
                    </button>
                </div>
            </div>

            {/* Pets List */}
            <div className="bg-white dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Pet</th>
                                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Espécie/Raça</th>
                                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Tutor</th>
                                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Nascimento</th>
                                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {filteredPets.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="p-8 text-center text-slate-500">
                                        Nenhum pet encontrado.
                                    </td>
                                </tr>
                            ) : (
                                filteredPets.map((pet) => (
                                    <tr key={pet.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div
                                                    className="size-10 rounded-full bg-slate-100 dark:bg-slate-800 bg-cover bg-center ring-2 ring-white dark:ring-surface-dark shadow-sm"
                                                    style={{ backgroundImage: pet.avatar_url ? `url("${pet.avatar_url}")` : undefined }}
                                                >
                                                    {!pet.avatar_url && (
                                                        <div className="w-full h-full flex items-center justify-center text-slate-400">
                                                            <span className="material-symbols-outlined text-sm">pets</span>
                                                        </div>
                                                    )}
                                                </div>
                                                <span className="font-bold text-slate-900 dark:text-white">{pet.name}</span>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{pet.species}</span>
                                                <span className="text-xs text-slate-500">{pet.breed || '-'}</span>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            {pet.owner ? (
                                                <span className="text-sm text-primary font-medium hover:underline cursor-pointer">
                                                    {pet.owner.full_name}
                                                </span>
                                            ) : (
                                                <span className="text-sm text-slate-400 italic">Sem tutor</span>
                                            )}
                                        </td>
                                        <td className="p-4 text-sm text-slate-600 dark:text-slate-400">
                                            {pet.birth_date ? new Date(pet.birth_date).toLocaleDateString('pt-BR') : '-'}
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() => handleOpenHistory(pet)}
                                                    className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors rounded-lg"
                                                    title="Ver Prontuário"
                                                >
                                                    <span className="material-symbols-outlined">history_edu</span>
                                                </button>
                                                <button
                                                    onClick={() => handleEdit(pet)}
                                                    className="p-2 text-slate-400 hover:text-primary hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors rounded-lg"
                                                    title="Editar"
                                                >
                                                    <span className="material-symbols-outlined">edit</span>
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

            {/* Modal Novo Pet */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-surface-dark rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800">
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                                {editingPet ? 'Editar Pet' : 'Novo Pet'}
                            </h2>
                            <button
                                onClick={() => setShowModal(false)}
                                className="p-2 text-slate-400 hover:text-red-500 transition-colors rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                            >
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>

                        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto custom-scrollbar">
                            <div className="flex justify-center">
                                <div className="relative group cursor-pointer">
                                    <div
                                        className="size-32 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center border-4 border-white dark:border-surface-dark shadow-lg overflow-hidden bg-cover bg-center"
                                        style={{ backgroundImage: avatarUrl ? `url("${avatarUrl}")` : undefined }}
                                    >
                                        {!avatarUrl && <span className="material-symbols-outlined text-4xl text-slate-300">add_a_photo</span>}
                                    </div>
                                    <label className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-white">
                                        <span className="material-symbols-outlined">edit</span>
                                        <input
                                            type="file"
                                            className="hidden"
                                            accept="image/*"
                                            onChange={handleAvatarUpload}
                                            ref={fileInputRef}
                                        />
                                    </label>
                                    {uploading && (
                                        <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full">
                                            <div className="size-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Nome do Pet <span className="text-red-500">*</span></label>
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="w-full h-11 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent px-4 text-sm dark:text-white focus:ring-2 focus:ring-primary/50 outline-none"
                                        placeholder="Ex: Rex"
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Espécie</label>
                                    <select
                                        value={species}
                                        onChange={(e) => setSpecies(e.target.value)}
                                        className="w-full h-11 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent px-4 text-sm dark:text-white focus:ring-2 focus:ring-primary/50 outline-none [&>option]:text-slate-900 [&>option]:dark:bg-surface-dark [&>option]:dark:text-white"
                                    >
                                        <option value="Cachorro" className="bg-white dark:bg-zinc-900 text-slate-900 dark:text-white">Cachorro</option>
                                        <option value="Gato" className="bg-white dark:bg-zinc-900 text-slate-900 dark:text-white">Gato</option>
                                        <option value="Pássaro" className="bg-white dark:bg-zinc-900 text-slate-900 dark:text-white">Pássaro</option>
                                        <option value="Outro" className="bg-white dark:bg-zinc-900 text-slate-900 dark:text-white">Outro</option>
                                    </select>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Raça</label>
                                    <input
                                        type="text"
                                        value={breed}
                                        onChange={(e) => setBreed(e.target.value)}
                                        className="w-full h-11 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent px-4 text-sm dark:text-white focus:ring-2 focus:ring-primary/50 outline-none"
                                        placeholder="Ex: Golden Retriever"
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Tutor</label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            value={tutorSearch}
                                            onChange={(e) => {
                                                setTutorSearch(e.target.value);
                                                setShowTutorList(true);
                                                setOwnerId(''); // Reset if typing
                                            }}
                                            onFocus={() => setShowTutorList(true)}
                                            onBlur={() => setTimeout(() => setShowTutorList(false), 200)}
                                            placeholder="Buscar tutor..."
                                            className="w-full h-11 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent px-4 text-sm dark:text-white focus:ring-2 focus:ring-primary/50 outline-none"
                                        />
                                        {showTutorList && (
                                            <div className="absolute z-10 w-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                                                {clients
                                                    .filter(client => client.full_name.toLowerCase().includes(tutorSearch.toLowerCase()))
                                                    .map(client => (
                                                        <div
                                                            key={client.id}
                                                            className="px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer text-sm text-slate-700 dark:text-slate-200"
                                                            onMouseDown={() => {
                                                                setOwnerId(client.id);
                                                                setTutorSearch(client.full_name);
                                                                setShowTutorList(false);
                                                            }}
                                                        >
                                                            {client.full_name}
                                                        </div>
                                                    ))}
                                                {clients.filter(client => client.full_name.toLowerCase().includes(tutorSearch.toLowerCase())).length === 0 && (
                                                    <div className="px-4 py-3 text-sm text-slate-500">Nenhum tutor encontrado</div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Data de Nascimento</label>
                                    <input
                                        type="date"
                                        value={birthDate}
                                        onChange={(e) => setBirthDate(e.target.value)}
                                        className="w-full h-11 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent px-4 text-sm dark:text-white focus:ring-2 focus:ring-primary/50 outline-none"
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Peso (kg)</label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        value={weight}
                                        onChange={(e) => setWeight(e.target.value)}
                                        className="w-full h-11 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent px-4 text-sm dark:text-white focus:ring-2 focus:ring-primary/50 outline-none"
                                        placeholder="Ex: 12.5"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="p-6 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3 bg-slate-50 dark:bg-slate-900/50">
                            <button
                                onClick={() => setShowModal(false)}
                                className="px-6 py-2.5 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={loading}
                                className="px-6 py-2.5 rounded-xl text-sm font-bold bg-primary text-slate-900 hover:bg-primary-dark transition-all shadow-sm hover:shadow-md disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                {loading ? (
                                    <>
                                        <div className="size-4 border-2 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
                                        <span>Salvando...</span>
                                    </>
                                ) : (
                                    <span>{editingPet ? 'Salvar Alterações' : 'Salvar Pet'}</span>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )
            }

            {/* History Modal */}
            {showHistoryModal && selectedPetHistory && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-surface-dark rounded-2xl shadow-2xl w-full max-w-2xl h-[80vh] flex flex-col animate-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
                            <div className="flex items-center gap-4">
                                <div
                                    className="size-12 rounded-full bg-slate-200 dark:bg-slate-800 bg-cover bg-center border-2 border-white dark:border-slate-700 shadow-sm"
                                    style={{ backgroundImage: selectedPetHistory.avatar_url ? `url("${selectedPetHistory.avatar_url}")` : undefined }}
                                >
                                    {!selectedPetHistory.avatar_url && <span className="material-symbols-outlined text-xl flex items-center justify-center h-full text-slate-400">pets</span>}
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">Prontuário Médico</h2>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">{selectedPetHistory.name} - {selectedPetHistory.owner?.full_name || 'Sem Tutor'}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={handlePrintHistory}
                                    disabled={history.length === 0}
                                    className="p-2 text-slate-500 hover:text-primary hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors rounded-lg flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                                    title="Imprimir Prontuário"
                                >
                                    <span className="material-symbols-outlined">print</span>
                                    <span className="text-sm font-bold hidden sm:inline">Imprimir</span>
                                </button>
                                <button
                                    onClick={() => setShowHistoryModal(false)}
                                    className="p-2 text-slate-400 hover:text-red-500 transition-colors rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                                >
                                    <span className="material-symbols-outlined">close</span>
                                </button>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 bg-slate-50 dark:bg-[#0f1c15]">
                            {loadingHistory ? (
                                <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-2">
                                    <div className="size-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                                    <p className="text-sm">Carregando histórico...</p>
                                </div>
                            ) : history.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-3">
                                    <div className="size-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                                        <span className="material-symbols-outlined text-3xl opacity-50">history_edu</span>
                                    </div>
                                    <p>Nenhum registro médico encontrado.</p>
                                </div>
                            ) : (
                                <div className="space-y-6 relative before:absolute before:left-[19px] before:top-4 before:bottom-4 before:w-[2px] before:bg-slate-200 dark:before:bg-slate-800">
                                    {history.map((record, idx) => (
                                        <div key={record.id} className="relative pl-12 group">
                                            {/* Timeline dot */}
                                            <div className="absolute left-0 top-0 size-10 rounded-full bg-white dark:bg-surface-dark border-4 border-slate-100 dark:border-slate-800 flex items-center justify-center z-10 shadow-sm group-hover:border-primary/30 transition-colors">
                                                <span className="material-symbols-outlined text-[18px] text-primary">
                                                    {record.service_type.includes('Vacina') ? 'vaccines' : record.service_type.includes('Exame') ? 'monitor_heart' : 'medical_services'}
                                                </span>
                                            </div>

                                            <div className="bg-white dark:bg-surface-dark p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
                                                <div className="flex flex-wrap items-start justify-between gap-4 mb-2">
                                                    <div>
                                                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">
                                                            {new Date(record.date).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })}
                                                        </span>
                                                        <h3 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">
                                                            {record.service_type}
                                                        </h3>
                                                    </div>
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                                                        Concluído
                                                    </span>
                                                </div>

                                                {record.notes && (
                                                    <div className="mt-3 bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg text-sm text-slate-600 dark:text-slate-300 border border-slate-100 dark:border-slate-800/50 leading-relaxed">
                                                        {record.notes}
                                                    </div>
                                                )}

                                                <div className="mt-3 flex items-center gap-2 text-xs text-slate-400">
                                                    <span className="material-symbols-outlined text-[14px]">schedule</span>
                                                    {record.start_time} - {record.end_time}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )
            }
        </div >
    );
};

export default PetsPage;
