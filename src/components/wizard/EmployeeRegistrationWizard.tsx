import React, { useState, useEffect, useRef } from 'react';
import { 
  User, Phone, MapPin, Users, Briefcase, Layers, GraduationCap, History, 
  Sparkles, ShieldCheck, CreditCard, DollarSign, FileText, PhoneCall, 
  FileBadge, CheckSquare, Save, ArrowRight, ArrowLeft, Check, AlertCircle, Clock
} from 'lucide-react';
import { FullRegistrationFormData } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { createEmployeeWithSubcollections, saveRegistrationDraft, getRegistrationDraft } from '../../services/employeeService';
import { toJalaliTime } from '../../utils/persianDate';

// Step Components
import { Step1Identity } from './steps/Step1Identity';
import { Step2Contact } from './steps/Step2Contact';
import { Step3Address } from './steps/Step3Address';
import { Step4Family } from './steps/Step4Family';
import { Step5Employment } from './steps/Step5Employment';
import { Step6Organization } from './steps/Step6Organization';
import { Step7Education } from './steps/Step7Education';
import { Step8WorkExperience } from './steps/Step8WorkExperience';
import { Step9SkillsLanguages } from './steps/Step9SkillsLanguages';
import { Step10Insurance } from './steps/Step10Insurance';
import { Step11Banking } from './steps/Step11Banking';
import { Step12Salary } from './steps/Step12Salary';
import { Step13Documents } from './steps/Step13Documents';
import { Step14EmergencyContact } from './steps/Step14EmergencyContact';
import { Step15AdditionalInfo } from './steps/Step15AdditionalInfo';
import { Step16FinalReview } from './steps/Step16FinalReview';

interface Props {
  draftId?: string;
  onComplete: (employeeId: string) => void;
  onCancel: () => void;
}

export const WIZARD_STEPS = [
  { step: 1, title: 'هویتی', fullTitle: 'اطلاعات هویتی و فردی', icon: User },
  { step: 2, title: 'تماس', fullTitle: 'اطلاعات تماس', icon: Phone },
  { step: 3, title: 'آدرس', fullTitle: 'آدرس و سکونت', icon: MapPin },
  { step: 4, title: 'خانواده', fullTitle: 'اعضای خانواده و تکفل', icon: Users },
  { step: 5, title: 'استخدام', fullTitle: 'اطلاعات استخدامی', icon: Briefcase },
  { step: 6, title: 'سازمان', fullTitle: 'جایگاه سازمانی و چارت', icon: Layers },
  { step: 7, title: 'تحصیلات', fullTitle: 'سوابق تحصیلی و دانشگاهی', icon: GraduationCap },
  { step: 8, title: 'سوابق شغلی', fullTitle: 'سوابق کاری قبلی', icon: History },
  { step: 9, title: 'مهارت و زبان', fullTitle: 'مهارت‌ها و زبان‌های خارجی', icon: Sparkles },
  { step: 10, title: 'بیمه', fullTitle: 'بیمه پایه و تکمیلی', icon: ShieldCheck },
  { step: 11, title: 'بانک', fullTitle: 'اطلاعات بانکی و شبا', icon: CreditCard },
  { step: 12, title: 'حقوق', fullTitle: 'حقوق و مزایا', icon: DollarSign },
  { step: 13, title: 'مدارک', fullTitle: 'اسناد و بایگانی مدارک', icon: FileText },
  { step: 14, title: 'اضطراری', fullTitle: 'مخاطبین شرایط اضطراری', icon: PhoneCall },
  { step: 15, title: 'تکمیلی', fullTitle: 'نظام وظیفه و یادداشت HR', icon: FileBadge },
  { step: 16, title: 'بازبینی', fullTitle: 'بررسی نهایی و ثبت', icon: CheckSquare },
];

