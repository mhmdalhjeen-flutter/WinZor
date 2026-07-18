import { Sparkles } from 'lucide-react';
import { BRAND_LOGO_128, BRAND_NAME } from '../utils/brandAssets';
import '../styles/Maintenance.css';

export default function Maintenance({ message }) {
  return (
    <div className="maintenance-page" dir="rtl">
      <div className="maintenance-glow maintenance-glow-a" />
      <div className="maintenance-glow maintenance-glow-b" />

      <div className="maintenance-card">
        <div className="maintenance-icon-wrap">
          <img
            src={BRAND_LOGO_128}
            alt={BRAND_NAME}
            className="maintenance-logo"
            width={72}
            height={72}
          />
        </div>

        <div className="maintenance-badge">
          <Sparkles size={14} />
          <span>{BRAND_NAME}</span>
        </div>

        <h1>الموقع تحت الصيانة حالياً</h1>
        <p className="maintenance-message">
          {message || 'نعمل على تحديثات وتحسينات — سنعود قريباً. شكراً لصبركم.'}
        </p>

        <div className="maintenance-footer">
          <span className="maintenance-dot" />
          <span>جميع الخدمات متوقفة مؤقتاً</span>
        </div>
      </div>
    </div>
  );
}
