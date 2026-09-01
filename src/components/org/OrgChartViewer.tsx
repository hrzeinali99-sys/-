import React, { useState, useEffect } from 'react';
import { 
  Layers, Building2, Building, Users, User, Briefcase, Plus, Trash2, 
  Edit3, CheckCircle2, AlertCircle, RefreshCw, Shield, 
  ChevronRight, Sparkles, MapPin, Phone, Mail, Globe,
  Percent, ArrowUpRight, Search, Filter, GitFork, UserCheck
} from 'lucide-react';
import { 
  Department, Team, Position, Company, Branch, CompanyType 
} from '../../types';
import { 
  getMasterData, 
  getCompanies,
  createCompany,
  updateCompany,
  deleteCompany,
  getBranches,
  createBranch,
  updateBranch,
  deleteBranch,
  getDepartments, 
  createDepartment, 
  updateDepartment, 
  deleteDepartment, 
  createTeam, 
  deleteTeam, 
  createPosition, 
  deletePosition,
  DEFAULT_COMPANIES,
  DEFAULT_BRANCHES,
  DEFAULT_DEPARTMENTS,
  DEFAULT_TEAMS,
  DEFAULT_POSITIONS
} from '../../services/masterDataService';
import { getEmployees } from '../../services/employeeService';
import { useAuth } from '../../context/AuthContext';
import { CompanyModal } from './CompanyModal';
import { BranchModal } from './BranchModal';

type OrgTab = 'companies' | 'departments' | 'branches' | 'tree';

