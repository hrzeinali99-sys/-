import React from 'react';
import { LogOut, User as UserIcon } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface Props {
  onOpenExcelImport?: () => void;
}

export const Navbar: React.FC<Props> = () => {
  const { profile, signOut } = useAuth();

  return (
    <header className="h-16 bg-white border-b border-slate-200 sticky top-0 z-50 flex items-center justify-between px-4 sm:px-8 shadow-xs">
      <div className="flex items-center gap-4">
        {/* Title and System Indicator */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center font-bold text-white shadow-xs text-xs">
            HR
          </div>
          <h1 className="text-base sm:text-lg font-bold text-slate-800 tracking-tight font-titr">
            سامانه همکار
          </h1>
        </div>

        <div className="h-4 w-px bg-slate-300 hidden sm:block"></div>
        
        <span className="text-xs bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-full font-medium hidden md:inline-flex items-center gap-1.5 font-nazanin">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
          اتصال برخط پایگاه داده
        </span>
      </div>

      {/* Right User Profile & Sign Out */}
      <div className="flex items-center gap-3">
        {/* User Profile Pill & Sign Out */}
        <div className="flex items-center gap-2 pl-1 pr-1">
          {profile?.photoURL ? (
            <img 
              src={profile.photoURL} 
              alt={profile.displayName} 
              className="w-8 h-8 rounded-full object-cover ring-2 ring-emerald-500/20"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs">
              <UserIcon className="w-4 h-4" />
            </div>
          )}
          <div className="text-right">
            <span className="text-xs font-bold text-slate-800 block truncate max-w-[150px] font-titr">
              {profile?.displayName || 'کاربر سیستم'}
            </span>
            <span className="text-[10px] text-slate-400 block font-mono">
              {profile?.email || 'authenticated'}
            </span>
          </div>

          <button
            type="button"
            onClick={signOut}
            className="p-2 mr-1 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
            title="خروج از حساب کاربری"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};



