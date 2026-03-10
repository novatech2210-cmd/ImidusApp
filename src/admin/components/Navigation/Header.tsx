"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, User, ChevronDown } from "lucide-react";
import { useLogout } from "@/lib/hooks";

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
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="px-6 py-4 flex items-center justify-between">
        <div className="text-sm text-gray-600">
          <p>
            Welcome back, <strong>{userName}</strong>
          </p>
        </div>

        <div className="relative">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
              {userName.charAt(0).toUpperCase()}
            </div>
            <div className="text-left hidden sm:block">
              <p className="text-sm font-medium text-gray-900">{userName}</p>
              <p className="text-xs text-gray-500">{userEmail}</p>
            </div>
            <ChevronDown
              size={16}
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
