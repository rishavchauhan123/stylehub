import { useState, useEffect } from 'react';
import api from '../api';
import { UserProfile, Sale, Product, Expense } from '../types';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  Legend 
} from 'recharts';
import { format, startOfMonth, endOfMonth, eachMonthOfInterval, subMonths, isSameMonth } from 'date-fns';
import { 
  TrendingUp, 
  TrendingDown, 
  IndianRupee, 
  PieChart as PieChartIcon, 
  Calendar, 
  Download 
} from 'lucide-react';

interface ReportsProps {
  user: UserProfile;
}

export default function Reports({ user }: ReportsProps) {
  const [sales, setSales] = useState<Sale[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [salesRes, productsRes, expensesRes] = await Promise.all([
          api.get('/sales'),
          api.get('/products'),
          api.get('/expenses')
        ]);
        setSales(salesRes.data);
        setProducts(productsRes.data);
        setExpenses(expensesRes.data);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };
    fetchData();
  }, []);

  // Monthly Performance Data
  const last6Months = eachMonthOfInterval({
    start: subMonths(new Date(), 5),
    end: new Date()
  });

  const monthlyData = last6Months.map(month => {
    const monthSales = sales.filter(s => isSameMonth(new Date(s.createdAt), month));
    const monthExpenses = expenses.filter(e => isSameMonth(new Date(e.date), month));
    const revenue = monthSales.reduce((acc, s) => acc + s.total, 0);
    const profit = monthSales.reduce((acc, s) => acc + s.profit, 0);
    const expenseTotal = monthExpenses.reduce((acc, e) => acc + e.amount, 0);
    
    return {
      name: format(month, 'MMM'),
      revenue,
      profit,
      expenses: expenseTotal,
      net: profit - expenseTotal
    };
  });

  // Category Distribution
  const categoryData = [
    { name: 'Men', value: products.filter(p => p.category === 'Men').length, color: '#171717' },
    { name: 'Women', value: products.filter(p => p.category === 'Women').length, color: '#404040' },
    { name: 'Accessories', value: products.filter(p => p.category === 'Accessories').length, color: '#737373' },
  ];

  const totalRevenue = sales.reduce((acc, s) => acc + s.total, 0);
  const totalExpenses = expenses.reduce((acc, e) => acc + e.amount, 0);
  const totalProfit = sales.reduce((acc, s) => acc + s.profit, 0);
  const netProfit = totalProfit - totalExpenses;

  return (
    <div className="space-y-12 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div className="flex flex-col">
          <h1 className="text-4xl font-serif italic text-neutral-900">Reports & Analytics</h1>
          <p className="text-neutral-500 mt-1">Detailed breakdown of your business financials</p>
        </div>
        <button className="flex items-center gap-2 px-6 py-3 bg-white border border-neutral-200 text-neutral-900 rounded-xl font-medium hover:bg-neutral-50 transition-colors shadow-sm">
          <Download size={20} />
          Export All Data
        </button>
      </div>

      {/* Financial Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="bg-white p-8 rounded-3xl border border-neutral-200 shadow-sm">
          <p className="text-xs font-mono uppercase tracking-widest text-neutral-400 mb-2">Total Revenue</p>
          <p className="text-4xl font-serif italic text-neutral-900">₹ {totalRevenue.toLocaleString()}</p>
          <div className="mt-4 flex items-center gap-2 text-emerald-600 text-sm font-bold">
            <TrendingUp size={16} />
            <span>+12.5% from last month</span>
          </div>
        </div>
        <div className="bg-white p-8 rounded-3xl border border-neutral-200 shadow-sm">
          <p className="text-xs font-mono uppercase tracking-widest text-neutral-400 mb-2">Total Expenses</p>
          <p className="text-4xl font-serif italic text-neutral-900">₹ {totalExpenses.toLocaleString()}</p>
          <div className="mt-4 flex items-center gap-2 text-red-600 text-sm font-bold">
            <TrendingDown size={16} />
            <span>+4.2% from last month</span>
          </div>
        </div>
        <div className="bg-neutral-900 p-8 rounded-3xl border border-neutral-800 shadow-xl text-white">
          <p className="text-xs font-mono uppercase tracking-widest text-neutral-500 mb-2">Net Profit</p>
          <p className="text-4xl font-serif italic">₹ {netProfit.toLocaleString()}</p>
          <div className="mt-4 flex items-center gap-2 text-emerald-400 text-sm font-bold">
            <TrendingUp size={16} />
            <span>Healthy margins</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Monthly Performance Chart */}
        <div className="bg-white p-10 rounded-3xl border border-neutral-200 shadow-sm">
          <div className="flex items-center justify-between mb-10">
            <h2 className="text-2xl font-serif italic text-neutral-900 flex items-center gap-3">
              <Calendar size={24} /> Monthly Performance
            </h2>
          </div>
          <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12, fill: '#888' }} 
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12, fill: '#888' }} 
                />
                <Tooltip 
                  cursor={{ fill: '#f9f9f9' }}
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}
                />
                <Legend iconType="circle" />
                <Bar dataKey="revenue" name="Revenue" fill="#171717" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expenses" name="Expenses" fill="#ef4444" radius={[4, 4, 0, 0]} />
                <Bar dataKey="net" name="Net Profit" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Inventory Distribution */}
        <div className="bg-white p-10 rounded-3xl border border-neutral-200 shadow-sm">
          <div className="flex items-center justify-between mb-10">
            <h2 className="text-2xl font-serif italic text-neutral-900 flex items-center gap-3">
              <PieChartIcon size={24} /> Inventory Mix
            </h2>
          </div>
          <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={140}
                  paddingAngle={8}
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}
                />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Top Products Table */}
      <div className="bg-white rounded-3xl border border-neutral-200 shadow-sm overflow-hidden">
        <div className="p-10 border-b border-neutral-100">
          <h2 className="text-2xl font-serif italic text-neutral-900">Product Performance</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-neutral-50 border-b border-neutral-100">
                <th className="px-10 py-5 text-[10px] uppercase tracking-widest text-neutral-400 font-mono">Product</th>
                <th className="px-10 py-5 text-[10px] uppercase tracking-widest text-neutral-400 font-mono">Category</th>
                <th className="px-10 py-5 text-[10px] uppercase tracking-widest text-neutral-400 font-mono">Stock</th>
                <th className="px-10 py-5 text-[10px] uppercase tracking-widest text-neutral-400 font-mono">Price</th>
                <th className="px-10 py-5 text-[10px] uppercase tracking-widest text-neutral-400 font-mono">Margin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {products.slice(0, 10).map((prod) => (
                <tr key={prod.id} className="hover:bg-neutral-50 transition-colors">
                  <td className="px-10 py-5 text-sm font-bold text-neutral-900">{prod.name}</td>
                  <td className="px-10 py-5 text-sm text-neutral-500">{prod.category}</td>
                  <td className="px-10 py-5 text-sm text-neutral-500">{prod.stock} units</td>
                  <td className="px-10 py-5 text-sm font-bold text-neutral-900">₹ {prod.sellingPrice.toFixed(2)}</td>
                  <td className="px-10 py-5">
                    <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">
                      {(((prod.sellingPrice - prod.costPrice) / prod.sellingPrice) * 100).toFixed(1)}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
