import { OrderPanel } from "@/components/OrderPanel";
import { Sidebar } from "@/components/Sidebar";
import { AuthProvider } from "@/context/AuthContext";
import { CartProvider } from "@/context/CartContext";
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "INI Restaurant POS",
  description:
    "IMIDUS Technologies — High-Throughput Hospitality POS Interface.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <AuthProvider>
          <CartProvider>
            <div className="pos-container">
              <Sidebar />
              <main className="pos-grid">
                <header className="flex justify-between items-center mb-8">
                  <div>
                    <h1 className="text-2xl font-black text-white uppercase tracking-tighter">
                      INI Restaurant
                    </h1>
                    <p className="text-text-dim text-[10px] font-bold uppercase tracking-[0.2em]">
                      Service Terminal #01
                    </p>
                  </div>
                  <div className="flex gap-4">
                    <div className="bg-bg-panel px-4 py-2 rounded-lg border border-divider flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                      <span className="text-[10px] font-bold text-text-secondary uppercase">
                        Server: Online
                      </span>
                    </div>
                  </div>
                </header>
                {children}
              </main>
              <OrderPanel />
            </div>
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
