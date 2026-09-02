/**
 * Persian HRMS TypeScript Models & Interfaces
 */

export type UserRole = 
  | 'super_admin'
  | 'hr_admin'
  | 'hr_manager'
  | 'department_manager'
  | 'finance'
  | 'employee';

export type EmploymentStatus = 
  | 'draft'
  | 'active'
  | 'on_leave'
  | 'mission'
  | 'suspended'
  | 'terminated'
  | 'retired';

export type ContractType = 
  | 'دائمی'
  | 'موقت'
  | 'پروژه‌ای'
  | 'ساعتی'
  | 'مشاور'
  | 'کارآموز'
  | 'پیمانکاری'
  | 'سایر';

export type Gender = 'مرد' | 'زن';
export type MaritalStatus = 'مجرد' | 'متأهل' | 'معیل';
export type MilitaryStatus = 'پایان خدمت' | 'کارت پایان خدمت' | 'معافیت دائم' | 'معافیت پزشکی' | 'معافیت تحصیلی' | 'مشمول' | 'غیر مشمول (بانوان)';
export type SkillLevel = 'مبتدی' | 'متوسط' | 'خوب' | 'پیشرفته' | 'حرفه‌ای';
export type LanguageProficiency = 'مبتدی' | 'متوسط' | 'پیشرفته' | 'مسلط/زبان مادری';
export type EducationLevel = 'دیپلم' | 'فوق دیپلم' | 'کارشناسی' | 'کارشناسی ارشد' | 'دکتری' | 'پسادکتری' | 'سایر';
export type InsuranceType = 'تأمین اجتماعی' | 'خدمات درمانی' | 'نیروهای مسلح' | 'سایر';
export type InsuranceStatus = 'فعال' | 'غیرفعال' | 'معلق';
export type SupplementaryInsurancePaymentMethod = 'کسر از حقوق' | 'پرداخت توسط خود فرد' | 'پرداخت توسط شرکت';
export type DrivingLicenseType = 'پایه یک' | 'پایه دو' | 'پایه سه' | 'موتورسیکلت' | 'پایه ۱' | 'پایه ۲' | 'پایه ۳';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  employeeId?: string;
  departmentId?: string;
  departmentName?: string;
  photoURL?: string;
  phoneNumber?: string;
  createdAt?: string;
}

export interface AppUser {
  id: string;
  username: string;
  password?: string;
  displayName: string;
  email: string;
  role: UserRole;
  departmentId?: string;
  departmentName?: string;
  photoURL?: string;
  status: 'active' | 'inactive';
  customPermissions?: string[];
  phoneNumber?: string;
  createdAt: string;
  createdAtJalali?: string;
  lastLogin?: string;
}

export interface BackupRecord {
  id: string;
  type: 'daily' | 'monthly' | 'manual';
  title: string;
  createdAt: string;
  createdAtJalali: string;
  recordCounts: {
    employees: number;
    departments: number;
    positions: number;
    teams: number;
    auditLogs: number;
    drafts: number;
    users: number;
  };
  fileSizeKb: number;
  status: 'completed' | 'failed';
  checksum: string;
  data?: any;
}

export interface BackupScheduleConfig {
  dailyBackupEnabled: boolean;
  dailyBackupTime: string; // e.g. "02:00"
  monthlyBackupEnabled: boolean;
  monthlyBackupDay: number; // e.g. 1
  retentionDays: number;
  lastDailyBackup?: string;
  lastMonthlyBackup?: string;
}

/**
 * Main Lightweight Employee Document (employees/{employeeId})
 */
export interface EmployeeSummary {
  id: string;
  employeeCode: string;
  firstName: string;
  lastName: string;
  latinFirstName?: string;
  latinLastName?: string;
  nationalId: string;
  birthDate: string; // YYYY-MM-DD (Gregorian storage)
  birthDateJalali?: string; // e.g. 1368/04/15
  gender: Gender;
  maritalStatus: MaritalStatus;
  childrenCount: number;
  spouseBirthDate?: string; // YYYY-MM-DD
  spouseBirthDateJalali?: string; // YYYY/MM/DD
  childBirthDate?: string; // YYYY-MM-DD
  childBirthDateJalali?: string; // YYYY/MM/DD
  childrenBirthDates?: string[]; // Array of YYYY-MM-DD
  childrenBirthDatesJalali?: string[]; // Array of YYYY/MM/DD
  profileImageUrl?: string;
  
