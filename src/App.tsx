import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/layout/Navbar';
import { Sidebar, NavItem } from './components/layout/Sidebar';
import { Dashboard } from './components/dashboard/Dashboard';
import { EmployeeList } from './components/employees/EmployeeList';
import { Employee360Profile } from './components/employees/Employee360Profile';
import { OrgChartViewer } from './components/org/OrgChartViewer';
import { UserManagement } from './components/users/UserManagement';
import { BackupManagement } from './components/backup/BackupManagement';
import { AuditLogViewer } from './components/audit/AuditLogViewer';
import { LoginPage } from './components/auth/LoginPage';
import { ExcelImportModal } from './components/employees/ExcelImportModal';
import { ReportsDashboard } from './components/reports/ReportsDashboard';
import { ContractManagement } from './components/contracts/ContractManagement';
import { checkAndRunScheduledBackups } from './services/backupService';

export function AppContent() {
  const { isAuthenticated, loading } = useAuth();
  const [currentTab, setCurrentTab] = useState<NavItem>('dashboard');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
  const [contractEmployeeId, setContractEmployeeId] = useState<string | undefined>(undefined);
  const [toastMessage, setToastMessage] = useState<string>('');


  useEffect(() => {
    // Run automated daily/monthly backup check if logged in
    if (isAuthenticated) {
      checkAndRunScheduledBackups().catch(err => console.warn('Auto backup check failed:', err));
    }
  }, [isAuthenticated]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 4000);
  };

  const handleSelectEmployee = (id: string) => {
    setSelectedEmployeeId(id);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white space-y-4">
        <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-slate-400 font-medium">در حال بررسی نشست کاربری سامانه...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return (
    <div className="min-h-screen bg-slate-50/60 text-slate-900 font-sans antialiased selection:bg-emerald-500 selection:text-white flex flex-col">
      {/* Top Navbar */}
      <Navbar onOpenExcelImport={() => setCurrentTab('excel')} />

      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-emerald-700 text-white px-6 py-3 rounded-2xl shadow-xl font-bold text-xs flex items-center gap-2 animate-fadeIn border border-emerald-500">
          <span>✓</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Workspace Layout */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full">
        <div className="flex flex-col md:flex-row items-start gap-8">
          {/* Right Sidebar (RTL) */}
          <Sidebar
            currentTab={selectedEmployeeId ? 'employees' : currentTab}
            onSelectTab={(tab) => {
              setSelectedEmployeeId(null);
              setCurrentTab(tab);
            }}
          />

          {/* Center Main Stage Content */}
          <main className="flex-1 w-full min-w-0">
            {/* View 1: 360-degree Profile if an employee is selected */}
            {selectedEmployeeId ? (
              <Employee360Profile
                employeeId={selectedEmployeeId}
                onBack={() => setSelectedEmployeeId(null)}
                onEdit={(empId) => {
                  setSelectedEmployeeId(null);
                  setCurrentTab('employees');
                }}
                onOpenContract={(empId) => {
                  setSelectedEmployeeId(null);
                  setContractEmployeeId(empId);
                  setCurrentTab('contracts');
                }}
              />
            ) : currentTab === 'dashboard' ? (
              <Dashboard
                onNavigateToEmployees={() => setCurrentTab('employees')}
                onSelectEmployee={handleSelectEmployee}
                onNavigateToExcel={() => setCurrentTab('excel')}
                onNavigateToReports={() => setCurrentTab('reports')}
              />
            ) : currentTab === 'excel' ? (
              <ExcelImportModal
                isInline={true}
                onClose={() => setCurrentTab('employees')}
                onSuccess={(summary) => {
                  showToast(`عملیات ورود با موفقیت انجام شد: ${summary.insertedCount} رکورد جدید، ${summary.updatedCount} رکورد به‌روزرسانی`);
                }}
              />
            ) : currentTab === 'employees' ? (
              <EmployeeList
                onSelectEmployee={handleSelectEmployee}
                onNewEmployee={() => setCurrentTab('excel')}
                onOpenContract={(empId) => {
                  setContractEmployeeId(empId);
                  setCurrentTab('contracts');
                }}
              />
            ) : currentTab === 'contracts' ? (
              <ContractManagement
                initialEmployeeId={contractEmployeeId}
                onSelectEmployee={handleSelectEmployee}
              />
            ) : currentTab === 'reports' ? (
              <ReportsDashboard />
            ) : currentTab === 'org' ? (
              <OrgChartViewer />
            ) : currentTab === 'users' ? (
              <UserManagement />
            ) : currentTab === 'backups' ? (
              <BackupManagement />
            ) : currentTab === 'audit' ? (
              <AuditLogViewer />
            ) : null}

          </main>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
