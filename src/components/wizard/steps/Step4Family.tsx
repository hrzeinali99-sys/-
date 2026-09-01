import React from 'react';
import { Users, Plus, Trash2, ShieldCheck, Heart, Calendar } from 'lucide-react';
import { FullRegistrationFormData, FamilyMember, Gender, MaritalStatus } from '../../../types';
import { toJalaliDate, calculateAge } from '../../../utils/persianDate';

interface Props {
  formData: Partial<FullRegistrationFormData>;
  updateFormData: (data: Partial<FullRegistrationFormData>) => void;
  errors: Record<string, string>;
  setErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>;
}

export const Step4Family: React.FC<Props> = ({ formData, updateFormData }) => {
  const familyMembers: FamilyMember[] = formData.familyMembers || [];

  const handleAddMember = () => {
    const newMember: FamilyMember = {
      id: `fam-${Date.now()}`,
      firstName: '',
      lastName: '',
      relationship: 'همسر',
      nationalId: '',
      birthDate: '',
      gender: 'زن',
      maritalStatus: 'متأهل',
      job: '',
      phone: '',
      isDependent: true,
      hasSupplementaryInsurance: true
    };
    updateFormData({ familyMembers: [...familyMembers, newMember] });
  };

  const handleUpdateMember = (id: string, fields: Partial<FamilyMember>) => {
    const updated = familyMembers.map(m => m.id === id ? { ...m, ...fields } : m);
    updateFormData({ familyMembers: updated });
  };

  const handleRemoveMember = (id: string) => {
    const filtered = familyMembers.filter(m => m.id !== id);
    updateFormData({ familyMembers: filtered });
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      <div className="border-b border-slate-200 pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Users className="w-6 h-6 text-emerald-600" />
            مرحله ۴: اطلاعات اعضای خانواده و افراد تحت تکفل
          </h3>
          <p className="text-sm text-slate-500 mt-1">
            مشخصات همسر، فرزندان و سایر افراد تحت تکفل و بیمه تکمیلی را وارد نمایید.
          </p>
        </div>

        <button
          type="button"
          onClick={handleAddMember}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-semibold hover:bg-emerald-700 shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          افزودن عضو خانواده
        </button>
      </div>

      {familyMembers.length === 0 ? (
        <div className="border-2 border-dashed border-slate-200 rounded-2xl p-10 text-center space-y-3 bg-slate-50/50">
          <Heart className="w-12 h-12 text-slate-300 mx-auto" />
          <h4 className="font-semibold text-slate-700">هیچ عضو خانواده‌ای ثبت نشده است</h4>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            در صورتی که متقاضی متأهل یا دارای فرزند و افراد تحت تکفل است، بر روی دکمه «افزودن عضو خانواده» کلیک نمایید.
          </p>
          <button
            type="button"
            onClick={handleAddMember}
            className="px-4 py-2 bg-emerald-100 text-emerald-800 rounded-xl text-xs font-semibold hover:bg-emerald-200 transition-colors"
          >
            + افزودن اولین عضو خانواده
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {familyMembers.map((member, index) => (
            <div key={member.id} className="border border-slate-200 rounded-2xl p-6 bg-white shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2 font-bold text-slate-800">
                  <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-xs">
                    {index + 1}
                  </span>
                  <span>
                    {member.firstName || member.lastName 
                      ? `${member.firstName} ${member.lastName} (${member.relationship})`
                      : `عضو شماره ${index + 1}`}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => handleRemoveMember(member.id)}
                  className="text-rose-500 hover:text-rose-700 text-xs flex items-center gap-1 p-1 hover:bg-rose-50 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  حذف
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* First Name */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">نام</label>
                  <input
                    type="text"
                    placeholder="نام"
                    value={member.firstName}
                    onChange={(e) => handleUpdateMember(member.id, { firstName: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-emerald-500 focus:outline-none text-slate-800 text-sm"
                  />
                </div>

                {/* Last Name */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">نام خانوادگی</label>
                  <input
                    type="text"
                    placeholder="نام خانوادگی"
                    value={member.lastName}
                    onChange={(e) => handleUpdateMember(member.id, { lastName: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-emerald-500 focus:outline-none text-slate-800 text-sm"
                  />
                </div>

                {/* Relationship */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">نسبت</label>
                  <select
                    value={member.relationship}
                    onChange={(e) => handleUpdateMember(member.id, { relationship: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-emerald-500 focus:outline-none text-slate-800 text-sm bg-white"
                  >
                    <option value="همسر">همسر</option>
                    <option value="فرزند">فرزند</option>
                    <option value="پدر">پدر</option>
                    <option value="مادر">مادر</option>
                    <option value="خواهر">خواهر</option>
                    <option value="برادر">برادر</option>
                    <option value="سایر">سایر</option>
                  </select>
                </div>

                {/* National ID */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">کد ملی</label>
                  <input
                    type="text"
                    maxLength={10}
                    placeholder="0012345678"
                    value={member.nationalId}
                    onChange={(e) => handleUpdateMember(member.id, { nationalId: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-emerald-500 focus:outline-none text-slate-800 text-sm font-mono"
                  />
                </div>

                {/* Birth Date */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">تاریخ تولد</label>
                  <input
                    type="date"
                    value={member.birthDate}
                    onChange={(e) => {
                      const gDate = e.target.value;
                      const jDate = gDate ? toJalaliDate(gDate) : '';
                      handleUpdateMember(member.id, { 
                        birthDate: gDate,
                        birthDateJalali: jDate
                      });
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-emerald-500 focus:outline-none text-slate-800 text-sm"
                  />
                  {member.birthDate && (
                    <div className="mt-1.5 flex items-center justify-between text-[11px] bg-slate-50 px-2 py-1 rounded-lg border border-slate-200">
                      <span className="text-slate-600 flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-emerald-600" />
                        شمسی: <strong className="font-mono">{member.birthDateJalali || toJalaliDate(member.birthDate)}</strong>
                      </span>
                      <span className="font-medium text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-200">
                        {calculateAge(member.birthDate)} ساله
                      </span>
                    </div>
                  )}
                </div>

                {/* Gender */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">جنسیت</label>
                  <select
                    value={member.gender}
                    onChange={(e) => handleUpdateMember(member.id, { gender: e.target.value as Gender })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-emerald-500 focus:outline-none text-slate-800 text-sm bg-white"
                  >
                    <option value="مرد">مرد</option>
                    <option value="زن">زن</option>
                  </select>
                </div>

                {/* Job */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">شغل</label>
                  <input
                    type="text"
                    placeholder="دانش‌آموز / خانه‌دار / شاغل"
                    value={member.job || ''}
                    onChange={(e) => handleUpdateMember(member.id, { job: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-emerald-500 focus:outline-none text-slate-800 text-sm"
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">شماره تماس</label>
                  <input
                    type="tel"
                    dir="ltr"
                    placeholder="0912..."
                    value={member.phone || ''}
                    onChange={(e) => handleUpdateMember(member.id, { phone: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-emerald-500 focus:outline-none text-slate-800 text-sm"
                  />
                </div>
              </div>

              {/* Toggles */}
              <div className="flex flex-wrap gap-6 pt-2">
                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={member.isDependent}
                    onChange={(e) => handleUpdateMember(member.id, { isDependent: e.target.checked })}
                    className="w-4 h-4 text-emerald-600 rounded-sm focus:ring-emerald-500"
                  />
                  <span className="text-xs font-medium text-slate-700">تحت تکفل پرسنل است</span>
                </label>

                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={member.hasSupplementaryInsurance}
                    onChange={(e) => handleUpdateMember(member.id, { hasSupplementaryInsurance: e.target.checked })}
                    className="w-4 h-4 text-emerald-600 rounded-sm focus:ring-emerald-500"
                  />
                  <span className="text-xs font-medium text-slate-700 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    متقاضی پوشش بیمه تکمیلی درمان
                  </span>
                </label>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
