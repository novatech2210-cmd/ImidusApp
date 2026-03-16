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
        <img
          src="/brand/imidus-triangle-logo.png"
          alt="IMIDUS Logo"
          style={{ width: 44, height: 44, objectFit: "contain" }}
        />
        <div>
          <div
            style={{
              fontSize: 16,
              fontWeight: 800,
              color: "var(--color-brand-blue)",
              lineHeight: 1,
              letterSpacing: "-0.02em",
              textTransform: "uppercase",
            }}
          >
            Imidus App
          </div>
          <div
            style={{
              fontSize: 9,
              color: "var(--color-brand-gold)",
              fontWeight: 700,
              letterSpacing: 1.5,
              textTransform: "uppercase",
            }}
          >
            Technologies | Inc
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
            color: "var(--color-text)",
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
              color: "var(--color-text)",
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
              style={{
                fontSize: 14,
                fontWeight: 600,
                color: "var(--color-brand-blue)",
              }}
            >
              {user.firstName}
            </Link>
            <button
              onClick={logout}
              style={{
                background: "none",
                border: "1px solid var(--color-mid-gray)",
                borderRadius: 6,
                padding: "6px 12px",
                fontSize: 13,
                color: "var(--color-text-muted)",
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
