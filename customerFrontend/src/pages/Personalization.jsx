import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, CheckCircle2, ArrowRight, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import api from '../api/axios';
import { useCategoryTree } from '../hooks/useCategories';
import { flattenCategoryTree } from '../utils/categoryTree';

const Personalization = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [selectedInterests, setSelectedInterests] = useState([]);
  const [location, setLocation] = useState('');

  const { data: storeCategories = [], isLoading: catsLoading } = useCategoryTree('store');
  const interestOptions = flattenCategoryTree(storeCategories);

  const { data: regions = [], isLoading: regionsLoading } = useQuery({
    queryKey: ['regions'],
    queryFn: async () => (await api.get('/regions')).data || [],
    staleTime: 60 * 1000,
  });

  const toggleInterest = (name) => {
    setSelectedInterests((prev) =>
      prev.includes(name) ? prev.filter((i) => i !== name) : [...prev, name]
    );
  };

  const handleComplete = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-white px-6 py-12 text-right font-['Cairo']" dir="rtl">
      <AnimatePresence mode="wait">

        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-8"
          >
            <div className="space-y-2">
              <h1 className="text-3xl font-black text-gray-900">أين يتواجد افضل العروض 📍</h1>
              <p className="text-gray-500 font-bold">حدد منطقتك لنعرض لك العروض الأقرب إليك فوراً.</p>
            </div>

            {regionsLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="animate-spin text-primary" size={28} />
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {regions.map((r) => (
                  <button
                    key={r._id}
                    type="button"
                    onClick={() => setLocation(r.name)}
                    className={`py-4 rounded-[24px] font-black transition-all border-2 ${
                      location === r.name
                        ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20'
                        : 'bg-gray-50 border-transparent text-gray-500'
                    }`}
                  >
                    {r.name}
                  </button>
                ))}
              </div>
            )}

            <button
              type="button"
              disabled={!location}
              onClick={() => setStep(2)}
              className="w-full bg-primary text-white py-5 rounded-[24px] font-black text-lg shadow-xl shadow-primary/30 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              التالي <ArrowRight size={20} />
            </button>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-8"
          >
            <div className="space-y-2">
              <h1 className="text-3xl font-black text-gray-900">ما الذي يسعدك؟ ❤️</h1>
              <p className="text-gray-500 font-bold">اختر تصنيفات العروض التي تهمك — من لوحة الأدمن مباشرة.</p>
            </div>

            {catsLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="animate-spin text-primary" size={28} />
              </div>
            ) : (
              <div className="flex flex-wrap gap-3">
                {interestOptions.map((cat) => (
                  <button
                    key={cat._id}
                    type="button"
                    onClick={() => toggleInterest(cat.name)}
                    className={`px-6 py-3 rounded-full font-black transition-all border-2 ${
                      selectedInterests.includes(cat.name)
                        ? 'bg-primary border-primary text-white'
                        : 'bg-white border-gray-100 text-gray-400'
                    }`}
                  >
                    {cat.icon ? `${cat.icon} ` : ''}{cat.name}
                  </button>
                ))}
                {interestOptions.length === 0 && (
                  <p className="text-sm text-gray-400">لا توجد تصنيفات بعد — سيضيفها الأدمن قريباً</p>
                )}
              </div>
            )}

            <button
              type="button"
              disabled={selectedInterests.length === 0}
              onClick={handleComplete}
              className="w-full bg-primary text-white py-5 rounded-[24px] font-black text-lg shadow-xl shadow-primary/30 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              اكشف الجوائز الآن <Sparkles size={20} />
            </button>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center py-20 text-center space-y-6"
          >
            <div className="bg-green-100 p-6 rounded-[40px] text-green-600">
              <CheckCircle2 size={64} />
            </div>
            <h2 className="text-3xl font-black text-gray-900">تم التخصيص بنجاح!</h2>
            <p className="text-gray-500 font-bold italic">
              مبروك! حصلت على <span className="text-primary">+5 نقاط</span> هدية لتحديث بياناتك 💎
            </p>
            <div className="flex gap-1">
              {[1, 2, 3].map((i) => (
                <div key={i} className="w-2 h-2 bg-primary rounded-full animate-pulse" />
              ))}
            </div>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
};

export default Personalization;
