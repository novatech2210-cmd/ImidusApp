'use client';

import React from 'react';
import Sidebar from './Sidebar';
import Header from './Header';

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
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <Header userName={userName} userEmail={userEmail} />

        {/* Page Content */}
        <main className="flex-1 overflow-auto">
          <div className="h-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