  // Organization links
  companyId: string;
  companyName: string;
  branchId: string;
  branchName: string;
  departmentId: string;
  departmentName: string;
  teamId?: string;
  teamName?: string;
  positionId: string;
  positionTitle: string;
  jobLevel?: string;
  managerId?: string;
  managerName?: string;
  costCenterCode?: string;

  // Contact quick access
  mobile: string;
  workEmail?: string;

  // Employment
  employmentType: string;
  employmentStatus: EmploymentStatus;
  contractType: ContractType;
  hireDate: string; // YYYY-MM-DD
  hireDateJalali?: string;
  contractEndDate?: string;
  baseSalary?: number;
  netSalary?: number;

  // Supplementary Insurance & Payment Method
  hasSupplementaryInsurance?: boolean;
  supplementaryInsurancePaymentMethod?: SupplementaryInsurancePaymentMethod;
  supplementaryInsurancePremium?: number; // ریال
  supplementaryInsuranceCompany?: string;

  // Promissory Note Guarantee (سفته ضمانت حسن انجام کار و تعهدات)
  guaranteeNoteAmount?: number; // مبلغ سفته ضمانت به ریال
  guaranteeNoteNumber?: string; // شماره لاشه / سریال سفته
  guaranteeNoteStatus?: 'received' | 'not_received' | 'returned' | 'deposited'; // وضعیت سفته
  guaranteeNoteReceivedDate?: string; // تاریخ تحویل (میلادی)
  guaranteeNoteReceivedDateJalali?: string; // تاریخ تحویل (شمسی)
  guaranteeNoteDueDate?: string; // تاریخ سررسید (میلادی)
  guaranteeNoteDueDateJalali?: string; // تاریخ سررسید (شمسی)
  guaranteeNoteGuarantorName?: string; // نام و مشخصات ضامن
  guaranteeNoteDescription?: string; // توضیحات و محل نگهداری لاشه در صندوق/بایگانی

  // System metadata
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
}

// Subcollection: contacts
export interface ContactInfo {
  id: string;
  mobile: string;
  landline?: string;
  personalEmail?: string;
  workEmail?: string;
  secondaryPhone?: string;
}

// Subcollection: addresses
export interface AddressInfo {
  id: string;
  type: 'residential' | 'work';
  title: string;
  province: string;
  city: string;
  district?: string;
  fullAddress: string;
  postalCode: string;
  buildingNumber?: string;
  unitNumber?: string;
}

// Subcollection: family
export interface FamilyMember {
  id: string;
  firstName: string;
  lastName: string;
  relationship: 'همسر' | 'فرزند' | 'پدر' | 'مادر' | 'خواهر' | 'برادر' | 'سایر';
  nationalId: string;
  birthDate: string;
  birthDateJalali?: string;
  gender: Gender;
  maritalStatus: MaritalStatus;
  job?: string;
  phone?: string;
  isDependent: boolean; // تحت تکفل
  hasSupplementaryInsurance: boolean; // تحت پوشش بیمه تکمیلی
}

// Subcollection: employment
export interface EmploymentDetails {
  id: string;
  employeeCode: string;
  contractNumber: string;
  contractType: ContractType;
  employmentType: string;
  hireDate: string;
  contractEndDate?: string;
  insuranceStartDate?: string;
  officialDate?: string;
  employmentStatus: EmploymentStatus;
  cooperationType: 'تمام وقت' | 'پاره وقت' | 'دورکاری' | 'شیفتی' | 'هیبریدی';
  hasProbation: boolean;
  probationDurationMonths?: number;
  hireReason?: string;
}

