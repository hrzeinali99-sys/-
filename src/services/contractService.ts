import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  setDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy 
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { 
  EmploymentContract, 
  ContractPeriodType, 
  ContractStatus, 
  EmployeeSummary, 
  FullRegistrationFormData 
} from '../types';
import { logAuditEvent } from './auditService';
import { DEFAULT_COMPANIES } from './masterDataService';
import { calculateContractEndDate, getCurrentJalaliDate } from '../utils/persianDate';

const CONTRACTS_LOCAL_KEY = 'hrms_employment_contracts_v1';

// Seed sample contracts for initial presentation
export const SEED_CONTRACTS: EmploymentContract[] = [
  {
    id: 'cnt-101',
    contractNumber: 'CNT-1404-0101',
    employeeId: 'emp-101',
    employeeCode: 'EMP-1001',
    employeeName: 'امیرحسین رضایی',
    employeeFatherName: 'علی',
    employeeNationalId: '0012345678',
    employeeIdNumber: '1234',
    employeeBirthDate: '1368/06/20',
    employeeBirthPlace: 'تهران',
    employeeEducation: 'کارشناسی ارشد',
    employeeMajor: 'مهندسی کامپیوتر نرم‌افزار',
    employeeMaritalStatus: 'متأهل',
    employeeChildrenCount: 1,
    employeeMobile: '09121112233',
    employeeAddress: 'تهران، خیابان ولیعصر، نرسیده به میدان ونک، کوچه شروان، پلاک ۱۲',
    employeePostalCode: '1969713456',
    employeeBankName: 'بانک ملت',
    employeeIban: 'IR120120000000001234567890',
    
    // Employer
    companyId: 'comp-2',
    companyName: 'شرکت فناوری و داده‌پردازان کیهان',
    companyRegistrationNumber: '584210',
    companyNationalId: '14009876541',
    companyEconomicCode: '411345678913',
    companyWorkshopCode: '0189452011',
    companyAddress: 'تهران، پارک فناوری پردیس، ساختمان نوآوری ۳',
    companyPhone: '021-88776656',
    employerRepresentativeName: 'مهندس آرش طاهری',
    employerRepresentativePosition: 'مدیرعامل و نماینده قانونی',

    // Terms
    contractTitle: 'قرارداد کار مدت موقت (موضوع ماده ۱۰ قانون کار)',
    contractType: 'موقت',
    periodType: '1_year',
    periodLabel: 'یک ساله (۱۲ ماهه)',
    durationMonths: 12,
    startDateJalali: '1404/01/01',
    endDateJalali: '1404/12/29',
    probationDurationDays: 30,
    trialPeriodDescription: 'یک ماه از ابتدای قرارداد به عنوان دوره آزمایشی تعیین می‌گردد.',

    // Org
    departmentName: 'مهندسی نرم‌افزار و هوش مصنوعی',
    positionTitle: 'معمار ارشد نرم‌افزار و سرپرست فنی',
    jobResponsibilities: 'طراحی معماری میکروسرویس‌ها، نظارت بر کدهای بک‌اند، هدایت فنی تیم نرم‌افزار و مدیریت امنیت سرویس‌ها',
    workLocation: 'دفتر مرکزی - برج میرداماد',
    weeklyHours: 44,
    shiftType: 'عادی اداری (شنبه تا چهارشنبه ۸:۰۰ الی ۱۷:۰۰)',

    // Financials in Rials
    dailyBaseWage: 15000000,
    monthlyBaseSalary: 450000000,
    housingAllowance: 90000000,
    groceryAllowance: 140000000,
    childAllowance: 71600000,
    maritalAllowance: 50000000,
    positionAllowance: 120000000,
    attractionAllowance: 80000000,
    otherContinuousBenefits: 50000000,
    grossSalaryMonthly: 951600000,
    netEstimatedSalaryMonthly: 812000000,

    customTerms: [
      'کارپذیر متعهد می‌گردد کلیه سورس‌کدها، داده‌ها و اطلاعات محرمانه سازمانی را به مدت ۵ سال پس از خاتمه قرارداد حفظ نماید.',
      'تجهیزات تخصصی لپ‌تاپ و سرور در اختیار کارپذیر به عنوان امانت تحویل شده و کارپذیر متعهد به نگهداری صحیح از آن‌ها می‌باشد.'
    ],
    confidentialityClause: true,
    copyCount: 3,

    status: 'signed',
    issuedAt: new Date().toISOString(),
    issuedAtJalali: '1404/01/01',
    signedAt: new Date().toISOString(),
    signedAtJalali: '1404/01/05',
    notes: 'قرارداد رسمی تمدید شده سال ۱۴۰۴ با تایید مدیر منابع انسانی و مدیرعامل',
    createdBy: 'system',
    createdByName: 'مدیر ارشد منابع انسانی'
  },
  {
    id: 'cnt-102',
    contractNumber: 'CNT-1404-0206',
    employeeId: 'emp-102',
    employeeCode: 'EMP-1002',
    employeeName: 'سارا محمدی',
    employeeFatherName: 'محمود',
    employeeNationalId: '0023456789',
    employeeIdNumber: '5678',
    employeeBirthDate: '1372/08/12',
    employeeBirthPlace: 'اصفهان',
    employeeEducation: 'کارشناسی',
    employeeMajor: 'مدیریت دولتی و منابع انسانی',
    employeeMaritalStatus: 'مجرد',
    employeeChildrenCount: 0,
    employeeMobile: '09122223344',
    employeeAddress: 'تهران، سعادت‌آباد، میدان کاج، خیابان سرو غربی، پلاک ۴۴',
    employeePostalCode: '1998765432',
    employeeBankName: 'بانک پاسارگاد',
    employeeIban: 'IR580570000000009876543210',
    
    // Employer
    companyId: 'comp-1',
    companyName: 'گروه سرمایه‌گذاری و توسعه مالی کیهان (هلدینگ مادر)',
    companyRegistrationNumber: '542100',
    companyNationalId: '14008923145',
    companyEconomicCode: '411345678912',
    companyWorkshopCode: '0123984501',
    companyAddress: 'تهران، بلوار میرداماد، برج کیهان، طبقه ۱۲',
    companyPhone: '021-88776655',
    employerRepresentativeName: 'دکتر محمدرضا کیهانی',
    employerRepresentativePosition: 'مدیرعامل هلدینگ',

    // Terms
    contractTitle: 'قرارداد کار مدت موقت (موضوع ماده ۱۰ قانون کار)',
    contractType: 'موقت',
    periodType: '6_months',
    periodLabel: 'شش ماهه (۶ ماهه)',
    durationMonths: 6,
    startDateJalali: '1404/01/01',
    endDateJalali: '1404/06/31',
    probationDurationDays: 30,
    trialPeriodDescription: 'یک ماه از ابتدای خدمت به عنوان دوره آزمایشی با حقوق کامل در نظر گرفته شده است.',

    // Org
    departmentName: 'منابع انسانی و آموزش',
    positionTitle: 'کارشناس ارشد جذب و استخدام',
    jobResponsibilities: 'غربالگری رزومه‌ها، هدایت مصاحبه‌های استخدامی، آنبوردینگ پرسنل جدید و مدیریت فرایند ارزیابی دوره‌ای',
    workLocation: 'ستاد هلدینگ کیهان',
    weeklyHours: 44,
    shiftType: 'عادی (شنبه تا چهارشنبه ۸:۰۰ الی ۱۷:۰۰)',

    // Financials in Rials
    dailyBaseWage: 10666667,
    monthlyBaseSalary: 320000000,
    housingAllowance: 90000000,
    groceryAllowance: 140000000,
    childAllowance: 0,
    maritalAllowance: 0,
    positionAllowance: 60000000,
    attractionAllowance: 40000000,
    otherContinuousBenefits: 25000000,
    grossSalaryMonthly: 675000000,
    netEstimatedSalaryMonthly: 590000000,

    customTerms: [
      'کارپذیر متعهد به رعایت منشور اخلاقی و حفظ اسرار پرونده‌های پرسنلی و اطلاعات حقوق و دستمزد می‌باشد.'
    ],
    confidentialityClause: true,
    copyCount: 3,

    status: 'signed',
    issuedAt: new Date().toISOString(),
    issuedAtJalali: '1404/01/01',
    signedAt: new Date().toISOString(),
    signedAtJalali: '1404/01/03',
    notes: 'قرارداد ۶ ماهه اول سال ۱۴۰۴ با ارزیابی عملکرد عالی',
    createdBy: 'system',
    createdByName: 'مدیر ارشد منابع انسانی'
  },
  {
    id: 'cnt-103',
    contractNumber: 'CNT-1404-0301',
    employeeId: 'emp-103',
    employeeCode: 'EMP-1003',
    employeeName: 'نیما صادقی',
    employeeFatherName: 'حسین',
    employeeNationalId: '0034567890',
    employeeIdNumber: '9012',
    employeeBirthDate: '1375/04/18',
    employeeBirthPlace: 'شیراز',
    employeeEducation: 'کارشناسی',
    employeeMajor: 'مهندسی فناوری اطلاعات',
    employeeMaritalStatus: 'مجرد',
    employeeChildrenCount: 0,
    employeeMobile: '09123334455',
    employeeAddress: 'تهران، پونک، بلوار کمالی، کوچه گلستان، پلاک ۵',
    employeePostalCode: '1478965412',
    employeeBankName: 'بانک سامان',
    employeeIban: 'IR890560000000003456789012',
    
    // Employer
    companyId: 'comp-3',
    companyName: 'شرکت هوش مصنوعی و تحلیل داده پیشرو پارس',
    companyRegistrationNumber: '612340',
    companyNationalId: '14007654329',
    companyEconomicCode: '411987654321',
    companyWorkshopCode: '0256410981',
    companyAddress: 'تهران، سعادت‌آباد، خیابان علامه طباطبایی، پلاک ۱۸',
    companyPhone: '021-22334455',
    employerRepresentativeName: 'دکتر هومن فرخی',
    employerRepresentativePosition: 'مدیرعامل شرکت',

    // Terms
    contractTitle: 'قرارداد کار آزمایشی / کوتاه‌مدت (موضوع ماده ۱۱ قانون کار)',
    contractType: 'موقت',
    periodType: '1_month',
    periodLabel: 'ماهانه (۱ ماهه آزمایشی)',
    durationMonths: 1,
    startDateJalali: '1404/01/01',
    endDateJalali: '1404/01/31',
    probationDurationDays: 30,
    trialPeriodDescription: 'کل مدت این قرارداد یک ماهه به عنوان دوره آزمایشی و ارزیابی مهارتی محسوب می‌شود.',

    // Org
    departmentName: 'هوش مصنوعی و یادگیری عمیق',
    positionTitle: 'کارشناس هوش مصنوعی و داده‌کاوی',
    jobResponsibilities: 'توسعه پایپ‌لاین‌های پردازش زبان طبیعی، ارزیابی مدل‌های زبانی و آماده‌سازی داده‌های آموزشی',
    workLocation: 'مرکز تحقیقات هوش مصنوعی پردیس',
    weeklyHours: 44,
    shiftType: 'عادی منعطف (شنبه تا چهارشنبه)',

    // Financials in Rials
    dailyBaseWage: 12666667,
    monthlyBaseSalary: 380000000,
    housingAllowance: 90000000,
    groceryAllowance: 140000000,
    childAllowance: 0,
    maritalAllowance: 0,
    positionAllowance: 80000000,
    attractionAllowance: 50000000,
    otherContinuousBenefits: 30000000,
    grossSalaryMonthly: 770000000,
    netEstimatedSalaryMonthly: 665000000,

    customTerms: [
      'در صورت رضایت طرفین در پایان ماه اول، قرارداد به صورت ۶ ماهه یا سالانه تمدید خواهد شد.'
    ],
    confidentialityClause: true,
    copyCount: 3,

    status: 'issued',
    issuedAt: new Date().toISOString(),
    issuedAtJalali: '1404/01/01',
    notes: 'قرارداد یک ماهه آزمایشی برای جذب و ارزیابی اولیه پروژه هوش مصنوعی',
    createdBy: 'system',
    createdByName: 'مدیر ارشد منابع انسانی'
  }
];

