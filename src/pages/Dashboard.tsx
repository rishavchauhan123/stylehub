import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase';
import { UserProfile, Sale, Product } from '../types';
import { 
  TrendingUp, 
  TrendingDown, 
  Package, 
  ShoppingCart, 
  DollarSign, 
  AlertTriangle 
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  LineChart, 
  Line 
} from 'recharts';
import { format, startOfDay, subDays, isSameDay } from 'date-fns';

interface DashboardProps {
  user: UserProfile;
}

export default function Dashboard({ user }: DashboardProps) {
  const [sales, setSales] = useState<Sale[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const salesUnsubscribe = onSnapshot(
      query(collection(db, 'sales'), orderBy('createdAt', 'desc'), limit(100)),
      (snapshot) => {
        setSales(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Sale)));
      }
    );

    const productsUnsubscribe = onSnapshot(
      collection(db, 'products'),
      (snapshot) => {
        setProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product)));
        setLoading(false);
      }
    );

    return () => {
      salesUnsubscribe();
      productsUnsubscribe();
    };
  }, []);

  const totalRevenue = sales.reduce((acc, sale) => acc + sale.total, 0);
  const totalProfit = sales.reduce((acc, sale) => acc + sale.profit, 0);
  const stockValue = products.reduce((acc, prod) => acc + (prod.stock * prod.costPrice), 0);
  const lowStockProducts = products.filter(prod => prod.stock <= prod.lowStockThreshold);

  // Chart data
  const last7Days = Array.from({ length: 7 }, (_, i) => subDays(new Date(), i)).reverse();
  const chartData = last7Days.map(date => {
    const daySales = sales.filter(sale => isSameDay(new Date(sale.createdAt), date));
    return {
      name: format(date, 'EEE'),
      revenue: daySales.reduce((acc, sale) => acc + sale.total, 0),
      profit: daySales.reduce((acc, sale) => acc + sale.profit, 0),
    };
  });

  const stats = [
    { name: 'Total Revenue', value: `$${totalRevenue.toLocaleString()}`, icon: DollarSign, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { name: 'Net Profit', value: `$${totalProfit.toLocaleString()}`, icon: TrendingUp, color: 'text-blue-600', bg: 'bg-blue-50' },
    { name: 'Stock Value', value: `$${stockValue.toLocaleString()}`, icon: Package, color: 'text-amber-600', bg: 'bg-amber-50' },
    { name: 'Total Products', value: products.length, icon: ShoppingCart, color: 'text-purple-600', bg: 'bg-purple-50' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col">
        <h1 className="text-4xl font-serif italic text-neutral-900">Dashboard</h1>
        <p className="text-neutral-500 mt-1">Overview of your business performance</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div key={stat.name} className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-xl ${stat.bg} ${stat.color}`}>
                <stat.icon size={24} />
              </div>
              <span className="text-xs font-mono uppercase tracking-widest text-neutral-400">Live</span>
            </div>
            <p className="text-sm font-medium text-neutral-500 uppercase tracking-wider">{stat.name}</p>
            <p className="text-3xl font-bold text-neutral-900 mt-1">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Revenue Chart */}
        <div className="lg:col-span-2 bg-white p-8 rounded-2xl border border-neutral-200 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-serif italic text-neutral-900">Revenue vs Profit</h2>
            <div className="flex items-center gap-4 text-xs font-mono uppercase tracking-widest">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-neutral-900 rounded-full"></div>
                <span>Revenue</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                <span>Profit</span>
              </div>
            </div>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
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
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                />
                <Bar dataKey="revenue" fill="#171717" radius={[4, 4, 0, 0]} barSize={40} />
                <Bar dataKey="profit" fill="#10b981" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="bg-white p-8 rounded-2xl border border-neutral-200 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-serif italic text-neutral-900">Stock Alerts</h2>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
              <AlertTriangle size={20} />
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto space-y-4">
            {lowStockProducts.length > 0 ? (
              lowStockProducts.map(prod => (
                <div key={prod.id} className="flex items-center justify-between p-4 rounded-xl bg-neutral-50 border border-neutral-100">
                  <div>
                    <p className="text-sm font-semibold text-neutral-900">{prod.name}</p>
                    <p className="text-xs text-neutral-500 font-mono uppercase tracking-widest">{prod.sku}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-red-600">{prod.stock} left</p>
                    <p className="text-[10px] text-neutral-400 uppercase tracking-widest">Threshold: {prod.lowStockThreshold}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-neutral-400">
                <Package size={48} className="mb-4 opacity-20" />
                <p className="text-sm">All stock levels are healthy</p>
              </div>
            )}
          </div>
          
          <button className="mt-6 w-full py-3 text-sm font-medium text-neutral-900 border border-neutral-200 rounded-xl hover:bg-neutral-50 transition-colors">
            View Inventory
          </button>
        </div>
      </div>

      {/* Recent Sales Table */}
      <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-neutral-100 flex items-center justify-between">
          <h2 className="text-xl font-serif italic text-neutral-900">Recent Sales</h2>
          <button className="text-sm font-medium text-neutral-500 hover:text-neutral-900">View All</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-neutral-50 border-b border-neutral-100">
                <th className="px-8 py-4 text-[10px] uppercase tracking-widest text-neutral-400 font-mono">Invoice</th>
                <th className="px-8 py-4 text-[10px] uppercase tracking-widest text-neutral-400 font-mono">Customer</th>
                <th className="px-8 py-4 text-[10px] uppercase tracking-widest text-neutral-400 font-mono">Date</th>
                <th className="px-8 py-4 text-[10px] uppercase tracking-widest text-neutral-400 font-mono">Total</th>
                <th className="px-8 py-4 text-[10px] uppercase tracking-widest text-neutral-400 font-mono">Profit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {sales.slice(0, 5).map((sale) => (
                <tr key={sale.id} className="hover:bg-neutral-50 transition-colors cursor-pointer group">
                  <td className="px-8 py-4 text-sm font-mono font-medium text-neutral-900 group-hover:underline">#{sale.invoiceNumber}</td>
                  <td className="px-8 py-4 text-sm text-neutral-600">{sale.customerName || 'Walk-in Customer'}</td>
                  <td className="px-8 py-4 text-sm text-neutral-500">{format(new Date(sale.createdAt), 'MMM d, h:mm a')}</td>
                  <td className="px-8 py-4 text-sm font-bold text-neutral-900">${sale.total.toFixed(2)}</td>
                  <td className="px-8 py-4">
                    <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">
                      +${sale.profit.toFixed(2)}
                    </span>
                  </td>
                </tr>
              ))}
              {sales.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-8 py-12 text-center text-neutral-400 italic">No sales recorded yet</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
