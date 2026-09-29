import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../components/context/AuthContext";
import { useLanguage } from "../components/context/LanguageContext";
import { productAPI, orderAPI, getImageUrl } from "../components/services/api";
import { useNotification } from "../components/context/NotificationContext";
import "./dashboard.css";

const FarmerDashboard = () => {
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const { showModal, showToast } = useNotification();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalOrders: 0,
    totalEarnings: 0,
  });
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [activeTab, setActiveTab] = useState("overview");

  const loadDashboardData = async () => {
    try {
      if (!user || !user.id) {
        console.error("User not found");
        return;
      }

      console.log("Loading products for farmer:", user.id);
      
      const fetchedProducts = await productAPI.getByFarmer(user.id);
      console.log("✅ Products fetched:", fetchedProducts);
      
      setProducts(fetchedProducts || []);
      
      const totalProducts = fetchedProducts ? fetchedProducts.length : 0;
      const totalEarnings = fetchedProducts ? 
        fetchedProducts.reduce((sum, p) => sum + (p.price * p.quantity), 0) : 0;

      let fetchedOrders = [];
      try {
        fetchedOrders = await orderAPI.getByFarmer(user.id);
      } catch (orderError) {
        console.warn("Could not load farmer orders:", orderError);
      }

      const ordersForDisplay = fetchedOrders.map((order) => ({
        id: order.id,
        productName: order.product?.name || t("unknown") || "Unknown",
        buyer: order.buyer?.fullName || order.buyer?.mobileNumber || t("unknown") || "Unknown",
        quantity: order.quantity,
        totalPrice: order.totalPrice,
        status: order.status || "PENDING",
        date: order.createdAt ? new Date(order.createdAt).toLocaleDateString() : "",
      }));

      setOrders(ordersForDisplay);
      setStats({
        totalProducts,
        totalOrders: ordersForDisplay.length,
        totalEarnings,
      });
    } catch (error) {
      console.error("❌ Error loading dashboard data:", error);
      setProducts([]);
      setOrders([]);
      setStats({ totalProducts: 0, totalOrders: 0, totalEarnings: 0 });
    }
  };

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }

    const runLoad = async () => {
      await loadDashboardData();
    };

    runLoad();
  // loadDashboardData is intentionally invoked when the authenticated user changes.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, navigate]);

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

  const handleAddProduct = () => {
    // Ensure we're not carrying over an edit context when adding a new product
    sessionStorage.removeItem("editProduct");
    navigate("/add-product");
  };

  const handleOrderStatus = async (orderId, newStatus) => {
    try {
      await orderAPI.updateStatus(orderId, user.id, newStatus);
      await loadDashboardData();
      showToast({
        type: "success",
        message: `Order #${orderId} status updated to ${newStatus}`,
      });
    } catch (err) {
      showModal({
        type: "error",
        title: "Order Status Error",
        message: err.message || "Failed to update order status.",
      });
    }
  };

  const handleTabSwitch = (tabName) => {
    if (window.voiceGuidance && window.voiceGuidance.isEnabled()) {
      window.voiceGuidance.announceAction(`switchingTo${tabName.charAt(0).toUpperCase() + tabName.slice(1)}Tab`);
    }
    setActiveTab(tabName);
  };

  return (
    <div className="dashboard-container">
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-content">
          <h1>🌾 {t("farmerDashboardTitle")}</h1>
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
          onClick={() => handleTabSwitch("overview")}
        >
          {t("overview")}
        </button>
        <button 
          className={`nav-tab ${activeTab === "products" ? "active" : ""}`}
          onClick={() => handleTabSwitch("products")}
        >
          {t("myProducts")}
        </button>
        <button 
          className={`nav-tab ${activeTab === "orders" ? "active" : ""}`}
          onClick={() => handleTabSwitch("orders")}
        >
          {t("orders")}
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
                <div className="stat-icon">📦</div>
                <div className="stat-content">
                  <h3>{stats.totalProducts}</h3>
                  <p>{t("totalProductsLabel")}</p>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon">📋</div>
                <div className="stat-content">
                  <h3>{stats.totalOrders}</h3>
                  <p>{t("totalOrdersLabel")}</p>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon">💰</div>
                <div className="stat-content">
                  <h3>₹{stats.totalEarnings}</h3>
                  <p>{t("totalEarningsLabel")}</p>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="quick-actions">
              <h3>{t("quickActions")}</h3>
              <div className="actions-buttons">
                <button className="btn-primary" onClick={handleAddProduct}>
                  ➕ {t("addNewProduct")}
                </button>
                <button className="btn-secondary" onClick={() => setActiveTab("orders")}> 
                  📋 {t("viewOrders")}
                </button>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="recent-activity">
              <h3>Recent Orders</h3>
              {orders.length > 0 ? (
                <table className="activity-table">
                  <thead>
                    <tr>
                      <th>Order ID</th>
                      <th>Product</th>
                      <th>Buyer</th>
                      <th>Quantity</th>
                      <th>Status</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.slice(0, 3).map((order) => (
                      <tr key={order.id}>
                        <td>#{order.id}</td>
                        <td>{order.productName}</td>
                        <td>{order.buyer}</td>
                        <td>{order.quantity} kg</td>
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
                <p>{t("noRecentOrders")}</p>
              )}
            </div>
          </div>
        )}

        {/* Products Tab */}
        {activeTab === "products" && (
          <div className="content-section">
            <div className="section-header">
              <h2>{t("myProducts")}</h2>
              <button className="btn-primary" onClick={handleAddProduct}>
                ➕ {t("addProduct")}
              </button>
            </div>

            {products.length > 0 ? (
              <div className="products-grid">
                {products.map((product) => (
                  <div key={product.id} className="product-card" style={{ opacity: product.isActive === false ? 0.6 : 1 }}>
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
                      <h3>{product.name} {product.isActive === false && <span style={{ fontSize: "11px", background: "#dc3545", color: "white", padding: "2px 6px", borderRadius: "4px", marginLeft: "6px" }}>INACTIVE</span>}</h3>
                      <p className="product-price">₹{product.price}/{product.unit || "kg"}</p>
                      <p className="product-quantity">Stock: {product.quantity} {product.unit || "kg"}</p>
                      <div className="product-actions">
                        <button 
                          className="btn-small btn-edit"
                          onClick={() => {
                            // Store product in sessionStorage for edit mode
                            sessionStorage.setItem("editProduct", JSON.stringify(product));
                            navigate("/add-product");
                          }}
                        >
                          Edit
                        </button>
                        <button 
                          className="btn-small btn-delete"
                          onClick={() => {
                            showModal({
                              type: "warning",
                              title: t("deleteProduct") || "Delete Product",
                              message: `Are you sure you want to delete "${product.name}"?`,
                              confirmText: "Delete",
                              cancelText: "Cancel",
                              onConfirm: async () => {
                                try {
                                  await productAPI.delete(product.id, user.id);
                                  setProducts(products.filter(p => p.id !== product.id));
                                  showModal({
                                    type: "success",
                                    title: t("productDeleted") || "Product Deleted",
                                    message: `"${product.name}" was successfully removed.`,
                                    autoCloseMs: 1500,
                                  });
                                } catch (err) {
                                  console.error("Failed to delete product:", err);
                                  showModal({
                                    type: "error",
                                    title: t("failedDeleteProduct") || "Error",
                                    message: err.message || "Could not delete product.",
                                  });
                                }
                              }
                            });
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <p>{t("noProductsAddedYet")}</p>
                <button className="btn-primary" onClick={handleAddProduct}>
                  {t("addFirstProduct")}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Orders Tab */}
        {activeTab === "orders" && (
          <div className="content-section">
            <h2>{t("ordersFromBuyers")}</h2>

            {orders.length > 0 ? (
              <div className="orders-table-container">
                <table className="orders-table">
                  <thead>
                    <tr>
                      <th>Order ID</th>
                      <th>Product</th>
                      <th>Buyer Name</th>
                      <th>Quantity</th>
                      <th>Price</th>
                      <th>Status</th>
                      <th>Date</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((order) => (
                      <tr key={order.id}>
                        <td className="order-id">#{order.id}</td>
                        <td>{order.productName}</td>
                        <td>{order.buyer}</td>
                        <td>{order.quantity} kg</td>
                        <td>₹{order.totalPrice}</td>
                        <td>
                          <span className={`status-badge status-${order.status.toLowerCase().replace(" ", "-")}`}>
                            {order.status}
                          </span>
                        </td>
                        <td>{order.date}</td>
                        <td>
                          {order.status === 'PENDING' && (
                            <>
                              <button className="btn-small btn-edit" onClick={() => handleOrderStatus(order.id, 'ACCEPTED')}>✅ Accept</button>
                              <button className="btn-small btn-danger" onClick={() => handleOrderStatus(order.id, 'REJECTED')}>❌ Reject</button>
                            </>
                          )}
                          {order.status === 'ACCEPTED' && (
                            <button className="btn-small btn-edit" onClick={() => handleOrderStatus(order.id, 'PACKED')}>📦 Pack</button>
                          )}
                          {order.status === 'PACKED' && (
                            <button className="btn-small btn-edit" onClick={() => handleOrderStatus(order.id, 'SHIPPED')}>🚚 Ship</button>
                          )}
                          {order.status === 'SHIPPED' && (
                            <button className="btn-small btn-edit" onClick={() => handleOrderStatus(order.id, 'DELIVERED')}>✔️ Deliver</button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="empty-state">
                <p>{t("noOrdersReceivedYet")}</p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default FarmerDashboard;
