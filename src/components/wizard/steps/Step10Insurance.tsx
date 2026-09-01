import React from 'react';
import { ShieldCheck, Umbrella, FileCheck2, CreditCard, Building2, Coins } from 'lucide-react';
import { FullRegistrationFormData, InsuranceInfo, InsuranceType, InsuranceStatus, SupplementaryInsurancePaymentMethod } from '../../../types';

interface Props {
  formData: Partial<FullRegistrationFormData>;
  updateFormData: (data: Partial<FullRegistrationFormData>) => void;
  errors: Record<string, string>;
  setErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>;
}

export const Step10Insurance: React.FC<Props> = ({ formData, updateFormData }) => {
  const insurance: InsuranceInfo = formData.insurance || {
    id: 'primary-ins',
    insuranceType: 'تأمین اجتماعی',
    insuranceNumber: '',
    insuranceBranch: 'شعبه ۲۲ تهران',
    startDate: new Date().toISOString().split('T')[0],
    previousExperienceMonths: 0,
    status: 'active',
    hasSupplementaryInsurance: true,
    supplementaryInsurancePlan: 'طرح طلایی درمان',
    supplementaryInsuranceCompany: 'بیمه ایران',
    supplementaryInsurancePaymentMethod: 'کسر از حقوق',
    supplementaryPaymentMethod: 'کسر از حقوق',
    supplementaryInsurancePremium: 15000000,
    supplementaryDependentsCount: formData.familyMembers?.filter(m => m.hasSupplementaryInsurance).length || 0
  };

  const updateIns = (fields: Partial<InsuranceInfo>) => {
    updateFormData({
      insurance: {
        ...insurance,
        ...fields
      }
    });
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      <div className="border-b border-slate-200 pb-4">
        <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <ShieldCheck className="w-6 h-6 text-emerald-600" />
          مرحله ۱۰: اطلاعات بیمه پایه و بیمه تکمیلی درمان
        </h3>
        <p className="text-sm text-slate-500 mt-1">
          شماره بیمه تأمین اجتماعی، سابقه قبلی و طرح پوشش بیمه درمان تکمیلی را وارد نمایید.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Insurance Type */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">نوع بیمه پایه</label>
          <select
            value={insurance.insuranceType}
            onChange={(e) => updateIns({ insuranceType: e.target.value as InsuranceType })}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-emerald-500 focus:outline-none text-slate-800 text-sm bg-white"
          >
            <option value="تأمین اجتماعی">سازمان تأمین اجتماعی</option>
            <option value="خدمات درمانی">خدمات درمانی / سلامت ایرانیان</option>
            <option value="نیروهای مسلح">خدمات درمانی نیروهای مسلح</option>
            <option value="صندوق بازنشستگی کشوری">صندوق بازنشستگی کشوری</option>
            <option value="فاقد بیمه">فاقد سابقه بیمه قبلی</option>
          </select>
        </div>

        {/* Insurance Number */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">
            شماره بیمه ۱۰ رقمی <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            dir="ltr"
            placeholder="مثال: 0876543210"
            value={insurance.insuranceNumber || ''}
            onChange={(e) => updateIns({ insuranceNumber: e.target.value })}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-emerald-500 focus:outline-none text-slate-800 text-sm font-mono"
          />
        </div>

        {/* Insurance Branch */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">شعبه بیمه‌گذار</label>
          <input
            type="text"
            placeholder="مثال: شعبه ۲۲ تهران"
            value={insurance.insuranceBranch || ''}
            onChange={(e) => updateIns({ insuranceBranch: e.target.value })}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-emerald-500 focus:outline-none text-slate-800 text-sm"
          />
        </div>

        {/* Previous Experience (Months) */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">سوابق بیمه قبلی (به ماه)</label>
          <input
            type="number"
            min={0}
            value={insurance.previousExperienceMonths || 0}
            onChange={(e) => updateIns({ previousExperienceMonths: parseInt(e.target.value, 10) || 0 })}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-emerald-500 focus:outline-none text-slate-800 text-sm"
          />
          <span className="text-xs text-slate-400 mt-1 block">
            معادل تقریباً {Math.floor((insurance.previousExperienceMonths || 0) / 12)} سال و {(insurance.previousExperienceMonths || 0) % 12} ماه
          </span>
        </div>

        {/* Insurance Status */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">وضعیت رد کردن بیمه</label>
          <select
            value={insurance.status}
            onChange={(e) => updateIns({ status: e.target.value as InsuranceStatus })}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-emerald-500 focus:outline-none text-slate-800 text-sm bg-white"
          >
            <option value="active">فعال و مشمول رد لیست ماهانه</option>
            <option value="inactive">غیرفعال</option>
            <option value="suspended">تعلیق موقت</option>
          </select>
        </div>
      </div>

      {/* Supplementary Insurance Box */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Umbrella className="w-5 h-5 text-emerald-600" />
            <h4 className="font-bold text-slate-800">بیمه تکمیلی درمان گروهی سازمان</h4>
          </div>

          <label className="inline-flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={insurance.hasSupplementaryInsurance}
              onChange={(e) => updateIns({ hasSupplementaryInsurance: e.target.checked })}
              className="w-4 h-4 text-emerald-600 rounded-sm focus:ring-emerald-500"
            />
            <span className="text-sm font-semibold text-slate-700">ثبت‌نام در طرح بیمه تکمیلی</span>
          </label>
        </div>

        {insurance.hasSupplementaryInsurance && (
          <div className="space-y-4 pt-2 border-t border-slate-200">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">طرح بیمه تکمیلی انتخابی</label>
                <select
                  value={insurance.supplementaryInsurancePlan || 'طرح طلایی درمان'}
                  onChange={(e) => updateIns({ supplementaryInsurancePlan: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-emerald-500 focus:outline-none text-slate-800 text-sm bg-white"
                >
                  <option value="طرح طلایی درمان">طرح طلایی درمان (سقف فرانشیز ۱۰٪ - بستری نامحدود)</option>
                  <option value="طرح نقره‌ای درمان">طرح نقره‌ای درمان (سقف فرانشیز ۲۰٪)</option>
                  <option value="طرح پایه درمان">طرح برنزی / پایه تکمیلی</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">شرکت بیمه‌گر تکمیلی</label>
                <select
                  value={insurance.supplementaryInsuranceCompany || 'بیمه ایران'}
                  onChange={(e) => updateIns({ supplementaryInsuranceCompany: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-emerald-500 focus:outline-none text-slate-800 text-sm bg-white"
                >
                  <option value="بیمه ایران">بیمه ایران</option>
                  <option value="بیمه دانا">بیمه دانا</option>
                  <option value="بیمه سامان">بیمه سامان</option>
                  <option value="بیمه البرز">بیمه البرز</option>
                  <option value="بیمه آسیا">بیمه آسیا</option>
                  <option value="بیمه پاسارگاد">بیمه پاسارگاد</option>
                  <option value="بیمه پارسیان">بیمه پارسیان</option>
                  <option value="بیمه رازی">بیمه رازی</option>
                  <option value="سایر">سایر شرکت‌های بیمه</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">تعداد افراد تحت تکفل مشمول بیمه</label>
                <input
                  type="number"
                  min={0}
                  value={insurance.supplementaryDependentsCount || 0}
                  onChange={(e) => updateIns({ supplementaryDependentsCount: parseInt(e.target.value, 10) || 0 })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-emerald-500 focus:outline-none text-slate-800 text-sm"
                />
              </div>
            </div>

            {/* Payment Method & Monthly Premium */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white p-4 rounded-xl border border-slate-200">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">
                  نحوه پرداخت حق بیمه تکمیلی <span className="text-rose-500">*</span>
                </label>
                <div className="space-y-2">
                  {[
                    { value: 'کسر از حقوق', label: 'کسر از حقوق ماهانه (فیش حقوقی)', desc: 'مبلغ حق بیمه سهم پرسنل به طور خودکار در ماژول حقوق و دستمزد کسر می‌گردد.' },
                    { value: 'پرداخت توسط خود فرد', label: 'پرداخت مستقیم توسط خود فرد (شخصی)', desc: 'پرسنل رأساً حق بیمه تکمیلی خود را به حساب اعلامی واریز می‌نماید.' },
                    { value: 'پرداخت توسط شرکت', label: 'پرداخت کامل توسط شرکت (مزایای رفاهی)', desc: '۱۰۰٪ حق بیمه تکمیلی به عنوان مزایای شغلی توسط کارفرما تقبل می‌شود.' }
                  ].map((opt) => (
                    <label
                      key={opt.value}
                      className={`flex items-start gap-3 p-2.5 rounded-lg border cursor-pointer transition-colors ${
                        (insurance.supplementaryInsurancePaymentMethod || insurance.supplementaryPaymentMethod) === opt.value
                          ? 'border-emerald-500 bg-emerald-50/50'
                          : 'border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="supplementaryPaymentMethod"
                        value={opt.value}
                        checked={(insurance.supplementaryInsurancePaymentMethod || insurance.supplementaryPaymentMethod) === opt.value}
                        onChange={(e) => {
                          const val = e.target.value as SupplementaryInsurancePaymentMethod;
                          updateIns({
                            supplementaryInsurancePaymentMethod: val,
                            supplementaryPaymentMethod: val
                          });
                        }}
                        className="mt-1 w-4 h-4 text-emerald-600 focus:ring-emerald-500"
                      />
                      <div>
                        <span className="text-xs font-bold text-slate-800 block">{opt.label}</span>
                        <span className="text-[11px] text-slate-500 block mt-0.5">{opt.desc}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  مبلغ حق بیمه تکمیلی ماهانه (ریال)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min={0}
                    step={1000000}
                    value={insurance.supplementaryInsurancePremium || 0}
                    onChange={(e) => updateIns({ supplementaryInsurancePremium: parseFloat(e.target.value) || 0 })}
                    placeholder="مثال: 15000000"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-emerald-500 focus:outline-none text-slate-800 text-sm font-mono"
                  />
                  <div className="absolute left-3 top-2.5 text-xs text-slate-400">ریال</div>
                </div>
                {insurance.supplementaryInsurancePremium ? (
                  <p className="text-xs text-emerald-700 mt-1 font-medium">
                    معادل {(insurance.supplementaryInsurancePremium / 10).toLocaleString('fa-IR')} تومان در ماه
                  </p>
                ) : null}

                <div className="mt-4 p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-600 leading-relaxed">
                  <span className="font-semibold block mb-1 text-slate-700">📌 راهنمای مالی بیمه تکمیلی:</span>
                  در صورتی که گزینه «کسر از حقوق» انتخاب شود، در محاسبه ماهانه فیش حقوقی پرسنل، این مبلغ در آیتم‌های کسورات بیمه تکمیلی لحاظ خواهد شد.
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
