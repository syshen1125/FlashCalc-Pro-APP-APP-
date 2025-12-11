
import { User, UserRole } from '../types';

const USERS_STORAGE_KEY = 'flashCalcUsers';
const CURRENT_USER_KEY = 'flashCalcCurrentUser';

// Default Super Admin credentials
const DEFAULT_ADMIN: User = {
  id: 'super-admin-001',
  username: 'admin',
  password: 'admin123',
  name: 'Super Administrator',
  role: UserRole.ADMIN,
  createdAt: Date.now()
};

export const initUsers = () => {
  const existing = localStorage.getItem(USERS_STORAGE_KEY);
  if (!existing) {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify([DEFAULT_ADMIN]));
  }
};

export const getUsers = (): User[] => {
  const existing = localStorage.getItem(USERS_STORAGE_KEY);
  return existing ? JSON.parse(existing) : [];
};

export const saveUser = (user: User) => {
  const users = getUsers();
  const index = users.findIndex(u => u.id === user.id);
  
  if (index >= 0) {
    users[index] = user;
  } else {
    users.push(user);
  }
  
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
};

export const deleteUser = (userId: string) => {
  let users = getUsers();
  // Prevent deleting the last admin
  const userToDelete = users.find(u => u.id === userId);
  if (userToDelete?.username === 'admin') {
    throw new Error("Cannot delete the default Super Admin.");
  }

  users = users.filter(u => u.id !== userId);
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
};

export const loginUser = (username: string, password: string): User | null => {
  const users = getUsers();
  const user = users.find(u => u.username.toLowerCase() === username.toLowerCase() && u.password === password);
  
  if (user) {
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
    return user;
  }
  return null;
};

export const logoutUser = () => {
  localStorage.removeItem(CURRENT_USER_KEY);
};

export const getCurrentUser = (): User | null => {
  const stored = localStorage.getItem(CURRENT_USER_KEY);
  return stored ? JSON.parse(stored) : null;
};