function getStoredContracts(): EmploymentContract[] {
  try {
    const raw = localStorage.getItem(CONTRACTS_LOCAL_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Could not read contracts from local storage:', e);
  }

  // دیگه به صورت خودکار Seed نکن
  return [];
}
function saveStoredContracts(contracts: EmploymentContract[]): void {
  try {
    localStorage.setItem(CONTRACTS_LOCAL_KEY, JSON.stringify(contracts));
  } catch (e) {
    console.warn('Could not write contracts to local storage:', e);
  }
}

/**
 * Fetch all contracts (optionally filtered by employeeId)
 */
export async function getContracts(employeeId?: string): Promise<EmploymentContract[]> {
  try {
    if (db) {
      let q = collection(db, 'contracts');
      const snap = await getDocs(q);
      if (!snap.empty) {
        let list = snap.docs.map(docSnap => ({
          ...docSnap.data(),
          id: docSnap.id
        } as EmploymentContract));

        if (employeeId) {
          list = list.filter(c => c.employeeId === employeeId);
        }
        // Sync local cache
        if (list.length > 0) {
          saveStoredContracts(list);
          return list;
        }
      }
    }
  } catch (err) {
    console.warn('Firestore fetch for contracts failed, using local storage cache:', err);
  }

  // Fallback to local storage
  const localList = getStoredContracts();
  if (employeeId) {
    return localList.filter(c => c.employeeId === employeeId);
  }
  return localList;
}

/**
 * Get a single contract by its ID
 */
export async function getContractById(id: string): Promise<EmploymentContract | null> {
  try {
    if (db) {
      const docRef = doc(db, 'contracts', id);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        return { ...snap.data(), id: snap.id } as EmploymentContract;
      }
    }
  } catch (e) {
    console.warn('Firestore getContractById failed:', e);
  }

  const list = getStoredContracts();
  return list.find(c => c.id === id) || null;
}