// Subcollection: organization
export interface OrganizationDetails {
  id: string;
  companyId: string;
  companyName: string;
  divisionId?: string;
  divisionName?: string;
  departmentId: string;
  departmentName: string;
  unitId?: string;
  unitName?: string;
  teamId?: string;
  teamName?: string;
  branchId: string;
  branchName: string;
  workLocation: string;
  positionId: string;
  positionTitle: string;
  jobTitle: string;
  jobLevel: string;
  directManagerId?: string;
  directManagerName?: string;
  seniorManagerId?: string;
  seniorManagerName?: string;
  costCenter: string;
  costCenterCode: string;
  shiftType: 'عادی (۸ تا ۱۷)' | 'شیفت چرخشی' | 'شیفت شب' | 'شناور';
  workingHoursWeekly: number;
}

// Subcollection: education
export interface EducationRecord {
  id: string;
  degreeLevel: EducationLevel;
  major: string;
  fieldOfStudy?: string;
  universityName: string;
  universityType: 'دولتی' | 'آزاد اسلامی' | 'پیام نور' | 'علمی کاربردی' | 'بین‌الملل' | 'غیرانتفاعی' | 'خارج از کشور';
  city: string;
  country: string;
  gpa?: string; // معدل
  startYear: number;
  endYear?: number;
  status: 'فارغ‌التحصیل' | 'در حال تحصیل' | 'انصرافی';
  description?: string;
  certificateUrl?: string;
}

// Subcollection: workExperience
export interface WorkExperienceRecord {
  id: string;
  companyName: string;
  positionTitle: string;
  department?: string;
  startDate: string;
  endDate?: string;
  isCurrent?: boolean;
  lastSalary?: number;
  leaveReason?: string;
  managerName?: string;
  managerPhone?: string;
  description?: string;
  durationMonths?: number;
}

// Subcollection: skills
export interface SkillRecord {
  id: string;
  name: string;
  category: 'فنی' | 'مدیریتی' | 'نرم‌افزاری' | 'عمومی' | 'تخصصی';
  level: SkillLevel;
  experienceYears: number;
}

// Subcollection: languages
export interface LanguageRecord {
  id: string;
  language: string;
  speaking: LanguageProficiency;
  reading: LanguageProficiency;
  writing: LanguageProficiency;
  listening: LanguageProficiency;
  certificateTitle?: string;
}

// Subcollection: insurance
export interface InsuranceInfo {
  id: string;
  insuranceType: 'تأمین اجتماعی' | 'خدمات درمانی' | 'نیروهای مسلح' | 'سایر';
  insuranceNumber: string;
  insuranceBranch: string;
  insuranceStartDate?: string;
  startDate?: string;
  previousRecordMonths?: number;
  previousExperienceMonths?: number;
  insuranceStatus?: 'فعال' | 'غیرفعال' | 'معلق' | string;
  status?: string;
  hasSupplementaryInsurance: boolean;
  supplementaryInsurancePaymentMethod?: SupplementaryInsurancePaymentMethod;
  supplementaryPaymentMethod?: SupplementaryInsurancePaymentMethod; // alias
  supplementaryInsurancePremium?: number; // مبلغ ماهانه حق بیمه به ریال
  supplementaryInsuranceNumber?: string;
  supplementaryInsuranceCompany?: string;
  supplementaryInsurancePlan?: string;
  supplementaryDependentsCount?: number;
  coveredDependentsIds?: string[];
}

// Subcollection: bankAccounts
export interface BankAccountInfo {
  id: string;
  bankName: string;
  branchName: string;
  accountNumber: string;
  cardNumber: string; // Sensitive, masked in UI
  iban: string; // IR...
  accountHolderName: string;
  isPrimary: boolean;
}

