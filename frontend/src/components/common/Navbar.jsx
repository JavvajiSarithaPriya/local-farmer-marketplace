import { Link, useNavigate } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import VoiceGuidance from "../VoiceGuidance";
import "./Navbar.css";

const Navbar = () => {
  const { user, logout } = useAuth();
  const { language, changeLanguage, t } = useLanguage();
  const { getTotalItems } = useCart();
  const navigate = useNavigate();

  const handleNavigation = (pageName) => {
    if (window.voiceGuidance && window.voiceGuidance.isEnabled()) {
      window.voiceGuidance.announceNavigation(pageName);
    }
  };

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <Link to="/" className="nav-brand-link" onClick={() => handleNavigation(t("home"))}>
          🌾 {t("welcome")}
        </Link>
      </div>

      <div className="navbar-content">
        <div className="nav-links">
          <Link to="/" className="nav-link" onClick={() => handleNavigation(t("home"))}>{t("home")}</Link>

          {!user && (
            <>
              <Link to="/login" className="nav-link" onClick={() => handleNavigation(t("login"))}>{t("login")}</Link>
              <Link to="/register" className="nav-link" onClick={() => handleNavigation(t("register"))}>{t("register")}</Link>
            </>
          )}

          {user?.role === "FARMER" && (
            <>
              <Link to="/farmer-dashboard" className="nav-link" onClick={() => handleNavigation(t("dashboard"))}>{t("dashboard")}</Link>
              <Link to="/add-product" className="nav-link" onClick={() => handleNavigation(t("addProduct"))}>{t("addProduct")}</Link>
              <Link to="/my-products" className="nav-link" onClick={() => handleNavigation(t("myProducts"))}>{t("myProducts")}</Link>
              <Link to="/farmer-orders" className="nav-link" onClick={() => handleNavigation(t("orders"))}>{t("orders")}</Link>
              <Link to="/profile" className="nav-link">{t("profileTitle")}</Link>
            </>
          )}

          {user?.role === "BUYER" && (
            <>
              <Link to="/buyer-dashboard" className="nav-link" onClick={() => handleNavigation(t("dashboard"))}>{t("dashboard")}</Link>
              <Link to="/cart" className="nav-link cart-link" onClick={() => handleNavigation(t("cart"))}>
                🛒 {t("cart")}
                {getTotalItems() > 0 && <span className="cart-badge">{getTotalItems()}</span>}
              </Link>
              <Link to="/buyer-orders" className="nav-link" onClick={() => handleNavigation(t("myOrders"))}>{t("myOrders")}</Link>
              <Link to="/profile" className="nav-link">{t("profileTitle")}</Link>
            </>
          )}

          {user?.role === "ADMIN" && (
            <>
              <Link to="/admin-dashboard" className="nav-link" onClick={() => handleNavigation(t("dashboard"))}>{t("dashboard")}</Link>
            </>
          )}

          {user && (
            <button
              onClick={() => {
                if (window.voiceGuidance && window.voiceGuidance.isEnabled()) {
                  window.voiceGuidance.announceAction(t("logout"));
                }
                logout();
                setTimeout(() => navigate("/login"), 100);
              }}
              className="nav-logout-btn"
            >
              {t("logout")}
            </button>
          )}
        </div>

        <div className="navbar-actions">
          <div className="language-selector">
            <select 
              value={language} 
              onChange={(e) => changeLanguage(e.target.value)}
              className="language-select"
              title={t("language")}
            >
              <option value="en">English</option>
              <option value="te">తెలుగు</option>
              <option value="hi">हिंदी</option>
            </select>
          </div>

          <VoiceGuidance />
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
