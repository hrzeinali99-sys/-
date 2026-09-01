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
import { Company, Branch, Department, Team, Position, PayrollSettings } from '../types';
import { logAuditEvent } from './auditService';

export const DEFAULT_COMPANIES: Company[] = [
  {
    id: 'comp-1',
    name: 'گروه سرمایه‌گذاری و توسعه مالی کیهان (هلدینگ مادر)',
    code: 'HOLD-KYH',
    type: 'holding',
    economicCode: '411345678912',
    nationalId: '14008923145',
    registrationNumber: '542100',
    industry: 'سرمایه‌گذاری، فناوری و تحول دیجیتال',
    ceoName: 'دکتر محمدرضا کیهانی',
    boardChairman: 'مهندس سعید دانشور',
    establishedYear: '۱۳۸۵',
    phone: '021-88776655',
    email: 'info@keyhangroup.ir',
    website: 'https://keyhangroup.ir',
    city: 'تهران',
    province: 'تهران',
    address: 'تهران، بلوار میرداماد، برج کیهان، طبقه ۱۲',
    status: 'active',
    description: 'هلدینگ مادر و مدیریت زنجیره ارزش شرکت‌های تابعه فناوری، مالی و لجستیک'
  },
  {
    id: 'comp-2',
    name: 'شرکت فناوری و داده‌پردازان کیهان',
    code: 'DPK-01',
    type: 'subsidiary',
    holdingId: 'comp-1',
    holdingName: 'گروه سرمایه‌گذاری و توسعه مالی کیهان (هلدینگ مادر)',
    ownershipPercentage: 100,
    economicCode: '411345678913',
    nationalId: '14009876541',
    registrationNumber: '584210',
    industry: 'توسعه نرم‌افزار سازمانی و رایانش ابری',
    ceoName: 'مهندس آرش طاهری',
    boardChairman: 'دکتر مریم سلیمانی',
    establishedYear: '۱۳۹۲',
    phone: '021-88776656',
    email: 'contact@dpk-tech.ir',
    website: 'https://dpk-tech.ir',
    city: 'تهران',
    province: 'تهران',
    address: 'تهران، پارک فناوری پردیس، ساختمان نوآوری ۳',
    status: 'active',
    description: 'توسعه پلتفرم‌های کلود، سامانه‌های منابع انسانی و هوش مصنوعی'
  },
  {
    id: 'comp-3',
    name: 'شرکت هوش مصنوعی و تحلیل داده پیشرو پارس',
    code: 'PARS-AI',
    type: 'subsidiary',
    holdingId: 'comp-1',
    holdingName: 'گروه سرمایه‌گذاری و توسعه مالی کیهان (هلدینگ مادر)',
    ownershipPercentage: 80,
    economicCode: '411987654321',
    nationalId: '14007654329',
    registrationNumber: '612340',
    industry: 'هوش مصنوعی، یادگیری عمیق و کلان‌داده',
    ceoName: 'دکتر هومن فرخی',
    boardChairman: 'مهندس وحید کاظمی',
    establishedYear: '۱۳۹۸',
    phone: '021-22334455',
    email: 'ai@parspishro.ir',
    website: 'https://parspishro.ir',
    city: 'تهران',
    province: 'تهران',
    address: 'تهران، سعادت‌آباد، خیابان علامه طباطبایی، پلاک ۱۸',
    status: 'active',
    description: 'توسعه مدل‌های هوش مصنوعی زبانی و پردازش تصویر'
  },
  {
    id: 'comp-4',
    name: 'شرکت بازرگانی و لجستیک هوشمند کیهان اکسپرس',
    code: 'KYH-LOG',
    type: 'subsidiary',
    holdingId: 'comp-1',
    holdingName: 'گروه سرمایه‌گذاری و توسعه مالی کیهان (هلدینگ مادر)',
    ownershipPercentage: 55,
    economicCode: '411554433221',
    nationalId: '14006543211',
    registrationNumber: '635410',
    industry: 'لجستیک هوشمند و زنجیره تامین',
    ceoName: 'پژمان خسروی',
    boardChairman: 'علیرضا اسدی',
    establishedYear: '۱۴۰۰',
    phone: '021-44556677',
    email: 'logistics@keyhan-exp.ir',
    website: 'https://keyhan-exp.ir',
    city: 'تهران',
    province: 'تهران',
    address: 'تهران، کیلومتر ۱۴ جاده مخصوص کرج، مجتمع لجستیک کیهان',
    status: 'active',
    description: 'خدمات توزیع مویرگی و انبارداری مکانیزه'
  }
];

