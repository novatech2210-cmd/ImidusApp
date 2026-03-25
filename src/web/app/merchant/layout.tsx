"use client";

import {
    ArrowLeftOnRectangleIcon,
    BuildingStorefrontIcon,
    ChartBarIcon,
    ClipboardDocumentListIcon,
    Cog6ToothIcon,
    GiftIcon,
    MegaphoneIcon,
    ShoppingBagIcon,
    UsersIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";

const navigation = [
  { name: "Dashboard", href: "/merchant", icon: ChartBarIcon },
  { name: "Orders", href: "/merchant/orders", icon: ShoppingBagIcon },
  { name: "Customers", href: "/merchant/customers", icon: UsersIcon },
  {
    name: "Menu Management",
    href: "/merchant/menu",
    icon: ClipboardDocumentListIcon,
  },
  {
    name: "Campaigns",
    href: "/merchant/marketing/campaigns",
    icon: MegaphoneIcon,
  },
  { name: "Rewards", href: "/merchant/marketing/rewards", icon: GiftIcon },
  { name: "Settings", href: "/merchant/settings", icon: Cog6ToothIcon },
];

export default function MerchantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="flex h-screen bg-[#0A1F3D] text-white overflow-hidden imperial-onyx">
      {/* Sidebar - Desktop */}
      <aside className="w-72 bg-[#0A1F3D] border-r border-white/10 flex flex-col flex-shrink-0 z-20">
        <div className="p-8 flex items-center gap-4">
          <div className="p-3 bg-white/5 border border-white/10 rounded-2xl">
            <BuildingStorefrontIcon className="w-8 h-8 text-[#D4AF37]" />
          </div>
          <div>
            <span className="font-black text-xl tracking-tighter uppercase leading-none block">
              IMIDUS <span className="text-[#D4AF37]">POS</span>
            </span>
            <span className="text-[9px] font-black text-white/40 uppercase tracking-[0.25rem] mt-1.5 block">
              Sovereign Console
            </span>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-6 py-4 space-y-2">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-4 px-5 py-4 rounded-xl transition-all duration-300 group ${
                  isActive
                    ? "bg-white text-[#0A1F3D] shadow-2xl"
                    : "text-white/60 hover:bg-white/5 hover:text-white"
                }`}
              >
                <item.icon
                  className={`w-5 h-5 transition-colors ${
                    isActive
                      ? "text-[#0A1F3D]"
                      : "text-[#D4AF37]/60 group-hover:text-[#D4AF37]"
                  }`}
                />
                <span
                  className={`text-[11px] font-black uppercase tracking-[0.2rem] ${isActive ? "text-[#0A1F3D]" : "text-white/80"}`}
                >
                  {item.name}
                </span>
              </Link>
            );
          })}
        </nav>

        <div className="p-6 mt-auto">
          <button className="w-full flex items-center gap-4 px-6 py-4 text-white/40 hover:text-red-400 hover:bg-red-950/20 rounded-xl transition-all group">
            <ArrowLeftOnRectangleIcon className="w-5 h-5 transition-colors group-hover:text-red-400" />
            <span className="text-[11px] font-black uppercase tracking-[0.2rem]">
              Sign Out
            </span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        {/* Glass Header */}
        <header className="h-20 bg-[#0A1F3D]/80 backdrop-blur-xl border-b border-white/5 flex items-center justify-between px-10 z-10 sticky top-0">
          <div className="flex items-center gap-6">
            <div className="h-1 bg-[#D4AF37] w-8 rounded-full" />
            <h2 className="text-[11px] font-black text-white/50 uppercase tracking-[0.25rem]">
              {navigation.find((n) => n.href === pathname)?.name ||
                "System Dashboard"}
            </h2>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3 px-4 py-1.5 bg-white/5 border border-white/10 rounded-full">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]"></span>
              <span className="text-[9px] font-black text-white/80 uppercase tracking-[0.25rem]">
                POS Connected
              </span>
            </div>

            <div className="flex items-center gap-3 pl-6 border-l border-white/10">
              <div className="text-right">
                <p className="text-[10px] font-black text-white uppercase tracking-wider">
                  Metropolitan Diner
                </p>
                <p className="text-[9px] font-bold text-[#D4AF37] uppercase tracking-widest">
                  Administrator
                </p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#D4AF37] to-[#B8941F] flex items-center justify-center text-xs font-black text-[#0A1F3D] shadow-lg shadow-[#D4AF37]/20">
                MD
              </div>
            </div>
          </div>
        </header>

        {/* Dynamic Main Body */}
        <main className="flex-1 overflow-y-auto custom-scrollbar">
          {children}
        </main>
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(10, 31, 61, 0.5);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(212, 175, 55, 0.2);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(212, 175, 55, 0.4);
        }
      `}</style>
    </div>
  );
}
