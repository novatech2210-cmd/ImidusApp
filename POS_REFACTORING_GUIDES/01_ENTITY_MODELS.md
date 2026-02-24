# Step 1: Entity Models Update

## 🎯 Goal
Update all C# entity classes to match the real INI Restaurant POS database schema.

**File:** `backend/IntegrationService.Core/Domain/Entities/PosEntities.cs`

**Estimated time:** 30-45 minutes

---

## 📝 Changes Required

### Summary of Updates

| Entity Class | Changes | Priority |
|--------------|---------|----------|
| `PosTicket` | Rename 12+ properties, add tax fields | 🔴 CRITICAL |
| `PosTicketItem` | Rename properties, add SizeID, add kitchen flags | 🔴 CRITICAL |
| `PosTender` | Rename properties, update payment type | 🔴 CRITICAL |
| `MenuItem` | Rename properties, remove BasePrice | 🔴 CRITICAL |
| `AvailableSize` | **NEW CLASS** - Size-based pricing | 🔴 CRITICAL |
| `Size` | **NEW CLASS** - Size definitions | 🟡 MEDIUM |
| `Category` | Update property names | 🟢 LOW |

---

## 🔄 Complete Updated Code

Replace the entire `PosEntities.cs` file with this:

```csharp
using System;
using System.Collections.Generic;

namespace IntegrationService.Core.Domain.Entities
{
    /// <summary>
    /// Maps to tblSales - Main transaction/order table
    /// </summary>
    public class PosTicket
    {
        // Primary Key
        public int ID { get; set; }

        // Transaction Details
        public DateTime SaleDateTime { get; set; }
        public int TransType { get; set; }  // 0=Sale, 1=Refund, 2=Void
        public int DailyOrderNumber { get; set; }  // User-facing order number

        // Financial Fields
        public decimal SubTotal { get; set; }
        public decimal DSCAmt { get; set; }  // Discount Amount
        public decimal GSTAmt { get; set; }  // Goods & Services Tax
        public decimal PSTAmt { get; set; }  // Provincial Sales Tax
        public decimal PST2Amt { get; set; } // Additional Tax

        // Calculated Property
        public decimal TotalAmount => SubTotal + GSTAmt + PSTAmt + PST2Amt - DSCAmt;

        // Foreign Keys
        public int? CustomerID { get; set; }
        public int? CashierID { get; set; }
        public int? TableID { get; set; }

        // Order Metadata
        public int Guests { get; set; }
        public bool TakeOutOrder { get; set; }

        // Navigation Properties
        public List<PosTicketItem> Items { get; set; } = new();
        public List<PosTender> Payments { get; set; } = new();
        public PosCustomer? Customer { get; set; }
    }

    /// <summary>
    /// Maps to tblSalesDetail - Line items for orders
    /// </summary>
    public class PosTicketItem
    {
        // Primary Key
        public int ID { get; set; }

        // Foreign Keys
        public int SalesID { get; set; }  // Links to tblSales.ID
        public int ItemID { get; set; }   // Links to tblItem.ItemID
        public int SizeID { get; set; }   // Links to tblSize.SizeID (REQUIRED)

        // Item Details (denormalized for speed)
        public string ItemName { get; set; } = string.Empty;
        public string SizeName { get; set; } = string.Empty;

        // Pricing & Quantity
        public decimal Quantity { get; set; }
        public decimal UnitPrice { get; set; }
        public decimal DSCAmt { get; set; }  // Line-item discount

        // Calculated Property
        public decimal LineTotal => (Quantity * UnitPrice) - DSCAmt;

        // Tax Application Flags
        public bool ApplyGST { get; set; }
        public bool ApplyPST { get; set; }
        public bool ApplyPST2 { get; set; }

        // Kitchen Routing Flags
        public bool KitchenB { get; set; }  // Back kitchen
        public bool KitchenF { get; set; }  // Front kitchen
        public bool KitchenE { get; set; }  // Kitchen E
        public bool Kitchen5 { get; set; }
        public bool Kitchen6 { get; set; }

        // Split Bill Support
        public byte PersonIndex { get; set; }  // For split bills (1-based)

        // Special Flags
        public bool OpenItem { get; set; }  // Price-entry item

        // Navigation Properties
        public MenuItem? Item { get; set; }
        public Size? Size { get; set; }
    }

    /// <summary>
    /// Maps to tblPayment - Payment tenders
    /// </summary>
    public class PosTender
    {
        // Primary Key
        public int ID { get; set; }

        // Foreign Key
        public int SalesID { get; set; }  // Links to tblSales.ID

        // Payment Details
        public byte PaymentTypeID { get; set; }  // See PaymentType enum below
        public decimal PaidAmount { get; set; }
        public decimal TipAmount { get; set; }

        // Credit Card Fields
        public string? AuthorizationNo { get; set; }  // From Authorize.net
        public string? BatchNo { get; set; }

        // Status
        public bool Voided { get; set; }

        // Audit
        public DateTime CreatedDate { get; set; }
    }

    /// <summary>
    /// Payment Type ID mapping
    /// Based on tblPayment.PaymentTypeID values
    /// </summary>
    public enum PaymentType : byte
    {
        Cash = 1,
        Debit = 2,
        Visa = 3,
        MasterCard = 4,
        Amex = 5,
        Coupon = 6,
        Discover = 7,
        JCB = 8,
        GiftCard = 9,
        RewardPoints = 10,
        ChargeOnAccount = 11,
        AllCredit = 255  // Aggregate
    }

    /// <summary>
    /// Maps to tblItem - Menu items
    /// </summary>
    public class MenuItem
    {
        // Primary Key
        public short ItemID { get; set; }  // smallint in database

        // Item Names
        public string IName { get; set; } = string.Empty;  // Display name
        public string? IName2 { get; set; }  // Kitchen name (alternate)

        // Description & Images
        public string? ItemDescription { get; set; }
        public string? ImageFilePath { get; set; }
        public byte[]? ItemImage { get; set; }  // BLOB storage
        public string? ItemImageFileType { get; set; }  // e.g., "jpg", "png"

        // Categorization
        public byte CategoryID { get; set; }

        // Status & Availability
        public bool Status { get; set; }  // 1=Active, 0=Inactive
        public bool OnlineItem { get; set; }  // Available for online orders

        // Item Type Flags
        public bool Alcohol { get; set; }
        public bool NonAlcohol { get; set; }
        public bool ScaleItem { get; set; }  // Sold by weight
        public bool OpenItem { get; set; }   // Price entry required
        public bool HourlyChargedItem { get; set; }
        public bool SideDish { get; set; }
        public bool GroupItem { get; set; }
        public bool RewardItem { get; set; }

        // Kitchen Routing (default for all sizes)
        public bool KitchenB { get; set; }
        public bool KitchenF { get; set; }
        public bool KitchenE { get; set; }
        public bool Kitchen5 { get; set; }
        public bool Kitchen6 { get; set; }
        public bool Bar { get; set; }

        // Inventory
        public bool ManageInv { get; set; }  // Track inventory

        // Modifiers
        public bool Taste { get; set; }  // Has taste modifiers (spicy, etc.)

        // Other
        public string? BarCode { get; set; }

        // Navigation Properties
        public Category? Category { get; set; }
        public List<AvailableSize> AvailableSizes { get; set; } = new();
    }

    /// <summary>
    /// Maps to tblAvailableSize - Price and inventory per item size
    /// CRITICAL: This is where pricing and stock are stored!
    /// </summary>
    public class AvailableSize
    {
        // Composite Primary Key (ItemID, SizeID)
        public short ItemID { get; set; }
        public short SizeID { get; set; }

        // Pricing
        public decimal UnitPrice { get; set; }
        public decimal? UnitPrice2 { get; set; }  // Alternate pricing tier
        public decimal? UnitPrice3 { get; set; }  // Alternate pricing tier

        // Inventory
        public int? OnHandQty { get; set; }  // NULL = unlimited stock, 0+ = tracked quantity

        // Discount Rules
        public bool ApplyNoDSC { get; set; }  // Don't apply discounts to this size

        // Navigation Properties
        public MenuItem? Item { get; set; }
        public Size? Size { get; set; }

        // Calculated Property
        public bool InStock => OnHandQty == null || OnHandQty > 0;
    }

    /// <summary>
    /// Maps to tblSize - Size definitions (Small, Medium, Large, etc.)
    /// </summary>
    public class Size
    {
        // Primary Key
        public short SizeID { get; set; }

        // Size Names
        public string SizeName { get; set; } = string.Empty;  // "Small", "Medium", "Large"
        public string? ShortName { get; set; }  // "S", "M", "L"

        // Display Order
        public byte DisplayOrder { get; set; }  // For sorting (1, 2, 3...)
    }

    /// <summary>
    /// Maps to tblCategory - Menu item categories
    /// </summary>
    public class Category
    {
        // Primary Key
        public byte CategoryID { get; set; }

        // Category Name
        public string CName { get; set; } = string.Empty;

        // Display
        public int PrintOrder { get; set; }
        public bool Status { get; set; }  // 1=Active, 0=Inactive

        // Navigation
        public List<MenuItem> Items { get; set; } = new();
    }

    /// <summary>
    /// Maps to tblCustomer - Customer database
    /// </summary>
    public class PosCustomer
    {
        // Primary Key
        public int ID { get; set; }

        // Name & Contact
        public string? FName { get; set; }
        public string? LName { get; set; }
        public string? Phone { get; set; }
        public string? Email { get; set; }
        public string? Address { get; set; }

        // Unique Identifier
        public string? CustomerNum { get; set; }

        // Loyalty/Rewards
        public int EarnedPoints { get; set; }
        public bool PointsManaged { get; set; }

        // Demographics
        public char? Gender { get; set; }  // 'M', 'F', 'O'

        // Calculated Properties
        public string FullName => $"{FName} {LName}".Trim();
    }

    /// <summary>
    /// Maps to tblTable - Table/Order tracking
    /// </summary>
    public class PosTable
    {
        // Primary Key
        public int ID { get; set; }

        // Table Name
        public string TableName { get; set; } = string.Empty;

        // Order Type Flags
        public bool TakeOut { get; set; }
        public bool Delivery { get; set; }
        public bool Online { get; set; }

        // Status Flags
        public bool Opened { get; set; }
        public bool BillPrinted { get; set; }
        public bool StayOn { get; set; }

        // Order Number
        public int DailyOrdNum { get; set; }
        public int BellNumber { get; set; }

        // Station/Platform
        public int StationID { get; set; }
        public int? OnlineOrderCompanyID { get; set; }  // DoorDash, UberEats, etc.

        // Security
        public bool AccessPermissionRequired { get; set; }

        // Pricing Tier
        public byte AppliedUnitPriceType { get; set; }
    }
}
```

