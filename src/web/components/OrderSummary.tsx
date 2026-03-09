"use client";

import { CartItem } from "@/context/CartContext";

interface OrderSummaryProps {
  items: CartItem[];
  subtotal: number;
  tax: number;
  total: number;
  tipAmount?: number;
  compact?: boolean;
}

/**
 * OrderSummary - Displays itemized order with tax breakdown
 *
 * Props:
 * - items: Array of cart items to display
 * - subtotal: Pre-tax total
 * - tax: Tax amount (calculated externally)
 * - total: Final total including tax
 * - tipAmount: Optional tip amount
 * - compact: If true, shows a condensed view for sidebars
 */
export function OrderSummary({
  items,
  subtotal,
  tax,
  total,
  tipAmount = 0,
  compact = false,
}: OrderSummaryProps) {
  // GST is 6% of subtotal (Maryland has 0% PST)
  const gst = subtotal * 0.06;
  const pst = 0;

  if (compact) {
    return (
      <div className="space-y-2">
        {/* Compact item list */}
        <div className="space-y-1.5">
          {items.map((item) => (
            <div key={item.id} className="flex justify-between text-sm">
              <span className="text-[#4A4A5A] truncate max-w-[180px]">
                {item.quantity}x {item.name}
              </span>
              <span className="font-mono text-[#1A1A2E]">
                ${(item.price * item.quantity).toFixed(2)}
              </span>
            </div>
          ))}
        </div>

        {/* Compact totals */}
        <div className="border-t border-[rgba(30,90,168,0.1)] pt-2 space-y-1">
          <div className="flex justify-between text-xs text-[#71717A]">
            <span>Subtotal</span>
            <span className="font-mono">${subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-xs text-[#71717A]">
            <span>Tax (6%)</span>
            <span className="font-mono">${gst.toFixed(2)}</span>
          </div>
          {tipAmount > 0 && (
            <div className="flex justify-between text-xs text-[#71717A]">
              <span>Tip</span>
              <span className="font-mono">${tipAmount.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between text-sm font-bold text-[#1A1A2E] pt-1">
            <span>Total</span>
            <span className="text-[#D4AF37]">${(total + tipAmount).toFixed(2)}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Itemized list */}
      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.id} className="flex justify-between items-start">
            <div className="flex-1">
              <div className="flex items-baseline gap-2">
                <span className="font-semibold text-[#1A1A2E]">{item.name}</span>
                <span className="text-sm text-[#71717A]">x{item.quantity}</span>
              </div>
              <div className="text-xs text-[#71717A]">{item.sizeName}</div>
            </div>
            <span className="font-mono font-semibold text-[#1A1A2E]">
              ${(item.price * item.quantity).toFixed(2)}
            </span>
          </div>
        ))}
      </div>

      {/* Tax breakdown */}
      <div className="border-t border-[rgba(30,90,168,0.08)] pt-4 space-y-2">
        <div className="flex justify-between text-[#4A4A5A]">
          <span>Subtotal</span>
          <span className="font-mono">${subtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-[#4A4A5A]">
          <span>GST (6%)</span>
          <span className="font-mono">${gst.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-[#4A4A5A]">
          <span>PST (0%)</span>
          <span className="font-mono">${pst.toFixed(2)}</span>
        </div>
        {tipAmount > 0 && (
          <div className="flex justify-between text-[#4A4A5A]">
            <span>Tip</span>
            <span className="font-mono">${tipAmount.toFixed(2)}</span>
          </div>
        )}
      </div>

      {/* Total */}
      <div className="border-t border-[rgba(30,90,168,0.08)] pt-3">
        <div className="flex justify-between text-xl font-bold">
          <span className="text-[#1A1A2E]">Total</span>
          <span className="text-[#D4AF37]">${(total + tipAmount).toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
}

export default OrderSummary;
