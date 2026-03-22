"use client";

import { saveToken, saveUser } from "@/lib/auth";
import { useLogin } from "@/lib/hooks";
import { AlertCircle, Eye, EyeOff, Lock, Mail, Database } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const { mutate: login, isPending } = useLogin();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    login(
      { email, password },
      {
        onSuccess: (data) => {
          saveToken(data.token, data.refreshToken);
          saveUser(data.user);
          router.push("/protected/dashboard");
        },
        onError: (err: any) => {
          setError(
            err.response?.data?.message ||
              "Login failed. Please check your credentials.",
          );
        },
      },
    );
  };

  return (
    <div className="min-h-screen bg-[#0F0F12] flex items-center justify-center px-4">
      {/* Background gradient */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-[#5BA0FF]/10 to-transparent rounded-full blur-3xl" />
        <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-tl from-[#FFD666]/10 to-transparent rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8 flex flex-col items-center">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#5BA0FF] to-[#3D82E0] flex items-center justify-center mb-4 shadow-lg shadow-[#5BA0FF]/20">
            <span className="text-3xl font-bold text-white">I</span>
          </div>
          <h1 className="text-2xl font-bold text-[#F5F5F7] uppercase tracking-widest leading-none">
            IMIDUS Admin
          </h1>
          <p className="text-[#6E6E78] text-sm mt-2 uppercase tracking-wider font-medium">
            Portal Access
          </p>
        </div>

        {/* Card */}
        <div className="bg-[#1A1A1F] rounded-2xl border border-[#2A2A30] shadow-2xl p-8">
          <h2 className="text-xl font-semibold text-[#F5F5F7] mb-6">Sign In</h2>

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-[#FF6B6B]/10 border border-[#FF6B6B]/30 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-[#FF6B6B] flex-shrink-0 mt-0.5" />
              <p className="text-sm text-[#FF6B6B]">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-xs font-medium text-[#6E6E78] uppercase tracking-wider mb-2">
                Email Address
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#6E6E78]">
                  <Mail size={18} />
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@imidus.com"
                  required
                  className="w-full pl-12 pr-4 py-3 bg-[#222228] border border-[#2A2A30] rounded-xl text-[#F5F5F7] placeholder-[#6E6E78] focus:outline-none focus:border-[#5BA0FF] transition-colors"
                  disabled={isPending}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-medium text-[#6E6E78] uppercase tracking-wider mb-2">
                Password
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#6E6E78]">
                  <Lock size={18} />
                </span>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-12 pr-12 py-3 bg-[#222228] border border-[#2A2A30] rounded-xl text-[#F5F5F7] placeholder-[#6E6E78] focus:outline-none focus:border-[#5BA0FF] transition-colors"
                  disabled={isPending}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#6E6E78] hover:text-[#F5F5F7] transition-colors"
                  disabled={isPending}
                >
                  {showPassword ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}
                </button>
              </div>
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded bg-[#222228] border-[#2A2A30] text-[#5BA0FF] focus:ring-[#5BA0FF] focus:ring-offset-[#1A1A1F] mr-2"
                  disabled={isPending}
                />
                <span className="text-[#9A9AA3]">Remember me</span>
              </label>
              <a href="#" className="text-[#5BA0FF] hover:text-[#7AB8FF] transition-colors">
                Forgot password?
              </a>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isPending}
              className="w-full py-3 mt-6 bg-gradient-to-r from-[#5BA0FF] to-[#3D82E0] text-white font-semibold rounded-xl hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              {isPending ? "Signing in..." : "Sign In"}
            </button>
          </form>

          {/* Footer */}
          <p className="text-center text-sm text-[#6E6E78] mt-6">
            Don&apos;t have an account?{" "}
            <a
              href="#"
              className="text-[#5BA0FF] hover:text-[#7AB8FF] font-medium transition-colors"
            >
              Contact Support
            </a>
          </p>
        </div>

        {/* Security Note */}
        <div className="mt-6 flex items-center justify-center gap-2 text-[#6E6E78] text-xs">
          <Database size={14} />
          <p>Secure connection to INI_Restaurant database</p>
        </div>
      </div>
    </div>
  );
}
