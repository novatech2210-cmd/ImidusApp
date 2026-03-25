"use client";

import { AdminAPI } from "@/lib/api";
import { BuildingStorefrontIcon } from "@heroicons/react/24/outline";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function MerchantLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await AdminAPI.login({ email, password });
      if (res.success && res.data.token) {
        localStorage.setItem("auth_token", res.data.token);
        localStorage.setItem("admin_user", JSON.stringify(res.data.user));
        router.push("/merchant");
      } else {
        setError(res.error || "Access denied. Sovereign credentials required.");
      }
    } catch (err: any) {
      setError(err.message || "Connection to POS backend failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A1F3D] flex items-center justify-center p-6 imperial-onyx overflow-hidden relative">
      {/* Background Decor */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#D4AF37]/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#D4AF37]/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md z-10">
        <div className="bg-white rounded-[2rem] shadow-studio p-12 relative">
          {/* Accent Line */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-1.5 bg-[#D4AF37] rounded-b-full shadow-[0_0_15px_rgba(212,175,55,0.4)]" />

          {/* Header */}
          <div className="text-center mb-10 mt-4">
            <div className="inline-flex p-4 bg-[#0A1F3D]/5 rounded-2xl mb-6">
              <BuildingStorefrontIcon className="w-10 h-10 text-[#0A1F3D]" />
            </div>
            <span className="text-micro text-[#D4AF37] mb-2 block">
              Merchant Console v1.0
            </span>
            <h1 className="text-headline text-[#0A1F3D] tracking-tight">
              Sovereign{" "}
              <span className="font-light italic text-[#D4AF37]">Access</span>
            </h1>
          </div>

          {error && (
            <div className="mb-8 p-4 bg-red-50 border border-red-100 rounded-xl">
              <p className="text-[11px] font-black text-red-600 uppercase tracking-widest text-center">
                {error}
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-1.5">
              <label className="text-micro text-[#0A1F3D]/40 ml-1">
                Console Identity
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="identity@test.imidus.com"
                className="w-full px-6 py-4 bg-[#F8F9FA] border-none rounded-xl text-[#0A1F3D] font-bold text-sm focus:ring-2 focus:ring-[#D4AF37]/20 transition-all outline-none"
                required
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center ml-1">
                <label className="text-micro text-[#0A1F3D]/40">
                  Authorization Code
                </label>
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-6 py-4 bg-[#F8F9FA] border-none rounded-xl text-[#0A1F3D] font-bold text-sm focus:ring-2 focus:ring-[#D4AF37]/20 transition-all outline-none"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary-onyx w-full py-5 rounded-xl mt-4 flex items-center justify-center gap-3 relative group overflow-hidden"
            >
              <div className="absolute inset-0 bg-white/10 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 ease-in-out" />
              <span className="relative z-10">
                {loading ? "Authorizing..." : "Initialize Session"}
              </span>
            </button>
          </form>

          <p className="mt-10 text-center text-[10px] font-bold text-[#0A1F3D]/30 uppercase tracking-[0.2rem]">
            Secure POS Interface &copy; 2026
          </p>
        </div>
      </div>
    </div>
  );
}
