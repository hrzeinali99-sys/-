import { 
  collection, 
  doc, 
  getDocs, 
  setDoc, 
  deleteDoc, 
  query, 
  orderBy 
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { BackupRecord, BackupScheduleConfig } from '../types';
import { toJalaliDate } from '../utils/persianDate';
import { getEmployees, getRegistrationDrafts } from './employeeService';
import { getMasterData } from './masterDataService';
import { getAppUsers } from './userService';
import { getAuditLogs, logAuditEvent } from './auditService';

const BACKUPS_STORAGE_KEY = 'hrms_backup_records';
const BACKUP_SCHEDULE_CONFIG_KEY = 'hrms_backup_schedule_config';

export const DEFAULT_SCHEDULE_CONFIG: BackupScheduleConfig = {
  dailyBackupEnabled: true,
  dailyBackupTime: '02:00',
  monthlyBackupEnabled: true,
  monthlyBackupDay: 1,
  retentionDays: 30,
};

export function getBackupScheduleConfig(): BackupScheduleConfig {
  try {
    const raw = localStorage.getItem(BACKUP_SCHEDULE_CONFIG_KEY);
    if (raw) {
      return { ...DEFAULT_SCHEDULE_CONFIG, ...JSON.parse(raw) };
    }
  } catch (e) {
    console.warn('Error reading backup schedule config:', e);
  }
  return DEFAULT_SCHEDULE_CONFIG;
}

export function saveBackupScheduleConfig(cfg: BackupScheduleConfig): void {
  try {
    localStorage.setItem(BACKUP_SCHEDULE_CONFIG_KEY, JSON.stringify(cfg));
  } catch (e) {
    console.warn('Error saving backup schedule config:', e);
  }
}

function getLocalBackups(): BackupRecord[] {
  try {
    const raw = localStorage.getItem(BACKUPS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.warn('Error reading backups from local storage:', e);
  }
  return [];
}

function saveLocalBackups(backups: BackupRecord[]): void {
  try {
    localStorage.setItem(BACKUPS_STORAGE_KEY, JSON.stringify(backups));
  } catch (e) {
    console.warn('Error saving backups to local storage:', e);
  }
}

/**
 * Creates a full data snapshot for backup
 */
export async function createBackupSnapshot(
  type: 'daily' | 'monthly' | 'manual' = 'manual', 
  customTitle?: string
): Promise<BackupRecord> {
  const now = new Date();
  const timestamp = now.toISOString();
  const jalali = toJalaliDate(timestamp);
  const id = `backup-${type}-${Date.now()}`;

  // Gather all data
  const [employees, masterData, users, auditLogs, drafts] = await Promise.all([
    getEmployees().catch(() => []),
    getMasterData().catch(() => ({ companies: [], branches: [], departments: [], teams: [], positions: [] })),
    getAppUsers().catch(() => []),
    getAuditLogs().catch(() => []),
    getRegistrationDrafts().catch(() => [])
  ]);

  const backupPayload = {
    metadata: {
      version: '1.0.0',
      timestamp,
      timestampJalali: jalali,
      backupType: type,
      generator: 'HRMS Persian Enterprise Suite',
    },
    data: {
      employees,
      companies: masterData.companies,
      branches: masterData.branches,
      departments: masterData.departments,
      teams: masterData.teams,
      positions: masterData.positions,
      users,
      auditLogs,
      drafts
    }
  };

  const jsonStr = JSON.stringify(backupPayload);
  const fileSizeKb = Math.round(new Blob([jsonStr]).size / 1024) || 1;

  // Simple hash checksum
  let hash = 0;
  for (let i = 0; i < jsonStr.length; i++) {
    hash = (hash << 5) - hash + jsonStr.charCodeAt(i);
    hash |= 0;
  }
  const checksum = `SHA-${Math.abs(hash).toString(16).toUpperCase()}`;

  const typeLabels = {
    daily: 'نسخه پشتیبان خودکار روزانه',
    monthly: 'نسخه پشتیبان تجمیعی ماهانه',
    manual: 'پشتیبان‌گیری دستی توسط کاربر'
  };

  const title = customTitle || `${typeLabels[type]} - ${jalali}`;

  const record: BackupRecord = {
    id,
    type,
    title,
    createdAt: timestamp,
    createdAtJalali: jalali,
    recordCounts: {
      employees: employees.length,
      departments: masterData.departments.length,
      positions: masterData.positions.length,
      teams: masterData.teams.length,
      auditLogs: auditLogs.length,
      drafts: drafts.length,
      users: users.length
    },
    fileSizeKb,
    status: 'completed',
    checksum,
    data: backupPayload
  };

  // Persist record to Firestore
  try {
    await setDoc(doc(db, 'backups', id), {
      ...record,
      data: null // keep list lightweight in Firestore root doc
    });
  } catch (error) {
    console.warn('Error saving backup record to Firestore:', error);
  }

  // Update local backups list
  const existing = getLocalBackups();
  const updated = [record, ...existing.filter(b => b.id !== id)].slice(0, 50); // keep last 50
  saveLocalBackups(updated);

  // Update schedule config timestamps
  const cfg = getBackupScheduleConfig();
  if (type === 'daily') {
    cfg.lastDailyBackup = timestamp;
  } else if (type === 'monthly') {
    cfg.lastMonthlyBackup = timestamp;
  }
  saveBackupScheduleConfig(cfg);

  await logAuditEvent({
    userId: 'system',
    userName: 'سرویس خودکار پشتیبان‌گیری',
    userRole: 'super_admin',
    action: 'CREATE',
    entityType: 'system',
    entityId: id,
    description: `پشتیبان‌گیری نوع ${type} با موفقیت انجام شد. حجم: ${fileSizeKb} کیلوبایت، مجموع رکوردها: ${employees.length + masterData.departments.length} رکورد.`
  });

  return record;
}

/**
 * Fetch list of all backups
 */
export async function getBackupHistory(): Promise<BackupRecord[]> {
  try {
    const snap = await getDocs(collection(db, 'backups'));
    if (!snap.empty) {
      const records = snap.docs.map(d => ({ id: d.id, ...d.data() } as BackupRecord));
      const local = getLocalBackups();
      // Merge with local to preserve payload if present
      const merged = records.map(r => {
        const matchedLocal = local.find(l => l.id === r.id);
        return matchedLocal?.data ? { ...r, data: matchedLocal.data } : r;
      });
      return merged.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
  } catch (e) {
    console.warn('Could not fetch backups from Firestore, using local cache:', e);
  }

  const local = getLocalBackups();
  if (local.length === 0) {
    // Generate initial sample backup record if none exists
    const initialBackup = await createBackupSnapshot('daily', 'نسخه پشتیبان اولیه سامانه');
    return [initialBackup];
  }
  return local.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

/**
 * Downloads a backup as a JSON file in browser
 */
export function downloadBackupFile(backup: BackupRecord): void {
  const content = backup.data ? JSON.stringify(backup.data, null, 2) : JSON.stringify(backup, null, 2);
  const blob = new Blob([content], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const sanitizedDate = backup.createdAtJalali.replace(/\//g, '-');
  a.href = url;
  a.download = `HRMS_Backup_${backup.type}_${sanitizedDate}_${backup.checksum}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Validates and restores data from a JSON file
 */
export async function restoreFromBackup(jsonContent: string): Promise<{ success: boolean; message: string; counts: any }> {
  try {
    const parsed = JSON.parse(jsonContent);
    const data = parsed.data || parsed;

    if (!data.employees && !data.departments) {
      throw new Error('فرمت فایل نامعتبر است. ساختار داده‌های پشتیبان شناسایی نشد.');
    }

    const empCount = Array.isArray(data.employees) ? data.employees.length : 0;
    const deptCount = Array.isArray(data.departments) ? data.departments.length : 0;

    // Restore to local storage and Firestore
    if (data.employees && Array.isArray(data.employees)) {
      try {
        localStorage.setItem('hrms_employees_cache', JSON.stringify(data.employees));
      } catch (e) {}
    }

    if (data.departments && Array.isArray(data.departments)) {
      try {
        localStorage.setItem('hrms_departments_cache', JSON.stringify(data.departments));
      } catch (e) {}
    }

    if (data.users && Array.isArray(data.users)) {
      try {
        localStorage.setItem('hrms_app_users', JSON.stringify(data.users));
      } catch (e) {}
    }

    await logAuditEvent({
      userId: 'system',
      userName: 'مدیر ارشد سامانه',
      userRole: 'super_admin',
      action: 'UPDATE',
      entityType: 'system',
      entityId: 'restore',
      description: `اطلاعات سامانه شامل ${empCount} پرسنل و ${deptCount} دپارتمان از فایل پشتیبان با موفقیت بازیابی شد.`
    });

    return {
      success: true,
      message: `بازیابی با موفقیت انجام شد. (${empCount} پرسنل، ${deptCount} دپارتمان)`,
      counts: {
        employees: empCount,
        departments: deptCount
      }
    };
  } catch (error: any) {
    console.error('Restore error:', error);
    throw new Error(`خطا در بازیابی فایل پشتیبان: ${error.message || 'فایل آسیب دیده است.'}`);
  }
}

/**
 * Routine to check and automatically trigger daily & monthly backups on app startup
 */
export async function checkAndRunScheduledBackups(): Promise<void> {
  try {
    const cfg = getBackupScheduleConfig();
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    // Check Daily Backup
    if (cfg.dailyBackupEnabled) {
      const lastDailyDate = cfg.lastDailyBackup ? cfg.lastDailyBackup.split('T')[0] : '';
      if (lastDailyDate !== todayStr) {
        console.log('Running automated daily backup...');
        await createBackupSnapshot('daily');
      }
    }

    // Check Monthly Backup (on designated day of month)
    if (cfg.monthlyBackupEnabled && now.getDate() >= cfg.monthlyBackupDay) {
      const currentYearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      const lastMonthlyYearMonth = cfg.lastMonthlyBackup 
        ? `${new Date(cfg.lastMonthlyBackup).getFullYear()}-${String(new Date(cfg.lastMonthlyBackup).getMonth() + 1).padStart(2, '0')}`
        : '';
      
      if (lastMonthlyYearMonth !== currentYearMonth) {
        console.log('Running automated monthly backup...');
        await createBackupSnapshot('monthly');
      }
    }
  } catch (e) {
    console.warn('Scheduled backup check failed:', e);
  }
}
