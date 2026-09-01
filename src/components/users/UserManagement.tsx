import React, { useState, useEffect } from 'react';
import { 
  Shield, UserPlus, Key, UserCheck, Trash2, Edit3, 
  Search, Lock, CheckCircle2, AlertCircle, Eye, EyeOff, 
  Building, Mail, Phone, RefreshCw, Sparkles, UserX, ArrowRight
} from 'lucide-react';
import { AppUser, UserRole, Department } from '../../types';
import { getAppUsers, createAppUser, updateAppUser, deleteAppUser } from '../../services/userService';
import { getDepartments } from '../../services/masterDataService';
import { useAuth } from '../../context/AuthContext';

const ROLE_DEFINITIONS: Record<UserRole, { label: string; badgeClass: string; desc: string }> = {
  super_admin: { 
    label: '👑 مدیر ارشد سامانه (Super Admin)', 
    badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    desc: 'دسترسی کامل و تام به تمام ماژول‌ها، پایگاه داده، ممیزی و تنظیمات'
  },
  hr_admin: { 
    label: '👔 مدیر منابع انسانی (HR Admin)', 
    badgeClass: 'bg-teal-100 text-teal-800 border-teal-300',
    desc: 'مدیریت پرسنل، صدور احکام، چارت سازمانی و پیش‌نویس‌ها'
  },
  hr_manager: { 
    label: '📋 کارشناس ارشد کارگزینی (HR Manager)', 
    badgeClass: 'bg-sky-100 text-sky-800 border-sky-300',
    desc: 'ثبت پرونده‌های استخدامی ۱۶ مرحله‌ای، آپلود مدارک و ویرایش اطلاعات'
  },
  finance: { 
    label: '💰 امور مالی و حقوق‌دستمزد (Finance)', 
    badgeClass: 'bg-amber-100 text-amber-800 border-amber-300',
    desc: 'مشاهده و مدیریت فیش حقوق، حساب‌های بانکی و کسورات قانونی'
  },
  department_manager: { 
    label: '🏢 مدیر دپارتمان (Dept Manager)', 
    badgeClass: 'bg-purple-100 text-purple-800 border-purple-300',
    desc: 'مشاهده چارت و پرونده پرسنل تحت مدیریت خود در دپارتمان'
  },
  employee: { 
    label: '👤 کارمند عادی (Employee)', 
    badgeClass: 'bg-slate-100 text-slate-700 border-slate-300',
    desc: 'مشاهده پروفایل فردی و احکام کارگزینی شخصی'
  }
};

