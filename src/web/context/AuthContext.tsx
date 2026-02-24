"use client";
import { apiClient } from "@/lib/api";
import React, { createContext, useContext, useEffect, useState } from "react";

interface User {
  profileId: number;
  email: string;
  firstName: string;
  lastName: string;
  earnedPoints: number;
  loyaltyTier: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (
    email: string,
    password: string,
  ) => Promise<{ success: boolean; error?: string }>;
  register: (
    data: RegisterData,
  ) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  isLoading: boolean;
}

interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem("auth_token");
    const savedUser = localStorage.getItem("auth_user");
    if (saved && savedUser) {
      setToken(saved);
      setUser(JSON.parse(savedUser));
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const res = await apiClient("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      if (res.success && res.token) {
        setToken(res.token);
        setUser(res.profile);
        localStorage.setItem("auth_token", res.token);
        localStorage.setItem("auth_user", JSON.stringify(res.profile));
        return { success: true };
      }
      return { success: false, error: res.errorMessage || "Login failed" };
    } catch {
      return {
        success: false,
        error: "Network error — is the backend running?",
      };
    }
  };

  const register = async (data: RegisterData) => {
    try {
      const res = await apiClient("/auth/register", {
        method: "POST",
        body: JSON.stringify(data),
      });
      if (res.success && res.token) {
        setToken(res.token);
        setUser(res.profile);
        localStorage.setItem("auth_token", res.token);
        localStorage.setItem("auth_user", JSON.stringify(res.profile));
        return { success: true };
      }
      return {
        success: false,
        error: res.errorMessage || "Registration failed",
      };
    } catch {
      return { success: false, error: "Network error" };
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("auth_token");
    localStorage.removeItem("auth_user");
  };

  return (
    <AuthContext.Provider
      value={{ user, token, login, register, logout, isLoading }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
};
