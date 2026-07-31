import React, { useState, lazy, Suspense } from 'react';
import { motion, useInView } from 'framer-motion';
import {
  Trophy, Gift, Star, ShoppingBag, Tag, Coins,
  Users, TrendingDown, Sparkles, Medal, CircleDot,
  Play, Truck, Percent, ChevronRight,
} from 'lucide-react';
import { BRAND_LOGO_256, BRAND_NAME } from '../../utils/brandAssets';
import AuthWelcomeBackground from '../auth/AuthWelcomeBackground';

const HorizontalSwipe = lazy(() => import('../ui/HorizontalSwipe'));

export const INTRO_VIDEO =
  import.meta.env.VITE_INTRO_VIDEO_URL ||
  'https://www.youtube.com/embed/dQw4w9WgXcQ?rel=0&modestbranding=1&playsinline=1';

export const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  show: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] },
  }),
};

export const PERSONAS = [
  { icon: Trophy, title: 'محب الجوائز', desc: 'اربح سيارات، كاش، وجوائز حقيقية مع كل نقطة.', color: 'from-amber-500 to-orange-600' },
  { icon: ShoppingBag, title: 'محب التسوق', desc: 'تسوق من متاجر موثوقة مع توصيل وتجربة سلسة.', color: 'from-rose-500 to-red-600' },
  { icon: Percent, title: 'محب العروض', desc: 'اكتشف أفضل الخصومات قبل الجميع في مكان واحد.', color: 'from-violet-500 to-purple-700' },
  { icon: Users, title: 'تبيع أغراضك', desc: 'اعرض غراضك للبيع أو التبديل داخل سوق المستخدمين.', color: 'from-cyan-500 to-blue-600' },
  { icon: TrendingDown, title: 'تتابع الأسعار', desc: 'راقب العروض والمتاجر ولا تفوّت فرصة التوفير.', color: 'from-emerald-500 to-teal-600' },
];

export const PILLARS = [
  { icon: Tag, title: 'العروض', headline: 'كل العروض في مكان واحد', desc: 'تصفح عروض المطاعم، الأزياء، الإلكترونيات والمزيد — مرتّبة حسب اهتماماتك ومنطقتك.', accent: 'border-rose-500/30 bg-rose-500/10 text-rose-300', bar: 'bg-rose-500' },
  { icon: Truck, title: 'التسوق', headline: 'اشتري بثقة وسرعة', desc: 'اطلب من المتاجر مباشرة، تابع طلبك، واستمتع بتجربة تسوق حديثة من جوالك.', accent: 'border-orange-500/30 bg-orange-500/10 text-orange-300', bar: 'bg-orange-500' },
  { icon: ShoppingBag, title: 'سوق المستخدمين', headline: 'بيع · بدل · اعرض غراضك', desc: 'سوق مجتمعي يربط البائع بالمشتري — بيع أغراضك أو اكتشف صفقات مميزة.', accent: 'border-cyan-500/30 bg-cyan-500/10 text-cyan-300', bar: 'bg-cyan-500' },
  { icon: Medal, title: 'الجوائز', headline: 'مسابقات وعجلة ومسار إنجازات', desc: 'شارك في المسابقات، لف عجلة الحظ، وافتح جوائزك على مسار النقاط.', accent: 'border-amber-500/30 bg-amber-500/10 text-amber-300', bar: 'bg-amber-500' },
  { icon: Coins, title: 'النقاط', headline: 'كل تفاعل يقربك للفوز', desc: 'الشراء، الدعوات، الأكواد، والمشاركة — كلها تمنحك نقاطاً ترتقي بمستواك.', accent: 'border-violet-500/30 bg-violet-500/10 text-violet-300', bar: 'bg-violet-500' },
];

export const PRIZE_HIGHLIGHTS = [
  { icon: '🚗', label: 'سيارات' },
  { icon: '🏠', label: 'جوائز عقارية' },
  { icon: '💵', label: 'كاش' },
  { icon: '📱', label: 'أجهزة ذكية' },
  { icon: '🎁', label: 'هدايا يومية' },
];

