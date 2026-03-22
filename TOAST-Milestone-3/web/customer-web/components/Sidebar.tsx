"use client";

import {
  ClipboardDocumentListIcon,
  HomeIcon,
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
    { name: "Orders", href: "/orders", icon: ClipboardDocumentListIcon },
    { name: "Profile", href: "/profile", icon: UserIcon },
  ];

  return (
    <aside className="sidebar flex flex-col items-center py-6">
      <div className="sidebar-nav flex flex-col gap-4 w-full px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`sidebar-item ${isActive ? "active" : ""}`}
            >
              <Icon className="sidebar-icon" />
              <span className="sidebar-label">{item.name}</span>
            </Link>
          );
        })}
      </div>
    </aside>
  );
}
