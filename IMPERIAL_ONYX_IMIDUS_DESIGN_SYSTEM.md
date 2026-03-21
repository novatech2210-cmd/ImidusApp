# Imperial Onyx × IMIDUS: Design System Document
*Version 2.0 - Enhanced with UI/UX Pro Max Guidelines*

---

## 1. Overview & Creative North Star

**Creative North Star: The Sovereign Merchant**

Imperial Onyx × IMIDUS is a luxury design system built for high-end restaurant commerce. It rejects standard "SaaS dashboard" aesthetics in favor of a premium brand experience that communicates authority, sophistication, and culinary excellence.

**Core Principles:**
- **Authoritative Navy Foundations** - Deep, confident backgrounds
- **Gold-Accented Luxury** - Strategic shimmer for premium features
- **Hyper-Condensed Typography** - Extreme tracking creates editorial precision
- **Intentional White Space** - Breathing room conveys premium quality
- **High-Contrast Layering** - Tonal depth guides the eye

**Target Experience:**
- Mobile-first ordering that feels like a luxury magazine
- Admin portal with executive dashboard authority
- Web ordering with editorial sophistication

---

## 2. Color System

### Primary Palette

```css
/* IMIDUS × Imperial Onyx Colors */
:root {
  /* Primary - Brand Blue (Authority) */
  --color-primary: #1E5AA8;           /* Brand Blue */
  --color-primary-dark: #0A1F3D;      /* Midnight Navy */
  --color-primary-light: #2E6AB8;     /* Light Blue */

  /* Secondary - Imperial Gold (Luxury) */
  --color-gold: #D4AF37;              /* Imperial Gold */
  --color-gold-light: #E8C55B;        /* Soft Gold */
  --color-gold-dark: #B8941F;         /* Rich Gold */

  /* Neutrals - Editorial Depth */
  --color-dark: #1A1A2E;              /* Dark Background */
  --color-slate-900: #0F172A;         /* Text Primary */
  --color-slate-600: #475569;         /* Text Muted */
  --color-white: #FFFFFF;             /* Surface */

  /* Light Mode Surfaces */
  --surface: #FFFFFF;
  --surface-container-low: #F5F5F5;   /* Secondary modules */
  --surface-container: #E5E5E5;       /* Input backgrounds */
  --surface-container-highest: #DDDDDD; /* Preview states */

  /* Dark Mode Surfaces */
  --surface-dark: #1A1A2E;
  --surface-dark-container: #252537;
  --surface-dark-elevated: #2F2F45;

  /* Functional Colors */
  --color-success: #2E7D32;           /* Order confirmed */
  --color-error: #C62828;             /* Payment failed */
  --color-warning: #E65100;           /* Pending status */
}
```

### Color Usage Rules

#### The "No-Line" Rule
**Principle:** Sectioning through color blocks, not borders.

✅ **DO:**
- Use `--surface-container-low` for secondary dashboard modules
- Use background shifts (Surface Container tiers) for hierarchy
- Use 1px borders ONLY at 10% opacity for internal input grouping

❌ **DON'T:**
- Add 1px borders to separate sections
- Use hard divider lines between cards
- Create "box" feeling with borders

#### Glass & Gradient Rule
**Glassmorphism for Navigation:**

```css
/* Floating Navigation Bar */
.navbar-glass {
  background: rgba(255, 255, 255, 0.80);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 8px 32px rgba(30, 90, 168, 0.12);
}

/* Dark Mode Glass */
.navbar-glass-dark {
  background: rgba(26, 26, 46, 0.85);
  backdrop-filter: blur(24px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}
```

**⚠️ Performance Note:** Use `will-change: backdrop-filter` sparingly, only on persistent elements.

#### Signature Textures: Blue Container

```css
/* Hero Section - Solid Primary with Internal Borders */
.hero-blue-container {
  background: var(--color-primary);
  border: 10px solid rgba(255, 255, 255, 0.1);
  color: var(--color-white);
}
```

### Contrast Compliance

**WCAG AA Compliance (4.5:1 minimum):**

