import React from 'react';
import { BookOpen, X } from 'lucide-react';

const GUIDE_SECTIONS = [
  {
    emoji: '🎁',
    title: 'ما هي النقاط؟',
    body: 'هي مكافآت وبطاقات هدايا تحصل عليها مع كل عملية شراء من المتاجر المعتمدة لدينا، سواء تسوقت إلكترونياً عبر التطبيق أو قمت بزيارة المتجر على أرض الواقع!',
    note: 'ملاحظة: شروط وقيمة الحصول على البطاقات يحددها صاحب كل متجر.',
  },
  {
    emoji: '📱',
    title: 'كيف تضيف البطاقة لمحفظتك؟',
    body: 'الأمر أسهل مما تتخيل! بمجرد استلامك لبطاقة النقاط من المتجر، افتح التطبيق واضغط على "إدخال الكرت".',
    bullets: [
      'المسح السريع: اضغط على أيقونة الكاميرا وامسح رمز QR Code المطبوع على الكرت.',
      'الإدخال اليدوي: قم بكتابة الكود أو الرقم الموجود على الكرت مباشرة في الخانة المخصصة.',
    ],
  },
  {
    emoji: '🎉',
    title: 'ماذا تستفيد من النقاط؟ (وقت الجوائز!)',
    body: 'كل نقطة تجمعها هي "تذكرة ذهبية" تتيح لك المشاركة في مسابقاتنا المتنوعة والدخول في سحوبات على جوائز قيمة ومفاجآت كبرى.',
    note: 'ولأننا نهتم بالشفافية المطلقة، جميع عمليات السحب تتم في بث مباشر (Live) لتعيش لحظة إعلان الفائزين.',
  },
  {
    emoji: '⚠️',
    title: 'قاعدة ذهبية',
    body: 'هذه النقاط صُممت لتكون هدية شكر وتقدير من أصحاب المتاجر لزبائنهم الأعزاء؛ لذا فهي مخصصة للمكافآت فقط وغير قابلة للبيع أو الشراء.',
  },
  {
    emoji: '🚀',
    title: 'ضاعف نقاطك.. تضاعف فرصتك!',
    body: 'كلما زادت نقاطك، زادت فرصك في الربح. في كل سحب جديد.. الجوائز تكبر وتصبح أضخم!',
  },
];

export default function PointsGuideModal({ open, onClose }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div
        className="relative w-full max-w-md max-h-[92vh] overflow-y-auto bg-gradient-to-b from-[#1a1033] to-[#0b1220] rounded-t-[32px] sm:rounded-[32px] p-6 text-right shadow-2xl border border-white/10"
        dir="rtl"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 left-4 text-white/50 hover:text-white z-10"
          aria-label="إغلاق"
        >
          <X size={22} />
        </button>

        <div className="text-center space-y-2 mb-5">
          <BookOpen className="mx-auto text-yellow-300" size={28} />
          <h2 className="text-xl font-black text-white">دليل النقاط</h2>
        </div>

        <div className="space-y-4">
          {GUIDE_SECTIONS.map((section) => (
            <article
              key={section.title}
              className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-2"
            >
              <h3 className="text-sm font-black text-white">
                {section.emoji} {section.title}
              </h3>
              <p className="text-xs font-bold text-white/85 leading-relaxed">{section.body}</p>
              {section.bullets?.map((bullet) => (
                <p key={bullet} className="text-xs font-bold text-white/75 leading-relaxed pr-2">
                  • {bullet}
                </p>
              ))}
              {section.note && (
                <p className="text-[11px] font-bold text-amber-200/90 leading-relaxed">
                  ({section.note})
                </p>
              )}
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
