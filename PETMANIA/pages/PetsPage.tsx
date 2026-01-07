import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';
import PetModal from '../components/modals/PetModal';
import PetHistoryModal from '../components/modals/PetHistoryModal';
import { usePets } from '../hooks/usePets';
import { PetWithOwner } from '../services/api';
import TableSkeleton from '../components/skeletons/TableSkeleton';

/* 
 * Kept Client interface here for now as it's simple. 
 * Ideally move to api.ts if shared widely.
 */
interface Client {
    id: string;
    full_name: string;
}

const PetsPage: React.FC = () => {
    const navigate = useNavigate();
    const { pets, loading: petsLoading, fetchPets, deletePet, deletePets } = usePets();

    // Clients currently still fetched manually, could be moved to useClients later
    const [clients, setClients] = useState<Client[]>([]);

    // UI State
    const [showModal, setShowModal] = useState(false);
    const [editingPet, setEditingPet] = useState<any | null>(null); // Using any for compatibility with modal for now
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedPets, setSelectedPets] = useState<Set<string>>(new Set());
    const [lastSelectedPetId, setLastSelectedPetId] = useState<string | null>(null);

    // History State
    const [showHistoryModal, setShowHistoryModal] = useState(false);
    const [selectedPetHistory, setSelectedPetHistory] = useState<any | null>(null);

    // Delete State
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<string | 'selected' | null>(null);

    useEffect(() => {
        fetchClients();
    }, []);

    const fetchClients = async () => {
        const { data } = await supabase
            .from('clients')
            .select('id, full_name')
            .order('full_name');
        if (data) setClients(data);
    };

    const handleDeletePet = (id: string) => {
        setDeleteTarget(id);
        setShowDeleteConfirm(true);
    };

    const triggerBulkDelete = () => {
        if (selectedPets.size === 0) return;
        setDeleteTarget('selected');
        setShowDeleteConfirm(true);
    };

    const confirmDelete = async () => {
        if (!deleteTarget) return;

        try {
            if (deleteTarget === 'selected') {
                const idsToDelete = Array.from(selectedPets) as string[];
                const success = await deletePets(idsToDelete);
                if (success) setSelectedPets(new Set());
            } else {
                await deletePet(deleteTarget);

                if (selectedPets.has(deleteTarget)) {
                    const newSet = new Set(selectedPets);
                    newSet.delete(deleteTarget);
                    setSelectedPets(newSet);
                }
            }
            setShowDeleteConfirm(false);
            setDeleteTarget(null);

        } catch (error) {
            console.error('Error deleting:', error);
            alert('Erro ao excluir. Verifique dependências.');
        }
    };

    // Keyboard Shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.key === 'Delete' || e.key === 'Backspace') &&
                !showModal &&
                !showHistoryModal &&
                !showDeleteConfirm &&
                !(e.target instanceof HTMLInputElement) &&
                !(e.target instanceof HTMLTextAreaElement)
            ) {
                if (selectedPets.size > 0) {
                    e.preventDefault();
                    triggerBulkDelete();
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedPets, showModal, showHistoryModal, showDeleteConfirm]);

    const handleOpenHistory = (pet: PetWithOwner) => {
        setSelectedPetHistory(pet);
        setShowHistoryModal(true);
    };

    const handleEdit = (pet: PetWithOwner) => {
        setEditingPet(pet);
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
                        {selectedPets.size > 0 && <span className="ml-2 text-xs font-semibold bg-primary/20 text-primary-dark px-2 py-0.5 rounded-full">{selectedPets.size} selecionado(s)</span>}
                    </div>
                    <div className="flex items-center gap-3">
                        <h1 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight">Pets</h1>
                    </div>

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
                    {petsLoading ? (
                        <div className="p-4">
                            <TableSkeleton rows={8} cols={5} />
                        </div>
                    ) : (
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
                                        <tr
                                            key={pet.id}
                                            onClick={(e) => {
                                                if (e.ctrlKey || e.metaKey) {
                                                    const newSelected = new Set(selectedPets);
                                                    if (newSelected.has(pet.id)) {
                                                        newSelected.delete(pet.id);
                                                    } else {
                                                        newSelected.add(pet.id);
                                                    }
                                                    setSelectedPets(newSelected);
                                                    setLastSelectedPetId(pet.id);
                                                }
                                            }}
                                            className={`transition-colors group cursor-pointer ${selectedPets.has(pet.id)
                                                ? 'bg-primary/10 hover:bg-primary/20 dark:bg-primary/5 dark:hover:bg-primary/10 border-l-4 border-l-primary'
                                                : 'hover:bg-slate-50 dark:hover:bg-slate-800/50 border-l-4 border-l-transparent'
                                                }`}
                                        >
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
                                                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                                                        <span>{pet.breed || '-'}</span>
                                                        <span className="text-slate-300 dark:text-slate-600">•</span>
                                                        <span className={pet.sex === 'Macho' ? 'text-blue-500' : pet.sex === 'Fêmea' ? 'text-pink-500' : ''}>
                                                            {pet.sex || 'Sexo n/a'}
                                                        </span>
                                                    </div>
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
                                                <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
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
                    )}
                </div>
            </div>

            {/* Modal Novo Pet */}
            <PetModal
                isOpen={showModal}
                onClose={() => {
                    setShowModal(false);
                    setEditingPet(null);
                }}
                onSuccess={() => fetchPets()} // Hook handles update, but modal might want explicit refresh if it did something external. Hook fetchPets is stable.
                editingPet={editingPet}
                clients={clients}
            />

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-surface-dark rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden p-6 animate-in zoom-in-95 duration-200 border border-slate-200 dark:border-slate-800">
                        <div className="flex flex-col items-center text-center gap-4">
                            <div className="size-12 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 flex items-center justify-center">
                                <span className="material-symbols-outlined text-2xl">delete</span>
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                                    {deleteTarget === 'selected'
                                        ? `Excluir ${selectedPets.size} pets?`
                                        : 'Excluir pet?'}
                                </h3>
                                <p className="text-sm text-slate-500 mt-1">
                                    Essa ação não pode ser desfeita. Histórico e agendamentos podem ser perdidos.
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
            )}

            {/* History Modal */}
            <PetHistoryModal
                isOpen={showHistoryModal}
                onClose={() => setShowHistoryModal(false)}
                pet={selectedPetHistory}
            />

        </div>
    );
};

export default PetsPage;
