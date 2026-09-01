import React, { useState, useEffect } from 'react';
import { Building, MapPin, Phone, User, CheckCircle2, AlertCircle } from 'lucide-react';
import { Branch, Company } from '../../types';
import { IRAN_PROVINCES, IRAN_CITIES_BY_PROVINCE } from '../../services/masterDataService';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (branchData: Partial<Branch> & { name: string; companyId: string }) => Promise<void>;
  editingBranch: Branch | null;
  companies: Company[];
  selectedCompanyId?: string;
}

export const BranchModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onSave,
  editingBranch,
  companies,
  selectedCompanyId
}) => {
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    companyId: selectedCompanyId || companies[0]?.id || 'comp-1',
    province: 'تهران',
    city: 'تهران',
    address: '',
    phone: '',
    managerName: '',
    isHeadquarter: false
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (editingBranch) {
      setFormData({
        name: editingBranch.name || '',
        code: editingBranch.code || '',
        companyId: editingBranch.companyId || selectedCompanyId || companies[0]?.id || 'comp-1',
        province: editingBranch.province || 'تهران',
        city: editingBranch.city || 'تهران',
        address: editingBranch.address || '',
        phone: editingBranch.phone || '',
        managerName: editingBranch.managerName || '',
        isHeadquarter: !!editingBranch.isHeadquarter
      });
    } else {
      setFormData({
        name: '',
        code: '',
        companyId: selectedCompanyId || companies[0]?.id || 'comp-1',
        province: 'تهران',
        city: 'تهران',
        address: '',
        phone: '',
        managerName: '',
        isHeadquarter: false
      });
    }
    setError(null);
  }, [editingBranch, isOpen, selectedCompanyId]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError('وارد کردن نام شعبه یا دفتر استانی الزامی است.');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      await onSave({
        ...formData,
        name: formData.name.trim(),
        code: formData.code.trim() || undefined
      });
      onClose();
    } catch (err: any) {
      setError(err?.message || 'خطا در ثبت اطلاعات شعبه');
    } finally {
      setSaving(false);
    }
  };

  const availableCities = IRAN_CITIES_BY_PROVINCE[formData.province] || [formData.city];

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-100 animate-fadeIn space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-indigo-100 text-indigo-800">
              <Building className="w-5 h-5" />
            </span>
            <h3 className="text-base font-extrabold text-slate-800">
              {editingBranch ? 'ویرایش اطلاعات شعبه' : 'تعریف شعبه یا دفتر جدید'}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center text-sm font-bold cursor-pointer"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700">شرکت متبوع *</label>
            <select
              value={formData.companyId}
              onChange={(e) => setFormData({ ...formData, companyId: e.target.value })}
              className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800"
            >
              {companies.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.type === 'holding' ? '(هلدینگ)' : '(تابعه)'}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">نام شعبه / دفتر *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="مثال: شعبه اصفهان - شهرک علمی"
                className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">کد شعبه (اختیاری)</label>
              <input
                type="text"
                dir="ltr"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                placeholder="e.g. BR-103"
                className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">استان</label>
              <select
                value={formData.province}
                onChange={(e) => {
                  const newProv = e.target.value;
                  const newCities = IRAN_CITIES_BY_PROVINCE[newProv] || ['مرکز استان'];
                  setFormData({ ...formData, province: newProv, city: newCities[0] });
                }}
                className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800"
              >
                {IRAN_PROVINCES.map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">شهر</label>
              <select
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800"
              >
                {availableCities.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">نام مدیر / مسئول شعبه</label>
              <input
                type="text"
                value={formData.managerName}
                onChange={(e) => setFormData({ ...formData, managerName: e.target.value })}
                placeholder="مثال: مهندس کاظمی"
                className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">تلفن شعبه</label>
              <input
                type="text"
                dir="ltr"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="031-3391..."
                className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-mono"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700">نشانی دقیق</label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="خیابان..."
              className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs"
            />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="isHeadquarter"
              checked={formData.isHeadquarter}
              onChange={(e) => setFormData({ ...formData, isHeadquarter: e.target.checked })}
              className="w-4 h-4 text-indigo-600 rounded-sm border-slate-300 focus:ring-indigo-500"
            />
            <label htmlFor="isHeadquarter" className="text-xs font-bold text-slate-700 cursor-pointer">
              این شعبه به عنوان دفتر مرکزی (ستاد) شرکت در نظر گرفته شود
            </label>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              انصراف
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-black shadow-md shadow-indigo-600/20 transition-all hover:scale-102 cursor-pointer"
            >
              {editingBranch ? 'ذخیره تغییرات' : 'ثبت شعبه جدید'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
