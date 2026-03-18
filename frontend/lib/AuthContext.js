"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { authAPI, getStoredUser, setAuth, clearAuth } from "./api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = getStoredUser();
    if (stored) setUser(stored);
    setLoading(false);
  }, []);

  const login = (token, userData) => {
    setAuth(token, userData);
    setUser(userData);
  };

  const logout = () => {
    clearAuth();
    setUser(null);
  };

  const refreshUser = async () => {
    try {
      const { user: fresh } = await authAPI.getMe();
      setUser(fresh);
      localStorage.setItem("ae_user", JSON.stringify(fresh));
    } catch {}
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
