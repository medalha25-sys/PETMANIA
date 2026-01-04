import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabase';
import { Product, Service, SearchResult } from '../types';

interface ProductSearchModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (item: SearchResult) => void;
    initialSearchTerm?: string;
}

const ProductSearchModal: React.FC<ProductSearchModalProps> = ({ isOpen, onClose, onSelect, initialSearchTerm = '' }) => {
    const [searchTerm, setSearchTerm] = useState(initialSearchTerm);
    const [products, setProducts] = useState<Product[]>([]);
    const [services, setServices] = useState<Service[]>([]);
    const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [searchCategory, setSearchCategory] = useState<'all' | 'product' | 'service'>('all');
    const [loading, setLoading] = useState(false);

    // Focus input on open
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isOpen) {
            setSearchTerm(initialSearchTerm);
            fetchData();
        }
    }, [isOpen, initialSearchTerm]);

    // Auto focus and data fetch
    useEffect(() => {
        if (isOpen && inputRef.current) {
            setTimeout(() => inputRef.current?.focus(), 50);
        }
    }, [isOpen]);

    const fetchData = async () => {
        setLoading(true);
        // Fetch parallel
        const [prodRes, servRes] = await Promise.all([
            supabase.from('products').select('*').gt('stock', 0),
            supabase.from('services').select('*').eq('active', true)
        ]);

        if (prodRes.data) setProducts(prodRes.data);
        if (servRes.data) setServices(servRes.data);
        setLoading(false);
    };

    // Filter Logic
    useEffect(() => {
        if (!isOpen) return;

        const lowerTerm = searchTerm.toLowerCase().trim();
        let results: SearchResult[] = [];

        // Products
        if (searchCategory === 'all' || searchCategory === 'product') {
            const productResults = products
                .filter(p => !lowerTerm || p.name.toLowerCase().includes(lowerTerm) || p.category.toLowerCase().includes(lowerTerm))
                .map(p => ({
                    id: p.id,
                    name: p.name,
                    type: 'product' as const,
                    price: p.price,
                    category: p.category,
                    stock: p.stock
                }));
            results = [...results, ...productResults];
        }

        // Services
        if (searchCategory === 'all' || searchCategory === 'service') {
            const serviceResults = services
                .filter(s => !lowerTerm || s.name.toLowerCase().includes(lowerTerm) || s.category.toLowerCase().includes(lowerTerm))
                .map(s => ({
                    id: s.id,
                    name: s.name,
                    type: 'service' as const,
                    price: s.price,
                    category: s.category
                }));
            results = [...results, ...serviceResults];
        }

        setSearchResults(results);
        setSelectedIndex(0);

    }, [searchTerm, products, services, searchCategory, isOpen]);


    // Keyboard Navigation
    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setSelectedIndex(prev => (prev + 1) % searchResults.length);
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setSelectedIndex(prev => (prev - 1 + searchResults.length) % searchResults.length);
            } else if (e.key === 'Enter') {
                e.preventDefault();
                if (searchResults[selectedIndex]) {
                    onSelect(searchResults[selectedIndex]);
                    onClose();
                }
            } else if (e.key === 'Escape') {
                e.preventDefault();
                onClose();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, searchResults, selectedIndex, onSelect, onClose]);


    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-surface-dark w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200 border border-slate-200 dark:border-slate-800">
                {/* Header */}
                <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex gap-4 items-center bg-white dark:bg-surface-dark z-10 shrink-0">
                    <span className="material-symbols-outlined text-primary text-3xl">search</span>
                    <input
                        ref={inputRef}
                        className="flex-1 text-2xl font-bold bg-transparent outline-none text-slate-900 dark:text-white placeholder:text-slate-300"
                        placeholder="Buscar produto ou serviço..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 p-2 px-4 shadow-sm border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-[#15281e] shrink-0">
                    <button
                        onClick={() => setSearchCategory('all')}
                        className={`px-4 py-1.5 rounded-full text-sm font-bold transition-colors ${searchCategory === 'all' ? 'bg-primary text-slate-900 shadow-sm' : 'text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
                    >
                        Todos
                    </button>
                    <button
                        onClick={() => setSearchCategory('product')}
                        className={`px-4 py-1.5 rounded-full text-sm font-bold transition-colors ${searchCategory === 'product' ? 'bg-primary text-slate-900 shadow-sm' : 'text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
                    >
                        Produtos
                    </button>
                    <button
                        onClick={() => setSearchCategory('service')}
                        className={`px-4 py-1.5 rounded-full text-sm font-bold transition-colors ${searchCategory === 'service' ? 'bg-primary text-slate-900 shadow-sm' : 'text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
                    >
                        Serviços
                    </button>
                </div>

                {/* Results List */}
                <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-slate-50/50 dark:bg-black/20">
                    {loading ? (
                        <div className="text-center py-20 text-slate-400">
                            <span className="material-symbols-outlined animate-spin text-4xl mb-2">refresh</span>
                            <p>Carregando catálogo...</p>
                        </div>
                    ) : searchResults.length === 0 ? (
                        <div className="text-center py-20 text-slate-400">
                            <span className="material-symbols-outlined text-5xl mb-4 opacity-50">search_off</span>
                            <p className="text-lg font-medium">Nenhum resultado encontrado</p>
                            <p className="text-sm">Tente buscar por outro termo</p>
                        </div>
                    ) : (
                        searchResults.map((result, idx) => (
                            <div
                                key={`${result.type}-${result.id}`}
                                onClick={() => {
                                    onSelect(result);
                                    onClose();
                                }}
                                className={`flex items-center justify-between p-4 rounded-xl cursor-pointer border transition-all ${idx === selectedIndex
                                    ? 'border-primary ring-1 ring-primary bg-primary/5 shadow-md transform scale-[1.01]'
                                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-surface-dark hover:bg-slate-50 dark:hover:bg-slate-800'
                                    }`}
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`size-12 rounded-xl flex items-center justify-center shadow-sm shrink-0 ${result.type === 'product' ? 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400' : 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'}`}>
                                        <span className="material-symbols-outlined text-2xl">{result.type === 'product' ? 'inventory_2' : 'spa'}</span>
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-slate-900 dark:text-white text-lg leading-tight">{result.name}</h4>
                                        <div className="flex flex-wrap gap-x-2 gap-y-1 text-sm text-slate-500 mt-1">
                                            <span className="capitalize font-medium text-slate-600 dark:text-slate-400">{result.type === 'product' ? 'Produto' : 'Serviço'}</span>
                                            <span>•</span>
                                            <span>{result.category}</span>
                                            {result.stock !== undefined && (
                                                <>
                                                    <span>•</span>
                                                    <span className={`font-medium ${result.stock > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-500'}`}>
                                                        {result.stock} em estoque
                                                    </span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right shrink-0 pl-4">
                                    <span className="block text-xl font-black text-slate-900 dark:text-white">R$ {result.price.toFixed(2)}</span>
                                    <span className="text-xs text-slate-400 font-medium">Unitário</span>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Footer Hint */}
                <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-surface-dark text-xs text-center text-slate-400 flex items-center justify-center gap-4">
                    <span className="flex items-center gap-1"><kbd className="font-sans font-bold border border-slate-300 dark:border-slate-700 rounded px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">↑</kbd> <kbd className="font-sans font-bold border border-slate-300 dark:border-slate-700 rounded px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">↓</kbd> Navegar</span>
                    <span className="flex items-center gap-1"><kbd className="font-sans font-bold border border-slate-300 dark:border-slate-700 rounded px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">Enter</kbd> Selecionar</span>
                    <span className="flex items-center gap-1"><kbd className="font-sans font-bold border border-slate-300 dark:border-slate-700 rounded px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">Esc</kbd> Fechar</span>
                </div>
            </div>
        </div>
    );
};

export default ProductSearchModal;
