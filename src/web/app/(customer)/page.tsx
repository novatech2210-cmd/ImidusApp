"use client";

import { BannerCarousel } from "@/components/BannerCarousel";
import { useAuth } from "@/context/AuthContext";
import { MarketingAPI, getBannersForSegment } from "@/lib/banner-config";
import {
    ArrowRightIcon,
    ShieldCheckIcon,
    SparklesIcon,
    TrophyIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function HomePage() {
  const { user } = useAuth();
  const [banners, setBanners] = useState(
    getBannersForSegment(user?.loyaltyTier ?? null, !user),
  );
  const [isLoading, setIsLoading] = useState(true);

  // Fetch targeted banners based on customer segment
  useEffect(() => {
    const loadBanners = async () => {
      setIsLoading(true);
      try {
        const targetedBanners = await MarketingAPI.getBanners(
          user?.loyaltyTier,
          !user,
        );
        setBanners(targetedBanners);
      } catch (error) {
        console.error("Failed to load banners:", error);
        setBanners(getBannersForSegment(null, true));
      } finally {
        setIsLoading(false);
      }
    };

    loadBanners();
  }, [user?.loyaltyTier ?? null]);

  return (
    <div className="imperial-onyx min-h-screen bg-white">
      {/* Sovereign Hero Section - Blue Container Style */}
      <section className="mx-6 mb-20 bg-[#0A1F3D] rounded-[2.5rem] p-12 lg:p-24 relative overflow-hidden border border-white/10 shadow-2xl">
        {/* Abstract Signature Texture */}
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-[#D4AF37]/5 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-[#D4AF37]/5 rounded-full blur-[120px] pointer-events-none" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
          <div className="lg:col-span-7 space-y-10">
            <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 text-white px-5 py-2.5 rounded-full text-[10px] font-black uppercase tracking-[0.25rem]">
              <SparklesIcon className="w-4 h-4 text-[#D4AF37]" />
              Signature Dining Experience
            </div>

            <h1 className="text-display leading-[0.85] text-white tracking-[-0.05em]">
              The <span className="font-light italic text-[#D4AF37]">Art</span>{" "}
              of <br />
              Digital <span className="text-display">Hospitality</span>
            </h1>

            <p className="text-[14px] lg:text-[16px] text-white/60 max-w-xl font-medium leading-[1.6] uppercase tracking-wider">
              Experience a design engineered for elegance, ergonomics, and
              precision visibility. IMIDUS Technologies brings sovereign dining
              UI to your digital presence.
            </p>

            <div className="flex flex-col sm:flex-row gap-6 pt-4">
              <Link href="/menu">
                <button className="btn-primary-onyx group flex items-center gap-4 !px-10 !py-6 !text-[11px]">
                  Begin Selection{" "}
                  <ArrowRightIcon className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
                </button>
              </Link>
              {!user && (
                <Link href="/register">
                  <button className="bg-white/5 hover:bg-white/10 text-white border border-white/10 px-10 py-6 rounded-2xl text-[11px] font-black uppercase tracking-[0.2rem] transition-all">
                    Sovereign Membership
                  </button>
                </Link>
              )}
            </div>

            {/* Loyalty Badge Integration */}
            {user && (
              <div className="pt-6 border-t border-white/5 inline-block">
                <div className="inline-flex items-center gap-4 bg-[#D4AF37]/10 border border-[#D4AF37]/30 text-[#D4AF37] px-5 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest">
                  <TrophyIcon className="w-5 h-5" />
                  {user.loyaltyTier} Nexus Member
                  <span className="w-1 h-1 bg-[#D4AF37] rounded-full mx-2" />
                  {user.earnedPoints} Sovereign Points
                </div>
              </div>
            )}
          </div>

          <div className="lg:col-span-5 h-full min-h-[400px]">
            {isLoading ? (
              <div className="w-full h-full min-h-[440px] bg-white/5 rounded-[2rem] animate-pulse border border-white/10" />
            ) : (
              <div className="h-full transform lg:scale-110 lg:translate-x-8">
                <BannerCarousel slides={banners} autoPlayInterval={5000} />
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Feature Grid - Precision UI Style */}
      <section className="px-10 pb-32">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12">
          <div className="bg-white p-10 rounded-[2rem] shadow-studio border border-[#0A1F3D]/5 hover:translate-y-[-8px] transition-all duration-500 group">
            <div className="w-14 h-14 bg-[#D4AF37]/10 rounded-2xl flex items-center justify-center mb-8 group-hover:bg-[#D4AF37] transition-colors">
              <TrophyIcon className="w-8 h-8 text-[#D4AF37] group-hover:text-white" />
            </div>
            <h3 className="text-[14px] font-black text-[#0A1F3D] uppercase tracking-[0.25rem] mb-4">
              Loyalty Anchor
            </h3>
            <p className="text-[11px] font-bold text-[#0A1F3D]/40 leading-relaxed uppercase tracking-widest">
              Earn sovereign rewards on every selection. Real-time balance
              tracking synchronized with ground-truth POS records.
            </p>
          </div>

          <div className="bg-white p-10 rounded-[2rem] shadow-studio border border-[#0A1F3D]/5 hover:translate-y-[-8px] transition-all duration-500 group">
            <div className="w-14 h-14 bg-[#0A1F3D]/5 rounded-2xl flex items-center justify-center mb-8 group-hover:bg-[#0A1F3D] transition-colors">
              <ShieldCheckIcon className="w-8 h-8 text-[#0A1F3D] group-hover:text-white" />
            </div>
            <h3 className="text-[14px] font-black text-[#0A1F3D] uppercase tracking-[0.25rem] mb-4">
              Secure Core
            </h3>
            <p className="text-[11px] font-bold text-[#0A1F3D]/40 leading-relaxed uppercase tracking-widest">
              PCI-Compliant transactions via Authorize.net using hardware-level
              tokenization protocol (no card storage).
            </p>
          </div>

          <div className="bg-white p-10 rounded-[2rem] shadow-studio border border-[#0A1F3D]/5 hover:translate-y-[-8px] transition-all duration-500 group">
            <div className="w-14 h-14 bg-[#0A1F3D]/5 rounded-2xl flex items-center justify-center mb-8 group-hover:bg-[#0A1F3D] transition-colors">
              <CircleStackIcon className="w-8 h-8 text-[#0A1F3D] group-hover:text-white" />
            </div>
            <h3 className="text-[14px] font-black text-[#0A1F3D] uppercase tracking-[0.25rem] mb-4">
              Ground Truth
            </h3>
            <p className="text-[11px] font-bold text-[#0A1F3D]/40 leading-relaxed uppercase tracking-widest">
              Direct telemetry with legacy TPPro schemas ensures your order
              reaches the kitchen with millisecond precision.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

// Minimal icon component since CircleStackIcon is missing from HeroIcons v2 outline in snippet
function CircleStackIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className={className}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75C20.25 16.128 16.556 17.975 12 17.975s-8.25-1.847-8.25-4.125v-3.75m16.5 0v3.75"
      />
    </svg>
  );
}
