import React, { useState, useEffect } from 'react';
import { 
  User, Phone, MapPin, Users, Briefcase, Layers, GraduationCap, History, 
  Sparkles, ShieldCheck, CreditCard, DollarSign, FileText, PhoneCall, 
  FileBadge, CheckSquare, Printer, Edit, Trash2, ArrowRight, ShieldAlert, 
  Clock, Download, Eye, Plus, CheckCircle2, Lock, Building, Calendar, AlertTriangle, Heart, Umbrella,
  Coins, FileCheck
} from 'lucide-react';
import { 
  Employee, FullRegistrationFormData, EmployeeSummary, 
  AddressInfo, FamilyMember, EducationRecord, WorkExperienceRecord, 
  SkillRecord, LanguageRecord, BankAccountInfo, EmployeeDocument, 
  EmergencyContact, AuditLogEntry, EmploymentStatus 
} from '../../types';
import { 
  getEmployee360Profile, 
  updateEmployeeStatus, 
  deleteEmployeeRecord 
} from '../../services/employeeService';
import { getAuditLogsForEntity } from '../../services/auditService';
import { getDocumentExpiryStatus } from '../../services/documentService';
import { formatToman, formatRial, formatFileSize } from '../../utils/formatters';
import { toJalaliDate, toJalaliDateTime, calculateAge, calculateAgeFromJalali } from '../../utils/persianDate';
import { useAuth } from '../../context/AuthContext';
import { EmployeeEditModal } from './EmployeeEditModal';

interface Props {
  employeeId: string;
  onBack: () => void;
  onEdit: (employeeId: string) => void;
  onOpenContract?: (employeeId: string) => void;
}

