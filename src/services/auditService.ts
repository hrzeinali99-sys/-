import { collection, addDoc, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { AuditLog, UserRole } from '../types';
import { toJalaliDateTime } from '../utils/persianDate';

export async function logAuditEvent(params: {
  userId: string;
  userName: string;
  userRole: UserRole;
  action: string;
  entityType: AuditLog['entityType'];
  entityId: string;
  description: string;
  oldValue?: any;
  newValue?: any;
}): Promise<void> {
  try {
    const now = new Date();
    const logData: Omit<AuditLog, 'id'> = {
      userId: params.userId,
      userName: params.userName,
      userRole: params.userRole,
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId,
      description: params.description,
      timestamp: now.toISOString(),
      timestampJalali: toJalaliDateTime(now),
      ...(params.oldValue !== undefined ? { oldValue: params.oldValue } : {}),
      ...(params.newValue !== undefined ? { newValue: params.newValue } : {}),
    };

    await addDoc(collection(db, 'auditLogs'), logData);
  } catch (error) {
    console.warn('Failed to record audit log:', error);
  }
}

export async function fetchAuditLogs(maxCount: number = 100): Promise<AuditLog[]> {
  try {
    const q = query(collection(db, 'auditLogs'), orderBy('timestamp', 'desc'), limit(maxCount));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as AuditLog));
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    return [];
  }
}

export const getAuditLogs = fetchAuditLogs;

export async function getAuditLogsForEntity(entityId: string, maxCount: number = 50): Promise<AuditLog[]> {
  try {
    const logs = await fetchAuditLogs(100);
    return logs.filter(l => l.entityId === entityId).slice(0, maxCount);
  } catch (error) {
    console.error('Error fetching entity audit logs:', error);
    return [];
  }
}
