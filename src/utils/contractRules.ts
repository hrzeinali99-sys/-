import { ContractPeriodType, EmployeeSummary, FullRegistrationFormData } from '../types';
import { toJalaliDate, jalaliToGregorianDate, getCurrentJalaliDate } from './persianDate';

export interface TenureDetails {
  hireDateJalali: string;
  hireDateGregorian: string;
  tenureDays: number;
  tenureMonths: number;
  tenureYears: number;
  tenureText: string;
  isLessThanOneYear: boolean;
  isMoreThanOneYear: boolean;
}

export type ContractRuleCategory = 'senior_manager' | 'under_1_year' | 'over_1_year';

export interface ContractRecommendation {
  periodType: ContractPeriodType;
  periodLabel: string;
  suggestedOptions: ContractPeriodType[];
  ruleCategory: ContractRuleCategory;
  ruleCategoryLabel: string;
  reason: string;
  tenure: TenureDetails;
  isSeniorManager: boolean;
  badgeBgColor: string;
  badgeTextColor: string;
  badgeBorderColor: string;
}

/**
 * Clean and normalize Persian/Arabic text for robust matching
 */
function normalizeText(str?: string): string {
  if (!str) return '';
  return str
    .replace(/[ي]/g, 'ی')
    .replace(/[ك]/g, 'ک')
    .replace(/[ة]/g, 'ه')
    .replace(/[۰-۹]/g, d => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)))
    .toLowerCase()
    .trim();
}

/**
 * Determine if the employee's title or level indicates a Manager or Senior Deputy (مدیر یا معاون ارشد)
 */
export function isSeniorExecutiveOrManager(
  positionTitle?: string,
  jobLevel?: string,
  departmentName?: string
): boolean {
  const normTitle = normalizeText(positionTitle);
  const normLevel = normalizeText(jobLevel);
  const normDept = normalizeText(departmentName);

  const combined = `${normTitle} ${normLevel} ${normDept}`;

  // Direct title indicators for Manager & Senior Deputy / Executive
  const seniorKeywords = [
    'مدیر',
    'معاون',
    'معاونت',
    'مدیرعامل',
    'قائم مقام',
    'مدیر ارشد',
    'معاون ارشد',
    'سرپرست ارشد',
    'رئیس هیئت مدیره',
    'عضو هیئت مدیره',
    'مدیرکل',
    'رئیس اداره',
    'رئیس دپارتمان',
    'director',
    'vice president',
    'vp',
    'manager',
    'head of',
    'chief',
    'c-level',
    'executive'
  ];

  // Disqualify junior / assistant titles (e.g. دستیار مدیر or منشی معاونت)
  const assistantExceptions = ['دستیار', 'منشی', 'کارآموز', 'کمک', 'assistant', 'intern'];
  const hasException = assistantExceptions.some(ex => normTitle.startsWith(ex) || normTitle.includes(` ${ex} `));

  if (hasException && !normTitle.includes('معاون مدیر') && !normTitle.includes('معاون ارشد')) {
    return false;
  }

  return seniorKeywords.some(kw => combined.includes(kw));
}

/**
 * Calculate precise tenure duration from hire date (Gregorian or Jalali)
 */
export function calculateTenureDetails(
  hireDate?: string,
  hireDateJalaliInput?: string
): TenureDetails {
  const now = new Date();
  let gDate: Date | null = null;
  let jDateStr = hireDateJalaliInput || '';

  if (hireDate) {
    const parsed = new Date(hireDate);
    if (!isNaN(parsed.getTime())) {
      gDate = parsed;
      if (!jDateStr) {
        jDateStr = toJalaliDate(parsed);
      }
    }
  }

  if (!gDate && jDateStr) {
    const converted = jalaliToGregorianDate(jDateStr);
    if (converted) {
      gDate = new Date(converted);
    }
  }

  if (!gDate || isNaN(gDate.getTime())) {
    // If no valid hire date is provided, default to new hire (0 days / today)
    const todayJalali = getCurrentJalaliDate();
    return {
      hireDateJalali: todayJalali,
      hireDateGregorian: now.toISOString().split('T')[0],
      tenureDays: 0,
      tenureMonths: 0,
      tenureYears: 0,
      tenureText: 'جدیدالاستخدام (کمتر از ۱ ماه)',
      isLessThanOneYear: true,
      isMoreThanOneYear: false
    };
  }

  // Calculate day difference
  const diffTime = now.getTime() - gDate.getTime();
  const tenureDays = Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));

  // Calculate month and year components
  let diffMonths = (now.getFullYear() - gDate.getFullYear()) * 12 + (now.getMonth() - gDate.getMonth());
  if (now.getDate() < gDate.getDate()) {
    diffMonths--;
  }
  diffMonths = Math.max(0, diffMonths);

  const tenureYears = Math.floor(diffMonths / 12);
  const remMonths = diffMonths % 12;

  let tenureText = '';
  if (diffMonths < 1) {
    tenureText = tenureDays === 0 ? 'شروع امروز' : `${tenureDays} روز (کمتر از ۱ ماه)`;
  } else if (tenureYears === 0) {
    tenureText = `${diffMonths} ماه (${tenureDays} روز)`;
  } else if (remMonths === 0) {
    tenureText = `${tenureYears} سال کامل`;
  } else {
    tenureText = `${tenureYears} سال و ${remMonths} ماه`;
  }

  return {
    hireDateJalali: jDateStr || toJalaliDate(gDate),
    hireDateGregorian: gDate.toISOString().split('T')[0],
    tenureDays,
    tenureMonths: diffMonths,
    tenureYears,
    tenureText,
    isLessThanOneYear: diffMonths < 12,
    isMoreThanOneYear: diffMonths >= 12
  };
}

