import * as XLSX from 'xlsx';
import { 
  collection, 
  doc, 
  getDocs, 
  setDoc, 
  writeBatch,
  query,
  where
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { 
  EmployeeSummary, 
  Gender, 
  MaritalStatus, 
  ContractType, 
  EmploymentStatus,
  SupplementaryInsurancePaymentMethod
} from '../types';
import { toJalaliDate, jalaliToGregorianDate, getCurrentJalaliDate } from '../utils/persianDate';
import { toEnglishDigits } from '../utils/formatters';
import { DEFAULT_DEPARTMENTS, DEFAULT_BRANCHES, DEFAULT_COMPANIES } from './masterDataService';
import { logAuditEvent } from './auditService';

export interface ParsedEmployeeRow {
  rowNumber: number;
  employeeCode: string;
  firstName: string;
  lastName: string;
  latinFirstName?: string;
  latinLastName?: string;
  nationalId: string;
  gender: Gender;
  maritalStatus: MaritalStatus;
  childrenCount: number;
  mobile: string;
  workEmail?: string;
  companyName: string;
  branchName: string;
  departmentName: string;
  positionTitle: string;
  contractType: ContractType;
  employmentStatus: EmploymentStatus;
  employmentType: string;
  hireDateJalali: string;
  hireDateGregorian: string;
  birthDateJalali: string;
  birthDateGregorian: string;
  spouseBirthDateJalali?: string;
  spouseBirthDateGregorian?: string;
  childBirthDateJalali?: string;
  childBirthDateGregorian?: string;
  childrenBirthDatesJalali?: string[];
  childrenBirthDatesGregorian?: string[];
  baseSalary: number;
  militaryStatus?: string;
  educationLevel?: string;
  fieldOfStudy?: string;
  bankAccountNumber?: string;
  shebaNumber?: string;
  insuranceNumber?: string;
  hasSupplementaryInsurance?: boolean;
  supplementaryInsurancePaymentMethod?: SupplementaryInsurancePaymentMethod;
  supplementaryInsurancePremium?: number;
  supplementaryInsuranceCompany?: string;
  address?: string;

  // Validation results
  isValid: boolean;
  isExistingInDb: boolean;
  status: 'valid' | 'warning' | 'error';
  errors: string[];
  warnings: string[];
}

export interface ImportSummaryResult {
  totalRows: number;
  successCount: number;
  updatedCount: number;
  skippedCount: number;
  failedCount: number;
  importedEmployees: { id: string; name: string; code: string }[];
  errors: string[];
}

/**
 * Validates Iranian 10-digit National ID checksum
 */
export function isValidIranianNationalCode(code: string): boolean {
  if (!code) return false;
  const clean = toEnglishDigits(code).trim();
  if (!/^\d{8,10}$/.test(clean)) return false;
  
  const padded = clean.padStart(10, '0');
  
  // Reject identical digits (e.g. 0000000000, 1111111111, ...)
  if (/^(\d)\1{9}$/.test(padded)) return false;

  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(padded.charAt(i), 10) * (10 - i);
  }

  const remainder = sum % 11;
  const checkDigit = parseInt(padded.charAt(9), 10);

  if (remainder < 2) {
    return checkDigit === remainder;
  } else {
    return checkDigit === 11 - remainder;
  }
}

/**
 * Generates and downloads a standardized Persian Excel Template (.xlsx)
 */
