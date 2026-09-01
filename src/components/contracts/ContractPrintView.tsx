import React, { useRef } from 'react';
import { 
  Printer, 
  ArrowRight, 
  CheckCircle2, 
  Building, 
  Calendar, 
  DollarSign, 
  FileText, 
  ShieldCheck, 
  Download, 
  Clock, 
  AlertCircle,
  Copy,
  Edit,
  BadgeCheck
} from 'lucide-react';
import { EmploymentContract } from '../../types';
import { formatRial, numberToPersianWords, toPersianDigits } from '../../utils/formatters';
import { updateContractStatus } from '../../services/contractService';

interface Props {
  contract: EmploymentContract;
  onBack: () => void;
  onEdit?: (contract: EmploymentContract) => void;
  onStatusUpdated?: () => void;
}

export const ContractPrintView: React.FC<Props> = ({ 
  contract, 
  onBack, 
  onEdit, 
  onStatusUpdated 
}) => {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    window.print();
  };

  const handleMarkAsSigned = async () => {
    await updateContractStatus(contract.id, 'signed');
    if (onStatusUpdated) onStatusUpdated();
  };

  return (
    <div className="space-y-6">
      {/* Non-printable Action Bar */}
      <div className="print:hidden bg-white border border-slate-200 rounded-3xl p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-700 hover:text-emerald-700 bg-slate-100 hover:bg-slate-200 px-4 py-2.5 rounded-2xl transition-colors cursor-pointer"
          >
            <ArrowRight className="w-4 h-4" />
            بازگشت
          </button>
          
          <div>
            <span className="text-xs text-slate-400 font-medium block">پیش‌نمایش و صدور سند قرارداد رسمی:</span>
            <span className="text-sm font-black text-slate-800">{contract.contractTitle} ({contract.periodLabel})</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto justify-end">
          {contract.status !== 'signed' && (
            <button
              type="button"
              onClick={handleMarkAsSigned}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100 rounded-xl text-xs font-bold transition-all cursor-pointer"
              title="ثبت تایید و امضای قرارداد توسط کارمند و کارفرما"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              ثبت به عنوان امضاشده
            </button>
          )}

          {onEdit && (
            <button
              type="button"
              onClick={() => onEdit(contract)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              <Edit className="w-4 h-4 text-slate-500" />
              ویرایش مفاد
            </button>
          )}

          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-md shadow-emerald-600/20 hover:scale-102 transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            چاپ رسمی قرارداد (Print / PDF)
          </button>
        </div>
      </div>

      {/* Contract Document Container (Standard A4 Simulation & Print View) */}
      <div 
        ref={printRef}
        id="printable-contract-document"
        className="bg-white border border-slate-300 print:border-none shadow-xl print:shadow-none rounded-2xl print:rounded-none max-w-4xl mx-auto p-8 sm:p-12 print:p-0 text-slate-900 leading-relaxed font-sans text-right"
        dir="rtl"
      >
        {/* Official Header */}
        <div className="border-b-2 border-slate-800 pb-4 mb-6">
          <div className="flex items-center justify-between">
            {/* Right: Emblems / Company Info */}
            <div className="w-1/3 text-right">
              <div className="text-[11px] text-slate-600 font-bold">جمهوری اسلامی ایران</div>
              <div className="text-[11px] text-slate-800 font-black mt-0.5">{contract.companyName}</div>
              <div className="text-[10px] text-slate-500 font-mono mt-0.5">شماره ثبت: {contract.companyRegistrationNumber || '۵۴۲۱۰۰'}</div>
              <div className="text-[10px] text-slate-500 font-mono">شناسه ملی: {contract.companyNationalId || '۱۴۰۰۸۹۲۳۱۴۵'}</div>
            </div>

            {/* Center: Title & Slogan */}
            <div className="w-1/3 text-center">
              <div className="text-xs font-bold text-slate-600 mb-1">«بسمه تعالی»</div>
              <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                {contract.contractTitle}
              </h1>
              <div className="inline-block mt-1 px-3 py-0.5 bg-slate-100 print:bg-transparent border border-slate-300 rounded-full text-[11px] font-bold text-slate-800">
                مدت دوره: {contract.periodLabel}
              </div>
            </div>

            {/* Left: Metadata */}
            <div className="w-1/3 text-left space-y-1 text-[11px] font-mono">
              <div>
                <span className="text-slate-500">شماره قرارداد: </span>
                <span className="font-bold text-slate-900">{contract.contractNumber}</span>
              </div>
              <div>
                <span className="text-slate-500">تاریخ تنظیم: </span>
                <span className="font-bold text-slate-900">{contract.issuedAtJalali}</span>
              </div>
              <div>
                <span className="text-slate-500">کد کارگاهی بیمه: </span>
                <span className="font-bold text-slate-900">{contract.companyWorkshopCode || '۰۱۸۹۴۵۲۰۱۱'}</span>
              </div>
              <div>
                <span className="text-slate-500">پیوست: </span>
                <span className="font-bold text-slate-900">دارد (شرح شغل و آیین‌نامه)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Intro */}
        <p className="text-xs text-justify leading-6 text-slate-800 mb-4">
          این قرارداد به موجب ماده ۱۰ قانون کار جمهوری اسلامی ایران و مصوبات شورای عالی کار و طبق شرایط و ضوابط زیر بین طرفین منعقد و طرفین ملزم به رعایت کلیه مفاد و تعهدات مندرج در آن می‌باشند:
        </p>

        {/* Article 1: Parties */}
        <div className="mb-5">
          <h2 className="text-xs font-black text-slate-900 bg-slate-100 print:bg-slate-200/60 p-1.5 px-3 rounded-lg border border-slate-200 mb-2">
            ماده ۱: مشخصات طرفین قرارداد
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            {/* First Party (Employer) */}
            <div className="border border-slate-200 p-3 rounded-xl bg-slate-50/50 print:bg-transparent space-y-1.5">
              <div className="font-bold text-slate-900 border-b border-slate-200 pb-1 flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5 text-emerald-700" />
                طرف اول (کارفرما / شرکت):
              </div>
              <div><span className="text-slate-500">نام کارگاه / شرکت:</span> <span className="font-bold">{contract.companyName}</span></div>
              <div><span className="text-slate-500">نماینده تام‌الاختیار:</span> <span className="font-semibold">{contract.employerRepresentativeName} ({contract.employerRepresentativePosition})</span></div>
              <div><span className="text-slate-500">شناسه ملی / ثبت:</span> <span className="font-mono">{contract.companyNationalId} / {contract.companyRegistrationNumber}</span></div>
              <div><span className="text-slate-500">کد اقتصادی:</span> <span className="font-mono">{contract.companyEconomicCode || '-'}</span></div>
              <div><span className="text-slate-500">نشانی قانونی:</span> <span>{contract.companyAddress || 'تهران'}</span></div>
              <div><span className="text-slate-500">تلفن تماس:</span> <span className="font-mono">{contract.companyPhone || '۰۲۱-۸۸۷۷۶۶۵۵'}</span></div>
            </div>

            {/* Second Party (Employee) */}
            <div className="border border-slate-200 p-3 rounded-xl bg-slate-50/50 print:bg-transparent space-y-1.5">
              <div className="font-bold text-slate-900 border-b border-slate-200 pb-1 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                طرف دوم (کارپذیر / کارمند):
              </div>
              <div><span className="text-slate-500">نام و نام‌خانوادگی:</span> <span className="font-bold">{contract.employeeName}</span> (فرزند: {contract.employeeFatherName || 'ـ'})</div>
              <div><span className="text-slate-500">کد ملی / ش.ش:</span> <span className="font-mono font-bold">{contract.employeeNationalId}</span> {contract.employeeIdNumber && `(ش.ش: ${contract.employeeIdNumber})`}</div>
              <div><span className="text-slate-500">تاریخ و محل تولد:</span> <span>{contract.employeeBirthDate || '-'} ({contract.employeeBirthPlace || 'تهران'})</span></div>
              <div><span className="text-slate-500">تحصیلات و رشته:</span> <span>{contract.employeeEducation} {contract.employeeMajor ? `در رشته ${contract.employeeMajor}` : ''}</span></div>
              <div><span className="text-slate-500">وضعیت تأهل و اولاد:</span> <span>{contract.employeeMaritalStatus} (تعداد اولاد: {toPersianDigits(contract.employeeChildrenCount || 0)})</span></div>
              <div><span className="text-slate-500">نشانی سکونت:</span> <span>{contract.employeeAddress}</span> {contract.employeePostalCode && <span className="font-mono">(کدپستی: {contract.employeePostalCode})</span>}</div>
              <div><span className="text-slate-500">شماره همراه / شبا:</span> <span className="font-mono">{contract.employeeMobile}</span> {contract.employeeIban && <span className="font-mono block text-[10px] text-slate-600">شبا: {contract.employeeIban} ({contract.employeeBankName})</span>}</div>
            </div>
          </div>
        </div>

        {/* Article 2: Subject & Duties */}
        <div className="mb-4 text-xs">
          <h2 className="font-black text-slate-900 bg-slate-100 print:bg-slate-200/60 p-1.5 px-3 rounded-lg border border-slate-200 mb-1.5">
            ماده ۲: موضوع قرارداد و عنوان شغلی
          </h2>
          <p className="text-justify leading-6 text-slate-800">
            اشتغال و انجام کلیه امور محوله در سمت <strong className="font-black text-slate-950">«{contract.positionTitle}»</strong> در دپارتمان <strong className="font-bold">{contract.departmentName}</strong> شرکت طرف اول با رعایت ضوابط، استانداردهای کیفی، فرآیندها و دستورالعمل‌های جاری سازمان. شرح وظایف شغلی کارپذیر طبق سند مصوب سازمانی منضم به این قرارداد بوده و کارپذیر موظف است کلیه وظایف محوله را با دقت، تعهد و حسن نیت کامل به انجام برساند.
          </p>
        </div>

        {/* Article 3: Duration & Trial Period */}
        <div className="mb-4 text-xs">
          <h2 className="font-black text-slate-900 bg-slate-100 print:bg-slate-200/60 p-1.5 px-3 rounded-lg border border-slate-200 mb-1.5">
            ماده ۳: مدت قرارداد و دوره آزمایشی
          </h2>
          <p className="text-justify leading-6 text-slate-800">
            مدت این قرارداد از تاریخ <strong className="font-mono font-bold text-slate-950">{contract.startDateJalali}</strong> لغایت <strong className="font-mono font-bold text-slate-950">{contract.endDateJalali}</strong> به مدت <strong className="font-bold">{contract.periodLabel}</strong> می‌باشد.
            {contract.probationDurationDays && contract.probationDurationDays > 0 ? (
              <span> به موجب ماده ۱۱ قانون کار، مدت <strong>{toPersianDigits(contract.probationDurationDays)} روز</strong> از ابتدای خدمت به عنوان دوره آزمایشی تعیین می‌گردد. در طول این دوره هر یک از طرفین حق خواهند داشت بدون اخطار قبلی و بی‌آنکه الزام به پرداخت خسارت داشته باشند رابطه کار را قطع نمایند، مشروط بر اینکه حقوق و مزایای دوره انجام کار دقیقاً پرداخت گردد.</span>
            ) : (
              <span> این قرارداد بدون دوره آزمایشی جدید تمدید گردیده است.</span>
            )}
          </p>
        </div>

        {/* Article 4: Hours & Location */}
        <div className="mb-4 text-xs">
          <h2 className="font-black text-slate-900 bg-slate-100 print:bg-slate-200/60 p-1.5 px-3 rounded-lg border border-slate-200 mb-1.5">
            ماده ۴: ساعات کار، شیفت و محل خدمت
          </h2>
          <p className="text-justify leading-6 text-slate-800">
            ساعات کار موظف کارپذیر مطابق ماده ۵۱ قانون کار معادل <strong>{toPersianDigits(contract.weeklyHours || 44)} ساعت در هفته</strong> طبق برنامه کاری اعلامی واحد منابع انسانی ({contract.shiftType}) می‌باشد. محل خدمت کارپذیر <strong className="font-bold">{contract.workLocation}</strong> تعیین گردیده است و در صورت نیاز سازمانی و با موافقت طرفین، تغییر موقت یا دائم محل خدمت امکان‌پذیر خواهد بود.
          </p>
        </div>

        {/* Article 5: Compensation and Benefits (Financial Table in RIALS) */}
        <div className="mb-5 text-xs">
          <h2 className="font-black text-slate-900 bg-slate-100 print:bg-slate-200/60 p-1.5 px-3 rounded-lg border border-slate-200 mb-2">
            ماده ۵: حق‌السعی، حقوق مبنا و مزایای قانونی (به ریال)
          </h2>
          <p className="text-justify leading-6 text-slate-800 mb-2">
            کارفرما متعهد است در ازای انجام کار موضوع این قرارداد، مبالغ مشروحه زیر را به صورت ماهیانه و پس از کسر کسورات قانونی (بیمه سهم کارگر و مالیات بر درآمد) به شماره حساب بانکی و شبای اعلام شده کارپذیر واریز نماید:
          </p>

          <div className="border border-slate-300 rounded-xl overflow-hidden mb-2">
            <table className="w-full text-right border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100 print:bg-slate-200/80 border-b border-slate-300 font-bold text-slate-800">
                  <th className="p-2.5 border-l border-slate-300 w-12 text-center">ردیف</th>
                  <th className="p-2.5 border-l border-slate-300">عنوان آیتم دریافتی و مزایا</th>
                  <th className="p-2.5 border-l border-slate-300 w-44 text-left">مبلغ ماهیانه (ریال)</th>
                  <th className="p-2.5">مبلغ به حروف</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                <tr>
                  <td className="p-2 text-center font-mono border-l border-slate-200">۱</td>
                  <td className="p-2 font-medium border-l border-slate-200">مزد پایه / حقوق مبنای ماهیانه (۳۰ روزه)</td>
                  <td className="p-2 font-mono font-bold text-left border-l border-slate-200">{formatRial(contract.monthlyBaseSalary)}</td>
                  <td className="p-2 text-slate-600 text-[11px]">{numberToPersianWords(contract.monthlyBaseSalary)} ریال</td>
                </tr>
                <tr>
                  <td className="p-2 text-center font-mono border-l border-slate-200">۲</td>
                  <td className="p-2 font-medium border-l border-slate-200">کمک هزینه مسکن (حق مسکن مصوب هیئت وزیران)</td>
                  <td className="p-2 font-mono font-bold text-left border-l border-slate-200">{formatRial(contract.housingAllowance)}</td>
                  <td className="p-2 text-slate-600 text-[11px]">{numberToPersianWords(contract.housingAllowance)} ریال</td>
                </tr>
                <tr>
                  <td className="p-2 text-center font-mono border-l border-slate-200">۳</td>
                  <td className="p-2 font-medium border-l border-slate-200">کمک هزینه اقلام مصرفی خانوار (بن خواربار)</td>
                  <td className="p-2 font-mono font-bold text-left border-l border-slate-200">{formatRial(contract.groceryAllowance)}</td>
                  <td className="p-2 text-slate-600 text-[11px]">{numberToPersianWords(contract.groceryAllowance)} ریال</td>
                </tr>
                {contract.childAllowance > 0 && (
                  <tr>
                    <td className="p-2 text-center font-mono border-l border-slate-200">۴</td>
                    <td className="p-2 font-medium border-l border-slate-200">حق اولاد / کمک هزینه عائله‌مندی (ماده ۸۶ تامین اجتماعی)</td>
                    <td className="p-2 font-mono font-bold text-left border-l border-slate-200">{formatRial(contract.childAllowance)}</td>
                    <td className="p-2 text-slate-600 text-[11px]">{numberToPersianWords(contract.childAllowance)} ریال</td>
                  </tr>
                )}
                {contract.maritalAllowance && contract.maritalAllowance > 0 ? (
                  <tr>
                    <td className="p-2 text-center font-mono border-l border-slate-200">۵</td>
                    <td className="p-2 font-medium border-l border-slate-200">حق تأهل قانونی</td>
                    <td className="p-2 font-mono font-bold text-left border-l border-slate-200">{formatRial(contract.maritalAllowance)}</td>
                    <td className="p-2 text-slate-600 text-[11px]">{numberToPersianWords(contract.maritalAllowance)} ریال</td>
                  </tr>
                ) : null}
                {contract.positionAllowance && contract.positionAllowance > 0 ? (
                  <tr>
                    <td className="p-2 text-center font-mono border-l border-slate-200">۶</td>
                    <td className="p-2 font-medium border-l border-slate-200">حق تخصص / فوق‌العاده شغل و سرپرستی</td>
                    <td className="p-2 font-mono font-bold text-left border-l border-slate-200">{formatRial(contract.positionAllowance)}</td>
                    <td className="p-2 text-slate-600 text-[11px]">{numberToPersianWords(contract.positionAllowance)} ریال</td>
                  </tr>
                ) : null}
                {contract.attractionAllowance && contract.attractionAllowance > 0 ? (
                  <tr>
                    <td className="p-2 text-center font-mono border-l border-slate-200">۷</td>
                    <td className="p-2 font-medium border-l border-slate-200">حق جذب و فوق‌العاده بازار کار</td>
                    <td className="p-2 font-mono font-bold text-left border-l border-slate-200">{formatRial(contract.attractionAllowance)}</td>
                    <td className="p-2 text-slate-600 text-[11px]">{numberToPersianWords(contract.attractionAllowance)} ریال</td>
                  </tr>
                ) : null}
                {contract.otherContinuousBenefits && contract.otherContinuousBenefits > 0 ? (
                  <tr>
                    <td className="p-2 text-center font-mono border-l border-slate-200">۸</td>
                    <td className="p-2 font-medium border-l border-slate-200">سایر مزایای مستمر / سختی کار و ایاب و ذهاب</td>
                    <td className="p-2 font-mono font-bold text-left border-l border-slate-200">{formatRial(contract.otherContinuousBenefits)}</td>
                    <td className="p-2 text-slate-600 text-[11px]">{numberToPersianWords(contract.otherContinuousBenefits)} ریال</td>
                  </tr>
                ) : null}
                <tr className="bg-slate-100/90 print:bg-slate-200/90 font-black text-slate-900 border-t-2 border-slate-300">
                  <td colSpan={2} className="p-2.5 text-right border-l border-slate-300">
                    جمع ناخالص پرداختی ماهیانه (حق‌السعی کل):
                  </td>
                  <td className="p-2.5 font-mono text-left border-l border-slate-300 text-emerald-800 print:text-slate-900 text-sm">
                    {formatRial(contract.grossSalaryMonthly)}
                  </td>
                  <td className="p-2.5 text-[11px] text-slate-800">
                    {numberToPersianWords(contract.grossSalaryMonthly)} ریال
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="text-[11px] text-slate-500 bg-slate-50 print:bg-transparent p-2 rounded-lg border border-slate-200">
            * تبصره: اضافه کار، مأموریت و سایر پرداختی‌های غیرمستمر در صورت انجام کار مازاد و تایید مدیر مستقیم بر اساس قانون کار محاسبه و به مبالغ فوق افزوده خواهد شد.
          </div>
        </div>

        {/* Article 6: Insurance */}
        <div className="mb-4 text-xs">
          <h2 className="font-black text-slate-900 bg-slate-100 print:bg-slate-200/60 p-1.5 px-3 rounded-lg border border-slate-200 mb-1.5">
            ماده ۶: بیمه تأمین اجتماعی و درمان
          </h2>
          <p className="text-justify leading-6 text-slate-800">
            به استناد ماده ۱۴۸ قانون کار، کارفرما مکلف است بر اساس لیست حقوق و دستمزد، کارپذیر را نزد سازمان تأمین اجتماعی بیمه نموده و حق بیمه متعلقه (شامل ۲۳٪ سهم کارفرما و ۷٪ سهم کارپذیر) را به حساب سازمان واریز نماید.
          </p>
        </div>

        {/* Article 7: Leaves and Holidays */}
        <div className="mb-4 text-xs">
          <h2 className="font-black text-slate-900 bg-slate-100 print:bg-slate-200/60 p-1.5 px-3 rounded-lg border border-slate-200 mb-1.5">
            ماده ۷: تعطیلات، مرخصی‌ها و غیبت
          </h2>
          <p className="text-justify leading-6 text-slate-800">
            مرخصی استحقاقی سالانه کارپذیر با استفاده از مزد و احتساب ۴ روز جمعه، جمعاً یک ماه (۲.۵ روز در ازای هر ماه کارکرد) مطابق ماده ۶۴ قانون کار خواهد بود. استفاده از مرخصی منوط به هماهنگی قبلی و تایید مدیر مستقیم می‌باشد. مرخصی استعلاجی با تایید پزشک معتمد و سازمان تامین اجتماعی قابل پذیرش خواهد بود.
          </p>
        </div>

        {/* Article 8: Employee Commitments & Confidentiality */}
        <div className="mb-4 text-xs">
          <h2 className="font-black text-slate-900 bg-slate-100 print:bg-slate-200/60 p-1.5 px-3 rounded-lg border border-slate-200 mb-1.5">
            ماده ۸: تعهدات کارپذیر، حفظ محرمانگی و مالکیت معنوی
          </h2>
          <div className="space-y-1 text-justify leading-6 text-slate-800">
            <p>۱. کارپذیر متعهد به رعایت کامل آیین‌نامه‌های انضباطی، ضوابط بهداشت و حفاظت فنی کارگاه و منشور اخلاقی سازمان می‌باشد.</p>
            <p>۲. کارپذیر متعهد می‌گردد کلیه اطلاعات فنی، تجاری، اسناد، سورس‌کدها، روش‌های عملیاتی و داده‌های مشتریان شرکت را کاملاً محرمانه تلقی کرده و از افشای آن به هر نحو خودداری نماید.</p>
            <p>۳. کلیه دستاوردها، نرم‌افزارها، اختراعات و پدیده‌های ایجاد شده در طول انجام وظایف موضوع این قرارداد، متعلق به کارفرما بوده و حقوق مادی آن منحصراً در اختیار شرکت قرار دارد.</p>
            {contract.customTerms && contract.customTerms.length > 0 && (
              <div className="mt-1 space-y-0.5">
                {contract.customTerms.map((term, idx) => (
                  <p key={idx} className="font-semibold text-slate-900">
                    {toPersianDigits(idx + 4)}. {term}
                  </p>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Article 9: Termination and Severance */}
        <div className="mb-4 text-xs">
          <h2 className="font-black text-slate-900 bg-slate-100 print:bg-slate-200/60 p-1.5 px-3 rounded-lg border border-slate-200 mb-1.5">
            ماده ۹: خاتمه قرارداد، تمدید و تسویه حساب (حق سنوات)
          </h2>
          <p className="text-justify leading-6 text-slate-800">
            این قرارداد با انقضای مدت آن خاتمه می‌یابد مگر اینکه طرفین کتباً نسبت به تمدید آن توافق نمایند. در پایان مدت قرارداد، کارفرما مکلف است به ازای هر سال کارکرد معادل یک ماه مزد به عنوان مزایای پایان کار (حق سنوات موضوع ماده ۲۴ قانون کار) به همراه مانده مرخصی‌های استفاده‌نشده محاسبه و به کارپذیر پرداخت نماید.
          </p>
        </div>

        {/* Article 10: Copies & Dispute Resolution */}
        <div className="mb-6 text-xs">
          <h2 className="font-black text-slate-900 bg-slate-100 print:bg-slate-200/60 p-1.5 px-3 rounded-lg border border-slate-200 mb-1.5">
            ماده ۱۰: نسخ قرارداد و حل اختلاف
          </h2>
          <p className="text-justify leading-6 text-slate-800">
            این قرارداد در <strong>{toPersianDigits(contract.copyCount || 3)} نسخه</strong> با متن و اعتبار واحد تنظیم گردید که یک نسخه نزد کارفرما، یک نسخه نزد کارپذیر و یک نسخه به اداره تعاون، کار و رفاه اجتماعی محل تسلیم می‌گردد. در صورت بروز هرگونه اختلاف، موضوع ابتدا از طریق سازش مستقیم و در صورت عدم توافق از طریق مراجع حل اختلاف اداره کار حل و فصل خواهد شد.
          </p>
        </div>

        {/* Signatures and Fingerprints Box */}
        <div className="border-2 border-slate-400 rounded-2xl p-4 bg-slate-50/40 print:bg-transparent page-break-inside-avoid">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center text-xs">
            {/* Employer Signature */}
            <div className="space-y-1 border border-slate-200 p-3 rounded-xl bg-white print:bg-transparent">
              <div className="font-bold text-slate-900">مهر و امضای کارفرما</div>
              <div className="text-[11px] text-slate-600 font-semibold">{contract.employerRepresentativeName}</div>
              <div className="text-[10px] text-slate-400">{contract.employerRepresentativePosition}</div>
              <div className="h-20 flex items-center justify-center text-slate-300 text-[10px] border-t border-dashed border-slate-200 mt-2">
                {contract.status === 'signed' ? (
                  <div className="text-emerald-700 font-bold border border-emerald-300 bg-emerald-50 px-2 py-1 rounded">
                    تایید و مهر گردید
                  </div>
                ) : (
                  'محل مهر و امضا'
                )}
              </div>
            </div>

            {/* Employee Signature & Fingerprint */}
            <div className="space-y-1 border border-slate-200 p-3 rounded-xl bg-white print:bg-transparent">
              <div className="font-bold text-slate-900">امضا و اثر انگشت کارپذیر</div>
              <div className="text-[11px] text-slate-600 font-semibold">{contract.employeeName}</div>
              <div className="text-[10px] text-slate-400">کد ملی: {contract.employeeNationalId}</div>
              <div className="h-20 flex items-center justify-center text-slate-300 text-[10px] border-t border-dashed border-slate-200 mt-2">
                {contract.status === 'signed' ? (
                  <div className="text-emerald-700 font-bold border border-emerald-300 bg-emerald-50 px-2 py-1 rounded">
                    امضا و ثبت اثر انگشت
                  </div>
                ) : (
                  'محل امضا و اثر انگشت'
                )}
              </div>
            </div>

            {/* Witness 1 */}
            <div className="space-y-1 border border-slate-200 p-3 rounded-xl bg-white print:bg-transparent">
              <div className="font-bold text-slate-900">شاهد اول</div>
              <div className="text-[11px] text-slate-500">نام و نام خانوادگی:</div>
              <div className="text-[10px] text-slate-400">کد ملی:</div>
              <div className="h-20 flex items-center justify-center text-slate-300 text-[10px] border-t border-dashed border-slate-200 mt-2">
                محل امضای شاهد اول
              </div>
            </div>

            {/* Witness 2 */}
            <div className="space-y-1 border border-slate-200 p-3 rounded-xl bg-white print:bg-transparent">
              <div className="font-bold text-slate-900">شاهد دوم</div>
              <div className="text-[11px] text-slate-500">نام و نام خانوادگی:</div>
              <div className="text-[10px] text-slate-400">کد ملی:</div>
              <div className="h-20 flex items-center justify-center text-slate-300 text-[10px] border-t border-dashed border-slate-200 mt-2">
                محل امضای شاهد دوم
              </div>
            </div>
          </div>
        </div>

        {/* Footer tracking stamp */}
        <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-400 font-mono">
          <div>سامانه جامع مدیریت منابع انسانی و قراردادهای کارگاهی • کد رهگیری سند: {contract.contractNumber}</div>
          <div>تاریخ چاپ: {contract.issuedAtJalali} • صفحه ۱ از ۱</div>
        </div>
      </div>
    </div>
  );
};
