import { useState, useEffect } from 'react';
import { collection, onSnapshot, updateDoc, doc, query, orderBy, limit, deleteDoc } from 'firebase/firestore';
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
  X 
} from 'lucide-react';
import { format } from 'date-fns';
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
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);

  useEffect(() => {
    if (user.role !== 'admin') return;

    const usersUnsubscribe = onSnapshot(collection(db, 'users'), (snapshot) => {
      setUsers(snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as unknown as UserProfile)));
    });

    const logsUnsubscribe = onSnapshot(
      query(collection(db, 'activity_logs'), orderBy('timestamp', 'desc'), limit(50)),
      (snapshot) => {
        setLogs(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ActivityLog)));
      }
    );

    return () => {
      usersUnsubscribe();
      logsUnsubscribe();
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
    <div className="space-y-12 animate-in fade-in duration-500">
      <div className="flex flex-col">
        <h1 className="text-4xl font-serif italic text-neutral-900">User Management</h1>
        <p className="text-neutral-500 mt-1">Manage team roles and monitor system activity</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* User List */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-serif italic text-neutral-900 flex items-center gap-2">
              <User size={20} /> Team Members
            </h2>
            <span className="text-xs font-mono uppercase tracking-widest text-neutral-400">{users.length} TOTAL</span>
          </div>

          <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-neutral-50 border-b border-neutral-100">
                    <th className="px-8 py-4 text-[10px] uppercase tracking-widest text-neutral-400 font-mono">User</th>
                    <th className="px-8 py-4 text-[10px] uppercase tracking-widest text-neutral-400 font-mono">Role</th>
                    <th className="px-8 py-4 text-[10px] uppercase tracking-widest text-neutral-400 font-mono">Joined</th>
                    <th className="px-8 py-4 text-[10px] uppercase tracking-widest text-neutral-400 font-mono text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {users.map((u) => (
                    <tr key={u.uid} className="hover:bg-neutral-50 transition-colors">
                      <td className="px-8 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-neutral-900 flex items-center justify-center text-white font-serif italic text-lg">
                            {u.displayName.charAt(0)}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-neutral-900">{u.displayName}</span>
                            <span className="text-xs text-neutral-500">{u.email}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-4">
                        <select
                          value={u.role}
                          onChange={(e) => handleRoleChange(u.uid, e.target.value)}
                          disabled={u.uid === user.uid}
                          className={cn(
                            "text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-lg border focus:outline-none transition-all",
                            u.role === 'admin' ? "bg-purple-50 text-purple-600 border-purple-100" :
                            u.role === 'manager' ? "bg-blue-50 text-blue-600 border-blue-100" :
                            "bg-neutral-50 text-neutral-600 border-neutral-100"
                          )}
                        >
                          <option value="admin">Admin</option>
                          <option value="manager">Manager</option>
                          <option value="staff">Staff</option>
                        </select>
                      </td>
                      <td className="px-8 py-4 text-xs text-neutral-500 font-mono">
                        {format(new Date(u.createdAt), 'MMM d, yyyy')}
                      </td>
                      <td className="px-8 py-4 text-right">
                        {u.uid !== user.uid && (
                          <button 
                            onClick={() => {
                              setUserToDelete(u.uid);
                              setIsDeleteConfirmOpen(true);
                            }}
                            className="p-2 text-neutral-300 hover:text-red-600 transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Activity Logs */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-serif italic text-neutral-900 flex items-center gap-2">
              <History size={20} /> System Logs
            </h2>
            <span className="text-xs font-mono uppercase tracking-widest text-neutral-400">LAST 50</span>
          </div>

          <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden flex flex-col h-[calc(100vh-350px)]">
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {logs.map((log) => (
                <div key={log.id} className="relative pl-6 border-l border-neutral-100">
                  <div className="absolute left-[-5px] top-0 w-2 h-2 rounded-full bg-neutral-900"></div>
                  <div className="flex flex-col">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-neutral-900">{log.userName}</span>
                      <span className="text-[10px] text-neutral-400 font-mono">{format(new Date(log.timestamp), 'h:mm a')}</span>
                    </div>
                    <p className="text-xs text-neutral-500 leading-relaxed">{log.action}</p>
                    <span className="text-[10px] text-neutral-300 font-mono mt-1 uppercase tracking-widest">
                      {format(new Date(log.timestamp), 'MMM d, yyyy')}
                    </span>
                  </div>
                </div>
              ))}
              {logs.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-neutral-300 italic text-sm">
                  No activity recorded yet
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

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
