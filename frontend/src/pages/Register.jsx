import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  User,
  Mail,
  Phone,
  Lock,
  UserPlus,
  ArrowRight,
  Zap,
  AlertCircle,
  Store,
  Warehouse
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import axios from '../api/axios';
import { useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";



const Register = () => {
  const [formData, setFormData] = useState({
      name: "",
      email: "",
      phone: "",
      password: "",
    });

  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };
  const { login } = useAuth();

 useEffect(() => {
  if (window.google && !window.googleInitDone) {
    window.googleInitDone = true;

    window.google.accounts.id.initialize({
      client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
      callback: handleGoogleRegister,
    });

    window.google.accounts.id.renderButton(
      document.getElementById("googleBtn"),
      {
        theme: "outline",
        size: "large",
      }
    );
  }
}, []);
  const handleGoogleRegister = async (response) => {
  try {
    const { data } = await axios.post("/auth/google", {
      credential: response.credential,
    });
    login(data.user, data.token);

    navigate("/", { replace: true });

  } catch (err) {
    setError("فشل التسجيل عبر Google");
  }
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
    const { data } = await axios.post("/auth/register", formData);

    // حفظ الجلسة
    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));

    // تسجيل الدخول في السياق
    login(data.user, data.token);

    // توجيه الزبون فقط
    navigate("/", { replace: true });

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
        {/* <div className="grid grid-cols-3 gap-3">
  {accountTypes.map((type) => {
    const Icon = type.icon;

    return (
      <button
        key={type.id}
        type="button"
        onClick={() =>
          setFormData({
            ...formData,
            accountType: type.id
          })
        }
        className={`p-4 rounded-2xl border transition-all flex flex-col items-center gap-2 ${
          formData.accountType === type.id
            ? "bg-primary text-white border-primary shadow-lg"
            : "bg-white text-gray-600 border-gray-200"
        }`}
      >
        <Icon size={22} />

        <span className="text-xs font-bold">
          {type.label}
        </span>
      </button>
    );
  })}
</div> */}

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


          {/* {formData.accountType !== "customer" && (
  <>
    <div className="relative">
      <Store className="absolute right-4 top-1/2 -translate-y-1/2" size={16} />

      <input
        name="businessName"
        type="text"
        placeholder={
          formData.accountType === "store"
            ? "اسم المتجر"
            : "اسم المستودع"
        }
        className="w-full bg-white rounded-xl py-3 pr-11 text-xs"
        onChange={handleChange}
        required
      />
    </div>

    <select
      name="region"
      className="w-full bg-white rounded-xl py-3 px-4 text-xs"
      onChange={handleChange}
      required
    >
      <option value="">اختر المنطقة</option>
      <option value="الرياض">الرياض</option>
      <option value="جدة">جدة</option>
    </select>

    <select
      name="subRegion"
      className="w-full bg-white rounded-xl py-3 px-4 text-xs"
      onChange={handleChange}
      required
    >
      <option value="">اختر المنطقة الفرعية</option>
    </select>

    <select
      name="businessType"
      className="w-full bg-white rounded-xl py-3 px-4 text-xs"
      onChange={handleChange}
      required
    >
      <option value="">
        {formData.accountType === "store"
          ? "نوع المتجر"
          : "نوع المستودع"}
      </option>
    </select>
  </>
)} */}

          {/* 🔥 كود التفعيل يظهر فقط للمتجر والمورد */}
          {/* {(formData.accountType === "store" || formData.accountType === "supplier") && (
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
          )} */}

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
        <div id="googleBtn"></div>

        {/* login link */}
        <p className="text-center text-xs">
          لديك حساب؟ <Link to="/login" className="text-primary">تسجيل الدخول</Link>
        </p>

      </motion.div>
    </div>
  );
};

export default Register;