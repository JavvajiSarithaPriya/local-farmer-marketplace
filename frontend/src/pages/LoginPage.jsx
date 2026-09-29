import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../components/context/AuthContext";
import { useLanguage } from "../components/context/LanguageContext";
import { useNotification } from "../components/context/NotificationContext";
import { authAPI } from "../components/services/api";
import "./auth.css";

const LoginPage = () => {
  const { t } = useLanguage();
  // EMERGENCY: Clear any corrupted localStorage on page load
  useEffect(() => {
    try {
      const saved = localStorage.getItem("user");
      if (saved) {
        try {
          JSON.parse(saved);
        } catch {
          console.warn("⚠️ Corrupted localStorage detected, clearing...");
          localStorage.removeItem("user");
        }
      }
    } catch (err) {
      console.error("Error checking localStorage:", err);
    }
  }, []);

  const [credentials, setCredentials] = useState({
    mobileNumber: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const { showModal } = useNotification();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCredentials((prev) => ({
      ...prev,
      [name]: value,
    }));
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!credentials.mobileNumber || !credentials.password) {
      setError(t("loginRequiredFields"));
      return;
    }

    setLoading(true);
    try {
      const response = await authAPI.login(credentials);
      
      login(response);
      
      const navigateToDashboard = () => {
        if (response.role === "FARMER") {
          navigate("/farmer-dashboard");
        } else if (response.role === "BUYER") {
          navigate("/buyer-dashboard");
        } else if (response.role === "ADMIN") {
          navigate("/admin-dashboard");
        } else {
          navigate("/");
        }
      };

      showModal({
        type: "success",
        title: t("loginSuccess") || "Login Successful",
        message: `${response.fullName ? `Welcome back, ${response.fullName}!` : ""}`,
        confirmText: "Continue",
        onConfirm: navigateToDashboard,
        onClose: navigateToDashboard,
        autoCloseMs: 1200,
      });
    } catch (err) {
      setError(err.message || t("loginFailed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-form">
        <h2>{t("loginTitle")}</h2>
        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="mobileNumber">{t("mobileNumber")}</label>
            <input
              type="tel"
              id="mobileNumber"
              name="mobileNumber"
              placeholder={t("mobilePlaceholder")}
              value={credentials.mobileNumber}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">{t("password")}</label>
            <input
              type="password"
              id="password"
              name="password"
              placeholder={t("passwordPlaceholder")}
              value={credentials.password}
              onChange={handleChange}
              required
            />
          </div>

          <button type="submit" disabled={loading}>
            {loading ? t("loginLoading") : t("loginBtn")}
          </button>
        </form>

        <p className="auth-link">
          {t("dontHaveAccount")} <a href="/register">{t("register")}</a>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
