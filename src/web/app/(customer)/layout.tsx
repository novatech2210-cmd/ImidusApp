"use client";

import { OrderPanel } from "@/components/OrderPanel";
import { SyncIndicator } from "@/components/SyncIndicator";
import { CartProvider } from "@/context/CartContext";
import "@fontsource/plus-jakarta-sans/400.css";
import "@fontsource/plus-jakarta-sans/500.css";
import "@fontsource/plus-jakarta-sans/600.css";
import "@fontsource/plus-jakarta-sans/700.css";
import "@fontsource/plus-jakarta-sans/800.css";
import { usePathname } from "next/navigation";
import React from "react";
import "../customer-theme.css";
import "../globals.css";
import "../imperial-onyx.css";

export default function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <CartProvider>
      <div className="min-h-screen bg-white imperial-onyx flex flex-col">
        {/* Floating Glass Header */}
        <header className="fixed top-6 left-6 right-6 h-20 bg-white/80 backdrop-blur-xl border border-[#0A1F3D]/5 rounded-2xl flex items-center justify-between px-10 z-50 shadow-studio">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-[#0A1F3D] rounded-xl flex items-center justify-center shadow-lg shadow-[#0A1F3D]/20">
              <span className="text-white font-black text-xl italic tracking-tighter">
                I
              </span>
            </div>
            <div className="flex flex-col">
              <span className="logo-text text-[18px] font-black tracking-tighter text-[#0A1F3D] uppercase leading-none">
                IMIDUS<span className="text-[#D4AF37]">APP</span>
              </span>
              <span className="text-[8px] font-black text-[#0A1F3D]/40 uppercase tracking-[0.2rem] mt-1 block">
                Luxury Dining Nexus
              </span>
            </div>
          </div>

          <div className="flex items-center gap-8">
            <nav className="hidden md:flex items-center gap-8 mr-8 border-r border-[#0A1F3D]/10 pr-8">
              <a
                href="/"
                className={`text-micro transition-colors ${pathname === "/" ? "text-[#D4AF37]" : "text-[#0A1F3D] hover:text-[#D4AF37]"}`}
              >
                Nexus Home
              </a>
              <a
                href="/menu"
                className={`text-micro transition-colors ${pathname === "/menu" ? "text-[#D4AF37]" : "text-[#0A1F3D] hover:text-[#D4AF37]"}`}
              >
                Curated Menu
              </a>
              <a
                href="/orders"
                className={`text-micro transition-colors ${pathname === "/orders" ? "text-[#D4AF37]" : "text-[#0A1F3D] hover:text-[#D4AF37]"}`}
              >
                Order History
              </a>
            </nav>

            <div className="flex items-center gap-4">
              <SyncIndicator />
              <a
                href="/menu"
                className="btn-primary-onyx !py-3 !px-6 !text-[9px]"
              >
                Order Now
              </a>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 pt-32">
          <div className="content-area">{children}</div>
        </main>

        <OrderPanel />

        {/* Minimalist Footer */}
        <footer className="py-12 px-10 bg-[#0A1F3D] text-white">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex items-center gap-3">
              <span className="text-[14px] font-black tracking-widest uppercase">
                IMIDUS <span className="text-[#D4AF37]">Technologies</span>
              </span>
              <div className="w-1 h-1 bg-[#D4AF37] rounded-full" />
              <span className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2rem]">
                v2.0 Premium
              </span>
            </div>
            <div className="flex items-center gap-8">
              <a
                href="#"
                className="text-micro text-white/40 hover:text-[#D4AF37] transition-colors"
              >
                Privacy
              </a>
              <a
                href="#"
                className="text-micro text-white/40 hover:text-[#D4AF37] transition-colors"
              >
                Terms
              </a>
              <a
                href="#"
                className="text-micro text-white/40 hover:text-[#D4AF37] transition-colors"
              >
                Contact
              </a>
            </div>
          </div>
        </footer>
      </div>
    </CartProvider>
  );
}
