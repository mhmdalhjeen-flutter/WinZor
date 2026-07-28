import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, Copy } from 'lucide-react';
import { useToast } from '../../shared/Toast';
import { overlayFade } from '../../utils/motionPresets';

function CodeBlock({ entry, onCopy }) {
  return (
    <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-3.5">
      {entry.label && (
        <p className="mb-1.5 text-xs font-bold text-gray-500">{entry.label}</p>
      )}
      <div className="flex items-center gap-2">
        <p className="flex-1 text-center text-2xl font-black tracking-[0.2em] text-emerald-700">
          {entry.code}
        </p>
        <button
          type="button"
          onClick={() => onCopy(entry.code)}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-emerald-600 shadow-sm"
          aria-label="نسخ الرمز"
        >
          <Copy size={16} />
        </button>
      </div>
    </div>
  );
}

export default function OrderVerificationDialog({ open, codes = [], onClose }) {
  const { toast } = useToast();

  const copyCode = async (code) => {
    try {
      await navigator.clipboard.writeText(code);
      toast('تم نسخ الرمز', 'success');
    } catch {
      toast('تعذّر النسخ', 'error');
    }
  };

  if (!codes.length) return null;

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[250]" role="dialog" aria-modal="true" dir="rtl">
          <motion.button
            type="button"
            aria-label="إغلاق"
            className="absolute inset-0 bg-black/45 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={overlayFade}
            onClick={onClose}
          />
          <motion.div
            className="absolute left-4 right-4 top-1/2 mx-auto max-w-md -translate-y-1/2 rounded-3xl bg-white p-5 shadow-2xl"
            initial={{ opacity: 0, scale: 0.94, y: '-42%' }}
            animate={{ opacity: 1, scale: 1, y: '-50%' }}
            exit={{ opacity: 0, scale: 0.94, y: '-42%' }}
          >
            <div className="mb-4 flex items-center gap-2">
              <ShieldCheck size={22} className="text-emerald-600" />
              <h2 className="text-base font-black text-gray-900">رمز التحقق الخاص</h2>
            </div>

            <div className="space-y-3 text-sm">
              <p className="text-gray-500">
                Your private order verification code is:
              </p>
              <p className="font-black text-gray-800">
                رمز التحقق الخاص بطلبك هو:
              </p>

              <div className="space-y-2.5">
                {codes.map((entry) => (
                  <CodeBlock key={`${entry.label}-${entry.code}`} entry={entry} onCopy={copyCode} />
                ))}
              </div>

              <div className="rounded-xl bg-gray-50 p-3 text-xs leading-relaxed text-gray-500">
                <p>Keep this code safe.</p>
                <p>Do not share it with anyone.</p>
                <p>You will need this code only when receiving your order.</p>
              </div>
              <div className="rounded-xl border border-gray-100 p-3 text-xs font-bold leading-relaxed text-gray-700">
                <p>احتفظ بهذا الرمز بأمان.</p>
                <p>لا تشاركه مع أحد.</p>
                <p>ستحتاج هذا الرمز فقط عند استلام طلبك.</p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="mt-5 w-full rounded-2xl bg-emerald-600 py-3 text-sm font-black text-white"
            >
              فهمت
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
