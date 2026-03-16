"use client";

import Link from "next/link";

export default function WaiterHomePage() {
  return (
    <div className="min-h-screen bg-[#1A1A2E] text-white p-6 font-sans">
      <header className="mb-10 text-center flex flex-col items-center">
        <img
          src="/brand/imidus-triangle-logo.png"
          alt="IMIDUS Logo"
          style={{
            width: 60,
            height: 60,
            objectFit: "contain",
            marginBottom: 12,
          }}
        />
        <h1 className="text-3xl font-black text-[#D4AF37] uppercase tracking-tighter">
          Imidus Waiter
        </h1>
        <div className="h-1 w-20 bg-[#1E5AA8] mx-auto mt-2"></div>
      </header>

      <div className="mb-8">
        <h2 className="text-sm font-black text-[#1E5AA8] uppercase tracking-[0.2em] mb-4">
          Select Table
        </h2>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((table) => (
            <Link key={table} href={`/menu?table=${table}`} className="block">
              <button className="w-full aspect-square flex flex-col items-center justify-center border-2 border-[rgba(255,255,255,0.05)] rounded-2xl bg-[rgba(255,255,255,0.03)] active:bg-[#1E5AA8] active:border-[#1E5AA8] transition-all hover:border-[rgba(30,90,168,0.3)] shadow-2xl">
                <span className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">
                  Tbl
                </span>
                <span className="text-3xl font-black text-white">{table}</span>
              </button>
            </Link>
          ))}
        </div>
      </div>

      <div className="mt-12 p-6 border border-[rgba(30,90,168,0.2)] rounded-3xl bg-[rgba(30,90,168,0.05)]">
        <h3 className="text-xs font-black text-[#1E5AA8] uppercase tracking-[0.2em] mb-2">
          System Status
        </h3>
        <p className="text-xs text-neutral-400 font-bold uppercase">
          Backend: <span className="text-green-500">Connected</span>
        </p>
      </div>
    </div>
  );
}