export function generateEmployeeExcelTemplate() {
  const headers = [
    'کد پرسنلی*',
    'نام*',
    'نام خانوادگی*',
    'کد ملی*',
    'جنسیت',
    'وضعیت تاهل',
    'تعداد فرزندان',
    'تاریخ تولد همسر شمسی',
    'تاریخ تولد فرزند (یا فرزندان) شمسی',
    'شماره موبایل*',
    'ایمیل سازمانی',
    'نام شرکت',
    'شعبه / محل خدمت',
    'دپارتمان سازمانی*',
    'سمت شغلی / عنوان پست*',
    'نوع قرارداد',
    'وضعیت اشتغال',
    'نوع همکاری',
    'تاریخ استخدام شمسی*',
    'تاریخ تولد پرسنل شمسی',
    'حقوق پایه ماهانه (ریال)',
    'وضعیت نظام وظیفه',
    'سطح تحصیلات',
    'رشته تحصیلی',
    'شماره حساب یا شبا',
    'شماره بیمه تامین اجتماعی',
    'وضعیت بیمه تکمیلی (دارد / ندارد)',
    'نحوه پرداخت بیمه تکمیلی (کسر از حقوق / توسط خود فرد)',
    'مبلغ حق بیمه تکمیلی ماهانه (ریال)',
    'نام شرکت بیمه تکمیلی',
    'آدرس محل سکونت'
  ];

  const sampleRows = [
    [
      'EMP-1001',
      'علیرضا',
      'صادقی',
      '0012345678',
      'مرد',
      'متأهل',
      1,
      '1370/04/10',
      '1398/02/15',
      '09121112233',
      'a.sadeghi@company.ir',
      'شرکت فناوری داده‌پردازان کیهان',
      'دفتر مرکزی - برج میرداماد',
      'مهندسی نرم‌افزار و هوش مصنوعی',
      'توسعه‌دهنده ارشد فرانت‌اند',
      'دائمی',
      'فعال',
      'تمام وقت',
      '1403/01/15',
      '1368/06/20',
      450000000,
      'پایان خدمت',
      'کارشناسی ارشد',
      'مهندسی کامپیوتر',
      'IR120120000000001234567890',
      '12345678',
      'دارد',
      'کسر از حقوق',
      15000000,
      'بیمه ایران',
      'تهران، خیابان شریعتی، بالاتر از میرداماد، پلاک ۲۰'
    ],
    [
      'EMP-1002',
      'مریم',
      'کاظمی',
      '0023456789',
      'زن',
      'مجرد',
      0,
      '',
      '',
      '09122223344',
      'm.kazemi@company.ir',
      'شرکت فناوری داده‌پردازان کیهان',
      'مرکز توسعه - پارک فناوری پردیس',
      'منابع انسانی و توسعه سازمانی',
      'کارشناس ارشد جذب و استخدام',
      'موقت',
      'فعال',
      'تمام وقت',
      '1403/04/01',
      '1372/08/12',
      320000000,
      'غیر مشمول (بانوان)',
      'کارشناسی',
      'مدیریت دولتی',
      'IR340120000000009876543210',
      '87654321',
      'ندارد',
      '',
      0,
      '',
      'تهران، سعادت‌آباد، میدان کاج، پلاک ۴'
    ],
    [
      'EMP-1003',
      'حسین',
      'مرادی',
      '0034567890',
      'مرد',
      'متأهل',
      2,
      '1367/11/05',
      '1395/06/20, 1399/09/12',
      '09123334455',
      'h.moradi@company.ir',
      'شرکت فناوری داده‌پردازان کیهان',
      'شعبه اصفهان - شهرک علمی',
      'امور مالی، حسابداری و حقوق‌دستمزد',
      'حسابدار ارشد حقوق و دستمزد',
      'دائمی',
      'فعال',
      'تمام وقت',
      '1402/10/01',
      '1365/02/15',
      380000000,
      'معافیت دائم',
      'کارشناسی ارشد',
      'حسابداری',
      'IR560120000000005544332211',
      '55443322',
      'دارد',
      'پرداخت توسط خود فرد',
      22000000,
      'بیمه دانا',
      'اصفهان، خیابان چهارباغ بالا، کوچه نگار، پلاک ۱۵'
    ]
  ];

  const guideHeaders = ['نام فیلد', 'توضیحات و مقادیر مجاز', 'نمونه مقدار'];
  const guideRows = [
    ['کد پرسنلی', 'الزامی - شناسه منحصر‌به‌فرد پرسنل (لاتین یا عدد)', 'EMP-1004'],
    ['نام و نام خانوادگی', 'الزامی - نام و نام خانوادگی پرسنل به فارسی', 'سهراب رحیمی'],
    ['کد ملی', 'الزامی - کد ملی ۱۰ رقمی معتبر ایران', '0012345678'],
    ['شماره موبایل', 'الزامی - شماره همراه ۱۱ رقمی پرسنل', '09121234567'],
    ['جنسیت', 'اختیاری: مرد | زن', 'مرد'],
    ['وضعیت تاهل', 'اختیاری: مجرد | متأهل | معیل', 'متأهل'],
    ['تعداد فرزندان', 'اختیاری - عدد صحیح (مثلاً ۱ یا ۲)', '1'],
    ['تاریخ تولد همسر', 'اختیاری - فرمت YYYY/MM/DD (برای پرسنل متأهل)', '1370/04/10'],
    ['تاریخ تولد فرزند / فرزندان', 'اختیاری - فرمت YYYY/MM/DD (برای چند فرزند با کاما جدا شود)', '1398/02/15 یا 1395/06/20, 1399/09/12'],
    ['نام شرکت', 'اختیاری - نام شرکت محل فعالیت', 'شرکت فناوری داده‌پردازان کیهان'],
    ['شعبه / محل خدمت', 'اختیاری - نام شعبه یا ساختمان', 'دفتر مرکزی - برج میرداماد'],
    ['دپارتمان سازمانی', 'الزامی - نام یکی از دپارتمان‌های شرکت', 'مهندسی نرم‌افزار و هوش مصنوعی'],
    ['سمت سازمانی', 'الزامی - عنوان شغلی پرسنل', 'کارشناس ارشد DevOps'],
    ['نوع قرارداد', 'اختیاری: دائمی | موقت | پروژه‌ای | ساعتی | مشاور | کارآموز', 'دائمی'],
    ['وضعیت اشتغال', 'اختیاری: فعال | مرخصی | تعلیق | خاتمه یافته | بازنشسته', 'فعال'],
    ['تاریخ استخدام شمسی', 'الزامی - فرمت YYYY/MM/DD', '1404/01/15'],
    ['تاریخ تولد پرسنل شمسی', 'اختیاری - فرمت YYYY/MM/DD', '1370/05/20'],
    ['حقوق پایه ماهانه', 'اختیاری - عدد بر حسب ریال بدون ممیز', '350000000'],
    ['وضعیت بیمه تکمیلی', 'اختیاری: دارد | ندارد (یا فعال / غیرفعال)', 'دارد'],
    ['نحوه پرداخت بیمه تکمیلی', 'اختیاری: کسر از حقوق | پرداخت توسط خود فرد', 'کسر از حقوق'],
    ['مبلغ حق بیمه تکمیلی', 'اختیاری: عدد بر حسب ریال بدون ممیز', '15000000'],
    ['نام شرکت بیمه تکمیلی', 'اختیاری: نام شرکت بیمه‌گر (مانند ایران، دانا، سامان، البرز)', 'بیمه ایران']
  ];

  const wb = XLSX.utils.book_new();

  // 1. Data Sheet
  const wsData = XLSX.utils.aoa_to_sheet([headers, ...sampleRows]);
  wsData['!cols'] = headers.map(() => ({ wch: 24 }));
  if (!wsData['!views']) wsData['!views'] = [];
  wsData['!views'].push({ rightToLeft: true });
  XLSX.utils.book_append_sheet(wb, wsData, 'اطلاعات پرسنل');

  // 2. Guide Sheet
  const wsGuide = XLSX.utils.aoa_to_sheet([guideHeaders, ...guideRows]);
  wsGuide['!cols'] = [{ wch: 25 }, { wch: 55 }, { wch: 30 }];
  if (!wsGuide['!views']) wsGuide['!views'] = [];
  wsGuide['!views'].push({ rightToLeft: true });
  XLSX.utils.book_append_sheet(wb, wsGuide, 'راهنمای فیلدها');

  XLSX.writeFile(wb, 'قالب_اکسل_ورود_پرسنل_سامانه_همکار.xlsx');
}

