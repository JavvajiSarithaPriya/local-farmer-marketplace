import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { authAPI } from "../components/services/api";
import { useLanguage } from "../components/context/LanguageContext";
import { useNotification } from "../components/context/NotificationContext";
import "./auth.css";

const Register = () => {
  const { t } = useLanguage();
  const { showModal } = useNotification();
  const [formData, setFormData] = useState({
    fullName: "",
    mobileNumber: "",
    email: "",
    password: "",
    role: "FARMER",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  // registration does not authenticate; login handled separately
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.fullName || !formData.mobileNumber || !formData.password) {
      setError(t("registrationRequiredFields"));
      return;
    }

    if (formData.password.length < 6) {
      setError(t("passwordMinLength"));
      return;
    }

    setLoading(true);
    try {
      // Auto-generate PIN from first 4 digits of password (if all digits exist)
      const passwordDigits = formData.password.replace(/\D/g, "").slice(0, 4);
      const pin = passwordDigits.length === 4 ? passwordDigits : "0000"; // Default to 0000 if not enough digits
      
      const registrationData = {
        ...formData,
        pin,
      };

      await authAPI.register(registrationData);
      setError("");
      setSuccess(t("registrationSuccess"));

      showModal({
        type: "success",
        title: t("registrationSuccess") || "Registration Successful",
        message: "Your account has been created. Redirecting to login...",
        confirmText: t("login") || "Proceed to Login",
        onConfirm: () => navigate("/login", { replace: true }),
        onClose: () => navigate("/login", { replace: true }),
        autoCloseMs: 1500,
      });

      setTimeout(() => {
        navigate("/login", { replace: true });
      }, 1500);
    } catch (err) {
      setError(err.message || t("registrationFailed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-form">
        <h2>{t("registerTitle")}</h2>
        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="fullName">{t("name")}</label>
            <input
              type="text"
              id="fullName"
              name="fullName"
              placeholder={t("namePlaceholder")}
              value={formData.fullName}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="mobileNumber">{t("mobileNumber")}</label>
            <input
              type="tel"
              id="mobileNumber"
              name="mobileNumber"
              placeholder={t("mobilePlaceholder")}
              value={formData.mobileNumber}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">{t("email")}</label>
            <input
              type="email"
              id="email"
              name="email"
              placeholder={t("emailPlaceholder")}
              value={formData.email}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">{t("password")}</label>
            <input
              type="password"
              id="password"
              name="password"
              placeholder={t("passwordPlaceholder")}
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="role">{t("role")}</label>
            <select 
              id="role"
              name="role" 
              value={formData.role} 
              onChange={handleChange}
            >
              <option value="FARMER">{t("farmer")}</option>
              <option value="BUYER">{t("buyer")}</option>
            </select>
          </div>

          <button type="submit" disabled={loading}>
            {loading ? t("registrationLoading") : t("registerBtn")}
          </button>
        </form>

        <p style={{ marginTop: "20px", textAlign: "center" }}>
          {t("alreadyHaveAccount")} <a href="/login">{t("loginHere")}</a>
        </p>
      </div>
    </div>
  );
};

export default Register;
