import React from 'react';
import { Briefcase, Calendar, AlertCircle } from 'lucide-react';
import { FullRegistrationFormData, ContractType, EmploymentStatus } from '../../../types';

interface Props {
  formData: Partial<FullRegistrationFormData>;
  updateFormData: (data: Partial<FullRegistrationFormData>) => void;
  errors: Record<string, string>;
  setErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>;
}

export const Step5Employment: React.FC<Props> = ({ formData, updateFormData }) => {
  const employment = formData.employment || {
    id: 'current',
    employeeCode: formData.employeeCode || '',
    contractNumber: `CTR-${formData.employeeCode || '1403'}`,
    contractType: 'دائمی',
    employmentType: 'تمام وقت',
    hireDate: new Date().toISOString().split('T')[0],
    contractEndDate: '',
    insuranceStartDate: new Date().toISOString().split('T')[0],
    officialDate: '',
    employmentStatus: 'active',
    cooperationType: 'تمام وقت',
    hasProbation: true,
    probationDurationMonths: 3,
    hireReason: 'جذب نیروی جدید'
  };

  const updateEmployment = (fields: Partial<typeof employment>) => {
    updateFormData({
      employment: {
        ...employment,
        ...fields
      }
    });
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      <div className="border-b border-slate-200 pb-4">
        <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <Briefcase className="w-6 h-6 text-emerald-600" />
          مرحله ۵: اطلاعات استخدامی و نوع قرارداد
        </h3>
        <p className="text-sm text-slate-500 mt-1">
          قرارداد کار، نوع استخدام، دوره آزمایشی و تاریخ شروع همکاری را تعیین فرمایید.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Contract Number */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">
            شماره قرارداد <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            placeholder="مثال: CTR-1403-1045"
            value={employment.contractNumber || ''}
            onChange={(e) => updateEmployment({ contractNumber: e.target.value })}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-emerald-500 focus:outline-none text-slate-800 text-sm"
          />
        </div>

        {/* Contract Type */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">
            نوع قرارداد <span className="text-rose-500">*</span>
          </label>
          <select
            value={employment.contractType}
            onChange={(e) => updateEmployment({ contractType: e.target.value as ContractType })}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-emerald-500 focus:outline-none text-slate-800 text-sm bg-white"
          >
            <option value="دائمی">دائمی (رسمی)</option>
            <option value="موقت">موقت (مدت معین)</option>
            <option value="پروژه‌ای">پروژه‌ای</option>
            <option value="ساعتی">ساعتی</option>
            <option value="مشاور">مشاوره‌ای</option>
            <option value="کارآموز">کارآموزی</option>
            <option value="پیمانکاری">پیمانکاری</option>
            <option value="سایر">سایر</option>
          </select>
        </div>

        {/* Cooperation Type */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">نوع همکاری</label>
          <select
            value={employment.cooperationType}
            onChange={(e) => updateEmployment({ cooperationType: e.target.value as any })}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-emerald-500 focus:outline-none text-slate-800 text-sm bg-white"
          >
            <option value="تمام وقت">تمام وقت</option>
            <option value="پاره وقت">پاره وقت</option>
            <option value="دورکاری">دورکاری (Remote)</option>
            <option value="هیبریدی">هیبریدی (ترکیبی)</option>
            <option value="شیفتی">شیفتی</option>
          </select>
        </div>

        {/* Hire Start Date */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">
            تاریخ شروع همکاری <span className="text-rose-500">*</span>
          </label>
          <input
            type="date"
            value={employment.hireDate}
            onChange={(e) => updateEmployment({ hireDate: e.target.value })}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-emerald-500 focus:outline-none text-slate-800 text-sm"
          />
        </div>

        {/* Contract End Date */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">تاریخ پایان قرارداد (در صورت موقت بودن)</label>
          <input
            type="date"
            value={employment.contractEndDate || ''}
            onChange={(e) => updateEmployment({ contractEndDate: e.target.value })}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-emerald-500 focus:outline-none text-slate-800 text-sm"
          />
        </div>

        {/* Insurance Start Date */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">تاریخ شروع بیمه در این شرکت</label>
          <input
            type="date"
            value={employment.insuranceStartDate || employment.hireDate}
            onChange={(e) => updateEmployment({ insuranceStartDate: e.target.value })}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-emerald-500 focus:outline-none text-slate-800 text-sm"
          />
        </div>

        {/* Employment Status */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">وضعیت اولیه پرسنل</label>
          <select
            value={employment.employmentStatus}
            onChange={(e) => updateEmployment({ employmentStatus: e.target.value as EmploymentStatus })}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-emerald-500 focus:outline-none text-slate-800 text-sm bg-white"
          >
            <option value="active">فعال و مشغول به کار</option>
            <option value="on_leave">مرخصی</option>
            <option value="mission">مأموریت</option>
            <option value="suspended">تعلیق موقت</option>
          </select>
        </div>

        {/* Probation Toggle */}
        <div className="flex flex-col justify-center">
          <label className="inline-flex items-center gap-2 cursor-pointer pt-4">
            <input
              type="checkbox"
              checked={employment.hasProbation}
              onChange={(e) => updateEmployment({ hasProbation: e.target.checked })}
              className="w-4 h-4 text-emerald-600 rounded-sm focus:ring-emerald-500"
            />
            <span className="text-sm font-semibold text-slate-700">دارای دوره آزمایشی است</span>
          </label>
        </div>

        {/* Probation Months */}
        {employment.hasProbation && (
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">مدت دوره آزمایشی (ماه)</label>
            <input
              type="number"
              min={1}
              max={12}
              value={employment.probationDurationMonths || 3}
              onChange={(e) => updateEmployment({ probationDurationMonths: parseInt(e.target.value, 10) || 1 })}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-emerald-500 focus:outline-none text-slate-800 text-sm"
            />
          </div>
        )}

        {/* Hire Reason */}
        <div className="md:col-span-2 lg:col-span-3">
          <label className="block text-sm font-semibold text-slate-700 mb-1">علت و انگیزه استخدام / عنوان طرح</label>
          <input
            type="text"
            placeholder="مثال: جایگزینی پرسنل قبلی، توسعه تیم فنی، افتتاح شعبه جدید..."
            value={employment.hireReason || ''}
            onChange={(e) => updateEmployment({ hireReason: e.target.value })}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-emerald-500 focus:outline-none text-slate-800 text-sm"
          />
        </div>
      </div>
    </div>
  );
};
