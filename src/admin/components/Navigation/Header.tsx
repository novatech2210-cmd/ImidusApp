"use client";

import { useLogout } from "@/lib/hooks";
import { Bell, ChevronDown, LogOut, Search, User } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface HeaderProps {
  userName?: string;
  userEmail?: string;
}

export default function Header({
  userName = "Admin",
  userEmail = "admin@imidus.com",
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
    <header className="sticky top-[3px] z-40 bg-onyx-bg-secondary/95 backdrop-blur-md border-b border-onyx-border">
      <div className="px-6 py-4 flex items-center justify-between h-[72px]">
        {/* Left Section - Search */}
        <div className="flex items-center gap-4 flex-1 max-w-xl">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-onyx-text-muted" size={18} />
            <input
              type="text"
              placeholder="Search orders, customers, menu items..."
              className="w-full bg-onyx-bg-tertiary border border-onyx-border rounded-xl pl-12 pr-4 py-3 text-sm text-onyx-text-primary placeholder-onyx-text-muted focus:border-onyx-blue focus:outline-none focus:ring-2 focus:ring-onyx-blue/20 transition-all"
            />
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-4">
          {/* Notifications */}
          <button className="relative p-3 rounded-xl bg-onyx-bg-tertiary border border-onyx-border hover:bg-onyx-bg-elevated transition-colors">
            <Bell size={20} className="text-onyx-text-secondary" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-onyx-red rounded-full" />
          </button>

          {/* User Menu */}
          <div className="relative">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center gap-3 px-3 py-2 rounded-xl bg-onyx-bg-tertiary hover:bg-onyx-bg-elevated transition-all border border-onyx-border"
            >
              <div className="w-9 h-9 bg-onyx-blue-gradient rounded-xl flex items-center justify-center text-white text-sm font-bold shadow-lg">
                {userName.charAt(0).toUpperCase()}
              </div>
              <div className="text-left hidden sm:block">
                <p className="text-sm font-semibold text-onyx-text-primary leading-tight">
                  {userName}
                </p>
                <p className="text-[10px] text-onyx-text-muted">
                  Administrator
                </p>
              </div>
              <ChevronDown
                size={14}
                className={`text-onyx-text-muted transition-transform ${showDropdown ? "rotate-180" : ""}`}
              />
            </button>

            {/* Dropdown Menu */}
            {showDropdown && (
              <div className="absolute right-0 mt-2 w-56 bg-onyx-bg-secondary rounded-xl shadow-lg border border-onyx-border overflow-hidden z-50">
                <div className="p-4 border-b border-onyx-border">
                  <p className="text-sm font-semibold text-onyx-text-primary">{userName}</p>
                  <p className="text-xs text-onyx-text-muted">{userEmail}</p>
                </div>
                <div className="py-2">
                  <button
                    onClick={() => {
                      router.push("/protected/settings");
                      setShowDropdown(false);
                    }}
                    className="w-full px-4 py-3 text-left text-sm text-onyx-text-secondary hover:bg-onyx-bg-tertiary hover:text-onyx-text-primary flex items-center gap-3 transition-colors"
                  >
                    <User size={16} />
                    Profile Settings
                  </button>
                  <button
                    onClick={handleLogout}
                    disabled={isPending}
                    className="w-full px-4 py-3 text-left text-sm text-onyx-red hover:bg-onyx-bg-tertiary flex items-center gap-3 transition-colors disabled:opacity-50"
                  >
                    <LogOut size={16} />
                    {isPending ? "Logging out..." : "Log Out"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