export const DEFAULT_BRANCHES: Branch[] = [
  { id: 'branch-1', companyId: 'comp-1', name: 'دفتر مرکزی - برج میرداماد', code: 'BR-101', city: 'تهران', address: 'تهران، بلوار میرداماد، جنب پلاک ۲۴' },
  { id: 'branch-2', companyId: 'comp-1', name: 'مرکز توسعه - پارک فناوری پردیس', code: 'BR-102', city: 'تهران', address: 'کیلومتر ۲۰ جاده دماوند، پارک فناوری پردیس' },
  { id: 'branch-3', companyId: 'comp-1', name: 'شعبه اصفهان - شهرک علمی', code: 'BR-103', city: 'اصفههان', address: 'اصفهان، دانشگاه صنعتی، شهرک علمی و تحقیقاتی' },
  { id: 'branch-4', companyId: 'comp-1', name: 'شعبه مشهد - بلوار کوثر', code: 'BR-104', city: 'مشهد', address: 'مشهد، بلوار کوثر، نبش کوثر ۱۳' },
  { id: 'branch-5', companyId: 'comp-1', name: 'شعبه شیراز - ستارخان', code: 'BR-105', city: 'شیراز', address: 'شیراز، خیابان ستارخان، مجتمع پارس' }
];

export const DEFAULT_DEPARTMENTS: Department[] = [
  { id: 'dept-1', companyId: 'comp-1', name: 'منابع انسانی و توسعه سازمانی', code: 'HR', managerName: 'دکتر مریم سلیمانی' },
  { id: 'dept-2', companyId: 'comp-1', name: 'مهندسی نرم‌افزار و هوش مصنوعی', code: 'ENG', managerName: 'مهندس آرش طاهری' },
  { id: 'dept-3', companyId: 'comp-1', name: 'زیرساخت ابری و DevOps', code: 'INFRA', managerName: 'مهندس سهراب رحیمی' },
  { id: 'dept-4', companyId: 'comp-1', name: 'طراحی محصول و تجربه کاربری (UI/UX)', code: 'PROD', managerName: 'مهندس نیلوفر صادقی' },
  { id: 'dept-5', companyId: 'comp-1', name: 'امور مالی، حسابداری و حقوق‌دستمزد', code: 'FIN', managerName: 'علیرضا اسدی' },
  { id: 'dept-6', companyId: 'comp-1', name: 'بازاریابی دیجیتال و فروش سازمانی', code: 'MKT', managerName: 'پژمان خسروی' },
  { id: 'dept-7', companyId: 'comp-1', name: 'تحقیق و توسعه فناوری‌های نوین (R&D)', code: 'RND', managerName: 'دکتر هومن فرخی' },
  { id: 'dept-8', companyId: 'comp-1', name: 'حقوقی، قراردادها و امور اداری', code: 'LEG', managerName: 'سرکار خانم شیدا باقری' },
  { id: 'dept-9', companyId: 'comp-1', name: 'پشتیبانی مشتریان و موفقیت مشتری', code: 'SUPP', managerName: 'کامران نوری' },
  { id: 'dept-10', companyId: 'comp-1', name: 'امنیت سایبری، انطباق و ممیزی', code: 'SEC', managerName: 'مهندس وحید کاظمی' }
];

export const DEFAULT_TEAMS: Team[] = [
  // HR
  { id: 'team-1', departmentId: 'dept-1', name: 'جذب، استخدام و برند کارفرمایی' },
  { id: 'team-2', departmentId: 'dept-1', name: 'آموزش، توسعه و ارزیابی عملکرد' },
  { id: 'team-3', departmentId: 'dept-1', name: 'روابط کارکنان، رفاهی و بیمه' },
  // Engineering
  { id: 'team-4', departmentId: 'dept-2', name: 'تیم معماری و بک‌اند (Backend Core)' },
  { id: 'team-5', departmentId: 'dept-2', name: 'تیم فرانت‌اند و برنامه‌های وب' },
  { id: 'team-6', departmentId: 'dept-2', name: 'تیم هوش مصنوعی و پردازش زبان طبیعی (AI & NLP)' },
  { id: 'team-7', departmentId: 'dept-2', name: 'تیم تضمین کیفیت نرم‌افزار (QA)' },
  // Infra
  { id: 'team-8', departmentId: 'dept-3', name: 'تیم زیرساخت کلود و کانتینرها' },
  { id: 'team-9', departmentId: 'dept-3', name: 'تیم پایگاه داده و مانیتورینگ' },
  // Product
  { id: 'team-10', departmentId: 'dept-4', name: 'تیم طراحی رابط کاربری (UI)' },
  { id: 'team-11', departmentId: 'dept-4', name: 'تیم تحقیقات تجربه کاربر (UX Research)' },
  // Finance
  { id: 'team-12', departmentId: 'dept-5', name: 'تیم حسابداری عمومی و دفاتر' },
  { id: 'team-13', departmentId: 'dept-5', name: 'تیم حقوق و دستمزد و مالیات' },
  // Marketing
  { id: 'team-14', departmentId: 'dept-6', name: 'تیم بازاریابی محتوا و سئو' },
  { id: 'team-15', departmentId: 'dept-6', name: 'تیم فروش سازمانی (B2B Sales)' }
];

