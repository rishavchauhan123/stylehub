import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, addDoc, doc, updateDoc, deleteDoc, query, orderBy } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { UserProfile, Expense } from '../types';
import { 
  Plus, 
  Search, 
  Receipt, 
  Trash2, 
  Edit2, 
  X, 
  Save, 
  TrendingDown, 
  Calendar 
} from 'lucide-react';
import { format } from 'date-fns';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ExpensesProps {
  user: UserProfile;
}

export default function Expenses({ user }: ExpensesProps) {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentExpense, setCurrentExpense] = useState<Partial<Expense> | null>(null);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      query(collection(db, 'expenses'), orderBy('date', 'desc')),
      (snapshot) => {
        setExpenses(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Expense)));
      }
    );
    return () => unsubscribe();
  }, []);

  const filteredExpenses = expenses.filter(e => 
    e.category.toLowerCase().includes(searchTerm.toLowerCase()) || 
    e.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalExpenses = expenses.reduce((acc, exp) => acc + exp.amount, 0);

  const handleSaveExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentExpense) return;

    try {
      if (currentExpense.id) {
        const { id, ...data } = currentExpense;
        await updateDoc(doc(db, 'expenses', id), data);
      } else {
        await addDoc(collection(db, 'expenses'), {
          ...currentExpense,
          createdAt: new Date().toISOString(),
        });
      }
      setIsModalOpen(false);
      setCurrentExpense(null);
    } catch (error) {
      handleFirestoreError(error, currentExpense.id ? OperationType.UPDATE : OperationType.CREATE, 'expenses');
    }
  };

  const handleDeleteExpense = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this expense?')) return;
    try {
      await deleteDoc(doc(db, 'expenses', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'expenses');
    }
  };

  const openAddModal = () => {
    setCurrentExpense({ category: '', amount: 0, description: '', date: new Date().toISOString().split('T')[0] });
    setIsModalOpen(true);
  };

  const openEditModal = (expense: Expense) => {
    setCurrentExpense(expense);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div className="flex flex-col">
          <h1 className="text-4xl font-serif italic text-neutral-900">Expenses</h1>
          <p className="text-neutral-500 mt-1">Track business costs and operational spending</p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 px-6 py-3 bg-neutral-900 text-white rounded-xl font-medium hover:bg-neutral-800 transition-colors shadow-lg shadow-neutral-200"
        >
          <Plus size={20} />
          Record Expense
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-8 rounded-3xl border border-neutral-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-mono uppercase tracking-widest text-neutral-400 mb-1">Total Spending</p>
            <p className="text-3xl font-serif italic text-neutral-900">${totalExpenses.toLocaleString()}</p>
          </div>
          <div className="p-4 bg-red-50 text-red-600 rounded-2xl">
            <TrendingDown size={32} />
          </div>
        </div>
        
        <div className="md:col-span-2 bg-white p-4 rounded-3xl border border-neutral-200 shadow-sm flex items-center">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" size={20} />
            <input
              type="text"
              placeholder="Search by category or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-neutral-50 border border-neutral-100 rounded-2xl text-lg focus:outline-none focus:ring-1 focus:ring-neutral-900 transition-all"
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-neutral-50 border-b border-neutral-100">
                <th className="px-8 py-4 text-[10px] uppercase tracking-widest text-neutral-400 font-mono">Category</th>
                <th className="px-8 py-4 text-[10px] uppercase tracking-widest text-neutral-400 font-mono">Description</th>
                <th className="px-8 py-4 text-[10px] uppercase tracking-widest text-neutral-400 font-mono">Date</th>
                <th className="px-8 py-4 text-[10px] uppercase tracking-widest text-neutral-400 font-mono">Amount</th>
                <th className="px-8 py-4 text-[10px] uppercase tracking-widest text-neutral-400 font-mono text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {filteredExpenses.map((expense) => (
                <tr key={expense.id} className="hover:bg-neutral-50 transition-colors group">
                  <td className="px-8 py-4">
                    <span className="text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-lg bg-neutral-100 text-neutral-600 border border-neutral-200">
                      {expense.category}
                    </span>
                  </td>
                  <td className="px-8 py-4 text-sm text-neutral-500">{expense.description}</td>
                  <td className="px-8 py-4 text-sm text-neutral-500 font-mono">{format(new Date(expense.date), 'MMM d, yyyy')}</td>
                  <td className="px-8 py-4 text-sm font-bold text-red-600">-${expense.amount.toFixed(2)}</td>
                  <td className="px-8 py-4 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => openEditModal(expense)}
                        className="p-2 text-neutral-300 hover:text-neutral-900 transition-colors"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button 
                        onClick={() => handleDeleteExpense(expense.id)}
                        className="p-2 text-neutral-300 hover:text-red-600 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredExpenses.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-8 py-12 text-center text-neutral-400 italic">No expenses recorded yet</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Expense Modal */}
      {isModalOpen && currentExpense && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-8 border-b border-neutral-100 flex items-center justify-between bg-neutral-50">
              <h2 className="text-2xl font-serif italic text-neutral-900">
                {currentExpense.id ? 'Edit Expense' : 'Record Expense'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-white rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSaveExpense} className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-mono uppercase tracking-widest text-neutral-500">Category</label>
                <select
                  required
                  value={currentExpense.category}
                  onChange={(e) => setCurrentExpense({ ...currentExpense, category: e.target.value })}
                  className="w-full px-4 py-2 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-neutral-900"
                >
                  <option value="">Select Category</option>
                  <option value="Rent">Rent</option>
                  <option value="Salaries">Salaries</option>
                  <option value="Utilities">Utilities</option>
                  <option value="Marketing">Marketing</option>
                  <option value="Supplies">Supplies</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-mono uppercase tracking-widest text-neutral-500">Amount ($)</label>
                <input
                  required
                  type="number"
                  step="0.01"
                  value={currentExpense.amount}
                  onChange={(e) => setCurrentExpense({ ...currentExpense, amount: parseFloat(e.target.value) })}
                  className="w-full px-4 py-2 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-neutral-900"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-mono uppercase tracking-widest text-neutral-500">Date</label>
                <input
                  required
                  type="date"
                  value={currentExpense.date}
                  onChange={(e) => setCurrentExpense({ ...currentExpense, date: e.target.value })}
                  className="w-full px-4 py-2 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-neutral-900"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-mono uppercase tracking-widest text-neutral-500">Description</label>
                <textarea
                  value={currentExpense.description}
                  onChange={(e) => setCurrentExpense({ ...currentExpense, description: e.target.value })}
                  placeholder="Enter details..."
                  className="w-full px-4 py-2 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-neutral-900 min-h-[100px]"
                />
              </div>

              <button
                type="submit"
                className="w-full py-4 bg-neutral-900 text-white rounded-2xl font-bold hover:bg-neutral-800 transition-all shadow-xl shadow-neutral-200 flex items-center justify-center gap-2"
              >
                <Save size={20} />
                Save Expense
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
