---
name: milestone-2-mobile
description: Quality gate for Milestone 2 (Customer Mobile Apps). Ensures production-ready iOS & Android delivery, including Auth.net integration, loyalty sync, and push notifications.
---

# Milestone 2: Customer Mobile Apps (iOS/Android)

## Production-Ready Checklists

### 1. UI/UX Consistency

- [ ] Gold+Blue branding applied (Imidus Palette).
- [ ] No hardcoded strings (use localization files).
- [ ] Splash screens and app icons verified for all densities.
- [ ] Empty states (no orders, no points) are branded and helpful.

### 2. Core Functional Requirements

- [ ] **Menu**: Real-time fetch from `tblItem` + `tblAvailableSize`.
- [ ] **Cart**: Persistent cart across app restarts.
- [ ] **Auth.net**: Tokenization-only flow via Accept In-App SDK.
- [ ] **Loyalty**: Live balance from `tblCustomer.EarnedPoints`.
- [ ] **Push**: Token registration on first launch/login.

### 3. Resilience & Performance

- [ ] **Offline Handling**: Graceful error UI when network is lost.
- [ ] **API Timeouts**: 30s timeout on all POS-touching requests.
- [ ] **Image Optimization**: Use progressive loading for menu images.
- [ ] **Session Security**: JWT refresh token logic implemented.

---

## Technical Proof points

### Auth.net Verification

Mobile payments MUST return a `PaymentResult` with `Success=true` before Step 1 of the Order Lifecycle is initiated.

> [!IMPORTANT]
> Never pass raw card data to the backend. The mobile app MUST handle tokenization.

### Push Notification Payload

Ensure `notification` (alert) and `data` (order payload) are both present in every message.

```json
{
  "to": "DEVICE_TOKEN",
  "notification": { "title": "Order Ready", "body": "Your order is ready!" },
  "data": { "orderId": "123", "type": "ORDER_STATUS" }
}
```

---

## E2E Test Scenarios (Manual)

| Scenario           | Expected Result                                               |
| ------------------ | ------------------------------------------------------------- |
| First Login        | JWT stored, FCM token registered in `IntegrationService`.     |
| Place Order (Visa) | `tblSales` created (TransType 2), `tblPayment` record exists. |
| Refresh Loyalty    | Points match `tblPointsDetail` balance exactly.               |
| Order Notification | Tapping notification opens Order Detail screen.               |

---

## Delivery Artifacts

- **iOS**: `.ipa` signed with Production Distribution Profile.
- **Android**: `.apk` or `.aab` (App Bundle).
- **Source**: Clean `src/mobile/ImidusCustomerApp` directory with `.env.example`.
