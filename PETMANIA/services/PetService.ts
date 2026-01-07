import { supabase } from '../supabase';
import { DbPet, PetWithOwner } from './api';

export const PetService = {
    async getAll(): Promise<PetWithOwner[]> {
        const { data, error } = await supabase
            .from('pets')
            .select(`
                *,
                owner:clients (
                    full_name
                )
            `)
            .order('name');

        if (error) {
            console.error('Error fetching pets:', error);
            throw error;
        }

        return data || [];
    },

    async create(pet: Omit<DbPet, 'id'>): Promise<DbPet> {
        const { data, error } = await supabase
            .from('pets')
            .insert([pet])
            .select()
            .single();

        if (error) {
            console.error('Error creating pet:', error);
            throw error;
        }

        return data;
    },

    async update(id: string, updates: Partial<DbPet>): Promise<DbPet> {
        const { data, error } = await supabase
            .from('pets')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('Error updating pet:', error);
            throw error;
        }

        return data;
    },

    async delete(id: string): Promise<void> {
        const { error } = await supabase
            .from('pets')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error deleting pet:', error);
            throw error;
        }
    },

    async deleteMany(ids: string[]): Promise<void> {
        const { error } = await supabase
            .from('pets')
            .delete()
            .in('id', ids);

        if (error) {
            console.error('Error deleting pets:', error);
            throw error;
        }
    }
};
