import React from 'react';
import { GraduationCap, Plus, Trash2, Upload, Award } from 'lucide-react';
import { FullRegistrationFormData, EducationRecord, EducationLevel } from '../../../types';

interface Props {
  formData: Partial<FullRegistrationFormData>;
  updateFormData: (data: Partial<FullRegistrationFormData>) => void;
  errors: Record<string, string>;
  setErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>;
}

export const Step7Education: React.FC<Props> = ({ formData, updateFormData }) => {
  const educationList: EducationRecord[] = formData.educationList || [];

  const handleAddEducation = () => {
    const newEdu: EducationRecord = {
      id: `edu-${Date.now()}`,
      degreeLevel: 'کارشناسی',
      major: '',
      universityName: '',
      universityType: 'دولتی',
      city: 'تهران',
      country: 'ایران',
      gpa: '',
      startYear: 1395,
      endYear: 1399,
      status: 'فارغ‌التحصیل'
    };
    updateFormData({ educationList: [...educationList, newEdu] });
  };

  const handleUpdateEducation = (id: string, fields: Partial<EducationRecord>) => {
    const updated = educationList.map(e => e.id === id ? { ...e, ...fields } : e);
    updateFormData({ educationList: updated });
  };

  const handleRemoveEducation = (id: string) => {
    const filtered = educationList.filter(e => e.id !== id);
    updateFormData({ educationList: filtered });
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      <div className="border-b border-slate-200 pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <GraduationCap className="w-6 h-6 text-emerald-600" />
            مرحله ۷: سوابق تحصیلی و دانشگاهی
          </h3>
          <p className="text-sm text-slate-500 mt-1">
            مقاطع تحصیلی، رشته، دانشگاه و مدارک دانش‌آموختگی را ثبت فرمایید.
          </p>
        </div>

        <button
          type="button"
          onClick={handleAddEducation}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-semibold hover:bg-emerald-700 shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          افزودن مقطع تحصیلی
        </button>
      </div>

      {educationList.length === 0 ? (
        <div className="border-2 border-dashed border-slate-200 rounded-2xl p-10 text-center space-y-3 bg-slate-50/50">
          <Award className="w-12 h-12 text-slate-300 mx-auto" />
          <h4 className="font-semibold text-slate-700">هیچ مدرک یا مقطع تحصیلی ثبت نشده است</h4>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            برای ثبت سوابق دانشگاهی، بر روی دکمه «افزودن مقطع تحصیلی» کلیک نمایید.
          </p>
          <button
            type="button"
            onClick={handleAddEducation}
            className="px-4 py-2 bg-emerald-100 text-emerald-800 rounded-xl text-xs font-semibold hover:bg-emerald-200 transition-colors"
          >
            + ثبت اولین مقطع تحصیلی
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {educationList.map((edu, index) => (
            <div key={edu.id} className="border border-slate-200 rounded-2xl p-6 bg-white shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2 font-bold text-slate-800">
                  <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-xs">
                    {index + 1}
                  </span>
                  <span>{edu.degreeLevel} {edu.major ? `در رشته ${edu.major}` : ''}</span>
                </div>

                <button
                  type="button"
                  onClick={() => handleRemoveEducation(edu.id)}
                  className="text-rose-500 hover:text-rose-700 text-xs flex items-center gap-1 p-1 hover:bg-rose-50 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  حذف
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Degree Level */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">مقطع تحصیلی</label>
                  <select
                    value={edu.degreeLevel}
                    onChange={(e) => handleUpdateEducation(edu.id, { degreeLevel: e.target.value as EducationLevel })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-emerald-500 focus:outline-none text-slate-800 text-sm bg-white"
                  >
                    <option value="دیپلم">دیپلم متوسطه</option>
                    <option value="فوق دیپلم">فوق دیپلم / کاردانی</option>
                    <option value="کارشناسی">کارشناسی (لیسانس)</option>
                    <option value="کارشناسی ارشد">کارشناسی ارشد (فوق لیسانس)</option>
                    <option value="دکتری">دکتری تخصصی (PhD)</option>
                    <option value="پسادکتری">پسادکتری</option>
                  </select>
                </div>

                {/* Major */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">رشته تحصیلی</label>
                  <input
                    type="text"
                    placeholder="مثال: مهندسی کامپیوتر"
                    value={edu.major}
                    onChange={(e) => handleUpdateEducation(edu.id, { major: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-emerald-500 focus:outline-none text-slate-800 text-sm"
                  />
                </div>

                {/* University Name */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">نام دانشگاه / مؤسسه</label>
                  <input
                    type="text"
                    placeholder="مثال: دانشگاه تهران"
                    value={edu.universityName}
                    onChange={(e) => handleUpdateEducation(edu.id, { universityName: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-emerald-500 focus:outline-none text-slate-800 text-sm"
                  />
                </div>

                {/* University Type */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">نوع دانشگاه</label>
                  <select
                    value={edu.universityType}
                    onChange={(e) => handleUpdateEducation(edu.id, { universityType: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-emerald-500 focus:outline-none text-slate-800 text-sm bg-white"
                  >
                    <option value="دولتی">دولتی سراسری</option>
                    <option value="آزاد اسلامی">دانشگاه آزاد اسلامی</option>
                    <option value="پیام نور">پیام نور</option>
                    <option value="علمی کاربردی">علمی کاربردی</option>
                    <option value="غیرانتفاعی">غیرانتفاعی</option>
                    <option value="خارج از کشور">خارج از کشور</option>
                  </select>
                </div>

                {/* Start Year */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">سال شروع</label>
                  <input
                    type="number"
                    min={1340}
                    max={1410}
                    value={edu.startYear}
                    onChange={(e) => handleUpdateEducation(edu.id, { startYear: parseInt(e.target.value, 10) || 1390 })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-emerald-500 focus:outline-none text-slate-800 text-sm"
                  />
                </div>

                {/* End Year */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">سال پایان / فراغت</label>
                  <input
                    type="number"
                    min={1340}
                    max={1410}
                    value={edu.endYear || ''}
                    onChange={(e) => handleUpdateEducation(edu.id, { endYear: parseInt(e.target.value, 10) || undefined })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-emerald-500 focus:outline-none text-slate-800 text-sm"
                  />
                </div>

                {/* GPA */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">معدل (از ۲۰)</label>
                  <input
                    type="text"
                    placeholder="مثال: 17.85"
                    value={edu.gpa || ''}
                    onChange={(e) => handleUpdateEducation(edu.id, { gpa: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-emerald-500 focus:outline-none text-slate-800 text-sm font-mono"
                  />
                </div>

                {/* Status */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">وضعیت تحصیل</label>
                  <select
                    value={edu.status}
                    onChange={(e) => handleUpdateEducation(edu.id, { status: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-emerald-500 focus:outline-none text-slate-800 text-sm bg-white"
                  >
                    <option value="فارغ‌التحصیل">فارغ‌التحصیل</option>
                    <option value="در حال تحصیل">در حال تحصیل (دانشجو)</option>
                    <option value="انصرافی">انصرافی / ترک تحصیل</option>
                  </select>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