const INITIAL_FORM_DATA: FullRegistrationFormData = {
  employeeCode: `EMP-${Math.floor(1000 + Math.random() * 9000)}`,
  firstName: '',
  lastName: '',
  nationalId: '',
  gender: 'مرد',
  maritalStatus: 'مجرد',
  birthDate: '1370-01-01',
  birthProvince: 'تهران',
  birthCity: 'تهران',
  fatherName: '',
  citizenship: 'ایرانی',
  contacts: {
    id: 'primary-contact',
    mobile: '',
    landline: '',
    personalEmail: '',
    workEmail: '',
    secondaryPhone: ''
  },
  addresses: [
    {
      id: 'addr-1',
      type: 'residential',
      title: 'نشانی منزل',
      province: 'تهران',
      city: 'تهران',
      district: 'منطقه ۶',
      fullAddress: '',
      postalCode: '',
      buildingNumber: '',
      unitNumber: ''
    }
  ],
  familyMembers: [],
  employment: {
    id: 'emp-curr',
    employeeCode: '',
    contractNumber: '',
    contractType: 'دائمی',
    employmentType: 'تمام وقت',
    hireDate: new Date().toISOString().split('T')[0],
    insuranceStartDate: new Date().toISOString().split('T')[0],
    employmentStatus: 'active',
    cooperationType: 'تمام وقت',
    hasProbation: true,
    probationDurationMonths: 3,
    hireReason: 'جذب نیروی جدید'
  },
  organization: {
    id: 'org-curr',
    companyId: 'comp-1',
    companyName: 'شرکت فناوری اطلاعات پیشرو',
    departmentId: 'dept-1',
    departmentName: 'فناوری اطلاعات و مهندسی نرم‌افزار',
    branchId: 'branch-1',
    branchName: 'دفتر مرکزی تهران (ونک)',
    workLocation: 'تهران - ونک',
    teamId: 'team-1',
    teamName: 'واحد توسعه نرم‌افزار',
    positionId: 'pos-1',
    positionTitle: 'مهندس ارشد فرانت‌اند',
    jobTitle: 'مهندس ارشد فرانت‌اند',
    jobLevel: 'ارشد (Senior)',
    directManagerName: 'دکتر مریم سلیمانی',
    costCenter: 'فناوری اطلاعات',
    costCenterCode: 'CC-IT-101',
    shiftType: 'عادی (۸ تا ۱۷)',
    workingHoursWeekly: 44
  },
  educationList: [],
  workExperienceList: [],
  skills: [],
  languages: [
    {
      id: 'lang-1',
      language: 'فارسی',
      speaking: 'مسلط/زبان مادری',
      reading: 'مسلط/زبان مادری',
      writing: 'مسلط/زبان مادری',
      listening: 'مسلط/زبان مادری'
    }
  ],
  insurance: {
    id: 'ins-curr',
    insuranceType: 'تأمین اجتماعی',
    insuranceNumber: '',
    insuranceBranch: 'شعبه ۲۲ تهران',
    startDate: new Date().toISOString().split('T')[0],
    previousExperienceMonths: 0,
    status: 'active',
    hasSupplementaryInsurance: true,
    supplementaryInsurancePlan: 'طرح طلایی درمان',
    supplementaryDependentsCount: 0
  },
  bankAccounts: [
    {
      id: 'bank-1',
      bankName: 'بانک ملت',
      branchName: 'شعبه مرکزی',
      accountNumber: '',
      cardNumber: '',
      iban: 'IR',
      accountHolderName: '',
      isPrimary: true
    }
  ],
  salary: {
    id: 'sal-1',
    baseSalary: 180000000,
    housingAllowance: 90000000,
    groceryAllowance: 140000000,
    childAllowance: 0,
    marriageAllowance: 0,
    fixedBonus: 40000000,
    performanceBonus: 0,
    grossSalary: 450000000,
    netSalary: 387500000,
    currency: 'IRR',
    effectiveDate: new Date().toISOString().split('T')[0],
    insuranceDeduction: 28700000,
    taxDeduction: 33800000
  },
  documents: [],
  emergencyContacts: [
    {
      id: 'emg-1',
      name: '',
      relationship: 'همسر',
      phone: '',
      mobile: '',
      address: '',
      priority: 1,
      isPrimary: true
    }
  ],
  additionalInfo: {
    militaryStatus: 'کارت پایان خدمت',
    militaryExemptionReason: '',
    militaryCardNumber: '',
    militaryCompletionDate: '',
    hasDrivingLicense: false,
    drivingLicenseType: 'پایه ۳',
    drivingLicenseExpiry: '',
    hrConfidentialNotes: '',
    specialTalents: '',
    hobbies: ''
  }
};

