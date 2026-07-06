import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Gift } from 'lucide-react';

const GiftModal = ({ isOpen, onClose }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          
          <motion.div 
            initial={{ scale: 0.5, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.5, opacity: 0, y: 20 }}
            className="relative bg-white rounded-[40px] p-8 w-full max-w-sm overflow-hidden shadow-2xl text-center"
          >
            {/* زخرفة خلفية */}
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-yellow-400 via-primary to-yellow-400"></div>
            
            <button onClick={onClose} className="absolute top-4 right-4 p-2 text-gray-400 hover:bg-gray-100 rounded-full transition-colors">
              <X size={20} />
            </button>

            <div className="mt-4 flex flex-col items-center">
              <div className="w-24 h-24 bg-yellow-100 rounded-full flex items-center justify-center mb-6 relative">
                <Gift className="text-yellow-500 w-12 h-12" />
                <motion.div 
                  animate={{ scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  className="absolute -top-2 -right-2 bg-primary text-white p-2 rounded-full shadow-lg"
                >
                  <Sparkles size={16} />
                </motion.div>
              </div>

              <h2 className="text-2xl font-black text-gray-900 mb-2">هدية اليوم! 🎁</h2>
              <p className="text-gray-500 font-bold text-sm mb-6 leading-relaxed">
                بناءً على اتفاقيتنا مع <span className="text-primary">مطعم الطابون</span>، حصلت على:
              </p>

              <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-3xl p-6 w-full mb-6">
                <p className="text-primary text-xl font-black italic tracking-tighter">كوبون خصم 20%</p>
                <p className="text-[10px] text-gray-400 mt-2 font-bold">صالح للاستخدام لمرة واحدة فقط</p>
              </div>

              <button 
                onClick={onClose}
                className="w-full btn-primary shadow-lg shadow-primary/30"
              >
                إضافة للمحفظة
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default GiftModal;
