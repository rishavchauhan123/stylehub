import { ReactNode, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';
import { UserProfile } from '../types';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  Truck, 
  Users, 
  Receipt, 
  BarChart3, 
  UserCog, 
  Settings, 
  LogOut, 
  Menu, 
  X, 
  Bell, 
  Search 
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface LayoutProps {
  children: ReactNode;
  user: UserProfile;
}

export default function Layout({ children, user }: LayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut(auth);
    navigate('/');
  };

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard, roles: ['admin', 'manager', 'staff'] },
    { name: 'Inventory', path: '/inventory', icon: Package, roles: ['admin', 'manager', 'staff'] },
    { name: 'Sales/POS', path: '/sales', icon: ShoppingCart, roles: ['admin', 'manager', 'staff'] },
    { name: 'Purchases', path: '/purchases', icon: Truck, roles: ['admin', 'manager'] },
    { name: 'Customers', path: '/customers', icon: Users, roles: ['admin', 'manager', 'staff'] },
    { name: 'Expenses', path: '/expenses', icon: Receipt, roles: ['admin', 'manager'] },
    { name: 'Reports', path: '/reports', icon: BarChart3, roles: ['admin', 'manager'] },
    { name: 'User Management', path: '/user-management', icon: UserCog, roles: ['admin'] },
  ];

  const filteredNavItems = navItems.filter(item => item.roles.includes(user.role));

  return (
    <div className="min-h-screen bg-neutral-50 flex">
      {/* Sidebar */}
      <aside
        className={cn(
          "bg-white border-r border-neutral-200 transition-all duration-300 flex flex-col fixed h-full z-50",
          isSidebarOpen ? "w-64" : "w-20"
        )}
      >
        <div className="p-6 flex items-center justify-between">
          {isSidebarOpen ? (
            <div className="flex flex-col">
              <span className="text-2xl font-bold tracking-tight text-neutral-900">StyleHub</span>
              <span className="text-[10px] uppercase tracking-[0.2em] text-neutral-400 font-sans font-semibold">Control Center</span>
            </div>
          ) : (
            <span className="text-xl font-bold text-neutral-900">SH</span>
          )}
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-1 hover:bg-neutral-100 rounded text-neutral-400">
            {isSidebarOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>

        <nav className="flex-1 mt-6 px-3 space-y-1 overflow-y-auto">
          {filteredNavItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-lg transition-all group relative",
                  isActive 
                    ? "bg-neutral-900 text-white shadow-lg shadow-neutral-200" 
                    : "text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900"
                )}
              >
                <item.icon size={20} className={cn(isActive ? "text-white" : "text-neutral-400 group-hover:text-neutral-900")} />
                {isSidebarOpen && <span className="text-sm font-medium">{item.name}</span>}
                {!isSidebarOpen && (
                  <div className="absolute left-full ml-2 px-2 py-1 bg-neutral-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
                    {item.name}
                  </div>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-neutral-100 space-y-1">
          <Link
            to="/profile"
            className={cn(
              "flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900",
              location.pathname === '/profile' && "bg-neutral-900 text-white shadow-lg shadow-neutral-200"
            )}
          >
            <Settings size={20} className={cn(location.pathname === '/profile' ? "text-white" : "text-neutral-400")} />
            {isSidebarOpen && <span className="text-sm font-medium">Profile Settings</span>}
          </Link>
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900"
          >
            <LogOut size={20} className="text-neutral-400" />
            {isSidebarOpen && <span className="text-sm font-medium">Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className={cn(
        "flex-1 transition-all duration-300",
        isSidebarOpen ? "ml-64" : "ml-20"
      )}>
        {/* Header */}
        <header className="bg-white border-b border-neutral-100 h-20 flex items-center justify-between px-8 sticky top-0 z-40">
          <div className="flex flex-col">
            <span className="text-[10px] uppercase tracking-[0.2em] text-neutral-400 font-bold">Welcome back,</span>
            <span className="text-sm font-bold text-neutral-900">{user.displayName}</span>
          </div>

          <div className="flex items-center gap-6">
            <button className="p-2 text-neutral-400 hover:bg-neutral-50 rounded-full transition-colors">
              <Bell size={20} />
            </button>
            
            <div className="flex items-center gap-4 pl-6 border-l border-neutral-100">
              <div className="flex items-center gap-3 bg-white border border-neutral-100 p-1.5 pr-4 rounded-xl shadow-sm">
                <div className="w-10 h-10 rounded-lg bg-neutral-900 flex items-center justify-center text-white font-bold text-lg">
                  {user.displayName.charAt(0)}
                </div>
                <div className="flex flex-col">
                  <p className="text-xs font-bold text-neutral-900 leading-tight">{user.displayName}</p>
                  <p className="text-[10px] uppercase tracking-wider text-neutral-400 font-medium leading-tight">{user.role}</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