export const UserManagement: React.FC = () => {
  const { role: currentRole, switchRole } = useAuth();
  const [users, setUsers] = useState<AppUser[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  
  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AppUser | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Form fields
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    displayName: '',
    email: '',
    phoneNumber: '',
    role: 'hr_manager' as UserRole,
    departmentId: '',
    status: 'active' as 'active' | 'inactive',
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [uList, dList] = await Promise.all([
        getAppUsers(),
        getDepartments()
      ]);
      setUsers(uList);
      setDepartments(dList);
    } catch (err: any) {
      setErrorMsg('خطا در دریافت لیست کاربران');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenCreateModal = () => {
    setEditingUser(null);
    setFormData({
      username: '',
      password: '',
      confirmPassword: '',
      displayName: '',
      email: '',
      phoneNumber: '',
      role: 'hr_manager',
      departmentId: departments[0]?.id || '',
      status: 'active',
    });
    setErrorMsg('');
    setIsCreateModalOpen(true);
  };

  const handleOpenEditModal = (user: AppUser) => {
    setEditingUser(user);
    setFormData({
      username: user.username,
      password: user.password || '',
      confirmPassword: user.password || '',
      displayName: user.displayName,
      email: user.email,
      phoneNumber: user.phoneNumber || '',
      role: user.role,
      departmentId: user.departmentId || '',
      status: user.status,
    });
    setErrorMsg('');
    setIsCreateModalOpen(true);
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!formData.username.trim()) {
      setErrorMsg('وارد کردن نام کاربری الزامی است.');
      return;
    }
    if (!formData.displayName.trim()) {
      setErrorMsg('وارد کردن نام و نام خانوادگی الزامی است.');
      return;
    }
    if (!formData.password) {
      setErrorMsg('وارد کردن گذرواژه الزامی است.');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setErrorMsg('گذرواژه و تکرار آن با یکدیگر مطابقت ندارند.');
      return;
    }

    const selectedDept = departments.find(d => d.id === formData.departmentId);

    try {
      if (editingUser) {
        // Update
        await updateAppUser(editingUser.id, {
          username: formData.username,
          displayName: formData.displayName,
          email: formData.email,
          phoneNumber: formData.phoneNumber,
          password: formData.password,
          role: formData.role,
          departmentId: formData.departmentId,
          departmentName: selectedDept?.name,
          status: formData.status
        });
        setSuccessMsg(`حساب کاربری ${formData.username} با موفقیت ویرایش شد.`);
      } else {
        // Create
        await createAppUser({
          username: formData.username,
          password: formData.password,
          displayName: formData.displayName,
          email: formData.email || `${formData.username}@company.ir`,
          phoneNumber: formData.phoneNumber,
          role: formData.role,
          departmentId: formData.departmentId,
          departmentName: selectedDept?.name,
          status: formData.status
        });
        setSuccessMsg(`کاربر جدید "${formData.username}" با نقش ${formData.role} با موفقیت ایجاد گردید.`);
      }

      setIsCreateModalOpen(false);
      await loadData();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err: any) {
      setErrorMsg(err?.message || 'خطا در ذخیره‌سازی اطلاعات کاربر');
    }
  };

  const handleDeleteUser = async (user: AppUser) => {
    if (user.username === 'admin') {
      alert('حذف کاربر پیش‌فرض مدیر ارشد سامانه مجاز نمی‌باشد.');
      return;
    }

    if (confirm(`آیا از حذف کامل حساب کاربری "${user.displayName}" (${user.username}) از سامانه اطمینان دارید؟`)) {
      try {
        await deleteAppUser(user.id);
        setSuccessMsg(`کاربر ${user.username} با موفقیت حذف گردید.`);
        await loadData();
        setTimeout(() => setSuccessMsg(''), 4000);
      } catch (err: any) {
        alert(err?.message || 'خطا در حذف کاربر');
      }
    }
  };

  const handleSimulateLogin = (user: AppUser) => {
    switchRole(user.role);
    setSuccessMsg(`نقش جاری سامانه به «${user.displayName} (${ROLE_DEFINITIONS[user.role]?.label})» تغییر یافت.`);
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const filteredUsers = users.filter(u => {
    const matchesSearch = 
      u.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-2xl bg-emerald-100 text-emerald-800">
              <Shield className="w-6 h-6" />
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-slate-800">
              مدیریت کاربران، حساب‌های کاربری و سطوح دسترسی (RBAC)
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
            امکان تعریف نام کاربری، گذرواژه، تعیین نقش سازمانی، اختصاص به دپارتمان و تنظیم دسترسی‌های امنیتی سامانه
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreateModal}
          className="inline-flex items-center gap-2 px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-black shadow-md shadow-emerald-600/20 transition-all hover:scale-102 self-start sm:self-auto cursor-pointer"
        >
          <UserPlus className="w-4 h-4" />
          تعریف کاربر و گذرواژه جدید
        </button>
      </div>

      {/* Success / Error Alerts */}
      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-bold flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg('')} className="text-xs font-bold text-slate-400 hover:text-slate-600">×</button>
        </div>
      )}

      {/* Search & Filters */}
      <div className="bg-white border border-slate-200 rounded-3xl p-4 sm:p-6 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-72">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="جستجوی نام، نام کاربری یا ایمیل..."
            className="w-full h-10 bg-slate-50 border border-slate-200 rounded-2xl pr-10 pl-3 text-xs focus:ring-2 focus:ring-emerald-500 focus:bg-white text-slate-800 transition-all"
          />
          <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3 pointer-events-none" />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <span className="text-xs text-slate-400 font-medium shrink-0">فیلتر نقش:</span>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="h-10 bg-slate-50 border border-slate-200 rounded-2xl px-3 text-xs font-bold text-slate-700 focus:ring-2 focus:ring-emerald-500"
          >
            <option value="all">همه نقش‌ها ({users.length})</option>
            <option value="super_admin">👑 مدیر ارشد سامانه</option>
            <option value="hr_admin">👔 مدیر منابع انسانی</option>
            <option value="hr_manager">📋 کارشناس کارگزینی</option>
            <option value="finance">💰 امور مالی و حقوق</option>
            <option value="department_manager">🏢 مدیر دپارتمان</option>
            <option value="employee">👤 کارمند</option>
          </select>
        </div>
      </div>

      {/* Users Table Card */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-emerald-600" />
            حساب‌های کاربری فعال در پایگاه داده ({filteredUsers.length} کاربر)
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
                <th className="pb-3 font-semibold">کاربر / نام و نام خانوادگی</th>
                <th className="pb-3 font-semibold">نام کاربری (Login)</th>
                <th className="pb-3 font-semibold">نقش و سطح دسترسی</th>
                <th className="pb-3 font-semibold">دپارتمان</th>
                <th className="pb-3 font-semibold">وضعیت</th>
                <th className="pb-3 font-semibold">تاریخ ایجاد</th>
                <th className="pb-3 font-semibold text-center">عملیات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.map((u) => {
                const roleDef = ROLE_DEFINITIONS[u.role] || ROLE_DEFINITIONS.employee;
                return (
                  <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-xs border border-emerald-200 shrink-0">
                          {u.displayName.slice(0, 2)}
                        </div>
                        <div>
                          <span className="font-extrabold text-slate-800 block">{u.displayName}</span>
                          <span className="text-[11px] text-slate-400">{u.email}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 font-mono font-bold text-slate-700">
                      <span className="bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
                        {u.username}
                      </span>
                    </td>
                    <td className="py-3.5">
                      <span className={`px-2.5 py-1 rounded-xl text-[11px] font-bold border ${roleDef.badgeClass}`}>
                        {roleDef.label}
                      </span>
                    </td>
                    <td className="py-3.5 text-slate-600 font-medium">
                      {u.departmentName || 'تمام سازمان'}
                    </td>
                    <td className="py-3.5">
                      {u.status === 'active' ? (
                        <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-[10px] font-bold">فعال</span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 text-[10px] font-bold">غیرفعال</span>
                      )}
                    </td>
                    <td className="py-3.5 text-slate-500 font-mono text-[11px]">
                      {u.createdAtJalali || '۱۴۰۳/۰۱/۰۱'}
                    </td>
                    <td className="py-3.5 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleSimulateLogin(u)}
                          className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[11px] font-bold transition-colors"
                          title="سوییچ نقش به این کاربر"
                        >
                          تغییر نقش به این کاربر
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(u)}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                          title="ویرایش کاربر و تغییر رمز عبور"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        {u.username !== 'admin' && (
                          <button
                            type="button"
                            onClick={() => handleDeleteUser(u)}
                            className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 transition-colors"
                            title="حذف حساب کاربری"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Role Descriptions Reference Card */}
      <div className="bg-slate-50 border border-slate-200 rounded-3xl p-6 shadow-2xs space-y-4">
        <h4 className="font-extrabold text-slate-800 text-xs flex items-center gap-2">
          <Shield className="w-4 h-4 text-emerald-600" />
          راهنمای سطوح دسترسی سازمانی سامانه همکار
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {Object.entries(ROLE_DEFINITIONS).map(([key, item]) => (
            <div key={key} className="p-3 bg-white rounded-2xl border border-slate-200 space-y-1">
              <span className={`inline-block px-2 py-0.5 rounded-lg text-[10px] font-bold border ${item.badgeClass}`}>
                {item.label}
              </span>
              <p className="text-[11px] text-slate-500 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ====================================================== */}
      {/* MODAL: CREATE / EDIT USER WITH USERNAME & PASSWORD */}
      {/* ====================================================== */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-100 animate-fadeIn max-h-[90vh] overflow-y-auto space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-emerald-100 text-emerald-800">
                  <Key className="w-5 h-5" />
                </span>
                <h3 className="text-base font-extrabold text-slate-800">
                  {editingUser ? 'ویرایش کاربر و تنظیم گذرواژه' : 'تعریف کاربر جدید با گذرواژه'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-xs font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSaveUser} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Display Name */}
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-xs font-bold text-slate-700">نام و نام خانوادگی *</label>
                  <input
                    type="text"
                    required
                    value={formData.displayName}
                    onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                    placeholder="مثال: مهندس حسام زینلی"
                    className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs focus:ring-2 focus:ring-emerald-500 focus:bg-white text-slate-800 font-medium"
                  />
                </div>

                {/* Username */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">نام کاربری (Username) *</label>
                  <input
                    type="text"
                    required
                    dir="ltr"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    placeholder="e.g. h.zeinali"
                    className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs focus:ring-2 focus:ring-emerald-500 focus:bg-white text-slate-800 font-mono"
                  />
                </div>

                {/* Email */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">پست الکترونیکی سازمانی</label>
                  <input
                    type="email"
                    dir="ltr"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="user@company.ir"
                    className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs focus:ring-2 focus:ring-emerald-500 focus:bg-white text-slate-800 font-mono"
                  />
                </div>

                {/* Password */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">گذرواژه (Password) *</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      dir="ltr"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder="حداقل ۶ کاراکتر"
                      className="w-full h-10 pr-3 pl-10 bg-slate-50 border border-slate-200 rounded-2xl text-xs focus:ring-2 focus:ring-emerald-500 focus:bg-white text-slate-800 font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute left-3 top-2.5 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">تکرار گذرواژه *</label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    dir="ltr"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    placeholder="تکرار گذرواژه"
                    className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs focus:ring-2 focus:ring-emerald-500 focus:bg-white text-slate-800 font-mono"
                  />
                </div>

                {/* Role */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">نقش و سطح دسترسی *</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                    className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="super_admin">👑 مدیر ارشد سامانه (Super Admin)</option>
                    <option value="hr_admin">👔 مدیر منابع انسانی (HR Admin)</option>
                    <option value="hr_manager">📋 کارشناس کارگزینی (HR Manager)</option>
                    <option value="finance">💰 امور مالی و حقوق (Finance)</option>
                    <option value="department_manager">🏢 مدیر دپارتمان (Dept Manager)</option>
                    <option value="employee">👤 کارمند (Employee)</option>
                  </select>
                </div>

                {/* Department */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">دپارتمان مربوطه</label>
                  <select
                    value={formData.departmentId}
                    onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
                    className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="">دسترسی به کل سازمان</option>
                    {departments.map((dept) => (
                      <option key={dept.id} value={dept.id}>{dept.name}</option>
                    ))}
                  </select>
                </div>

                {/* Status */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">وضعیت حساب کاربری</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as 'active' | 'inactive' })}
                    className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="active">فعال (Active)</option>
                    <option value="inactive">غیرفعال و مسدود (Inactive)</option>
                  </select>
                </div>

                {/* Phone */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">شماره همراه</label>
                  <input
                    type="text"
                    dir="ltr"
                    value={formData.phoneNumber}
                    onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                    placeholder="0912..."
                    className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs focus:ring-2 focus:ring-emerald-500 focus:bg-white text-slate-800 font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl text-xs font-bold transition-colors"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-black shadow-md shadow-emerald-600/20 transition-all hover:scale-102"
                >
                  {editingUser ? 'بروزرسانی مشخصات و گذرواژه' : 'ثبت و فعال‌سازی کاربر'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