---

## ✅ What Changed?

### PosTicket (tblSales)
```csharp
// BEFORE
public int TicketID { get; set; }
public DateTime CreatedDate { get; set; }
public decimal TotalAmount { get; set; }
public string Status { get; set; }

// AFTER
public int ID { get; set; }
public DateTime SaleDateTime { get; set; }
public decimal SubTotal { get; set; }
public decimal GSTAmt { get; set; }
public decimal PSTAmt { get; set; }
public decimal PST2Amt { get; set; }
public decimal DSCAmt { get; set; }
public decimal TotalAmount => SubTotal + GSTAmt + PSTAmt + PST2Amt - DSCAmt; // Calculated
public int TransType { get; set; }  // NEW
public int DailyOrderNumber { get; set; }  // NEW
```

### PosTicketItem (tblSalesDetail)
```csharp
// BEFORE
public int TicketItemID { get; set; }
public int TicketID { get; set; }
public int MenuItemId { get; set; }

// AFTER
public int ID { get; set; }
public int SalesID { get; set; }
public int ItemID { get; set; }
public int SizeID { get; set; }  // ← CRITICAL: NOW REQUIRED
public string ItemName { get; set; }  // Denormalized
public string SizeName { get; set; }  // Denormalized
public bool KitchenB { get; set; }  // Kitchen routing
public bool KitchenF { get; set; }
// ... more kitchen flags
```

