import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, FileText, Trash2 } from 'lucide-react';
import { BRAND_LOGO_128, BRAND_NAME } from '../../utils/brandAssets';
import { LEGAL_DISCLAIMER } from '../../content/defaultLegal';

const LEGAL_LINKS = [
  { to: '/privacy', label: 'سياسة الخصوصية', icon: Shield },
  { to: '/terms', label: 'الشروط والأحكام', icon: FileText },
  { to: '/data-deletion', label: 'حذف بيانات Facebook', icon: Trash2 },
];

const LegalSection = ({ title, body }) => (
  <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
    {title && (
      <h2 className="mb-3 text-base font-black text-gray-900">{title}</h2>
    )}
    <div className="whitespace-pre-wrap text-sm font-bold leading-relaxed text-gray-600">
      {body}
    </div>
  </section>
);

const LegalPageLayout = ({ title, subtitle, children, activePath }) => (
  <div className="mx-auto w-full max-w-2xl pb-6" dir="rtl">
    <header className="mb-6 text-center">
      <Link to="/" className="mb-4 inline-flex justify-center">
        <img
          src={BRAND_LOGO_128}
          alt={BRAND_NAME}
          className="h-16 w-16 object-contain drop-shadow-sm"
          width={64}
          height={64}
          loading="lazy"
          decoding="async"
        />
      </Link>
      <p className="mb-1 text-[11px] font-black tracking-wide text-emerald-700">{BRAND_NAME}</p>
      <h1 className="text-2xl font-black leading-tight text-gray-900 sm:text-3xl">{title}</h1>
      {subtitle && (
        <p className="mt-2 text-sm font-bold text-gray-500">{subtitle}</p>
      )}
    </header>

    <div className="space-y-4">{children}</div>

    <p className="mt-6 rounded-xl bg-amber-50 p-4 text-xs font-bold leading-relaxed text-amber-900">
      {LEGAL_DISCLAIMER}
    </p>

    <nav
      className="mt-6 flex flex-wrap justify-center gap-2"
      aria-label="صفحات قانونية"
    >
      {LEGAL_LINKS.map(({ to, label, icon: Icon }) => (
        <Link
          key={to}
          to={to}
          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-xs font-black transition ${
            activePath === to
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'bg-white text-gray-600 ring-1 ring-gray-200 hover:bg-gray-50'
          }`}
        >
          <Icon size={14} aria-hidden />
          {label}
        </Link>
      ))}
    </nav>
  </div>
);

export { LegalSection, LegalPageLayout };
export default LegalPageLayout;
