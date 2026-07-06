import React from 'react';
import { motion } from 'framer-motion';
import { ShieldAlert, ChevronLeft } from 'lucide-react';
import { useVerificationGate } from '../context/VerificationGateContext';

const VerifyBanner = () => {
  const { verified, openVerificationPrompt } = useVerificationGate();

  if (verified) return null;

  return (
    <motion.button
      type="button"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={() => openVerificationPrompt()}
      className="mb-4 flex w-full items-center justify-between gap-3 rounded-2xl bg-gradient-to-l from-amber-500 to-orange-500 px-4 py-3 text-sm font-black text-white shadow-lg"
    >
      <span className="flex items-center gap-2">
        <ShieldAlert size={18} />
        وثّق حسابك واربح 5 نقاط — افتح كل الميزات
      </span>
      <ChevronLeft size={18} />
    </motion.button>
  );
};

export default VerifyBanner;