// Subcollection: salaryHistory
export interface SalaryInfo {
  id: string;
  effectiveDate: string; // تاریخ اعمال
  effectiveDateJalali?: string;
  baseSalary: number; // حقوق پایه
  housingAllowance: number; // حق مسکن
  childAllowance: number; // حق اولاد
  maritalAllowance?: number; // حق تأهل
  marriageAllowance?: number; // حق تأهل alias
  foodVouchers?: number; // بن خواربار
  groceryAllowance?: number; // بن خواربار alias
  fixedBonus?: number;
  performanceBonus?: number;
  currency?: string;
  fixedBenefits?: number; // سایر مزایای مستمر
  variableBenefits?: number; // مزایای غیرمستمر
  overtimeEstimate?: number; // برآورد اضافه کاری
  bonusEstimate?: number; // پاداش
  taxDeduction: number; // مالیات بر درآمد
  insuranceDeduction: number; // سهم بیمه کارمند (۷٪)
  grossSalary: number; // ناخالص
  netSalary: number; // خالص پرداختی
  changeReason?: string;
  approvedBy?: string;
  createdAt?: string;
}

// Subcollection: documents
export interface EmployeeDocument {
  id: string;
  title: string;
  category: 
    | 'مدارک هویتی'
    | 'مدارک تحصیلی'
    | 'قرارداد'
    | 'حکم'
    | 'بیمه'
    | 'نظام وظیفه'
    | 'رزومه'
    | 'گواهینامه'
    | 'عکس'
    | 'سایر';
  documentNumber?: string;
  issueDate?: string;
  expiryDate?: string;
  description?: string;
  fileUrl: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  uploadedBy: string;
  uploadedByName: string;
  uploadedAt: string;
}

// Subcollection: emergencyContacts
export interface EmergencyContact {
  id: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  relationship: string;
  mobile: string;
  phone?: string;
  landline?: string;
  address?: string;
  priority: number; // 1, 2, 3
  isPrimary: boolean;
}

// Subcollection: additionalInfo
export interface AdditionalInfo {
  id?: string;
  militaryStatus: MilitaryStatus;
  militaryCardType?: string;
  militaryCardValidity?: string;
  militaryExemptionReason?: string;
  militaryCardNumber?: string;
  militaryCompletionDate?: string;
  drivingLicenseStatus?: 'دارد' | 'ندارد';
  hasDrivingLicense?: boolean;
  drivingLicenseType?: DrivingLicenseType;
  drivingLicenseExpiry?: string;
  hrConfidentialNotes?: string;
  internalNotes?: string;
  specialTalents?: string;
  hobbies?: string;

  // Promissory Note Guarantee (سفته ضمانت حسن انجام کار)
  guaranteeNoteAmount?: number;
  guaranteeNoteNumber?: string;
  guaranteeNoteStatus?: 'received' | 'not_received' | 'returned' | 'deposited';
  guaranteeNoteReceivedDate?: string;
  guaranteeNoteReceivedDateJalali?: string;
  guaranteeNoteDueDate?: string;
  guaranteeNoteDueDateJalali?: string;
  guaranteeNoteGuarantorName?: string;
  guaranteeNoteDescription?: string;
}

// Subcollection: timeline
export interface TimelineEvent {
  id: string;
  type: 
    | 'استخدام'
    | 'تغییر سمت'
    | 'تغییر واحد'
    | 'تغییر شعبه'
    | 'تغییر حقوق'
    | 'تمدید قرارداد'
    | 'ارتقای شغلی'
    | 'آموزش'
    | 'ارزیابی عملکرد'
    | 'پاداش'
    | 'تذکر'
    | 'انتقال'
    | 'خاتمه همکاری';
  title: string;
  description: string;
  date: string;
  dateJalali: string;
  actorName: string;
  actorId: string;
  details?: Record<string, any>;
}

// Complete multi-step Registration Data Packet
export interface FullRegistrationFormData {
  // Step 1
  employeeCode: string;
  firstName: string;
  lastName: string;
  latinFirstName?: string;
  latinLastName?: string;
  fatherName?: string;
  nationalId: string;
  idNumber?: string; // شماره شناسنامه
  idSerialSeries?: string; // سری شناسنامه
  idSerialNumber?: string; // سریال شناسنامه
  birthDate: string;
  birthDateJalali?: string;
  birthProvince?: string;
  birthCity?: string;
  birthPlace?: string;
  gender: Gender;
  maritalStatus: MaritalStatus;
  childrenCount?: number;
  spouseBirthDate?: string;
  spouseBirthDateJalali?: string;
  childBirthDate?: string;
  childBirthDateJalali?: string;
  childrenBirthDates?: string[];
  childrenBirthDatesJalali?: string[];
  citizenship?: string;
  citizenshipCountry?: string;
  profileImageUrl?: string;

