"use client";
import { useCart } from "@/context/CartContext";
import Link from "next/link";

export default function CartPage() {
  const { items, removeItem, updateQty, total, clearCart } = useCart();

  if (items.length === 0)
    return (
      <div
        style={{
          maxWidth: 600,
          margin: "80px auto",
          textAlign: "center",
          padding: 24,
        }}
      >
        <div style={{ fontSize: 72, marginBottom: 20 }}>🛒</div>
        <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>
          Your cart is empty
        </h2>
        <p style={{ color: "#6B7280", marginBottom: 28 }}>
          Looks like you haven&apos;t added anything yet.
        </p>
        <Link href="/menu">
          <button className="btn-gold">Browse Menu →</button>
        </Link>
      </div>
    );

  const subtotal = total;
  const tax = subtotal * 0.12;
  const orderTotal = subtotal + tax;

  return (
    <div style={{ maxWidth: 900, margin: "32px auto", padding: "0 24px" }}>
      <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 28 }}>
        Your Cart
      </h1>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 320px",
          gap: 24,
          alignItems: "start",
        }}
      >
        {/* Items */}
        <div>
          {items.map((item) => (
            <div
              key={item.menuItemId}
              className="card"
              style={{
                padding: 20,
                marginBottom: 12,
                display: "flex",
                alignItems: "center",
                gap: 16,
              }}
            >
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 10,
                  flexShrink: 0,
                  background: `linear-gradient(135deg, hsl(${(item.menuItemId * 47) % 360}, 55%, 50%), hsl(${(item.menuItemId * 47 + 40) % 360}, 65%, 35%))`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 24,
                }}
              >
                {
                  ["🍔", "🍕", "🥗", "🍗", "🌮", "🥩", "🍜", "🍣", "🥪"][
                    item.menuItemId % 9
                  ]
                }
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 15 }}>{item.name}</div>
                <div style={{ fontSize: 13, color: "#9CA3AF" }}>
                  {item.categoryName}
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <button
                  onClick={() => updateQty(item.menuItemId, item.quantity - 1)}
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 6,
                    border: "1px solid #E5E7EB",
                    background: "white",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  −
                </button>
                <span
                  style={{ fontWeight: 600, minWidth: 20, textAlign: "center" }}
                >
                  {item.quantity}
                </span>
                <button
                  onClick={() => updateQty(item.menuItemId, item.quantity + 1)}
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 6,
                    border: "1px solid #E5E7EB",
                    background: "white",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  +
                </button>
              </div>
              <div
                style={{
                  fontWeight: 700,
                  color: "#D4AF37",
                  minWidth: 64,
                  textAlign: "right",
                }}
              >
                ${(item.price * item.quantity).toFixed(2)}
              </div>
              <button
                onClick={() => removeItem(item.menuItemId)}
                style={{
                  background: "none",
                  border: "none",
                  color: "#D1D5DB",
                  fontSize: 18,
                  cursor: "pointer",
                  padding: 4,
                }}
              >
                ✕
              </button>
            </div>
          ))}
          <button
            onClick={clearCart}
            style={{
              background: "none",
              border: "none",
              color: "#9CA3AF",
              fontSize: 13,
              cursor: "pointer",
              marginTop: 4,
            }}
          >
            Clear cart
          </button>
        </div>

        {/* Order Summary */}
        <div
          className="card"
          style={{ padding: 24, position: "sticky", top: 80 }}
        >
          <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20 }}>
            Order Summary
          </h3>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: 10,
              fontSize: 14,
              color: "#6B7280",
            }}
          >
            <span>Subtotal</span>
            <span>${subtotal.toFixed(2)}</span>
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: 16,
              fontSize: 14,
              color: "#6B7280",
            }}
          >
            <span>Tax (12%)</span>
            <span>${tax.toFixed(2)}</span>
          </div>
          <div
            style={{
              borderTop: "1px solid #E5E7EB",
              paddingTop: 16,
              display: "flex",
              justifyContent: "space-between",
              fontWeight: 700,
              fontSize: 18,
              marginBottom: 20,
            }}
          >
            <span>Total</span>
            <span style={{ color: "#D4AF37" }}>${orderTotal.toFixed(2)}</span>
          </div>
          <Link href="/checkout">
            <button
              className="btn-gold"
              style={{ width: "100%", fontSize: 16, padding: "14px" }}
            >
              Proceed to Checkout →
            </button>
          </Link>
          <Link href="/menu">
            <button
              className="btn-blue"
              style={{
                width: "100%",
                marginTop: 10,
                fontSize: 14,
                padding: "10px",
              }}
            >
              ← Continue Shopping
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
