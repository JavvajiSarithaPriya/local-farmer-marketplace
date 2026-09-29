import { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { cartAPI } from '../services/api';

const CartContext = createContext(null);

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export const CartProvider = ({ children }) => {
  const { user } = useAuth();
  const [cartItems, setCartItems] = useState(() => {
    const savedCart = localStorage.getItem('cart');
    return savedCart ? JSON.parse(savedCart) : [];
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cartItems));
  }, [cartItems]);

  const syncCartFromServer = async () => {
    if (!user?.id || user.role !== 'BUYER') {
      setCartItems([]);
      setError('');
      return;
    }
    try {
      const response = await cartAPI.getByBuyer(user.id);
      const items = (response.items || []).map(item => ({
        id: item.id,
        productId: item.product?.id,
        name: item.product?.name,
        price: item.product?.price,
        farmerName: item.product?.farmer?.fullName || 'Unknown Farmer',
        quantity: item.quantity,
        unit: 'kg',
      }));
      setCartItems(items);
      setError('');
    } catch (err) {
      setError(err.message || 'Unable to sync cart');
    }
  };

  useEffect(() => {
    if (user?.id && user.role === 'BUYER') {
      syncCartFromServer();
    }
  // syncCartFromServer is recreated with the current user and is intentionally
  // triggered only when the authenticated user changes.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, user?.role]);

  const addToCart = async (product, quantity = 1) => {
    if (!user?.id) {
      throw new Error('Please login to use the cart');
    }

    setLoading(true);
    setError('');
    try {
      await cartAPI.add(user.id, product.productId || product.id, quantity);
      await syncCartFromServer();
      return true;
    } catch (err) {
      setError(err.message || 'Failed to add item to cart');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const removeFromCart = async (cartItemId) => {
    if (!user?.id) { return; }
    setLoading(true);
    try {
      await cartAPI.removeItem(user.id, cartItemId);
      await syncCartFromServer();
    } catch (err) {
      setError(err.message || 'Failed to remove item');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (cartItemId, quantity) => {
    if (!user?.id) { return; }
    if (quantity <= 0) {
      await removeFromCart(cartItemId);
      return;
    }
    setLoading(true);
    try {
      await cartAPI.updateQuantity(user.id, cartItemId, quantity);
      await syncCartFromServer();
    } catch (err) {
      setError(err.message || 'Failed to update quantity');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const clearCart = async () => {
    if (!user?.id) { return; }
    setLoading(true);
    try {
      await cartAPI.clear(user.id);
      setCartItems([]);
      setError('');
    } catch (err) {
      setError(err.message || 'Failed to clear cart');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getTotalItems = () => {
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  };

  const getTotalPrice = () => {
    return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const value = {
    cartItems,
    loading,
    error,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getTotalItems,
    getTotalPrice,
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};