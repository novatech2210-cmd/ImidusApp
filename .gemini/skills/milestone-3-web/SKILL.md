---
name: milestone-3-web
description: Quality gate for Milestone 3 (Customer Web Ordering). Ensures responsive Next.js delivery, scheduled orders, and SEO optimization.
---

# Milestone 3: Customer Web Ordering Platform

## Production-Ready Checklists

### 1. Web Excellence & SEO

- [ ] **SEO**: Metatags, OpenGraph images, and semantic HTML (H1-H6) on all pages.
- [ ] **Responsive**: Verified on iOS Safari, Android Chrome, and Desktop (1920px+).
- [ ] **Accessibility**: ARIA labels on all buttons/inputs; contrast ratios meet WCAG AA.
- [ ] **Performance**: Core Web Vitals (LCP < 2.5s) on mobile lighthouse test.

### 2. Specialized Features

- [ ] **Scheduled Orders**: Future pickup date/time picker with logic check (e.g., no pickup at 3 AM).
- [ ] **Upselling**: "Add a drink?" modal triggers based on cart category analysis.
- [ ] **Banner Carousel**: Segmented banners (e.g., "Welcome back" for existing users).
- [ ] **Payments**: Accept.js integration verified with sandbox credentials.

---

## Technical Proof points

### Scheduled Order Logic

Scheduled orders MUST NOT be written to `tblSales` immediately. They must go to the `ScheduledOrders` overlay table first.

> [!CAUTION]
> Writing future orders directly to POS may cause them to be cooked immediately. Use the overlay table.

### Cross-Sell Rule Engine

```typescript
// Example rule in web/imidus-ordering/lib/upsell.ts
if (cart.items.every((item) => item.category !== "Drinks")) {
  showUpsell("Drinks");
}
```

---

## E2E Test Scenarios (Manual)

| Scenario                | Expected Result                                                        |
| ----------------------- | ---------------------------------------------------------------------- |
| Schedule for Tomorrow   | Order appears in Web Profile but NOT in `tblSales` until trigger time. |
| Mobile Browser Checkout | Payment modal fits screen without horizontal scroll.                   |
| Loyalty Login           | Web orders increment points in `tblCustomer` just like mobile.         |
| 404/Error Pages         | Custom branded error pages for invalid URLs.                           |

---

## Delivery Artifacts

- **Web App**: `.next` build directory (transferred via `.tar.gz`).
- **Deployment**: Deployment script `scripts/deploy-web.sh` verified.
- **Documentation**: README with build instructions and env variable list.
