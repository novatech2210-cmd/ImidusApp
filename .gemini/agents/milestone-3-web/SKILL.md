The provided milestone-3-web.md quality gate document is strong and well-structured for Milestone 3 — it effectively captures the key production-readiness criteria for a customer-facing Next.js web ordering platform (responsive, SEO-optimized, with scheduled orders, upselling, and Authorize.net payments). The checklists, cautions, proof points, E2E scenarios, and artifacts align with 2026 best practices for e-commerce web apps integrated with legacy POS systems.
Strengths (Keep These)

SEO & Performance focus (metatags, OpenGraph, Core Web Vitals, Lighthouse) — Critical in 2026, as Core Web Vitals (LCP < 2.5s, INP < 200ms, CLS < 0.1) remain a direct Google ranking factor.
Scheduled orders caution → Spot-on: Writing future orders directly to tblSales (with TransType=2) risks immediate POS processing/cooking. Overlay table (ScheduledOrders in IntegrationService DB) is the correct pattern.
Payments emphasis on Accept.js (tokenization-only) → Matches earlier skill files.
E2E scenarios practical and tied to POS outcomes.
Delivery artifacts realistic for a Next.js app.

Corrections / Improvements Needed (2026 Context)

Next.js Version & Features
Assume Next.js 15+ (App Router stable, React 19 support, Turbopack dev, improved caching).
Metadata API is centralized and powerful: Use generateMetadata async function for dynamic pages (e.g., menu items).
OpenGraph images: Static files (opengraph-image.jpg/png in /app) or dynamic via generateMetadata + ImageResponse.
Core Web Vitals: Next.js 15+ defaults help (Image optimization, font subsets, streaming SSR), but explicit checks needed.