  // Step 2
  contacts: ContactInfo;

  // Step 3
  addresses: AddressInfo[];

  // Step 4
  familyMembers: FamilyMember[];

  // Step 5
  employment: EmploymentDetails;

  // Step 6
  organization: OrganizationDetails;

  // Step 7
  educationList: EducationRecord[];

  // Step 8
  workExperienceList: WorkExperienceRecord[];

  // Step 9
  skills: SkillRecord[];
  languages: LanguageRecord[];
  softwareSkills?: string[];
  certifications?: string[];

  // Step 10
  insurance: InsuranceInfo;

  // Step 11
  banking?: BankAccountInfo;
  bankAccounts?: BankAccountInfo[];

  // Step 12
  salary: SalaryInfo;

  // Step 13
  documents: EmployeeDocument[];

  // Step 14
  emergencyContacts: EmergencyContact[];

  // Step 15
  additionalInfo: AdditionalInfo;

  // Step 16
  confirmedAccuracy?: boolean;
}

// Draft Employee Record
export interface EmployeeDraft {
  id: string;
  employeeCode: string;
  candidateName: string;
  currentStep: number;
  completedSteps: number[];
  data: Partial<FullRegistrationFormData>;
  validationErrors?: Record<string, string>;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  createdByName: string;
  status: 'draft';
}

// Audit Log Model
export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  action: string;
  entityType: 'employee' | 'salary' | 'contract' | 'document' | 'department' | 'company' | 'branch' | 'role' | 'user' | 'system';
  entityId: string;
  timestamp: string;
  timestampJalali: string;
  description: string;
  oldValue?: any;
  newValue?: any;
}

// Master Data Models
export type CompanyType = 'holding' | 'subsidiary' | 'affiliate';

export interface Company {
  id: string;
  name: string;
  code: string;
  type?: CompanyType; // 'holding' (هلدینگ مادر), 'subsidiary' (شرکت تابعه), 'affiliate' (شرکت وابسته)
  holdingId?: string; // اگر شرکت تابعه است، شناسه هلدینگ مربوطه
  holdingName?: string; // نام هلدینگ مادر
  ownershipPercentage?: number; // درصد سهام/مالکیت هلدینگ (مثلاً ۵۱٪ یا ۱۰۰٪)
  registrationNumber?: string; // شماره ثبت شرکت
  nationalId?: string; // شناسه ملی (۱۱ رقمی)
  economicCode?: string; // کد اقتصادی (۱۲ رقمی)
  industry?: string; // حوزه فعالیت / صنعت
  ceoName?: string; // مدیرعامل
  boardChairman?: string; // رئیس هیئت مدیره
  establishedYear?: string; // سال تاسیس
  phone?: string;
  email?: string;
  website?: string;
  city?: string;
  province?: string;
  address?: string;
  postalCode?: string;
  status?: 'active' | 'inactive';
  description?: string;
}

export interface Branch {
  id: string;
  companyId: string;
  name: string;
  code: string;
  city: string;
  province?: string;
  address?: string;
  phone?: string;
  managerName?: string;
  isHeadquarter?: boolean;
}

export interface Department {
  id: string;
  companyId: string;
  branchId?: string;
  name: string;
  code: string;
  managerId?: string;
  managerName?: string;
  parentId?: string;
}

export interface Team {
  id: string;
  departmentId: string;
  name: string;
  code?: string;
  leaderId?: string;
  leaderName?: string;
}

export interface Position {
  id: string;
  departmentId: string;
  title: string;
  code: string;
  level: string;
  minSalary?: number;
  maxSalary?: number;
}

