import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Plus, 
  Search, 
  Filter, 
  Printer, 
  Calendar, 
  Building, 
  DollarSign, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Trash2, 
  Edit, 
  Eye, 
  RefreshCw, 
  FileSignature, 
  ShieldCheck, 
  ChevronLeft, 
  ChevronRight,
  RotateCw,
  Sparkles
} from 'lucide-react';
import { EmploymentContract, ContractPeriodType, ContractStatus } from '../../types';
import { getContracts, deleteContract, updateContractStatus } from '../../services/contractService';
import { DEFAULT_COMPANIES } from '../../services/masterDataService';
import { formatRial, toPersianDigits } from '../../utils/formatters';
import { ContractGeneratorModal } from './ContractGeneratorModal';
import { ContractPrintView } from './ContractPrintView';
import { useAuth } from '../../context/AuthContext';

interface Props {
  initialEmployeeId?: string;
  onSelectEmployee?: (employeeId: string) => void;
}

export const ContractManagement: React.FC<Props> = ({ 
  initialEmployeeId,
  onSelectEmployee 
}) => {
  const { canAccess } = useAuth();
  const [contracts, setContracts] = useState<EmploymentContract[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('all');
  const [selectedCompany, setSelectedCompany] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Modals & Active Views
  const [isGeneratorOpen, setIsGeneratorOpen] = useState(false);
  const [editingContract, setEditingContract] = useState<EmploymentContract | null>(null);
  const [activePrintContract, setActivePrintContract] = useState<EmploymentContract | null>(null);
  const [prefilledEmployeeId, setPrefilledEmployeeId] = useState<string | undefined>(initialEmployeeId);

  const fetchList = async () => {
    setLoading(true);
    try {
      const data = await getContracts();
      setContracts(data);
    } catch (e) {
      console.error('Error loading contracts:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchList();
  }, []);

  useEffect(() => {
    if (initialEmployeeId) {
      setPrefilledEmployeeId(initialEmployeeId);
      setIsGeneratorOpen(true);
    }
  }, [initialEmployeeId]);

  // Filtering
  const filteredContracts = contracts.filter((c) => {
    const matchesSearch = 
      !searchTerm ||
      c.employeeName.includes(searchTerm) ||
      c.employeeNationalId.includes(searchTerm) ||
      c.employeeCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.contractNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.positionTitle.includes(searchTerm);

    const matchesPeriod = selectedPeriod === 'all' || c.periodType === selectedPeriod;
    const matchesCompany = selectedCompany === 'all' || c.companyId === selectedCompany || c.companyName === selectedCompany;
    const matchesStatus = selectedStatus === 'all' || c.status === selectedStatus;

    return Boolean(matchesSearch && matchesPeriod && matchesCompany && matchesStatus);
  });

  const totalPages = Math.ceil(filteredContracts.length / itemsPerPage) || 1;
  const paginatedContracts = filteredContracts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // Statistics
  const countTotal = contracts.length;
  const count1Month = contracts.filter(c => c.periodType === '1_month').length;
  const count3Months = contracts.filter(c => c.periodType === '3_months').length;
  const count6Months = contracts.filter(c => c.periodType === '6_months').length;
  const count1Year = contracts.filter(c => c.periodType === '1_year').length;
  const countSigned = contracts.filter(c => c.status === 'signed').length;

  const handleDelete = async (c: EmploymentContract) => {
    if (confirm(`آیا از حذف قرارداد پرسنلی «${c.employeeName}» (شماره ${c.contractNumber}) اطمینان دارید؟`)) {
      await deleteContract(c.id);
      fetchList();
    }
  };

  const handleOpenGenerator = (empId?: string) => {
    setEditingContract(null);
    setPrefilledEmployeeId(empId);
    setIsGeneratorOpen(true);
  };

  const handleEdit = (c: EmploymentContract) => {
    setEditingContract(c);
    setPrefilledEmployeeId(c.employeeId);
    setIsGeneratorOpen(true);
  };

  const handleRenew = (c: EmploymentContract) => {
    // Open generator for same employee with next period
    setEditingContract(null);
    setPrefilledEmployeeId(c.employeeId);
    setIsGeneratorOpen(true);
  };

  const handleGeneratorSuccess = (saved: EmploymentContract, andPrint: boolean = false) => {
    setIsGeneratorOpen(false);
    setEditingContract(null);
    fetchList();
    if (andPrint) {
      setActivePrintContract(saved);
    }
  };

  // If in Print Mode
  if (activePrintContract) {
    return (
      <ContractPrintView
        contract={activePrintContract}
        onBack={() => setActivePrintContract(null)}
        onEdit={(c) => {
          setActivePrintContract(null);
          handleEdit(c);
        }}
        onStatusUpdated={() => {
          fetchList();
        }}
      />
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn text-right" dir="rtl">
      {/* Header Card */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 flex items-center gap-2.5">
            <FileText className="w-7 h-7 text-emerald-600" />
            مدیریت و صدور قراردادهای پرسنلی
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            تنظیم هوشمند قراردادهای کاری به تفکیک دوره‌های ۱ ماهه، ۶ ماهه و سالانه مطابق قانون کار با مبالغ ریالی و امکان چاپ رسمی سند
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={fetchList}
            className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors cursor-pointer"
            title="به‌روزرسانی لیست"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            type="button"
            onClick={() => handleOpenGenerator()}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-600/20 hover:scale-102 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            تنظیم و صدور قرارداد جدید
          </button>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] text-slate-500 font-bold block">کل قراردادها</span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-black text-slate-900 font-mono">{toPersianDigits(countTotal)}</span>
            <FileText className="w-5 h-5 text-slate-400" />
          </div>
          <span className="text-[10px] text-slate-400 mt-1 block">سوابق تنظیمی</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] text-blue-700 font-bold block">ماهانه (۱ ماهه)</span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-black text-blue-900 font-mono">{toPersianDigits(count1Month)}</span>
            <Clock className="w-5 h-5 text-blue-500" />
          </div>
          <span className="text-[10px] text-blue-600 mt-1 block">سابقه کمتر از ۱ سال</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] text-amber-700 font-bold block">سه ماهه (۳ ماهه)</span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-black text-amber-900 font-mono">{toPersianDigits(count3Months)}</span>
            <Calendar className="w-5 h-5 text-amber-500" />
          </div>
          <span className="text-[10px] text-amber-600 mt-1 block">سابقه بالای ۱ سال</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] text-emerald-700 font-bold block">شش ماهه (۶ ماهه)</span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-black text-emerald-900 font-mono">{toPersianDigits(count6Months)}</span>
            <Calendar className="w-5 h-5 text-emerald-500" />
          </div>
          <span className="text-[10px] text-emerald-600 mt-1 block">مدیریتی / نیم‌سال</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] text-purple-700 font-bold block">سالانه (۱ ساله)</span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-black text-purple-900 font-mono">{toPersianDigits(count1Year)}</span>
            <ShieldCheck className="w-5 h-5 text-purple-500" />
          </div>
          <span className="text-[10px] text-purple-600 mt-1 block">مدیران و معاونین ارشد</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs col-span-2 sm:col-span-1">
          <span className="text-[11px] text-emerald-800 font-bold block">امضا و تایید شده</span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-black text-emerald-950 font-mono">{toPersianDigits(countSigned)}</span>
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          </div>
          <span className="text-[10px] text-slate-400 mt-1 block">سند نهایی معتبر</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
            <input
              type="text"
              placeholder="جستجو بر اساس نام، کد پرسنلی، کد ملی، شماره قرارداد..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl pr-10 pl-4 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 transition-all"
            />
          </div>

          {/* Period Filter (1 month, 3 months, 6 months, 1 year) */}
          <div>
            <select
              value={selectedPeriod}
              onChange={(e) => { setSelectedPeriod(e.target.value); setCurrentPage(1); }}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3 py-2.5 text-xs font-bold text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
            >
              <option value="all">همه دوره‌ها (۱ ماهه، ۳ ماهه، ۶ ماهه، سالانه)</option>
              <option value="1_month">۱ ماهه (سابقه کمتر از ۱ سال / آزمایشی)</option>
              <option value="3_months">۳ ماهه (سابقه بالای ۱ سال / فصلی)</option>
              <option value="6_months">۶ ماهه (مدیران و معاونین / نیم‌سال)</option>
              <option value="1_year">۱ ساله (مدیران و معاونین ارشد / سالانه)</option>
              <option value="custom">سفارشی</option>
            </select>
          </div>

          {/* Company Filter */}
          <div>
            <select
              value={selectedCompany}
              onChange={(e) => { setSelectedCompany(e.target.value); setCurrentPage(1); }}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3 py-2.5 text-xs font-bold text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
            >
              <option value="all">همه شرکت‌های هلدینگ</option>
              {DEFAULT_COMPANIES.map(comp => (
                <option key={comp.id} value={comp.id}>{comp.name}</option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={selectedStatus}
              onChange={(e) => { setSelectedStatus(e.target.value); setCurrentPage(1); }}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3 py-2.5 text-xs font-bold text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
            >
              <option value="all">همه وضعیت‌ها</option>
              <option value="issued">ابلاغ شده</option>
              <option value="signed">امضا و تایید شده</option>
              <option value="draft">پیش‌نویس</option>
              <option value="expired">منقضی شده</option>
              <option value="terminated">خاتمه یافته</option>
            </select>
          </div>
        </div>
      </div>

      {/* Contracts Table List */}
      <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xs">
        {loading ? (
          <div className="p-16 text-center space-y-3">
            <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs font-bold text-slate-600">در حال بارگذاری قراردادهای پرسنلی...</p>
          </div>
        ) : filteredContracts.length === 0 ? (
          <div className="p-16 text-center space-y-3">
            <FileText className="w-12 h-12 text-slate-300 mx-auto" />
            <h3 className="text-sm font-bold text-slate-700">قراردادی با این مشخصات یافت نشد</h3>
            <p className="text-xs text-slate-400">می‌توانید فیلترها را تغییر داده یا قرارداد جدیدی صادر فرمایید.</p>
            <button
              type="button"
              onClick={() => handleOpenGenerator()}
              className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              صدور اولین قرارداد
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                  <th className="p-4">شماره و عنوان قرارداد</th>
                  <th className="p-4">مشخصات پرسنل</th>
                  <th className="p-4">شرکت و سمت سازمانی</th>
                  <th className="p-4">دوره زمانی</th>
                  <th className="p-4">تاریخ شروع و پایان</th>
                  <th className="p-4">حق‌السعی ماهانه (ریال)</th>
                  <th className="p-4">وضعیت</th>
                  <th className="p-4 text-center">عملیات سند</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {paginatedContracts.map((c) => (
                  <tr key={c.id} className="hover:bg-emerald-50/30 transition-colors">
                    {/* Contract Title & Number */}
                    <td className="p-4">
                      <div className="font-bold text-slate-900">{c.contractTitle}</div>
                      <div className="text-[11px] text-slate-500 font-mono mt-0.5">{c.contractNumber}</div>
                    </td>

                    {/* Employee Profile */}
                    <td className="p-4">
                      <div className="font-bold text-slate-800 flex items-center gap-1.5">
                        {c.employeeName}
                        {onSelectEmployee && (
                          <button
                            type="button"
                            onClick={() => onSelectEmployee(c.employeeId)}
                            className="text-slate-400 hover:text-emerald-600"
                            title="مشاهده پرونده ۳۶۰ درجه"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                        کد: {c.employeeCode} | کدملی: {c.employeeNationalId}
                      </div>
                    </td>

                    {/* Company & Org */}
                    <td className="p-4">
                      <div className="font-semibold text-slate-800 flex items-center gap-1">
                        <Building className="w-3.5 h-3.5 text-emerald-600" />
                        {c.companyName}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">{c.positionTitle} ({c.departmentName})</div>
                    </td>

                    {/* Period Badge */}
                    <td className="p-4">
                      {c.periodType === '1_month' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                          <Clock className="w-3 h-3" />
                          ۱ ماهه (ماهانه)
                        </span>
                      )}
                      {c.periodType === '3_months' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                          <Calendar className="w-3 h-3" />
                          ۳ ماهه (فصلی)
                        </span>
                      )}
                      {c.periodType === '6_months' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <Calendar className="w-3 h-3" />
                          ۶ ماهه (شش‌ماهه)
                        </span>
                      )}
                      {c.periodType === '1_year' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200">
                          <ShieldCheck className="w-3 h-3" />
                          ۱ ساله (سالانه)
                        </span>
                      )}
                      {c.periodType === 'custom' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-50 text-slate-700 border border-slate-200">
                          سفارشی
                        </span>
                      )}
                    </td>

                    {/* Start & End Dates */}
                    <td className="p-4 font-mono text-slate-700">
                      <div>از: <span className="font-bold text-slate-900">{c.startDateJalali}</span></div>
                      <div className="text-[11px] text-slate-500">تا: <span className="font-bold text-slate-900">{c.endDateJalali}</span></div>
                    </td>

                    {/* Salary in RIALS */}
                    <td className="p-4 font-mono">
                      <div className="font-bold text-slate-900">{formatRial(c.grossSalaryMonthly)}</div>
                      <div className="text-[10px] text-slate-400">خالص: {formatRial(c.netEstimatedSalaryMonthly)}</div>
                    </td>

                    {/* Status */}
                    <td className="p-4">
                      {c.status === 'signed' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          امضا شده
                        </span>
                      ) : c.status === 'issued' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-800 border border-blue-200">
                          <FileSignature className="w-3.5 h-3.5 text-blue-600" />
                          ابلاغ شده
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700">
                          پیش‌نویس
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {/* Print Button */}
                        <button
                          type="button"
                          onClick={() => setActivePrintContract(c)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-2xs hover:scale-103 cursor-pointer"
                          title="چاپ رسمی قرارداد (Print / PDF)"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          چاپ رسمی
                        </button>

                        {/* Edit Button */}
                        <button
                          type="button"
                          onClick={() => handleEdit(c)}
                          className="p-1.5 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                          title="ویرایش مفاد قرارداد"
                        >
                          <Edit className="w-4 h-4" />
                        </button>

                        {/* Renew Button */}
                        <button
                          type="button"
                          onClick={() => handleRenew(c)}
                          className="p-1.5 text-slate-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                          title="تمدید قرارداد برای دوره جدید"
                        >
                          <RotateCw className="w-4 h-4" />
                        </button>

                        {/* Delete Button */}
                        <button
                          type="button"
                          onClick={() => handleDelete(c)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="حذف قرارداد"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {filteredContracts.length > 0 && (
          <div className="p-4 bg-slate-50/60 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
            <div>
              نمایش {Math.min((currentPage - 1) * itemsPerPage + 1, filteredContracts.length)} تا {Math.min(currentPage * itemsPerPage, filteredContracts.length)} از مجموع {filteredContracts.length} قرارداد
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                className="p-1.5 rounded-lg border border-slate-200 hover:bg-white disabled:opacity-40 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setCurrentPage(p)}
                  className={`w-7 h-7 rounded-lg text-xs font-bold transition-colors ${
                    currentPage === p ? 'bg-emerald-600 text-white shadow-2xs' : 'hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  {toPersianDigits(p)}
                </button>
              ))}

              <button
                type="button"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                className="p-1.5 rounded-lg border border-slate-200 hover:bg-white disabled:opacity-40 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Generator Modal */}
      {isGeneratorOpen && (
        <ContractGeneratorModal
          isOpen={isGeneratorOpen}
          onClose={() => {
            setIsGeneratorOpen(false);
            setEditingContract(null);
          }}
          onSuccess={handleGeneratorSuccess}
          initialEmployeeId={prefilledEmployeeId}
          initialContract={editingContract}
        />
      )}
    </div>
  );
};
