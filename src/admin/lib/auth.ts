"use client";

import { jwtDecode } from "jwt-decode";

interface DecodedToken {
  sub: string;
  email: string;
  role: string;
  permissions: string[];
  iat: number;
  exp: number;
}

export function saveToken(token: string, refreshToken: string): void {
  localStorage.setItem("adminToken", token);
  localStorage.setItem("adminRefreshToken", refreshToken);
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("adminToken");
}

export function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("adminRefreshToken");
}

export function clearTokens(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem("adminToken");
  localStorage.removeItem("adminRefreshToken");
  localStorage.removeItem("adminUser");
}

export function isTokenExpired(token: string): boolean {
  try {
    const decoded = jwtDecode<DecodedToken>(token);
    return decoded.exp * 1000 < Date.now();
  } catch {
    return true;
  }
}

export function decodeToken(token: string): DecodedToken | null {
  try {
    return jwtDecode<DecodedToken>(token);
  } catch {
    return null;
  }
}

export function isAuthenticated(): boolean {
  const token = getToken();
  if (!token) return false;
  return !isTokenExpired(token);
}

export function hasPermission(permission: string): boolean {
  const token = getToken();
  if (!token) return false;

  const decoded = decodeToken(token);
  if (!decoded) return false;

  return decoded.permissions?.includes(permission) || decoded.role === "admin";
}

export function getUserRole(): string | null {
  const token = getToken();
  if (!token) return null;

  const decoded = decodeToken(token);
  return decoded?.role || null;
}

export function saveUser(user: any): void {
  localStorage.setItem("adminUser", JSON.stringify(user));
}

export function getUser(): any {
  if (typeof window === "undefined") return null;
  const user = localStorage.getItem("adminUser");
  return user ? JSON.parse(user) : null;
}
