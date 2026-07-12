import React from 'react';
import { Sparkles, X } from 'lucide-react';
import { useCompetitionsList } from '../hooks/useCompetitionsList';
import HorizontalSwipe from './ui/HorizontalSwipe';

const STAGES = [
  { id: 'bronze', label: 'برونزي', min: 0, max: 99, color: '#cd7f32', stars: 1 },
  { id: 'silver', label: 'فضّي', min: 100, max: 299, color: '#94a3b8', stars: 2 },
  { id: 'gold', label: 'ذهبي', min: 300, max: 599, color: '#eab308', stars: 3 },
  { id: 'platinum', label: 'بلاتيني', min: 600, max: Infinity, color: '#a78bfa', stars: 4 },
];

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

const getStage = (points) =>
  STAGES.find((s) => points >= s.min && points <= s.max) || STAGES[0];

const PointsModal = ({ open, onClose, userName, points = 0 }) => {
  const stage = getStage(points);
  const nextStage = STAGES[STAGES.indexOf(stage) + 1];
  const progress = nextStage
    ? Math.min(100, ((points - stage.min) / (nextStage.min - stage.min)) * 100)
    : 100;

  const { data: comps = [], isError: compsError } = useCompetitionsList({
    enabled: open,
    refetchInterval: false,
  });

  const suggested = (Array.isArray(comps) ? comps : [])
    .filter((c) => (c.status === 'active' || !c.status) && points >= (c.minPoints || 0))
    .slice(0, 3);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div
        className="relative w-full max-w-md max-h-[92vh] overflow-y-auto bg-gradient-to-b from-[#1a1033] to-[#0b1220] rounded-t-[32px] sm:rounded-[32px] p-6 text-right shadow-2xl border border-white/10"
        dir="rtl"
      >
        <button onClick={onClose} className="absolute top-4 left-4 text-white/50 hover:text-white z-10">
          <X size={22} />
        </button>

        <div className="text-center space-y-2 mb-5">
          <Sparkles className="mx-auto text-yellow-300" size={28} />
          <h2 className="text-xl font-black text-white">دليل النقاط</h2>
          <p className="text-sm font-bold text-white/70">{userName || 'مستخدم'}</p>
          <p className="text-3xl font-black text-primary-light">{points} نقطة</p>
        </div>

        {nextStage && (
          <div className="mb-5">
            <div className="flex justify-between text-[10px] text-white/50 font-bold mb-1">
              <span>{stage.label}</span>
              <span>{nextStage.min - points} نقطة للمستوى {nextStage.label}</span>
            </div>
            <div className="h-2.5 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${progress}%`, background: `linear-gradient(90deg, ${stage.color}, ${nextStage.color})` }}
              />
            </div>
          </div>
        )}

        <div className="space-y-4 mb-6">
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

        {compsError && (
          <p className="text-xs text-white/40 text-center">تعذّر تحميل المسابقات</p>
        )}
        {!compsError && suggested.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-black text-white/60">مسابقات تناسبك — اسحب للتصفح</p>
            <HorizontalSwipe spaceBetween={10}>
              {suggested.map((c) => (
                <div
                  key={c._id}
                  className="w-[220px] shrink-0 bg-white/5 border border-white/10 rounded-xl p-3 text-sm font-bold text-white"
                >
                  {c.title}
                  <span className="block text-[10px] text-white/40 mt-0.5">الحد الأدنى: {c.minPoints} نقطة</span>
                </div>
              ))}
            </HorizontalSwipe>
          </div>
        )}
      </div>
    </div>
  );
};

export default PointsModal;
