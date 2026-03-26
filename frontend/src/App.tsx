import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { UserProfile } from './types';
import { getStoredUser, getToken, clearAuth } from './auth';
import api from './api';
import Auth from './components/Auth';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Inventory from './pages/Inventory';
import Sales from './pages/Sales';
import Purchases from './pages/Purchases';
import Customers from './pages/Customers';
import Expenses from './pages/Expenses';
import Reports from './pages/Reports';
import UserManagement from './pages/UserManagement';
import ProfileSettings from './pages/ProfileSettings';

export default function App() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      setLoading(false);
      return;
    }
    // Verify token and get latest profile from backend
    api.get('/auth/me')
      .then((res) => setUser(res.data))
      .catch(() => {
        clearAuth();
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleLogin = (loggedInUser: UserProfile) => {
    setUser(loggedInUser);
  };

  const handleLogout = () => {
    clearAuth();
    setUser(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-neutral-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-neutral-900" />
      </div>
    );
  }

  if (!user) {
    return <Auth onLogin={handleLogin} />;
  }

  return (
    <Router>
      <Layout user={user} onLogout={handleLogout}>
        <Routes>
          <Route path="/" element={<Dashboard user={user} />} />
          <Route path="/inventory" element={<Inventory user={user} />} />
          <Route path="/sales" element={<Sales user={user} />} />
          <Route path="/purchases" element={<Purchases user={user} />} />
          <Route path="/customers" element={<Customers user={user} />} />
          <Route path="/expenses" element={<Expenses user={user} />} />
          <Route path="/reports" element={<Reports user={user} />} />
          <Route path="/user-management" element={<UserManagement user={user} />} />
          <Route path="/profile" element={<ProfileSettings user={user} onUpdate={setUser} />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Layout>
    </Router>
  );
}
