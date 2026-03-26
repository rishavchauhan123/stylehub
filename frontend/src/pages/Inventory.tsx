import React, { useState, useEffect } from 'react';
import api from '../api';
import { UserProfile, Product } from '../types';
import { 
  Plus, 
  Search, 
  Filter, 
  MoreVertical, 
  Edit2, 
  Trash2, 
  Package, 
  AlertTriangle, 
  X, 
  Check 
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface InventoryProps {
  user: UserProfile;
}

export default function Inventory({ user }: InventoryProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'All' | 'Men' | 'Women' | 'Accessories'>('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [currentProduct, setCurrentProduct] = useState<Partial<Product> | null>(null);
  const [productToDelete, setProductToDelete] = useState<string | null>(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await api.get('/products');
        setProducts(res.data);
      } catch (error) {
        console.error('Error fetching products:', error);
      }
    };
    fetchProducts();
  }, []);

  const filteredProducts = products.filter(prod => {
    const matchesSearch = prod.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         prod.sku.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'All' || prod.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentProduct) return;

    try {
      if (currentProduct.id) {
        const { id, ...data } = currentProduct;
        await api.put(`/products/${id}`, data);
      } else {
        await api.post('/products', {
          ...currentProduct,
          createdAt: new Date().toISOString(),
        });
      }
      // Refetch products
      const res = await api.get('/products');
      setProducts(res.data);
      setIsModalOpen(false);
      setCurrentProduct(null);
    } catch (error) {
      console.error('Error saving product:', error);
    }
  };

  const handleDeleteProduct = async () => {
    if (!productToDelete) return;
    try {
      await api.delete(`/products/${productToDelete}`);
      // Refetch products
      const res = await api.get('/products');
      setProducts(res.data);
      setIsDeleteConfirmOpen(false);
      setProductToDelete(null);
    } catch (error) {
      console.error('Error deleting product:', error);
    }
  };

  const openEditModal = (product: Product) => {
    setCurrentProduct(product);
    setIsModalOpen(true);
  };

  const openAddModal = () => {
    setCurrentProduct({
      sku: '',
      name: '',
      category: 'Men',
      costPrice: 0,
      sellingPrice: 0,
      stock: 0,
      lowStockThreshold: 5,
      variants: [],
    });
    setIsModalOpen(true);
  };

  const handleAddVariant = () => {
    if (!currentProduct) return;
    const variants = [...(currentProduct.variants || []), { size: '', color: '' }];
    setCurrentProduct({ ...currentProduct, variants });
  };

  const handleRemoveVariant = (index: number) => {
    if (!currentProduct || !currentProduct.variants) return;
    const variants = currentProduct.variants.filter((_, i) => i !== index);
    setCurrentProduct({ ...currentProduct, variants });
  };

  const handleVariantChange = (index: number, field: 'size' | 'color', value: string) => {
    if (!currentProduct || !currentProduct.variants) return;
    const variants = [...currentProduct.variants];
    variants[index] = { ...variants[index], [field]: value };
    setCurrentProduct({ ...currentProduct, variants });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div className="flex flex-col">
          <h1 className="text-5xl font-bold text-neutral-900 tracking-tight">Inventory</h1>
          <p className="text-neutral-400 mt-2 font-medium">{products.length} products in stock</p>
        </div>
        {(user.role === 'admin' || user.role === 'manager') && (
          <button
            onClick={openAddModal}
            className="flex items-center gap-2 px-8 py-3.5 bg-[#0029A3] text-white rounded-md font-bold text-[10px] uppercase tracking-[0.2em] hover:bg-blue-800 transition-all shadow-lg shadow-blue-100"
          >
            <Plus size={16} />
            ADD PRODUCT
          </button>
        )}
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative flex-1 w-full max-w-xl">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" size={20} />
          <input
            type="text"
            placeholder="Search by name or SKU..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3.5 bg-white border border-neutral-200 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-neutral-900 transition-all placeholder:text-neutral-400"
          />
        </div>
        <div className="flex items-center gap-3">
          {['All', 'Men', 'Women', 'Accessories'].map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat as any)}
              className={cn(
                "px-8 py-3.5 rounded-md text-[10px] font-bold uppercase tracking-[0.2em] transition-all border",
                categoryFilter === cat 
                  ? "bg-neutral-900 text-white border-neutral-900 shadow-md" 
                  : "bg-white text-neutral-900 border-neutral-200 hover:bg-neutral-50"
              )}
            >
              {cat.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Product Table */}
      <div className="bg-white rounded-md border border-neutral-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-neutral-50 border-b border-neutral-200">
                <th className="px-8 py-5 text-[10px] uppercase tracking-[0.2em] text-neutral-400 font-bold">SKU</th>
                <th className="px-8 py-5 text-[10px] uppercase tracking-[0.2em] text-neutral-400 font-bold">Product Name</th>
                <th className="px-8 py-5 text-[10px] uppercase tracking-[0.2em] text-neutral-400 font-bold">Category</th>
                <th className="px-8 py-5 text-[10px] uppercase tracking-[0.2em] text-neutral-400 font-bold">Cost</th>
                <th className="px-8 py-5 text-[10px] uppercase tracking-[0.2em] text-neutral-400 font-bold">Price</th>
                <th className="px-8 py-5 text-[10px] uppercase tracking-[0.2em] text-neutral-400 font-bold">Stock</th>
                <th className="px-8 py-5 text-[10px] uppercase tracking-[0.2em] text-neutral-400 font-bold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {filteredProducts.map((product) => (
                <tr key={product.id} className="hover:bg-neutral-50 transition-colors group">
                  <td className="px-8 py-5 text-xs font-bold text-neutral-500 uppercase tracking-wider">{product.sku}</td>
                  <td className="px-8 py-5">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-neutral-900">{product.name}</span>
                      {product.stock <= product.lowStockThreshold && (
                        <span className="text-[10px] text-amber-600 flex items-center gap-1 font-bold uppercase tracking-widest mt-1">
                          <AlertTriangle size={10} /> Low Stock
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <span className="text-xs font-bold text-neutral-500">
                      {product.category}
                    </span>
                  </td>
                  <td className="px-8 py-5 text-sm font-medium text-neutral-500">₹ {product.costPrice.toFixed(2)}</td>
                  <td className="px-8 py-5 text-sm font-bold text-neutral-900">₹ {product.sellingPrice.toFixed(2)}</td>
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-2">
                      <div className={cn(
                        "w-2 h-2 rounded-full",
                        product.stock > product.lowStockThreshold ? "bg-emerald-500" : "bg-amber-500"
                      )}></div>
                      <span className="text-sm font-bold text-neutral-900">{product.stock}</span>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => openEditModal(product)}
                        className="p-2 text-neutral-400 hover:text-neutral-900 hover:bg-white rounded-lg transition-all"
                      >
                        <Edit2 size={16} />
                      </button>
                      {user.role === 'admin' && (
                        <button 
                          onClick={() => {
                            setProductToDelete(product.id);
                            setIsDeleteConfirmOpen(true);
                          }}
                          className="p-2 text-neutral-400 hover:text-red-600 hover:bg-white rounded-lg transition-all"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filteredProducts.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-8 py-20 text-center text-neutral-400 font-medium">No products found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Product Modal */}
      {isModalOpen && currentProduct && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-2xl rounded-sm shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-8 border-b border-neutral-100 flex items-center justify-between">
              <h2 className="text-xl font-bold text-neutral-900">
                {currentProduct.id ? 'Edit Product' : 'Add New Product'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-neutral-100 rounded-full transition-colors text-neutral-400">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSaveProduct} className="p-8 space-y-8">
              <div className="grid grid-cols-2 gap-x-8 gap-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-[0.15em] text-neutral-900">SKU</label>
                  <input
                    required
                    type="text"
                    value={currentProduct.sku}
                    onChange={(e) => setCurrentProduct({ ...currentProduct, sku: e.target.value })}
                    className="w-full px-4 py-3 bg-white border border-neutral-200 rounded-sm focus:outline-none focus:ring-1 focus:ring-neutral-900"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-[0.15em] text-neutral-900">Category</label>
                  <select
                    value={currentProduct.category}
                    onChange={(e) => setCurrentProduct({ ...currentProduct, category: e.target.value as any })}
                    className="w-full px-4 py-3 bg-white border border-neutral-200 rounded-sm focus:outline-none focus:ring-1 focus:ring-neutral-900 appearance-none"
                  >
                    <option value="Men">Men</option>
                    <option value="Women">Women</option>
                    <option value="Accessories">Accessories</option>
                  </select>
                </div>
                <div className="col-span-2 space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-[0.15em] text-neutral-900">Product Name</label>
                  <input
                    required
                    type="text"
                    value={currentProduct.name}
                    onChange={(e) => setCurrentProduct({ ...currentProduct, name: e.target.value })}
                    className="w-full px-4 py-3 bg-white border border-neutral-200 rounded-sm focus:outline-none focus:ring-1 focus:ring-neutral-900"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-[0.15em] text-neutral-900">Cost Price</label>
                  <input
                    required
                    type="number"
                    step="0.01"
                    value={currentProduct.costPrice}
                    onChange={(e) => setCurrentProduct({ ...currentProduct, costPrice: parseFloat(e.target.value) })}
                    className="w-full px-4 py-3 bg-white border border-neutral-200 rounded-sm focus:outline-none focus:ring-1 focus:ring-neutral-900"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-[0.15em] text-neutral-900">Selling Price</label>
                  <input
                    required
                    type="number"
                    step="0.01"
                    value={currentProduct.sellingPrice}
                    onChange={(e) => setCurrentProduct({ ...currentProduct, sellingPrice: parseFloat(e.target.value) })}
                    className="w-full px-4 py-3 bg-white border border-neutral-200 rounded-sm focus:outline-none focus:ring-1 focus:ring-neutral-900"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-[0.15em] text-neutral-900">Stock Quantity</label>
                  <input
                    required
                    type="number"
                    value={currentProduct.stock}
                    onChange={(e) => setCurrentProduct({ ...currentProduct, stock: parseInt(e.target.value) })}
                    className="w-full px-4 py-3 bg-white border border-neutral-200 rounded-sm focus:outline-none focus:ring-1 focus:ring-neutral-900"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-[0.15em] text-neutral-900">Low Stock Alert</label>
                  <input
                    required
                    type="number"
                    value={currentProduct.lowStockThreshold}
                    onChange={(e) => setCurrentProduct({ ...currentProduct, lowStockThreshold: parseInt(e.target.value) })}
                    className="w-full px-4 py-3 bg-white border border-neutral-200 rounded-sm focus:outline-none focus:ring-1 focus:ring-neutral-900"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-4">
                <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-neutral-900">Variants</span>
                <button 
                  type="button" 
                  onClick={handleAddVariant}
                  className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.15em] text-blue-700 hover:text-blue-800"
                >
                  <Plus size={14} /> Add Variant
                </button>
              </div>

              <div className="space-y-3 max-h-40 overflow-y-auto pr-2">
                {currentProduct.variants?.map((variant, index) => (
                  <div key={index} className="flex gap-3 items-center">
                    <input
                      placeholder="Size"
                      value={variant.size}
                      onChange={(e) => handleVariantChange(index, 'size', e.target.value)}
                      className="flex-1 px-4 py-2 bg-white border border-neutral-200 rounded-sm text-sm focus:outline-none focus:ring-1 focus:ring-neutral-900"
                    />
                    <input
                      placeholder="Color"
                      value={variant.color}
                      onChange={(e) => handleVariantChange(index, 'color', e.target.value)}
                      className="flex-1 px-4 py-2 bg-white border border-neutral-200 rounded-sm text-sm focus:outline-none focus:ring-1 focus:ring-neutral-900"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveVariant(index)}
                      className="p-2 bg-red-500 text-white rounded-sm hover:bg-red-600 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
                {(!currentProduct.variants || currentProduct.variants.length === 0) && (
                  <p className="text-[10px] text-neutral-400 italic">No variants added yet.</p>
                )}
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-4 border border-neutral-200 text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-900 hover:bg-neutral-50 transition-colors"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  className="flex-1 py-4 bg-neutral-900 text-white text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-neutral-800 transition-all"
                >
                  {currentProduct.id ? 'UPDATE' : 'CREATE'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteConfirmOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-8 animate-in zoom-in-95 duration-200">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="p-4 bg-red-50 text-red-600 rounded-full">
                <Trash2 size={32} />
              </div>
              <h3 className="text-2xl font-serif italic text-neutral-900">Delete Product?</h3>
              <p className="text-neutral-500">
                Are you sure you want to delete this product? This action cannot be undone and will remove all stock data.
              </p>
            </div>
            
            <div className="flex gap-4 mt-8">
              <button
                onClick={() => setIsDeleteConfirmOpen(false)}
                className="flex-1 py-3 text-sm font-medium text-neutral-500 hover:bg-neutral-50 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteProduct}
                className="flex-1 py-3 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition-all shadow-lg shadow-red-100"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
