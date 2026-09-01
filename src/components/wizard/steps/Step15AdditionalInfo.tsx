import React from 'react';
import { Lock, FileBadge, Car, Shield } from 'lucide-react';
import { FullRegistrationFormData, MilitaryStatus, DrivingLicenseType } from '../../../types';
import { useAuth } from '../../../context/AuthContext';

interface Props {
  formData: Partial<FullRegistrationFormData>;
  updateFormData: (data: Partial<FullRegistrationFormData>) => void;
  errors: Record<string, string>;
  setErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>;
}

export const Step15AdditionalInfo: React.FC<Props> = ({ formData, updateFormData }) => {
  const { role } = useAuth();
  const additional = formData.additionalInfo || {
    militaryStatus: formData.gender === 'زن' ? 'مشمول نمی‌شود (بانوان)' : 'کارت پایان خدمت',
    militaryExemptionReason: '',
    militaryCardNumber: '',
    militaryCompletionDate: '',
    hasDrivingLicense: false,
    drivingLicenseType: 'پایه ۳',
    drivingLicenseExpiry: '',
    hrConfidentialNotes: '',
    specialTalents: '',
    hobbies: ''
  };

  const isHrPrivileged = ['super_admin', 'hr_admin', 'hr_manager'].includes(role);

  const updateAdd = (fields: Partial<typeof additional>) => {
    updateFormData({
      additionalInfo: {
        ...additional,
        ...fields
      }
    });
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      <div className="border-b border-slate-200 pb-4">
        <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <FileBadge className="w-6 h-6 text-emerald-600" />
          مرحله ۱۵: اطلاعات تکمیلی، نظام وظیفه و یادداشت‌های HR
        </h3>
        <p className="text-sm text-slate-500 mt-1">
          وضعیت خدمت سربازی، گواهینامه رانندگی و یادداشت‌های محرمانه سازمانی را تکمیل فرمایید.
        </p>
      </div>

      {/* Military Service Section */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 space-y-4">
        <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
          <Shield className="w-4 h-4 text-emerald-600" />
          وضعیت نظام وظیفه و خدمت سربازی
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">وضعیت نظام وظیفه</label>
            <select
              value={additional.militaryStatus}
              onChange={(e) => updateAdd({ militaryStatus: e.target.value as MilitaryStatus })}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-emerald-500 focus:outline-none text-slate-800 text-sm bg-white"
            >
              <option value="کارت پایان خدمت">کارت پایان خدمت</option>
              <option value="معافیت دائم پزشکی">معافیت دائم پزشکی</option>
              <option value="معافیت دائم کفالت">معافیت دائم کفالت</option>
              <option value="معافیت دائم موارد خاص">معافیت دائم موارد خاص</option>
              <option value="معافیت تحصیلی">معافیت تحصیلی</option>
              <option value="مشمول نمی‌شود (بانوان)">مشمول نمی‌شود (بانوان)</option>
              <option value="در حال خدمت">در حال خدمت</option>
            </select>
          </div>

          {additional.militaryStatus !== 'مشمول نمی‌شود (بانوان)' && (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">شماره کارت یا برگه نظام وظیفه</label>
                <input
                  type="text"
                  placeholder="مثال: 98765432"
                  value={additional.militaryCardNumber || ''}
                  onChange={(e) => updateAdd({ militaryCardNumber: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-emerald-500 focus:outline-none text-slate-800 text-sm font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">تاریخ صدور / پایان خدمت</label>
                <input
                  type="date"
                  value={additional.militaryCompletionDate || ''}
                  onChange={(e) => updateAdd({ militaryCompletionDate: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-emerald-500 focus:outline-none text-slate-800 text-sm"
                />
              </div>
            </>
          )}
        </div>
      </div>

      {/* Driving License Section */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
            <Car className="w-4 h-4 text-emerald-600" />
            گواهینامه رانندگی
          </h4>
          <label className="inline-flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={additional.hasDrivingLicense}
              onChange={(e) => updateAdd({ hasDrivingLicense: e.target.checked })}
              className="w-4 h-4 text-emerald-600 rounded-sm focus:ring-emerald-500"
            />
            <span className="text-xs font-semibold text-slate-700">دارای گواهینامه رانندگی است</span>
          </label>
        </div>

        {additional.hasDrivingLicense && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-200">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">نوع گواهینامه</label>
              <select
                value={additional.drivingLicenseType || 'پایه ۳'}
                onChange={(e) => updateAdd({ drivingLicenseType: e.target.value as DrivingLicenseType })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-emerald-500 focus:outline-none text-slate-800 text-sm bg-white"
              >
                <option value="پایه ۳">پایه ۳ (خودروهای سواری)</option>
                <option value="پایه ۲">پایه ۲ (نیمه سنگین)</option>
                <option value="پایه ۱">پایه ۱ (کامیون و اتوبوس)</option>
                <option value="موتورسیکلت">موتورسیکلت</option>
                <option value="ویژه">ماشین‌آلات ویژه راهسازی</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">تاریخ اعتبار گواهینامه</label>
              <input
                type="date"
                value={additional.drivingLicenseExpiry || ''}
                onChange={(e) => updateAdd({ drivingLicenseExpiry: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-emerald-500 focus:outline-none text-slate-800 text-sm"
              />
            </div>
          </div>
        )}
      </div>

      {/* HR Confidential Notes (RBAC Restricted) */}
      <div className="border border-amber-200 bg-amber-50/50 rounded-2xl p-6 space-y-3">
        <div className="flex items-center gap-2">
          <Lock className="w-5 h-5 text-amber-700" />
          <h4 className="font-bold text-amber-900 text-sm">
            یادداشت‌های محرمانه و ارزیابی منابع انسانی (HR Confidential Notes)
          </h4>
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-200 text-amber-800 font-semibold">
            فقط قابل مشاهده برای مدیران HR
          </span>
        </div>

        {isHrPrivileged ? (
          <div>
            <textarea
              rows={4}
              placeholder="نکات مربوط به مصاحبه، بازخورد مراجع، نقاط قوت، ملاحظات رفتاری و محرمانه..."
              value={additional.hrConfidentialNotes || ''}
              onChange={(e) => updateAdd({ hrConfidentialNotes: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-amber-300 focus:border-amber-500 focus:outline-none text-slate-800 text-sm bg-white"
            />
            <p className="text-xs text-amber-700 mt-1">
              این یادداشت‌ها رمزنگاری و صرفاً به نقش‌های Super Admin و HR Manager نمایش داده می‌شود.
            </p>
          </div>
        ) : (
          <div className="p-4 bg-white/80 rounded-xl border border-amber-200 text-xs text-slate-500 italic">
            به دلیل عدم داشتن مجوز مدیریت منابع انسانی، امکان ویرایش یا مشاهده این بخش برای شما غیرفعال است.
          </div>
        )}
      </div>
    </div>
  );
};