| Combination | Ratio | Status |
|-------------|-------|--------|
| #0F172A (slate-900) on #FFFFFF | 17.9:1 | ✅ AAA |
| #475569 (slate-600) on #FFFFFF | 7.3:1 | ✅ AA |
| #D4AF37 (gold) on #FFFFFF | 3.8:1 | ⚠️ Large text only |
| #D4AF37 (gold) on #0F172A | 4.6:1 | ✅ AA |
| #1E5AA8 (brand blue) on #FFFFFF | 5.2:1 | ✅ AA |

**⚠️ Critical Rule:** Never use Gold text on white backgrounds for body copy. Use slate-900 for text, Gold for prices/accents only.

---

## 3. Typography System

### Font Stack

```css
/* Primary: Montserrat (Geometric Modern-Classic) */
@import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700;800;900&display=swap');

/* Fallback: Plus Jakarta Sans */
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap');

/* System Fallback */
:root {
  --font-primary: 'Montserrat', 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif;
  --font-mono: 'Courier New', 'Courier', monospace;
}
```

### Type Scale

```css
/* Display - Impact Numbers & Hero Headlines */
.text-display {
  font-size: 3rem;        /* 48px */
  font-weight: 900;       /* Black */
  letter-spacing: -0.05em;
  line-height: 1.1;
  color: var(--color-slate-900);
}

/* Headline - Section Titles */
.text-headline {
  font-size: 1.5rem;      /* 24px */
  font-weight: 700;       /* Bold */
  letter-spacing: -0.02em;
  line-height: 1.3;
  color: var(--color-primary);
}

/* Title - Card Headers */
.text-title {
  font-size: 1.125rem;    /* 18px */
  font-weight: 600;       /* Semibold */
  letter-spacing: -0.01em;
  line-height: 1.4;
}

/* Body - Readable Content */
.text-body {
  font-size: 0.875rem;    /* 14px */
  font-weight: 500;       /* Medium */
  letter-spacing: 0;
  line-height: 1.625;     /* leading-relaxed */
  color: var(--color-slate-900);
  max-width: 65ch;        /* Optimal line length */
}

/* Label - Form Labels & Tags */
.text-label {
  font-size: 0.75rem;     /* 12px */
  font-weight: 600;       /* Semibold */
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--color-slate-600);
}

/* Micro-Label - The Signature */
.text-micro {
  font-size: 0.6875rem;   /* 11px */
  font-weight: 700;       /* Bold */
  letter-spacing: 0.25rem; /* Extreme tracking */
  text-transform: uppercase;
  color: var(--color-slate-600);
}

/* Price - Gold Emphasis */
.text-price {
  font-size: 1.25rem;     /* 20px */
  font-weight: 700;
  letter-spacing: -0.02em;
  color: var(--color-gold);
}
```

### Typography Rules

✅ **DO:**
- Use extreme letter spacing (0.2rem - 0.25rem) for labels under 12px
- Mix font weights (Black + Light) within same headline for visual tension
- Use `-0.05em` tracking for Display sizes to prevent letterspacing gaps
- Limit body text to 65-75 characters per line (`max-w-prose`)
- Use `leading-relaxed` (1.625) for body text readability

