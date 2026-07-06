import React from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, Sparkles, Star } from 'lucide-react';

const particles = Array.from({ length: 18 }, (_, i) => ({
  id: i,
  x: (i * 17) % 100,
  delay: (i * 0.07) % 0.8,
  size: 6 + (i % 4) * 2,
  color: ['#fbbf24', '#ef4444', '#a78bfa', '#34d399', '#f472b6'][i % 5],
}));

const VerificationCelebration = ({ bonus = 5, onDone }) => {
  React.useEffect(() => {
    const t = setTimeout(() => onDone?.(), 3200);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div className="relative overflow-hidden py-6 text-center">
      {particles.map((p) => (
        <motion.span
          key={p.id}
          initial={{ opacity: 1, y: 0, x: `${p.x - 50}%`, scale: 0 }}
          animate={{ opacity: 0, y: -120 - (p.id % 3) * 30, scale: 1 }}
          transition={{ duration: 1.6, delay: p.delay, ease: 'easeOut' }}
          className="pointer-events-none absolute left-1/2 top-1/2 rounded-full"
          style={{ width: p.size, height: p.size, backgroundColor: p.color }}
        />
      ))}

      <motion.div
        initial={{ scale: 0, rotate: -20 }}
        animate={{ scale: [0, 1.15, 1], rotate: 0 }}
        transition={{ type: 'spring', damping: 10, stiffness: 180 }}
        className="relative mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-[24px] bg-gradient-to-br from-green-400 to-emerald-600 shadow-lg shadow-green-500/30"
      >
        <ShieldCheck size={40} className="text-white" />
      </motion.div>

      <motion.h4
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="text-2xl font-black text-gray-900"
      >
        مبروك! حسابك موثّق 🎉
      </motion.h4>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="mt-2 text-sm font-bold text-gray-500"
      >
        كل الميزات التفاعلية متاحة لك الآن — بدون إعادة تسجيل دخول
      </motion.p>

      {bonus > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.5, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ delay: 0.45, type: 'spring', stiffness: 260 }}
          className="mx-auto mt-5 inline-flex items-center gap-2 rounded-full bg-gradient-to-l from-amber-400 to-orange-500 px-6 py-3 text-white shadow-xl shadow-amber-500/30"
        >
          <motion.span
            animate={{ rotate: [0, 15, -15, 0], scale: [1, 1.2, 1] }}
            transition={{ repeat: 2, duration: 0.5, delay: 0.5 }}
          >
            <Sparkles size={22} />
          </motion.span>
          <span className="text-2xl font-black">+{bonus}</span>
          <span className="text-sm font-black">نقاط مجانية</span>
          <Star size={16} fill="currentColor" className="text-yellow-200" />
        </motion.div>
      )}

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.9 }}
        className="mt-4 text-xs font-black text-primary"
      >
        استمر — أنت على الطريق الصحيح للفوز! 🚀
      </motion.p>
    </div>
  );
};

export default VerificationCelebration;
