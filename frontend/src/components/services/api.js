const RAW_ENV_URL = import.meta.env.VITE_API_URL;
let calculatedApiBase = 'http://localhost:8080/api';
let calculatedBackendBase = 'http://localhost:8080';

if (RAW_ENV_URL) {
  const trimmed = RAW_ENV_URL.trim().replace(/\/+$/, '');
  if (trimmed.endsWith('/api')) {
    calculatedApiBase = trimmed;
    calculatedBackendBase = trimmed.slice(0, -4);
  } else {
    calculatedApiBase = `${trimmed}/api`;
    calculatedBackendBase = trimmed;
  }
}

export const API_BASE_URL = calculatedApiBase;
export const BACKEND_BASE_URL = calculatedBackendBase;

/**
 * Central helper function to safely build image URLs from relative paths or pass through full URLs
 */
export const getImageUrl = (imagePath) => {
  if (!imagePath) return '';
  if (
    imagePath.startsWith('http://') ||
    imagePath.startsWith('https://') ||
    imagePath.startsWith('data:') ||
    imagePath.startsWith('blob:')
  ) {
    return imagePath;
  }
  const cleanPath = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
  return `${BACKEND_BASE_URL}${cleanPath}`;
};

const authHeaders = () => {
  const token = localStorage.getItem('authToken');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

// Helper function to safely parse error responses
const parseErrorResponse = async (response) => {
  try {
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await response.json();
    } else {
      const text = await response.text();
      return { message: text || response.statusText };
    }
  } catch {
    return { message: `Error: ${response.status} ${response.statusText}` };
  }
};

// Auth API calls
export const authAPI = {
  register: async (userData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        const error = await parseErrorResponse(response);
        throw new Error(error.message || 'Registration failed');
      }

      return await response.json();
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  },

  login: async (credentials) => {
    try {
      console.log('📤 Sending login request:', { 
        mobileNumber: credentials.mobileNumber, 
        password: '***' 
      });

      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      console.log('📥 Login response status:', response.status);

      if (!response.ok) {
        const error = await parseErrorResponse(response);
        console.error('❌ Login failed:', error);
        throw new Error(error.message || `Login failed (${response.status})`);
      }

      const userData = await response.json();
      console.log('✅ Login successful:', { 
        id: userData.id, 
        fullName: userData.fullName, 
        role: userData.role 
      });
      return userData;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  },
};

