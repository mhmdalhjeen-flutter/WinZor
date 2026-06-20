import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Mail, Phone, Lock, UserPlus, ArrowRight, Zap, AlertCircle } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import axios from '../api/axios';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    referralCode: ''
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // التحقق من وجود إيميل أو هاتف على الأقل (عقدة التسجيل المرن)
    if (!formData.email && !formData.phone) {
      setError("يجب إدخال البريد الإلكتروني أو رقم الهاتف لإنشاء الحساب");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await axios.post('/auth/register', formData);
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.message || "حدث خطأ أثناء إنشاء الحساب");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col pt-6 pb-20 px-6 font-almarai" dir="rtl">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        <div className="text-center space-y-2">
          <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-primary/20 mb-2">
            <UserPlus size={32} className="text-white" />
          </div>
          <h1 className="text-2xl font-black text-gray-900">انضم لعروض تك</h1>
          <p className="text-xs text-gray-400 font-bold">اكسب الجوائز وتواصل مع متاجرك المفضلة</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-500 p-3 rounded-xl text-[10px] font-bold border border-red-100 flex items-center gap-2 animate-shake">
             <AlertCircle size={14} /> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1">
            <label className="text-[10px] font-black text-gray-400 mr-2">الاسم الكامل</label>
            <div className="relative">
              <User className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300" size={16} />
              <input 
                name="name" type="text" required
                placeholder="مثلاً: محمد علي" 
                className="w-full bg-white border border-gray-100 rounded-xl py-3.5 pr-11 pl-4 text-xs focus:outline-none focus:border-primary shadow-sm transition-all"
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="bg-gray-100/50 p-4 rounded-2xl space-y-3 border border-gray-100">
            <p className="text-[9px] font-black text-primary text-center uppercase tracking-widest italic">يجب إدخال أحد الخيارين التاليين</p>
            
            <div className="relative">
              <Mail className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300" size={16} />
              <input 
                name="email" type="email" 
                placeholder="البريد الإلكتروني (يفضل)" 
                className="w-full bg-white border border-gray-100 rounded-xl py-3.5 pr-11 pl-4 text-xs focus:outline-none focus:border-primary shadow-sm transition-all"
                onChange={handleChange}
              />
            </div>

            <div className="relative text-center">
              <span className="text-[9px] font-bold text-gray-300 bg-gray-50 px-2 relative z-10">أو</span>
              <div className="absolute top-1/2 left-0 w-full h-[1px] bg-gray-200 -z-0"></div>
            </div>

            <div className="relative">
              <Phone className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300" size={16} />
              <input 
                name="phone" type="tel" 
                placeholder="رقم الهاتف" 
                className="w-full bg-white border border-gray-100 rounded-xl py-3.5 pr-11 pl-4 text-xs focus:outline-none focus:border-primary shadow-sm transition-all"
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="relative pt-2">
            <Lock className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300" size={16} />
            <input 
              name="password" type="password" required
              placeholder="كلمة المرور (6 أحرف على الأقل)" 
              className="w-full bg-white border border-gray-100 rounded-xl py-3.5 pr-11 pl-4 text-xs focus:outline-none focus:border-primary shadow-sm transition-all"
              onChange={handleChange}
            />
          </div>

          <div className="relative">
            <Zap className="absolute right-4 top-1/2 -translate-y-1/2 text-yellow-500" size={16} />
            <input 
              name="referralCode" type="text" 
              placeholder="كود دعوة صديق (للحصول على طاقة)" 
              className="w-full bg-white border border-yellow-100 rounded-xl py-3.5 pr-11 pl-4 text-xs focus:outline-none focus:border-yellow-500 shadow-sm transition-all"
              onChange={handleChange}
            />
          </div>

          <button 
            type="submit" disabled={loading}
            className="w-full bg-primary hover:bg-red-700 text-white py-4 rounded-xl font-black text-sm shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-2 mt-4"
          >
            {loading ? "جاري المعالجة..." : "ابدأ رحلة الربح الآن"}
            <ArrowRight size={18} />
          </button>
        </form>

        <p className="text-center text-[11px] text-gray-400 font-bold">
          لديك حساب؟ <Link to="/login" className="text-primary hover:underline">سجل دخولك من هنا</Link>
        </p>
      </motion.div>
    </div>
  );
};

export default Register;
