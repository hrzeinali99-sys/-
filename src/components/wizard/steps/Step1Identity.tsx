import React, { useState } from 'react';
import { User, Upload, Trash2, AlertCircle, CheckCircle2, Calendar, Heart, Users } from 'lucide-react';
import { FullRegistrationFormData, Gender, MaritalStatus } from '../../../types';
import { isValidIranianNationalId } from '../../../utils/validation';
import { isEmployeeCodeUnique, isNationalIdUnique } from '../../../services/employeeService';
import { IRAN_PROVINCES, IRAN_CITIES_BY_PROVINCE } from '../../../services/masterDataService';
import { toJalaliDate, calculateAge } from '../../../utils/persianDate';

interface Props {
  formData: Partial<FullRegistrationFormData>;
  updateFormData: (data: Partial<FullRegistrationFormData>) => void;
  errors: Record<string, string>;
  setErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>;
}

export const Step1Identity: React.FC<Props> = ({ formData, updateFormData, errors, setErrors }) => {
  const [photoPreview, setPhotoPreview] = useState<string>(formData.profileImageUrl || '');
  const [isCheckingCode, setIsCheckingCode] = useState(false);

  const selectedProvince = formData.birthProvince || 'تهران';
  const cities = IRAN_CITIES_BY_PROVINCE[selectedProvince] || ['تهران'];

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const url = reader.result as string;
        setPhotoPreview(url);
        updateFormData({ profileImageUrl: url });
      };
      reader.readAsDataURL(file);
    }
  };

  const removePhoto = () => {
    setPhotoPreview('');
    updateFormData({ profileImageUrl: '' });
  };

  const handleNationalIdBlur = async (val: string) => {
    if (!val) {
      setErrors(prev => ({ ...prev, nationalId: 'وارد کردن شماره ملی الزامی است.' }));
      return;
    }
    if (!isValidIranianNationalId(val)) {
      setErrors(prev => ({ ...prev, nationalId: 'شماره ملی وارد شده نامعتبر است (کنترل ارقام و رقم کنترلی صحیح نیست).' }));
      return;
    }
    const isUnique = await isNationalIdUnique(val);
    if (!isUnique) {
      setErrors(prev => ({ ...prev, nationalId: 'این شماره ملی قبلاً در سامانه ثبت شده است.' }));
    } else {
      setErrors(prev => {
        const copy = { ...prev };
        delete copy.nationalId;
        return copy;
      });
    }
  };

  const handleEmployeeCodeBlur = async (val: string) => {
    if (!val) {
      setErrors(prev => ({ ...prev, employeeCode: 'وارد کردن کد پرسنلی الزامی است.' }));
      return;
    }
    setIsCheckingCode(true);
    const isUnique = await isEmployeeCodeUnique(val);
    setIsCheckingCode(false);
    if (!isUnique) {
      setErrors(prev => ({ ...prev, employeeCode: 'این کد پرسنلی قبلاً ثبت شده است.' }));
    } else {
      setErrors(prev => {
        const copy = { ...prev };
        delete copy.employeeCode;
        return copy;
      });
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Step Header */}
      <div className="border-b border-slate-200 pb-4">
        <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <User className="w-6 h-6 text-emerald-600" />
          مرحله ۱: اطلاعات هویتی و شناسنامه‌ای پرسنل
        </h3>
        <p className="text-sm text-slate-500 mt-1">
          مشخصات سجلی و هویتی متقاضی را بر اساس کارت ملی و شناسنامه وارد نمایید.
        </p>
      </div>

      {/* Profile Photo Upload */}
      <div className="bg-emerald-50/50 border border-emerald-100 rounded-2xl p-6 flex flex-col sm:flex-row items-center gap-6">
        <div className="relative group">
          <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-white shadow-md bg-slate-100 flex items-center justify-center">
            {photoPreview ? (
              <img src={photoPreview} alt="عکس پرسنلی" className="w-full h-full object-cover" />
            ) : (
              <User className="w-12 h-12 text-slate-400" />
            )}
          </div>
          {photoPreview && (
            <button
              type="button"
              onClick={removePhoto}
              title="حذف عکس"
              className="absolute -top-1 -right-1 p-1.5 bg-rose-500 text-white rounded-full hover:bg-rose-600 shadow transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex-1 text-center sm:text-right space-y-2">
          <h4 className="font-semibold text-slate-800">عکس پرسنلی متقاضی</h4>
          <p className="text-xs text-slate-500">
            عکس پرسنلی پرسنل (با پس‌زمینه سفید، حداکثر حجم ۲ مگابایت، فرمت‌های JPG یا PNG)
          </p>
          <label className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 cursor-pointer shadow-sm transition-all">
            <Upload className="w-4 h-4" />
            <span>انتخاب یا بارگذاری تصویر</span>
            <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
          </label>
        </div>
      </div>

      {/* Identity Fields Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Employee Code */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">
            کد پرسنلی <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            placeholder="مثال: EMP-1045"
            value={formData.employeeCode || ''}
            onChange={(e) => updateFormData({ employeeCode: e.target.value })}
            onBlur={(e) => handleEmployeeCodeBlur(e.target.value)}
            className={`w-full px-4 py-2.5 rounded-xl border ${
              errors.employeeCode ? 'border-rose-400 bg-rose-50/30' : 'border-slate-300 focus:border-emerald-500'
            } focus:outline-none text-slate-800 text-sm`}
          />
          {errors.employeeCode && (
            <p className="text-xs text-rose-500 mt-1 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" />
              {errors.employeeCode}
            </p>
          )}
        </div>

        {/* National ID */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">
            شماره ملی ۱۰ رقمی <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            maxLength={10}
            placeholder="مثال: 0012345678"
            value={formData.nationalId || ''}
            onChange={(e) => updateFormData({ nationalId: e.target.value })}
            onBlur={(e) => handleNationalIdBlur(e.target.value)}
            className={`w-full px-4 py-2.5 rounded-xl border ${
              errors.nationalId ? 'border-rose-400 bg-rose-50/30' : 'border-slate-300 focus:border-emerald-500'
            } focus:outline-none text-slate-800 text-sm`}
          />
          {errors.nationalId && (
            <p className="text-xs text-rose-500 mt-1 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" />
              {errors.nationalId}
            </p>
          )}
        </div>

        {/* First Name */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">
            نام (فارسی) <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            placeholder="مثال: علی"
            value={formData.firstName || ''}
            onChange={(e) => updateFormData({ firstName: e.target.value })}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-emerald-500 focus:outline-none text-slate-800 text-sm"
          />
        </div>

        {/* Last Name */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">
            نام خانوادگی (فارسی) <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            placeholder="مثال: حسینی"
            value={formData.lastName || ''}
            onChange={(e) => updateFormData({ lastName: e.target.value })}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-emerald-500 focus:outline-none text-slate-800 text-sm"
          />
        </div>

        {/* Latin First Name */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">نام (لاتین)</label>
          <input
            type="text"
            dir="ltr"
            placeholder="e.g. Ali"
            value={formData.latinFirstName || ''}
            onChange={(e) => updateFormData({ latinFirstName: e.target.value })}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-emerald-500 focus:outline-none text-slate-800 text-sm"
          />
        </div>

        {/* Latin Last Name */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">نام خانوادگی (لاتین)</label>
          <input
            type="text"
            dir="ltr"
            placeholder="e.g. Hosseini"
            value={formData.latinLastName || ''}
            onChange={(e) => updateFormData({ latinLastName: e.target.value })}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-emerald-500 focus:outline-none text-slate-800 text-sm"
          />
        </div>

        {/* Father's Name */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">
            نام پدر <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            placeholder="مثال: رضا"
            value={formData.fatherName || ''}
            onChange={(e) => updateFormData({ fatherName: e.target.value })}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-emerald-500 focus:outline-none text-slate-800 text-sm"
          />
        </div>

        {/* ID Number */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">شماره شناسنامه</label>
          <input
            type="text"
            placeholder="مثال: 1234"
            value={formData.idNumber || ''}
            onChange={(e) => updateFormData({ idNumber: e.target.value })}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-emerald-500 focus:outline-none text-slate-800 text-sm"
          />
        </div>

        {/* Birth Certificate Serial */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">سری شناسنامه</label>
            <input
              type="text"
              placeholder="الف/۲۴"
              value={formData.idSerialSeries || ''}
              onChange={(e) => updateFormData({ idSerialSeries: e.target.value })}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-300 focus:border-emerald-500 focus:outline-none text-slate-800 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">سریال</label>
            <input
              type="text"
              placeholder="765432"
              value={formData.idSerialNumber || ''}
              onChange={(e) => updateFormData({ idSerialNumber: e.target.value })}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-300 focus:border-emerald-500 focus:outline-none text-slate-800 text-sm"
            />
          </div>
        </div>

        {/* Birth Date */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">
            تاریخ تولد <span className="text-rose-500">*</span>
          </label>
          <input
            type="date"
            value={formData.birthDate || ''}
            onChange={(e) => updateFormData({ birthDate: e.target.value })}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-emerald-500 focus:outline-none text-slate-800 text-sm"
          />
        </div>

        {/* Birth Province */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">استان محل تولد</label>
          <select
            value={formData.birthProvince || 'تهران'}
            onChange={(e) => updateFormData({ birthProvince: e.target.value, birthCity: IRAN_CITIES_BY_PROVINCE[e.target.value]?.[0] || '' })}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-emerald-500 focus:outline-none text-slate-800 text-sm bg-white"
          >
            {IRAN_PROVINCES.map((prov) => (
              <option key={prov} value={prov}>{prov}</option>
            ))}
          </select>
        </div>

        {/* Birth City */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">شهر محل تولد</label>
          <select
            value={formData.birthCity || cities[0]}
            onChange={(e) => updateFormData({ birthCity: e.target.value })}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-emerald-500 focus:outline-none text-slate-800 text-sm bg-white"
          >
            {cities.map((city) => (
              <option key={city} value={city}>{city}</option>
            ))}
          </select>
        </div>

        {/* Gender */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">جنسیت</label>
          <select
            value={formData.gender || 'مرد'}
            onChange={(e) => updateFormData({ gender: e.target.value as Gender })}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-emerald-500 focus:outline-none text-slate-800 text-sm bg-white"
          >
            <option value="مرد">مرد</option>
            <option value="زن">زن</option>
          </select>
        </div>

        {/* Marital Status */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">وضعیت تأهل</label>
          <select
            value={formData.maritalStatus || 'مجرد'}
            onChange={(e) => updateFormData({ maritalStatus: e.target.value as MaritalStatus })}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-emerald-500 focus:outline-none text-slate-800 text-sm bg-white"
          >
            <option value="مجرد">مجرد</option>
            <option value="متأهل">متأهل</option>
            <option value="معیل">معیل (دارای فرزند)</option>
          </select>
        </div>

        {/* Spouse Birth Date (if married) */}
        {formData.maritalStatus && formData.maritalStatus !== 'مجرد' && (
          <div className="bg-rose-50/50 p-3 rounded-2xl border border-rose-100">
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
              <span className="flex items-center gap-1">
                <Heart className="w-3.5 h-3.5 text-rose-600" />
                تاریخ تولد همسر
              </span>
              {formData.spouseBirthDate && (
                <span className="text-[10px] text-rose-700 font-bold bg-white px-1.5 py-0.5 rounded border border-rose-200">
                  {calculateAge(formData.spouseBirthDate)} ساله
                </span>
              )}
            </label>
            <input
              type="date"
              value={formData.spouseBirthDate || ''}
              onChange={(e) => {
                const gVal = e.target.value;
                updateFormData({
                  spouseBirthDate: gVal,
                  spouseBirthDateJalali: gVal ? toJalaliDate(gVal) : ''
                });
              }}
              className="w-full px-3 py-2 rounded-xl border border-rose-200 focus:border-rose-500 focus:outline-none text-slate-800 text-xs bg-white"
            />
            {formData.spouseBirthDate && (
              <span className="text-[10px] text-slate-500 mt-1 block font-mono">
                شمسی: {formData.spouseBirthDateJalali || toJalaliDate(formData.spouseBirthDate)}
              </span>
            )}
          </div>
        )}

        {/* Children Count */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">تعداد فرزندان</label>
          <input
            type="number"
            min={0}
            max={15}
            value={formData.childrenCount || 0}
            onChange={(e) => updateFormData({ childrenCount: parseInt(e.target.value, 10) || 0 })}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-emerald-500 focus:outline-none text-slate-800 text-sm"
          />
        </div>

        {/* Child Birth Date (if has children) */}
        {(formData.childrenCount || 0) > 0 && (
          <div className="bg-blue-50/50 p-3 rounded-2xl border border-blue-100">
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
              <span className="flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-blue-600" />
                تاریخ تولد فرزند اول
              </span>
              {formData.childBirthDate && (
                <span className="text-[10px] text-blue-700 font-bold bg-white px-1.5 py-0.5 rounded border border-blue-200">
                  {calculateAge(formData.childBirthDate)} ساله
                </span>
              )}
            </label>
            <input
              type="date"
              value={formData.childBirthDate || ''}
              onChange={(e) => {
                const gVal = e.target.value;
                updateFormData({
                  childBirthDate: gVal,
                  childBirthDateJalali: gVal ? toJalaliDate(gVal) : ''
                });
              }}
              className="w-full px-3 py-2 rounded-xl border border-blue-200 focus:border-blue-500 focus:outline-none text-slate-800 text-xs bg-white"
            />
            {formData.childBirthDate && (
              <span className="text-[10px] text-slate-500 mt-1 block font-mono">
                شمسی: {formData.childBirthDateJalali || toJalaliDate(formData.childBirthDate)}
              </span>
            )}
          </div>
        )}

        {/* Citizenship */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">تابعیت</label>
          <input
            type="text"
            value={formData.citizenship || 'ایرانی'}
            onChange={(e) => updateFormData({ citizenship: e.target.value })}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-emerald-500 focus:outline-none text-slate-800 text-sm"
          />
        </div>
      </div>
    </div>
  );
};
