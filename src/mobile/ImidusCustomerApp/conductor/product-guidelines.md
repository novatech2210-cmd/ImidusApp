# Product Guidelines - INI Restaurant POS Integration

## Voice and Tone

**Professional & approachable** — clear instructions, friendly phrasing. Action-oriented — verbs first. Consistent brand — IMIDUSAPP capitalization, Brand Blue (#1E5AA8) and Brand Gold (#D4AF37). Positive & supportive.

### Customer-Facing Text

- **Buttons/CTAs**: Short, action-first, clear (e.g., "Place Order", "Redeem Points", "Track Order")
- **Success Messages**: Positive, brief, friendly (e.g., "Your order is confirmed!", "50 points added to your account")
- **Errors/Warnings**: Constructive, actionable, polite (e.g., "Payment could not be processed. Try another card or check details.")
- **Notifications**: Immediate, friendly, branded with "IMIDUS |" prefix (e.g., "IMIDUS | Your table is ready.")
- **Informational**: Concise, readable, jargon-free (e.g., "Loyalty points expire in 7 days.")

### Admin Portal Text

- **Dashboard Metrics**: Neutral, factual (e.g., "Orders Pending: 12", "Sales Today: $1,230")
- **Controls**: Clear, instructional (e.g., "Enable menu item for online ordering")
- **Notifications**: Professional, informative (e.g., "Push campaign successfully sent to 450 customers")
- **Errors/Warnings**: Precise, actionable (e.g., "Database write failed. Retry or contact support.")

### Documentation

- Step-by-step instructions with numbered lists
- Screenshots or code snippets with brand-consistent labels/colors
- Neutral tone, avoid colloquialisms

## Design Principles

### 1. User-Centered

Interfaces prioritize real user goals and reduce cognitive load.

- **Customer flow**: browse menu → add to cart → checkout → track order → loyalty points
- **Admin flow**: view orders → run campaigns → manage menu overlay → analyze sales
- **Progressive disclosure**: true

### 2. Consistency & Branding

Visual and interaction consistency across platforms.

**Colors**:

- Primary: #1E5AA8 (Brand Blue)
- Accent: #D4AF37 (Brand Gold)
- Dark BG: #1A1A2E
- White: #FFFFFF
- Light Blue: #D6E4F7
- Light Gold: #FDF6E3
- Mid Gray: #DDDDDD
- Error: #C62828
- Success: #2E7D32
- Warning: #E65100

**Typography**:

- Body: System font (iOS/Android default)
- Wordmark: Georgia (IMIDUSAPP logo)
- Monospace: Courier New

### 3. Clarity & Readability

Text is plain, actionable, concise; visual hierarchy guides attention.

- **Highlight rules**:
  - Amount/points/CTA: Brand Gold
  - Headings/nav: Brand Blue
  - Secondary info: Dark Gray / Mid Gray

### 4. Efficiency & Learnability

Minimize steps; predictable patterns across mobile and web.

- Touch targets on mobile: enforced
- Predictable interactions: true
- Minimal steps (customer): 4
- Minimal steps (admin): 3

### 5. Safety & Reliability

Transactional safety and user confidence.

- Idempotency keys: true
- Concurrency checks: true
- Audit logging: true

### 6. Accessibility & Inclusivity

Legibility, color contrast, and touch accessibility.

- WCAG contrast: true
- Readable fonts: true
- Touch-friendly controls: true

### 7. Scalability & Maintainability

Modular components and backend overlay tables allow safe future expansion.

- Modular UI: true
- Overlay tables: CustomerProfile, MenuOverlay, MarketingRules, ScheduledOrders, tblPushNotifications

### 8. Data-Driven

UI reflects real-time POS and backend data safely.

- **Real-time display (customer)**: orders, loyalty points, order status
- **Real-time display (admin)**: orders, sales analytics, customer segmentation
- Read-only safety: true

## Branding Guidelines

- **App Name**: IMIDUSAPP
- **Primary Colors**: Brand Blue (#1E5AA8), Brand Gold (#D4AF37)
- **Typography**: System fonts for body, Georgia for wordmark, Courier New for monospace
- **Prefix Notifications**: "IMIDUS |"
- **Actionable Verbs First**: Enforced in all CTAs
- **No Slang/Humor**: Maintain professional tone
