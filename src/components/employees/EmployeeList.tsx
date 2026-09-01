import React, { useState, useEffect } from 'react';
import { 
  Search, Filter, Plus, Download, Eye, Trash2, Edit, 
  MoreVertical, CheckCircle2, AlertCircle, RefreshCw, 
  UserCheck, UserX, Clock, Building, ShieldCheck, ChevronLeft, ChevronRight, FileSpreadsheet,
  Upload, Coins
} from 'lucide-react';
import { EmployeeSummary, EmploymentStatus } from '../../types';
import { getEmployees, deleteEmployeeRecord, updateEmployeeStatus } from '../../services/employeeService';
import { exportEmployeesToExcel, exportEmployeesToCSV } from '../../services/exportService';
import { DEFAULT_DEPARTMENTS, DEFAULT_BRANCHES, DEFAULT_COMPANIES } from '../../services/masterDataService';
import { useAuth } from '../../context/AuthContext';
import { toJalaliDate } from '../../utils/persianDate';
import { formatRial } from '../../utils/formatters';
import { ExcelImportModal } from './ExcelImportModal';
import { FileSignature } from 'lucide-react';

interface Props {
  onSelectEmployee: (employeeId: string) => void;
  onNewEmployee?: () => void;
  onOpenContract?: (employeeId: string) => void;
}

