import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, addDoc, doc, updateDoc, increment, query, orderBy } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { UserProfile, Product, Purchase, PurchaseItem } from '../types';
import { 
  Plus, 
  Search, 
  Truck, 
  Package, 
  Trash2, 
  X, 
  CheckCircle2, 
  ChevronRight, 
  History 
} from 'lucide-react';
import { format } from 'date-fns';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface PurchasesProps {
  user: UserProfile;
}

export default function Purchases({ user }: PurchasesProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [supplierName, setSupplierName] = useState('');
  const [purchaseItems, setPurchaseItems] = useState<PurchaseItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const productsUnsubscribe = onSnapshot(collection(db, 'products'), (snapshot) => {
      setProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product)));
    });

    const purchasesUnsubscribe = onSnapshot(
      query(collection(db, 'purchases'), orderBy('createdAt', 'desc')),
      (snapshot) => {
        setPurchases(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Purchase)));
      }
    );

    return () => {
      productsUnsubscribe();
      purchasesUnsubscribe();
    };
  }, []);

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const addItem = (product: Product) => {
    setPurchaseItems(prev => {
      const existing = prev.find(item => item.productId === product.id);
      if (existing) {
        return prev.map(item => 
          item.productId === product.id 
            ? { ...item, quantity: item.quantity + 1 } 
            : item
        );
      }
      return [...prev, {
        productId: product.id,
        quantity: 1,
        cost: product.costPrice
      }];
    });
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) return;
    setPurchaseItems(prev => prev.map(item => 
      item.productId === productId ? { ...item, quantity } : item
    ));
  };

  const removeItem = (productId: string) => {
    setPurchaseItems(prev => prev.filter(item => item.productId !== productId));
  };

  const purchaseTotal = purchaseItems.reduce((acc, item) => acc + (item.cost * item.quantity), 0);

  const handleSavePurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (purchaseItems.length === 0 || !supplierName) return;
    setIsProcessing(true);

    try {
      const purchaseData = {
        supplierName,
        items: purchaseItems,
        total: purchaseTotal,
        createdAt: new Date().toISOString(),
        staffId: user.uid,
        staffName: user.displayName
      };

      // 1. Create Purchase Record
      await addDoc(collection(db, 'purchases'), purchaseData);

      // 2. Update Stock
      for (const item of purchaseItems) {
        await updateDoc(doc(db, 'products', item.productId), {
          stock: increment(item.quantity)
        });
      }

      setIsModalOpen(false);
      setSupplierName('');
      setPurchaseItems([]);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'purchases');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div className="flex flex-col">
          <h1 className="text-4xl font-serif italic text-neutral-900">Purchases</h1>
          <p className="text-neutral-500 mt-1">Record incoming stock and manage suppliers</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-6 py-3 bg-neutral-900 text-white rounded-xl font-medium hover:bg-neutral-800 transition-colors shadow-lg shadow-neutral-200"
        >
          <Plus size={20} />
          New Purchase Order
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-neutral-100 flex items-center justify-between">
          <h2 className="text-xl font-serif italic text-neutral-900 flex items-center gap-2">
            <History size={20} /> Purchase History
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-neutral-50 border-b border-neutral-100">
                <th className="px-8 py-4 text-[10px] uppercase tracking-widest text-neutral-400 font-mono">Supplier</th>
                <th className="px-8 py-4 text-[10px] uppercase tracking-widest text-neutral-400 font-mono">Items</th>
                <th className="px-8 py-4 text-[10px] uppercase tracking-widest text-neutral-400 font-mono">Date</th>
                <th className="px-8 py-4 text-[10px] uppercase tracking-widest text-neutral-400 font-mono">Total Cost</th>
                <th className="px-8 py-4 text-[10px] uppercase tracking-widest text-neutral-400 font-mono">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {purchases.map((purchase) => (
                <tr key={purchase.id} className="hover:bg-neutral-50 transition-colors">
                  <td className="px-8 py-4 text-sm font-bold text-neutral-900">{purchase.supplierName}</td>
                  <td className="px-8 py-4 text-sm text-neutral-500">
                    {purchase.items.length} items ({purchase.items.reduce((a, b) => a + b.quantity, 0)} units)
                  </td>
                  <td className="px-8 py-4 text-sm text-neutral-500">{format(new Date(purchase.createdAt), 'MMM d, yyyy')}</td>
                  <td className="px-8 py-4 text-sm font-bold text-neutral-900">₹ {purchase.total.toFixed(2)}</td>
                  <td className="px-8 py-4">
                    <button className="p-2 text-neutral-400 hover:text-neutral-900 transition-colors">
                      <ChevronRight size={16} />
                    </button>
                  </td>
                </tr>
              ))}
              {purchases.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-8 py-12 text-center text-neutral-400 italic">No purchase orders recorded yet</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Purchase Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            <div className="p-8 border-b border-neutral-100 flex items-center justify-between bg-neutral-50">
              <h2 className="text-2xl font-serif italic text-neutral-900">New Purchase Order</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-white rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <div className="flex-1 flex overflow-hidden">
              {/* Product Selection */}
              <div className="w-1/2 p-8 border-r border-neutral-100 overflow-y-auto space-y-6">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={18} />
                  <input
                    type="text"
                    placeholder="Search products..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-neutral-900"
                  />
                </div>
                <div className="space-y-2">
                  {filteredProducts.map(product => (
                    <button
                      key={product.id}
                      onClick={() => addItem(product)}
                      className="w-full flex items-center justify-between p-4 rounded-xl border border-neutral-100 hover:bg-neutral-50 transition-all text-left group"
                    >
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-neutral-900">{product.name}</span>
                        <span className="text-[10px] text-neutral-400 font-mono uppercase tracking-widest">{product.sku}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-mono text-neutral-400">₹ {product.costPrice.toFixed(2)}</span>
                        <Plus size={16} className="text-neutral-300 group-hover:text-neutral-900" />
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Order Summary */}
              <div className="w-1/2 p-8 bg-neutral-50 overflow-y-auto flex flex-col">
                <form onSubmit={handleSavePurchase} className="flex flex-col h-full space-y-6">
                  <div className="space-y-2">
                    <label className="text-xs font-mono uppercase tracking-widest text-neutral-500">Supplier Name</label>
                    <input
                      required
                      type="text"
                      value={supplierName}
                      onChange={(e) => setSupplierName(e.target.value)}
                      placeholder="Enter supplier name..."
                      className="w-full px-4 py-2 bg-white border border-neutral-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-neutral-900"
                    />
                  </div>

                  <div className="flex-1 space-y-4">
                    <p className="text-xs font-mono uppercase tracking-widest text-neutral-500">Order Items</p>
                    {purchaseItems.map(item => {
                      const product = products.find(p => p.id === item.productId);
                      return (
                        <div key={item.productId} className="flex items-center gap-4 bg-white p-4 rounded-xl border border-neutral-100">
                          <div className="flex-1">
                            <p className="text-sm font-bold text-neutral-900">{product?.name}</p>
                            <p className="text-xs text-neutral-400">₹ {item.cost.toFixed(2)} each</p>
                          </div>
                          <input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => updateQuantity(item.productId, parseInt(e.target.value))}
                            className="w-16 px-2 py-1 bg-neutral-50 border border-neutral-200 rounded-lg text-sm text-center"
                          />
                          <button 
                            type="button"
                            onClick={() => removeItem(item.productId)}
                            className="text-neutral-300 hover:text-red-600 transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      );
                    })}
                    {purchaseItems.length === 0 && (
                      <div className="flex flex-col items-center justify-center py-12 text-neutral-300 italic text-sm">
                        No items added yet
                      </div>
                    )}
                  </div>

                  <div className="pt-6 border-t border-neutral-200 space-y-6">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-neutral-500">Total Cost</span>
                      <span className="text-2xl font-serif italic text-neutral-900">₹ {purchaseTotal.toFixed(2)}</span>
                    </div>
                    <button
                      type="submit"
                      disabled={purchaseItems.length === 0 || !supplierName || isProcessing}
                      className="w-full py-4 bg-neutral-900 text-white rounded-2xl font-bold hover:bg-neutral-800 transition-all shadow-xl shadow-neutral-200 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {isProcessing ? (
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      ) : (
                        <>
                          <CheckCircle2 size={20} />
                          Confirm Purchase
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
