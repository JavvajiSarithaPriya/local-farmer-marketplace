import React from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../components/context/LanguageContext";
import "./home.css";

const HomePage = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();

  return (
    <div className="home-container">
      <div className="home-content">
        <h1 className="home-title">{t("welcome")}</h1>
        <p className="home-subtitle">{t("subtitle")}</p>
        
        <div className="home-buttons">
          <button 
            className="btn-home btn-primary"
            onClick={() => navigate("/register")}
          >
            {t("register")}
          </button>
          <button 
            className="btn-home btn-secondary"
            onClick={() => navigate("/login")}
          >
            {t("login")}
          </button>
        </div>

        <div className="home-features">
          <h2>{t("features")}</h2>
          <div className="features-grid">
            <div className="feature-card">
              <span className="feature-icon">🚜</span>
              <h3>{t("forFarmers")}</h3>
              <p>{t("farmersDesc")}</p>
            </div>
            <div className="feature-card">
              <span className="feature-icon">🛒</span>
              <h3>{t("forBuyers")}</h3>
              <p>{t("buyersDesc")}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
