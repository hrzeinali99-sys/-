import React, { useState, useEffect } from 'react';
import { Layers, Building, Users, AlertCircle } from 'lucide-react';
import { FullRegistrationFormData } from '../../../types';
import { 
  DEFAULT_COMPANIES, 
  DEFAULT_BRANCHES, 
  DEFAULT_DEPARTMENTS, 
  DEFAULT_TEAMS, 
  DEFAULT_POSITIONS 
} from '../../../services/masterDataService';

interface Props {
  formData: Partial<FullRegistrationFormData>;
  updateFormData: (data: Partial<FullRegistrationFormData>) => void;
  errors: Record<string, string>;
  setErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>;
}

export const Step6Organization: React.FC<Props> = ({ formData, updateFormData }) => {
  const initialCompany = DEFAULT_COMPANIES[0];
  const initialDept = DEFAULT_DEPARTMENTS[0];
  const initialBranch = DEFAULT_BRANCHES[0];
  const initialPos = DEFAULT_POSITIONS.filter(p => p.departmentId === initialDept.id)[0] || DEFAULT_POSITIONS[0];

  const org = formData.organization || {
    id: 'current',
    companyId: initialCompany.id,
    companyName: initialCompany.name,
    departmentId: initialDept.id,
    departmentName: initialDept.name,
    branchId: initialBranch.id,
    branchName: initialBranch.name,
    workLocation: initialBranch.name,
    teamId: 'team-1',
    teamName: 'جذب، استخدام و برند کارفرمایی',
    positionId: initialPos.id,
    positionTitle: initialPos.title,
    jobTitle: initialPos.title,
    jobLevel: initialPos.level,
    directManagerName: initialDept.managerName || 'دکتر مریم سلیمانی',
    costCenter: initialDept.name,
    costCenterCode: `CC-${initialDept.code}`,
    shiftType: 'عادی (۸ تا ۱۷)',
    workingHoursWeekly: 44
  };

  const [selectedDeptId, setSelectedDeptId] = useState<string>(org.departmentId || initialDept.id);

  // Dependent Filtered Options
  const availableTeams = DEFAULT_TEAMS.filter(t => t.departmentId === selectedDeptId);
  const availablePositions = DEFAULT_POSITIONS.filter(p => p.departmentId === selectedDeptId);

  const updateOrg = (fields: Partial<typeof org>) => {
    updateFormData({
      organization: {
        ...org,
        ...fields
      }
    });
  };

  const handleDepartmentChange = (deptId: string) => {
    setSelectedDeptId(deptId);
    const deptObj = DEFAULT_DEPARTMENTS.find(d => d.id === deptId);
    const teams = DEFAULT_TEAMS.filter(t => t.departmentId === deptId);
    const positions = DEFAULT_POSITIONS.filter(p => p.departmentId === deptId);

    const newTeam = teams[0];
    const newPos = positions[0] || DEFAULT_POSITIONS[0];

    updateOrg({
      departmentId: deptId,
      departmentName: deptObj?.name || '',
      directManagerName: deptObj?.managerName || '',
      costCenter: deptObj?.name || '',
      costCenterCode: `CC-${deptObj?.code || 'GEN'}`,
      teamId: newTeam?.id || '',
      teamName: newTeam?.name || '',
      positionId: newPos.id,
      positionTitle: newPos.title,
      jobTitle: newPos.title,
      jobLevel: newPos.level
    });
  };

  const handlePositionChange = (posId: string) => {
    const posObj = DEFAULT_POSITIONS.find(p => p.id === posId);
    if (posObj) {
      updateOrg({
        positionId: posObj.id,
        positionTitle: posObj.title,
        jobTitle: posObj.title,
        jobLevel: posObj.level
      });
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      <div className="border-b border-slate-200 pb-4">
        <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <Layers className="w-6 h-6 text-emerald-600" />
          مرحله ۶: اطلاعات سازمانی و جایگاه شغلی (چارت سلسله‌مراتبی)
        </h3>
        <p className="text-sm text-slate-500 mt-1">
          دپارتمان، واحد کاری، تیم، سمت و سطح سازمانی را با ارتباطات وابسته انتخاب نمایید.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Company */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">شرکت تابع / سازمان</label>
          <select
            value={org.companyId}
            onChange={(e) => {
              const comp = DEFAULT_COMPANIES.find(c => c.id === e.target.value);
              updateOrg({ companyId: e.target.value, companyName: comp?.name || '' });
            }}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-emerald-500 focus:outline-none text-slate-800 text-sm bg-white"
          >
            {DEFAULT_COMPANIES.map(c => (
              <option key={c.id} value={c.id}>{c.name} ({c.code})</option>
            ))}
          </select>
        </div>

        {/* Branch / Location */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">شعبه / محل خدمت</label>
          <select
            value={org.branchId}
            onChange={(e) => {
              const br = DEFAULT_BRANCHES.find(b => b.id === e.target.value);
              updateOrg({ branchId: e.target.value, branchName: br?.name || '', workLocation: br?.name || '' });
            }}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-emerald-500 focus:outline-none text-slate-800 text-sm bg-white"
          >
            {DEFAULT_BRANCHES.map(b => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        </div>

        {/* Department (Hierarchical Lead) */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">
            دپارتمان سازمانی <span className="text-rose-500">*</span>
          </label>
          <select
            value={selectedDeptId}
            onChange={(e) => handleDepartmentChange(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-emerald-500/80 bg-emerald-50/20 focus:border-emerald-600 focus:outline-none text-slate-800 text-sm font-medium"
          >
            {DEFAULT_DEPARTMENTS.map(d => (
              <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
            ))}
          </select>
        </div>

        {/* Team / Sub-unit */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">تیم کاری / واحد فرعی</label>
          <select
            value={org.teamId}
            onChange={(e) => {
              const tm = availableTeams.find(t => t.id === e.target.value);
              updateOrg({ teamId: e.target.value, teamName: tm?.name || '' });
            }}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-emerald-500 focus:outline-none text-slate-800 text-sm bg-white"
          >
            {availableTeams.length > 0 ? (
              availableTeams.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))
            ) : (
              <option value="">واحد عمومی دپارتمان</option>
            )}
          </select>
        </div>

        {/* Position (Dependent on Department) */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">
            سمت شغلی مصوب چارت <span className="text-rose-500">*</span>
          </label>
          <select
            value={org.positionId}
            onChange={(e) => handlePositionChange(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-emerald-500/80 bg-emerald-50/20 focus:border-emerald-600 focus:outline-none text-slate-800 text-sm font-medium"
          >
            {availablePositions.length > 0 ? (
              availablePositions.map(p => (
                <option key={p.id} value={p.id}>{p.title} ({p.level})</option>
              ))
            ) : (
              DEFAULT_POSITIONS.map(p => (
                <option key={p.id} value={p.id}>{p.title}</option>
              ))
            )}
          </select>
        </div>

        {/* Job Level */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">سطح سازمانی / ارشدیت</label>
          <input
            type="text"
            value={org.jobLevel || 'کارشناس'}
            onChange={(e) => updateOrg({ jobLevel: e.target.value })}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-emerald-500 focus:outline-none text-slate-800 text-sm"
          />
        </div>

        {/* Direct Manager */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">مدیر مستقیم (گزارش‌دهی به)</label>
          <input
            type="text"
            value={org.directManagerName || ''}
            onChange={(e) => updateOrg({ directManagerName: e.target.value })}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-emerald-500 focus:outline-none text-slate-800 text-sm"
          />
        </div>

        {/* Cost Center Code */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">مرکز هزینه</label>
          <input
            type="text"
            value={org.costCenterCode || ''}
            onChange={(e) => updateOrg({ costCenterCode: e.target.value })}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-emerald-500 focus:outline-none text-slate-800 text-sm font-mono"
          />
        </div>

        {/* Shift Type */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">نوع شیفت کاری</label>
          <select
            value={org.shiftType}
            onChange={(e) => updateOrg({ shiftType: e.target.value as any })}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-emerald-500 focus:outline-none text-slate-800 text-sm bg-white"
          >
            <option value="عادی (۸ تا ۱۷)">عادی (۸ تا ۱۷ - شنبه تا چهارشنبه)</option>
            <option value="شیفت چرخشی">شیفت چرخشی (نوبت‌کاری)</option>
            <option value="شیفت شب">شیفت شب</option>
            <option value="شناور">ساعات کاری شناور</option>
          </select>
        </div>
      </div>
    </div>
  );
};
