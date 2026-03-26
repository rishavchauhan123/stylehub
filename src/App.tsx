import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from './firebase';
import { UserProfile } from './types';
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
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
        if (userDoc.exists()) {
          setUser(userDoc.data() as UserProfile);
        } else {
          // Handle first-time login for admin email
          const isDefaultAdmin = firebaseUser.email === 'rishavchauhan2407@gmail.com';
          const newUser: UserProfile = {
            uid: firebaseUser.uid,
            email: firebaseUser.email || '',
            displayName: firebaseUser.displayName || 'User',
            role: isDefaultAdmin ? 'admin' : 'staff',
            createdAt: new Date().toISOString(),
          };
          await setDoc(doc(db, 'users', firebaseUser.uid), newUser);
          setUser(newUser);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-neutral-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-neutral-900"></div>
      </div>
    );
  }

  if (!user) {
    return <Auth />;
  }

  return (
    <Router>
      <Layout user={user}>
        <Routes>
          <Route path="/" element={<Dashboard user={user} />} />
          <Route path="/inventory" element={<Inventory user={user} />} />
          <Route path="/sales" element={<Sales user={user} />} />
          <Route path="/purchases" element={<Purchases user={user} />} />
          <Route path="/customers" element={<Customers user={user} />} />
          <Route path="/expenses" element={<Expenses user={user} />} />
          <Route path="/reports" element={<Reports user={user} />} />
          <Route path="/user-management" element={<UserManagement user={user} />} />
          <Route path="/profile" element={<ProfileSettings user={user} />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Layout>
    </Router>
  );
}
