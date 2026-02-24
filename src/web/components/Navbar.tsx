"use client";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import Link from "next/link";

export function Navbar() {
  const { user, logout } = useAuth();
  const { count } = useCart();

  return (
    <nav className="navbar">
      {/* Logo */}
      <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div
          style={{
            width: 38,
            height: 38,
            background: "linear-gradient(135deg, #1E5AA8, #164278)",
            borderRadius: 8,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 18,
            fontWeight: 900,
            color: "#D4AF37",
            fontFamily: "Inter, sans-serif",
          }}
        >
          I
        </div>
        <div>
          <div
            style={{
              fontSize: 15,
              fontWeight: 700,
              color: "#1E5AA8",
              lineHeight: 1,
            }}
          >
            INI Restaurant
          </div>
          <div style={{ fontSize: 10, color: "#9CA3AF", letterSpacing: 1 }}>
            IMIDUS TECHNOLOGIES
          </div>
        </div>
      </Link>

      {/* Nav Links */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <Link
          href="/menu"
          style={{
            padding: "8px 14px",
            fontSize: 14,
            fontWeight: 500,
            color: "#374151",
            borderRadius: 8,
          }}
        >
          Menu
        </Link>
        {user && (
          <Link
            href="/orders"
            style={{
              padding: "8px 14px",
              fontSize: 14,
              fontWeight: 500,
              color: "#374151",
              borderRadius: 8,
            }}
          >
            Orders
          </Link>
        )}

        {/* Cart */}
        <Link
          href="/cart"
          style={{ position: "relative", padding: "8px 14px" }}
        >
          <span style={{ fontSize: 20 }}>🛒</span>
          {count > 0 && <span className="cart-badge">{count}</span>}
        </Link>

        {/* Auth */}
        {user ? (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span className="badge-gold">⭐ {user.earnedPoints} pts</span>
            <Link
              href="/profile"
              style={{ fontSize: 14, fontWeight: 600, color: "#1E5AA8" }}
            >
              {user.firstName}
            </Link>
            <button
              onClick={logout}
              style={{
                background: "none",
                border: "1px solid #E5E7EB",
                borderRadius: 6,
                padding: "6px 12px",
                fontSize: 13,
                color: "#6B7280",
                cursor: "pointer",
              }}
            >
              Sign Out
            </button>
          </div>
        ) : (
          <div style={{ display: "flex", gap: 8 }}>
            <Link href="/login">
              <button
                className="btn-blue"
                style={{ padding: "8px 16px", fontSize: 14 }}
              >
                Sign In
              </button>
            </Link>
            <Link href="/register">
              <button
                className="btn-gold"
                style={{ padding: "8px 16px", fontSize: 14 }}
              >
                Join Now
              </button>
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}