/**
 * Maps varying Excel header text to canonical key
 */
function normalizeHeader(key: string): string {
  const clean = key.trim().toLowerCase().replace(/[*_-\s]/g, '');
  
  if (clean.includes('کدپرسنلی') || clean === 'employeecode' || clean === 'code') return 'employeeCode';
  if (clean === 'نام' || clean === 'firstname' || clean === 'first_name') return 'firstName';
  if (clean.includes('نامخانوادگی') || clean.includes('فامیلی') || clean === 'lastname' || clean === 'last_name') return 'lastName';
  if (clean.includes('کدملی') || clean.includes('nationalid') || clean === 'melli') return 'nationalId';
  if (clean.includes('جنسیت') || clean === 'gender') return 'gender';
  
  // Specific Family Birth Dates BEFORE general marital, children count, or personal birth date
  if (clean.includes('تولدهمسر') || (clean.includes('همسر') && (clean.includes('تولد') || clean.includes('تاریخ'))) || clean.includes('spousebirth') || clean === 'spousebirthdate' || clean === 'spousedate') return 'spouseBirthDate';
  if (clean.includes('تولدفرزند') || (clean.includes('فرزند') && (clean.includes('تولد') || clean.includes('تاریخ'))) || clean.includes('childbirth') || clean.includes('childrenbirth') || clean === 'childbirthdate' || clean === 'childrenbirthdate' || clean === 'childrenbirthdates') return 'childBirthDate';

  if (clean.includes('تعدادفرزند') || clean === 'children' || clean === 'childrencount') return 'childrenCount';
  if (clean.includes('تاهل') || clean.includes('marital')) return 'maritalStatus';
  if (clean.includes('فرزند') || clean.includes('children')) return 'childrenCount';
  if (clean.includes('موبایل') || clean.includes('همراه') || clean.includes('mobile') || clean.includes('phone')) return 'mobile';
  if (clean.includes('ایمیل') || clean.includes('email')) return 'workEmail';
  if (clean.includes('شرکت') || clean.includes('company')) return 'companyName';
  if (clean.includes('شعبه') || clean.includes('محلخدمت') || clean.includes('branch')) return 'branchName';
  if (clean.includes('دپارتمان') || clean.includes('واحد') || clean.includes('بخش') || clean.includes('department')) return 'departmentName';
  if (clean.includes('سمت') || clean.includes('شغل') || clean.includes('پست') || clean.includes('position') || clean.includes('title')) return 'positionTitle';
  if (clean.includes('قرارداد') || clean.includes('contract')) return 'contractType';
  if (clean.includes('وضعیت') || clean.includes('اشتغال') || clean.includes('status')) return 'employmentStatus';
  if (clean.includes('نوعهمکاری') || clean.includes('cooperation')) return 'employmentType';
  if (clean.includes('استخدام') || clean.includes('hiredate')) return 'hireDate';
  if (clean.includes('تولد') || clean.includes('birthdate')) return 'birthDate';
  if (clean.includes('حقوق') || clean.includes('دستمزد') || clean.includes('salary')) return 'baseSalary';
  if (clean.includes('سربازی') || clean.includes('نظاموظیفه') || clean.includes('military')) return 'militaryStatus';
  if (clean.includes('تحصیل') || clean.includes('مدرک') || clean.includes('education')) return 'educationLevel';
  if (clean.includes('رشته') || clean.includes('field')) return 'fieldOfStudy';
  // Supplementary Insurance specific headers
  if ((clean.includes('تکمیلی') && (clean.includes('پرداخت') || clean.includes('کسر') || clean.includes('نحوه') || clean.includes('شیوه') || clean.includes('روش'))) || clean.includes('کسرازحقوق') || clean.includes('توسطخودفرد') || clean === 'paymentmethod' || clean === 'supplementarypaymentmethod') return 'supplementaryInsurancePaymentMethod';
  if ((clean.includes('تکمیلی') && (clean.includes('مبلغ') || clean.includes('حق') || clean.includes('هزینه') || clean.includes('ریال') || clean.includes('قیمت'))) || clean === 'supplementarypremium' || clean === 'premium') return 'supplementaryInsurancePremium';
  if ((clean.includes('تکمیلی') && (clean.includes('شرکت') || clean.includes('بیمه‌گر') || clean.includes('بیمهگر') || clean.includes('نامشرکت'))) || clean.includes('شرکتبیمهتکمیلی')) return 'supplementaryInsuranceCompany';
  if (clean.includes('بیمهتکمیلی') || (clean.includes('تکمیلی') && (clean.includes('وضعیت') || clean.includes('دارد') || clean.includes('پوشش') || clean.includes('عضویت') || clean.includes('طرح')))) return 'hasSupplementaryInsurance';

  if (clean.includes('حساب') || clean.includes('شبا') || clean.includes('bank') || clean.includes('sheba')) return 'bankAccount';
  if (clean.includes('بیمه') || clean.includes('insurance')) return 'insuranceNumber';
  if (clean.includes('آدرس') || clean.includes('نشانی') || clean.includes('address')) return 'address';

  return key;
}

