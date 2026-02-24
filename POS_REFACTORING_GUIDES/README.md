# TOAST POS Integration Refactoring Guide

## 🎯 Purpose

Your TOAST backend was built with **assumed table/column names** for the INI Restaurant POS database. Now that we have the **actual schema** from the `INI_Restaurant.Bak` backup, we need to update all POS integration code to match reality.

**Database:** TPPro (C:\TopPos\Data\TPPro.mdf)

---

## ⚠️ Critical Changes Required

### **Schema Differences**

| **Assumed Name** | **Actual Name** | **Impact Level** |
|------------------|-----------------|------------------|
| `Tickets` table | `tblSales` | 🔴 HIGH - All queries |
| `TicketItems` table | `tblSalesDetail` | 🔴 HIGH - All queries |
| `Tenders` table | `tblPayment` | 🔴 HIGH - All queries |
| `MenuItems` table | `tblItem` | 🔴 HIGH - All queries |
| Simple pricing | `tblAvailableSize` (multi-size pricing) | 🔴 CRITICAL - Architecture change |
| `TicketID` column | `ID` column | 🟡 MEDIUM - Naming |
| `ItemName` column | `IName` column | 🟡 MEDIUM - Naming |
| `Status` field | Multiple boolean flags | 🟡 MEDIUM - Logic change |

### **New Requirements**

1. **SIZE-BASED PRICING** 🔴 CRITICAL
   - Items have multiple sizes (Small/Medium/Large)
   - Each size has different price
   - Inventory tracked per (ItemID + SizeID)
   - Mobile app MUST collect size selection

2. **Tax Calculation** 🟡 MEDIUM
   - GST, PST, PST2 stored separately
   - Tax rates from `tblMisc` config table

3. **Kitchen Routing** 🟢 LOW (future)
   - Multiple kitchen printer flags (KitchenB, KitchenF, KitchenE, Kitchen5, Kitchen6)

---

## 📁 Files That Need Updates

### Backend (.NET 8)
```
backend/
├── IntegrationService.Core/
│   ├── Domain/
│   │   └── Entities/
│   │       └── PosEntities.cs           ← UPDATE (HIGH PRIORITY)
│   ├── Interfaces/
│   │   └── IPosRepository.cs            ← UPDATE (MEDIUM)
│   └── Services/
│       └── OrderProcessingService.cs    ← UPDATE (HIGH PRIORITY)
│
└── IntegrationService.Infrastructure/
    └── Data/
        └── PosRepository.cs             ← UPDATE (CRITICAL)
```

### Mobile (React Native)
```
mobile/
├── src/
│   ├── features/
│   │   └── menu/
│   │       ├── types.ts                 ← UPDATE (size types)
│   │       ├── MenuItemCard.tsx         ← UPDATE (show sizes)
│   │       └── ProductDetailScreen.tsx  ← UPDATE (size selector)
│   └── features/
│       └── cart/
│           ├── types.ts                 ← UPDATE (add sizeId)
│           └── cartSlice.ts             ← UPDATE (Redux state)
```

---

## 🚀 Implementation Order

Follow these guides **in order**:

### Phase 1: Backend Core (4-6 hours)
1. **[Entity Models Update](./01_ENTITY_MODELS.md)** ⭐ START HERE
   - Update all C# entity classes
   - Match real database schema
   - Add Size support

2. **[Repository SQL Queries](./02_REPOSITORY_QUERIES.md)** 🔴 CRITICAL
   - Rewrite all Dapper queries
   - Update table/column names
   - Add tblAvailableSize joins

3. **[Service Layer Updates](./03_SERVICE_LAYER.md)**
   - Update OrderProcessingService
   - Add tax calculation
   - Add size validation

### Phase 2: API Contract (2-3 hours)
4. **[API Contract Changes](./04_API_UPDATES.md)**
   - Update DTOs
   - Add size parameters
   - Update Swagger docs

### Phase 3: Mobile App (3-4 hours)
5. **[Mobile App Updates](./05_MOBILE_UPDATES.md)**
   - Add size selection UI
   - Update Redux state
   - Update API calls

