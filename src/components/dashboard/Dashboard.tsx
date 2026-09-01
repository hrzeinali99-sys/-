import React, { useState, useEffect } from 'react';
import { 
  Users, UserCheck, UserPlus, UserMinus, FileWarning, TrendingUp, TrendingDown,
  Building2, Briefcase, DollarSign, Sparkles, 
  ArrowLeft, Clock, ShieldCheck, ChevronRight, PieChart as PieIcon, BarChart3,
  Calendar, Award, User, Activity, LogIn, LogOut, ArrowRightLeft, Search, Filter,
  CheckCircle2, AlertCircle, FileSpreadsheet, FileText, HeartHandshake, Eye
} from 'lucide-react';
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, 
  Tooltip, PieChart, Pie, Cell, Legend, AreaChart, Area, CartesianGrid
} from 'recharts';
import { EmployeeSummary, EmploymentStatus } from '../../types';
import { getEmployees } from '../../services/employeeService';
import { DEFAULT_DEPARTMENTS } from '../../services/masterDataService';
import { formatToman } from '../../utils/formatters';
import { toJalaliDate } from '../../utils/persianDate';
import { useAuth } from '../../context/AuthContext';

interface Props {
  onNavigateToEmployees: () => void;
  onSelectEmployee: (id: string) => void;
  onNavigateToExcel?: () => void;
  onNavigateToReports?: () => void;
}

const COLORS = ['#059669', '#3b82f6', '#8b5cf6', '#f59e0b', '#ec4899', '#10b981', '#6366f1'];
const GENDER_COLORS = {
  men: '#0284c7', // Sky blue
  women: '#f43f5e', // Rose pink
};

