"use client";

import { useLogout } from "@/lib/hooks";
import { ChevronDown, LogOut, User } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface HeaderProps {
  userName?: string;
  userEmail?: string;
}

export default function Header({
  userName = "Admin",
  userEmail = "admin@ini.com",
}: HeaderProps) {
  const router = useRouter();
  const [showDropdown, setShowDropdown] = useState(false);
  const { mutate: logout, isPending } = useLogout();

  const handleLogout = async () => {
    logout(undefined, {
      onSuccess: () => {
        router.push("/auth/login");
      },
    });
  };

  return (
    <header className="admin-header glass sticky top-0 z-40 bg-white/80 backdrop-blur-md">
      <div className="px-6 py-4 flex items-center justify-between h-[80px]">
        <div className="flex items-center gap-3">
          <img
            src="/brand/imidus-triangle-logo.png"
            alt="IMIDUS Logo"
            style={{ width: 44, height: 44, objectFit: "contain" }}
          />
          <div className="flex flex-col">
            <p className="text-[10px] font-black text-[#D4AF37] uppercase tracking-[0.2em]">
              Admin Portal
            </p>
            <h2 className="text-sm font-extrabold text-[#1E5AA8] font-heading uppercase tracking-tighter">
              Welcome, {userName}
            </h2>
          </div>
        </div>

        <div className="relative">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center gap-3 px-4 py-2 rounded-xl bg-gray-50 hover:bg-gray-100 transition-all border border-gray-100 shadow-sm"
          >
            <div className="w-10 h-10 bg-[#1E5AA8] rounded-xl flex items-center justify-center text-white text-sm font-extrabold shadow-lg">
              {userName.charAt(0).toUpperCase()}
            </div>
            <div className="text-left hidden sm:block">
              <p className="text-sm font-bold text-[#0F172A] font-heading leading-tight">
                {userName}
              </p>
              <p className="text-[10px] text-gray-500 font-medium">
                {userEmail}
              </p>
            </div>
            <ChevronDown
              size={14}
              className={`text-gray-400 transition-transform ${showDropdown ? "rotate-180" : ""}`}
            />
          </button>

          {/* Dropdown Menu */}
          {showDropdown && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
              <button
                onClick={() => {
                  router.push("/protected/settings");
                  setShowDropdown(false);
                }}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
              >
                <User size={16} />
                Profile Settings
              </button>
              <button
                onClick={handleLogout}
                disabled={isPending}
                className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 border-t border-gray-200 disabled:opacity-50"
              >
                <LogOut size={16} />
                {isPending ? "Logging out..." : "Logout"}
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
