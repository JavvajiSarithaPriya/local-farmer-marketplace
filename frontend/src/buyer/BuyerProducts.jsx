import { useEffect, useState } from "react";
import { useAuth } from "../components/context/AuthContext";
import { useCart } from "../components/context/CartContext";
import { useLanguage } from "../components/context/LanguageContext";
import { useNotification } from "../components/context/NotificationContext";
import { productAPI } from "../components/services/api";

function BuyerProducts() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { addToCart } = useCart();
  const { showToast } = useNotification();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    productAPI.getAllActive()
      .then(setProducts)
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, []);

  const addProductToCart = async (product) => {
    if (!user) return;
    await addToCart(product, 1);
    showToast(t("productAdded") || "Product added to cart", "success");
  };

  return (
    <div>
      <h2>{t("availableProducts")}</h2>

      {loading && <p>{t("loadingProducts") || "Loading..."}</p>}
      {!loading && products.length === 0 && <p>{t("noProductsAvailable")}</p>}

      {products.map((p) => (
        <div key={p.id} style={{ border: "1px solid gray", margin: 10, padding: 10 }}>
          <p><b>{t("name")}:</b> {p.name}</p>
          <p><b>{t("price")}:</b> ₹{p.price}</p>
          <p><b>{t("quantity")}:</b> {p.quantity}</p>

          <button onClick={() => addProductToCart(p)}>{t("addToCart") || t("buyNow")}</button>
        </div>
      ))}
    </div>
  );
}

export default BuyerProducts;
