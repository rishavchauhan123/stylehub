import { useState, useEffect } from 'react';
import { collection, onSnapshot, updateDoc, doc, query, orderBy, limit, deleteDoc, setDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { UserProfile, ActivityLog } from '../types';
import { 
  UserCog, 
  Shield, 
  Trash2, 
  History, 
  User, 
  Mail, 
  Calendar, 
  CheckCircle2, 
  XCircle, 
  X,
  Plus,
  Search,
  MoreVertical,
  Edit2
} from 'lucide-react';
import { format, subDays, isAfter } from 'date-fns';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface UserManagementProps {
  user: UserProfile;
}

export default function UserManagement({ user }: UserManagementProps) {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    role: 'staff' as any
  });

  useEffect(() => {
    if (user.role !== 'admin') return;

    const usersUnsubscribe = onSnapshot(collection(db, 'users'), (snapshot) => {
      setUsers(snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as unknown as UserProfile)));
    });

    return () => {
      usersUnsubscribe();
    };
  }, [user.role]);

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      await updateDoc(doc(db, 'users', userId), { role: newRole });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'users');
    }
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    try {
      await deleteDoc(doc(db, 'users', userToDelete));
      setIsDeleteConfirmOpen(false);
      setUserToDelete(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'users');
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // In a real app, we'd use a Cloud Function to create the Firebase Auth user.
      // For this demo, we'll just add to the Firestore 'users' collection.
      // The user would still need to sign up or the admin would need to use Admin SDK.
      const userUid = Math.random().toString(36).substring(7); // Mock UID
      const userProfile: UserProfile = {
        uid: userUid,
        email: newUser.email,
        displayName: newUser.name,
        role: newUser.role,
        phone: newUser.phone,
        status: 'Active',
        createdAt: new Date().toISOString(),
      };
      await setDoc(doc(db, 'users', userUid), userProfile);
      setIsAddModalOpen(false);
      setNewUser({ name: '', email: '', phone: '', password: '', role: 'staff' });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'users');
    }
  };

  const recentActivityUsers = users
    .filter(u => u.lastLoginAt && isAfter(new Date(u.lastLoginAt), subDays(new Date(), 2)))
    .sort((a, b) => new Date(b.lastLoginAt!).getTime() - new Date(a.lastLoginAt!).getTime());

  if (user.role !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)] text-center space-y-4">
        <div className="p-6 bg-red-50 text-red-600 rounded-full">
          <Shield size={64} />
        </div>
        <h2 className="text-3xl font-serif italic text-neutral-900">Access Denied</h2>
        <p className="text-neutral-500 max-w-md">
          Only administrators can access user management and system logs.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div className="flex flex-col">
          <h1 className="text-5xl font-bold text-neutral-900 tracking-tight">User Management</h1>
          <p className="text-neutral-400 mt-2 font-medium">{users.length} team members</p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 px-8 py-3.5 bg-neutral-900 text-white rounded-md font-bold text-[10px] uppercase tracking-[0.2em] hover:bg-neutral-800 transition-all shadow-lg shadow-neutral-200"
        >
          <Plus size={16} />
          ADD USER
        </button>
      </div>

      {/* All Users Table */}
      <div className="bg-white rounded-md border border-neutral-200 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-neutral-100">
          <h2 className="text-xl font-bold text-neutral-900">All Users</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-neutral-50 border-b border-neutral-200">
                <th className="px-8 py-5 text-[10px] uppercase tracking-[0.2em] text-neutral-400 font-bold">NAME</th>
                <th className="px-8 py-5 text-[10px] uppercase tracking-[0.2em] text-neutral-400 font-bold">EMAIL</th>
                <th className="px-8 py-5 text-[10px] uppercase tracking-[0.2em] text-neutral-400 font-bold">PHONE</th>
                <th className="px-8 py-5 text-[10px] uppercase tracking-[0.2em] text-neutral-400 font-bold">ROLE</th>
                <th className="px-8 py-5 text-[10px] uppercase tracking-[0.2em] text-neutral-400 font-bold">STATUS</th>
                <th className="px-8 py-5 text-[10px] uppercase tracking-[0.2em] text-neutral-400 font-bold">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {users.map((u) => (
                <tr key={u.uid} className="hover:bg-neutral-50 transition-colors group">
                  <td className="px-8 py-5">
                    <span className="text-sm font-bold text-neutral-900">{u.displayName}</span>
                  </td>
                  <td className="px-8 py-5 text-sm text-neutral-500">{u.email}</td>
                  <td className="px-8 py-5 text-sm text-neutral-500">{u.phone || '-'}</td>
                  <td className="px-8 py-5">
                    <select
                      value={u.role}
                      onChange={(e) => handleRoleChange(u.uid, e.target.value)}
                      disabled={u.uid === user.uid}
                      className="text-xs font-bold text-neutral-900 bg-transparent focus:outline-none"
                    >
                      <option value="admin">Admin</option>
                      <option value="manager">Manager</option>
                      <option value="staff">Staff</option>
                    </select>
                  </td>
                  <td className="px-8 py-5">
                    <span className={cn(
                      "text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-full",
                      u.status === 'Active' ? "text-emerald-600 bg-emerald-50" : "text-neutral-400 bg-neutral-50"
                    )}>
                      {u.status || 'Active'}
                    </span>
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="p-2 text-neutral-400 hover:text-neutral-900 hover:bg-white rounded-lg transition-all">
                        <Edit2 size={16} />
                      </button>
                      {u.uid !== user.uid && (
                        <button 
                          onClick={() => {
                            setUserToDelete(u.uid);
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
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Activity Section */}
      <div className="bg-white rounded-md border border-neutral-200 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-neutral-100">
          <h2 className="text-xl font-bold text-neutral-900">Recent Activity (Last 2 Days)</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-neutral-50 border-b border-neutral-200">
                <th className="px-8 py-5 text-[10px] uppercase tracking-[0.2em] text-neutral-400 font-bold">NAME</th>
                <th className="px-8 py-5 text-[10px] uppercase tracking-[0.2em] text-neutral-400 font-bold">EMAIL</th>
                <th className="px-8 py-5 text-[10px] uppercase tracking-[0.2em] text-neutral-400 font-bold">ROLE</th>
                <th className="px-8 py-5 text-[10px] uppercase tracking-[0.2em] text-neutral-400 font-bold">LAST LOGIN</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {recentActivityUsers.map((u) => (
                <tr key={u.uid} className="hover:bg-neutral-50 transition-colors">
                  <td className="px-8 py-5">
                    <span className="text-sm font-bold text-neutral-900">{u.displayName}</span>
                  </td>
                  <td className="px-8 py-5 text-sm text-neutral-500">{u.email}</td>
                  <td className="px-8 py-5 text-sm text-neutral-500 capitalize">{u.role}</td>
                  <td className="px-8 py-5 text-sm text-neutral-500">
                    {u.lastLoginAt ? format(new Date(u.lastLoginAt), 'MMM d, yyyy h:mm a') : '-'}
                  </td>
                </tr>
              ))}
              {recentActivityUsers.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-8 py-20 text-center text-neutral-400 font-medium">No recent activity</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add User Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-sm shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-8 border-b border-neutral-100 flex items-center justify-between">
              <h2 className="text-xl font-bold text-neutral-900">Add New User</h2>
              <button onClick={() => setIsAddModalOpen(false)} className="p-2 hover:bg-neutral-100 rounded-full transition-colors text-neutral-400">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleAddUser} className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-[0.15em] text-neutral-900">NAME</label>
                <input
                  required
                  type="text"
                  value={newUser.name}
                  onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                  className="w-full px-4 py-3 bg-white border border-neutral-200 rounded-sm focus:outline-none focus:ring-1 focus:ring-neutral-900"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-[0.15em] text-neutral-900">EMAIL</label>
                <input
                  required
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  className="w-full px-4 py-3 bg-white border border-neutral-200 rounded-sm focus:outline-none focus:ring-1 focus:ring-neutral-900"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-[0.15em] text-neutral-900">PHONE</label>
                <input
                  type="tel"
                  value={newUser.phone}
                  onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })}
                  className="w-full px-4 py-3 bg-white border border-neutral-200 rounded-sm focus:outline-none focus:ring-1 focus:ring-neutral-900"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-[0.15em] text-neutral-900">PASSWORD</label>
                <input
                  required
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  className="w-full px-4 py-3 bg-white border border-neutral-200 rounded-sm focus:outline-none focus:ring-1 focus:ring-neutral-900"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-[0.15em] text-neutral-900">ROLE</label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value as any })}
                  className="w-full px-4 py-3 bg-white border border-neutral-200 rounded-sm focus:outline-none focus:ring-1 focus:ring-neutral-900 appearance-none"
                >
                  <option value="admin">Admin</option>
                  <option value="manager">Manager</option>
                  <option value="staff">Staff</option>
                </select>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 py-4 border border-neutral-200 text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-900 hover:bg-neutral-50 transition-colors"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  className="flex-1 py-4 bg-neutral-900 text-white text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-neutral-800 transition-all"
                >
                  CREATE USER
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete User Confirmation */}
      {isDeleteConfirmOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-8 animate-in zoom-in-95 duration-200 text-center">
            <div className="flex flex-col items-center space-y-4">
              <div className="p-4 bg-red-50 text-red-600 rounded-full">
                <XCircle size={48} />
              </div>
              <h3 className="text-2xl font-serif italic text-neutral-900">Remove Team Member?</h3>
              <p className="text-neutral-500">
                Are you sure you want to remove this user? They will lose all access to the system immediately.
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
                onClick={handleDeleteUser}
                className="flex-1 py-3 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition-all shadow-lg shadow-red-100"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
