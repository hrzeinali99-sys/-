import React, { useState, useEffect } from 'react';
import { 
  Building2, Building, Shield, Globe, Phone, Mail, 
  MapPin, Percent, User, FileText, CheckCircle2, AlertCircle, Sparkles
} from 'lucide-react';
import { Company, CompanyType } from '../../types';
import { IRAN_PROVINCES, IRAN_CITIES_BY_PROVINCE } from '../../services/masterDataService';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (companyData: Partial<Company> & { name: string; code: string }) => Promise<void>;
  editingCompany: Company | null;
  allCompanies: Company[];
}

export const CompanyModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onSave,
  editingCompany,
  allCompanies
}) => {
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    type: 'subsidiary' as CompanyType,
    holdingId: '',
    holdingName: '',
    ownershipPercentage: 100,
    registrationNumber: '',
    nationalId: '',
    economicCode: '',
    industry: 'فناوری اطلاعات و نرم‌افزار',
    ceoName: '',
    boardChairman: '',
    establishedYear: '۱۴۰۰',
    phone: '',
    email: '',
    website: '',
    province: 'تهران',
    city: 'تهران',
    address: '',
    postalCode: '',
    status: 'active' as 'active' | 'inactive',
    description: ''
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // List of existing holding companies that can be parent
  const holdingOptions = allCompanies.filter(c => c.type === 'holding' && c.id !== editingCompany?.id);

  useEffect(() => {
    if (editingCompany) {
      setFormData({
        name: editingCompany.name || '',
        code: editingCompany.code || '',
        type: editingCompany.type || 'subsidiary',
        holdingId: editingCompany.holdingId || '',
        holdingName: editingCompany.holdingName || '',
        ownershipPercentage: editingCompany.ownershipPercentage ?? (editingCompany.type === 'holding' ? 100 : 100),
        registrationNumber: editingCompany.registrationNumber || '',
        nationalId: editingCompany.nationalId || '',
        economicCode: editingCompany.economicCode || '',
        industry: editingCompany.industry || 'فناوری اطلاعات و ارتباطات',
        ceoName: editingCompany.ceoName || '',
        boardChairman: editingCompany.boardChairman || '',
        establishedYear: editingCompany.establishedYear || '۱۴۰۰',
        phone: editingCompany.phone || '',
        email: editingCompany.email || '',
        website: editingCompany.website || '',
        province: editingCompany.province || 'تهران',
        city: editingCompany.city || 'تهران',
        address: editingCompany.address || '',
        postalCode: editingCompany.postalCode || '',
        status: editingCompany.status || 'active',
        description: editingCompany.description || ''
      });
    } else {
      const defaultHolding = holdingOptions[0];
      setFormData({
        name: '',
        code: '',
        type: holdingOptions.length === 0 ? 'holding' : 'subsidiary',
        holdingId: defaultHolding ? defaultHolding.id : '',
        holdingName: defaultHolding ? defaultHolding.name : '',
        ownershipPercentage: 100,
        registrationNumber: '',
        nationalId: '',
        economicCode: '',
        industry: 'فناوری اطلاعات و ارتباطات',
        ceoName: '',
        boardChairman: '',
        establishedYear: '۱۴۰۲',
        phone: '',
        email: '',
        website: '',
        province: 'تهران',
        city: 'تهران',
        address: '',
        postalCode: '',
        status: 'active',
        description: ''
      });
    }
    setError(null);
  }, [editingCompany, isOpen]);

  if (!isOpen) return null;

  const handleTypeChange = (newType: CompanyType) => {
    if (newType === 'holding') {
      setFormData(prev => ({
        ...prev,
        type: newType,
        holdingId: '',
        holdingName: '',
        ownershipPercentage: 100
      }));
    } else {
      const defaultHolding = holdingOptions[0];
      setFormData(prev => ({
        ...prev,
        type: newType,
        holdingId: prev.holdingId || (defaultHolding ? defaultHolding.id : ''),
        holdingName: prev.holdingName || (defaultHolding ? defaultHolding.name : ''),
        ownershipPercentage: prev.ownershipPercentage || 100
      }));
    }
  };

  const handleHoldingSelect = (holdingId: string) => {
    const found = holdingOptions.find(h => h.id === holdingId);
    setFormData(prev => ({
      ...prev,
      holdingId,
      holdingName: found ? found.name : ''
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError('وارد کردن نام رسمی شرکت الزامی است.');
      return;
    }
    if (!formData.code.trim()) {
      setError('وارد کردن کد سازمانی یا شناسه اختصاری شرکت الزامی است.');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      await onSave({
        ...formData,
        name: formData.name.trim(),
        code: formData.code.trim().toUpperCase()
      });
      onClose();
    } catch (err: any) {
      setError(err?.message || 'خطا در ثبت اطلاعات شرکت');
    } finally {
      setSaving(false);
    }
  };

  const availableCities = IRAN_CITIES_BY_PROVINCE[formData.province] || [formData.city];

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100 animate-fadeIn space-y-6 my-8">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-2xl ${formData.type === 'holding' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}`}>
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-800">
                {editingCompany ? 'ویرایش اطلاعات شرکت / هلدینگ' : 'تعریف شرکت هلدینگ یا تابعه جدید'}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                تنظیم مشخصات حقوقی، درصد سهامداری هلدینگ و اطلاعات هویتی سازمانی
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center text-sm font-bold transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Company Type Selection */}
          <div className="space-y-2">
            <label className="text-xs font-black text-slate-700 block">نوع ساختار شرکت در گروه *</label>
            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => handleTypeChange('holding')}
                className={`p-3 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1.5 ${
                  formData.type === 'holding'
                    ? 'border-amber-500 bg-amber-50/70 text-amber-900 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 text-slate-600 bg-slate-50/50'
                }`}
              >
                <Building className="w-5 h-5 text-amber-600" />
                <span className="text-xs font-black">هلدینگ مادر</span>
                <span className="text-[10px] text-slate-500">شرکت اصلی و مادر گروه</span>
              </button>

              <button
                type="button"
                onClick={() => handleTypeChange('subsidiary')}
                className={`p-3 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1.5 ${
                  formData.type === 'subsidiary'
                    ? 'border-emerald-500 bg-emerald-50/70 text-emerald-900 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 text-slate-600 bg-slate-50/50'
                }`}
              >
                <Building2 className="w-5 h-5 text-emerald-600" />
                <span className="text-xs font-black">شرکت تابعه</span>
                <span className="text-[10px] text-slate-500">تحت مالکیت و نظارت هلدینگ</span>
              </button>

              <button
                type="button"
                onClick={() => handleTypeChange('affiliate')}
                className={`p-3 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1.5 ${
                  formData.type === 'affiliate'
                    ? 'border-indigo-500 bg-indigo-50/70 text-indigo-900 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 text-slate-600 bg-slate-50/50'
                }`}
              >
                <Sparkles className="w-5 h-5 text-indigo-600" />
                <span className="text-xs font-black">شرکت وابسته</span>
                <span className="text-[10px] text-slate-500">سرمایه‌پذیر و همکار تجاری</span>
              </button>
            </div>
          </div>

          {/* Holding Association (If subsidiary or affiliate) */}
          {formData.type !== 'holding' && (
            <div className="bg-emerald-50/50 border border-emerald-200/80 rounded-2xl p-4 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-emerald-900">هلدینگ مادر والد *</label>
                  <select
                    value={formData.holdingId}
                    onChange={(e) => handleHoldingSelect(e.target.value)}
                    className="w-full h-10 px-3 bg-white border border-emerald-300 rounded-xl text-xs font-bold text-slate-800"
                  >
                    <option value="">-- انتخاب هلدینگ مادر --</option>
                    {holdingOptions.map(h => (
                      <option key={h.id} value={h.id}>{h.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-emerald-900 flex items-center justify-between">
                    <span>درصد سهامداری هلدینگ</span>
                    <span className="font-mono text-emerald-700 font-black">{formData.ownershipPercentage}٪</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="range"
                      min="1"
                      max="100"
                      value={formData.ownershipPercentage}
                      onChange={(e) => setFormData({ ...formData, ownershipPercentage: Number(e.target.value) })}
                      className="w-full accent-emerald-600 cursor-pointer"
                    />
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={formData.ownershipPercentage}
                      onChange={(e) => setFormData({ ...formData, ownershipPercentage: Number(e.target.value) })}
                      className="w-16 h-9 px-2 bg-white border border-emerald-300 rounded-xl text-xs font-bold font-mono text-center"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* General Information */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">نام کامل و رسمی شرکت *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="مثال: شرکت داده‌پردازان کیهان"
                className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">کد سازمانی / شناسه اختصاری *</label>
              <input
                type="text"
                required
                dir="ltr"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                placeholder="e.g. DPK-01 or HOLD-KYH"
                className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-mono font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">صنعت و زمینه فعالیت</label>
              <input
                type="text"
                value={formData.industry}
                onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                placeholder="مثال: فناوری اطلاعات، هوش مصنوعی، مالی"
                className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-800 focus:bg-white"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">سال تأسیس</label>
              <input
                type="text"
                value={formData.establishedYear}
                onChange={(e) => setFormData({ ...formData, establishedYear: e.target.value })}
                placeholder="مثال: ۱۳۹۵"
                className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-800 focus:bg-white"
              />
            </div>
          </div>

          {/* Legal / Registration Identifiers */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/70 space-y-3">
            <h4 className="text-xs font-black text-slate-800 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-indigo-600" />
              شناسه‌های ثبتی و قانونی
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600">شناسه ملی شرکت (۱۱ رقم)</label>
                <input
                  type="text"
                  dir="ltr"
                  maxLength={11}
                  value={formData.nationalId}
                  onChange={(e) => setFormData({ ...formData, nationalId: e.target.value })}
                  placeholder="1400..."
                  className="w-full h-9 px-3 bg-white border border-slate-200 rounded-xl text-xs font-mono text-slate-800"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600">کد اقتصادی (۱۲ رقم)</label>
                <input
                  type="text"
                  dir="ltr"
                  maxLength={12}
                  value={formData.economicCode}
                  onChange={(e) => setFormData({ ...formData, economicCode: e.target.value })}
                  placeholder="411..."
                  className="w-full h-9 px-3 bg-white border border-slate-200 rounded-xl text-xs font-mono text-slate-800"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600">شماره ثبت شرکت</label>
                <input
                  type="text"
                  dir="ltr"
                  value={formData.registrationNumber}
                  onChange={(e) => setFormData({ ...formData, registrationNumber: e.target.value })}
                  placeholder="5421..."
                  className="w-full h-9 px-3 bg-white border border-slate-200 rounded-xl text-xs font-mono text-slate-800"
                />
              </div>
            </div>
          </div>

          {/* Key People */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">نام و نام خانوادگی مدیرعامل</label>
              <input
                type="text"
                value={formData.ceoName}
                onChange={(e) => setFormData({ ...formData, ceoName: e.target.value })}
                placeholder="مثال: مهندس آرش طاهری"
                className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-800 focus:bg-white"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">رئیس هیئت مدیره</label>
              <input
                type="text"
                value={formData.boardChairman}
                onChange={(e) => setFormData({ ...formData, boardChairman: e.target.value })}
                placeholder="مثال: دکتر محمدرضا کیهانی"
                className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-800 focus:bg-white"
              />
            </div>
          </div>

          {/* Contact & Location */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">تلفن تماس مرکزی</label>
              <input
                type="text"
                dir="ltr"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="021-8877..."
                className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-mono text-slate-800 focus:bg-white"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">پست الکترونیک (ایمیل)</label>
              <input
                type="email"
                dir="ltr"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="info@company.ir"
                className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-mono text-slate-800 focus:bg-white"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">وب‌سایت رسمی</label>
              <input
                type="text"
                dir="ltr"
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                placeholder="https://..."
                className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-mono text-slate-800 focus:bg-white"
              />
            </div>
          </div>

          {/* Province & City & Address */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">استان دفتر مرکزی</label>
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

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700">نشانی کامل دفتر مرکزی</label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="تهران، خیابان..."
              className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-800 focus:bg-white"
            />
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl text-xs font-bold transition-colors cursor-pointer"
            >
              انصراف
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-2xl text-xs font-black shadow-md shadow-emerald-600/20 transition-all hover:scale-102 cursor-pointer flex items-center gap-2"
            >
              {saving && <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              {editingCompany ? 'ذخیره تغییرات شرکت' : 'ثبت و تعریف شرکت'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
