import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion, useInView } from 'framer-motion';
import {
  Trophy, Gift, Star, Zap, ShoppingBag, Tag, Coins,
  Users, TrendingDown, Sparkles, Medal, CircleDot, ChevronLeft,
  Play, Truck, Percent, ChevronRight
} from 'lucide-react';
import {
  saveReferralCode,
  getReferralCode,
  markReferralIntroSeen,
  loginPathWithRef,
  registerPathWithRef,
} from '../utils/referralStorage';
import WelcomeBackground from '../components/auth/WelcomeBackground';
import HorizontalSwipe from '../components/ui/HorizontalSwipe';

const INTRO_VIDEO =
  import.meta.env.VITE_INTRO_VIDEO_URL ||
  'https://www.youtube.com/embed/dQw4w9WgXcQ?rel=0&modestbranding=1&playsinline=1';

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  show: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] },
  }),
};

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

const IntroVideo = () => {
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
};

const HeroStats = () => (
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
        className="rounded-2xl border border-white/10 bg-white/[0.04] px-2 py-3 text-center backdrop-blur-sm sm:px-3"
      >
        <s.icon size={16} className="mx-auto mb-1 text-amber-300" />
        <p className="text-sm font-black text-white sm:text-base">{s.val}</p>
        <p className="text-[9px] font-bold text-white/45 sm:text-[10px]">{s.label}</p>
      </div>
    ))}
  </motion.div>
);

