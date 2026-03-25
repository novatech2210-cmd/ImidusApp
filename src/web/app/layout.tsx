"use client";

import { AuthProvider } from "@/context/AuthContext";
import { SyncProvider } from "@/context/SyncContext";
import "@fontsource/plus-jakarta-sans/400.css";
import "@fontsource/plus-jakarta-sans/500.css";
import "@fontsource/plus-jakarta-sans/600.css";
import "@fontsource/plus-jakarta-sans/700.css";
import "@fontsource/plus-jakarta-sans/800.css";
import "./customer-theme.css";
import "./globals.css";
import "./imperial-onyx.css";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased font-sans bg-gray-950 text-white">
        <AuthProvider>
          <SyncProvider pollingInterval={30000}>{children}</SyncProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
