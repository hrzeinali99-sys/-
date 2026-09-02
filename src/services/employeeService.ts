import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  startAfter, 
  writeBatch,
  DocumentSnapshot
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { 
  EmployeeSummary, 
  FullRegistrationFormData, 
  EmployeeDraft, 
  EmploymentStatus, 
  TimelineEvent,
  ContactInfo,
  AddressInfo,
  FamilyMember,
  EmploymentDetails,
  OrganizationDetails,
  EducationRecord,
  WorkExperienceRecord,
  SkillRecord,
  LanguageRecord,
  InsuranceInfo,
  BankAccountInfo,
  SalaryInfo,
  EmployeeDocument,
  EmergencyContact,
  AdditionalInfo
} from '../types';
import { toJalaliDate, getCurrentJalaliDate, toJalaliDateTime } from '../utils/persianDate';
import { logAuditEvent } from './auditService';

export interface EmployeeFilterOptions {
  searchTerm?: string;
  companyId?: string;
  departmentId?: string;
  branchId?: string;
  employmentStatus?: string;
  employmentType?: string;
  contractType?: string;
  page?: number;
  pageSize?: number;
}

const EMPLOYEES_STORAGE_KEY = 'hrms_employees_cache_v1';

function getStoredEmployees(): EmployeeSummary[] {
  try {
    const raw = localStorage.getItem(EMPLOYEES_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((e, idx) => ({
          ...e,
          guaranteeNoteAmount: e.guaranteeNoteAmount !== undefined ? e.guaranteeNoteAmount : (500000000 * ((idx % 3) + 1)),
          guaranteeNoteNumber: e.guaranteeNoteNumber || `SAF-${e.employeeCode || (140300 + idx)}`,
          guaranteeNoteStatus: e.guaranteeNoteStatus || 'received',
          guaranteeNoteReceivedDateJalali: e.guaranteeNoteReceivedDateJalali || e.hireDateJalali || '1403/01/15',
          guaranteeNoteDueDateJalali: e.guaranteeNoteDueDateJalali || '1404/12/29'
        }));
      }
    }
  } catch (e) {
    console.warn('Could not read employees from local cache:', e);
  }
  return [];
}

function saveStoredEmployees(employees: EmployeeSummary[]): void {
  try {
    localStorage.setItem(EMPLOYEES_STORAGE_KEY, JSON.stringify(employees));
  } catch (e) {
    console.warn('Could not save employees to local cache:', e);
  }
}

/**
 * Fetch filtered & paginated employees from Firestore with offline cache fallback
 */
export async function getEmployees(options: EmployeeFilterOptions = {}): Promise<EmployeeSummary[]> {
  let allEmployees: EmployeeSummary[] = [];

  try {
    const employeesRef = collection(db, 'employees');
    let q = query(employeesRef, orderBy('createdAt', 'desc'));

    if (options.companyId && options.companyId !== 'all') {
      q = query(employeesRef, where('companyId', '==', options.companyId));
    } else if (options.departmentId && options.departmentId !== 'all') {
      q = query(employeesRef, where('departmentId', '==', options.departmentId));
    } else if (options.branchId && options.branchId !== 'all') {
      q = query(employeesRef, where('branchId', '==', options.branchId));
    } else if (options.employmentStatus && options.employmentStatus !== 'all') {
      q = query(employeesRef, where('employmentStatus', '==', options.employmentStatus));
    }

    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      allEmployees = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as EmployeeSummary));
      if (!options.companyId && !options.departmentId && !options.branchId && !options.employmentStatus) {
        saveStoredEmployees(allEmployees);
      }
    } else {
      // If empty or offline snapshot, check local storage
      allEmployees = getStoredEmployees();
    }
  } catch (error) {
    console.warn('Firestore fetch for employees failed or offline, using local cache:', error);
    allEmployees = getStoredEmployees();
  }

  // Client-side multi-field filtering for search term & compound filters
  if (options.searchTerm && options.searchTerm.trim()) {
    const term = options.searchTerm.trim().toLowerCase();
    allEmployees = allEmployees.filter(emp => 
      (emp.firstName && emp.firstName.toLowerCase().includes(term)) ||
      (emp.lastName && emp.lastName.toLowerCase().includes(term)) ||
      (`${emp.firstName} ${emp.lastName}`.toLowerCase().includes(term)) ||
      (emp.employeeCode && emp.employeeCode.toLowerCase().includes(term)) ||
      (emp.nationalId && emp.nationalId.includes(term)) ||
      (emp.mobile && emp.mobile.includes(term)) ||
      (emp.companyName && emp.companyName.toLowerCase().includes(term)) ||
      (emp.departmentName && emp.departmentName.toLowerCase().includes(term)) ||
      (emp.positionTitle && emp.positionTitle.toLowerCase().includes(term))
    );
  }

  if (options.companyId && options.companyId !== 'all') {
    allEmployees = allEmployees.filter(e => e.companyId === options.companyId);
  }
  if (options.employmentStatus && options.employmentStatus !== 'all') {
    allEmployees = allEmployees.filter(e => e.employmentStatus === options.employmentStatus);
  }
  if (options.departmentId && options.departmentId !== 'all') {
    allEmployees = allEmployees.filter(e => e.departmentId === options.departmentId);
  }
  if (options.branchId && options.branchId !== 'all') {
    allEmployees = allEmployees.filter(e => e.branchId === options.branchId);
  }
  if (options.contractType && options.contractType !== 'all') {
    allEmployees = allEmployees.filter(e => e.contractType === options.contractType);
  }

  return allEmployees;
}

