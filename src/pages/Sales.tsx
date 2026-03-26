import { useState, useEffect } from 'react';
import { collection, onSnapshot, addDoc, doc, updateDoc, increment, query, orderBy } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { UserProfile, Product, Sale, SaleItem } from '../types';
import { 
  Plus, 
  Minus, 
  Trash2, 
  ShoppingCart, 
  CreditCard, 
  Banknote, 
  Smartphone, 
  Search, 
  History, 
  Receipt, 
  X, 
  CheckCircle2, 
  Download 
} from 'lucide-react';
import { format } from 'date-fns';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface SalesProps {
  user: UserProfile;
}

export default function Sales({ user }: SalesProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [cart, setCart] = useState<SaleItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Card' | 'UPI'>('Cash');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [lastInvoice, setLastInvoice] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'POS' | 'History'>('POS');

  useEffect(() => {
    const productsUnsubscribe = onSnapshot(collection(db, 'products'), (snapshot) => {
      setProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product)));
    });

    const salesUnsubscribe = onSnapshot(
      query(collection(db, 'sales'), orderBy('createdAt', 'desc')),
      (snapshot) => {
        setSales(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Sale)));
      }
    );

    return () => {
      productsUnsubscribe();
      salesUnsubscribe();
    };
  }, []);

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const addToCart = (product: Product) => {
    if (product.stock <= 0) return;
    
    setCart(prev => {
      const existing = prev.find(item => item.productId === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) return prev;
        return prev.map(item => 
          item.productId === product.id 
            ? { ...item, quantity: item.quantity + 1 } 
            : item
        );
      }
      return [...prev, {
        productId: product.id,
        name: product.name,
        quantity: 1,
        price: product.sellingPrice,
        cost: product.costPrice
      }];
    });
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.productId === productId) {
        const product = products.find(p => p.id === productId);
        const newQty = item.quantity + delta;
        if (newQty <= 0) return item;
        if (product && newQty > product.stock) return item;
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.productId !== productId));
  };

  const cartTotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const cartProfit = cart.reduce((acc, item) => acc + ((item.price - item.cost) * item.quantity), 0);

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    setIsProcessing(true);

    try {
      const invoiceNumber = `INV-${Date.now().toString().slice(-6)}`;
      const saleData = {
        invoiceNumber,
        items: cart,
        total: cartTotal,
        profit: cartProfit,
        paymentMethod,
        createdAt: new Date().toISOString(),
        staffId: user.uid,
        staffName: user.displayName
      };

      // 1. Create Sale Record
      await addDoc(collection(db, 'sales'), saleData);

      // 2. Update Stock
      for (const item of cart) {
        await updateDoc(doc(db, 'products', item.productId), {
          stock: increment(-item.quantity)
        });
      }

      setLastInvoice(invoiceNumber);
      setShowSuccess(true);
      setCart([]);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'sales');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div className="flex flex-col">
          <h1 className="text-4xl font-serif italic text-neutral-900">Sales</h1>
          <p className="text-neutral-500 mt-1">Manage point of sale and order history</p>
        </div>
        <div className="flex bg-white p-1 rounded-xl border border-neutral-200 shadow-sm">
          <button
            onClick={() => setActiveTab('POS')}
            className={cn(
              "px-6 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2",
              activeTab === 'POS' ? "bg-neutral-900 text-white shadow-md" : "text-neutral-500 hover:bg-neutral-50"
            )}
          >
            <ShoppingCart size={16} /> POS System
          </button>
          <button
            onClick={() => setActiveTab('History')}
            className={cn(
              "px-6 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2",
              activeTab === 'History' ? "bg-neutral-900 text-white shadow-md" : "text-neutral-500 hover:bg-neutral-50"
            )}
          >
            <History size={16} /> Order History
          </button>
        </div>
      </div>

      {activeTab === 'POS' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Product Selection */}
          <div className="lg:col-span-2 space-y-6">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" size={20} />
              <input
                type="text"
                placeholder="Search by name or SKU..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-white border border-neutral-200 rounded-2xl text-lg focus:outline-none focus:ring-1 focus:ring-neutral-900 shadow-sm transition-all"
              />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {filteredProducts.map(product => (
                <button
                  key={product.id}
                  onClick={() => addToCart(product)}
                  disabled={product.stock <= 0}
                  className={cn(
                    "bg-white p-4 rounded-2xl border border-neutral-200 shadow-sm hover:shadow-md transition-all text-left group relative overflow-hidden",
                    product.stock <= 0 && "opacity-50 grayscale cursor-not-allowed"
                  )}
                >
                  <div className="flex flex-col h-full">
                    <span className="text-[10px] uppercase tracking-widest text-neutral-400 font-mono mb-1">{product.sku}</span>
                    <span className="text-sm font-bold text-neutral-900 mb-4 line-clamp-2">{product.name}</span>
                    <div className="mt-auto flex items-center justify-between">
                      <span className="text-lg font-serif italic text-neutral-900">₹ {product.sellingPrice.toFixed(2)}</span>
                      <span className={cn(
                        "text-[10px] font-bold px-2 py-1 rounded-md",
                        product.stock > 5 ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"
                      )}>
                        {product.stock} left
                      </span>
                    </div>
                  </div>
                  <div className="absolute inset-0 bg-neutral-900/0 group-hover:bg-neutral-900/5 transition-colors"></div>
                </button>
              ))}
            </div>
          </div>

          {/* Cart & Checkout */}
          <div className="bg-white rounded-3xl border border-neutral-200 shadow-xl flex flex-col h-[calc(100vh-250px)] sticky top-24">
            <div className="p-6 border-b border-neutral-100 flex items-center justify-between bg-neutral-50 rounded-t-3xl">
              <h2 className="text-xl font-serif italic text-neutral-900">Current Order</h2>
              <span className="px-3 py-1 bg-neutral-900 text-white text-[10px] font-mono rounded-full">
                {cart.length} ITEMS
              </span>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {cart.map(item => (
                <div key={item.productId} className="flex items-center gap-4 group">
                  <div className="flex-1">
                    <p className="text-sm font-bold text-neutral-900 line-clamp-1">{item.name}</p>
                    <p className="text-xs text-neutral-500">₹ {item.price.toFixed(2)} each</p>
                  </div>
                  <div className="flex items-center gap-2 bg-neutral-50 p-1 rounded-lg border border-neutral-100">
                    <button 
                      onClick={() => updateQuantity(item.productId, -1)}
                      className="p-1 hover:bg-white rounded transition-colors"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="text-xs font-mono font-bold w-6 text-center">{item.quantity}</span>
                    <button 
                      onClick={() => updateQuantity(item.productId, 1)}
                      className="p-1 hover:bg-white rounded transition-colors"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                  <button 
                    onClick={() => removeFromCart(item.productId)}
                    className="p-2 text-neutral-300 hover:text-red-600 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
              {cart.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-neutral-300 space-y-4">
                  <ShoppingCart size={64} className="opacity-10" />
                  <p className="text-sm italic">Cart is empty</p>
                </div>
              )}
            </div>

            <div className="p-6 bg-neutral-50 border-t border-neutral-100 space-y-6 rounded-b-3xl">
              <div className="space-y-2">
                <div className="flex justify-between text-sm text-neutral-500">
                  <span>Subtotal</span>
                  <span>₹ {cartTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xl font-serif italic text-neutral-900 pt-2 border-t border-neutral-200">
                  <span>Total</span>
                  <span>₹ {cartTotal.toFixed(2)}</span>
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-[10px] uppercase tracking-widest text-neutral-400 font-mono">Payment Method</p>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'Cash', icon: Banknote },
                    { id: 'Card', icon: CreditCard },
                    { id: 'UPI', icon: Smartphone },
                  ].map(method => (
                    <button
                      key={method.id}
                      onClick={() => setPaymentMethod(method.id as any)}
                      className={cn(
                        "flex flex-col items-center gap-2 py-3 rounded-xl border transition-all",
                        paymentMethod === method.id 
                          ? "bg-neutral-900 text-white border-neutral-900 shadow-md" 
                          : "bg-white text-neutral-500 border-neutral-200 hover:bg-neutral-50"
                      )}
                    >
                      <method.icon size={18} />
                      <span className="text-[10px] font-bold uppercase tracking-widest">{method.id}</span>
                    </button>
                  ))}
                </div>
              </div>

              <button
                disabled={cart.length === 0 || isProcessing}
                onClick={handleCheckout}
                className="w-full py-4 bg-neutral-900 text-white rounded-2xl font-bold text-lg hover:bg-neutral-800 transition-all shadow-xl shadow-neutral-200 disabled:opacity-50 disabled:shadow-none flex items-center justify-center gap-3"
              >
                {isProcessing ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  <>
                    <Receipt size={20} />
                    Complete Order
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Order History */
        <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-neutral-50 border-b border-neutral-100">
                  <th className="px-8 py-4 text-[10px] uppercase tracking-widest text-neutral-400 font-mono">Invoice</th>
                  <th className="px-8 py-4 text-[10px] uppercase tracking-widest text-neutral-400 font-mono">Items</th>
                  <th className="px-8 py-4 text-[10px] uppercase tracking-widest text-neutral-400 font-mono">Payment</th>
                  <th className="px-8 py-4 text-[10px] uppercase tracking-widest text-neutral-400 font-mono">Date</th>
                  <th className="px-8 py-4 text-[10px] uppercase tracking-widest text-neutral-400 font-mono">Total</th>
                  <th className="px-8 py-4 text-[10px] uppercase tracking-widest text-neutral-400 font-mono">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {sales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-neutral-50 transition-colors">
                    <td className="px-8 py-4 text-sm font-mono font-medium text-neutral-900">#{sale.invoiceNumber}</td>
                    <td className="px-8 py-4 text-sm text-neutral-500">
                      {sale.items.length} items ({sale.items.reduce((a, b) => a + b.quantity, 0)} units)
                    </td>
                    <td className="px-8 py-4">
                      <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-md bg-neutral-100 text-neutral-600">
                        {sale.paymentMethod}
                      </span>
                    </td>
                    <td className="px-8 py-4 text-sm text-neutral-500">{format(new Date(sale.createdAt), 'MMM d, yyyy h:mm a')}</td>
                    <td className="px-8 py-4 text-sm font-bold text-neutral-900">₹ {sale.total.toFixed(2)}</td>
                    <td className="px-8 py-4">
                      <button className="p-2 text-neutral-400 hover:text-neutral-900 transition-colors">
                        <Download size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccess && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-8 animate-in zoom-in-95 duration-200 text-center">
            <div className="flex flex-col items-center space-y-4">
              <div className="p-4 bg-emerald-50 text-emerald-600 rounded-full">
                <CheckCircle2 size={48} />
              </div>
              <h3 className="text-3xl font-serif italic text-neutral-900">Order Complete!</h3>
              <p className="text-neutral-500">
                Invoice <span className="font-mono font-bold text-neutral-900">#{lastInvoice}</span> has been generated successfully.
              </p>
            </div>
            
            <div className="flex flex-col gap-3 mt-8">
              <button
                onClick={() => setShowSuccess(false)}
                className="w-full py-4 bg-neutral-900 text-white rounded-2xl font-bold hover:bg-neutral-800 transition-all shadow-xl shadow-neutral-200"
              >
                New Sale
              </button>
              <button
                className="w-full py-4 text-sm font-medium text-neutral-500 hover:bg-neutral-50 rounded-2xl transition-colors flex items-center justify-center gap-2"
              >
                <Download size={16} /> Download Invoice PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
