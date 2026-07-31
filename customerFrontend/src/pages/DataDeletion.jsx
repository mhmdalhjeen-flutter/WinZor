import React from 'react';
import LegalPageLayout, { LegalSection } from '../components/legal/LegalPageLayout';
import { DATA_DELETION_SECTIONS } from '../content/defaultLegal';

const WHATSAPP_NUMBER = '970592090288';
const WHATSAPP_LINK = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent('طلب حذف حساب وبيانات Facebook — Win Gold')}`;

export default function DataDeletion() {
  return (
    <LegalPageLayout
      title="حذف بيانات المستخدم"
      subtitle="تعليمات حذف بيانات Facebook والحساب"
      activePath="/data-deletion"
    >
      {DATA_DELETION_SECTIONS.map((section) => (
        <LegalSection key={section.title} title={section.title} body={section.body} />
      ))}

      <section className="rounded-2xl border border-emerald-100 bg-emerald-50 p-5 text-center">
        <p className="mb-3 text-sm font-black text-emerald-900">طلب حذف سريع عبر واتساب</p>
        <a
          href={WHATSAPP_LINK}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-[44px] items-center justify-center rounded-xl bg-emerald-600 px-6 py-3 text-sm font-black text-white shadow-sm transition hover:bg-emerald-700"
        >
          تواصل عبر واتساب — {WHATSAPP_NUMBER}
        </a>
      </section>
    </LegalPageLayout>
  );
}
