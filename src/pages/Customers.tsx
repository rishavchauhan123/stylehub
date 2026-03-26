import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, addDoc, doc, updateDoc, query, orderBy } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { UserProfile, Customer } from '../types';
import { 
  Plus, 
  Search, 
  Users, 
  Phone, 
  Mail, 
  ShoppingBag, 
  ChevronRight, 
  X, 
  Save 
} from 'lucide-react';
import { format } from 'date-fns';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface CustomersProps {
  user: UserProfile;
}

export default function Customers({ user }: CustomersProps) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentCustomer, setCurrentCustomer] = useState<Partial<Customer> | null>(null);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      query(collection(db, 'customers'), orderBy('name', 'asc')),
      (snapshot) => {
        setCustomers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Customer)));
      }
    );
    return () => unsubscribe();
  }, []);

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.phone.includes(searchTerm)
  );

  const handleSaveCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentCustomer) return;

    try {
      if (currentCustomer.id) {
        const { id, ...data } = currentCustomer;
        await updateDoc(doc(db, 'customers', id), data);
      } else {
        await addDoc(collection(db, 'customers'), {
          ...currentCustomer,
          totalSpent: 0,
          createdAt: new Date().toISOString(),
        });
      }
      setIsModalOpen(false);
      setCurrentCustomer(null);
    } catch (error) {
      handleFirestoreError(error, currentCustomer.id ? OperationType.UPDATE : OperationType.CREATE, 'customers');
    }
  };

  const openAddModal = () => {
    setCurrentCustomer({ name: '', phone: '', email: '' });
    setIsModalOpen(true);
  };

  const openEditModal = (customer: Customer) => {
    setCurrentCustomer(customer);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div className="flex flex-col">
          <h1 className="text-4xl font-serif italic text-neutral-900">Customers</h1>
          <p className="text-neutral-500 mt-1">Manage your customer database and loyalty</p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 px-6 py-3 bg-neutral-900 text-white rounded-xl font-medium hover:bg-neutral-800 transition-colors shadow-lg shadow-neutral-200"
        >
          <Plus size={20} />
          Add Customer
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" size={20} />
        <input
          type="text"
          placeholder="Search by name or phone number..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-12 pr-4 py-4 bg-white border border-neutral-200 rounded-2xl text-lg focus:outline-none focus:ring-1 focus:ring-neutral-900 shadow-sm transition-all"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCustomers.map(customer => (
          <div key={customer.id} className="bg-white p-6 rounded-3xl border border-neutral-200 shadow-sm hover:shadow-md transition-all group relative overflow-hidden">
            <div className="flex items-start justify-between mb-6">
              <div className="w-12 h-12 rounded-2xl bg-neutral-900 flex items-center justify-center text-white font-serif italic text-xl">
                {customer.name.charAt(0)}
              </div>
              <button 
                onClick={() => openEditModal(customer)}
                className="p-2 text-neutral-300 hover:text-neutral-900 transition-colors"
              >
                <ChevronRight size={20} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-bold text-neutral-900">{customer.name}</h3>
                <div className="flex items-center gap-2 text-xs text-neutral-500 mt-1">
                  <Phone size={12} />
                  <span>{customer.phone}</span>
                </div>
                {customer.email && (
                  <div className="flex items-center gap-2 text-xs text-neutral-500 mt-1">
                    <Mail size={12} />
                    <span>{customer.email}</span>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-neutral-100 flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase tracking-widest text-neutral-400 font-mono">Total Spent</span>
                  <span className="text-lg font-serif italic text-neutral-900">${customer.totalSpent.toFixed(2)}</span>
                </div>
                <div className="p-2 bg-neutral-50 text-neutral-400 rounded-lg">
                  <ShoppingBag size={18} />
                </div>
              </div>
            </div>
          </div>
        ))}
        {filteredCustomers.length === 0 && (
          <div className="col-span-full py-24 text-center text-neutral-300 italic flex flex-col items-center gap-4">
            <Users size={64} className="opacity-10" />
            <p>No customers found</p>
          </div>
        )}
      </div>

      {/* Customer Modal */}
      {isModalOpen && currentCustomer && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-8 border-b border-neutral-100 flex items-center justify-between bg-neutral-50">
              <h2 className="text-2xl font-serif italic text-neutral-900">
                {currentCustomer.id ? 'Edit Customer' : 'Add New Customer'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-white rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSaveCustomer} className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-mono uppercase tracking-widest text-neutral-500">Full Name</label>
                <input
                  required
                  type="text"
                  value={currentCustomer.name}
                  onChange={(e) => setCurrentCustomer({ ...currentCustomer, name: e.target.value })}
                  className="w-full px-4 py-2 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-neutral-900"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-mono uppercase tracking-widest text-neutral-500">Phone Number</label>
                <input
                  required
                  type="tel"
                  value={currentCustomer.phone}
                  onChange={(e) => setCurrentCustomer({ ...currentCustomer, phone: e.target.value })}
                  className="w-full px-4 py-2 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-neutral-900"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-mono uppercase tracking-widest text-neutral-500">Email Address (Optional)</label>
                <input
                  type="email"
                  value={currentCustomer.email}
                  onChange={(e) => setCurrentCustomer({ ...currentCustomer, email: e.target.value })}
                  className="w-full px-4 py-2 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-neutral-900"
                />
              </div>

              <button
                type="submit"
                className="w-full py-4 bg-neutral-900 text-white rounded-2xl font-bold hover:bg-neutral-800 transition-all shadow-xl shadow-neutral-200 flex items-center justify-center gap-2"
              >
                <Save size={20} />
                Save Customer
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
