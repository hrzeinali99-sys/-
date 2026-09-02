import React, { useState, useEffect } from 'react';
import { 
  X, Save, User, Briefcase, DollarSign, Phone, MapPin, 
  ShieldCheck, Heart, AlertTriangle, Building, CreditCard,
  FileBadge, CheckCircle2, RefreshCw, Calendar, Sparkles,
  Coins, FileCheck
} from 'lucide-react';
import { 
  EmployeeSummary, 
  FullRegistrationFormData, 
  Gender, 
  MaritalStatus, 
  MilitaryStatus, 
  EmploymentStatus, 
  ContractType,
  SupplementaryInsurancePaymentMethod 
} from '../../types';
import { 
  getEmployee360Profile, 
  updateFullEmployee 
} from '../../services/employeeService';
import { 
  DEFAULT_COMPANIES, 
  DEFAULT_DEPARTMENTS, 
  DEFAULT_BRANCHES, 
  DEFAULT_POSITIONS 
} from '../../services/masterDataService';
import { useAuth } from '../../context/AuthContext';
import { toJalaliDate } from '../../utils/persianDate';
import { formatRial, formatToman } from '../../utils/formatters';

interface Props {
  employeeId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updatedSummary?: Partial<EmployeeSummary>) => void;
}

type EditTab = 'identity' | 'organization' | 'contract' | 'contacts' | 'salary' | 'guarantee' | 'insurance' | 'emergency';

