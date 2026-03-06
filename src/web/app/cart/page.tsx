"use client";
import { useCart } from "@/context/CartContext";
import Link from "next/link";
import { TrashIcon, PlusIcon, MinusIcon, ShoppingBagIcon } from "@heroicons/react/24/solid";

export default function CartPage() {
  const { items, removeItem, updateQty, subtotal, tax, total, count } = useCart();

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)] card">
        <ShoppingBagIcon className="w-24 h-24 text-[#71717A] mb-6" />
        <h2 className="text-2xl font-bold text-[#1A1A2E] mb-2">Your cart is empty</h2>
        <p className="text-[#71717A] mb-6">Add some delicious items from our menu!</p>
        <Link 
          href="/menu" 
          className="btn btn-primary"
        >
          Browse Menu
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-[#1E5AA8] mb-8 tracking-tight">
        Shopping Cart ({count} {count === 1 ? 'item' : 'items'})
      </h1>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => (
            <div
              key={item.id}
              className="card card-body flex items-center gap-4"
            >
              {/* Item Image */}
              <div className="w-24 h-24 bg-gradient-to-br from-[rgba(214,228,247,0.6)] to-[rgba(253,246,227,0.8)] rounded-lg flex items-center justify-center flex-shrink-0">
                {item.image ? (
                  <img src={item.image} alt={item.name} className="w-full h-full object-cover rounded-lg" />
                ) : (
                  <span className="text-3xl opacity-40">🍽️</span>
                )}
              </div>

              {/* Item Details */}
              <div className="flex-1">
                <h3 className="font-bold text-[#1A1A2E] text-lg">{item.name}</h3>
                <p className="text-sm text-[#71717A]">{item.sizeName}</p>
                <p className="price mt-1">
                  ${item.price.toFixed(2)} each
                </p>
              </div>

              {/* Quantity Controls */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => updateQty(item.id, item.quantity - 1)}
                  className="w-10 h-10 rounded-full bg-[rgba(214,228,247,0.6)] hover:bg-[#D4AF37] hover:text-white flex items-center justify-center transition-all"
                >
                  <MinusIcon className="w-4 h-4" />
                </button>
                <span className="w-8 text-center font-bold text-[#1A1A2E]">
                  {item.quantity}
                </span>
                <button
                  onClick={() => updateQty(item.id, item.quantity + 1)}
                  className="w-10 h-10 rounded-full bg-[rgba(214,228,247,0.6)] hover:bg-[#D4AF37] hover:text-white flex items-center justify-center transition-all"
                >
                  <PlusIcon className="w-4 h-4" />
                </button>
              </div>

              {/* Item Total */}
              <div className="text-right min-w-[80px]">
                <p className="price text-xl">
                  ${(item.price * item.quantity).toFixed(2)}
                </p>
              </div>

              {/* Remove Button */}
              <button
                onClick={() => removeItem(item.id)}
                className="p-2 text-[#71717A] hover:text-red-500 transition-colors"
              >
                <TrashIcon className="w-6 h-6" />
              </button>
            </div>
          ))}

          <Link 
            href="/menu" 
            className="inline-block text-[#1E5AA8] hover:text-[#D4AF37] font-semibold mt-4 transition-colors"
          >
            ← Continue Shopping
          </Link>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="card card-elevated card-body sticky top-6">
            <h2 className="text-xl font-bold text-[#1A1A2E] mb-6">Order Summary</h2>

            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-[#4A4A5A]">
                <span>Subtotal</span>
                <span className="font-mono">${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-[#4A4A5A]">
                <span>GST (6%)</span>
                <span className="font-mono">${(subtotal * 0.06).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-[#4A4A5A]">
                <span>PST (0%)</span>
                <span className="font-mono">$0.00</span>
              </div>
              <div className="border-t pt-3">
                <div className="flex justify-between text-xl font-bold text-[#1A1A2E]">
                  <span>Total</span>
                  <span className="price">${total.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <Link
              href="/checkout"
              className="btn btn-gold w-full block text-center"
            >
              Proceed to Checkout
            </Link>

            <p className="text-xs text-[#71717A] text-center mt-4">
              Taxes calculated at checkout. Final price may vary.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
