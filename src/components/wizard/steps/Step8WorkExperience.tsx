import React from 'react';
import { History, Plus, Trash2, Calendar, Building2 } from 'lucide-react';
import { FullRegistrationFormData, WorkExperienceRecord } from '../../../types';
import { calculateDurationInPersian } from '../../../utils/persianDate';

interface Props {
  formData: Partial<FullRegistrationFormData>;
  updateFormData: (data: Partial<FullRegistrationFormData>) => void;
  errors: Record<string, string>;
  setErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>;
}

export const Step8WorkExperience: React.FC<Props> = ({ formData, updateFormData }) => {
  const workExperienceList: WorkExperienceRecord[] = formData.workExperienceList || [];

  const handleAddExperience = () => {
    const newExp: WorkExperienceRecord = {
      id: `exp-${Date.now()}`,
      companyName: '',
      positionTitle: '',
      department: '',
      startDate: '2020-01-01',
      endDate: '2023-01-01',
      isCurrent: false,
      lastSalary: 0,
      leaveReason: '',
      managerName: '',
      managerPhone: '',
      description: ''
    };
    updateFormData({ workExperienceList: [...workExperienceList, newExp] });
  };

  const handleUpdateExperience = (id: string, fields: Partial<WorkExperienceRecord>) => {
    const updated = workExperienceList.map(e => e.id === id ? { ...e, ...fields } : e);
    updateFormData({ workExperienceList: updated });
  };

  const handleRemoveExperience = (id: string) => {
    const filtered = workExperienceList.filter(e => e.id !== id);
    updateFormData({ workExperienceList: filtered });
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      <div className="border-b border-slate-200 pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <History className="w-6 h-6 text-emerald-600" />
            مرحله ۸: سوابق شغلی و تجربیات کاری قبلی
          </h3>
          <p className="text-sm text-slate-500 mt-1">
            شرکت‌های قبلی، سمت، طول دوره همکاری (محاسبه خودکار مدت) و نام مدیر را درج فرمایید.
          </p>
        </div>

        <button
          type="button"
          onClick={handleAddExperience}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-semibold hover:bg-emerald-700 shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          افزودن سابقه شغلی
        </button>
      </div>

      {workExperienceList.length === 0 ? (
        <div className="border-2 border-dashed border-slate-200 rounded-2xl p-10 text-center space-y-3 bg-slate-50/50">
          <Building2 className="w-12 h-12 text-slate-300 mx-auto" />
          <h4 className="font-semibold text-slate-700">هیچ سابقه شغلی قبلی ثبت نشده است</h4>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            در صورت داشتن تجربیات کاری در سایر سازمان‌ها، بر روی دکمه «افزودن سابقه شغلی» کلیک نمایید.
          </p>
          <button
            type="button"
            onClick={handleAddExperience}
            className="px-4 py-2 bg-emerald-100 text-emerald-800 rounded-xl text-xs font-semibold hover:bg-emerald-200 transition-colors"
          >
            + ثبت اولین سابقه کاری
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {workExperienceList.map((exp, index) => {
            const durationText = calculateDurationInPersian(exp.startDate, exp.endDate);

            return (
              <div key={exp.id} className="border border-slate-200 rounded-2xl p-6 bg-white shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-3 font-bold text-slate-800">
                    <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-xs">
                      {index + 1}
                    </span>
                    <span>{exp.companyName ? `${exp.positionTitle || 'سمت شغلی'} در ${exp.companyName}` : `سابقه شغلی شماره ${index + 1}`}</span>
                    <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      طول دوره: {durationText}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemoveExperience(exp.id)}
                    className="text-rose-500 hover:text-rose-700 text-xs flex items-center gap-1 p-1 hover:bg-rose-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    حذف
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Company Name */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      نام شرکت / سازمان قبلی <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="مثال: شرکت ارتباطات سیار"
                      value={exp.companyName}
                      onChange={(e) => handleUpdateExperience(exp.id, { companyName: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-emerald-500 focus:outline-none text-slate-800 text-sm"
                    />
                  </div>

                  {/* Position Title */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      عنوان سمت شغلی <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="مثال: کارشناس ارشد شبکه"
                      value={exp.positionTitle}
                      onChange={(e) => handleUpdateExperience(exp.id, { positionTitle: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-emerald-500 focus:outline-none text-slate-800 text-sm"
                    />
                  </div>

                  {/* Department */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">واحد / دپارتمان</label>
                    <input
                      type="text"
                      placeholder="مثال: فناوری اطلاعات"
                      value={exp.department || ''}
                      onChange={(e) => handleUpdateExperience(exp.id, { department: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-emerald-500 focus:outline-none text-slate-800 text-sm"
                    />
                  </div>

                  {/* Start Date */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">تاریخ شروع همکاری</label>
                    <input
                      type="date"
                      value={exp.startDate}
                      onChange={(e) => handleUpdateExperience(exp.id, { startDate: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-emerald-500 focus:outline-none text-slate-800 text-sm"
                    />
                  </div>

                  {/* End Date */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">تاریخ پایان همکاری</label>
                    <input
                      type="date"
                      value={exp.endDate || ''}
                      onChange={(e) => handleUpdateExperience(exp.id, { endDate: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-emerald-500 focus:outline-none text-slate-800 text-sm"
                    />
                  </div>

                  {/* Last Salary */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">آخرین حقوق دریافتی (ریال)</label>
                    <input
                      type="number"
                      placeholder="250000000"
                      value={exp.lastSalary || ''}
                      onChange={(e) => handleUpdateExperience(exp.id, { lastSalary: parseInt(e.target.value, 10) || 0 })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-emerald-500 focus:outline-none text-slate-800 text-sm"
                    />
                  </div>

                  {/* Manager Name */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">نام مدیر مستقیم قبلی</label>
                    <input
                      type="text"
                      placeholder="مهندس طاهری"
                      value={exp.managerName || ''}
                      onChange={(e) => handleUpdateExperience(exp.id, { managerName: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-emerald-500 focus:outline-none text-slate-800 text-sm"
                    />
                  </div>

                  {/* Manager Phone */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">شماره تماس جهت استعلام</label>
                    <input
                      type="tel"
                      dir="ltr"
                      placeholder="021-..."
                      value={exp.managerPhone || ''}
                      onChange={(e) => handleUpdateExperience(exp.id, { managerPhone: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-emerald-500 focus:outline-none text-slate-800 text-sm"
                    />
                  </div>

                  {/* Leave Reason */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">علت ترک همکاری</label>
                    <input
                      type="text"
                      placeholder="مثال: پایان قرارداد، تمایل به ارتقای شغلی"
                      value={exp.leaveReason || ''}
                      onChange={(e) => handleUpdateExperience(exp.id, { leaveReason: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-emerald-500 focus:outline-none text-slate-800 text-sm"
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
