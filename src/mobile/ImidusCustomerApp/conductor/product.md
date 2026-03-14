# Product Definition - INI Restaurant POS Integration

## Project Name

**INI Restaurant POS Integration**

## Project Description

A full-stack restaurant platform for IMIDUS Technologies that integrates with a legacy INI POS (Point of Sale) system using direct SQL Server database integration. It includes React Native mobile apps, Next.js web ordering and admin portals, and a .NET 8 backend integration service that bridges modern applications with the INI_Restaurant POS database (source of truth).

## Problem Statement

The restaurant currently runs everything through the INI POS terminal at the counter. There's no online ordering, no mobile app, no web presence for taking orders. This platform enables:

- Customers to order from their phones or the web
- Orders to appear directly in the POS system as if placed at the terminal
- Payments via Authorize.net that post back to POS system tickets
- Restaurant owner to manage orders, run marketing campaigns, and view analytics
- Loyalty points to work across in-store and online channels

## Target Users

1. **Customers** using the mobile app and web ordering platform to browse menus, place orders, pay online, and earn loyalty points
2. **Restaurant owners/managers** using the admin portal to manage orders, run marketing campaigns, view analytics, and control online menu availability
3. **POS operators** using the existing INI POS terminal who receive online orders as regular tickets and process them normally

## Key Goals

1. Enable customers to place orders from mobile apps and a web platform, with those orders automatically appearing in the existing INI POS system as normal POS tickets
2. Build a secure backend integration service that bridges modern applications (mobile, web, admin portal) with the legacy INI_Restaurant SQL Server database without modifying the POS database schema or POS application
3. Provide restaurant management tools (admin portal) for order monitoring, customer engagement, marketing campaigns, and loyalty programs while keeping the INI_Restaurant database as the single source of truth
