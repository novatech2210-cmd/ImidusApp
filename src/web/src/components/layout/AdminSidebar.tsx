/**
 * IMIDUS Technologies – Admin Portal Sidebar
 * Path: src/components/layout/AdminSidebar.tsx
 *
 * Dark sidebar (#1A1A2E) with triangle brand mark, gold active states.
 */

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/router';

interface NavSection {
  title: string;
  items: { label: string; href: string; icon: string }[];
}

const NAV: NavSection[] = [
  {
    title: 'Operations',
    items: [
      { label: 'Dashboard',    href: '/admin',              icon: '📊' },
      { label: 'Live Orders',  href: '/admin/orders',       icon: '🔄' },
      { label: 'Menu Control', href: '/admin/menu',         icon: '🍽️' },
      { label: 'Reports',      href: '/admin/reports',      icon: '📈' },
    ],
  },
  {
    title: 'Customers',
    items: [
      { label: 'Customer List',  href: '/admin/customers',    icon: '👥' },
      { label: 'Loyalty Points', href: '/admin/loyalty',      icon: '⭐' },
      { label: 'Segments',       href: '/admin/segments',     icon: '🎯' },
    ],
  },
  {
    title: 'Marketing',
    items: [
      { label: 'Push Campaigns',  href: '/admin/push',        icon: '📣' },
      { label: 'Birthday Rewards',href: '/admin/birthday',    icon: '🎂' },
      { label: 'Banners',         href: '/admin/banners',     icon: '🖼️' },
    ],
  },
  {
    title: 'Settings',
    items: [
      { label: 'POS Integration', href: '/admin/integration', icon: '🔌' },
      { label: 'Payments',        href: '/admin/payments',    icon: '💳' },
      { label: 'Team',            href: '/admin/team',        icon: '🔑' },
    ],
  },
];

export default function AdminSidebar() {
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);

  const isActive = (href: string) =>
    href === '/admin' ? router.pathname === '/admin' : router.pathname.startsWith(href);

  return (
    <aside style={{
      width: collapsed ? 64 : 240,
      minHeight: '100vh',
      backgroundColor: 'var(--color-dark-bg)',
      display: 'flex',
      flexDirection: 'column',
      transition: 'width 0.2s ease',
      flexShrink: 0,
      borderRight: '1px solid rgba(255,255,255,0.06)',
    }}>

      {/* ── Brand header ──────────────────────────────────── */}
      <div style={{
        padding: '1.25rem 0.875rem',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        minHeight: 72,
      }}>
        <Image
          src="/images/logo_imidus_triangle.png"
          alt="Imidus"
          width={36}
          height={36}
          style={{ flexShrink: 0 }}
        />
        {!collapsed && (
          <div>
            <div style={{ color: 'var(--color-brand-gold)', fontSize: '0.8125rem', fontWeight: 700, letterSpacing: 1 }}>
              IMIDUS
            </div>
            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.625rem', letterSpacing: 0.5 }}>
              ADMIN PORTAL
            </div>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          style={{
            marginLeft: 'auto',
            background: 'none',
            border: 'none',
            color: 'rgba(255,255,255,0.4)',
            cursor: 'pointer',
            fontSize: '1rem',
            padding: '4px',
            flexShrink: 0,
          }}
          title={collapsed ? 'Expand' : 'Collapse'}
        >
          {collapsed ? '›' : '‹'}
        </button>
      </div>

      {/* ── Navigation sections ────────────────────────────── */}
      <nav style={{ flex: 1, overflowY: 'auto', padding: '0.5rem 0' }}>
        {NAV.map(section => (
          <div key={section.title}>
            {!collapsed && (
              <div style={{
                padding: '0.875rem 1rem 0.375rem',
                fontSize: '0.625rem',
                fontWeight: 700,
                color: 'rgba(255,255,255,0.3)',
                textTransform: 'uppercase',
                letterSpacing: '1px',
              }}>
                {section.title}
              </div>
            )}
            {section.items.map(item => {
              const active = isActive(item.href);
              return (
                <Link key={item.href} href={item.href} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: collapsed ? '0.75rem' : '0.625rem 1rem',
                  justifyContent: collapsed ? 'center' : 'flex-start',
                  color: active ? 'var(--color-brand-gold)' : 'rgba(255,255,255,0.65)',
                  backgroundColor: active ? 'rgba(212,175,55,0.12)' : 'transparent',
                  borderLeft: active ? '3px solid var(--color-brand-gold)' : '3px solid transparent',
                  fontSize: '0.875rem',
                  fontWeight: active ? 700 : 500,
                  transition: 'all 0.15s',
                  textDecoration: 'none',
                }}>
                  <span style={{ fontSize: '1rem', flexShrink: 0 }}>{item.icon}</span>
                  {!collapsed && item.label}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* ── Bottom branding strip ─────────────────────────── */}
      {!collapsed && (
        <div style={{
          padding: '0.875rem 1rem',
          borderTop: '1px solid rgba(255,255,255,0.06)',
        }}>
          <Image
            src="/images/logo_imidus_alt.png"
            alt="Imidus Technologies"
            width={80}
            height={27}
            style={{ opacity: 0.35 }}
          />
          <div style={{ fontSize: '0.625rem', color: 'rgba(255,255,255,0.2)', marginTop: '0.25rem' }}>
            Powered by Novatech
          </div>
        </div>
      )}
    </aside>
  );
}
