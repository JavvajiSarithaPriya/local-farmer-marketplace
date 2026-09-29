import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../components/context/AuthContext";
import { useCart } from "../components/context/CartContext";
import { useLanguage } from "../components/context/LanguageContext";
import { useNotification } from "../components/context/NotificationContext";
import { orderAPI } from "../components/services/api";
import "./dashboard.css";

const Cart = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { showModal, showToast } = useNotification();
  const { cartItems, loading: cartLoading, error, removeFromCart, updateQuantity, clearCart } = useCart();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [subtotal, setSubtotal] = useState(0);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const calculatedSubtotal = cartItems.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 0), 0);
    setSubtotal(calculatedSubtotal);
    setTotal(calculatedSubtotal);
  }, [cartItems]);

  const handleCheckout = async () => {
    if (!user) {
      showModal({
        type: "warning",
        title: "Login Required",
        message: t("loginToPlaceOrders") || "Please login to place orders.",
        confirmText: t("login") || "Login",
        onConfirm: () => navigate("/login"),
      });
      return;
    }

    if (cartItems.length === 0) {
      showToast({
        type: "warning",
        message: t("cartEmpty") || "Your cart is empty.",
      });
      return;
    }

    setLoading(true);
    try {
      // Place orders for all items in cart
      const orderPromises = cartItems.map(item =>
        orderAPI.place(user.id, item.productId || item.id, item.quantity)
      );

      await Promise.all(orderPromises);

      await clearCart();
      
      showModal({
        type: "success",
        title: t("orderPlaced") || "Order Placed Successfully!",
        message: "Your direct farm-fresh order has been placed with the farmer.",
        confirmText: "View My Orders",
        onConfirm: () => navigate("/buyer-orders"),
        onClose: () => navigate("/buyer-orders"),
        autoCloseMs: 1500,
      });

      setTimeout(() => {
        navigate("/buyer-orders");
      }, 1500);
      
      // Voice announcement
      if (window.voiceGuidance && window.voiceGuidance.isEnabled()) {
        window.voiceGuidance.announceSuccess("orderPlaced");
      }
    } catch (error) {
      console.error("Error placing orders:", error);
      const message = error?.message || t("orderPlacementFailed");
      showModal({
        type: "error",
        title: "Order Failed",
        message: message,
      });
      
      // Voice announcement for error
      if (window.voiceGuidance && window.voiceGuidance.isEnabled()) {
        window.voiceGuidance.announceError("Order placement failed");
      }
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="dashboard-container">
        <div className="empty-state">
          <h2>{t("loginToViewCart")}</h2>
          <button className="btn-primary" onClick={() => navigate("/login")}>
            {t("login")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="header-content">
          <h1>🛒 {t("shoppingCartTitle")}</h1>
          <button className="btn-secondary" onClick={() => navigate("/buyer-dashboard")}> 
            {t("continueShopping")}
          </button>
        </div>
      </header>

      <div className="dashboard-content">
        {error && <div style={{ color: "red", marginBottom: "15px" }}>{error}</div>}
        {cartItems.length === 0 ? (
          <div className="empty-state">
            <h2>Your cart is empty</h2>
            <p>Add some products to get started!</p>
            <button className="btn-primary" onClick={() => navigate("/buyer-dashboard")}>
              Browse Products
            </button>
          </div>
        ) : (
          <>
            <div className="products-grid">
              {cartItems.map((item) => (
                <div key={item.id} className="product-card">
                  <div className="product-header">
                    <h3 className="product-name">{item.name}</h3>
                    <button
                      className="btn-small btn-danger"
                      onClick={() => removeFromCart(item.id)}
                      disabled={cartLoading}
                    >
                      ✕
                    </button>
                  </div>
                  <p className="product-farmer">👨‍🌾 {item.farmerName}</p>
                  <p className="product-price">₹{item.price} per {item.unit || 'kg'}</p>
                  <div className="product-actions">
                    <div className="quantity-controls">
                      <button
                        className="btn-small"
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        disabled={cartLoading}
                      >
                        -
                      </button>
                      <span className="quantity">{item.quantity}</span>
                      <button
                        className="btn-small"
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        disabled={cartLoading}
                      >
                        +
                      </button>
                    </div>
                    <p className="item-total">Total: ₹{(item.price * item.quantity).toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="cart-summary">
              <h3>{t("orderSummary")}</h3>
              <p>{t("totalItems")} {cartItems.reduce((sum, item) => sum + item.quantity, 0)}</p>
              <p className="total-price">Subtotal: ₹{subtotal.toFixed(2)}</p>
              <p className="total-price">{t("totalPrice")} ₹{total.toFixed(2)}</p>
              <div className="summary-actions">
                <button className="btn-secondary" onClick={() => clearCart()} disabled={cartLoading}>
                  {t("clearCart")}
                </button>
                <button
                  className="btn-primary"
                  onClick={handleCheckout}
                  disabled={loading}
                >
                  {loading ? t("placingOrders") : t("checkout")}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Cart;