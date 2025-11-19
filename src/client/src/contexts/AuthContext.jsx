import { createContext, useContext, useState, useEffect } from "react";
import { get } from "../utils/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in on mount
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem("token");
      if (token) {
        // Verify token and get user data
        const userData = await get("/users/me"); // Adjust endpoint as needed
        setUser(userData);

        localStorage.setItem("user", JSON.stringify(userData));
      }
    } catch (error) {
      console.error("Auth check failed:", error);
      localStorage.removeItem("token");
    } finally {
      setLoading(false);
    }
  };

  const login = (userData, token) => {
    // 儲存 token
    localStorage.setItem("token", token);

    // ★ 新增：順便把 user 存進 localStorage，讓 Navbar 讀得到
    localStorage.setItem("user", JSON.stringify(userData));

    // 更新 Context 裡的 user（給有用 useAuth 的元件用）
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
  };

  const value = {
    user,
    loading,
    login,
    logout,
    checkAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
