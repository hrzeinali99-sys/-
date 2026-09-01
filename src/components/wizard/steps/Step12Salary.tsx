import React, { useEffect } from 'react';
import { DollarSign, Calculator, TrendingUp, ShieldAlert, Coins } from 'lucide-react';
import { FullRegistrationFormData, SalaryStructure } from '../../../types';
import { formatRial } from '../../../utils/formatters';

interface Props {
  formData: Partial<FullRegistrationFormData>;
  updateFormData: (data: Partial<FullRegistrationFormData>) => void;
  errors: Record<string, string>;
  setErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>;
}

export const Step12Salary: React.FC<Props> = ({ formData, updateFormData }) => {
  const childrenCount = formData.childrenCount || 0;
  const isMarried = formData.maritalStatus === 'متأهل' || formData.maritalStatus === 'معیل';

  // Standard legal baseline components in RIALS (IRR)
  const baseSalary = formData.salary?.baseSalary ?? 350000000; // 350,000,000 Rials
  const housingAllowance = formData.salary?.housingAllowance ?? 90000000; // 90,000,000 Rials
  const groceryAllowance = formData.salary?.groceryAllowance ?? 140000000; // 140,000,000 Rials
  const childAllowance = formData.salary?.childAllowance ?? (childrenCount * 71661840);
  const marriageAllowance = formData.salary?.marriageAllowance ?? (isMarried ? 50000000 : 0);
  const fixedBonus = formData.salary?.fixedBonus ?? 40000000;
  const performanceBonus = formData.salary?.performanceBonus ?? 0;

  // Calculate gross salary in Rials
  const grossSalary = baseSalary + housingAllowance + groceryAllowance + childAllowance + marriageAllowance + fixedBonus + performanceBonus;

  // Employee 7% social security insurance share in Rials
  const insuranceDeduction = Math.round((baseSalary + housingAllowance + groceryAllowance) * 0.07);

  // Progressive Iranian income tax estimation (Exemption threshold 1,200,000,000 Rials/year = 120,000,000 Rials/month)
  const taxableIncome = Math.max(0, grossSalary - 120000000 - insuranceDeduction);
  const taxDeduction = Math.round(taxableIncome * 0.10);

  // Net Take-Home Salary in Rials
  const netSalary = grossSalary - insuranceDeduction - taxDeduction;

  const currentSalary: SalaryStructure = {
    id: 'sal-1',
    baseSalary,
    housingAllowance,
    groceryAllowance,
    childAllowance,
    marriageAllowance,
    fixedBonus,
    performanceBonus,
    grossSalary,
    netSalary,
    currency: 'IRR',
    effectiveDate: new Date().toISOString().split('T')[0],
    insuranceDeduction,
    taxDeduction
  };

  const updateSal = (fields: Partial<SalaryStructure>) => {
    const updated = {
      ...currentSalary,
      ...fields
    };
    // Recalculate all in Rials
    const newGross = updated.baseSalary + updated.housingAllowance + updated.groceryAllowance + updated.childAllowance + updated.marriageAllowance + (updated.fixedBonus || 0) + (updated.performanceBonus || 0);
    const newIns = Math.round((updated.baseSalary + updated.housingAllowance + updated.groceryAllowance) * 0.07);
    const newTaxable = Math.max(0, newGross - 120000000 - newIns);
    const newTax = Math.round(newTaxable * 0.10);
    const newNet = newGross - newIns - newTax;

    updateFormData({
      salary: {
        ...updated,
        grossSalary: newGross,
        insuranceDeduction: newIns,
        taxDeduction: newTax,
        netSalary: newNet
      }
    });
  };

  useEffect(() => {
    if (!formData.salary) {
      updateFormData({ salary: currentSalary });
    }
  }, []);

  return (
    <div className="space-y-8 animate-fadeIn">
      <div className="border-b border-slate-200 pb-4">
        <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <DollarSign className="w-6 h-6 text-emerald-600" />
          مرحله ۱۲: ساختار حقوق و مزایا (محاسبات رسمی برحسب ریال)
        </h3>
        <p className="text-sm text-slate-500 mt-1">
          کلیه مبالغ حقوق پایه، حق مسکن، بن خواربار، حق اولاد، مزایای شغلی و کسورات قانونی (بیمه ۷٪ و مالیات) دقیقاً برحسب <strong>ریال</strong> محاسبه و در سیستم ثبت می‌شوند.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Base Salary */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">
            حقوق پایه ماهانه (ریال) <span className="text-rose-500">*</span>
          </label>
          <input
            type="number"
            step="1000000"
            value={currentSalary.baseSalary}
            onChange={(e) => updateSal({ baseSalary: parseInt(e.target.value, 10) || 0 })}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-emerald-500 focus:outline-none text-slate-800 text-sm font-mono"
          />
          <span className="text-xs text-emerald-600 font-bold mt-1 block">
            {formatRial(currentSalary.baseSalary)}
          </span>
        </div>

        {/* Housing Allowance */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">حق مسکن مصوب (ریال)</label>
          <input
            type="number"
            step="1000000"
            value={currentSalary.housingAllowance}
            onChange={(e) => updateSal({ housingAllowance: parseInt(e.target.value, 10) || 0 })}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-emerald-500 focus:outline-none text-slate-800 text-sm font-mono"
          />
          <span className="text-xs text-slate-600 font-medium mt-1 block">
            {formatRial(currentSalary.housingAllowance)}
          </span>
        </div>

        {/* Grocery / Food Allowance */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">بن اقلام مصرفی / خواربار (ریال)</label>
          <input
            type="number"
            step="1000000"
            value={currentSalary.groceryAllowance}
            onChange={(e) => updateSal({ groceryAllowance: parseInt(e.target.value, 10) || 0 })}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-emerald-500 focus:outline-none text-slate-800 text-sm font-mono"
          />
          <span className="text-xs text-slate-600 font-medium mt-1 block">
            {formatRial(currentSalary.groceryAllowance)}
          </span>
        </div>

        {/* Child Allowance */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">
            حق اولاد ({childrenCount} فرزند) (ریال)
          </label>
          <input
            type="number"
            step="1000000"
            value={currentSalary.childAllowance}
            onChange={(e) => updateSal({ childAllowance: parseInt(e.target.value, 10) || 0 })}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-emerald-500 focus:outline-none text-slate-800 text-sm font-mono"
          />
          <span className="text-xs text-slate-600 font-medium mt-1 block">
            {formatRial(currentSalary.childAllowance)}
          </span>
        </div>

        {/* Marriage Allowance */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">حق تأهل (ریال)</label>
          <input
            type="number"
            step="1000000"
            value={currentSalary.marriageAllowance}
            onChange={(e) => updateSal({ marriageAllowance: parseInt(e.target.value, 10) || 0 })}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-emerald-500 focus:outline-none text-slate-800 text-sm font-mono"
          />
          <span className="text-xs text-slate-600 font-medium mt-1 block">
            {formatRial(currentSalary.marriageAllowance)}
          </span>
        </div>

        {/* Fixed Bonus / Responsibility */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">حق مسئولیت / تخصص ثابت (ریال)</label>
          <input
            type="number"
            step="1000000"
            value={currentSalary.fixedBonus || 0}
            onChange={(e) => updateSal({ fixedBonus: parseInt(e.target.value, 10) || 0 })}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-emerald-500 focus:outline-none text-slate-800 text-sm font-mono"
          />
          <span className="text-xs text-slate-600 font-medium mt-1 block">
            {formatRial(currentSalary.fixedBonus || 0)}
          </span>
        </div>
      </div>

      {/* Salary Calculations Summary Card */}
      <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-slate-50 border border-emerald-200 rounded-2xl p-6 shadow-xs">
        <div className="flex items-center gap-2 mb-4">
          <Calculator className="w-5 h-5 text-emerald-700" />
          <h4 className="font-bold text-slate-800">خلاصه پیش‌محاسبه فیش حقوقی پرسنل (مبالغ برحسب ریال)</h4>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Gross Salary */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-xs text-slate-500 block">جمع کل ناخالص احکام</span>
            <span className="text-lg font-extrabold text-slate-800 block mt-1 font-mono">
              {formatRial(currentSalary.grossSalary)}
            </span>
          </div>

          {/* Insurance Deduction */}
          <div className="bg-white p-4 rounded-xl border border-rose-100 shadow-xs">
            <span className="text-xs text-rose-600 block">کسر سهم بیمه کارمند (۷٪)</span>
            <span className="text-lg font-bold text-rose-700 block mt-1 font-mono">
              - {formatRial(currentSalary.insuranceDeduction || insuranceDeduction)}
            </span>
          </div>

          {/* Tax Deduction */}
          <div className="bg-white p-4 rounded-xl border border-amber-100 shadow-xs">
            <span className="text-xs text-amber-600 block">کسر مالیات بر حقوق ماهانه</span>
            <span className="text-lg font-bold text-amber-700 block mt-1 font-mono">
              - {formatRial(currentSalary.taxDeduction || taxDeduction)}
            </span>
          </div>

          {/* Net Salary */}
          <div className="bg-emerald-600 text-white p-4 rounded-xl shadow-md">
            <span className="text-xs text-emerald-100 block">خالص پرداختی نهایی به حساب</span>
            <span className="text-xl font-black block mt-1 font-mono">
              {formatRial(currentSalary.netSalary)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
