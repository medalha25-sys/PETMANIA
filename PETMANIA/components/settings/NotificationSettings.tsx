import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabase';

const NotificationSettings: React.FC = () => {
    const [loading, setLoading] = useState(false);

    // Notification Preferences
    const [emailNotif, setEmailNotif] = useState(true);
    const [whatsappNotif, setWhatsappNotif] = useState(true);

    useEffect(() => {
        fetchPreferences();
    }, []);

    const fetchPreferences = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            const prefs = user.user_metadata?.preferences || {};
            if (prefs.email_notif !== undefined) setEmailNotif(prefs.email_notif);
            if (prefs.whatsapp_notif !== undefined) setWhatsappNotif(prefs.whatsapp_notif);
        }
    };

    const updatePreference = async (key: string, value: boolean) => {
        // Optimistic update
        if (key === 'email_notif') setEmailNotif(value);
        if (key === 'whatsapp_notif') setWhatsappNotif(value);

        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const currentPrefs = user.user_metadata?.preferences || {};
            const newPrefs = { ...currentPrefs, [key]: value };

            const { error } = await supabase.auth.updateUser({
                data: { preferences: newPrefs }
            });

            if (error) throw error;
        } catch (err) {
            console.error('Error updating preference:', err);
            // Revert on error? For simple toggles, maybe just log it.
        } finally {
            setLoading(false);
        }
    };

    return (
        <section className="bg-white dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm animate-in fade-in duration-300">
            <div className="flex items-center gap-2 mb-6">
                <span className="material-symbols-outlined text-slate-400">notifications</span>
                <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">Preferências de Notificação</h3>
                    <p className="text-sm text-slate-500">Escolha como você deseja receber os alertas.</p>
                </div>
            </div>

            <div className="space-y-6">
                <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-3">
                        <div className="size-10 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                            <span className="material-symbols-outlined">mail</span>
                        </div>
                        <div>
                            <p className="font-bold text-slate-900 dark:text-white">Notificações por Email</p>
                            <p className="text-xs text-slate-500">Receba resumos diários e alertas de segurança.</p>
                        </div>
                    </div>
                    <button
                        onClick={() => updatePreference('email_notif', !emailNotif)}
                        disabled={loading}
                        className={`w-12 h-7 flex items-center rounded-full transition-colors ${emailNotif ? 'bg-primary' : 'bg-slate-300 dark:bg-slate-700'}`}
                    >
                        <div className={`size-5 bg-white rounded-full shadow-md transform transition-transform ${emailNotif ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                </div>

                <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-3">
                        <div className="size-10 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 flex items-center justify-center">
                            <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current" xmlns="http://www.w3.org/2000/svg">
                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                            </svg>
                        </div>
                        <div>
                            <p className="font-bold text-slate-900 dark:text-white">Notificações por WhatsApp</p>
                            <p className="text-xs text-slate-500">Receba lembretes de agenda e avisos importantes.</p>
                        </div>
                    </div>
                    <button
                        onClick={() => updatePreference('whatsapp_notif', !whatsappNotif)}
                        disabled={loading}
                        className={`w-12 h-7 flex items-center rounded-full transition-colors ${whatsappNotif ? 'bg-primary' : 'bg-slate-300 dark:bg-slate-700'}`}
                    >
                        <div className={`size-5 bg-white rounded-full shadow-md transform transition-transform ${whatsappNotif ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                </div>
            </div>
        </section>
    );
};

export default NotificationSettings;
