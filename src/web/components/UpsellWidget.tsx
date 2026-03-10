"use client";

import { useState, useEffect } from "react";
import { apiClient } from "@/lib/api";
import { useCart } from "@/context/CartContext";
import { PlusIcon, TagIcon } from "@heroicons/react/24/solid";

interface UpsellSuggestion {
  ruleId: number;
  ruleName: string;
  message: string;
  suggestItemId: number;
  suggestItemName: string;
  suggestItemDescription?: string;
  suggestItemImageUrl?: string;
  suggestItemPrice: number;
  discountPercent?: number;
  discountedPrice?: number;
  discountMessage?: string;
}

interface UpsellWidgetProps {
  onAddItem: (item: {
    itemId: number;
    name: string;
    price: number;
    discount?: number;
  }) => void;
  className?: string;
}

export function UpsellWidget({ onAddItem, className = "" }: UpsellWidgetProps) {
  const { items, subtotal } = useCart();
  const [suggestions, setSuggestions] = useState<UpsellSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [accepted, setAccepted] = useState<Set<number>>(new Set());

  useEffect(() => {
    const loadSuggestions = async () => {
      if (items.length === 0) {
        setSuggestions([]);
        return;
      }

      setLoading(true);
      try {
        const request = {
          cartItems: items.map((item) => ({
            menuItemId: item.menuItemId,
            name: item.name,
            quantity: item.quantity,
            unitPrice: item.price,
          })),
          cartSubtotal: subtotal,
          // customerLoyaltyTier and session info would come from auth context
        };

        const response = await apiClient("/MarketingRules/evaluate", {
          method: "POST",
          body: JSON.stringify(request),
        });

        setSuggestions(response || []);
      } catch (error) {
        console.error("Failed to load upsell suggestions:", error);
        // Silently fail - upsells are not critical
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    };

    // Debounce the request
    const timeout = setTimeout(loadSuggestions, 500);
    return () => clearTimeout(timeout);
  }, [items, subtotal]);

  const handleAccept = async (suggestion: UpsellSuggestion) => {
    try {
      // Call API to track acceptance
      await apiClient("/MarketingRules/accept", {
        method: "POST",
        body: JSON.stringify({
          ruleId: suggestion.ruleId,
        }),
      });

      // Add to cart via callback
      onAddItem({
        itemId: suggestion.suggestItemId,
        name: suggestion.suggestItemName,
        price: suggestion.discountedPrice || suggestion.suggestItemPrice,
        discount: suggestion.discountPercent,
      });

      // Mark as accepted
      setAccepted((prev) => new Set(prev).add(suggestion.ruleId));
    } catch (error) {
      console.error("Failed to accept upsell:", error);
    }
  };

  if (
    loading ||
    suggestions.length === 0 ||
    accepted.size === suggestions.length
  ) {
    return null;
  }

  return (
    <div className={`space-y-3 ${className}`}>
      <h3 className="text-sm font-semibold text-[#4A4A5A] uppercase tracking-wider flex items-center gap-2">
        <TagIcon className="w-4 h-4 text-[#D4AF37]" />
        You Might Also Like
      </h3>

      <div className="space-y-3">
        {suggestions
          .filter((s) => !accepted.has(s.ruleId))
          .map((suggestion) => (
            <div
              key={suggestion.ruleId}
              className="card p-3 flex items-center gap-3 hover:shadow-md transition-all"
            >
              {/* Item Image */}
              <div className="w-16 h-16 bg-gradient-to-br from-[rgba(214,228,247,0.6)] to-[rgba(253,246,227,0.8)] rounded-lg flex items-center justify-center flex-shrink-0">
                {suggestion.suggestItemImageUrl ? (
                  <img
                    src={suggestion.suggestItemImageUrl}
                    alt={suggestion.suggestItemName}
                    className="w-full h-full object-cover rounded-lg"
                  />
                ) : (
                  <span className="text-2xl">🍽️</span>
                )}
              </div>

              {/* Item Info */}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-[#1A1A2E] text-sm truncate">
                  {suggestion.suggestItemName}
                </p>
                <p className="text-xs text-[#71717A] truncate">
                  {suggestion.message}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  {suggestion.discountPercent ? (
                    <>
                      <span className="text-[#D4AF37] font-bold font-mono text-sm">
                        ${suggestion.discountedPrice?.toFixed(2)}
                      </span>
                      <span className="text-[#71717A] line-through text-xs">
                        ${suggestion.suggestItemPrice.toFixed(2)}
                      </span>
                      <span className="text-green-600 text-xs font-semibold">
                        {suggestion.discountMessage}
                      </span>
                    </>
                  ) : (
                    <span className="text-[#D4AF37] font-bold font-mono text-sm">
                      ${suggestion.suggestItemPrice.toFixed(2)}
                    </span>
                  )}
                </div>
              </div>

              {/* Add Button */}
              <button
                onClick={() => handleAccept(suggestion)}
                className="btn btn-gold w-10 h-10 p-0 rounded-full flex items-center justify-center"
                title="Add to cart"
              >
                <PlusIcon className="w-5 h-5" />
              </button>
            </div>
          ))}
      </div>
    </div>
  );
}

// Simple inline suggestion component for cart page
export function InlineUpsell({
  onAddItem,
}: {
  onAddItem: (itemId: number, price: number) => void;
}) {
  const { items } = useCart();
  const [suggestion, setSuggestion] = useState<UpsellSuggestion | null>(null);

  useEffect(() => {
    // Only show for specific triggers (e.g., burger)
    const hasBurger = items.some((i) =>
      i.name.toLowerCase().includes("burger"),
    );
    if (hasBurger) {
      // This would be API-driven in production
      setSuggestion({
        ruleId: 1,
        ruleName: "Burger + Fries",
        message: "Complete your meal with fries!",
        suggestItemId: 15,
        suggestItemName: "French Fries",
        suggestItemPrice: 3.99,
        discountPercent: 10,
        discountedPrice: 3.59,
        discountMessage: "Save 10%!",
      });
    } else {
      setSuggestion(null);
    }
  }, [items]);

  if (!suggestion) return null;

  return (
    <div className="bg-[rgba(212,175,55,0.08)] border border-[rgba(212,175,55,0.2)] rounded-lg p-4 mt-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-semibold text-[#1A1A2E] text-sm">
            {suggestion.suggestItemName}
          </p>
          <p className="text-xs text-[#71717A]">{suggestion.message}</p>
          <p className="text-xs text-green-600 font-semibold">
            {suggestion.discountMessage}
          </p>
        </div>
        <div className="text-right">
          <p className="text-[#D4AF37] font-bold">
            ${suggestion.discountedPrice?.toFixed(2)}
          </p>
          <button
            onClick={() =>
              onAddItem(
                suggestion.suggestItemId,
                suggestion.discountedPrice || suggestion.suggestItemPrice,
              )
            }
            className="text-xs text-[#1E5AA8] hover:text-[#D4AF37] font-semibold mt-1"
          >
            + Add to order
          </button>
        </div>
      </div>
    </div>
  );
}
