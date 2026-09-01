import React, { useState } from 'react';
import { Sparkles, Globe, Plus, Trash2, Code2, BookOpen } from 'lucide-react';
import { FullRegistrationFormData, SkillRecord, LanguageRecord, SkillLevel, LanguageProficiency } from '../../../types';
import { POPULAR_SKILLS, POPULAR_LANGUAGES } from '../../../services/masterDataService';

interface Props {
  formData: Partial<FullRegistrationFormData>;
  updateFormData: (data: Partial<FullRegistrationFormData>) => void;
  errors: Record<string, string>;
  setErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>;
}

export const Step9SkillsLanguages: React.FC<Props> = ({ formData, updateFormData }) => {
  const skills: SkillRecord[] = formData.skills || [];
  const languages: LanguageRecord[] = formData.languages || [
    {
      id: 'lang-1',
      language: 'فارسی',
      speaking: 'مسلط/زبان مادری',
      reading: 'مسلط/زبان مادری',
      writing: 'مسلط/زبان مادری',
      listening: 'مسلط/زبان مادری'
    }
  ];

  const handleAddSkill = (presetName?: string, presetCat?: string) => {
    const newSkill: SkillRecord = {
      id: `sk-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      name: presetName || '',
      category: (presetCat as any) || 'فنی',
      level: 'متوسط',
      experienceYears: 2
    };
    updateFormData({ skills: [...skills, newSkill] });
  };

  const handleUpdateSkill = (id: string, fields: Partial<SkillRecord>) => {
    const updated = skills.map(s => s.id === id ? { ...s, ...fields } : s);
    updateFormData({ skills: updated });
  };

  const handleRemoveSkill = (id: string) => {
    updateFormData({ skills: skills.filter(s => s.id !== id) });
  };

  const handleAddLanguage = () => {
    const newLang: LanguageRecord = {
      id: `lang-${Date.now()}`,
      language: 'انگلیسی',
      speaking: 'متوسط',
      reading: 'پیشرفته',
      writing: 'متوسط',
      listening: 'متوسط'
    };
    updateFormData({ languages: [...languages, newLang] });
  };

  const handleUpdateLanguage = (id: string, fields: Partial<LanguageRecord>) => {
    const updated = languages.map(l => l.id === id ? { ...l, ...fields } : l);
    updateFormData({ languages: updated });
  };

  const handleRemoveLanguage = (id: string) => {
    if (languages.length <= 1) return;
    updateFormData({ languages: languages.filter(l => l.id !== id) });
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      <div className="border-b border-slate-200 pb-4">
        <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-emerald-600" />
          مرحله ۹: مهارت‌های تخصصی، نرم‌افزارها و زبان‌های خارجی
        </h3>
        <p className="text-sm text-slate-500 mt-1">
          تسلط فنی، نرم‌افزاری و میزان مهارت در زبان‌های مختلف را مشخص فرمایید.
        </p>
      </div>

      {/* Skills Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="font-bold text-slate-800 flex items-center gap-2 text-base">
            <Code2 className="w-5 h-5 text-emerald-600" />
            مهارت‌های فنی، نرم‌افزاری و تخصصی
          </h4>
          <button
            type="button"
            onClick={() => handleAddSkill()}
            className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-600 text-white rounded-xl text-xs font-semibold hover:bg-emerald-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            افزودن مهارت دستی
          </button>
        </div>

        {/* Quick Add Suggestions */}
        <div className="flex flex-wrap gap-2 items-center text-xs text-slate-500">
          <span>مهارت‌های پیشنهادی:</span>
          {POPULAR_SKILLS.slice(0, 6).map((pop) => (
            <button
              key={pop.name}
              type="button"
              onClick={() => handleAddSkill(pop.name, pop.category)}
              className="px-2.5 py-1 bg-slate-100 hover:bg-emerald-100 hover:text-emerald-800 text-slate-700 rounded-lg transition-colors border border-slate-200"
            >
              + {pop.name}
            </button>
          ))}
        </div>

        {skills.length === 0 ? (
          <p className="text-xs text-slate-400 italic">هیچ مهارتی ثبت نشده است. از لیست پیشنهادی یا دکمه افزودن استفاده نمایید.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {skills.map((skill) => (
              <div key={skill.id} className="p-4 border border-slate-200 rounded-xl bg-white flex items-center gap-3">
                <input
                  type="text"
                  placeholder="نام مهارت"
                  value={skill.name}
                  onChange={(e) => handleUpdateSkill(skill.id, { name: e.target.value })}
                  className="flex-1 px-3 py-1.5 rounded-lg border border-slate-300 focus:border-emerald-500 text-xs text-slate-800 font-medium"
                />

                <select
                  value={skill.category}
                  onChange={(e) => handleUpdateSkill(skill.id, { category: e.target.value as any })}
                  className="px-2 py-1.5 rounded-lg border border-slate-300 text-xs text-slate-700 bg-white"
                >
                  <option value="فنی">فنی</option>
                  <option value="نرم‌افزاری">نرم‌افزاری</option>
                  <option value="مدیریتی">مدیریتی</option>
                  <option value="تخصصی">تخصصی</option>
                  <option value="عمومی">عمومی</option>
                </select>

                <select
                  value={skill.level}
                  onChange={(e) => handleUpdateSkill(skill.id, { level: e.target.value as SkillLevel })}
                  className="px-2 py-1.5 rounded-lg border border-slate-300 text-xs text-slate-700 bg-white"
                >
                  <option value="مبتدی">مبتدی</option>
                  <option value="متوسط">متوسط</option>
                  <option value="خوب">خوب</option>
                  <option value="پیشرفته">پیشرفته</option>
                  <option value="حرفه‌ای">حرفه‌ای</option>
                </select>

                <button
                  type="button"
                  onClick={() => handleRemoveSkill(skill.id)}
                  className="text-rose-500 hover:text-rose-700 p-1"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Languages Section */}
      <div className="space-y-4 pt-6 border-t border-slate-200">
        <div className="flex items-center justify-between">
          <h4 className="font-bold text-slate-800 flex items-center gap-2 text-base">
            <Globe className="w-5 h-5 text-indigo-600" />
            زبان‌های خارجی و سطح تسلط
          </h4>
          <button
            type="button"
            onClick={handleAddLanguage}
            className="inline-flex items-center gap-1 px-3 py-1.5 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-semibold hover:bg-indigo-100 transition-colors"
          >
            <Plus className="w-4 h-4" />
            افزودن زبان خارجی
          </button>
        </div>

        <div className="space-y-3">
          {languages.map((lang) => (
            <div key={lang.id} className="p-4 border border-slate-200 rounded-xl bg-white flex flex-col md:flex-row items-start md:items-center gap-4 justify-between">
              <div className="w-full md:w-48">
                <label className="block text-xs text-slate-500 mb-1">زبان</label>
                <select
                  value={lang.language}
                  onChange={(e) => handleUpdateLanguage(lang.id, { language: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-bold text-slate-800 bg-white"
                >
                  {POPULAR_LANGUAGES.map(pl => (
                    <option key={pl} value={pl}>{pl}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 flex-1 w-full">
                <div>
                  <span className="block text-[11px] text-slate-500">مکالمه:</span>
                  <select
                    value={lang.speaking}
                    onChange={(e) => handleUpdateLanguage(lang.id, { speaking: e.target.value as LanguageProficiency })}
                    className="w-full text-xs p-1.5 rounded-lg border border-slate-300 bg-white"
                  >
                    <option value="مبتدی">مبتدی</option>
                    <option value="متوسط">متوسط</option>
                    <option value="پیشرفته">پیشرفته</option>
                    <option value="مسلط/زبان مادری">مسلط/زبان مادری</option>
                  </select>
                </div>
                <div>
                  <span className="block text-[11px] text-slate-500">خواندن:</span>
                  <select
                    value={lang.reading}
                    onChange={(e) => handleUpdateLanguage(lang.id, { reading: e.target.value as LanguageProficiency })}
                    className="w-full text-xs p-1.5 rounded-lg border border-slate-300 bg-white"
                  >
                    <option value="مبتدی">مبتدی</option>
                    <option value="متوسط">متوسط</option>
                    <option value="پیشرفته">پیشرفته</option>
                    <option value="مسلط/زبان مادری">مسلط/زبان مادری</option>
                  </select>
                </div>
                <div>
                  <span className="block text-[11px] text-slate-500">نوشتن:</span>
                  <select
                    value={lang.writing}
                    onChange={(e) => handleUpdateLanguage(lang.id, { writing: e.target.value as LanguageProficiency })}
                    className="w-full text-xs p-1.5 rounded-lg border border-slate-300 bg-white"
                  >
                    <option value="مبتدی">مبتدی</option>
                    <option value="متوسط">متوسط</option>
                    <option value="پیشرفته">پیشرفته</option>
                    <option value="مسلط/زبان مادری">مسلط/زبان مادری</option>
                  </select>
                </div>
                <div>
                  <span className="block text-[11px] text-slate-500">شنیداری:</span>
                  <select
                    value={lang.listening}
                    onChange={(e) => handleUpdateLanguage(lang.id, { listening: e.target.value as LanguageProficiency })}
                    className="w-full text-xs p-1.5 rounded-lg border border-slate-300 bg-white"
                  >
                    <option value="مبتدی">مبتدی</option>
                    <option value="متوسط">متوسط</option>
                    <option value="پیشرفته">پیشرفته</option>
                    <option value="مسلط/زبان مادری">مسلط/زبان مادری</option>
                  </select>
                </div>
              </div>

              {languages.length > 1 && (
                <button
                  type="button"
                  onClick={() => handleRemoveLanguage(lang.id)}
                  className="text-rose-500 hover:text-rose-700 p-1 self-center"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
