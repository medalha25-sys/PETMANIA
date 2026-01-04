import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';

interface Product {
    id: string;
    name: string;
    category: string;
    price: number;
    stock: number;
    image_url?: string;
    barcode?: string;
    expiration_date?: string;
}

const CATEGORIES = ['Alimentação', 'Higiene', 'Brinquedos', 'Acessórios', 'Medicamentos'];

const ProductsPage: React.FC = () => {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [saving, setSaving] = useState(false);

    // Form State
    const [barcode, setBarcode] = useState('');
    const [name, setName] = useState('');
    const [category, setCategory] = useState(CATEGORIES[0]);
    const [price, setPrice] = useState('');
    const [stock, setStock] = useState('');
    const [expirationDate, setExpirationDate] = useState('');

    // Fetch Products
    const fetchProducts = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('products')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setProducts(data || []);
        } catch (error) {
            console.error('Error fetching products:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProducts();
    }, []);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            // Smart default image based on category if needed
            let imagePath = null;
            if (category === 'Alimentação') imagePath = '/products/food.png';
            else if (category === 'Higiene') imagePath = '/products/shampoo.png';
            else if (category === 'Brinquedos') imagePath = '/products/toy.png';
            else if (category === 'Acessórios') imagePath = '/products/bed.png';

            const newProduct = {
                name,
                category,
                price: parseFloat(price.replace(',', '.')), // Handle Brazilian currency format
                stock: parseInt(stock),
                image_url: imagePath,
                barcode: barcode || null,
                expiration_date: expirationDate || null
            };

            const { error } = await supabase
                .from('products')
                .insert([newProduct]);

            if (error) throw error;

            setShowModal(false);
            resetForm();
            fetchProducts();
            alert('Produto cadastrado com sucesso!');
        } catch (error) {
            console.error('Error saving product:', error);
            alert('Erro ao salvar produto.');
        } finally {
            setSaving(false);
        }
    };

    const resetForm = () => {
        setBarcode('');
        setName('');
        setCategory(CATEGORIES[0]);
        setPrice('');
        setStock('');
        setExpirationDate('');
    };

    // Filter State
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('Todos');

    // Auto-focus barcode input when modal opens
    const barcodeInputRef = React.useRef<HTMLInputElement>(null);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    useEffect(() => {
        if (showModal && barcodeInputRef.current) {
            setTimeout(() => barcodeInputRef.current?.focus(), 100);
        }
    }, [showModal]);

    const filteredProducts = products.filter(product => {
        const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = selectedCategory === 'Todos' || product.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    const lowStockProducts = products.filter(p => p.stock <= 5);

    const getProductStatus = (product: Product) => {
        const statuses = [];

        // Stock Check
        if (product.stock <= 5) {
            statuses.push({ label: 'Estoque Crítico', color: 'text-red-600 bg-red-50 border-red-100', icon: 'warning' });
        } else if (product.stock <= 10) {
            statuses.push({ label: 'Estoque Baixo', color: 'text-yellow-600 bg-yellow-50 border-yellow-100', icon: 'inventory_2' });
        }

        // Expiration Check
        if (product.expiration_date) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const expDate = new Date(product.expiration_date);
            expDate.setHours(0, 0, 0, 0);
            const diffTime = expDate.getTime() - today.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            if (diffDays <= 5) {
                statuses.push({ label: diffDays < 0 ? 'Vencido' : 'Vence logo', color: 'text-red-600 bg-red-50 border-red-100', icon: 'event_busy' });
            } else if (diffDays <= 10) {
                statuses.push({ label: 'Vence em 10d', color: 'text-orange-600 bg-orange-50 border-orange-100', icon: 'history' });
            } else if (diffDays <= 15) {
                statuses.push({ label: 'Vence em 15d', color: 'text-yellow-600 bg-yellow-50 border-yellow-100', icon: 'update' });
            }
        }

        return statuses;
    };

    return (
        <div className="p-4 md:p-8 space-y-8 max-w-[1400px] mx-auto w-full pb-24">
            <header className="flex flex-col gap-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight">Produtos</h1>
                        <p className="text-slate-500 text-lg">Gerencie o estoque e catálogo de vendas.</p>
                    </div>
                    <button
                        onClick={() => setShowModal(true)}
                        className="bg-primary text-slate-900 px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-primary-dark transition-colors shadow-lg shadow-primary/20 whitespace-nowrap"
                    >
                        <span className="material-symbols-outlined">add</span>
                        Novo Produto
                    </button>
                </div>

                {lowStockProducts.length > 0 && (
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-xl p-4 flex items-center justify-between animate-in fade-in slide-in-from-top-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/40 flex items-center justify-center text-red-600 dark:text-red-400 shrink-0">
                                <span className="material-symbols-outlined">warning</span>
                            </div>
                            <div>
                                <h3 className="font-bold text-red-700 dark:text-red-400">Alerta de Estoque Baixo</h3>
                                <p className="text-sm text-red-600 dark:text-red-300">
                                    Há {lowStockProducts.length} produto(s) com estoque crítico (5 unidades ou menos).
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Search, Filter and View Toggle */}
                <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white dark:bg-surface-dark p-2 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
                    {/* Search Bar */}
                    <div className="relative w-full md:w-96">
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">search</span>
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Buscar produtos..."
                            className="w-full h-12 pl-10 pr-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border-none outline-none focus:ring-2 focus:ring-primary/50 transition-all text-slate-900 dark:text-white"
                        />
                    </div>

                    <div className="flex items-center gap-4 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
                        {/* Category Tags */}
                        <div className="flex gap-2">
                            <button
                                onClick={() => setSelectedCategory('Todos')}
                                className={`px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-colors ${selectedCategory === 'Todos' ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
                            >
                                Todos
                            </button>
                            {CATEGORIES.map(cat => (
                                <button
                                    key={cat}
                                    onClick={() => setSelectedCategory(cat)}
                                    className={`px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-colors ${selectedCategory === cat ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>

                        {/* View Toggle */}
                        <div className="h-8 w-[1px] bg-slate-200 dark:bg-slate-700 mx-2 hidden md:block"></div>
                        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
                            <button
                                onClick={() => setViewMode('grid')}
                                className={`p-2 rounded-md transition-all ${viewMode === 'grid' ? 'bg-white dark:bg-slate-600 shadow-sm text-primary' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}
                                title="Visualização em Grade"
                            >
                                <span className="material-symbols-outlined text-xl">grid_view</span>
                            </button>
                            <button
                                onClick={() => setViewMode('list')}
                                className={`p-2 rounded-md transition-all ${viewMode === 'list' ? 'bg-white dark:bg-slate-600 shadow-sm text-primary' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}
                                title="Visualização em Lista"
                            >
                                <span className="material-symbols-outlined text-xl">view_list</span>
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {loading ? (
                <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
            ) : filteredProducts.length === 0 ? (
                <div className="col-span-full py-12 text-center text-slate-400">
                    <span className="material-symbols-outlined text-4xl mb-2">search_off</span>
                    <p>Nenhum produto encontrado para o filtro selecionado.</p>
                </div>
            ) : viewMode === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {filteredProducts.map((product) => {
                        const statuses = getProductStatus(product);
                        return (
                            <div key={product.id} className="bg-white dark:bg-surface-dark rounded-2xl border border-slate-100 dark:border-slate-800 p-4 shadow-sm hover:shadow-md transition-all group relative">
                                <div className="aspect-square rounded-xl bg-slate-100 dark:bg-slate-800 mb-4 overflow-hidden relative">
                                    {product.image_url ? (
                                        <img src={product.image_url} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                    ) : (
                                        <div className="flex items-center justify-center w-full h-full text-slate-300">
                                            <span className="material-symbols-outlined text-4xl">inventory_2</span>
                                        </div>
                                    )}
                                    <div className={`absolute top-2 right-2 backdrop-blur text-xs font-bold px-2 py-1 rounded-lg shadow-sm ${product.stock <= 10 ? 'bg-red-500 text-white' : 'bg-white/90 dark:bg-black/80'}`}>
                                        {product.stock} un.
                                    </div>
                                </div>
                                <div>
                                    <div className="flex flex-wrap gap-1 mb-2">
                                        <span className="text-xs font-bold text-primary block uppercase tracking-wider">{product.category}</span>
                                        {statuses.map((status, idx) => (
                                            <span key={idx} className={`text-[10px] font-bold px-1.5 py-0.5 rounded border flex items-center gap-1 ${status.color}`}>
                                                {status.label}
                                            </span>
                                        ))}
                                    </div>
                                    <h3 className="font-bold text-slate-900 dark:text-white text-lg leading-tight mb-2 truncate" title={product.name}>{product.name}</h3>
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-xl font-black text-slate-900 dark:text-white">
                                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(product.price)}
                                        </span>
                                        <button className="p-2 text-slate-400 hover:text-primary transition-colors">
                                            <span className="material-symbols-outlined">edit</span>
                                        </button>
                                    </div>
                                    {product.expiration_date && (
                                        <div className="flex items-center gap-1 text-xs text-slate-500">
                                            <span className="material-symbols-outlined text-sm">event</span>
                                            Vence em: {new Date(product.expiration_date).toLocaleDateString('pt-BR')}
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="bg-white dark:bg-surface-dark rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-gray-100 dark:border-gray-800 text-xs uppercase tracking-wider text-slate-500 bg-gray-50/50 dark:bg-gray-800/20">
                                    <th className="p-4 font-bold">Produto</th>
                                    <th className="p-4 font-bold">Categoria</th>
                                    <th className="p-4 font-bold">Estoque</th>
                                    <th className="p-4 font-bold">Validade</th>
                                    <th className="p-4 font-bold">Preço</th>
                                    <th className="p-4 font-bold text-right">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                                {filteredProducts.map((product) => {
                                    const statuses = getProductStatus(product);
                                    return (
                                        <tr key={product.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                                            <td className="p-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-12 h-12 rounded-lg bg-slate-100 dark:bg-slate-800 overflow-hidden flex-shrink-0">
                                                        {product.image_url ? (
                                                            <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                                                        ) : (
                                                            <div className="flex items-center justify-center w-full h-full text-slate-300">
                                                                <span className="material-symbols-outlined text-lg">inventory_2</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                                            {product.name}
                                                            {statuses.map((status, idx) => (
                                                                <span key={idx} className={`w-2 h-2 rounded-full ${status.color.split(' ')[1]}`} title={status.label}></span>
                                                            ))}
                                                        </div>
                                                        {product.barcode && <div className="text-xs text-slate-400 font-mono">{product.barcode}</div>}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary-dark">
                                                    {product.category}
                                                </span>
                                            </td>
                                            <td className="p-4">
                                                <span className={`font-medium ${product.stock < 5 ? 'text-red-500' : 'text-slate-600 dark:text-slate-300'}`}>
                                                    {product.stock} un.
                                                </span>
                                            </td>
                                            <td className="p-4">
                                                {product.expiration_date ? (
                                                    <span className="text-sm text-slate-600 dark:text-slate-400">
                                                        {new Date(product.expiration_date).toLocaleDateString('pt-BR')}
                                                    </span>
                                                ) : (
                                                    <span className="text-xs text-slate-400">-</span>
                                                )}
                                            </td>
                                            <td className="p-4">
                                                <span className="font-bold text-slate-900 dark:text-white">
                                                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(product.price)}
                                                </span>
                                            </td>
                                            <td className="p-4 text-right">
                                                <button className="p-2 text-slate-400 hover:text-primary transition-colors">
                                                    <span className="material-symbols-outlined">edit</span>
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Add Product Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-surface-dark w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Novo Produto</h2>
                            <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-red-500 transition-colors">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>

                        <form onSubmit={handleSave} className="p-6 space-y-4">
                            {/* Barcode Field - Scanner Ready */}
                            <div className="bg-gray-50 dark:bg-gray-900/50 p-3 rounded-xl border border-dashed border-gray-300 dark:border-gray-700">
                                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wider flex items-center gap-2">
                                    <span className="material-symbols-outlined text-lg">barcode_reader</span>
                                    Código de Barras (Leitor Ativo)
                                </label>
                                <input
                                    ref={barcodeInputRef}
                                    type="text"
                                    value={barcode}
                                    onChange={(e) => setBarcode(e.target.value)}
                                    className="w-full h-10 rounded-lg border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-3 font-mono text-sm focus:ring-2 focus:ring-primary/50 outline-none transition-all"
                                    placeholder="Escaneie ou digite o código..."
                                    autoFocus
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nome do Produto</label>
                                <input
                                    required
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full h-11 rounded-xl border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 px-4 focus:ring-2 focus:ring-primary/50 outline-none transition-all"
                                    placeholder="Ex: Ração Golden 15kg"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Categoria</label>
                                    <select
                                        value={category}
                                        onChange={(e) => setCategory(e.target.value)}
                                        className="w-full h-11 rounded-xl border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 px-4 focus:ring-2 focus:ring-primary/50 outline-none transition-all appearance-none cursor-pointer"
                                    >
                                        {CATEGORIES.map(cat => (
                                            <option key={cat} value={cat}>{cat}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Estoque</label>
                                    <input
                                        required
                                        type="number"
                                        value={stock}
                                        onChange={(e) => setStock(e.target.value)}
                                        className="w-full h-11 rounded-xl border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 px-4 focus:ring-2 focus:ring-primary/50 outline-none transition-all"
                                        placeholder="0"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Preço (R$)</label>
                                    <input
                                        required
                                        type="text"
                                        value={price}
                                        onChange={(e) => setPrice(e.target.value)}
                                        className="w-full h-11 rounded-xl border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 px-4 focus:ring-2 focus:ring-primary/50 outline-none transition-all"
                                        placeholder="0,00"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Vencimento <span className="text-xs font-normal text-slate-400">(Opcional)</span></label>
                                    <input
                                        type="date"
                                        value={expirationDate}
                                        onChange={(e) => setExpirationDate(e.target.value)}
                                        className="w-full h-11 rounded-xl border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 px-4 focus:ring-2 focus:ring-primary/50 outline-none transition-all text-slate-900 dark:text-white"
                                    />
                                </div>
                            </div>

                            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl text-sm text-blue-600 dark:text-blue-400">
                                <p className="flex items-center gap-2">
                                    <span className="material-symbols-outlined text-lg">info</span>
                                    A imagem será definida automaticamente com base na categoria.
                                </p>
                            </div>

                            <div className="pt-2 flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 h-12 rounded-xl font-bold text-slate-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="flex-1 h-12 bg-primary text-slate-900 rounded-xl font-bold hover:bg-primary-dark transition-colors shadow-lg shadow-primary/20 disabled:opacity-70 flex items-center justify-center gap-2"
                                >
                                    {saving && <span className="material-symbols-outlined animate-spin text-lg">progress_activity</span>}
                                    Salvar Produto
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProductsPage;
