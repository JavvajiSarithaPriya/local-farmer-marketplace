import { createContext, useContext, useState } from "react";

const OrderContext = createContext();

export function OrderProvider({ children }) {
  const [orders, setOrders] = useState([]);

  const placeOrder = (order) => {
    setOrders((prev) => [...prev, order]);
  };

  const updateOrderStatus = (index, status) => {
    setOrders((prev) =>
      prev.map((o, i) => (i === index ? { ...o, status } : o))
    );
  };

  return (
    <OrderContext.Provider value={{ orders, placeOrder, updateOrderStatus }}>
      {children}
    </OrderContext.Provider>
  );
}

export function useOrders() {
  return useContext(OrderContext);
}
