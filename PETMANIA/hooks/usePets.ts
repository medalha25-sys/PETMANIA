import { useState, useEffect, useCallback } from 'react';
import { PetService } from '../services/PetService';
import { PetWithOwner, DbPet } from '../services/api';

export function usePets() {
    const [pets, setPets] = useState<PetWithOwner[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchPets = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await PetService.getAll();
            setPets(data);
        } catch (err: any) {
            setError(err.message || 'Erro ao carregar pets');
        } finally {
            setLoading(false);
        }
    }, []);

    const createPet = async (pet: Omit<DbPet, 'id'>) => {
        try {
            await PetService.create(pet);
            await fetchPets(); // Refresh list
            return true;
        } catch (err: any) {
            setError(err.message || 'Erro ao criar pet');
            return false;
        }
    };

    const updatePet = async (id: string, updates: Partial<DbPet>) => {
        try {
            await PetService.update(id, updates);
            await fetchPets();
            return true;
        } catch (err: any) {
            setError(err.message || 'Erro ao atualizar pet');
            return false;
        }
    };

    const deletePet = async (id: string) => {
        try {
            await PetService.delete(id);
            setPets(prev => prev.filter(p => p.id !== id));
            return true;
        } catch (err: any) {
            setError(err.message || 'Erro ao deletar pet');
            return false;
        }
    };

    const deletePets = async (ids: string[]) => {
        try {
            await PetService.deleteMany(ids);
            setPets(prev => prev.filter(p => !ids.includes(p.id)));
            return true;
        } catch (err: any) {
            setError(err.message || 'Erro ao deletar pets');
            return false;
        }
    };

    useEffect(() => {
        fetchPets();
    }, [fetchPets]);

    return {
        pets,
        loading,
        error,
        fetchPets,
        createPet,
        updatePet,
        deletePet,
        deletePets
    };
}