Accept.js Integration
Still uses v1 library (https://js.authorize.net/v1/Accept.js prod / jstest for sandbox).
In Next.js: Load via <Script> (strategy="beforeInteractive"), use Accept.dispatchData in client component.
Community wrappers like react-acceptjs exist but not necessary — plain JS works fine.

Scheduled Orders
Best practice: Store in overlay with trigger (cron/job) to move to tblSales at pickup time.
Add validation: Business hours check, cutoff times.

Minor Polish
Add PWA/manifest.json for better mobile feel.
Accessibility: Test with Lighthouse/WAVE.
Deployment: Vercel preferred for Next.js (edge functions, automatic perf).


Updated & Refined Milestone 3 Skill File
Here's a polished, 2026-accurate version ready to save as milestone-3-web.md:
Markdown---
name: milestone-3-web
description: Quality gate for Milestone 3 (Customer Web Ordering Platform). Ensures responsive Next.js (App Router) delivery with SEO optimization, scheduled orders via overlay table, upselling, and Accept.js payments.
color: blue
icon: globe
---

# Milestone 3: Customer Web Ordering Platform (Next.js)

**Goal**: Deliver a fast, SEO-friendly, responsive web app for browsing menu, cart, scheduling, and checkout — integrated with INI POS via backend APIs.

## Production-Ready Checklists

### 1. Web Excellence & SEO (Next.js 15+ App Router)
- [ ] **Metadata & SEO**: Dynamic `generateMetadata` or static `metadata` export on every page/route (title, description, canonical, keywords).  
  - OpenGraph/Twitter cards with images (static `opengraph-image.png` or dynamic via `ImageResponse`).
  - Structured data (JSON-LD) for menu items/products if applicable.
- [ ] **Responsive Design**: Verified across mobile (iOS Safari, Android Chrome), tablet, desktop (1920px+). Use Tailwind or CSS media queries.
- [ ] **Accessibility (WCAG AA)**: ARIA labels, semantic HTML (H1-H6 proper), keyboard nav, sufficient contrast (Lighthouse audit ≥90).
- [ ] **Performance & Core Web Vitals**: Lighthouse mobile score ≥90; LCP <2.5s, INP <200ms, CLS <0.1.  
  - Leverage Next.js Image, font optimization, streaming SSR, dynamic imports.

### 2. Specialized Features
- [ ] **Scheduled Orders**: Date/time picker with validation (business hours only, min lead time, no 3 AM slots).  
  - Store in `IntegrationService.ScheduledOrders` overlay table (not `tblSales` directly).  
  - Backend job/cron moves to `tblSales` (TransType=2) at scheduled time.
- [ ] **Upselling / Cross-Sell**: Rule-based modal (e.g., "Add a drink?" if no drinks in cart).  
  - Analyze cart categories server-side or client-side.
- [ ] **Banner Carousel**: Personalized (e.g., "Welcome back" for logged-in users via JWT/session).
- [ ] **Payments (Authorize.net)**: Accept.js client-side tokenization verified in sandbox.  
  - Load script: `https://js.authorize.net/v1/Accept.js` (prod) / `jstest...` (sandbox).  
  - `Accept.dispatchData` → nonce → backend charge → `PaymentResult.Success` before order creation.

### 3. Resilience & Security
- [ ] **Error Handling**: Custom branded 404/500 pages, global error boundary.
- [ ] **Session Auth**: JWT with refresh; secure cookies (`httpOnly`, `SameSite=Strict`).
- [ ] **Offline/Edge Cases**: Loading states, network error UI for menu/cart fetches.

## Technical Proof Points

### Scheduled Order Logic
**Critical**: Do **NOT** write future/scheduled orders directly to `tblSales` — POS may process/cook immediately.  
Use overlay table pattern:
```sql
-- IntegrationService.ScheduledOrders (example schema)
ID, CustomerID, PickupDateTime, CartJSON, Status ('pending', 'ready_to_sync'), CreatedAt

On submit: Insert to overlay + return confirmation.
Cron/job (e.g., every 5 min): Check PickupDateTime <= NOW() → create in tblSales (TransType=2) + payments if prepaid.

Cross-Sell / Upsell Example (TypeScript)
TypeScript// lib/upsell.ts
export function shouldShowDrinkUpsell(cart: CartItem[]): boolean {
  const hasDrink = cart.some(item => item.category === 'Drinks' || item.tags?.includes('beverage'));
  return !hasDrink && cart.length > 0;
}

// In Checkout component
if (shouldShowDrinkUpsell(cart.items)) {
  showModal('Add a refreshing drink?', recommendedDrinks);
}
Accept.js Snippet (Client Component)
tsx// components/PaymentForm.tsx
'use client';
import Script from 'next/script';

function PaymentForm({ onNonce }) {
  const handlePay = () => {
    window.Accept.dispatchData(
      {
        authData: { clientKey: process.env.NEXT_PUBLIC_AUTHNET_CLIENT_KEY, apiLoginID: process.env.NEXT_PUBLIC_AUTHNET_API_LOGIN },
        cardData: { /* form values */ }
      },
      response => {
        if (response.messages.resultCode === 'Ok') {
          onNonce(response.opaqueData.dataValue);
        }
      }
    );
  };

  return (
    <>
      <Script src={process.env.NODE_ENV === 'production' ? 'https://js.authorize.net/v1/Accept.js' : 'https://jstest.authorize.net/v1/Accept.js'} strategy="beforeInteractive" />
      {/* Card inputs + Pay button */}
    </>
  );
}
E2E Manual Test Scenarios





























ScenarioExpected ResultSchedule order for tomorrowStored in ScheduledOrders; NOT in tblSales until trigger time/job runs.Mobile browser checkoutPayment form modal responsive; no horizontal scroll; accepts sandbox card.Logged-in loyalty orderPoints increment in tblCustomer.EarnedPoints post-completion (like mobile).Invalid URL / 404Custom branded error page with navigation back to menu.SEO validationGoogle Lighthouse: Good CWV; view source shows proper <title>, <meta og:...>.
Delivery Artifacts

Build: .next folder (or next build output) as .tar.gz.
Deployment: Verified scripts/deploy-web.sh (e.g., Vercel CLI, rsync to server, or Docker).
Docs: README.md with:
Build/run commands
Required .env vars (e.g., NEXT_PUBLIC_AUTHNET_*, API base URL)
Lighthouse report screenshot/template


Milestone Sign-Off Gate: All checkboxes green + client-verified SEO (Google Search Console crawl), scheduled order deferral, and sandbox payment flow. Proceed to next milestone only after these.
Last Updated: March 17, 2026 – Aligned with Next.js 15+ App Router, Metadata API, modern Accept.js usage.
text
