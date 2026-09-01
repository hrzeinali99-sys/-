import React, { useState, useEffect } from 'react';
import { FileEdit, Play, Trash2, Clock, User, ArrowLeft, RefreshCw, AlertCircle } from 'lucide-react';
import { RegistrationDraft } from '../../types';
import { getRegistrationDrafts, deleteRegistrationDraft } from '../../services/employeeService';
import { toJalaliDateTime } from '../../utils/persianDate';

interface Props {
  onResumeDraft: (draftId: string) => void;
  onNewRegistration: () => void;
}

export const DraftList: React.FC<Props> = ({ onResumeDraft, onNewRegistration }) => {
  const [drafts, setDrafts] = useState<RegistrationDraft[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDrafts = async () => {
    setLoading(true);
    try {
      const list = await getRegistrationDrafts();
      setDrafts(list);
    } catch (e) {
      console.error('Error loading drafts:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDrafts();
  }, []);

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`آیا از حذف پیش‌نویس ثبت‌نام «${name || 'بدون نام'}» اطمینان دارید؟`)) {
      await deleteRegistrationDraft(id);
      fetchDrafts();
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 flex items-center gap-2">
            <FileEdit className="w-7 h-7 text-emerald-600" />
            پیش‌نویس‌ها و ثبت‌نام‌های ناتمام
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            لیست پرونده‌های ثبت‌نامی که ذخیره موقت شده‌اند و قابلیت ادامه تکمیل از همان مرحله را دارند.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={fetchDrafts}
            className="p-2.5 text-slate-600 hover:text-emerald-700 hover:bg-slate-100 rounded-xl transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            type="button"
            onClick={onNewRegistration}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 transition-all"
          >
            شروع ثبت‌نام جدید
          </button>
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="p-12 text-center text-slate-400">در حال بارگذاری پیش‌نویس‌ها...</div>
      ) : drafts.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center space-y-3">
          <Clock className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-sm font-bold text-slate-700">هیچ پیش‌نویس ذخیره‌شده‌ای وجود ندارد</h3>
          <p className="text-xs text-slate-400">کلیه مراحل ثبت‌نام نهایی شده یا پاکسازی شده‌اند.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {drafts.map((d) => {
            const name = `${d.formData.firstName || ''} ${d.formData.lastName || ''}`.trim() || 'پرسنل جدید (بدون نام)';
            const progress = Math.round((d.currentStep / 16) * 100);

            return (
              <div key={d.id} className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs hover:border-emerald-300 transition-all space-y-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-800 text-[11px] font-bold rounded-lg border border-emerald-200">
                      مرحله {d.currentStep} از ۱۶ ({progress}٪)
                    </span>
                    <button
                      type="button"
                      onClick={() => handleDelete(d.id, name)}
                      className="text-slate-400 hover:text-rose-600 p-1 transition-colors"
                      title="حذف پیش‌نویس"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <h3 className="font-bold text-slate-800 text-base mt-3">{name}</h3>
                  <div className="text-xs text-slate-500 space-y-1 mt-2">
                    <p>کد پرسنلی موقت: <span className="font-mono font-semibold text-slate-700">{d.formData.employeeCode || '-'}</span></p>
                    <p>کد ملی: <span className="font-mono text-slate-700">{d.formData.nationalId || '-'}</span></p>
                    <p>آخرین ویرایش: <span className="font-mono text-slate-400">{toJalaliDateTime(d.updatedAt)}</span></p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onResumeDraft(d.id)}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 transition-all"
                >
                  <Play className="w-3.5 h-3.5" />
                  ادامه فرآیند ثبت‌نام
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
