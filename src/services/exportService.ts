import * as XLSX from 'xlsx';
import { EmployeeSummary, UserRole } from '../types';
import { toJalaliDate } from '../utils/persianDate';

export function exportEmployeesToExcel(
  employees: EmployeeSummary[],
  fileName: string = 'لیست_پرسنل_سازمان'
) {
  const exportData = employees.map((emp, idx) => ({
    'ردیف': idx + 1,
    'کد پرسنلی': emp.employeeCode,
    'نام': emp.firstName,
    'نام خانوادگی': emp.lastName,
    'کد ملی': emp.nationalId,
    'شرکت محل فعالیت': emp.companyName || 'شرکت اصلی',
    'جنسیت': emp.gender,
    'وضعیت تأهل': emp.maritalStatus || 'مجرد',
    'تعداد فرزندان': emp.childrenCount || 0,
    'تاریخ تولد همسر': emp.spouseBirthDateJalali || (emp.spouseBirthDate ? toJalaliDate(emp.spouseBirthDate) : '-'),
    'تاریخ تولد فرزندان': emp.childrenBirthDatesJalali && emp.childrenBirthDatesJalali.length > 0 ? emp.childrenBirthDatesJalali.join(' ، ') : (emp.childBirthDateJalali || '-'),
    'دپارتمان': emp.departmentName,
    'سمت سازمانی': emp.positionTitle,
    'شعبه / محل خدمت': emp.branchName,
    'وضعیت همکاری': emp.employmentStatus === 'active' ? 'فعال' : emp.employmentStatus === 'on_leave' ? 'مرخصی' : emp.employmentStatus === 'terminated' ? 'خاتمه یافته' : 'تعلیق',
    'نوع قرارداد': emp.contractType,
    'حقوق پایه (ریال)': emp.baseSalary ? emp.baseSalary.toLocaleString('fa-IR') : '۰',
    'تاریخ استخدام': emp.hireDateJalali || toJalaliDate(emp.hireDate),
    'شماره موبایل': emp.mobile,
    'ایمیل سازمانی': emp.workEmail || '-',
    'بیمه تکمیلی': emp.hasSupplementaryInsurance ? 'دارد' : 'ندارد',
    'نحوه پرداخت بیمه تکمیلی': emp.hasSupplementaryInsurance ? (emp.supplementaryInsurancePaymentMethod || 'کسر از حقوق') : '-',
    'حق بیمه تکمیلی ماهانه': emp.hasSupplementaryInsurance && emp.supplementaryInsurancePremium ? emp.supplementaryInsurancePremium.toLocaleString('fa-IR') + ' ریال' : '-',
    'شرکت بیمه تکمیلی': emp.hasSupplementaryInsurance ? (emp.supplementaryInsuranceCompany || 'بیمه ایران') : '-'
  }));

  const worksheet = XLSX.utils.json_to_sheet(exportData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'پرسنل');

  // Set RTL direction on sheet
  if (!worksheet['!views']) worksheet['!views'] = [];
  worksheet['!views'].push({ rightToLeft: true });

  XLSX.writeFile(workbook, `${fileName}_${new Date().toISOString().split('T')[0]}.xlsx`);
}

export function exportEmployeesToCSV(
  employees: EmployeeSummary[],
  fileName: string = 'employees_export'
) {
  const headers = ['ردیف,کد پرسنلی,نام,نام خانوادگی,کد ملی,دپارتمان,سمت,شعبه,وضعیت,تاریخ استخدام,موبایل'];
  const rows = employees.map((emp, idx) => 
    `"${idx + 1}","${emp.employeeCode}","${emp.firstName}","${emp.lastName}","${emp.nationalId}","${emp.departmentName}","${emp.positionTitle}","${emp.branchName}","${emp.employmentStatus}","${emp.hireDateJalali || toJalaliDate(emp.hireDate)}","${emp.mobile}"`
  );

  const csvContent = '\uFEFF' + [headers, ...rows].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${fileName}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
