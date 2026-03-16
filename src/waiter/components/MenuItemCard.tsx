"use client";

import { MenuItem } from "@/lib/api";
import { CheckIcon, PlusIcon } from "@heroicons/react/24/solid";
import Link from "next/link";
import { useState } from "react";

interface MenuItemCardProps {
  item: MenuItem;
  categoryId: number | null;
  onAddToCart: (item: MenuItem) => void;
  onViewDetail?: (item: MenuItem) => void;
}

/**
 * Reusable menu item card component for consistent display across the web app.
 * Features:
 * - Item image with placeholder fallback
 * - Name and description (2-line clamp)
 * - Price display (first available size)
 * - Quick add to cart with checkmark animation
 * - Unavailable item state (grayed out, disabled)
 * - Touch-friendly sizing (44px min tap targets)
 * - Desktop hover state (shadow lift)
 */
export function MenuItemCard({
  item,
  categoryId,
  onAddToCart,
  onViewDetail,
}: MenuItemCardProps) {
  const [added, setAdded] = useState(false);

  const isAvailable = item.isAvailable && item.sizes.some((s) => s.inStock);
  const firstPrice = item.sizes[0]?.price ?? 0;

  // Show "from $X.XX" if multiple prices exist
  const prices = item.sizes.map((s) => s.price).sort((a, b) => a - b);
  const hasMultiplePrices =
    prices.length > 1 && prices[0] !== prices[prices.length - 1];
  const priceDisplay = hasMultiplePrices
    ? `from $${prices[0].toFixed(2)}`
    : `$${firstPrice.toFixed(2)}`;

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAvailable) return;

    onAddToCart(item);
    setAdded(true);
    setTimeout(() => setAdded(false), 1200);
  };

  const handleViewDetail = () => {
    if (onViewDetail) {
      onViewDetail(item);
    }
  };

  const itemUrl = `/menu/item/${item.itemId}?category=${categoryId}`;

  return (
    <div
      className={`product-card group relative transition-all duration-200 ${
        !isAvailable ? "opacity-60" : "hover:shadow-lg hover:-translate-y-1"
      }`}
    >
      {/* Item Image */}
      <Link href={itemUrl} onClick={handleViewDetail}>
        <div className="product-image h-40 relative overflow-hidden">
          {item.imageUrl ? (
            <img
              src={item.imageUrl}
              alt={item.name}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <span className="text-5xl opacity-40">🍽️</span>
          )}
          {!isAvailable && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <span className="badge badge-error text-xs font-bold">
                Unavailable
              </span>
            </div>
          )}
        </div>
      </Link>

      {/* Item Info */}
      <div className="product-info">
        <Link href={itemUrl} onClick={handleViewDetail}>
          <h3 className="product-name hover:text-[#1E5AA8] transition-colors line-clamp-1">
            {item.name}
          </h3>
        </Link>

        {item.description && (
          <p className="product-description line-clamp-2 text-sm text-[#71717A] mt-1">
            {item.description}
          </p>
        )}

        <div className="flex items-center justify-between mt-4">
          <span className="product-price text-[#D4AF37] font-bold text-lg">
            {priceDisplay}
          </span>

          <button
            onClick={handleQuickAdd}
            disabled={!isAvailable}
            aria-label={`Add ${item.name} to cart`}
            className={`btn btn-gold w-11 h-11 min-w-[44px] min-h-[44px] p-0 rounded-full flex items-center justify-center transition-all duration-200 ${
              added ? "!bg-green-600 !text-white scale-110" : ""
            } ${!isAvailable ? "opacity-50 cursor-not-allowed" : "hover:scale-105 active:scale-95"}`}
          >
            {added ? (
              <CheckIcon className="w-5 h-5" />
            ) : (
              <PlusIcon className="w-5 h-5" />
            )}
          </button>
        </div>

        {/* Multiple sizes indicator */}
        {item.sizes.length > 1 && isAvailable && (
          <p className="text-xs text-[#71717A] mt-2">
            {item.sizes.length} sizes available
          </p>
        )}
      </div>
    </div>
  );
}

export default MenuItemCard;
