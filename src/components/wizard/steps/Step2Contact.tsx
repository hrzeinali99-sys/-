import React from 'react';
import { Phone, Mail, AlertCircle } from 'lucide-react';
import { FullRegistrationFormData } from '../../../types';
import { isValidIranianMobile } from '../../../utils/validation';

interface Props {
  formData: Partial<FullRegistrationFormData>;
  updateFormData: (data: Partial<FullRegistrationFormData>) => void;
  errors: Record<string, string>;
  setErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>;
}

export const Step2Contact: React.FC<Props> = ({ formData, updateFormData, errors, setErrors }) => {
  const contacts = formData.contacts || {
    id: 'primary',
    mobile: '',
    landline: '',
    personalEmail: '',
    workEmail: '',
    secondaryPhone: ''
  };

  const updateContacts = (fields: Partial<typeof contacts>) => {
    updateFormData({
      contacts: {
        ...contacts,
        ...fields
      }
    });
  };

  const handleMobileBlur = (val: string) => {
    if (!val) {
      setErrors(prev => ({ ...prev, mobile: 'وارد کردن شماره موبایل الزامی است.' }));
      return;
    }
    if (!isValidIranianMobile(val)) {
      setErrors(prev => ({ ...prev, mobile: 'شماره موبایل معتبر نیست (باید با 09 شروع شده و ۱۱ رقم باشد).' }));
    } else {
      setErrors(prev => {
        const c = { ...prev };
        delete c.mobile;
        return c;
      });
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      <div className="border-b border-slate-200 pb-4">
        <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <Phone className="w-6 h-6 text-emerald-600" />
          مرحله ۲: اطلاعات تماس و راه‌های ارتباطی
        </h3>
        <p className="text-sm text-slate-500 mt-1">
          شماره تماس‌های در دسترس و نشانی‌های ایمیل پرسنل را وارد کنید.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Mobile */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">
            شماره موبایل اصلی <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <input
              type="tel"
              dir="ltr"
              placeholder="09121234567"
              value={contacts.mobile || ''}
              onChange={(e) => updateContacts({ mobile: e.target.value })}
              onBlur={(e) => handleMobileBlur(e.target.value)}
              className={`w-full px-4 py-2.5 rounded-xl border ${
                errors.mobile ? 'border-rose-400 bg-rose-50/30' : 'border-slate-300 focus:border-emerald-500'
              } focus:outline-none text-slate-800 text-sm pl-10`}
            />
            <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
          </div>
          {errors.mobile && (
            <p className="text-xs text-rose-500 mt-1 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" />
              {errors.mobile}
            </p>
          )}
        </div>

        {/* Secondary Phone */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">شماره تماس دوم / همراه جایگزین</label>
          <input
            type="tel"
            dir="ltr"
            placeholder="09351234567"
            value={contacts.secondaryPhone || ''}
            onChange={(e) => updateContacts({ secondaryPhone: e.target.value })}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-emerald-500 focus:outline-none text-slate-800 text-sm"
          />
        </div>

        {/* Landline */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">شماره تلفن ثابت (همراه با پیش‌شماره)</label>
          <input
            type="tel"
            dir="ltr"
            placeholder="021-88776655"
            value={contacts.landline || ''}
            onChange={(e) => updateContacts({ landline: e.target.value })}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-emerald-500 focus:outline-none text-slate-800 text-sm"
          />
        </div>

        {/* Personal Email */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">ایمیل شخصی</label>
          <div className="relative">
            <input
              type="email"
              dir="ltr"
              placeholder="name@example.com"
              value={contacts.personalEmail || ''}
              onChange={(e) => updateContacts({ personalEmail: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-emerald-500 focus:outline-none text-slate-800 text-sm pl-10"
            />
            <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
          </div>
        </div>

        {/* Work Email */}
        <div className="md:col-span-2">
          <label className="block text-sm font-semibold text-slate-700 mb-1">ایمیل سازمانی اختصاص داده شده</label>
          <div className="relative">
            <input
              type="email"
              dir="ltr"
              placeholder="e.g. employee@company.ir"
              value={contacts.workEmail || ''}
              onChange={(e) => updateContacts({ workEmail: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-emerald-500 focus:outline-none text-slate-800 text-sm pl-10"
            />
            <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
          </div>
          <p className="text-xs text-slate-500 mt-1">
            در صورت عدم ایجاد ایمیل سازمانی تا این لحظه، می‌توانید این فیلد را بعداً تکمیل فرمایید.
          </p>
        </div>
      </div>
    </div>
  );
};
