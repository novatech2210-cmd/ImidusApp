"use client";

import { useCart } from "@/context/CartContext";

export function OrderPanel() {
  const { items, total, clearCart } = useCart();

  return (
    <div className="pos-order-panel blurred p-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-black uppercase tracking-widest text-gold-vibrant">
          Order View
        </h2>
        <button
          onClick={clearCart}
          className="text-text-dim text-xs font-bold hover:text-white uppercase"
        >
          Clear
        </button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 pr-2">
        {items.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center opacity-20 py-20 text-center">
            <svg
              className="w-16 h-16 mb-4"
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
            <p className="font-bold uppercase tracking-tighter">Empty Table</p>
          </div>
        ) : (
          items.map((item) => (
            <div
              key={item.menuItemId}
              className="flex justify-between items-start animate-in slide-in-from-right-4 duration-300"
            >
              <div className="flex gap-3">
                <span className="bg-bg-surface text-gold font-black px-2 py-0.5 rounded border border-divider text-sm">
                  {item.quantity}
                </span>
                <div>
                  <p className="font-bold text-sm text-white leading-tight uppercase">
                    {item.name}
                  </p>
                  <p className="text-[10px] text-text-dim uppercase tracking-widest mt-0.5">
                    Regular
                  </p>
                </div>
              </div>
              <p className="font-mono font-bold text-sm">
                ${(item.price * item.quantity).toFixed(2)}
              </p>
            </div>
          ))
        )}
      </div>

      <div className="mt-6 pt-6 border-t border-divider space-y-4">
        <div className="flex justify-between items-center text-text-secondary uppercase text-sm font-bold tracking-widest">
          <span>Subtotal</span>
          <span className="font-mono">${total.toFixed(2)}</span>
        </div>

        <div className="bg-bg-surface p-4 rounded-xl border border-divider">
          <div className="flex justify-between items-center mb-1">
            <span className="text-text-dim text-[10px] uppercase font-black">
              Total Due
            </span>
            <span className="text-gold-vibrant font-black text-2xl font-mono">
              ${(total * 1.12).toFixed(2)}
            </span>
          </div>
          <p className="text-[10px] text-text-dim text-right italic">
            Incl. 12% GST/PST
          </p>
        </div>

        <button
          className="w-full btn-sellable h-16 text-lg group overflow-hidden relative"
          disabled={items.length === 0}
        >
          <span className="relative z-10">Pay & Finalize</span>
          <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500 skew-x-[-20deg]" />
        </button>
      </div>
    </div>
  );
}