/**
 * Parses and validates an uploaded Excel file
 */
export async function parseAndValidateEmployeeExcelFile(file: File): Promise<{
  rows: ParsedEmployeeRow[];
  totalRows: number;
  validCount: number;
  warningCount: number;
  errorCount: number;
}> {
  const data = await file.arrayBuffer();
  const workbook = XLSX.read(data, { type: 'array' });

  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];

  // Convert to JSON array of objects
  const rawRows: Record<string, any>[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

  // Pre-fetch all existing employee codes and national IDs from Firestore
  const existingCodeMap = new Set<string>();
  const existingNationalIdMap = new Set<string>();

  try {
    const snap = await getDocs(collection(db, 'employees'));
    snap.docs.forEach(d => {
      const data = d.data();
      if (data.employeeCode) existingCodeMap.add(data.employeeCode.trim().toLowerCase());
      if (data.nationalId) existingNationalIdMap.add(toEnglishDigits(data.nationalId).trim());
    });
  } catch (e) {
    console.warn('Could not prefetch existing employee codes:', e);
  }

  const inSheetCodeMap = new Map<string, number>();
  const inSheetNationalIdMap = new Map<string, number>();

  const parsedRows: ParsedEmployeeRow[] = [];

  rawRows.forEach((rawRow, index) => {
    const rowNum = index + 2; // Excel 1-based index with header at row 1

    // Normalize keys
    const row: Record<string, any> = {};
    Object.keys(rawRow).forEach(k => {
      const normalizedKey = normalizeHeader(k);
      row[normalizedKey] = rawRow[k];
    });

    const errors: string[] = [];
    const warnings: string[] = [];

    // Extract & sanitize fields
    const employeeCode = String(row.employeeCode || '').trim();
    const firstName = String(row.firstName || '').trim();
    const lastName = String(row.lastName || '').trim();
    const rawNationalId = String(row.nationalId || '').trim();
    const nationalId = toEnglishDigits(rawNationalId).padStart(10, '0');
    const rawMobile = String(row.mobile || '').trim();
    const mobile = toEnglishDigits(rawMobile);
    const workEmail = String(row.workEmail || '').trim();

    // Gender
    let gender: Gender = 'مرد';
    const gVal = String(row.gender || '').trim();
    if (gVal.includes('زن') || gVal.toLowerCase() === 'female') gender = 'زن';

    // Marital Status
    let maritalStatus: MaritalStatus = 'مجرد';
    const mVal = String(row.maritalStatus || '').trim();
    if (mVal.includes('متاهل') || mVal.includes('متأهل') || mVal.toLowerCase() === 'married') maritalStatus = 'متأهل';
    else if (mVal.includes('معیل')) maritalStatus = 'معیل';

    let childrenCount = parseInt(toEnglishDigits(String(row.childrenCount || '0')), 10) || 0;

    // ----------------------------------------------------
    // SPOUSE BIRTH DATE PARSING
    // ----------------------------------------------------
    let rawSpouseBirthDate = String(row.spouseBirthDate || '').trim();
    let spouseBirthDateJalali = '';
    let spouseBirthDateGregorian = '';
    if (rawSpouseBirthDate) {
      const cleanSpouse = toEnglishDigits(rawSpouseBirthDate).replace(/-/g, '/');
      const gDate = jalaliToGregorianDate(cleanSpouse);
      if (gDate) {
        spouseBirthDateJalali = cleanSpouse;
        spouseBirthDateGregorian = gDate;
      } else if (/^\d{4}-\d{2}-\d{2}$/.test(rawSpouseBirthDate)) {
        spouseBirthDateGregorian = rawSpouseBirthDate;
        spouseBirthDateJalali = toJalaliDate(spouseBirthDateGregorian);
      } else {
        warnings.push(`فرمت تاریخ تولد همسر («${rawSpouseBirthDate}») نامعتبر بود؛ فرمت استاندارد YYYY/MM/DD است.`);
      }
    }

    // If spouse birth date is provided but marital status was 'مجرد', adjust to 'متأهل'
    if (spouseBirthDateJalali && maritalStatus === 'مجرد') {
      maritalStatus = 'متأهل';
      warnings.push('وضعیت تأهل با توجه به درج تاریخ تولد همسر به «متأهل» تنظیم شد.');
    }

    // ----------------------------------------------------
    // CHILDREN BIRTH DATES PARSING (Supports multiple dates separated by comma/semicolon/dash)
    // ----------------------------------------------------
    let rawChildBirthDate = String(row.childBirthDate || '').trim();
    const childrenBirthDatesJalali: string[] = [];
    const childrenBirthDatesGregorian: string[] = [];
    let childBirthDateJalali = '';
    let childBirthDateGregorian = '';

    if (rawChildBirthDate) {
      const tokens = rawChildBirthDate.split(/[,;،|\n\r]+/).map(t => t.trim()).filter(Boolean);
      tokens.forEach(token => {
        const cleanChild = toEnglishDigits(token).replace(/-/g, '/');
        const gDate = jalaliToGregorianDate(cleanChild);
        if (gDate) {
          childrenBirthDatesJalali.push(cleanChild);
          childrenBirthDatesGregorian.push(gDate);
        } else if (/^\d{4}-\d{2}-\d{2}$/.test(token)) {
          childrenBirthDatesGregorian.push(token);
          childrenBirthDatesJalali.push(toJalaliDate(token));
        } else {
          warnings.push(`فرمت یکی از تاریخ‌های تولد فرزند («${token}») نامعتبر بود.`);
        }
      });

      if (childrenBirthDatesJalali.length > 0) {
        childBirthDateJalali = childrenBirthDatesJalali[0];
        childBirthDateGregorian = childrenBirthDatesGregorian[0];
      }
    }

    // If children birth dates are present, ensure childrenCount matches
    if (childrenBirthDatesJalali.length > 0 && childrenCount < childrenBirthDatesJalali.length) {
      childrenCount = childrenBirthDatesJalali.length;
    }

    // Organization details
    const departmentName = String(row.departmentName || 'منابع انسانی و توسعه سازمانی').trim();
    const positionTitle = String(row.positionTitle || 'کارشناس').trim();
    const companyName = String(row.companyName || DEFAULT_COMPANIES[0].name).trim();
    const branchName = String(row.branchName || DEFAULT_BRANCHES[0].name).trim();

    // Employment
    let contractType: ContractType = 'دائمی';
    const cVal = String(row.contractType || '').trim();
    if (cVal.includes('موقت')) contractType = 'موقت';
    else if (cVal.includes('پروژه')) contractType = 'پروژه‌ای';
    else if (cVal.includes('ساعتی')) contractType = 'ساعتی';
    else if (cVal.includes('مشاور')) contractType = 'مشاور';
    else if (cVal.includes('کارآموز')) contractType = 'کارآموز';

    let employmentStatus: EmploymentStatus = 'active';
    const sVal = String(row.employmentStatus || '').trim();
    if (sVal.includes('مرخصی')) employmentStatus = 'on_leave';
    else if (sVal.includes('تعلیق')) employmentStatus = 'suspended';
    else if (sVal.includes('خاتمه') || sVal.includes('تسویه') || sVal.includes('استعفا')) employmentStatus = 'terminated';
    else if (sVal.includes('بازنشسته')) employmentStatus = 'retired';

    const employmentType = String(row.employmentType || 'تمام وقت').trim();

    // Dates normalization
    let hireDateJalali = String(row.hireDate || '').trim();
    let hireDateGregorian = '';
    if (hireDateJalali) {
      hireDateJalali = toEnglishDigits(hireDateJalali).replace(/-/g, '/');
      const gDate = jalaliToGregorianDate(hireDateJalali);
      if (gDate) {
        hireDateGregorian = gDate;
      } else {
        // Maybe it was already Gregorian
        if (/^\d{4}-\d{2}-\d{2}$/.test(hireDateJalali)) {
          hireDateGregorian = hireDateJalali;
          hireDateJalali = toJalaliDate(hireDateGregorian);
        } else {
          hireDateJalali = getCurrentJalaliDate();
          hireDateGregorian = new Date().toISOString().split('T')[0];
          warnings.push('فرمت تاریخ استخدام نامعتبر بود و به تاریخ امروز تنظیم شد.');
        }
      }
    } else {
      hireDateJalali = getCurrentJalaliDate();
      hireDateGregorian = new Date().toISOString().split('T')[0];
    }

    let birthDateJalali = String(row.birthDate || '').trim();
    let birthDateGregorian = '1995-01-01';
    if (birthDateJalali) {
      birthDateJalali = toEnglishDigits(birthDateJalali).replace(/-/g, '/');
      const gDate = jalaliToGregorianDate(birthDateJalali);
      if (gDate) {
        birthDateGregorian = gDate;
      } else if (/^\d{4}-\d{2}-\d{2}$/.test(birthDateJalali)) {
        birthDateGregorian = birthDateJalali;
        birthDateJalali = toJalaliDate(birthDateGregorian);
      } else {
        birthDateJalali = '1370/01/01';
        birthDateGregorian = '1991-03-21';
      }
    } else {
      birthDateJalali = '1370/01/01';
      birthDateGregorian = '1991-03-21';
    }

    // Base salary
    const baseSalary = parseFloat(toEnglishDigits(String(row.baseSalary || '0')).replace(/[^\d.]/g, '')) || 0;

    // Supplementary Insurance parsing
    const rawSupStatus = String(row.hasSupplementaryInsurance || '').trim();
    const rawPayMethod = String(row.supplementaryInsurancePaymentMethod || '').trim();
    const rawSupComp = String(row.supplementaryInsuranceCompany || '').trim();
    const rawSupPrem = parseFloat(toEnglishDigits(String(row.supplementaryInsurancePremium || '0')).replace(/[^\d.]/g, '')) || 0;

    let hasSupplementaryInsurance = false;
    if (
      rawSupStatus.includes('دارد') || 
      rawSupStatus.includes('بله') || 
      rawSupStatus.includes('فعال') || 
      rawSupStatus.toLowerCase() === 'yes' || 
      rawSupStatus.toLowerCase() === 'true' ||
      rawSupStatus === '1' ||
      rawPayMethod !== '' ||
      rawSupPrem > 0
    ) {
      hasSupplementaryInsurance = true;
    } else if (
      rawSupStatus.includes('ندارد') || 
      rawSupStatus.includes('خیر') || 
      rawSupStatus.includes('غیرفعال') || 
      rawSupStatus.toLowerCase() === 'no' || 
      rawSupStatus.toLowerCase() === 'false' ||
      rawSupStatus === '0'
    ) {
      hasSupplementaryInsurance = false;
    }

    let supplementaryInsurancePaymentMethod: SupplementaryInsurancePaymentMethod | undefined = undefined;
    if (hasSupplementaryInsurance) {
      if (rawPayMethod.includes('کسر') || rawPayMethod.includes('حقوق') || rawPayMethod.includes('فیش') || rawPayMethod.toLowerCase().includes('deduction')) {
        supplementaryInsurancePaymentMethod = 'کسر از حقوق';
      } else if (rawPayMethod.includes('خود فرد') || rawPayMethod.includes('شخصی') || rawPayMethod.includes('نقدی') || rawPayMethod.includes('پرسنل') || rawPayMethod.includes('مستقیم') || rawPayMethod.toLowerCase().includes('self')) {
        supplementaryInsurancePaymentMethod = 'پرداخت توسط خود فرد';
      } else if (rawPayMethod.includes('شرکت') || rawPayMethod.includes('کارفرما') || rawPayMethod.includes('سازمان') || rawPayMethod.toLowerCase().includes('company')) {
        supplementaryInsurancePaymentMethod = 'پرداخت توسط شرکت';
      } else {
        // Default to deduction if has supplementary insurance
        supplementaryInsurancePaymentMethod = 'کسر از حقوق';
      }
    }

    const supplementaryInsurancePremium = hasSupplementaryInsurance ? rawSupPrem : 0;
    const supplementaryInsuranceCompany = hasSupplementaryInsurance ? (rawSupComp || 'بیمه ایران') : '';

    // Other details
    const militaryStatus = String(row.militaryStatus || (gender === 'مرد' ? 'پایان خدمت' : 'غیر مشمول (بانوان)')).trim();
    const educationLevel = String(row.educationLevel || 'کارشناسی').trim();
    const fieldOfStudy = String(row.fieldOfStudy || '').trim();
    const bankAccount = String(row.bankAccount || '').trim();
    const insuranceNumber = String(row.insuranceNumber || '').trim();
    const address = String(row.address || '').trim();

    // ==========================================
    // VALIDATIONS
    // ==========================================
    // 1. Employee Code Check
    if (!employeeCode) {
      errors.push('کد پرسنلی الزامی است و نمی‌تواند خالی باشد.');
    } else {
      const codeKey = employeeCode.toLowerCase();
      if (inSheetCodeMap.has(codeKey)) {
        errors.push(`کد پرسنلی «${employeeCode}» در ردیف ${inSheetCodeMap.get(codeKey)} همین فایل تکرار شده است.`);
      } else {
        inSheetCodeMap.set(codeKey, rowNum);
      }
    }

    // 2. Name Checks
    if (!firstName) errors.push('نام پرسنل خالی است.');
    if (!lastName) errors.push('نام خانوادگی پرسنل خالی است.');

    // 3. National Code Check
    if (!rawNationalId) {
      errors.push('کد ملی الزامی است.');
    } else if (!isValidIranianNationalCode(nationalId)) {
      errors.push(`کد ملی «${rawNationalId}» نامعتبر است (الگوریتم رقم کنترلی و طول ۱۰ رقم).`);
    } else {
      if (inSheetNationalIdMap.has(nationalId)) {
        errors.push(`کد ملی «${nationalId}» در ردیف ${inSheetNationalIdMap.get(nationalId)} همین فایل تکرار شده است.`);
      } else {
        inSheetNationalIdMap.set(nationalId, rowNum);
      }
    }

    // 4. Mobile Check
    if (!mobile) {
      warnings.push('شماره موبایل وارد نشده است.');
    } else if (!/^09\d{9}$/.test(mobile)) {
      warnings.push(`شماره موبایل «${mobile}» با الگوی استاندار (09xxxxxxxxx) همخوانی ندارد.`);
    }

    // 5. Existing in Database Check
    const isExistingInDb = existingCodeMap.has(employeeCode.toLowerCase()) || existingNationalIdMap.has(nationalId);
    if (isExistingInDb) {
      warnings.push('این پرسنل قبلاً در سامانه ثبت شده است (کد پرسنلی یا کد ملی یکسان). در صورت تایید، پرونده بروزرسانی می‌شود.');
    }

    const isValid = errors.length === 0;
    let status: 'valid' | 'warning' | 'error' = 'valid';
    if (!isValid) status = 'error';
    else if (warnings.length > 0 || isExistingInDb) status = 'warning';

    parsedRows.push({
      rowNumber: rowNum,
      employeeCode: employeeCode || `EMP-${Date.now().toString().slice(-4)}`,
      firstName: firstName || 'نامشخص',
      lastName: lastName || 'نامشخص',
      nationalId,
      gender,
      maritalStatus,
      childrenCount,
      spouseBirthDateJalali,
      spouseBirthDateGregorian,
      childBirthDateJalali,
      childBirthDateGregorian,
      childrenBirthDatesJalali,
      childrenBirthDatesGregorian,
      mobile: mobile || '09120000000',
      workEmail,
      companyName,
      branchName,
      departmentName,
      positionTitle,
      contractType,
      employmentStatus,
      employmentType,
      hireDateJalali,
      hireDateGregorian,
      birthDateJalali,
      birthDateGregorian,
      baseSalary,
      militaryStatus,
      educationLevel,
      fieldOfStudy,
      bankAccountNumber: bankAccount,
      insuranceNumber,
      hasSupplementaryInsurance,
      supplementaryInsurancePaymentMethod,
      supplementaryInsurancePremium,
      supplementaryInsuranceCompany,
      address,
      isValid,
      isExistingInDb,
      status,
      errors,
      warnings
    });
  });

  const totalRows = parsedRows.length;
  const validCount = parsedRows.filter(r => r.status === 'valid').length;
  const warningCount = parsedRows.filter(r => r.status === 'warning').length;
  const errorCount = parsedRows.filter(r => r.status === 'error').length;

  return {
    rows: parsedRows,
    totalRows,
    validCount,
    warningCount,
    errorCount
  };
}

