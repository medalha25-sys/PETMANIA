import React, { useState, useRef } from 'react';
import { supabase } from '../supabase';

interface ClientPetModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

const ClientPetModal: React.FC<ClientPetModalProps> = ({ isOpen, onClose, onSuccess }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);

    // Form State
    const [name, setName] = useState('');
    const [species, setSpecies] = useState('Cachorro');
    const [sex, setSex] = useState<'Macho' | 'Fêmea'>('Macho');
    const [breed, setBreed] = useState('');
    const [birthDate, setBirthDate] = useState('');
    const [weight, setWeight] = useState('');
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

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
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Usuário não autenticado");

            const petData = {
                name,
                species,
                sex,
                breed,
                birth_date: birthDate || null,
                weight: weight ? parseFloat(weight) : null,
                owner_id: user.id, // Auto-assign to current user
                avatar_url: avatarUrl
            };

            const { error } = await supabase.from('pets').insert(petData);
            if (error) throw error;

            resetForm();
            onSuccess();
            onClose();
        } catch (error: any) {
            console.error(error);
            alert('Erro ao salvar pet: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setName('');
        setSpecies('Cachorro');
        setSex('Macho');
        setBreed('');
        setBirthDate('');
        setWeight('');
        setAvatarUrl(null);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-surface-dark rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800">
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                        Novo Pet
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 text-slate-400 hover:text-red-500 transition-colors rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto custom-scrollbar">
                    {/* Avatar Upload */}
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
                                <option value="Cachorro">Cachorro</option>
                                <option value="Gato">Gato</option>
                                <option value="Pássaro">Pássaro</option>
                                <option value="Outro">Outro</option>
                            </select>
                        </div>

                        <div className="space-y-1">
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Sexo</label>
                            <select
                                value={sex}
                                onChange={(e) => setSex(e.target.value as 'Macho' | 'Fêmea')}
                                className="w-full h-11 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent px-4 text-sm dark:text-white focus:ring-2 focus:ring-primary/50 outline-none [&>option]:text-slate-900 [&>option]:dark:bg-surface-dark [&>option]:dark:text-white"
                            >
                                <option value="Macho">Macho</option>
                                <option value="Fêmea">Fêmea</option>
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
                                placeholder="Ex: 5.5"
                            />
                        </div>
                    </div>
                </div>

                <div className="p-6 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-4">
                    <button
                        onClick={onClose}
                        className="px-6 py-2.5 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={loading}
                        className="px-6 py-2.5 bg-primary hover:bg-primary-dark text-slate-900 font-bold rounded-xl shadow-lg shadow-primary/20 transition-all transform active:scale-95 flex items-center gap-2"
                    >
                        {loading ? 'Salvando...' : 'Salvar Pet'}
                        {!loading && <span className="material-symbols-outlined">check</span>}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ClientPetModal;