export const EmployeeEditModal: React.FC<Props> = ({ employeeId, isOpen, onClose, onSuccess }) => {
  const { user, role, canAccess } = useAuth();
  const [activeTab, setActiveTab] = useState<EditTab>('identity');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Form State
  const [formData, setFormData] = useState<any>({
    // Identity
    id: employeeId,
    employeeCode: '',
    firstName: '',
    lastName: '',
    latinFirstName: '',
    latinLastName: '',
    nationalId: '',
    fatherName: '',
    idNumber: '',
    idSerialSeries: '',
    idSerialNumber: '',
    birthDate: '',
    birthDateJalali: '',
    gender: 'مرد' as Gender,
    maritalStatus: 'مجرد' as MaritalStatus,
    militaryStatus: 'پایان خدمت' as MilitaryStatus,
    childrenCount: 0,
    spouseBirthDate: '',
    spouseBirthDateJalali: '',
    childBirthDate: '',
    childBirthDateJalali: '',
    profileImageUrl: '',

    // Organization
    organization: {
      companyId: 'comp-1',
      companyName: 'گروه سرمایه‌گذاری و توسعه مالی کیهان (هلدینگ مادر)',
      departmentId: 'dept-1',
      departmentName: 'منابع انسانی و توسعه سازمانی',
      branchId: 'br-1',
      branchName: 'دفتر مرکزی تهران (برج کیهان)',
      positionId: 'pos-1',
      positionTitle: 'کارشناس ارشد منابع انسانی',
      jobLevel: 'کارشناس ارشد',
      directManagerName: '',
      costCenterCode: 'CC-101',
      workLocation: 'تهران'
    },

    // Employment & Contract
    employment: {
      employmentType: 'تمام وقت',
      contractType: 'موقت' as ContractType,
      employmentStatus: 'active' as EmploymentStatus,
      hireDate: '',
      hireDateJalali: '',
      contractEndDate: '',
      contractEndDateJalali: '',
      cooperationType: 'تمام وقت',
      weeklyHours: 44
    },

    // Contacts & Address
    contacts: {
      mobile: '',
      landline: '',
      workEmail: '',
      personalEmail: ''
    },
    address: {
      province: 'تهران',
      city: 'تهران',
      fullAddress: '',
      postalCode: '',
      housingStatus: 'مالک'
    },

    // Salary & Financial
    salary: {
      baseSalary: 0,
      netSalary: 0,
      housingAllowance: 0,
      childAllowance: 0,
      foodVouchers: 0,
      fixedBenefits: 0
    },
    banking: {
      bankName: 'بانک ملت',
      iban: '',
      accountNumber: '',
      cardNumber: ''
    },

    // Promissory Note Guarantee (سفته ضمانت)
    guarantee: {
      guaranteeNoteAmount: 1000000000,
      guaranteeNoteNumber: '',
      guaranteeNoteStatus: 'received',
      guaranteeNoteGuarantorName: '',
      guaranteeNoteReceivedDateJalali: '',
      guaranteeNoteDueDateJalali: '',
      guaranteeNoteDescription: 'لاشه سفته در گاوصندوق مرکزی بایگانی شده است.'
    },

    // Insurance
    insurance: {
      insuranceType: 'تأمین اجتماعی',
      insuranceNumber: '',
      hasSupplementaryInsurance: false,
      supplementaryInsuranceCompany: 'بیمه ایران',
      supplementaryInsurancePaymentMethod: 'کسر از حقوق' as SupplementaryInsurancePaymentMethod,
      supplementaryInsurancePremium: 0
    },

    // Emergency & HR Notes
    emergencyContact: {
      name: '',
      relationship: 'همسر',
      phone: ''
    },
    additionalInfo: {
      hrConfidentialNotes: '',
      skillsSummary: '',
      bloodType: 'O+'
    }
  });

  useEffect(() => {
    if (!isOpen || !employeeId) return;

    let isMounted = true;
    setLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    getEmployee360Profile(employeeId).then((profile) => {
      if (!isMounted) return;
      if (profile) {
        setFormData({
          id: employeeId,
          employeeCode: profile.employeeCode || profile.summary?.employeeCode || '',
          firstName: profile.firstName || profile.summary?.firstName || '',
          lastName: profile.lastName || profile.summary?.lastName || '',
          latinFirstName: profile.latinFirstName || profile.summary?.latinFirstName || '',
          latinLastName: profile.latinLastName || profile.summary?.latinLastName || '',
          nationalId: profile.nationalId || profile.summary?.nationalId || '',
          fatherName: profile.fatherName || profile.additionalInfo?.fatherName || '',
          idNumber: profile.idNumber || profile.additionalInfo?.idNumber || '',
          idSerialSeries: profile.idSerialSeries || '',
          idSerialNumber: profile.idSerialNumber || '',
          birthDate: profile.birthDate || profile.summary?.birthDate || '',
          birthDateJalali: profile.birthDateJalali || profile.summary?.birthDateJalali || (profile.birthDate ? toJalaliDate(profile.birthDate) : ''),
          gender: profile.gender || profile.summary?.gender || 'مرد',
          maritalStatus: profile.maritalStatus || profile.summary?.maritalStatus || 'مجرد',
          militaryStatus: profile.militaryStatus || 'پایان خدمت',
          childrenCount: profile.childrenCount !== undefined ? profile.childrenCount : (profile.summary?.childrenCount || 0),
          spouseBirthDate: profile.spouseBirthDate || profile.summary?.spouseBirthDate || '',
          spouseBirthDateJalali: profile.spouseBirthDateJalali || profile.summary?.spouseBirthDateJalali || '',
          childBirthDate: profile.childBirthDate || profile.summary?.childBirthDate || '',
          childBirthDateJalali: profile.childBirthDateJalali || profile.summary?.childBirthDateJalali || '',
          profileImageUrl: profile.profileImageUrl || profile.summary?.profileImageUrl || '',

          organization: {
            companyId: profile.organization?.companyId || profile.summary?.companyId || 'comp-1',
            companyName: profile.organization?.companyName || profile.summary?.companyName || 'گروه سرمایه‌گذاری کیهان',
            departmentId: profile.organization?.departmentId || profile.summary?.departmentId || 'dept-1',
            departmentName: profile.organization?.departmentName || profile.summary?.departmentName || 'منابع انسانی',
            branchId: profile.organization?.branchId || profile.summary?.branchId || 'br-1',
            branchName: profile.organization?.branchName || profile.summary?.branchName || 'دفتر مرکزی',
            positionId: profile.organization?.positionId || profile.summary?.positionId || 'pos-1',
            positionTitle: profile.organization?.positionTitle || profile.summary?.positionTitle || 'کارشناس',
            jobLevel: profile.organization?.jobLevel || profile.summary?.jobLevel || 'کارشناس',
            directManagerName: profile.organization?.directManagerName || profile.summary?.managerName || '',
            costCenterCode: profile.organization?.costCenterCode || profile.summary?.costCenterCode || '',
            workLocation: profile.organization?.workLocation || 'تهران'
          },

          employment: {
            employmentType: profile.employment?.employmentType || profile.summary?.employmentType || 'تمام وقت',
            contractType: profile.employment?.contractType || profile.summary?.contractType || 'موقت',
            employmentStatus: profile.employment?.employmentStatus || profile.summary?.employmentStatus || 'active',
            hireDate: profile.employment?.hireDate || profile.summary?.hireDate || '',
            hireDateJalali: profile.employment?.hireDateJalali || profile.summary?.hireDateJalali || '',
            contractEndDate: profile.employment?.contractEndDate || profile.summary?.contractEndDate || '',
            contractEndDateJalali: profile.employment?.contractEndDateJalali || '',
            cooperationType: profile.employment?.cooperationType || 'تمام وقت',
            weeklyHours: profile.employment?.workingHoursWeekly || 44
          },

          contacts: {
            mobile: profile.contacts?.mobile || profile.summary?.mobile || '',
            landline: profile.contacts?.landline || '',
            workEmail: profile.contacts?.workEmail || profile.summary?.workEmail || '',
            personalEmail: profile.contacts?.personalEmail || ''
          },

          address: {
            province: profile.addresses?.[0]?.province || 'تهران',
            city: profile.addresses?.[0]?.city || 'تهران',
            fullAddress: profile.addresses?.[0]?.fullAddress || '',
            postalCode: profile.addresses?.[0]?.postalCode || '',
            housingStatus: profile.addresses?.[0]?.housingStatus || 'مالک'
          },

          salary: {
            baseSalary: profile.salary?.baseSalary || profile.summary?.baseSalary || 0,
            netSalary: profile.salary?.netSalary || profile.summary?.netSalary || 0,
            housingAllowance: profile.salary?.housingAllowance || 0,
            childAllowance: profile.salary?.childAllowance || 0,
            foodVouchers: profile.salary?.foodVouchers || 0,
            fixedBenefits: profile.salary?.fixedBenefits || 0
          },

          banking: {
            bankName: profile.bankAccounts?.[0]?.bankName || 'بانک ملت',
            iban: profile.bankAccounts?.[0]?.iban || '',
            accountNumber: profile.bankAccounts?.[0]?.accountNumber || '',
            cardNumber: profile.bankAccounts?.[0]?.cardNumber || ''
          },

          insurance: {
            insuranceType: profile.insurance?.insuranceType || 'تأمین اجتماعی',
            insuranceNumber: profile.insurance?.insuranceNumber || '',
            hasSupplementaryInsurance: Boolean(profile.insurance?.hasSupplementaryInsurance ?? profile.summary?.hasSupplementaryInsurance),
            supplementaryInsuranceCompany: profile.insurance?.supplementaryInsuranceCompany || profile.summary?.supplementaryInsuranceCompany || 'بیمه ایران',
            supplementaryInsurancePaymentMethod: profile.insurance?.supplementaryInsurancePaymentMethod || profile.insurance?.supplementaryPaymentMethod || profile.summary?.supplementaryInsurancePaymentMethod || 'کسر از حقوق',
            supplementaryInsurancePremium: profile.insurance?.supplementaryInsurancePremium || profile.summary?.supplementaryInsurancePremium || 0
          },

          emergencyContact: {
            name: profile.emergencyContacts?.[0]?.name || '',
            relationship: profile.emergencyContacts?.[0]?.relationship || 'همسر',
            phone: profile.emergencyContacts?.[0]?.phone || ''
          },

          guarantee: {
            guaranteeNoteAmount: profile.summary?.guaranteeNoteAmount !== undefined 
              ? profile.summary?.guaranteeNoteAmount 
              : (profile.additionalInfo?.guaranteeNoteAmount || 1000000000),
            guaranteeNoteNumber: profile.summary?.guaranteeNoteNumber || profile.additionalInfo?.guaranteeNoteNumber || `SAF-${profile.employeeCode || profile.summary?.employeeCode || '140301'}`,
            guaranteeNoteStatus: profile.summary?.guaranteeNoteStatus || profile.additionalInfo?.guaranteeNoteStatus || 'received',
            guaranteeNoteGuarantorName: profile.summary?.guaranteeNoteGuarantorName || profile.additionalInfo?.guaranteeNoteGuarantorName || '',
            guaranteeNoteReceivedDateJalali: profile.summary?.guaranteeNoteReceivedDateJalali || profile.additionalInfo?.guaranteeNoteReceivedDateJalali || (profile.employment?.hireDate ? toJalaliDate(profile.employment.hireDate) : ''),
            guaranteeNoteDueDateJalali: profile.summary?.guaranteeNoteDueDateJalali || profile.additionalInfo?.guaranteeNoteDueDateJalali || '',
            guaranteeNoteDescription: profile.summary?.guaranteeNoteDescription || profile.additionalInfo?.guaranteeNoteDescription || 'لاشه سفته در گاوصندوق مرکزی بایگانی شده است.'
          },

          additionalInfo: {
            hrConfidentialNotes: profile.additionalInfo?.hrConfidentialNotes || '',
            skillsSummary: profile.additionalInfo?.skillsSummary || '',
            bloodType: profile.additionalInfo?.bloodType || 'O+'
          }
        });
      }
      setLoading(false);
    }).catch((err) => {
      if (isMounted) {
        setErrorMessage('خطا در دریافت مشخصات پرسنل');
        setLoading(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [isOpen, employeeId]);

  if (!isOpen) return null;

  const handleCompanyChange = (companyId: string) => {
    const comp = DEFAULT_COMPANIES.find(c => c.id === companyId);
    setFormData((prev: any) => ({
      ...prev,
      organization: {
        ...prev.organization,
        companyId,
        companyName: comp ? comp.name : prev.organization.companyName
      }
    }));
  };

  const handleDepartmentChange = (departmentId: string) => {
    const dept = DEFAULT_DEPARTMENTS.find(d => d.id === departmentId);
    setFormData((prev: any) => ({
      ...prev,
      organization: {
        ...prev.organization,
        departmentId,
        departmentName: dept ? dept.name : prev.organization.departmentName
      }
    }));
  };

  const handleBranchChange = (branchId: string) => {
    const br = DEFAULT_BRANCHES.find(b => b.id === branchId);
    setFormData((prev: any) => ({
      ...prev,
      organization: {
        ...prev.organization,
        branchId,
        branchName: br ? br.name : prev.organization.branchName
      }
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMessage('');
    setSuccessMessage('');

    // Validations
    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      setErrorMessage('نام و نام خانوادگی الزامی است.');
      setSaving(false);
      return;
    }
    if (!formData.employeeCode.trim()) {
      setErrorMessage('کد پرسنلی الزامی است.');
      setSaving(false);
      return;
    }
    if (!formData.nationalId.trim()) {
      setErrorMessage('کد ملی الزامی است.');
      setSaving(false);
      return;
    }

    try {
      const payload: Partial<FullRegistrationFormData> & { id: string } = {
        id: employeeId,
        employeeCode: formData.employeeCode.trim(),
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        latinFirstName: formData.latinFirstName?.trim() || '',
        latinLastName: formData.latinLastName?.trim() || '',
        nationalId: formData.nationalId.trim(),
        birthDate: formData.birthDate,
        birthDateJalali: formData.birthDateJalali,
        gender: formData.gender,
        maritalStatus: formData.maritalStatus,
        childrenCount: Number(formData.childrenCount) || 0,
        spouseBirthDate: formData.spouseBirthDate,
        spouseBirthDateJalali: formData.spouseBirthDateJalali,
        childBirthDate: formData.childBirthDate,
        childBirthDateJalali: formData.childBirthDateJalali,
        profileImageUrl: formData.profileImageUrl,

        contacts: {
          id: 'primary',
          mobile: formData.contacts.mobile.trim(),
          landline: formData.contacts.landline?.trim(),
          workEmail: formData.contacts.workEmail?.trim(),
          personalEmail: formData.contacts.personalEmail?.trim()
        },

        addresses: [{
          id: 'primary',
          type: 'residential',
          title: 'نشانی سکونت',
          province: formData.address.province,
          city: formData.address.city,
          fullAddress: formData.address.fullAddress,
          postalCode: formData.address.postalCode
        }],

        organization: formData.organization,
        employment: formData.employment,
        salary: formData.salary,
        banking: formData.banking,
        insurance: formData.insurance,
        emergencyContacts: formData.emergencyContact.name ? [{
          id: 'primary',
          name: formData.emergencyContact.name,
          relationship: formData.emergencyContact.relationship,
          mobile: formData.emergencyContact.phone || '',
          phone: formData.emergencyContact.phone || '',
          priority: 1,
          isPrimary: true
        }] : [],
        additionalInfo: {
          ...formData.additionalInfo,
          guaranteeNoteAmount: Number(formData.guarantee.guaranteeNoteAmount) || 0,
          guaranteeNoteNumber: formData.guarantee.guaranteeNoteNumber?.trim() || '',
          guaranteeNoteStatus: formData.guarantee.guaranteeNoteStatus || 'received',
          guaranteeNoteGuarantorName: formData.guarantee.guaranteeNoteGuarantorName?.trim() || '',
          guaranteeNoteReceivedDateJalali: formData.guarantee.guaranteeNoteReceivedDateJalali || '',
          guaranteeNoteDueDateJalali: formData.guarantee.guaranteeNoteDueDateJalali || '',
          guaranteeNoteDescription: formData.guarantee.guaranteeNoteDescription || ''
        }
      };

      const result = await updateFullEmployee(employeeId, payload, {
        uid: user?.uid || 'admin',
        displayName: user?.displayName || 'مدیر سیستم',
        role: role || 'super_admin'
      });

      if (result.success) {
        setSuccessMessage('اطلاعات و پرونده پرسنل با موفقیت به‌روزرسانی شد.');
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 800);
      } else {
        setErrorMessage(result.error || 'خطا در ویرایش اطلاعات');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'خطا در برقراری ارتباط با پایگاه داده');
    } finally {
      setSaving(false);
    }
  };

  const tabs: { id: EditTab; label: string; icon: any }[] = [
    { id: 'identity', label: 'اطلاعات هویتی و سجلی', icon: User },
    { id: 'organization', label: 'شرکت، واحد و سمت', icon: Building },
    { id: 'contract', label: 'قرارداد و وضعیت', icon: Briefcase },
    { id: 'contacts', label: 'تماس و نشانی سکونت', icon: Phone },
    { id: 'salary', label: 'حقوق، مزایا و بانک', icon: DollarSign },
    { id: 'guarantee', label: 'سفته ضمانت و تعهدات', icon: Coins },
    { id: 'insurance', label: 'بیمه پایه و تکمیلی', icon: ShieldCheck },
    { id: 'emergency', label: 'تماس اضطراری و HR', icon: Heart }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto animate-fadeIn">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4.5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-600/30 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-black">
              <FileBadge className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-base text-white flex items-center gap-2">
                ویرایش جامع مشخصات پرسنلی
                <span className="text-xs font-mono font-normal text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded-md border border-emerald-800">
                  {formData.firstName} {formData.lastName} ({formData.employeeCode})
                </span>
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                تغییر کلیه اطلاعات هویتی، استخدامی، حقوقی، بانکی، بیمه تکمیلی و ثبت در لاگ ممیزی
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-2.5 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  isActive 
                    ? 'bg-emerald-600 text-white shadow-xs' 
                    : 'text-slate-600 hover:bg-slate-200/70 hover:text-slate-900'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-6">
          {loading ? (
            <div className="py-20 text-center space-y-3">
              <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin mx-auto" />
              <p className="text-xs font-bold text-slate-600">در حال دریافت کلیه مشخصات پرسنل...</p>
            </div>
          ) : (
            <>
              {errorMessage && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-2 text-xs font-bold text-rose-700">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {successMessage && (
                <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-2 text-xs font-bold text-emerald-700">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{successMessage}</span>
                </div>
              )}

              {/* ---------------- Tab 1: Identity & Personal ---------------- */}
              {activeTab === 'identity' && (
                <div className="space-y-4">
                  <h4 className="font-bold text-slate-800 text-xs border-b pb-2 border-slate-200 flex items-center gap-2">
                    <User className="w-4 h-4 text-emerald-600" />
                    اطلاعات هویتی، سجلی و فردی
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
                    <div>
                      <label className="block text-slate-600 font-semibold mb-1">نام *</label>
                      <input
                        type="text"
                        required
                        value={formData.firstName}
                        onChange={e => setFormData({ ...formData, firstName: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-emerald-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-600 font-semibold mb-1">نام خانوادگی *</label>
                      <input
                        type="text"
                        required
                        value={formData.lastName}
                        onChange={e => setFormData({ ...formData, lastName: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-emerald-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-600 font-semibold mb-1">کد پرسنلی *</label>
                      <input
                        type="text"
                        required
                        value={formData.employeeCode}
                        onChange={e => setFormData({ ...formData, employeeCode: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-emerald-500 focus:outline-none font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-600 font-semibold mb-1">کد ملی (۱۰ رقم) *</label>
                      <input
                        type="text"
                        required
                        maxLength={10}
                        value={formData.nationalId}
                        onChange={e => setFormData({ ...formData, nationalId: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-emerald-500 focus:outline-none font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-600 font-semibold mb-1">نام پدر</label>
                      <input
                        type="text"
                        value={formData.fatherName}
                        onChange={e => setFormData({ ...formData, fatherName: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-emerald-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-600 font-semibold mb-1">شماره شناسنامه</label>
                      <input
                        type="text"
                        value={formData.idNumber}
                        onChange={e => setFormData({ ...formData, idNumber: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-emerald-500 focus:outline-none font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-600 font-semibold mb-1">تاریخ تولد (شمسی)</label>
                      <input
                        type="text"
                        placeholder="مثلاً 1370/05/20"
                        value={formData.birthDateJalali}
                        onChange={e => setFormData({ ...formData, birthDateJalali: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-emerald-500 focus:outline-none font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-600 font-semibold mb-1">جنسیت</label>
                      <select
                        value={formData.gender}
                        onChange={e => setFormData({ ...formData, gender: e.target.value as Gender })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-emerald-500 focus:outline-none bg-white"
                      >
                        <option value="مرد">مرد</option>
                        <option value="زن">زن</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-600 font-semibold mb-1">وضعیت تأهل</label>
                      <select
                        value={formData.maritalStatus}
                        onChange={e => setFormData({ ...formData, maritalStatus: e.target.value as MaritalStatus })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-emerald-500 focus:outline-none bg-white"
                      >
                        <option value="مجرد">مجرد</option>
                        <option value="متأهل">متأهل</option>
                        <option value="معیل">معیل</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-600 font-semibold mb-1">تعداد فرزندان</label>
                      <input
                        type="number"
                        min={0}
                        max={10}
                        value={formData.childrenCount}
                        onChange={e => setFormData({ ...formData, childrenCount: Number(e.target.value) })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-emerald-500 focus:outline-none font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-600 font-semibold mb-1">وضعیت نظام وظیفه</label>
                      <select
                        value={formData.militaryStatus}
                        onChange={e => setFormData({ ...formData, militaryStatus: e.target.value as MilitaryStatus })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-emerald-500 focus:outline-none bg-white"
                      >
                        <option value="پایان خدمت">پایان خدمت</option>
                        <option value="معافیت دائم">معافیت دائم</option>
                        <option value="معافیت پزشکی">معافیت پزشکی</option>
                        <option value="معافیت تحصیلی">معافیت تحصیلی</option>
                        <option value="مشمول">مشمول</option>
                        <option value="غیر مشمول (بانوان)">غیر مشمول (بانوان)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-600 font-semibold mb-1">لینک عکس پرسنلی (URL)</label>
                      <input
                        type="text"
                        placeholder="https://..."
                        value={formData.profileImageUrl}
                        onChange={e => setFormData({ ...formData, profileImageUrl: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-emerald-500 focus:outline-none font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-600 font-semibold mb-1">نام لاتین (First Name)</label>
                      <input
                        type="text"
                        placeholder="e.g. Ali"
                        value={formData.latinFirstName}
                        onChange={e => setFormData({ ...formData, latinFirstName: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-emerald-500 focus:outline-none font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-600 font-semibold mb-1">نام خانوادگی لاتین (Last Name)</label>
                      <input
                        type="text"
                        placeholder="e.g. Mohammadi"
                        value={formData.latinLastName}
                        onChange={e => setFormData({ ...formData, latinLastName: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-emerald-500 focus:outline-none font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-600 font-semibold mb-1">تاریخ تولد همسر (شمسی)</label>
                      <input
                        type="text"
                        placeholder="1372/02/10"
                        value={formData.spouseBirthDateJalali}
                        onChange={e => setFormData({ ...formData, spouseBirthDateJalali: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-emerald-500 focus:outline-none font-mono"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* ---------------- Tab 2: Organization & Role ---------------- */}
              {activeTab === 'organization' && (
                <div className="space-y-4">
                  <h4 className="font-bold text-slate-800 text-xs border-b pb-2 border-slate-200 flex items-center gap-2">
                    <Building className="w-4 h-4 text-emerald-600" />
                    جایگاه سازمانی، شرکت محل فعالیت و سمت
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div>
                      <label className="block text-slate-600 font-semibold mb-1">شرکت محل فعالیت *</label>
                      <select
                        value={formData.organization.companyId}
                        onChange={e => handleCompanyChange(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-emerald-500 focus:outline-none bg-white font-medium"
                      >
                        {DEFAULT_COMPANIES.map(comp => (
                          <option key={comp.id} value={comp.id}>{comp.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-600 font-semibold mb-1">دپارتمان / واحد سازمانی *</label>
                      <select
                        value={formData.organization.departmentId}
                        onChange={e => handleDepartmentChange(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-emerald-500 focus:outline-none bg-white font-medium"
                      >
                        {DEFAULT_DEPARTMENTS.map(dept => (
                          <option key={dept.id} value={dept.id}>{dept.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-600 font-semibold mb-1">شعبه / محل خدمت *</label>
                      <select
                        value={formData.organization.branchId}
                        onChange={e => handleBranchChange(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-emerald-500 focus:outline-none bg-white font-medium"
                      >
                        {DEFAULT_BRANCHES.map(br => (
                          <option key={br.id} value={br.id}>{br.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-600 font-semibold mb-1">سمت سازمانی / عنوان شغل *</label>
                      <input
                        type="text"
                        required
                        value={formData.organization.positionTitle}
                        onChange={e => setFormData({
                          ...formData,
                          organization: { ...formData.organization, positionTitle: e.target.value }
                        })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-emerald-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-600 font-semibold mb-1">سطح شغلی</label>
                      <select
                        value={formData.organization.jobLevel}
                        onChange={e => setFormData({
                          ...formData,
                          organization: { ...formData.organization, jobLevel: e.target.value }
                        })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-emerald-500 focus:outline-none bg-white"
                      >
                        <option value="کارشناس">کارشناس</option>
                        <option value="کارشناس ارشد">کارشناس ارشد</option>
                        <option value="سرپرست">سرپرست</option>
                        <option value="مدیر واحد">مدیر واحد</option>
                        <option value="معاونت">معاونت</option>
                        <option value="مدیرعامل / هیئت مدیره">مدیرعامل / هیئت مدیره</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-600 font-semibold mb-1">مدیر مستقیم</label>
                      <input
                        type="text"
                        value={formData.organization.directManagerName}
                        onChange={e => setFormData({
                          ...formData,
                          organization: { ...formData.organization, directManagerName: e.target.value }
                        })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-emerald-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-600 font-semibold mb-1">کد مرکز هزینه</label>
                      <input
                        type="text"
                        value={formData.organization.costCenterCode}
                        onChange={e => setFormData({
                          ...formData,
                          organization: { ...formData.organization, costCenterCode: e.target.value }
                        })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-emerald-500 focus:outline-none font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-600 font-semibold mb-1">شهر محل خدمت</label>
                      <input
                        type="text"
                        value={formData.organization.workLocation}
                        onChange={e => setFormData({
                          ...formData,
                          organization: { ...formData.organization, workLocation: e.target.value }
                        })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-emerald-500 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* ---------------- Tab 3: Contract & Employment ---------------- */}
              {activeTab === 'contract' && (
                <div className="space-y-4">
                  <h4 className="font-bold text-slate-800 text-xs border-b pb-2 border-slate-200 flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-emerald-600" />
                    نوع قرارداد، شرایط استخدام و وضعیت شاغل
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
                    <div>
                      <label className="block text-slate-600 font-semibold mb-1">نوع استخدام</label>
                      <select
                        value={formData.employment.employmentType}
                        onChange={e => setFormData({
                          ...formData,
                          employment: { ...formData.employment, employmentType: e.target.value }
                        })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-emerald-500 focus:outline-none bg-white"
                      >
                        <option value="تمام وقت">تمام وقت</option>
                        <option value="پاره وقت">پاره وقت</option>
                        <option value="پروژه‌ای">پروژه‌ای</option>
                        <option value="ساعتی">ساعتی</option>
                        <option value="مشاوره‌ای">مشاوره‌ای</option>
                        <option value="کارآموزی">کارآموزی</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-600 font-semibold mb-1">نوع قرارداد</label>
                      <select
                        value={formData.employment.contractType}
                        onChange={e => setFormData({
                          ...formData,
                          employment: { ...formData.employment, contractType: e.target.value as ContractType }
                        })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-emerald-500 focus:outline-none bg-white"
                      >
                        <option value="موقت">موقت</option>
                        <option value="دائمی">دائمی</option>
                        <option value="پروژه‌ای">پروژه‌ای</option>
                        <option value="ساعتی">ساعتی</option>
                        <option value="مشاور">مشاور</option>
                        <option value="کارآموز">کارآموز</option>
                        <option value="پیمانکاری">پیمانکاری</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-600 font-semibold mb-1">وضعیت اشتغال *</label>
                      <select
                        value={formData.employment.employmentStatus}
                        onChange={e => setFormData({
                          ...formData,
                          employment: { ...formData.employment, employmentStatus: e.target.value as EmploymentStatus }
                        })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-emerald-500 focus:outline-none bg-white font-bold"
                      >
                        <option value="active">فعال و شاغل</option>
                        <option value="on_leave">مرخصی</option>
                        <option value="suspended">تعلیق</option>
                        <option value="terminated">خاتمه همکاری</option>
                        <option value="retired">بازنشسته</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-600 font-semibold mb-1">تاریخ استخدام (شمسی)</label>
                      <input
                        type="text"
                        placeholder="1402/01/15"
                        value={formData.employment.hireDateJalali}
                        onChange={e => setFormData({
                          ...formData,
                          employment: { ...formData.employment, hireDateJalali: e.target.value }
                        })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-emerald-500 focus:outline-none font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-600 font-semibold mb-1">تاریخ پایان قرارداد (شمسی)</label>
                      <input
                        type="text"
                        placeholder="1403/12/29"
                        value={formData.employment.contractEndDateJalali}
                        onChange={e => setFormData({
                          ...formData,
                          employment: { ...formData.employment, contractEndDateJalali: e.target.value }
                        })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-emerald-500 focus:outline-none font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-600 font-semibold mb-1">ساعت کاری هفتگی</label>
                      <input
                        type="number"
                        value={formData.employment.weeklyHours}
                        onChange={e => setFormData({
                          ...formData,
                          employment: { ...formData.employment, weeklyHours: Number(e.target.value) }
                        })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-emerald-500 focus:outline-none font-mono"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* ---------------- Tab 4: Contacts & Address ---------------- */}
              {activeTab === 'contacts' && (
                <div className="space-y-4">
                  <h4 className="font-bold text-slate-800 text-xs border-b pb-2 border-slate-200 flex items-center gap-2">
                    <Phone className="w-4 h-4 text-emerald-600" />
                    راه‌های ارتباطی و نشانی محل سکونت
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div>
                      <label className="block text-slate-600 font-semibold mb-1">شماره تلفن همراه *</label>
                      <input
                        type="text"
                        required
                        placeholder="09123456789"
                        value={formData.contacts.mobile}
                        onChange={e => setFormData({
                          ...formData,
                          contacts: { ...formData.contacts, mobile: e.target.value }
                        })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-emerald-500 focus:outline-none font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-600 font-semibold mb-1">تلفن ثابت منزل</label>
                      <input
                        type="text"
                        placeholder="021-..."
                        value={formData.contacts.landline}
                        onChange={e => setFormData({
                          ...formData,
                          contacts: { ...formData.contacts, landline: e.target.value }
                        })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-emerald-500 focus:outline-none font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-600 font-semibold mb-1">ایمیل سازمانی / کاری</label>
                      <input
                        type="email"
                        placeholder="name@company.ir"
                        value={formData.contacts.workEmail}
                        onChange={e => setFormData({
                          ...formData,
                          contacts: { ...formData.contacts, workEmail: e.target.value }
                        })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-emerald-500 focus:outline-none font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-600 font-semibold mb-1">ایمیل شخصی</label>
                      <input
                        type="email"
                        placeholder="user@gmail.com"
                        value={formData.contacts.personalEmail}
                        onChange={e => setFormData({
                          ...formData,
                          contacts: { ...formData.contacts, personalEmail: e.target.value }
                        })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-emerald-500 focus:outline-none font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-600 font-semibold mb-1">استان محل سکونت</label>
                      <input
                        type="text"
                        value={formData.address.province}
                        onChange={e => setFormData({
                          ...formData,
                          address: { ...formData.address, province: e.target.value }
                        })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-emerald-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-600 font-semibold mb-1">شهر محل سکونت</label>
                      <input
                        type="text"
                        value={formData.address.city}
                        onChange={e => setFormData({
                          ...formData,
                          address: { ...formData.address, city: e.target.value }
                        })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-emerald-500 focus:outline-none"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-slate-600 font-semibold mb-1">نشانی پستی دقیق</label>
                      <textarea
                        rows={2}
                        value={formData.address.fullAddress}
                        onChange={e => setFormData({
                          ...formData,
                          address: { ...formData.address, fullAddress: e.target.value }
                        })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-emerald-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-600 font-semibold mb-1">کد پستی (۱۰ رقمی)</label>
                      <input
                        type="text"
                        maxLength={10}
                        value={formData.address.postalCode}
                        onChange={e => setFormData({
                          ...formData,
                          address: { ...formData.address, postalCode: e.target.value }
                        })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-emerald-500 focus:outline-none font-mono"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* ---------------- Tab 5: Salary & Bank ---------------- */}
              {activeTab === 'salary' && (
                <div className="space-y-4">
                  <h4 className="font-bold text-slate-800 text-xs border-b pb-2 border-slate-200 flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-emerald-600" />
                    حقوق، دستمزد، مزایا و حساب بانکی
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div>
                      <label className="block text-slate-600 font-semibold mb-1">حقوق پایه (ریال)</label>
                      <input
                        type="number"
                        step={100000}
                        value={formData.salary.baseSalary}
                        onChange={e => setFormData({
                          ...formData,
                          salary: { ...formData.salary, baseSalary: Number(e.target.value) }
                        })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-emerald-500 focus:outline-none font-mono"
                      />
                      <span className="text-[10px] text-slate-400 mt-1 block">
                        {formatRial(formData.salary.baseSalary || 0)}
                      </span>
                    </div>

                    <div>
                      <label className="block text-slate-600 font-semibold mb-1">خالص دریافتی ماهانه (ریال)</label>
                      <input
                        type="number"
                        step={100000}
                        value={formData.salary.netSalary}
                        onChange={e => setFormData({
                          ...formData,
                          salary: { ...formData.salary, netSalary: Number(e.target.value) }
                        })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-emerald-500 focus:outline-none font-mono"
                      />
                      <span className="text-[10px] text-slate-400 mt-1 block">
                        {formatRial(formData.salary.netSalary || 0)}
                      </span>
                    </div>

                    <div>
                      <label className="block text-slate-600 font-semibold mb-1">نام بانک</label>
                      <select
                        value={formData.banking.bankName}
                        onChange={e => setFormData({
                          ...formData,
                          banking: { ...formData.banking, bankName: e.target.value }
                        })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-emerald-500 focus:outline-none bg-white"
                      >
                        <option value="بانک ملت">بانک ملت</option>
                        <option value="بانک ملی ایران">بانک ملی ایران</option>
                        <option value="بانک صادرات ایران">بانک صادرات ایران</option>
                        <option value="بانک تجارت">بانک تجارت</option>
                        <option value="بانک پاسارگاد">بانک پاسارگاد</option>
                        <option value="بانک سامان">بانک سامان</option>
                        <option value="بانک رسالت">بانک قرض‌الحسنه رسالت</option>
                        <option value="بانک مهر ایران">بانک قرض‌الحسنه مهر ایران</option>
                        <option value="بانک سپه">بانک سپه</option>
                        <option value="سایر">سایر</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-600 font-semibold mb-1">شماره شبا (IBAN)</label>
                      <input
                        type="text"
                        placeholder="IR000000000000000000000000"
                        value={formData.banking.iban}
                        onChange={e => setFormData({
                          ...formData,
                          banking: { ...formData.banking, iban: e.target.value }
                        })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-emerald-500 focus:outline-none font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-600 font-semibold mb-1">شماره حساب بانکی</label>
                      <input
                        type="text"
                        value={formData.banking.accountNumber}
                        onChange={e => setFormData({
                          ...formData,
                          banking: { ...formData.banking, accountNumber: e.target.value }
                        })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-emerald-500 focus:outline-none font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-600 font-semibold mb-1">شماره کارت بانکی (۱۶ رقم)</label>
                      <input
                        type="text"
                        maxLength={19}
                        placeholder="6037-..."
                        value={formData.banking.cardNumber}
                        onChange={e => setFormData({
                          ...formData,
                          banking: { ...formData.banking, cardNumber: e.target.value }
                        })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-emerald-500 focus:outline-none font-mono"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* ---------------- Tab: Guarantee Promissory Note (سفته ضمانت) ---------------- */}
              {activeTab === 'guarantee' && (
                <div className="space-y-4">
                  <h4 className="font-bold text-slate-800 text-xs border-b pb-2 border-slate-200 flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Coins className="w-4 h-4 text-amber-600" />
                      مشخصات سفته ضمانت حسن انجام کار و اسناد تعهدات
                    </span>
                    <span className="text-[11px] text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200 font-medium">
                      پرونده تضامین مالی پرسنلی
                    </span>
                  </h4>

                  <div className="p-4 bg-amber-50/60 border border-amber-200 rounded-2xl">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                      <div>
                        <label className="block text-slate-700 font-bold mb-1">
                          مبلغ سفته ضمانت (ریال) <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="number"
                          step={10000000}
                          value={formData.guarantee.guaranteeNoteAmount}
                          onChange={e => setFormData({
                            ...formData,
                            guarantee: { ...formData.guarantee, guaranteeNoteAmount: Number(e.target.value) }
                          })}
                          className="w-full px-3 py-2 rounded-xl border border-amber-300 bg-white focus:border-amber-500 focus:outline-none font-mono font-bold text-slate-900"
                        />
                        <div className="flex items-center justify-between mt-1 text-[11px]">
                          <span className="text-amber-800 font-bold font-mono">
                            معادل {formatToman(formData.guarantee.guaranteeNoteAmount || 0)} تومان
                          </span>
                          <span className="text-slate-400 font-mono">
                            {formatRial(formData.guarantee.guaranteeNoteAmount || 0)} ریال
                          </span>
                        </div>
                      </div>

                      <div>
                        <label className="block text-slate-700 font-bold mb-1">وضعیت فیزیکی و تحویل سفته</label>
                        <select
                          value={formData.guarantee.guaranteeNoteStatus}
                          onChange={e => setFormData({
                            ...formData,
                            guarantee: { ...formData.guarantee, guaranteeNoteStatus: e.target.value }
                          })}
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white focus:border-emerald-500 focus:outline-none font-medium"
                        >
                          <option value="received">تحویل شده و موجود در صندوق امانات شرکت</option>
                          <option value="pending">در انتظار تحویل لاشه سفته از سوی پرسنل</option>
                          <option value="returned">عودت داده شده به پرسنل پس از تسویه نهایی</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-slate-600 font-semibold mb-1">شماره لاشه / سریال سفته</label>
                        <input
                          type="text"
                          placeholder="SAF-1403..."
                          value={formData.guarantee.guaranteeNoteNumber}
                          onChange={e => setFormData({
                            ...formData,
                            guarantee: { ...formData.guarantee, guaranteeNoteNumber: e.target.value }
                          })}
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white focus:border-emerald-500 focus:outline-none font-mono"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-600 font-semibold mb-1">نام و مشخصات ضامن</label>
                        <input
                          type="text"
                          placeholder="نام ضامن، شماره تماس یا کد ملی..."
                          value={formData.guarantee.guaranteeNoteGuarantorName}
                          onChange={e => setFormData({
                            ...formData,
                            guarantee: { ...formData.guarantee, guaranteeNoteGuarantorName: e.target.value }
                          })}
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white focus:border-emerald-500 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-600 font-semibold mb-1">تاریخ تحویل به کارگزینی (شمسی)</label>
                        <input
                          type="text"
                          placeholder="1403/01/15"
                          value={formData.guarantee.guaranteeNoteReceivedDateJalali}
                          onChange={e => setFormData({
                            ...formData,
                            guarantee: { ...formData.guarantee, guaranteeNoteReceivedDateJalali: e.target.value }
                          })}
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white focus:border-emerald-500 focus:outline-none font-mono"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-600 font-semibold mb-1">تاریخ سررسید / اعتبار سفته</label>
                        <input
                          type="text"
                          placeholder="پایان قرارداد / تسویه حساب"
                          value={formData.guarantee.guaranteeNoteDueDateJalali}
                          onChange={e => setFormData({
                            ...formData,
                            guarantee: { ...formData.guarantee, guaranteeNoteDueDateJalali: e.target.value }
                          })}
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white focus:border-emerald-500 focus:outline-none font-mono"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-slate-600 font-semibold mb-1">محل فیزیکی نگهداری در بایگانی و توضیحات</label>
                        <textarea
                          rows={2}
                          placeholder="شماره زونکن، گاوصندوق، یا ملاحظات مربوط به سفته..."
                          value={formData.guarantee.guaranteeNoteDescription}
                          onChange={e => setFormData({
                            ...formData,
                            guarantee: { ...formData.guarantee, guaranteeNoteDescription: e.target.value }
                          })}
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white focus:border-emerald-500 focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ---------------- Tab 6: Insurance ---------------- */}
              {activeTab === 'insurance' && (
                <div className="space-y-4">
                  <h4 className="font-bold text-slate-800 text-xs border-b pb-2 border-slate-200 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    بیمه تأمین اجتماعی و بیمه تکمیلی درمان
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div>
                      <label className="block text-slate-600 font-semibold mb-1">شماره بیمه تأمین اجتماعی</label>
                      <input
                        type="text"
                        value={formData.insurance.insuranceNumber}
                        onChange={e => setFormData({
                          ...formData,
                          insurance: { ...formData.insurance, insuranceNumber: e.target.value }
                        })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-emerald-500 focus:outline-none font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-600 font-semibold mb-1">پوشش بیمه تکمیلی</label>
                      <select
                        value={formData.insurance.hasSupplementaryInsurance ? 'yes' : 'no'}
                        onChange={e => setFormData({
                          ...formData,
                          insurance: { ...formData.insurance, hasSupplementaryInsurance: e.target.value === 'yes' }
                        })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-emerald-500 focus:outline-none bg-white font-bold"
                      >
                        <option value="no">فاقد بیمه تکمیلی</option>
                        <option value="yes">تحت پوشش بیمه تکمیلی</option>
                      </select>
                    </div>

                    {formData.insurance.hasSupplementaryInsurance && (
                      <>
                        <div>
                          <label className="block text-slate-600 font-semibold mb-1">شرکت بیمه‌گر تکمیلی</label>
                          <select
                            value={formData.insurance.supplementaryInsuranceCompany}
                            onChange={e => setFormData({
                              ...formData,
                              insurance: { ...formData.insurance, supplementaryInsuranceCompany: e.target.value }
                            })}
                            className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-emerald-500 focus:outline-none bg-white"
                          >
                            <option value="بیمه ایران">بیمه ایران</option>
                            <option value="بیمه دانا">بیمه دانا</option>
                            <option value="بیمه آسیا">بیمه آسیا</option>
                            <option value="بیمه البرز">بیمه البرز</option>
                            <option value="بیمه سامان">بیمه سامان</option>
                            <option value="بیمه پاسارگاد">بیمه پاسارگاد</option>
                            <option value="بیمه پارسیان">بیمه پارسیان</option>
                            <option value="بیمه کارآفرین">بیمه کارآفرین</option>
                            <option value="بیمه معلم">بیمه معلم</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-slate-600 font-semibold mb-1">روش پرداخت حق بیمه تکمیلی</label>
                          <select
                            value={formData.insurance.supplementaryInsurancePaymentMethod}
                            onChange={e => setFormData({
                              ...formData,
                              insurance: { ...formData.insurance, supplementaryInsurancePaymentMethod: e.target.value as SupplementaryInsurancePaymentMethod }
                            })}
                            className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-emerald-500 focus:outline-none bg-white font-medium"
                          >
                            <option value="کسر از حقوق">کسر از حقوق</option>
                            <option value="پرداخت توسط خود فرد">پرداخت توسط خود فرد (نقدی)</option>
                            <option value="پرداخت توسط شرکت">پرداخت ۱۰۰٪ توسط شرکت (کارفرما)</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-slate-600 font-semibold mb-1">مبلغ حق بیمه ماهانه (ریال)</label>
                          <input
                            type="number"
                            step={50000}
                            value={formData.insurance.supplementaryInsurancePremium}
                            onChange={e => setFormData({
                              ...formData,
                              insurance: { ...formData.insurance, supplementaryInsurancePremium: Number(e.target.value) }
                            })}
                            className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-emerald-500 focus:outline-none font-mono"
                          />
                          <span className="text-[10px] text-slate-400 mt-1 block">
                            {formatRial(formData.insurance.supplementaryInsurancePremium || 0)}
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* ---------------- Tab 7: Emergency & Notes ---------------- */}
              {activeTab === 'emergency' && (
                <div className="space-y-4">
                  <h4 className="font-bold text-slate-800 text-xs border-b pb-2 border-slate-200 flex items-center gap-2">
                    <Heart className="w-4 h-4 text-emerald-600" />
                    تماس اضطراری و یادداشت‌های منابع انسانی
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                    <div>
                      <label className="block text-slate-600 font-semibold mb-1">نام مخاطب اضطراری</label>
                      <input
                        type="text"
                        value={formData.emergencyContact.name}
                        onChange={e => setFormData({
                          ...formData,
                          emergencyContact: { ...formData.emergencyContact, name: e.target.value }
                        })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-emerald-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-600 font-semibold mb-1">نسبت با پرسنل</label>
                      <input
                        type="text"
                        placeholder="همسر / پدر / برادر..."
                        value={formData.emergencyContact.relationship}
                        onChange={e => setFormData({
                          ...formData,
                          emergencyContact: { ...formData.emergencyContact, relationship: e.target.value }
                        })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-emerald-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-600 font-semibold mb-1">شماره تماس اضطراری</label>
                      <input
                        type="text"
                        placeholder="09..."
                        value={formData.emergencyContact.phone}
                        onChange={e => setFormData({
                          ...formData,
                          emergencyContact: { ...formData.emergencyContact, phone: e.target.value }
                        })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-emerald-500 focus:outline-none font-mono"
                      />
                    </div>

                    <div className="sm:col-span-3">
                      <label className="block text-slate-600 font-semibold mb-1">یادداشت‌های محرمانه اداری و منابع انسانی</label>
                      <textarea
                        rows={3}
                        placeholder="توضیحات عملکردی، سوابق ارزیابی و نکات ویژه..."
                        value={formData.additionalInfo.hrConfidentialNotes}
                        onChange={e => setFormData({
                          ...formData,
                          additionalInfo: { ...formData.additionalInfo, hrConfidentialNotes: e.target.value }
                        })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-emerald-500 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Footer Actions */}
          <div className="bg-slate-50 -mx-6 -mb-6 p-4 border-t border-slate-200 flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              انصراف
            </button>

            <div className="flex items-center gap-2">
              <button
                type="submit"
                disabled={saving || loading}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-extrabold shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
              >
                {saving ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>در حال ذخیره‌سازی...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>ذخیره تغییرات پرونده</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
