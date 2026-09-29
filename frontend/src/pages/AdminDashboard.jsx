import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../components/context/AuthContext";
import { useNotification } from "../components/context/NotificationContext";
import { adminAPI, getImageUrl } from "../components/services/api";
import "./dashboard.css";

const USER_SUBTABS = { ALL: "all", FARMERS: "farmers", BUYERS: "buyers" };

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const { showModal, showToast } = useNotification();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("overview");
  const [userSubTab, setUserSubTab] = useState(USER_SUBTABS.ALL);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [stats, setStats] = useState({
    totalUsers: 0, totalFarmers: 0, totalBuyers: 0,
    totalProducts: 0, activeProducts: 0, inactiveProducts: 0,
    totalOrders: 0, pendingOrders: 0, acceptedOrders: 0,
    deliveredOrders: 0, rejectedOrders: 0, cancelledOrders: 0,
  });

  const [allUsers, setAllUsers] = useState([]);
  const [farmers, setFarmers] = useState([]);
  const [buyers, setBuyers] = useState([]);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    if (!user) { navigate("/login"); return; }
    if (user.role !== "ADMIN") { navigate("/"); return; }
  }, [user, navigate]);

  const loadStats = useCallback(async () => {
    try {
      const data = await adminAPI.getStats();
      setStats(data);
    } catch (err) {
      console.error("Stats error:", err);
    }
  }, []);

  const loadTabData = useCallback(async () => {
    if (!user || user.role !== "ADMIN") return;
    setLoading(true);
    setError("");
    setSearchQuery("");
    setStatusFilter("all");
    try {
      await loadStats();
      if (activeTab === "users") {
        if (userSubTab === USER_SUBTABS.ALL) {
          setAllUsers(await adminAPI.getAllUsers());
        } else if (userSubTab === USER_SUBTABS.FARMERS) {
          setFarmers(await adminAPI.getFarmers());
        } else {
          setBuyers(await adminAPI.getBuyers());
        }
      } else if (activeTab === "products") {
        setProducts(await adminAPI.getAllProducts());
      } else if (activeTab === "orders") {
        setOrders(await adminAPI.getAllOrders());
      }
    } catch (err) {
      setError(err.message || "Failed to load data. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [activeTab, userSubTab, loadStats, user]);

  useEffect(() => { loadTabData(); }, [loadTabData]);

  const handleLogout = () => { logout(); setTimeout(() => navigate("/login"), 100); };

  const handleUserStatus = (targetUserId, activate) => {
    if (!activate && targetUserId === user.id) {
      showModal({
        type: "warning",
        title: "Action Not Allowed",
        message: "You cannot deactivate your own administrator account.",
      });
      return;
    }

    showModal({
      type: activate ? "info" : "warning",
      title: activate ? "Activate User" : "Deactivate User",
      message: `Are you sure you want to ${activate ? "activate" : "deactivate"} this user?`,
      confirmText: activate ? "Activate" : "Deactivate",
      cancelText: "Cancel",
      onConfirm: async () => {
        try {
          if (activate) await adminAPI.activateUser(targetUserId);
          else await adminAPI.deactivateUser(targetUserId);
          // Refresh current list
          if (userSubTab === USER_SUBTABS.ALL) setAllUsers(await adminAPI.getAllUsers());
          else if (userSubTab === USER_SUBTABS.FARMERS) setFarmers(await adminAPI.getFarmers());
          else setBuyers(await adminAPI.getBuyers());
          await loadStats();
          showToast({
            type: "success",
            message: `User ${activate ? "activated" : "deactivated"} successfully.`,
          });
        } catch (err) {
          showModal({
            type: "error",
            title: "Error",
            message: err.message || "Failed to update user status.",
          });
        }
      },
    });
  };

  const handleProductStatus = (productId, activate) => {
    showModal({
      type: activate ? "info" : "warning",
      title: activate ? "Activate Product" : "Deactivate Product",
      message: `Are you sure you want to ${activate ? "activate" : "deactivate"} this product?`,
      confirmText: activate ? "Activate" : "Deactivate",
      cancelText: "Cancel",
      onConfirm: async () => {
        try {
          if (activate) await adminAPI.activateProduct(productId);
          else await adminAPI.deactivateProduct(productId);
          setProducts(await adminAPI.getAllProducts());
          await loadStats();
          showToast({
            type: "success",
            message: `Product ${activate ? "activated" : "deactivated"} successfully.`,
          });
        } catch (err) {
          showModal({
            type: "error",
            title: "Error",
            message: err.message || "Failed to update product status.",
          });
        }
      },
    });
  };

  // ── Filtered lists ──────────────────────────────────────────────────────────
  const currentUserList = userSubTab === USER_SUBTABS.ALL ? allUsers
    : userSubTab === USER_SUBTABS.FARMERS ? farmers : buyers;

  const filteredUsers = currentUserList.filter(u => {
    const q = searchQuery.toLowerCase();
    const matchSearch = !q || u.fullName?.toLowerCase().includes(q) || u.mobileNumber?.includes(q) || u.email?.toLowerCase().includes(q);
    const matchStatus = statusFilter === "all" || (statusFilter === "active" ? u.isActive : !u.isActive);
    return matchSearch && matchStatus;
  });

  const filteredProducts = products.filter(p => {
    const q = searchQuery.toLowerCase();
    const matchSearch = !q || p.name?.toLowerCase().includes(q) || p.farmer?.fullName?.toLowerCase().includes(q) || p.category?.toLowerCase().includes(q);
    const matchStatus = statusFilter === "all" || (statusFilter === "active" ? p.isActive : !p.isActive);
    return matchSearch && matchStatus;
  });

  const filteredOrders = orders.filter(o => {
    const q = searchQuery.toLowerCase();
    const matchSearch = !q || o.buyer?.fullName?.toLowerCase().includes(q) || o.product?.name?.toLowerCase().includes(q) || String(o.id).includes(q);
    const matchStatus = statusFilter === "all" || o.status?.toLowerCase() === statusFilter;
    return matchSearch && matchStatus;
  });

  // ── User table ──────────────────────────────────────────────────────────────
  const UserTable = ({ userList }) => {
    if (loading) return <p style={{ padding: "20px" }}>Loading...</p>;
    if (!userList || userList.length === 0)
      return <p style={{ padding: "20px", color: "#888" }}>No users found.</p>;
    return (
      <div style={{ overflowX: "auto" }}>
        <table className="data-table">
          <thead>
            <tr><th>ID</th><th>Name</th><th>Mobile</th><th>Email</th><th>Role</th><th>Status</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {userList.map((u) => (
              <tr key={u.id}>
                <td>{u.id}</td>
                <td>{u.fullName}</td>
                <td>{u.mobileNumber || "—"}</td>
                <td>{u.email || "—"}</td>
                <td>
                  <span style={{
                    padding: "2px 10px", borderRadius: "12px", fontSize: "12px", fontWeight: 600,
                    background: u.role === "ADMIN" ? "#ffeaa7" : u.role === "FARMER" ? "#d4edda" : "#d1ecf1",
                    color: u.role === "ADMIN" ? "#856404" : u.role === "FARMER" ? "#155724" : "#0c5460",
                  }}>{u.role}</span>
                </td>
                <td>
                  <span className={`status-badge ${u.isActive ? "status-delivered" : "status-rejected"}`}>
                    {u.isActive ? "ACTIVE" : "INACTIVE"}
                  </span>
                </td>
                <td>
                  {u.role === "ADMIN" ? (
                    <span style={{ color: "#888", fontSize: "12px" }}>Protected</span>
                  ) : u.isActive ? (
                    <button className="btn-small btn-danger" onClick={() => handleUserStatus(u.id, false)}>Deactivate</button>
                  ) : (
                    <button className="btn-small btn-success" onClick={() => handleUserStatus(u.id, true)}>Activate</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  // ── Search/filter bar ───────────────────────────────────────────────────────
  const SearchBar = ({ placeholder, showStatusFilter = true, statusOptions = [] }) => (
    <div style={{ display: "flex", gap: "10px", marginBottom: "16px", flexWrap: "wrap" }}>
      <input
        type="text"
        placeholder={placeholder}
        value={searchQuery}
        onChange={e => setSearchQuery(e.target.value)}
        style={{ flex: 1, minWidth: "200px", padding: "8px 12px", border: "1px solid #ddd", borderRadius: "6px", fontSize: "14px" }}
      />
      {showStatusFilter && (
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          style={{ padding: "8px 12px", border: "1px solid #ddd", borderRadius: "6px", fontSize: "14px" }}
        >
          <option value="all">All Status</option>
          {statusOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
        </select>
      )}
      {(searchQuery || statusFilter !== "all") && (
        <button onClick={() => { setSearchQuery(""); setStatusFilter("all"); }}
          style={{ padding: "8px 12px", background: "#6c757d", color: "white", border: "none", borderRadius: "6px", cursor: "pointer" }}>
          Clear
        </button>
      )}
    </div>
  );

  return (
    <div className="dashboard-container">
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-content">
          <h1>🛡️ Admin Dashboard</h1>
          <div className="header-info">
            <span className="user-info">👤 {user?.fullName}</span>
            <button className="btn-logout" onClick={handleLogout}>Logout</button>
          </div>
        </div>
      </header>

      {/* Main Tabs */}
      <nav className="dashboard-nav" style={{ background: "white", borderBottom: "2px solid #e0e0e0", display: "flex", padding: "0 20px" }}>
        {[
          { key: "overview", label: "📊 Overview" },
          { key: "users",    label: `👥 Users (${stats.totalUsers})` },
          { key: "products", label: `📦 Products (${stats.totalProducts})` },
          { key: "orders",   label: `📋 Orders (${stats.totalOrders})` },
        ].map(({ key, label }) => (
          <button key={key} className={`nav-tab${activeTab === key ? " active" : ""}`} onClick={() => setActiveTab(key)}>
            {label}
          </button>
        ))}
      </nav>

      {/* Content */}
      <div className="dashboard-content">
        {error && <div className="error-message">⚠️ {error}</div>}

        {/* ── OVERVIEW ── */}
        {activeTab === "overview" && (
          <div className="overview-section">
            <h2>System Statistics</h2>
            <div className="stats-grid">
              <StatCard icon="👥" value={stats.totalUsers}      label="Total Users" />
              <StatCard icon="🚜" value={stats.totalFarmers}    label="Farmers" />
              <StatCard icon="🛒" value={stats.totalBuyers}     label="Buyers" />
              <StatCard icon="📦" value={stats.totalProducts}   label="Total Products" />
              <StatCard icon="✅" value={stats.activeProducts}  label="Active Products" />
              <StatCard icon="🚫" value={stats.inactiveProducts} label="Inactive Products" />
              <StatCard icon="📋" value={stats.totalOrders}     label="Total Orders" />
              <StatCard icon="⏳" value={stats.pendingOrders}   label="Pending Orders" />
              <StatCard icon="🤝" value={stats.acceptedOrders}  label="Accepted Orders" />
              <StatCard icon="✔️" value={stats.deliveredOrders} label="Delivered Orders" />
              <StatCard icon="❌" value={stats.rejectedOrders}  label="Rejected Orders" />
              <StatCard icon="🚫" value={stats.cancelledOrders ?? 0} label="Cancelled Orders" />
            </div>
            <div style={{ marginTop: "30px", display: "flex", gap: "15px", flexWrap: "wrap" }}>
              <button className="btn-primary" onClick={() => setActiveTab("users")}>Manage Users</button>
              <button className="btn-primary" onClick={() => setActiveTab("products")}>Manage Products</button>
              <button className="btn-primary" onClick={() => setActiveTab("orders")}>View Orders</button>
            </div>
          </div>
        )}

        {/* ── USERS ── */}
        {activeTab === "users" && (
          <div className="management-section">
            <h2>User Management</h2>
            {/* Sub-tabs */}
            <div style={{ display: "flex", gap: "8px", marginBottom: "20px", borderBottom: "2px solid #e0e0e0" }}>
              {[
                { key: USER_SUBTABS.ALL,     label: `All (${stats.totalUsers})` },
                { key: USER_SUBTABS.FARMERS, label: `🚜 Farmers (${stats.totalFarmers})` },
                { key: USER_SUBTABS.BUYERS,  label: `🛒 Buyers (${stats.totalBuyers})` },
              ].map(({ key, label }) => (
                <button key={key} onClick={() => setUserSubTab(key)} style={{
                  padding: "10px 20px", border: "none", background: "none", cursor: "pointer",
                  fontWeight: 600, fontSize: "14px",
                  color: userSubTab === key ? "#2e7d32" : "#536b56",
                  borderBottom: userSubTab === key ? "3px solid #2e7d32" : "3px solid transparent",
                  marginBottom: "-2px",
                }}>{label}</button>
              ))}
            </div>
            <SearchBar
              placeholder="Search by name, mobile, or email..."
              statusOptions={[{ value: "active", label: "Active" }, { value: "inactive", label: "Inactive" }]}
            />
            <UserTable userList={filteredUsers} />
          </div>
        )}

        {/* ── PRODUCTS ── */}
        {activeTab === "products" && (
          <div className="management-section">
            <h2>Product Management</h2>
            <SearchBar
              placeholder="Search by product name, farmer, or category..."
              statusOptions={[{ value: "active", label: "Active" }, { value: "inactive", label: "Inactive" }]}
            />
            {loading ? (
              <p style={{ padding: "20px" }}>Loading products...</p>
            ) : filteredProducts.length === 0 ? (
              <p style={{ padding: "20px", color: "#888" }}>No products found.</p>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table className="data-table">
                  <thead>
                    <tr><th>ID</th><th>Image</th><th>Product Name</th><th>Farmer</th><th>Price</th><th>Stock</th><th>Category</th><th>Status</th><th>Actions</th></tr>
                  </thead>
                  <tbody>
                    {filteredProducts.map((p) => (
                      <tr key={p.id}>
                        <td>{p.id}</td>
                        <td>
                          <div style={{ width: "40px", height: "40px", borderRadius: "4px", overflow: "hidden", background: "#f0f0f0", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            {p.imageUrl ? (
                              <img
                                src={getImageUrl(p.imageUrl)}
                                alt={p.name}
                                style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                onError={(e) => { e.currentTarget.style.display = "none"; e.currentTarget.nextSibling.style.display = "flex"; }}
                              />
                            ) : null}
                            <span style={{ display: p.imageUrl ? "none" : "flex", fontSize: "18px" }}>🌾</span>
                          </div>
                        </td>
                        <td>{p.name}</td>
                        <td>{p.farmer?.fullName || "—"}</td>
                        <td>₹{p.price}</td>
                        <td>{p.quantity ?? 0}</td>
                        <td>{p.category || "—"}</td>
                        <td>
                          <span className={`status-badge ${p.isActive ? "status-delivered" : "status-rejected"}`}>
                            {p.isActive ? "ACTIVE" : "INACTIVE"}
                          </span>
                        </td>
                        <td>
                          {p.isActive ? (
                            <button className="btn-small btn-danger" onClick={() => handleProductStatus(p.id, false)}>Deactivate</button>
                          ) : (
                            <button className="btn-small btn-success" onClick={() => handleProductStatus(p.id, true)}>Activate</button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ── ORDERS ── */}
        {activeTab === "orders" && (
          <div className="management-section">
            <h2>Order Management</h2>
            <SearchBar
              placeholder="Search by order ID, buyer, or product..."
              statusOptions={[
                { value: "pending",   label: "Pending" },
                { value: "accepted",  label: "Accepted" },
                { value: "packed",    label: "Packed" },
                { value: "shipped",   label: "Shipped" },
                { value: "delivered", label: "Delivered" },
                { value: "rejected",  label: "Rejected" },
                { value: "cancelled", label: "Cancelled" },
              ]}
            />
            {loading ? (
              <p style={{ padding: "20px" }}>Loading orders...</p>
            ) : filteredOrders.length === 0 ? (
              <p style={{ padding: "20px", color: "#888" }}>No orders found.</p>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table className="data-table">
                  <thead>
                    <tr><th>Order ID</th><th>Buyer</th><th>Farmer</th><th>Product</th><th>Qty</th><th>Total</th><th>Status</th><th>Date</th></tr>
                  </thead>
                  <tbody>
                    {filteredOrders.map((o) => (
                      <tr key={o.id}>
                        <td style={{ fontWeight: 600, color: "#667eea" }}>#{o.id}</td>
                        <td>{o.buyer?.fullName || "—"}</td>
                        <td>{o.product?.farmer?.fullName || "—"}</td>
                        <td>{o.product?.name || "—"}</td>
                        <td>{o.quantity}</td>
                        <td>₹{o.totalPrice}</td>
                        <td>
                          <span className={`status-badge status-${(o.status || "").toLowerCase()}`}>
                            {o.status}
                          </span>
                        </td>
                        <td>
                          {o.createdAt
                            ? new Date(o.createdAt).toLocaleDateString()
                            : o.orderDate
                            ? new Date(o.orderDate).toLocaleDateString()
                            : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const StatCard = ({ icon, value, label }) => (
  <div className="stat-card">
    <div className="stat-icon">{icon}</div>
    <div className="stat-content">
      <h3>{value}</h3>
      <p>{label}</p>
    </div>
  </div>
);

export default AdminDashboard;
