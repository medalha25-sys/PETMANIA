import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabase';

const CompanySettings: React.FC = () => {
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    // Company Settings State
    const [companyName, setCompanyName] = useState('PetManager');
    const [companyLogo, setCompanyLogo] = useState<string | null>(null);
    const [companyId, setCompanyId] = useState<string | null>(null);
    const [companyCity, setCompanyCity] = useState('');
    const [companyState, setCompanyState] = useState('');
    const [companyCnpj, setCompanyCnpj] = useState('');
    const [companyStreet, setCompanyStreet] = useState('');
    const [companyNumber, setCompanyNumber] = useState('');
    const [companyNeighborhood, setCompanyNeighborhood] = useState('');
    const [companyPhone, setCompanyPhone] = useState('');
    const [companyWhatsapp, setCompanyWhatsapp] = useState('');
    const [companyEmail, setCompanyEmail] = useState('');

    useEffect(() => {
        fetchCompanyInfo();
    }, []);

    const fetchCompanyInfo = async () => {
        const { data: companyData } = await supabase
            .from('company_info')
            .select('id, name, logo_url, city, state, cnpj, street, number, neighborhood, phone, whatsapp, email')
            .single();

        if (companyData) {
            setCompanyId(companyData.id);
            setCompanyName(companyData.name);
            setCompanyLogo(companyData.logo_url);
            setCompanyCity(companyData.city || '');
            setCompanyState(companyData.state || '');
            setCompanyCnpj(companyData.cnpj || '');
            setCompanyStreet(companyData.street || '');
            setCompanyNumber(companyData.number || '');
            setCompanyNeighborhood(companyData.neighborhood || '');
            setCompanyPhone(companyData.phone || '');
            setCompanyWhatsapp(companyData.whatsapp || '');
            setCompanyEmail(companyData.email || '');
        }
    };

    const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;
        setLoading(true);
        const file = e.target.files[0];
        const fileExt = file.name.split('.').pop();
        const fileName = `logo-${Date.now()}.${fileExt}`;

        try {
            const { error: uploadError } = await supabase.storage
                .from('company-assets')
                .upload(fileName, file);
            if (uploadError) throw uploadError;

            const { data } = supabase.storage.from('company-assets').getPublicUrl(fileName);
            setCompanyLogo(data.publicUrl);

            // Update DB immediately
            if (companyId) {
                const { error: updateError } = await supabase
                    .from('company_info')
                    .update({ logo_url: data.publicUrl })
                    .eq('id', companyId);

                if (updateError) throw updateError;
            }

            setMessage({ type: 'success', text: 'Logo atualizado!' });
        } catch (err: any) {
            console.error(err);
            setMessage({ type: 'error', text: 'Erro ao enviar logo.' });
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setLoading(true);
        setMessage(null);
        try {
            if (!companyId) throw new Error('ID da empresa não encontrado');
            const { error } = await supabase
                .from('company_info')
                .update({
                    name: companyName,
                    city: companyCity,
                    state: companyState,
                    cnpj: companyCnpj,
                    street: companyStreet,
                    number: companyNumber,
                    neighborhood: companyNeighborhood,
                    phone: companyPhone,
                    whatsapp: companyWhatsapp,
                    email: companyEmail
                })
                .eq('id', companyId);

            if (error) throw error;
            setMessage({ type: 'success', text: 'Dados da empresa atualizados!' });
        } catch (err: any) {
            console.error(err);
            setMessage({ type: 'error', text: 'Erro ao atualizar dados.' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <section className="bg-white dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm animate-in fade-in duration-300 mb-6">
            <div className="flex items-center gap-2 mb-4">
                <span className="material-symbols-outlined text-slate-400">storefront</span>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Dados da Empresa</h3>
            </div>

            {message && (
                <div className={`mb-4 p-3 rounded-lg text-sm font-medium ${message.type === 'success' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
                    {message.text}
                </div>
            )}

            <div className="space-y-4">
                <div className="flex flex-col md:flex-row gap-6 items-start">
                    <div className="relative group cursor-pointer flex-shrink-0">
                        <div
                            className="size-24 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center border-2 border-dashed border-slate-300 dark:border-slate-700 overflow-hidden"
                            style={{ backgroundImage: companyLogo ? `url("${companyLogo}")` : undefined, backgroundSize: 'cover', backgroundPosition: 'center' }}
                        >
                            {!companyLogo && <span className="material-symbols-outlined text-slate-400 text-3xl">add_photo_alternate</span>}
                        </div>
                        <label className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-white">
                            <span className="material-symbols-outlined text-sm">edit</span>
                            <input
                                type="file"
                                className="hidden"
                                accept="image/*"
                                onChange={handleLogoUpload}
                            />
                        </label>
                        <div className="mt-1 text-xs text-center text-slate-500">1080x1080 px</div>
                    </div>
                    <div className="flex-1 space-y-4 w-full">
                        <div>
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Nome do Petshop</label>
                            <input
                                type="text"
                                value={companyName}
                                onChange={(e) => setCompanyName(e.target.value)}
                                className="w-full h-10 rounded-lg border border-slate-200 dark:border-slate-800 bg-transparent px-3 text-sm dark:text-white focus:ring-2 focus:ring-primary/50 outline-none mt-1"
                                placeholder="Nome da sua empresa"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">CNPJ</label>
                                <input
                                    type="text"
                                    value={companyCnpj}
                                    onChange={(e) => setCompanyCnpj(e.target.value)}
                                    className="w-full h-10 rounded-lg border border-slate-200 dark:border-slate-800 bg-transparent px-3 text-sm dark:text-white focus:ring-2 focus:ring-primary/50 outline-none mt-1"
                                    placeholder="00.000.000/0000-00"
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Email da Empresa</label>
                                <input
                                    type="email"
                                    value={companyEmail}
                                    onChange={(e) => setCompanyEmail(e.target.value)}
                                    className="w-full h-10 rounded-lg border border-slate-200 dark:border-slate-800 bg-transparent px-3 text-sm dark:text-white focus:ring-2 focus:ring-primary/50 outline-none mt-1"
                                    placeholder="contato@empresa.com"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-[2fr_1fr] gap-4">
                            <div>
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Rua / Logradouro</label>
                                <input
                                    type="text"
                                    value={companyStreet}
                                    onChange={(e) => setCompanyStreet(e.target.value)}
                                    className="w-full h-10 rounded-lg border border-slate-200 dark:border-slate-800 bg-transparent px-3 text-sm dark:text-white focus:ring-2 focus:ring-primary/50 outline-none mt-1"
                                    placeholder="Nome da rua"
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Número</label>
                                <input
                                    type="text"
                                    value={companyNumber}
                                    onChange={(e) => setCompanyNumber(e.target.value)}
                                    className="w-full h-10 rounded-lg border border-slate-200 dark:border-slate-800 bg-transparent px-3 text-sm dark:text-white focus:ring-2 focus:ring-primary/50 outline-none mt-1"
                                    placeholder="Nº"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Bairro</label>
                            <input
                                type="text"
                                value={companyNeighborhood}
                                onChange={(e) => setCompanyNeighborhood(e.target.value)}
                                className="w-full h-10 rounded-lg border border-slate-200 dark:border-slate-800 bg-transparent px-3 text-sm dark:text-white focus:ring-2 focus:ring-primary/50 outline-none mt-1"
                                placeholder="Bairro"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Telefone</label>
                                <input
                                    type="text"
                                    value={companyPhone}
                                    onChange={(e) => setCompanyPhone(e.target.value)}
                                    className="w-full h-10 rounded-lg border border-slate-200 dark:border-slate-800 bg-transparent px-3 text-sm dark:text-white focus:ring-2 focus:ring-primary/50 outline-none mt-1"
                                    placeholder="(00) 0000-0000"
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">WhatsApp</label>
                                <input
                                    type="text"
                                    value={companyWhatsapp}
                                    onChange={(e) => setCompanyWhatsapp(e.target.value)}
                                    className="w-full h-10 rounded-lg border border-slate-200 dark:border-slate-800 bg-transparent px-3 text-sm dark:text-white focus:ring-2 focus:ring-primary/50 outline-none mt-1"
                                    placeholder="(00) 90000-0000"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Cidade</label>
                                <input
                                    type="text"
                                    value={companyCity}
                                    onChange={(e) => setCompanyCity(e.target.value)}
                                    className="w-full h-10 rounded-lg border border-slate-200 dark:border-slate-800 bg-transparent px-3 text-sm dark:text-white focus:ring-2 focus:ring-primary/50 outline-none mt-1"
                                    placeholder="Cidade"
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Estado (UF)</label>
                                <input
                                    type="text"
                                    value={companyState}
                                    onChange={(e) => setCompanyState(e.target.value)}
                                    className="w-full h-10 rounded-lg border border-slate-200 dark:border-slate-800 bg-transparent px-3 text-sm dark:text-white focus:ring-2 focus:ring-primary/50 outline-none mt-1"
                                    placeholder="UF"
                                    maxLength={2}
                                />
                            </div>
                        </div>

                        <div className="flex justify-end">
                            <button
                                onClick={handleSave}
                                disabled={loading}
                                className="px-6 py-2 bg-primary text-slate-900 font-bold rounded-lg text-sm hover:bg-primary-dark transition-colors disabled:opacity-70"
                            >
                                {loading ? 'Salvando...' : 'Salvar Alterações'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default CompanySettings;
