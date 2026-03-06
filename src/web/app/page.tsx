"use client";

import { useAuth } from "@/context/AuthContext";
import { BannerCarousel } from "@/components/BannerCarousel";
import { MarketingAPI, getBannersForSegment } from "@/lib/banner-config";
import {
    ArrowRightIcon,
    ShieldCheckIcon,
    SparklesIcon,
    TrophyIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import { useState, useEffect } from "react";

export default function HomePage() {
  const { user } = useAuth();
  const [banners, setBanners] = useState(getBannersForSegment(user?.loyaltyTier ?? null, !user));
  const [isLoading, setIsLoading] = useState(true);

  // Fetch targeted banners based on customer segment
  useEffect(() => {
    const loadBanners = async () => {
      setIsLoading(true);
      try {
        // Use customer segment targeting - single source of truth
        const targetedBanners = await MarketingAPI.getBanners(
          user?.loyaltyTier,
          !user // Treat non-logged in users as "new" customers
        );
        setBanners(targetedBanners);
      } catch (error) {
        console.error("Failed to load banners:", error);
        // Fallback to default banners
        setBanners(getBannersForSegment(null, true));
      } finally {
        setIsLoading(false);
      }
    };

    loadBanners();
  }, [user?.loyaltyTier ?? null]);

  return (
    <div className="flex flex-col items-center justify-center py-8 px-6 text-center animate-in fade-in duration-700">
      {/* Banner Carousel - Customer Segment Targeted */}
      <div className="w-full max-w-6xl mb-12">
        {isLoading ? (
          <div 
            className="w-full rounded-2xl animate-pulse"
            style={{ 
              minHeight: "400px",
              background: "linear-gradient(135deg, #1E5AA8 0%, #174785 100%)"
            }}
          />
        ) : (
          <BannerCarousel slides={banners} autoPlayInterval={8000} />
        )}
      </div>

      {/* Customer Segment Badge (if logged in) */}
      {user && (
        <div className="mb-6">
          <div className="inline-flex items-center gap-2 bg-[rgba(212,175,55,0.12)] border border-[rgba(212,175,55,0.3)] text-[#D4AF37] px-4 py-2 rounded-full text-[11px] font-black uppercase tracking-[0.15em]">
            <TrophyIcon className="w-4 h-4" />
            {user.loyaltyTier} Member
            {user.earnedPoints > 0 && (
              <span className="ml-2 text-[#1E5AA8]">
                • {user.earnedPoints} Points
              </span>
            )}
          </div>
        </div>
      )}

      {/* Hero Content */}
      <div className="inline-flex items-center gap-2 bg-[rgba(30,90,168,0.08)] border border-[rgba(30,90,168,0.2)] text-[#1E5AA8] px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.2em] mb-6">
        <SparklesIcon className="w-4 h-4" />
        Enterprise POS Integration
      </div>

      <h1 className="text-4xl lg:text-6xl font-black text-[#1A1A2E] uppercase tracking-tighter leading-none mb-4">
        The Future of <br />
        <span className="text-[#1E5AA8]">Restaurant POS</span>
      </h1>

      <p className="text-[#4A4A5A] text-base lg:text-lg max-w-2xl font-medium leading-relaxed mb-8">
        Experience a design engineered for speed-of-service, ergonomics, and
        high-contrast visibility. IMIDUS Technologies brings enterprise-grade
        hospitality UI to your terminal.
      </p>

      <div className="flex gap-4 flex-wrap justify-center">
        <Link href="/menu">
          <button className="btn btn-gold h-14 px-8 text-base flex flex-row items-center gap-3">
            Order Now <ArrowRightIcon className="w-5 h-5" />
          </button>
        </Link>
        {!user && (
          <Link href="/register">
            <button className="btn btn-secondary h-14 px-8 text-base">
              Join & Earn Points
            </button>
          </Link>
        )}
      </div>

      {/* Feature Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16 w-full max-w-5xl">
        <div className="card card-body text-left hover:border-[rgba(30,90,168,0.3)] transition-all group">
          <TrophyIcon className="w-10 h-10 text-[#D4AF37] mb-4 group-hover:scale-110 transition-transform" />
          <h3 className="font-black text-[#1A1A2E] uppercase tracking-tight mb-2">
            Loyalty Focused
          </h3>
          <p className="text-[#71717A] text-sm leading-relaxed uppercase font-bold">
            Earn points on every item. Integrated balance tracking.
          </p>
        </div>

        <div className="card card-body text-left hover:border-[rgba(30,90,168,0.3)] transition-all group">
          <ShieldCheckIcon className="w-10 h-10 text-[#1E5AA8] mb-4 group-hover:scale-110 transition-transform" />
          <h3 className="font-black text-[#1A1A2E] uppercase tracking-tight mb-2">
            Secure Core
          </h3>
          <p className="text-[#71717A] text-sm leading-relaxed uppercase font-bold">
            PCI-Compliant transactions via Authorize.net Sandbox.
          </p>
        </div>

        <div className="card card-body text-left hover:border-[rgba(30,90,168,0.3)] transition-all group">
          <div className="relative mb-4">
            <div className="w-10 h-10 rounded-lg bg-[rgba(46,125,50,0.12)] flex items-center justify-center group-hover:scale-110 transition-transform">
              <div className="w-2 h-2 rounded-full bg-[#2E7D32] animate-pulse" />
            </div>
          </div>
          <h3 className="font-black text-[#1A1A2E] uppercase tracking-tight mb-2">
            ERP Integrated
          </h3>
          <p className="text-[#71717A] text-sm leading-relaxed uppercase font-bold">
            Direct sync with legacy TPPro schema and Dapper-driven backend.
          </p>
        </div>
      </div>
    </div>
  );
}