/**
 * Save or Update a Contract
 */
export async function saveContract(contractData: Partial<EmploymentContract>): Promise<EmploymentContract> {
  const isNew = !contractData.id;
  const id = contractData.id || `cnt-${Date.now()}`;
  const nowIso = new Date().toISOString();
  const nowJalali = getCurrentJalaliDate();

  const completeContract: EmploymentContract = {
    id,
    contractNumber: contractData.contractNumber || `CNT-${nowJalali.replace(/\//g, '').slice(0, 6)}-${Math.floor(100 + Math.random() * 900)}`,
    employeeId: contractData.employeeId || '',
    employeeCode: contractData.employeeCode || '',
    employeeName: contractData.employeeName || '',
    employeeFatherName: contractData.employeeFatherName || '',
    employeeNationalId: contractData.employeeNationalId || '',
    employeeIdNumber: contractData.employeeIdNumber || '',
    employeeBirthDate: contractData.employeeBirthDate || '',
    employeeBirthPlace: contractData.employeeBirthPlace || 'تهران',
    employeeEducation: contractData.employeeEducation || 'کارشناسی',
    employeeMajor: contractData.employeeMajor || '',
    employeeMaritalStatus: contractData.employeeMaritalStatus || 'مجرد',
    employeeChildrenCount: contractData.employeeChildrenCount || 0,
    employeeMobile: contractData.employeeMobile || '',
    employeeAddress: contractData.employeeAddress || '',
    employeePostalCode: contractData.employeePostalCode || '',
    employeeBankName: contractData.employeeBankName || '',
    employeeIban: contractData.employeeIban || '',

    // Employer
    companyId: contractData.companyId || 'comp-1',
    companyName: contractData.companyName || 'گروه سرمایه‌گذاری کیهان',
    companyRegistrationNumber: contractData.companyRegistrationNumber || '542100',
    companyNationalId: contractData.companyNationalId || '14008923145',
    companyEconomicCode: contractData.companyEconomicCode || '411345678912',
    companyWorkshopCode: contractData.companyWorkshopCode || '0123984501',
    companyAddress: contractData.companyAddress || 'تهران، بلوار میرداماد، برج کیهان',
    companyPhone: contractData.companyPhone || '021-88776655',
    employerRepresentativeName: contractData.employerRepresentativeName || 'دکتر محمدرضا کیهانی',
    employerRepresentativePosition: contractData.employerRepresentativePosition || 'مدیرعامل و نماینده قانونی',

    // Terms
    contractTitle: contractData.contractTitle || 'قرارداد کار مدت موقت (موضوع ماده ۱۰ قانون کار)',
    contractType: contractData.contractType || 'موقت',
    periodType: contractData.periodType || '1_year',
    periodLabel: contractData.periodLabel || getPeriodLabel(contractData.periodType || '1_year'),
    durationMonths: contractData.durationMonths || getPeriodMonths(contractData.periodType || '1_year'),
    startDateJalali: contractData.startDateJalali || nowJalali,
    endDateJalali: contractData.endDateJalali || calculateContractEndDate(contractData.startDateJalali || nowJalali, contractData.durationMonths || 12),
    probationDurationDays: contractData.probationDurationDays ?? 30,
    trialPeriodDescription: contractData.trialPeriodDescription || 'مدت دوره آزمایشی مطابق توافق طرفین و قانون کار تعیین گردید.',

    // Org
    departmentName: contractData.departmentName || 'عمومی',
    positionTitle: contractData.positionTitle || 'کارشناس',
    jobResponsibilities: contractData.jobResponsibilities || 'انجام وظایف محوله شغلی بر اساس شرح شغل مصوب سازمان',
    workLocation: contractData.workLocation || 'دفتر مرکزی',
    weeklyHours: contractData.weeklyHours || 44,
    shiftType: contractData.shiftType || 'عادی اداری (شنبه تا چهارشنبه)',

    // Financials
    dailyBaseWage: contractData.dailyBaseWage || Math.round((contractData.monthlyBaseSalary || 300000000) / 30),
    monthlyBaseSalary: contractData.monthlyBaseSalary || 300000000,
    housingAllowance: contractData.housingAllowance || 90000000,
    groceryAllowance: contractData.groceryAllowance || 140000000,
    childAllowance: contractData.childAllowance || 0,
    maritalAllowance: contractData.maritalAllowance || 0,
    positionAllowance: contractData.positionAllowance || 0,
    attractionAllowance: contractData.attractionAllowance || 0,
    otherContinuousBenefits: contractData.otherContinuousBenefits || 0,
    grossSalaryMonthly: contractData.grossSalaryMonthly || 530000000,
    netEstimatedSalaryMonthly: contractData.netEstimatedSalaryMonthly || 470000000,

    customTerms: contractData.customTerms || [
      'کارپذیر متعهد به حفظ اطلاعات محرمانه، رعایت آیین‌نامه‌های انضباطی و حسن انجام کار می‌باشد.'
    ],
    confidentialityClause: contractData.confidentialityClause ?? true,
    copyCount: contractData.copyCount || 3,

    status: contractData.status || 'issued',
    issuedAt: contractData.issuedAt || nowIso,
    issuedAtJalali: contractData.issuedAtJalali || nowJalali,
    signedAt: contractData.signedAt,
    signedAtJalali: contractData.signedAtJalali,
    notes: contractData.notes || '',
    createdBy: contractData.createdBy || 'current_user',
    createdByName: contractData.createdByName || 'کارشناس منابع انسانی'
  };

  // 1. Try persisting to Firestore
  try {
    if (db) {
      await setDoc(doc(db, 'contracts', id), completeContract);
    }
  } catch (err) {
    console.warn('Firestore setDoc failed, saving to local storage:', err);
  }

  // 2. Persist to Local Storage cache
  const list = getStoredContracts();
  const index = list.findIndex(c => c.id === id);
  if (index >= 0) {
    list[index] = completeContract;
  } else {
    list.unshift(completeContract);
  }
  saveStoredContracts(list);

  // 3. Log Audit
  await logAuditEvent({
    userId: 'current_user',
    userName: completeContract.createdByName || 'کاربر منابع انسانی',
    userRole: 'hr_admin',
    action: isNew ? 'صدور قرارداد پرسنلی' : 'ویرایش قرارداد پرسنلی',
    entityType: 'contract',
    entityId: id,
    description: `قرارداد ${completeContract.periodLabel} برای «${completeContract.employeeName}» (شماره ${completeContract.contractNumber}) ${isNew ? 'صادر گردید' : 'به‌روزرسانی شد'}.`
  });

  return completeContract;
}

