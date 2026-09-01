import React, { useState, useEffect, useRef } from 'react';
import { 
  Database, Download, Upload, ShieldCheck, Clock, 
  Calendar, CheckCircle2, AlertTriangle, RefreshCw, 
  FileText, Sparkles, Server, HardDrive, ArrowDownToLine,
  Sliders, Layers, Users, Building, Shield
} from 'lucide-react';
import { BackupRecord, BackupScheduleConfig } from '../../types';
import { 
  getBackupHistory, 
  createBackupSnapshot, 
  downloadBackupFile, 
  restoreFromBackup, 
  getBackupScheduleConfig, 
  saveBackupScheduleConfig 
} from '../../services/backupService';
import { toJalaliDate } from '../../utils/persianDate';

export const BackupManagement: React.FC = () => {
  const [backups, setBackups] = useState<BackupRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [creatingType, setCreatingType] = useState<string | null>(null);
  const [scheduleConfig, setScheduleConfig] = useState<BackupScheduleConfig>(getBackupScheduleConfig());
  
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);
  const [selectedBackupToRestore, setSelectedBackupToRestore] = useState<BackupRecord | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const history = await getBackupHistory();
      setBackups(history);
      setScheduleConfig(getBackupScheduleConfig());
    } catch (e) {
      console.warn('Error fetching backups:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateBackup = async (type: 'daily' | 'monthly' | 'manual') => {
    setCreatingType(type);
    setStatusMessage(null);
    try {
      const newBackup = await createBackupSnapshot(type);
      setStatusMessage({
        type: 'success',
        text: `نسخه پشتیبان ${type === 'daily' ? 'روزانه' : type === 'monthly' ? 'ماهانه' : 'دستی'} با موفقیت تهیه و ذخیره شد.`
      });
      await loadData();
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: `خطا در تهیه نسخه پشتیبان: ${err?.message || 'ناموفق'}`
      });
    } finally {
      setCreatingType(null);
    }
  };

  const handleSaveSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    saveBackupScheduleConfig(scheduleConfig);
    setStatusMessage({
      type: 'success',
      text: 'تنظیمات زمان‌بندی پشتیبان‌گیری خودکار با موفقیت ذخیره گردید.'
    });
    setTimeout(() => setStatusMessage(null), 4000);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const content = event.target?.result as string;
      if (confirm(`آیا از بازیابی اطلاعات سامانه از فایل انتخابی "${file.name}" اطمینان دارید؟ تمام داده‌های موجود بر اساس این فایل بروزرسانی خواهند شد.`)) {
        setIsRestoring(true);
        setStatusMessage(null);
        try {
          const res = await restoreFromBackup(content);
          setStatusMessage({
            type: 'success',
            text: res.message
          });
          await loadData();
        } catch (err: any) {
          setStatusMessage({
            type: 'error',
            text: err?.message || 'خطا در بازیابی اطلاعات'
          });
        } finally {
          setIsRestoring(false);
          if (fileInputRef.current) fileInputRef.current.value = '';
        }
      }
    };
    reader.readAsText(file);
  };

  const handleRestoreRecord = async (b: BackupRecord) => {
    if (!b.data) {
      alert('محتوای داخلی این نسخه در حافظه مرورگر وجود ندارد. لطفاً فایل JSON دانلود شده آن را از بخش آپلود بازیابی نمایید.');
      return;
    }

    if (confirm(`آیا مطمئن هستید که می‌خواهید سامانه را به نسخه پشتیبان مورخ ${b.createdAtJalali} بازیابی نمایید؟`)) {
      setIsRestoring(true);
      setStatusMessage(null);
      try {
        const res = await restoreFromBackup(JSON.stringify(b.data));
        setStatusMessage({
          type: 'success',
          text: `سامانه با موفقیت به نسخه ${b.title} بازیابی شد.`
        });
        await loadData();
      } catch (err: any) {
        setStatusMessage({
          type: 'error',
          text: err?.message || 'خطا در بازیابی نسخه'
        });
      } finally {
        setIsRestoring(false);
      }
    }
  };

  const latestDaily = backups.find(b => b.type === 'daily');
  const latestMonthly = backups.find(b => b.type === 'monthly');
  const totalStorageKb = backups.reduce((acc, b) => acc + (b.fileSizeKb || 0), 0);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Hidden File Input for Restore */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept=".json"
        className="hidden"
      />

      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-2xl bg-emerald-100 text-emerald-800">
              <Database className="w-6 h-6" />
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-slate-800">
              سیستم پشتیبان‌گیری روزانه، ماهانه و بازیابی داده‌ها
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
            محافظت از کلیه سوابق پرسنلی، احکام، دپارتمان‌ها، لاگ‌های ممیزی و حساب‌های کاربری با تهیه نسخه‌های خودکار روزانه و ماهانه و قابلیت بازیابی فوری
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isRestoring}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-2xl text-xs font-bold transition-all border border-slate-200 cursor-pointer disabled:opacity-50"
          >
            <Upload className="w-4 h-4 text-slate-600" />
            {isRestoring ? 'در حال بازیابی...' : 'بازیابی از فایل پشتیبان (.json)'}
          </button>

          <button
            type="button"
            onClick={() => handleCreateBackup('manual')}
            disabled={creatingType !== null}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-black shadow-md shadow-emerald-600/20 transition-all hover:scale-102 cursor-pointer disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            {creatingType === 'manual' ? 'در حال ایجاد...' : 'تهیه نسخه پشتیبان دستی هم‌اکنون'}
          </button>
        </div>
      </div>

      {/* Status Alert */}
      {statusMessage && (
        <div className={`p-4 rounded-2xl text-xs font-bold flex items-center justify-between animate-fadeIn border ${
          statusMessage.type === 'success' 
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
            : 'bg-rose-50 border-rose-200 text-rose-800'
        }`}>
          <div className="flex items-center gap-2">
            {statusMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{statusMessage.text}</span>
          </div>
          <button onClick={() => setStatusMessage(null)} className="text-slate-400 hover:text-slate-600 text-sm">✕</button>
        </div>
      )}

      {/* KPI Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Daily Backup KPI */}
        <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-bold">پشتیبان روزانه</span>
            <span className="p-2 rounded-xl bg-emerald-50 text-emerald-700">
              <Clock className="w-4 h-4" />
            </span>
          </div>
          <div className="text-lg font-black text-slate-800 font-mono">
            {latestDaily ? latestDaily.createdAtJalali : 'ثبت نشده'}
          </div>
          <div className="flex items-center justify-between pt-1">
            <span className="text-[11px] text-emerald-600 font-medium flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              زمان‌بندی فعال ({scheduleConfig.dailyBackupTime})
            </span>
            <button
              onClick={() => handleCreateBackup('daily')}
              disabled={creatingType !== null}
              className="text-[10px] font-bold text-slate-600 hover:text-emerald-700 underline"
            >
              اجرای فوری
            </button>
          </div>
        </div>

        {/* Monthly Backup KPI */}
        <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-bold">پشتیبان ماهانه</span>
            <span className="p-2 rounded-xl bg-indigo-50 text-indigo-700">
              <Calendar className="w-4 h-4" />
            </span>
          </div>
          <div className="text-lg font-black text-slate-800 font-mono">
            {latestMonthly ? latestMonthly.createdAtJalali : 'ثبت نشده'}
          </div>
          <div className="flex items-center justify-between pt-1">
            <span className="text-[11px] text-indigo-600 font-medium flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              روز اول هر ماه شمسی
            </span>
            <button
              onClick={() => handleCreateBackup('monthly')}
              disabled={creatingType !== null}
              className="text-[10px] font-bold text-slate-600 hover:text-indigo-700 underline"
            >
              اجرای فوری
            </button>
          </div>
        </div>

        {/* Total Snapshots Count */}
        <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-bold">تعداد کل نسخه‌ها</span>
            <span className="p-2 rounded-xl bg-amber-50 text-amber-700">
              <Server className="w-4 h-4" />
            </span>
          </div>
          <div className="text-lg font-black text-slate-800">
            {backups.length} <span className="text-xs text-slate-400 font-normal">نسخه پشتیبان</span>
          </div>
          <p className="text-[11px] text-slate-400">
            نگهداری خودکار ۳۰ روزه
          </p>
        </div>

        {/* Total Storage Size */}
        <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-bold">حجم آرشیو پشتیبان</span>
            <span className="p-2 rounded-xl bg-teal-50 text-teal-700">
              <HardDrive className="w-4 h-4" />
            </span>
          </div>
          <div className="text-lg font-black text-slate-800 font-mono">
            {totalStorageKb} <span className="text-xs text-slate-400 font-normal">کیلوبایت</span>
          </div>
          <p className="text-[11px] text-teal-700 font-medium">
            فرمت فشرده JSON استاندارد
          </p>
        </div>
      </div>

      {/* Automated Backup Schedule Configuration */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="font-black text-slate-800 text-sm flex items-center gap-2">
            <Sliders className="w-4 h-4 text-emerald-600" />
            تنظیمات زمان‌بندی خودکار پشتیبان‌گیری
          </h3>
          <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-xl text-[10px] font-bold">
            سرویس پس‌زمینه فعال ✓
          </span>
        </div>

        <form onSubmit={handleSaveSchedule} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
          {/* Daily Switch & Time */}
          <div className="space-y-1.5 p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700">پشتیبان‌گیری روزانه</label>
              <input
                type="checkbox"
                checked={scheduleConfig.dailyBackupEnabled}
                onChange={(e) => setScheduleConfig({ ...scheduleConfig, dailyBackupEnabled: e.target.checked })}
                className="w-4 h-4 text-emerald-600 rounded"
              />
            </div>
            <div className="pt-2">
              <span className="text-[11px] text-slate-400 block mb-1">ساعت اجرای روزانه:</span>
              <input
                type="time"
                value={scheduleConfig.dailyBackupTime}
                onChange={(e) => setScheduleConfig({ ...scheduleConfig, dailyBackupTime: e.target.value })}
                className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-mono text-slate-800 font-bold"
              />
            </div>
          </div>

          {/* Monthly Switch & Day */}
          <div className="space-y-1.5 p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700">پشتیبان‌گیری ماهانه</label>
              <input
                type="checkbox"
                checked={scheduleConfig.monthlyBackupEnabled}
                onChange={(e) => setScheduleConfig({ ...scheduleConfig, monthlyBackupEnabled: e.target.checked })}
                className="w-4 h-4 text-emerald-600 rounded"
              />
            </div>
            <div className="pt-2">
              <span className="text-[11px] text-slate-400 block mb-1">روز اجرای هر ماه:</span>
              <select
                value={scheduleConfig.monthlyBackupDay}
                onChange={(e) => setScheduleConfig({ ...scheduleConfig, monthlyBackupDay: Number(e.target.value) })}
                className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 font-bold"
              >
                <option value={1}>روز اول ماه</option>
                <option value={15}>روز پانزدهم ماه</option>
                <option value={30}>روز آخر ماه</option>
              </select>
            </div>
          </div>

          {/* Retention Days */}
          <div className="space-y-1.5 p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
            <label className="text-xs font-bold text-slate-700 block">دوره نگهداری آرشیو</label>
            <span className="text-[11px] text-slate-400 block">مدت زمان ذخیره نسخه‌های قدیمی:</span>
            <select
              value={scheduleConfig.retentionDays}
              onChange={(e) => setScheduleConfig({ ...scheduleConfig, retentionDays: Number(e.target.value) })}
              className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 font-bold mt-2"
            >
              <option value={15}>۱۵ روز</option>
              <option value={30}>۳۰ روز (توصیه شده)</option>
              <option value={90}>۹۰ روز (فصلی)</option>
              <option value={365}>یک سال کامل</option>
            </select>
          </div>

          {/* Save Button */}
          <button
            type="submit"
            className="w-full h-11 bg-emerald-800 hover:bg-emerald-900 text-white rounded-2xl text-xs font-bold transition-all shadow-xs"
          >
            ذخیره تنظیمات زمان‌بندی
          </button>
        </form>
      </div>

      {/* Backup History Table Card */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-2">
            <Database className="w-4 h-4 text-emerald-600" />
            تاریخچه نسخه‌های پشتیبان ثبت‌شده در سامانه ({backups.length} نسخه)
          </h3>
          <button
            type="button"
            onClick={loadData}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors"
            title="بروزرسانی لیست"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="text-slate-400 border-b border-slate-100">
                <th className="pb-3 font-semibold">عنوان نسخه پشتیبان</th>
                <th className="pb-3 font-semibold">نوع نسخه</th>
                <th className="pb-3 font-semibold">تاریخ و زمان ثبت</th>
                <th className="pb-3 font-semibold">آمار داده‌ها</th>
                <th className="pb-3 font-semibold">حجم فایل</th>
                <th className="pb-3 font-semibold">کد صحت (Checksum)</th>
                <th className="pb-3 font-semibold text-center">عملیات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {backups.map((b) => (
                <tr key={b.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3.5">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-slate-400" />
                      <span className="font-bold text-slate-800">{b.title}</span>
                    </div>
                  </td>
                  <td className="py-3.5">
                    {b.type === 'daily' ? (
                      <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-lg text-[10px] font-bold">
                        روزانه خودکار
                      </span>
                    ) : b.type === 'monthly' ? (
                      <span className="px-2.5 py-1 bg-indigo-100 text-indigo-800 rounded-lg text-[10px] font-bold">
                        ماهانه خودکار
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 bg-amber-100 text-amber-800 rounded-lg text-[10px] font-bold">
                        دستی
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 font-mono text-slate-600 text-[11px]">
                    {b.createdAtJalali} • {new Date(b.createdAt).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="py-3.5 text-slate-600">
                    <span className="text-[11px]">
                      {b.recordCounts.employees} پرسنل | {b.recordCounts.departments} دپارتمان | {b.recordCounts.auditLogs} لاگ
                    </span>
                  </td>
                  <td className="py-3.5 font-mono text-slate-600 text-[11px]">
                    {b.fileSizeKb} KB
                  </td>
                  <td className="py-3.5 font-mono text-[10px] text-slate-400">
                    {b.checksum}
                  </td>
                  <td className="py-3.5 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => downloadBackupFile(b)}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-lg text-[11px] font-bold transition-colors"
                        title="دانلود مستقیم فایل JSON"
                      >
                        <ArrowDownToLine className="w-3.5 h-3.5" />
                        دانلود
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRestoreRecord(b)}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-bold transition-colors"
                        title="بازیابی پایگاه داده به این نسخه"
                      >
                        <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
                        بازیابی
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