const Section = ({ children, className = '' }) => {
  const ref = React.useRef(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });
  return (
    <motion.section
      ref={ref}
      initial="hidden"
      animate={inView ? 'show' : 'hidden'}
      variants={{ hidden: {}, show: { transition: { staggerChildren: 0.06 } } }}
      className={className}
    >
      {children}
    </motion.section>
  );
};

export function IntroHeroLogo() {
  return (
    <motion.div variants={fadeUp} initial="hidden" animate="show" className="mb-6 flex justify-center">
      <div className="relative flex items-center justify-center">
        <div
          className="absolute inset-0 scale-110 rounded-[2rem] bg-gradient-to-br from-red-200/40 via-blue-200/35 to-emerald-200/40 blur-2xl"
          aria-hidden
        />
        <img
          src={BRAND_LOGO_256}
          alt={BRAND_NAME}
          className="relative z-[1] h-[8.5rem] w-[8.5rem] object-contain drop-shadow-[0_18px_40px_rgba(15,23,42,0.14)] sm:h-[10.5rem] sm:w-[10.5rem] md:h-[12rem] md:w-[12rem]"
          width={192}
          height={192}
          loading="eager"
          fetchpriority="high"
          decoding="async"
        />
      </div>
    </motion.div>
  );
}

export function IntroVideoBlock() {
  const [playing, setPlaying] = useState(false);

  return (
    <motion.div variants={fadeUp} initial="hidden" animate="show" className="relative mb-8">
      <div className="absolute -inset-1 rounded-[28px] bg-gradient-to-br from-red-500 via-amber-400 to-violet-600 opacity-60 blur-sm" />
      <div className="relative overflow-hidden rounded-[26px] border border-white/10 bg-black shadow-2xl">
        <div className="relative aspect-[16/10] sm:aspect-video">
          {playing ? (
            <iframe
              className="absolute inset-0 h-full w-full"
              src={`${INTRO_VIDEO}${INTRO_VIDEO.includes('?') ? '&' : '?'}autoplay=1`}
              title="فيديو تعريفي"
              loading="lazy"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <button
              type="button"
              onClick={() => setPlaying(true)}
              className="group absolute inset-0 flex flex-col items-center justify-center gap-3 bg-gradient-to-br from-[#1a0a0a] via-[#120818] to-[#0a0a12]"
              aria-label="تشغيل الفيديو التعريفي"
            >
              <motion.div
                animate={{ scale: [1, 1.06, 1] }}
                transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
                className="flex h-20 w-20 items-center justify-center rounded-full bg-white/10 ring-2 ring-amber-400/40 backdrop-blur transition group-hover:bg-white/20"
              >
                <Play size={36} className="mr-[-4px] text-amber-300" fill="currentColor" />
              </motion.div>
              <span className="text-sm font-black text-white/90">اضغط لمشاهدة الفيديو</span>
              <span className="text-[10px] font-bold text-white/40">يُحمّل عند الطلب — أسرع للجوال</span>
            </button>
          )}
        </div>
        <div className="flex items-center justify-between gap-3 bg-black/60 px-4 py-3 backdrop-blur-md">
          <div className="flex items-center gap-2 text-xs font-bold text-white/80">
            <Play size={14} className="text-amber-300" fill="currentColor" />
            شاهد كيف تعمل المنصة في 60 ثانية
          </div>
          <span className="rounded-full bg-red-600/30 px-2.5 py-1 text-[10px] font-black text-red-200">مجاني</span>
        </div>
      </div>
    </motion.div>
  );
}

function StoreTypesHighlight() {
  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      animate="show"
      custom={2}
      className="mb-8 rounded-[24px] border border-gray-200/80 bg-white/75 p-4 shadow-sm backdrop-blur-sm sm:p-5"
    >
      <ul className="space-y-2.5 text-sm font-bold text-gray-700">
        <li className="flex items-start gap-2">
          <span className="text-emerald-400 shrink-0" aria-hidden>✅</span>
          <span>الحصول على نقاط من المتاجر المعتمدة داخل التطبيق</span>
        </li>
        <li className="flex items-start gap-2">
          <span className="text-emerald-400 shrink-0" aria-hidden>✅</span>
          <span>أكثر من 30 نوع متجر</span>
        </li>
      </ul>
      <p className="mt-3 text-xs font-bold leading-relaxed text-gray-500">
        مجوهرات · ملابس · أحذية · أجهزة كهربائية · ماركتات · مطاعم
        <span className="text-amber-600/90"> …والمزيد</span>
      </p>
    </motion.div>
  );
}

