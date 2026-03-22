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
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  badge?: string;
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
    badge: "Live",
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
  { href: "/protected/logs", label: "Audit Logs", icon: <FileText size={20} /> },
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
    <aside className="w-64 bg-onyx-bg-secondary flex flex-col min-h-screen border-r border-onyx-border">
      {/* Logo */}
      <div className="p-6 border-b border-onyx-border">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-onyx-gold-gradient rounded-xl flex items-center justify-center font-extrabold text-onyx-bg-secondary text-sm shadow-lg">
            IMI
          </div>
          <div>
            <h1 className="text-lg font-extrabold text-onyx-text-primary tracking-tight">
              IMIDUS<span className="text-onyx-gold">POS</span>
            </h1>
            <p className="text-[10px] text-onyx-text-muted uppercase tracking-[0.15em] font-semibold">
              Admin Console
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-6 space-y-1">
        <p className="px-4 mb-3 text-[10px] font-bold text-onyx-text-muted uppercase tracking-wider">
          Main Menu
        </p>
        {navItems.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`relative flex items-center gap-3 px-4 py-3 rounded-xl transition-all group ${
                active
                  ? "bg-onyx-blue-gradient text-white shadow-lg"
                  : "text-onyx-text-secondary hover:bg-onyx-bg-tertiary hover:text-onyx-text-primary"
              }`}
            >
              {/* Active indicator */}
              {active && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-onyx-gold rounded-r-full" />
              )}

              <div className={active ? "text-onyx-gold" : "text-onyx-text-muted group-hover:text-onyx-text-secondary"}>
                {item.icon}
              </div>
              <span className="flex-1 text-sm font-semibold tracking-tight">
                {item.label}
              </span>

              {/* Badge */}
              {item.badge && (
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  active
                    ? "bg-white/20 text-white"
                    : "bg-onyx-green/20 text-onyx-green"
                }`}>
                  {item.badge}
                </span>
              )}

              {/* Arrow */}
              {active && (
                <ChevronRight size={16} className="text-white/60" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Database Status */}
      <div className="px-4 pb-4">
        <div className="bg-onyx-bg-tertiary rounded-xl p-4 border border-onyx-border">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 bg-onyx-green rounded-full animate-pulse" />
            <span className="text-xs font-semibold text-onyx-green">POS Connected</span>
          </div>
          <p className="text-[10px] text-onyx-text-muted">
            INI_Restaurant DB • Read-only
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-onyx-border">
        <div className="flex flex-col gap-1">
          <p className="text-[10px] font-bold text-onyx-text-muted uppercase tracking-wider">
            Powered by
          </p>
          <p className="text-xs font-semibold text-onyx-text-secondary">
            IMIDUS Technologies v1.0
          </p>
        </div>
      </div>
    </aside>
  );
}
