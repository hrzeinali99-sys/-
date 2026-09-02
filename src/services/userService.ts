import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  setDoc, 
  deleteDoc, 
  query, 
  orderBy 
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { AppUser, UserRole } from '../types';
import { toJalaliDate } from '../utils/persianDate';
import { logAuditEvent } from './auditService';

const USERS_STORAGE_KEY = 'hrms_app_users';

export const DEFAULT_SYSTEM_USERS: AppUser[] = [
  {
    id: 'user-1',
    username: 'admin',
    password: 'admin',
    displayName: 'مدیر سیستم',
    email: 'admin@company.ir',
    role: 'super_admin',
    departmentId: 'dept-1',
    departmentName: 'منابع انسانی و توسعه سازمانی',
    status: 'active',
    phoneNumber: '09123456789',
    createdAt: new Date().toISOString(),
    createdAtJalali: '۱۴۰۳/۰۱/۰۱',
    customPermissions: ['all']
  },
  {
    id: 'user-2',
    username: 'm.soleimani',
    password: 'password123',
    displayName: 'دکتر مریم سلیمانی',
    email: 'm.soleimani@company.ir',
    role: 'hr_admin',
    departmentId: 'dept-1',
    departmentName: 'منابع انسانی و توسعه سازمانی',
    status: 'active',
    phoneNumber: '09121112233',
    createdAt: new Date().toISOString(),
    createdAtJalali: '۱۴۰۳/۰۲/۱۵'
  },
  {
    id: 'user-3',
    username: 'a.taheri',
    password: 'password123',
    displayName: 'مهندس آرش طاهری',
    email: 'a.taheri@company.ir',
    role: 'department_manager',
    departmentId: 'dept-2',
    departmentName: 'مهندسی نرم‌افزار و هوش مصنوعی',
    status: 'active',
    phoneNumber: '09124445566',
    createdAt: new Date().toISOString(),
    createdAtJalali: '۱۴۰۳/۰۳/۱۰'
  },
  {
    id: 'user-4',
    username: 'a.asadi',
    password: 'password123',
    displayName: 'علیرضا اسدی',
    email: 'a.asadi@company.ir',
    role: 'finance',
    departmentId: 'dept-5',
    departmentName: 'امور مالی، حسابداری و حقوق‌دستمزد',
    status: 'active',
    phoneNumber: '09127778899',
    createdAt: new Date().toISOString(),
    createdAtJalali: '۱۴۰۳/۰۴/۰۱'
  },
  {
    id: 'user-5',
    username: 'k.bagheri',
    password: 'password123',
    displayName: 'شیدا باقری',
    email: 'sh.bagheri@company.ir',
    role: 'hr_manager',
    departmentId: 'dept-1',
    departmentName: 'منابع انسانی و توسعه سازمانی',
    status: 'active',
    phoneNumber: '09128889900',
    createdAt: new Date().toISOString(),
    createdAtJalali: '۱۴۰۳/۰۵/۱۲'
  }
];

