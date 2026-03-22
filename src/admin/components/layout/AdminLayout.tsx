'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  ShoppingCart,
  Users,
  UtensilsCrossed,
  Gift,
  Megaphone,
  FileText,
  Settings,
  Database
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/protected/dashboard', icon: LayoutDashboard },
  { name: 'Orders', href: '/protected/orders', icon: ShoppingCart },
  { name: 'Customers', href: '/protected/customers', icon: Users },
  { name: 'Menu', href: '/protected/menu', icon: UtensilsCrossed },
  { name: 'Rewards', href: '/protected/rewards', icon: Gift },
  { name: 'Campaigns', href: '/protected/campaigns', icon: Megaphone },
  { name: 'Logs', href: '/protected/logs', icon: FileText },
  { name: 'Settings', href: '/protected/settings', icon: Settings },
];

const Sidebar = () => {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-[#1A1A1F] border-r border-[#2A2A30] flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-[#2A2A30]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#5BA0FF] to-[#3D82E0] flex items-center justify-center">
            <span className="text-lg font-bold text-white">I</span>
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#F5F5F7]">IMIDUS</h1>
            <p className="text-xs text-[#6E6E78]">Admin Portal</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {navigation.map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'bg-gradient-to-r from-[#5BA0FF]/20 to-[#3D82E0]/10 text-[#5BA0FF] border border-[#5BA0FF]/30'
                  : 'text-[#9A9AA3] hover:text-[#F5F5F7] hover:bg-[#222228]'
              }`}
            >
              <item.icon size={18} className={isActive ? 'text-[#5BA0FF]' : ''} />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* POS Connection Status */}
      <div className="p-4 border-t border-[#2A2A30]">
        <div className="p-3 bg-[#222228] rounded-xl">
          <div className="flex items-center gap-2 mb-2">
            <Database size={14} className="text-[#4ADE80]" />
            <span className="text-xs font-medium text-[#4ADE80]">Connected</span>
          </div>
          <p className="text-[10px] text-[#6E6E78]">INI_Restaurant DB</p>
          <p className="text-[10px] text-[#6E6E78]">Read-only access</p>
        </div>
      </div>
    </aside>
  );
};

const Header = () => (
  <header className="h-16 bg-[#1A1A1F] border-b border-[#2A2A30] px-6 flex items-center justify-between">
    <div className="flex items-center gap-4">
      <div className="relative">
        <input
          type="text"
          placeholder="Search orders, customers..."
          className="w-80 h-10 bg-[#222228] border border-[#2A2A30] rounded-xl px-4 pl-10 text-sm text-[#F5F5F7] placeholder-[#6E6E78] focus:outline-none focus:border-[#5BA0FF] transition-colors"
        />
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6E6E78]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>
    </div>

    <div className="flex items-center gap-4">
      {/* Notifications */}
      <button className="relative p-2 text-[#9A9AA3] hover:text-[#F5F5F7] hover:bg-[#222228] rounded-lg transition-colors">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#FF6B6B] rounded-full" />
      </button>

      {/* User Menu */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#FFD666] to-[#E5B84D] flex items-center justify-center">
          <span className="text-sm font-semibold text-[#1A1A1F]">A</span>
        </div>
        <div className="hidden sm:block">
          <p className="text-sm font-medium text-[#F5F5F7]">Admin</p>
          <p className="text-xs text-[#6E6E78]">Manager</p>
        </div>
      </div>
    </div>
  </header>
);

const AdminLayout = ({ children }: { children: React.ReactNode }) => (
  <div className="flex h-screen bg-[#0F0F12]">
    <Sidebar />
    <div className="flex-1 flex flex-col overflow-hidden">
      <Header />
      <main className="flex-1 overflow-auto p-6">
        {children}
      </main>
    </div>
  </div>
);

export default AdminLayout;
