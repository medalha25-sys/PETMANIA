import React, { useEffect, useState } from 'react';
import { supabase } from '../supabase';

const MOTIVATIONAL_QUOTES = [
    "O sucesso é a soma de pequenos esforços repetidos dia após dia.",
    "Acredite em si mesmo e todo o resto virá naturalmente.",
    "Seus sonhos não têm data de validade. Respire fundo e tente de novo.",
    "O único lugar onde o sucesso vem antes do trabalho é no dicionário.",
    "Você é mais forte do que imagina. Acredite na sua capacidade.",
    "Grandes coisas nunca vêm de zonas de conforto.",
    "A persistência é o caminho do êxito.",
    "Não espere por oportunidades extraordinárias. Agarre ocasiões comuns e transforme-as em grandes coisas."
];

const BirthdayCelebration: React.FC = () => {
    const [show, setShow] = useState(false);
    const [quote, setQuote] = useState('');
    const [userName, setUserName] = useState('');

    useEffect(() => {
        const checkBirthday = async () => {
            const { data: { user } } = await supabase.auth.getUser();

            if (user?.user_metadata?.birth_date) {
                const today = new Date();
                // Ajustando fuso horário para garantir comparação correta do dia
                const birthDate = new Date(user.user_metadata.birth_date + 'T00:00:00');

                const isBirthday =
                    today.getDate() === birthDate.getDate() &&
                    today.getMonth() === birthDate.getMonth();

                // Check if already shown this session to avoid annoyance on refresh, 
                // BUT user said "cada vez que fizer login", so maybe showing on load is fine.
                // Let's use sessionStorage to only show once per session (tab open) to be polite.
                const hasShown = sessionStorage.getItem('birthday_shown');

                if (isBirthday && !hasShown) {
                    setUserName(user.user_metadata.full_name?.split(' ')[0] || 'Colaborador');
                    setQuote(MOTIVATIONAL_QUOTES[Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length)]);
                    setShow(true);
                    sessionStorage.setItem('birthday_shown', 'true');
                }
            }
        };

        checkBirthday();
    }, []);

    if (!show) return null;

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-500">
            <div className="relative bg-white dark:bg-slate-800 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden p-8 text-center animate-in zoom-in-50 duration-500">
                {/* Confetti or decoration effect could go here */}
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500" />

                <div className="size-24 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-yellow-500/20">
                    <span className="material-symbols-outlined text-5xl">cake</span>
                </div>

                <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-2">
                    Feliz Aniversário, {userName}! 🎉
                </h2>

                <p className="text-slate-500 dark:text-slate-400 mb-6 font-medium">
                    Hoje o dia é todo seu!
                </p>

                <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-xl border border-slate-100 dark:border-slate-700 mb-6 relative">
                    <span className="absolute top-4 left-4 text-4xl text-slate-200 dark:text-slate-700 font-serif leading-none">"</span>
                    <p className="text-slate-700 dark:text-slate-300 italic relative z-10 font-medium font-serif text-lg">
                        {quote}
                    </p>
                    <span className="absolute bottom-[-10px] right-4 text-4xl text-slate-200 dark:text-slate-700 font-serif leading-none transform rotate-180">"</span>
                </div>

                <p className="text-sm text-slate-600 dark:text-slate-400 mb-8 leading-relaxed">
                    Agradecemos imensamente por você fazer parte da nossa equipe de colaboradores. Sua dedicação e talento fazem toda a diferença para nós!
                </p>

                <button
                    onClick={() => setShow(false)}
                    className="w-full py-3 bg-gradient-to-r from-primary to-purple-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all transform active:scale-95"
                >
                    Obrigado! Vamos trabalhar!
                </button>
            </div>
        </div>
    );
};

export default BirthdayCelebration;
