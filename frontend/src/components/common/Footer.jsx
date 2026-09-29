import { Link } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext";
import { useAuth } from "../context/AuthContext";
import "./Footer.css";

const Footer = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="site-footer">
      <div className="footer-container">
        {/* Brand & Mission Section */}
        <div className="footer-section">
          <div className="footer-brand">
            <span>🌾</span>
            <span>{t("welcome")}</span>
          </div>
          <p className="footer-tagline">{t("footerTagline")}</p>
          <p className="footer-desc">{t("footerAbout")}</p>
        </div>

        {/* Navigation Links */}
        <div className="footer-section">
          <h4>{t("footerQuickLinks")}</h4>
          <ul className="footer-links">
            <li>
              <Link to="/" className="footer-link">
                {t("home")}
              </Link>
            </li>

            {!user && (
              <>
                <li>
                  <Link to="/login" className="footer-link">
                    {t("login")}
                  </Link>
                </li>
                <li>
                  <Link to="/register" className="footer-link">
                    {t("register")}
                  </Link>
                </li>
              </>
            )}

            {user?.role === "FARMER" && (
              <>
                <li>
                  <Link to="/farmer-dashboard" className="footer-link">
                    {t("dashboard")}
                  </Link>
                </li>
                <li>
                  <Link to="/my-products" className="footer-link">
                    {t("myProducts")}
                  </Link>
                </li>
                <li>
                  <Link to="/add-product" className="footer-link">
                    {t("addProduct")}
                  </Link>
                </li>
                <li>
                  <Link to="/farmer-orders" className="footer-link">
                    {t("orders")}
                  </Link>
                </li>
                <li>
                  <Link to="/profile" className="footer-link">
                    {t("profileTitle")}
                  </Link>
                </li>
              </>
            )}

            {user?.role === "BUYER" && (
              <>
                <li>
                  <Link to="/buyer-dashboard" className="footer-link">
                    {t("dashboard")}
                  </Link>
                </li>
                <li>
                  <Link to="/cart" className="footer-link">
                    {t("cart")}
                  </Link>
                </li>
                <li>
                  <Link to="/buyer-orders" className="footer-link">
                    {t("myOrders")}
                  </Link>
                </li>
                <li>
                  <Link to="/profile" className="footer-link">
                    {t("profileTitle")}
                  </Link>
                </li>
              </>
            )}

            {user?.role === "ADMIN" && (
              <>
                <li>
                  <Link to="/admin-dashboard" className="footer-link">
                    {t("dashboard")}
                  </Link>
                </li>
                <li>
                  <Link to="/profile" className="footer-link">
                    {t("profileTitle")}
                  </Link>
                </li>
              </>
            )}
          </ul>
        </div>

        {/* Multilingual & Platform Info */}
        <div className="footer-section">
          <h4>{t("footerLanguages")}</h4>
          <div className="footer-badges">
            <div className="footer-badge">
              <div style={{ marginBottom: "4px", fontWeight: "bold" }}>🌐 {t("language")}:</div>
              <div className="footer-lang-list">
                <span className="footer-lang-tag">English</span>
                <span className="footer-lang-tag">తెలుగు (Telugu)</span>
                <span className="footer-lang-tag">हिंदी (Hindi)</span>
              </div>
            </div>
            <div className="footer-badge">
              <span>🎙️ {t("footerVoiceEnabled")}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Bottom */}
      <div className="footer-bottom">
        <div>
          &copy; {currentYear} {t("welcome")}. {t("footerRights")}
        </div>
        <div>
          <span>{t("footerDirectTrade")}</span> • <span>Fair Market Initiative</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
