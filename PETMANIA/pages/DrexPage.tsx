import React from 'react';
import { useNavigate } from 'react-router-dom';

const DrexPage: React.FC = () => {
    const navigate = useNavigate();
    const [selectedType, setSelectedType] = React.useState<'CPF' | 'MEI' | 'CNPJ'>('CPF');
    const [value, setValue] = React.useState('');
    const [result, setResult] = React.useState<{ nominal: number; reduction: number; effective: number } | null>(null);

    const handleCalculate = () => {
        const val = parseFloat(value);
        if (isNaN(val)) return;

        let calculatedTax = 0;
        let nominalTax = 0;
        let reduction = 0;

        if (selectedType === 'CPF') {
            // Logic based on IRPF 2026 Proposal (Simulated from calculadorairpf.lovable.app)
            // 1. Calculate Standard IRPF (Nominal) - Using simplified 2025 table approximation
            // Tabela Progressiva Mensal (Valid from Feb 2024)
            let baseTax = 0;
            // Deduction is simplified for "Nominal" reference matching the site
            // Site uses a curve that matches ~27.5% - 896 at high values

            if (val <= 2259.20) {
                nominalTax = 0;
            } else if (val <= 2826.65) {
                nominalTax = (val * 0.075) - 169.44;
            } else if (val <= 3751.05) {
                nominalTax = (val * 0.15) - 381.44;
            } else if (val <= 4664.68) {
                nominalTax = (val * 0.225) - 662.77;
            } else {
                nominalTax = (val * 0.275) - 896.00;
            }
            nominalTax = Math.max(0, nominalTax);

            // 2. Apply 2026 Exemption Rule
            // - Up to 5000: Full Exemption (Tax = 0)
            // - 5001 to 7500: "Partial Cliff". You pay tax, but with a specific reduction.
            //   Based on user screenshot: At 5001, Reduction is ~312.76. At 7500, Reduction is 0.
            //   We use a linear fade for this reduction.

            if (val <= 5000) {
                calculatedTax = 0;
                reduction = nominalTax; // Full exemption
            } else if (val < 7500) {
                // Range 5001 - 7500 (Size ~2500)
                // Max Reduction at 5001 = 312.76
                // Min Reduction at 7500 = 0

                const maxTransitionReduction = 312.76;
                const range = 7500 - 5001;
                const offset = val - 5001;

                // Linear interpolation: Red decreases as value increases
                const reductionValue = maxTransitionReduction * (1 - (offset / range));

                reduction = Math.max(0, reductionValue);
                calculatedTax = Math.max(0, nominalTax - reduction);
            } else {
                // Above 7500: Full Nominal Tax
                calculatedTax = nominalTax;
                reduction = 0;
            }

        } else if (selectedType === 'MEI') {
            // MEI rule: Fixed DAS (approx R$ 75-85) + Excess tax if applicable
            // For simulator, we'll show the fixed base
            nominalTax = 75.60; // Base estimate 2024/25
            calculatedTax = nominalTax;
            reduction = 0;
        } else if (selectedType === 'CNPJ') {
            // Simples Nacional Anexo III estimate (starting 6%)
            nominalTax = val * 0.06;
            calculatedTax = nominalTax;
            reduction = 0;
        }

        setResult({
            nominal: nominalTax,
            reduction: reduction,
            effective: calculatedTax
        });
    };

    return (
        <div className="p-4 md:p-8 max-w-[1400px] mx-auto w-full">
            <header className="flex flex-col gap-4 mb-8">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/')}
                        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                    >
                        <span className="material-symbols-outlined text-slate-600 dark:text-slate-400">arrow_back</span>
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Calculadora Drex</h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Simulador de Imposto 2026</p>
                    </div>
                </div>
            </header>

            <div className="max-w-xl mx-auto">
                <div className="bg-white dark:bg-surface-dark rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 md:p-8">
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Simulador de Tributação</h2>

                    {/* Type Selector */}
                    <div className="grid grid-cols-3 gap-2 mb-8 bg-slate-50 dark:bg-slate-900/50 p-1.5 rounded-xl">
                        {(['CPF', 'MEI', 'CNPJ'] as const).map((type) => (
                            <button
                                key={type}
                                onClick={() => { setSelectedType(type); setResult(null); }}
                                className={`py-2 rounded-lg text-sm font-bold transition-all ${selectedType === type
                                    ? 'bg-white dark:bg-slate-800 text-primary shadow-sm'
                                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                                    }`}
                            >
                                {type}
                            </button>
                        ))}
                    </div>

                    {/* Input Values */}
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                {selectedType === 'CPF' ? 'Rendimento Bruto Mensal' : 'Faturamento Mensal'} (R$)
                            </label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium">R$</span>
                                <input
                                    type="number"
                                    value={value}
                                    onChange={(e) => setValue(e.target.value)}
                                    placeholder="0,00"
                                    className="w-full h-12 pl-12 pr-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent focus:ring-2 focus:ring-primary/20 focus:border-primary dark:text-white font-medium text-lg"
                                />
                            </div>
                        </div>

                        <button
                            onClick={handleCalculate}
                            className="w-full h-12 bg-primary text-slate-900 font-bold rounded-xl shadow-lg shadow-primary/20 hover:bg-primary-dark transition-all active:scale-[0.98]"
                        >
                            Calcular Imposto
                        </button>
                    </div>

                    {/* Result Area */}
                    {result && (
                        <div className="mt-8 pt-8 border-t border-dashed border-slate-200 dark:border-slate-800 space-y-4">
                            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4">Detalhamento do Cálculo</h3>

                            <div className="flex justify-between items-center py-2 border-b border-gray-50 dark:border-gray-800/50">
                                <span className="text-slate-500 text-sm">Imposto Nominal (Regra Atual)</span>
                                <span className="font-medium text-slate-900 dark:text-white">
                                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(result.nominal)}
                                </span>
                            </div>

                            {result.reduction > 0 && (
                                <div className="flex justify-between items-center py-2 border-b border-gray-50 dark:border-gray-800/50 text-green-600 dark:text-green-400">
                                    <span className="text-sm flex items-center gap-1">
                                        <span className="material-symbols-outlined text-sm">trending_down</span>
                                        Redução (Proposta 2026)
                                    </span>
                                    <span className="font-bold">
                                        - {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(result.reduction)}
                                    </span>
                                </div>
                            )}

                            <div className="flex justify-between items-end pt-2">
                                <span className="text-slate-500 text-sm font-bold">Imposto Efetivo</span>
                                <div className="text-right">
                                    <span className="block text-3xl font-black text-primary">
                                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(result.effective)}
                                    </span>
                                    <span className="text-sm font-medium text-slate-400">
                                        ({((result.effective / parseFloat(value)) * 100).toFixed(2)}%)
                                    </span>
                                </div>
                            </div>

                            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl mt-4">
                                <p className="text-xs text-blue-600 dark:text-blue-300 leading-relaxed">
                                    {selectedType === 'CPF'
                                        ? 'Cálculo baseado na proposta de isenção de IRPF para rendimentos até R$ 5.000,00, com faixas de transição conforme simulador referenciado.'
                                        : selectedType === 'MEI'
                                            ? 'Valor fixo estimado do DAS-MEI (Comércio/Serviços). Valores podem variar conforme a categoria.'
                                            : 'Estimativa baseada na alíquota inicial do Anexo III do Simples Nacional (6%). Consulte seu contador.'}
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DrexPage;
