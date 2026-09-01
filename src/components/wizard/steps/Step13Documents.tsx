import React, { useState } from 'react';
import { FileText, Upload, Trash2, Eye, Download, AlertTriangle, CheckCircle2, Clock } from 'lucide-react';
import { FullRegistrationFormData, EmployeeDocument, DocumentCategory } from '../../../types';
import { DOCUMENT_CATEGORIES } from '../../../services/masterDataService';
import { getDocumentExpiryStatus } from '../../../services/documentService';
import { formatFileSize } from '../../../utils/formatters';

interface Props {
  formData: Partial<FullRegistrationFormData>;
  updateFormData: (data: Partial<FullRegistrationFormData>) => void;
  errors: Record<string, string>;
  setErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>;
}

export const Step13Documents: React.FC<Props> = ({ formData, updateFormData }) => {
  const documents: EmployeeDocument[] = formData.documents || [];
  const [selectedCategory, setSelectedCategory] = useState<DocumentCategory>('شناسنامه و کارت ملی');
  const [docTitle, setDocTitle] = useState('');
  const [docNumber, setDocNumber] = useState('');
  const [issueDate, setIssueDate] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [isDragging, setIsDragging] = useState(false);

  const handleFileUpload = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];

    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = reader.result as string;
      const newDoc: EmployeeDocument = {
        id: `doc-${Date.now()}`,
        title: docTitle || file.name,
        category: selectedCategory,
        documentNumber: docNumber || undefined,
        issueDate: issueDate || undefined,
        expiryDate: expiryDate || undefined,
        fileUrl: dataUrl,
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
        uploadedBy: 'admin',
        uploadedByName: 'مدیر سیستم',
        uploadedAt: new Date().toISOString()
      };

      updateFormData({ documents: [...documents, newDoc] });
      setDocTitle('');
      setDocNumber('');
      setIssueDate('');
      setExpiryDate('');
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveDoc = (id: string) => {
    updateFormData({ documents: documents.filter(d => d.id !== id) });
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      <div className="border-b border-slate-200 pb-4">
        <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <FileText className="w-6 h-6 text-emerald-600" />
          مرحله ۱۳: بایگانی اسناد و مدارک پرسنلی
        </h3>
        <p className="text-sm text-slate-500 mt-1">
          تصویر کارت ملی، صفحات شناسنامه، مدرک تحصیلی، قرارداد و سایر مدارک را با تاریخ اعتبار بارگذاری کنید.
        </p>
      </div>

      {/* Upload Zone */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 space-y-4">
        <h4 className="font-bold text-slate-800 text-sm">بارگذاری مدرک جدید</h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">دسته‌بندی سند</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value as DocumentCategory)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-800 bg-white"
            >
              {DOCUMENT_CATEGORIES.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">عنوان سند</label>
            <input
              type="text"
              placeholder="مثال: روی کارت ملی"
              value={docTitle}
              onChange={(e) => setDocTitle(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-800"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">شماره سند / مدرک</label>
            <input
              type="text"
              placeholder="اختیاری"
              value={docNumber}
              onChange={(e) => setDocNumber(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-800"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">تاریخ انقضا (در صورت وجود)</label>
            <input
              type="date"
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-800"
            />
          </div>
        </div>

        {/* Drag and Drop Area */}
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragging(false);
            handleFileUpload(e.dataTransfer.files);
          }}
          className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${
            isDragging ? 'border-emerald-500 bg-emerald-50' : 'border-slate-300 bg-white hover:border-emerald-400'
          }`}
        >
          <Upload className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
          <p className="text-sm font-semibold text-slate-700">
            فایل را به اینجا بکشید یا برای انتخاب کلیک کنید
          </p>
          <p className="text-xs text-slate-400 mt-1">
            فرمت‌های مجاز: PDF, JPG, PNG (حداکثر حجم ۱۰ مگابایت)
          </p>
          <label className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-xl text-xs font-semibold hover:bg-slate-900 cursor-pointer transition-colors shadow-xs">
            <span>انتخاب فایل از سیستم</span>
            <input
              type="file"
              onChange={(e) => handleFileUpload(e.target.files)}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* Uploaded Documents List */}
      <div className="space-y-4">
        <h4 className="font-bold text-slate-800 text-base">لیست مدارک بارگذاری شده ({documents.length})</h4>

        {documents.length === 0 ? (
          <p className="text-xs text-slate-400 italic">هنوز هیچ مدرکی پیوست نشده است.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {documents.map((doc) => {
              const expiryStatus = getDocumentExpiryStatus(doc.expiryDate);

              return (
                <div key={doc.id} className="border border-slate-200 rounded-2xl p-4 bg-white shadow-xs flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <h5 className="font-bold text-slate-800 text-sm truncate">{doc.title}</h5>
                      <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                        <span className="px-2 py-0.5 bg-slate-100 rounded-md text-[11px]">{doc.category}</span>
                        <span>{formatFileSize(doc.fileSize)}</span>
                      </div>
                      {expiryStatus.isExpiringSoon && (
                        <div className="flex items-center gap-1 text-[11px] text-amber-600 mt-1 font-medium">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          <span>انقضا تا {expiryStatus.daysRemaining} روز دیگر</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <a
                      href={doc.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="p-2 text-slate-600 hover:text-emerald-600 hover:bg-slate-100 rounded-lg transition-colors"
                      title="مشاهده"
                    >
                      <Eye className="w-4 h-4" />
                    </a>
                    <button
                      type="button"
                      onClick={() => handleRemoveDoc(doc.id)}
                      className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
                      title="حذف"
                    >
                      <Trash2 className="w-4 h-4" />
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
};
