import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "../api/axios";
import { Mail, Lock, ArrowRight, Loader2 } from "lucide-react";
import "../style/Login.css"
const Login = () => {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const navigate = useNavigate();

  // لو مسجل دخول مسبقاً
  useEffect(() => {
    const token = localStorage.getItem("token");
    const user = JSON.parse(localStorage.getItem("user") || "null");

    if (token && user?.role) {
      redirectByRole(user.role);
    }
  }, []);

  const redirectByRole = (role) => {
    switch (role) {
      case "admin":
        navigate("/admin");
        break;
      case "store":
        navigate("/store");
        break;
      case "supplier":
        navigate("/supplier");
        break;
      default:
        navigate("/");
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const { data } = await axios.post("/api/auth/login", {
        identifier,
        password,
      });

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      redirectByRole(data.user.role);
    } catch (err) {
      setError(err.response?.data?.message || "خطأ في تسجيل الدخول");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">

        <div className="login-header">
          <h1>مرحباً بك 👋</h1>
          <p>سجل دخولك للمتابعة</p>
        </div>

        <form onSubmit={handleLogin} className="login-form">

          {error && <div className="error-box">{error}</div>}

          <div className="input-box">
            <Mail className="icon" />
            <input
              type="text"
              placeholder="البريد أو الهاتف"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              required
            />
          </div>

          <div className="input-box">
            <Lock className="icon" />
            <input
              type="password"
              placeholder="كلمة المرور"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button disabled={loading} className="btn">
            {loading ? <Loader2 className="spin" /> : "تسجيل الدخول"}
            {!loading && <ArrowRight />}
          </button>

        </form>

        <p className="link">
          لا تملك حساب؟ <Link to="/register">إنشاء حساب</Link>
        </p>

      </div>
    </div>
  );
};

export default Login;