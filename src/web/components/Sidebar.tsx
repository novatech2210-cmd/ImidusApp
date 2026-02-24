"use client";

import {
    ChartBarIcon,
    ClipboardDocumentListIcon,
    HomeIcon,
    ShoppingCartIcon,
    Square3Stack3DIcon,
    UserIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function Sidebar() {
  const pathname = usePathname();

  const navItems = [
    { name: "Home", href: "/", icon: HomeIcon },
    { name: "Menu", href: "/menu", icon: Square3Stack3DIcon },
    { name: "Cart", href: "/cart", icon: ShoppingCartIcon },
    { name: "Orders", href: "/orders", icon: ClipboardDocumentListIcon },
    { name: "Dashboard", href: "/merchant/dashboard", icon: ChartBarIcon },
    { name: "Profile", href: "/profile", icon: UserIcon },
  ];

  return (
    <aside className="pos-sidebar">
      <div className="flex flex-col gap-4 w-full px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center p-3 rounded-lg transition-all ${
                isActive
                  ? "bg-blue text-white shadow-lg"
                  : "text-text-dim hover:bg-bg-active"
              }`}
            >
              <Icon className="w-6 h-6" />
              <span className="text-[10px] font-bold mt-1 uppercase leading-tight">
                {item.name}
              </span>
            </Link>
          );
        })}
      </div>
    </aside>
  );
}
