
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

// --- CLOUD API SIMULATION HELPERS ---
// In a real app, these would be API endpoints (e.g., https://api.myapp.com/v1/...)
const SIMULATED_NETWORK_DELAY_MS = 800; 

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * SIMULATED CLOUD INIT
 * In a real scenario, this might check API health or do nothing.
 */
export const initUsers = async (): Promise<void> => {
  await delay(500); // Simulate connection
  const existing = localStorage.getItem(USERS_STORAGE_KEY);
  if (!existing) {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify([DEFAULT_ADMIN]));
  }
};

/**
 * GET ALL USERS (Cloud Version)
 * Replaces: Sync localStorage.getItem
 */
export const getUsers = async (): Promise<User[]> => {
  await delay(SIMULATED_NETWORK_DELAY_MS);
  
  // TODO: Replace with real Cloud API call
  // const response = await fetch('https://api.your-cloudbase.com/users');
  // return await response.json();

  const existing = localStorage.getItem(USERS_STORAGE_KEY);
  return existing ? JSON.parse(existing) : [];
};

/**
 * SAVE/UPDATE USER (Cloud Version)
 * Replaces: Sync localStorage.setItem
 */
export const saveUser = async (user: User): Promise<void> => {
  await delay(SIMULATED_NETWORK_DELAY_MS);

  // TODO: Replace with real Cloud API call
  // await fetch('https://api.your-cloudbase.com/users', { method: 'POST', body: JSON.stringify(user) });

  let users = JSON.parse(localStorage.getItem(USERS_STORAGE_KEY) || '[]');
  const index = users.findIndex((u: User) => u.id === user.id);
  
  if (index >= 0) {
    users[index] = user;
  } else {
    users.push(user);
  }
  
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
};

/**
 * DELETE USER (Cloud Version)
 */
export const deleteUser = async (userId: string): Promise<void> => {
  await delay(SIMULATED_NETWORK_DELAY_MS);

  // TODO: Replace with real Cloud API call
  // await fetch(`https://api.your-cloudbase.com/users/${userId}`, { method: 'DELETE' });

  let users = JSON.parse(localStorage.getItem(USERS_STORAGE_KEY) || '[]');
  
  const userToDelete = users.find((u: User) => u.id === userId);
  if (userToDelete?.username === 'admin') {
    throw new Error("Cannot delete the default Super Admin.");
  }

  users = users.filter((u: User) => u.id !== userId);
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
};

/**
 * LOGIN (Cloud Version)
 * Returns the User object if successful, or throws an error.
 */
export const loginUser = async (username: string, password: string): Promise<User> => {
  await delay(1000); // Login usually takes a bit longer

  // TODO: Replace with real Cloud API call
  // const response = await fetch('https://api.your-cloudbase.com/login', { ... });
  // const data = await response.json();

  const users = JSON.parse(localStorage.getItem(USERS_STORAGE_KEY) || '[]');
  const user = users.find((u: User) => u.username.toLowerCase() === username.toLowerCase() && u.password === password);
  
  if (user) {
    // In a real app, you would save a JWT token here, not the whole user object
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
    return user;
  }
  
  throw new Error("Invalid username or password");
};

/**
 * LOGOUT
 * Clears local session.
 */
export const logoutUser = (): void => {
  localStorage.removeItem(CURRENT_USER_KEY);
};

/**
 * GET CURRENT SESSION
 * Checks if a user is already logged in locally.
 */
export const getCurrentUser = (): User | null => {
  const stored = localStorage.getItem(CURRENT_USER_KEY);
  return stored ? JSON.parse(stored) : null;
};
