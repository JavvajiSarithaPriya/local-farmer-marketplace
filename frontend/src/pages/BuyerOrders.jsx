import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../components/context/AuthContext";
import { useLanguage } from "../components/context/LanguageContext";
import { useNotification } from "../components/context/NotificationContext";
import { orderAPI, feedbackAPI } from "../components/services/api";
import FeedbackModal from "../components/common/FeedbackModal";
import "./dashboard.css";

const STATUS_STEPS = ["PENDING", "ACCEPTED", "PACKED", "SHIPPED", "DELIVERED"];

const BuyerOrders = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { showModal } = useNotification();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [myFeedbacks, setMyFeedbacks] = useState({});
  const [feedbackOrder, setFeedbackOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) { navigate("/login"); return; }
    loadOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const loadOrders = async () => {
    if (!user || user.role !== "BUYER") return;
    setLoading(true);
    setError("");
    try {
      const fetched = await orderAPI.getByBuyer(user.id);
      setOrders(fetched.map(o => ({
        id: o.id,
        productName: o.product?.name || t("unknown"),
        farmerName: o.product?.farmer?.fullName || t("unknown"),
        quantity: o.quantity,
        totalPrice: o.totalPrice,
        status: o.status || "PENDING",
        date: o.createdAt ? new Date(o.createdAt).toLocaleDateString() : "",
      })));

      try {
        const feedbacks = await feedbackAPI.getMyFeedback();
        const map = {};
        if (Array.isArray(feedbacks)) {
          feedbacks.forEach(f => {
            if (f && f.orderId) map[f.orderId] = f;
          });
        }
        setMyFeedbacks(map);
      } catch (fbErr) {
        console.warn("Could not load feedbacks:", fbErr);
      }
    } catch {
      setError(t("failedLoadOrders") || "Failed to load orders.");
    } finally {
      setLoading(false);
    }
  };

  const getStepIndex = (status) => STATUS_STEPS.indexOf(status);

  const handleCancelOrder = (orderId) => {
    showModal({
      type: "warning",
      title: t("confirmCancelOrderTitle") || "Cancel Order",
      message: t("confirmCancelOrder") || `Are you sure you want to cancel Order #${orderId}?`,
      confirmText: "Cancel Order",
      cancelText: "Keep Order",
      onConfirm: async () => {
        try {
          await orderAPI.cancel(orderId, user.id);
          showModal({
            type: "success",
            title: t("orderCancelled") || "Order Cancelled",
            message: `Order #${orderId} was cancelled successfully.`,
            autoCloseMs: 1500,
          });
          await loadOrders();
        } catch (err) {
          showModal({
            type: "error",
            title: t("failedCancelOrder") || "Failed to Cancel Order",
            message: err.message || "An error occurred while cancelling the order.",
          });
        }
      }
    });
  };

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="header-content">
          <h1>📋 {t("myOrders")}</h1>
          <button className="btn-secondary" onClick={() => navigate("/buyer-dashboard")}>
            ← {t("browseProducts")}
          </button>
        </div>
      </header>

      <main className="dashboard-main">
        <div className="content-section">
          {loading && <p style={{ color: "#536b56", textAlign: "center", padding: "20px" }}>{t("loading")}</p>}
          {error && (
            <div style={{
              backgroundColor: "#fef2f2",
              border: "1px solid #fecaca",
              color: "#dc2626",
              padding: "12px 16px",
              borderRadius: "8px",
              marginBottom: "16px"
            }}>
              {error}
            </div>
          )}
          {!loading && orders.length === 0 && (
            <div className="empty-state">
              <p>{t("noOrdersPlacedYet")}</p>
              <button className="btn-primary" onClick={() => navigate("/buyer-dashboard")}>
                {t("browseProducts")}
              </button>
            </div>
          )}

          {orders.map(o => (
            <div
              key={o.id}
              style={{
                border: "1px solid #e2ede3",
                borderRadius: "12px",
                padding: "20px",
                marginBottom: "16px",
                background: "#ffffff",
                boxShadow: "0 2px 8px rgba(20, 45, 23, 0.04)"
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "10px" }}>
                <div>
                  <p style={{ margin: "0 0 6px", fontWeight: "700", fontSize: "17px", color: "#14371f" }}>
                    {t("orderId")} #{o.id} — <span style={{ color: "#2e7d32" }}>{o.productName}</span>
                  </p>
                  <p style={{ margin: "4px 0", color: "#536b56", fontSize: "14px" }}>👨‍🌾 {o.farmerName}</p>
                  <p style={{ margin: "4px 0", color: "#536b56", fontSize: "14px" }}>
                    {t("quantityLabel")}: <strong>{o.quantity} kg</strong> &nbsp;|&nbsp;
                    {t("totalPriceLabel")}: <strong>₹{o.totalPrice}</strong> &nbsp;|&nbsp;
                    {t("dateLabel")}: {o.date}
                  </p>
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "8px" }}>
                  <span className={`status-badge status-${o.status.toLowerCase()}`}>
                    {o.status}
                  </span>
                  {o.status === "PENDING" && (
                    <button
                      className="btn-danger"
                      style={{
                        padding: "6px 12px",
                        fontSize: "12px",
                        borderRadius: "6px",
                        border: "none",
                        cursor: "pointer",
                        fontWeight: 600
                      }}
                      onClick={() => handleCancelOrder(o.id)}
                    >
                      🚫 {t("cancelOrder") || "Cancel Order"}
                    </button>
                  )}
                  {o.status === "DELIVERED" && (
                    myFeedbacks[o.id] ? (
                      <span
                        style={{
                          fontSize: "12.5px",
                          fontWeight: "600",
                          color: "#2e7d32",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                          backgroundColor: "#eaf5eb",
                          padding: "5px 10px",
                          borderRadius: "6px",
                          border: "1px solid #bbf7d0"
                        }}
                      >
                        ⭐ {t("reviewed") || "Reviewed"} ({myFeedbacks[o.id].rating}★)
                      </span>
                    ) : (
                      <button
                        className="btn-primary"
                        style={{
                          padding: "6px 14px",
                          fontSize: "13px",
                          borderRadius: "6px",
                          border: "none",
                          cursor: "pointer",
                          fontWeight: 600,
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px"
                        }}
                        onClick={() => setFeedbackOrder(o)}
                      >
                        ⭐ {t("giveFeedback") || "Give Feedback"}
                      </button>
                    )
                  )}
                </div>
              </div>

              {/* Progress tracker — only for active non-terminal orders */}
              {o.status !== "REJECTED" && o.status !== "CANCELLED" && (
                <div style={{ marginTop: "16px", paddingTop: "14px", borderTop: "1px solid #edf3ee", display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                  {STATUS_STEPS.map((step, idx) => {
                    const current = getStepIndex(o.status);
                    const done = idx <= current;
                    return (
                      <div key={step} style={{ display: "flex", alignItems: "center" }}>
                        <div style={{
                          width: "26px", height: "26px", borderRadius: "50%",
                          background: done ? "#2e7d32" : "#e5ede5",
                          color: done ? "#ffffff" : "#798e7b",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: "11px", fontWeight: "700"
                        }}>
                          {idx + 1}
                        </div>
                        <span style={{ fontSize: "12px", marginLeft: "6px", fontWeight: done ? 600 : 400, color: done ? "#2e7d32" : "#798e7b" }}>
                          {step}
                        </span>
                        {idx < STATUS_STEPS.length - 1 && (
                          <div style={{ width: "24px", height: "2px", background: idx < current ? "#2e7d32" : "#e5ede5", margin: "0 6px" }} />
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
              {o.status === "REJECTED" && (
                <p style={{ color: "#dc2626", marginTop: "12px", fontWeight: "600", fontSize: "14px" }}>❌ {t("rejected")}</p>
              )}
              {o.status === "CANCELLED" && (
                <p style={{ color: "#b91c1c", marginTop: "12px", fontWeight: "600", fontSize: "14px" }}>🚫 {t("cancelled") || "Cancelled by Buyer"}</p>
              )}
            </div>
          ))}
        </div>
      </main>

      <FeedbackModal
        order={feedbackOrder}
        isOpen={!!feedbackOrder}
        onClose={() => setFeedbackOrder(null)}
        onSuccess={(orderId, savedFeedback) => {
          setMyFeedbacks(prev => ({ ...prev, [orderId]: savedFeedback }));
        }}
      />
    </div>
  );
};

export default BuyerOrders;