export const DEFAULT_POSITIONS: Position[] = [
  { id: 'pos-1', departmentId: 'dept-1', title: 'مدیر منابع انسانی', code: 'HR-MGR', level: 'مدیر ارشد', minSalary: 450000000, maxSalary: 850000000 },
  { id: 'pos-2', departmentId: 'dept-1', title: 'کارشناس ارشد جذب و استخدام', code: 'HR-REC', level: 'کارشناس ارشد', minSalary: 300000000, maxSalary: 480000000 },
  { id: 'pos-3', departmentId: 'dept-1', title: 'کارشناس امور اداری و بیمه', code: 'HR-ADM', level: 'کارشناس', minSalary: 220000000, maxSalary: 350000000 },
  { id: 'pos-4', departmentId: 'dept-1', title: 'کارشناس آموزش و یادگیری', code: 'HR-TRN', level: 'کارشناس', minSalary: 240000000, maxSalary: 380000000 },
  
  { id: 'pos-5', departmentId: 'dept-2', title: 'مدیر ارشد فناوری (CTO)', code: 'ENG-CTO', level: 'معاونت/مدیر ارشد', minSalary: 800000000, maxSalary: 1600000000 },
  { id: 'pos-6', departmentId: 'dept-2', title: 'معمار ارشد نرم‌افزار', code: 'ENG-ARCH', level: 'رهبر فنی', minSalary: 650000000, maxSalary: 1200000000 },
  { id: 'pos-7', departmentId: 'dept-2', title: 'توسعه‌دهنده ارشد فول‌استک', code: 'ENG-SR-FS', level: 'کارشناس ارشد', minSalary: 450000000, maxSalary: 750000000 },
  { id: 'pos-8', departmentId: 'dept-2', title: 'توسعه‌دهنده فرانت‌اند React/TypeScript', code: 'ENG-FE', level: 'کارشناس', minSalary: 320000000, maxSalary: 550000000 },
  { id: 'pos-9', departmentId: 'dept-2', title: 'توسعه‌دهنده بک‌اند Node.js/Go', code: 'ENG-BE', level: 'کارشناس', minSalary: 350000000, maxSalary: 580000000 },
  { id: 'pos-10', departmentId: 'dept-2', title: 'متخصص یادگیری ماشین و هوش مصنوعی', code: 'ENG-AI', level: 'کارشناس ارشد', minSalary: 500000000, maxSalary: 950000000 },
  { id: 'pos-11', departmentId: 'dept-2', title: 'مهندس تست و اتوماسیون QA', code: 'ENG-QA', level: 'کارشناس', minSalary: 280000000, maxSalary: 460000000 },

  { id: 'pos-12', departmentId: 'dept-3', title: 'مدیر زیرساخت و عملیات IT', code: 'INF-MGR', level: 'مدیر میانی', minSalary: 500000000, maxSalary: 900000000 },
  { id: 'pos-13', departmentId: 'dept-3', title: 'مهندس ارشد DevOps', code: 'INF-DO', level: 'کارشناس ارشد', minSalary: 480000000, maxSalary: 820000000 },
  { id: 'pos-14', departmentId: 'dept-3', title: 'مدیر پایگاه داده (DBA)', code: 'INF-DBA', level: 'کارشناس ارشد', minSalary: 420000000, maxSalary: 700000000 },
  { id: 'pos-15', departmentId: 'dept-3', title: 'کارشناس پشتیبانی شبکه و سخت‌افزار', code: 'INF-NET', level: 'کارشناس', minSalary: 220000000, maxSalary: 360000000 },

  { id: 'pos-16', departmentId: 'dept-4', title: 'مدیر طراحی محصول', code: 'PRD-MGR', level: 'مدیر میانی', minSalary: 480000000, maxSalary: 850000000 },
  { id: 'pos-17', departmentId: 'dept-4', title: 'طراح ارشد تجربه کاربری (UX Lead)', code: 'PRD-UX', level: 'کارشناس ارشد', minSalary: 400000000, maxSalary: 680000000 },
  { id: 'pos-18', departmentId: 'dept-4', title: 'طراح رابط کاربری (UI Designer)', code: 'PRD-UI', level: 'کارشناس', minSalary: 280000000, maxSalary: 480000000 },

  { id: 'pos-19', departmentId: 'dept-5', title: 'مدیر امور مالی و بودجه', code: 'FIN-MGR', level: 'مدیر ارشد', minSalary: 550000000, maxSalary: 980000000 },
  { id: 'pos-20', departmentId: 'dept-5', title: 'حسابدار ارشد حقوق و دستمزد', code: 'FIN-PAY', level: 'کارشناس ارشد', minSalary: 320000000, maxSalary: 520000000 },
  { id: 'pos-21', departmentId: 'dept-5', title: 'کارشناس حسابداری عمومی', code: 'FIN-ACC', level: 'کارشناس', minSalary: 240000000, maxSalary: 380000000 },

  { id: 'pos-22', departmentId: 'dept-6', title: 'مدیر بازاریابی و رشد (CMO)', code: 'MKT-MGR', level: 'مدیر ارشد', minSalary: 500000000, maxSalary: 950000000 },
  { id: 'pos-23', departmentId: 'dept-6', title: 'کارشناس ارشد دیجیتال مارکتینگ', code: 'MKT-DIG', level: 'کارشناس ارشد', minSalary: 320000000, maxSalary: 520000000 },
  { id: 'pos-24', departmentId: 'dept-6', title: 'مدیر فروش سازمانی B2B', code: 'MKT-SLS', level: 'مدیر میانی', minSalary: 380000000, maxSalary: 700000000 },

  { id: 'pos-25', departmentId: 'dept-7', title: 'پژوهشگر ارشد داده و هوش مصنوعی', code: 'RND-SCI', level: 'پژوهشگر ارشد', minSalary: 550000000, maxSalary: 1100000000 },
  { id: 'pos-26', departmentId: 'dept-8', title: 'مشاور حقوقی و امور قراردادها', code: 'LEG-CON', level: 'کارشناس ارشد', minSalary: 350000000, maxSalary: 600000000 },
  { id: 'pos-27', departmentId: 'dept-9', title: 'سرپرست مرکز تماس و پشتیبانی', code: 'SUP-LEAD', level: 'سرپرست', minSalary: 280000000, maxSalary: 450000000 },
  { id: 'pos-28', departmentId: 'dept-9', title: 'کارشناس پشتیبانی فنی نرم‌افزار', code: 'SUP-TECH', level: 'کارشناس', minSalary: 200000000, maxSalary: 320000000 },
  { id: 'pos-29', departmentId: 'dept-10', title: 'متخصص ارشد امنیت سایبری و SOC', code: 'SEC-SOC', level: 'کارشناس ارشد', minSalary: 480000000, maxSalary: 880000000 },
  { id: 'pos-30', departmentId: 'dept-10', title: 'کارشناس ممیزی و امنیت اطلاعات', code: 'SEC-AUD', level: 'کارشناس', minSalary: 300000000, maxSalary: 500000000 }
];

