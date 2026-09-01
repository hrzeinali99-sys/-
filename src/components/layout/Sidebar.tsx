import React from 'react';
import { 
  LayoutDashboard, UserPlus, Users, FileEdit, 
  Layers, Shield, Sparkles, Building2, CheckCircle2,
  Database, UserCheck, Key, FileSpreadsheet, FileText, BarChart3,
  FileSignature
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export type NavItem = 'dashboard' | 'excel' | 'employees' | 'contracts' | 'reports' | 'org' | 'users' | 'backups' | 'audit';

interface Props {
  currentTab: NavItem;
  onSelectTab: (tab: NavItem) => void;
}

export const Sidebar: React.FC<Props> = ({ currentTab, onSelectTab }) => {
  const { profile, role, canAccess } = useAuth();

  const navItems = [
    {
      id: 'dashboard' as NavItem,
      title: 'داشبورد مدیریتی',
      icon: LayoutDashboard,
      desc: 'آمار و شاخص‌های کلیدی'
    },
    {
      id: 'excel' as NavItem,
      title: 'ورود پرسنل از اکسل',
      icon: FileSpreadsheet,
      desc: 'ثبت دسته‌ای با اعتبارسنجی',
      badge: 'اصلی',
      allowed: canAccess('employee.create')
    },
    {
      id: 'employees' as NavItem,
      title: 'بانک جامع پرسنل',
      icon: Users,
      desc: 'جستجو و پرونده ۳۶۰ درجه'
    },
    {
      id: 'contracts' as NavItem,
      title: 'تنظیم و چاپ قراردادها',
      icon: FileSignature,
      desc: 'ماهانه، ۶ ماهه، سالانه و پرینت',
      badge: 'جدید',
      allowed: true
    },
    {
      id: 'reports' as NavItem,
      title: 'گزارش‌گیری و آمار',
      icon: FileText,
      desc: 'احکام، قراردادها و اکسل',
      badge: 'تحلیلی'
    },

    {
      id: 'org' as NavItem,
      title: 'ساختار سازمانی و دپارتمان‌ها',
      icon: Layers,
      desc: 'تعریف و حذف دپارتمان‌ها و چارت'
    },
    {
      id: 'users' as NavItem,
      title: 'کاربران و سطوح دسترسی',
      icon: UserCheck,
      desc: 'تعریف نام کاربری، گذرواژه و نقش',
      badge: 'RBAC',
      allowed: ['super_admin', 'hr_admin'].includes(role)
    },
    {
      id: 'backups' as NavItem,
      title: 'پشتیبان‌گیری روزانه و ماهانه',
      icon: Database,
      desc: 'آرشیو خودکار و بازیابی داده‌ها',
      allowed: ['super_admin', 'hr_admin'].includes(role)
    },
    {
      id: 'audit' as NavItem,
      title: 'لاگ ممیزی و امنیت',
      icon: Shield,
      desc: 'ردیابی تغییرات سیستم',
      allowed: canAccess('audit.read')
    }
  ];

  return (
    <aside className="w-full md:w-64 shrink-0 bg-emerald-950 text-white rounded-3xl p-4 flex flex-col justify-between shadow-xl shadow-emerald-950/20 border border-emerald-900/60 overflow-hidden">
      <div className="space-y-6">
        {/* Navigation Links */}
        <nav className="space-y-1.5">
          <div className="px-3 pb-1 text-[10px] font-bold text-emerald-400/70 uppercase tracking-wider font-titr">
            منوی اصلی سامانه
          </div>

          {navItems.map((item) => {
            if (item.allowed === false) return null;
            const Icon = item.icon;
            const isActive = currentTab === item.id;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectTab(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all text-right cursor-pointer ${
                  isActive
                    ? 'bg-emerald-700 text-white shadow-lg shadow-emerald-900/40 translate-x-[-2px]'
                    : 'text-emerald-300 hover:bg-emerald-900/90 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4.5 h-4.5 shrink-0 ${isActive ? 'text-white' : 'text-emerald-400'}`} />
                  <div>
                    <span className="block font-titr">{item.title}</span>
                    <span className={`text-[10px] font-normal block mt-0.5 font-nazanin ${isActive ? 'text-emerald-200' : 'text-emerald-400/70'}`}>
                      {item.desc}
                    </span>
                  </div>
                </div>

                {item.badge && (
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold font-titr ${
                    isActive ? 'bg-white text-emerald-900' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </aside>
  );
};

