import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Camera, Image as ImageIcon, Bell } from 'lucide-react';
import {
  DEFAULT_NOTIFICATION_PREFS,
  loadNotificationPreferences,
  NOTIFICATION_PREF_ITEMS,
  saveNotificationPreferences,
} from '../../utils/notificationPreferences';
import { overlayFade, sheetSpring } from '../../utils/motionPresets';
import '../../styles/ToggleSwitch.css';

function ToggleSwitch({ checked, onChange, label }) {
  const switchId = React.useId();
  return (
    <div className="toggle-switch-row">
      <span className="toggle-switch-row__label" id={`${switchId}-label`}>{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-labelledby={`${switchId}-label`}
        onClick={() => onChange(!checked)}
        className={`toggle-switch${checked ? ' toggle-switch--on' : ''}`}
      >
        <span className="toggle-switch__thumb" aria-hidden />
      </button>
    </div>
  );
}

export default function SettingsSheet({
  open,
  onClose,
  user,
  center,
  regions = [],
  prefs,
  onPrefsChange,
  onSaveProfile,
  onSavePreferences,
  onAvatarPick,
  cameraRef,
  galleryRef,
}) {
  const [nameVal, setNameVal] = useState('');
  const [addressVal, setAddressVal] = useState('');
  const [regionId, setRegionId] = useState('');
  const [notifPrefs, setNotifPrefs] = useState(DEFAULT_NOTIFICATION_PREFS);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setNameVal(center?.user?.name || user?.name || '');
    setAddressVal(center?.user?.address || user?.address || '');
    setRegionId(prefs?.regionId || '');
    setNotifPrefs(loadNotificationPreferences());
  }, [open, center, user, prefs]);

  const handleSave = async () => {
    setSaving(true);
    try {
      saveNotificationPreferences(notifPrefs);
      await onSaveProfile({ name: nameVal, address: addressVal });
      const mergedPrefs = { ...prefs, regionId };
      onPrefsChange(mergedPrefs);
      await onSavePreferences(mergedPrefs);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[70] flex flex-col justify-end sm:items-center sm:justify-center sm:p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={overlayFade}
        >
          <button type="button" className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" aria-label="إغلاق" onClick={onClose} />
          <motion.div
            initial={{ opacity: 0, y: 32, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.99 }}
            transition={sheetSpring}
            className="relative w-full max-w-lg max-h-[92vh] overflow-y-auto rounded-t-[1.75rem] sm:rounded-[1.75rem] bg-gray-50 shadow-2xl"
            dir="rtl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 z-[1] flex items-center justify-between border-b border-gray-100 bg-white/95 backdrop-blur px-5 py-4 rounded-t-[1.75rem]">
              <h2 className="text-base font-black text-gray-900">الإعدادات</h2>
              <button type="button" onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-500">
                <X size={16} />
              </button>
            </div>

            <div className="p-4 space-y-4 pb-6">
              <section className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm space-y-4">
                <h3 className="text-sm font-black text-gray-900">الملف الشخصي</h3>
                <div className="flex items-center gap-3">
                  <button type="button" onClick={onAvatarPick} className="relative shrink-0">
                    <img
                      src={center?.user?.avatar || user?.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=User'}
                      alt=""
                      className="h-16 w-16 rounded-2xl object-cover ring-2 ring-emerald-100"
                    />
                    <span className="absolute -bottom-1 -right-1 rounded-lg bg-emerald-600 p-1 text-white shadow">
                      <Camera size={12} />
                    </span>
                  </button>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => cameraRef.current?.click()} className="text-[11px] font-black text-emerald-700 bg-emerald-50 px-3 py-2 rounded-xl">
                      الكاميرا
                    </button>
                    <button type="button" onClick={() => galleryRef.current?.click()} className="text-[11px] font-black text-gray-600 bg-gray-100 px-3 py-2 rounded-xl flex items-center gap-1">
                      <ImageIcon size={12} /> معرض
                    </button>
                  </div>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="text-[11px] font-black text-gray-400 mb-1 block">الاسم</label>
                    <input
                      value={nameVal}
                      onChange={(e) => setNameVal(e.target.value)}
                      className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm font-bold text-gray-900 outline-none focus:border-emerald-300"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-black text-gray-400 mb-1 block">المنطقة</label>
                    <select
                      value={regionId}
                      onChange={(e) => setRegionId(e.target.value)}
                      className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm font-bold text-gray-900 outline-none focus:border-emerald-300"
                    >
                      <option value="">اختر المنطقة</option>
                      {regions.map((r) => (
                        <option key={r._id} value={r._id}>{r.name ?? '—'}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] font-black text-gray-400 mb-1 block">العنوان</label>
                    <input
                      value={addressVal}
                      onChange={(e) => setAddressVal(e.target.value)}
                      placeholder="المدينة، الحي، الشارع..."
                      className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm font-bold text-gray-900 outline-none focus:border-emerald-300"
                    />
                  </div>
                </div>
              </section>

              <section className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-1">
                  <Bell size={16} className="text-emerald-600" />
                  <h3 className="text-sm font-black text-gray-900">إعدادات الإشعارات</h3>
                </div>
                <p className="text-[11px] font-bold text-gray-400 mb-2">تحكم بأنواع الإشعارات التي تصلك</p>
                <div className="divide-y divide-gray-100">
                  {NOTIFICATION_PREF_ITEMS.map((item) => (
                    <ToggleSwitch
                      key={item.id}
                      label={item.label}
                      checked={Boolean(notifPrefs[item.id])}
                      onChange={(next) => setNotifPrefs((p) => ({ ...p, [item.id]: next }))}
                    />
                  ))}
                </div>
              </section>

              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="w-full rounded-2xl bg-gradient-to-l from-emerald-600 to-emerald-500 py-3.5 text-sm font-black text-white shadow-lg shadow-emerald-500/20 disabled:opacity-60"
              >
                {saving ? 'جاري الحفظ...' : 'حفظ الإعدادات'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
