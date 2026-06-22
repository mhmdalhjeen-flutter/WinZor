import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "../api/axios";
import { Mail, Lock, ArrowRight, Loader2 } from "lucide-react";
import "../style/Login.css";
import { useAuth } from "../context/AuthContext";

const Login = () => {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const navigate = useNavigate();
  const { login } = useAuth(); // ✅ هنا الصح

useEffect(() => {
  try {
    const token = localStorage.getItem("token");
    const user = JSON.parse(localStorage.getItem("user") || "null");
    if (token && user?.role) {
      redirectByRole(user.role);
    }
  } catch (e) {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
  }
}, []);
 const handleGoogleLogin = async (response) => {
  try {
    const { data } = await axios.post("/auth/google", {
      credential: response.credential,
    });

    login(data.user, data.token);
    redirectByRole(data.user.role);

  } catch (err) {
    setError("فشل تسجيل الدخول عبر Google");
  }
};

useEffect(() => {
  window.google?.accounts.id.initialize({
  client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
  callback: handleGoogleLogin,
});

  window.google?.accounts.id.renderButton(
    document.getElementById("googleBtn"),
    { theme: "outline", size: "large" }
  );
}, []);

  const redirectByRole = (role) => {
  const routes = {
    admin: "/admin",
    store: "/store-dashboard",
    supplier: "/supplier-dashboard",
    customer: "/"
  };

  navigate(routes[role] || "/");
};

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const { data } = await axios.post("/auth/login", {
        identifier: identifier.trim(),
        password,
      });

      // ✅ تخزين عبر AuthContext (احترافي)
      login(data.user, data.token);

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
              value={password ?? ""}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button disabled={loading} className="btn">
            {loading ? <Loader2 className="spin" /> : "تسجيل الدخول"}
            {!loading && <ArrowRight />}
          </button>

          <div id="googleBtn"></div>
          

        </form>

        <p className="link">
          لا تملك حساب؟ <Link to="/register">إنشاء حساب</Link>
        </p>

      </div>
    </div>
  );
};

export default Login;