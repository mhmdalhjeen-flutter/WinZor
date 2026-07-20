import React from 'react';
import { motion } from 'framer-motion';
import { X, QrCode, ShoppingBag, Coins } from 'lucide-react';
import { BRAND_LOGO_64, BRAND_NAME } from '../../utils/brandAssets';

const SHORTCUTS = [
  { icon: QrCode, label: 'إدخال الكود', description: 'فعّل بطاقتك واحصل على نقاطك', color: '#b91c1c' },
  { icon: ShoppingBag, label: 'السوق العام', description: 'بيع واشتري بسهولة', color: '#059669' },
  { icon: Coins, label: 'نقاطي', description: 'تابع نقاطك وفرص الفوز', color: '#d97706' },
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
          يمكنك الضغط مطولًا على أيقونة {BRAND_NAME} للوصول السريع إلى:
        </p>
        <ul className="pwa-tutorial-list">
          {SHORTCUTS.map(({ icon: Icon, label, description, color }) => (
            <li key={label} className="pwa-tutorial-list__item">
              <span className="pwa-tutorial-list__icon" style={{ color }}>
                <Icon size={16} strokeWidth={2.2} />
              </span>
              <span>
                <strong>{label}</strong>
                <span className="pwa-tutorial-list__desc">{description}</span>
              </span>
            </li>
          ))}
        </ul>
        <button type="button" className="pwa-install-card__btn pwa-install-card__btn--primary pwa-tutorial-card__ok" onClick={onClose}>
          فهمت
        </button>
      </motion.div>
    </div>
  );
}
