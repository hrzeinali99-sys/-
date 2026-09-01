import { 
  collection, 
  doc, 
  writeBatch, 
  getDocs, 
  limit, 
  query,
  setDoc,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { 
  DEFAULT_COMPANIES, 
  DEFAULT_BRANCHES, 
  DEFAULT_DEPARTMENTS, 
  DEFAULT_TEAMS, 
  DEFAULT_POSITIONS, 
  IRAN_PROVINCES,
  IRAN_CITIES_BY_PROVINCE,
  IRAN_BANKS
} from './masterDataService';
import { 
  EmployeeSummary, 
  EmploymentStatus, 
  ContractType, 
  Gender, 
  MaritalStatus,
  MilitaryStatus,
  EducationLevel,
  SkillLevel,
  LanguageProficiency
} from '../types';
import { toJalaliDate, jalaliToGregorianDate } from '../utils/persianDate';

const FIRST_NAMES_MALE = [
  'علی', 'محمد', 'حسین', 'امیر', 'رضا', 'مهدی', 'علیرضا', 'احسان', 'سعید', 'امید',
  'آرش', 'پویا', 'نیما', 'سینا', 'بهزاد', 'سهراب', 'کیان', 'مازیار', 'پژمان', 'کامران',
  'فرزاد', 'نوید', 'بابک', 'داریوش', 'پارسا', 'سامان', 'میلاد', 'شهاب', 'آرمان', 'بردیا'
];

const FIRST_NAMES_FEMALE = [
  'فاطمه', 'زهرا', 'مریم', 'نرگس', 'سارا', 'نیلوفر', 'الهام', 'مهسا', 'شیما', 'پریسا',
  'بهاره', 'سمیرا', 'یاسمن', 'غزاله', 'شیدا', 'رویا', 'آیدا', 'پریناز', 'نگین', 'کیمیا',
  'ستاره', 'سوگند', 'درسا', 'طناز', 'تینا', 'شقایق', 'هانیه', 'مونا', 'صبا', 'نازنین'
];

const LAST_NAMES = [
  'محمدی', 'حسینی', 'رضایی', 'کریمی', 'مرادی', 'موسوی', 'جعفری', 'قاسمی', 'احمدی', 'صادقی',
  'حیدری', 'کاظمی', 'رحیمی', 'ابراهیمی', 'اکبری', 'مطهری', 'طاهری', 'سلیمانی', 'عباسی', 'خسروی',
  'نوری', 'باقری', 'مقدم', 'امانی', 'اسدی', 'نجفی', 'دهقان', 'فرهادی', 'راد', 'سعادتی',
  'افشار', 'نیک‌نژاد', 'شریفی', 'فروتن', 'زمانی', 'شمس', 'بهرامی', 'پارسایی', 'صالحی', 'محمودی'
];

const FATHER_NAMES = ['احمد', 'حسین', 'محمد', 'رضا', 'محمود', 'اکبر', 'حسن', 'اصغر', 'غلامرضا', 'ابراهیم'];

function generateValidNationalId(index: number): string {
  // Generate 9 digits with index variation
  const base = String(100000000 + index * 137).padStart(9, '0').slice(0, 9);
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(base[i], 10) * (10 - i);
  }
  const rem = sum % 11;
  const check = rem < 2 ? rem : 11 - rem;
  return base + String(check);
}

function getRandomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export async function checkEmployeesCount(): Promise<number> {
  try {
    const snap = await getDocs(collection(db, 'employees'));
    return snap.size;
  } catch (error) {
    console.error('Error counting employees:', error);
    return 0;
  }
}

/**
 * Seed master data and 300 realistic Persian employees in Firestore
 */
