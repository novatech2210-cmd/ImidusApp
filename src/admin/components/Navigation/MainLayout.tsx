"use client";

import React from "react";
import Header from "./Header";
import Sidebar from "./Sidebar";

interface MainLayoutProps {
  children: React.ReactNode;
  userName?: string;
  userEmail?: string;
}

export default function MainLayout({
  children,
  userName,
  userEmail,
}: MainLayoutProps) {
  return (
    <div className="flex h-screen bg-[#0F0F12]">
      {/* Gold accent line at top */}
      <div className="gold-line-top fixed top-0 left-0 w-full h-[3px] z-[100]" />

      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <Header userName={userName} userEmail={userEmail} />

        {/* Page Content */}
        <main className="flex-1 overflow-auto bg-[#0F0F12]">
          <div className="h-full">{children}</div>
        </main>
      </div>
    </div>
  );
}
