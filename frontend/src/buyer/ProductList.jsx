import { useEffect, useState } from "react";
import { productAPI } from "../components/services/api";

const ProductList = () => {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    productAPI.getAllActive().then(setProducts).catch(() => setProducts([]));
  }, []);

  return (
    <div>
      <h2>Available Products</h2>

      {products.length === 0 ? (
        <p>No products available</p>
      ) : (
        products.map((product) => (
          <div key={product.id} style={{ border: "1px solid #ccc", margin: 10, padding: 10 }}>
            <h3>{product.name}</h3>
            <p>Price: ₹{product.price}</p>
            <p>Quantity: {product.quantity}</p>
            <button type="button">View</button>
          </div>
        ))
      )}
    </div>
  );
};

export default ProductList;
