"use client";

import { useAuth } from "@/context/AuthContext";
import {
    ArrowRightIcon,
    ShieldCheckIcon,
    SparklesIcon,
    TrophyIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";

export default function HomePage() {
  const { user } = useAuth();

  return (
    <div className="flex flex-col items-center justify-center py-12 px-6 text-center animate-in fade-in duration-700">
      {/* Hero */}
      <div className="inline-flex items-center gap-2 bg-gold/10 border border-gold/20 text-gold-vibrant px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] mb-8">
        <SparklesIcon className="w-4 h-4" />
        High-Throughput Performance
      </div>

      <h1 className="text-5xl lg:text-7xl font-black text-white uppercase tracking-tighter leading-none mb-6">
        The Future of <br />
        <span className="text-gold-vibrant">Restaurant POS</span>
      </h1>

      <p className="text-text-secondary text-base lg:text-lg max-w-2xl font-medium leading-relaxed mb-10">
        Experience a design engineered for speed-of-service, ergonomics, and
        high-contrast visibility. IMIDUS Technologies brings enterprise-grade
        hospitality UI to your terminal.
      </p>

      <div className="flex gap-4">
        <Link href="/menu">
          <button className="btn-sellable h-16 px-10 text-lg flex flex-row items-center gap-3">
            Open Terminal <ArrowRightIcon className="w-5 h-5" />
          </button>
        </Link>
      </div>

      {/* Feature Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-20 w-full max-w-5xl">
        <div className="bg-bg-panel border border-divider p-8 rounded-2xl text-left hover:border-text-dim transition-all group">
          <TrophyIcon className="w-10 h-10 text-gold mb-4 group-hover:scale-110 transition-transform" />
          <h3 className="font-black text-white uppercase tracking-tight mb-2">
            Loyalty Focused
          </h3>
          <p className="text-text-dim text-sm leading-relaxed uppercase font-bold">
            Earn points on every item. Integrated balance tracking.
          </p>
        </div>

        <div className="bg-bg-panel border border-divider p-8 rounded-2xl text-left hover:border-text-dim transition-all group">
          <ShieldCheckIcon className="w-10 h-10 text-blue-vibrant mb-4 group-hover:scale-110 transition-transform" />
          <h3 className="font-black text-white uppercase tracking-tight mb-2">
            Secure Core
          </h3>
          <p className="text-text-dim text-sm leading-relaxed uppercase font-bold">
            PCI-Compliant transactions via Authorize.net Sandbox.
          </p>
        </div>

        <div className="bg-bg-panel border border-divider p-8 rounded-2xl text-left hover:border-text-dim transition-all group">
          <div className="relative mb-4">
            <div className="w-10 h-10 rounded bg-green-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            </div>
          </div>
          <h3 className="font-black text-white uppercase tracking-tight mb-2">
            ERP Integrated
          </h3>
          <p className="text-text-dim text-sm leading-relaxed uppercase font-bold">
            Direct sync with legacy TPPro schema and Dapper-driven backend.
          </p>
        </div>
      </div>
    </div>
  );
}