export async function seedDatabase(
  onProgress?: (current: number, total: number, message: string) => void
): Promise<{ success: boolean; count: number }> {
  try {
    onProgress?.(0, 300, 'در حال راه‌اندازی داده‌های پایه‌ای سازمان (شرکت‌ها، شعب، دپارتمان‌ها و سمت‌ها)...');

    // 1. Seed Master Collections
    for (const comp of DEFAULT_COMPANIES) {
      await setDoc(doc(db, 'companies', comp.id), comp);
    }
    for (const br of DEFAULT_BRANCHES) {
      await setDoc(doc(db, 'branches', br.id), br);
    }
    for (const dept of DEFAULT_DEPARTMENTS) {
      await setDoc(doc(db, 'departments', dept.id), dept);
    }
    for (const tm of DEFAULT_TEAMS) {
      await setDoc(doc(db, 'teams', tm.id), tm);
    }
    for (const pos of DEFAULT_POSITIONS) {
      await setDoc(doc(db, 'positions', pos.id), pos);
    }

    onProgress?.(10, 300, 'داده‌های پایه‌ای ذخیره شد. در حال تولید ۳۰۰ پرونده پرسنلی معتبر...');

    // 2. Generate 300 Employees in batches of 25 (to keep write batches fast & within limits)
    const TOTAL_EMPLOYEES = 300;
    const statuses: EmploymentStatus[] = ['active', 'active', 'active', 'active', 'active', 'on_leave', 'mission', 'suspended', 'terminated', 'retired'];
    const contractTypes: ContractType[] = ['دائمی', 'دائمی', 'دائمی', 'موقت', 'موقت', 'پروژه‌ای', 'مشاور'];
    const degrees: EducationLevel[] = ['کارشناسی', 'کارشناسی ارشد', 'دکتری', 'فوق دیپلم', 'دیپلم'];
    
    let createdCount = 0;

    for (let batchIdx = 0; batchIdx < Math.ceil(TOTAL_EMPLOYEES / 20); batchIdx++) {
      const batch = writeBatch(db);
      const batchSize = Math.min(20, TOTAL_EMPLOYEES - batchIdx * 20);

      for (let i = 0; i < batchSize; i++) {
        const empIndex = batchIdx * 20 + i + 1;
        const isMale = Math.random() > 0.42;
        const firstName = isMale ? getRandomItem(FIRST_NAMES_MALE) : getRandomItem(FIRST_NAMES_FEMALE);
        const lastName = getRandomItem(LAST_NAMES);
        const fatherName = getRandomItem(FATHER_NAMES);
        const empCode = `EMP-${String(1000 + empIndex).padStart(4, '0')}`;
        const nationalId = generateValidNationalId(empIndex);
        const empId = `emp-${empCode.toLowerCase()}`;

        const dept = DEFAULT_DEPARTMENTS[empIndex % DEFAULT_DEPARTMENTS.length];
        const deptPositions = DEFAULT_POSITIONS.filter(p => p.departmentId === dept.id);
        const position = deptPositions.length > 0 ? deptPositions[empIndex % deptPositions.length] : DEFAULT_POSITIONS[0];
        const branch = DEFAULT_BRANCHES[empIndex % DEFAULT_BRANCHES.length];
        const company = DEFAULT_COMPANIES[empIndex % DEFAULT_COMPANIES.length];
        const status = statuses[empIndex % statuses.length];
        const contractType = contractTypes[empIndex % contractTypes.length];
        const isMarried = empIndex % 3 !== 0;
        const children = isMarried ? (empIndex % 4) : 0;

        // Generate birthdate (ages between 23 and 58)
        const birthYear = 1345 + (empIndex % 35);
        const birthMonth = 1 + (empIndex % 12);
        const birthDay = 1 + (empIndex % 28);
        const birthJalali = `${birthYear}/${String(birthMonth).padStart(2, '0')}/${String(birthDay).padStart(2, '0')}`;
        const birthGregorian = jalaliToGregorianDate(birthJalali) || '1990-05-15';

        // Generate hire date (between 1395 and 1403)
        const hireYear = 1395 + (empIndex % 9);
        const hireMonth = 1 + ((empIndex * 3) % 12);
        const hireDay = 1 + ((empIndex * 7) % 28);
        const hireJalali = `${hireYear}/${String(hireMonth).padStart(2, '0')}/${String(hireDay).padStart(2, '0')}`;
        const hireGregorian = jalaliToGregorianDate(hireJalali) || '2021-03-21';

        // Salary base in Rials (IRR)
        const baseSalary = position.minSalary 
          ? position.minSalary + (empIndex % 10) * 15000000 
          : 280000000;
        const housing = 90000000;
        const food = 140000000;
        const childAllowance = children * 71661840;
        const maritalAllowance = isMarried ? 50000000 : 0;
        const gross = baseSalary + housing + food + childAllowance + maritalAllowance;
        const insurance = Math.round((baseSalary + housing + food) * 0.07);
        const taxable = Math.max(0, gross - 1200000000 - insurance);
        const tax = Math.round(taxable * 0.1);
        const netSalary = gross - insurance - tax;

        const mobile = `0912${String(1000000 + empIndex * 73).padStart(7, '0')}`;

        // Top level Employee Summary Document
        const employeeDocRef = doc(db, 'employees', empId);
        const summaryData: EmployeeSummary = {
          id: empId,
          employeeCode: empCode,
          firstName,
          lastName,
          latinFirstName: isMale ? 'Mohammad' : 'Sara',
          latinLastName: lastName,
          nationalId,
          birthDate: birthGregorian,
          birthDateJalali: birthJalali,
          gender: isMale ? 'مرد' : 'زن',
          maritalStatus: isMarried ? (children > 0 ? 'معیل' : 'متأهل') : 'مجرد',
          childrenCount: children,
          profileImageUrl: `https://images.unsplash.com/photo-${isMale ? '1534528741775-53994a69daeb' : '1544005313-94ddf0286df2'}?w=200&auto=format&fit=crop&q=80`,
          
          companyId: company.id,
          companyName: company.name,
          branchId: branch.id,
          branchName: branch.name,
          departmentId: dept.id,
          departmentName: dept.name,
          positionId: position.id,
          positionTitle: position.title,
          jobLevel: position.level,
          managerName: dept.managerName,
          costCenterCode: `CC-${dept.code}`,

          mobile,
          workEmail: `${empCode.toLowerCase()}@dpk.ir`,

          employmentType: 'قراردادی',
          employmentStatus: status,
          contractType,
          hireDate: hireGregorian,
          hireDateJalali: hireJalali,
          baseSalary,
          netSalary,

          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          createdBy: 'system-seeder',
          updatedBy: 'system-seeder'
        };

        batch.set(employeeDocRef, summaryData);

        // Subcollection: contacts
        const contactRef = doc(db, `employees/${empId}/contacts`, 'primary');
        batch.set(contactRef, {
          id: 'primary',
          mobile,
          landline: `021-88${String(100000 + empIndex).slice(0, 6)}`,
          personalEmail: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@gmail.com`,
          workEmail: `${empCode.toLowerCase()}@dpk.ir`
        });

        // Subcollection: addresses
        const addressRef = doc(db, `employees/${empId}/addresses`, 'residential');
        batch.set(addressRef, {
          id: 'residential',
          type: 'residential',
          title: 'نشانی منزل',
          province: 'تهران',
          city: 'تهران',
          district: `منطقه ${(empIndex % 15) + 1}`,
          fullAddress: `تهران، خیابان ولیعصر، کوچه بهار، پلاک ${(empIndex % 120) + 1}، واحد ${((empIndex % 8) + 1)}`,
          postalCode: `19${String(10000000 + empIndex * 31).slice(0, 8)}`,
          buildingNumber: String((empIndex % 120) + 1),
          unitNumber: String((empIndex % 8) + 1)
        });

        // Subcollection: employment
        const employmentRef = doc(db, `employees/${empId}/employment`, 'current');
        batch.set(employmentRef, {
          id: 'current',
          employeeCode: empCode,
          contractNumber: `CTR-1403-${empCode}`,
          contractType,
          employmentType: 'تمام وقت',
          hireDate: hireGregorian,
          insuranceStartDate: hireGregorian,
          employmentStatus: status,
          cooperationType: 'تمام وقت',
          hasProbation: true,
          probationDurationMonths: 3
        });

        // Subcollection: organization
        const orgRef = doc(db, `employees/${empId}/organization`, 'current');
        batch.set(orgRef, {
          id: 'current',
          companyId: company.id,
          companyName: company.name,
          departmentId: dept.id,
          departmentName: dept.name,
          branchId: branch.id,
          branchName: branch.name,
          workLocation: branch.name,
          positionId: position.id,
          positionTitle: position.title,
          jobTitle: position.title,
          jobLevel: position.level,
          directManagerName: dept.managerName,
          costCenter: dept.name,
          costCenterCode: `CC-${dept.code}`,
          shiftType: 'عادی (۸ تا ۱۷)',
          workingHoursWeekly: 44
        });

        // Subcollection: education
        const eduRef = doc(db, `employees/${empId}/education`, 'primary');
        batch.set(eduRef, {
          id: 'primary',
          degreeLevel: degrees[empIndex % degrees.length],
          major: 'مهندسی کامپیوتر / مدیریت',
          universityName: 'دانشگاه صنعتی شریف / دانشگاه تهران',
          universityType: 'دولتی',
          city: 'تهران',
          country: 'ایران',
          gpa: '17.85',
          startYear: birthYear + 18,
          endYear: birthYear + 22,
          status: 'فارغ‌التحصیل'
        });

        // Subcollection: bankAccounts
        const bankRef = doc(db, `employees/${empId}/bankAccounts`, 'primary');
        batch.set(bankRef, {
          id: 'primary',
          bankName: IRAN_BANKS[empIndex % IRAN_BANKS.length],
          branchName: 'شعبه مرکزی',
          accountNumber: `411000${empIndex}890`,
          cardNumber: `60379918${String(10000000 + empIndex * 133).slice(0, 8)}`,
          iban: `IR${String(120000000000000000000000 + empIndex * 71).slice(0, 24)}`,
          accountHolderName: `${firstName} ${lastName}`,
          isPrimary: true
        });

        // Subcollection: salaryHistory
        const salaryRef = doc(db, `employees/${empId}/salaryHistory`, 'current');
        batch.set(salaryRef, {
          id: 'current',
          effectiveDate: hireGregorian,
          effectiveDateJalali: hireJalali,
          baseSalary,
          housingAllowance: housing,
          childAllowance,
          maritalAllowance,
          foodVouchers: food,
          fixedBenefits: 0,
          variableBenefits: 0,
          overtimeEstimate: 0,
          bonusEstimate: 0,
          taxDeduction: tax,
          insuranceDeduction: insurance,
          grossSalary: gross,
          netSalary,
          changeReason: 'حکم بدو استخدام و قرارداد سالانه',
          createdAt: new Date().toISOString()
        });

        // Subcollection: timeline
        const timelineRef = doc(db, `employees/${empId}/timeline`, 'event-1');
        batch.set(timelineRef, {
          id: 'event-1',
          type: 'استخدام',
          title: 'شروع همکاری رسمی و امضای قرارداد',
          description: `شروع همکاری در دپارتمان ${dept.name} با سمت شغلی ${position.title}`,
          date: hireGregorian,
          dateJalali: hireJalali,
          actorName: 'واحد منابع انسانی',
          actorId: 'hr-admin'
        });
      }

      await batch.commit();
      createdCount += batchSize;
      onProgress?.(
        createdCount, 
        TOTAL_EMPLOYEES, 
        `ثبت دسته‌ای ${createdCount} از ${TOTAL_EMPLOYEES} پرسنل در فایراستور...`
      );
    }

    onProgress?.(TOTAL_EMPLOYEES, TOTAL_EMPLOYEES, 'عملیات ایجاد داده‌های ۳۰۰ پرسنل با موفقیت انجام شد.');
    return { success: true, count: TOTAL_EMPLOYEES };
  } catch (error) {
    console.error('Error seeding database:', error);
    return { success: false, count: 0 };
  }
}

export const seedDatabaseWithPersianEmployees = seedDatabase;