### MenuItem (tblItem)
```csharp
// BEFORE
public int MenuItemId { get; set; }
public string ItemName { get; set; }
public decimal BasePrice { get; set; }  // ← REMOVED!

// AFTER
public short ItemID { get; set; }  // smallint
public string IName { get; set; }
public List<AvailableSize> AvailableSizes { get; set; }  // ← PRICING MOVED HERE
public bool OnlineItem { get; set; }  // NEW
public bool ManageInv { get; set; }  // NEW
```

### NEW: AvailableSize
```csharp
// CRITICAL NEW CLASS
public class AvailableSize
{
    public short ItemID { get; set; }
    public short SizeID { get; set; }
    public decimal UnitPrice { get; set; }  // ← PRICE IS HERE NOW
    public int? OnHandQty { get; set; }     // ← STOCK IS HERE NOW
    public bool InStock => OnHandQty == null || OnHandQty > 0;
}
```

---

## 🧪 Testing the Changes

After updating `PosEntities.cs`:

### 1. Build the Project
```bash
cd /home/kali/Desktop/TOAST/backend
dotnet build
```

**Expected:** Should compile with NO errors (but Repository/Service may have errors until we update those next)

### 2. Check for Compilation Errors
```bash
dotnet build 2>&1 | grep error
```

**Common errors at this stage:**
- Repository methods still using old property names (fix in Step 2)
- Service layer still using old property names (fix in Step 3)

---

## ⚠️ Breaking Changes

These changes **will break** existing code in:

- ❌ `PosRepository.cs` - SQL queries use old names
- ❌ `OrderProcessingService.cs` - References old properties
- ❌ API Controllers - DTOs may reference old names
- ❌ Mobile app - API responses will change structure

**This is expected!** We'll fix these in the next steps.

---

## 📝 Migration Checklist

- [ ] Backup original `PosEntities.cs`
- [ ] Replace file with updated code above
- [ ] Run `dotnet build` to check for syntax errors
- [ ] Make note of any compiler errors (we'll fix in next steps)
- [ ] Commit changes: `git add . && git commit -m "Update POS entities to match real schema"`

---

## 🚀 Next Step

Once entities are updated and code compiles (even with warnings), proceed to:

**[Step 2: Repository SQL Queries Update →](./02_REPOSITORY_QUERIES.md)**

---

**Generated by Novatech** 🚀
