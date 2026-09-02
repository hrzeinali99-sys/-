import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut as fbSignOut, 
  User 
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, googleProvider, db } from '../lib/firebase';
import { UserProfile, UserRole } from '../types';
import { verifyUserCredentials } from '../services/userService';
import { logAuditEvent } from '../services/auditService';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  role: UserRole;
  isAuthenticated: boolean;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, pass: string) => Promise<void>;
  signInWithUsernameOrEmail: (usernameOrEmail: string, pass: string) => Promise<void>;
  signUpWithEmail: (email: string, pass: string, name: string, role?: UserRole) => Promise<void>;
  loginAsDemoUser: (demoRole: UserRole) => void;
  signOut: () => Promise<void>;
  switchRole: (newRole: UserRole) => void;
  canAccess: (permission: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const DEMO_PROFILES: Record<UserRole, UserProfile> = {
  super_admin: {
    uid: 'admin-super',
    email: 'admin@company.ir',
    displayName: 'مدیر سیستم',
    role: 'super_admin',
    departmentId: 'dept-1',
    departmentName: 'مدیریت ارشد سامانه',
    photoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    createdAt: new Date().toISOString()
  },
  hr_admin: {
    uid: 'admin-hr',
    email: 'hr.admin@company.ir',
    displayName: 'سرکار خانم سارا تقوی (مدیر کل منابع انسانی)',
    role: 'hr_admin',
    departmentId: 'dept-2',
    photoURL: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    createdAt: new Date().toISOString()
  },
  hr_manager: {
    uid: 'mgr-hr',
    email: 'hr.manager@company.ir',
    displayName: 'علیرضا محمودی (کارشناس ارشد کارگزینی)',
    role: 'hr_manager',
    departmentId: 'dept-2',
    photoURL: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    createdAt: new Date().toISOString()
  },
  finance: {
    uid: 'finance-lead',
    email: 'finance@company.ir',
    displayName: 'محسن کریمی (رئیس امور مالی و حقوق)',
    role: 'finance',
    departmentId: 'dept-3',
    photoURL: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    createdAt: new Date().toISOString()
  },
  department_manager: {
    uid: 'dept-lead',
    email: 'tech.lead@company.ir',
    displayName: 'دکتر مهران راد (مدیر ارشد فنی و هوش مصنوعی)',
    role: 'department_manager',
    departmentId: 'dept-1',
    photoURL: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
    createdAt: new Date().toISOString()
  },
  employee: {
    uid: 'emp-standard',
    email: 'employee@company.ir',
    displayName: 'نیلوفر رضایی (کارشناس توسعه نرم‌افزار)',
    role: 'employee',
    departmentId: 'dept-1',
    photoURL: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    createdAt: new Date().toISOString()
  }
};

export const DEFAULT_ADMIN_PROFILE = DEMO_PROFILES.super_admin;

const STORAGE_AUTH_KEY = 'hamkar_active_session_v1';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_AUTH_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return null;
  });
  const [role, setRole] = useState<UserRole>(() => profile?.role || 'super_admin');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_AUTH_KEY);
      return Boolean(saved);
    } catch {
      return false;
    }
  });
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
          if (userDoc.exists()) {
            const data = userDoc.data() as UserProfile;
            setProfile(data);
            setRole(data.role || 'hr_admin');
            setIsAuthenticated(true);
            localStorage.setItem(STORAGE_AUTH_KEY, JSON.stringify(data));
          } else {
            const newProfile: UserProfile = {
              uid: currentUser.uid,
              email: currentUser.email || '',
              displayName: currentUser.displayName || 'کاربر سامانه',
              role: 'super_admin',
              photoURL: currentUser.photoURL || '',
              createdAt: new Date().toISOString()
            };
            await setDoc(doc(db, 'users', currentUser.uid), newProfile);
            setProfile(newProfile);
            setRole('super_admin');
            setIsAuthenticated(true);
            localStorage.setItem(STORAGE_AUTH_KEY, JSON.stringify(newProfile));
          }
        } catch (error) {
          console.warn('Error fetching user document from Firestore:', error);
          const fallbackProfile: UserProfile = {
            uid: currentUser.uid,
            email: currentUser.email || '',
            displayName: currentUser.displayName || 'مدیر سیستم',
            role: 'super_admin'
          };
          setProfile(fallbackProfile);
          setRole('super_admin');
          setIsAuthenticated(true);
          localStorage.setItem(STORAGE_AUTH_KEY, JSON.stringify(fallbackProfile));
        }
      } else {
        // If not firebase auth, check local session
        const saved = localStorage.getItem(STORAGE_AUTH_KEY);
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            setProfile(parsed);
            setRole(parsed.role || 'super_admin');
            setIsAuthenticated(true);
          } catch {
            setProfile(null);
            setIsAuthenticated(false);
          }
        } else {
          // If explicitly signed out or not logged in
          setProfile(null);
          setIsAuthenticated(false);
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      setIsAuthenticated(true);
    } catch (error) {
      console.error('Google Sign In Error:', error);
      throw error;
    }
  };

  const signInWithEmail = async (email: string, pass: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, pass);
      setIsAuthenticated(true);
    } catch (error) {
      console.error('Email Sign In Error:', error);
      throw error;
    }
  };

  const signInWithUsernameOrEmail = async (usernameOrEmail: string, pass: string) => {
    const cleanUsername = usernameOrEmail.trim().toLowerCase();
    const cleanPass = pass.trim();

    if (!cleanUsername) {
      throw new Error('لطفاً نام کاربری را وارد نمایید.');
    }
    if (!cleanPass) {
      throw new Error('لطفاً گذرواژه را وارد نمایید.');
    }

    // 1. First, check against registered system users (Firestore app_users and local database)
    const matchedUser = await verifyUserCredentials(cleanUsername, cleanPass);
    if (matchedUser) {
      if (matchedUser.status === 'inactive') {
        throw new Error('حساب کاربری شما غیرفعال شده است. لطفاً با مدیر سیستم تماس بگیرید.');
      }

      const userProfile: UserProfile = {
        uid: matchedUser.id,
        email: matchedUser.email || `${matchedUser.username}@company.ir`,
        displayName: matchedUser.displayName,
        role: matchedUser.role,
        departmentId: matchedUser.departmentId,
        departmentName: matchedUser.departmentName,
        photoURL: matchedUser.photoURL || '',
        createdAt: matchedUser.createdAt
      };

      setProfile(userProfile);
      setRole(matchedUser.role);
      setIsAuthenticated(true);
      localStorage.setItem(STORAGE_AUTH_KEY, JSON.stringify(userProfile));

      logAuditEvent({
        userId: matchedUser.id,
        userName: matchedUser.displayName,
        userRole: matchedUser.role,
        action: 'LOGIN',
        entityType: 'user',
        entityId: matchedUser.id,
        description: `کاربر ${matchedUser.displayName} (${matchedUser.username}) با موفقیت وارد سامانه شد.`
      }).catch(() => {});

      return;
    }

    // 2. Second, attempt Firebase Auth if credentials were created via Firebase Auth
    const emailToUse = cleanUsername.includes('@') ? cleanUsername : `${cleanUsername}@company.ir`;
    try {
      const fbRes = await signInWithEmailAndPassword(auth, emailToUse, cleanPass);
      if (fbRes.user) {
        setIsAuthenticated(true);
        return;
      }
    } catch (fbErr: any) {
      // Firebase auth failed
    }

    // 3. If credentials do not match any active system user, reject access!
    throw new Error('نام کاربری یا گذرواژه وارد شده نادرست است.');
  };

  const signUpWithEmail = async (email: string, pass: string, name: string, newRole: UserRole = 'hr_admin') => {
    try {
      const emailToUse = email.includes('@') ? email : `${email}@company.ir`;
      try {
        const res = await createUserWithEmailAndPassword(auth, emailToUse, pass);
        const newProfile: UserProfile = {
          uid: res.user.uid,
          email: res.user.email || emailToUse,
          displayName: name,
          role: newRole,
          createdAt: new Date().toISOString()
        };
        await setDoc(doc(db, 'users', res.user.uid), newProfile);
        setProfile(newProfile);
        setRole(newRole);
        setIsAuthenticated(true);
        localStorage.setItem(STORAGE_AUTH_KEY, JSON.stringify(newProfile));
      } catch (fbErr) {
        // Fallback for sandboxed users
        const localProfile: UserProfile = {
          uid: `user-${Date.now()}`,
          email: emailToUse,
          displayName: name,
          role: newRole,
          createdAt: new Date().toISOString()
        };
        setProfile(localProfile);
        setRole(newRole);
        setIsAuthenticated(true);
        localStorage.setItem(STORAGE_AUTH_KEY, JSON.stringify(localProfile));
      }
    } catch (error) {
      console.error('Sign Up Error:', error);
      throw error;
    }
  };

  const loginAsDemoUser = (demoRole: UserRole) => {
    const demo = DEMO_PROFILES[demoRole] || DEMO_PROFILES.super_admin;
    setProfile(demo);
    setRole(demo.role);
    setIsAuthenticated(true);
    localStorage.setItem(STORAGE_AUTH_KEY, JSON.stringify(demo));
  };

  const signOut = async () => {
    try {
      await fbSignOut(auth);
    } catch (error) {
      console.warn('Firebase sign out error (proceeding with local signout):', error);
    }
    localStorage.removeItem(STORAGE_AUTH_KEY);
    setProfile(null);
    setUser(null);
    setIsAuthenticated(false);
  };

  const switchRole = (newRole: UserRole) => {
    setRole(newRole);
    if (profile) {
      const updated = {
        ...profile,
        role: newRole
      };
      setProfile(updated);
      localStorage.setItem(STORAGE_AUTH_KEY, JSON.stringify(updated));
    }
  };

  const canAccess = (permission: string): boolean => {
    if (role === 'super_admin') return true;

    switch (permission) {
      case 'employee.create':
      case 'employee.update':
      case 'employee.delete':
      case 'wizard.access':
        return ['super_admin', 'hr_admin', 'hr_manager'].includes(role);

      case 'salary.manage':
      case 'banking.manage':
        return ['super_admin', 'hr_admin', 'finance'].includes(role);

      case 'documents.upload':
      case 'documents.delete':
        return ['super_admin', 'hr_admin', 'hr_manager'].includes(role);

      case 'audit.read':
        return ['super_admin', 'hr_admin', 'finance'].includes(role);

      case 'department.manage':
        return ['super_admin', 'hr_admin'].includes(role);

      default:
        return true;
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      profile,
      role,
      isAuthenticated,
      loading,
      signInWithGoogle,
      signInWithEmail,
      signInWithUsernameOrEmail,
      signUpWithEmail,
      loginAsDemoUser,
      signOut,
      switchRole,
      canAccess
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