// Product API calls
export const productAPI = {
  // Upload product image (Farmer only)
  uploadImage: async (file, farmerId) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_BASE_URL}/products/upload-image?farmerId=${farmerId}`, {
        method: 'POST',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: formData,
      });

      if (!response.ok) {
        const error = await parseErrorResponse(response);
        throw new Error(error.message || 'Failed to upload image');
      }

      return await response.json();
    } catch (error) {
      console.error('Upload product image error:', error);
      throw error;
    }
  },

  // Create a new product (Farmer only)
  create: async (productData, farmerId) => {
    try {
      console.log('📤 Creating product for farmer:', farmerId);
      const response = await fetch(`${API_BASE_URL}/products?farmerId=${farmerId}`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(productData),
      });

      console.log('📥 Create product response status:', response.status);

      if (!response.ok) {
        const error = await parseErrorResponse(response);
        throw new Error(error.message || 'Failed to create product');
      }

      const product = await response.json();
      console.log('✅ Product created successfully:', product);
      return product;
    } catch (error) {
      console.error('Create product error:', error);
      throw error;
    }
  },

  // Get all products for a specific farmer
  getByFarmer: async (farmerId) => {
    try {
      console.log('📤 Fetching products for farmer:', farmerId);
      const response = await fetch(`${API_BASE_URL}/products/farmer/${farmerId}`, {
        method: 'GET',
        headers: authHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch farmer products');
      }

      const products = await response.json();
      console.log('✅ Farmer products fetched:', products);
      return products;
    } catch (error) {
      console.error('Fetch farmer products error:', error);
      throw error;
    }
  },

  // Get a specific product by ID
  getById: async (productId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/products/${productId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch product');
      }

      return await response.json();
    } catch (error) {
      console.error('Fetch product error:', error);
      throw error;
    }
  },

  // Update a product (Farmer only)
  update: async (productId, productData, farmerId) => {
    try {
      console.log('📤 Updating product:', productId);
      const response = await fetch(`${API_BASE_URL}/products/${productId}?farmerId=${farmerId}`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify(productData),
      });

      if (!response.ok) {
        const error = await parseErrorResponse(response);
        throw new Error(error.message || 'Failed to update product');
      }

      const product = await response.json();
      console.log('✅ Product updated successfully:', product);
      return product;
    } catch (error) {
      console.error('Update product error:', error);
      throw error;
    }
  },

  // Delete a product (Farmer only - soft delete)
  delete: async (productId, farmerId) => {
    try {
      console.log('📤 Deleting product:', productId);
      const response = await fetch(`${API_BASE_URL}/products/${productId}?farmerId=${farmerId}`, {
        method: 'DELETE',
        headers: authHeaders(),
      });

      if (!response.ok) {
        const error = await parseErrorResponse(response);
        throw new Error(error.message || 'Failed to delete product');
      }

      console.log('✅ Product deleted successfully');
      return await response.text();
    } catch (error) {
      console.error('Delete product error:', error);
      throw error;
    }
  },

  // Get all active products (for buyers)
  getAllActive: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/products/all/active`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch products');
      }

      return await response.json();
    } catch (error) {
      console.error('Fetch active products error:', error);
      throw error;
    }
  },

  // Get all products (admin)
  getAll: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/products/all`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch products');
      }

      return await response.json();
    } catch (error) {
      console.error('Fetch all products error:', error);
      throw error;
    }
  },

  // Search and filter products
  searchAndFilter: async (params = {}) => {
    try {
      const queryParams = new URLSearchParams();
      
      if (params.searchTerm) queryParams.append('searchTerm', params.searchTerm);
      if (params.category) queryParams.append('category', params.category);
      if (params.minPrice) queryParams.append('minPrice', params.minPrice);
      if (params.maxPrice) queryParams.append('maxPrice', params.maxPrice);
      if (params.sortBy) queryParams.append('sortBy', params.sortBy);
      if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);

      const url = `${API_BASE_URL}/products/search${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to search products');
      }

      return await response.json();
    } catch (error) {
      console.error('Search products error:', error);
      throw error;
    }
  },

  // Get all categories
  getCategories: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/products/categories`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch categories');
      }

      return await response.json();
    } catch (error) {
      console.error('Fetch categories error:', error);
      throw error;
    }
  },
};

// Cart API calls
export const cartAPI = {
  add: async (buyerId, productId, quantity) => {
    try {
      const response = await fetch(`${API_BASE_URL}/cart/add?buyerId=${buyerId}&productId=${productId}&quantity=${quantity}`, {
        method: 'POST',
        headers: authHeaders(),
      });
      if (!response.ok) {
        const error = await parseErrorResponse(response);
        throw new Error(error.message || 'Failed to add item to cart');
      }
      return await response.json();
    } catch (error) {
      console.error('Add to cart error:', error);
      throw error;
    }
  },

  getByBuyer: async (buyerId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/cart?buyerId=${buyerId}`, {
        method: 'GET',
        headers: authHeaders(),
      });
      if (!response.ok) {
        const error = await parseErrorResponse(response);
        throw new Error(error.message || 'Failed to fetch cart');
      }
      return await response.json();
    } catch (error) {
      console.error('Fetch cart error:', error);
      throw error;
    }
  },

  updateQuantity: async (buyerId, cartItemId, quantity) => {
    try {
      const response = await fetch(`${API_BASE_URL}/cart/update/${cartItemId}?buyerId=${buyerId}&quantity=${quantity}`, {
        method: 'PUT',
        headers: authHeaders(),
      });
      if (!response.ok) {
        const error = await parseErrorResponse(response);
        throw new Error(error.message || 'Failed to update cart quantity');
      }
      return await response.json();
    } catch (error) {
      console.error('Update cart quantity error:', error);
      throw error;
    }
  },

  removeItem: async (buyerId, cartItemId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/cart/remove/${cartItemId}?buyerId=${buyerId}`, {
        method: 'DELETE',
        headers: authHeaders(),
      });
      if (!response.ok) {
        const error = await parseErrorResponse(response);
        throw new Error(error.message || 'Failed to remove cart item');
      }
      return await response.text();
    } catch (error) {
      console.error('Remove cart item error:', error);
      throw error;
    }
  },

  clear: async (buyerId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/cart/clear?buyerId=${buyerId}`, {
        method: 'DELETE',
        headers: authHeaders(),
      });
      if (!response.ok) {
        const error = await parseErrorResponse(response);
        throw new Error(error.message || 'Failed to clear cart');
      }
      return await response.text();
    } catch (error) {
      console.error('Clear cart error:', error);
      throw error;
    }
  },
};

