# Milestone 2 Master: Customer Mobile Apps (iOS & Android)

**Budget:** $1,800  
**Timeline:** End of Week 4 (Recovery Phase)

## Objective

Develop production-ready iOS and Android apps with a seamless order flow (menu → cart → checkout). Ensure orders are securely inserted into POS ticket tables with full status synchronization and tokenized payment processing.

## 🛠️ Mobile App Features (iOS & Android)

- **Authentication**: Guest Checkout, User Registration, and Social Login (Google/Apple).
- **Menu Experience**: Item Search, Favorites, and Modifier/Customization support.
- **Ordering**: ASAP vs Scheduled pickup/delivery times, Special Instructions.
- **Payments**: Saved cards, Apple Pay (iOS), and Google Pay (Android) via Authorize.net tokenization.
- **Tracking**: Real-time status updates and Firebase push notifications.

## 🛡️ Safety Protocols (Backend Integration)

- **Idempotency**: Unique Idempotency Key checks for all write operations.
- **Concurrency**: Ticket State Re-validation (reading before writing) to prevent race conditions.

## ✅ Milestone 2 Deliverables

- [/] iOS & Android App Development (React Native)
- [/] UI/UX & Order Flow (Menu → Cart → Checkout)
- [x] Order Insertion into POS Ticket Tables
- [x] Authorize.net Tokenized Payments (Partial/Full)
- [/] Real-time Status Synchronization
- [x] Safety Protocols (Idempotency & Concurrency)
