import React, { useState, useEffect } from 'react';
import { 
  X, 
  Check, 
  CheckCircle2,
  Calendar, 
  Building, 
  DollarSign, 
  FileText, 
  User, 
  Clock, 
  ShieldCheck, 
  Plus, 
  Trash2, 
  Sparkles, 
  Printer, 
  CreditCard,
  Briefcase,
  AlertCircle
} from 'lucide-react';
import { 
  EmploymentContract, 
  ContractPeriodType, 
  EmployeeSummary, 
  FullRegistrationFormData 
} from '../../types';
import { DEFAULT_COMPANIES } from '../../services/masterDataService';
import { getEmployees, getEmployee360Profile } from '../../services/employeeService';
import { 
  buildContractFromEmployee, 
  saveContract, 
  getPeriodMonths, 
  getPeriodLabel 
} from '../../services/contractService';
import { formatRial, numberToPersianWords, toPersianDigits } from '../../utils/formatters';
import { calculateContractEndDate, getCurrentJalaliDate } from '../../utils/persianDate';
import { getContractRecommendation, ContractRecommendation } from '../../utils/contractRules';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (savedContract: EmploymentContract, andPrint?: boolean) => void;
  initialEmployeeId?: string;
  initialContract?: EmploymentContract | null;
}

export const ContractGeneratorModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onSuccess,
  initialEmployeeId,
  initialContract
}) => {
  const [employees, setEmployees] = useState<EmployeeSummary[]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>(initialEmployeeId || '');
  const [activeTab, setActiveTab] = useState<'duration' | 'parties' | 'job' | 'financials' | 'terms'>('duration');
  
  // Form State
  const [formData, setFormData] = useState<Partial<EmploymentContract>>({});
  const [recommendation, setRecommendation] = useState<ContractRecommendation | null>(null);
  const [loading, setLoading] = useState(false);
  const [customTermInput, setCustomTermInput] = useState('');

  // Load employees list for selector
  useEffect(() => {
    async function loadEmps() {
      try {
        const list = await getEmployees();
        setEmployees(list);
      } catch (e) {
        console.error('Error fetching employees for contract generator:', e);
      }
    }
    if (isOpen) {
      loadEmps();
    }
  }, [isOpen]);

  // If initialContract is passed for editing
  useEffect(() => {
    if (initialContract) {
      setFormData(initialContract);
      setSelectedEmployeeId(initialContract.employeeId);
      // calculate recommendation for initialContract employee
      loadEmployeeData(initialContract.employeeId, initialContract.periodType, false);
    } else if (initialEmployeeId) {
      setSelectedEmployeeId(initialEmployeeId);
      loadEmployeeData(initialEmployeeId, undefined, true);
    } else {
      // Default initial state
      const nowJalali = getCurrentJalaliDate();
      setFormData({
        periodType: '1_year',
        durationMonths: 12,
        periodLabel: 'یک ساله (۱۲ ماهه)',
        startDateJalali: nowJalali,
        endDateJalali: calculateContractEndDate(nowJalali, 12),
        weeklyHours: 44,
        probationDurationDays: 30,
        copyCount: 3,
        status: 'issued',
        monthlyBaseSalary: 350000000,
        housingAllowance: 90000000,
        groceryAllowance: 140000000,
        childAllowance: 0,
        grossSalaryMonthly: 580000000,
        netEstimatedSalaryMonthly: 505000000,
        customTerms: [
          'کارپذیر متعهد به حفظ محرمانگی اطلاعات، اسناد و کدهای نرم‌افزاری سازمان می‌باشد.',
          'رعایت آیین‌نامه‌های انضباطی و بهداشت حرفه‌ای کارگاه برای کارپذیر الزامی است.'
        ]
      });
      setRecommendation(null);
    }
  }, [initialContract, initialEmployeeId, isOpen]);

  const loadEmployeeData = async (
    empId: string, 
    periodOverride?: ContractPeriodType,
    autoApplyRecommendedPeriod: boolean = true
  ) => {
    if (!empId) return;
    setLoading(true);
    try {
      const fullProfile = await getEmployee360Profile(empId);
      if (fullProfile) {
        const rec = getContractRecommendation(fullProfile);
        setRecommendation(rec);

        const targetPeriod = periodOverride || (autoApplyRecommendedPeriod ? rec.periodType : '1_year');
        const prefilled = buildContractFromEmployee(fullProfile, targetPeriod, formData.startDateJalali);
        
        setFormData(prev => ({
          ...prev,
          ...prefilled
        }));
      }
    } catch (e) {
      console.error('Error loading employee profile for contract:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleEmployeeChange = async (empId: string) => {
    setSelectedEmployeeId(empId);
    if (empId) {
      await loadEmployeeData(empId, undefined, true);
    } else {
      setRecommendation(null);
    }
  };

  // Handle Preset Period Selection (1 month, 3 months, 6 months, 1 year, custom)
  const handlePeriodPresetSelect = (period: ContractPeriodType) => {
    const startDate = formData.startDateJalali || getCurrentJalaliDate();
    const months = getPeriodMonths(period);
    const endDate = calculateContractEndDate(startDate, months);
    const label = getPeriodLabel(period);

    let probation = 30;
    let title = 'قرارداد کار مدت موقت (موضوع ماده ۱۰ قانون کار)';
    if (period === '1_month') {
      title = 'قرارداد کار آزمایشی و موقت ماهانه (ماده ۱۰ و ۱۱ قانون کار)';
      probation = 30;
    } else if (period === '3_months') {
      title = 'قرارداد کار سه‌ماهه مدت موقت (ماده ۱۰ قانون کار)';
      probation = 30;
    } else if (period === '6_months') {
      title = 'قرارداد کار شش‌ماهه مدت موقت (ماده ۱۰ قانون کار)';
      probation = 30;
    } else if (period === '1_year') {
      title = 'قرارداد کار یک ساله مدت موقت (ماده ۱۰ قانون کار)';
      probation = 90;
    }

    setFormData(prev => ({
      ...prev,
      periodType: period,
      durationMonths: months,
      periodLabel: label,
      startDateJalali: startDate,
      endDateJalali: endDate,
      contractTitle: title,
      probationDurationDays: probation
    }));
  };

  const handleStartDateChange = (val: string) => {
    const months = formData.durationMonths || 12;
    const endDate = calculateContractEndDate(val, months);
    setFormData(prev => ({
      ...prev,
      startDateJalali: val,
      endDateJalali: endDate
    }));
  };

  const handleCompanyChange = (companyId: string) => {
    const comp = DEFAULT_COMPANIES.find(c => c.id === companyId);
    if (comp) {
      setFormData(prev => ({
        ...prev,
        companyId: comp.id,
        companyName: comp.name,
        companyRegistrationNumber: comp.registrationNumber || '',
        companyNationalId: comp.nationalId || '',
        companyEconomicCode: comp.economicCode || '',
        companyAddress: comp.address || '',
        companyPhone: comp.phone || '',
        employerRepresentativeName: comp.ceoName || 'مدیرعامل شرکت',
        employerRepresentativePosition: 'مدیرعامل و نماینده تام‌الاختیار'
      }));
    }
  };

  const calculateGrossAndNet = (updatedFields: Partial<EmploymentContract>) => {
    const base = Number(updatedFields.monthlyBaseSalary ?? formData.monthlyBaseSalary ?? 0);
    const housing = Number(updatedFields.housingAllowance ?? formData.housingAllowance ?? 0);
    const grocery = Number(updatedFields.groceryAllowance ?? formData.groceryAllowance ?? 0);
    const child = Number(updatedFields.childAllowance ?? formData.childAllowance ?? 0);
    const marital = Number(updatedFields.maritalAllowance ?? formData.maritalAllowance ?? 0);
    const position = Number(updatedFields.positionAllowance ?? formData.positionAllowance ?? 0);
    const attract = Number(updatedFields.attractionAllowance ?? formData.attractionAllowance ?? 0);
    const other = Number(updatedFields.otherContinuousBenefits ?? formData.otherContinuousBenefits ?? 0);

    const gross = base + housing + grocery + child + marital + position + attract + other;
    const net = Math.round(gross * 0.85); // approximate after 7% insurance & tax

    setFormData(prev => ({
      ...prev,
      ...updatedFields,
      dailyBaseWage: Math.round(base / 30),
      grossSalaryMonthly: gross,
      netEstimatedSalaryMonthly: net
    }));
  };

  const handleAddCustomTerm = () => {
    if (!customTermInput.trim()) return;
    setFormData(prev => ({
      ...prev,
      customTerms: [...(prev.customTerms || []), customTermInput.trim()]
    }));
    setCustomTermInput('');
  };

  const handleRemoveCustomTerm = (index: number) => {
    setFormData(prev => ({
      ...prev,
      customTerms: (prev.customTerms || []).filter((_, i) => i !== index)
    }));
  };

  const handleSave = async (andPrint: boolean = false) => {
    if (!formData.employeeName) {
      alert('لطفاً ابتدا کارمند مورد نظر را انتخاب نمایید.');
      return;
    }
    if (!formData.startDateJalali || !formData.endDateJalali) {
      alert('لطفاً تاریخ شروع و پایان قرارداد را مشخص نمایید.');
      return;
    }

    setLoading(true);
    try {
      const saved = await saveContract(formData);
      onSuccess(saved, andPrint);
    } catch (e) {
      console.error('Error saving contract:', e);
      alert('خطا در ذخیره‌سازی قرارداد.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden text-right" dir="rtl">
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-50 via-white to-emerald-50/40">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/20">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-800">
                {initialContract ? 'ویرایش و بازتنظیم قرارداد پرسنلی' : 'تنظیم و صدور قرارداد پرسنلی جدید'}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                تنظیم قراردادهای ماهانه (۱ ماهه)، شش ماهه (۶ ماهه)، سالانه و سفارشی مطابق قانون کار با مبالغ ریالی
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Tabs */}
        <div className="flex border-b border-slate-200 px-6 bg-slate-50/60 overflow-x-auto no-scrollbar gap-2">
          {[
            { id: 'duration', label: '۱. مدت و نوع دوره', icon: Calendar },
            { id: 'parties', label: '۲. طرفین قرارداد', icon: User },
            { id: 'job', label: '۳. شغل و محل خدمت', icon: Briefcase },
            { id: 'financials', label: '۴. حقوق و مزایا (ریال)', icon: DollarSign },
            { id: 'terms', label: '۵. مواد و تعهدات', icon: ShieldCheck }
          ].map(t => {
            const Icon = t.icon;
            const isActive = activeTab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setActiveTab(t.id as any)}
                className={`flex items-center gap-2 py-3 px-3 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'border-emerald-600 text-emerald-800 bg-white rounded-t-xl shadow-2xs'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Icon className="w-4 h-4" />
                {t.label}
              </button>
            );
          })}
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* Employee Selector Banner */}
          <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex-1">
              <label className="block text-xs font-bold text-emerald-950 mb-1.5 flex items-center gap-1.5">
                <User className="w-4 h-4 text-emerald-700" />
                انتخاب پرسنل جهت صدور قرارداد:
              </label>
              <select
                value={selectedEmployeeId}
                onChange={(e) => handleEmployeeChange(e.target.value)}
                className="w-full bg-white border border-emerald-300 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">-- انتخاب پرسنل از بانک جامع --</option>
                {employees.map(emp => (
                  <option key={emp.id} value={emp.id}>
                    {emp.firstName} {emp.lastName} (کد: {emp.employeeCode} | {emp.companyName || 'کیهان'} | {emp.positionTitle})
                  </option>
                ))}
              </select>
            </div>

            {formData.employeeName && (
              <div className="bg-white px-4 py-2.5 rounded-xl border border-emerald-200 text-xs shadow-2xs">
                <div className="font-bold text-slate-800">{formData.employeeName}</div>
                <div className="text-[11px] text-slate-500 mt-0.5">کد ملی: {formData.employeeNationalId}</div>
              </div>
            )}
          </div>

          {/* TAB 1: DURATION & CONTRACT TYPE */}
          {activeTab === 'duration' && (
            <div className="space-y-6 animate-fadeIn">
              
              {/* Smart Contract Recommendation Banner */}
              {recommendation && (
                <div className={`p-4 rounded-2xl border ${recommendation.badgeBgColor} ${recommendation.badgeBorderColor} flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs`}>
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-white/80 flex items-center justify-center shrink-0 shadow-2xs">
                      <Sparkles className="w-5 h-5 text-emerald-600 animate-pulse" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-black text-slate-800">پیشنهاد هوشمند سامانه بر اساس سابقه و رده شغلی:</span>
                        <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-black ${recommendation.badgeBgColor} ${recommendation.badgeTextColor} border ${recommendation.badgeBorderColor}`}>
                          {recommendation.periodLabel}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                        {recommendation.reason}
                      </p>
                      <div className="flex items-center gap-3 mt-1.5 text-[11px] text-slate-500 flex-wrap">
                        <span>تاریخ شروع خدمت: <strong className="font-mono text-slate-700">{recommendation.tenure.hireDateJalali}</strong></span>
                        <span>•</span>
                        <span>طول سابقه کاری: <strong className="text-slate-700">{recommendation.tenure.tenureText}</strong></span>
                        <span>•</span>
                        <span>دسته‌بندی: <strong className="text-slate-700">{recommendation.ruleCategoryLabel}</strong></span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    <button
                      type="button"
                      onClick={() => handlePeriodPresetSelect(recommendation.periodType)}
                      className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black transition-all shadow-sm cursor-pointer flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>اعمال دوره پیشنهادی</span>
                    </button>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-2">
                  دوره زمانی قرارداد (انتخاب هوشمند مدت):
                </label>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                  {/* 1 Month Preset */}
                  <button
                    type="button"
                    onClick={() => handlePeriodPresetSelect('1_month')}
                    className={`p-3.5 rounded-2xl border text-right transition-all cursor-pointer relative overflow-hidden ${
                      formData.periodType === '1_month'
                        ? 'border-blue-600 bg-blue-50/60 shadow-md ring-2 ring-blue-500/20'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-black text-slate-900">۱ ماهه (ماهانه)</span>
                      <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                    </div>
                    <p className="text-[10px] text-slate-500 leading-4">
                      سابقه کمتر از ۱ سال و آزمایشی
                    </p>
                    <div className="mt-2.5 text-[10px] font-bold text-blue-800 bg-blue-100/70 px-2 py-0.5 rounded-md inline-block">
                      ۳۰ روز آزمایشی
                    </div>
                  </button>

                  {/* 3 Months Preset */}
                  <button
                    type="button"
                    onClick={() => handlePeriodPresetSelect('3_months')}
                    className={`p-3.5 rounded-2xl border text-right transition-all cursor-pointer relative overflow-hidden ${
                      formData.periodType === '3_months'
                        ? 'border-amber-600 bg-amber-50/60 shadow-md ring-2 ring-amber-500/20'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-black text-slate-900">۳ ماهه (فصلی)</span>
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                    </div>
                    <p className="text-[10px] text-slate-500 leading-4">
                      سابقه کارکرد بالای ۱ سال پرسنل
                    </p>
                    <div className="mt-2.5 text-[10px] font-bold text-amber-800 bg-amber-100/70 px-2 py-0.5 rounded-md inline-block">
                      دوره ۳ ماهه
                    </div>
                  </button>

                  {/* 6 Months Preset */}
                  <button
                    type="button"
                    onClick={() => handlePeriodPresetSelect('6_months')}
                    className={`p-3.5 rounded-2xl border text-right transition-all cursor-pointer relative overflow-hidden ${
                      formData.periodType === '6_months'
                        ? 'border-emerald-600 bg-emerald-50/60 shadow-md ring-2 ring-emerald-500/20'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-black text-slate-900">۶ ماهه (شش ماهه)</span>
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                    </div>
                    <p className="text-[10px] text-slate-500 leading-4">
                      مدیران، معاونین و قراردادهای نیم‌سال
                    </p>
                    <div className="mt-2.5 text-[10px] font-bold text-emerald-800 bg-emerald-100/70 px-2 py-0.5 rounded-md inline-block">
                      مدت ۶ ماه
                    </div>
                  </button>

                  {/* 1 Year Preset */}
                  <button
                    type="button"
                    onClick={() => handlePeriodPresetSelect('1_year')}
                    className={`p-3.5 rounded-2xl border text-right transition-all cursor-pointer relative overflow-hidden ${
                      formData.periodType === '1_year'
                        ? 'border-purple-600 bg-purple-50/60 shadow-md ring-2 ring-purple-500/20'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-black text-slate-900">۱ ساله (سالانه)</span>
                      <span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span>
                    </div>
                    <p className="text-[10px] text-slate-500 leading-4">
                      مدیران و معاونین ارشد سازمانی
                    </p>
                    <div className="mt-2.5 text-[10px] font-bold text-purple-800 bg-purple-100/70 px-2 py-0.5 rounded-md inline-block">
                      ۱۲ ماه کامل
                    </div>
                  </button>

                  {/* Custom Preset */}
                  <button
                    type="button"
                    onClick={() => handlePeriodPresetSelect('custom')}
                    className={`p-3.5 rounded-2xl border text-right transition-all cursor-pointer relative overflow-hidden ${
                      formData.periodType === 'custom'
                        ? 'border-slate-700 bg-slate-100 shadow-md ring-2 ring-slate-400/20'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-black text-slate-900">سفارشی</span>
                      <span className="w-2.5 h-2.5 rounded-full bg-slate-400"></span>
                    </div>
                    <p className="text-[10px] text-slate-500 leading-4">
                      تاریخ شروع و پایان دلخواه
                    </p>
                    <div className="mt-2.5 text-[10px] font-bold text-slate-700 bg-slate-200/80 px-2 py-0.5 rounded-md inline-block">
                      دوره انتخابی
                    </div>
                  </button>
                </div>
              </div>

              {/* Date Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">تاریخ شروع قرارداد (شمسی):</label>
                  <input
                    type="text"
                    value={formData.startDateJalali || ''}
                    onChange={(e) => handleStartDateChange(e.target.value)}
                    placeholder="مثلاً 1404/01/01"
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">تاریخ پایان قرارداد (شمسی):</label>
                  <input
                    type="text"
                    value={formData.endDateJalali || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, endDateJalali: e.target.value }))}
                    placeholder="مثلاً 1404/06/31"
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">دوره آزمایشی (تعداد روز):</label>
                  <input
                    type="number"
                    value={formData.probationDurationDays ?? 30}
                    onChange={(e) => setFormData(prev => ({ ...prev, probationDurationDays: parseInt(e.target.value, 10) || 0 }))}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Contract Title & Number */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">عنوان رسمی قرارداد:</label>
                  <input
                    type="text"
                    value={formData.contractTitle || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, contractTitle: e.target.value }))}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">شماره سند قرارداد:</label>
                  <input
                    type="text"
                    value={formData.contractNumber || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, contractNumber: e.target.value }))}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PARTIES */}
          {activeTab === 'parties' && (
            <div className="space-y-6 animate-fadeIn">
              {/* Employer Info */}
              <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50/50 space-y-3">
                <h4 className="text-xs font-black text-slate-900 flex items-center gap-2">
                  <Building className="w-4 h-4 text-emerald-700" />
                  اطلاعات کارفرما (طرف اول):
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">شرکت کارفرما:</label>
                    <select
                      value={formData.companyId || 'comp-1'}
                      onChange={(e) => handleCompanyChange(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold focus:ring-2 focus:ring-emerald-500"
                    >
                      {DEFAULT_COMPANIES.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">نام نماینده کارفرما / مدیرعامل:</label>
                    <input
                      type="text"
                      value={formData.employerRepresentativeName || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, employerRepresentativeName: e.target.value }))}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">کد کارگاهی تأمین اجتماعی:</label>
                    <input
                      type="text"
                      value={formData.companyWorkshopCode || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, companyWorkshopCode: e.target.value }))}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Employee Info */}
              <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50/50 space-y-3">
                <h4 className="text-xs font-black text-slate-900 flex items-center gap-2">
                  <User className="w-4 h-4 text-emerald-700" />
                  اطلاعات کارپذیر / کارمند (طرف دوم):
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">نام و نام خانوادگی:</label>
                    <input
                      type="text"
                      value={formData.employeeName || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, employeeName: e.target.value }))}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">نام پدر:</label>
                    <input
                      type="text"
                      value={formData.employeeFatherName || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, employeeFatherName: e.target.value }))}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">کد ملی:</label>
                    <input
                      type="text"
                      value={formData.employeeNationalId || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, employeeNationalId: e.target.value }))}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">مدرک تحصیلی:</label>
                    <input
                      type="text"
                      value={formData.employeeEducation || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, employeeEducation: e.target.value }))}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">شماره همراه:</label>
                    <input
                      type="text"
                      value={formData.employeeMobile || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, employeeMobile: e.target.value }))}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">شماره شبا بانکی (واریز حقوق):</label>
                    <input
                      type="text"
                      value={formData.employeeIban || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, employeeIban: e.target.value }))}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 font-mono text-[11px]"
                      placeholder="IR..."
                    />
                  </div>

                  <div className="sm:col-span-3">
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">نشانی سکونت کارپذیر:</label>
                    <input
                      type="text"
                      value={formData.employeeAddress || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, employeeAddress: e.target.value }))}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: JOB & ORG */}
          {activeTab === 'job' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">عنوان سمت سازمانی:</label>
                  <input
                    type="text"
                    value={formData.positionTitle || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, positionTitle: e.target.value }))}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">دپارتمان / واحد سازمانی:</label>
                  <input
                    type="text"
                    value={formData.departmentName || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, departmentName: e.target.value }))}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">محل دقیق خدمت:</label>
                  <input
                    type="text"
                    value={formData.workLocation || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, workLocation: e.target.value }))}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">ساعت کار موظف هفتگی:</label>
                  <input
                    type="number"
                    value={formData.weeklyHours || 44}
                    onChange={(e) => setFormData(prev => ({ ...prev, weeklyHours: parseInt(e.target.value, 10) || 44 }))}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono font-bold"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">نوع شیفت و برنامه کاری:</label>
                  <input
                    type="text"
                    value={formData.shiftType || 'عادی اداری (شنبه تا چهارشنبه ۸:۰۰ الی ۱۷:۰۰)'}
                    onChange={(e) => setFormData(prev => ({ ...prev, shiftType: e.target.value }))}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">شرح وظایف و مسئولیت‌های کلیدی:</label>
                  <textarea
                    rows={3}
                    value={formData.jobResponsibilities || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, jobResponsibilities: e.target.value }))}
                    className="w-full bg-white border border-slate-300 rounded-xl p-3 text-xs leading-5"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: FINANCIALS IN RIALS */}
          {activeTab === 'financials' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-xs text-emerald-900 flex items-center justify-between">
                <span className="font-bold">کلیه مبالغ و اقلام پرداختی برحسب «ریال» محاسبه و در متن سند ثبت می‌شوند.</span>
                <span className="font-mono font-bold text-sm bg-white px-3 py-1 rounded-xl border border-emerald-300 shadow-2xs">
                  جمع ناخالص: {formatRial(formData.grossSalaryMonthly || 0)}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">حقوق مبنا / مزد پایه ماهانه (ریال):</label>
                  <input
                    type="number"
                    value={formData.monthlyBaseSalary || 0}
                    onChange={(e) => calculateGrossAndNet({ monthlyBaseSalary: parseInt(e.target.value, 10) || 0 })}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 font-mono font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500"
                  />
                  <span className="text-[11px] text-slate-500 block mt-1">
                    {numberToPersianWords(formData.monthlyBaseSalary || 0)} ریال
                  </span>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">حق مسکن مصوب ماهانه (ریال):</label>
                  <input
                    type="number"
                    value={formData.housingAllowance || 0}
                    onChange={(e) => calculateGrossAndNet({ housingAllowance: parseInt(e.target.value, 10) || 0 })}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 font-mono"
                  />
                  <span className="text-[11px] text-slate-500 block mt-1">
                    {numberToPersianWords(formData.housingAllowance || 0)} ریال
                  </span>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">بن خواربار و اقلام مصرفی (ریال):</label>
                  <input
                    type="number"
                    value={formData.groceryAllowance || 0}
                    onChange={(e) => calculateGrossAndNet({ groceryAllowance: parseInt(e.target.value, 10) || 0 })}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 font-mono"
                  />
                  <span className="text-[11px] text-slate-500 block mt-1">
                    {numberToPersianWords(formData.groceryAllowance || 0)} ریال
                  </span>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">حق اولاد / کمک عائله‌مندی (ریال):</label>
                  <input
                    type="number"
                    value={formData.childAllowance || 0}
                    onChange={(e) => calculateGrossAndNet({ childAllowance: parseInt(e.target.value, 10) || 0 })}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 font-mono"
                  />
                  <span className="text-[11px] text-slate-500 block mt-1">
                    {numberToPersianWords(formData.childAllowance || 0)} ریال
                  </span>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">حق تخصص و مسئولیت شغلی (ریال):</label>
                  <input
                    type="number"
                    value={formData.positionAllowance || 0}
                    onChange={(e) => calculateGrossAndNet({ positionAllowance: parseInt(e.target.value, 10) || 0 })}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">حق جذب و فوق‌العاده بازار (ریال):</label>
                  <input
                    type="number"
                    value={formData.attractionAllowance || 0}
                    onChange={(e) => calculateGrossAndNet({ attractionAllowance: parseInt(e.target.value, 10) || 0 })}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 font-mono"
                  />
                </div>
              </div>

              {/* Total Preview Card */}
              <div className="bg-slate-900 text-white rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <span className="text-slate-400 text-xs block">برآورد کل ناخالص و خالص پرداختی ماهانه:</span>
                  <div className="text-xl font-black text-emerald-400 font-mono mt-1">
                    {formatRial(formData.grossSalaryMonthly || 0)}
                  </div>
                  <span className="text-xs text-slate-300">
                    معادل: {numberToPersianWords(formData.grossSalaryMonthly || 0)} ریال
                  </span>
                </div>

                <div className="text-left sm:border-r sm:border-slate-700 sm:pr-6">
                  <span className="text-slate-400 text-xs block">برآورد خالص دریافتی پرسنل:</span>
                  <span className="font-mono font-bold text-base text-white">
                    {formatRial(formData.netEstimatedSalaryMonthly || 0)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: TERMS & CLAUSES */}
          {activeTab === 'terms' && (
            <div className="space-y-4 animate-fadeIn text-xs">
              <div>
                <label className="block font-bold text-slate-800 mb-2">تبصره‌ها و شرایط سفارشی الحاقی به قرارداد:</label>
                
                <div className="flex items-center gap-2 mb-3">
                  <input
                    type="text"
                    value={customTermInput}
                    onChange={(e) => setCustomTermInput(e.target.value)}
                    placeholder="متن بند یا تعهد سفارشی را وارد نمایید..."
                    className="flex-1 bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-emerald-500"
                    onKeyDown={(e) => { if (e.key === 'Enter') handleAddCustomTerm(); }}
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomTerm}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
                  >
                    افزودن بند
                  </button>
                </div>

                <div className="space-y-2">
                  {(formData.customTerms || []).map((term, index) => (
                    <div key={index} className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                      <span className="text-slate-700">{toPersianDigits(index + 1)}. {term}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveCustomTerm(index)}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-slate-200">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">تعداد نسخ چاپی قرارداد:</label>
                  <input
                    type="number"
                    value={formData.copyCount || 3}
                    onChange={(e) => setFormData(prev => ({ ...prev, copyCount: parseInt(e.target.value, 10) || 3 }))}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">یادداشت داخلی واحد منابع انسانی:</label>
                  <input
                    type="text"
                    value={formData.notes || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2"
                    placeholder="مثلاً تمدید بر اساس مصوبه هیئت مدیره..."
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-6 border-t border-slate-200 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            انصراف
          </button>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <button
              type="button"
              disabled={loading}
              onClick={() => handleSave(false)}
              className="px-5 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer disabled:opacity-50"
            >
              {loading ? 'در حال ثبت...' : 'ذخیره و صدور قرارداد'}
            </button>

            <button
              type="button"
              disabled={loading}
              onClick={() => handleSave(true)}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-md shadow-emerald-600/20 hover:scale-102 transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50"
            >
              <Printer className="w-4 h-4" />
              ذخیره و چاپ مستقیم سند
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
