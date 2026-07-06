import React, { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertCircle, Info } from 'lucide-react';

const ToastContext = createContext({ toast: () => {} });

export const useToast = () => useContext(ToastContext);

const icons = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info,
};

export const ToastProvider = ({ children }) => {
  const [items, setItems] = useState([]);

  const toast = useCallback((message, type = 'success') => {
    const id = Date.now();
    setItems((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setItems((prev) => prev.filter((t) => t.id !== id)), 3200);
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 w-[90%] max-w-sm pointer-events-none" dir="rtl">
        <AnimatePresence>
          {items.map((t) => {
            const Icon = icons[t.type] || Info;
            return (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, y: -12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className={`flex items-center gap-2 px-4 py-3 rounded-2xl shadow-xl text-white text-sm font-bold ${
                  t.type === 'success' ? 'bg-green-600' : t.type === 'error' ? 'bg-red-600' : 'bg-gray-800'
                }`}
              >
                <Icon size={18} />
                {t.message}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};

export default ToastProvider;
