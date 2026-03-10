"use client";

import Link from "next/link";
import { useCart } from "@/context/CartContext";
import { ShoppingBagIcon } from "@heroicons/react/24/solid";

export function OrderPanel() {
  const { items, subtotal, tax, total, count, clearCart } = useCart();

  return (
    <div className="pos-order-panel">
      <div className="p-6 border-b border-[rgba(30,90,168,0.08)]">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-black uppercase tracking-widest text-[#1E5AA8] flex items-center gap-2">
            <ShoppingBagIcon className="w-6 h-6" />
            Cart ({count})
          </h2>
          <button
            onClick={clearCart}
            className="text-[10px] font-bold uppercase tracking-wider text-[#71717A] hover:text-[#1E5AA8] transition-colors"
          >
            Clear
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {items.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-[#71717A] py-20 text-center">
            <svg
              className="w-16 h-16 mb-4 opacity-30"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
              />
            </svg>
            <p className="font-bold uppercase tracking-tighter text-sm">
              Your cart is empty
            </p>
            <p className="text-xs mt-2 opacity-70">Add items from the menu</p>
          </div>
        ) : (
          items.map((item) => (
            <div
              key={item.id}
              className="flex justify-between items-start animate-in slide-in-from-right-4 duration-300"
            >
              <div className="flex gap-3">
                <span className="bg-[rgba(212,175,55,0.15)] text-[#D4AF37] font-black px-2 py-0.5 rounded text-sm min-w-[28px] text-center">
                  {item.quantity}
                </span>
                <div>
                  <p className="font-bold text-sm text-[#1A1A2E] leading-tight">
                    {item.name}
                  </p>
                  <p className="text-[10px] text-[#71717A] uppercase tracking-wider mt-0.5">
                    {item.sizeName}
                  </p>
                </div>
              </div>
              <p className="font-mono font-bold text-sm text-[#D4AF37]">
                ${(item.price * item.quantity).toFixed(2)}
              </p>
            </div>
          ))
        )}
      </div>

      <div className="p-6 border-t border-[rgba(30,90,168,0.08)] space-y-4 bg-[rgba(253,246,227,0.3)]">
        <div className="flex justify-between items-center text-[#4A4A5A] uppercase text-sm font-bold tracking-widest">
          <span>Subtotal</span>
          <span className="font-mono">${subtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between items-center text-[#4A4A5A] uppercase text-sm font-bold tracking-widest">
          <span>Tax (6%)</span>
          <span className="font-mono">${(subtotal * 0.06).toFixed(2)}</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-[rgba(212,175,55,0.3)]">
          <div className="flex justify-between items-center mb-1">
            <span className="text-[#71717A] text-[10px] uppercase font-black tracking-wider">
              Total
            </span>
            <span className="price text-2xl">${total.toFixed(2)}</span>
          </div>
          <p className="text-[10px] text-[#71717A] text-right italic">
            Incl. 6% GST
          </p>
        </div>

        <Link
          href="/cart"
          className={`block w-full btn btn-gold text-center py-4 ${items.length === 0 ? "opacity-50 pointer-events-none" : ""}`}
        >
          View Cart & Checkout
        </Link>
      </div>
    </div>
  );
}
