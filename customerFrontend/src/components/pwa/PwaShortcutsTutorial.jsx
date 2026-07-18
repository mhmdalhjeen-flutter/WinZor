import React from 'react';
import { motion } from 'framer-motion';
import { X, Ticket, ShoppingBag, Store, Medal } from 'lucide-react';
import { BRAND_LOGO_64 } from '../../utils/brandAssets';

const SHORTCUTS = [
  { icon: Ticket, label: 'إدخال الكود', color: '#1e3a8a' },
  { icon: ShoppingBag, label: 'السوق المفتوح', color: '#059669' },
  { icon: Store, label: 'المتاجر', color: '#2563eb' },
  { icon: Medal, label: 'مسابقاتي', color: '#7c3aed' },
];

export default function PwaShortcutsTutorial({ onClose }) {
  return (
    <div className="pwa-tutorial-overlay" role="dialog" aria-modal="true" aria-labelledby="pwa-tutorial-title" dir="rtl">
      <button type="button" className="pwa-install-overlay__backdrop" aria-label="إغلاق" onClick={onClose} />
      <motion.div
        className="pwa-tutorial-card"
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: 'spring', stiffness: 360, damping: 26 }}
      >
        <button type="button" className="pwa-install-card__close" onClick={onClose} aria-label="إغلاق">
          <X size={18} />
        </button>

        <div className="pwa-tutorial-illustration" aria-hidden>
          <div className="pwa-tutorial-illustration__home">
            <div className="pwa-tutorial-illustration__icons-row">
              {SHORTCUTS.map(({ icon: Icon, label, color }) => (
                <div key={label} className="pwa-tutorial-illustration__mini-icon" style={{ color }}>
                  <Icon size={14} strokeWidth={2.2} />
                </div>
              ))}
            </div>
            <div className="pwa-tutorial-illustration__app-icon">
              <img src={BRAND_LOGO_64} alt="" width={40} height={40} />
            </div>
            <span className="pwa-tutorial-illustration__press-hint">اضغط مطولًا</span>
            <div className="pwa-tutorial-illustration__menu">
              {SHORTCUTS.map(({ icon: Icon, label, color }) => (
                <div key={label} className="pwa-tutorial-illustration__menu-item">
                  <span style={{ color }}><Icon size={14} /></span>
                  {label}
                </div>
              ))}
            </div>
          </div>
        </div>

        <h2 id="pwa-tutorial-title" className="pwa-tutorial-card__title">هل تعلم؟</h2>
        <p className="pwa-tutorial-card__body">
          يمكنك الضغط مطولًا على أيقونة عروض تك للوصول السريع إلى:
        </p>
        <ul className="pwa-tutorial-list">
          {SHORTCUTS.map(({ label }) => (
            <li key={label}>• {label}</li>
          ))}
        </ul>
        <button type="button" className="pwa-install-card__btn pwa-install-card__btn--primary pwa-tutorial-card__ok" onClick={onClose}>
          فهمت
        </button>
      </motion.div>
    </div>
  );
}
