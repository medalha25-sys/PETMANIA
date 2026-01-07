import { useState, useCallback, useEffect } from 'react';
import { FinancialService } from '../services/FinancialService';
import { AppointmentService } from '../services/AppointmentService';

export function useDashboardStats(trigger = 0) {
    const [stats, setStats] = useState({
        revenue: 0,
        appointmentsCount: 0
    });
    const [loading, setLoading] = useState(false);

    const fetchStats = useCallback(async () => {
        setLoading(true);
        try {
            const today = new Date().toISOString().split('T')[0];
            const [revenue, count] = await Promise.all([
                FinancialService.getDailyRevenue(today),
                AppointmentService.getTodayCount()
            ]);
            setStats({ revenue, appointmentsCount: count });
        } catch (error) {
            console.error('Error fetching dashboard stats:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchStats();
    }, [fetchStats, trigger]);

    return {
        stats,
        loading,
        fetchStats
    };
}
