import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';
import ClientPetModal from '../components/ClientPetModal';

const ClientScheduling: React.FC = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);

    // Data State
    const [pets, setPets] = useState<any[]>([]);
    const [services, setServices] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    // Selection State
    const [selectedPet, setSelectedPet] = useState<string | null>(null);
    const [selectedService, setSelectedService] = useState<string | null>(null);
    const [selectedDate, setSelectedDate] = useState<string>('');
    const [selectedTime, setSelectedTime] = useState<string>('');
    const [notes, setNotes] = useState('');
    const [showPetModal, setShowPetModal] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
            // Fetch User's Pets
            const { data: petsData } = await supabase
                .from('pets')
                .select('*')
                .eq('owner_id', user.id);
            if (petsData) setPets(petsData);

            // Fetch Services
            const { data: servicesData } = await supabase
                .from('services')
                .select('*')
                .eq('active', true);
            if (servicesData) setServices(servicesData);
        }
        setLoading(false);
    };

    const handleNext = () => {
        if (step === 1 && !selectedPet) return alert('Selecione um pet');
        if (step === 2 && !selectedService) return alert('Selecione um serviço');
        if (step === 3 && (!selectedDate || !selectedTime)) return alert('Selecione data e hora');

        if (step < 4) setStep(step + 1);
    };

    const handleBack = () => {
        if (step > 1) setStep(step - 1);
        else navigate('/portal');
    };

    const handleConfirm = async () => {
        try {
            setSubmitting(true);
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Usuário não autenticado");

            const pet = pets.find(p => p.id === selectedPet);
            const service = services.find(s => s.id === selectedService);

            // Simple end time calculation (start + 1 hour default)
            const [hour, minute] = selectedTime.split(':').map(Number);
            const endHour = hour + 1;
            const endTime = `${endHour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;

            const { error } = await supabase.from('appointments').insert({
                client_id: user.id,
                pet_id: selectedPet,
                service_type: service?.name || 'Serviço',
                date: selectedDate,
                start_time: selectedTime,
                end_time: endTime,
                status: 'Pendente',
                notes: notes,
                created_by: user.id
            });

            if (error) throw error;

            alert('Agendamento realizado com sucesso!');
            navigate('/portal');

        } catch (error: any) {
            console.error(error);
            alert('Erro ao agendar: ' + (error.message || 'Erro desconhecido'));
        } finally {
            setSubmitting(false);
        }
    };

    // Generate timeslots (e.g., 08:00 to 18:00)
    const timeSlots = [];
    for (let i = 8; i <= 18; i++) {
        timeSlots.push(`${i.toString().padStart(2, '0')}:00`);
        timeSlots.push(`${i.toString().padStart(2, '0')}:30`);
    }

    return (
        <div className="max-w-4xl mx-auto pb-20">
            <header className="mb-8">
                <button onClick={handleBack} className="text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 flex items-center gap-2 mb-4 font-medium transition-colors">
                    <span className="material-symbols-outlined">arrow_back</span>
                    Voltar
                </button>
                <h1 className="text-3xl font-black text-slate-900 dark:text-white">Novo Agendamento</h1>
                <p className="text-slate-500">Preencha os dados abaixo para marcar um novo serviço.</p>
            </header>

            {/* Progress Steps */}
            <div className="flex items-center justify-between mb-8 relative">
                {[1, 2, 3, 4].map((s) => (
                    <div key={s} className={`flex flex-col items-center z-10 ${step >= s ? 'text-primary' : 'text-slate-300 dark:text-slate-700'}`}>
                        <div className={`size-10 rounded-full flex items-center justify-center font-bold text-lg transition-all duration-300 ${step >= s ? 'bg-primary text-slate-900 shadow-lg shadow-primary/30' : 'bg-slate-100 dark:bg-slate-800'
                            }`}>
                            {step > s ? <span className="material-symbols-outlined">check</span> : s}
                        </div>
                        <span className="text-xs font-bold mt-2 hidden md:block">
                            {s === 1 && 'Pet'}
                            {s === 2 && 'Serviço'}
                            {s === 3 && 'Horário'}
                            {s === 4 && 'Resumo'}
                        </span>
                    </div>
                ))}
                <div className="absolute top-5 left-0 w-full h-1 bg-slate-100 dark:bg-slate-800 -z-0"></div>
                <div
                    className="absolute top-5 left-0 h-1 bg-primary -z-0 transition-all duration-500"
                    style={{ width: `${((step - 1) / 3) * 100}%` }}
                ></div>
            </div>

            <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-xl shadow-slate-200/50 dark:shadow-none min-h-[400px]">
                {/* Step 1: Select Pet */}
                {step === 1 && (
                    <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                            <span className="size-8 rounded-full bg-green-100 text-green-700 flex items-center justify-center text-sm">1</span>
                            Selecione o Cliente/Pet
                        </h2>

                        <div className="flex justify-end mb-4">
                            <button
                                onClick={() => setShowPetModal(true)}
                                className="text-sm font-bold text-primary hover:underline flex items-center gap-1"
                            >
                                <span className="material-symbols-outlined text-lg">add_circle</span>
                                Novo Pet
                            </button>
                        </div>

                        {loading ? <div className="text-center py-8">Carregando pets...</div> : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {pets.map(pet => (
                                    <button
                                        key={pet.id}
                                        onClick={() => setSelectedPet(pet.id)}
                                        className={`p-4 border-2 rounded-2xl flex items-center gap-4 transition-all text-left ${selectedPet === pet.id
                                            ? 'border-primary bg-primary/10'
                                            : 'border-slate-100 dark:border-slate-800 hover:border-primary/50'
                                            }`}
                                    >
                                        <div
                                            className="size-16 bg-slate-200 rounded-full bg-cover bg-center shrink-0"
                                            style={{ backgroundImage: `url(${pet.avatar_url || 'https://placedog.net/100/100'})` }}
                                        ></div>
                                        <div>
                                            <h3 className="font-bold text-slate-900 dark:text-white">{pet.name}</h3>
                                            <p className="text-xs text-slate-500">{pet.breed || pet.species}</p>
                                        </div>
                                        {selectedPet === pet.id && (
                                            <span className="material-symbols-outlined ml-auto text-primary">check_circle</span>
                                        )}
                                    </button>
                                ))}

                                {pets.length === 0 && (
                                    <div className="col-span-2 text-center py-8 bg-slate-50 dark:bg-slate-900 rounded-xl">
                                        <p className="text-slate-500 mb-2">Você ainda não tem pets cadastrados.</p>
                                        <p className="text-sm cursor-pointer hover:text-primary hover:underline" onClick={() => setShowPetModal(true)}>
                                            Clique aqui para cadastrar seu primeiro pet agora.
                                        </p>
                                    </div>
                                )}

                                <button
                                    onClick={() => setShowPetModal(true)}
                                    className="p-4 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl flex flex-col items-center justify-center gap-2 text-slate-500 hover:text-primary hover:border-primary hover:bg-primary/5 transition-all min-h-[100px]"
                                >
                                    <span className="material-symbols-outlined text-3xl">add</span>
                                    <span className="font-bold text-sm">Adicionar Novo Pet</span>
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* Step 2: Select Service */}
                {step === 2 && (
                    <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                            <span className="size-8 rounded-full bg-green-100 text-green-700 flex items-center justify-center text-sm">2</span>
                            Escolha o Serviço
                        </h2>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {services.map(service => (
                                <button
                                    key={service.id}
                                    onClick={() => setSelectedService(service.id)}
                                    className={`p-6 border-2 rounded-2xl flex flex-col items-center justify-center gap-3 transition-all ${selectedService === service.id
                                        ? 'border-primary bg-primary/10'
                                        : 'border-slate-100 dark:border-slate-800 hover:border-primary/50'
                                        }`}
                                >
                                    <div className={`size-12 rounded-full flex items-center justify-center text-xl ${selectedService === service.id ? 'bg-primary text-slate-900' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                                        }`}>
                                        <span className="material-symbols-outlined">
                                            {service.name.toLowerCase().includes('banho') ? 'shower' :
                                                service.name.toLowerCase().includes('tosa') ? 'content_cut' : 'medical_services'}
                                        </span>
                                    </div>
                                    <div className="text-center">
                                        <h3 className="font-bold text-slate-900 dark:text-white text-sm">{service.name}</h3>
                                        <p className="text-green-600 font-bold text-sm mt-1">R$ {service.price},00</p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Step 3: Date & Time */}
                {step === 3 && (
                    <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                            <span className="size-8 rounded-full bg-green-100 text-green-700 flex items-center justify-center text-sm">3</span>
                            Data e Horário
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Data</label>
                                <input
                                    type="date"
                                    value={selectedDate}
                                    onChange={(e) => setSelectedDate(e.target.value)}
                                    className="w-full p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Horários Disponíveis</label>
                                <div className="grid grid-cols-3 gap-2 max-h-60 overflow-y-auto pr-2">
                                    {timeSlots.map(time => (
                                        <button
                                            key={time}
                                            onClick={() => setSelectedTime(time)}
                                            className={`py-2 px-1 rounded-lg text-sm font-medium border transition-all ${selectedTime === time
                                                ? 'bg-primary text-slate-900 border-primary'
                                                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-primary/50 text-slate-600 dark:text-slate-300'
                                                }`}
                                        >
                                            {time}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="mt-6">
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Observações (Opcional)</label>
                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="Ex: Alergia a shampoo, cão reativo..."
                                className="w-full p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary outline-none h-32 resize-none"
                            ></textarea>
                        </div>
                    </div>
                )}

                {/* Step 4: Summary */}
                {step === 4 && (
                    <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                            <span className="size-8 rounded-full bg-green-100 text-green-700 flex items-center justify-center text-sm">4</span>
                            Resumo do Agendamento
                        </h2>

                        <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-6 space-y-4 border border-slate-100 dark:border-slate-800">
                            <div className="flex items-center gap-4">
                                <div className="size-12 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                                    <span className="material-symbols-outlined">pets</span>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500 uppercase font-bold">Pet</p>
                                    <p className="font-bold text-slate-900 dark:text-white text-lg">
                                        {pets.find(p => p.id === selectedPet)?.name}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-4">
                                <div className="size-12 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                                    <span className="material-symbols-outlined">medical_services</span>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500 uppercase font-bold">Serviço</p>
                                    <p className="font-bold text-slate-900 dark:text-white text-lg">
                                        {services.find(s => s.id === selectedService)?.name}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-4">
                                <div className="size-12 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                                    <span className="material-symbols-outlined">calendar_month</span>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500 uppercase font-bold">Data e Hora</p>
                                    <p className="font-bold text-slate-900 dark:text-white text-lg">
                                        {new Date(selectedDate).toLocaleDateString('pt-BR')} às {selectedTime}
                                    </p>
                                </div>
                            </div>

                            <div className="pt-4 mt-4 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center">
                                <span className="text-slate-500">Total Estimado</span>
                                <span className="text-2xl font-black text-slate-900 dark:text-white">
                                    R$ {services.find(s => s.id === selectedService)?.price},00
                                </span>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Actions */}
            <div className="flex justify-end mt-8 gap-4">
                {step < 4 ? (
                    <button
                        onClick={handleNext}
                        className="px-8 py-3 bg-primary hover:bg-primary-dark text-slate-900 font-bold rounded-xl shadow-lg shadow-primary/30 transform active:scale-95 transition-all flex items-center gap-2"
                    >
                        Continuar
                        <span className="material-symbols-outlined">arrow_forward</span>
                    </button>
                ) : (
                    <button
                        onClick={handleConfirm}
                        disabled={submitting}
                        className="px-8 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl shadow-lg shadow-green-600/30 transform active:scale-95 transition-all flex items-center gap-2"
                    >
                        {submitting ? 'Agendando...' : 'Confirmar Agendamento'}
                        {!submitting && <span className="material-symbols-outlined">check</span>}
                    </button>
                )}
            </div>

            <ClientPetModal
                isOpen={showPetModal}
                onClose={() => setShowPetModal(false)}
                onSuccess={() => {
                    fetchData();
                }}
            />
        </div>
    );
};

export default ClientScheduling;
