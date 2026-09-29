import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../components/context/AuthContext";
import { useLanguage } from "../components/context/LanguageContext";
import { useNotification } from "../components/context/NotificationContext";
import { productAPI, getImageUrl } from "../components/services/api";

const MyProducts = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { showModal } = useNotification();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadProducts = async () => {
    if (!user || user.role !== "FARMER") {
      setProducts([]);
      return;
    }

    setLoading(true);
    setError("");
    try {
      const fetchedProducts = await productAPI.getByFarmer(user.id);
      setProducts(fetchedProducts || []);
    } catch (err) {
      console.error("Failed to load products:", err);
      setError(t("failedLoadProducts") || "Failed to load products.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  // loadProducts is intentionally invoked when the authenticated user changes.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleDelete = (productId) => {
    if (!user) return;
    showModal({
      type: "warning",
      title: t("confirmDeleteProduct") || "Delete Product",
      message: t("confirmDeleteMessage") || "Are you sure you want to delete this product from your inventory?",
      confirmText: "Delete",
      cancelText: "Cancel",
      onConfirm: async () => {
        try {
          await productAPI.delete(productId, user.id);
          await loadProducts();
          showModal({
            type: "success",
            title: t("productDeleted") || "Product Deleted",
            message: "The product has been removed from your inventory.",
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
  };

  return (
    <div style={{ maxWidth: "1000px", margin: "24px auto", padding: "0 20px" }}>
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "20px",
        flexWrap: "wrap",
        gap: "12px"
      }}>
        <h2 style={{ color: "#14371f", margin: 0, fontSize: "24px", fontWeight: 700 }}>
          🌾 {t("myProducts")}
        </h2>
        <button
          onClick={() => navigate("/add-product")}
          className="btn-primary"
          style={{ padding: "9px 18px" }}
        >
          ➕ {t("addProduct")}
        </button>
      </div>

      {loading && (
        <div style={{ textAlign: "center", padding: "30px", color: "#536b56" }}>
          {t("loading") || "Loading..."}
        </div>
      )}
      
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

      {!loading && products.length === 0 && (
        <div style={{
          background: "#ffffff",
          border: "1px solid #e2ede3",
          borderRadius: "14px",
          padding: "48px 20px",
          textAlign: "center",
          color: "#536b56"
        }}>
          <p style={{ fontSize: "16px", marginBottom: "20px" }}>{t("noProductsAddedYet") || "No products added yet."}</p>
          <button onClick={() => navigate("/add-product")} className="btn-primary">
            ➕ {t("addProduct")}
          </button>
        </div>
      )}

      <div style={{ display: "grid", gap: "16px" }}>
        {products.map((product) => (
          <div
            key={product.id}
            style={{
              background: "#ffffff",
              border: "1px solid #e2ede3",
              padding: "20px",
              borderRadius: "12px",
              display: "flex",
              gap: "20px",
              alignItems: "flex-start",
              boxShadow: "0 2px 8px rgba(20, 45, 23, 0.04)"
            }}
          >
            <div style={{
              width: "90px",
              height: "90px",
              borderRadius: "8px",
              overflow: "hidden",
              background: "#eaf5eb",
              flexShrink: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "1px solid #e2ede3"
            }}>
              {product.imageUrl ? (
                <img
                  src={getImageUrl(product.imageUrl)}
                  alt={product.name}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  onError={(e) => { e.currentTarget.style.display = "none"; e.currentTarget.nextSibling.style.display = "flex"; }}
                />
              ) : null}
              <span style={{ display: product.imageUrl ? "none" : "flex", fontSize: "36px" }}>🌾</span>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "8px" }}>
                <h3 style={{ margin: "0 0 6px 0", color: "#14371f", fontSize: "18px", fontWeight: 700 }}>
                  {product.name}
                </h3>
                <span style={{
                  fontSize: "12px",
                  fontWeight: 600,
                  padding: "3px 8px",
                  borderRadius: "4px",
                  backgroundColor: "#eaf5eb",
                  color: "#2e7d32",
                  textTransform: "capitalize"
                }}>
                  {product.category || "General"}
                </span>
              </div>
              <p style={{ margin: "4px 0", color: "#2e7d32", fontWeight: 700, fontSize: "16px" }}>
                ₹{Number(product.price).toFixed(2)} / {product.unit || "kg"}
              </p>
              <p style={{ margin: "4px 0", color: "#536b56", fontSize: "14px" }}>
                {t("quantity")}: <strong>{product.quantity} {product.unit || "kg"}</strong>
              </p>
              {product.description && (
                <p style={{ margin: "6px 0", color: "#6b826e", fontSize: "13.5px", lineHeight: 1.45 }}>
                  {product.description}
                </p>
              )}
              <div style={{ display: "flex", gap: "10px", marginTop: "14px" }}>
                <button
                  onClick={() => {
                    sessionStorage.setItem("editProduct", JSON.stringify(product));
                    navigate("/add-product");
                  }}
                  className="btn-primary"
                  style={{ padding: "6px 14px", fontSize: "13px" }}
                >
                  ✏️ {t("edit") || "Edit"}
                </button>
                <button
                  onClick={() => handleDelete(product.id)}
                  style={{
                    padding: "6px 14px",
                    backgroundColor: "#fee2e2",
                    color: "#dc2626",
                    border: "1px solid #fecaca",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontSize: "13px",
                    fontWeight: 600,
                    transition: "all 0.2s ease"
                  }}
                >
                  🗑️ {t("delete") || "Delete"}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MyProducts;

