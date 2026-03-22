// Homepage Banner Configuration - Single Source of Truth
// This can be replaced with API call to /api/Marketing/banners when backend is ready

export type CustomerSegment = "all" | "new" | "bronze" | "silver" | "gold" | "vip";

export interface BannerSlide {
  id: string;
  title: string;
  subtitle: string;
  description?: string;
  ctaText: string;
  ctaLink: string;
  bgGradient: string;
  imageUrl?: string;
  segments: CustomerSegment[]; // Which customer segments see this banner
  priority: number; // Higher = shown first
  active: boolean;
}

// Banner configuration - Single Source of Truth
export const BANNER_CONFIG: BannerSlide[] = [
  {
    id: "welcome-new",
    title: "Welcome to IMIDUSAPP",
    subtitle: "Your First Order Awaits",
    description: "Experience seamless ordering with real-time POS integration. Join thousands of satisfied customers.",
    ctaText: "Start Ordering",
    ctaLink: "/menu",
    bgGradient: "linear-gradient(135deg, #1E5AA8 0%, #174785 100%)",
    segments: ["all", "new"],
    priority: 100,
    active: true,
  },
  {
    id: "loyalty-bronze",
    title: "You're a Bronze Member",
    subtitle: "Keep Earning Points",
    description: "Earn 1 point for every $10 spent. Redeem points for discounts on future orders!",
    ctaText: "View Menu",
    ctaLink: "/menu",
    bgGradient: "linear-gradient(135deg, #8B4513 0%, #A0522D 100%)",
    segments: ["bronze"],
    priority: 90,
    active: true,
  },
  {
    id: "loyalty-silver",
    title: "Silver Member Perks",
    subtitle: "Exclusive Benefits",
    description: "As a Silver member, you get priority order processing and special seasonal offers.",
    ctaText: "Order Now",
    ctaLink: "/menu",
    bgGradient: "linear-gradient(135deg, #C0C0C0 0%, #A8A8A8 100%)",
    segments: ["silver"],
    priority: 90,
    active: true,
  },
  {
    id: "loyalty-gold",
    title: "Gold Member Exclusive",
    subtitle: "Premium Experience",
    description: "Enjoy 10% bonus points on every order and exclusive access to new menu items before anyone else!",
    ctaText: "Explore Menu",
    ctaLink: "/menu",
    bgGradient: "linear-gradient(135deg, #D4AF37 0%, #B8960C 100%)",
    segments: ["gold"],
    priority: 95,
    active: true,
  },
  {
    id: "loyalty-vip",
    title: "VIP Status Unlocked",
    subtitle: "Elite Member Benefits",
    description: "Welcome to the inner circle. Enjoy complimentary upgrades, birthday rewards, and dedicated support.",
    ctaText: "VIP Ordering",
    ctaLink: "/menu",
    bgGradient: "linear-gradient(135deg, #1A1A2E 0%, #2D2D44 100%)",
    segments: ["vip"],
    priority: 100,
    active: true,
  },
  {
    id: "promo-weekend",
    title: "Weekend Special",
    subtitle: "20% Off Family Meals",
    description: "This weekend only! Order any family combo and save 20%. Perfect for sharing with loved ones.",
    ctaText: "View Family Meals",
    ctaLink: "/menu",
    bgGradient: "linear-gradient(135deg, #2E7D32 0%, #1B5E20 100%)",
    segments: ["all"],
    priority: 80,
    active: true,
  },
  {
    id: "app-features",
    title: "Track. Earn. Repeat.",
    subtitle: "The IMIDUSAPP Advantage",
    description: "Real-time order tracking, automatic loyalty points, and seamless pickup. The future of restaurant ordering is here.",
    ctaText: "Learn More",
    ctaLink: "/menu",
    bgGradient: "linear-gradient(135deg, #E65100 0%, #BF360C 100%)",
    segments: ["all"],
    priority: 70,
    active: true,
  },
];

// Helper to get banners for a specific customer segment
export function getBannersForSegment(
  loyaltyTier: string | null | undefined,
  isNewCustomer: boolean = false
): BannerSlide[] {
  const segment: CustomerSegment = isNewCustomer 
    ? "new" 
    : (loyaltyTier?.toLowerCase() as CustomerSegment) || "all";

  return BANNER_CONFIG
    .filter(banner => banner.active)
    .filter(banner => 
      banner.segments.includes("all") || 
      banner.segments.includes(segment)
    )
    .sort((a, b) => b.priority - a.priority);
}

// API-ready interface - can be replaced with backend call
export const MarketingAPI = {
  getBanners: async (loyaltyTier?: string, isNewCustomer?: boolean): Promise<BannerSlide[]> => {
    // When backend is ready, replace with:
    // return apiClient(`/Marketing/banners?tier=${loyaltyTier}&new=${isNewCustomer}`);
    
    // For now, use local config as single source of truth
    return Promise.resolve(getBannersForSegment(loyaltyTier, isNewCustomer));
  },
};
