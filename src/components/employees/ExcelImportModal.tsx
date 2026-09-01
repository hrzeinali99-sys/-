import React, { useState, useRef } from 'react';
import { 
  FileSpreadsheet, Upload, Download, CheckCircle2, AlertCircle, 
  AlertTriangle, X, ChevronRight, RefreshCw, Users, FileText, 
  Search, ArrowLeft, ShieldCheck, Check, Trash2, Heart
} from 'lucide-react';
import { 
  generateEmployeeExcelTemplate, 
  parseAndValidateEmployeeExcelFile, 
  importEmployeesBatch, 
  ParsedEmployeeRow, 
  ImportSummaryResult 
} from '../../services/excelImportService';
import { useAuth } from '../../context/AuthContext';
import { formatToman } from '../../utils/formatters';

interface Props {
  isOpen?: boolean;
  isInline?: boolean;
  onClose: () => void;
  onSuccess: (summary: ImportSummaryResult) => void;
}

export const ExcelImportModal: React.FC<Props> = ({ 
  isOpen = true, 
  isInline = false, 
  onClose, 
  onSuccess 
}) => {
  const { profile, role, canAccess } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<'upload' | 'preview' | 'importing' | 'completed'>('upload');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [parseResults, setParseResults] = useState<{
    rows: ParsedEmployeeRow[];
    totalRows: number;
    validCount: number;
    warningCount: number;
    errorCount: number;
  } | null>(null);

  const [statusFilter, setStatusFilter] = useState<'all' | 'valid' | 'warning' | 'error'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [updateExisting, setUpdateExisting] = useState(true);
  const [skipErrors, setSkipErrors] = useState(true);
  const [progress, setProgress] = useState(0);
  const [importResult, setImportResult] = useState<ImportSummaryResult | null>(null);

  if (!isOpen && !isInline) return null;

  const handleFileChange = async (file: File) => {
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      alert('لطفاً یک فایل معتبر اکسل با فرمت xlsx. یا xls. انتخاب نمایید.');
      return;
    }

    setSelectedFile(file);
    setLoading(true);
    try {
      const results = await parseAndValidateEmployeeExcelFile(file);
      setParseResults(results);
      setStep('preview');
    } catch (err: any) {
      alert(`خطا در خواندن فایل اکسل: ${err.message || 'فایل آسیب‌دیده یا فرمت نامعتبر است.'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleStartImport = async () => {
    if (!parseResults || parseResults.rows.length === 0) return;

    setStep('importing');
    setProgress(10);

    const actor = {
      uid: profile?.uid || 'admin',
      displayName: profile?.displayName || 'مدیر سیستم',
      role: role || 'super_admin'
    };

    try {
      const res = await importEmployeesBatch(
        parseResults.rows,
        actor,
        {
          updateExisting,
          skipErrors,
          onProgress: (proc, tot) => {
            const p = Math.round((proc / tot) * 90) + 10;
            setProgress(p);
          }
        }
      );

      setImportResult(res);
      setStep('completed');
      onSuccess(res);
    } catch (err: any) {
      alert(`خطا در حین ثبت پرسنل: ${err.message}`);
      setStep('preview');
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setParseResults(null);
    setImportResult(null);
    setProgress(0);
    setStep('upload');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Filtered rows for preview table
  const filteredRows = parseResults?.rows.filter((row) => {
    if (statusFilter !== 'all' && row.status !== statusFilter) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return (
        row.firstName.toLowerCase().includes(term) ||
        row.lastName.toLowerCase().includes(term) ||
        row.employeeCode.toLowerCase().includes(term) ||
        row.nationalId.includes(term) ||
        row.departmentName.toLowerCase().includes(term) ||
        row.positionTitle.toLowerCase().includes(term)
      );
    }
    return true;
  }) || [];

  const cardContent = (
    <div className={`bg-white border border-slate-200 rounded-3xl overflow-hidden flex flex-col ${
      isInline ? 'w-full shadow-sm' : 'w-full max-w-5xl shadow-2xl max-h-[92vh]'
    }`}>
      {/* Modal / Card Header */}
      <div className="px-6 py-4.5 bg-gradient-to-r from-emerald-900 to-emerald-950 text-white flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-700/60 border border-emerald-500/30 flex items-center justify-center text-emerald-300">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-base sm:text-lg">
              ورود دسته‌ای و گروهی پرسنل از طریق فایل اکسل
            </h3>
            <p className="text-xs text-emerald-200/70">
              تعریف خودکار پرونده‌های پرسنلی، احکام، سازمان و اطلاعات هویتی با بررسی اعتبارسنجی
            </p>
          </div>
        </div>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
            title="بستن و بازگشت"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Wizard Step Progress Tracker */}
      <div className="bg-slate-50 border-b border-slate-200 px-6 py-3 shrink-0 flex items-center justify-between text-xs font-bold text-slate-500">
        <div className="flex items-center gap-2">
          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
            step === 'upload' ? 'bg-emerald-600 text-white font-black' : 'bg-emerald-100 text-emerald-800'
          }`}>
            ۱
          </span>
          <span className={step === 'upload' ? 'text-emerald-900 font-extrabold' : ''}>بارگذاری فایل اکسل</span>
        </div>

        <ChevronRight className="w-4 h-4 text-slate-300 rotate-180" />

        <div className="flex items-center gap-2">
          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
            step === 'preview' ? 'bg-emerald-600 text-white font-black' : (step === 'importing' || step === 'completed') ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
          }`}>
            ۲
          </span>
          <span className={step === 'preview' ? 'text-emerald-900 font-extrabold' : ''}>پیش‌نمایش و بررسی صحت</span>
        </div>

        <ChevronRight className="w-4 h-4 text-slate-300 rotate-180" />

        <div className="flex items-center gap-2">
          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
            (step === 'importing' || step === 'completed') ? 'bg-emerald-600 text-white font-black' : 'bg-slate-200 text-slate-600'
          }`}>
            ۳
          </span>
          <span className={step === 'completed' ? 'text-emerald-900 font-extrabold' : ''}>ورود نهایی به سامانه</span>
        </div>
      </div>

      {/* Modal Body Container */}
      <div className="p-6 overflow-y-auto flex-1 space-y-6">
          
          {/* ========================================================= */}
          {/* STEP 1: UPLOAD & INSTRUCTIONS */}
          {/* ========================================================= */}
          {step === 'upload' && (
            <div className="space-y-6">
              {/* Template Download Banner */}
              <div className="p-5 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200/80 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3.5">
                  <div className="p-2.5 rounded-xl bg-emerald-600 text-white shrink-0 mt-0.5">
                    <Download className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-emerald-950 text-sm">
                      دانلود فایل خام و نمونه استاندارد اکسل
                    </h4>
                    <p className="text-xs text-emerald-800/80 mt-1 max-w-xl leading-relaxed">
                      برای جلوگیری از خطاهای فرمتی، ابتدا قالب اکسل از پیش تنظیم‌شده سامانه همکار را دریافت و اطلاعات کارکنان را در آن وارد فرمایید.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={generateEmployeeExcelTemplate}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-all shadow-sm shrink-0 hover:scale-102"
                >
                  <Download className="w-4 h-4" />
                  دانلود قالب اکسل (XLSX)
                </button>
              </div>

              {/* Drag and Drop File Upload Area */}
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-3xl p-8 sm:p-12 text-center cursor-pointer transition-all ${
                  isDragging
                    ? 'border-emerald-500 bg-emerald-50/50 scale-[1.01]'
                    : 'border-slate-300 hover:border-emerald-500 hover:bg-slate-50/80'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx, .xls"
                  onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) {
                      handleFileChange(e.target.files[0]);
                    }
                  }}
                  className="hidden"
                />

                <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-800 mx-auto flex items-center justify-center mb-4">
                  {loading ? (
                    <RefreshCw className="w-8 h-8 animate-spin text-emerald-600" />
                  ) : (
                    <Upload className="w-8 h-8 text-emerald-600" />
                  )}
                </div>

                <h4 className="text-base font-extrabold text-slate-800">
                  {loading ? 'در حال خواندن و اعتبارسنجی فایل اکسل...' : 'فایل اکسل کارکنان را اینجا بکشید یا کلیک کنید'}
                </h4>
                <p className="text-xs text-slate-400 mt-2">
                  فرمت‌های مجاز: <span className="font-mono font-bold text-slate-600">.XLSX, .XLS</span> (پشتیبانی کامل از ارقام فارسی و تاریخ‌های شمسی)
                </p>
              </div>

              {/* Guidelines Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2">
                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    اعتبارسنجی کدهای ملی
                  </span>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    سیستم به صورت خودکار صحت رقم کنترلی و طول کدهای ملی ۱۰ رقمی را بررسی می‌کند.
                  </p>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-blue-600" />
                    تاریخ‌های شمسی و میلادی
                  </span>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    تاریخ استخدام و تولد پرسنل به فرمت <span className="font-mono">۱۴۰۴/۰۱/۱۵</span> خودکار تبدیل می‌شوند.
                  </p>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Heart className="w-4 h-4 text-rose-600" />
                    تولد همسر و فرزندان
                  </span>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    امکان درج تاریخ تولد همسر و فرزندان در ستون‌های اختصاصی و ایجاد خودکار پرونده تحت تکفل.
                  </p>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-purple-600" />
                    تشخیص پرسنل موجود
                  </span>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    در صورت تکراری بودن کد پرسنلی، می‌توانید پرونده را بروزرسانی یا رد کنید.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* STEP 2: PREVIEW & VALIDATION RESULTS */}
          {/* ========================================================= */}
          {step === 'preview' && parseResults && (
            <div className="space-y-5">
              {/* Summary Metric Chips */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <button
                  type="button"
                  onClick={() => setStatusFilter('all')}
                  className={`p-3.5 rounded-2xl border text-right transition-all cursor-pointer ${
                    statusFilter === 'all'
                      ? 'border-slate-800 bg-slate-900 text-white shadow-md'
                      : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <span className="text-[11px] block font-semibold">کل رکوردهای خوانده‌شده</span>
                  <span className="text-xl font-black font-mono block mt-1">{parseResults.totalRows} نفر</span>
                </button>

                <button
                  type="button"
                  onClick={() => setStatusFilter('valid')}
                  className={`p-3.5 rounded-2xl border text-right transition-all cursor-pointer ${
                    statusFilter === 'valid'
                      ? 'border-emerald-700 bg-emerald-700 text-white shadow-md'
                      : 'border-emerald-200 bg-emerald-50 text-emerald-900 hover:bg-emerald-100/70'
                  }`}
                >
                  <span className="text-[11px] block font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    معتبر و بدون نقص
                  </span>
                  <span className="text-xl font-black font-mono block mt-1">{parseResults.validCount} نفر</span>
                </button>

                <button
                  type="button"
                  onClick={() => setStatusFilter('warning')}
                  className={`p-3.5 rounded-2xl border text-right transition-all cursor-pointer ${
                    statusFilter === 'warning'
                      ? 'border-amber-700 bg-amber-600 text-white shadow-md'
                      : 'border-amber-200 bg-amber-50 text-amber-900 hover:bg-amber-100/70'
                  }`}
                >
                  <span className="text-[11px] block font-semibold flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                    دارای هشدار / پرسنل موجود
                  </span>
                  <span className="text-xl font-black font-mono block mt-1">{parseResults.warningCount} نفر</span>
                </button>

                <button
                  type="button"
                  onClick={() => setStatusFilter('error')}
                  className={`p-3.5 rounded-2xl border text-right transition-all cursor-pointer ${
                    statusFilter === 'error'
                      ? 'border-rose-700 bg-rose-600 text-white shadow-md'
                      : 'border-rose-200 bg-rose-50 text-rose-900 hover:bg-rose-100/70'
                  }`}
                >
                  <span className="text-[11px] block font-semibold flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
                    دارای خطای ساختاری
                  </span>
                  <span className="text-xl font-black font-mono block mt-1">{parseResults.errorCount} نفر</span>
                </button>
              </div>

              {/* Table Search and Filters */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                <div className="relative flex-1 max-w-sm">
                  <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="جستجو در نام، کد پرسنلی، کد ملی یا دپارتمان..."
                    className="w-full h-9 pr-9 pl-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 text-slate-800"
                  />
                </div>

                <div className="text-xs text-slate-500 font-medium">
                  نمایش {filteredRows.length} از مجموع {parseResults.totalRows} رکورد
                </div>
              </div>

              {/* Preview Table */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs max-h-80 overflow-y-auto">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-100/80 sticky top-0 z-10 border-b border-slate-200 text-slate-600 font-bold">
                    <tr>
                      <th className="py-2.5 px-3">ردیف</th>
                      <th className="py-2.5 px-3">کد پرسنلی</th>
                      <th className="py-2.5 px-3">نام و نام خانوادگی</th>
                      <th className="py-2.5 px-3">کد ملی</th>
                      <th className="py-2.5 px-3">شماره تماس</th>
                      <th className="py-2.5 px-3">دپارتمان و سمت</th>
                      <th className="py-2.5 px-3">وضعیت تأهل و خانواده</th>
                      <th className="py-2.5 px-3">تاریخ استخدام</th>
                      <th className="py-2.5 px-3 text-center">وضعیت صحت</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredRows.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="py-8 text-center text-slate-400 font-medium">
                          رکوردی با فیلتر انتخابی یافت نشد.
                        </td>
                      </tr>
                    ) : (
                      filteredRows.map((row) => (
                        <tr key={row.rowNumber} className={`hover:bg-slate-50 transition-colors ${
                          row.status === 'error' ? 'bg-rose-50/30' : row.status === 'warning' ? 'bg-amber-50/20' : ''
                        }`}>
                          <td className="py-2.5 px-3 font-mono text-slate-400">{row.rowNumber}</td>
                          <td className="py-2.5 px-3 font-mono font-bold text-slate-800">{row.employeeCode}</td>
                          <td className="py-2.5 px-3 font-bold text-slate-800">
                            {row.firstName} {row.lastName}
                          </td>
                          <td className="py-2.5 px-3 font-mono text-slate-600">{row.nationalId}</td>
                          <td className="py-2.5 px-3 font-mono text-slate-600">{row.mobile}</td>
                          <td className="py-2.5 px-3">
                            <div className="text-slate-800 font-medium">{row.positionTitle}</div>
                            <div className="text-[10px] text-slate-400">{row.departmentName}</div>
                          </td>
                          <td className="py-2.5 px-3">
                            <div className="flex flex-col gap-0.5">
                              <div className="flex items-center gap-1.5 text-slate-700">
                                <span className="font-semibold">{row.maritalStatus}</span>
                                {row.childrenCount > 0 && (
                                  <span className="text-[10px] text-purple-700 bg-purple-50 px-1.5 py-0.2 rounded border border-purple-100 font-mono">
                                    {row.childrenCount} فرزند
                                  </span>
                                )}
                              </div>
                              {row.spouseBirthDateJalali && (
                                <div className="text-[10px] text-rose-600 flex items-center gap-1">
                                  <span>تولد همسر:</span>
                                  <span className="font-mono">{row.spouseBirthDateJalali}</span>
                                </div>
                              )}
                              {row.childrenBirthDatesJalali && row.childrenBirthDatesJalali.length > 0 && (
                                <div className="text-[10px] text-blue-600 flex items-center gap-1">
                                  <span>تولد فرزندان:</span>
                                  <span className="font-mono">{row.childrenBirthDatesJalali.join(' ، ')}</span>
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="py-2.5 px-3 font-mono text-slate-500">{row.hireDateJalali}</td>
                          <td className="py-2.5 px-3 text-center">
                            {row.status === 'valid' && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <Check className="w-3 h-3 text-emerald-600" />
                                معتبر
                              </span>
                            )}
                            {row.status === 'warning' && (
                              <div className="group relative inline-block">
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200 cursor-help">
                                  <AlertTriangle className="w-3 h-3 text-amber-600" />
                                  هشدار
                                </span>
                                <div className="hidden group-hover:block absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 p-2 bg-slate-900 text-white text-[10px] rounded-lg shadow-xl z-20 text-right">
                                  {row.warnings.join(' | ')}
                                </div>
                              </div>
                            )}
                            {row.status === 'error' && (
                              <div className="group relative inline-block">
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200 cursor-help">
                                  <AlertCircle className="w-3 h-3 text-rose-600" />
                                  خطا
                                </span>
                                <div className="hidden group-hover:block absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-2 bg-rose-950 text-rose-100 text-[10px] rounded-lg shadow-xl z-20 text-right border border-rose-800">
                                  {row.errors.join(' | ')}
                                </div>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Import Options & Strategies */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <span className="text-xs font-bold text-slate-800 block">تنظیمات و شیوه ورود داده‌ها به سیستم:</span>
                <div className="flex flex-col sm:flex-row sm:items-center gap-4 text-xs">
                  <label className="flex items-center gap-2 cursor-pointer select-none text-slate-700">
                    <input
                      type="checkbox"
                      checked={updateExisting}
                      onChange={(e) => setUpdateExisting(e.target.checked)}
                      className="rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>بروزرسانی پرونده‌های موجود در صورت تطابق کد پرسنلی</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer select-none text-slate-700">
                    <input
                      type="checkbox"
                      checked={skipErrors}
                      onChange={(e) => setSkipErrors(e.target.checked)}
                      className="rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>صرف‌نظر خودکار از رکوردهای دارای خطای بحرانی ({parseResults.errorCount} مورد)</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* STEP 3: IMPORTING PROGRESS */}
          {/* ========================================================= */}
          {step === 'importing' && (
            <div className="py-12 text-center space-y-6 max-w-md mx-auto">
              <div className="w-16 h-16 rounded-3xl bg-emerald-100 text-emerald-700 mx-auto flex items-center justify-center animate-bounce">
                <RefreshCw className="w-8 h-8 animate-spin" />
              </div>
              <div className="space-y-2">
                <h4 className="text-base font-black text-slate-800">
                  در حال ایجاد پرونده‌های پرسنلی و انتساب به دپارتمان‌ها...
                </h4>
                <p className="text-xs text-slate-500">
                  لطفاً تا اتمام کامل فرآیند و ثبت در پایگاه داده منتظر بمانید.
                </p>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-slate-200 h-3 rounded-full overflow-hidden">
                <div 
                  className="bg-emerald-600 h-full transition-all duration-300 rounded-full"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className="text-xs font-mono font-bold text-emerald-800 block">{progress}٪</span>
            </div>
          )}

          {/* ========================================================= */}
          {/* STEP 4: COMPLETED SUMMARY */}
          {/* ========================================================= */}
          {step === 'completed' && importResult && (
            <div className="py-6 text-center space-y-6 max-w-lg mx-auto">
              <div className="w-20 h-20 rounded-3xl bg-emerald-100 text-emerald-700 mx-auto flex items-center justify-center shadow-lg shadow-emerald-600/20">
                <CheckCircle2 className="w-12 h-12 text-emerald-600" />
              </div>

              <div className="space-y-2">
                <h3 className="text-xl font-black text-slate-900">
                  عملیات ورود پرسنل با موفقیت انجام پذیرفت
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  کلیه رکوردهای معتبر پردازش شده و به بانک جامع پرسنل و ساختار سازمانی پیوستند.
                </p>
              </div>

              {/* Result Statistics Grid */}
              <div className="grid grid-cols-3 gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs">
                <div className="p-2 space-y-1">
                  <span className="text-slate-400 font-semibold block">پرسنل جدید ثبت‌شده</span>
                  <span className="text-lg font-black text-emerald-700 font-mono block">
                    +{importResult.successCount} نفر
                  </span>
                </div>

                <div className="p-2 space-y-1 border-r border-slate-200">
                  <span className="text-slate-400 font-semibold block">پرونده‌های بروزرسانی‌شده</span>
                  <span className="text-lg font-black text-blue-700 font-mono block">
                    {importResult.updatedCount} نفر
                  </span>
                </div>

                <div className="p-2 space-y-1 border-r border-slate-200">
                  <span className="text-slate-400 font-semibold block">صرف‌نظر شده / نامعتبر</span>
                  <span className="text-lg font-black text-slate-600 font-mono block">
                    {importResult.skippedCount} نفر
                  </span>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer Controls */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          {step === 'upload' && (
            <>
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-bold transition-colors"
              >
                انصراف و بازگشت
              </button>

              <button
                type="button"
                onClick={generateEmployeeExcelTemplate}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-800"
              >
                <Download className="w-3.5 h-3.5" />
                دانلود مجدد فایل نمونه اکسل
              </button>
            </>
          )}

          {step === 'preview' && (
            <>
              <button
                type="button"
                onClick={handleReset}
                className="px-5 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
              >
                <ArrowLeft className="w-4 h-4 rotate-180" />
                انتخاب فایل دیگر
              </button>

              <button
                type="button"
                onClick={handleStartImport}
                disabled={parseResults?.validCount === 0 && parseResults?.warningCount === 0}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-extrabold shadow-md shadow-emerald-600/20 transition-all hover:scale-102 cursor-pointer"
              >
                <Upload className="w-4 h-4" />
                تایید و ثبت نهایی در سامانه ({parseResults ? parseResults.validCount + (updateExisting ? parseResults.warningCount : 0) : 0} نفر)
              </button>
            </>
          )}

          {step === 'completed' && (
            <div className="w-full flex items-center justify-between">
              <button
                type="button"
                onClick={handleReset}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800"
              >
                ورود فایل دیگر
              </button>

              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-extrabold shadow-md transition-all"
              >
                مشاهده بانک پرسنل و بستن
              </button>
            </div>
          )}
        </div>
      </div>
    );

  if (isInline) {
    return cardContent;
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 animate-fadeIn">
      {cardContent}
    </div>
  );
};