/**
 * Central business logic according to user specification:
 * 1. مدیران و معاونین ارشد -> قرارداد ۶ ماهه و یکساله (6_months or 1_year)
 * 2. سابقه کمتر از ۱ سال -> قرارداد ۱ ماهه (1_month)
 * 3. سابقه بیشتر از ۱ سال -> قرارداد ۳ ماهه (3_months)
 */
export function getContractRecommendation(
  employee: Partial<EmployeeSummary | FullRegistrationFormData>
): ContractRecommendation {
  const positionTitle = (employee as any).positionTitle || (employee as any).organization?.positionTitle || '';
  const jobLevel = (employee as any).jobLevel || (employee as any).organization?.jobLevel || '';
  const departmentName = (employee as any).departmentName || (employee as any).organization?.departmentName || '';

  const isSenior = isSeniorExecutiveOrManager(positionTitle, jobLevel, departmentName);

  const hireDate = (employee as any).hireDate || (employee as any).employment?.hireDate;
  const hireDateJalali = (employee as any).hireDateJalali || (employee as any).employment?.hireDateJalali;

  const tenure = calculateTenureDetails(hireDate, hireDateJalali);

  // 1. Check Manager / Senior Deputy Rule FIRST (Highest Priority)
  if (isSenior) {
    return {
      periodType: '1_year',
      periodLabel: '۶ ماهه و یکساله (مدیریتی)',
      suggestedOptions: ['6_months', '1_year'],
      ruleCategory: 'senior_manager',
      ruleCategoryLabel: 'مدیران و معاونین ارشد',
      reason: 'سمت مدیریتی / معاونت ارشد (تنظیم قرارداد ۶ ماهه یا سالانه با ثبات راهبردی)',
      tenure,
      isSeniorManager: true,
      badgeBgColor: 'bg-purple-50',
      badgeTextColor: 'text-purple-800',
      badgeBorderColor: 'border-purple-200'
    };
  }

  // 2. Check Tenure < 1 Year Rule
  if (tenure.isLessThanOneYear) {
    return {
      periodType: '1_month',
      periodLabel: '۱ ماهه (ماهانه آزمایشی)',
      suggestedOptions: ['1_month'],
      ruleCategory: 'under_1_year',
      ruleCategoryLabel: 'کارکرد کمتر از ۱ سال',
      reason: 'سابقه کارکرد کمتر از ۱ سال (تنظیم قرارداد ۱ ماهه آزمایشی طبق دستورالعمل)',
      tenure,
      isSeniorManager: false,
      badgeBgColor: 'bg-blue-50',
      badgeTextColor: 'text-blue-800',
      badgeBorderColor: 'border-blue-200'
    };
  }

  // 3. Check Tenure >= 1 Year Rule for Regular Personnel
  return {
    periodType: '3_months',
    periodLabel: '۳ ماهه (دوره‌ای / فصلی)',
    suggestedOptions: ['3_months'],
    ruleCategory: 'over_1_year',
    ruleCategoryLabel: 'کارکرد بیشتر از ۱ سال',
    reason: 'سابقه کارکرد بالای ۱ سال (تنظیم قرارداد ۳ ماهه تجدیدپذیر فصلی)',
    tenure,
    isSeniorManager: false,
    badgeBgColor: 'bg-amber-50',
    badgeTextColor: 'text-amber-800',
    badgeBorderColor: 'border-amber-200'
  };
}