export const DEFAULT_PAYROLL_SETTINGS: PayrollSettings = {
  year: 1403,
  baseMinimumDailyWage: 2388728, // 2,388,728 Rials daily
  housingAllowance: 9000000, // 9,000,000 Rials (~900k Toman)
  foodVouchersAllowance: 14000000, // 14,000,000 Rials (~1.4M Toman)
  childAllowancePerChild: 7166184, // per eligible child
  maritalAllowance: 5000000, // 5,000,000 Rials
  employeeInsuranceRate: 0.07, // 7%
  employerInsuranceRate: 0.23, // 23%
  taxExemptionThreshold: 120000000, // Up to 12M Toman exempt
  taxTier1Rate: 0.10, // 10%
  taxTier2Rate: 0.15, // 15%
  taxTier3Rate: 0.20  // 20%
};

export const IRAN_PROVINCES = [
  'تهران', 'اصفهان', 'خراسان رضوی', 'فارس', 'آذربایجان شرقی', 
  'خوزستان', 'مازندران', 'گیلان', 'البرز', 'کرمان', 
  'یزد', 'قم', 'مرکزی', 'قزوین', 'کرمانشاه', 
  'آذربایجان غربی', 'همدان', 'کردستان', 'لرستان', 'هرمزگان',
  'بوشهر', 'اردبیل', 'زنجان', 'گلستان', 'سمنان',
  'سیستان و بلوچستان', 'چهارمحال و بختیاری', 'ایلام', 'کهگیلویه و بویراحمد', 'خراسان جنوبی', 'خراسان شمالی'
];