export interface PayrollSettings {
  year: number;
  baseMinimumDailyWage: number;
  housingAllowance: number;
  foodVouchersAllowance: number;
  childAllowancePerChild: number;
  maritalAllowance: number;
  employeeInsuranceRate: number; // e.g. 0.07 (7%)
  employerInsuranceRate: number; // e.g. 0.23 (23%)
  taxExemptionThreshold: number; // e.g. 120,000,000 Rials
  taxTier1Rate: number; // 10%
  taxTier2Rate: number; // 15%
  taxTier3Rate: number; // 20%
}

// Aliases for compatibility
export type AuditLogEntry = AuditLog;
export type RegistrationDraft = EmployeeDraft;
export type Employee = EmployeeSummary;
export type SalaryStructure = SalaryInfo;
export type DocumentCategory = EmployeeDocument['category'];

export type ContractPeriodType = '1_month' | '3_months' | '6_months' | '1_year' | 'custom';
export type ContractStatus = 'draft' | 'issued' | 'signed' | 'expired' | 'terminated';

export interface EmploymentContract {
  id: string;
  contractNumber: string; // شماره قرارداد مثلا CNT-1404-0101
  employeeId: string;
  employeeCode: string;
  employeeName: string;
  employeeFatherName?: string;
  employeeNationalId: string;
  employeeIdNumber?: string;
  employeeBirthDate?: string;
  employeeBirthPlace?: string;
  employeeEducation?: string;
  employeeMajor?: string;
  employeeMaritalStatus?: string;
  employeeChildrenCount?: number;
  employeeMobile: string;
  employeeAddress: string;
  employeePostalCode?: string;
  employeeBankName?: string;
  employeeIban?: string;
  
  // Employer details (کارفرما)
  companyId: string;
  companyName: string;
  companyRegistrationNumber?: string;
  companyNationalId?: string;
  companyEconomicCode?: string;
  companyWorkshopCode?: string; // کد کارگاهی تامین اجتماعی
  companyAddress?: string;
  companyPhone?: string;
  employerRepresentativeName: string;
  employerRepresentativePosition: string;

  // Contract Terms (مدت و نوع قرارداد)
  contractTitle: string; // عنوان رسمی قرارداد
  contractType: ContractType;
  periodType: ContractPeriodType; // '1_month' | '3_months' | '6_months' | '1_year' | 'custom'
  periodLabel: string; // "۱ ماهه (آزمایشی)", "۶ ماهه", "یک ساله", "سفارشی"
  durationMonths: number; // 1, 3, 6, 12, etc.
  startDateJalali: string; // e.g. "1404/01/01"
  endDateJalali: string; // e.g. "1404/06/31"
  probationDurationDays?: number; // دوره آزمایشی (روز)
  trialPeriodDescription?: string;

  // Position & Work details (شغل و محل کار)
  departmentName: string;
  positionTitle: string;
  jobResponsibilities?: string;
  workLocation: string;
  weeklyHours: number; // ساعت کار هفتگی (۴۴ ساعت قانون کار)
  shiftType: string;

  // Financial Breakdown in RIALS (حق‌السعی و مزایا به ریال)
  dailyBaseWage?: number; // مزد روزانه
  monthlyBaseSalary: number; // حقوق پایه ماهانه
  housingAllowance: number; // حق مسکن
  groceryAllowance: number; // بن خواربار و اقلام مصرفی
  childAllowance: number; // حق اولاد
  maritalAllowance?: number; // حق تأهل
  positionAllowance?: number; // حق تخصص / حق پست
  attractionAllowance?: number; // حق جذب
  otherContinuousBenefits?: number; // سایر مزایای مستمر
  grossSalaryMonthly: number; // جمع ناخالص ماهانه (ریال)
  netEstimatedSalaryMonthly: number; // برآورد خالص پرداختی (ریال)
  
  // Articles, Custom Clauses & Templates
  customTerms?: string[];
  confidentialityClause?: boolean;
  copyCount: number; // تعداد نسخ (معمولاً ۳ نسخه)
  
  // Status & Timestamps
  status: ContractStatus;
  issuedAt: string;
  issuedAtJalali: string;
  signedAt?: string;
  signedAtJalali?: string;
  notes?: string;
  createdBy: string;
  createdByName?: string;
}


