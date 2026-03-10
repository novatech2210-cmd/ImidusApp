"use client";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await login(email, password);
    if (res.success) router.push("/");
    else setError(res.error || "Login failed");
    setLoading(false);
  };

  return (
    <div
      style={{
        minHeight: "80vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
    >
      <div
        className="card"
        style={{ width: "100%", maxWidth: 420, padding: 40 }}
      >
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div
            style={{
              width: 56,
              height: 56,
              background:
                "linear-gradient(135deg, var(--color-brand-blue), var(--color-brand-blue))",
              borderRadius: 14,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 24,
              fontWeight: 900,
              color: "var(--color-brand-gold)",
              margin: "0 auto 16px",
            }}
          >
            I
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 800, margin: "0 0 6px" }}>
            Welcome Back
          </h1>
          <p
            style={{
              color: "var(--color-text-muted)",
              fontSize: 14,
              margin: 0,
            }}
          >
            Sign in to access your account and rewards
          </p>
        </div>

        {error && (
          <div
            style={{
              background: "var(--color-error-light)",
              border: "1px solid var(--color-error)",
              borderRadius: 8,
              padding: "12px 16px",
              marginBottom: 20,
              fontSize: 14,
              color: "var(--color-error)",
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: "var(--color-text)",
                display: "block",
                marginBottom: 6,
              }}
            >
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input"
              placeholder="you@example.com"
              required
            />
          </div>
          <div style={{ marginBottom: 24 }}>
            <label
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: "var(--color-text)",
                display: "block",
                marginBottom: 6,
              }}
            >
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input"
              placeholder="••••••••"
              required
            />
          </div>
          <button
            type="submit"
            className="btn-gold"
            style={{ width: "100%", fontSize: 15 }}
            disabled={loading}
          >
            {loading ? "Signing In..." : "Sign In →"}
          </button>
        </form>

        <div
          style={{
            textAlign: "center",
            marginTop: 24,
            fontSize: 14,
            color: "var(--color-text-muted)",
          }}
        >
          Don&apos;t have an account?{" "}
          <Link
            href="/register"
            style={{ color: "var(--color-brand-blue)", fontWeight: 600 }}
          >
            Create one
          </Link>
        </div>
      </div>
    </div>
  );
}