❌ **DON'T:**
- Use hard black (#000000) for text - always use slate-900 (#0F172A)
- Use standard blue for links - use Navy or Gold
- Set body text smaller than 14px (0.875rem)
- Use Gold for body text on white (fails contrast)

### Font Loading Strategy

```html
<!-- Preload critical fonts -->
<link rel="preload" href="/fonts/montserrat-bold.woff2" as="font" type="font/woff2" crossorigin>

<!-- Font display swap to prevent FOIT -->
<style>
  @font-face {
    font-family: 'Montserrat';
    font-display: swap;
    src: url('/fonts/montserrat-bold.woff2') format('woff2');
  }
</style>
```

---

## 4. Elevation & Depth

### The Layering Principle

**Concept:** Use dark containers (#0A1F3D) to anchor the eye, surrounded by high-elevation white surfaces.

### Ambient Shadow System

```css
/* Elevation Scale - Soft Studio Lighting */
:root {
  --elevation-1: 0 1px 3px rgba(30, 90, 168, 0.08);
  --elevation-2: 0 4px 6px rgba(30, 90, 168, 0.10);
  --elevation-3: 0 10px 20px rgba(30, 90, 168, 0.12);
  --elevation-4: 0 20px 40px rgba(30, 90, 168, 0.15);

  /* Brand Blue Tint in Shadows */
  --shadow-sm: var(--elevation-1);
  --shadow-md: var(--elevation-2);
  --shadow-xl: var(--elevation-3);
  --shadow-2xl: var(--elevation-4);
}

/* Interactive Card - Standard */
.card {
  box-shadow: var(--shadow-sm);
  transition: box-shadow 200ms ease;
}

.card:hover {
  box-shadow: var(--shadow-md);
}

/* Primary CTA Button - High Elevation */
.btn-primary {
  box-shadow: var(--shadow-xl);
}

/* Floating Navigation - Highest Elevation */
.nav-persistent {
  box-shadow: var(--shadow-2xl);
}

/* Modal Overlay */
.modal {
  box-shadow: 0 25px 50px rgba(15, 23, 42, 0.25);
}
```

### Z-Index Scale

```css
/* Organized Z-Index Hierarchy */
:root {
  --z-base: 0;
  --z-dropdown: 10;
  --z-sticky: 20;
  --z-overlay: 30;
  --z-modal: 40;
  --z-toast: 50;
}
```

### Glassmorphism Implementation

```css
/* Floating Header - Content Ghosts Through */
.header-glass {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: var(--z-sticky);

  background: rgba(255, 255, 255, 0.80);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);

  border-bottom: 1px solid rgba(30, 90, 168, 0.10);
  box-shadow: var(--shadow-2xl);

  /* Performance Optimization */
  will-change: backdrop-filter;
  transform: translateZ(0);
}

/* Mobile Navigation - Dark Glass */
.mobile-nav-glass {
  background: rgba(26, 26, 46, 0.85);
  backdrop-filter: blur(24px);
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

/* Respect Motion Preferences */
@media (prefers-reduced-motion: reduce) {
  .header-glass {
    backdrop-filter: none;
    background: rgba(255, 255, 255, 0.95);
  }
}
```

**⚠️ Performance Warning:**
- Blur is GPU-intensive - limit to 3-4 elements max
- Test on low-end Android devices
- Provide fallback without blur for older browsers

---

## 5. Component Library

### 5.1 Buttons

```css
/* Primary Button - Solid Navy Authority */
.btn-primary {
  background: var(--color-primary);
  color: var(--color-white);

  padding: 12px 32px;
  border-radius: 8px;

  font-size: 0.875rem;
  font-weight: 700;
  letter-spacing: 0.25rem;
  text-transform: uppercase;

  box-shadow: var(--shadow-xl);
  transition: all 200ms ease;

  cursor: pointer;

  /* Touch Target: 44px minimum */
  min-height: 44px;
  min-width: 44px;
}

.btn-primary:hover {
  background: var(--color-primary-light);
  box-shadow: var(--shadow-2xl);
  transform: translateY(-2px);
}

.btn-primary:active {
  transform: translateY(0);
}

/* Secondary Button - Gold Shimmer */
.btn-secondary {
  background: linear-gradient(135deg, var(--color-gold) 0%, var(--color-gold-light) 100%);
  color: var(--color-dark);

  padding: 12px 32px;
  border-radius: 8px;

  font-size: 0.875rem;
  font-weight: 700;
  letter-spacing: 0.25rem;
  text-transform: uppercase;

  box-shadow: var(--shadow-md);
  transition: all 200ms ease;

  cursor: pointer;
  min-height: 44px;
}

/* Loading State */
.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  pointer-events: none;
}
```

### 5.2 Cards

```css
/* Standard Card - White Surface */
.card {
  background: var(--surface);
  border-radius: 16px;
  padding: 24px;
  box-shadow: var(--shadow-sm);
  transition: box-shadow 200ms ease;
}

.card:hover {
  box-shadow: var(--shadow-md);
  cursor: pointer;
}

/* Audience Metric Card - Navy Anchor */
.card-metric {
  background: var(--color-primary);
  color: var(--color-white);
  border-radius: 16px;
  padding: 24px;
  box-shadow: var(--shadow-xl);
}

/* Unselected State - Low Container */
.card-unselected {
  background: var(--surface-container-low);
  border-radius: 16px;
  padding: 24px;
  opacity: 0.7;
  transition: all 200ms ease;
}
```

### 5.3 Inputs

```css
/* Borderless Input - Surface Container */
.input {
  background: var(--surface-container);
  border: none;
  border-radius: 8px;

  padding: 12px 16px;

  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-slate-900);

  transition: all 200ms ease;

  /* Focus State */
  outline: none;
}

.input:focus {
  background: var(--surface);
  box-shadow: 0 0 0 3px rgba(30, 90, 168, 0.2);
}

/* Message Editor - Larger Area */
.textarea {
  background: var(--surface-container);
  border: none;
  border-radius: 12px;

  padding: 16px;
  min-height: 120px;

  font-size: 0.875rem;
  line-height: 1.625;

  resize: vertical;
}

/* Form Label - Micro Typography */
.label {
  display: block;
  margin-bottom: 8px;

  font-size: 0.6875rem;
  font-weight: 700;
  letter-spacing: 0.25rem;
  text-transform: uppercase;
  color: var(--color-slate-600);
}
```

### 5.4 Progress Indicators

```css
/* Minimalist Progress Bar */
.progress-bar {
  width: 100%;
  height: 4px;
  background: var(--surface-container);
  border-radius: 2px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: var(--color-primary);
  transition: width 300ms ease;
}

/* Step Indicator */
.step-indicator {
  display: flex;
  gap: 8px;
}

.step {
  width: 32px;
  height: 4px;
  background: #E5E5E5;
  border-radius: 2px;
  transition: background 200ms ease;
}

.step.active {
  background: var(--color-primary);
}

.step.complete {
  background: var(--color-gold);
}
```

### 5.5 Phone Frame Preview

```css
/* Phone Frame - Grounded in Reality */
.phone-frame {
  position: relative;
  width: 375px;
  height: 812px;

  background: #1A1A2E;
  border-radius: 40px;
  padding: 12px;

  box-shadow:
    0 0 0 2px #333,
    0 50px 100px rgba(15, 23, 42, 0.4);
}

.phone-screen {
  width: 100%;
  height: 100%;
  background: white;
  border-radius: 32px;
  overflow: hidden;
}

/* Notch */
.phone-notch {
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);

  width: 120px;
  height: 24px;
  background: #1A1A2E;
  border-radius: 0 0 16px 16px;
}
```

---

## 6. Layout Patterns

### 6.1 Floating Navigation

```html
<!-- Desktop Navigation -->
<nav class="fixed top-4 left-4 right-4 z-20
            bg-white/80 backdrop-blur-xl
            rounded-2xl px-6 py-4
            shadow-2xl border border-white/20">
  <div class="flex items-center justify-between max-w-7xl mx-auto">
    <div class="text-2xl font-black tracking-tight">IMIDUS</div>
    <div class="flex gap-8">
      <a href="#" class="text-sm font-semibold tracking-wide uppercase
                         hover:text-gold transition-colors cursor-pointer">
        Menu
      </a>
      <a href="#" class="text-sm font-semibold tracking-wide uppercase
                         hover:text-gold transition-colors cursor-pointer">
        Orders
      </a>
    </div>
  </div>
</nav>

<!-- Account for navbar height -->
<main class="pt-24">
  <!-- Content -->
</main>
```

### 6.2 Hero Section - Blue Container

```html
<section class="relative min-h-screen
                bg-primary
                border-[10px] border-white/10
                flex items-center justify-center
                text-white">
  <div class="max-w-4xl mx-auto px-6 text-center">
    <h1 class="text-6xl font-black tracking-tight mb-4">
      Order · Track · Earn
    </h1>
    <p class="text-xl font-light tracking-wide opacity-90 mb-8">
      Seamless Ordering. Real-Time Sync. Unified Loyalty.
    </p>
    <button class="btn-secondary">
      Download App
    </button>
  </div>
</section>
```

### 6.3 Dashboard Grid

```html
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  <!-- Metric Card -->
  <div class="card-metric">
    <div class="text-micro mb-2">Active Customers</div>
    <div class="text-display">1,247</div>
    <div class="text-sm font-light opacity-80">+12% from last week</div>
  </div>

  <!-- Standard Card -->
  <div class="card">
    <div class="text-label mb-3">Recent Orders</div>
    <!-- Order list -->
  </div>
</div>
```

---

## 7. Responsive Design

### Breakpoints

```css
/* Mobile First Approach */
:root {
  --breakpoint-sm: 640px;
  --breakpoint-md: 768px;
  --breakpoint-lg: 1024px;
  --breakpoint-xl: 1440px;
}

/* Responsive Testing Sizes */
/* Test at: 375, 414, 768, 1024, 1440 */
```

### Touch Targets

```css
/* CRITICAL: Minimum 44x44px Touch Targets */
.touchable {
  min-height: 44px;
  min-width: 44px;

  /* Minimum 8px gap between adjacent targets */
  margin: 4px;
}

/* Example: Mobile Menu Items */
.mobile-menu-item {
  display: flex;
  align-items: center;
  gap: 12px;

  padding: 12px 16px;
  min-height: 56px;

  font-size: 1rem;
  font-weight: 600;

  cursor: pointer;
  transition: background 200ms ease;
}
```

### Responsive Typography

```css
/* Fluid Typography */
.text-display {
  font-size: clamp(2rem, 5vw, 3rem);
}

.text-headline {
  font-size: clamp(1.25rem, 3vw, 1.5rem);
}

/* Mobile Optimization */
@media (max-width: 768px) {
  .text-micro {
    letter-spacing: 0.15rem; /* Reduce extreme tracking on mobile */
  }

  body {
    font-size: 16px; /* Minimum for mobile readability */
  }
}
```

---

## 8. Accessibility Guidelines

### 8.1 Color Contrast

✅ **Compliant Combinations:**
- Slate-900 (#0F172A) on White - 17.9:1 (AAA)
- Brand Blue (#1E5AA8) on White - 5.2:1 (AA)
- Gold (#D4AF37) on Navy (#0F172A) - 4.6:1 (AA)

❌ **Non-Compliant (Avoid):**
- Gold (#D4AF37) on White - 3.8:1 (Fails AA for small text)
- Slate-400 on White - Use slate-600 minimum

### 8.2 Focus States

```css
/* Visible Focus Ring */
*:focus-visible {
  outline: 3px solid var(--color-gold);
  outline-offset: 2px;
}

/* Button Focus */
.btn:focus-visible {
  outline: 3px solid var(--color-gold);
  outline-offset: 4px;
}
```

### 8.3 Screen Reader Support

```html
<!-- Icon-only Button -->
<button aria-label="Close menu" class="btn-icon">
  <svg aria-hidden="true">...</svg>
</button>

<!-- Decorative Images -->
<img src="pattern.png" alt="" role="presentation">

<!-- Meaningful Images -->
<img src="menu-item.jpg" alt="Grilled salmon with asparagus and lemon">
```

### 8.4 Keyboard Navigation

```css
/* Tab Order Follows Visual Order */
.nav-menu {
  display: flex;
  flex-direction: column; /* Matches tab order */
}

/* Skip to Main Content */
.skip-link {
  position: absolute;
  top: -40px;
  left: 0;
  background: var(--color-primary);
  color: white;
  padding: 8px 16px;
  text-decoration: none;
  z-index: 100;
}

.skip-link:focus {
  top: 0;
}
```

### 8.5 Motion Preferences

```css
/* Respect Reduced Motion */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }

  .header-glass {
    backdrop-filter: none;
    background: rgba(255, 255, 255, 0.95);
  }
}
```

---

## 9. Animation Guidelines

### Duration & Timing

```css
/* Micro-Interactions: 150-300ms */
.btn {
  transition: all 200ms ease;
}

/* Morphing Elements: 400-600ms */
.card-expand {
  transition: all 500ms cubic-bezier(0.4, 0.0, 0.2, 1);
}

/* Page Transitions: 300ms */
.page-transition {
  transition: opacity 300ms ease-in-out;
}
```

### Loading States

```html
<!-- Skeleton Screen -->
<div class="animate-pulse">
  <div class="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
  <div class="h-4 bg-gray-200 rounded w-1/2"></div>
</div>

<!-- Button Loading -->
<button class="btn-primary" disabled>
  <svg class="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
    <!-- Spinner icon -->
  </svg>
  Processing...
</button>
```

### Hover Effects

```css
/* Smooth Color Shift - No Layout Shift */
.card-interactive {
  transition:
    background-color 200ms ease,
    box-shadow 200ms ease;
}

.card-interactive:hover {
  background: var(--surface-container-low);
  box-shadow: var(--shadow-md);
}

/* ❌ AVOID: Scale transforms cause layout shift */
.card-bad:hover {
  transform: scale(1.05); /* Shifts adjacent elements */
}
```

---

## 10. Implementation Checklist

### Pre-Delivery Verification

#### Visual Quality
- [ ] No emojis used as icons (use Heroicons/Lucide SVG)
- [ ] All icons from consistent set (24x24 viewBox)
- [ ] Brand logos verified (use official assets)
- [ ] Hover states don't cause layout shift
- [ ] Gold used for prices/accents only, not body text

#### Interaction
- [ ] All clickable elements have `cursor-pointer`
- [ ] Hover states provide clear visual feedback
- [ ] Transitions are 150-300ms (checked with DevTools)
- [ ] Focus states visible for keyboard navigation
- [ ] Touch targets minimum 44x44px

#### Light/Dark Mode
- [ ] Light mode text contrast 4.5:1 minimum (checked with tool)
- [ ] Glass elements visible in light mode (80%+ opacity)
- [ ] Borders visible in both modes
- [ ] Tested both modes before delivery

#### Layout & Responsive
- [ ] Floating elements have proper spacing from edges (1rem minimum)
- [ ] No content hidden behind fixed navbars
- [ ] Responsive at 375px, 768px, 1024px, 1440px (tested)
- [ ] No horizontal scroll on mobile
- [ ] Consistent max-width (`max-w-6xl` or `max-w-7xl`)

#### Accessibility
- [ ] All images have alt text (or `alt=""` for decorative)
- [ ] Form inputs have labels (or `aria-label`)
- [ ] Color not the only indicator (use icons + color)
- [ ] `prefers-reduced-motion` respected
- [ ] Keyboard navigation works (tab through entire page)
- [ ] Screen reader tested (basic flow)

#### Performance
- [ ] Blur effects limited to 3-4 elements max
- [ ] Images optimized (WebP, lazy loading)
- [ ] Fonts preloaded (`font-display: swap`)
- [ ] No layout shift during font loading

---

## 11. Tech Stack Integration

### React Native (Mobile)

```typescript
// Theme Colors
export const Colors = {
  primary: '#1E5AA8',
  primaryDark: '#0A1F3D',
  gold: '#D4AF37',
  goldLight: '#E8C55B',
  dark: '#1A1A2E',
  white: '#FFFFFF',
  slate900: '#0F172A',
  slate600: '#475569',
};

// Typography
export const Typography = {
  display: {
    fontSize: 48,
    fontWeight: '900',
    letterSpacing: -2.4,
    lineHeight: 52,
  },
  headline: {
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: -0.5,
    lineHeight: 32,
  },
  body: {
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: 0,
    lineHeight: 22,
  },
  micro: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2.75,
    textTransform: 'uppercase',
  },
};

// Shadows (iOS)
export const Shadows = {
  sm: {
    shadowColor: '#1E5AA8',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
  },
  xl: {
    shadowColor: '#1E5AA8',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
  },
};
```

### Tailwind CSS (Web)

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: '#1E5AA8',
        'primary-dark': '#0A1F3D',
        'primary-light': '#2E6AB8',
        gold: '#D4AF37',
        'gold-light': '#E8C55B',
        'gold-dark': '#B8941F',
        dark: '#1A1A2E',
      },
      fontFamily: {
        sans: ['Montserrat', 'Plus Jakarta Sans', 'system-ui', 'sans-serif'],
        mono: ['Courier New', 'monospace'],
      },
      letterSpacing: {
        micro: '0.25rem',
        extreme: '0.3rem',
      },
      boxShadow: {
        'elevation-1': '0 1px 3px rgba(30, 90, 168, 0.08)',
        'elevation-2': '0 4px 6px rgba(30, 90, 168, 0.10)',
        'elevation-3': '0 10px 20px rgba(30, 90, 168, 0.12)',
        'elevation-4': '0 20px 40px rgba(30, 90, 168, 0.15)',
      },
      backdropBlur: {
        glass: '24px',
      },
    },
  },
};
```

### Next.js (Admin Portal)

```typescript
// app/globals.css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --color-primary: #1E5AA8;
    --color-gold: #D4AF37;
    --surface: #FFFFFF;
    --elevation-xl: 0 10px 20px rgba(30, 90, 168, 0.12);
  }

  body {
    @apply bg-white text-slate-900 font-sans;
    font-size: 16px; /* Base for accessibility */
  }
}

