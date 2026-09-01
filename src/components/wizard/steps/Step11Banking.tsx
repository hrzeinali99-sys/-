import React from 'react';
import { CreditCard, Building2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { FullRegistrationFormData, BankAccountInfo } from '../../../types';
import { IRANIAN_BANKS } from '../../../services/masterDataService';
import { isValidIranianIBAN } from '../../../utils/validation';

interface Props {
  formData: Partial<FullRegistrationFormData>;
  updateFormData: (data: Partial<FullRegistrationFormData>) => void;
  errors: Record<string, string>;
  setErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>;
}

export const Step11Banking: React.FC<Props> = ({ formData, updateFormData, errors, setErrors }) => {
  const bankAccounts: BankAccountInfo[] = formData.bankAccounts && formData.bankAccounts.length > 0
    ? formData.bankAccounts
    : [
        {
          id: 'bank-1',
          bankName: 'بانک ملت',
          branchName: 'شعبه مرکزی',
          accountNumber: '',
          cardNumber: '',
          iban: 'IR',
          accountHolderName: `${formData.firstName || ''} ${formData.lastName || ''}`.trim() || 'نام پرسنل',
          isPrimary: true
        }
      ];

  const currentBank = bankAccounts[0];

  const updateBank = (fields: Partial<BankAccountInfo>) => {
    const updated = bankAccounts.map((b, i) => i === 0 ? { ...b, ...fields } : b);
    updateFormData({ bankAccounts: updated });
  };

  const handleIbanChange = (val: string) => {
    let cleanVal = val.toUpperCase().replace(/\s/g, '');
    if (!cleanVal.startsWith('IR')) {
      cleanVal = 'IR' + cleanVal.replace(/[^0-9]/g, '');
    }
    updateBank({ iban: cleanVal });

    if (cleanVal.length === 26) {
      if (!isValidIranianIBAN(cleanVal)) {
        setErrors(prev => ({ ...prev, iban: 'شماره شبا نامعتبر است (کنترل محاسباتی MOD97 صحیح نیست).' }));
      } else {
        setErrors(prev => {
          const copy = { ...prev };
          delete copy.iban;
          return copy;
        });
      }
    }
  };

  const formatCardNumber = (val: string) => {
    const digits = val.replace(/\D/g, '').substring(0, 16);
    const parts = [];
    for (let i = 0; i < digits.length; i += 4) {
      parts.push(digits.substring(i, i + 4));
    }
    return parts.join(' - ');
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      <div className="border-b border-slate-200 pb-4">
        <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <CreditCard className="w-6 h-6 text-emerald-600" />
          مرحله ۱۱: اطلاعات بانکی و واریز حقوق
        </h3>
        <p className="text-sm text-slate-500 mt-1">
          شماره شبا ۲۴ رقمی، شماره حساب و شماره کارت جهت واریز منظم حقوق ماهانه را ثبت نمایید.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Bank Selection */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">
            نام بانک عامل <span className="text-rose-500">*</span>
          </label>
          <select
            value={currentBank.bankName}
            onChange={(e) => updateBank({ bankName: e.target.value })}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-emerald-500 focus:outline-none text-slate-800 text-sm bg-white"
          >
            {IRANIAN_BANKS.map((b) => {
              const name = typeof b === 'string' ? b : (b as any)?.name || '';
              return <option key={name} value={name}>{name}</option>;
            })}
          </select>
        </div>

        {/* Branch Name */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">نام و کد شعبه</label>
          <input
            type="text"
            placeholder="مثال: شعبه ونک (کد 124)"
            value={currentBank.branchName || ''}
            onChange={(e) => updateBank({ branchName: e.target.value })}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-emerald-500 focus:outline-none text-slate-800 text-sm"
          />
        </div>

        {/* Account Holder Name */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">
            نام کامل صاحب حساب <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            placeholder="نام و نام خانوادگی به فارسی"
            value={currentBank.accountHolderName}
            onChange={(e) => updateBank({ accountHolderName: e.target.value })}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-emerald-500 focus:outline-none text-slate-800 text-sm"
          />
        </div>

        {/* Account Number */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">شماره حساب بانکی</label>
          <input
            type="text"
            dir="ltr"
            placeholder="مثال: 5824901234"
            value={currentBank.accountNumber || ''}
            onChange={(e) => updateBank({ accountNumber: e.target.value })}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-emerald-500 focus:outline-none text-slate-800 text-sm font-mono"
          />
        </div>

        {/* Card Number */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">شماره ۱۶ رقمی کارت بانکی</label>
          <input
            type="text"
            dir="ltr"
            placeholder="6104 - 3378 - 1234 - 5678"
            value={formatCardNumber(currentBank.cardNumber || '')}
            onChange={(e) => updateBank({ cardNumber: e.target.value.replace(/\D/g, '').substring(0, 16) })}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-emerald-500 focus:outline-none text-slate-800 text-sm font-mono tracking-wider"
          />
        </div>

        {/* IBAN (Sheba) */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">
            شماره شبا (IBAN) <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <input
              type="text"
              dir="ltr"
              maxLength={26}
              placeholder="IR000000000000000000000000"
              value={currentBank.iban}
              onChange={(e) => handleIbanChange(e.target.value)}
              className={`w-full px-4 py-2.5 rounded-xl border ${
                errors.iban ? 'border-rose-400 bg-rose-50/30' : 'border-slate-300 focus:border-emerald-500'
              } focus:outline-none text-slate-800 text-sm font-mono tracking-wider`}
            />
          </div>
          {errors.iban ? (
            <p className="text-xs text-rose-500 mt-1 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" />
              {errors.iban}
            </p>
          ) : currentBank.iban.length === 26 ? (
            <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" />
              شماره شبا با الگوریتم بین‌المللی MOD97 تأیید شد.
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
};
