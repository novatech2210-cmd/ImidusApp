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
    <div className="flex h-screen bg-[#F8FAFC]">
      <div className="gold-line-top fixed top-0 left-0 w-full h-[3px] bg-gradient-to-r from-[#D4AF37] via-[#FDE68A] to-[#D4AF37] z-[100]" />

      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <Header userName={userName} userEmail={userEmail} />

        {/* Page Content */}
        <main className="flex-1 overflow-auto bg-[#F8FAFC]">
          <div className="h-full p-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
