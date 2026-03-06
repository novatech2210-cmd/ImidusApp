/**
 * IMIDUS Technologies – Site Header (Next.js)
 * Sticky branded navigation bar for the customer web ordering site.
 * Path: src/components/layout/SiteHeader.tsx
 */

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import styles from './SiteHeader.module.css';

interface NavItem {
  label: string;
  href: string;
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Menu',     href: '/menu' },
  { label: 'Orders',   href: '/orders' },
  { label: 'Loyalty',  href: '/loyalty' },
  { label: 'About',    href: '/about' },
];

interface SiteHeaderProps {
  cartCount?: number;
  customerName?: string;
  onCartClick?: () => void;
  onProfileClick?: () => void;
}

export default function SiteHeader({
  cartCount = 0,
  customerName,
  onCartClick,
  onProfileClick,
}: SiteHeaderProps) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  return (
    <header className={`${styles.header} ${scrolled ? styles.scrolled : ''}`}>
      {/* Gold underline accent */}
      <div className={styles.goldLine} />

      <div className={styles.inner}>
        {/* ── Logo ───────────────────────────────────────── */}
        <Link href="/" className={styles.logoLink}>
          <Image
            src="/images/logo_imidus_alt.png"
            alt="Imidus"
            width={120}
            height={41}
            priority
            className={styles.logo}
          />
        </Link>

        {/* ── Desktop nav ────────────────────────────────── */}
        <nav className={styles.desktopNav}>
          {NAV_ITEMS.map(item => (
            <Link key={item.href} href={item.href} className={styles.navLink}>
              {item.label}
            </Link>
          ))}
        </nav>

        {/* ── Actions ────────────────────────────────────── */}
        <div className={styles.actions}>
          {/* Cart */}
          <button className={styles.cartBtn} onClick={onCartClick} aria-label="Cart">
            <span className={styles.cartIcon}>🛒</span>
            {cartCount > 0 && (
              <span className={styles.cartBadge}>{cartCount > 99 ? '99+' : cartCount}</span>
            )}
          </button>

          {/* Profile / Login */}
          {customerName ? (
            <button className={styles.profileBtn} onClick={onProfileClick}>
              <span className={styles.profileAvatar}>
                {customerName.charAt(0).toUpperCase()}
              </span>
            </button>
          ) : (
            <Link href="/login" className={`btn btn-ghost-dark ${styles.signInBtn}`}>
              Sign In
            </Link>
          )}

          {/* Mobile hamburger */}
          <button
            className={styles.hamburger}
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Menu"
          >
            <span className={`${styles.bar} ${menuOpen ? styles.open : ''}`} />
            <span className={`${styles.bar} ${menuOpen ? styles.open : ''}`} />
            <span className={`${styles.bar} ${menuOpen ? styles.open : ''}`} />
          </button>
        </div>
      </div>

      {/* ── Mobile drawer ──────────────────────────────────── */}
      {menuOpen && (
        <div className={styles.mobileMenu}>
          {NAV_ITEMS.map(item => (
            <Link
              key={item.href}
              href={item.href}
              className={styles.mobileNavLink}
              onClick={() => setMenuOpen(false)}
            >
              {item.label}
            </Link>
          ))}
          {!customerName && (
            <Link href="/login" className={styles.mobileSignIn} onClick={() => setMenuOpen(false)}>
              Sign In
            </Link>
          )}
        </div>
      )}
    </header>
  );
}
