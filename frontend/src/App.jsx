import { Routes, Route } from "react-router-dom";

import Home from "./pages/Home";
import LoginPage from "./pages/LoginPage";
import Register from "./pages/Register";
import NotFound from "./pages/NotFound";

import FarmerDashboard from "./pages/FarmerDashboard";
import MyProducts from "./pages/MyProducts";
import AddProduct from "./farmer/AddProduct";
import FarmerOrders from "./pages/FarmerOrders";

import BuyerDashboard from "./pages/BuyerDashboard";
import BuyerOrders from "./pages/BuyerOrders";
import Cart from "./pages/Cart";
import AdminDashboard from "./pages/AdminDashboard";
import Profile from "./pages/Profile";

import ProtectedRoute from "./components/common/ProtectedRoute";
import Navbar from "./components/common/Navbar";
import Footer from "./components/common/Footer";
import { LanguageProvider } from "./components/context/LanguageContext";
import { NotificationProvider } from "./components/context/NotificationContext";

function App() {
  return (
    <LanguageProvider>
      <NotificationProvider>
        <Navbar />

        <main className="app-main-content">
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<Register />} />

            {/* Farmer Routes */}
            <Route
              path="/farmer-dashboard"
              element={
                <ProtectedRoute requiredRole="FARMER">
                  <FarmerDashboard />
                </ProtectedRoute>
              }
            />

            <Route
              path="/add-product"
              element={
                <ProtectedRoute requiredRole="FARMER">
                  <AddProduct />
                </ProtectedRoute>
              }
            />

            <Route
              path="/my-products"
              element={
                <ProtectedRoute requiredRole="FARMER">
                  <MyProducts />
                </ProtectedRoute>
              }
            />

            <Route
              path="/farmer-orders"
              element={
                <ProtectedRoute requiredRole="FARMER">
                  <FarmerOrders />
                </ProtectedRoute>
              }
            />

            {/* Buyer Routes */}
            <Route
              path="/buyer-dashboard"
              element={
                <ProtectedRoute requiredRole="BUYER">
                  <BuyerDashboard />
                </ProtectedRoute>
              }
            />

            <Route
              path="/buyer-orders"
              element={
                <ProtectedRoute requiredRole="BUYER">
                  <BuyerOrders />
                </ProtectedRoute>
              }
            />

            <Route
              path="/cart"
              element={
                <ProtectedRoute requiredRole="BUYER">
                  <Cart />
                </ProtectedRoute>
              }
            />

            <Route
              path="/admin-dashboard"
              element={
                <ProtectedRoute requiredRole="ADMIN">
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />

            {/* Profile Route - both roles */}
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />

            {/* 404 Not Found */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>

        <Footer />
      </NotificationProvider>
    </LanguageProvider>
  );
}

export default App;

