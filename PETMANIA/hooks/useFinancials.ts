import { useState, useCallback, useEffect } from 'react';
import { FinancialService } from '../services/FinancialService';

export function useFinancials() {
    const [dailyRevenue, setDailyRevenue] = useState(0);
    const [loading, setLoading] = useState(false);

    const fetchDailyRevenue = useCallback(async () => {
        setLoading(true);
        try {
            const today = new Date().toISOString().split('T')[0];
            const revenue = await FinancialService.getDailyRevenue(today);
            setDailyRevenue(revenue);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchDailyRevenue();
    }, [fetchDailyRevenue]);

    return {
        dailyRevenue,
        fetchDailyRevenue,
        loading
    };
}
