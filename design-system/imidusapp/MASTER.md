# Design System Master File - IMIDUSAPP

> **LOGIC:** When building a specific page, first check `design-system/pages/[page-name].md`.
> If that file exists, its rules **override** this Master file.
> If not, strictly follow the rules below.

---

**Project:** IMIDUSAPP
**Generated:** 2026-03-13 13:11:28
**Category:** Enterprise Restaurant SaaS
**Positioning:** The Digital Growth Engine for Restaurants
**Tagline:** Order · Track · Earn
**Extended Marketing Line:** Seamless Ordering. Real-Time Sync. Unified Loyalty.

---

## Global Rules

### 1. Color Palette & Usage

| Role | Hex | CSS Variable | Notes |
|------|-----|--------------|-------|
| Brand Blue | `#1E5AA8` | `--color-brand-blue` | Primary UI color for headers, sidebars, backgrounds. |
| Brand Gold | `#D4AF37` | `--color-brand-gold` | **Accent only.** Prices, points, CTA highlights. **NEVER** full background. |
| App Background | `#F5F5F5` | `--color-app-bg` | L0 - Base application background. |
| Card Background | `#FFFFFF` | `--color-card-bg` | L1/L2 - Card and modal backgrounds. |
| Text (Dark) | `#1A202C` | `--color-text-dark` | For use on light backgrounds. |
| Text (Light) | `#FFFFFF` | `--color-text-light`| For use on dark backgrounds. |
| Success | `#2E7D32` | `--color-success` | Order status, confirmations. |
| Warning | `#E65100` | `--color-warning` | Pending status, reconnecting indicators. |
| Gray (Mid) | `#4A5568` | `--color-gray-mid` | Inactive tabs, secondary text. |

**Blue Depth Gradient:**
```css
.bg-blue-gradient {
  background-image: linear-gradient(135deg, #1E5AA8 0%, #174785 100%);
}
```
*   **Usage:** Splash background, primary headers, admin sidebar, hero banners.

**Gold Button Elevation:**
```css
.btn-gold {
  background-color: var(--color-brand-gold);
  box-shadow: 0 4px 14px rgba(212, 175, 55, 0.25);
}
```

### 2. UI Layering System (Elevation)

| Level | Usage | Background | Box Shadow |
|-------|-------|------------|------------|
| L0 | App Background | `var(--color-app-bg)` | `none` |
| L1 | Cards | `var(--color-card-bg)` | `0 2px 12px rgba(30,90,168,0.08)` <br> `(Hover: 0 4px 16px rgba(30,90,168,0.12))` |
| L2 | Elevated Modals | `var(--color-card-bg)` | `0 4px 24px rgba(30,90,168,0.16)` |
| L3 | Floating CTA | `var(--color-brand-blue)` | `0 4px 20px rgba(30,90,168,0.25)` <br> `(Hover: 0 8px 30px rgba(30,90,168,0.35))`


### 3. Typography

- **Headings:** System font, **Bold**, `letter-spacing: 0.3px`, `color: var(--color-brand-blue)`.
- **Body:** System font, regular weight.
- **Prices:** System font, **Bold**, `color: var(--color-brand-gold)`, `transform: [{ scale: 1.1 }]`.
- **Loyalty Points:** System font, 40px, `text-shadow: 0 2px 8px rgba(212,175,55,0.25)`.
- **Wordmark:** **Georgia**. Use *only* for display contexts (Splash, Marketing, Email Headers). **NEVER** in app UI.

### 4. Spacing

Use a consistent 8-point grid system.
| Token | Value |
|-------|-------|
| `--space-xs` | `4px` |
| `--space-sm` | `8px` |
| `--space-md` | `16px` |
| `--space-lg` | `24px` |
| `--space-xl` | `32px` |

---

## Component Specs & Interaction Patterns

### Real-Time Indicators
- **Connected:** Green pulsing dot. `background-color: var(--color-success)`.
- **Reconnecting:** Orange pulsing dot. `background-color: var(--color-warning)`.

### Order Status Badges
- **Style:** Rounded pill, bold uppercase text, icon + text.
- **Confirmed:** `background-color: rgba(46,125,50,0.12)`, `color: #2E7D32`.
- **Pending:** `background-color: rgba(230,81,0,0.12)`, `color: #E65100`.

### Mobile Floating Cart Button
- **Style:** Circular, anchored bottom-right.
- **Background:** `var(--color-brand-blue)` with L3 shadow.
- **Content:** Gold price (`--color-brand-gold`) inside.

### Mobile Category Tabs
- **Active:** Gold underline (`border-bottom: 2px solid var(--color-brand-gold)`).
- **Inactive:** Mid Gray text (`color: var(--color-gray-mid)`).

### Loyalty Card
- **Background:** `lighten(var(--color-brand-gold), 25%)`.
- **Border:** `2px solid var(--color-brand-gold)`.
- **Effect:** Subtle inner glow.

---

## Screen & Asset Modernization

### Splash Screen
1.  **Background:** Blue depth gradient (`.bg-blue-gradient`).
2.  **Center:** White logo + Tagline in `lighten(var(--color-brand-gold), 10%)`.
3.  **Bottom:** Animated loading bar using `var(--color-brand-gold)`.

### Admin Portal
- **Layout:** White cards (L1) on light gray background (L0).
- **Structure:** Brand Blue for structural elements only.
- **Sidebar:** Dark background (`#1A1A2E`), active item has a Gold left border (`border-left: 3px solid var(--color-brand-gold)`).
- **Charts:** Blue (`--color-brand-blue`) for revenue, Gold (`--color-brand-gold`) for loyalty growth.

### Email Template (BaseEmailTemplate.html)
1.  **Header:** Top banner with Blue gradient.
2.  **Body:** White card layout.
3.  **CTA:** Gold button with elevation.
4.  **Special Typography:** `Courier New` for Order ID, Transaction ID, Auth Code.

---

## Brand Voice & Cohesion

### Brand Voice
- **Tone:** Confident, Operational, Growth-focused.
- **Example (Order Ready):** "IMIDUS | Your order is ready for collection."
- **Example (Points Earned):** "You’ve earned 120 loyalty points."

### Cohesion Enforcement
- **Requirement:** Implement lint rules to enforce token usage.
- **Rule:** No raw hex color codes in application code.
- **Method:** All colors must be imported from a central theme file (e.g., `theme.js`, `styles/colors.scss`).

---

## Visual Benchmark
Aim to visually compete with **Toast, Square, Clover**.

---

## Pre-Delivery Checklist
- [ ] UI matches the elevation and layering system.
- [ ] Gold is used as an accent, not a primary fill.
- [ ] Typography rules are correctly applied.
- [ ] Interactive elements have appropriate feedback (hover, focus, real-time indicators).
- [ ] All colors are sourced from the defined CSS variables/theme tokens.
- [ ] Brand voice is consistent in all user-facing text.
- [ ] Responsive design tested on target devices.