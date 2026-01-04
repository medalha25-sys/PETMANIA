import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabase';
import { Pix } from '../utils/pix';

// Helper to get local image based on name
const getProductImage = (name: string) => {
    const n = name.toLowerCase();
    if (n.includes('ração') || n.includes('racao')) return '/products/racao.png';
    if (n.includes('shampoo')) return '/products/shampoo.png';
    if (n.includes('brinquedo')) return '/products/brinquedo.png';
    return null;
};

interface Product {
    id: string;
    name: string;
    price: number;
    stock: number;
    category: string;
}

interface Service {
    id: string;
    name: string;
    price: number;
    category: string;
    active: boolean;
}

interface SearchResult {
    id: string;
    name: string;
    type: 'product' | 'service';
    price: number;
    category: string;
    stock?: number;
}

interface CartItem {
    id: string;
    name: string;
    type: 'product' | 'service';
    price: number;
    quantity: number;
}

interface CheckoutModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialService?: {
        name: string;
        price: number;
        clientName: string;
        clientId: string;
        petName?: string;
        appointmentId?: string;
    } | null;
    onSuccess?: () => void;
}

const PAYMENT_METHODS = [
    { id: 'money', label: 'Dinheiro', icon: 'payments' },
    { id: 'pix', label: 'Pix', icon: 'pix' },
    { id: 'credit', label: 'Crédito', icon: 'credit_card' },
    { id: 'debit', label: 'Débito', icon: 'credit_card' },
];