function HeroStats() {
  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      animate="show"
      custom={2}
      className="mb-8 grid grid-cols-3 gap-2 sm:gap-3"
    >
      {[
        { val: '+1000', label: 'عرض نشط', icon: Tag },
        { val: 'جوائز', label: 'حقيقية', icon: Gift },
        { val: 'نقاط', label: 'تتراكم', icon: Coins },
      ].map((s) => (
        <div
          key={s.label}
          className="rounded-2xl border border-gray-200/80 bg-white/80 px-2 py-3 text-center shadow-sm backdrop-blur-sm sm:px-3"
        >
          <s.icon size={16} className="mx-auto mb-1 text-amber-500" />
          <p className="text-sm font-black text-gray-900 sm:text-base">{s.val}</p>
          <p className="text-[9px] font-bold text-gray-500 sm:text-[10px]">{s.label}</p>
        </div>
      ))}
    </motion.div>
  );
}

/**
 * Shared marketing / intro body — used by landing Intro and informational About page.
 * @param {{ headerBanner?: React.ReactNode, footerNote?: string, className?: string }} props
 */
export default function IntroMarketingContent({
  headerBanner = null,
  footerNote = 'منصة مجانية · جوائز داخل البلد · تجربة تسوق ونقاط ومكافآت',
  className = '',
}) {
  return (
    <div className={`relative min-h-screen overflow-x-hidden bg-[#fff9f5] pb-12 font-['Cairo'] text-gray-900 ${className}`} dir="rtl">
      <AuthWelcomeBackground />

      {headerBanner}

      <div className="relative z-10 mx-auto max-w-2xl px-4 pt-2 sm:px-6">
        <IntroHeroLogo />
        <IntroVideoBlock />

        <motion.div variants={fadeUp} initial="hidden" animate="show" custom={1} className="mb-6 text-center">
          <h1 className="text-[1.65rem] font-black leading-tight tracking-tight text-gray-900 sm:text-3xl md:text-[2.15rem]">
            كل ما تحتاجه موجود هنا
          </h1>
          <p className="mx-auto mt-3 max-w-md text-lg font-black leading-relaxed sm:text-xl bg-gradient-to-l from-red-600 via-violet-700 to-blue-600 bg-clip-text text-transparent">
            حوّل كل عملية شراء إلى فرصة ربح
          </p>
        </motion.div>

        <StoreTypesHighlight />
        <HeroStats />

        <Section className="mb-12">
          <motion.div variants={fadeUp} custom={0} className="mb-3 flex items-end justify-between gap-2">
            <div>
              <h2 className="text-xl font-black text-gray-900 sm:text-2xl">مناسبة لك — مهما كان هدفك</h2>
              <p className="text-xs font-bold text-gray-500 sm:text-sm">اختر مسارك… المنصة تخدم الجميع.</p>
            </div>
            <span className="hidden shrink-0 items-center gap-1 text-[10px] font-bold text-gray-600 sm:inline-flex">
              مرّر <ChevronRight size={12} className="animate-pulse" />
            </span>
          </motion.div>
          <Suspense fallback={<div className="h-40 rounded-2xl bg-white/50 animate-pulse" />}>
            <HorizontalSwipe spaceBetween={12} className="pb-2">
              {PERSONAS.map((p, i) => (
                <motion.div
                  key={p.title}
                  variants={fadeUp}
                  custom={i + 1}
                  whileHover={{ y: -4 }}
                  className="w-[72vw] max-w-[260px] shrink-0 rounded-[24px] border border-gray-200/80 bg-white/80 p-4 shadow-sm backdrop-blur-sm transition-shadow hover:border-gray-300 hover:shadow-lg hover:shadow-red-500/10"
                >
                  <div className={`mb-3 inline-flex rounded-2xl bg-gradient-to-br ${p.color} p-3 text-white shadow-lg`}>
                    <p.icon size={22} />
                  </div>
                  <h3 className="font-black text-base text-gray-900">{p.title}</h3>
                  <p className="mt-2 text-xs font-bold leading-relaxed text-gray-600">{p.desc}</p>
                </motion.div>
              ))}
            </HorizontalSwipe>
          </Suspense>
          <p className="mt-2 flex items-center justify-center gap-1 text-[10px] font-bold text-gray-600 sm:hidden">
            <ChevronRight size={12} className="animate-pulse" /> اسحب لرؤية المزيد
          </p>
        </Section>

        <Section className="mb-12 space-y-3">
          <motion.div variants={fadeUp} custom={0} className="mb-2">
            <h2 className="text-xl font-black text-gray-900 sm:text-2xl">ماذا ستجد هنا؟</h2>
            <p className="text-xs font-bold text-gray-500 sm:text-sm">كل ما تحتاجه — بأسلوب سريع ومحفّز.</p>
          </motion.div>
          {PILLARS.map((item, i) => (
            <motion.div
              key={item.title}
              variants={fadeUp}
              custom={i + 1}
              whileHover={{ scale: 1.01 }}
              className="relative overflow-hidden rounded-[24px] border border-gray-200/80 bg-white/80 p-5 shadow-sm backdrop-blur-sm"
            >
              <div className={`absolute right-0 top-0 h-full w-1 ${item.bar}`} />
              <div className="flex items-start gap-4 pr-2">
                <div className={`shrink-0 rounded-2xl border p-3 ${item.accent}`}>
                  <item.icon size={22} />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] font-black tracking-wider text-gray-600">{item.title}</span>
                  <h3 className="mt-1 font-black text-lg text-gray-900">{item.headline}</h3>
                  <p className="mt-2 text-xs font-bold leading-relaxed text-gray-600 sm:text-sm">{item.desc}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </Section>

        <Section className="mb-10">
          <motion.div
            variants={fadeUp}
            custom={0}
            className="overflow-hidden rounded-[28px] border border-amber-200/80 bg-gradient-to-br from-amber-50/90 via-red-50/70 to-violet-50/80 p-6 shadow-sm"
          >
            <div className="mb-5 flex items-center gap-3">
              <div className="rounded-2xl bg-amber-100 p-3 text-amber-600">
                <Gift size={24} />
              </div>
              <div>
                <h2 className="text-xl font-black text-gray-900">جوائز تستحق المشاركة</h2>
                <p className="text-xs font-bold text-gray-600">مسابقات · عجلة حظ · مسار إنجازات</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
              {PRIZE_HIGHLIGHTS.map((p) => (
                <motion.div
                  key={p.label}
                  whileHover={{ scale: 1.05 }}
                  className="flex flex-col items-center gap-2 rounded-2xl border border-white/80 bg-white/70 px-2 py-4 text-center shadow-sm"
                >
                  <span className="text-2xl">{p.icon}</span>
                  <span className="text-[10px] font-black text-gray-700">{p.label}</span>
                </motion.div>
              ))}
            </div>
            <div className="mt-5 flex flex-wrap items-center justify-center gap-4 text-[10px] font-black text-amber-700/90">
              <span className="inline-flex items-center gap-1"><Star size={12} fill="currentColor" /> نقاط تتراكم</span>
              <span className="inline-flex items-center gap-1"><CircleDot size={12} /> عجلة يومية</span>
              <span className="inline-flex items-center gap-1"><Sparkles size={12} /> مسار إنجازات</span>
            </div>
          </motion.div>
        </Section>

        {footerNote && (
          <Section className="mb-8 text-center">
            <motion.p variants={fadeUp} custom={0} className="text-xs font-bold text-gray-500">
              {footerNote}
            </motion.p>
          </Section>
        )}
      </div>
    </div>
  );
}
