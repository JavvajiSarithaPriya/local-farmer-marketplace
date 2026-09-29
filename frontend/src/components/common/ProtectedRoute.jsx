import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ProtectedRoute = ({ children, requiredRole }) => {
  const { user } = useAuth();

  // If user is not logged in, redirect to login
  if (!user) {
    console.warn("ProtectedRoute: No user found, redirecting to login");
    return <Navigate to="/login" replace />;
  }

  // If a specific role is required, check if user has that role
  if (requiredRole && user.role !== requiredRole) {
    console.warn(`ProtectedRoute: User role "${user.role}" doesn't match required role "${requiredRole}"`);
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;
