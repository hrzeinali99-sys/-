import React, { useState, useEffect, useMemo } from 'react';
import { 
  FileText, Download, Printer, Filter, Search, RefreshCw,
  BarChart3, PieChart as PieIcon, Users, Calendar, DollarSign,
  Briefcase, ShieldCheck, ShieldAlert, AlertCircle, CheckCircle2, FileSpreadsheet,
  ChevronDown, ArrowUpDown, Clock, Building2, MapPin, Award,
  GraduationCap, HeartHandshake, Eye, Sparkles, Layers, SlidersHorizontal,
  Building, FileSignature, ChevronLeft, Plus, Check, ArrowRight, X,
  Coins, Landmark, CalendarDays, TrendingUp
} from 'lucide-react';
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, 
  Tooltip as RechartsTooltip, Legend, PieChart, Pie, Cell,
  CartesianGrid, AreaChart, Area
} from 'recharts';
import * as XLSX from 'xlsx';
import { useAuth } from '../../context/AuthContext';
import { getEmployees } from '../../services/employeeService';
import { getDepartments, getBranches, DEFAULT_COMPANIES } from '../../services/masterDataService';
import { EmployeeSummary, Department, Branch, ContractType, EmploymentStatus, EmploymentContract } from '../../types';
import { formatRial, formatToman, toPersianDigits, formatNumber } from '../../utils/formatters';
import { toJalaliDate, getCurrentJalaliDate, toJalaliDateTime, getJalaliMonthName, getJalaliCurrentYear } from '../../utils/persianDate';
import { 
  getContractRecommendation, 
  ContractRecommendation, 
  ContractRuleCategory,
  isSeniorExecutiveOrManager,
  calculateTenureDetails
} from '../../utils/contractRules';
import { ContractGeneratorModal } from '../contracts/ContractGeneratorModal';
import { ContractPrintView } from '../contracts/ContractPrintView';

export type ReportType = 
  | 'contract_recommendations'
  | 'periodic'
  | 'guarantee'
  | 'general' 
  | 'contracts' 
  | 'payroll' 
  | 'org' 
  | 'education' 
  | 'welfare' 
  | 'custom';

