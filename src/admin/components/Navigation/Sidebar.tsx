"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ShoppingCart,
  Users,
  Mail,
  UtensilsCrossed,
  Gift,
  FileText,
  Settings,
} from "lucide-react";

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
    <aside className="w-64 bg-gray-900 text-white flex flex-col min-h-screen">
      {/* Logo */}
      <div className="p-6 border-b border-gray-800">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center font-bold">
            INI
          </div>
          <div>
            <h1 className="text-lg font-bold">INI Admin</h1>
            <p className="text-xs text-gray-400">Restaurant Management</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-2">
        {navItems.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                active
                  ? "bg-orange-500 text-white"
                  : "text-gray-300 hover:bg-gray-800 hover:text-white"
              }`}
            >
              {item.icon}
              <span className="text-sm font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-800 text-xs text-gray-400">
        <p>© 2026 INI Restaurant</p>
        <p>All rights reserved</p>
      </div>
    </aside>
  );
}