export const EmployeeList: React.FC<Props> = ({ onSelectEmployee, onNewEmployee, onOpenContract }) => {

  const { role, canAccess } = useAuth();
  const [employees, setEmployees] = useState<EmployeeSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCompany, setSelectedCompany] = useState('all');
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [selectedBranch, setSelectedBranch] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedContract, setSelectedContract] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [isExcelImportOpen, setIsExcelImportOpen] = useState(false);
  const itemsPerPage = 10;

  const fetchList = async () => {
    setLoading(true);
    try {
      const data = await getEmployees();
      setEmployees(Array.isArray(data) ? data : (data as any)?.employees || []);
    } catch (e) {
      console.error('Error fetching employees:', e);
      setEmployees([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchList();
  }, []);

  // Filtering Logic
  const safeEmployees = Array.isArray(employees) ? employees : [];
  const filteredEmployees = safeEmployees.filter((emp) => {
    if (!emp) return false;
    const matchesSearch = 
      !searchTerm ||
      (emp.firstName && emp.firstName.includes(searchTerm)) ||
      (emp.lastName && emp.lastName.includes(searchTerm)) ||
      (emp.employeeCode && emp.employeeCode.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (emp.nationalId && emp.nationalId.includes(searchTerm)) ||
      (emp.companyName && emp.companyName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (emp.mobile && emp.mobile.includes(searchTerm));

    const matchesCompany = selectedCompany === 'all' || emp.companyId === selectedCompany || emp.companyName === selectedCompany;
    const matchesDept = selectedDepartment === 'all' || emp.departmentId === selectedDepartment;
    const matchesBranch = selectedBranch === 'all' || emp.branchId === selectedBranch;
    const matchesStatus = selectedStatus === 'all' || emp.employmentStatus === selectedStatus;
    const matchesContract = selectedContract === 'all' || emp.contractType === selectedContract;

    return Boolean(matchesSearch && matchesCompany && matchesDept && matchesBranch && matchesStatus && matchesContract);
  });

  const totalPages = Math.ceil(filteredEmployees.length / itemsPerPage) || 1;
  const paginatedEmployees = filteredEmployees.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleDelete = async (emp: EmployeeSummary) => {
    if (!canAccess('employee.delete')) {
      alert('شما دسترسی حذف پرسنل را ندارید.');
      return;
    }
    if (confirm(`آیا از حذف پرونده پرسنلی «${emp.firstName} ${emp.lastName}» (کد ${emp.employeeCode}) اطمینان دارید؟`)) {
      await deleteEmployeeRecord(emp.id);
      fetchList();
    }
  };

  const handleStatusChange = async (empId: string, newStatus: EmploymentStatus) => {
    if (!canAccess('employee.update')) return;
    await updateEmployeeStatus(empId, newStatus);
    fetchList();
  };

  const getStatusBadge = (status: EmploymentStatus) => {
    switch (status) {
      case 'active':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>فعال</span>;
      case 'on_leave':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200"><Clock className="w-3 h-3" />مرخصی</span>;
      case 'suspended':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200"><AlertCircle className="w-3 h-3" />تعلیق</span>;
      case 'terminated':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200"><UserX className="w-3 h-3" />خاتمه</span>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Header Card */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 flex items-center gap-2">
            <Building className="w-7 h-7 text-emerald-600" />
            بانک جامع پرسنل و پرونده‌های استخدامی
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            مشاهده، جستجوی پیشرفته، فیلترینگ، خروجی اکسل و مدیریت ۳۶۰ درجه کلیه شاغلین سازمان ({employees.length} نفر ثبت‌شده)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {canAccess('employee.create') && (
            <button
              type="button"
              onClick={() => setIsExcelImportOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-600/20 hover:scale-102 cursor-pointer"
            >
              <Upload className="w-4 h-4" />
              ورود پرسنل از اکسل
            </button>
          )}

          <button
            type="button"
            onClick={() => exportEmployeesToExcel(filteredEmployees)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            خروجی اکسل ({filteredEmployees.length})
          </button>

          <button
            type="button"
            onClick={fetchList}
            className="p-2.5 text-slate-600 hover:text-emerald-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            title="بروزرسانی لیست"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          {canAccess('employee.create') && (
            <button
              type="button"
              onClick={() => setIsExcelImportOpen(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-extrabold shadow-sm transition-all hover:scale-102 cursor-pointer"
            >
              <Upload className="w-4 h-4" />
              ورود پرسنل جدید (اکسل)
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
          {/* Search Box */}
          <div className="relative sm:col-span-2 lg:col-span-2">
            <input
              type="text"
              placeholder="جستجو بر اساس نام، شرکت، کدملی، کدپرسنلی..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="w-full pl-4 pr-10 py-2.5 rounded-xl border border-slate-300 focus:border-emerald-500 focus:outline-none text-xs text-slate-800"
            />
            <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
          </div>

          {/* Company Filter */}
          <div>
            <select
              value={selectedCompany}
              onChange={(e) => { setSelectedCompany(e.target.value); setCurrentPage(1); }}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-300 focus:border-emerald-500 focus:outline-none text-xs text-slate-800 bg-white font-medium"
            >
              <option value="all">همه شرکت‌ها</option>
              {DEFAULT_COMPANIES.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Department Filter */}
          <div>
            <select
              value={selectedDepartment}
              onChange={(e) => { setSelectedDepartment(e.target.value); setCurrentPage(1); }}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-300 focus:border-emerald-500 focus:outline-none text-xs text-slate-800 bg-white"
            >
              <option value="all">همه دپارتمان‌ها</option>
              {DEFAULT_DEPARTMENTS.map(d => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>

          {/* Branch Filter */}
          <div>
            <select
              value={selectedBranch}
              onChange={(e) => { setSelectedBranch(e.target.value); setCurrentPage(1); }}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-300 focus:border-emerald-500 focus:outline-none text-xs text-slate-800 bg-white"
            >
              <option value="all">همه شعب / دفاتر</option>
              {DEFAULT_BRANCHES.map(b => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={selectedStatus}
              onChange={(e) => { setSelectedStatus(e.target.value); setCurrentPage(1); }}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-300 focus:border-emerald-500 focus:outline-none text-xs text-slate-800 bg-white"
            >
              <option value="all">همه وضعیت‌ها</option>
              <option value="active">فعال و شاغل</option>
              <option value="on_leave">مرخصی</option>
              <option value="suspended">تعلیق</option>
              <option value="terminated">خاتمه همکاری</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table Card */}
      <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xs">
        {loading ? (
          <div className="p-12 text-center text-slate-500 flex flex-col items-center justify-center gap-3">
            <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin" />
            <span className="text-xs font-semibold">در حال بارگذاری اطلاعات پرسنل از پایگاه داده...</span>
          </div>
        ) : filteredEmployees.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <UserX className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-bold text-slate-700">پرسنلی با مشخصات جستجو شده یافت نشد</p>
            <p className="text-xs text-slate-400 mt-1">می‌توانید فیلترهای اعمال شده را پاکسازی کرده یا پرسنل جدید ثبت نمایید.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                  <th className="p-4">پرسنل</th>
                  <th className="p-4">کد پرسنلی / ملی</th>
                  <th className="p-4">شرکت محل فعالیت</th>
                  <th className="p-4">دپارتمان و سمت</th>
                  <th className="p-4">خالص دریافتی (ریال)</th>
                  <th className="p-4">نوع قرارداد</th>
                  <th className="p-4">تاریخ استخدام</th>
                  <th className="p-4">وضعیت</th>
                  <th className="p-4 text-center">عملیات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {paginatedEmployees.map((emp) => (
                  <tr 
                    key={emp.id}
                    className="hover:bg-emerald-50/30 transition-colors group cursor-pointer"
                    onClick={() => onSelectEmployee(emp.id)}
                  >
                    {/* Employee Profile */}
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
                          {emp.profileImageUrl ? (
                            <img src={emp.profileImageUrl} alt={emp.firstName} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center font-bold text-slate-600 bg-emerald-100 text-emerald-800">
                              {emp.firstName?.[0] || 'پ'}
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="font-bold text-slate-800 group-hover:text-emerald-700 transition-colors">
                            {emp.firstName} {emp.lastName}
                          </div>
                          <div className="text-[11px] text-slate-400 font-mono mt-0.5">{emp.mobile}</div>
                        </div>
                      </div>
                    </td>

                    {/* Codes */}
                    <td className="p-4 font-mono text-slate-700">
                      <div className="font-bold text-slate-800">{emp.employeeCode}</div>
                      <div className="text-[11px] text-slate-400">{emp.nationalId}</div>
                    </td>

                    {/* Company */}
                    <td className="p-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200/80 rounded-lg text-xs font-bold">
                        <Building className="w-3.5 h-3.5 text-emerald-600" />
                        {emp.companyName || 'شرکت اصلی هلدینگ'}
                      </span>
                    </td>

                    {/* Org */}
                    <td className="p-4">
                      <div className="font-semibold text-slate-800">{emp.positionTitle}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">{emp.departmentName} ({emp.branchName || 'دفتر مرکزی'})</div>
                      {emp.hasSupplementaryInsurance && (
                        <div className="mt-1">
                          <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 font-medium">
                            بیمه تکمیلی: {emp.supplementaryInsurancePaymentMethod || 'کسر از حقوق'}
                          </span>
                        </div>
                      )}
                    </td>

                    {/* Net Salary in Rials */}
                    <td className="p-4 font-mono">
                      <span className="font-bold text-slate-800 block">
                        {formatRial(emp.netSalary || emp.baseSalary || 0)}
                      </span>
                    </td>

                    {/* Contract */}
                    <td className="p-4">
                      <span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg text-[11px] font-medium">
                        {emp.contractType || 'قراردادی'}
                      </span>
                    </td>

                    {/* Hire Date */}
                    <td className="p-4 text-slate-600 font-medium">
                      {emp.hireDateJalali || toJalaliDate(emp.hireDate)}
                    </td>

                    {/* Status */}
                    <td className="p-4">
                      {getStatusBadge(emp.employmentStatus)}
                    </td>

                    {/* Actions */}
                    <td className="p-4 text-center" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => onSelectEmployee(emp.id)}
                          className="p-1.5 text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                          title="مشاهده پرونده ۳۶۰ درجه"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {onOpenContract && (
                          <button
                            type="button"
                            onClick={() => onOpenContract(emp.id)}
                            className="p-1.5 text-emerald-700 hover:text-emerald-800 hover:bg-emerald-100/60 rounded-lg transition-colors cursor-pointer"
                            title="تنظیم و چاپ قرارداد پرسنلی"
                          >
                            <FileSignature className="w-4 h-4" />
                          </button>
                        )}

                        {canAccess('employee.delete') && (

                          <button
                            type="button"
                            onClick={() => handleDelete(emp)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="حذف پرونده"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        <div className="p-4 bg-slate-50/60 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div>
            نمایش {Math.min((currentPage - 1) * itemsPerPage + 1, filteredEmployees.length)} تا {Math.min(currentPage * itemsPerPage, filteredEmployees.length)} از مجموع {filteredEmployees.length} پرسنل
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
                {p}
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
      </div>

      {/* Excel Import Modal */}
      <ExcelImportModal
        isOpen={isExcelImportOpen}
        onClose={() => setIsExcelImportOpen(false)}
        onSuccess={(summary) => {
          fetchList();
        }}
      />
    </div>
  );
};
