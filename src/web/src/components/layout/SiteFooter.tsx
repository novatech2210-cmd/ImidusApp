/**
 * IMIDUS Technologies – Site Footer (Next.js)
 * Path: src/components/layout/SiteFooter.tsx
 */

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';

export default function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer style={{
      backgroundColor: 'var(--color-dark-bg)',
      color: 'var(--color-white)',
      paddingTop: '2.5rem',
      paddingBottom: '1.5rem',
    }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 1.5rem' }}>

        {/* Top row */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem', paddingBottom: '2rem',
          borderBottom: '1px solid rgba(255,255,255,0.1)' }}>

          {/* Brand column */}
          <div style={{ flex: '1 1 220px' }}>
            <Image
              src="/images/logo_imidus_alt.png"
              alt="Imidus Technologies"
              width={120}
              height={41}
              style={{ opacity: 0.9, marginBottom: '0.75rem' }}
            />
            <p style={{ fontSize: '0.8125rem', color: 'var(--color-light-blue)', lineHeight: 1.6 }}>
              Imidus Technologies Inc.<br />
              Online ordering powered by the INI POS system.
            </p>
          </div>

          {/* Quick links */}
          <div style={{ flex: '1 1 160px' }}>
            <h4 style={{ color: 'var(--color-brand-gold)', fontSize: '0.75rem',
              textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.875rem' }}>
              Quick Links
            </h4>
            {[
              { label: 'Menu', href: '/menu' },
              { label: 'My Orders', href: '/orders' },
              { label: 'Loyalty Rewards', href: '/loyalty' },
              { label: 'Contact', href: '/contact' },
            ].map(l => (
              <Link key={l.href} href={l.href} style={{
                display: 'block', fontSize: '0.875rem',
                color: 'rgba(255,255,255,0.7)', marginBottom: '0.5rem',
                transition: 'color 0.15s',
              }}
                onMouseEnter={e => (e.currentTarget.style.color = 'var(--color-brand-gold)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.7)')}
              >
                {l.label}
              </Link>
            ))}
          </div>

          {/* Legal */}
          <div style={{ flex: '1 1 160px' }}>
            <h4 style={{ color: 'var(--color-brand-gold)', fontSize: '0.75rem',
              textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.875rem' }}>
              Legal
            </h4>
            {[
              { label: 'Privacy Policy', href: '/privacy' },
              { label: 'Terms of Service', href: '/terms' },
            ].map(l => (
              <Link key={l.href} href={l.href} style={{
                display: 'block', fontSize: '0.875rem',
                color: 'rgba(255,255,255,0.7)', marginBottom: '0.5rem',
              }}>
                {l.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Bottom row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          paddingTop: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)' }}>
            © {year} Imidus Technologies Inc. All rights reserved.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Image
              src="/images/logo_imidus_triangle.png"
              alt=""
              width={16}
              height={16}
              style={{ opacity: 0.5 }}
            />
            <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)' }}>
              Built by Novatech
            </span>
          </div>
        </div>

      </div>
    </footer>
  );
}