/**
 * Delete a contract
 */
export async function deleteContract(id: string): Promise<boolean> {
  try {
    if (db) {
      await deleteDoc(doc(db, 'contracts', id));
    }
  } catch (e) {
    console.warn('Firestore deleteDoc for contract failed:', e);
  }

  const list = getStoredContracts();
  const filtered = list.filter(c => c.id !== id);
  saveStoredContracts(filtered);

  await logAuditEvent({
    userId: 'current_user',
    userName: 'کاربر منابع انسانی',
    userRole: 'hr_admin',
    action: 'حذف قرارداد پرسنلی',
    entityType: 'contract',
    entityId: id,
    description: `قرارداد پرسنلی با شناسه ${id} از سامانه حذف گردید.`
  });

  return true;
}

/**
 * Update contract status (e.g. signed, expired, terminated)
 */
export async function updateContractStatus(id: string, newStatus: ContractStatus): Promise<boolean> {
  const contract = await getContractById(id);
  if (!contract) return false;

  contract.status = newStatus;
  if (newStatus === 'signed' && !contract.signedAt) {
    contract.signedAt = new Date().toISOString();
    contract.signedAtJalali = getCurrentJalaliDate();
  }

  await saveContract(contract);
  return true;
}

/**
 * Build a ready-to-use Contract Draft prefilled from full employee profile data
 */
