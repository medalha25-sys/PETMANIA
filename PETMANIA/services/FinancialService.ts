import { supabase } from '../supabase';

export const FinancialService = {
    async getDailyRevenue(date: string): Promise<number> {
        const { data, error } = await supabase
            .from('financial_records')
            .select('amount')
            .eq('type', 'income')
            .eq('date', date);

        if (error) {
            console.error('Error fetching daily revenue:', error);
            throw error;
        }

        return data?.reduce((acc, curr) => acc + (curr.amount || 0), 0) || 0;
    }
};