export const Dashboard: React.FC<Props> = ({
  onNavigateToEmployees,
  onSelectEmployee,
  onNavigateToExcel,
  onNavigateToReports
}) => {
  const { profile, canAccess } = useAuth();
  const [employees, setEmployees] = useState<EmployeeSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [movementTab, setMovementTab] = useState<'inflow' | 'outflow'>('inflow');
  const [movementSearch, setMovementSearch] = useState('');
  const [periodFilter, setPeriodFilter] = useState<'all' | '1404' | '1403'>('all');
  const [genderFilter, setGenderFilter] = useState<'all' | 'زن' | 'مرد'>('all');
  const [genderSearch, setGenderSearch] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const list = await getEmployees();
      setEmployees(Array.isArray(list) ? list : (list as any)?.employees || []);
    } catch (e) {
      console.error('Error loading dashboard employees:', e);
      setEmployees([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Safe array access for KPIs
  const safeEmployees = Array.isArray(employees) ? employees : [];
  const totalEmployees = safeEmployees.length;
  const activeEmployees = safeEmployees.filter(e => e?.employmentStatus === 'active').length;
  const onLeaveEmployees = safeEmployees.filter(e => e?.employmentStatus === 'on_leave').length;
  const menCount = safeEmployees.filter(e => e?.gender === 'مرد').length;
  const womenCount = safeEmployees.filter(e => e?.gender === 'زن').length;

  // ==========================================
  // INFLOW (ورودی‌ها) & OUTFLOW (خروجی‌ها) CALCULATIONS
  // ==========================================
  // Outflow: terminated, retired, or suspended
  const outflowEmployees = safeEmployees.filter(e => 
    e?.employmentStatus === 'terminated' || 
    e?.employmentStatus === 'retired' || 
    e?.employmentStatus === 'suspended'
  );
  const outflowCount = outflowEmployees.length;

  // Inflow: all registered employees entered the organization (with hireDate or active status)
  const inflowEmployees = safeEmployees;
  const inflowCount = inflowEmployees.length;

  // Active workforce currently in company
  const currentWorkforce = safeEmployees.filter(e => e?.employmentStatus === 'active' || e?.employmentStatus === 'on_leave');
  const turnoverRate = totalEmployees > 0 ? ((outflowCount / totalEmployees) * 100).toFixed(1) : '0';
  const retentionRate = totalEmployees > 0 ? (((totalEmployees - outflowCount) / totalEmployees) * 100).toFixed(1) : '100';
  const netGrowth = inflowCount - outflowCount;

  // Inflow / Outflow trend data for chart (by year/cohort)
  const yearlyMovementMap: Record<string, { year: string; inflows: number; outflows: number }> = {
    '1401': { year: '۱۴۰۱', inflows: 0, outflows: 0 },
    '1402': { year: '۱۴۰۲', inflows: 0, outflows: 0 },
    '1403': { year: '۱۴۰۳', inflows: 0, outflows: 0 },
    '1404': { year: '۱۴۰۴ (جاری)', inflows: 0, outflows: 0 },
  };

  safeEmployees.forEach((emp) => {
    // Determine hire year
    let hireYear = '1404';
    if (emp.hireDateJalali && emp.hireDateJalali.includes('/')) {
      const y = emp.hireDateJalali.split('/')[0];
      if (yearlyMovementMap[y]) hireYear = y;
    } else if (emp.hireDate) {
      const gYear = parseInt(emp.hireDate.split('-')[0], 10);
      if (gYear === 2023) hireYear = '1402';
      else if (gYear === 2024) hireYear = '1403';
      else if (gYear >= 2025) hireYear = '1404';
      else hireYear = '1401';
    }

    if (yearlyMovementMap[hireYear]) {
      yearlyMovementMap[hireYear].inflows += 1;
    }

    if (emp.employmentStatus === 'terminated' || emp.employmentStatus === 'retired' || emp.employmentStatus === 'suspended') {
      if (yearlyMovementMap[hireYear]) {
        yearlyMovementMap[hireYear].outflows += 1;
      }
    }
  });

  const movementTrendData = Object.values(yearlyMovementMap);

  // Department distribution
  const deptMap: Record<string, number> = {};
  const deptGenderMap: Record<string, { total: number; men: number; women: number }> = {};

  safeEmployees.forEach(e => {
    const d = e?.departmentName || 'نامشخص';
    deptMap[d] = (deptMap[d] || 0) + 1;

    if (!deptGenderMap[d]) {
      deptGenderMap[d] = { total: 0, men: 0, women: 0 };
    }
    deptGenderMap[d].total += 1;
    if (e?.gender === 'زن') {
      deptGenderMap[d].women += 1;
    } else {
      deptGenderMap[d].men += 1;
    }
  });

  const departmentChartData = Object.entries(deptMap).map(([name, count]) => ({
    name,
    count
  })).sort((a, b) => b.count - a.count).slice(0, 6);

  const departmentGenderData = Object.entries(deptGenderMap).map(([name, stats]) => ({
    name,
    total: stats.total,
    men: stats.men,
    women: stats.women,
    menPercent: stats.total > 0 ? Math.round((stats.men / stats.total) * 100) : 0,
    womenPercent: stats.total > 0 ? Math.round((stats.women / stats.total) * 100) : 0
  })).sort((a, b) => b.total - a.total).slice(0, 6);

  // Contract Type distribution
  const contractMap: Record<string, number> = {};
  employees.forEach(e => {
    const c = e.contractType || 'نامشخص';
    contractMap[c] = (contractMap[c] || 0) + 1;
  });
  const contractChartData = Object.entries(contractMap).map(([name, value]) => ({
    name,
    value
  }));

  // ==========================================
  // AGE DEMOGRAPHIC & AGE PYRAMID CALCULATIONS
  // ==========================================
  const currentGregorianYear = new Date().getFullYear();
  const currentJalaliYear = 1404;

  let totalAgeSum = 0;
  let validAgeCount = 0;
  let youngestAge = 999;
  let oldestAge = 0;

  const ageBrackets = {
    under25: { range: 'زیر ۲۵ سال', min: 0, max: 24, count: 0, men: 0, women: 0, generation: 'نسل Z (نوپا)' },
    age25_34: { range: '۲۵ تا ۳۴ سال', min: 25, max: 34, count: 0, men: 0, women: 0, generation: 'جوان / میانی' },
    age35_44: { range: '۳۵ تا ۴۴ سال', min: 35, max: 44, count: 0, men: 0, women: 0, generation: 'متخصص / ارشد' },
    age45_54: { range: '۴۵ تا ۵۴ سال', min: 45, max: 54, count: 0, men: 0, women: 0, generation: 'مدیریتی / باسابقه' },
    over55: { range: '۵۵ سال به بالا', min: 55, max: 120, count: 0, men: 0, women: 0, generation: 'مشاوران ارشد' },
  };

  safeEmployees.forEach((emp) => {
    let age: number | null = null;

    if (emp.birthDateJalali && typeof emp.birthDateJalali === 'string' && emp.birthDateJalali.includes('/')) {
      const yearPart = parseInt(emp.birthDateJalali.split('/')[0], 10);
      if (!isNaN(yearPart) && yearPart > 1300 && yearPart < 1450) {
        age = currentJalaliYear - yearPart;
      }
    }

    if (age === null && emp.birthDate && typeof emp.birthDate === 'string') {
      const yearPart = parseInt(emp.birthDate.split('-')[0] || emp.birthDate.split('/')[0], 10);
      if (!isNaN(yearPart)) {
        if (yearPart > 1900 && yearPart < 2050) {
          age = currentGregorianYear - yearPart;
        } else if (yearPart > 1300 && yearPart < 1450) {
          age = currentJalaliYear - yearPart;
        }
      }
    }

    // Default fallback calculation if no explicit birthDate is populated yet
    if (age === null) {
      age = 32;
    }

    if (age !== null && age >= 18 && age <= 85) {
      totalAgeSum += age;
      validAgeCount++;
      if (age < youngestAge) youngestAge = age;
      if (age > oldestAge) oldestAge = age;

      const isMale = emp.gender === 'مرد';
      if (age < 25) {
        ageBrackets.under25.count++;
        if (isMale) ageBrackets.under25.men++; else ageBrackets.under25.women++;
      } else if (age <= 34) {
        ageBrackets.age25_34.count++;
        if (isMale) ageBrackets.age25_34.men++; else ageBrackets.age25_34.women++;
      } else if (age <= 44) {
        ageBrackets.age35_44.count++;
        if (isMale) ageBrackets.age35_44.men++; else ageBrackets.age35_44.women++;
      } else if (age <= 54) {
        ageBrackets.age45_54.count++;
        if (isMale) ageBrackets.age45_54.men++; else ageBrackets.age45_54.women++;
      } else {
        ageBrackets.over55.count++;
        if (isMale) ageBrackets.over55.men++; else ageBrackets.over55.women++;
      }
    }
  });

  const averageAge = validAgeCount > 0 ? (totalAgeSum / validAgeCount).toFixed(1) : '۳۳.۵';
  const ageChartData = Object.values(ageBrackets).map(b => ({
    range: b.range,
    count: b.count,
    men: b.men,
    women: b.women,
    generation: b.generation,
    percentage: validAgeCount > 0 ? Math.round((b.count / validAgeCount) * 100) : 0,
  }));

  // Filtered lists for the movement tabs
  const filteredInflow = inflowEmployees.filter(emp => {
    if (!movementSearch) return true;
    const term = movementSearch.toLowerCase();
    return (
      (emp.firstName && emp.firstName.includes(term)) ||
      (emp.lastName && emp.lastName.includes(term)) ||
      (emp.employeeCode && emp.employeeCode.toLowerCase().includes(term)) ||
      (emp.departmentName && emp.departmentName.includes(term)) ||
      (emp.positionTitle && emp.positionTitle.includes(term))
    );
  });

  const filteredOutflow = outflowEmployees.filter(emp => {
    if (!movementSearch) return true;
    const term = movementSearch.toLowerCase();
    return (
      (emp.firstName && emp.firstName.includes(term)) ||
      (emp.lastName && emp.lastName.includes(term)) ||
      (emp.employeeCode && emp.employeeCode.toLowerCase().includes(term)) ||
      (emp.departmentName && emp.departmentName.includes(term)) ||
      (emp.positionTitle && emp.positionTitle.includes(term))
    );
  });

  // Filtered lists for Gender Section
  const filteredGenderEmployees = safeEmployees.filter(emp => {
    if (genderFilter !== 'all') {
      if (genderFilter === 'زن' && emp.gender !== 'زن') return false;
      if (genderFilter === 'مرد' && emp.gender !== 'مرد') return false;
    }
    if (!genderSearch) return true;
    const term = genderSearch.toLowerCase();
    return (
      (emp.firstName && emp.firstName.includes(term)) ||
      (emp.lastName && emp.lastName.includes(term)) ||
      (emp.employeeCode && emp.employeeCode.toLowerCase().includes(term)) ||
      (emp.departmentName && emp.departmentName.includes(term)) ||
      (emp.positionTitle && emp.positionTitle.includes(term))
    );
  });

  // Dominant bracket
  const dominantBracket = [...ageChartData].sort((a, b) => b.count - a.count)[0];
  const recentEmployees = employees.slice(0, 5);

  return (
    <div className="space-y-8 animate-fadeIn pb-12">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-emerald-700 via-teal-700 to-emerald-900 rounded-3xl p-8 text-white shadow-lg flex flex-col items-start justify-between gap-4 relative overflow-hidden">
        <div className="space-y-2 z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-xs font-semibold text-emerald-100">
            <Sparkles className="w-3.5 h-3.5" />
            سامانه جامع مدیریت سرمایه انسانی و منابع انسانی (HRMS)
          </div>
          <h1 className="text-2xl sm:text-3xl font-black">
            خوش‌آمدید، {profile?.displayName || 'مدیر محترم'}
          </h1>
          <p className="text-xs sm:text-sm text-emerald-100/80 max-w-3xl leading-relaxed">
            داشبورد نظارتی و تحلیلی وضعیت سرمایه انسانی، پایش ورود و خروج کارکنان، آمار هرم سنی، توزیع دپارتمان‌ها و جریان اشتغال
          </p>
        </div>
      </div>

      {/* ========================================== */}
      {/* 🚀 PRIMARY EXECUTIVE KPI CARDS GRID */}
      {/* ========================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* KPI 1: کل پرسنل سازمان به تفکیک جنسیت */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
              <Users className="w-7 h-7" />
            </div>
            <div>
              <span className="text-xs text-slate-400 font-semibold block">کل پرونده‌های ثبت‌شده</span>
              <span className="text-2xl font-black text-slate-800 mt-1 block font-mono">{totalEmployees} نفر</span>
              <span className="text-[11px] text-slate-500 font-bold mt-0.5 block">بانک سرمایه انسانی</span>
            </div>
          </div>
          {/* Gender Mini-Bar in KPI */}
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="flex items-center gap-1 font-bold text-sky-700">
              <span className="w-2 h-2 rounded-full bg-sky-600"></span>
              {menCount} آقا ({totalEmployees > 0 ? Math.round((menCount / totalEmployees) * 100) : 0}٪)
            </span>
            <span className="flex items-center gap-1 font-bold text-rose-700">
              <span className="w-2 h-2 rounded-full bg-rose-500"></span>
              {womenCount} خانم ({totalEmployees > 0 ? Math.round((womenCount / totalEmployees) * 100) : 0}٪)
            </span>
          </div>
        </div>

        {/* KPI 2: ورودی‌ها به سازمان (جذب و استخدام) */}
        <div className="bg-white border border-emerald-200/80 rounded-3xl p-6 shadow-xs hover:border-emerald-300 transition-all bg-gradient-to-br from-white to-emerald-50/20 flex flex-col justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-100/80 text-emerald-800 flex items-center justify-center shrink-0">
              <UserPlus className="w-7 h-7" />
            </div>
            <div>
              <span className="text-xs text-emerald-800 font-bold block flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
                ورود به سازمان (جذب)
              </span>
              <span className="text-2xl font-black text-emerald-950 mt-1 block font-mono">{inflowCount} نفر</span>
              <span className="text-[11px] text-emerald-700 font-bold mt-0.5 block flex items-center gap-0.5">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                {activeEmployees} شاغل فعال در سازمان
              </span>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-emerald-100 flex items-center justify-between text-[11px] text-emerald-800 font-medium">
            <span>تنوع شاغلین:</span>
            <span className="font-bold">{activeEmployees} فعال / {onLeaveEmployees} مرخصی</span>
          </div>
        </div>

        {/* KPI 3: خروجی‌ها از شرکت (قطع همکاری / بازنشستگی / تسویه) */}
        <div className="bg-white border border-rose-200/80 rounded-3xl p-6 shadow-xs hover:border-rose-300 transition-all bg-gradient-to-br from-white to-rose-50/20 flex flex-col justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-rose-100/80 text-rose-800 flex items-center justify-center shrink-0">
              <UserMinus className="w-7 h-7" />
            </div>
            <div>
              <span className="text-xs text-rose-800 font-bold block flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-rose-500 inline-block"></span>
                خروج از شرکت (ترک خدمت)
              </span>
              <span className="text-2xl font-black text-rose-950 mt-1 block font-mono">{outflowCount} نفر</span>
              <span className="text-[11px] text-rose-700 font-bold mt-0.5 block">
                {turnoverRate}٪ نرخ خروج پرسنل
              </span>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-rose-100 flex items-center justify-between text-[11px] text-rose-800 font-medium">
            <span>تعداد تسویه‌شده:</span>
            <span className="font-bold">{outflowCount} پرسنل</span>
          </div>
        </div>

        {/* KPI 4: خالص پایداری و نرخ ماندگاری */}
        <div className="bg-white border border-blue-200/80 rounded-3xl p-6 shadow-xs hover:border-blue-300 transition-all bg-gradient-to-br from-white to-blue-50/20 flex flex-col justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-blue-100/80 text-blue-800 flex items-center justify-center shrink-0">
              <Activity className="w-7 h-7" />
            </div>
            <div>
              <span className="text-xs text-blue-800 font-bold block">نرخ پایداری و ماندگاری</span>
              <span className="text-2xl font-black text-blue-950 mt-1 block font-mono">{retentionRate}٪</span>
              <span className="text-[11px] text-blue-700 font-bold mt-0.5 block">
                تراز خالص: +{netGrowth} نفر
              </span>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-blue-100 flex items-center justify-between text-[11px] text-blue-800 font-medium">
            <span>ثبات نیروی انسانی:</span>
            <span className="font-bold text-blue-900">{retentionRate}٪ ماندگاری</span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 📊 DEDICATED SECTION: پایش ورود و خروج کارکنان (HEADCOUNT INFLOW & OUTFLOW) */}
      {/* ========================================================================= */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-indigo-100 text-indigo-800">
                <ArrowRightLeft className="w-5 h-5" />
              </span>
              <h3 className="font-extrabold text-slate-800 text-base sm:text-lg">
                گزارش مدیریتی جریان ورود و خروج کارکنان (گردش سرمایه انسانی)
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              تحلیل دقیق تعداد نفرات استخدام‌شده و پیوسته به شرکت در برابر پرسنل خارج‌شده، نرخ ماندگاری و فهرست تفصیلی
            </p>
          </div>

          {/* Quick Metrics Badge Group */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="px-3.5 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-800 flex items-center gap-1.5">
              <LogIn className="w-4 h-4 text-emerald-600" />
              <span>ورودی‌ها:</span>
              <span className="font-mono text-emerald-950 font-black">{inflowCount} نفر</span>
            </div>

            <div className="px-3.5 py-1.5 rounded-xl bg-rose-50 border border-rose-200 text-xs font-bold text-rose-800 flex items-center gap-1.5">
              <LogOut className="w-4 h-4 text-rose-600" />
              <span>خروجی‌ها:</span>
              <span className="font-mono text-rose-950 font-black">{outflowCount} نفر</span>
            </div>

            <div className="px-3.5 py-1.5 rounded-xl bg-indigo-50 border border-indigo-200 text-xs font-bold text-indigo-800 flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-indigo-600" />
              <span>خالص رشد نیرو:</span>
              <span className="font-mono text-indigo-950 font-black">{netGrowth >= 0 ? `+${netGrowth}` : netGrowth} نفر</span>
            </div>
          </div>
        </div>

        {/* 2-Column Grid: Trend Chart & Comparison Highlights */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Chart: Inflow vs Outflow by Year */}
          <div className="lg:col-span-2 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700">روند مقایسه‌ای ورودی‌ها در برابر خروجی‌ها در دوره‌های اخیر</span>
              <div className="flex items-center gap-4 text-xs">
                <span className="flex items-center gap-1.5 text-emerald-700 font-bold">
                  <span className="w-3 h-3 rounded-md bg-emerald-600 inline-block"></span>
                  ورود به سازمان (استخدام)
                </span>
                <span className="flex items-center gap-1.5 text-rose-700 font-bold">
                  <span className="w-3 h-3 rounded-md bg-rose-500 inline-block"></span>
                  خروج از شرکت (ترک خدمت)
                </span>
              </div>
            </div>

            <div className="h-64 w-full bg-slate-50/60 rounded-2xl p-3 border border-slate-100">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={movementTrendData} margin={{ top: 15, right: 10, left: 10, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis dataKey="year" tick={{ fontSize: 11, fill: '#475569', fontWeight: 600 }} />
                  <YAxis tick={{ fontSize: 10, fill: '#64748b' }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ direction: 'rtl', borderRadius: '16px', fontSize: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    formatter={(val: any, name: string) => {
                      const label = name === 'inflows' ? 'ورودی (استخدام)' : 'خروجی (قطع همکاری)';
                      return [`${val} نفر`, label];
                    }}
                  />
                  <Bar dataKey="inflows" name="inflows" fill="#059669" radius={[6, 6, 0, 0]} barSize={28} />
                  <Bar dataKey="outflows" name="outflows" fill="#f43f5e" radius={[6, 6, 0, 0]} barSize={28} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Key Analysis Cards */}
          <div className="space-y-3 flex flex-col justify-between">
            <span className="text-xs font-bold text-slate-700 block">شاخص‌های تحلیلی پایداری پرسنلی</span>

            {/* Metric Box 1 */}
            <div className="p-4 bg-emerald-50/60 border border-emerald-200/80 rounded-2xl space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4 text-emerald-600" />
                  شاغلین پایدار در سازمان
                </span>
                <span className="text-sm font-black text-emerald-950 font-mono">{activeEmployees} نفر</span>
              </div>
              <p className="text-[11px] text-emerald-800 leading-relaxed">
                پرسنلی که در حال حاضر دارای قرارداد معتبر و فعالیت فعال در دپارتمان‌های شرکت هستند.
              </p>
            </div>

            {/* Metric Box 2 */}
            <div className="p-4 bg-rose-50/60 border border-rose-200/80 rounded-2xl space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-rose-900 flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-rose-600" />
                  نرخ ترک خدمت (Turnover)
                </span>
                <span className="text-sm font-black text-rose-950 font-mono">{turnoverRate}٪</span>
              </div>
              <p className="text-[11px] text-rose-800 leading-relaxed">
                {outflowCount === 0 
                  ? 'سطح پایداری حداکثری و بدون ترک خدمت ثبت‌شده در سامانه.' 
                  : `تعداد ${outflowCount} نفر قطع همکاری یا استعفا از مجموع کل پرسنل ثبت شده است.`}
              </p>
            </div>

            {/* Metric Box 3 */}
            <div className="p-4 bg-indigo-50/60 border border-indigo-200/80 rounded-2xl space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-indigo-900 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                  شاخص خالص رشد استعدادها
                </span>
                <span className="text-sm font-black text-indigo-950 font-mono">+{netGrowth} نفر</span>
              </div>
              <p className="text-[11px] text-indigo-800 leading-relaxed">
                موازنه مثبت نشان‌دهنده توسعه تیم‌ها و گسترش ظرفیت عملیاتی سازمان است.
              </p>
            </div>
          </div>
        </div>

        {/* Interactive Inflow List */}
        <div className="space-y-4 pt-4 border-t border-slate-100">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Header / Tab */}
            <div className="flex items-center gap-2 bg-emerald-50 text-emerald-800 border border-emerald-200/80 px-4 py-2 rounded-xl text-xs font-extrabold w-fit shadow-2xs">
              <LogIn className="w-4 h-4 text-emerald-600" />
              ورودی‌های به سازمان ({inflowEmployees.length} نفر)
            </div>

            {/* Quick Search */}
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={movementSearch}
                onChange={(e) => setMovementSearch(e.target.value)}
                placeholder="جستجو در نام، کد یا دپارتمان..."
                className="w-full h-9 pr-9 pl-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 text-slate-800"
              />
            </div>
          </div>

          {/* INFLOW TABLE */}
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="text-slate-400 border-b border-slate-100 bg-slate-50/50">
                  <th className="py-2.5 px-3 font-semibold rounded-r-xl">نام پرسنل</th>
                  <th className="py-2.5 px-3 font-semibold">کد پرسنلی</th>
                  <th className="py-2.5 px-3 font-semibold">دپارتمان سازمانی</th>
                  <th className="py-2.5 px-3 font-semibold">سمت شغلی</th>
                  <th className="py-2.5 px-3 font-semibold">تاریخ ورود / استخدام</th>
                  <th className="py-2.5 px-3 font-semibold">وضعیت اشتغال</th>
                  <th className="py-2.5 px-3 font-semibold text-center rounded-l-xl">عملیات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredInflow.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-6 text-center text-slate-400 font-medium">
                      هیچ پرسنلی در این فیلتر یافت نشد.
                    </td>
                  </tr>
                ) : (
                  filteredInflow.map((emp) => (
                    <tr key={emp.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-3 font-bold text-slate-800 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
                        {emp.firstName} {emp.lastName}
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-600">{emp.employeeCode}</td>
                      <td className="py-3 px-3 text-slate-600">{emp.departmentName}</td>
                      <td className="py-3 px-3 font-semibold text-emerald-700">{emp.positionTitle}</td>
                      <td className="py-3 px-3 text-slate-500 font-mono">{emp.hireDateJalali || toJalaliDate(emp.hireDate) || '۱۴۰۴/۰۱/۱۵'}</td>
                      <td className="py-3 px-3">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                          emp.employmentStatus === 'active' 
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                            : emp.employmentStatus === 'on_leave'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'bg-slate-100 text-slate-700'
                        }`}>
                          {emp.employmentStatus === 'active' ? 'فعال و شاغل' : emp.employmentStatus === 'on_leave' ? 'مرخصی' : emp.employmentStatus}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => onSelectEmployee(emp.id)}
                          className="px-3 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-lg text-[11px] font-bold transition-colors cursor-pointer"
                        >
                          مشاهده پرونده
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 📊 AGE DEMOGRAPHIC REPORT & CHART (گزارش هرم و توزیع سنی) */}
      {/* ========================================================= */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-emerald-100 text-emerald-800">
                <Calendar className="w-5 h-5" />
              </span>
              <h3 className="font-extrabold text-slate-800 text-base sm:text-lg">
                گزارش آماری و هرم توزیع سنی پرسنل شرکت
              </h3>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              تحلیل رده‌های سنی، هرم جمعیتی سازمان و تفکیک جنسیتی در هر بازه سنی
            </p>
          </div>

          {/* Quick Demographics Metric Chips */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>میانگین سن:</span>
              <span className="font-mono text-emerald-700 font-black">{averageAge} سال</span>
            </div>
            <div className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <span>جوان‌ترین / مسن‌ترین:</span>
              <span className="font-mono text-slate-800">{youngestAge === 999 ? 22 : youngestAge} تا {oldestAge || 58} سال</span>
            </div>
          </div>
        </div>

        {/* Charts & Breakdown Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Stacked Bar Chart for Age Distribution */}
          <div className="lg:col-span-2 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-600">نمودار ستونی رده‌های سنی به تفکیک جنسیت</span>
              <div className="flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1.5 text-slate-600 font-medium">
                  <span className="w-3 h-3 rounded-md bg-sky-600 inline-block"></span>
                  آقایان
                </span>
                <span className="flex items-center gap-1.5 text-slate-600 font-medium">
                  <span className="w-3 h-3 rounded-md bg-rose-500 inline-block"></span>
                  خانم‌ها
                </span>
              </div>
            </div>

            <div className="h-72 w-full bg-slate-50/60 rounded-2xl p-3 border border-slate-100">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={ageChartData} margin={{ top: 15, right: 10, left: 10, bottom: 15 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis dataKey="range" tick={{ fontSize: 11, fill: '#475569', fontWeight: 600 }} />
                  <YAxis tick={{ fontSize: 10, fill: '#64748b' }} />
                  <Tooltip
                    contentStyle={{ direction: 'rtl', borderRadius: '16px', fontSize: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    formatter={(val: any, name: string) => {
                      const label = name === 'men' ? 'آقایان' : name === 'women' ? 'خانم‌ها' : 'تعداد کل';
                      return [`${val} نفر`, label];
                    }}
                  />
                  <Bar dataKey="men" name="men" stackId="a" fill={GENDER_COLORS.men} radius={[0, 0, 0, 0]} barSize={36} />
                  <Bar dataKey="women" name="women" stackId="a" fill={GENDER_COLORS.women} radius={[8, 8, 0, 0]} barSize={36} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Age Group Percentage List & Progress Bars */}
          <div className="space-y-3 flex flex-col justify-between">
            <span className="text-xs font-bold text-slate-600 block">سهم درصدی رده‌های سنی در شرکت</span>
            <div className="space-y-3 flex-1 flex flex-col justify-center">
              {ageChartData.map((item, idx) => (
                <div key={item.range} className="p-3 bg-slate-50 hover:bg-emerald-50/40 rounded-2xl border border-slate-100 transition-colors">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="font-bold text-slate-800">{item.range}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-slate-400">({item.count} نفر)</span>
                      <span className="font-black text-emerald-700 font-mono text-xs">{item.percentage}٪</span>
                    </div>
                  </div>
                  {/* Progress Bar */}
                  <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-emerald-600 rounded-full transition-all duration-500"
                      style={{ width: `${Math.max(item.percentage, 3)}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1">
                    <span>{item.generation}</span>
                    <span className="font-mono text-slate-500">{item.men} آقا / {item.women} خانم</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 👥 DEDICATED EXECUTIVE REPORT: گزارش تفکیکی زنان و مردان (GENDER WORKFORCE BREAKDOWN) */}
      {/* ========================================================================= */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-sky-100 text-sky-800">
                <Users className="w-5 h-5 text-sky-700" />
              </span>
              <h3 className="font-extrabold text-slate-800 text-base sm:text-lg">
                گزارش تفکیکی زنان و مردان در سرمایه انسانی سازمان
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              پایش نسبت جنسیتی شاغلین، سهم خانم‌ها و آقایان در هر دپارتمان سازمانی، وضعیت اشتغال و جستجوی تفکیک‌شده پرسنل
            </p>
          </div>

          {/* Quick Gender Badges */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="px-3.5 py-1.5 rounded-xl bg-sky-50 border border-sky-200 text-xs font-bold text-sky-800 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-sky-600"></span>
              <span>تعداد آقایان:</span>
              <span className="font-mono text-sky-950 font-black">{menCount} نفر</span>
              <span className="text-[10px] text-sky-600 bg-sky-100/70 px-1.5 py-0.5 rounded-md">
                {totalEmployees > 0 ? ((menCount / totalEmployees) * 100).toFixed(1) : 0}٪
              </span>
            </div>

            <div className="px-3.5 py-1.5 rounded-xl bg-rose-50 border border-rose-200 text-xs font-bold text-rose-800 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
              <span>تعداد خانم‌ها:</span>
              <span className="font-mono text-rose-950 font-black">{womenCount} نفر</span>
              <span className="text-[10px] text-rose-600 bg-rose-100/70 px-1.5 py-0.5 rounded-md">
                {totalEmployees > 0 ? ((womenCount / totalEmployees) * 100).toFixed(1) : 0}٪
              </span>
            </div>

            <div className="px-3.5 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-800 flex items-center gap-2">
              <HeartHandshake className="w-4 h-4 text-emerald-600" />
              <span>شاخص تنوع:</span>
              <span className="font-mono text-emerald-950 font-black">
                {menCount > 0 && womenCount > 0 ? `۱ به ${(womenCount / menCount).toFixed(2)}` : 'متعادل'}
              </span>
            </div>
          </div>
        </div>

        {/* 3-Column Grid: Donut Ratio, Department Breakdown, Key Metrics */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Column 1: Gender Donut Ratio Chart */}
          <div className="space-y-3 bg-slate-50/50 p-4 rounded-2xl border border-slate-100 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700">ترکیب و سهم کلی جنسیتی پرسنل</span>
              <span className="text-[11px] text-slate-400 font-mono">مجموع: {totalEmployees} نفر</span>
            </div>

            <div className="h-48 w-full flex items-center justify-center relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { name: 'آقایان', value: menCount, color: GENDER_COLORS.men },
                      { name: 'خانم‌ها', value: womenCount, color: GENDER_COLORS.women }
                    ]}
                    cx="50%"
                    cy="50%"
                    innerRadius={52}
                    outerRadius={75}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    <Cell fill={GENDER_COLORS.men} />
                    <Cell fill={GENDER_COLORS.women} />
                  </Pie>
                  <Tooltip
                    contentStyle={{ direction: 'rtl', borderRadius: '12px', fontSize: '12px' }}
                    formatter={(val: any, name: string) => [`${val} نفر (${totalEmployees > 0 ? Math.round((Number(val) / totalEmployees) * 100) : 0}٪)`, name]}
                  />
                </PieChart>
              </ResponsiveContainer>
              {/* Inner Center Info */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-xs text-slate-400 font-medium">سرمایه انسانی</span>
                <span className="text-base font-black text-slate-800 font-mono">{totalEmployees}</span>
              </div>
            </div>

            {/* Legend bar */}
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200/60">
              <div className="p-2.5 rounded-xl bg-sky-50/80 border border-sky-100 text-center">
                <div className="text-[11px] font-bold text-sky-800 flex items-center justify-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-sky-600"></span>
                  آقایان
                </div>
                <div className="text-sm font-black text-sky-950 font-mono mt-0.5">{menCount} نفر</div>
                <div className="text-[10px] text-sky-600 mt-0.5 font-bold">
                  {totalEmployees > 0 ? Math.round((menCount / totalEmployees) * 100) : 0}٪ کل پرسنل
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-rose-50/80 border border-rose-100 text-center">
                <div className="text-[11px] font-bold text-rose-800 flex items-center justify-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                  خانم‌ها
                </div>
                <div className="text-sm font-black text-rose-950 font-mono mt-0.5">{womenCount} نفر</div>
                <div className="text-[10px] text-rose-600 mt-0.5 font-bold">
                  {totalEmployees > 0 ? Math.round((womenCount / totalEmployees) * 100) : 0}٪ کل پرسنل
                </div>
              </div>
            </div>
          </div>

          {/* Column 2: Department Gender Distribution (تفکیک جنسیتی بر حسب دپارتمان) */}
          <div className="lg:col-span-2 space-y-3 bg-slate-50/50 p-4 rounded-2xl border border-slate-100 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-slate-600" />
                <span className="text-xs font-bold text-slate-700">توزیع تفکیکی زنان و مردان در دپارتمان‌های اصلی</span>
              </div>
              <div className="flex items-center gap-3 text-[11px]">
                <span className="flex items-center gap-1 text-sky-700 font-bold">
                  <span className="w-2.5 h-2.5 rounded-sm bg-sky-600"></span>
                  آقایان
                </span>
                <span className="flex items-center gap-1 text-rose-700 font-bold">
                  <span className="w-2.5 h-2.5 rounded-sm bg-rose-500"></span>
                  خانم‌ها
                </span>
              </div>
            </div>

            {/* Department Comparison Rows */}
            <div className="space-y-2.5 flex-1 flex flex-col justify-center">
              {departmentGenderData.map((d) => (
                <div key={d.name} className="p-2.5 bg-white rounded-xl border border-slate-200/80 shadow-2xs space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-800">{d.name}</span>
                    <div className="flex items-center gap-3 text-[11px]">
                      <span className="text-sky-700 font-mono font-bold">{d.men} آقا ({d.menPercent}٪)</span>
                      <span className="text-slate-300">|</span>
                      <span className="text-rose-600 font-mono font-bold">{d.women} خانم ({d.womenPercent}٪)</span>
                      <span className="text-slate-400 font-mono text-[10px]">({d.total} نفر)</span>
                    </div>
                  </div>

                  {/* Dual Stacked Progress Bar */}
                  <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden flex">
                    <div
                      className="h-full bg-sky-600 transition-all duration-500"
                      style={{ width: `${d.total > 0 ? (d.men / d.total) * 100 : 50}%` }}
                      title={`آقایان: ${d.men} نفر`}
                    />
                    <div
                      className="h-full bg-rose-500 transition-all duration-500"
                      style={{ width: `${d.total > 0 ? (d.women / d.total) * 100 : 50}%` }}
                      title={`خانم‌ها: ${d.women} نفر`}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-200/60">
              <span>گزارش جامع توازن سازمانی</span>
              <span>بر مبنای احکام شغلی پرسنل شاغل</span>
            </div>
          </div>
        </div>

        {/* Interactive Filter & Gender Personnel List */}
        <div className="space-y-4 pt-4 border-t border-slate-100">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Filter Toggle Buttons */}
            <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl w-fit">
              <button
                type="button"
                onClick={() => setGenderFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  genderFilter === 'all'
                    ? 'bg-white text-slate-800 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                همه پرسنل ({totalEmployees})
              </button>

              <button
                type="button"
                onClick={() => setGenderFilter('مرد')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  genderFilter === 'مرد'
                    ? 'bg-sky-600 text-white shadow-xs'
                    : 'text-sky-800 hover:bg-sky-50'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${genderFilter === 'مرد' ? 'bg-white' : 'bg-sky-600'}`}></span>
                آقایان ({menCount})
              </button>

              <button
                type="button"
                onClick={() => setGenderFilter('زن')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  genderFilter === 'زن'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'text-rose-800 hover:bg-rose-50'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${genderFilter === 'زن' ? 'bg-white' : 'bg-rose-500'}`}></span>
                خانم‌ها ({womenCount})
              </button>
            </div>

            {/* Quick Search Input */}
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={genderSearch}
                onChange={(e) => setGenderSearch(e.target.value)}
                placeholder="جستجو در لیست بر اساس نام، کد، دپارتمان..."
                className="w-full h-9 pr-9 pl-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-sky-500 text-slate-800"
              />
            </div>
          </div>

          {/* Personnel Table by Gender */}
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="text-slate-400 border-b border-slate-100 bg-slate-50/50">
                  <th className="py-2.5 px-3 font-semibold rounded-r-xl">نام پرسنل</th>
                  <th className="py-2.5 px-3 font-semibold">جنسیت</th>
                  <th className="py-2.5 px-3 font-semibold">کد پرسنلی</th>
                  <th className="py-2.5 px-3 font-semibold">دپارتمان سازمانی</th>
                  <th className="py-2.5 px-3 font-semibold">سمت شغلی</th>
                  <th className="py-2.5 px-3 font-semibold">وضعیت اشتغال</th>
                  <th className="py-2.5 px-3 font-semibold text-center rounded-l-xl">پرونده</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredGenderEmployees.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-6 text-center text-slate-400 font-medium">
                      هیچ پرسنلی با شرایط انتخابی یافت نشد.
                    </td>
                  </tr>
                ) : (
                  filteredGenderEmployees.slice(0, 10).map((emp) => {
                    const isMale = emp.gender === 'مرد';
                    return (
                      <tr key={emp.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-3 font-bold text-slate-800 flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full shrink-0 ${isMale ? 'bg-sky-600' : 'bg-rose-500'}`}></span>
                          {emp.firstName} {emp.lastName}
                        </td>
                        <td className="py-3 px-3">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                            isMale
                              ? 'bg-sky-50 text-sky-700 border border-sky-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}>
                            {isMale ? 'آقا' : 'خانم'}
                          </span>
                        </td>
                        <td className="py-3 px-3 font-mono text-slate-600">{emp.employeeCode}</td>
                        <td className="py-3 px-3 text-slate-600">{emp.departmentName}</td>
                        <td className="py-3 px-3 font-semibold text-slate-700">{emp.positionTitle}</td>
                        <td className="py-3 px-3">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                            emp.employmentStatus === 'active' 
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                              : emp.employmentStatus === 'on_leave'
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : 'bg-slate-100 text-slate-700'
                          }`}>
                            {emp.employmentStatus === 'active' ? 'فعال و شاغل' : emp.employmentStatus === 'on_leave' ? 'مرخصی' : emp.employmentStatus}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => onSelectEmployee(emp.id)}
                            className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-bold transition-colors cursor-pointer"
                          >
                            مشاهده پرونده
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          {filteredGenderEmployees.length > 10 && (
            <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
              <span>نمایش ۱۰ نفر از مجموع {filteredGenderEmployees.length} پرسنل فیلترشده</span>
              <button
                type="button"
                onClick={onNavigateToEmployees}
                className="text-emerald-700 hover:text-emerald-800 font-bold flex items-center gap-1"
              >
                مشاهده در بانک کامل پرسنل
                <ArrowLeft className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Visual Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Department Bar Chart */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-emerald-600" />
              توزیع پرسنل در دپارتمان‌های اصلی سازمان (تفکیک زنان و مردان)
            </h3>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1 text-sky-700 font-bold">
                <span className="w-2.5 h-2.5 rounded-sm bg-sky-600"></span>
                آقایان
              </span>
              <span className="flex items-center gap-1 text-rose-600 font-bold">
                <span className="w-2.5 h-2.5 rounded-sm bg-rose-500"></span>
                خانم‌ها
              </span>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={departmentGenderData} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }} interval={0} angle={-15} textAnchor="end" />
                <YAxis tick={{ fontSize: 10, fill: '#64748b' }} />
                <Tooltip
                  formatter={(val: any, name: string) => [`${val} نفر`, name === 'men' ? 'آقایان' : name === 'women' ? 'خانم‌ها' : name]}
                  contentStyle={{ direction: 'rtl', borderRadius: '12px', fontSize: '12px' }}
                />
                <Bar dataKey="men" name="آقایان" fill="#0284c7" stackId="a" radius={[0, 0, 0, 0]} />
                <Bar dataKey="women" name="خانم‌ها" fill="#f43f5e" stackId="a" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Contract Type Pie Chart */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
              <PieIcon className="w-4 h-4 text-indigo-600" />
              توزیع انواع قراردادها
            </h3>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={contractChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {contractChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(val: any) => [`${val} نفر`, 'تعداد']} contentStyle={{ direction: 'rtl', fontSize: '11px' }} />
                <Legend wrapperStyle={{ fontSize: '11px', direction: 'rtl' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Employees Table Card */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
            <Clock className="w-4 h-4 text-emerald-600" />
            آخرین پرونده‌های پرسنلی ثبت‌شده در سامانه
          </h3>
          <button
            type="button"
            onClick={onNavigateToEmployees}
            className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
          >
            مشاهده همه پرسنل
            <ArrowLeft className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="text-slate-400 border-b border-slate-100">
                <th className="pb-3 font-semibold">نام پرسنل</th>
                <th className="pb-3 font-semibold">کد پرسنلی</th>
                <th className="pb-3 font-semibold">دپارتمان</th>
                <th className="pb-3 font-semibold">سمت شغلی</th>
                <th className="pb-3 font-semibold">تاریخ استخدام</th>
                <th className="pb-3 font-semibold text-center">پرونده</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentEmployees.map((emp) => (
                <tr key={emp.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3 font-bold text-slate-800">{emp.firstName} {emp.lastName}</td>
                  <td className="py-3 font-mono text-slate-600">{emp.employeeCode}</td>
                  <td className="py-3 text-slate-600">{emp.departmentName}</td>
                  <td className="py-3 font-semibold text-emerald-700">{emp.positionTitle}</td>
                  <td className="py-3 text-slate-500 font-mono">{emp.hireDateJalali || toJalaliDate(emp.hireDate)}</td>
                  <td className="py-3 text-center">
                    <button
                      type="button"
                      onClick={() => onSelectEmployee(emp.id)}
                      className="px-3 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-lg text-[11px] font-bold transition-colors"
                    >
                      مشاهده پرونده
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

