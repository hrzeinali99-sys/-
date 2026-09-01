import React from 'react';
import { MapPin, Plus, Trash2, Home, Building2, AlertCircle } from 'lucide-react';
import { FullRegistrationFormData, AddressInfo } from '../../../types';
import { IRAN_PROVINCES, IRAN_CITIES_BY_PROVINCE } from '../../../services/masterDataService';
import { isValidPostalCode } from '../../../utils/validation';

interface Props {
  formData: Partial<FullRegistrationFormData>;
  updateFormData: (data: Partial<FullRegistrationFormData>) => void;
  errors: Record<string, string>;
  setErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>;
}

export const Step3Address: React.FC<Props> = ({ formData, updateFormData, errors, setErrors }) => {
  const addresses: AddressInfo[] = formData.addresses && formData.addresses.length > 0
    ? formData.addresses
    : [
        {
          id: 'residential-1',
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
      ];

  const handleAddAddress = (type: 'residential' | 'work') => {
    const newAddr: AddressInfo = {
      id: `addr-${Date.now()}`,
      type,
      title: type === 'residential' ? 'نشانی محل سکونت' : 'نشانی محل کار دوم',
      province: 'تهران',
      city: 'تهران',
      district: '',
      fullAddress: '',
      postalCode: '',
      buildingNumber: '',
      unitNumber: ''
    };
    updateFormData({ addresses: [...addresses, newAddr] });
  };

  const handleUpdateAddress = (id: string, fields: Partial<AddressInfo>) => {
    const updated = addresses.map(addr => addr.id === id ? { ...addr, ...fields } : addr);
    updateFormData({ addresses: updated });
  };

  const handleRemoveAddress = (id: string) => {
    if (addresses.length <= 1) return;
    const filtered = addresses.filter(addr => addr.id !== id);
    updateFormData({ addresses: filtered });
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      <div className="border-b border-slate-200 pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <MapPin className="w-6 h-6 text-emerald-600" />
            مرحله ۳: آدرس و اطلاعات سکونت
          </h3>
          <p className="text-sm text-slate-500 mt-1">
            امکان ثبت چند آدرس (محل سکونت اصلی و نشانی محل کار) وجود دارد.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => handleAddAddress('residential')}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-semibold hover:bg-emerald-100 transition-colors"
          >
            <Plus className="w-4 h-4" />
            افزودن نشانی سکونت
          </button>
          <button
            type="button"
            onClick={() => handleAddAddress('work')}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold hover:bg-slate-200 transition-colors"
          >
            <Plus className="w-4 h-4" />
            افزودن نشانی محل کار
          </button>
        </div>
      </div>

      <div className="space-y-6">
        {addresses.map((address, index) => {
          const cities = IRAN_CITIES_BY_PROVINCE[address.province] || ['تهران'];

          return (
            <div key={address.id} className="border border-slate-200 rounded-2xl p-6 bg-white shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2 font-bold text-slate-800">
                  {address.type === 'residential' ? (
                    <Home className="w-5 h-5 text-emerald-600" />
                  ) : (
                    <Building2 className="w-5 h-5 text-indigo-600" />
                  )}
                  <span>{address.title || `آدرس شماره ${index + 1}`}</span>
                  <span className="text-xs px-2.5 py-0.5 rounded-full font-normal bg-slate-100 text-slate-600">
                    {address.type === 'residential' ? 'سکونت' : 'محل کار'}
                  </span>
                </div>

                {addresses.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveAddress(address.id)}
                    className="text-rose-500 hover:text-rose-700 text-xs flex items-center gap-1 p-1 hover:bg-rose-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    حذف این آدرس
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Province */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">استان</label>
                  <select
                    value={address.province}
                    onChange={(e) => {
                      const newProv = e.target.value;
                      const newCities = IRAN_CITIES_BY_PROVINCE[newProv] || ['تهران'];
                      handleUpdateAddress(address.id, { province: newProv, city: newCities[0] });
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-emerald-500 focus:outline-none text-slate-800 text-sm bg-white"
                  >
                    {IRAN_PROVINCES.map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>

                {/* City */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">شهر</label>
                  <select
                    value={address.city}
                    onChange={(e) => handleUpdateAddress(address.id, { city: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-emerald-500 focus:outline-none text-slate-800 text-sm bg-white"
                  >
                    {cities.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                {/* District */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">منطقه / محله</label>
                  <input
                    type="text"
                    placeholder="مثال: منطقه ۳، جلفا"
                    value={address.district || ''}
                    onChange={(e) => handleUpdateAddress(address.id, { district: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-emerald-500 focus:outline-none text-slate-800 text-sm"
                  />
                </div>

                {/* Postal Code */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">کد پستی ۱۰ رقمی</label>
                  <input
                    type="text"
                    maxLength={10}
                    placeholder="1939512345"
                    value={address.postalCode || ''}
                    onChange={(e) => handleUpdateAddress(address.id, { postalCode: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-emerald-500 focus:outline-none text-slate-800 text-sm font-mono"
                  />
                </div>

                {/* Full Address */}
                <div className="sm:col-span-2 lg:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    آدرس کامل پستی <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="خیابان، کوچه، بن‌بست..."
                    value={address.fullAddress || ''}
                    onChange={(e) => handleUpdateAddress(address.id, { fullAddress: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-emerald-500 focus:outline-none text-slate-800 text-sm"
                  />
                </div>

                {/* Plaque / Building No */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">پلاک</label>
                  <input
                    type="text"
                    placeholder="پلاک ۲۴"
                    value={address.buildingNumber || ''}
                    onChange={(e) => handleUpdateAddress(address.id, { buildingNumber: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-emerald-500 focus:outline-none text-slate-800 text-sm"
                  />
                </div>

                {/* Unit No */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">واحد</label>
                  <input
                    type="text"
                    placeholder="واحد ۳"
                    value={address.unitNumber || ''}
                    onChange={(e) => handleUpdateAddress(address.id, { unitNumber: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-emerald-500 focus:outline-none text-slate-800 text-sm"
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
