import React, { useState } from 'react';
import { CheckSquare, Edit3, User, Phone, MapPin, Users, Briefcase, Layers, GraduationCap, History, Sparkles, ShieldCheck, CreditCard, DollarSign, FileText, PhoneCall, FileBadge, CheckCircle2, AlertTriangle, Building } from 'lucide-react';
import { FullRegistrationFormData } from '../../../types';
import { formatRial } from '../../../utils/formatters';
import { toJalaliDate } from '../../../utils/persianDate';

interface Props {
  formData: Partial<FullRegistrationFormData>;
  onJumpToStep: (stepNumber: number) => void;
  isConfirmed: boolean;
  setIsConfirmed: (confirmed: boolean) => void;
}

export const Step16FinalReview: React.FC<Props> = ({
  formData,
  onJumpToStep,
  isConfirmed,
  setIsConfirmed
}) => {
  const sections = [
    {
      step: 1,
      title: 'اطلاعات هویتی و فردی',
      icon: User,
      details: [
        { label: 'نام کامل', value: `${formData.firstName || '-'} ${formData.lastName || '-'}` },
        { label: 'کد پرسنلی', value: formData.employeeCode || '-' },
        { label: 'شماره ملی', value: formData.nationalId || '-' },
        { label: 'نام پدر', value: formData.fatherName || '-' },
        { label: 'جنسیت / وضعیت تأهل', value: `${formData.gender || '-'} / ${formData.maritalStatus || '-'}` },
        { label: 'تاریخ تولد', value: formData.birthDate ? toJalaliDate(formData.birthDate) : '-' }
      ]
    },
    {
      step: 2,
      title: 'اطلاعات تماس',
      icon: Phone,
      details: [
        { label: 'شماره موبایل اصلی', value: formData.contacts?.mobile || '-' },
        { label: 'تلفن ثابت', value: formData.contacts?.landline || '-' },
        { label: 'ایمیل شخصی', value: formData.contacts?.personalEmail || '-' },
        { label: 'ایمیل سازمانی', value: formData.contacts?.workEmail || '-' }
      ]
    },
    {
      step: 3,
      title: 'آدرس و محل سکونت',
      icon: MapPin,
      details: [
        { label: 'تعداد آدرس‌های ثبت‌شده', value: `${formData.addresses?.length || 0} آدرس` },
        { label: 'آدرس اصلی', value: formData.addresses?.[0]?.fullAddress || '-' },
        { label: 'استان و شهر', value: `${formData.addresses?.[0]?.province || '-'} - ${formData.addresses?.[0]?.city || '-'}` },
        { label: 'کد پستی', value: formData.addresses?.[0]?.postalCode || '-' }
      ]
    },
    {
      step: 4,
      title: 'اطلاعات خانواده، همسر و فرزندان',
      icon: Users,
      details: [
        { label: 'وضعیت تأهل و تعداد فرزندان', value: `${formData.maritalStatus || 'مجرد'} (${formData.childrenCount || formData.familyMembers?.filter(f => f.relationship === 'فرزند').length || 0} فرزند)` },
        { label: 'تاریخ تولد همسر', value: formData.spouseBirthDateJalali || (formData.spouseBirthDate ? toJalaliDate(formData.spouseBirthDate) : (formData.familyMembers?.find(f => f.relationship === 'همسر')?.birthDate ? toJalaliDate(formData.familyMembers.find(f => f.relationship === 'همسر')!.birthDate) : 'ثبت نشده')) },
        { 
          label: 'تاریخ تولد فرزندان', 
          value: (formData.childrenBirthDatesJalali && formData.childrenBirthDatesJalali.length > 0)
            ? formData.childrenBirthDatesJalali.join(' ، ')
            : (formData.familyMembers?.filter(f => f.relationship === 'فرزند').map(c => c.birthDateJalali || toJalaliDate(c.birthDate)).join(' ، ') || 'ثبت نشده')
        },
        { label: 'تعداد اعضای تحت تکفل', value: `${formData.familyMembers?.length || 0} نفر` }
      ]
    },
    {
      step: 5,
      title: 'اطلاعات استخدامی و قرارداد',
      icon: Briefcase,
      details: [
        { label: 'نوع قرارداد', value: formData.employment?.contractType || '-' },
        { label: 'شماره قرارداد', value: formData.employment?.contractNumber || '-' },
        { label: 'تاریخ شروع کار', value: formData.employment?.hireDate ? toJalaliDate(formData.employment.hireDate) : '-' },
        { label: 'نوع همکاری', value: formData.employment?.cooperationType || '-' }
      ]
    },
    {
      step: 6,
      title: 'اطلاعات سازمانی و دپارتمان',
      icon: Layers,
      details: [
        { label: 'شرکت محل فعالیت', value: formData.organization?.companyName || formData.companyName || '-' },
        { label: 'شعبه / محل خدمت', value: formData.organization?.branchName || formData.branchName || '-' },
        { label: 'دپارتمان', value: formData.organization?.departmentName || '-' },
        { label: 'سمت سازمانی', value: formData.organization?.positionTitle || '-' },
        { label: 'تیم کاری', value: formData.organization?.teamName || '-' },
        { label: 'مدیر مستقیم', value: formData.organization?.directManagerName || '-' },
        { label: 'مرکز هزینه', value: formData.organization?.costCenterCode || '-' }
      ]
    },
    {
      step: 11,
      title: 'اطلاعات بانکی و واریز',
      icon: CreditCard,
      details: [
        { label: 'بانک عامل', value: formData.bankAccounts?.[0]?.bankName || '-' },
        { label: 'شماره شبا', value: formData.bankAccounts?.[0]?.iban || '-' },
        { label: 'صاحب حساب', value: formData.bankAccounts?.[0]?.accountHolderName || '-' }
      ]
    },
    {
      step: 12,
      title: 'حقوق و مزایا (برحسب ریال)',
      icon: DollarSign,
      details: [
        { label: 'حقوق پایه', value: formatRial(formData.salary?.baseSalary || 0) },
        { label: 'جمع کل ناخالص', value: formatRial(formData.salary?.grossSalary || 0) },
        { label: 'کسر سهم بیمه ۷٪', value: `- ${formatRial(formData.salary?.insuranceDeduction || 0)}` },
        { label: 'خالص پرداختی ماهانه', value: formatRial(formData.salary?.netSalary || 0) }
      ]
    },
    {
      step: 10,
      title: 'بیمه و تأمین اجتماعی',
      icon: ShieldCheck,
      details: [
        { label: 'نوع بیمه', value: formData.insurance?.insuranceType || '-' },
        { label: 'شماره بیمه', value: formData.insurance?.insuranceNumber || '-' },
        { label: 'بیمه تکمیلی', value: formData.insurance?.hasSupplementaryInsurance ? 'ثبت‌نام شده' : 'ندارد' }
      ]
    }
  ];

  return (
    <div className="space-y-8 animate-fadeIn">
      <div className="border-b border-slate-200 pb-4">
        <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <CheckSquare className="w-6 h-6 text-emerald-600" />
          مرحله ۱۶: بازبینی نهایی و تأیید ثبت پرسنل در سازمان
        </h3>
        <p className="text-sm text-slate-500 mt-1">
          لطفاً تمام اطلاعات وارد شده در بخش‌های ۱۵‌گانه را بررسی کرده و در صورت نیاز با کلیک روی «ویرایش»، به مرحله مربوطه بازگردید.
        </p>
      </div>

      {/* Summary Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {sections.map((sec) => {
          const Icon = sec.icon;
          return (
            <div key={sec.step} className="border border-slate-200 rounded-2xl p-5 bg-white shadow-xs hover:border-emerald-300 transition-colors">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2 font-bold text-slate-800 text-sm">
                  <Icon className="w-4 h-4 text-emerald-600" />
                  <span>{sec.title}</span>
                </div>
                <button
                  type="button"
                  onClick={() => onJumpToStep(sec.step)}
                  className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  ویرایش
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-3">
                {sec.details.map((d, i) => (
                  <div key={i} className="text-xs">
                    <span className="text-slate-400 block">{d.label}</span>
                    <span className="font-semibold text-slate-700 block mt-0.5 truncate">{d.value}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Confirmation Checkbox Box */}
      <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-6 space-y-4">
        <label className="flex items-start gap-3 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={isConfirmed}
            onChange={(e) => setIsConfirmed(e.target.checked)}
            className="w-5 h-5 mt-0.5 text-emerald-600 rounded-md focus:ring-emerald-500 cursor-pointer"
          />
          <div>
            <span className="font-bold text-slate-800 text-sm block">
              تأییدیه صحت و اصالت اطلاعات پرونده پرسنلی
            </span>
            <span className="text-xs text-slate-600 leading-relaxed block mt-1">
              اینجانب صحت کلیه مندرجات، مدارک پیوستی، سوابق تحصیلی، شغلی، بیمه‌ای و بانکی ثبت‌شده را تأیید نموده و تأیید می‌کنم که این پرونده پس از ثبت نهایی مستقیماً در پایگاه داده پرسنلی سازمان ذخیره و احکام مربوطه صادر خواهد شد.
            </span>
          </div>
        </label>
      </div>
    </div>
  );
};