export const IRAN_CITIES_BY_PROVINCE: Record<string, string[]> = {
  'تهران': ['تهران', 'شهریار', 'اسلامشهر', 'پردیس', 'دماوند', 'ری', 'شمیرانات', 'ورامین', 'پاکدشت'],
  'اصفهان': ['اصفهان', 'کاشان', 'نجف‌آباد', 'خمینی‌شهر', 'شاهین‌شهر', 'شهرضا', 'فولادشهر'],
  'خراسان رضوی': ['مشهد', 'نیشابور', 'سبزوار', 'تربت حیدریه', 'قوچان', 'گناباد'],
  'فارس': ['شیراز', 'مرودشت', 'جهرم', 'فسا', 'کازرون', 'لارستان', 'آباده'],
  'آذربایجان شرقی': ['تبریز', 'مراغه', 'مرند', 'میانه', 'اهر', 'بناب'],
  'البرز': ['کرج', 'فردیس', 'هشتگرد', 'نظرآباد', 'طالقان'],
  'خوزستان': ['اهواز', 'دزفول', 'آبادان', 'خرمشهر', 'ماهشهر', 'شوشتر'],
  'مازندران': ['ساری', 'بابل', 'آمل', 'قائم‌شهر', 'چالوس', 'تنکابن', 'رامسر'],
  'گیلان': ['رشت', 'بندر انزلی', 'لاهیجان', 'لنگرود', 'فومن', 'تالش'],
  'یزد': ['یزد', 'میبد', 'اردکان', 'بافق', 'مهریز'],
  'کرمان': ['کرمان', 'سیرجان', 'رفسنجان', 'جیرفت', 'بم']
};

export const IRAN_BANKS = [
  'بانک ملی ایران',
  'بانک ملت',
  'بانک سامان',
  'بانک پاسارگاد',
  'بانک تجارت',
  'بانک صادرات ایران',
  'بانک سپه',
  'بانک آینده',
  'بانک پارسیان',
  'بانک خاورمیانه',
  'بانک کارآفرین',
  'بانک رفاه کارگران',
  'بانک کشاورزی',
  'بانک مسکن',
  'بانک شهر'
];

export const IRANIAN_BANKS = IRAN_BANKS;

export const SKILL_CATEGORIES = ['فنی', 'نرم‌افزاری', 'مدیریتی', 'تخصصی', 'عمومی'] as const;

export const POPULAR_SKILLS = [
  { name: 'React & TypeScript', category: 'فنی' },
  { name: 'Node.js & Express', category: 'فنی' },
  { name: 'Python & Django', category: 'فنی' },
  { name: 'PostgreSQL & Firestore', category: 'فنی' },
  { name: 'Docker & Kubernetes', category: 'فنی' },
  { name: 'Figma & UI Design', category: 'نرم‌افزاری' },
  { name: 'مدیریت پروژه چابک (Scrum)', category: 'مدیریتی' },
  { name: 'مذاکره و ارتباطات سازمانی', category: 'عمومی' },
  { name: 'حقوق و دستمزد و نرم‌افزار همکاران سیستم', category: 'تخصصی' },
  { name: 'هوش مصنوعی و یادگیری عمیق', category: 'فنی' },
  { name: 'تست نرم‌افزار و Jest', category: 'فنی' },
  { name: 'حسابداری مالی و سپیدار', category: 'تخصصی' },
  { name: 'قوانین کار و تأمین اجتماعی', category: 'تخصصی' }
];

export const POPULAR_LANGUAGES = [
  'فارسی', 'انگلیسی', 'آلمانی', 'فرانسوی', 'عربی', 'ترکی استانبولی', 'روسی', 'چینی'
];

export const DOCUMENT_CATEGORIES = [
  'شناسنامه و کارت ملی',
  'مدرک تحصیلی',
  'کارت پایان خدمت/معافیت',
  'قرارداد کار و احکام',
  'سفته و ضمانت‌نامه',
  'گواهی عدم سوء‌پیشینه',
  'طب کار و کارت بهداشت',
  'عکس پرسنلی',
  'سایر مدارک'
] as const;

/**
 * Fetch or initialize master data in Firestore
 */