/**
 * Bulk Import Parsed Employees into Firestore & Audit Log
 */
export async function importEmployeesBatch(
  rows: ParsedEmployeeRow[],
  actor: { uid: string; displayName: string; role: any },
  options: {
    updateExisting: boolean;
    skipErrors: boolean;
    onProgress?: (processed: number, total: number) => void;
  }
): Promise<ImportSummaryResult> {
  const result: ImportSummaryResult = {
    totalRows: rows.length,
    successCount: 0,
    updatedCount: 0,
    skippedCount: 0,
    failedCount: 0,
    importedEmployees: [],
    errors: []
  };

  const rowsToImport = rows.filter(r => {
    if (!r.isValid && options.skipErrors) return false;
    if (r.isExistingInDb && !options.updateExisting) return false;
    return true;
  });

  const now = new Date().toISOString();
  const nowJalali = getCurrentJalaliDate();

  // We batch operations in groups of 400 (under Firestore 500 limit)
  const CHUNK_SIZE = 50; // Each employee has main doc + ~5 subcollection docs = ~6 ops. 50 * 6 = 300 ops.
  
  let processed = 0;

  for (let i = 0; i < rowsToImport.length; i += CHUNK_SIZE) {
    const chunk = rowsToImport.slice(i, i + CHUNK_SIZE);
    const batch = writeBatch(db);

    for (const emp of chunk) {
      try {
        const empId = `emp-${emp.employeeCode.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
        const empRef = doc(db, 'employees', empId);

        // Find department ID if matches default
        const matchedDept = DEFAULT_DEPARTMENTS.find(d => d.name === emp.departmentName) || DEFAULT_DEPARTMENTS[0];
        const matchedBranch = DEFAULT_BRANCHES.find(b => b.name === emp.branchName) || DEFAULT_BRANCHES[0];
        const matchedCompany = DEFAULT_COMPANIES.find(c => c.name === emp.companyName) || DEFAULT_COMPANIES[0];

        const summaryDoc: EmployeeSummary = {
          id: empId,
          employeeCode: emp.employeeCode,
          firstName: emp.firstName,
          lastName: emp.lastName,
          latinFirstName: '',
          latinLastName: '',
          nationalId: emp.nationalId,
          birthDate: emp.birthDateGregorian,
          birthDateJalali: emp.birthDateJalali,
          gender: emp.gender,
          maritalStatus: emp.maritalStatus,
          childrenCount: emp.childrenCount,
          spouseBirthDate: emp.spouseBirthDateGregorian || '',
          spouseBirthDateJalali: emp.spouseBirthDateJalali || '',
          childBirthDate: emp.childBirthDateGregorian || '',
          childBirthDateJalali: emp.childBirthDateJalali || '',
          childrenBirthDates: emp.childrenBirthDatesGregorian || [],
          childrenBirthDatesJalali: emp.childrenBirthDatesJalali || [],
          profileImageUrl: '',

          companyId: matchedCompany.id,
          companyName: emp.companyName,
          branchId: matchedBranch.id,
          branchName: emp.branchName,
          departmentId: matchedDept.id,
          departmentName: emp.departmentName,
          positionId: `pos-${emp.employeeCode}`,
          positionTitle: emp.positionTitle,
          jobLevel: 'کارشناس',
          mobile: emp.mobile,
          workEmail: emp.workEmail || '',

          employmentType: emp.employmentType,
          employmentStatus: emp.employmentStatus,
          contractType: emp.contractType,
          hireDate: emp.hireDateGregorian,
          hireDateJalali: emp.hireDateJalali,
          baseSalary: emp.baseSalary,
          netSalary: emp.baseSalary > 0 ? Math.round(emp.baseSalary * 0.9) : 0,

          // Supplementary Insurance
          hasSupplementaryInsurance: emp.hasSupplementaryInsurance,
          supplementaryInsurancePaymentMethod: emp.supplementaryInsurancePaymentMethod,
          supplementaryInsurancePremium: emp.supplementaryInsurancePremium,
          supplementaryInsuranceCompany: emp.supplementaryInsuranceCompany,

          createdAt: now,
          updatedAt: now,
          createdBy: actor.uid,
          updatedBy: actor.uid
        };

        batch.set(empRef, summaryDoc, { merge: true });

        // 1. Subcollection: contacts
        const contactRef = doc(db, `employees/${empId}/contacts`, 'primary');
        batch.set(contactRef, {
          id: 'primary',
          mobile: emp.mobile,
          workEmail: emp.workEmail || '',
          personalEmail: ''
        }, { merge: true });

        // 2. Subcollection: family (Spouse & Children)
        if (emp.spouseBirthDateGregorian || emp.spouseBirthDateJalali) {
          const spouseRef = doc(db, `employees/${empId}/family`, 'spouse');
          batch.set(spouseRef, {
            id: 'spouse',
            firstName: 'همسر',
            lastName: emp.lastName,
            relationship: 'همسر',
            nationalId: '',
            birthDate: emp.spouseBirthDateGregorian || '',
            birthDateJalali: emp.spouseBirthDateJalali || '',
            gender: emp.gender === 'مرد' ? 'زن' : 'مرد',
            maritalStatus: 'متأهل',
            job: '',
            phone: '',
            isDependent: true,
            hasSupplementaryInsurance: emp.hasSupplementaryInsurance || true
          }, { merge: true });
        }

        if (emp.childrenBirthDatesJalali && emp.childrenBirthDatesJalali.length > 0) {
          emp.childrenBirthDatesJalali.forEach((childJalali, idx) => {
            const childGDate = emp.childrenBirthDatesGregorian?.[idx] || jalaliToGregorianDate(childJalali) || '';
            const childRef = doc(db, `employees/${empId}/family`, `child-${idx + 1}`);
            batch.set(childRef, {
              id: `child-${idx + 1}`,
              firstName: `فرزند ${idx + 1}`,
              lastName: emp.lastName,
              relationship: 'فرزند',
              nationalId: '',
              birthDate: childGDate,
              birthDateJalali: childJalali,
              gender: 'مرد',
              maritalStatus: 'مجرد',
              job: 'دانش‌آموز / خردسال',
              phone: '',
              isDependent: true,
              hasSupplementaryInsurance: emp.hasSupplementaryInsurance || true
            }, { merge: true });
          });
        }

        // 2. Subcollection: organization
        const orgRef = doc(db, `employees/${empId}/organization`, 'current');
        batch.set(orgRef, {
          id: 'current',
          companyId: matchedCompany.id,
          companyName: emp.companyName,
          branchId: matchedBranch.id,
          branchName: emp.branchName,
          departmentId: matchedDept.id,
          departmentName: emp.departmentName,
          positionId: `pos-${emp.employeeCode}`,
          positionTitle: emp.positionTitle,
          jobLevel: 'کارشناس'
        }, { merge: true });

        // 3. Subcollection: employment
        const employmentRef = doc(db, `employees/${empId}/employment`, 'current');
        batch.set(employmentRef, {
          id: 'current',
          employeeCode: emp.employeeCode,
          contractNumber: `CNT-${emp.employeeCode}`,
          contractType: emp.contractType,
          employmentType: emp.employmentType,
          hireDate: emp.hireDateGregorian,
          employmentStatus: emp.employmentStatus,
          cooperationType: 'تمام وقت',
          hasProbation: false
        }, { merge: true });

        // 4. Subcollection: banking (if provided)
        if (emp.bankAccountNumber) {
          const bankRef = doc(db, `employees/${empId}/bankAccounts`, 'primary');
          batch.set(bankRef, {
            id: 'primary',
            bankName: 'بانک ملت',
            accountNumber: emp.bankAccountNumber,
            shebaNumber: emp.bankAccountNumber.startsWith('IR') ? emp.bankAccountNumber : '',
            isDefault: true
          }, { merge: true });
        }

        // 5. Subcollection: insurance (primary social + supplementary)
        if (emp.insuranceNumber || emp.hasSupplementaryInsurance) {
          const insRef = doc(db, `employees/${empId}/insurance`, 'primary');
          batch.set(insRef, {
            id: 'primary',
            insuranceType: 'تأمین اجتماعی',
            insuranceNumber: emp.insuranceNumber || '',
            status: 'فعال',
            hasSupplementaryInsurance: emp.hasSupplementaryInsurance || false,
            supplementaryInsuranceCompany: emp.supplementaryInsuranceCompany || (emp.hasSupplementaryInsurance ? 'بیمه ایران' : ''),
            supplementaryInsurancePlan: emp.hasSupplementaryInsurance ? 'طرح جامع سازمانی' : '',
            supplementaryInsurancePremium: emp.supplementaryInsurancePremium || 0,
            supplementaryInsurancePaymentMethod: emp.supplementaryInsurancePaymentMethod,
            supplementaryPaymentMethod: emp.supplementaryInsurancePaymentMethod
          }, { merge: true });
        }

        // 6. Subcollection: addresses (if provided)
        if (emp.address) {
          const addrRef = doc(db, `employees/${empId}/addresses`, 'primary');
          batch.set(addrRef, {
            id: 'primary',
            type: 'residential',
            title: 'محل سکونت اصلی',
            province: 'تهران',
            city: 'تهران',
            fullAddress: emp.address,
            postalCode: '1111111111'
          }, { merge: true });
        }

        // 7. Timeline event
        const timelineRef = doc(db, `employees/${empId}/timeline`, `event-import-${Date.now()}-${emp.rowNumber}`);
        batch.set(timelineRef, {
          id: `event-import-${Date.now()}-${emp.rowNumber}`,
          type: 'استخدام',
          title: 'تعریف و ورود پرسنل از طریق فایل اکسل',
          description: `اطلاعات پرسنل از فایل اکسل تجمیعی توسط ${actor.displayName} وارد سامانه گردید.`,
          date: emp.hireDateGregorian,
          dateJalali: emp.hireDateJalali,
          actorName: actor.displayName,
          actorId: actor.uid
        });

        if (emp.isExistingInDb) {
          result.updatedCount++;
        } else {
          result.successCount++;
        }

        result.importedEmployees.push({
          id: empId,
          name: `${emp.firstName} ${emp.lastName}`,
          code: emp.employeeCode
        });

      } catch (err: any) {
        result.failedCount++;
        result.errors.push(`خطا در ردیف ${emp.rowNumber} (${emp.firstName} ${emp.lastName}): ${err.message}`);
      }
    }

    await batch.commit();

    processed += chunk.length;
    if (options.onProgress) {
      options.onProgress(processed, rowsToImport.length);
    }
  }

  result.skippedCount = rows.length - (result.successCount + result.updatedCount + result.failedCount);

  // Log Audit Event
  await logAuditEvent({
    userId: actor.uid,
    userName: actor.displayName,
    userRole: actor.role,
    action: 'employee.excel_imported' as any,
    entityType: 'employee',
    entityId: 'bulk_import',
    description: `ورود دسته‌ای پرسنل از فایل اکسل: تعداد ${result.successCount} پرسنل جدید، ${result.updatedCount} بروزرسانی و ${result.skippedCount} رکورد نادیده گرفته شد.`
  });

  return result;
}