const Intro = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const refCode = (searchParams.get('ref') || '').trim().toUpperCase();

  useEffect(() => {
    if (refCode) saveReferralCode(refCode);
  }, [refCode]);

  const goToLogin = () => {
    localStorage.setItem('firstVisit', 'false');
    const ref = refCode || getReferralCode();
    if (ref) saveReferralCode(ref);
    markReferralIntroSeen();
    navigate(loginPathWithRef(ref));
  };

  const handleStart = () => {
    localStorage.setItem('firstVisit', 'false');
    const ref = refCode || getReferralCode();
    if (ref) saveReferralCode(ref);
    markReferralIntroSeen();
    navigate(registerPathWithRef(ref));
  };

  const personas = [
    { icon: Trophy, title: 'محب الجوائز', desc: 'اربح سيارات، كاش، وجوائز حقيقية مع كل نقطة.', color: 'from-amber-500 to-orange-600' },
    { icon: ShoppingBag, title: 'محب التسوق', desc: 'تسوق من متاجر موثوقة مع توصيل وتجربة سلسة.', color: 'from-rose-500 to-red-600' },
    { icon: Percent, title: 'محب العروض', desc: 'اكتشف أفضل الخصومات قبل الجميع في مكان واحد.', color: 'from-violet-500 to-purple-700' },
    { icon: Users, title: 'تبيع أغراضك', desc: 'اعرض غراضك للبيع أو التبديل داخل سوق المستخدمين.', color: 'from-cyan-500 to-blue-600' },
    { icon: TrendingDown, title: 'تتابع الأسعار', desc: 'راقب العروض والمتاجر ولا تفوّت فرصة التوفير.', color: 'from-emerald-500 to-teal-600' },
  ];

  const pillars = [
    { icon: Tag, title: 'العروض', headline: 'كل العروض في مكان واحد', desc: 'تصفح عروض المطاعم، الأزياء، الإلكترونيات والمزيد — مرتّبة حسب اهتماماتك ومنطقتك.', accent: 'border-rose-500/30 bg-rose-500/10 text-rose-300', bar: 'bg-rose-500' },
    { icon: Truck, title: 'التسوق', headline: 'اشتري بثقة وسرعة', desc: 'اطلب من المتاجر مباشرة، تابع طلبك، واستمتع بتجربة تسوق حديثة من جوالك.', accent: 'border-orange-500/30 bg-orange-500/10 text-orange-300', bar: 'bg-orange-500' },
    { icon: ShoppingBag, title: 'سوق المستخدمين', headline: 'بيع · بدل · اعرض غراضك', desc: 'سوق مجتمعي يربط البائع بالمشتري — بيع أغراضك أو اكتشف صفقات مميزة.', accent: 'border-cyan-500/30 bg-cyan-500/10 text-cyan-300', bar: 'bg-cyan-500' },
    { icon: Medal, title: 'الجوائز', headline: 'مسابقات وعجلة ومسار إنجازات', desc: 'شارك في المسابقات، لف عجلة الحظ، وافتح جوائزك على مسار النقاط.', accent: 'border-amber-500/30 bg-amber-500/10 text-amber-300', bar: 'bg-amber-500' },
    { icon: Coins, title: 'النقاط', headline: 'كل تفاعل يقربك للفوز', desc: 'الشراء، الدعوات، الأكواد، والمشاركة — كلها تمنحك نقاطاً ترتقي بمستواك.', accent: 'border-violet-500/30 bg-violet-500/10 text-violet-300', bar: 'bg-violet-500' },
  ];

  const prizeHighlights = [
    { icon: '🚗', label: 'سيارات' },
    { icon: '🏠', label: 'جوائز عقارية' },
    { icon: '💵', label: 'كاش' },
    { icon: '📱', label: 'أجهزة ذكية' },
    { icon: '🎁', label: 'هدايا يومية' },
  ];

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#07070f] pb-36 font-['Cairo'] text-white" dir="rtl">
      <WelcomeBackground />

      <div className="relative z-20 flex items-center justify-between px-4 pt-5 sm:px-6">
        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 backdrop-blur-md">
          <Sparkles size={14} className="text-amber-300" />
          <span className="text-[11px] font-black">Win GoldenStore</span>
        </div>
        <button
          type="button"
          onClick={goToLogin}
          className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-black text-white/80 backdrop-blur-md transition hover:bg-white/10"
        >
          لدي حساب
        </button>
      </div>

      <div className="relative z-10 mx-auto max-w-2xl px-4 pt-4 sm:px-6">
        <IntroVideo />

        <motion.div variants={fadeUp} initial="hidden" animate="show" custom={1} className="mb-6 text-center">
          {refCode && (
            <span className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-amber-500/20 px-4 py-1.5 text-[10px] font-black text-amber-200 border border-amber-400/30">
              <Gift size={12} />
              دعوة من صديق — اكتشف المنصة ثم أنشئ حسابك
            </span>
          )}
          <span className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-red-600/15 px-4 py-1.5 text-[10px] font-black tracking-wide text-red-200">
            <Zap size={12} className="text-amber-300" />
            منصة تسويقية · جوائز · تسوق · مجتمع
          </span>
          <h1 className="text-3xl font-black leading-[1.15] sm:text-4xl">
            عروض حقيقية.
            <br />
            <span className="bg-gradient-to-l from-amber-300 via-white to-red-400 bg-clip-text text-transparent">
              تجربة تربحك أكثر.
            </span>
          </h1>
          <p className="mx-auto mt-4 max-w-md text-sm font-bold leading-relaxed text-white/55 sm:text-base">
            منصة واحدة تجمع أفضل العروض، التسوق الذكي، سوق المستخدمين، والجوائز — مصممة لتشعرك بالتقدم من أول دقيقة.
          </p>
        </motion.div>

        <HeroStats />

        <Section className="mb-12">
          <motion.div variants={fadeUp} custom={0} className="mb-3 flex items-end justify-between gap-2">
            <div>
              <h2 className="text-xl font-black sm:text-2xl">مناسبة لك — مهما كان هدفك</h2>
              <p className="text-xs font-bold text-white/45 sm:text-sm">اختر مسارك… المنصة تخدم الجميع.</p>
            </div>
            <span className="hidden shrink-0 items-center gap-1 text-[10px] font-bold text-white/35 sm:inline-flex">
              مرّر <ChevronRight size={12} className="animate-pulse" />
            </span>
          </motion.div>
          <HorizontalSwipe spaceBetween={12} className="pb-2">
            {personas.map((p, i) => (
              <motion.div
                key={p.title}
                variants={fadeUp}
                custom={i + 1}
                whileHover={{ y: -4 }}
                className="w-[72vw] max-w-[260px] shrink-0 rounded-[24px] border border-white/10 bg-white/[0.04] p-4 backdrop-blur-sm transition-shadow hover:border-white/20 hover:shadow-lg hover:shadow-red-500/10"
              >
                <div className={`mb-3 inline-flex rounded-2xl bg-gradient-to-br ${p.color} p-3 shadow-lg`}>
                  <p.icon size={22} />
                </div>
                <h3 className="font-black text-base">{p.title}</h3>
                <p className="mt-2 text-xs font-bold leading-relaxed text-white/50">{p.desc}</p>
              </motion.div>
            ))}
          </HorizontalSwipe>
          <p className="mt-2 flex items-center justify-center gap-1 text-[10px] font-bold text-white/30 sm:hidden">
            <ChevronRight size={12} className="animate-pulse" /> اسحب لرؤية المزيد
          </p>
        </Section>

        <Section className="mb-12 space-y-3">
          <motion.div variants={fadeUp} custom={0} className="mb-2">
            <h2 className="text-xl font-black sm:text-2xl">ماذا ستجد هنا؟</h2>
            <p className="text-xs font-bold text-white/45 sm:text-sm">كل ما تحتاجه — بأسلوب سريع ومحفّز.</p>
          </motion.div>
          {pillars.map((item, i) => (
            <motion.div
              key={item.title}
              variants={fadeUp}
              custom={i + 1}
              whileHover={{ scale: 1.01 }}
              className="relative overflow-hidden rounded-[24px] border border-white/10 bg-white/[0.04] p-5 backdrop-blur-sm"
            >
              <div className={`absolute right-0 top-0 h-full w-1 ${item.bar}`} />
              <div className="flex items-start gap-4 pr-2">
                <div className={`shrink-0 rounded-2xl border p-3 ${item.accent}`}>
                  <item.icon size={22} />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] font-black tracking-wider text-white/35">{item.title}</span>
                  <h3 className="mt-1 font-black text-lg">{item.headline}</h3>
                  <p className="mt-2 text-xs font-bold leading-relaxed text-white/50 sm:text-sm">{item.desc}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </Section>

        <Section className="mb-10">
          <motion.div
            variants={fadeUp}
            custom={0}
            className="overflow-hidden rounded-[28px] border border-amber-500/25 bg-gradient-to-br from-amber-500/10 via-red-600/10 to-violet-600/10 p-6"
          >
            <div className="mb-5 flex items-center gap-3">
              <div className="rounded-2xl bg-amber-400/20 p-3 text-amber-300">
                <Gift size={24} />
              </div>
              <div>
                <h2 className="text-xl font-black">جوائز تستحق المشاركة</h2>
                <p className="text-xs font-bold text-white/50">مسابقات · عجلة حظ · مسار إنجازات</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
              {prizeHighlights.map((p) => (
                <motion.div
                  key={p.label}
                  whileHover={{ scale: 1.05 }}
                  className="flex flex-col items-center gap-2 rounded-2xl border border-white/10 bg-black/20 px-2 py-4 text-center"
                >
                  <span className="text-2xl">{p.icon}</span>
                  <span className="text-[10px] font-black text-white/70">{p.label}</span>
                </motion.div>
              ))}
            </div>
            <div className="mt-5 flex flex-wrap items-center justify-center gap-4 text-[10px] font-black text-amber-200/80">
              <span className="inline-flex items-center gap-1"><Star size={12} fill="currentColor" /> نقاط تتراكم</span>
              <span className="inline-flex items-center gap-1"><CircleDot size={12} /> عجلة يومية</span>
              <span className="inline-flex items-center gap-1"><Sparkles size={12} /> مسار إنجازات</span>
            </div>
          </motion.div>
        </Section>

        <Section className="mb-8 text-center">
          <motion.p variants={fadeUp} custom={0} className="text-xs font-bold text-white/40">
            انضم الآن — مجاني · بدون التزام · جوائز داخل البلد
          </motion.p>
        </Section>
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-white/10 bg-[#07070f]/90 px-4 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] backdrop-blur-xl">
        <div className="mx-auto flex max-w-lg flex-col gap-2 sm:max-w-xl">
          <motion.button
            type="button"
            whileTap={{ scale: 0.98 }}
            onClick={handleStart}
            className="group relative w-full overflow-hidden rounded-[22px] bg-gradient-to-l from-red-600 via-red-500 to-amber-500 py-4 font-black text-white shadow-[0_12px_40px_rgba(220,38,38,0.45)]"
          >
            <span className="relative z-10 flex items-center justify-center gap-2 text-base sm:text-lg">
              ابدأ مجاناً — أنشئ حسابك
              <ChevronLeft size={20} className="transition group-hover:-translate-x-1" />
            </span>
          </motion.button>
          <button
            type="button"
            onClick={goToLogin}
            className="w-full py-2 text-center text-xs font-bold text-white/50 transition hover:text-white/80"
          >
            لدي حساب بالفعل — تسجيل الدخول
          </button>
        </div>
      </div>
    </div>
  );
};

export default Intro;