export async function getMasterData() {
  try {
    const compSnap = await getDocs(collection(db, 'companies'));
    const branchSnap = await getDocs(collection(db, 'branches'));
    const deptSnap = await getDocs(collection(db, 'departments'));
    const teamSnap = await getDocs(collection(db, 'teams'));
    const posSnap = await getDocs(collection(db, 'positions'));

    const companies: Company[] = compSnap.empty 
      ? DEFAULT_COMPANIES 
      : compSnap.docs.map(d => ({ id: d.id, ...d.data() } as Company));

    const branches: Branch[] = branchSnap.empty 
      ? DEFAULT_BRANCHES 
      : branchSnap.docs.map(d => ({ id: d.id, ...d.data() } as Branch));

    const departments: Department[] = deptSnap.empty 
      ? DEFAULT_DEPARTMENTS 
      : deptSnap.docs.map(d => ({ id: d.id, ...d.data() } as Department));

    const teams: Team[] = teamSnap.empty 
      ? DEFAULT_TEAMS 
      : teamSnap.docs.map(d => ({ id: d.id, ...d.data() } as Team));

    const positions: Position[] = posSnap.empty 
      ? DEFAULT_POSITIONS 
      : posSnap.docs.map(d => ({ id: d.id, ...d.data() } as Position));

    return { companies, branches, departments, teams, positions };
  } catch (error) {
    console.warn('Error fetching master data from Firestore, using defaults:', error);
    return {
      companies: DEFAULT_COMPANIES,
      branches: DEFAULT_BRANCHES,
      departments: DEFAULT_DEPARTMENTS,
      teams: DEFAULT_TEAMS,
      positions: DEFAULT_POSITIONS
    };
  }
}

const DEPARTMENTS_STORAGE_KEY = 'hrms_departments_cache';
const COMPANIES_STORAGE_KEY = 'hrms_companies_cache';
const BRANCHES_STORAGE_KEY = 'hrms_branches_cache';