export const Employee360Profile: React.FC<Props> = ({ employeeId, onBack, onEdit, onOpenContract }) => {
  const { user, role, canAccess } = useAuth();
  const [profileData, setProfileData] = useState<Partial<FullRegistrationFormData> | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>('identity');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!canAccess('employee.delete')) {
      alert('شما دسترسی مجاز برای حذف پرسنل را ندارید.');
      return;
    }

    const confirmed = window.confirm(`آیا از حذف کامل پرونده «${profileData?.firstName} ${profileData?.lastName}» (کد ${profileData?.employeeCode}) اطمینان قطعی دارید؟\nاین عملیات غیرقابل بازگشت است.`);
    if (!confirmed) return;

    setDeleting(true);
    try {
      const success = await deleteEmployeeRecord(employeeId, {
        uid: user?.uid || 'admin',
        displayName: user?.displayName || 'مدیر سیستم',
        role: role || 'super_admin'
      });
      if (success) {
        alert('پرونده پرسنل با موفقیت حذف گردید.');
        onBack();
      } else {
        alert('خطا در حذف پرونده پرسنل.');
      }
    } catch (e: any) {
      alert(e.message || 'خطا در حذف پرونده');
    } finally {
      setDeleting(false);
    }
  };


  const fetchProfile = async () => {
    setLoading(true);
    try {
      const data = await getEmployee360Profile(employeeId);
      setProfileData(data);
      const logs = await getAuditLogsForEntity(employeeId);
      setAuditLogs(logs);
    } catch (e) {
      console.error('Error loading employee 360 profile:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [employeeId]);

  if (loading) {
    return (
      <div className="bg-white border border-slate-200 rounded-3xl p-16 text-center space-y-3">
        <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs font-bold text-slate-600">در حال بارگذاری پرونده ۳۶۰ درجه پرسنل...</p>
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center space-y-4">
        <AlertTriangle className="w-12 h-12 text-rose-500 mx-auto" />
        <h3 className="text-base font-bold text-slate-800">پرونده پرسنل یافت نشد</h3>
        <button onClick={onBack} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold">
          بازگشت به لیست پرسنل
        </button>
      </div>
    );
  }

  const isHrPrivileged = ['super_admin', 'hr_admin', 'hr_manager'].includes(role);

  const tabs = [
    { id: 'identity', label: 'اطلاعات هویتی و سکونت', icon: User },
    { id: 'employment', label: 'جایگاه سازمانی و قرارداد', icon: Briefcase },
    { id: 'salary', label: 'حقوق، مزایا و بانک', icon: DollarSign },
    { id: 'guarantee', label: 'سفته ضمانت و تضامین', icon: ShieldCheck },
    { id: 'education', label: 'سوابق تحصیلی و تجربیات', icon: GraduationCap },
    { id: 'family', label: 'خانواده و تکفل', icon: Users },
    { id: 'skills', label: 'مهارت‌ها و زبان‌ها', icon: Sparkles },
    { id: 'documents', label: `بایگانی اسناد (${profileData.documents?.length || 0})`, icon: FileText },
    { id: 'emergency', label: 'تماس اضطراری', icon: PhoneCall },
    { id: 'additional', label: 'تکمیلی و یادداشت HR', icon: FileBadge },
    { id: 'audit', label: `لاگ ممیزی (${auditLogs.length})`, icon: History },
  ];

  const handlePrintCertificate = () => {
    window.print();
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-emerald-700 bg-white hover:bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-2xl shadow-2xs transition-colors cursor-pointer"
        >
          <ArrowRight className="w-4 h-4" />
          بازگشت به بانک پرسنل
        </button>

        <div className="flex flex-wrap items-center gap-2">
          {canAccess('employee.update') && (
            <button
              type="button"
              onClick={() => setIsEditModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/20 transition-all cursor-pointer"
            >
              <Edit className="w-4 h-4" />
              ویرایش کامل پرونده
            </button>
          )}

          {onOpenContract && (
            <button
              type="button"
              onClick={() => onOpenContract(employeeId)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
            >
              <FileBadge className="w-4 h-4" />
              تنظیم و چاپ قرارداد کاری
            </button>
          )}

          <button
            type="button"
            onClick={handlePrintCertificate}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-bold shadow-2xs transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4 text-slate-500" />
            چاپ پرونده پرسنلی
          </button>

          {canAccess('employee.delete') && (
            <button
              type="button"
              disabled={deleting}
              onClick={handleDelete}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-rose-50 text-rose-700 hover:bg-rose-100/80 border border-rose-200 rounded-xl text-xs font-bold transition-colors disabled:opacity-50 cursor-pointer"
            >
              <Trash2 className="w-4 h-4 text-rose-600" />
              <span>{deleting ? 'در حال حذف...' : 'حذف پرونده'}</span>
            </button>
          )}
        </div>
      </div>


      {/* Employee 360 Header Profile Card */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs relative overflow-hidden">
        <div className="absolute top-0 right-0 left-0 h-2 bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-400" />

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pt-2">
          <div className="flex items-center gap-5">
            {/* Avatar */}
            <div className="w-24 h-24 rounded-3xl overflow-hidden bg-slate-100 border-2 border-emerald-100 shadow-md shrink-0">
              {profileData.profileImageUrl ? (
                <img src={profileData.profileImageUrl} alt="عکس پرسنلی" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center font-bold text-2xl text-emerald-800 bg-emerald-100">
                  {profileData.firstName?.[0] || 'پ'}
                </div>
              )}
            </div>

            {/* Name and Basic Title */}
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-black text-slate-900">
                  {profileData.firstName} {profileData.lastName}
                </h1>
                <span className="px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full text-xs font-bold">
                  {profileData.employment?.employmentStatus === 'active' ? 'فعال و شاغل' : profileData.employment?.employmentStatus}
                </span>
              </div>

              <div className="text-sm font-semibold text-emerald-700 mt-1 flex items-center gap-2">
                <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-bold flex items-center gap-1">
                  <Building className="w-3.5 h-3.5 text-emerald-600" />
                  {profileData.organization?.companyName || 'شرکت اصلی هلدینگ'}
                </span>
                <span className="text-slate-300">•</span>
                <span>{profileData.organization?.positionTitle || 'سمت سازمانی'}</span>
                <span className="text-slate-300">•</span>
                <span className="text-slate-600 font-normal">{profileData.organization?.departmentName}</span>
              </div>

              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 mt-3 font-mono">
                <span className="bg-slate-100 px-2.5 py-1 rounded-lg">کد پرسنلی: {profileData.employeeCode}</span>
                <span className="bg-slate-100 px-2.5 py-1 rounded-lg">کد ملی: {profileData.nationalId}</span>
                <span className="bg-slate-100 px-2.5 py-1 rounded-lg">موبایل: {profileData.contacts?.mobile}</span>
              </div>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 w-full md:w-auto text-left">
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
              <span className="text-[11px] text-slate-400 block">تاریخ استخدام</span>
              <span className="font-bold text-xs text-slate-800 mt-0.5 block font-mono">
                {profileData.employment?.hireDate ? toJalaliDate(profileData.employment.hireDate) : '-'}
              </span>
            </div>
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
              <span className="text-[11px] text-slate-400 block">شعبه محل خدمت</span>
              <span className="font-bold text-xs text-slate-800 mt-0.5 block">
                {profileData.organization?.branchName || 'دفتر مرکزی'}
              </span>
            </div>
            <div className="p-3 bg-amber-50/60 rounded-2xl border border-amber-200 col-span-2 sm:col-span-1">
              <span className="text-[11px] text-amber-800 font-medium block">مبلغ سفته ضمانت</span>
              <span className="font-black text-xs text-amber-950 mt-0.5 block font-mono">
                {formatToman(profileData.summary?.guaranteeNoteAmount || profileData.additionalInfo?.guaranteeNoteAmount || 1000000000)} تومان
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation Bar */}
      <div className="bg-white border border-slate-200 rounded-3xl p-3 shadow-xs overflow-x-auto no-scrollbar">
        <div className="flex items-center min-w-max gap-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Contents */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs">
        {/* Tab 1: Identity & Residence */}
        {activeTab === 'identity' && (
          <div className="space-y-6">
            <h3 className="font-bold text-slate-800 text-base border-b pb-3 border-slate-100">
              اطلاعات سجلی، شناسنامه‌ای و آدرس‌های سکونت
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 text-xs">
              <div className="p-4 bg-slate-50 rounded-2xl">
                <span className="text-slate-400 block">نام لاتین</span>
                <span className="font-bold text-slate-800 text-sm mt-1 block font-mono">
                  {profileData.latinFirstName || '-'} {profileData.latinLastName || '-'}
                </span>
              </div>
              <div className="p-4 bg-slate-50 rounded-2xl">
                <span className="text-slate-400 block">نام پدر</span>
                <span className="font-bold text-slate-800 text-sm mt-1 block">{profileData.fatherName || '-'}</span>
              </div>
              <div className="p-4 bg-slate-50 rounded-2xl">
                <span className="text-slate-400 block">شماره شناسنامه / سری و سریال</span>
                <span className="font-bold text-slate-800 text-sm mt-1 block font-mono">
                  {profileData.idNumber || '-'} ({profileData.idSerialSeries || '-'} / {profileData.idSerialNumber || '-'})
                </span>
              </div>
              <div className="p-4 bg-slate-50 rounded-2xl">
                <span className="text-slate-400 block">تاریخ تولد</span>
                <span className="font-bold text-slate-800 text-sm mt-1 block">
                  {profileData.birthDate ? toJalaliDate(profileData.birthDate) : '-'}
                </span>
              </div>
              <div className="p-4 bg-slate-50 rounded-2xl">
                <span className="text-slate-400 block">استان و شهر محل تولد</span>
                <span className="font-bold text-slate-800 text-sm mt-1 block">
                  {profileData.birthProvince} - {profileData.birthCity}
                </span>
              </div>
              <div className="p-4 bg-slate-50 rounded-2xl">
                <span className="text-slate-400 block">وضعیت تأهل و تعداد فرزندان</span>
                <span className="font-bold text-slate-800 text-sm mt-1 block">
                  {profileData.maritalStatus} ({profileData.childrenCount || 0} فرزند)
                </span>
              </div>
            </div>

            {/* Addresses */}
            <div className="pt-4 space-y-3">
              <h4 className="font-bold text-slate-800 text-sm">آدرس‌های ثبت‌شده</h4>
              {profileData.addresses?.map((addr) => (
                <div key={addr.id} className="p-4 border border-slate-200 rounded-2xl flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div className="text-xs space-y-1">
                    <span className="font-bold text-slate-800">{addr.title} ({addr.province} - {addr.city})</span>
                    <p className="text-slate-600">{addr.fullAddress} - پلاک {addr.buildingNumber || '-'} واحد {addr.unitNumber || '-'}</p>
                    <span className="text-slate-400 font-mono block">کد پستی: {addr.postalCode || '-'}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 2: Employment & Org */}
        {activeTab === 'employment' && (
          <div className="space-y-6">
            <h3 className="font-bold text-slate-800 text-base border-b pb-3 border-slate-100">
              اطلاعات قرارداد، چارت سازمانی و سرپرستی
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 text-xs">
              <div className="p-4 bg-slate-50 rounded-2xl">
                <span className="text-slate-400 block">شرکت تابع</span>
                <span className="font-bold text-slate-800 text-sm mt-1 block">{profileData.organization?.companyName}</span>
              </div>
              <div className="p-4 bg-slate-50 rounded-2xl">
                <span className="text-slate-400 block">دپارتمان / واحد کاری</span>
                <span className="font-bold text-slate-800 text-sm mt-1 block">{profileData.organization?.departmentName}</span>
              </div>
              <div className="p-4 bg-slate-50 rounded-2xl">
                <span className="text-slate-400 block">تیم تخصصی</span>
                <span className="font-bold text-slate-800 text-sm mt-1 block">{profileData.organization?.teamName}</span>
              </div>
              <div className="p-4 bg-slate-50 rounded-2xl">
                <span className="text-slate-400 block">سمت شغلی و رتبه</span>
                <span className="font-bold text-slate-800 text-sm mt-1 block">
                  {profileData.organization?.positionTitle} ({profileData.organization?.jobLevel})
                </span>
              </div>
              <div className="p-4 bg-slate-50 rounded-2xl">
                <span className="text-slate-400 block">مدیر مستقیم (گزارش‌دهی)</span>
                <span className="font-bold text-slate-800 text-sm mt-1 block">{profileData.organization?.directManagerName}</span>
              </div>
              <div className="p-4 bg-slate-50 rounded-2xl">
                <span className="text-slate-400 block">مرکز هزینه</span>
                <span className="font-bold text-slate-800 text-sm mt-1 block font-mono">{profileData.organization?.costCenterCode}</span>
              </div>
              <div className="p-4 bg-slate-50 rounded-2xl">
                <span className="text-slate-400 block">نوع قرارداد</span>
                <span className="font-bold text-slate-800 text-sm mt-1 block">{profileData.employment?.contractType}</span>
              </div>
              <div className="p-4 bg-slate-50 rounded-2xl">
                <span className="text-slate-400 block">شماره قرارداد</span>
                <span className="font-bold text-slate-800 text-sm mt-1 block font-mono">{profileData.employment?.contractNumber}</span>
              </div>
              <div className="p-4 bg-slate-50 rounded-2xl">
                <span className="text-slate-400 block">نوع شیفت کاری</span>
                <span className="font-bold text-slate-800 text-sm mt-1 block">{profileData.organization?.shiftType}</span>
              </div>
            </div>

            {/* Contract Management Quick Card */}
            <div className="p-5 bg-gradient-to-br from-slate-900 to-emerald-950 text-white rounded-2xl shadow-md border border-emerald-800/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <span className="text-emerald-400 text-xs font-bold flex items-center gap-1.5 mb-1">
                  <FileText className="w-4 h-4" />
                  مدیریت و صدور قرارداد پرسنلی مطابق قانون کار
                </span>
                <h4 className="text-sm font-bold text-white">
                  تنظیم قرارداد ۱ ماهه، ۶ ماهه یا سالانه با مبالغ ریالی و چاپ سند رسمی
                </h4>
                <p className="text-[11px] text-slate-300 mt-1">
                  تولید خودکار پیش‌نویس با استفاده از اطلاعات سجلی، سازمانی و احکام حقوقی این پرسنل
                </p>
              </div>

              {onOpenContract && (
                <button
                  type="button"
                  onClick={() => onOpenContract(employeeId)}
                  className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-500/20 hover:scale-103 cursor-pointer shrink-0"
                >
                  تنظیم / چاپ قرارداد پرسنلی
                </button>
              )}
            </div>
          </div>
        )}


        {/* Tab 3: Salary & Banking & Insurance */}
        {activeTab === 'salary' && (
          <div className="space-y-6">
            <h3 className="font-bold text-slate-800 text-base border-b pb-3 border-slate-100">
              احکام حقوقی، مزایا، بیمه تأمین اجتماعی، بیمه تکمیلی و حساب بانکی
            </h3>

            {/* Banking Card */}
            <div className="p-5 bg-emerald-50/50 border border-emerald-200 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <CreditCard className="w-8 h-8 text-emerald-600 shrink-0" />
                <div>
                  <h4 className="font-bold text-slate-800 text-sm">{profileData.bankAccounts?.[0]?.bankName || 'بانک تجارت'} ({profileData.bankAccounts?.[0]?.branchName || 'شعبه مرکزی'})</h4>
                  <p className="text-xs text-slate-600 mt-0.5">نام صاحب حساب: {profileData.bankAccounts?.[0]?.accountHolderName || `${profileData.firstName} ${profileData.lastName}`}</p>
                </div>
              </div>

              <div className="font-mono text-left space-y-1 text-xs">
                <div className="font-bold text-slate-800 tracking-wider">شبا: {profileData.bankAccounts?.[0]?.iban || '-'}</div>
                <div className="text-slate-500">شماره حساب: {profileData.bankAccounts?.[0]?.accountNumber || '-'}</div>
              </div>
            </div>

            {/* Salary Breakdown */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
              <div className="p-4 bg-slate-50 rounded-2xl">
                <span className="text-slate-400 block">حقوق پایه ماهانه (ریال)</span>
                <span className="font-bold text-slate-800 text-sm mt-1 block font-mono">
                  {formatRial(profileData.salary?.baseSalary || 0)}
                </span>
              </div>
              <div className="p-4 bg-slate-50 rounded-2xl">
                <span className="text-slate-400 block">حق مسکن و خواربار (ریال)</span>
                <span className="font-bold text-slate-800 text-sm mt-1 block font-mono">
                  {formatRial((profileData.salary?.housingAllowance || 0) + (profileData.salary?.groceryAllowance || 0))}
                </span>
              </div>
              <div className="p-4 bg-slate-50 rounded-2xl">
                <span className="text-slate-400 block">سهم بیمه کارمند (۷٪)</span>
                <span className="font-bold text-rose-700 text-sm mt-1 block font-mono">
                  - {formatRial(profileData.salary?.insuranceDeduction || 0)}
                </span>
              </div>
              <div className="p-4 bg-emerald-600 text-white rounded-2xl shadow-xs">
                <span className="text-emerald-100 block">خالص پرداختی نهایی (ریال)</span>
                <span className="font-black text-base mt-1 block font-mono">
                  {formatRial(profileData.salary?.netSalary || 0)}
                </span>
              </div>
            </div>

            {/* Insurance & Supplementary Insurance Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs pt-2">
              {/* Primary Social Security Insurance */}
              <div className="p-5 border border-slate-200 rounded-2xl bg-white space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-emerald-600" />
                    <h4 className="font-bold text-slate-800 text-sm">بیمه پایه (تأمین اجتماعی)</h4>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full font-bold text-[11px] ${
                    profileData.insurance?.status === 'active' || profileData.insurance?.status === 'فعال'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-slate-100 text-slate-600'
                  }`}>
                    {profileData.insurance?.status === 'active' || profileData.insurance?.status === 'فعال' ? 'لیست بیمه فعال' : 'غیرفعال / در انتظار'}
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-500">نوع بیمه پایه:</span>
                    <span className="font-bold text-slate-800">{profileData.insurance?.insuranceType || 'تأمین اجتماعی'}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-500">شماره بیمه:</span>
                    <span className="font-bold text-slate-800 font-mono">{profileData.insurance?.insuranceNumber || '-'}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-500">شعبه بیمه‌گذار:</span>
                    <span className="font-semibold text-slate-700">{profileData.insurance?.insuranceBranch || 'شعبه ۲۲ تهران'}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-500">سوابق قبلی:</span>
                    <span className="font-semibold text-slate-700 font-mono">
                      {profileData.insurance?.previousExperienceMonths || 0} ماه سابقه
                    </span>
                  </div>
                </div>
              </div>

              {/* Supplementary Insurance (بیمه تکمیلی و نحوه پرداخت) */}
              <div className={`p-5 border rounded-2xl bg-white space-y-3 ${
                profileData.insurance?.hasSupplementaryInsurance || profileData.summary?.hasSupplementaryInsurance
                  ? 'border-blue-200 bg-blue-50/20'
                  : 'border-slate-200'
              }`}>
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <Umbrella className="w-5 h-5 text-blue-600" />
                    <h4 className="font-bold text-slate-800 text-sm">بیمه درمان تکمیلی</h4>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full font-bold text-[11px] ${
                    profileData.insurance?.hasSupplementaryInsurance || profileData.summary?.hasSupplementaryInsurance
                      ? 'bg-blue-100 text-blue-800 border border-blue-200'
                      : 'bg-slate-100 text-slate-600'
                  }`}>
                    {profileData.insurance?.hasSupplementaryInsurance || profileData.summary?.hasSupplementaryInsurance
                      ? 'دارای بیمه تکمیلی'
                      : 'فاقد بیمه تکمیلی'}
                  </span>
                </div>

                {(profileData.insurance?.hasSupplementaryInsurance || profileData.summary?.hasSupplementaryInsurance) ? (
                  <div className="space-y-2">
                    <div className="flex justify-between py-1 border-b border-slate-50">
                      <span className="text-slate-500">شرکت بیمه‌گر تکمیلی:</span>
                      <span className="font-bold text-slate-800">
                        {profileData.insurance?.supplementaryInsuranceCompany || profileData.summary?.supplementaryInsuranceCompany || 'بیمه ایران'}
                      </span>
                    </div>

                    <div className="flex justify-between py-1 border-b border-slate-50">
                      <span className="text-slate-500">طرح پوشش انتخابی:</span>
                      <span className="font-semibold text-slate-700">
                        {profileData.insurance?.supplementaryInsurancePlan || 'طرح طلایی درمان'}
                      </span>
                    </div>

                    <div className="flex justify-between py-1 border-b border-slate-50">
                      <span className="text-slate-500">نحوه پرداخت حق بیمه:</span>
                      <span className={`px-2 py-0.5 rounded-md font-bold text-[11px] ${
                        (profileData.insurance?.supplementaryInsurancePaymentMethod || profileData.insurance?.supplementaryPaymentMethod || profileData.summary?.supplementaryInsurancePaymentMethod) === 'کسر از حقوق'
                          ? 'bg-amber-100 text-amber-900 border border-amber-300'
                          : (profileData.insurance?.supplementaryInsurancePaymentMethod || profileData.insurance?.supplementaryPaymentMethod || profileData.summary?.supplementaryInsurancePaymentMethod) === 'پرداخت توسط شرکت'
                          ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                          : 'bg-blue-100 text-blue-900 border border-blue-300'
                      }`}>
                        {profileData.insurance?.supplementaryInsurancePaymentMethod || profileData.insurance?.supplementaryPaymentMethod || profileData.summary?.supplementaryInsurancePaymentMethod || 'کسر از حقوق'}
                      </span>
                    </div>

                    <div className="flex justify-between py-1">
                      <span className="text-slate-500">مبلغ حق بیمه تکمیلی ماهانه:</span>
                      <span className="font-bold text-slate-800 font-mono">
                        {(profileData.insurance?.supplementaryInsurancePremium || profileData.summary?.supplementaryInsurancePremium)
                          ? `${formatRial(profileData.insurance?.supplementaryInsurancePremium || profileData.summary?.supplementaryInsurancePremium || 0)} ریال`
                          : 'طبق تعرفه گروهی سازمان'}
                      </span>
                    </div>
                  </div>
                ) : (
                  <p className="text-slate-400 text-xs py-4 text-center">
                    این پرسنل در طرح بیمه درمان تکمیلی سازمان ثبت‌نام نکرده است.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tab: Promissory Note Guarantee (سفته ضمانت و تضامین حسن انجام کار) */}
        {activeTab === 'guarantee' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-4 border-slate-100">
              <div>
                <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-amber-600" />
                  پرونده سفته ضمانت حسن انجام کار و اسناد تعهدات
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  ثبت رسمی مبالغ، شماره لاشه، نام ضامن، وضعیت فیزیکی و تحویل در صندوق امانات
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                  (profileData.summary?.guaranteeNoteStatus || profileData.additionalInfo?.guaranteeNoteStatus || 'received') === 'received'
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : (profileData.summary?.guaranteeNoteStatus || profileData.additionalInfo?.guaranteeNoteStatus) === 'returned'
                    ? 'bg-blue-50 text-blue-800 border-blue-200'
                    : 'bg-rose-50 text-rose-800 border-rose-200'
                }`}>
                  {(profileData.summary?.guaranteeNoteStatus || profileData.additionalInfo?.guaranteeNoteStatus || 'received') === 'received'
                    ? 'تحویل شده و موجود در صندوق'
                    : (profileData.summary?.guaranteeNoteStatus || profileData.additionalInfo?.guaranteeNoteStatus) === 'returned'
                    ? 'عودت داده شده به پرسنل'
                    : 'در انتظار دریافت لاشه'}
                </span>
              </div>
            </div>

            {/* Main Promissory Note Highlight Banner */}
            <div className="p-6 bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-emerald-500/10 border-2 border-amber-300/80 rounded-3xl relative overflow-hidden shadow-xs">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div className="space-y-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500 text-white rounded-xl text-xs font-bold shadow-xs">
                    <Coins className="w-3.5 h-3.5" />
                    مبلغ قطعی سفته حسن انجام کار
                  </span>

                  <div className="flex items-baseline gap-3 pt-1">
                    <span className="text-3xl sm:text-4xl font-black text-slate-900 font-mono tracking-tight">
                      {formatRial(profileData.summary?.guaranteeNoteAmount || profileData.additionalInfo?.guaranteeNoteAmount || 1000000000)}
                    </span>
                    <span className="text-sm font-bold text-slate-600">ریال</span>
                    <span className="text-sm font-black text-amber-900 bg-amber-100/90 px-3 py-1 rounded-xl border border-amber-300">
                      معادل {formatToman(profileData.summary?.guaranteeNoteAmount || profileData.additionalInfo?.guaranteeNoteAmount || 1000000000)} تومان
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 pt-1">
                    سند تعهد مالی بابت تضمین حسن انجام کار، حفظ اسرار سازمانی و رعایت مفاد قرارداد استخدامی.
                  </p>
                </div>

                <div className="flex flex-col gap-2 shrink-0 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white text-slate-800 border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-bold shadow-2xs transition-all cursor-pointer"
                  >
                    <Printer className="w-4 h-4 text-slate-600" />
                    چاپ رسید رسمی امانت سفته
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(true)}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-md shadow-amber-600/20 transition-all cursor-pointer"
                  >
                    <Edit className="w-4 h-4" />
                    ویرایش مبلغ و اطلاعات سفته
                  </button>
                </div>
              </div>
            </div>

            {/* Detailed Promissory Note Attributes Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-1">
                <span className="text-slate-400 block text-[11px]">شماره لاشه / شناسه یکتای سفته</span>
                <span className="font-bold text-slate-900 font-mono text-sm block">
                  {profileData.summary?.guaranteeNoteNumber || profileData.additionalInfo?.guaranteeNoteNumber || `SAF-${profileData.employeeCode || '140301'}`}
                </span>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-1">
                <span className="text-slate-400 block text-[11px]">نام و مشخصات ضامن</span>
                <span className="font-bold text-slate-900 text-sm block">
                  {profileData.summary?.guaranteeNoteGuarantorName || profileData.additionalInfo?.guaranteeNoteGuarantorName || 'ضامن معتبر شخص ثالث'}
                </span>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-1">
                <span className="text-slate-400 block text-[11px]">تاریخ تحویل به واحد منابع انسانی</span>
                <span className="font-bold text-slate-900 font-mono text-sm block">
                  {profileData.summary?.guaranteeNoteReceivedDateJalali || profileData.additionalInfo?.guaranteeNoteReceivedDateJalali || (profileData.employment?.hireDate ? toJalaliDate(profileData.employment.hireDate) : '1403/01/15')}
                </span>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-1">
                <span className="text-slate-400 block text-[11px]">تاریخ سررسید / اعتبار سفته</span>
                <span className="font-bold text-slate-900 font-mono text-sm block">
                  {profileData.summary?.guaranteeNoteDueDateJalali || profileData.additionalInfo?.guaranteeNoteDueDateJalali || 'همزمان با تسویه حساب نهایی'}
                </span>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-1 sm:col-span-2">
                <span className="text-slate-400 block text-[11px]">محل فیزیکی نگهداری و توضیحات</span>
                <span className="font-semibold text-slate-800 text-xs block leading-relaxed">
                  {profileData.summary?.guaranteeNoteDescription || profileData.additionalInfo?.guaranteeNoteDescription || 'لاشه سفته در گاوصندوق مرکزی واحد کارگزینی و منابع انسانی نگهداری می‌شود.'}
                </span>
              </div>
            </div>

            {/* Security Guarantee Advisory Note */}
            <div className="p-4 bg-blue-50/50 border border-blue-200 rounded-2xl flex items-start gap-3">
              <FileBadge className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
              <div className="text-xs space-y-1 text-slate-700">
                <span className="font-bold text-blue-900 block">نکات حقوقی و حراستی سفته ضمانت:</span>
                <p className="leading-relaxed">
                  بر اساس تبصره‌های قانون کار، سفته ضمانت حسن انجام کار صرفاً جنبه امانی داشته و در پایان دوره همکاری و پس از صدور برگه تسویه حساب نهایی، بلافاصله باید به صورت رسمی به پرسنل عودت گردد.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Education & Experience */}
        {activeTab === 'education' && (
          <div className="space-y-6">
            <h3 className="font-bold text-slate-800 text-base border-b pb-3 border-slate-100">
              سوابق تحصیلی و تجربیات کاری
            </h3>

            {/* Education */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <GraduationCap className="w-4 h-4 text-emerald-600" />
                مدارک تحصیلی
              </h4>
              {(!profileData.education || profileData.education.length === 0) ? (
                <p className="text-xs text-slate-400 italic">مدرک تحصیلی ثبت نشده است.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {profileData.education.map((edu) => (
                    <div key={edu.id} className="p-4 border border-slate-200 rounded-2xl space-y-1 text-xs">
                      <span className="font-bold text-slate-800 text-sm block">{edu.degree} - {edu.fieldOfStudy}</span>
                      <p className="text-slate-600">{edu.institutionName} ({edu.graduationYear ? `فارغ‌التحصیل ${edu.graduationYear}` : ''})</p>
                      {edu.gpa && <span className="text-slate-400 font-mono block">معدل: {edu.gpa}</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Experience */}
            <div className="space-y-3 pt-4 border-t border-slate-100">
              <h4 className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Briefcase className="w-4 h-4 text-blue-600" />
                سوابق شغلی پیشین
              </h4>
              {(!profileData.workExperiences || profileData.workExperiences.length === 0) ? (
                <p className="text-xs text-slate-400 italic">سابقه کاری قبلی ثبت نشده است.</p>
              ) : (
                <div className="space-y-3">
                  {profileData.workExperiences.map((exp) => (
                    <div key={exp.id} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between text-xs">
                      <div>
                        <span className="font-bold text-slate-800 block text-sm">{exp.positionTitle}</span>
                        <span className="text-slate-600 block mt-0.5">{exp.companyName}</span>
                      </div>
                      <span className="font-mono text-slate-500 bg-white px-2.5 py-1 rounded-lg border border-slate-200">
                        {exp.startDate ? toJalaliDate(exp.startDate) : '-'} تا {exp.endDate ? toJalaliDate(exp.endDate) : 'اکنون'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 5: Family & Dependents */}
        {activeTab === 'family' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b pb-3 border-slate-100">
              <div>
                <h3 className="font-bold text-slate-800 text-base">
                  اطلاعات خانواده، همسر، فرزندان و افراد تحت تکفل
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  شامل تاریخ‌های تولد شمسی و میلادی، سن افراد و وضعیت بیمه تکمیلی
                </p>
              </div>

              {profileData.maritalStatus && (
                <span className="px-3 py-1 bg-purple-50 text-purple-800 border border-purple-200 rounded-full text-xs font-bold">
                  وضعیت: {profileData.maritalStatus} ({profileData.childrenCount || 0} فرزند)
                </span>
              )}
            </div>

            {/* Quick summary for spouse and children dates if present in summary doc */}
            {(profileData.spouseBirthDateJalali || profileData.childBirthDateJalali || (profileData.childrenBirthDatesJalali && profileData.childrenBirthDatesJalali.length > 0)) && (
              <div className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-2xl grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                {profileData.spouseBirthDateJalali && (
                  <div className="flex items-center gap-3">
                    <Heart className="w-5 h-5 text-rose-600 shrink-0" />
                    <div>
                      <span className="text-slate-500 block text-[11px]">تاریخ تولد همسر:</span>
                      <span className="font-bold text-slate-800 font-mono text-sm">
                        {profileData.spouseBirthDateJalali} 
                        <span className="text-xs text-purple-700 mr-2 font-normal">
                          ({calculateAgeFromJalali(profileData.spouseBirthDateJalali)} ساله)
                        </span>
                      </span>
                    </div>
                  </div>
                )}

                {profileData.childrenBirthDatesJalali && profileData.childrenBirthDatesJalali.length > 0 && (
                  <div className="flex items-center gap-3">
                    <Users className="w-5 h-5 text-blue-600 shrink-0" />
                    <div>
                      <span className="text-slate-500 block text-[11px]">تاریخ تولد فرزندان:</span>
                      <div className="flex flex-wrap gap-1.5 mt-0.5">
                        {profileData.childrenBirthDatesJalali.map((cDate, idx) => (
                          <span key={idx} className="font-bold text-slate-800 font-mono bg-white px-2 py-0.5 rounded border border-emerald-200 text-xs">
                            فرزند {idx + 1}: {cDate} ({calculateAgeFromJalali(cDate)} ساله)
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Detailed Family Members Cards */}
            {(!profileData.familyMembers || profileData.familyMembers.length === 0) ? (
              <div className="border-2 border-dashed border-slate-200 rounded-2xl p-8 text-center space-y-2 bg-slate-50/50">
                <Heart className="w-10 h-10 text-slate-300 mx-auto" />
                <h4 className="font-semibold text-slate-700 text-sm">عضو خانواده‌ای در پرونده تفصیلی ثبت نشده است</h4>
                <p className="text-xs text-slate-400">
                  در صورت نیاز به ثبت مشخصات بیمه تکمیلی یا افراد تحت تکفل، پرونده را ویرایش نمایید.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {profileData.familyMembers.map((fam, idx) => {
                  const birthDisplay = fam.birthDateJalali || (fam.birthDate ? toJalaliDate(fam.birthDate) : '-');
                  const age = fam.birthDate ? calculateAge(fam.birthDate) : (fam.birthDateJalali ? calculateAgeFromJalali(fam.birthDateJalali) : null);

                  return (
                    <div key={fam.id || idx} className="p-5 border border-slate-200 rounded-2xl bg-white shadow-2xs space-y-3">
                      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs">
                            {idx + 1}
                          </div>
                          <div>
                            <h4 className="font-bold text-slate-800 text-sm">
                              {fam.firstName} {fam.lastName}
                            </h4>
                            <span className="text-[11px] text-slate-500 font-medium">
                              نسبت: <strong className="text-emerald-700">{fam.relationship}</strong>
                            </span>
                          </div>
                        </div>

                        {fam.hasSupplementaryInsurance && (
                          <span className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-full text-[10px] font-bold">
                            بیمه تکمیلی فعال
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div className="bg-slate-50 p-2.5 rounded-xl">
                          <span className="text-slate-400 block text-[11px]">کد ملی:</span>
                          <span className="font-bold text-slate-800 font-mono mt-0.5 block">{fam.nationalId || '-'}</span>
                        </div>

                        <div className="bg-slate-50 p-2.5 rounded-xl">
                          <span className="text-slate-400 block text-[11px]">تاریخ تولد:</span>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="font-bold text-slate-800 font-mono">{birthDisplay}</span>
                            {age !== null && (
                              <span className="text-[10px] text-purple-700 bg-purple-50 px-1 py-0.2 rounded border border-purple-200 font-bold">
                                {age} ساله
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="bg-slate-50 p-2.5 rounded-xl">
                          <span className="text-slate-400 block text-[11px]">جنسیت و تأهل:</span>
                          <span className="font-bold text-slate-800 mt-0.5 block">{fam.gender || '-'} • {fam.maritalStatus || '-'}</span>
                        </div>

                        <div className="bg-slate-50 p-2.5 rounded-xl">
                          <span className="text-slate-400 block text-[11px]">شغل و تماس:</span>
                          <span className="font-bold text-slate-800 mt-0.5 block">{fam.job || '-'} {fam.phone ? `(${fam.phone})` : ''}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Tab 6: Skills & Languages */}
        {activeTab === 'skills' && (
          <div className="space-y-6">
            <h3 className="font-bold text-slate-800 text-base border-b pb-3 border-slate-100">
              مهارت‌های تخصصی و زبان‌های خارجی
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
              <div className="space-y-3">
                <h4 className="font-bold text-slate-700 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  مهارت‌های فردی و تخصصی
                </h4>
                {(!profileData.skills || profileData.skills.length === 0) ? (
                  <p className="text-xs text-slate-400 italic">مهارتی ثبت نشده است.</p>
                ) : (
                  <div className="space-y-2">
                    {profileData.skills.map((s) => (
                      <div key={s.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                        <span className="font-bold text-slate-800">{s.skillName}</span>
                        <span className="px-2 py-0.5 bg-white text-emerald-700 border border-emerald-200 rounded-md font-bold text-[11px]">
                          سطح: {s.proficiencyLevel}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <h4 className="font-bold text-slate-700 flex items-center gap-1.5">
                  <FileBadge className="w-4 h-4 text-purple-600" />
                  زبان‌های خارجی
                </h4>
                {(!profileData.languages || profileData.languages.length === 0) ? (
                  <p className="text-xs text-slate-400 italic">زبانی ثبت نشده است.</p>
                ) : (
                  <div className="space-y-2">
                    {profileData.languages.map((l) => (
                      <div key={l.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                        <span className="font-bold text-slate-800">{l.languageName}</span>
                        <span className="px-2 py-0.5 bg-white text-purple-700 border border-purple-200 rounded-md font-bold text-[11px]">
                          مکالمه: {l.speakingLevel} | درک: {l.listeningLevel}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tab 8: Emergency Contact */}
        {activeTab === 'emergency' && (
          <div className="space-y-6">
            <h3 className="font-bold text-slate-800 text-base border-b pb-3 border-slate-100">
              اطلاعات تماس اضطراری در شرایط بحرانی
            </h3>

            {(!profileData.emergencyContacts || profileData.emergencyContacts.length === 0) ? (
              <p className="text-xs text-slate-400 italic">شماره تماس اضطراری ثبت نشده است.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {profileData.emergencyContacts.map((c) => (
                  <div key={c.id} className="p-5 border border-rose-100 bg-rose-50/30 rounded-2xl space-y-2 text-xs">
                    <div className="flex items-center gap-2">
                      <PhoneCall className="w-5 h-5 text-rose-600" />
                      <span className="font-bold text-slate-800 text-sm">{c.fullName} ({c.relationship})</span>
                    </div>
                    <div className="font-mono text-slate-700 font-bold text-sm bg-white p-2.5 rounded-xl border border-rose-200">
                      شماره تماس: {c.phone}
                    </div>
                    {c.address && <p className="text-slate-500 text-[11px]">{c.address}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 7: Documents Archive */}
        {activeTab === 'documents' && (
          <div className="space-y-6">
            <h3 className="font-bold text-slate-800 text-base border-b pb-3 border-slate-100">
              بایگانی اسناد و مدارک پرسنلی
            </h3>

            {profileData.documents?.length === 0 ? (
              <p className="text-xs text-slate-400 italic">هیچ مدرکی بارگذاری نشده است.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {profileData.documents?.map((doc) => {
                  const expStatus = getDocumentExpiryStatus(doc.expiryDate);

                  return (
                    <div key={doc.id} className="p-4 border border-slate-200 rounded-2xl flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <FileText className="w-6 h-6 text-emerald-600 shrink-0" />
                        <div className="text-xs">
                          <h5 className="font-bold text-slate-800">{doc.title}</h5>
                          <span className="text-slate-400 block mt-0.5">{doc.category} • {formatFileSize(doc.fileSize)}</span>
                          {expStatus.isExpiringSoon && (
                            <span className="text-amber-600 font-semibold block mt-1">
                              هشدار انقضا تا {expStatus.daysRemaining} روز
                            </span>
                          )}
                        </div>
                      </div>

                      <a
                        href={doc.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2 text-slate-600 hover:text-emerald-700 hover:bg-slate-100 rounded-xl transition-colors"
                        title="مشاهده و دانلود"
                      >
                        <Download className="w-4 h-4" />
                      </a>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Tab 8: Audit Logs */}
        {activeTab === 'audit' && (
          <div className="space-y-4">
            <h3 className="font-bold text-slate-800 text-base border-b pb-3 border-slate-100">
              تاریخچه ممیزی و رویدادهای سیستمی پرسنل
            </h3>

            {auditLogs.length === 0 ? (
              <p className="text-xs text-slate-400 italic">هنوز لاگ ثبتی برای این پرسنل موجود نیست.</p>
            ) : (
              <div className="space-y-3">
                {auditLogs.map((log) => (
                  <div key={log.id} className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-800">{log.performedByName}</span>
                        <span className="px-2 py-0.5 bg-slate-200 rounded-md text-[10px] font-mono">{log.action}</span>
                      </div>
                      <p className="text-slate-600">{log.description || 'عملیات سیستمی'}</p>
                    </div>

                    <span className="text-[11px] text-slate-400 font-mono shrink-0">
                      {toJalaliDateTime(log.timestamp)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 9: Confidential HR Notes */}
        {activeTab === 'additional' && (
          <div className="space-y-6">
            <h3 className="font-bold text-slate-800 text-base border-b pb-3 border-slate-100">
              اطلاعات تکمیلی و یادداشت‌های محرمانه منابع انسانی
            </h3>

            <div className="p-5 border border-amber-200 bg-amber-50/50 rounded-2xl space-y-3">
              <div className="flex items-center gap-2">
                <Lock className="w-5 h-5 text-amber-700" />
                <h4 className="font-bold text-amber-900 text-sm">یادداشت‌های محرمانه HR</h4>
              </div>

              {isHrPrivileged ? (
                <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap bg-white p-4 rounded-xl border border-amber-200">
                  {profileData.additionalInfo?.hrConfidentialNotes || 'هیچ یادداشت محرمانه‌ای درج نشده است.'}
                </p>
              ) : (
                <p className="text-xs text-slate-400 italic">شما دسترسی مجاز به مشاهده یادداشت‌های محرمانه را ندارید.</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Employee Edit Modal */}
      {isEditModalOpen && (
        <EmployeeEditModal
          employeeId={employeeId}
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onSuccess={() => {
            fetchProfile();
            setIsEditModalOpen(false);
          }}
        />
      )}
    </div>
  );
};
