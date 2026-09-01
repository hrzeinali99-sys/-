import React from 'react';
import { PhoneCall, Plus, Trash2, ShieldAlert } from 'lucide-react';
import { FullRegistrationFormData, EmergencyContact } from '../../../types';

interface Props {
  formData: Partial<FullRegistrationFormData>;
  updateFormData: (data: Partial<FullRegistrationFormData>) => void;
  errors: Record<string, string>;
  setErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>;
}

export const Step14EmergencyContact: React.FC<Props> = ({ formData, updateFormData }) => {
  const emergencyContacts: EmergencyContact[] = formData.emergencyContacts && formData.emergencyContacts.length > 0
    ? formData.emergencyContacts
    : [
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
      ];

  const handleAddContact = () => {
    const newContact: EmergencyContact = {
      id: `emg-${Date.now()}`,
      name: '',
      relationship: 'دوست / آشنا',
      phone: '',
      mobile: '',
      address: '',
      priority: emergencyContacts.length + 1,
      isPrimary: false
    };
    updateFormData({ emergencyContacts: [...emergencyContacts, newContact] });
  };

  const handleUpdateContact = (id: string, fields: Partial<EmergencyContact>) => {
    const updated = emergencyContacts.map(c => c.id === id ? { ...c, ...fields } : c);
    updateFormData({ emergencyContacts: updated });
  };

  const handleRemoveContact = (id: string) => {
    if (emergencyContacts.length <= 1) return;
    updateFormData({ emergencyContacts: emergencyContacts.filter(c => c.id !== id) });
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      <div className="border-b border-slate-200 pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <PhoneCall className="w-6 h-6 text-rose-600" />
            مرحله ۱۴: مخاطبین شرایط اضطراری (Emergency Contacts)
          </h3>
          <p className="text-sm text-slate-500 mt-1">
            افراد معتمد و خویشاوندانی که در مواقع بروز فوریت‌های پزشکی و اداری باید با آنان تماس حاصل شود.
          </p>
        </div>

        <button
          type="button"
          onClick={handleAddContact}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-slate-800 text-white rounded-xl text-xs font-semibold hover:bg-slate-900 shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          افزودن مخاطب اضطراری
        </button>
      </div>

      <div className="space-y-6">
        {emergencyContacts.map((contact, index) => (
          <div key={contact.id} className="border border-slate-200 rounded-2xl p-6 bg-white shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 font-bold text-slate-800">
                <span className="w-6 h-6 rounded-full bg-rose-100 text-rose-800 flex items-center justify-center text-xs">
                  {index + 1}
                </span>
                <span>{contact.name || `مخاطب اضطراری شماره ${index + 1}`}</span>
                {contact.isPrimary && (
                  <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                    اولویت اول تماس
                  </span>
                )}
              </div>

              {emergencyContacts.length > 1 && (
                <button
                  type="button"
                  onClick={() => handleRemoveContact(contact.id)}
                  className="text-rose-500 hover:text-rose-700 text-xs flex items-center gap-1 p-1 hover:bg-rose-50 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  حذف
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  نام و نام خانوادگی <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="مثال: سارا محمدی"
                  value={contact.name}
                  onChange={(e) => handleUpdateContact(contact.id, { name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-emerald-500 focus:outline-none text-slate-800 text-sm"
                />
              </div>

              {/* Relationship */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">نسبت با پرسنل</label>
                <input
                  type="text"
                  placeholder="مثال: پدر / همسر / برادر"
                  value={contact.relationship}
                  onChange={(e) => handleUpdateContact(contact.id, { relationship: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-emerald-500 focus:outline-none text-slate-800 text-sm"
                />
              </div>

              {/* Mobile */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  شماره موبایل <span className="text-rose-500">*</span>
                </label>
                <input
                  type="tel"
                  dir="ltr"
                  placeholder="0912..."
                  value={contact.mobile}
                  onChange={(e) => handleUpdateContact(contact.id, { mobile: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-emerald-500 focus:outline-none text-slate-800 text-sm"
                />
              </div>

              {/* Landline */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">تلفن ثابت منزل یا محل کار</label>
                <input
                  type="tel"
                  dir="ltr"
                  placeholder="021-..."
                  value={contact.phone || ''}
                  onChange={(e) => handleUpdateContact(contact.id, { phone: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-emerald-500 focus:outline-none text-slate-800 text-sm"
                />
              </div>

              {/* Address */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">آدرس تقریبی</label>
                <input
                  type="text"
                  placeholder="خیابان، محله..."
                  value={contact.address || ''}
                  onChange={(e) => handleUpdateContact(contact.id, { address: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-emerald-500 focus:outline-none text-slate-800 text-sm"
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