export async function getCompanies(): Promise<Company[]> {
  try {
    const compSnap = await getDocs(collection(db, 'companies'));
    if (!compSnap.empty) {
      const comps = compSnap.docs.map(d => ({ id: d.id, ...d.data() } as Company));
      try { localStorage.setItem(COMPANIES_STORAGE_KEY, JSON.stringify(comps)); } catch (e) {}
      return comps;
    }
  } catch (error) {
    console.warn('Error fetching companies from Firestore:', error);
  }

  try {
    const cached = localStorage.getItem(COMPANIES_STORAGE_KEY);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {}

  return DEFAULT_COMPANIES;
}

export async function createCompany(companyData: Partial<Company> & { name: string; code: string }): Promise<Company> {
  const comps = await getCompanies();
  const id = `comp-${Date.now()}`;
  const newComp: Company = {
    id,
    name: companyData.name,
    code: companyData.code,
    type: companyData.type || 'subsidiary',
    holdingId: companyData.holdingId,
    holdingName: companyData.holdingName,
    ownershipPercentage: companyData.ownershipPercentage ?? (companyData.type === 'holding' ? 100 : 100),
    registrationNumber: companyData.registrationNumber || '',
    nationalId: companyData.nationalId || '',
    economicCode: companyData.economicCode || '',
    industry: companyData.industry || '',
    ceoName: companyData.ceoName || '',
    boardChairman: companyData.boardChairman || '',
    establishedYear: companyData.establishedYear || '',
    phone: companyData.phone || '',
    email: companyData.email || '',
    website: companyData.website || '',
    city: companyData.city || 'تهران',
    province: companyData.province || 'تهران',
    address: companyData.address || '',
    postalCode: companyData.postalCode || '',
    status: companyData.status || 'active',
    description: companyData.description || ''
  };

  try {
    await setDoc(doc(db, 'companies', id), newComp);
  } catch (e) {
    console.warn('Error saving company to Firestore:', e);
  }

  const updated = [...comps, newComp];
  try { localStorage.setItem(COMPANIES_STORAGE_KEY, JSON.stringify(updated)); } catch (e) {}

  await logAuditEvent({
    userId: 'system',
    userName: 'مدیر ارشد سامانه',
    userRole: 'super_admin',
    action: 'CREATE',
    entityType: 'company',
    entityId: newComp.id,
    description: `شرکت ${newComp.type === 'holding' ? 'هلدینگ مادر' : 'تابعه'} "${newComp.name}" (کد: ${newComp.code}) در سامانه تعریف گردید.`
  });

  return newComp;
}

export async function updateCompany(id: string, updates: Partial<Company>): Promise<Company> {
  const comps = await getCompanies();
  const index = comps.findIndex(c => c.id === id);
  if (index === -1) throw new Error('شرکت مورد نظر یافت نشد.');

  const updatedComp = { ...comps[index], ...updates };

  try {
    await setDoc(doc(db, 'companies', id), updatedComp, { merge: true });
  } catch (e) {
    console.warn('Error updating company in Firestore:', e);
  }

  comps[index] = updatedComp;
  try { localStorage.setItem(COMPANIES_STORAGE_KEY, JSON.stringify(comps)); } catch (e) {}

  await logAuditEvent({
    userId: 'system',
    userName: 'مدیر ارشد سامانه',
    userRole: 'super_admin',
    action: 'UPDATE',
    entityType: 'company',
    entityId: id,
    description: `اطلاعات شرکت "${updatedComp.name}" بروزرسانی شد.`
  });

  return updatedComp;
}

export async function deleteCompany(id: string): Promise<void> {
  const comps = await getCompanies();
  const target = comps.find(c => c.id === id);
  if (!target) throw new Error('شرکت مورد نظر یافت نشد.');

  try {
    await deleteDoc(doc(db, 'companies', id));
  } catch (e) {
    console.warn('Error deleting company from Firestore:', e);
  }

  const updated = comps.filter(c => c.id !== id);
  try { localStorage.setItem(COMPANIES_STORAGE_KEY, JSON.stringify(updated)); } catch (e) {}

  await logAuditEvent({
    userId: 'system',
    userName: 'مدیر ارشد سامانه',
    userRole: 'super_admin',
    action: 'DELETE',
    entityType: 'company',
    entityId: id,
    description: `شرکت "${target.name}" از ساختار هلدینگ حذف گردید.`
  });
}

export async function getDepartments(): Promise<Department[]> {
  try {
    const deptSnap = await getDocs(collection(db, 'departments'));
    if (!deptSnap.empty) {
      const depts = deptSnap.docs.map(d => ({ id: d.id, ...d.data() } as Department));
      try { localStorage.setItem(DEPARTMENTS_STORAGE_KEY, JSON.stringify(depts)); } catch (e) {}
      return depts;
    }
  } catch (error) {
    console.warn('Error fetching departments from Firestore:', error);
  }

  try {
    const cached = localStorage.getItem(DEPARTMENTS_STORAGE_KEY);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {}

  return DEFAULT_DEPARTMENTS;
}

export async function getBranches(): Promise<Branch[]> {
  try {
    const branchSnap = await getDocs(collection(db, 'branches'));
    if (!branchSnap.empty) {
      const brs = branchSnap.docs.map(d => ({ id: d.id, ...d.data() } as Branch));
      try { localStorage.setItem(BRANCHES_STORAGE_KEY, JSON.stringify(brs)); } catch (e) {}
      return brs;
    }
  } catch (error) {
    console.warn('Error fetching branches from Firestore:', error);
  }

  try {
    const cached = localStorage.getItem(BRANCHES_STORAGE_KEY);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {}

  return DEFAULT_BRANCHES;
}

export async function createBranch(branchData: Partial<Branch> & { name: string; companyId: string }): Promise<Branch> {
  const brs = await getBranches();
  const id = `branch-${Date.now()}`;
  const newBranch: Branch = {
    id,
    companyId: branchData.companyId,
    name: branchData.name,
    code: branchData.code || `BR-${brs.length + 101}`,
    city: branchData.city || 'تهران',
    province: branchData.province || 'تهران',
    address: branchData.address || '',
    phone: branchData.phone || '',
    managerName: branchData.managerName || '',
    isHeadquarter: !!branchData.isHeadquarter
  };

  try {
    await setDoc(doc(db, 'branches', id), newBranch);
  } catch (e) {
    console.warn('Error saving branch to Firestore:', e);
  }

  const updated = [...brs, newBranch];
  try { localStorage.setItem(BRANCHES_STORAGE_KEY, JSON.stringify(updated)); } catch (e) {}

  await logAuditEvent({
    userId: 'system',
    userName: 'مدیر ارشد سامانه',
    userRole: 'super_admin',
    action: 'CREATE',
    entityType: 'branch',
    entityId: newBranch.id,
    description: `شعبه/دفتر جدید "${newBranch.name}" (کد: ${newBranch.code}) در شهر ${newBranch.city} ثبت گردید.`
  });

  return newBranch;
}

export async function updateBranch(id: string, updates: Partial<Branch>): Promise<Branch> {
  const brs = await getBranches();
  const index = brs.findIndex(b => b.id === id);
  if (index === -1) throw new Error('شعبه مورد نظر یافت نشد.');

  const updatedBranch = { ...brs[index], ...updates };

  try {
    await setDoc(doc(db, 'branches', id), updatedBranch, { merge: true });
  } catch (e) {
    console.warn('Error updating branch in Firestore:', e);
  }

  brs[index] = updatedBranch;
  try { localStorage.setItem(BRANCHES_STORAGE_KEY, JSON.stringify(brs)); } catch (e) {}

  await logAuditEvent({
    userId: 'system',
    userName: 'مدیر ارشد سامانه',
    userRole: 'super_admin',
    action: 'UPDATE',
    entityType: 'branch',
    entityId: id,
    description: `اطلاعات شعبه "${updatedBranch.name}" بروزرسانی شد.`
  });

  return updatedBranch;
}

export async function deleteBranch(id: string): Promise<void> {
  const brs = await getBranches();
  const target = brs.find(b => b.id === id);
  if (!target) throw new Error('شعبه مورد نظر یافت نشد.');

  try {
    await deleteDoc(doc(db, 'branches', id));
  } catch (e) {
    console.warn('Error deleting branch from Firestore:', e);
  }

  const updated = brs.filter(b => b.id !== id);
  try { localStorage.setItem(BRANCHES_STORAGE_KEY, JSON.stringify(updated)); } catch (e) {}

  await logAuditEvent({
    userId: 'system',
    userName: 'مدیر ارشد سامانه',
    userRole: 'super_admin',
    action: 'DELETE',
    entityType: 'branch',
    entityId: id,
    description: `شعبه "${target.name}" از ساختار شعب حذف گردید.`
  });
}

export async function createDepartment(deptData: Partial<Department> & { name: string }): Promise<Department> {
  const depts = await getDepartments();
  const id = `dept-${Date.now()}`;
  const newDept: Department = {
    name: deptData.name,
    code: deptData.code || `DPT-${depts.length + 1}`,
    managerName: deptData.managerName || '',
    id,
    companyId: deptData.companyId || 'comp-1'
  };

  try {
    await setDoc(doc(db, 'departments', id), newDept);
  } catch (e) {
    console.warn('Error saving department to Firestore:', e);
  }

  const updated = [...depts, newDept];
  try { localStorage.setItem(DEPARTMENTS_STORAGE_KEY, JSON.stringify(updated)); } catch (e) {}

  await logAuditEvent({
    userId: 'system',
    userName: 'مدیر ارشد سامانه',
    userRole: 'super_admin',
    action: 'CREATE',
    entityType: 'department',
    entityId: newDept.id,
    description: `دپارتمان جدید "${newDept.name}" در چارت سازمانی ایجاد گردید.`
  });

  return newDept;
}

export async function updateDepartment(id: string, updates: Partial<Department>): Promise<Department> {
  const depts = await getDepartments();
  const index = depts.findIndex(d => d.id === id);
  if (index === -1) throw new Error('دپارتمان مورد نظر یافت نشد.');

  const updatedDept = { ...depts[index], ...updates };

  try {
    await setDoc(doc(db, 'departments', id), updatedDept, { merge: true });
  } catch (e) {
    console.warn('Error updating department in Firestore:', e);
  }

  depts[index] = updatedDept;
  try { localStorage.setItem(DEPARTMENTS_STORAGE_KEY, JSON.stringify(depts)); } catch (e) {}

  await logAuditEvent({
    userId: 'system',
    userName: 'مدیر ارشد سامانه',
    userRole: 'super_admin',
    action: 'UPDATE',
    entityType: 'department',
    entityId: id,
    description: `مشخصات دپارتمان "${updatedDept.name}" بروزرسانی شد.`
  });

  return updatedDept;
}

export async function deleteDepartment(id: string): Promise<void> {
  const depts = await getDepartments();
  const target = depts.find(d => d.id === id);
  if (!target) throw new Error('دپارتمان مورد نظر یافت نشد.');

  try {
    await deleteDoc(doc(db, 'departments', id));
  } catch (e) {
    console.warn('Error deleting department from Firestore:', e);
  }

  const updated = depts.filter(d => d.id !== id);
  try { localStorage.setItem(DEPARTMENTS_STORAGE_KEY, JSON.stringify(updated)); } catch (e) {}

  await logAuditEvent({
    userId: 'system',
    userName: 'مدیر ارشد سامانه',
    userRole: 'super_admin',
    action: 'DELETE',
    entityType: 'department',
    entityId: id,
    description: `دپارتمان "${target.name}" (کد: ${target.code}) از چارت و ساختار سازمانی حذف گردید.`
  });
}

export async function createTeam(teamData: Omit<Team, 'id'>): Promise<Team> {
  const id = `team-${Date.now()}`;
  const newTeam: Team = { ...teamData, id };
  try {
    await setDoc(doc(db, 'teams', id), newTeam);
  } catch (e) {}
  return newTeam;
}

export async function deleteTeam(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'teams', id));
  } catch (e) {}
}

export async function createPosition(posData: Omit<Position, 'id'>): Promise<Position> {
  const id = `pos-${Date.now()}`;
  const newPos: Position = { ...posData, id };
  try {
    await setDoc(doc(db, 'positions', id), newPos);
  } catch (e) {}
  return newPos;
}

export async function deletePosition(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'positions', id));
  } catch (e) {}
}