// Order API calls
export const orderAPI = {
  place: async (buyerId, productId, quantity) => {
    try {
      const response = await fetch(`${API_BASE_URL}/orders`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ buyerId, productId, quantity }),
      });
      if (!response.ok) {
        const error = await parseErrorResponse(response);
        throw new Error(error.message || 'Failed to place order');
      }
      return await response.json();
    } catch (error) {
      console.error('Place order error:', error);
      throw error;
    }
  },

  getByBuyer: async (buyerId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/orders/buyer/${buyerId}`, {
        method: 'GET',
        headers: authHeaders(),
      });
      if (!response.ok) {
        throw new Error('Failed to fetch buyer orders');
      }
      return await response.json();
    } catch (error) {
      console.error('Fetch buyer orders error:', error);
      throw error;
    }
  },

  getByFarmer: async (farmerId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/orders/farmer/${farmerId}`, {
        method: 'GET',
        headers: authHeaders(),
      });
      if (!response.ok) {
        throw new Error('Failed to fetch farmer orders');
      }
      return await response.json();
    } catch (error) {
      console.error('Fetch farmer orders error:', error);
      throw error;
    }
  },

  updateStatus: async (orderId, farmerId, status) => {
    try {
      const response = await fetch(`${API_BASE_URL}/orders/${orderId}/status?farmerId=${farmerId}&status=${status}`, {
        method: 'PUT',
        headers: authHeaders(),
      });
      if (!response.ok) {
        const error = await parseErrorResponse(response);
        throw new Error(error.message || 'Failed to update order status');
      }
      return await response.json();
    } catch (error) {
      console.error('Update order status error:', error);
      throw error;
    }
  },

  // Cancel order (Buyer only, PENDING only)
  cancel: async (orderId, buyerId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/orders/${orderId}/cancel?buyerId=${buyerId}`, {
        method: 'PUT',
        headers: authHeaders(),
      });
      if (!response.ok) {
        const error = await parseErrorResponse(response);
        throw new Error(error.message || 'Failed to cancel order');
      }
      return await response.json();
    } catch (error) {
      console.error('Cancel order error:', error);
      throw error;
    }
  },
};

// Admin API calls
export const adminAPI = {
  // Helper: build auth headers with stored token
  _authHeaders() {
    const token = localStorage.getItem('authToken');
    return {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    };
  },

  // User management
  getAllUsers: async function() {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/users`, {
        method: 'GET',
        headers: this._authHeaders(),
      });
      if (!response.ok) {
        const err = await parseErrorResponse(response);
        throw new Error(err.message || 'Failed to fetch users');
      }
      return await response.json();
    } catch (error) {
      console.error('Fetch users error:', error);
      throw error;
    }
  },

  getFarmers: async function() {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/users/farmers`, {
        method: 'GET',
        headers: this._authHeaders(),
      });
      if (!response.ok) {
        const err = await parseErrorResponse(response);
        throw new Error(err.message || 'Failed to fetch farmers');
      }
      return await response.json();
    } catch (error) {
      console.error('Fetch farmers error:', error);
      throw error;
    }
  },

  getBuyers: async function() {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/users/buyers`, {
        method: 'GET',
        headers: this._authHeaders(),
      });
      if (!response.ok) {
        const err = await parseErrorResponse(response);
        throw new Error(err.message || 'Failed to fetch buyers');
      }
      return await response.json();
    } catch (error) {
      console.error('Fetch buyers error:', error);
      throw error;
    }
  },

  deactivateUser: async function(userId) {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/users/${userId}/deactivate`, {
        method: 'PUT',
        headers: this._authHeaders(),
      });
      if (!response.ok) {
        const err = await parseErrorResponse(response);
        throw new Error(err.message || err.error || 'Failed to deactivate user');
      }
      return await response.text();
    } catch (error) {
      console.error('Deactivate user error:', error);
      throw error;
    }
  },

  activateUser: async function(userId) {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/users/${userId}/activate`, {
        method: 'PUT',
        headers: this._authHeaders(),
      });
      if (!response.ok) {
        const err = await parseErrorResponse(response);
        throw new Error(err.message || 'Failed to activate user');
      }
      return await response.text();
    } catch (error) {
      console.error('Activate user error:', error);
      throw error;
    }
  },

  // Product management
  getAllProducts: async function() {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/products`, {
        method: 'GET',
        headers: this._authHeaders(),
      });
      if (!response.ok) {
        const err = await parseErrorResponse(response);
        throw new Error(err.message || 'Failed to fetch products');
      }
      return await response.json();
    } catch (error) {
      console.error('Fetch products error:', error);
      throw error;
    }
  },

  deactivateProduct: async function(productId) {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/products/${productId}/deactivate`, {
        method: 'PUT',
        headers: this._authHeaders(),
      });
      if (!response.ok) {
        const err = await parseErrorResponse(response);
        throw new Error(err.message || 'Failed to deactivate product');
      }
      return await response.text();
    } catch (error) {
      console.error('Deactivate product error:', error);
      throw error;
    }
  },

  activateProduct: async function(productId) {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/products/${productId}/activate`, {
        method: 'PUT',
        headers: this._authHeaders(),
      });
      if (!response.ok) {
        const err = await parseErrorResponse(response);
        throw new Error(err.message || 'Failed to activate product');
      }
      return await response.text();
    } catch (error) {
      console.error('Activate product error:', error);
      throw error;
    }
  },

  // Order management
  getAllOrders: async function() {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/orders`, {
        method: 'GET',
        headers: this._authHeaders(),
      });
      if (!response.ok) {
        const err = await parseErrorResponse(response);
        throw new Error(err.message || 'Failed to fetch orders');
      }
      return await response.json();
    } catch (error) {
      console.error('Fetch orders error:', error);
      throw error;
    }
  },

  // Statistics
  getStats: async function() {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/stats`, {
        method: 'GET',
        headers: this._authHeaders(),
      });
      if (!response.ok) {
        const err = await parseErrorResponse(response);
        throw new Error(err.message || 'Failed to fetch statistics');
      }
      return await response.json();
    } catch (error) {
      console.error('Fetch stats error:', error);
      throw error;
    }
  },
};

// Profile API calls
export const profileAPI = {
  update: async (userId, data) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/profile`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({ userId, ...data }),
      });
      if (!response.ok) {
        const error = await parseErrorResponse(response);
        throw new Error(error.message || 'Failed to update profile');
      }
      return await response.json();
    } catch (error) {
      console.error('Update profile error:', error);
      throw error;
    }
  },

  changePassword: async (mobileNumber, pin, newPassword) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobileNumber, pin, newPassword }),
      });
      if (!response.ok) {
        const error = await parseErrorResponse(response);
        throw new Error(error.message || 'Failed to change password');
      }
      return await response.json();
    } catch (error) {
      console.error('Change password error:', error);
      throw error;
    }
  },
};

