import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  User, Mail, Phone, Lock,
  UserPlus, ArrowRight, Zap, AlertCircle
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import axios from '../api/axios';


const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    accountType: 'customer', // 🔥 مهم جداً
    activationCode: ''
  });

  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.email && !formData.phone) {
      setError("يجب إدخال البريد أو الهاتف");
      return;
    }

    setLoading(true);
    setError(null);

    try {
  const { data } = await axios.post('/auth/register', formData);

  // حفظ بيانات الجلسة
  localStorage.setItem("token", data.token);
  localStorage.setItem("user", JSON.stringify(data.user));

  // التوجيه حسب نوع الحساب
  switch (data.user.role) {
    case "store":
      navigate("/store", { replace: true });
      break;

    case "supplier":
      navigate("/supplier", { replace: true });
      break;

    default:
      navigate("/", { replace: true });
  }

} catch (err) {
  setError(err.response?.data?.message || "حدث خطأ أثناء إنشاء الحساب");
} finally {
      setLoading(false);
    }
  };

  return (
    
    <div className="min-h-screen bg-gray-50 flex flex-col pt-6 pb-20 px-6 font-almarai" dir="rtl">

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">

        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto shadow-lg">
            <UserPlus size={32} className="text-white" />
          </div>
          <h1 className="text-2xl font-black">انضم لعروض تك</h1>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 text-red-500 p-3 rounded-xl text-xs font-bold flex items-center gap-2">
            <AlertCircle size={14} /> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">

          {/* الاسم */}
          <div className="relative">
            <User className="absolute right-4 top-1/2 -translate-y-1/2" size={16} />
            <input
              name="name"
              type="text"
              placeholder="الاسم الكامل"
              className="w-full bg-white rounded-xl py-3 pr-11 text-xs"
              onChange={handleChange}
              required
            />
          </div>

          {/* البريد / الهاتف */}
          <div className="relative">
            <Mail className="absolute right-4 top-1/2 -translate-y-1/2" size={16} />
            <input
              name="email"
              type="email"
              placeholder="البريد الإلكتروني"
              className="w-full bg-white rounded-xl py-3 pr-11 text-xs"
              onChange={handleChange}
            />
          </div>

          <div className="relative">
            <Phone className="absolute right-4 top-1/2 -translate-y-1/2" size={16} />
            <input
              name="phone"
              type="tel"
              placeholder="رقم الهاتف"
              className="w-full bg-white rounded-xl py-3 pr-11 text-xs"
              onChange={handleChange}
            />
          </div>

          {/* كلمة المرور */}
          <div className="relative">
            <Lock className="absolute right-4 top-1/2 -translate-y-1/2" size={16} />
            <input
              name="password"
              type="password"
              placeholder="كلمة المرور"
              className="w-full bg-white rounded-xl py-3 pr-11 text-xs"
              onChange={handleChange}
              required
            />
          </div>

          {/* 🔥 نوع الحساب */}
          <select
            name="accountType"
            onChange={handleChange}
            className="w-full bg-white rounded-xl py-3 text-xs"
          >
            <option value="customer">عميل</option>
            <option value="store">متجر</option>
            <option value="supplier">مورد</option>
          </select>

          {/* 🔥 كود التفعيل يظهر فقط للمتجر والمورد */}
          {(formData.accountType === "store" || formData.accountType === "supplier") && (
            <div className="relative">
              <Zap className="absolute right-4 top-1/2 -translate-y-1/2 text-yellow-500" size={16} />
              <input
                name="activationCode"
                type="text"
                placeholder="كود التفعيل"
                className="w-full bg-white rounded-xl py-3 pr-11 text-xs"
                onChange={handleChange}
              />
            </div>
          )}

          {/* زر التسجيل */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-white py-4 rounded-xl font-bold text-sm"
          >
            {loading ? "جاري التسجيل..." : "إنشاء حساب"}
            <ArrowRight size={18} className="inline ml-2" />
          </button>

        </form>

        {/* login link */}
        <p className="text-center text-xs">
          لديك حساب؟ <Link to="/login" className="text-primary">تسجيل الدخول</Link>
        </p>

      </motion.div>
    </div>
  );
};

export default Register;