const CheckoutModal: React.FC<CheckoutModalProps> = ({ isOpen, onClose, initialService, onSuccess }) => {
    const [cart, setCart] = useState<CartItem[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [services, setServices] = useState<Service[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('money');
    const [amountReceived, setAmountReceived] = useState('');
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState<'cart' | 'payment'>('cart');

    // PIX State
    const [pixKey, setPixKey] = useState('');
    const [pixPayload, setPixPayload] = useState('');

    // Split Payment State
    const [secondaryPaymentMethod, setSecondaryPaymentMethod] = useState<string | null>(null);

    const total = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);

    // Derived values (Payment Logic)
    const amountReceivedNum = amountReceived ? parseFloat(amountReceived.replace(',', '.')) : 0;
    const remainingAmount = Math.max(0, total - amountReceivedNum);
    const needsSecondaryPayment = paymentMethod === 'money' && remainingAmount > 0.01;
    const change = amountReceivedNum > total ? amountReceivedNum - total : 0;

    // Reset secondary when main method changes
    useEffect(() => {
        setSecondaryPaymentMethod(null);
    }, [paymentMethod]);

    // Cleanup secondary if amount covers total
    useEffect(() => {
        if (!needsSecondaryPayment) {
            setSecondaryPaymentMethod(null);
        }
    }, [amountReceived, total]);

    // Auto-generate PIX payload
    useEffect(() => {
        if (paymentMethod === 'pix' && pixKey && total > 0) {
            try {
                const amountStr = total.toFixed(2);
                const pix = new Pix(pixKey, 'Pet Manager', 'Cidade', amountStr, 'PETSHOP01');
                setPixPayload(pix.getPayload());
            } catch (e) {
                console.error("Error generating PIX:", e);
                setPixPayload('');
            }
        } else {
            setPixPayload('');
        }
    }, [pixKey, total, paymentMethod]);

    // Search Modal State
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [searchCategory, setSearchCategory] = useState<'all' | 'product' | 'service'>('all');

    const paymentOptionsRef = useRef<(HTMLButtonElement | null)[]>([]);

    useEffect(() => {
        if (isOpen) {
            setStep('cart');
            setCart([]);
            setPaymentMethod('money');
            setAmountReceived('');
            fetchData();

            if (initialService) {
                setCart([{
                    id: 'service-' + Date.now(),
                    name: `${initialService.name} - ${initialService.clientName} (${initialService.petName || 'Pet'})`,
                    type: 'service',
                    price: initialService.price || 0,
                    quantity: 1
                }]);
            }
        }
    }, [isOpen, initialService]);

    const fetchData = async () => {
        const { data: prodData } = await supabase.from('products').select('*').gt('stock', 0);
        if (prodData) setProducts(prodData);

        const { data: servData } = await supabase.from('services').select('*').eq('active', true);
        if (servData) setServices(servData);
    };

    // --- Search Logic ---
    useEffect(() => {
        if (!isOpen) return;

        const lowerTerm = searchTerm.toLowerCase();
        let results: SearchResult[] = [];

        if (searchCategory === 'all' || searchCategory === 'product') {
            const productResults = products
                .filter(p => p.name.toLowerCase().includes(lowerTerm) || p.category.toLowerCase().includes(lowerTerm))
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

        if (searchCategory === 'all' || searchCategory === 'service') {
            const serviceResults = services
                .filter(s => s.name.toLowerCase().includes(lowerTerm) || s.category.toLowerCase().includes(lowerTerm))
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

    // Keyboard controls for Search Modal
    useEffect(() => {
        if (!isSearchOpen) return;

        const handleSearchKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setSelectedIndex(prev => (prev + 1) % searchResults.length);
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setSelectedIndex(prev => (prev - 1 + searchResults.length) % searchResults.length);
            } else if (e.key === 'Enter') {
                e.preventDefault();
                if (searchResults[selectedIndex]) {
                    addItemToCart(searchResults[selectedIndex]);
                    setIsSearchOpen(false);
                    setSearchTerm('');
                }
            } else if (e.key === 'Escape') {
                setIsSearchOpen(false);
            }
        };

        window.addEventListener('keydown', handleSearchKeyDown);
        return () => window.removeEventListener('keydown', handleSearchKeyDown);
    }, [isSearchOpen, searchResults, selectedIndex]);


    const addItemToCart = (item: SearchResult) => {
        setCart(prev => {
            const existing = prev.find(i => i.id === item.id);
            if (existing && item.type === 'product') {
                return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
            }
            return [...prev, {
                id: item.type === 'product' ? item.id : item.id + '-' + Date.now(),
                name: item.name,
                type: item.type,
                price: item.price,
                quantity: 1
            }];
        });
    }

    const removeFromCart = (itemId: string) => {
        setCart(prev => prev.filter(item => item.id !== itemId));
    };

    const updateQuantity = (itemId: string, delta: number) => {
        setCart(prev => prev.map(item => {
            if (item.id === itemId) {
                const newQty = Math.max(1, item.quantity + delta);
                return { ...item, quantity: newQty };
            }
            return item;
        }));
    };

    // Keyboard Navigation for Payment
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!isOpen || step !== 'payment') return;

            if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
                e.preventDefault();
                const currentIndex = PAYMENT_METHODS.findIndex(p => p.id === paymentMethod);
                const nextIndex = (currentIndex + 1) % PAYMENT_METHODS.length;
                setPaymentMethod(PAYMENT_METHODS[nextIndex].id);
            } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
                e.preventDefault();
                const currentIndex = PAYMENT_METHODS.findIndex(p => p.id === paymentMethod);
                const prevIndex = (currentIndex - 1 + PAYMENT_METHODS.length) % PAYMENT_METHODS.length;
                setPaymentMethod(PAYMENT_METHODS[prevIndex].id);
            } else if (e.key === 'Enter' && e.ctrlKey) {
                handleFinish();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, step, paymentMethod]);


    const handleFinish = async () => {
        if (cart.length === 0) return;
        setLoading(true);

        try {
            let finalMethod = paymentMethod;
            if (needsSecondaryPayment && secondaryPaymentMethod) {
                finalMethod = `${paymentMethod}+${secondaryPaymentMethod}`;
            }

            const { data: transaction, error: transError } = await supabase
                .from('transactions')
                .insert([{
                    client_id: initialService?.clientId || null,
                    total_amount: total,
                    payment_method: finalMethod,
                    change_amount: change,
                    status: 'completed'
                }])
                .select()
                .single();

            if (transError) throw transError;

            const itemsToInsert = cart.map(item => ({
                transaction_id: transaction.id,
                item_id: item.type === 'product' ? item.id : null,
                description: item.name,
                item_type: item.type,
                price: item.price,
                quantity: item.quantity
            }));

            const { error: itemsError } = await supabase.from('transaction_items').insert(itemsToInsert);
            if (itemsError) throw itemsError;

            for (const item of cart) {
                if (item.type === 'product') {
                    await supabase.rpc('decrement_stock', { p_id: item.id, qty: item.quantity });
                }
            }

            if (initialService?.appointmentId) {
                await supabase
                    .from('appointments')
                    .update({ status: 'completed' })
                    .eq('id', initialService.appointmentId);
            }

            alert('Venda finalizada com sucesso! ✅');
            if (onSuccess) onSuccess();
            onClose();

        } catch (error: any) {
            console.error('Erro na venda:', error);
            alert(`Erro ao finalizar venda: ${error.message || 'Erro desconhecido'}`);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-surface-dark w-full max-w-4xl h-[600px] rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row animate-in zoom-in-95 duration-200 relative">

                {/* --- Search Overlay Modal (Absolute) --- */}
                {isSearchOpen && (
                    <div className="absolute inset-0 z-50 bg-white dark:bg-surface-dark flex flex-col animate-in fade-in slide-in-from-bottom-5">
                        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex gap-4 items-center">
                            <span className="material-symbols-outlined text-primary">search</span>
                            <input
                                className="flex-1 text-2xl font-bold bg-transparent outline-none text-slate-900 dark:text-white placeholder:text-slate-300"
                                placeholder="O que você está procurando?"
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                autoFocus
                            />
                            <button onClick={() => setIsSearchOpen(false)} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>

                        <div className="flex gap-2 p-2 px-4 shadow-sm border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-[#15281e]">
                            <button onClick={() => setSearchCategory('all')} className={`px-4 py-1.5 rounded-full text-sm font-bold transition-colors ${searchCategory === 'all' ? 'bg-primary text-slate-900' : 'text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700'}`}>Todos</button>
                            <button onClick={() => setSearchCategory('product')} className={`px-4 py-1.5 rounded-full text-sm font-bold transition-colors ${searchCategory === 'product' ? 'bg-primary text-slate-900' : 'text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700'}`}>Produtos</button>
                            <button onClick={() => setSearchCategory('service')} className={`px-4 py-1.5 rounded-full text-sm font-bold transition-colors ${searchCategory === 'service' ? 'bg-primary text-slate-900' : 'text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700'}`}>Serviços</button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-2">
                            {searchResults.length === 0 ? (
                                <div className="text-center py-20 text-slate-400">
                                    <span className="material-symbols-outlined text-5xl mb-4">manage_search</span>
                                    <p className="text-lg">Comece a digitar para buscar...</p>
                                </div>
                            ) : (
                                searchResults.map((result, idx) => {
                                    const img = result.type === 'product' ? getProductImage(result.name) : null;
                                    return (
                                        <div
                                            key={result.id}
                                            onClick={() => {
                                                addItemToCart(result);
                                                setIsSearchOpen(false);
                                                setSearchTerm('');
                                            }}
                                            className={`flex items-center justify-between p-4 rounded-xl cursor-pointer border transition-all ${idx === selectedIndex ? 'border-primary ring-1 ring-primary bg-primary/5' : 'border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className={`size-16 rounded-lg flex items-center justify-center overflow-hidden shrink-0 ${!img && (result.type === 'product' ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600')}`}>
                                                    {img ? (
                                                        <img src={img} alt={result.name} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <span className="material-symbols-outlined text-2xl">{result.type === 'product' ? 'inventory_2' : 'spa'}</span>
                                                    )}
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-slate-900 dark:text-white text-lg">{result.name}</h4>
                                                    <div className="flex gap-2 text-sm text-slate-500">
                                                        <span className="capitalize">{result.type === 'product' ? 'Produto' : 'Serviço'}</span>
                                                        <span>•</span>
                                                        <span>{result.category}</span>
                                                        {result.stock !== undefined && (
                                                            <>
                                                                <span>•</span>
                                                                <span className={result.stock > 0 ? 'text-green-600' : 'text-red-500'}>{result.stock} un.</span>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <span className="block text-xl font-bold text-primary">R$ {result.price.toFixed(2)}</span>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                        <div className="p-2 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs text-center text-slate-400">
                            Use as <span className="font-bold border border-slate-300 rounded px-1">Setas</span> para navegar e <span className="font-bold border border-slate-300 rounded px-1">Enter</span> para selecionar
                        </div>
                    </div>
                )}


                {/* --- Left Panel: Cart & Selection --- */}
                <div className="flex-1 flex flex-col border-r border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#15281e]">
                    <div className="p-6 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-surface-dark flex justify-between items-center">
                        <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary">point_of_sale</span>
                            Caixa / PDV
                        </h2>
                        <button onClick={onClose} className="text-slate-400 hover:text-red-500 transition-colors">
                            <span className="material-symbols-outlined">close</span>
                        </button>
                    </div>

                    <div className="p-4 flex-1 flex flex-col overflow-hidden">
                        {step === 'cart' ? (
                            <>
                                {/* Search Bar (Trigger) */}
                                <div className="relative mb-4 shrink-0">
                                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">search</span>
                                    <input
                                        type="text"
                                        placeholder="Buscar produto ou serviço (Clique 2x)..."
                                        className="w-full h-12 pl-10 pr-4 rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-primary/50 outline-none transition-all hover:border-primary/50 cursor-pointer"
                                        value={searchTerm}
                                        onChange={e => setSearchTerm(e.target.value)}
                                        onDoubleClick={() => setIsSearchOpen(true)}
                                        autoFocus
                                    />
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 border border-slate-200 dark:border-slate-700 rounded px-1.5 py-0.5 pointer-events-none">
                                        Clique 2x
                                    </div>
                                </div>

                                {/* Cart Items */}
                                <div className="flex-1 overflow-y-auto space-y-2 pr-2">
                                    {cart.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center h-full text-slate-400">
                                            <span className="material-symbols-outlined text-4xl mb-2 opacity-50">shopping_cart_off</span>
                                            <p>Carrinho vazio</p>
                                        </div>
                                    ) : (
                                        cart.map(item => {
                                            const img = item.type === 'product' ? getProductImage(item.name) : null;
                                            return (
                                                <div key={item.id} className="bg-white dark:bg-surface-dark p-3 rounded-xl border border-slate-200 dark:border-slate-800 flex justify-between items-center shadow-sm">
                                                    <div className="flex-1 flex items-center gap-3">
                                                        {img ? (
                                                            <img src={img} alt={item.name} className="size-10 rounded-lg object-cover border border-slate-100" />
                                                        ) : (
                                                            <div className={`size-10 rounded-lg flex items-center justify-center shrink-0 ${item.type === 'product' ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'}`}>
                                                                <span className="material-symbols-outlined text-xl">{item.type === 'product' ? 'inventory_2' : 'spa'}</span>
                                                            </div>
                                                        )}
                                                        <div>
                                                            <div className="flex items-center gap-2">
                                                                {item.type === 'service' && <span className="text-[10px] font-bold bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">SERV</span>}
                                                                <div className="font-bold text-slate-900 dark:text-white line-clamp-1">{item.name}</div>
                                                            </div>
                                                            <div className="text-xs text-slate-500">Unit: R$ {item.price.toFixed(2)}</div>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex items-center bg-slate-100 dark:bg-slate-900 rounded-lg h-8">
                                                            <button onClick={() => updateQuantity(item.id, -1)} className="px-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-l-lg transition-colors text-slate-600">-</button>
                                                            <span className="font-mono text-sm font-bold w-8 text-center">{item.quantity}</span>
                                                            <button onClick={() => updateQuantity(item.id, 1)} className="px-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-r-lg transition-colors text-slate-600">+</button>
                                                        </div>
                                                        <div className="font-bold text-slate-900 dark:text-white w-20 text-right">
                                                            R$ {(item.price * item.quantity).toFixed(2)}
                                                        </div>
                                                        <button onClick={() => removeFromCart(item.id)} className="text-slate-400 hover:text-red-500">
                                                            <span className="material-symbols-outlined text-lg">delete</span>
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            </>
                        ) : (
                            // Payment Summary View
                            <div className="flex flex-col h-full bg-white dark:bg-surface-dark rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-800">
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Resumo da Compra</h3>
                                <div className="space-y-2 mb-6 flex-1 overflow-y-auto">
                                    {cart.map(item => (
                                        <div key={item.id} className="flex justify-between text-sm border-b border-dashed border-slate-100 dark:border-slate-800 pb-2">
                                            <span className="text-slate-600 dark:text-slate-300">{item.quantity}x {item.name}</span>
                                            <span className="font-medium text-slate-900 dark:text-white">R$ {(item.price * item.quantity).toFixed(2)}</span>
                                        </div>
                                    ))}
                                </div>
                                <div className="flex justify-between items-end border-t border-slate-200 dark:border-slate-700 pt-4">
                                    <span className="text-slate-500">Total a Pagar</span>
                                    <span className="text-3xl font-black text-slate-900 dark:text-white">R$ {total.toFixed(2)}</span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Panel: Totals & Action */}
                <div className="w-full md:w-96 bg-white dark:bg-surface-dark flex flex-col p-6 shadow-xl z-10 relative h-[600px] md:h-auto overflow-hidden">
                    <div className="flex-1 flex flex-col gap-6 min-h-0 overflow-hidden">
                        {step === 'cart' ? (
                            <div className="mt-auto space-y-4">
                                <div className="bg-slate-50 dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-slate-500 font-medium">Subtotal</span>
                                        <span className="font-bold text-slate-700 dark:text-slate-300">R$ {total.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between items-end">
                                        <span className="text-lg font-bold text-slate-900 dark:text-white">Total</span>
                                        <span className="text-4xl font-black text-primary">R$ {total.toFixed(2)}</span>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setStep('payment')}
                                    disabled={cart.length === 0}
                                    className="w-full h-14 bg-primary text-slate-900 rounded-xl font-bold text-lg shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-2"
                                >
                                    Ir para Pagamento
                                    <span className="material-symbols-outlined">arrow_forward</span>
                                </button>
                            </div>
                        ) : (
                            // Payment Step
                            <div className="flex flex-col h-full overflow-hidden min-h-0">
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 shrink-0">Forma de Pagamento</h3>

                                <div className="flex-1 overflow-y-auto overflow-x-hidden pr-2 -mr-2 mb-4 min-h-0">
                                    <div className="grid grid-cols-2 gap-3 mb-6">
                                        {PAYMENT_METHODS.map((method, idx) => (
                                            <button
                                                key={method.id}
                                                ref={el => paymentOptionsRef.current[idx] = el}
                                                onClick={() => setPaymentMethod(method.id)}
                                                className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${paymentMethod === method.id
                                                    ? 'bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-900'
                                                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 hover:border-slate-300 dark:hover:border-slate-600'}`}
                                            >
                                                <span className="material-symbols-outlined text-2xl">{method.icon}</span>
                                                <span className="font-bold text-sm">{method.label}</span>
                                            </button>
                                        ))}
                                    </div>

                                    {paymentMethod === 'money' && (
                                        <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-xl border border-green-100 dark:border-green-800 mb-2 animate-in fade-in slide-in-from-top-2">
                                            <label className="block text-xs font-bold text-green-700 dark:text-green-400 mb-1 uppercase">Valor Recebido (Dinheiro)</label>
                                            <div className="relative mb-3">
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-green-600 font-bold">R$</span>
                                                <input
                                                    type="number"
                                                    value={amountReceived}
                                                    onChange={(e) => setAmountReceived(e.target.value)}
                                                    className="w-full h-12 pl-10 pr-4 rounded-lg bg-white dark:bg-slate-900 border-green-200 focus:ring-2 focus:ring-green-500 outline-none font-mono text-xl font-bold"
                                                    placeholder="0.00"
                                                    autoFocus
                                                />
                                            </div>

                                            {/* Change Display */}
                                            {change > 0 && (
                                                <div className="flex justify-between items-center text-green-800 dark:text-green-300">
                                                    <span className="font-bold">Troco:</span>
                                                    <span className="text-xl font-black">R$ {change.toFixed(2)}</span>
                                                </div>
                                            )}

                                            {/* Split Payment Options */}
                                            {needsSecondaryPayment && (
                                                <div className="mt-4 pt-4 border-t border-green-200 dark:border-green-800 animate-in slide-in-from-top-2">
                                                    <div className="flex justify-between items-center mb-3">
                                                        <span className="text-sm font-bold text-slate-600 dark:text-slate-300">Falta pagar:</span>
                                                        <span className="text-lg font-black text-red-500">R$ {remainingAmount.toFixed(2)}</span>
                                                    </div>
                                                    <p className="text-xs text-slate-500 mb-2">Selecione como pagar o restante:</p>
                                                    <div className="grid grid-cols-3 gap-2">
                                                        {PAYMENT_METHODS.filter(m => m.id !== 'money').map(method => (
                                                            <button
                                                                key={method.id}
                                                                onClick={() => setSecondaryPaymentMethod(method.id)}
                                                                className={`p-2 rounded-lg border text-xs font-bold flex flex-col items-center gap-1 transition-all ${secondaryPaymentMethod === method.id
                                                                    ? 'bg-slate-800 text-white border-slate-800'
                                                                    : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                                                                    }`}
                                                            >
                                                                <span className="material-symbols-outlined text-lg">{method.icon}</span>
                                                                {method.label}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {paymentMethod === 'pix' && (
                                        <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 mb-2 animate-in fade-in slide-in-from-top-2 flex flex-col items-center text-center">
                                            <div className="w-full mb-4">
                                                <label className="block text-xs font-bold text-slate-500 mb-1 text-left">Chave Pix (CPF, Email, Tel...) para Gerar QR:</label>
                                                <input
                                                    type="text"
                                                    className="w-full h-10 px-3 rounded-lg border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-primary/50 outline-none"
                                                    placeholder="Digite sua chave pix..."
                                                    value={pixKey}
                                                    onChange={e => setPixKey(e.target.value)}
                                                    autoFocus
                                                />
                                            </div>

                                            {pixPayload ? (
                                                <>
                                                    <div className="bg-white p-2 rounded-lg shadow-sm border border-slate-100 mb-3">
                                                        <img
                                                            src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(pixPayload)}`}
                                                            alt="QR Code Pix"
                                                            className="size-40"
                                                        />
                                                    </div>
                                                    <p className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">R$ {total.toFixed(2)}</p>
                                                    <p className="text-xs text-slate-500 mb-3">Escaneie ou copie o código abaixo</p>

                                                    <div className="flex items-center gap-2 w-full">
                                                        <input
                                                            readOnly
                                                            value={pixPayload}
                                                            className="flex-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-slate-500 truncate outline-none select-all"
                                                        />
                                                        <button
                                                            onClick={() => navigator.clipboard.writeText(pixPayload)}
                                                            className="p-2 bg-slate-200 dark:bg-slate-800 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors text-slate-600 dark:text-slate-300 shrink-0"
                                                            title="Copiar Código"
                                                        >
                                                            <span className="material-symbols-outlined text-sm">content_copy</span>
                                                        </button>
                                                    </div>
                                                </>
                                            ) : (
                                                <div className="py-8 text-slate-400">
                                                    <span className="material-symbols-outlined text-4xl mb-2 opacity-50">qr_code_2</span>
                                                    <p className="text-sm">Digite uma chave para gerar o QR Code</p>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                <div className="mt-auto space-y-3 shrink-0 pt-2 border-t border-slate-100 dark:border-slate-800">
                                    <div className="flex justify-between items-center text-sm text-slate-500">
                                        <span>Total a pagar</span>
                                        <span className="font-bold text-slate-900 dark:text-white">R$ {total.toFixed(2)}</span>
                                    </div>
                                    <button
                                        onClick={handleFinish}
                                        disabled={loading || (paymentMethod === 'money' && needsSecondaryPayment && !secondaryPaymentMethod) || (paymentMethod === 'money' && !needsSecondaryPayment && change < 0)}
                                        className="w-full h-14 bg-green-500 hover:bg-green-600 text-white rounded-xl font-bold text-lg shadow-lg shadow-green-500/30 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                                    >
                                        {loading ? <span className="material-symbols-outlined animate-spin">refresh</span> : <span className="material-symbols-outlined">check_circle</span>}
                                        Finalizar Venda (Ctrl+Enter)
                                    </button>
                                    <button
                                        onClick={() => setStep('cart')}
                                        className="w-full py-2 text-slate-500 font-bold hover:text-slate-700 text-sm"
                                    >
                                        Voltar
                                    </button>
                                </div>
                            </div>

                        )}
                    </div>
                </div>

            </div>
        </div>
    );
};

export default CheckoutModal;
