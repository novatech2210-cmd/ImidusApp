import { OrderPanel } from "@/components/OrderPanel";
import { Sidebar } from "@/components/Sidebar";
import { SyncIndicator } from "@/components/SyncIndicator";
import { AuthProvider } from "@/context/AuthContext";
import { CartProvider } from "@/context/CartContext";
import { SyncProvider } from "@/context/SyncContext";
import type { Metadata } from "next";
import "./globals.css";
import "./customer-theme.css";

export const metadata: Metadata = {
  title: "IMIDUSAPP | The Digital Growth Engine for Restaurants",
  description:
    "Seamless Ordering. Real-Time Sync. Unified Loyalty. Order, track, and earn rewards with IMIDUS.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="customer-layout">
        <AuthProvider>
          <CartProvider>
            <SyncProvider pollingInterval={30000}>
              <div className="imidus-container">
                <Sidebar />
                <main className="imidus-main">
                  <header className="imidus-header">
                    <div className="header-brand">
                      <span className="logo-text">IMIDUS<span className="text-gradient">APP</span></span>
                      <span className="tagline">Seamless Ordering. Real-Time Sync. Unified Loyalty.</span>
                    </div>
                    <div className="header-actions">
                      <a href="/menu" className="header-cta">Start Ordering</a>
                      <SyncIndicator />
                    </div>
                  </header>
                  <div className="content-area">
                    {children}
                  </div>
                </main>
                <OrderPanel />
              </div>
            </SyncProvider>
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
