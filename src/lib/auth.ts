import { UserAccount } from '../types';
import { getAllRecords, putRecord, deleteRecord } from './db';

const SESSION_KEY = 'ebcc_session';

export function getSessionUser(): UserAccount | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveSessionUser(user: UserAccount | null): void {
  try {
    if (user) {
      localStorage.setItem(SESSION_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(SESSION_KEY);
    }
  } catch (e) {
    console.error('saveSessionUser error:', e);
  }
}

export async function initDefaultUser(): Promise<void> {
  const users = await getAllRecords<UserAccount>('users');
  
  // Ensure we have Admin/1 demo user
  const hasAdmin = users.some(u => u.username.toLowerCase() === 'admin');
  if (!hasAdmin) {
    const adminUser: UserAccount = {
      id: 'u_admin',
      username: 'Admin',
      password: '1',
      displayName: 'System Admin',
      role: 'superadmin',
    };
    await putRecord<UserAccount>('users', adminUser);
  }

  // Ensure fallback superadmin
  const hasSuperAdmin = users.some(u => u.username.toLowerCase() === 'superadmin');
  if (!hasSuperAdmin && users.length === 0) {
    const defaultSuperAdmin: UserAccount = {
      id: 'u1',
      username: 'superadmin',
      password: 'admin123',
      displayName: 'Super Admin',
      role: 'superadmin',
    };
    await putRecord<UserAccount>('users', defaultSuperAdmin);
  }
}

export async function loginUser(username: string, password?: string): Promise<UserAccount | null> {
  const users = await getAllRecords<UserAccount>('users');
  const normalizedUsername = username.trim().toLowerCase();
  
  const found = users.find(u => u.username.toLowerCase() === normalizedUsername && u.password === password);
  if (found) {
    saveSessionUser(found);
    return found;
  }
  return null;
}

export async function registerUserAccount(user: UserAccount): Promise<void> {
  await putRecord<UserAccount>('users', user);
}

export async function removeUserAccount(id: string): Promise<void> {
  await deleteRecord('users', id);
}
