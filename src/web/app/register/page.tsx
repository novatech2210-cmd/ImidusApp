"use client";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function RegisterPage() {
  const [form, setForm] = useState({
    email: "",
    password: "",
    firstName: "",
    lastName: "",
    phone: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const router = useRouter();

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await register(form);
    if (res.success) router.push("/");
    else setError(res.error || "Registration failed");
    setLoading(false);
  };

  const Field = ({
    label,
    name,
    type = "text",
    placeholder,
  }: {
    label: string;
    name: string;
    type?: string;
    placeholder?: string;
  }) => (
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
        {label}
      </label>
      <input
        type={type}
        value={form[name as keyof typeof form]}
        onChange={set(name)}
        className="input"
        placeholder={placeholder}
      />
    </div>
  );

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
        style={{ width: "100%", maxWidth: 440, padding: 40 }}
      >
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
            Create Account
          </h1>
          <p
            style={{
              color: "var(--color-text-muted)",
              fontSize: 14,
              margin: 0,
            }}
          >
            Join INI Rewards and earn points on every order
          </p>
        </div>

        <div
          style={{
            background: "var(--color-light-gold)",
            border: "1px solid var(--color-brand-gold)",
            borderRadius: 10,
            padding: "12px 16px",
            marginBottom: 24,
            fontSize: 13,
          }}
        >
          ⭐ <strong>Join Rewards:</strong> Earn 10 points per $1 spent. 1000
          points = $10 off.
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
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 12,
              marginBottom: 0,
            }}
          >
            <Field label="First Name" name="firstName" placeholder="John" />
            <Field label="Last Name" name="lastName" placeholder="Smith" />
          </div>
          <Field
            label="Email"
            name="email"
            type="email"
            placeholder="you@example.com"
          />
          <Field
            label="Password"
            name="password"
            type="password"
            placeholder="Min 8 characters"
          />
          <Field
            label="Phone (optional)"
            name="phone"
            placeholder="+1 555-0100"
          />
          <button
            type="submit"
            className="btn-gold"
            style={{ width: "100%", fontSize: 15, marginTop: 8 }}
            disabled={loading}
          >
            {loading
              ? "Creating Account..."
              : "Create Account & Start Earning →"}
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
          Already have an account?{" "}
          <Link
            href="/login"
            style={{ color: "var(--color-brand-blue)", fontWeight: 600 }}
          >
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