// Feedback API calls
export const feedbackAPI = {
  submit: async (orderId, rating, comment) => {
    try {
      const response = await fetch(`${API_BASE_URL}/feedback`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ orderId, rating, comment }),
      });
      if (!response.ok) {
        const error = await parseErrorResponse(response);
        throw new Error(error.message || 'Failed to submit feedback');
      }
      return await response.json();
    } catch (error) {
      console.error('Submit feedback error:', error);
      throw error;
    }
  },

  getByOrder: async (orderId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/feedback/order/${orderId}`, {
        method: 'GET',
        headers: authHeaders(),
      });
      if (response.status === 404) return null;
      if (!response.ok) {
        throw new Error('Failed to fetch feedback');
      }
      return await response.json();
    } catch (error) {
      console.error('Fetch feedback error:', error);
      return null;
    }
  },

  getMyFeedback: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/feedback/my`, {
        method: 'GET',
        headers: authHeaders(),
      });
      if (!response.ok) {
        throw new Error('Failed to fetch my feedbacks');
      }
      return await response.json();
    } catch (error) {
      console.error('Fetch my feedback error:', error);
      return [];
    }
  },
};

export default {
  authAPI,
  productAPI,
  cartAPI,
  orderAPI,
  adminAPI,
  profileAPI,
  feedbackAPI,
  getImageUrl,
  API_BASE_URL,
  BACKEND_BASE_URL,
};

