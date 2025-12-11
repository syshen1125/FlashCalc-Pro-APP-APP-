import React, { useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { getUsers, saveUser, deleteUser } from '../utils/authUtils';
import { Users, UserPlus, Edit2, Trash2, X, Shield, ShieldAlert, AlertTriangle } from 'lucide-react';

interface Props {
  onClose: () => void;
}

export const AdminPanel: React.FC<Props> = ({ onClose }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<Partial<User>>({});
  
  // Delete Modal State
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState('');

  useEffect(() => {
    refreshUsers();
  }, []);

  const refreshUsers = () => {
    setUsers(getUsers());
  };

  const handleEdit = (user: User) => {
    setCurrentUser(user);
    setIsModalOpen(true);
  };

  const handleAddNew = () => {
    setCurrentUser({
      id: Date.now().toString(),
      role: UserRole.USER,
      username: '',
      password: '',
      name: ''
    });
    setIsModalOpen(true);
  };

  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser.username || !currentUser.password || !currentUser.name) {
      alert("All fields are required");
      return;
    }

    saveUser(currentUser as User);
    setIsModalOpen(false);
    refreshUsers();
  };

  const handleInitDelete = (userId: string) => {
    setUserToDelete(userId);
    setDeleteConfirmationText('');
    setShowDeleteModal(true);
  };

  const executeDelete = () => {
    if (deleteConfirmationText.toLowerCase().trim() !== 'delete') {
      alert("Please type 'delete' correctly to confirm.");
      return;
    }

    if (userToDelete) {
      try {
        deleteUser(userToDelete);
        refreshUsers();
      } catch (e: any) {
        alert(e.message);
      }
    }
    
    setShowDeleteModal(false);
    setUserToDelete(null);
  };

  return (
    <div className="max-w-6xl mx-auto p-6 bg-slate-800 rounded-xl shadow-2xl border border-slate-700 h-[90vh] flex flex-col relative">
      <div className="flex justify-between items-center mb-8 border-b border-slate-700 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-600/20 rounded-lg">
            <Shield className="text-purple-400" size={32} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Super Admin Dashboard</h1>
            <p className="text-slate-400 text-sm">User Management</p>
          </div>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-slate-700 rounded-full transition text-slate-400 hover:text-white">
          <X size={24} />
        </button>
      </div>

      <div className="mb-6 flex justify-end">
        <button 
          onClick={handleAddNew}
          className="flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-lg transition shadow-lg shadow-green-500/20 font-bold"
        >
          <UserPlus size={20} />
          Add New User
        </button>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar bg-slate-900/50 rounded-lg border border-slate-700">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-700/50 text-slate-300 text-sm uppercase sticky top-0 backdrop-blur-sm">
              <th className="p-4">Name</th>
              <th className="p-4">Username</th>
              <th className="p-4">Role</th>
              <th className="p-4">Password</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id} className="border-b border-slate-700 hover:bg-slate-800/50 transition">
                <td className="p-4 font-bold text-white flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs ${user.role === UserRole.ADMIN ? 'bg-purple-600' : 'bg-cyan-600'}`}>
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  {user.name}
                </td>
                <td className="p-4 text-slate-300 font-mono text-sm">{user.username}</td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded text-xs font-bold ${user.role === UserRole.ADMIN ? 'bg-purple-900/50 text-purple-300 border border-purple-700' : 'bg-cyan-900/50 text-cyan-300 border border-cyan-700'}`}>
                    {user.role}
                  </span>
                </td>
                <td className="p-4 text-slate-500 font-mono text-sm">••••••</td>
                <td className="p-4 text-right flex gap-2 justify-end">
                  <button 
                    onClick={() => handleEdit(user)}
                    className="p-2 bg-blue-600/20 text-blue-400 hover:bg-blue-600 hover:text-white rounded transition"
                    title="Edit User"
                  >
                    <Edit2 size={16} />
                  </button>
                  {user.username !== 'admin' && (
                    <button 
                      onClick={() => handleInitDelete(user.id)}
                      className="p-2 bg-red-600/20 text-red-400 hover:bg-red-600 hover:text-white rounded transition"
                      title="Delete User"
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

      {/* EDIT/ADD MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-800 p-8 rounded-xl border border-slate-600 shadow-2xl max-w-md w-full animate-in zoom-in-95">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              {currentUser.id ? <Edit2 size={20} /> : <UserPlus size={20} />}
              {currentUser.id && currentUser.username ? 'Edit User' : 'Add New User'}
            </h2>
            <form onSubmit={handleSaveUser} className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1">Full Name</label>
                <input 
                  type="text" 
                  value={currentUser.name || ''} 
                  onChange={e => setCurrentUser({...currentUser, name: e.target.value})}
                  className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Username</label>
                <input 
                  type="text" 
                  value={currentUser.username || ''} 
                  onChange={e => setCurrentUser({...currentUser, username: e.target.value})}
                  className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Password</label>
                <input 
                  type="text" 
                  value={currentUser.password || ''} 
                  onChange={e => setCurrentUser({...currentUser, password: e.target.value})}
                  className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white focus:ring-2 focus:ring-blue-500 outline-none font-mono"
                  required
                  placeholder="Enter password"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Role</label>
                <select 
                  value={currentUser.role}
                  onChange={e => setCurrentUser({...currentUser, role: e.target.value as UserRole})}
                  className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value={UserRole.USER}>User (Standard)</option>
                  <option value={UserRole.ADMIN}>Super Admin</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded bg-slate-700 hover:bg-slate-600 text-white transition"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-500 text-white font-bold transition"
                >
                  Save User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-800 p-6 rounded-lg border border-red-500/50 shadow-2xl max-w-sm w-full animate-in zoom-in-95">
            <div className="flex items-center gap-2 text-red-400 mb-4">
              <AlertTriangle size={24} />
              <h3 className="text-xl font-bold">Delete User?</h3>
            </div>
            
            <p className="text-slate-300 mb-4 text-sm">
              This will permanently delete the user account. To confirm, please type <span className="font-mono font-bold text-white bg-slate-700 px-1 rounded">delete</span> below.
            </p>

            <input
              type="text"
              value={deleteConfirmationText}
              onChange={(e) => setDeleteConfirmationText(e.target.value)}
              placeholder="Type delete"
              className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white focus:ring-2 focus:ring-red-500 outline-none mb-6"
              autoFocus
            />

            <div className="flex gap-3 justify-end">
              <button 
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 rounded bg-slate-700 hover:bg-slate-600 text-white transition"
              >
                Cancel
              </button>
              <button 
                onClick={executeDelete}
                className="px-4 py-2 rounded bg-red-600 hover:bg-red-500 text-white font-bold transition flex items-center gap-2"
              >
                <Trash2 size={16} />
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
