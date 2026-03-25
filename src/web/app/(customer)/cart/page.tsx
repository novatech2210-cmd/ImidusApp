"use client";

import { useState } from "react";
import { useCart } from "@/context/CartContext";
import { OrderSummary } from "@/components/OrderSummary";
import Link from "next/link";
import {
  TrashIcon,
  PlusIcon,
  MinusIcon,
  ShoppingBagIcon,
  ArrowLeftIcon,
} from "@heroicons/react/24/solid";

export default function CartPage() {
  const { items, removeItem, updateQty, subtotal, tax, total, count } =
    useCart();

  // Track which item is showing remove confirmation
  const [confirmingRemove, setConfirmingRemove] = useState<string | null>(null);

  /**
   * Handle remove with confirmation
   */
  const handleRemoveClick = (id: string) => {
    if (confirmingRemove === id) {
      // Second click - actually remove
      removeItem(id);
      setConfirmingRemove(null);
    } else {
      // First click - show confirmation
      setConfirmingRemove(id);
      // Auto-cancel after 3 seconds
      setTimeout(() => setConfirmingRemove(null), 3000);
    }
  };

  /**
   * Cancel remove confirmation
   */
  const handleCancelRemove = () => {
    setConfirmingRemove(null);
  };

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] px-4">
        <div className="card card-body text-center max-w-md w-full">
          <div className="w-32 h-32 mx-auto mb-6 bg-gradient-to-br from-[rgba(214,228,247,0.4)] to-[rgba(253,246,227,0.4)] rounded-full flex items-center justify-center">
            <ShoppingBagIcon className="w-16 h-16 text-[#71717A]" />
          </div>
          <h2 className="text-2xl font-bold text-[#1A1A2E] mb-2">
            Your cart is empty
          </h2>
          <p className="text-[#71717A] mb-8">
            Add some delicious items from our menu to get started!
          </p>
          <Link href="/menu" className="btn btn-primary w-full">
            Browse Menu
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
      <h1 className="text-2xl sm:text-3xl font-bold text-[#1E5AA8] mb-6 sm:mb-8 tracking-tight">
        Shopping Cart ({count} {count === 1 ? "item" : "items"})
      </h1>

      <div className="grid lg:grid-cols-3 gap-6 lg:gap-8">
        {/* Cart Items - Left Column */}
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => (
            <div
              key={item.id}
              className="card card-body"
            >
              {/* Mobile: Stacked Layout */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                {/* Item Image */}
                <div className="w-full sm:w-24 h-32 sm:h-24 bg-gradient-to-br from-[rgba(214,228,247,0.6)] to-[rgba(253,246,227,0.8)] rounded-lg flex items-center justify-center flex-shrink-0">
                  {item.image ? (
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-cover rounded-lg"
                    />
                  ) : (
                    <span className="text-4xl opacity-40">🍽️</span>
                  )}
                </div>

                {/* Item Details */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-[#1A1A2E] text-lg truncate">
                    {item.name}
                  </h3>
                  <p className="text-sm text-[#71717A]">{item.sizeName}</p>
                  <p className="price mt-1">${item.price.toFixed(2)} each</p>
                </div>

                {/* Quantity Controls + Total + Remove */}
                <div className="flex items-center justify-between sm:justify-end gap-4 sm:gap-6">
                  {/* Quantity Controls - 44px touch targets */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateQty(item.id, item.quantity - 1)}
                      disabled={item.quantity <= 1}
                      className={`w-11 h-11 rounded-full flex items-center justify-center transition-all ${
                        item.quantity <= 1
                          ? "bg-gray-100 text-gray-300 cursor-not-allowed"
                          : "bg-[rgba(214,228,247,0.6)] hover:bg-[#D4AF37] hover:text-white active:scale-95"
                      }`}
                      aria-label="Decrease quantity"
                    >
                      <MinusIcon className="w-5 h-5" />
                    </button>
                    <span className="w-10 text-center font-bold text-[#1A1A2E] text-lg">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQty(item.id, item.quantity + 1)}
                      className="w-11 h-11 rounded-full bg-[rgba(214,228,247,0.6)] hover:bg-[#D4AF37] hover:text-white flex items-center justify-center transition-all active:scale-95"
                      aria-label="Increase quantity"
                    >
                      <PlusIcon className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Item Total */}
                  <div className="text-right min-w-[80px]">
                    <p className="price text-xl font-bold">
                      ${(item.price * item.quantity).toFixed(2)}
                    </p>
                  </div>

                  {/* Remove Button with Confirmation */}
                  {confirmingRemove === item.id ? (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          removeItem(item.id);
                          setConfirmingRemove(null);
                        }}
                        className="px-3 py-2 text-sm font-semibold text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors"
                      >
                        Remove
                      </button>
                      <button
                        onClick={handleCancelRemove}
                        className="px-3 py-2 text-sm font-semibold text-[#4A4A5A] hover:text-[#1A1A2E] transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleRemoveClick(item.id)}
                      className="p-2 text-[#71717A] hover:text-red-500 transition-colors"
                      aria-label="Remove item"
                    >
                      <TrashIcon className="w-6 h-6" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* Continue Shopping Link */}
          <Link
            href="/menu"
            className="inline-flex items-center gap-2 text-[#1E5AA8] hover:text-[#D4AF37] font-semibold mt-4 transition-colors"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            Continue Shopping
          </Link>
        </div>

        {/* Order Summary - Right Column (Sticky on Desktop) */}
        <div className="lg:col-span-1">
          <div className="card card-elevated card-body lg:sticky lg:top-6">
            <h2 className="text-xl font-bold text-[#1A1A2E] mb-6">
              Order Summary
            </h2>

            <OrderSummary
              items={items}
              subtotal={subtotal}
              tax={tax}
              total={total}
            />

            <div className="mt-6">
              <Link
                href="/checkout"
                className="btn btn-gold w-full block text-center"
              >
                Proceed to Checkout
              </Link>
            </div>

            <p className="text-xs text-[#71717A] text-center mt-4">
              Secure checkout powered by Authorize.net
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
