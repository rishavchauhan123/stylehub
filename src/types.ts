export type UserRole = 'admin' | 'manager' | 'staff';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  createdAt: string;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  category: 'Men' | 'Women' | 'Accessories';
  costPrice: number;
  sellingPrice: number;
  stock: number;
  lowStockThreshold: number;
  variants: { size: string; color: string }[];
  createdAt: string;
}

export interface SaleItem {
  productId: string;
  name: string;
  quantity: number;
  price: number;
  cost: number;
}

export interface Sale {
  id: string;
  invoiceNumber: string;
  customerId?: string;
  customerName?: string;
  items: SaleItem[];
  total: number;
  profit: number;
  paymentMethod: 'Cash' | 'Card' | 'UPI';
  createdAt: string;
}

export interface PurchaseItem {
  productId: string;
  quantity: number;
  cost: number;
}

export interface Purchase {
  id: string;
  supplierName: string;
  items: PurchaseItem[];
  total: number;
  createdAt: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  totalSpent: number;
  lastPurchaseAt?: string;
}

export interface Expense {
  id: string;
  category: string;
  amount: number;
  description: string;
  date: string;
}

export interface ActivityLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  timestamp: string;
}