function getLocalUsers(): AppUser[] {
  try {
    const raw = localStorage.getItem(USERS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Could not read users from localStorage:', e);
  }
  return DEFAULT_SYSTEM_USERS;
}

function saveLocalUsers(users: AppUser[]): void {
  try {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
  } catch (e) {
    console.warn('Could not write users to localStorage:', e);
  }
}

/**
 * Fetch all application users
 */
export async function getAppUsers(): Promise<AppUser[]> {
  try {
    const snap = await getDocs(collection(db, 'app_users'));
    if (!snap.empty) {
      const users = snap.docs.map(d => ({ id: d.id, ...d.data() } as AppUser));
      saveLocalUsers(users);
      return users;
    }
  } catch (error) {
    console.warn('Error fetching users from Firestore, using local cache:', error);
  }

  const local = getLocalUsers();
  return local;
}

/**
 * Create a new user with username, password, and role
 */
export async function createAppUser(userData: Omit<AppUser, 'id' | 'createdAt' | 'createdAtJalali'>): Promise<AppUser> {
  const users = await getAppUsers();
  
  // Check if username already exists
  const normalizedUsername = userData.username.trim().toLowerCase();
  const existing = users.find(u => u.username.trim().toLowerCase() === normalizedUsername);
  if (existing) {
    throw new Error(`نام کاربری "${userData.username}" قبلاً در سیستم ثبت شده است.`);
  }

  const id = `user-${Date.now()}`;
  const now = new Date().toISOString();
  const jalali = toJalaliDate(now);

  const newUser: AppUser = {
    ...userData,
    id,
    username: normalizedUsername,
    createdAt: now,
    createdAtJalali: jalali,
    status: userData.status || 'active'
  };

  try {
    await setDoc(doc(db, 'app_users', id), newUser);
  } catch (error) {
    console.warn('Error persisting user to Firestore:', error);
  }

  // Update local storage
  const updatedList = [newUser, ...users.filter(u => u.id !== id)];
  saveLocalUsers(updatedList);

  await logAuditEvent({
    userId: 'system',
    userName: 'مدیر ارشد سامانه',
    userRole: 'super_admin',
    action: 'CREATE',
    entityType: 'user',
    entityId: id,
    description: `کاربر جدید با نام کاربری ${newUser.username} و نقش ${newUser.role} توسط مدیر سیستم ایجاد شد.`
  });

  return newUser;
}

/**
 * Update an existing user
 */
export async function updateAppUser(id: string, updates: Partial<AppUser>): Promise<AppUser> {
  const users = await getAppUsers();
  const index = users.findIndex(u => u.id === id);
  if (index === -1) {
    throw new Error('کاربر مورد نظر یافت نشد.');
  }

  // Check username uniqueness if changed
  if (updates.username) {
    const normalizedUsername = updates.username.trim().toLowerCase();
    const existing = users.find(u => u.id !== id && u.username.trim().toLowerCase() === normalizedUsername);
    if (existing) {
      throw new Error(`نام کاربری "${updates.username}" قبلاً توسط کاربر دیگری انتخاب شده است.`);
    }
  }

  const updatedUser: AppUser = {
    ...users[index],
    ...updates
  };

  try {
    await setDoc(doc(db, 'app_users', id), updatedUser, { merge: true });
  } catch (error) {
    console.warn('Error updating user in Firestore:', error);
  }

  users[index] = updatedUser;
  saveLocalUsers(users);

  await logAuditEvent({
    userId: 'system',
    userName: 'مدیر ارشد سامانه',
    userRole: 'super_admin',
    action: 'UPDATE',
    entityType: 'user',
    entityId: id,
    description: `اطلاعات کاربر ${updatedUser.username} بروزرسانی شد.`
  });

  return updatedUser;
}

/**
 * Delete a user
 */
export async function deleteAppUser(id: string): Promise<void> {
  const users = await getAppUsers();
  const target = users.find(u => u.id === id);

  if (target?.username === 'admin') {
    throw new Error('حذف کاربر پیش‌فرض مدیر ارشد (admin) مجاز نمی‌باشد.');
  }

  try {
    await deleteDoc(doc(db, 'app_users', id));
  } catch (error) {
    console.warn('Error deleting user from Firestore:', error);
  }

  const updated = users.filter(u => u.id !== id);
  saveLocalUsers(updated);

  if (target) {
    await logAuditEvent({
      userId: 'system',
      userName: 'مدیر ارشد سامانه',
      userRole: 'super_admin',
      action: 'DELETE',
      entityType: 'user',
      entityId: id,
      description: `حساب کاربری ${target.username} (${target.displayName}) از سیستم حذف گردید.`
    });
  }
}

/**
 * Authenticate with username and password
 */
export async function verifyUserCredentials(username: string, pass: string): Promise<AppUser | null> {
  const users = await getAppUsers();
  const normalized = username.trim().toLowerCase();
  const cleanPass = pass.trim();

  // Special check for system admin alias (admin or مدیر سیستم) with password 'admin'
  if ((normalized === 'admin' || normalized === 'مدیر سیستم' || normalized === 'مدیرسیستم') && cleanPass === 'admin') {
    const adminUser = users.find(u => u.username.toLowerCase() === 'admin') || DEFAULT_SYSTEM_USERS[0];
    const now = new Date().toISOString();
    updateAppUser(adminUser.id, { lastLogin: now, password: 'admin' }).catch(() => {});
    return {
      ...adminUser,
      displayName: adminUser.displayName || 'مدیر سیستم',
      password: 'admin'
    };
  }

  const matched = users.find(u => 
    (u.username.trim().toLowerCase() === normalized || 
     (u.displayName && u.displayName.trim().toLowerCase() === normalized)) && 
    u.password === cleanPass
  );
  
  if (matched && matched.status === 'active') {
    // update lastLogin
    const now = new Date().toISOString();
    updateAppUser(matched.id, { lastLogin: now }).catch(() => {});
    return matched;
  }
  return null;
}