export const ReportsDashboard: React.FC = () => {
  const { profile, canAccess } = useAuth();
  const [employees, setEmployees] = useState<EmployeeSummary[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Active Report Tab
  const [activeReport, setActiveReport] = useState<ReportType>('contract_recommendations');

  // Period (Monthly / Yearly) Filter State
  const [periodMode, setPeriodMode] = useState<'all' | 'monthly' | 'yearly'>('all');
  const [selectedYear, setSelectedYear] = useState<string>(String(getJalaliCurrentYear() || 1403));
  const [selectedMonth, setSelectedMonth] = useState<string>('all');

  // Guarantee Promissory Note Filter
  const [selectedGuaranteeStatus, setSelectedGuaranteeStatus] = useState<'all' | 'received' | 'pending' | 'returned'>('all');

  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCompany, setSelectedCompany] = useState('all');
  const [selectedDept, setSelectedDept] = useState('all');
  const [selectedBranch, setSelectedBranch] = useState('all');
  const [selectedContract, setSelectedContract] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedGender, setSelectedGender] = useState('all');
  const [selectedRuleCategory, setSelectedRuleCategory] = useState<'all' | ContractRuleCategory>('all');
  const [contractExpiryFilter, setContractExpiryFilter] = useState<'all' | '30days' | '60days' | '90days' | 'expired'>('all');
  const [minSalary, setMinSalary] = useState<string>('');
  const [maxSalary, setMaxSalary] = useState<string>('');

  // Sort State
  const [sortField, setSortField] = useState<string>('employeeCode');
  const [sortAsc, setSortAsc] = useState<boolean>(true);

  // Contract Modal & Print View
  const [generatorEmpId, setGeneratorEmpId] = useState<string | null>(null);
  const [isGeneratorOpen, setIsGeneratorOpen] = useState(false);
  const [activePrintContract, setActivePrintContract] = useState<EmploymentContract | null>(null);

  // Dedicated Print Preview State for the entire report
  const [isPrintPreviewOpen, setIsPrintPreviewOpen] = useState<boolean>(false);

  // Custom Columns Selection State for 'custom' report
  const [selectedColumns, setSelectedColumns] = useState<Record<string, boolean>>({
    row: true,
    code: true,
    name: true,
    nationalId: true,
    gender: true,
    company: true,
    department: true,
    position: true,
    branch: true,
    status: true,
    contractType: true,
    suggestedContract: true,
    tenure: true,
    hireDate: true,
    endDate: true,
    baseSalary: true,
    netSalary: false,
    guaranteeAmount: true,
    guaranteeStatus: true,
    guaranteeNumber: false,
    guaranteeGuarantor: false,
    mobile: true,
    workEmail: false,
    sheba: false,
    bankName: false,
    marital: false,
    children: false,
    spouseBirthDate: false,
    childBirthDate: false,
    hasSupplementaryInsurance: false,
    supplementaryCompany: false,
    supplementaryPremium: false,
    costCenter: false
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [empList, deptList, branchList] = await Promise.all([
        getEmployees(),
        getDepartments(),
        getBranches()
      ]);
      setEmployees(empList);
      setDepartments(deptList);
      setBranches(branchList);
    } catch (err) {
      console.error('Error loading report data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filtered dataset with attached recommendation and guarantee normalization
  const filteredEmployeesWithRec = useMemo(() => {
    const now = new Date();

    return employees
      .map(emp => {
        const rec = getContractRecommendation(emp);
        
        // Extract guarantee note attributes with fallback checks
        const addInfo = (emp as any).additionalInfo || {};
        const gAmount = emp.guaranteeNoteAmount ?? addInfo.guaranteeNoteAmount ?? 1000000000;
        const gStatus = emp.guaranteeNoteStatus ?? addInfo.guaranteeNoteStatus ?? 'received';
        const gNumber = emp.guaranteeNoteNumber ?? addInfo.guaranteeNoteNumber ?? `SF-${emp.employeeCode || '00'}`;
        const gReceivedDate = emp.guaranteeNoteReceivedDateJalali ?? addInfo.guaranteeNoteReceivedDateJalali ?? emp.hireDateJalali ?? toJalaliDate(emp.hireDate);
        const gDueDate = emp.guaranteeNoteDueDateJalali ?? addInfo.guaranteeNoteDueDateJalali ?? 'پایان همکاری';
        const gGuarantor = emp.guaranteeNoteGuarantorName ?? addInfo.guaranteeNoteGuarantorName ?? 'ضامن معتبر / کارمند رسمی';
        const gDesc = emp.guaranteeNoteDescription ?? addInfo.guaranteeNoteDescription ?? 'تضمین حسن انجام کار و تعهدات شغلی';

        // Extract Jalali hire year and month for periodic analysis
        const hireJalali = emp.hireDateJalali || toJalaliDate(emp.hireDate);
        let hireYear = '';
        let hireMonth = '';
        if (hireJalali && hireJalali.includes('/')) {
          const parts = hireJalali.split('/');
          hireYear = parts[0];
          hireMonth = String(parseInt(parts[1], 10));
        }

        return {
          ...emp,
          contractRec: rec,
          guaranteeNoteAmount: gAmount,
          guaranteeNoteStatus: gStatus,
          guaranteeNoteNumber: gNumber,
          guaranteeNoteReceivedDateJalali: gReceivedDate,
          guaranteeNoteDueDateJalali: gDueDate,
          guaranteeNoteGuarantorName: gGuarantor,
          guaranteeNoteDescription: gDesc,
          hireYear,
          hireMonth
        };
      })
      .filter(emp => {
        // Search term
        if (searchQuery.trim()) {
          const q = searchQuery.trim().toLowerCase();
          const fullName = `${emp.firstName || ''} ${emp.lastName || ''}`.toLowerCase();
          const code = (emp.employeeCode || '').toLowerCase();
          const natId = (emp.nationalId || '');
          const phone = (emp.mobile || '');
          const comp = (emp.companyName || '').toLowerCase();
          const dept = (emp.departmentName || '').toLowerCase();
          const pos = (emp.positionTitle || '').toLowerCase();
          const guarantor = (emp.guaranteeNoteGuarantorName || '').toLowerCase();
          const noteNo = (emp.guaranteeNoteNumber || '').toLowerCase();
          const recLabel = emp.contractRec.periodLabel.toLowerCase();
          if (
            !fullName.includes(q) && 
            !code.includes(q) && 
            !natId.includes(q) && 
            !phone.includes(q) && 
            !pos.includes(q) && 
            !dept.includes(q) &&
            !comp.includes(q) && 
            !guarantor.includes(q) &&
            !noteNo.includes(q) &&
            !recLabel.includes(q)
          ) {
            return false;
          }
        }

        // Periodic (Monthly / Yearly) Filter
        if (periodMode === 'yearly') {
          if (selectedYear !== 'all' && emp.hireYear && emp.hireYear !== selectedYear) {
            return false;
          }
        } else if (periodMode === 'monthly') {
          if (selectedYear !== 'all' && emp.hireYear && emp.hireYear !== selectedYear) {
            return false;
          }
          if (selectedMonth !== 'all' && emp.hireMonth && emp.hireMonth !== selectedMonth) {
            return false;
          }
        }

        // Guarantee Promissory Note Status Filter
        if (selectedGuaranteeStatus !== 'all') {
          if (emp.guaranteeNoteStatus !== selectedGuaranteeStatus) return false;
        }

        // Company filter
        if (selectedCompany !== 'all' && emp.companyId !== selectedCompany && emp.companyName !== selectedCompany) return false;

        // Department filter
        if (selectedDept !== 'all' && emp.departmentId !== selectedDept) return false;

        // Branch filter
        if (selectedBranch !== 'all' && emp.branchId !== selectedBranch) return false;

        // Contract Type
        if (selectedContract !== 'all' && emp.contractType !== selectedContract) return false;

        // Employment Status
        if (selectedStatus !== 'all' && emp.employmentStatus !== selectedStatus) return false;

        // Gender
        if (selectedGender !== 'all' && emp.gender !== selectedGender) return false;

        // Contract Rule Category Filter (1 month / 3 months / 6 months & 1 year)
        if (selectedRuleCategory !== 'all' && emp.contractRec.ruleCategory !== selectedRuleCategory) {
          return false;
        }

        // Contract Expiry Filter
        if (contractExpiryFilter !== 'all') {
          if (!emp.contractEndDate) return false;
          const endDate = new Date(emp.contractEndDate);
          const diffDays = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

          if (contractExpiryFilter === 'expired') {
            if (diffDays > 0) return false;
          } else if (contractExpiryFilter === '30days') {
            if (diffDays <= 0 || diffDays > 30) return false;
          } else if (contractExpiryFilter === '60days') {
            if (diffDays <= 0 || diffDays > 60) return false;
          } else if (contractExpiryFilter === '90days') {
            if (diffDays <= 0 || diffDays > 90) return false;
          }
        }

        // Salary Range in Rials
        if (minSalary && emp.baseSalary && emp.baseSalary < Number(minSalary)) return false;
        if (maxSalary && emp.baseSalary && emp.baseSalary > Number(maxSalary)) return false;

        return true;
      })
      .sort((a: any, b: any) => {
        let valA: any = a[sortField] || '';
        let valB: any = b[sortField] || '';

        if (sortField === 'tenureMonths') {
          valA = a.contractRec?.tenure?.tenureMonths ?? 0;
          valB = b.contractRec?.tenure?.tenureMonths ?? 0;
        } else if (sortField === 'recommendedPeriod') {
          valA = a.contractRec?.periodLabel ?? '';
          valB = b.contractRec?.periodLabel ?? '';
        } else if (sortField === 'guaranteeNoteAmount') {
          valA = a.guaranteeNoteAmount ?? 0;
          valB = b.guaranteeNoteAmount ?? 0;
        } else if (sortField === 'fullName') {
          valA = `${a.firstName || ''} ${a.lastName || ''}`;
          valB = `${b.firstName || ''} ${b.lastName || ''}`;
        }

        if (typeof valA === 'string') valA = valA.toLowerCase();
        if (typeof valB === 'string') valB = valB.toLowerCase();
        if (valA < valB) return sortAsc ? -1 : 1;
        if (valA > valB) return sortAsc ? 1 : -1;
        return 0;
      });
  }, [
    employees, searchQuery, periodMode, selectedYear, selectedMonth, selectedGuaranteeStatus,
    selectedCompany, selectedDept, selectedBranch, selectedContract, selectedStatus, 
    selectedGender, selectedRuleCategory, contractExpiryFilter, minSalary, maxSalary, sortField, sortAsc
  ]);

  const filteredEmployees = filteredEmployeesWithRec;

  // Aggregate Metrics & Charts Data
  const metrics = useMemo(() => {
    const totalCount = filteredEmployees.length;
    const activeCount = filteredEmployees.filter(e => e.employmentStatus === 'active').length;
    const onLeaveCount = filteredEmployees.filter(e => e.employmentStatus === 'on_leave').length;
    
    // Contract Rule Distribution Metrics
    const under1YearCount = filteredEmployees.filter(e => e.contractRec.ruleCategory === 'under_1_year').length;
    const over1YearCount = filteredEmployees.filter(e => e.contractRec.ruleCategory === 'over_1_year').length;
    const seniorManagerCount = filteredEmployees.filter(e => e.contractRec.ruleCategory === 'senior_manager').length;

    // Contracts expiring in next 30 days
    const now = new Date();
    const expiringIn30Days = filteredEmployees.filter(e => {
      if (!e.contractEndDate) return false;
      const end = new Date(e.contractEndDate);
      const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return diff > 0 && diff <= 30;
    }).length;

    // Total and Average Base Salary
    const validSalaries = filteredEmployees.map(e => e.baseSalary || 0).filter(s => s > 0);
    const totalPayroll = validSalaries.reduce((acc, curr) => acc + curr, 0);
    const avgSalary = validSalaries.length > 0 ? Math.round(totalPayroll / validSalaries.length) : 0;

    // Guarantee Promissory Note Metrics (سفته‌های ضمانت حسن انجام کار)
    const validGuarantees = filteredEmployees.map(e => e.guaranteeNoteAmount || 0);
    const totalGuaranteeAmount = validGuarantees.reduce((acc, curr) => acc + curr, 0);
    const totalGuaranteeToman = Math.round(totalGuaranteeAmount / 10);
    const receivedGuaranteeCount = filteredEmployees.filter(e => e.guaranteeNoteStatus === 'received' || !e.guaranteeNoteStatus).length;
    const pendingGuaranteeCount = filteredEmployees.filter(e => e.guaranteeNoteStatus === 'pending').length;
    const returnedGuaranteeCount = filteredEmployees.filter(e => e.guaranteeNoteStatus === 'returned').length;

    // Guarantee Custody Distribution Data for Pie Chart
    const guaranteeCustodyChartData = [
      { name: 'موجود در صندوق امانات', value: receivedGuaranteeCount, color: '#059669' },
      { name: 'در انتظار تحویل / نقص مدرک', value: pendingGuaranteeCount, color: '#d97706' },
      { name: 'عودت داده شده به پرسنل', value: returnedGuaranteeCount, color: '#64748b' }
    ].filter(item => item.value > 0);

    // Department Distribution
    const deptMap: Record<string, number> = {};
    const deptGuaranteeMap: Record<string, number> = {};
    filteredEmployees.forEach(e => {
      const dName = e.departmentName || 'نامشخص';
      deptMap[dName] = (deptMap[dName] || 0) + 1;
      deptGuaranteeMap[dName] = (deptGuaranteeMap[dName] || 0) + (e.guaranteeNoteAmount || 0);
    });
    const deptChartData = Object.keys(deptMap).map(k => ({ 
      name: k, 
      count: deptMap[k],
      guaranteeMillionToman: Math.round((deptGuaranteeMap[k] || 0) / 10000000)
    }));

    // Contract Type Distribution
    const contractMap: Record<string, number> = {};
    filteredEmployees.forEach(e => {
      const cType = e.contractType || 'نامشخص';
      contractMap[cType] = (contractMap[cType] || 0) + 1;
    });
    const contractChartData = Object.keys(contractMap).map(k => ({ name: k, value: contractMap[k] }));

    // Contract Rule Recommendations Pie Chart Data
    const recChartData = [
      { name: '۱ ماهه (سابقه < ۱ سال)', value: under1YearCount, color: '#0284c7' },
      { name: '۳ ماهه (سابقه > ۱ سال)', value: over1YearCount, color: '#d97706' },
      { name: '۶ ماهه و ۱ ساله (مدیران و معاونین)', value: seniorManagerCount, color: '#7c3aed' }
    ].filter(item => item.value > 0);

    // Gender Distribution
    const genderMap: Record<string, number> = { 'مرد': 0, 'زن': 0 };
    filteredEmployees.forEach(e => {
      if (e.gender === 'زن') genderMap['زن']++;
      else genderMap['مرد']++;
    });
    const genderChartData = [
      { name: 'آقایان', value: genderMap['مرد'] },
      { name: 'خانم‌ها', value: genderMap['زن'] }
    ];

    // Monthly 12-Month Distribution Data (روند استخدام‌ها و بودجه حقوق در ۱۲ ماه سال)
    const monthNames = [
      'فروردین', 'اردیبهشت', 'خرداد',
      'تیر', 'مرداد', 'شهریور',
      'مهر', 'آبان', 'آذر',
      'دی', 'بهمن', 'اسفند'
    ];
    
    const monthlyStats = monthNames.map((mName, mIdx) => {
      const monthNumStr = String(mIdx + 1);
      const empsInMonth = employees.filter(e => {
        const hJalali = e.hireDateJalali || toJalaliDate(e.hireDate);
        if (!hJalali || !hJalali.includes('/')) return false;
        const parts = hJalali.split('/');
        const m = String(parseInt(parts[1], 10));
        const y = parts[0];
        if (selectedYear !== 'all' && y !== selectedYear) return false;
        return m === monthNumStr;
      });

      const monthPayroll = empsInMonth.reduce((acc, cur) => acc + (cur.baseSalary || 0), 0);
      const monthGuarantees = empsInMonth.reduce((acc, cur) => acc + (cur.guaranteeNoteAmount || 1000000000), 0);

      return {
        month: mName,
        monthIndex: mIdx + 1,
        hires: empsInMonth.length,
        payrollMillion: Math.round(monthPayroll / 10000000), // in Million Tomans
        guaranteeBillion: Math.round(monthGuarantees / 10000000000) // in Billion Rials
      };
    });

    return {
      totalCount,
      activeCount,
      onLeaveCount,
      under1YearCount,
      over1YearCount,
      seniorManagerCount,
      expiringIn30Days,
      totalPayroll,
      avgSalary,
      totalGuaranteeAmount,
      totalGuaranteeToman,
      receivedGuaranteeCount,
      pendingGuaranteeCount,
      returnedGuaranteeCount,
      guaranteeCustodyChartData,
      deptChartData,
      contractChartData,
      recChartData,
      genderChartData,
      monthlyStats,
      menCount: genderMap['مرد'],
      womenCount: genderMap['زن']
    };
  }, [filteredEmployees, employees, selectedYear]);

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setPeriodMode('all');
    setSelectedYear(String(getJalaliCurrentYear() || 1403));
    setSelectedMonth('all');
    setSelectedGuaranteeStatus('all');
    setSelectedCompany('all');
    setSelectedDept('all');
    setSelectedBranch('all');
    setSelectedContract('all');
    setSelectedStatus('all');
    setSelectedGender('all');
    setSelectedRuleCategory('all');
    setContractExpiryFilter('all');
    setMinSalary('');
    setMaxSalary('');
  };

  // Open Contract Generator directly from table
  const handleOpenGeneratorForEmp = (empId: string) => {
    setGeneratorEmpId(empId);
    setIsGeneratorOpen(true);
  };

  // =========================================================================
  // Unified Columns & Data Generator for Table, Excel, CSV, and Print
  // =========================================================================
  const reportSchema = useMemo(() => {
    const reportTitleMap: Record<ReportType, string> = {
      contract_recommendations: 'گزارش تنظیم هوشمند قراردادها (بر اساس سابقه و رده)',
      periodic: `گزارش تحلیلی دوره‌ای (${periodMode === 'monthly' ? `ماهانه - ${selectedMonth !== 'all' ? getJalaliMonthName(Number(selectedMonth)) : 'همه ماه‌ها'} سال ${toPersianDigits(selectedYear)}` : periodMode === 'yearly' ? `سالانه - سال ${toPersianDigits(selectedYear)}` : 'جامع کلیه دوره‌ها'})`,
      guarantee: 'گزارش جامع سفته‌های ضمانت حسن انجام کار و تضامین پرسنلی',
      general: 'گزارش جامع اطلاعات پرسنلی',
      contracts: 'گزارش قراردادها و وضعیت انقضا',
      payroll: 'گزارش احکام مالی و حقوق‌دستمزد',
      org: 'گزارش ساختار سازمانی و توزیع شعب',
      education: 'گزارش سوابق تحصیلی و آموزشی پرسنل',
      welfare: 'گزارش بیمه، رفاهی و اطلاعات خانواده',
      custom: 'گزارش سفارشی پرسنل'
    };

    let columns: { key: string; label: string; width?: number; align?: 'right' | 'center' | 'left' }[] = [];

    switch (activeReport) {
      case 'contract_recommendations':
        columns = [
          { key: 'row', label: 'ردیف', align: 'center', width: 6 },
          { key: 'code', label: 'کد پرسنلی', align: 'center', width: 12 },
          { key: 'name', label: 'نام و نام خانوادگی', width: 22 },
          { key: 'nationalId', label: 'کد ملی', align: 'center', width: 14 },
          { key: 'companyDept', label: 'شرکت و دپارتمان', width: 22 },
          { key: 'position', label: 'سمت سازمانی', width: 20 },
          { key: 'hireDate', label: 'تاریخ شروع خدمت', align: 'center', width: 14 },
          { key: 'tenure', label: 'طول سابقه کارکرد', width: 18 },
          { key: 'suggestedContract', label: 'قرارداد پیشنهادی هوشمند', width: 22 },
          { key: 'reason', label: 'مبنا و دلیل پیشنهاد', width: 28 },
          { key: 'status', label: 'وضعیت همکاری', align: 'center', width: 14 },
          { key: 'mobile', label: 'شماره همراه', align: 'center', width: 14 }
        ];
        break;

      case 'periodic':
        columns = [
          { key: 'row', label: 'ردیف', align: 'center', width: 6 },
          { key: 'code', label: 'کد پرسنلی', align: 'center', width: 12 },
          { key: 'name', label: 'نام و نام خانوادگی', width: 22 },
          { key: 'nationalId', label: 'کد ملی', align: 'center', width: 14 },
          { key: 'companyDept', label: 'شرکت و دپارتمان', width: 22 },
          { key: 'position', label: 'سمت سازمانی', width: 20 },
          { key: 'hireDate', label: 'تاریخ استخدام', align: 'center', width: 14 },
          { key: 'tenure', label: 'طول سابقه خدمت', width: 18 },
          { key: 'baseSalary', label: 'حقوق ماهانه (ریال)', align: 'left', width: 18 },
          { key: 'annualEstimatedSalary', label: 'برآورد هزینه سالانه (ریال)', align: 'left', width: 22 },
          { key: 'guaranteeAmountToman', label: 'مبلغ سفته ضمانت (تومان)', align: 'left', width: 20 },
          { key: 'guaranteeStatus', label: 'وضعیت سفته در صندوق', align: 'center', width: 18 },
          { key: 'status', label: 'وضعیت همکاری', align: 'center', width: 14 }
        ];
        break;

      case 'guarantee':
        columns = [
          { key: 'row', label: 'ردیف', align: 'center', width: 6 },
          { key: 'code', label: 'کد پرسنلی', align: 'center', width: 12 },
          { key: 'name', label: 'نام و نام خانوادگی پرسنل', width: 22 },
          { key: 'nationalId', label: 'کد ملی', align: 'center', width: 14 },
          { key: 'companyDept', label: 'دپارتمان و شرکت', width: 22 },
          { key: 'position', label: 'سمت سازمانی', width: 20 },
          { key: 'guaranteeAmountRial', label: 'مبلغ سفته (ریال)', align: 'left', width: 20 },
          { key: 'guaranteeAmountToman', label: 'معادل به تومان', align: 'left', width: 18 },
          { key: 'guaranteeStatus', label: 'وضعیت لاشه سفته', align: 'center', width: 18 },
          { key: 'guaranteeNumber', label: 'شماره سریال لاشه سفته', align: 'center', width: 18 },
          { key: 'guaranteeGuarantor', label: 'نام ضامن سفته', width: 22 },
          { key: 'guaranteeReceivedDate', label: 'تاریخ تحویل به صندوق', align: 'center', width: 16 },
          { key: 'guaranteeDueDate', label: 'تاریخ اعتبار / سررسید', align: 'center', width: 16 },
          { key: 'guaranteeDesc', label: 'محل نگهداری و توضیحات', width: 26 }
        ];
        break;

      case 'general':
        columns = [
          { key: 'row', label: 'ردیف', align: 'center', width: 6 },
          { key: 'code', label: 'کد پرسنلی', align: 'center', width: 12 },
          { key: 'name', label: 'نام و نام خانوادگی', width: 22 },
          { key: 'nationalId', label: 'کد ملی', align: 'center', width: 14 },
          { key: 'gender', label: 'جنسیت', align: 'center', width: 10 },
          { key: 'company', label: 'شرکت محل فعالیت', width: 18 },
          { key: 'department', label: 'دپارتمان', width: 18 },
          { key: 'position', label: 'سمت سازمانی', width: 18 },
          { key: 'branch', label: 'شعبه', width: 16 },
          { key: 'status', label: 'وضعیت', align: 'center', width: 12 },
          { key: 'contractType', label: 'نوع قرارداد', width: 14 },
          { key: 'hireDate', label: 'تاریخ استخدام', align: 'center', width: 14 },
          { key: 'guaranteeAmountToman', label: 'سفته ضمانت (تومان)', align: 'left', width: 18 },
          { key: 'mobile', label: 'تلفن همراه', align: 'center', width: 14 },
          { key: 'workEmail', label: 'ایمیل سازمانی', width: 20 }
        ];
        break;

      case 'contracts':
        columns = [
          { key: 'row', label: 'ردیف', align: 'center', width: 6 },
          { key: 'code', label: 'کد پرسنلی', align: 'center', width: 12 },
          { key: 'name', label: 'نام و نام خانوادگی', width: 22 },
          { key: 'companyDept', label: 'شرکت و دپارتمان', width: 20 },
          { key: 'position', label: 'سمت', width: 18 },
          { key: 'contractType', label: 'نوع قرارداد فعلی', width: 16 },
          { key: 'suggestedContract', label: 'پیشنهاد تمدید هوشمند', width: 20 },
          { key: 'tenure', label: 'مدت سابقه', width: 16 },
          { key: 'startDate', label: 'تاریخ شروع', align: 'center', width: 14 },
          { key: 'endDate', label: 'تاریخ پایان', align: 'center', width: 14 },
          { key: 'expiryStatus', label: 'وضعیت انقضا', align: 'center', width: 16 },
          { key: 'status', label: 'وضعیت همکاری', align: 'center', width: 12 }
        ];
        break;

      case 'payroll':
        columns = [
          { key: 'row', label: 'ردیف', align: 'center', width: 6 },
          { key: 'code', label: 'کد پرسنلی', align: 'center', width: 12 },
          { key: 'name', label: 'نام و نام خانوادگی', width: 22 },
          { key: 'nationalId', label: 'کد ملی', align: 'center', width: 14 },
          { key: 'companyDept', label: 'دپارتمان و سمت', width: 22 },
          { key: 'contractType', label: 'نوع قرارداد', width: 14 },
          { key: 'baseSalary', label: 'حقوق پایه (ریال)', align: 'left', width: 18 },
          { key: 'netSalary', label: 'خالص دریافتی (ریال)', align: 'left', width: 18 },
          { key: 'guaranteeAmountToman', label: 'وثیقه سفته (تومان)', align: 'left', width: 18 },
          { key: 'sheba', label: 'شماره شبا (IBAN)', width: 24 },
          { key: 'bankName', label: 'بانک عامل', width: 14 },
          { key: 'marital', label: 'وضعیت تأهل', align: 'center', width: 12 },
          { key: 'children', label: 'تعداد اولاد', align: 'center', width: 10 }
        ];
        break;

      case 'org':
        columns = [
          { key: 'row', label: 'ردیف', align: 'center', width: 6 },
          { key: 'code', label: 'کد پرسنلی', align: 'center', width: 12 },
          { key: 'name', label: 'نام و نام خانوادگی', width: 22 },
          { key: 'company', label: 'شرکت محل فعالیت', width: 18 },
          { key: 'branch', label: 'شعبه / محل خدمت', width: 16 },
          { key: 'department', label: 'دپارتمان', width: 18 },
          { key: 'team', label: 'تیم / واحد', width: 16 },
          { key: 'position', label: 'سمت سازمانی', width: 18 },
          { key: 'manager', label: 'مدیر مافوق مستقیم', width: 18 },
          { key: 'costCenter', label: 'مرکز هزینه', align: 'center', width: 14 },
          { key: 'status', label: 'وضعیت همکاری', align: 'center', width: 12 }
        ];
        break;

      case 'education':
        columns = [
          { key: 'row', label: 'ردیف', align: 'center', width: 6 },
          { key: 'code', label: 'کد پرسنلی', align: 'center', width: 12 },
          { key: 'name', label: 'نام و نام خانوادگی', width: 22 },
          { key: 'nationalId', label: 'کد ملی', align: 'center', width: 14 },
          { key: 'companyDept', label: 'دپارتمان و سمت', width: 22 },
          { key: 'degree', label: 'آخرین مدرک تحصیلی', width: 16 },
          { key: 'major', label: 'رشته تحصیلی', width: 20 },
          { key: 'university', label: 'دانشگاه / موسسه', width: 20 },
          { key: 'eduStatus', label: 'وضعیت تحصیلی', align: 'center', width: 14 },
          { key: 'jobLevel', label: 'رده شغلی', align: 'center', width: 14 }
        ];
        break;

      case 'welfare':
        columns = [
          { key: 'row', label: 'ردیف', align: 'center', width: 6 },
          { key: 'code', label: 'کد پرسنلی', align: 'center', width: 12 },
          { key: 'name', label: 'نام و نام خانوادگی', width: 22 },
          { key: 'nationalId', label: 'کد ملی', align: 'center', width: 14 },
          { key: 'companyDept', label: 'دپارتمان', width: 18 },
          { key: 'marital', label: 'وضعیت تأهل', align: 'center', width: 12 },
          { key: 'children', label: 'تعداد اولاد', align: 'center', width: 10 },
          { key: 'hasSupplementary', label: 'بیمه تکمیلی', align: 'center', width: 14 },
          { key: 'supplementaryMethod', label: 'نحوه پرداخت حق بیمه', width: 18 },
          { key: 'supplementaryCompany', label: 'شرکت بیمه‌گر تکمیلی', width: 18 },
          { key: 'supplementaryPremium', label: 'مبلغ حق بیمه (ریال)', align: 'left', width: 18 },
          { key: 'spouseBirthDate', label: 'تاریخ تولد همسر', align: 'center', width: 14 },
          { key: 'childBirthDate', label: 'تاریخ تولد فرزندان', width: 20 }
        ];
        break;

      case 'custom':
        columns = [{ key: 'row', label: 'ردیف', align: 'center', width: 6 }];
        if (selectedColumns.code) columns.push({ key: 'code', label: 'کد پرسنلی', align: 'center', width: 12 });
        if (selectedColumns.name) columns.push({ key: 'name', label: 'نام و نام خانوادگی', width: 22 });
        if (selectedColumns.nationalId) columns.push({ key: 'nationalId', label: 'کد ملی', align: 'center', width: 14 });
        if (selectedColumns.gender) columns.push({ key: 'gender', label: 'جنسیت', align: 'center', width: 10 });
        if (selectedColumns.company) columns.push({ key: 'company', label: 'شرکت محل فعالیت', width: 18 });
        if (selectedColumns.department) columns.push({ key: 'department', label: 'دپارتمان', width: 18 });
        if (selectedColumns.position) columns.push({ key: 'position', label: 'سمت سازمانی', width: 18 });
        if (selectedColumns.suggestedContract) columns.push({ key: 'suggestedContract', label: 'قرارداد پیشنهادی', width: 20 });
        if (selectedColumns.tenure) columns.push({ key: 'tenure', label: 'طول سابقه', width: 16 });
        if (selectedColumns.branch) columns.push({ key: 'branch', label: 'شعبه', width: 16 });
        if (selectedColumns.status) columns.push({ key: 'status', label: 'وضعیت', align: 'center', width: 12 });
        if (selectedColumns.contractType) columns.push({ key: 'contractType', label: 'نوع قرارداد', width: 14 });
        if (selectedColumns.hireDate) columns.push({ key: 'hireDate', label: 'تاریخ استخدام', align: 'center', width: 14 });
        if (selectedColumns.endDate) columns.push({ key: 'endDate', label: 'پایان قرارداد', align: 'center', width: 14 });
        if (selectedColumns.baseSalary) columns.push({ key: 'baseSalary', label: 'حقوق پایه (ریال)', align: 'left', width: 18 });
        if (selectedColumns.netSalary) columns.push({ key: 'netSalary', label: 'خالص دریافتی (ریال)', align: 'left', width: 18 });
        if (selectedColumns.guaranteeAmount) columns.push({ key: 'guaranteeAmountToman', label: 'سفته ضمانت (تومان)', align: 'left', width: 18 });
        if (selectedColumns.guaranteeStatus) columns.push({ key: 'guaranteeStatus', label: 'وضعیت سفته در صندوق', align: 'center', width: 16 });
        if (selectedColumns.guaranteeNumber) columns.push({ key: 'guaranteeNumber', label: 'شماره لاشه سفته', align: 'center', width: 16 });
        if (selectedColumns.guaranteeGuarantor) columns.push({ key: 'guaranteeGuarantor', label: 'نام ضامن سفته', width: 20 });
        if (selectedColumns.sheba) columns.push({ key: 'sheba', label: 'شماره شبا', width: 24 });
        if (selectedColumns.bankName) columns.push({ key: 'bankName', label: 'نام بانک', width: 14 });
        if (selectedColumns.mobile) columns.push({ key: 'mobile', label: 'شماره همراه', align: 'center', width: 14 });
        if (selectedColumns.workEmail) columns.push({ key: 'workEmail', label: 'ایمیل سازمانی', width: 20 });
        if (selectedColumns.marital) columns.push({ key: 'marital', label: 'وضعیت تأهل', align: 'center', width: 12 });
        if (selectedColumns.children) columns.push({ key: 'children', label: 'تعداد فرزندان', align: 'center', width: 10 });
        if (selectedColumns.spouseBirthDate) columns.push({ key: 'spouseBirthDate', label: 'تولد همسر', align: 'center', width: 14 });
        if (selectedColumns.childBirthDate) columns.push({ key: 'childBirthDate', label: 'تولد فرزندان', width: 18 });
        if (selectedColumns.hasSupplementaryInsurance) columns.push({ key: 'hasSupplementary', label: 'بیمه تکمیلی', align: 'center', width: 12 });
        if (selectedColumns.supplementaryCompany) columns.push({ key: 'supplementaryCompany', label: 'شرکت بیمه تکمیلی', width: 18 });
        if (selectedColumns.supplementaryPremium) columns.push({ key: 'supplementaryPremium', label: 'مبلغ بیمه تکمیلی', align: 'left', width: 18 });
        if (selectedColumns.costCenter) columns.push({ key: 'costCenter', label: 'مرکز هزینه', align: 'center', width: 14 });
        break;
    }

    // Build raw data rows mapping
    const rows = filteredEmployees.map((emp, index) => {
      const rec = emp.contractRec;
      const now = new Date();
      let daysRemaining: number | null = null;
      let expiryStatusText = 'نامحدود / بدون تاریخ';

      if (emp.contractEndDate) {
        const end = new Date(emp.contractEndDate);
        daysRemaining = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        if (daysRemaining <= 0) {
          expiryStatusText = 'منقضی شده';
        } else if (daysRemaining <= 30) {
          expiryStatusText = `${toPersianDigits(daysRemaining)} روز (فوری)`;
        } else {
          expiryStatusText = `${toPersianDigits(daysRemaining)} روز`;
        }
      }

      const statusMap: Record<string, string> = {
        active: 'فعال و شاغل',
        on_leave: 'مرخصی',
        mission: 'مأموریت',
        terminated: 'قطع همکاری',
        suspended: 'معلق',
        draft: 'پیش‌نویس',
        retired: 'بازنشسته'
      };

      const guaranteeStatusMap: Record<string, string> = {
        received: 'تحویل در صندوق امانات',
        pending: 'در انتظار تحویل / ناقص',
        returned: 'عودت داده شده به پرسنل'
      };

      const childrenDatesStr = (emp.childrenBirthDatesJalali && emp.childrenBirthDatesJalali.length > 0)
        ? emp.childrenBirthDatesJalali.join(' ، ')
        : (emp.childBirthDateJalali || (emp.childBirthDate ? toJalaliDate(emp.childBirthDate) : '-'));

      const gAmountRials = emp.guaranteeNoteAmount || 1000000000;
      const gAmountTomans = Math.round(gAmountRials / 10);
      const annualEst = (emp.baseSalary || 0) * 12;

      const rowData: Record<string, any> = {
        raw: emp,
        row: index + 1,
        code: emp.employeeCode || '-',
        name: `${emp.firstName || ''} ${emp.lastName || ''}`,
        nationalId: emp.nationalId || '-',
        gender: emp.gender || '-',
        company: emp.companyName || 'شرکت اصلی',
        department: emp.departmentName || '-',
        companyDept: `${emp.companyName || ''} - ${emp.departmentName || ''}`,
        branch: emp.branchName || '-',
        position: emp.positionTitle || '-',
        team: emp.teamName || '-',
        manager: emp.managerName || '-',
        costCenter: emp.costCenterCode || '-',
        status: statusMap[emp.employmentStatus] || emp.employmentStatus || '-',
        contractType: emp.contractType || '-',
        suggestedContract: rec.periodLabel,
        tenure: rec.tenure.tenureText,
        reason: rec.reason,
        hireDate: rec.tenure.hireDateJalali || emp.hireDateJalali || toJalaliDate(emp.hireDate) || '-',
        startDate: emp.contractStartDateJalali || toJalaliDate(emp.contractStartDate) || rec.tenure.hireDateJalali || '-',
        endDate: emp.contractEndDateJalali || toJalaliDate(emp.contractEndDate) || 'نامحدود',
        daysRemaining,
        expiryStatus: expiryStatusText,
        baseSalary: emp.baseSalary ? formatNumber(emp.baseSalary) : '۰',
        baseSalaryRaw: emp.baseSalary || 0,
        annualEstimatedSalary: annualEst ? formatNumber(annualEst) : '۰',
        netSalary: emp.netSalary ? formatNumber(emp.netSalary) : (emp.baseSalary ? formatNumber(emp.baseSalary) : '۰'),
        guaranteeAmountRial: formatNumber(gAmountRials),
        guaranteeAmountToman: formatNumber(gAmountTomans),
        guaranteeAmountRaw: gAmountRials,
        guaranteeStatus: guaranteeStatusMap[emp.guaranteeNoteStatus] || 'تحویل در صندوق امانات',
        guaranteeStatusRaw: emp.guaranteeNoteStatus || 'received',
        guaranteeNumber: emp.guaranteeNoteNumber || '-',
        guaranteeGuarantor: emp.guaranteeNoteGuarantorName || '-',
        guaranteeReceivedDate: emp.guaranteeNoteReceivedDateJalali || '-',
        guaranteeDueDate: emp.guaranteeNoteDueDateJalali || 'پایان خدمت',
        guaranteeDesc: emp.guaranteeNoteDescription || 'تضمین حسن انجام کار',
        sheba: (emp as any).bankAccount?.iban || emp.costCenterCode || '-',
        bankName: (emp as any).bankAccount?.bankName || '-',
        mobile: emp.mobile || '-',
        workEmail: emp.workEmail || '-',
        marital: emp.maritalStatus || 'نامشخص',
        children: emp.childrenCount ?? 0,
        degree: (emp as any).education?.degreeLevel || 'کارشناسی',
        major: (emp as any).education?.major || 'مدیریت / مهندسی',
        university: (emp as any).education?.universityName || 'دانشگاه سراسری',
        eduStatus: (emp as any).education?.status || 'فارغ‌التحصیل',
        jobLevel: emp.jobLevel || (rec.isSeniorManager ? 'مدیر ارشد' : 'کارشناس'),
        hasSupplementary: emp.hasSupplementaryInsurance ? 'دارد (فعال)' : 'ندارد',
        supplementaryMethod: emp.supplementaryInsurancePaymentMethod || (emp.hasSupplementaryInsurance ? 'کسر از حقوق' : '-'),
        supplementaryCompany: emp.supplementaryInsuranceCompany || (emp.hasSupplementaryInsurance ? 'بیمه دانا' : '-'),
        supplementaryPremium: emp.supplementaryInsurancePremium ? formatNumber(emp.supplementaryInsurancePremium) : (emp.hasSupplementaryInsurance ? '۲,۵۰۰,۰۰۰' : '۰'),
        spouseBirthDate: emp.spouseBirthDateJalali || (emp.spouseBirthDate ? toJalaliDate(emp.spouseBirthDate) : '-'),
        childBirthDate: childrenDatesStr
      };

      return rowData;
    });

    return {
      title: reportTitleMap[activeReport],
      columns,
      rows
    };
  }, [activeReport, filteredEmployees, selectedColumns, periodMode, selectedYear, selectedMonth]);

  // =========================================================================
  // Export to Excel (100% RTL & Exact Column Match)
  // =========================================================================
  const handleExportExcel = () => {
    const { title, columns, rows } = reportSchema;

    // Map rows strictly to columns
    const exportData = rows.map(r => {
      const rowObj: Record<string, any> = {};
      columns.forEach(col => {
        rowObj[col.label] = r[col.key];
      });
      return rowObj;
    });

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'گزارش پرسنلی');

    // Enable RTL on Excel Sheet View
    if (!worksheet['!views']) worksheet['!views'] = [];
    worksheet['!views'].push({ rightToLeft: true });

    // Set appropriate column widths
    worksheet['!cols'] = columns.map(col => ({
      wch: Math.max((col.width || 15), col.label.length * 2, 12)
    }));

    const filePrefix = title.replace(/\s+/g, '_').replace(/[()]/g, '');
    const fileName = `${filePrefix}_${getCurrentJalaliDate().replace(/\//g, '-')}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

  // =========================================================================
  // Export to CSV (UTF-8 BOM for RTL Persian)
  // =========================================================================
  const handleExportCSV = () => {
    const { title, columns, rows } = reportSchema;

    const headerLine = columns.map(c => `"${c.label.replace(/"/g, '""')}"`).join(',');
    const dataLines = rows.map(r => {
      return columns.map(c => {
        const val = r[c.key] !== undefined && r[c.key] !== null ? String(r[c.key]) : '';
        return `"${val.replace(/"/g, '""')}"`;
      }).join(',');
    });

    // UTF-8 BOM \uFEFF ensures Persian RTL text renders with correct characters in all software
    const csvContent = '\uFEFF' + [headerLine, ...dataLines].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    const filePrefix = title.replace(/\s+/g, '_').replace(/[()]/g, '');
    link.setAttribute('download', `${filePrefix}_${getCurrentJalaliDate().replace(/\//g, '-')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Trigger Dedicated Print View
  const handlePrint = () => {
    setIsPrintPreviewOpen(true);
  };

  // If in Single Contract Print Mode
  if (activePrintContract) {
    return (
      <ContractPrintView
        contract={activePrintContract}
        onBack={() => setActivePrintContract(null)}
        onStatusUpdated={() => {
          fetchData();
        }}
      />
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn pb-12 text-right" dir="rtl">
      
      {/* ========================================================================= */}
      {/* 1. Header Banner & Action Bar */}
      {/* ========================================================================= */}
      <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        {/* Background decorative patterns */}
        <div className="absolute top-0 left-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-10 w-60 h-60 bg-teal-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5" />
              مرکز جامع گزارش‌گیری و هوش سازمانی منابع انسانی
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight">
              سامانه جامع گزارش‌گیری، آمار و خروجی‌های استاندارد پرسنلی
            </h1>
            <p className="text-xs sm:text-sm text-emerald-200/80 max-w-3xl leading-relaxed">
              تحلیل و تنظیم خودکار قراردادها (۱ ماهه، ۳ ماهه، ۶ ماهه و سالانه) بر اساس سابقه خدمت و رده سازمانی، گزارش‌های جامع مالی، بیمه و احکام کارگزینی با تطابق ۱۰۰٪ خروجی‌های اکسل، CSV و چاپ راست‌به‌چپ (RTL).
            </p>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. Report Categories Tabs */}
      {/* ========================================================================= */}
      <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-1.5 overflow-x-auto text-xs font-bold text-slate-600">
        
        <button
          type="button"
          onClick={() => setActiveReport('contract_recommendations')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl whitespace-nowrap transition-all cursor-pointer ${
            activeReport === 'contract_recommendations'
              ? 'bg-emerald-700 text-white shadow-sm'
              : 'hover:bg-slate-100 text-slate-700'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>تنظیم هوشمند قراردادها (بر اساس سابقه و رده)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveReport('periodic')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl whitespace-nowrap transition-all cursor-pointer ${
            activeReport === 'periodic'
              ? 'bg-emerald-700 text-white shadow-sm'
              : 'hover:bg-slate-100 text-slate-700'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>گزارش ماهانه و سالانه (دوره‌ای)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveReport('guarantee')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl whitespace-nowrap transition-all cursor-pointer ${
            activeReport === 'guarantee'
              ? 'bg-emerald-700 text-white shadow-sm'
              : 'hover:bg-slate-100 text-slate-700'
          }`}
        >
          <ShieldAlert className="w-4 h-4" />
          <span>سفته‌های ضمانت و تضامین پرسنلی</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveReport('general')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl whitespace-nowrap transition-all cursor-pointer ${
            activeReport === 'general'
              ? 'bg-emerald-700 text-white shadow-sm'
              : 'hover:bg-slate-100 text-slate-700'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>گزارش جامع پرسنلی</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveReport('contracts')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl whitespace-nowrap transition-all cursor-pointer ${
            activeReport === 'contracts'
              ? 'bg-emerald-700 text-white shadow-sm'
              : 'hover:bg-slate-100 text-slate-700'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>قراردادها و هشدار انقضا</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveReport('payroll')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl whitespace-nowrap transition-all cursor-pointer ${
            activeReport === 'payroll'
              ? 'bg-emerald-700 text-white shadow-sm'
              : 'hover:bg-slate-100 text-slate-700'
          }`}
        >
          <DollarSign className="w-4 h-4" />
          <span>احکام مالی و حقوق‌دستمزد</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveReport('org')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl whitespace-nowrap transition-all cursor-pointer ${
            activeReport === 'org'
              ? 'bg-emerald-700 text-white shadow-sm'
              : 'hover:bg-slate-100 text-slate-700'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>توزیع دپارتمان و شعب</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveReport('education')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl whitespace-nowrap transition-all cursor-pointer ${
            activeReport === 'education'
              ? 'bg-emerald-700 text-white shadow-sm'
              : 'hover:bg-slate-100 text-slate-700'
          }`}
        >
          <GraduationCap className="w-4 h-4" />
          <span>سوابق تحصیلی و آموزشی</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveReport('welfare')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl whitespace-nowrap transition-all cursor-pointer ${
            activeReport === 'welfare'
              ? 'bg-emerald-700 text-white shadow-sm'
              : 'hover:bg-slate-100 text-slate-700'
          }`}
        >
          <HeartHandshake className="w-4 h-4" />
          <span>بیمه و خدمات رفاهی</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveReport('custom')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl whitespace-nowrap transition-all cursor-pointer ${
            activeReport === 'custom'
              ? 'bg-emerald-700 text-white shadow-sm'
              : 'hover:bg-slate-100 text-slate-700'
          }`}
        >
          <SlidersHorizontal className="w-4 h-4" />
          <span>گزارش‌ساز سفارشی</span>
        </button>

      </div>

      {/* ========================================================================= */}
      {/* 4. Smart Rules Explanation Banner (Displayed for Contract Recommendations) */}
      {/* ========================================================================= */}
      {activeReport === 'contract_recommendations' && (
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-3xl p-5 border border-slate-700 shadow-md">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <h3 className="text-xs sm:text-sm font-black text-white">
                  دستورالعمل هوشمند تنظیم قراردادهای پرسنلی (محاسبه خودکار بر اساس سابقه و رتبه)
                </h3>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                سامانه به صورت پویا با بررسی <strong className="text-emerald-300">تاریخ شروع خدمت (استخدام)</strong> و <strong className="text-purple-300">سمت سازمانی</strong> پرسنل، نوع قرارداد استاندارد را پیشنهاد می‌دهد:
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs font-bold shrink-0">
              <div className="px-3 py-1.5 rounded-xl bg-sky-500/20 border border-sky-400/30 text-sky-200 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-sky-400"></span>
                <span>سابقه &lt; ۱ سال: <strong>۱ ماهه آزمایشی</strong></span>
              </div>
              <div className="px-3 py-1.5 rounded-xl bg-amber-500/20 border border-amber-400/30 text-amber-200 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                <span>سابقه &gt; ۱ سال: <strong>۳ ماهه فصلی</strong></span>
              </div>
              <div className="px-3 py-1.5 rounded-xl bg-purple-500/20 border border-purple-400/30 text-purple-200 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-purple-400"></span>
                <span>مدیران و معاونین: <strong>۶ ماهه و ۱ ساله</strong></span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. Advanced Filter Box */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2 text-slate-800 font-black text-xs sm:text-sm">
            <Filter className="w-4 h-4 text-emerald-600" />
            <span>فیلترهای چندبعدی و جستجوی پیشرفته گزارش</span>
          </div>

          <button
            type="button"
            onClick={handleResetFilters}
            className="text-[11px] font-bold text-slate-400 hover:text-rose-600 transition-colors flex items-center gap-1 cursor-pointer"
          >
            <span>پاک کردن همه فیلترها</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 text-xs">
          
          {/* Search Box */}
          <div className="lg:col-span-2">
            <label className="block text-slate-500 font-bold mb-1.5">
              جستجوی متنی (نام، کد ملی، پرسنلی، ضامن، سریال سفته)
            </label>
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="تایپ کنید..."
                className="w-full h-10 bg-slate-50 border border-slate-200 rounded-xl pr-9 pl-3 text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-emerald-500 transition-all text-right"
              />
              <Search className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
            </div>
          </div>

          {/* Period Mode Filter (همه / ماهانه / سالانه) */}
          <div>
            <label className="block text-slate-500 font-bold mb-1.5">
              بازه زمانی گزارش
            </label>
            <select
              value={periodMode}
              onChange={(e) => setPeriodMode(e.target.value as any)}
              className="w-full h-10 bg-emerald-50/60 border border-emerald-300 rounded-xl px-3 text-xs text-emerald-950 font-bold focus:bg-white focus:outline-none focus:border-emerald-500 transition-all text-right"
            >
              <option value="all">کلیه دوره‌ها (بدون تفکیک)</option>
              <option value="yearly">گزارش سالانه</option>
              <option value="monthly">گزارش ماهانه</option>
            </select>
          </div>

          {/* Year Selector */}
          <div>
            <label className="block text-slate-500 font-bold mb-1.5">
              سال خورشیدی
            </label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="w-full h-10 bg-slate-50 border border-slate-200 rounded-xl px-3 text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-emerald-500 transition-all font-mono text-right"
            >
              <option value="all">همه سال‌ها</option>
              <option value="1404">۱۴۰۴</option>
              <option value="1403">۱۴۰۳</option>
              <option value="1402">۱۴۰۲</option>
              <option value="1401">۱۴۰۱</option>
              <option value="1400">۱۴۰۰</option>
            </select>
          </div>

          {/* Month Selector */}
          <div>
            <label className="block text-slate-500 font-bold mb-1.5">
              ماه خورشیدی
            </label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              disabled={periodMode === 'yearly' || periodMode === 'all'}
              className="w-full h-10 bg-slate-50 border border-slate-200 rounded-xl px-3 text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-emerald-500 transition-all disabled:opacity-50 text-right"
            >
              <option value="all">همه ماه‌ها</option>
              <option value="1">فروردین</option>
              <option value="2">اردیبهشت</option>
              <option value="3">خرداد</option>
              <option value="4">تیر</option>
              <option value="5">مرداد</option>
              <option value="6">شهریور</option>
              <option value="7">مهر</option>
              <option value="8">آبان</option>
              <option value="9">آذر</option>
              <option value="10">دی</option>
              <option value="11">بهمن</option>
              <option value="12">اسفند</option>
            </select>
          </div>

          {/* Guarantee Promissory Note Status Filter */}
          <div>
            <label className="block text-slate-500 font-bold mb-1.5">
              وضعیت سفته ضمانت
            </label>
            <select
              value={selectedGuaranteeStatus}
              onChange={(e) => setSelectedGuaranteeStatus(e.target.value)}
              className="w-full h-10 bg-amber-50/70 border border-amber-300 rounded-xl px-3 text-xs text-amber-950 font-bold focus:bg-white focus:outline-none focus:border-amber-500 transition-all text-right"
            >
              <option value="all">تمام وضعیت‌های سفته</option>
              <option value="received">موجود در صندوق امانات</option>
              <option value="pending">در انتظار تحویل / نقص مدرک</option>
              <option value="returned">عودت داده شده به پرسنل</option>
            </select>
          </div>

          {/* Contract Rule Category Filter */}
          <div>
            <label className="block text-slate-500 font-bold mb-1.5">
              دسته‌بندی قانون قرارداد
            </label>
            <select
              value={selectedRuleCategory}
              onChange={(e) => setSelectedRuleCategory(e.target.value as any)}
              className="w-full h-10 bg-emerald-50/60 border border-emerald-300 rounded-xl px-3 text-xs text-emerald-950 font-bold focus:bg-white focus:outline-none focus:border-emerald-500 transition-all text-right"
            >
              <option value="all">همه دسته‌ها (۱ ماهه، ۳ ماهه، ۶ ماهه، سالانه)</option>
              <option value="under_1_year">سابقه کمتر از ۱ سال -&gt; پیشنهاد ۱ ماهه</option>
              <option value="over_1_year">سابقه بالای ۱ سال -&gt; پیشنهاد ۳ ماهه</option>
              <option value="senior_manager">مدیران و معاونین ارشد -&gt; پیشنهاد ۶ ماهه و ۱ ساله</option>
            </select>
          </div>

          {/* Company Filter */}
          <div>
            <label className="block text-slate-500 font-bold mb-1.5">
              شرکت محل فعالیت
            </label>
            <select
              value={selectedCompany}
              onChange={(e) => setSelectedCompany(e.target.value)}
              className="w-full h-10 bg-slate-50 border border-slate-200 rounded-xl px-3 text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-emerald-500 transition-all font-medium text-right"
            >
              <option value="all">تمام شرکت‌ها</option>
              {DEFAULT_COMPANIES.map(comp => (
                <option key={comp.id} value={comp.id}>{comp.name}</option>
              ))}
            </select>
          </div>

          {/* Department Filter */}
          <div>
            <label className="block text-slate-500 font-bold mb-1.5">
              واحد / دپارتمان سازمانی
            </label>
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="w-full h-10 bg-slate-50 border border-slate-200 rounded-xl px-3 text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-emerald-500 transition-all text-right"
            >
              <option value="all">تمام دپارتمان‌ها</option>
              {departments.map(d => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>

          {/* Branch Filter */}
          <div>
            <label className="block text-slate-500 font-bold mb-1.5">
              شعبه / محل خدمت
            </label>
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="w-full h-10 bg-slate-50 border border-slate-200 rounded-xl px-3 text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-emerald-500 transition-all text-right"
            >
              <option value="all">تمام شعب</option>
              {branches.map(b => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>

          {/* Contract Type Filter */}
          <div>
            <label className="block text-slate-500 font-bold mb-1.5">
              نوع قرارداد فعلی
            </label>
            <select
              value={selectedContract}
              onChange={(e) => setSelectedContract(e.target.value)}
              className="w-full h-10 bg-slate-50 border border-slate-200 rounded-xl px-3 text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-emerald-500 transition-all text-right"
            >
              <option value="all">تمام انواع قراردادها</option>
              <option value="دائمی">دائمی / رسمی</option>
              <option value="موقت">موقت / پیمانی</option>
              <option value="پروژه‌ای">پروژه‌ای</option>
              <option value="ساعتی">ساعتی / پاره‌وقت</option>
              <option value="مشاور">مشاور</option>
              <option value="کارآموز">کارآموز</option>
            </select>
          </div>

          {/* Employment Status Filter */}
          <div>
            <label className="block text-slate-500 font-bold mb-1.5">
              وضعیت همکاری
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full h-10 bg-slate-50 border border-slate-200 rounded-xl px-3 text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-emerald-500 transition-all text-right"
            >
              <option value="all">همه وضعیت‌ها</option>
              <option value="active">شاغل و فعال</option>
              <option value="on_leave">مرخصی استعلاجی / استحقاقی</option>
              <option value="mission">مأموریت کاری</option>
              <option value="terminated">قطع همکاری / خاتمه یافته</option>
            </select>
          </div>

          {/* Contract Expiry Filter */}
          <div>
            <label className="block text-slate-500 font-bold mb-1.5">
              انقضای قرارداد
            </label>
            <select
              value={contractExpiryFilter}
              onChange={(e) => setContractExpiryFilter(e.target.value as any)}
              className="w-full h-10 bg-slate-50 border border-slate-200 rounded-xl px-3 text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-emerald-500 transition-all text-right"
            >
              <option value="all">همه قراردادها</option>
              <option value="30days">انقضا در ۳۰ روز آینده (فوری)</option>
              <option value="60days">انقضا در ۶۰ روز آینده</option>
              <option value="90days">انقضا در ۹۰ روز آینده</option>
              <option value="expired">قراردادهای منقضی شده</option>
            </select>
          </div>

          {/* Gender Filter */}
          <div>
            <label className="block text-slate-500 font-bold mb-1.5">
              جنسیت
            </label>
            <select
              value={selectedGender}
              onChange={(e) => setSelectedGender(e.target.value)}
              className="w-full h-10 bg-slate-50 border border-slate-200 rounded-xl px-3 text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-emerald-500 transition-all text-right"
            >
              <option value="all">تمام جنسیت‌ها</option>
              <option value="مرد">آقایان</option>
              <option value="زن">بانوان</option>
            </select>
          </div>

          {/* Salary Minimum Filter */}
          <div>
            <label className="block text-slate-500 font-bold mb-1.5">
              حداقل حقوق پایه (ریال)
            </label>
            <input
              type="number"
              value={minSalary}
              onChange={(e) => setMinSalary(e.target.value)}
              placeholder="مثال: 150000000"
              className="w-full h-10 bg-slate-50 border border-slate-200 rounded-xl px-3 text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-emerald-500 transition-all font-mono text-left"
            />
          </div>

        </div>

        {/* Custom Column Toggles (Only in Custom Builder) */}
        {activeReport === 'custom' && (
          <div className="pt-4 border-t border-slate-100">
            <span className="text-xs font-black text-slate-700 block mb-2">
              ستون‌های قابل نمایش در جدول و فایل‌های خروجی:
            </span>
            <div className="flex flex-wrap gap-2.5">
              {[
                { id: 'code', label: 'کد پرسنلی' },
                { id: 'name', label: 'نام و نام خانوادگی' },
                { id: 'nationalId', label: 'کد ملی' },
                { id: 'gender', label: 'جنسیت' },
                { id: 'company', label: 'شرکت محل فعالیت' },
                { id: 'department', label: 'دپارتمان' },
                { id: 'position', label: 'سمت سازمانی' },
                { id: 'suggestedContract', label: 'قرارداد پیشنهادی هوشمند' },
                { id: 'tenure', label: 'طول سابقه کارکرد' },
                { id: 'branch', label: 'شعبه' },
                { id: 'status', label: 'وضعیت همکاری' },
                { id: 'contractType', label: 'نوع قرارداد' },
                { id: 'hireDate', label: 'تاریخ استخدام' },
                { id: 'endDate', label: 'پایان قرارداد' },
                { id: 'baseSalary', label: 'حقوق پایه (ریال)' },
                { id: 'netSalary', label: 'خالص دریافتی (ریال)' },
                { id: 'sheba', label: 'شماره شبا' },
                { id: 'bankName', label: 'نام بانک' },
                { id: 'mobile', label: 'شماره همراه' },
                { id: 'workEmail', label: 'ایمیل سازمانی' },
                { id: 'marital', label: 'وضعیت تأهل' },
                { id: 'children', label: 'تعداد اولاد' },
                { id: 'spouseBirthDate', label: 'تاریخ تولد همسر' },
                { id: 'childBirthDate', label: 'تاریخ تولد فرزندان' },
                { id: 'hasSupplementaryInsurance', label: 'بیمه تکمیلی' },
                { id: 'supplementaryCompany', label: 'شرکت بیمه تکمیلی' },
                { id: 'supplementaryPremium', label: 'مبلغ بیمه تکمیلی' },
                { id: 'costCenter', label: 'مرکز هزینه' }
              ].map(col => (
                <label 
                  key={col.id}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold cursor-pointer transition-all ${
                    selectedColumns[col.id] 
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-800' 
                      : 'bg-slate-50 border-slate-200 text-slate-500'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={!!selectedColumns[col.id]}
                    onChange={(e) => setSelectedColumns({
                      ...selectedColumns,
                      [col.id]: e.target.checked
                    })}
                    className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>{col.label}</span>
                </label>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 6. Analytical Charts Section (Dynamic by Report Type) */}
      {/* ========================================================================= */}
      {activeReport === 'guarantee' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Promissory Notes Custody Status Pie */}
          <div className="lg:col-span-5 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>وضعیت نگهداری لاشه سفته‌های ضمانت</span>
                </h3>
                <PieIcon className="w-5 h-5 text-emerald-600" />
              </div>
              <span className="text-xs text-slate-400">تحویل در صندوق امانات مالی، نواقص و عودت‌شده‌ها</span>

              <div className="h-56 w-full mt-2">
                {metrics.guaranteeCustodyChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={metrics.guaranteeCustodyChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={80}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {metrics.guaranteeCustodyChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <RechartsTooltip 
                        contentStyle={{ direction: 'rtl', textAlign: 'right', backgroundColor: '#0f172a', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '11px' }}
                        formatter={(val: any) => [`${toPersianDigits(val)} فقره`, 'تعداد سفته']}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-xs text-slate-400">
                    داده‌ای یافت نشد
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-3 border-t border-slate-100">
              <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-100 text-center">
                <span className="text-[10px] text-emerald-700 block font-bold">موجود در صندوق</span>
                <span className="text-xs font-black text-emerald-950 mt-0.5 block">{toPersianDigits(metrics.receivedGuaranteeCount)} فقره</span>
              </div>
              <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-100 text-center">
                <span className="text-[10px] text-amber-700 block font-bold">در انتظار / نقص</span>
                <span className="text-xs font-black text-amber-950 mt-0.5 block">{toPersianDigits(metrics.pendingGuaranteeCount)} فقره</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-100 border border-slate-200 text-center">
                <span className="text-[10px] text-slate-600 block font-bold">عودت داده شده</span>
                <span className="text-xs font-black text-slate-900 mt-0.5 block">{toPersianDigits(metrics.returnedGuaranteeCount)} فقره</span>
              </div>
            </div>
          </div>

          {/* Promissory Notes Sum by Department */}
          <div className="lg:col-span-7 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black text-slate-800">
                  توزیع مبالغ وثایق و سفته‌ها بر حسب دپارتمان سازمانی
                </h3>
                <span className="text-xs text-slate-400">مجموع ارزش ریالی تضامین پرسنلی به میلیون تومان</span>
              </div>
              <BarChart3 className="w-5 h-5 text-emerald-600" />
            </div>

            <div className="h-64 w-full">
              {metrics.deptChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={metrics.deptChartData} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }} interval={0} angle={-15} textAnchor="end" />
                    <YAxis tick={{ fontSize: 10, fill: '#64748b' }} />
                    <RechartsTooltip 
                      contentStyle={{ direction: 'rtl', textAlign: 'right', backgroundColor: '#0f172a', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '11px' }}
                      formatter={(value: any) => [`${toPersianDigits(value)} میلیون تومان`, 'مجموع وثیقه']}
                    />
                    <Bar dataKey="guaranteeMillionToman" fill="#0d9488" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-slate-400">
                  رکوردی جهت نمایش در نمودار یافت نشد
                </div>
              )}
            </div>
          </div>
        </div>
      ) : activeReport === 'periodic' ? (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-emerald-600" />
                <span>تحلیل روند ۱۲ ماهه جذب نیرو و بودجه سالانه حقوق ({toPersianDigits(selectedYear)})</span>
              </h3>
              <span className="text-xs text-slate-400">نمودار ترکیبی جذب پرسنل و بار مالی ماهانه حقوق در سال انتخابی</span>
            </div>
            <BarChart3 className="w-5 h-5 text-emerald-600" />
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={metrics.monthlyStats} margin={{ top: 15, right: 15, left: 15, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#334155' }} />
                <YAxis yAxisId="left" tick={{ fontSize: 10, fill: '#059669' }} orientation="right" allowDecimals={false} />
                <YAxis yAxisId="right" tick={{ fontSize: 10, fill: '#6366f1' }} orientation="left" />
                <RechartsTooltip 
                  contentStyle={{ direction: 'rtl', textAlign: 'right', backgroundColor: '#0f172a', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '11px' }}
                  formatter={(val: any, name: any) => {
                    if (name === 'hires') return [`${toPersianDigits(val)} نفر`, 'استخدام جدید'];
                    if (name === 'payrollMillion') return [`${toPersianDigits(val)} میلیون تومان`, 'بودجه حقوق ماهانه'];
                    return [val, name];
                  }}
                />
                <Bar yAxisId="left" dataKey="hires" fill="#059669" name="hires" radius={[6, 6, 0, 0]} />
                <Bar yAxisId="right" dataKey="payrollMillion" fill="#6366f1" name="payrollMillion" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Recommended Contract Periods Breakdown Pie Chart */}
          <div className="lg:col-span-6 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  <span>ترکیب قراردادهای پیشنهادی هوشمند</span>
                </h3>
                <PieIcon className="w-5 h-5 text-emerald-600" />
              </div>
              <span className="text-xs text-slate-400">توزیع قراردادهای ۱ ماهه، ۳ ماهه، ۶ ماهه و سالانه بر اساس سابقه و رتبه</span>

              <div className="h-56 w-full mt-2">
                {metrics.recChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={metrics.recChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={80}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {metrics.recChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <RechartsTooltip 
                        contentStyle={{ direction: 'rtl', textAlign: 'right', backgroundColor: '#0f172a', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '11px' }}
                        formatter={(val: any) => [`${toPersianDigits(val)} نفر`, 'تعداد']}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-xs text-slate-400">
                    داده‌ای یافت نشد
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-3 border-t border-slate-100">
              {metrics.recChartData.map((item) => (
                <div 
                  key={item.name} 
                  className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100 text-[11px]"
                >
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-slate-600 truncate max-w-[90px]">{item.name}</span>
                  </div>
                  <span className="font-black text-slate-900">{toPersianDigits(item.value)} نفر</span>
                </div>
              ))}
            </div>
          </div>

          {/* Department Distribution Bar Chart */}
          <div className="lg:col-span-6 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black text-slate-800">
                  توزیع پرسنل در دپارتمان‌های مختلف
                </h3>
                <span className="text-xs text-slate-400">تعداد نیروی انسانی بر اساس واحد سازمانی</span>
              </div>
              <BarChart3 className="w-5 h-5 text-emerald-600" />
            </div>

            <div className="h-64 w-full">
              {metrics.deptChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={metrics.deptChartData} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }} interval={0} angle={-15} textAnchor="end" />
                    <YAxis tick={{ fontSize: 10, fill: '#64748b' }} allowDecimals={false} />
                    <RechartsTooltip 
                      contentStyle={{ direction: 'rtl', textAlign: 'right', backgroundColor: '#0f172a', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '11px' }}
                      formatter={(value: any) => [`${toPersianDigits(value)} نفر`, 'تعداد']}
                    />
                    <Bar dataKey="count" fill="#059669" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-slate-400">
                  رکوردی جهت نمایش در نمودار یافت نشد
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 7. Main Interactive Report Data Table (100% Synchronized with Exports) */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        
        {/* Table Header Controls */}
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <h3 className="font-black text-sm text-slate-800 flex items-center gap-2">
              <FileSignature className="w-4 h-4 text-emerald-600" />
              <span>{reportSchema.title}</span>
            </h3>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs">
              {toPersianDigits(filteredEmployees.length)} ردیف
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <button
              type="button"
              onClick={handleExportExcel}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-xs transition-all cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>خروجی اکسل</span>
            </button>
            <button
              type="button"
              onClick={handleExportCSV}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 rounded-xl font-bold transition-all cursor-pointer border border-slate-200 shadow-xs"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>خروجی CSV</span>
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 rounded-xl font-bold transition-all cursor-pointer border border-slate-200 shadow-xs"
            >
              <Printer className="w-3.5 h-3.5 text-slate-500" />
              <span>پیش‌نمایش چاپ</span>
            </button>
            <button
              type="button"
              onClick={fetchData}
              disabled={loading}
              className="p-1.5 bg-white hover:bg-slate-100 text-slate-600 rounded-xl transition-all cursor-pointer border border-slate-200 shadow-xs"
              title="بارگذاری مجدد"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-12 text-center text-xs text-slate-400 space-y-3">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto text-emerald-600" />
              <p>در حال بارگذاری و پردازش رکوردهای گزارش...</p>
            </div>
          ) : reportSchema.rows.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-400 space-y-2">
              <AlertCircle className="w-8 h-8 mx-auto text-amber-500" />
              <p className="font-bold text-slate-700">هیچ رکوردی مطابق با فیلترهای انتخابی یافت نشد.</p>
              <button
                type="button"
                onClick={handleResetFilters}
                className="text-emerald-600 hover:underline font-bold cursor-pointer"
              >
                بازنشانی همه فیلترها
              </button>
            </div>
          ) : (
            <table className="w-full text-right border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100/80 text-slate-700 font-black border-b border-slate-200">
                  {reportSchema.columns.map((col) => (
                    <th 
                      key={col.key} 
                      className={`p-3.5 font-extrabold ${col.align === 'center' ? 'text-center' : col.align === 'left' ? 'text-left' : 'text-right'}`}
                    >
                      {col.label}
                    </th>
                  ))}
                  {/* Action Column for contract recommendations */}
                  {activeReport === 'contract_recommendations' && (
                    <th className="p-3.5 text-center font-extrabold">اقدام</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {reportSchema.rows.map((rowItem, index) => {
                  const emp = rowItem.raw as EmployeeSummary & { contractRec: ContractRecommendation };
                  const rec = emp.contractRec;

                  return (
                    <tr key={emp.id || index} className="hover:bg-slate-50/80 transition-colors">
                      {reportSchema.columns.map((col) => {
                        // Custom cell renderings based on col.key
                        if (col.key === 'row') {
                          return (
                            <td key={col.key} className="p-3.5 text-center text-slate-400 font-mono text-[11px]">
                              {toPersianDigits(index + 1)}
                            </td>
                          );
                        }
                        if (col.key === 'code') {
                          return (
                            <td key={col.key} className="p-3.5 text-center font-mono text-emerald-800 font-bold">
                              {rowItem.code}
                            </td>
                          );
                        }
                        if (col.key === 'name') {
                          return (
                            <td key={col.key} className="p-3.5">
                              <div className="flex items-center gap-2">
                                {emp.profileImageUrl ? (
                                  <img 
                                    src={emp.profileImageUrl} 
                                    alt="" 
                                    className="w-7 h-7 rounded-full object-cover shrink-0" 
                                    referrerPolicy="no-referrer"
                                  />
                                ) : (
                                  <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px] flex items-center justify-center shrink-0">
                                    {emp.firstName ? emp.firstName[0] : 'U'}
                                  </div>
                                )}
                                <div>
                                  <span className="font-black text-slate-900 block">
                                    {rowItem.name}
                                  </span>
                                  <span className="text-[10px] text-slate-400 font-mono">
                                    {emp.mobile || ''}
                                  </span>
                                </div>
                              </div>
                            </td>
                          );
                        }
                        if (col.key === 'suggestedContract') {
                          return (
                            <td key={col.key} className="p-3.5">
                              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-black border ${rec.badgeBgColor} ${rec.badgeTextColor} ${rec.badgeBorderColor}`}>
                                <Sparkles className="w-3.5 h-3.5 shrink-0" />
                                <span>{rec.periodLabel}</span>
                              </span>
                            </td>
                          );
                        }
                        if (col.key === 'tenure') {
                          return (
                            <td key={col.key} className="p-3.5">
                              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 font-bold text-[11px]">
                                <Clock className="w-3 h-3 text-slate-500" />
                                <span>{rec.tenure.tenureText}</span>
                              </div>
                            </td>
                          );
                        }
                        if (col.key === 'expiryStatus') {
                          const days = rowItem.daysRemaining;
                          return (
                            <td key={col.key} className="p-3.5 text-center">
                              {days !== null && days <= 0 ? (
                                <span className="px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[10px] font-bold">
                                  منقضی شده
                                </span>
                              ) : days !== null && days <= 30 ? (
                                <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[10px] font-bold animate-pulse">
                                  {toPersianDigits(days)} روز مانده
                                </span>
                              ) : days !== null ? (
                                <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[10px] font-bold">
                                  {toPersianDigits(days)} روز
                                </span>
                              ) : (
                                <span className="text-slate-400 text-[10px]">دائمی / نامحدود</span>
                              )}
                            </td>
                          );
                        }
                        if (col.key === 'status') {
                          const isActive = emp.employmentStatus === 'active';
                          const isOnLeave = emp.employmentStatus === 'on_leave';
                          return (
                            <td key={col.key} className="p-3.5 text-center">
                              <span className={`px-2.5 py-1 rounded-full text-[10px] font-black ${
                                isActive
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : isOnLeave
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-rose-100 text-rose-800'
                              }`}>
                                {rowItem.status}
                              </span>
                            </td>
                          );
                        }
                        if (col.key === 'baseSalary' || col.key === 'netSalary' || col.key === 'supplementaryPremium') {
                          return (
                            <td key={col.key} className="p-3.5 font-bold text-slate-900 text-left font-mono">
                              {toPersianDigits(rowItem[col.key])}
                            </td>
                          );
                        }
                        if (col.key === 'sheba') {
                          return (
                            <td key={col.key} className="p-3.5 font-mono text-[11px] text-slate-600 text-left" dir="ltr">
                              {rowItem[col.key]}
                            </td>
                          );
                        }
                        if (col.key === 'hireDate' || col.key === 'startDate' || col.key === 'endDate' || col.key === 'spouseBirthDate') {
                          return (
                            <td key={col.key} className="p-3.5 font-mono text-[11px] text-slate-600 text-center">
                              {toPersianDigits(rowItem[col.key])}
                            </td>
                          );
                        }

                        // Default cell display
                        return (
                          <td 
                            key={col.key} 
                            className={`p-3.5 ${col.align === 'center' ? 'text-center' : col.align === 'left' ? 'text-left' : 'text-right'}`}
                          >
                            {typeof rowItem[col.key] === 'number' ? toPersianDigits(rowItem[col.key]) : (rowItem[col.key] || '-')}
                          </td>
                        );
                      })}

                      {/* Action Column */}
                      {activeReport === 'contract_recommendations' && (
                        <td className="p-3.5 text-center">
                          <button
                            type="button"
                            onClick={() => handleOpenGeneratorForEmp(emp.id)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[11px] font-bold transition-all shadow-xs hover:scale-102 cursor-pointer"
                            title="تنظیم و صدور قرارداد طبق فرمول پیشنهادی"
                          >
                            <FileSignature className="w-3.5 h-3.5" />
                            <span>تنظیم قرارداد</span>
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer Summary */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
          <span>نمایش {toPersianDigits(filteredEmployees.length)} ردیف از کل {toPersianDigits(employees.length)} پرسنل</span>
          <div className="flex items-center gap-3">
            <span>سامانه مدیریت منابع انسانی و امور پرسنلی همکار</span>
            <span>•</span>
            <span className="font-bold text-emerald-700">تطابق کامل خروجی‌ها و پشتیبانی جامع RTL</span>
          </div>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* 8. Dedicated Print & PDF Modal Preview (Strictly RTL & Professional Header) */}
      {/* ========================================================================= */}
      {isPrintPreviewOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex flex-col items-center justify-center p-4 overflow-y-auto animate-fadeIn">
          <div className="bg-white rounded-3xl w-full max-w-6xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200">
            
            {/* Modal Top Control Bar (Hidden on actual print) */}
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between print:hidden">
              <div className="flex items-center gap-2">
                <Printer className="w-5 h-5 text-emerald-400" />
                <span className="font-bold text-sm">پیش‌نمایش چاپ رسمی و خروجی PDF (RTL)</span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>ارسال به چاپگر / ذخیره به عنوان PDF</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsPrintPreviewOpen(false)}
                  className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-colors cursor-pointer"
                  title="بستن پیش‌نمایش"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Printable Paper Area */}
            <div className="p-8 sm:p-10 overflow-y-auto flex-1 text-slate-900 space-y-6 print:p-0 print:m-0" dir="rtl">
              
              {/* Organization Official Print Header */}
              <div className="border-b-2 border-slate-800 pb-5 flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center font-black text-sm">
                      HR
                    </div>
                    <span className="text-lg font-black text-slate-900">سامانه مدیریت سرمایه انسانی و امور پرسنلی همکار</span>
                  </div>
                  <h2 className="text-base font-extrabold text-emerald-800 mt-1">
                    {reportSchema.title}
                  </h2>
                  <p className="text-xs text-slate-500">
                    گزارش رسمی استخراج‌شده از سامانه جامع منابع انسانی
                  </p>
                </div>

                <div className="text-left font-mono text-xs text-slate-600 space-y-1" dir="ltr">
                  <div>تاریخ تهیه: <strong className="font-bold text-slate-800">{getCurrentJalaliDate()}</strong></div>
                  <div>زمان استخراج: <strong className="font-bold text-slate-800">{toPersianDigits(new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }))}</strong></div>
                  <div>تعداد رکوردها: <strong className="font-bold text-slate-800">{toPersianDigits(reportSchema.rows.length)} نفر</strong></div>
                </div>
              </div>

              {/* Print Summary KPIs in 4 mini-boxes */}
              <div className="grid grid-cols-4 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[11px] text-slate-500 block">کل پرسنل گزارش</span>
                  <span className="text-base font-black text-slate-900 mt-0.5 block">{toPersianDigits(metrics.totalCount)} نفر</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[11px] text-slate-500 block">تفکیک جنسیتی</span>
                  <span className="text-xs font-bold text-slate-800 mt-0.5 block">{toPersianDigits(metrics.menCount)} آقا / {toPersianDigits(metrics.womenCount)} خانم</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[11px] text-slate-500 block">شاغلین فعال</span>
                  <span className="text-base font-black text-emerald-800 mt-0.5 block">{toPersianDigits(metrics.activeCount)} نفر</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[11px] text-slate-500 block">مجموع بودجه حقوق ماهانه</span>
                  <span className="text-xs font-bold text-emerald-900 mt-0.5 block truncate">{formatRial(metrics.totalPayroll)}</span>
                </div>
              </div>

              {/* Print Data Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-right border border-slate-300 text-[11px] border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-900 border-b border-slate-300">
                      {reportSchema.columns.map(col => (
                        <th key={col.key} className={`p-2 border-r border-slate-300 font-black ${col.align === 'center' ? 'text-center' : col.align === 'left' ? 'text-left' : 'text-right'}`}>
                          {col.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {reportSchema.rows.map((rowItem, idx) => (
                      <tr key={idx} className="even:bg-slate-50/60">
                        {reportSchema.columns.map(col => (
                          <td key={col.key} className={`p-2 border-r border-slate-200 ${col.align === 'center' ? 'text-center' : col.align === 'left' ? 'text-left' : 'text-right'}`}>
                            {typeof rowItem[col.key] === 'number' ? toPersianDigits(rowItem[col.key]) : (rowItem[col.key] || '-')}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Print Footer & Signatures Block */}
              <div className="pt-8 border-t border-slate-300 flex items-center justify-between text-xs text-slate-600">
                <div className="text-center space-y-8">
                  <span>امضای کارشناس تهیه‌کننده گزارش</span>
                  <div className="text-slate-400">..............................</div>
                </div>

                <div className="text-center space-y-8">
                  <span>امضای مدیر منابع انسانی</span>
                  <div className="text-slate-400">..............................</div>
                </div>

                <div className="text-center space-y-8">
                  <span>تأیید مدیریت عامل سازمان</span>
                  <div className="text-slate-400">..............................</div>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 9. Contract Generator Modal (Embedded for 1-Click Issuance) */}
      {/* ========================================================================= */}
      <ContractGeneratorModal
        isOpen={isGeneratorOpen}
        onClose={() => {
          setIsGeneratorOpen(false);
          setGeneratorEmpId(null);
        }}
        initialEmployeeId={generatorEmpId || undefined}
        onSuccess={(savedContract, andPrint) => {
          setIsGeneratorOpen(false);
          setGeneratorEmpId(null);
          fetchData();
          if (andPrint) {
            setActivePrintContract(savedContract);
          }
        }}
      />

    </div>
  );
};
