import React, { useState } from 'react';
import { 
  Building2, Shield, Lock, User, Eye, EyeOff, 
  ArrowLeft, CheckCircle2, AlertCircle, Sparkles, Key, 
  Users, UserCheck, ShieldCheck, HelpCircle, RefreshCw
} from 'lucide-react';
import { useAuth, DEMO_PROFILES } from '../../context/AuthContext';

export const LoginPage: React.FC = () => {
  const { 
    signInWithUsernameOrEmail, 
    loginAsDemoUser, 
    signInWithGoogle 
  } = useAuth();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      setErrorMsg('لطفاً نام کاربری خود را وارد نمایید.');
      return;
    }
    if (!password) {
      setErrorMsg('لطفاً رمز عبور خود را وارد نمایید.');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');
    try {
      await signInWithUsernameOrEmail(username, password);
    } catch (err: any) {
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        setErrorMsg('نام کاربری یا رمز عبور وارد شده نادرست است.');
      } else {
        setErrorMsg(err.message || 'خطا در برقراری ارتباط با سامانه احراز هویت.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 sm:p-6 lg:p-8 relative overflow-hidden font-sans text-slate-100 selection:bg-emerald-500 selection:text-white">
      {/* Subtle Background Glow Elements */}
      <div className="absolute top-1/4 -right-20 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 -left-20 w-96 h-96 bg-teal-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Container Card */}
      <div className="w-full max-w-4xl bg-slate-900/90 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden backdrop-blur-md grid grid-cols-1 lg:grid-cols-12 relative z-10">
        
        {/* Right Column: Form (RTL) */}
        <div className="lg:col-span-7 p-6 sm:p-10 flex flex-col justify-between">
          <div>
            {/* Logo & Brand Header */}
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white font-black text-sm shadow-lg shadow-emerald-500/20">
                  HR
                </div>
                <div>
                  <h1 className="text-lg font-black text-white tracking-tight">
                    سامانه همکار
                  </h1>
                  <span className="text-[11px] text-emerald-400 font-medium block">
                    سیستم جامع مدیریت منابع انسانی و امور پرسنلی
                  </span>
                </div>
              </div>

              {/* Login Badge */}
              <div className="px-3.5 py-1.5 bg-slate-800/80 rounded-xl flex items-center gap-1.5 border border-slate-700/60 text-slate-300 text-xs font-bold">
                <Lock className="w-3.5 h-3.5 text-emerald-400" />
                <span>ورود به سامانه</span>
              </div>
            </div>

            {/* Error Notification Banner */}
            {errorMsg && (
              <div className="mb-6 p-3.5 bg-rose-950/60 border border-rose-800/80 rounded-2xl flex items-start gap-2.5 text-rose-200 text-xs animate-shake">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{errorMsg}</span>
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  نام کاربری
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="نام کاربری خود را وارد نمایید (مثال: admin)"
                    className="w-full h-11 bg-slate-950/70 border border-slate-700/80 rounded-xl pr-10 pl-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all font-mono"
                    dir="ltr"
                    autoComplete="username"
                  />
                  <User className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  رمز عبور (گذرواژه)
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full h-11 bg-slate-950/70 border border-slate-700/80 rounded-xl pr-10 pl-10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all font-mono"
                    dir="ltr"
                  />
                  <Lock className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-slate-400 hover:text-slate-200 absolute left-3 top-1/2 -translate-y-1/2 p-1 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-slate-400 hover:text-slate-300">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded border-slate-700 bg-slate-950 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                  />
                  <span>مرا در این مرورگر به خاطر بسپار</span>
                </label>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full h-11 mt-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-xs font-black shadow-lg shadow-emerald-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {isLoading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <span>ورود به سامانه پرسنلی</span>
                    <ArrowLeft className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Footer note */}
          <div className="mt-6 text-center text-[11px] text-slate-500">
            سامانه همکار نسخه ۴.۲ | اتصال امن به پایگاه داده ابری Firestore
          </div>
        </div>

        {/* Left Column: System Highlights & Features Showcase */}
        <div className="lg:col-span-5 bg-gradient-to-br from-emerald-900 via-emerald-950 to-slate-900 p-8 sm:p-10 flex flex-col justify-between border-t lg:border-t-0 lg:border-r border-slate-800">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-bold mb-6">
              <Sparkles className="w-3.5 h-3.5" />
              امکانات جدید نسخه ابری
            </div>

            <h2 className="text-xl font-black text-white leading-snug">
              مدیریت یکپارچه پرسنل، احکام کارگزینی و ورود هوشمند اکسل
            </h2>

            <div className="space-y-4 mt-6">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl bg-emerald-800/50 border border-emerald-600/30 text-emerald-300 shrink-0 mt-0.5">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">ورود دسته‌ای پرسنل از اکسل با اعتبارسنجی</h4>
                  <p className="text-[11px] text-emerald-200/70 mt-0.5 leading-relaxed">
                    بررسی خودکار الگوریتم کدهای ملی، ساختار دپارتمان‌ها و تبدیل تاریخ‌های شمسی به میلادی.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl bg-emerald-800/50 border border-emerald-600/30 text-emerald-300 shrink-0 mt-0.5">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">پروفایل ۳۶۰ درجه و احکام کارگزینی</h4>
                  <p className="text-[11px] text-emerald-200/70 mt-0.5 leading-relaxed">
                    مشاهده سوابق شغلی، قراردادها، احکام حقوقی، پرونده سلامت و بایگانی اسناد پرسنلی.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl bg-emerald-800/50 border border-emerald-600/30 text-emerald-300 shrink-0 mt-0.5">
                  <Key className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">امنیت مبتنی بر نقش سازمانی (RBAC)</h4>
                  <p className="text-[11px] text-emerald-200/70 mt-0.5 leading-relaxed">
                    سطوح دسترسی تفکیک‌شده برای مدیران ارشد، کارشناسان منابع انسانی و امور مالی.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-emerald-800/40 text-emerald-200/60 text-xs flex items-center justify-between">
            <span>امنیت داده و رمزنگاری هویت</span>
            <span className="font-mono">SSL 256-bit</span>
          </div>
        </div>

      </div>
    </div>
  );
};
