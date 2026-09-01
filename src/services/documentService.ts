import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { collection, doc, setDoc, deleteDoc, getDocs } from 'firebase/firestore';
import { storage, db } from '../lib/firebase';
import { EmployeeDocument } from '../types';
import { toJalaliDate } from '../utils/persianDate';

export async function uploadEmployeeFile(
  employeeId: string,
  category: string,
  file: File,
  metadata: {
    title: string;
    documentNumber?: string;
    issueDate?: string;
    expiryDate?: string;
    description?: string;
    uploadedBy: string;
    uploadedByName: string;
  }
): Promise<EmployeeDocument> {
  const docId = `doc-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const storagePath = `employees/${employeeId}/documents/${docId}_${file.name}`;
  const fileRef = ref(storage, storagePath);

  let downloadUrl = '';
  try {
    const uploadResult = await uploadBytes(fileRef, file);
    downloadUrl = await getDownloadURL(uploadResult.ref);
  } catch (err) {
    console.warn('Firebase storage upload fallback to ObjectURL/DataURL for local preview:', err);
    downloadUrl = URL.createObjectURL(file);
  }

  const docRecord: EmployeeDocument = {
    id: docId,
    title: metadata.title || file.name,
    category: category as any,
    documentNumber: metadata.documentNumber,
    issueDate: metadata.issueDate,
    expiryDate: metadata.expiryDate,
    description: metadata.description,
    fileUrl: downloadUrl,
    fileName: file.name,
    fileSize: file.size,
    mimeType: file.type,
    uploadedBy: metadata.uploadedBy,
    uploadedByName: metadata.uploadedByName,
    uploadedAt: new Date().toISOString()
  };

  // Save to employee documents subcollection
  await setDoc(doc(db, `employees/${employeeId}/documents`, docId), docRecord);

  return docRecord;
}

/**
 * Check if a document is expired or expiring within 30 days
 */
export function getDocumentExpiryStatus(expiryDate?: string): {
  isExpired: boolean;
  isExpiringSoon: boolean;
  daysRemaining: number;
  message?: string;
} {
  if (!expiryDate) {
    return { isExpired: false, isExpiringSoon: false, daysRemaining: 999 };
  }

  const now = new Date();
  const expiry = new Date(expiryDate);
  const diffTime = expiry.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return {
      isExpired: true,
      isExpiringSoon: false,
      daysRemaining: diffDays,
      message: `این مدرک در تاریخ ${toJalaliDate(expiryDate)} منقضی شده است.`
    };
  } else if (diffDays <= 30) {
    return {
      isExpired: false,
      isExpiringSoon: true,
      daysRemaining: diffDays,
      message: `این مدرک تا ${diffDays} روز دیگر منقضی می‌شود.`
    };
  }

  return {
    isExpired: false,
    isExpiringSoon: false,
    daysRemaining: diffDays
  };
}