### Phase 4: Testing (2-3 hours)
6. **[Testing & Verification](./06_TESTING.md)**
   - Database test scripts
   - Integration tests
   - End-to-end validation

---

## ⏱️ Time Estimate

| Phase | Tasks | Estimated Time |
|-------|-------|----------------|
| **Phase 1** | Backend entities, repository, services | 4-6 hours |
| **Phase 2** | API contract updates | 2-3 hours |
| **Phase 3** | Mobile app updates | 3-4 hours |
| **Phase 4** | Testing & verification | 2-3 hours |
| **TOTAL** | Complete refactoring | **11-16 hours** |

**Realistic timeline:** 2-3 working days

---

## ✅ Success Criteria

You'll know the refactoring is complete when:

✅ **Backend:**
- All entity models match real schema
- All SQL queries use correct table/column names
- Size parameter required for all item operations
- Tax calculation uses GST/PST/PST2 fields

✅ **API:**
- Menu endpoint returns items with sizes
- Order creation requires sizeId parameter
- Swagger documentation updated

✅ **Mobile:**
- Menu displays size options
- Product detail has size selector
- Cart stores sizeId for each item
- Checkout sends sizeId to API

✅ **Integration:**
- Can retrieve menu from real POS database
- Can create order that writes to tblSales
- Order items write to tblSalesDetail with correct SizeID
- Payment writes to tblPayment
- Verify in SQL Server Management Studio

---

## 🔍 Before You Start

### 1. Backup Current Code
```bash
cd /home/kali/Desktop/TOAST
git add .
git commit -m "Backup before POS schema refactoring"
git checkout -b feature/pos-schema-update
```

### 2. Set Up Test Database Connection
```csharp
// Test connection string to real POS database
"Server=localhost;Database=TPPro;User Id=sa;Password=YOUR_PASSWORD;TrustServerCertificate=True;"
```

### 3. Verify Database Access
```sql
-- Test query to verify you can read from real database
SELECT TOP 5
    i.ItemID,
    i.IName,
    a.SizeID,
    s.SizeName,
    a.UnitPrice
FROM tblItem i
INNER JOIN tblAvailableSize a ON i.ItemID = a.ItemID
INNER JOIN tblSize s ON a.SizeID = s.SizeID
WHERE i.Status = 1 AND i.OnlineItem = 1
```

---

## 📚 Reference Documents

- **[Database Schema Analysis](../DATABASE_SCHEMA.md)** - Complete schema documentation
- **[Original PROJECT_STATUS.md](../PROJECT_STATUS.md)** - Current project status

---

## 🆘 Troubleshooting

### "Can't connect to TPPro database"
**Solution:** Check SQL Server is running and credentials are correct:
```bash
sqlcmd -S localhost -U sa -P YOUR_PASSWORD -Q "SELECT DB_NAME()"
```

### "Table 'tblSales' not found"
**Solution:** Verify database name is TPPro (not TOAST or ToastDB):
```sql
USE TPPro;
GO
SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'tblSales';
```

### "Still seeing old column names in errors"
**Solution:** Make sure you've updated ALL references:
```bash
# Search for old column names
cd /home/kali/Desktop/TOAST/backend
grep -r "TicketID" .
grep -r "ItemName" .
grep -r "Tickets" . | grep -v "tblSales"
```

---

## 📞 Quick Links

- **[01 - Entity Models Update](./01_ENTITY_MODELS.md)** ⭐ Start here
- **[02 - Repository SQL Queries](./02_REPOSITORY_QUERIES.md)** 🔴 Critical
- **[03 - Service Layer Updates](./03_SERVICE_LAYER.md)**
- **[04 - API Contract Changes](./04_API_UPDATES.md)**
- **[05 - Mobile App Updates](./05_MOBILE_UPDATES.md)**
- **[06 - Testing & Verification](./06_TESTING.md)**

---

## 🚀 Ready to Start?

Open **[01_ENTITY_MODELS.md](./01_ENTITY_MODELS.md)** and begin updating your entity classes!

---

**Generated by Novatech** - Let's fix this integration! 💪