@layer components {
  .btn-primary {
    @apply bg-primary text-white
           px-8 py-3 rounded-lg
           text-sm font-bold tracking-micro uppercase
           shadow-elevation-3
           transition-all duration-200
           hover:bg-primary-light hover:shadow-elevation-4 hover:-translate-y-0.5
           active:translate-y-0
           cursor-pointer
           min-h-[44px];
  }

  .card {
    @apply bg-white rounded-2xl p-6
           shadow-elevation-1
           transition-shadow duration-200
           hover:shadow-elevation-2
           cursor-pointer;
  }
}
```

---

## 12. Common Mistakes to Avoid

### ❌ What NOT to Do

| Issue | Wrong | Correct |
|-------|-------|---------|
| **Emoji Icons** | Use 🎨 🚀 ⚙️ | Use Heroicons/Lucide SVG |
| **Hover Layout Shift** | `hover:scale-105` | `hover:shadow-lg` + color |
| **Low Contrast** | Gold text on white | Gold on navy / Slate-900 on white |
| **Hard Borders** | `border border-gray-300` | Background color shift |
| **Tiny Touch Targets** | `w-6 h-6` button | `min-h-[44px] min-w-[44px]` |
| **No Cursor Feedback** | No cursor style | `cursor-pointer` on clickables |
| **Extreme Blur** | 10+ blur elements | Max 3-4 glass elements |
| **Hardcoded Z-Index** | Random z-index values | Use scale: 10, 20, 30, 40, 50 |
| **Body Text Too Small** | 12px body text | 14px minimum (16px on mobile) |
| **Extreme Tracking Everywhere** | All text 0.25rem | Only micro-labels (< 12px) |

---

## 13. Design Tokens (CSS Variables)

```css
/* Complete Token System */
:root {
  /* Colors */
  --primary: #1E5AA8;
  --primary-dark: #0A1F3D;
  --primary-light: #2E6AB8;
  --gold: #D4AF37;
  --gold-light: #E8C55B;
  --gold-dark: #B8941F;
  --dark: #1A1A2E;
  --white: #FFFFFF;
  --slate-900: #0F172A;
  --slate-600: #475569;

  /* Surfaces */
  --surface: #FFFFFF;
  --surface-container-low: #F5F5F5;
  --surface-container: #E5E5E5;
  --surface-container-highest: #DDDDDD;

  /* Typography */
  --font-primary: 'Montserrat', 'Plus Jakarta Sans', system-ui, sans-serif;
  --font-mono: 'Courier New', 'Courier', monospace;

  --text-display: 3rem;
  --text-headline: 1.5rem;
  --text-title: 1.125rem;
  --text-body: 0.875rem;
  --text-label: 0.75rem;
  --text-micro: 0.6875rem;

  --tracking-micro: 0.25rem;
  --tracking-extreme: 0.3rem;

  /* Spacing */
  --space-xs: 4px;
  --space-sm: 8px;
  --space-md: 16px;
  --space-lg: 24px;
  --space-xl: 32px;
  --space-2xl: 48px;

  /* Elevation */
  --elevation-1: 0 1px 3px rgba(30, 90, 168, 0.08);
  --elevation-2: 0 4px 6px rgba(30, 90, 168, 0.10);
  --elevation-3: 0 10px 20px rgba(30, 90, 168, 0.12);
  --elevation-4: 0 20px 40px rgba(30, 90, 168, 0.15);

  /* Radius */
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 16px;
  --radius-xl: 24px;

  /* Z-Index */
  --z-base: 0;
  --z-dropdown: 10;
  --z-sticky: 20;
  --z-overlay: 30;
  --z-modal: 40;
  --z-toast: 50;

  /* Transitions */
  --transition-fast: 150ms ease;
  --transition-base: 200ms ease;
  --transition-slow: 300ms ease;
  --transition-morph: 500ms cubic-bezier(0.4, 0.0, 0.2, 1);
}
```

---

## 14. Testing Protocol

### Visual Regression Testing
1. Test at breakpoints: 375px, 768px, 1024px, 1440px
2. Test light + dark mode
3. Test with slow network (blur fallback)
4. Test on iOS Safari + Android Chrome

### Accessibility Testing
1. Run axe DevTools scan
2. Test keyboard navigation (tab through entire flow)
3. Test with screen reader (basic flow)
4. Verify contrast ratios with WebAIM tool

### Performance Testing
1. Lighthouse score: 90+ Performance, 100 Accessibility
2. Test blur on low-end Android (< 2GB RAM)
3. Check font loading (no FOIT/FOUT)
4. Verify no layout shift (CLS < 0.1)

---

## 15. Version History

**v2.0** (Current) - Enhanced with UI/UX Pro Max Guidelines
- Added WCAG AA contrast compliance
- Touch target sizing (44x44px minimum)
- Performance optimizations for glassmorphism
- Accessibility enhancements
- Comprehensive implementation checklist

**v1.0** - Original Imperial Onyx System
- Core color palette
- Typography scale
- Elevation system
- Component library

---

## 16. Quick Reference Card

```plaintext
╔══════════════════════════════════════════════════════════════╗
║           IMPERIAL ONYX × IMIDUS QUICK REFERENCE             ║
╠══════════════════════════════════════════════════════════════╣
║ COLORS                                                       ║
║  Primary: #1E5AA8   Gold: #D4AF37   Dark: #1A1A2E          ║
║  Text: #0F172A (slate-900)  Muted: #475569 (slate-600)     ║
║                                                              ║
║ TYPOGRAPHY                                                   ║
║  Display: 48px / 900 / -0.05em                              ║
║  Headline: 24px / 700 / -0.02em                             ║
║  Body: 14px / 500 / 0 / 1.625 leading                       ║
║  Micro: 11px / 700 / 0.25rem / UPPERCASE                    ║
║                                                              ║
║ SHADOWS                                                      ║
║  Card: var(--elevation-1)   Button: var(--elevation-3)      ║
║  Modal: var(--elevation-4)  Glass: 24px blur                ║
║                                                              ║
║ RULES                                                        ║
║  ✓ Touch targets: 44x44px minimum                           ║
║  ✓ Contrast: 4.5:1 minimum (WCAG AA)                        ║
║  ✓ Tracking: 0.25rem for labels < 12px                      ║
║  ✓ Transitions: 150-300ms                                   ║
║  ✗ No emoji icons (use SVG)                                 ║
║  ✗ No borders for sections (use color blocks)               ║
║  ✗ No gold text on white (fails contrast)                   ║
╚══════════════════════════════════════════════════════════════╝
```

---

**Document Version:** 2.0
**Last Updated:** March 21, 2026
**Maintained By:** Novatech Build Team
**For:** IMIDUS Technologies - POS Integration Platform
