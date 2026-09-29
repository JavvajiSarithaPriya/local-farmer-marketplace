import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../components/context/AuthContext";
import { useLanguage } from "../components/context/LanguageContext";
import { useNotification } from "../components/context/NotificationContext";
import { productAPI, getImageUrl } from "../components/services/api";

const AddProduct = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useLanguage();
  const { showModal } = useNotification();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isEditMode, setIsEditMode] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");

  const [product, setProduct] = useState({
    id: null,
    name: "",
    price: "",
    quantity: "",
    unit: "kg",
    category: "vegetables",
    description: "",
    imageUrl: "",
  });

  useEffect(() => {
    const editProduct = sessionStorage.getItem("editProduct");
    if (editProduct) {
      try {
        const parsed = JSON.parse(editProduct);
        setProduct({
          id: parsed.id || null,
          name: parsed.name || "",
          price: parsed.price || "",
          quantity: parsed.quantity || "",
          unit: parsed.unit || "kg",
          category: parsed.category || "vegetables",
          description: parsed.description || "",
          imageUrl: parsed.imageUrl || "",
        });
        if (parsed.imageUrl) {
          setImagePreview(getImageUrl(parsed.imageUrl));
        }
        setIsEditMode(true);
      } catch (err) {
        console.warn("Could not parse editProduct from sessionStorage:", err);
      }
    }
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProduct((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate type
    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type.toLowerCase())) {
      setError(t("invalidImageType"));
      e.target.value = "";
      return;
    }

    // Validate size: 5MB
    if (file.size > 5 * 1024 * 1024) {
      setError(t("imageTooLarge"));
      e.target.value = "";
      return;
    }

    setError("");
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview("");
    setProduct((prev) => ({ ...prev, imageUrl: "" }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Validate inputs
      if (!product.name.trim() || !product.price || !product.quantity) {
        setError(t("requiredFieldsError"));
        setLoading(false);
        return;
      }

      if (!user || !user.id) {
        setError(t("userNotLoggedIn"));
        setLoading(false);
        return;
      }

      let finalImageUrl = product.imageUrl || null;

      // If user uploaded a new image file, upload it first
      if (imageFile) {
        const uploadResult = await productAPI.uploadImage(imageFile, user.id);
        finalImageUrl = uploadResult.imageUrl;
      }

      const productData = {
        name: product.name.trim(),
        price: parseFloat(product.price),
        quantity: parseInt(product.quantity),
        unit: product.unit || "kg",
        category: product.category,
        description: product.description.trim() || null,
        imageUrl: finalImageUrl,
      };

      console.log("📤 Sending product to API:", productData);

      let response;
      if (isEditMode && product.id) {
        response = await productAPI.update(product.id, productData, user.id);
      } else {
        response = await productAPI.create(productData, user.id);
      }

      console.log("✅ Product saved successfully:", response);
      
      const successTitle = isEditMode
        ? (t("productUpdatedSuccessfully") || "Product Updated")
        : (t("productAddedSuccessfully") || "Product Added");

      sessionStorage.removeItem("editProduct");

      setProduct({
        id: null,
        name: "",
        price: "",
        quantity: "",
        unit: "kg",
        category: "vegetables",
        description: "",
        imageUrl: "",
      });
      setImageFile(null);
      setImagePreview("");
      setIsEditMode(false);

      showModal({
        type: "success",
        title: successTitle,
        message: isEditMode
          ? "Your product details have been successfully updated."
          : "Your product has been listed on the marketplace.",
        confirmText: "Continue",
        onConfirm: () => navigate("/farmer-dashboard"),
        onClose: () => navigate("/farmer-dashboard"),
        autoCloseMs: 1200,
      });

      setTimeout(() => {
        navigate("/farmer-dashboard");
      }, 1200);
    } catch (err) {
      console.error("❌ Error saving product:", err);
      setError(err.message || "Failed to save product. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: "640px", margin: "32px auto", padding: "0 20px" }}>
      <div style={{
        background: "#ffffff",
        borderRadius: "14px",
        padding: "32px",
        boxShadow: "0 4px 20px rgba(20, 45, 23, 0.06)",
        border: "1px solid #e2ede3"
      }}>
        <h2 style={{ color: "#14371f", marginTop: 0, marginBottom: "22px", fontSize: "22px", fontWeight: 700 }}>
          🌾 {isEditMode ? (t("edit") || "Edit Product") : t("addNewProduct")}
        </h2>

        {error && (
          <div style={{
            backgroundColor: "#fef2f2",
            border: "1px solid #fecaca",
            color: "#dc2626",
            padding: "12px 16px",
            borderRadius: "8px",
            marginBottom: "18px",
            fontSize: "14px",
            fontWeight: 500
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
          <div>
            <label style={{ display: "block", marginBottom: "7px", color: "#384f3c", fontWeight: 600, fontSize: "14px" }}>
              {t("productName")} *
            </label>
            <input
              type="text"
              name="name"
              value={product.name}
              placeholder={t("productNamePlaceholder")}
              onChange={handleChange}
              required
              style={{
                width: "100%",
                padding: "11px 14px",
                borderRadius: "8px",
                border: "1.5px solid #d2ded4",
                fontSize: "14.5px",
                boxSizing: "border-box"
              }}
            />
          </div>

          <div>
            <label style={{ display: "block", marginBottom: "7px", color: "#384f3c", fontWeight: 600, fontSize: "14px" }}>
              {t("description")}
            </label>
            <textarea
              name="description"
              value={product.description}
              placeholder={t("descriptionPlaceholder")}
              onChange={handleChange}
              rows={3}
              style={{
                width: "100%",
                padding: "11px 14px",
                borderRadius: "8px",
                border: "1.5px solid #d2ded4",
                fontSize: "14.5px",
                boxSizing: "border-box",
                fontFamily: "inherit"
              }}
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
            <div>
              <label style={{ display: "block", marginBottom: "7px", color: "#384f3c", fontWeight: 600, fontSize: "14px" }}>
                {t("price")} (₹) *
              </label>
              <input
                type="number"
                name="price"
                value={product.price}
                placeholder={t("pricePlaceholder")}
                onChange={handleChange}
                required
                step="0.01"
                min="0"
                style={{
                  width: "100%",
                  padding: "11px 14px",
                  borderRadius: "8px",
                  border: "1.5px solid #d2ded4",
                  fontSize: "14.5px",
                  boxSizing: "border-box"
                }}
              />
            </div>

            <div>
              <label style={{ display: "block", marginBottom: "7px", color: "#384f3c", fontWeight: 600, fontSize: "14px" }}>
                {t("quantity")} *
              </label>
              <input
                type="number"
                name="quantity"
                value={product.quantity}
                placeholder={t("quantityPlaceholder")}
                onChange={handleChange}
                required
                min="0"
                style={{
                  width: "100%",
                  padding: "11px 14px",
                  borderRadius: "8px",
                  border: "1.5px solid #d2ded4",
                  fontSize: "14.5px",
                  boxSizing: "border-box"
                }}
              />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
            <div>
              <label style={{ display: "block", marginBottom: "7px", color: "#384f3c", fontWeight: 600, fontSize: "14px" }}>
                {t("unit")}
              </label>
              <select
                name="unit"
                value={product.unit}
                onChange={handleChange}
                style={{
                  width: "100%",
                  padding: "11px 14px",
                  borderRadius: "8px",
                  border: "1.5px solid #d2ded4",
                  fontSize: "14.5px",
                  background: "#ffffff",
                  boxSizing: "border-box"
                }}
              >
                <option value="kg">Kg</option>
                <option value="gram">Gram</option>
                <option value="litre">Litre</option>
                <option value="dozen">Dozen</option>
                <option value="piece">Piece</option>
              </select>
            </div>

            <div>
              <label style={{ display: "block", marginBottom: "7px", color: "#384f3c", fontWeight: 600, fontSize: "14px" }}>
                {t("categoryLabel")}
              </label>
              <select
                name="category"
                value={product.category}
                onChange={handleChange}
                style={{
                  width: "100%",
                  padding: "11px 14px",
                  borderRadius: "8px",
                  border: "1.5px solid #d2ded4",
                  fontSize: "14.5px",
                  background: "#ffffff",
                  boxSizing: "border-box"
                }}
              >
                <option value="vegetables">Vegetables</option>
                <option value="fruits">Fruits</option>
                <option value="grains">Grains</option>
                <option value="dairy">Dairy</option>
                <option value="organic">Organic</option>
              </select>
            </div>
          </div>

          {/* Product Image Field */}
          <div>
            <label style={{ display: "block", marginBottom: "7px", color: "#384f3c", fontWeight: 600, fontSize: "14px" }}>
              {t("productImage") || "Product Image"}
            </label>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleImageChange}
              style={{
                width: "100%",
                padding: "8px 12px",
                borderRadius: "8px",
                border: "1.5px solid #d2ded4",
                boxSizing: "border-box",
                background: "#ffffff"
              }}
            />
            <small style={{ color: "#6b826e", display: "block", marginTop: "5px", fontSize: "12.5px" }}>
              {t("invalidImageType") || "Only JPG, PNG, and WebP images are allowed"} ({t("imageTooLarge") || "Max 5MB"})
            </small>

            {imagePreview && (
              <div style={{ marginTop: "12px", display: "flex", alignItems: "center", gap: "16px" }}>
                <img
                  src={imagePreview}
                  alt={t("imagePreview") || "Product Preview"}
                  style={{ width: "90px", height: "90px", objectFit: "cover", borderRadius: "8px", border: "1px solid #e2ede3" }}
                />
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  style={{
                    padding: "7px 14px",
                    backgroundColor: "#fee2e2",
                    color: "#dc2626",
                    border: "1px solid #fecaca",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontSize: "13px",
                    fontWeight: 600
                  }}
                >
                  ✕ {t("removeImage") || "Remove Image"}
                </button>
              </div>
            )}
          </div>

          <div style={{ display: "flex", gap: "12px", marginTop: "10px" }}>
            <button
              type="submit"
              disabled={loading}
              style={{
                flex: 1,
                padding: "13px 20px",
                backgroundColor: loading ? "#9cb59f" : "#2e7d32",
                color: "white",
                border: "none",
                borderRadius: "8px",
                cursor: loading ? "not-allowed" : "pointer",
                fontSize: "15.5px",
                fontWeight: 700,
                boxShadow: "0 2px 8px rgba(46, 125, 50, 0.25)",
                transition: "all 0.2s ease"
              }}
            >
              {loading ? (isEditMode ? "Saving..." : t("addingProduct")) : (isEditMode ? "Save Changes" : t("addProduct"))}
            </button>

            <button
              type="button"
              onClick={() => navigate("/farmer-dashboard")}
              style={{
                flex: 1,
                padding: "13px 20px",
                backgroundColor: "#ffffff",
                color: "#536b56",
                border: "1.5px solid #d2ded4",
                borderRadius: "8px",
                cursor: "pointer",
                fontSize: "15.5px",
                fontWeight: 600,
                transition: "all 0.2s ease"
              }}
            >
              {t("cancel")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddProduct;