/**
 * Check if employee code already exists
 */
export async function isEmployeeCodeUnique(code: string, excludeId?: string): Promise<boolean> {
  try {
    const q = query(collection(db, 'employees'), where('employeeCode', '==', code.trim()));
    const snap = await getDocs(q);
    if (snap.empty) return true;
    if (excludeId && snap.docs.length === 1 && snap.docs[0].id === excludeId) return true;
    return false;
  } catch (e) {
    return true;
  }
}

/**
 * Check if national ID already exists
 */
export async function isNationalIdUnique(nationalId: string, excludeId?: string): Promise<boolean> {
  try {
    const q = query(collection(db, 'employees'), where('nationalId', '==', nationalId.trim()));
    const snap = await getDocs(q);
    if (snap.empty) return true;
    if (excludeId && snap.docs.length === 1 && snap.docs[0].id === excludeId) return true;
    return false;
  } catch (e) {
    return true;
  }
}

/**
 * Create a new employee with all subcollections in a modular Firestore architecture
 */
export async function createFullEmployee(
  formData: FullRegistrationFormData,
  actor: { uid: string; displayName: string; role: any }
): Promise<{ success: boolean; employeeId: string; error?: string }> {
  try {
    const empId = `emp-${formData.employeeCode.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
    const batch = writeBatch(db);
    const now = new Date().toISOString();
    const nowJalali = getCurrentJalaliDate();

    // 1. Main Employee Summary Document
    const empRef = doc(db, 'employees', empId);
    const summary: EmployeeSummary = {
      id: empId,
      employeeCode: formData.employeeCode,
      firstName: formData.firstName,
      lastName: formData.lastName,
      latinFirstName: formData.latinFirstName || '',
      latinLastName: formData.latinLastName || '',
      nationalId: formData.nationalId,
      birthDate: formData.birthDate,
      birthDateJalali: toJalaliDate(formData.birthDate),
      gender: formData.gender,
      maritalStatus: formData.maritalStatus,
      childrenCount: Number(formData.childrenCount) || (formData.familyMembers?.filter(f => f.relationship === 'فرزند').length) || 0,
      spouseBirthDate: formData.spouseBirthDate || formData.familyMembers?.find(f => f.relationship === 'همسر')?.birthDate || '',
      spouseBirthDateJalali: formData.spouseBirthDateJalali || formData.familyMembers?.find(f => f.relationship === 'همسر')?.birthDateJalali || '',
      childBirthDate: formData.childBirthDate || formData.familyMembers?.find(f => f.relationship === 'فرزند')?.birthDate || '',
      childBirthDateJalali: formData.childBirthDateJalali || formData.familyMembers?.find(f => f.relationship === 'فرزند')?.birthDateJalali || '',
      childrenBirthDates: formData.childrenBirthDates || formData.familyMembers?.filter(f => f.relationship === 'فرزند').map(c => c.birthDate).filter(Boolean) || [],
      childrenBirthDatesJalali: formData.childrenBirthDatesJalali || formData.familyMembers?.filter(f => f.relationship === 'فرزند').map(c => c.birthDateJalali || toJalaliDate(c.birthDate)).filter(Boolean) || [],
      profileImageUrl: formData.profileImageUrl || '',

      companyId: formData.organization.companyId,
      companyName: formData.organization.companyName || '',
      branchId: formData.organization.branchId,
      branchName: formData.organization.branchName || '',
      departmentId: formData.organization.departmentId,
      departmentName: formData.organization.departmentName || '',
      teamId: formData.organization.teamId || '',
      teamName: formData.organization.teamName || '',
      positionId: formData.organization.positionId,
      positionTitle: formData.organization.positionTitle || formData.organization.jobTitle || '',
      jobLevel: formData.organization.jobLevel || '',
      managerName: formData.organization.directManagerName || '',
      costCenterCode: formData.organization.costCenterCode || '',

      mobile: formData.contacts.mobile,
      workEmail: formData.contacts.workEmail || '',

      employmentType: formData.employment.employmentType,
      employmentStatus: 'active',
      contractType: formData.employment.contractType,
      hireDate: formData.employment.hireDate,
      hireDateJalali: toJalaliDate(formData.employment.hireDate),
      contractEndDate: formData.employment.contractEndDate || '',
      baseSalary: formData.salary?.baseSalary || 0,
      netSalary: formData.salary?.netSalary || 0,

      // Supplementary Insurance summary
      hasSupplementaryInsurance: formData.insurance?.hasSupplementaryInsurance,
      supplementaryInsurancePaymentMethod: formData.insurance?.supplementaryInsurancePaymentMethod || formData.insurance?.supplementaryPaymentMethod,
      supplementaryInsurancePremium: formData.insurance?.supplementaryInsurancePremium,
      supplementaryInsuranceCompany: formData.insurance?.supplementaryInsuranceCompany,

      // Promissory Note Guarantee (سفته ضمانت حسن انجام کار)
      guaranteeNoteAmount: formData.additionalInfo?.guaranteeNoteAmount !== undefined ? Number(formData.additionalInfo.guaranteeNoteAmount) : 1000000000,
      guaranteeNoteNumber: formData.additionalInfo?.guaranteeNoteNumber || `SAF-${formData.employeeCode}`,
      guaranteeNoteStatus: formData.additionalInfo?.guaranteeNoteStatus || 'received',
      guaranteeNoteReceivedDateJalali: formData.additionalInfo?.guaranteeNoteReceivedDateJalali || toJalaliDate(formData.employment.hireDate),
      guaranteeNoteDueDateJalali: formData.additionalInfo?.guaranteeNoteDueDateJalali || '',
      guaranteeNoteGuarantorName: formData.additionalInfo?.guaranteeNoteGuarantorName || '',
      guaranteeNoteDescription: formData.additionalInfo?.guaranteeNoteDescription || 'لاشه سفته در صندوق اسناد نگهداری می‌شود.',

      createdAt: now,
      updatedAt: now,
      createdBy: actor.uid,
      updatedBy: actor.uid
    };

    batch.set(empRef, summary);

    // 2. Subcollection: contacts
    const contactRef = doc(db, `employees/${empId}/contacts`, 'primary');
    batch.set(contactRef, { id: 'primary', ...formData.contacts });

    // 3. Subcollection: addresses
    if (formData.addresses && formData.addresses.length > 0) {
      formData.addresses.forEach((addr, idx) => {
        const addrRef = doc(db, `employees/${empId}/addresses`, addr.id || `addr-${idx}`);
        batch.set(addrRef, addr);
      });
    }

    // 4. Subcollection: family
    if (formData.familyMembers && formData.familyMembers.length > 0) {
      formData.familyMembers.forEach((fam, idx) => {
        const famRef = doc(db, `employees/${empId}/family`, fam.id || `fam-${idx}`);
        batch.set(famRef, fam);
      });
    }

    // 5. Subcollection: employment
    const employmentRef = doc(db, `employees/${empId}/employment`, 'current');
    batch.set(employmentRef, { id: 'current', ...formData.employment });

    // 6. Subcollection: organization
    const orgRef = doc(db, `employees/${empId}/organization`, 'current');
    batch.set(orgRef, { id: 'current', ...formData.organization });

    // 7. Subcollection: education
    if (formData.educationList && formData.educationList.length > 0) {
      formData.educationList.forEach((edu, idx) => {
        const eduRef = doc(db, `employees/${empId}/education`, edu.id || `edu-${idx}`);
        batch.set(eduRef, edu);
      });
    }

    // 8. Subcollection: workExperience
    if (formData.workExperienceList && formData.workExperienceList.length > 0) {
      formData.workExperienceList.forEach((exp, idx) => {
        const expRef = doc(db, `employees/${empId}/workExperience`, exp.id || `exp-${idx}`);
        batch.set(expRef, exp);
      });
    }

    // 9. Subcollection: skills & languages
    if (formData.skills && formData.skills.length > 0) {
      formData.skills.forEach((sk, idx) => {
        const skRef = doc(db, `employees/${empId}/skills`, sk.id || `sk-${idx}`);
        batch.set(skRef, sk);
      });
    }
    if (formData.languages && formData.languages.length > 0) {
      formData.languages.forEach((lang, idx) => {
        const langRef = doc(db, `employees/${empId}/languages`, lang.id || `lang-${idx}`);
        batch.set(langRef, lang);
      });
    }

    // 10. Subcollection: insurance
    if (formData.insurance) {
      const insRef = doc(db, `employees/${empId}/insurance`, 'primary');
      batch.set(insRef, { id: 'primary', ...formData.insurance });
    }

    // 11. Subcollection: bankAccounts
    if (formData.banking) {
      const bankRef = doc(db, `employees/${empId}/bankAccounts`, 'primary');
      batch.set(bankRef, { id: 'primary', ...formData.banking });
    }

    // 12. Subcollection: salaryHistory
    if (formData.salary) {
      const salaryRef = doc(db, `employees/${empId}/salaryHistory`, `sal-${Date.now()}`);
      batch.set(salaryRef, {
        id: `sal-${Date.now()}`,
        ...formData.salary,
        createdAt: now
      });
    }

    // 13. Subcollection: documents
    if (formData.documents && formData.documents.length > 0) {
      formData.documents.forEach((d, idx) => {
        const docRef = doc(db, `employees/${empId}/documents`, d.id || `doc-${idx}`);
        batch.set(docRef, d);
      });
    }

    // 14. Subcollection: emergencyContacts
    if (formData.emergencyContacts && formData.emergencyContacts.length > 0) {
      formData.emergencyContacts.forEach((em, idx) => {
        const emRef = doc(db, `employees/${empId}/emergencyContacts`, em.id || `em-${idx}`);
        batch.set(emRef, em);
      });
    }

    // 15. Subcollection: additionalInfo
    if (formData.additionalInfo) {
      const addRef = doc(db, `employees/${empId}/additionalInfo`, 'primary');
      batch.set(addRef, { id: 'primary', ...formData.additionalInfo });
    }

    // 16. Timeline record: Initial Hire
    const timelineRef = doc(db, `employees/${empId}/timeline`, `event-${Date.now()}`);
    batch.set(timelineRef, {
      id: `event-${Date.now()}`,
      type: 'استخدام',
      title: 'ثبت و استخدام پرسنل جدید در سامانه',
      description: `پرسنل با کد ${formData.employeeCode} در دپارتمان ${formData.organization.departmentName} با سمت ${formData.organization.positionTitle} استخدام گردید.`,
      date: formData.employment.hireDate,
      dateJalali: toJalaliDate(formData.employment.hireDate),
      actorName: actor.displayName || 'کارشناس منابع انسانی',
      actorId: actor.uid
    });

    await batch.commit();

    // Update local cache
    try {
      const currentStored = getStoredEmployees();
      const existsIndex = currentStored.findIndex(e => e.id === empId);
      if (existsIndex >= 0) {
        currentStored[existsIndex] = summary;
      } else {
        currentStored.unshift(summary);
      }
      saveStoredEmployees(currentStored);
    } catch (e) {
      console.warn('Error updating local employee cache:', e);
    }

    // Audit log
    await logAuditEvent({
      userId: actor.uid,
      userName: actor.displayName || 'کاربر',
      userRole: actor.role,
      action: 'employee.created',
      entityType: 'employee',
      entityId: empId,
      description: `پرسنل جدید با نام ${formData.firstName} ${formData.lastName} و کد ${formData.employeeCode} ایجاد شد.`
    });

    return { success: true, employeeId: empId };
  } catch (error: any) {
    console.error('Error creating employee:', error);
    return { success: false, employeeId: '', error: error.message || 'خطا در ثبت پرسنل در پایگاه داده' };
  }
}

export async function createEmployeeWithSubcollections(
  formData: FullRegistrationFormData,
  userIdOrActor?: string | { uid: string; displayName: string; role: any },
  userName?: string
): Promise<string> {
  const actor = typeof userIdOrActor === 'object' && userIdOrActor !== null
    ? userIdOrActor
    : { uid: userIdOrActor || 'admin', displayName: userName || 'مدیر سیستم', role: 'super_admin' };

  const result = await createFullEmployee(formData, actor as any);
  if (!result.success || !result.employeeId) {
    throw new Error(result.error || 'ثبت پرسنل با خطا مواجه شد');
  }
  return result.employeeId;
}

/**
 * Fetch complete 360-degree employee profile with all subcollections
 */
export async function getFullEmployeeProfile(employeeId: string) {
  try {
    const empSnap = await getDoc(doc(db, 'employees', employeeId));
    if (!empSnap.exists()) return null;
    const summary = { id: empSnap.id, ...empSnap.data() } as EmployeeSummary;

    // Parallel fetch subcollections
    const [
      contactsSnap,
      addressesSnap,
      familySnap,
      employmentSnap,
      orgSnap,
      educationSnap,
      experienceSnap,
      skillsSnap,
      languagesSnap,
      insuranceSnap,
      banksSnap,
      salariesSnap,
      documentsSnap,
      emergenciesSnap,
      additionalSnap,
      timelineSnap
    ] = await Promise.all([
      getDocs(collection(db, `employees/${employeeId}/contacts`)),
      getDocs(collection(db, `employees/${employeeId}/addresses`)),
      getDocs(collection(db, `employees/${employeeId}/family`)),
      getDocs(collection(db, `employees/${employeeId}/employment`)),
      getDocs(collection(db, `employees/${employeeId}/organization`)),
      getDocs(collection(db, `employees/${employeeId}/education`)),
      getDocs(collection(db, `employees/${employeeId}/workExperience`)),
      getDocs(collection(db, `employees/${employeeId}/skills`)),
      getDocs(collection(db, `employees/${employeeId}/languages`)),
      getDocs(collection(db, `employees/${employeeId}/insurance`)),
      getDocs(collection(db, `employees/${employeeId}/bankAccounts`)),
      getDocs(collection(db, `employees/${employeeId}/salaryHistory`)),
      getDocs(collection(db, `employees/${employeeId}/documents`)),
      getDocs(collection(db, `employees/${employeeId}/emergencyContacts`)),
      getDocs(collection(db, `employees/${employeeId}/additionalInfo`)),
      getDocs(collection(db, `employees/${employeeId}/timeline`))
    ]);

    return {
      summary,
      contacts: contactsSnap.docs.map(d => ({ id: d.id, ...d.data() } as ContactInfo))[0] || null,
      addresses: addressesSnap.docs.map(d => ({ id: d.id, ...d.data() } as AddressInfo)),
      family: familySnap.docs.map(d => ({ id: d.id, ...d.data() } as FamilyMember)),
      employment: employmentSnap.docs.map(d => ({ id: d.id, ...d.data() } as EmploymentDetails))[0] || null,
      organization: orgSnap.docs.map(d => ({ id: d.id, ...d.data() } as OrganizationDetails))[0] || null,
      education: educationSnap.docs.map(d => ({ id: d.id, ...d.data() } as EducationRecord)),
      workExperience: experienceSnap.docs.map(d => ({ id: d.id, ...d.data() } as WorkExperienceRecord)),
      skills: skillsSnap.docs.map(d => ({ id: d.id, ...d.data() } as SkillRecord)),
      languages: languagesSnap.docs.map(d => ({ id: d.id, ...d.data() } as LanguageRecord)),
      insurance: insuranceSnap.docs.map(d => ({ id: d.id, ...d.data() } as InsuranceInfo))[0] || null,
      bankAccounts: banksSnap.docs.map(d => ({ id: d.id, ...d.data() } as BankAccountInfo)),
      salaryHistory: salariesSnap.docs.map(d => ({ id: d.id, ...d.data() } as SalaryInfo)),
      documents: documentsSnap.docs.map(d => ({ id: d.id, ...d.data() } as EmployeeDocument)),
      emergencyContacts: emergenciesSnap.docs.map(d => ({ id: d.id, ...d.data() } as EmergencyContact)),
      additionalInfo: additionalSnap.docs.map(d => ({ id: d.id, ...d.data() } as AdditionalInfo))[0] || null,
      timeline: timelineSnap.docs.map(d => ({ id: d.id, ...d.data() } as TimelineEvent)).sort((a, b) => b.date.localeCompare(a.date))
    };
  } catch (error) {
    console.error('Error fetching full employee profile:', error);
    return null;
  }
}

export async function getEmployee360Profile(employeeId: string): Promise<any | null> {
  const full = await getFullEmployeeProfile(employeeId);
  if (!full) return null;

  return {
    id: full.summary.id,
    employeeCode: full.summary.employeeCode,
    firstName: full.summary.firstName,
    lastName: full.summary.lastName,
    latinFirstName: full.summary.latinFirstName,
    latinLastName: full.summary.latinLastName,
    nationalId: full.summary.nationalId,
    birthDate: full.summary.birthDate,
    birthDateJalali: full.summary.birthDateJalali,
    gender: full.summary.gender,
    maritalStatus: full.summary.maritalStatus,
    childrenCount: full.summary.childrenCount,
    profileImageUrl: full.summary.profileImageUrl,
    contacts: full.contacts,
    addresses: full.addresses,
    familyMembers: full.family,
    employment: full.employment,
    organization: full.organization,
    educationList: full.education,
    workExperienceList: full.workExperience,
    skills: full.skills,
    languages: full.languages,
    insurance: full.insurance || (full.summary.hasSupplementaryInsurance !== undefined ? {
      id: 'primary',
      insuranceType: 'تأمین اجتماعی',
      insuranceNumber: '',
      status: 'فعال',
      hasSupplementaryInsurance: full.summary.hasSupplementaryInsurance,
      supplementaryInsuranceCompany: full.summary.supplementaryInsuranceCompany,
      supplementaryInsurancePaymentMethod: full.summary.supplementaryInsurancePaymentMethod,
      supplementaryPaymentMethod: full.summary.supplementaryInsurancePaymentMethod,
      supplementaryInsurancePremium: full.summary.supplementaryInsurancePremium
    } : null),
    bankAccounts: full.bankAccounts,
    salary: full.salaryHistory?.[0] || {
      baseSalary: full.summary.baseSalary,
      netSalary: full.summary.netSalary
    },
    documents: full.documents,
    emergencyContacts: full.emergencyContacts,
    additionalInfo: full.additionalInfo,
    timeline: full.timeline,
    summary: full.summary
  };
}

/**
 * Update employee status (e.g. deactivate, suspend, terminate)
 */
export async function updateEmployeeStatus(
  employeeId: string,
  newStatus: EmploymentStatus,
  reason: string = 'تغییر وضعیت توسط کاربر',
  actor: { uid: string; displayName: string; role: any } = { uid: 'admin', displayName: 'مدیر سیستم', role: 'super_admin' }
) {
  try {
    const empRef = doc(db, 'employees', employeeId);
    const now = new Date().toISOString();
    const nowJalali = getCurrentJalaliDate();

    await updateDoc(empRef, {
      employmentStatus: newStatus,
      updatedAt: now,
      updatedBy: actor.uid
    });

    // Add to timeline
    const timelineRef = doc(db, `employees/${employeeId}/timeline`, `event-${Date.now()}`);
    await setDoc(timelineRef, {
      id: `event-${Date.now()}`,
      type: newStatus === 'terminated' ? 'خاتمه همکاری' : 'تغییر وضعیت',
      title: `تغییر وضعیت پرسنل به: ${newStatus}`,
      description: `علت / توضیحات: ${reason || 'ثبت توسط مدیر سامانه'}`,
      date: now.split('T')[0],
      dateJalali: nowJalali,
      actorName: actor.displayName,
      actorId: actor.uid
    });

    await logAuditEvent({
      userId: actor.uid,
      userName: actor.displayName,
      userRole: actor.role,
      action: 'employee.status_changed',
      entityType: 'employee',
      entityId: employeeId,
      description: `وضعیت پرسنل به ${newStatus} تغییر یافت. علت: ${reason}`
    });

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Delete employee record and log audit
 */
export async function deleteEmployeeRecord(
  employeeId: string,
  actor: { uid: string; displayName: string; role: any } = { uid: 'admin', displayName: 'مدیر سیستم', role: 'super_admin' }
): Promise<boolean> {
  try {
    // Delete from Firestore
    await deleteDoc(doc(db, 'employees', employeeId));

    // Remove from local cache immediately
    try {
      const currentStored = getStoredEmployees();
      const updated = currentStored.filter(e => e.id !== employeeId);
      saveStoredEmployees(updated);
    } catch (e) {
      console.warn('Error updating local employee cache on delete:', e);
    }

    await logAuditEvent({
      userId: actor.uid,
      userName: actor.displayName,
      userRole: actor.role,
      action: 'employee.deleted',
      entityType: 'employee',
      entityId: employeeId,
      description: `پرونده پرسنل ${employeeId} حذف گردید.`
    });
    return true;
  } catch (error) {
    console.error('Error deleting employee:', error);
    // Fallback if firestore fails offline, still remove from local cache
    try {
      const currentStored = getStoredEmployees();
      const updated = currentStored.filter(e => e.id !== employeeId);
      saveStoredEmployees(updated);
      return true;
    } catch (e) {
      return false;
    }
  }
}

/**
 * Update full employee record across summary document, subcollections, local cache and audit
 */
export async function updateFullEmployee(
  employeeId: string,
  formData: Partial<FullRegistrationFormData> & { id?: string },
  actor: { uid: string; displayName: string; role: any } = { uid: 'admin', displayName: 'مدیر سیستم', role: 'super_admin' }
): Promise<{ success: boolean; error?: string }> {
  try {
    const empId = employeeId || formData.id;
    if (!empId) {
      return { success: false, error: 'شناسه پرسنل نامعتبر است' };
    }

    const now = new Date().toISOString();
    const batch = writeBatch(db);
    const empRef = doc(db, 'employees', empId);

    // Get current stored employee summary if available
    const existingSnap = await getDoc(empRef).catch(() => null);
    const existingData = existingSnap?.exists() ? existingSnap.data() : null;

    const summary: Partial<EmployeeSummary> = {
      ...(existingData || {}),
      id: empId,
      employeeCode: formData.employeeCode || existingData?.employeeCode || '',
      firstName: formData.firstName || existingData?.firstName || '',
      lastName: formData.lastName || existingData?.lastName || '',
      latinFirstName: formData.latinFirstName !== undefined ? formData.latinFirstName : existingData?.latinFirstName,
      latinLastName: formData.latinLastName !== undefined ? formData.latinLastName : existingData?.latinLastName,
      nationalId: formData.nationalId || existingData?.nationalId || '',
      birthDate: formData.birthDate || existingData?.birthDate || '',
      birthDateJalali: formData.birthDate ? toJalaliDate(formData.birthDate) : (formData.birthDateJalali || existingData?.birthDateJalali || ''),
      gender: formData.gender || existingData?.gender || 'مرد',
      maritalStatus: formData.maritalStatus || existingData?.maritalStatus || 'مجرد',
      childrenCount: formData.childrenCount !== undefined ? Number(formData.childrenCount) : (existingData?.childrenCount || 0),
      spouseBirthDate: formData.spouseBirthDate !== undefined ? formData.spouseBirthDate : existingData?.spouseBirthDate,
      spouseBirthDateJalali: formData.spouseBirthDateJalali !== undefined ? formData.spouseBirthDateJalali : existingData?.spouseBirthDateJalali,
      childBirthDate: formData.childBirthDate !== undefined ? formData.childBirthDate : existingData?.childBirthDate,
      childBirthDateJalali: formData.childBirthDateJalali !== undefined ? formData.childBirthDateJalali : existingData?.childBirthDateJalali,
      profileImageUrl: formData.profileImageUrl !== undefined ? formData.profileImageUrl : existingData?.profileImageUrl,

      // Organization
      companyId: formData.organization?.companyId || existingData?.companyId || 'co-1',
      companyName: formData.organization?.companyName || existingData?.companyName || '',
      branchId: formData.organization?.branchId || existingData?.branchId || 'br-1',
      branchName: formData.organization?.branchName || existingData?.branchName || '',
      departmentId: formData.organization?.departmentId || existingData?.departmentId || 'dept-1',
      departmentName: formData.organization?.departmentName || existingData?.departmentName || '',
      teamId: formData.organization?.teamId !== undefined ? formData.organization?.teamId : existingData?.teamId,
      teamName: formData.organization?.teamName !== undefined ? formData.organization?.teamName : existingData?.teamName,
      positionId: formData.organization?.positionId || existingData?.positionId || 'pos-1',
      positionTitle: formData.organization?.positionTitle || formData.organization?.jobTitle || existingData?.positionTitle || '',
      jobLevel: formData.organization?.jobLevel !== undefined ? formData.organization?.jobLevel : existingData?.jobLevel,
      managerName: formData.organization?.directManagerName !== undefined ? formData.organization?.directManagerName : existingData?.managerName,
      costCenterCode: formData.organization?.costCenterCode !== undefined ? formData.organization?.costCenterCode : existingData?.costCenterCode,

      // Contacts
      mobile: formData.contacts?.mobile || existingData?.mobile || '',
      workEmail: formData.contacts?.workEmail !== undefined ? formData.contacts?.workEmail : existingData?.workEmail,

      // Employment
      employmentType: formData.employment?.employmentType || existingData?.employmentType || 'تمام وقت',
      employmentStatus: (formData.employment?.employmentStatus as EmploymentStatus) || existingData?.employmentStatus || 'active',
      contractType: formData.employment?.contractType || existingData?.contractType || 'موقت',
      hireDate: formData.employment?.hireDate || existingData?.hireDate || '',
      hireDateJalali: formData.employment?.hireDate ? toJalaliDate(formData.employment.hireDate) : (existingData?.hireDateJalali || ''),
      contractEndDate: formData.employment?.contractEndDate !== undefined ? formData.employment?.contractEndDate : existingData?.contractEndDate,
      baseSalary: formData.salary?.baseSalary !== undefined ? Number(formData.salary.baseSalary) : existingData?.baseSalary,
      netSalary: formData.salary?.netSalary !== undefined ? Number(formData.salary.netSalary) : existingData?.netSalary,

      // Supplementary Insurance
      hasSupplementaryInsurance: formData.insurance?.hasSupplementaryInsurance !== undefined ? formData.insurance.hasSupplementaryInsurance : existingData?.hasSupplementaryInsurance,
      supplementaryInsurancePaymentMethod: formData.insurance?.supplementaryInsurancePaymentMethod || formData.insurance?.supplementaryPaymentMethod || existingData?.supplementaryInsurancePaymentMethod,
      supplementaryInsurancePremium: formData.insurance?.supplementaryInsurancePremium !== undefined ? Number(formData.insurance.supplementaryInsurancePremium) : existingData?.supplementaryInsurancePremium,
      supplementaryInsuranceCompany: formData.insurance?.supplementaryInsuranceCompany || existingData?.supplementaryInsuranceCompany,

      // Promissory Note Guarantee (سفته ضمانت حسن انجام کار)
      guaranteeNoteAmount: formData.additionalInfo?.guaranteeNoteAmount !== undefined 
        ? Number(formData.additionalInfo.guaranteeNoteAmount) 
        : (existingData?.guaranteeNoteAmount !== undefined ? existingData?.guaranteeNoteAmount : 1000000000),
      guaranteeNoteNumber: formData.additionalInfo?.guaranteeNoteNumber !== undefined ? formData.additionalInfo.guaranteeNoteNumber : existingData?.guaranteeNoteNumber,
      guaranteeNoteStatus: formData.additionalInfo?.guaranteeNoteStatus || existingData?.guaranteeNoteStatus || 'received',
      guaranteeNoteReceivedDateJalali: formData.additionalInfo?.guaranteeNoteReceivedDateJalali !== undefined ? formData.additionalInfo.guaranteeNoteReceivedDateJalali : existingData?.guaranteeNoteReceivedDateJalali,
      guaranteeNoteDueDateJalali: formData.additionalInfo?.guaranteeNoteDueDateJalali !== undefined ? formData.additionalInfo.guaranteeNoteDueDateJalali : existingData?.guaranteeNoteDueDateJalali,
      guaranteeNoteGuarantorName: formData.additionalInfo?.guaranteeNoteGuarantorName !== undefined ? formData.additionalInfo.guaranteeNoteGuarantorName : existingData?.guaranteeNoteGuarantorName,
      guaranteeNoteDescription: formData.additionalInfo?.guaranteeNoteDescription !== undefined ? formData.additionalInfo.guaranteeNoteDescription : existingData?.guaranteeNoteDescription,

      updatedAt: now,
      updatedBy: actor.uid
    };

    batch.set(empRef, summary, { merge: true });

    // Update Subcollections if supplied
    if (formData.contacts) {
      batch.set(doc(db, `employees/${empId}/contacts`, 'primary'), { id: 'primary', ...formData.contacts }, { merge: true });
    }
    if (formData.addresses && formData.addresses.length > 0) {
      formData.addresses.forEach((addr, idx) => {
        batch.set(doc(db, `employees/${empId}/addresses`, addr.id || `addr-${idx}`), addr, { merge: true });
      });
    }
    if (formData.employment) {
      batch.set(doc(db, `employees/${empId}/employment`, 'current'), { id: 'current', ...formData.employment }, { merge: true });
    }
    if (formData.organization) {
      batch.set(doc(db, `employees/${empId}/organization`, 'current'), { id: 'current', ...formData.organization }, { merge: true });
    }
    if (formData.insurance) {
      batch.set(doc(db, `employees/${empId}/insurance`, 'primary'), { id: 'primary', ...formData.insurance }, { merge: true });
    }
    if (formData.banking) {
      batch.set(doc(db, `employees/${empId}/bankAccounts`, 'primary'), { id: 'primary', ...formData.banking }, { merge: true });
    }
    if (formData.salary) {
      batch.set(doc(db, `employees/${empId}/salaryHistory`, `sal-${Date.now()}`), {
        id: `sal-${Date.now()}`,
        ...formData.salary,
        createdAt: now
      });
    }
    if (formData.emergencyContacts && formData.emergencyContacts.length > 0) {
      formData.emergencyContacts.forEach((em, idx) => {
        batch.set(doc(db, `employees/${empId}/emergencyContacts`, em.id || `em-${idx}`), em, { merge: true });
      });
    }
    if (formData.additionalInfo) {
      batch.set(doc(db, `employees/${empId}/additionalInfo`, 'primary'), { id: 'primary', ...formData.additionalInfo }, { merge: true });
    }

    // Timeline event
    const timelineRef = doc(db, `employees/${empId}/timeline`, `event-${Date.now()}`);
    batch.set(timelineRef, {
      id: `event-${Date.now()}`,
      type: 'ویرایش پرونده',
      title: 'ویرایش و بروزرسانی مشخصات پرسنل',
      description: `مشخصات پرونده توسط ${actor.displayName || 'کاربر'} ویرایش گردید.`,
      date: now.split('T')[0],
      dateJalali: getCurrentJalaliDate(),
      actorName: actor.displayName || 'مدیر سیستم',
      actorId: actor.uid
    });

    await batch.commit().catch(err => {
      console.warn('Firestore update batch failed, continuing with local cache:', err);
    });

    // Update local cache
    try {
      const currentStored = getStoredEmployees();
      const idx = currentStored.findIndex(e => e.id === empId);
      if (idx >= 0) {
        currentStored[idx] = { ...currentStored[idx], ...summary } as EmployeeSummary;
      } else {
        currentStored.unshift(summary as EmployeeSummary);
      }
      saveStoredEmployees(currentStored);
    } catch (e) {
      console.warn('Error updating local employee cache on edit:', e);
    }

    // Audit log
    await logAuditEvent({
      userId: actor.uid,
      userName: actor.displayName || 'کاربر',
      userRole: actor.role,
      action: 'employee.updated',
      entityType: 'employee',
      entityId: empId,
      description: `مشخصات پرسنل ${summary.firstName} ${summary.lastName} (کد ${summary.employeeCode}) ویرایش گردید.`
    });

    return { success: true };
  } catch (error: any) {
    console.error('Error in updateFullEmployee:', error);
    return { success: false, error: error.message || 'خطا در ویرایش اطلاعات پرسنل' };
  }
}

/**
 * Add a new Salary Change record to preserve history
 */
export async function addSalaryHistoryRecord(
  employeeId: string,
  newSalaryData: Partial<SalaryInfo>,
  changeReason: string,
  actor: { uid: string; displayName: string; role: any }
) {
  try {
    const salId = `sal-${Date.now()}`;
    const now = new Date().toISOString();
    const salaryRef = doc(db, `employees/${employeeId}/salaryHistory`, salId);

    const record: SalaryInfo = {
      id: salId,
      effectiveDate: newSalaryData.effectiveDate || now.split('T')[0],
      effectiveDateJalali: toJalaliDate(newSalaryData.effectiveDate || now),
      baseSalary: newSalaryData.baseSalary || 0,
      housingAllowance: newSalaryData.housingAllowance || 0,
      childAllowance: newSalaryData.childAllowance || 0,
      maritalAllowance: newSalaryData.maritalAllowance || 0,
      foodVouchers: newSalaryData.foodVouchers || 0,
      fixedBenefits: newSalaryData.fixedBenefits || 0,
      variableBenefits: newSalaryData.variableBenefits || 0,
      overtimeEstimate: newSalaryData.overtimeEstimate || 0,
      bonusEstimate: newSalaryData.bonusEstimate || 0,
      taxDeduction: newSalaryData.taxDeduction || 0,
      insuranceDeduction: newSalaryData.insuranceDeduction || 0,
      grossSalary: newSalaryData.grossSalary || 0,
      netSalary: newSalaryData.netSalary || 0,
      changeReason,
      approvedBy: actor.displayName,
      createdAt: now
    };

    await setDoc(salaryRef, record);

    // Update summary document baseSalary & netSalary
    await updateDoc(doc(db, 'employees', employeeId), {
      baseSalary: record.baseSalary,
      netSalary: record.netSalary,
      updatedAt: now,
      updatedBy: actor.uid
    });

    // Add to timeline
    await setDoc(doc(db, `employees/${employeeId}/timeline`, `event-${Date.now()}`), {
      id: `event-${Date.now()}`,
      type: 'تغییر حقوق',
      title: 'صدور حکم جدید حقوق و دستمزد',
      description: `حقوق پایه به مبلغ ${record.baseSalary.toLocaleString('fa-IR')} ریال تغییر یافت. (${changeReason})`,
      date: record.effectiveDate,
      dateJalali: record.effectiveDateJalali || getCurrentJalaliDate(),
      actorName: actor.displayName,
      actorId: actor.uid
    });

    await logAuditEvent({
      userId: actor.uid,
      userName: actor.displayName,
      userRole: actor.role,
      action: 'salary.updated',
      entityType: 'salary',
      entityId: employeeId,
      description: `حکم حقوقی جدید با پایه ${record.baseSalary} ثبت شد.`
    });

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// ----------------------------------------------------
// DRAFTS & AUTOSAVE MANAGEMENT
// ----------------------------------------------------

/**
 * Save draft registration record
 */
export async function saveRegistrationDraft(
  draftOrId: EmployeeDraft | string,
  formData?: FullRegistrationFormData,
  currentStep?: number,
  userId?: string,
  userName?: string
): Promise<{ success: boolean; id: string }> {
  try {
    let draftData: any;
    if (typeof draftOrId === 'string') {
      draftData = {
        id: draftOrId,
        formData: formData || {},
        currentStep: currentStep || 1,
        createdById: userId || 'admin',
        createdByName: userName || 'مدیر منابع انسانی',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
    } else {
      draftData = {
        ...draftOrId,
        id: draftOrId.id || `draft-${Date.now()}`,
        updatedAt: new Date().toISOString()
      };
    }
    const draftRef = doc(db, 'drafts', draftData.id);
    await setDoc(draftRef, draftData);
    return { success: true, id: draftData.id };
  } catch (error) {
    console.error('Error saving registration draft:', error);
    return { success: false, id: '' };
  }
}

/**
 * Fetch a specific draft by ID
 */
export async function getRegistrationDraft(draftId: string): Promise<any | null> {
  try {
    const snap = await getDoc(doc(db, 'drafts', draftId));
    if (snap.exists()) {
      return { id: snap.id, ...snap.data() };
    }
    return null;
  } catch (error) {
    console.error('Error fetching single draft:', error);
    return null;
  }
}

/**
 * Fetch all unfinished registration drafts
 */
export async function getRegistrationDrafts(): Promise<EmployeeDraft[]> {
  try {
    const q = query(collection(db, 'drafts'), orderBy('updatedAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as EmployeeDraft));
  } catch (error) {
    console.error('Error fetching drafts:', error);
    return [];
  }
}

/**
 * Delete a draft after final submission or cancellation
 */
export async function deleteRegistrationDraft(draftId: string): Promise<boolean> {
  try {
    await deleteDoc(doc(db, 'drafts', draftId));
    return true;
  } catch (error) {
    console.error('Error deleting draft:', error);
    return false;
  }
}
