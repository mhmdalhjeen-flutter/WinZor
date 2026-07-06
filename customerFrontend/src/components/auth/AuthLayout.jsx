import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';

const AuthLayout = ({ title, subtitle, children, footer }) => (
  <div className="min-h-screen bg-[#050508] text-white font-['Cairo'] overflow-hidden" dir="rtl">
    <div className="fixed inset-0 pointer-events-none">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/20 blur-[120px] rounded-full" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-orange-500/15 blur-[100px] rounded-full" />
    </div>

    <div className="relative z-10 min-h-screen flex flex-col px-4 py-8 max-w-md mx-auto">
      <Link to="/intro" className="flex items-center gap-2 text-white/60 text-xs font-bold mb-8">
        <Sparkles size={14} className="text-amber-400" /> عروض تك
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex-1 flex flex-col"
      >
        <div className="text-center mb-8 space-y-2">
          <h1 className="text-3xl font-black">{title}</h1>
          {subtitle && <p className="text-sm text-white/50 font-bold px-4">{subtitle}</p>}
        </div>

        <div className="bg-white/[0.06] backdrop-blur-xl border border-white/10 rounded-[32px] p-6 shadow-2xl">
          {children}
        </div>

        {footer && <div className="mt-6 text-center text-sm text-white/50 font-bold">{footer}</div>}
      </motion.div>
    </div>
  </div>
);

export default AuthLayout;
