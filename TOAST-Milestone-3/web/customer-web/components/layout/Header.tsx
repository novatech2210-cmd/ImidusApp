'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useCart } from '@/context/CartContext';

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { items } = useCart();

  const cartItemCount = items?.reduce((sum, item) => sum + item.quantity, 0) || 0;

  return (
    <header className="sticky top-0 z-50 bg-white shadow-md">
      <nav className="container mx-auto">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <Image
              src="/logo/imidus-logo.svg"
              alt="Imidus Restaurant"
              width={180}
              height={48}
              priority
            />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <Link
              href="/menu"
              className="text-base font-medium text-brand-blue hover:text-brand-blue-dark transition-colors"
            >
              Menu
            </Link>
            <Link
              href="/rewards"
              className="text-base font-medium text-brand-blue hover:text-brand-blue-dark transition-colors"
            >
              Rewards
            </Link>
            <Link
              href="/locations"
              className="text-base font-medium text-brand-blue hover:text-brand-blue-dark transition-colors"
            >
              Locations
            </Link>

            {/* Cart */}
            <Link
              href="/cart"
              className="relative p-2"
              aria-label={`Cart with ${cartItemCount} items`}
            >
              <svg className="w-6 h-6 text-brand-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              {cartItemCount > 0 && (
                <span className="absolute -top-1 -right-1 flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-brand-gold rounded-full">
                  {cartItemCount}
                </span>
              )}
            </Link>

            {/* Sign In */}
            <Link
              href="/auth/signin"
              className="btn btn-primary"
            >
              Sign In
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            <svg className="w-6 h-6 text-brand-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-neutral-100 py-4">
            <Link
              href="/menu"
              className="block py-2 text-base font-medium text-brand-blue hover:text-brand-blue-dark"
              onClick={() => setMobileMenuOpen(false)}
            >
              Menu
            </Link>
            <Link
              href="/rewards"
              className="block py-2 text-base font-medium text-brand-blue hover:text-brand-blue-dark"
              onClick={() => setMobileMenuOpen(false)}
            >
              Rewards
            </Link>
            <Link
              href="/locations"
              className="block py-2 text-base font-medium text-brand-blue hover:text-brand-blue-dark"
              onClick={() => setMobileMenuOpen(false)}
            >
              Locations
            </Link>
            <Link
              href="/cart"
              className="block py-2 text-base font-medium text-brand-blue hover:text-brand-blue-dark"
              onClick={() => setMobileMenuOpen(false)}
            >
              Cart ({cartItemCount})
            </Link>
            <Link
              href="/auth/signin"
              className="block mt-4 btn btn-primary btn-block"
              onClick={() => setMobileMenuOpen(false)}
            >
              Sign In
            </Link>
          </div>
        )}
      </nav>
    </header>
  );
}
