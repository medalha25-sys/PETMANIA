import { useState, useEffect, useCallback } from 'react';
import { AppointmentService, DbAppointment } from '../services/AppointmentService';

export function useAppointments(initialFilters?: { date?: string; limit?: number }) {
    const [appointments, setAppointments] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchAppointments = useCallback(async (filters = initialFilters) => {
        setLoading(true);
        setError(null);
        try {
            const data = await AppointmentService.getAll(filters);

            // Transform data for UI if necessary (or keep raw if components adapt)
            // For now, let's return the raw data extended with relations, 
            // but mapped to match the expected format in most components if needed.
            // However, sticking to the raw format + relations is better for the long run.

            setAppointments(data);
        } catch (err: any) {
            setError(err.message || 'Erro ao carregar agendamentos');
        } finally {
            setLoading(false);
        }
    }, [JSON.stringify(initialFilters)]);

    const updateStatus = async (id: string, status: string, financialData?: any) => {
        try {
            if (status === 'completed' && financialData) {
                await AppointmentService.completeAppointment(id, financialData);
            } else {
                await AppointmentService.updateStatus(id, status === 'Confirmado' ? 'confirmed' : status === 'Cancelado' ? 'cancelled' : status === 'Pendente' ? 'pending' : status.toLowerCase());
            }
            await fetchAppointments();
            return true;
        } catch (err: any) {
            setError(err.message || 'Erro ao atualizar status');
            return false;
        }
    };

    const cancelAppointments = async (ids: string[]) => {
        try {
            await AppointmentService.cancelMany(ids);
            await fetchAppointments();
            return true;
        } catch (err: any) {
            setError(err.message || 'Erro ao cancelar agendamentos');
            return false;
        }
    };

    useEffect(() => {
        fetchAppointments();
    }, [fetchAppointments]);

    return {
        appointments,
        loading,
        error,
        fetchAppointments,
        updateStatus,
        cancelAppointments
    };
}
