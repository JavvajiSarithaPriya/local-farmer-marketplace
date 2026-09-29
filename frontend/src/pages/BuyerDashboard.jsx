import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../components/context/AuthContext";
import { useCart } from "../components/context/CartContext";
import { useLanguage } from "../components/context/LanguageContext";
import { productAPI, orderAPI, feedbackAPI, getImageUrl } from "../components/services/api";
import { useNotification } from "../components/context/NotificationContext";
import FeedbackModal from "../components/common/FeedbackModal";
import SearchAndFilter from "../components/SearchAndFilter";
import "./dashboard.css";

const BuyerDashboard = () => {
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const { addToCart } = useCart();
  const { showModal, showToast } = useNotification();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalSpent: 0,
    pendingOrders: 0,
  });
  const [, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [myFeedbacks, setMyFeedbacks] = useState({});
  const [feedbackOrder, setFeedbackOrder] = useState(null);
  const [orderQuantities, setOrderQuantities] = useState({});
  const [activeTab, setActiveTab] = useState("browse");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    // Check if user is logged in
    if (!user) {
      navigate("/login");
      return;
    }

    // Load mock data
    loadDashboardData();
  // loadDashboardData is intentionally invoked when the authenticated user changes.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, navigate]);

  const loadDashboardData = async () => {
    setLoading(true);
    setError("");
    try {
      console.log("📤 Fetching all products from backend...");
      
      // Fetch all active products from backend
      const fetchedProducts = await productAPI.getAllActive();
      console.log("✅ Products fetched:", fetchedProducts);
      
      // Transform backend products to include farmer details
      const productsWithFarmer = fetchedProducts.map(product => ({
        id: product.id,
        productId: product.id,
        farmerId: product.farmer?.id,
        farmerName: product.farmer?.fullName || "Unknown Farmer",
        farmerPhone: product.farmer?.phone || product.farmer?.mobileNumber || "N/A",
        farmerAddress: [
          product.farmer?.address,
          product.farmer?.village,
          product.farmer?.district,
          product.farmer?.state
        ].filter(Boolean).join(", ") || product.farmer?.address || "N/A",
        name: product.name,
        price: product.price,
        quantity: product.quantity || product.stock_quantity || 0,
        description: product.description || "",
        unit: product.unit || "kg", // Use real unit from DB
        imageUrl: product.imageUrl || product.image_url || null,
        rating: 4.5, // Default rating (can be added later)
      }));
      
      setProducts(productsWithFarmer);
      setFilteredProducts(productsWithFarmer); // Initialize filtered products
      
      // load orders when the page first mounts or when user id changes
      if (user) {
        const fetchedOrders = await orderAPI.getByBuyer(user.id);
        // simplify order objects for display
        const ordersForDisplay = fetchedOrders.map(o => ({
          id: o.id,
          productName: o.product?.name,
          farmerName: o.product?.farmer?.fullName,
          quantity: o.quantity,
          totalPrice: o.totalPrice,
          status: o.status,
          date: new Date(o.createdAt).toLocaleDateString(),
        }));
        setOrders(ordersForDisplay);
        setStats({
          totalOrders: ordersForDisplay.length,
          totalSpent: ordersForDisplay.reduce((sum, order) => sum + order.totalPrice, 0),
          pendingOrders: ordersForDisplay.filter((o) => o.status === "PENDING").length,
        });

        try {
          const fetchedFeedbacks = await feedbackAPI.getMyFeedback();
          const fbMap = {};
          if (Array.isArray(fetchedFeedbacks)) {
            fetchedFeedbacks.forEach(f => {
              if (f && f.orderId) fbMap[f.orderId] = f;
            });
          }
          setMyFeedbacks(fbMap);
        } catch (fbErr) {
          console.warn("Could not load buyer feedback in dashboard:", fbErr);
        }
      } else {
        setOrders([]);
        setStats({ totalOrders: 0, totalSpent: 0, pendingOrders: 0 });
        setMyFeedbacks({});
      }
    } catch (err) {
      console.error("❌ Error loading products:", err);
      setError("Failed to load products. Please try again.");
      // Fallback to empty products
      setProducts([]);
      setOrders([]);
      setStats({
        totalOrders: 0,
        totalSpent: 0,
        pendingOrders: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  // Search and filter handlers
  const handleSearch = (searchResults) => {
    // Transform search results to match the expected format
    const transformedResults = searchResults.map(product => ({
      id: product.id,
      productId: product.id,
      farmerId: product.farmer?.id,
      farmerName: product.farmer?.fullName || "Unknown Farmer",
      farmerPhone: product.farmer?.phone || product.farmer?.mobileNumber || "N/A",
      farmerAddress: [
        product.farmer?.address,
        product.farmer?.village,
        product.farmer?.district,
        product.farmer?.state
      ].filter(Boolean).join(", ") || product.farmer?.address || "N/A",
      name: product.name,
      price: product.price,
      quantity: product.quantity || product.stock_quantity || 0,
      description: product.description || "",
      unit: product.unit || "kg",
      imageUrl: product.imageUrl || product.image_url || null,
      rating: 4.5,
    }));
    setFilteredProducts(transformedResults);
  };

  const handleFilter = (filteredResults) => {
    // This can be used for additional filtering if needed
    setFilteredProducts(filteredResults);
  };

  const handleSort = (sortedResults) => {
    // This can be used for sorting if needed
    setFilteredProducts(sortedResults);
  };

  const handleLogout = () => {
    try {
      logout();
      // Use setTimeout to ensure state is cleared before navigation
      setTimeout(() => {
        navigate("/login");
      }, 100);
    } catch (error) {
      console.error("Error during logout:", error);
      // Force navigation even if logout fails
      navigate("/login");
    }
  };

  const handleAddToCart = async (product) => {
    const qty = orderQuantities[product.id] || 1;
    try {
      await addToCart(product, qty);
      showToast({
        type: "success",
        message: `🛒 Added ${qty} ${product.unit || 'kg'} of ${product.name} to cart!`,
      });
      if (window.voiceGuidance && window.voiceGuidance.isEnabled()) {
        window.voiceGuidance.announceSuccess(`${qty} ${product.name} ${t("productAdded")}`);
      }
    } catch (err) {
      showToast({
        type: "error",
        message: `❌ ${err.message || "Unable to add item to cart"}`,
      });
    }
  };

  return (
    <div className="dashboard-container">
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-content">
          <h1>🛒 {t("buyerDashboardTitle")}</h1>
          <div className="header-info">
            <span className="user-info">👤 {user?.fullName}</span>
            <button className="btn-logout" onClick={handleLogout}>
              {t("logout")}
            </button>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="dashboard-nav">
        <button 
          className={`nav-tab ${activeTab === "overview" ? "active" : ""}`}
          onClick={() => setActiveTab("overview")}
        >
          {t("overview")}
        </button>
        <button 
          className={`nav-tab ${activeTab === "browse" ? "active" : ""}`}
          onClick={() => setActiveTab("browse")}
        >
          {t("browseProducts")}
        </button>
        <button 
          className={`nav-tab ${activeTab === "orders" ? "active" : ""}`}
          onClick={() => setActiveTab("orders")}
        >
          {t("myOrders")}
        </button>
      </nav>

      {/* Main Content */}
      <main className="dashboard-main">
        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div className="content-section">
            <h2>{t("dashboardOverview")}</h2>
            
            {/* Stats Cards */}
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon">📋</div>
                <div className="stat-content">
                  <h3>{stats.totalOrders}</h3>
                  <p>{t("totalOrdersLabel")}</p>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon">💸</div>
                <div className="stat-content">
                  <h3>₹{stats.totalSpent}</h3>
                  <p>{t("totalSpent")}</p>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon">⏳</div>
                <div className="stat-content">
                  <h3>{stats.pendingOrders}</h3>
                  <p>{t("pendingOrdersLabel")}</p>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="quick-actions">
              <h3>{t("quickActions")}</h3>
              <div className="actions-buttons">
                <button className="btn-primary" onClick={() => setActiveTab("browse")}> 
                  🛍️ {t("browseProducts")}
                </button>
                <button className="btn-secondary" onClick={() => setActiveTab("orders")}> 
                  📋 {t("viewMyOrders")}
                </button>
              </div>
            </div>

            {/* Recent Orders */}
            <div className="recent-activity">
              <h3>{t("recentOrders")}</h3>
              {orders.length > 0 ? (
                <table className="activity-table">
                  <thead>
                    <tr>
                      <th>{t("orderId")}</th>
                      <th>{t("productLabel")}</th>
                      <th>{t("farmerLabel")}</th>
                      <th>{t("quantityLabel")}</th>
                      <th>{t("priceLabel")}</th>
                      <th>{t("statusLabel")}</th>
                      <th>{t("dateLabel")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.slice(0, 3).map((order) => (
                      <tr key={order.id}>
                        <td>#{order.id}</td>
                        <td>{order.productName}</td>
                        <td>{order.farmerName}</td>
                        <td>{order.quantity} kg</td>
                        <td>₹{order.totalPrice}</td>
                        <td>
                          <span className={`status-badge status-${order.status.toLowerCase().replace(" ", "-")}`}>
                            {order.status}
                          </span>
                        </td>
                        <td>{order.date}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p>{t("noOrdersYet")}</p>
              )}
            </div>
          </div>
        )}

        {/* Browse Products Tab */}
        {activeTab === "browse" && (
          <div className="content-section">
            <h2>{t("availableProducts")}</h2>

            <SearchAndFilter
              onSearch={handleSearch}
              onFilter={handleFilter}
              onSort={handleSort}
            />

            {error && <div style={{ color: "red", marginBottom: "15px", padding: "10px", backgroundColor: "#ffe6e6", borderRadius: "4px" }}>{error}</div>}
            
            {loading ? (
              <div style={{ textAlign: "center", padding: "40px" }}>
                <p>{t("loadingProducts")}</p>
              </div>
            ) : filteredProducts.length > 0 ? (
              <div className="products-grid">
                {filteredProducts.map((product) => (
                  <div key={product.id} className="product-card">
                    <div className="product-image" style={{ overflow: "hidden", position: "relative" }}>
                      {product.imageUrl ? (
                        <img
                          src={getImageUrl(product.imageUrl)}
                          alt={product.name}
                          style={{ width: "100%", height: "100%", objectFit: "cover" }}
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                            const fallback = e.currentTarget.parentElement.querySelector(".product-fallback-icon");
                            if (fallback) fallback.style.display = "flex";
                          }}
                        />
                      ) : null}
                      <span
                        className="product-fallback-icon"
                        style={{
                          display: product.imageUrl ? "none" : "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          width: "100%",
                          height: "100%",
                          fontSize: "60px",
                        }}
                      >
                        🌾
                      </span>
                    </div>
                    <div className="product-details">
                      <h3>{product.name}</h3>
                      <p className="product-farmer">👨‍🌾 {product.farmerName}</p>
                      <p className="product-rating">⭐ {product.rating}/5</p>
                      <p className="product-price">₹{product.price}/{product.unit}</p>
                      <p className="product-quantity">Available: {product.quantity} {product.unit}</p>
                      {product.description && <p className="product-description">{product.description}</p>}
                      <div className="product-actions">
                        <input
                          type="number"
                          min="1"
                          value={orderQuantities[product.id] || 1}
                          onChange={(e) =>
                            setOrderQuantities({
                              ...orderQuantities,
                              [product.id]: Number(e.target.value),
                            })
                          }
                          style={{
                            width: "56px",
                            padding: "6px 8px",
                            borderRadius: "6px",
                            border: "1px solid #d2ded4",
                            fontSize: "13.5px",
                            textAlign: "center"
                          }}
                        />
                        <button
                          className="btn-small btn-edit"
                          onClick={() => handleAddToCart(product)}
                        >
                          🛒 {t("addToCart")}
                        </button>
                        <button 
                          className="btn-small btn-view"
                          onClick={() => {
                            sessionStorage.setItem("selectedProduct", JSON.stringify(product));
                            showModal({
                              type: "info",
                              title: `🌾 ${product.name}`,
                              message: `👨‍🌾 Farmer: ${product.farmerName}\n📞 Phone: ${product.farmerPhone}\n📍 Address: ${product.farmerAddress}\n💰 Price: ₹${product.price} / ${product.unit}\n📦 Available: ${product.quantity} ${product.unit}\n⭐ Rating: ${product.rating}/5${product.description ? `\n\n📝 ${product.description}` : ""}`,
                              confirmText: "Close",
                            });
                          }}
                        >
                          {t("view")}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <p>{t("noProductsAvailable")}</p>
              </div>
            )}
          </div>
        )}

        {/* Orders Tab */}
        {activeTab === "orders" && (
          <div className="content-section">
            <h2>{t("myOrders")}</h2>

            {orders.length > 0 ? (
              <div className="orders-table-container">
                <table className="orders-table">
                  <thead>
                    <tr>
                      <th>{t("orderId")}</th>
                      <th>{t("productLabel")}</th>
                      <th>{t("farmerLabel")}</th>
                      <th>{t("quantityLabel")}</th>
                      <th>{t("totalPriceLabel")}</th>
                      <th>{t("statusLabel")}</th>
                      <th>{t("dateLabel")}</th>
                      <th>{t("action")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((order) => (
                      <tr key={order.id}>
                        <td className="order-id">#{order.id}</td>
                        <td>{order.productName}</td>
                        <td>{order.farmerName}</td>
                        <td>{order.quantity} kg</td>
                        <td>₹{order.totalPrice}</td>
                        <td>
                          <span className={`status-badge status-${order.status.toLowerCase().replace(" ", "-")}`}>
                            {order.status}
                          </span>
                        </td>
                        <td>{order.date}</td>
                        <td>
                          <div style={{ display: "flex", gap: "6px", alignItems: "center", flexWrap: "wrap" }}>
                            <button className="btn-small btn-view" onClick={() => navigate("/buyer-orders")}>{t("track")}</button>
                            {order.status === "DELIVERED" && (
                              myFeedbacks[order.id] ? (
                                <span
                                  style={{
                                    fontSize: "12px",
                                    fontWeight: "600",
                                    color: "#2e7d32",
                                    backgroundColor: "#eaf5eb",
                                    padding: "4px 8px",
                                    borderRadius: "4px",
                                    border: "1px solid #bbf7d0"
                                  }}
                                >
                                  ⭐ {myFeedbacks[order.id].rating}★
                                </span>
                              ) : (
                                <button
                                  className="btn-small btn-edit"
                                  style={{ display: "inline-flex", alignItems: "center", gap: "3px" }}
                                  onClick={() => setFeedbackOrder(order)}
                                >
                                  ⭐ {t("giveFeedback") || "Give Feedback"}
                                </button>
                              )
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="empty-state">
                <p>{t("noOrdersYetStartShopping")}</p>
                <button className="btn-primary" onClick={() => setActiveTab("browse")}>
                  {t("browseProducts")}
                </button>
              </div>
            )}
          </div>
        )}
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

export default BuyerDashboard;
