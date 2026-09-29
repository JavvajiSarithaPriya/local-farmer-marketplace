import { createContext, useContext, useState } from "react";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  // Aggressive localStorage cleanup on provider init
  const clearCorruptedStorage = () => {
    try {
      const keys = Object.keys(localStorage);
      for (let key of keys) {
        try {
          const value = localStorage.getItem(key);
          // Only keep auth-related valid JSON
          if (key === "user" && value) {
            JSON.parse(value);
          } else if (key === "user") {
            localStorage.removeItem(key);
          }
        } catch {
          console.warn(`Removing corrupted key: ${key}`);
          localStorage.removeItem(key);
        }
      }
    } catch (err) {
      console.error("Error clearing storage:", err);
      localStorage.clear();
    }
  };

  clearCorruptedStorage();

  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem("user");
      if (!savedUser) return null;
      const parsed = JSON.parse(savedUser);
      console.log("✓ User loaded from storage:", parsed);
      return parsed;
    } catch (error) {
      console.error("❌ Error parsing user from localStorage:", error);
      localStorage.removeItem("user");
      return null;
    }
  });

  const login = (userData) => {
    try {
      console.log("📝 Saving user to localStorage:", userData);
      const dataToSave = {
        id: userData.id,
        fullName: userData.fullName,
        mobileNumber: userData.mobileNumber,
        role: userData.role,
      };
      localStorage.setItem("user", JSON.stringify(dataToSave));
      // Store token if provided (used for admin API authorization)
      if (userData.token) {
        localStorage.setItem("authToken", userData.token);
      }
      setUser(dataToSave);
    } catch (error) {
      console.error("❌ Error saving user to localStorage:", error);
      setUser(userData);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("user");
    localStorage.removeItem("authToken");
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
