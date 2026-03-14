"use client";

import {
  FileText,
  Gift,
  LayoutDashboard,
  Mail,
  Settings,
  ShoppingCart,
  Users,
  UtensilsCrossed,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  {
    href: "/protected/dashboard",
    label: "Dashboard",
    icon: <LayoutDashboard size={20} />,
  },
  {
    href: "/protected/orders",
    label: "Orders",
    icon: <ShoppingCart size={20} />,
  },
  {
    href: "/protected/customers",
    label: "Customers",
    icon: <Users size={20} />,
  },
  {
    href: "/protected/campaigns",
    label: "Campaigns",
    icon: <Mail size={20} />,
  },
  {
    href: "/protected/menu",
    label: "Menu",
    icon: <UtensilsCrossed size={20} />,
  },
  { href: "/protected/rewards", label: "Rewards", icon: <Gift size={20} /> },
  { href: "/protected/logs", label: "Logs", icon: <FileText size={20} /> },
  {
    href: "/protected/settings",
    label: "Settings",
    icon: <Settings size={20} />,
  },
];

export default function Sidebar() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    return pathname.startsWith(href);
  };

  return (
    <aside className="w-68 admin-sidebar flex flex-col min-h-screen">
      {/* Logo */}
      <div className="p-6 border-b border-gray-800/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#D4AF37] rounded-xl flex items-center justify-center font-extrabold text-[#0F172A] shadow-gold">
            IMI
          </div>
          <div>
            <h1 className="text-lg font-extrabold text-white font-heading">
              IMIDUS<span className="text-[#D4AF37]">POS</span>
            </h1>
            <p className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold">
              Management Console
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-6 space-y-1.5">
        {navItems.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all group ${
                active
                  ? "bg-[#1E5AA8] text-white shadow-lg"
                  : "text-gray-400 hover:bg-white/5 hover:text-white"
              }`}
            >
              <div
                className={`${active ? "text-[#D4AF37]" : "text-gray-500 group-hover:text-gray-300"}`}
              >
                {item.icon}
              </div>
              <span className="text-sm font-semibold font-heading tracking-tight">
                {item.label}
              </span>
              {active && (
                <div className="absolute left-0 w-1 h-6 bg-[#D4AF37] rounded-r-full" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-6 border-t border-gray-800/50">
        <div className="flex flex-col gap-1">
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
            Powered by
          </p>
          <p className="text-xs font-bold text-gray-300">
            IMIDUS Technologies v1.0
          </p>
        </div>
      </div>
    </aside>
  );
}