export function buildContractFromEmployee(
  emp: Partial<FullRegistrationFormData> | EmployeeSummary,
  period: ContractPeriodType = '1_year',
  customStartDateJalali?: string
): Partial<EmploymentContract> {
  const nowJalali = customStartDateJalali || getCurrentJalaliDate();
  const durationMonths = getPeriodMonths(period);
  const endDateJalali = calculateContractEndDate(nowJalali, durationMonths);
  const periodLabel = getPeriodLabel(period);

  // Find company
  const compId = (emp as any).companyId || (emp as any).organization?.companyId || 'comp-1';
  const company = DEFAULT_COMPANIES.find(c => c.id === compId) || DEFAULT_COMPANIES[0];

  // Address
  let addrStr = '';
  let postalCodeStr = '';
  if ((emp as any).addresses && Array.isArray((emp as any).addresses) && (emp as any).addresses.length > 0) {
    const primaryAddr = (emp as any).addresses[0];
    addrStr = `${primaryAddr.province || ''}، ${primaryAddr.city || ''}، ${primaryAddr.fullAddress || ''}`;
    postalCodeStr = primaryAddr.postalCode || '';
  }

  // Banking
  const bank = (emp as any).banking || (emp as any).bankAccounts?.[0] || (emp as any).bankAccount;
  const bankName = bank?.bankName || 'بانک تجارت';
  const iban = bank?.iban || '';

  // Salary
  const salaryObj = (emp as any).salary;
  const baseSalary = salaryObj?.baseSalary || (emp as any).baseSalary || 350000000;
  const housing = salaryObj?.housingAllowance || 90000000;
  const grocery = salaryObj?.groceryAllowance || salaryObj?.foodVouchers || 140000000;
  const child = salaryObj?.childAllowance || 0;
  const marital = salaryObj?.maritalAllowance || salaryObj?.marriageAllowance || 0;
  const positionBonus = salaryObj?.fixedBonus || salaryObj?.fixedBenefits || 0;
  const attraction = salaryObj?.performanceBonus || 0;
  const otherContinuous = salaryObj?.variableBenefits || 0;

  const grossSalary = baseSalary + housing + grocery + child + marital + positionBonus + attraction + otherContinuous;
  const netEstimated = salaryObj?.netSalary || Math.round(grossSalary * 0.85);

  const employeeName = `${emp.firstName || ''} ${emp.lastName || ''}`.trim() || 'پرسنل گرامی';
  const positionTitle = (emp as any).positionTitle || (emp as any).organization?.positionTitle || 'کارشناس سازمانی';
  const departmentName = (emp as any).departmentName || (emp as any).organization?.departmentName || 'دپارتمان عمومی';
  const branchName = (emp as any).branchName || (emp as any).organization?.branchName || 'دفتر مرکزی';

  // Contract title based on period
  let title = 'قرارداد کار مدت موقت (موضوع ماده ۱۰ قانون کار)';
  let probationDays = 30;
  if (period === '1_month') {
    title = 'قرارداد کار مدت موقت و آزمایشی (موضوع ماده ۱۰ و ۱۱ قانون کار)';
    probationDays = 30;
  } else if (period === '3_months') {
    title = 'قرارداد کار سه‌ماهه مدت موقت (موضوع ماده ۱۰ قانون کار)';
    probationDays = 30;
  } else if (period === '6_months') {
    title = 'قرارداد کار شش‌ماهه مدت موقت (موضوع ماده ۱۰ قانون کار)';
    probationDays = 30;
  } else if (period === '1_year') {
    title = 'قرارداد کار یک ساله مدت موقت (موضوع ماده ۱۰ قانون کار)';
    probationDays = 90;
  }

  const randCode = Math.floor(100 + Math.random() * 900);
  const contractNumber = `CNT-${nowJalali.replace(/\//g, '').slice(0, 6)}-${randCode}`;

  return {
    contractNumber,
    employeeId: (emp as any).id || (emp as any).employeeId || '',
    employeeCode: emp.employeeCode || '',
    employeeName,
    employeeFatherName: (emp as any).fatherName || '',
    employeeNationalId: emp.nationalId || '',
    employeeIdNumber: (emp as any).idNumber || emp.nationalId || '',
    employeeBirthDate: (emp as any).birthDateJalali || (emp as any).birthDate || '',
    employeeBirthPlace: (emp as any).birthPlace || (emp as any).birthCity || 'تهران',
    employeeEducation: (emp as any).educationList?.[0]?.degreeLevel || (emp as any).educationLevel || 'کارشناسی',
    employeeMajor: (emp as any).educationList?.[0]?.major || (emp as any).major || '',
    employeeMaritalStatus: emp.maritalStatus || 'مجرد',
    employeeChildrenCount: emp.childrenCount || 0,
    employeeMobile: (emp as any).mobile || (emp as any).contacts?.mobile || '',
    employeeAddress: addrStr || 'تهران، نشانی ثبت‌شده در پرونده پرسنلی',
    employeePostalCode: postalCodeStr || '1999999999',
    employeeBankName: bankName,
    employeeIban: iban,

    // Employer
    companyId: company.id,
    companyName: company.name,
    companyRegistrationNumber: company.registrationNumber || '542100',
    companyNationalId: company.nationalId || '14008923145',
    companyEconomicCode: company.economicCode || '411345678912',
    companyWorkshopCode: '0189452011',
    companyAddress: company.address || 'تهران، بلوار میرداماد، برج کیهان',
    companyPhone: company.phone || '021-88776655',
    employerRepresentativeName: company.ceoName || 'مدیرعامل و نماینده قانونی',
    employerRepresentativePosition: 'مدیرعامل شرکت',

    // Terms
    contractTitle: title,
    contractType: 'موقت',
    periodType: period,
    periodLabel,
    durationMonths,
    startDateJalali: nowJalali,
    endDateJalali,
    probationDurationDays: probationDays,
    trialPeriodDescription: period === '1_month'
      ? 'کل دوره قرارداد یک ماهه به عنوان دوره آزمایشی موضوع ماده ۱۱ قانون کار محسوب می‌شود.'
      : `${probationDays} روز ابتدای مدت قرارداد به عنوان دوره آزمایشی با دریافت کلیه حقوق و مزایا تعیین می‌گردد.`,

    // Org
    departmentName,
    positionTitle,
    jobResponsibilities: `انجام امور محوله در سمت ${positionTitle} مطابق دستورالعمل‌ها و فرآیندهای سازمانی شرکت ${company.name}`,
    workLocation: `${branchName} - ${company.address || 'دفتر مرکزی'}`,
    weeklyHours: 44,
    shiftType: 'عادی اداری (شنبه تا چهارشنبه ۸:۰۰ الی ۱۷:۰۰)',

    // Financials in Rials
    dailyBaseWage: Math.round(baseSalary / 30),
    monthlyBaseSalary: baseSalary,
    housingAllowance: housing,
    groceryAllowance: grocery,
    childAllowance: child,
    maritalAllowance: marital,
    positionAllowance: positionBonus,
    attractionAllowance: attraction,
    otherContinuousBenefits: otherContinuous,
    grossSalaryMonthly: grossSalary,
    netEstimatedSalaryMonthly: netEstimated,

    customTerms: [
      'کارپذیر متعهد می‌گردد کلیه اصول حفظ محرمانگی اطلاعات، کدها و داده‌های تجاری سازمان را دقیقاً رعایت نماید.',
      'تجهیزات و امکانات سخت‌افزاری و نرم‌افزاری تحویلی، در حکم امانت کاری بوده و کارپذیر موظف به حفظ و نگهداری مطلوب آن‌هاست.'
    ],
    confidentialityClause: true,
    copyCount: 3,

    status: 'issued',
    issuedAt: new Date().toISOString(),
    issuedAtJalali: nowJalali,
    notes: `تنظیم قرارداد ${periodLabel} بر اساس مصوبات سال جاری و اطلاعات پرونده ۳۶۰ درجه`,
    createdBy: 'current_user',
    createdByName: 'کارشناس منابع انسانی'
  };
}

export function getPeriodMonths(period: ContractPeriodType): number {
  switch (period) {
    case '1_month': return 1;
    case '3_months': return 3;
    case '6_months': return 6;
    case '1_year': return 12;
    case 'custom': return 6;
    default: return 12;
  }
}

export function getPeriodLabel(period: ContractPeriodType): string {
  switch (period) {
    case '1_month': return 'ماهانه (۱ ماهه)';
    case '3_months': return 'سه ماهه (۳ ماهه)';
    case '6_months': return 'شش ماهه (۶ ماهه)';
    case '1_year': return 'سالانه (یک ساله)';
    case 'custom': return 'سفارشی (دوره دلخواه)';
    default: return 'یک ساله';
  }
}
