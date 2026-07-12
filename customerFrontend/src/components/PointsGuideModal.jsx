import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, X, Zap, Gift, Store } from 'lucide-react';
import {
  ENTER_CARD_EVENT,
  REFERRAL_CARDS_EVENT,
  dispatchAfterGuideClose,
} from '../utils/pointsGuideEvents';

const GUIDE_SECTIONS = [
  {
    emoji: '🎁',
    title: 'ما هي النقاط؟',
    body: 'هي مكافآت وبطاقات هدايا تحصل عليها مع كل عملية شراء من المتاجر المعتمدة لدينا، سواء تسوقت إلكترونياً عبر التطبيق أو قمت بزيارة المتجر على أرض الواقع!',
    note: 'ملاحظة: شروط وقيمة الحصول على البطاقات يحددها صاحب كل متجر.',
    gradient: 'from-rose-50 via-red-50 to-pink-50',
    border: 'border-rose-100',
  },
  {
    emoji: '📱',
    title: 'كيف تضيف البطاقة لمحفظتك؟',
    body: 'الأمر أسهل مما تتخيل! بمجرد استلامك لبطاقة النقاط من المتجر، افتح التطبيق واضغط على "إدخال الكرت".',
    bullets: [
      'المسح السريع: اضغط على أيقونة الكاميرا وامسح رمز QR Code المطبوع على الكرت.',
      'الإدخال اليدوي: قم بكتابة الكود أو الرقم الموجود على الكرت مباشرة في الخانة المخصصة.',
    ],
    gradient: 'from-sky-50 via-blue-50 to-indigo-50',
    border: 'border-sky-100',
  },
  {
    emoji: '🎉',
    title: 'ماذا تستفيد من النقاط؟ (وقت الجوائز!)',
    body: 'كل نقطة تجمعها هي "تذكرة ذهبية" تتيح لك المشاركة في مسابقاتنا المتنوعة والدخول في سحوبات على جوائز قيمة ومفاجآت كبرى.',
    note: 'ولأننا نهتم بالشفافية المطلقة، جميع عمليات السحب تتم في بث مباشر (Live) لتعيش لحظة إعلان الفائزين.',
    gradient: 'from-emerald-50 via-green-50 to-teal-50',
    border: 'border-emerald-100',
  },
  {
    emoji: '⚠️',
    title: 'قاعدة ذهبية',
    body: 'هذه النقاط صُممت لتكون هدية شكر وتقدير من أصحاب المتاجر لزبائنهم الأعزاء؛ لذا فهي مخصصة للمكافآت فقط وغير قابلة للبيع أو الشراء.',
    gradient: 'from-amber-50 via-yellow-50 to-orange-50',
    border: 'border-amber-100',
  },
  {
    emoji: '🚀',
    title: 'ضاعف نقاطك.. تضاعف فرصتك!',
    body: 'كلما زادت نقاطك، زادت فرصك في الربح. في كل سحب جديد.. الجوائز تكبر وتصبح أضخم!',
    gradient: 'from-violet-50 via-purple-50 to-fuchsia-50',
    border: 'border-violet-100',
  },
];

export default function PointsGuideModal({ open, onClose }) {
  const navigate = useNavigate();

  useEffect(() => {
    if (!open) return undefined;
    document.body.classList.add('points-guide-open');
    return () => document.body.classList.remove('points-guide-open');
  }, [open]);

  const handleEnterCard = () => {
    onClose();
    dispatchAfterGuideClose(ENTER_CARD_EVENT);
  };

  const handleFreeCard = () => {
    onClose();
    dispatchAfterGuideClose(REFERRAL_CARDS_EVENT);
  };

  const handleShowPointsStores = () => {
    onClose();
    navigate('/stores/points-program');
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div
        className="relative w-full max-w-md max-h-[92vh] overflow-y-auto rounded-t-[32px] sm:rounded-[32px] p-6 text-right shadow-2xl border border-white/80 points-guide-modal"
        dir="rtl"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 left-4 text-gray-500 hover:text-gray-800 z-10"
          aria-label="إغلاق"
        >
          <X size={22} />
        </button>

        <div className="text-center space-y-2 mb-5">
          <BookOpen className="mx-auto text-violet-600" size={28} />
          <h2 className="text-xl font-black text-gray-900">دليل النقاط</h2>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-5">
          <button
            type="button"
            onClick={handleEnterCard}
            className="flex flex-col items-center justify-center gap-2 rounded-2xl bg-gradient-to-br from-primary/10 to-red-100 border border-primary/20 px-4 py-4 active:scale-[0.98] transition-transform"
          >
            <span className="flex items-center justify-center w-11 h-11 rounded-full bg-primary text-white shadow-md">
              <Zap size={20} />
            </span>
            <span className="text-xs font-black text-gray-900">إدخال الكرت</span>
          </button>
          <button
            type="button"
            onClick={handleFreeCard}
            className="flex flex-col items-center justify-center gap-2 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-100 border border-amber-200 px-4 py-4 active:scale-[0.98] transition-transform"
          >
            <span className="flex items-center justify-center w-11 h-11 rounded-full bg-amber-500 text-white shadow-md">
              <Gift size={20} />
            </span>
            <span className="text-xs font-black text-gray-900">كرت مجاني</span>
            <span className="text-[10px] font-bold text-amber-800/80 leading-tight">عن طريق دعوة صديق</span>
          </button>
        </div>

        <div className="space-y-4">
          <article className="rounded-2xl border bg-gradient-to-br from-indigo-50 via-blue-50 to-sky-50 border-indigo-100 p-4 space-y-3">
            <h3 className="text-sm font-black text-gray-900">
              🏪 المتاجر التي تمنح نقاط
            </h3>
            <p className="text-xs font-bold text-gray-700 leading-relaxed">
              اكتشف المتاجر المشاركة في برنامج النقاط واعرف أين يمكنك جمع المكافآت عند الشراء.
            </p>
            <button
              type="button"
              onClick={handleShowPointsStores}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-white border border-indigo-200 text-indigo-700 text-xs font-black py-3 active:scale-[0.98] transition-transform"
            >
              <Store size={16} />
              عرض جميع المتاجر المشاركة
            </button>
          </article>

          {GUIDE_SECTIONS.map((section) => (
            <article
              key={section.title}
              className={`rounded-2xl border bg-gradient-to-br ${section.gradient} ${section.border} p-4 space-y-2`}
            >
              <h3 className="text-sm font-black text-gray-900">
                {section.emoji} {section.title}
              </h3>
              <p className="text-xs font-bold text-gray-700 leading-relaxed">{section.body}</p>
              {section.bullets?.map((bullet) => (
                <p key={bullet} className="text-xs font-bold text-gray-600 leading-relaxed pr-2">
                  • {bullet}
                </p>
              ))}
              {section.note && (
                <p className="text-[11px] font-bold text-amber-700 leading-relaxed">
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
