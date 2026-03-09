"use client";

/**
 * Loading skeleton component matching MenuItemCard dimensions.
 * Used during API fetches for layout stability and better perceived performance.
 * Features:
 * - Animated pulse effect
 * - Matches exact card dimensions
 * - Same grid sizing as MenuItemCard
 */
export function SkeletonCard() {
  return (
    <div className="product-card animate-pulse">
      {/* Image skeleton */}
      <div className="h-40 bg-[#2a2a33] rounded-t-xl" />

      {/* Content skeleton */}
      <div className="product-info space-y-3">
        {/* Title skeleton */}
        <div className="h-5 bg-[#2a2a33] rounded w-3/4" />

        {/* Description skeleton - 2 lines */}
        <div className="space-y-2">
          <div className="h-3 bg-[#2a2a33] rounded w-full" />
          <div className="h-3 bg-[#2a2a33] rounded w-2/3" />
        </div>

        {/* Price and button skeleton */}
        <div className="flex items-center justify-between mt-4">
          <div className="h-6 bg-[#2a2a33] rounded w-20" />
          <div className="w-11 h-11 bg-[#2a2a33] rounded-full" />
        </div>
      </div>
    </div>
  );
}

/**
 * Grid of skeleton cards for loading states.
 * @param count - Number of skeleton cards to render (default: 6)
 */
export function SkeletonGrid({ count = 6 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </>
  );
}

export default SkeletonCard;