export const OrgChartViewer: React.FC = () => {
  const { canAccess } = useAuth();
  
  const [activeTab, setActiveTab] = useState<OrgTab>('companies');
  const [companies, setCompanies] = useState<Company[]>(DEFAULT_COMPANIES);
  const [branches, setBranches] = useState<Branch[]>(DEFAULT_BRANCHES);
  const [departments, setDepartments] = useState<Department[]>(DEFAULT_DEPARTMENTS);
  const [teams, setTeams] = useState<Team[]>(DEFAULT_TEAMS);
  const [positions, setPositions] = useState<Position[]>(DEFAULT_POSITIONS);
  const [employeeCountsByCompany, setEmployeeCountsByCompany] = useState<Record<string, number>>({});
  const [employeeCountsByDept, setEmployeeCountsByDept] = useState<Record<string, number>>({});

  // Filtering & Selection
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>(DEFAULT_COMPANIES[0]?.id || 'comp-1');
  const [selectedDeptId, setSelectedDeptId] = useState<string>(DEFAULT_DEPARTMENTS[0]?.id || 'dept-1');
  const [companyTypeFilter, setCompanyTypeFilter] = useState<'all' | CompanyType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [loading, setLoading] = useState(true);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Modals state
  const [isCompanyModalOpen, setIsCompanyModalOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);

  const [isBranchModalOpen, setIsBranchModalOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);

  const [isDeptModalOpen, setIsDeptModalOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [deptForm, setDeptForm] = useState({
    name: '',
    code: '',
    managerName: '',
    companyId: 'comp-1'
  });

  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
  const [teamForm, setTeamForm] = useState({ name: '', code: '' });

  const [isPosModalOpen, setIsPosModalOpen] = useState(false);
  const [posForm, setPosForm] = useState({ title: '', code: '', level: 'کارشناس' });

  const loadData = async () => {
    setLoading(true);
    try {
      const [data, emps] = await Promise.all([
        getMasterData(),
        getEmployees().catch(() => [])
      ]);

      setCompanies(data.companies);
      setBranches(data.branches);
      setDepartments(data.departments);
      setTeams(data.teams);
      setPositions(data.positions);

      // Compute employee counts
      const compCounts: Record<string, number> = {};
      const deptCounts: Record<string, number> = {};

      emps.forEach(emp => {
        if (emp.companyId) {
          compCounts[emp.companyId] = (compCounts[emp.companyId] || 0) + 1;
        } else if (emp.companyName) {
          const matched = data.companies.find(c => c.name === emp.companyName);
          if (matched) {
            compCounts[matched.id] = (compCounts[matched.id] || 0) + 1;
          }
        }

        if (emp.departmentId) {
          deptCounts[emp.departmentId] = (deptCounts[emp.departmentId] || 0) + 1;
        } else if (emp.departmentName) {
          const matched = data.departments.find(d => d.name === emp.departmentName);
          if (matched) {
            deptCounts[matched.id] = (deptCounts[matched.id] || 0) + 1;
          }
        }
      });

      setEmployeeCountsByCompany(compCounts);
      setEmployeeCountsByDept(deptCounts);

      if (data.companies.length > 0 && !data.companies.some(c => c.id === selectedCompanyId)) {
        setSelectedCompanyId(data.companies[0].id);
      }
      if (data.departments.length > 0 && !data.departments.some(d => d.id === selectedDeptId)) {
        setSelectedDeptId(data.departments[0].id);
      }
    } catch (e) {
      console.warn('Error loading master data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // -------------------------------------------------------------
  // COMPANY HANDLERS
  // -------------------------------------------------------------
  const handleOpenCreateCompany = (parentHoldingId?: string) => {
    setEditingCompany(parentHoldingId ? {
      id: '',
      name: '',
      code: '',
      type: 'subsidiary',
      holdingId: parentHoldingId,
      holdingName: companies.find(c => c.id === parentHoldingId)?.name || ''
    } : null);
    setIsCompanyModalOpen(true);
  };

  const handleOpenEditCompany = (comp: Company) => {
    setEditingCompany(comp);
    setIsCompanyModalOpen(true);
  };

  const handleSaveCompany = async (companyData: Partial<Company> & { name: string; code: string }) => {
    if (editingCompany && editingCompany.id) {
      await updateCompany(editingCompany.id, companyData);
      setStatusMsg({ type: 'success', text: `اطلاعات شرکت "${companyData.name}" با موفقیت بروزرسانی شد.` });
    } else {
      const created = await createCompany(companyData);
      setStatusMsg({ type: 'success', text: `شرکت جدید "${created.name}" در ساختار هلدینگ با موفقیت تعریف شد.` });
    }
    await loadData();
    setTimeout(() => setStatusMsg(null), 4000);
  };

  const handleDeleteCompany = async (comp: Company) => {
    const subsidiaries = companies.filter(c => c.holdingId === comp.id);
    if (subsidiaries.length > 0) {
      setStatusMsg({
        type: 'error',
        text: `امکان حذف وجود ندارد: ابتدا شرکت‌های تابعه مرتبط با این هلدینگ (${subsidiaries.map(s => s.name).join('، ')}) را مدیریت نمایید.`
      });
      return;
    }

    const empCount = employeeCountsByCompany[comp.id] || 0;
    let msg = `آیا از حذف شرکت "${comp.name}" با شناسه سازمانی ${comp.code} اطمینان دارید؟`;
    if (empCount > 0) {
      msg = `هشدار: هم‌اکنون ${empCount} پرسنل در این شرکت ثبت شده‌اند.\nآیا با حذف این شرکت موافقید؟`;
    }

    if (confirm(msg)) {
      try {
        await deleteCompany(comp.id);
        setStatusMsg({ type: 'success', text: `شرکت "${comp.name}" از ساختار هلدینگ حذف گردید.` });
        await loadData();
        setTimeout(() => setStatusMsg(null), 4000);
      } catch (err: any) {
        setStatusMsg({ type: 'error', text: err?.message || 'خطا در حذف شرکت' });
      }
    }
  };

  // -------------------------------------------------------------
  // BRANCH HANDLERS
  // -------------------------------------------------------------
  const handleOpenCreateBranch = (companyId?: string) => {
    setEditingBranch(null);
    if (companyId) setSelectedCompanyId(companyId);
    setIsBranchModalOpen(true);
  };

  const handleOpenEditBranch = (branch: Branch) => {
    setEditingBranch(branch);
    setIsBranchModalOpen(true);
  };

  const handleSaveBranch = async (branchData: Partial<Branch> & { name: string; companyId: string }) => {
    if (editingBranch) {
      await updateBranch(editingBranch.id, branchData);
      setStatusMsg({ type: 'success', text: `اطلاعات شعبه "${branchData.name}" با موفقیت ویرایش شد.` });
    } else {
      await createBranch(branchData);
      setStatusMsg({ type: 'success', text: `شعبه جدید "${branchData.name}" با موفقیت افزوده شد.` });
    }
    await loadData();
    setTimeout(() => setStatusMsg(null), 4000);
  };

  const handleDeleteBranch = async (branch: Branch) => {
    if (confirm(`آیا از حذف شعبه "${branch.name}" (کد: ${branch.code}) اطمینان دارید؟`)) {
      try {
        await deleteBranch(branch.id);
        setStatusMsg({ type: 'success', text: `شعبه "${branch.name}" حذف گردید.` });
        await loadData();
        setTimeout(() => setStatusMsg(null), 4000);
      } catch (err: any) {
        setStatusMsg({ type: 'error', text: err?.message || 'خطا در حذف شعبه' });
      }
    }
  };

  // -------------------------------------------------------------
  // DEPARTMENT HANDLERS
  // -------------------------------------------------------------
  const handleOpenCreateDept = () => {
    setEditingDept(null);
    setDeptForm({
      name: '',
      code: '',
      managerName: '',
      companyId: selectedCompanyId || companies[0]?.id || 'comp-1'
    });
    setIsDeptModalOpen(true);
  };

  const handleOpenEditDept = (dept: Department) => {
    setEditingDept(dept);
    setDeptForm({
      name: dept.name,
      code: dept.code || '',
      managerName: dept.managerName || '',
      companyId: dept.companyId || selectedCompanyId || companies[0]?.id || 'comp-1'
    });
    setIsDeptModalOpen(true);
  };

  const handleSaveDept = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deptForm.name.trim()) return;

    try {
      if (editingDept) {
        await updateDepartment(editingDept.id, {
          name: deptForm.name,
          managerName: deptForm.managerName,
          companyId: deptForm.companyId
        });
        setStatusMsg({ type: 'success', text: `دپارتمان "${deptForm.name}" با موفقیت ویرایش شد.` });
      } else {
        const autoCode = deptForm.code || `DPT-${departments.length + 1}`;
        const created = await createDepartment({
          name: deptForm.name,
          code: autoCode,
          managerName: deptForm.managerName,
          companyId: deptForm.companyId
        });
        setSelectedDeptId(created.id);
        setStatusMsg({ type: 'success', text: `دپارتمان جدید "${deptForm.name}" با موفقیت ایجاد شد.` });
      }
      setIsDeptModalOpen(false);
      await loadData();
      setTimeout(() => setStatusMsg(null), 4000);
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err?.message || 'خطا در ذخیره دپارتمان' });
    }
  };

  const handleDeleteDept = async (dept: Department) => {
    const count = employeeCountsByDept[dept.id] || 0;
    let msg = `آیا از حذف دپارتمان "${dept.name}" (کد: ${dept.code}) اطمینان دارید؟`;
    if (count > 0) {
      msg = `هشدار: هم‌اکنون ${count} نفر پرسنل در این دپارتمان ثبت هستند.\nآیا با حذف دپارتمان موافقید؟`;
    }
    if (confirm(msg)) {
      try {
        await deleteDepartment(dept.id);
        setStatusMsg({ type: 'success', text: `دپارتمان "${dept.name}" حذف گردید.` });
        await loadData();
        setTimeout(() => setStatusMsg(null), 4000);
      } catch (err: any) {
        setStatusMsg({ type: 'error', text: err?.message || 'خطا در حذف دپارتمان' });
      }
    }
  };

  // -------------------------------------------------------------
  // TEAM & POSITION HANDLERS
  // -------------------------------------------------------------
  const selectedDept = departments.find(d => d.id === selectedDeptId) || departments[0] || {
    id: 'dept-1',
    name: 'دپارتمان عمومی',
    code: 'GEN',
    managerName: 'مدیر دپارتمان',
    companyId: 'comp-1'
  };

  const currentTeams = teams.filter(t => t.departmentId === selectedDept.id);
  const currentPositions = positions.filter(p => p.departmentId === selectedDept.id);

  const handleSaveTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamForm.name.trim()) return;
    try {
      await createTeam({
        departmentId: selectedDept.id,
        name: teamForm.name,
        code: teamForm.code || `${selectedDept.code}-TM`
      });
      setIsTeamModalOpen(false);
      setTeamForm({ name: '', code: '' });
      await loadData();
      setStatusMsg({ type: 'success', text: 'تیم کاری جدید افزوده شد.' });
      setTimeout(() => setStatusMsg(null), 4000);
    } catch (e: any) {
      setStatusMsg({ type: 'error', text: 'خطا در ایجاد تیم' });
    }
  };

  const handleDeleteTeam = async (teamId: string) => {
    if (confirm('آیا از حذف این تیم کاری اطمینان دارید؟')) {
      await deleteTeam(teamId);
      await loadData();
    }
  };

  const handleSavePosition = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!posForm.title.trim()) return;
    try {
      await createPosition({
        departmentId: selectedDept.id,
        title: posForm.title,
        code: posForm.code || `${selectedDept.code}-POS`,
        level: posForm.level
      });
      setIsPosModalOpen(false);
      setPosForm({ title: '', code: '', level: 'کارشناس' });
      await loadData();
      setStatusMsg({ type: 'success', text: 'عنوان شغلی مصوب به دپارتمان اضافه شد.' });
      setTimeout(() => setStatusMsg(null), 4000);
    } catch (e: any) {
      setStatusMsg({ type: 'error', text: 'خطا در ایجاد سمت' });
    }
  };

  const handleDeletePosition = async (posId: string) => {
    if (confirm('آیا از حذف این سمت مصوب اطمینان دارید؟')) {
      await deletePosition(posId);
      await loadData();
    }
  };

  // Filtered Companies
  const filteredCompanies = companies.filter(comp => {
    if (companyTypeFilter !== 'all' && (comp.type || 'subsidiary') !== companyTypeFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = comp.name.toLowerCase().includes(q);
      const matchCode = comp.code.toLowerCase().includes(q);
      const matchCeo = (comp.ceoName || '').toLowerCase().includes(q);
      const matchNatId = (comp.nationalId || '').includes(q);
      const matchInd = (comp.industry || '').toLowerCase().includes(q);
      if (!matchName && !matchCode && !matchCeo && !matchNatId && !matchInd) return false;
    }
    return true;
  });

  const holdingCompanies = filteredCompanies.filter(c => c.type === 'holding');
  const subsidiaryCompanies = filteredCompanies.filter(c => c.type !== 'holding');

  const totalEmployeesInGroup = (Object.values(employeeCountsByCompany) as number[]).reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Top Main Banner */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-emerald-100 text-emerald-800">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-800">
                ساختار سازمانی، شرکت‌های هلدینگ و شعب
              </h2>
              <span className="text-xs text-slate-500 font-medium">
                مدیریت جامع هلدینگ مادر، شرکت‌های تابعه و وابسته، شعب استانی، دپارتمان‌ها و سمت‌های شغلی مصوب
              </span>
            </div>
          </div>
        </div>

        {/* Global Actions */}
        <div className="flex flex-wrap items-center gap-3 self-start lg:self-auto">
          {canAccess('department.manage') && (
            <>
              <button
                type="button"
                onClick={() => handleOpenCreateCompany()}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-black shadow-md shadow-emerald-600/20 transition-all hover:scale-102 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                تعریف شرکت / هلدینگ جدید
              </button>

              <button
                type="button"
                onClick={() => handleOpenCreateBranch()}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-black shadow-md shadow-indigo-600/20 transition-all hover:scale-102 cursor-pointer"
              >
                <Building className="w-4 h-4" />
                تعریف شعبه استانی
              </button>
            </>
          )}

          <button
            type="button"
            onClick={loadData}
            title="بروزرسانی اطلاعات"
            className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-2xl transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Status Alerts */}
      {statusMsg && (
        <div className={`p-4 rounded-2xl text-xs font-bold flex items-center justify-between animate-fadeIn border ${
          statusMsg.type === 'success' 
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
            : 'bg-rose-50 border-rose-200 text-rose-800'
        }`}>
          <div className="flex items-center gap-2">
            {statusMsg.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{statusMsg.text}</span>
          </div>
          <button onClick={() => setStatusMsg(null)} className="text-slate-400 hover:text-slate-600 text-sm cursor-pointer">✕</button>
        </div>
      )}

      {/* KPI Stats Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 shadow-2xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">شرکت‌های هلدینگ و مادر</span>
            <span className="p-1.5 rounded-xl bg-amber-50 text-amber-600">
              <Building className="w-4 h-4" />
            </span>
          </div>
          <p className="text-xl sm:text-2xl font-black text-slate-800 font-mono">
            {companies.filter(c => c.type === 'holding').length.toLocaleString('fa-IR')}
          </p>
          <span className="text-[11px] text-amber-700 font-bold">هلدینگ‌های مادر فعال</span>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 shadow-2xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">شرکت‌های تابعه و وابسته</span>
            <span className="p-1.5 rounded-xl bg-emerald-50 text-emerald-600">
              <Building2 className="w-4 h-4" />
            </span>
          </div>
          <p className="text-xl sm:text-2xl font-black text-slate-800 font-mono">
            {companies.filter(c => c.type !== 'holding').length.toLocaleString('fa-IR')}
          </p>
          <span className="text-[11px] text-emerald-700 font-bold">زیرمجموعه‌های گروه</span>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 shadow-2xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">شعب و دفاتر استانی</span>
            <span className="p-1.5 rounded-xl bg-indigo-50 text-indigo-600">
              <MapPin className="w-4 h-4" />
            </span>
          </div>
          <p className="text-xl sm:text-2xl font-black text-slate-800 font-mono">
            {branches.length.toLocaleString('fa-IR')}
          </p>
          <span className="text-[11px] text-indigo-700 font-bold">در سراسر کشور</span>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 shadow-2xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">مجموع پرسنل فعال گروه</span>
            <span className="p-1.5 rounded-xl bg-teal-50 text-teal-600">
              <Users className="w-4 h-4" />
            </span>
          </div>
          <p className="text-xl sm:text-2xl font-black text-slate-800 font-mono">
            {totalEmployeesInGroup.toLocaleString('fa-IR')} <span className="text-xs font-normal text-slate-400">نفر</span>
          </p>
          <span className="text-[11px] text-teal-700 font-bold">در کل ساختار سازمانی</span>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('companies')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'companies'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/70'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>شرکت‌های هلدینگ و تابعه</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${
            activeTab === 'companies' ? 'bg-emerald-700 text-emerald-100' : 'bg-slate-100 text-slate-600'
          }`}>
            {companies.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('departments')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'departments'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/70'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>دپارتمان‌ها و چارت شغلی</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${
            activeTab === 'departments' ? 'bg-emerald-700 text-emerald-100' : 'bg-slate-100 text-slate-600'
          }`}>
            {departments.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('branches')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'branches'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/70'
          }`}
        >
          <MapPin className="w-4 h-4" />
          <span>شعب و دفاتر استانی</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${
            activeTab === 'branches' ? 'bg-emerald-700 text-emerald-100' : 'bg-slate-100 text-slate-600'
          }`}>
            {branches.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('tree')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'tree'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/70'
          }`}
        >
          <GitFork className="w-4 h-4" />
          <span>نمودار درختی هلدینگ</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: HOLDING & SUBSIDIARY COMPANIES VIEW                                  */}
      {/* ========================================================================= */}
      {activeTab === 'companies' && (
        <div className="space-y-6">
          {/* Filter & Search Bar */}
          <div className="bg-white border border-slate-200 rounded-3xl p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute right-3 top-3 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="جستجو در نام شرکت، کد، مدیرعامل، صنعت..."
                className="w-full h-10 pr-9 pl-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
              <span className="text-xs font-bold text-slate-500 flex items-center gap-1 shrink-0">
                <Filter className="w-3.5 h-3.5" />
                فیلتر:
              </span>
              <button
                type="button"
                onClick={() => setCompanyTypeFilter('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer shrink-0 ${
                  companyTypeFilter === 'all' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                همه ({companies.length})
              </button>
              <button
                type="button"
                onClick={() => setCompanyTypeFilter('holding')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer shrink-0 ${
                  companyTypeFilter === 'holding' ? 'bg-amber-600 text-white' : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                }`}
              >
                هلدینگ مادر ({companies.filter(c => c.type === 'holding').length})
              </button>
              <button
                type="button"
                onClick={() => setCompanyTypeFilter('subsidiary')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer shrink-0 ${
                  companyTypeFilter === 'subsidiary' ? 'bg-emerald-600 text-white' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                }`}
              >
                شرکت‌های تابعه ({companies.filter(c => c.type === 'subsidiary' || !c.type).length})
              </button>
              <button
                type="button"
                onClick={() => setCompanyTypeFilter('affiliate')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer shrink-0 ${
                  companyTypeFilter === 'affiliate' ? 'bg-indigo-600 text-white' : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
                }`}
              >
                شرکت‌های وابسته ({companies.filter(c => c.type === 'affiliate').length})
              </button>
            </div>
          </div>

          {/* Grouped by Holding Companies */}
          {holdingCompanies.length === 0 && subsidiaryCompanies.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center space-y-4">
              <Building2 className="w-12 h-12 text-slate-300 mx-auto" />
              <p className="text-sm font-bold text-slate-600">هیچ شرکتی با معیارهای جستجوی فعلی یافت نشد.</p>
              {canAccess('department.manage') && (
                <button
                  onClick={() => handleOpenCreateCompany()}
                  className="px-5 py-2.5 bg-emerald-600 text-white rounded-2xl text-xs font-black inline-flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  تعریف شرکت جدید
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-8">
              {/* Holding Groups Hierarchy */}
              {holdingCompanies.map((holding) => {
                const subs = companies.filter(c => c.holdingId === holding.id);
                const holdingEmpCount = employeeCountsByCompany[holding.id] || 0;
                const totalHoldingGroupEmps = holdingEmpCount + subs.reduce((acc, s) => acc + (employeeCountsByCompany[s.id] || 0), 0);
                const holdingDepts = departments.filter(d => d.companyId === holding.id);
                const holdingBranches = branches.filter(b => b.companyId === holding.id);

                return (
                  <div key={holding.id} className="bg-white border-2 border-amber-200/80 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
                    {/* Holding Header Card */}
                    <div className="bg-gradient-to-r from-amber-500/10 via-amber-50 to-white rounded-2xl p-5 border border-amber-200 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <div className="p-3 bg-amber-500 text-white rounded-2xl shadow-md shadow-amber-500/20 shrink-0">
                          <Building className="w-7 h-7" />
                        </div>
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-lg font-black text-slate-900">{holding.name}</h3>
                            <span className="px-2.5 py-0.5 bg-amber-500 text-white rounded-xl text-[11px] font-black">
                              هلدینگ مادر
                            </span>
                            <span className="px-2 py-0.5 bg-slate-100 border border-slate-200 text-slate-700 font-mono rounded-lg text-xs font-bold">
                              {holding.code}
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 leading-relaxed max-w-3xl">
                            {holding.description || holding.industry || 'مدیریت و راهبری شرکت‌های تابعه و سرمایه‌پذیر'}
                          </p>

                          {/* Holding Meta Information */}
                          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 pt-2 font-medium">
                            {holding.ceoName && (
                              <span className="flex items-center gap-1">
                                <User className="w-3.5 h-3.5 text-amber-600" />
                                مدیرعامل: <strong className="text-slate-800">{holding.ceoName}</strong>
                              </span>
                            )}
                            {holding.nationalId && (
                              <span className="flex items-center gap-1 font-mono text-[11px]">
                                شناسه ملی: <strong>{holding.nationalId}</strong>
                              </span>
                            )}
                            {holding.phone && (
                              <span className="flex items-center gap-1 font-mono text-[11px]" dir="ltr">
                                <Phone className="w-3 h-3 text-slate-400" />
                                {holding.phone}
                              </span>
                            )}
                            {holding.city && (
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                                {holding.city}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Holding Actions & Stats */}
                      <div className="flex flex-wrap items-center gap-2 self-start lg:self-center shrink-0">
                        <div className="text-left bg-white/90 px-3 py-2 rounded-xl border border-amber-200 text-xs">
                          <span className="text-slate-400 block text-[10px]">مجموع پرسنل گروه:</span>
                          <span className="font-black text-amber-800 font-mono text-sm">{totalHoldingGroupEmps} نفر</span>
                        </div>

                        {canAccess('department.manage') && (
                          <>
                            <button
                              type="button"
                              onClick={() => handleOpenCreateCompany(holding.id)}
                              className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
                              title="افزودن شرکت تابعه به این هلدینگ"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              افزودن شرکت تابعه
                            </button>

                            <button
                              type="button"
                              onClick={() => handleOpenEditCompany(holding)}
                              className="p-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl transition-colors cursor-pointer"
                              title="ویرایش مشخصات هلدینگ"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDeleteCompany(holding)}
                              className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl transition-colors cursor-pointer"
                              title="حذف هلدینگ"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Subsidiaries Grid */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                        <h4 className="text-xs font-black text-slate-700 flex items-center gap-1.5">
                          <Building2 className="w-4 h-4 text-emerald-600" />
                          شرکت‌های تابعه و زیرمجموعه تحت پوشش ({subs.length} شرکت تابعه)
                        </h4>
                        <span className="text-[11px] text-slate-400 font-medium">
                          مدیریت سهامداری و زنجیره ارزش هلدینگ
                        </span>
                      </div>

                      {subs.length === 0 ? (
                        <div className="p-6 bg-slate-50/70 border border-dashed border-slate-200 rounded-2xl text-center space-y-2">
                          <p className="text-xs text-slate-500 font-medium">هیچ شرکت تابعهای برای این هلدینگ ثبت نشده است.</p>
                          {canAccess('department.manage') && (
                            <button
                              onClick={() => handleOpenCreateCompany(holding.id)}
                              className="text-xs font-bold text-emerald-700 hover:text-emerald-800 inline-flex items-center gap-1"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              تعریف اولین شرکت تابعه این هلدینگ
                            </button>
                          )}
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {subs.map((sub) => {
                            const subEmps = employeeCountsByCompany[sub.id] || 0;
                            const subDepts = departments.filter(d => d.companyId === sub.id);
                            const subBranches = branches.filter(b => b.companyId === sub.id);

                            return (
                              <div
                                key={sub.id}
                                className="bg-slate-50/90 hover:bg-white border border-slate-200/90 hover:border-emerald-300 rounded-2xl p-5 transition-all shadow-2xs hover:shadow-md space-y-4 flex flex-col justify-between"
                              >
                                <div className="space-y-3">
                                  {/* Sub Header */}
                                  <div className="flex items-start justify-between gap-2">
                                    <div className="space-y-1">
                                      <div className="flex items-center gap-2">
                                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-black ${
                                          sub.type === 'affiliate' ? 'bg-indigo-100 text-indigo-800' : 'bg-emerald-100 text-emerald-800'
                                        }`}>
                                          {sub.type === 'affiliate' ? 'شرکت وابسته' : 'شرکت تابعه'}
                                        </span>
                                        <span className="font-mono text-[11px] text-slate-500 font-bold">{sub.code}</span>
                                      </div>
                                      <h5 className="font-extrabold text-sm text-slate-800 leading-snug">{sub.name}</h5>
                                    </div>

                                    {canAccess('department.manage') && (
                                      <div className="flex items-center gap-1 shrink-0">
                                        <button
                                          type="button"
                                          onClick={() => handleOpenEditCompany(sub)}
                                          className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200/60 transition-colors"
                                          title="ویرایش شرکت"
                                        >
                                          <Edit3 className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => handleDeleteCompany(sub)}
                                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                                          title="حذف شرکت"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                    )}
                                  </div>

                                  {/* Ownership Bar */}
                                  <div className="bg-white p-2.5 rounded-xl border border-slate-200/70 space-y-1.5">
                                    <div className="flex items-center justify-between text-[11px]">
                                      <span className="text-slate-500 font-bold flex items-center gap-1">
                                        <Percent className="w-3 h-3 text-emerald-600" />
                                        مالکیت هلدینگ:
                                      </span>
                                      <span className="font-mono font-black text-emerald-800">{sub.ownershipPercentage || 100}٪</span>
                                    </div>
                                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                      <div 
                                        className="h-full bg-emerald-600 rounded-full" 
                                        style={{ width: `${sub.ownershipPercentage || 100}%` }}
                                      />
                                    </div>
                                  </div>

                                  {/* Details */}
                                  <div className="space-y-1.5 text-[11px] text-slate-600">
                                    {sub.industry && (
                                      <div className="flex items-center justify-between">
                                        <span className="text-slate-400">حوزه فعالیت:</span>
                                        <span className="font-bold text-slate-700 text-left truncate max-w-[150px]">{sub.industry}</span>
                                      </div>
                                    )}
                                    {sub.ceoName && (
                                      <div className="flex items-center justify-between">
                                        <span className="text-slate-400">مدیرعامل:</span>
                                        <span className="font-bold text-slate-700">{sub.ceoName}</span>
                                      </div>
                                    )}
                                    {sub.nationalId && (
                                      <div className="flex items-center justify-between font-mono">
                                        <span className="text-slate-400 font-sans">شناسه ملی:</span>
                                        <span className="text-slate-600">{sub.nationalId}</span>
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {/* Footer Badges & Link to Depts */}
                                <div className="pt-3 border-t border-slate-200/60 flex items-center justify-between text-[11px]">
                                  <div className="flex items-center gap-2">
                                    <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 rounded-md font-bold">
                                      {subEmps} پرسنل
                                    </span>
                                    <span className="px-2 py-0.5 bg-slate-200/70 text-slate-700 rounded-md font-mono">
                                      {subDepts.length} دپارتمان
                                    </span>
                                  </div>

                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSelectedCompanyId(sub.id);
                                      setActiveTab('departments');
                                    }}
                                    className="text-emerald-700 hover:text-emerald-800 font-bold flex items-center gap-0.5"
                                  >
                                    دپارتمان‌ها
                                    <ChevronRight className="w-3 h-3 rotate-180" />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Standalone / Unassigned Subsidiaries (if any) */}
              {subsidiaryCompanies.filter(c => !c.holdingId || !holdingCompanies.some(h => h.id === c.holdingId)).length > 0 && (
                <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-4">
                  <h4 className="font-black text-slate-800 text-sm flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-indigo-600" />
                    سایر شرکت‌های مستقل و مستقیم گروه
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {subsidiaryCompanies
                      .filter(c => !c.holdingId || !holdingCompanies.some(h => h.id === c.holdingId))
                      .map((sub) => (
                        <div key={sub.id} className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-3">
                          <div className="flex items-start justify-between">
                            <div>
                              <h5 className="font-extrabold text-sm text-slate-800">{sub.name}</h5>
                              <span className="text-[11px] text-slate-500 font-mono">کد: {sub.code}</span>
                            </div>
                            {canAccess('department.manage') && (
                              <div className="flex items-center gap-1">
                                <button onClick={() => handleOpenEditCompany(sub)} className="p-1 text-slate-500 hover:text-slate-800">
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                                <button onClick={() => handleDeleteCompany(sub)} className="p-1 text-slate-500 hover:text-rose-600">
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            )}
                          </div>
                          <p className="text-xs text-slate-600">{sub.industry || 'بدون مشخصات صنعت'}</p>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: DEPARTMENTS & ORG HIERARCHY                                         */}
      {/* ========================================================================= */}
      {activeTab === 'departments' && (
        <div className="space-y-6">
          {/* Company Filter Selector */}
          <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-xs font-black text-slate-700 shrink-0">انتخاب شرکت:</span>
              <select
                value={selectedCompanyId}
                onChange={(e) => setSelectedCompanyId(e.target.value)}
                className="h-10 px-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500"
              >
                {companies.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.type === 'holding' ? 'هلدینگ مادر' : 'شرکت تابعه'} - {c.code})
                  </option>
                ))}
              </select>
            </div>

            {canAccess('department.manage') && (
              <button
                type="button"
                onClick={handleOpenCreateDept}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-black shadow-md shadow-emerald-600/20 transition-all hover:scale-102 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                تعریف دپارتمان جدید در این شرکت
              </button>
            )}
          </div>

          {/* Interactive Department Explorer */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <h3 className="font-extrabold text-slate-800 text-base flex items-center gap-2">
                <Layers className="w-5 h-5 text-emerald-600" />
                دپارتمان‌های سازمانی فعال ({departments.length} دپارتمان)
              </h3>
              <span className="text-xs text-slate-400">جهت مشاهده تیم‌ها و سمت‌های شغلی، دپارتمان را انتخاب فرمایید</span>
            </div>

            {/* Department Pills */}
            <div className="flex flex-wrap gap-2">
              {departments.map((dept) => {
                const isSelected = selectedDept.id === dept.id;
                const empCount = employeeCountsByDept[dept.id] || 0;
                return (
                  <button
                    key={dept.id}
                    type="button"
                    onClick={() => setSelectedDeptId(dept.id)}
                    className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                      isSelected
                        ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20 scale-102'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    <span>{dept.name}</span>
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono ${
                      isSelected ? 'bg-emerald-700 text-emerald-100' : 'bg-slate-200 text-slate-600'
                    }`}>
                      {empCount} نفر
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Active Selected Department Details */}
            {selectedDept && (
              <div className="border border-emerald-200 bg-emerald-50/20 rounded-3xl p-6 sm:p-8 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-emerald-100 pb-5">
                  <div>
                    <div className="flex items-center gap-3">
                      <h4 className="text-lg font-black text-slate-800">{selectedDept.name}</h4>
                      <span className="px-3 py-1 bg-emerald-100 text-emerald-800 font-mono rounded-xl text-xs font-bold">
                        کد مرکز هزینه: CC-{selectedDept.code}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-1">
                      مدیر ارشد دپارتمان: <strong className="text-slate-800">{selectedDept.managerName || 'مشخص نشده'}</strong>
                    </p>
                  </div>

                  {canAccess('department.manage') && (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleOpenEditDept(selectedDept)}
                        className="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition-colors shadow-2xs cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-slate-500" />
                        ویرایش دپارتمان
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteDept(selectedDept)}
                        className="inline-flex items-center gap-1.5 px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition-colors shadow-2xs cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                        حذف دپارتمان
                      </button>
                    </div>
                  )}
                </div>

                {/* Teams & Positions Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Teams List */}
                  <div className="bg-white rounded-2xl p-5 border border-slate-200 space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <h5 className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
                        <Users className="w-4 h-4 text-emerald-600" />
                        تیم‌ها و واحدهای کاری ({currentTeams.length})
                      </h5>
                      {canAccess('department.manage') && (
                        <button
                          type="button"
                          onClick={() => setIsTeamModalOpen(true)}
                          className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                          افزودن تیم
                        </button>
                      )}
                    </div>

                    <div className="space-y-2">
                      {currentTeams.length === 0 ? (
                        <p className="text-xs text-slate-400 py-3 text-center">تیمی برای این دپارتمان تعریف نشده است.</p>
                      ) : (
                        currentTeams.map((tm) => (
                          <div key={tm.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between text-xs">
                            <span className="font-bold text-slate-700">{tm.name}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] text-slate-400 font-mono">{tm.code}</span>
                              {canAccess('department.manage') && (
                                <button
                                  onClick={() => handleDeleteTeam(tm.id)}
                                  className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Positions List */}
                  <div className="bg-white rounded-2xl p-5 border border-slate-200 space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <h5 className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
                        <Briefcase className="w-4 h-4 text-indigo-600" />
                        عناوین شغلی مصوب چارت ({currentPositions.length})
                      </h5>
                      {canAccess('department.manage') && (
                        <button
                          type="button"
                          onClick={() => setIsPosModalOpen(true)}
                          className="text-[11px] font-bold text-indigo-700 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                          افزودن سمت
                        </button>
                      )}
                    </div>

                    <div className="space-y-2">
                      {currentPositions.length === 0 ? (
                        <p className="text-xs text-slate-400 py-3 text-center">سمتی برای این دپارتمان تعریف نشده است.</p>
                      ) : (
                        currentPositions.map((pos) => (
                          <div key={pos.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between text-xs">
                            <div>
                              <span className="font-bold text-slate-700 block">{pos.title}</span>
                              <span className="text-[10px] text-slate-400">سطح: {pos.level}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-md text-[10px] font-mono font-bold">
                                {pos.code}
                              </span>
                              {canAccess('department.manage') && (
                                <button
                                  onClick={() => handleDeletePosition(pos.id)}
                                  className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: BRANCHES AND REGIONAL OFFICES                                      */}
      {/* ========================================================================= */}
      {activeTab === 'branches' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <h3 className="font-extrabold text-slate-800 text-base flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-indigo-600" />
                  شعب، دفاتر استانی و مراکز عملیاتی ({branches.length} شعبه فعال)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">توزیع دفاتر مرکزی و استانی در سطح کشور</p>
              </div>

              {canAccess('department.manage') && (
                <button
                  type="button"
                  onClick={() => handleOpenCreateBranch()}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-black shadow-md shadow-indigo-600/20 transition-all hover:scale-102 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  تعریف شعبه استانی جدید
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {branches.map((b) => {
                const parentComp = companies.find(c => c.id === b.companyId);
                return (
                  <div key={b.id} className="p-5 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-3 flex flex-col justify-between">
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            {b.isHeadquarter && (
                              <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded-md text-[10px] font-black">
                                دفتر مرکزی (ستاد)
                              </span>
                            )}
                            <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 font-mono rounded-md text-[10px] font-bold">
                              {b.code}
                            </span>
                          </div>
                          <h4 className="font-bold text-sm text-slate-800 mt-1">{b.name}</h4>
                        </div>

                        {canAccess('department.manage') && (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleOpenEditBranch(b)}
                              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200/60"
                              title="ویرایش شعبه"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteBranch(b)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50"
                              title="حذف شعبه"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>

                      <div className="text-xs text-slate-600 space-y-1">
                        <p className="flex items-center gap-1">
                          <Building className="w-3.5 h-3.5 text-slate-400" />
                          شرکت متبوع: <strong className="text-slate-800">{parentComp?.name || 'شرکت گروه'}</strong>
                        </p>
                        <p className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          موقعیت: <span>{b.province ? `${b.province}، ${b.city}` : b.city}</span>
                        </p>
                        {b.address && (
                          <p className="text-[11px] text-slate-500 leading-relaxed truncate">{b.address}</p>
                        )}
                      </div>
                    </div>

                    {b.managerName && (
                      <div className="pt-2 border-t border-slate-200/60 text-[11px] text-slate-500 flex items-center justify-between">
                        <span>مسئول شعبه:</span>
                        <strong className="text-slate-700">{b.managerName}</strong>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: VISUAL TREE VIEW OF HOLDING HIERARCHY                               */}
      {/* ========================================================================= */}
      {activeTab === 'tree' && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-8">
          <div className="border-b border-slate-100 pb-4">
            <h3 className="font-extrabold text-slate-800 text-base flex items-center gap-2">
              <GitFork className="w-5 h-5 text-emerald-600" />
              نمودار درختی ساختار هلدینگ و شرکت‌های تابعه
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">نمای سلسله‌مراتبی از هلدینگ مادر به شرکت‌های تابعه و دپارتمان‌ها</p>
          </div>

          <div className="space-y-8">
            {holdingCompanies.map((holding) => {
              const subs = companies.filter(c => c.holdingId === holding.id);
              return (
                <div key={holding.id} className="space-y-6">
                  {/* Holding Node */}
                  <div className="flex justify-center">
                    <div className="bg-amber-500 text-white rounded-3xl p-5 shadow-lg border-2 border-amber-400 max-w-md w-full text-center space-y-2">
                      <span className="px-3 py-1 bg-amber-600 rounded-full text-[10px] font-black uppercase tracking-wider">
                        هلدینگ مادر
                      </span>
                      <h4 className="text-base font-black">{holding.name}</h4>
                      <p className="text-xs text-amber-100">{holding.industry}</p>
                      <div className="pt-2 border-t border-amber-400/50 flex justify-around text-xs font-mono">
                        <span>کد: {holding.code}</span>
                        <span>مدیرعامل: {holding.ceoName || 'نامشخص'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Vertical Connector */}
                  {subs.length > 0 && (
                    <div className="w-0.5 h-6 bg-slate-300 mx-auto" />
                  )}

                  {/* Subsidiaries Branch Row */}
                  {subs.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative">
                      {subs.map((sub) => {
                        const subDepts = departments.filter(d => d.companyId === sub.id);
                        return (
                          <div key={sub.id} className="bg-slate-50 border-2 border-emerald-300 rounded-3xl p-5 space-y-4 shadow-sm">
                            <div className="flex items-center justify-between">
                              <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 rounded-xl text-[10px] font-bold">
                                {sub.type === 'affiliate' ? 'شرکت وابسته' : 'شرکت تابعه'}
                              </span>
                              <span className="text-xs font-mono font-black text-emerald-700">{sub.ownershipPercentage || 100}٪ سهام</span>
                            </div>

                            <div>
                              <h5 className="font-extrabold text-sm text-slate-900">{sub.name}</h5>
                              <p className="text-xs text-slate-500 mt-0.5">{sub.industry}</p>
                            </div>

                            <div className="pt-3 border-t border-slate-200 space-y-1.5">
                              <span className="text-[11px] font-bold text-slate-600 block">دپارتمان‌های فعال:</span>
                              <div className="flex flex-wrap gap-1">
                                {subDepts.length === 0 ? (
                                  <span className="text-[10px] text-slate-400">دپارتمان مستقیمی ثبت نشده</span>
                                ) : (
                                  subDepts.map(d => (
                                    <span key={d.id} className="px-2 py-0.5 bg-white border border-slate-200 rounded-md text-[10px] font-medium text-slate-700">
                                      {d.name}
                                    </span>
                                  ))
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODALS                                                                    */}
      {/* ========================================================================= */}
      <CompanyModal
        isOpen={isCompanyModalOpen}
        onClose={() => setIsCompanyModalOpen(false)}
        onSave={handleSaveCompany}
        editingCompany={editingCompany}
        allCompanies={companies}
      />

      <BranchModal
        isOpen={isBranchModalOpen}
        onClose={() => setIsBranchModalOpen(false)}
        onSave={handleSaveBranch}
        editingBranch={editingBranch}
        companies={companies}
        selectedCompanyId={selectedCompanyId}
      />

      {/* MODAL: CREATE / EDIT DEPARTMENT */}
      {isDeptModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-100 animate-fadeIn space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-emerald-100 text-emerald-800">
                  <Layers className="w-5 h-5" />
                </span>
                <h3 className="text-base font-extrabold text-slate-800">
                  {editingDept ? 'ویرایش دپارتمان سازمانی' : 'تعریف دپارتمان جدید'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsDeptModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveDept} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">شرکت متبوع *</label>
                <select
                  value={deptForm.companyId}
                  onChange={(e) => setDeptForm({ ...deptForm, companyId: e.target.value })}
                  className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800"
                >
                  {companies.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">نام دپارتمان / واحد سازمانی *</label>
                <input
                  type="text"
                  required
                  value={deptForm.name}
                  onChange={(e) => setDeptForm({ ...deptForm, name: e.target.value })}
                  placeholder="مثال: دپارتمان هوش مصنوعی و کلود"
                  className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs focus:ring-2 focus:ring-emerald-500 focus:bg-white text-slate-800 font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">نام مدیر دپارتمان (اختیاری)</label>
                <input
                  type="text"
                  value={deptForm.managerName}
                  onChange={(e) => setDeptForm({ ...deptForm, managerName: e.target.value })}
                  placeholder="مثال: دکتر آرش طاهری"
                  className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs focus:ring-2 focus:ring-emerald-500 focus:bg-white text-slate-800 font-medium"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsDeptModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl text-xs font-bold transition-colors cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-black shadow-md shadow-emerald-600/20 transition-all hover:scale-102 cursor-pointer"
                >
                  {editingDept ? 'ذخیره تغییرات' : 'ایجاد دپارتمان'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD TEAM */}
      {isTeamModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <h4 className="text-sm font-extrabold text-slate-800">افزودن تیم کاری به دپارتمان {selectedDept.name}</h4>
            <form onSubmit={handleSaveTeam} className="space-y-3">
              <input
                type="text"
                required
                value={teamForm.name}
                onChange={(e) => setTeamForm({ ...teamForm, name: e.target.value })}
                placeholder="نام تیم (مثلاً تیم هوش مصنوعی)"
                className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs"
              />
              <input
                type="text"
                dir="ltr"
                value={teamForm.code}
                onChange={(e) => setTeamForm({ ...teamForm, code: e.target.value })}
                placeholder="کد تیم (e.g. AI-NLP)"
                className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-mono"
              />
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setIsTeamModalOpen(false)} className="px-3 py-2 text-xs text-slate-600 cursor-pointer">انصراف</button>
                <button type="submit" className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold cursor-pointer">ثبت تیم</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD POSITION */}
      {isPosModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <h4 className="text-sm font-extrabold text-slate-800">افزودن سمت مصوب به {selectedDept.name}</h4>
            <form onSubmit={handleSavePosition} className="space-y-3">
              <input
                type="text"
                required
                value={posForm.title}
                onChange={(e) => setPosForm({ ...posForm, title: e.target.value })}
                placeholder="عنوان سمت (مثلاً معمار داده)"
                className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs"
              />
              <input
                type="text"
                dir="ltr"
                value={posForm.code}
                onChange={(e) => setPosForm({ ...posForm, code: e.target.value })}
                placeholder="کد سمت (e.g. DATA-ARCH)"
                className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-mono"
              />
              <select
                value={posForm.level}
                onChange={(e) => setPosForm({ ...posForm, level: e.target.value })}
                className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold"
              >
                <option value="مدیر ارشد">مدیر ارشد</option>
                <option value="مدیر میانی">مدیر میانی</option>
                <option value="کارشناس ارشد">کارشناس ارشد</option>
                <option value="کارشناس">کارشناس</option>
                <option value="کاردان / تکنسین">کاردان / تکنسین</option>
              </select>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setIsPosModalOpen(false)} className="px-3 py-2 text-xs text-slate-600 cursor-pointer">انصراف</button>
                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold cursor-pointer">ثبت سمت</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
