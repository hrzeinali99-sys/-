import React, { useState, useEffect } from 'react';
import { History, Shield, RefreshCw, Search, Filter, User, Clock, AlertCircle } from 'lucide-react';
import { AuditLogEntry } from '../../types';
import { getAuditLogs } from '../../services/auditService';
import { toJalaliDateTime } from '../../utils/persianDate';

export const AuditLogViewer: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('all');

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const data = await getAuditLogs(100);
      setLogs(data);
    } catch (e) {
      console.error('Error loading audit logs:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const filteredLogs = logs.filter(l => {
    const matchesSearch = 
      !searchTerm ||
      l.performedByName.includes(searchTerm) ||
      l.description?.includes(searchTerm) ||
      l.entityId?.includes(searchTerm);

    const matchesAction = actionFilter === 'all' || l.action === actionFilter;

    return matchesSearch && matchesAction;
  });

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 flex items-center gap-2">
            <Shield className="w-7 h-7 text-emerald-600" />
            لاگ جامع ممیزی و رویدادهای امنیتی سیستم (Audit Trail)
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            ردیابی تغییرات احکام، حذف، ویرایش، ورود، تغییر نقش و دسترسی‌های پرسنل
          </p>
        </div>

        <button
          type="button"
          onClick={fetchLogs}
          className="p-2.5 text-slate-600 hover:text-emerald-700 hover:bg-slate-100 rounded-xl transition-colors self-start sm:self-auto"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Filter and Search */}
      <div className="bg-white border border-slate-200 rounded-3xl p-4 shadow-xs flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="جستجو در نام کاربر، توضیحات یا شناسه پرونده..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-4 pr-10 py-2.5 rounded-xl border border-slate-300 focus:border-emerald-500 text-xs"
          />
          <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
        </div>

        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          className="px-4 py-2.5 rounded-xl border border-slate-300 text-xs bg-white"
        >
          <option value="all">همه اکشن‌ها</option>
          <option value="CREATE">CREATE (ایجاد)</option>
          <option value="UPDATE">UPDATE (ویرایش)</option>
          <option value="DELETE">DELETE (حذف)</option>
          <option value="STATUS_CHANGE">STATUS_CHANGE (تغییر وضعیت)</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xs">
        {loading ? (
          <div className="p-12 text-center text-slate-400">در حال بارگذاری تاریخچه ممیزی...</div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-12 text-center text-slate-400">هیچ رکوردی یافت نشد.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                  <th className="p-4">اقدام‌کننده</th>
                  <th className="p-4">نوع عملیات</th>
                  <th className="p-4">مجموعه / موجودیت</th>
                  <th className="p-4">توضیحات رویداد</th>
                  <th className="p-4">زمان ثبت</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4 font-bold text-slate-800 flex items-center gap-2">
                      <User className="w-4 h-4 text-slate-400" />
                      {log.performedByName}
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-md text-[10px] font-mono font-bold ${
                        log.action === 'CREATE' ? 'bg-emerald-100 text-emerald-800' :
                        log.action === 'DELETE' ? 'bg-rose-100 text-rose-800' :
                        log.action === 'STATUS_CHANGE' ? 'bg-purple-100 text-purple-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="p-4 font-mono text-slate-600">{log.collectionName}</td>
                    <td className="p-4 text-slate-700">{log.description || '-'}</td>
                    <td className="p-4 font-mono text-slate-400">{toJalaliDateTime(log.timestamp)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
