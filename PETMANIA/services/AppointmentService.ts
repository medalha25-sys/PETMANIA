import { supabase } from '../supabase';

export interface DbAppointment {
    id: string;
    date: string;
    start_time: string;
    end_time: string;
    service_type: string;
    status: 'confirmed' | 'pending' | 'cancelled' | 'completed';
    notes?: string;
    client_id: string;
    pet_id: string;
}

export const AppointmentService = {
    async getAll(filters?: { date?: string; limit?: number }) {
        let query = supabase
            .from('appointments')
            .select(`
                *,
                client:clients (
                    full_name,
                    avatar_url
                ),
                pet:pets (
                    name
                )
            `)
            .order('date', { ascending: true })
            .order('start_time', { ascending: true });

        if (filters?.date) {
            query = query.eq('date', filters.date);
        }

        if (filters?.limit) {
            query = query.limit(filters.limit);
        }

        const { data, error } = await query;
        if (error) throw error;
        return data || [];
    },

    async updateStatus(id: string, status: string) {
        const { error } = await supabase
            .from('appointments')
            .update({ status })
            .eq('id', id);
        if (error) throw error;
    },

    async cancelMany(ids: string[]) {
        const { error } = await supabase
            .from('appointments')
            .update({ status: 'cancelled' })
            .in('id', ids);
        if (error) throw error;
    },

    async getTodayCount(): Promise<number> {
        const today = new Date().toISOString().split('T')[0];
        const { count, error } = await supabase
            .from('appointments')
            .select('*', { count: 'exact', head: true })
            .eq('date', today)
            .neq('status', 'cancelled');

        if (error) {
            console.error('Error fetching appointment count:', error);
            return 0;
        }
        return count || 0;
    },

    async completeAppointment(id: string, financialRecord: { description: string; amount: number; type: 'income'; category: string; date: string }) {
        // This simulates a transaction (Client side unfortunately, until we move to RPC/Edge Functions)

        // 1. Create Financial Record
        const { error: finError } = await supabase.from('financial_records').insert({
            ...financialRecord,
            appointment_id: id
        });

        if (finError) throw finError;

        // 2. Mark Appointment as Completed
        const { error: appError } = await supabase
            .from('appointments')
            .update({ status: 'completed' })
            .eq('id', id);

        if (appError) {
            // Ideally we would rollback here, but for now we just throw
            console.error('Failed to update appointment status after creating financial record');
            throw appError;
        }
    }
};