export const EmployeeRegistrationWizard: React.FC<Props> = ({ draftId, onComplete, onCancel }) => {
  const { profile } = useAuth();
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [formData, setFormData] = useState<FullRegistrationFormData>(INITIAL_FORM_DATA);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDraftSaving, setIsDraftSaving] = useState(false);
  const [lastSavedTime, setLastSavedTime] = useState<string>('');
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string>('');

  const currentDraftKey = useRef<string>(draftId || `draft-${Date.now()}`);

  // Load existing draft if provided
  useEffect(() => {
    async function loadDraft() {
      if (draftId) {
        const draft = await getRegistrationDraft(draftId);
        if (draft && draft.formData) {
          setFormData(draft.formData);
          setCurrentStep(draft.currentStep || 1);
        }
      }
    }
    loadDraft();
  }, [draftId]);

  // Periodic autosave every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      handleAutoSave();
    }, 30000);

    return () => clearInterval(interval);
  }, [formData, currentStep]);

  const updateFormData = (patch: Partial<FullRegistrationFormData>) => {
    setFormData(prev => ({
      ...prev,
      ...patch
    }));
  };

  const handleAutoSave = async () => {
    setIsDraftSaving(true);
    try {
      await saveRegistrationDraft(
        currentDraftKey.current,
        formData,
        currentStep,
        profile?.uid || 'admin',
        profile?.displayName || 'مدیر منابع انسانی'
      );
      setLastSavedTime(toJalaliTime(new Date().toISOString()));
    } catch (e) {
      console.warn('Autosave notice:', e);
    } finally {
      setIsDraftSaving(false);
    }
  };

  const handleManualSaveDraft = async () => {
    await handleAutoSave();
    setSaveSuccessMsg('پیش‌نویس پرونده با موفقیت ذخیره گردید.');
    setTimeout(() => setSaveSuccessMsg(''), 3500);
  };

  const validateCurrentStep = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (currentStep === 1) {
      if (!formData.firstName) newErrors.firstName = 'نام الزامی است.';
      if (!formData.lastName) newErrors.lastName = 'نام خانوادگی الزامی است.';
      if (!formData.nationalId) newErrors.nationalId = 'شماره ملی الزامی است.';
      if (!formData.employeeCode) newErrors.employeeCode = 'کد پرسنلی الزامی است.';
    } else if (currentStep === 2) {
      if (!formData.contacts?.mobile) newErrors.mobile = 'شماره موبایل الزامی است.';
    } else if (currentStep === 11) {
      if (!formData.bankAccounts?.[0]?.iban || formData.bankAccounts[0].iban.length < 26) {
        newErrors.iban = 'شماره شبا معتبر ۲۶ کاراکتری الزامی است.';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (!validateCurrentStep()) return;
    if (currentStep < 16) {
      setCurrentStep(prev => prev + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleSubmitFinal = async () => {
    if (!isConfirmed) {
      alert('لطفاً پیش از ثبت نهایی، تیک تأییدیه صحت و اصالت اطلاعات را فعال فرمایید.');
      return;
    }

    setIsSubmitting(true);
    try {
      const newEmpId = await createEmployeeWithSubcollections(
        formData,
        profile?.uid || 'admin',
        profile?.displayName || 'مدیر سیستم'
      );
      onComplete(newEmpId);
    } catch (err: any) {
      console.error('Final registration error:', err);
      alert(`خطا در ثبت نهایی پرسنل: ${err?.message || 'لطفاً مجدداً تلاش نمایید'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return <Step1Identity formData={formData} updateFormData={updateFormData} errors={errors} setErrors={setErrors} />;
      case 2:
        return <Step2Contact formData={formData} updateFormData={updateFormData} errors={errors} setErrors={setErrors} />;
      case 3:
        return <Step3Address formData={formData} updateFormData={updateFormData} errors={errors} setErrors={setErrors} />;
      case 4:
        return <Step4Family formData={formData} updateFormData={updateFormData} errors={errors} setErrors={setErrors} />;
      case 5:
        return <Step5Employment formData={formData} updateFormData={updateFormData} errors={errors} setErrors={setErrors} />;
      case 6:
        return <Step6Organization formData={formData} updateFormData={updateFormData} errors={errors} setErrors={setErrors} />;
      case 7:
        return <Step7Education formData={formData} updateFormData={updateFormData} errors={errors} setErrors={setErrors} />;
      case 8:
        return <Step8WorkExperience formData={formData} updateFormData={updateFormData} errors={errors} setErrors={setErrors} />;
      case 9:
        return <Step9SkillsLanguages formData={formData} updateFormData={updateFormData} errors={errors} setErrors={setErrors} />;
      case 10:
        return <Step10Insurance formData={formData} updateFormData={updateFormData} errors={errors} setErrors={setErrors} />;
      case 11:
        return <Step11Banking formData={formData} updateFormData={updateFormData} errors={errors} setErrors={setErrors} />;
      case 12:
        return <Step12Salary formData={formData} updateFormData={updateFormData} errors={errors} setErrors={setErrors} />;
      case 13:
        return <Step13Documents formData={formData} updateFormData={updateFormData} errors={errors} setErrors={setErrors} />;
      case 14:
        return <Step14EmergencyContact formData={formData} updateFormData={updateFormData} errors={errors} setErrors={setErrors} />;
      case 15:
        return <Step15AdditionalInfo formData={formData} updateFormData={updateFormData} errors={errors} setErrors={setErrors} />;
      case 16:
        return (
          <Step16FinalReview
            formData={formData}
            onJumpToStep={(step) => setCurrentStep(step)}
            isConfirmed={isConfirmed}
            setIsConfirmed={setIsConfirmed}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-16">
      {/* Wizard Header Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 border border-emerald-200 text-emerald-800 flex items-center justify-center font-bold text-lg">
            {currentStep}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 font-bold rounded-full text-xs">
                مرحله {currentStep} از ۱۶
              </span>
              <span className="text-xs text-slate-400">
                {Math.round((currentStep / 16) * 100)}٪ تکمیل شده
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-800 mt-1">
              ثبت پرسنل جدید ({WIZARD_STEPS[currentStep - 1]?.fullTitle})
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              ثبت مشخصات و احکام در سامانه جامع منابع انسانی
            </p>
          </div>
        </div>

        {/* Autosave and Actions */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
          <div className="text-left text-xs">
            {isDraftSaving ? (
              <span className="text-emerald-600 flex items-center gap-1 font-medium bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200">
                <Clock className="w-3.5 h-3.5 animate-spin" />
                در حال ذخیره خودکار...
              </span>
            ) : lastSavedTime ? (
              <span className="text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200 text-xs font-medium flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                پیش‌نویس خودکار: {lastSavedTime}
              </span>
            ) : null}
          </div>

          <button
            type="button"
            onClick={handleManualSaveDraft}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-white border border-emerald-200 hover:bg-emerald-50 text-emerald-700 rounded-xl text-xs font-bold transition-colors shadow-xs"
          >
            <Save className="w-3.5 h-3.5" />
            ذخیره پیش‌نویس
          </button>
        </div>
      </div>

      {saveSuccessMsg && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2 animate-fadeIn shadow-xs">
          <Check className="w-4 h-4 text-emerald-600" />
          {saveSuccessMsg}
        </div>
      )}

      {/* Stepper Bar matching Professional Polish design */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs overflow-x-auto no-scrollbar">
        <div className="flex items-center min-w-[900px] gap-2 px-2">
          {WIZARD_STEPS.map((s, idx) => {
            const isCompleted = s.step < currentStep;
            const isCurrent = s.step === currentStep;

            return (
              <React.Fragment key={s.step}>
                <button
                  type="button"
                  onClick={() => setCurrentStep(s.step)}
                  className={`flex flex-col items-center gap-1.5 group cursor-pointer transition-all ${
                    isCurrent ? 'opacity-100 scale-105' : isCompleted ? 'opacity-90 hover:opacity-100' : 'opacity-40 hover:opacity-70'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all shadow-xs ${
                    isCurrent
                      ? 'bg-emerald-600 text-white ring-4 ring-emerald-100 shadow-emerald-600/30'
                      : isCompleted
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-200 text-slate-600'
                  }`}>
                    {isCompleted ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : s.step}
                  </div>
                  <span className={`text-[10px] font-bold whitespace-nowrap ${
                    isCurrent ? 'text-emerald-700' : isCompleted ? 'text-slate-700' : 'text-slate-400'
                  }`}>
                    {s.title}
                  </span>
                </button>

                {idx < WIZARD_STEPS.length - 1 && (
                  <div className={`h-0.5 flex-1 min-w-[20px] rounded-full transition-all ${
                    isCompleted ? 'bg-emerald-500' : 'bg-slate-200'
                  }`} />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Main Step Form Card Container with Theme Styling */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden flex flex-col min-h-[520px]">
        {/* Step Card Title Header */}
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white">
          <h3 className="font-bold text-slate-800 flex items-center gap-2.5 text-base sm:text-lg">
            <span className="w-2 h-6 bg-emerald-500 rounded-full inline-block"></span>
            گام {currentStep}: {WIZARD_STEPS[currentStep - 1]?.fullTitle}
          </h3>
          <span className="text-xs text-slate-400 hidden sm:inline">
            تمام موارد ستاره‌دار (*) الزامی هستند
          </span>
        </div>

        {/* Step Body Content */}
        <div className="flex-1 p-6 sm:p-8">
          {renderStepContent()}
        </div>

        {/* Form Card Action Footer */}
        <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2.5 text-sm font-bold text-slate-500 hover:bg-slate-200/70 rounded-xl transition-colors"
          >
            انصراف
          </button>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleManualSaveDraft}
              className="px-5 py-2.5 text-sm font-bold text-emerald-700 bg-white border border-emerald-200 rounded-xl hover:bg-emerald-50 transition-colors shadow-xs hidden sm:inline-flex items-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              ذخیره پیش‌نویس
            </button>

            {currentStep > 1 && (
              <button
                type="button"
                onClick={handlePrevious}
                className="px-5 py-2.5 text-sm font-bold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-100 transition-colors"
              >
                مرحله قبل
              </button>
            )}

            {currentStep < 16 ? (
              <button
                type="button"
                onClick={handleNext}
                className="px-8 py-2.5 text-sm font-bold text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 transition-colors shadow-md shadow-emerald-600/20 flex items-center gap-2"
              >
                <span>مرحله بعد</span>
                <span className="text-lg leading-none">←</span>
              </button>
            ) : (
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleSubmitFinal}
                className="px-10 py-2.5 text-sm font-extrabold text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-600/30 flex items-center gap-2 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Clock className="w-4 h-4 animate-spin" />
                    <span>در حال صدور احکام و ثبت نهایی...</span>
                  </>
                ) : (
                  <>
                    <CheckSquare className="w-4 h-4" />
                    <span>ثبت نهایی و صدور پرونده پرسنل</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
