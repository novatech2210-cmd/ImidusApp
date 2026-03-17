---
name: order-lifecycle
description: Activate when implementing order creation, order status updates, payment posting, or any feature that writes to tblSales, tblPendingOrders, tblSalesDetail, or tblPayment. Covers the exact multi-step POS ticket lifecycle with idempotency and concurrency rules.
---

# Order Lifecycle Skill

## Overview

Every online order follows a strict 5-step lifecycle that mirrors how the INI POS terminal creates orders internally. Deviation from this sequence will break POS synchronization.

```
Step 1 → INSERT tblSales          (TransType=2 "Open")
Step 2 → INSERT tblPendingOrders  (one row per line item — all 34 columns!)
Step 3 → INSERT tblPayment        (payment record with encrypted card)
Step 4 → UPDATE tblSales          (set totals + TransType=1 "Completed")
Step 5 → MOVE tblPendingOrders → tblSalesDetail  (POS kitchen completion)
         + INSERT tblSalesOfOnlineOrders (link back to online order)
```

---

## Idempotency (Contractual Requirement)

Before executing any write, check the idempotency key in the `IntegrationService` DB:

```csharp
// In OrdersController or service layer:
var existing = await _idempotencyRepo.GetAsync(idempotencyKey);
if (existing != null)
    return Ok(existing.ResponsePayload); // Return cached response

// After successful write:
await _idempotencyRepo.SaveAsync(idempotencyKey, responsePayload);
```

The idempotency key comes from the HTTP header `Idempotency-Key` on every POST/PUT.

---

## Concurrency Safety (Contractual Requirement)

Before completing/updating any ticket, re-read and assert its current state:

```csharp
var ticket = await _posRepo.GetTicketByIdAsync(salesId);
if (ticket == null) throw new InvalidOperationException($"Order {salesId} not found");
if (ticket.TransType != 2)
    throw new InvalidOperationException(
        $"Order {salesId} cannot be completed. Expected TransType=2, found {ticket.TransType}");
```

This read-then-assert pattern MUST happen inside the same SQL transaction.

---

## Step-by-Step Implementation

### Step 1: Create Open Ticket (tblSales)

```csharp
var ticket = new PosTicket
{
    SaleDateTime    = DateTime.Now,
    TransType       = 2,          // Open
    SubTotal        = 0,          // Set actual totals in Step 4
    DSCAmt          = 0,
    AlcoholDSCAmt   = 0,
    GSTAmt          = 0,
    PSTAmt          = 0,
    PST2Amt         = 0,
    GSTRate         = 0.05m,
    PSTRate         = 0.07m,
    PST2Rate        = 0m,
    CustomerID      = customerId, // null if guest
    CashierID       = 1,          // online cashier station ID
    TableID         = null,       // null for takeout
    StationID       = 1,          // online station ID
    Guests          = 1,
    TakeOutOrder    = true,
    DailyOrderNumber = await GetNextDailyOrderNumberAsync(),
    OnlineOrderCompanyID = 1      // our app's company ID
};

int salesId = await _posRepo.CreateOpenOrderAsync(ticket, transaction, customerName);
```

> `CreateOpenOrderAsync` also inserts into `tblSalesOfOnlineOrders` automatically.

### Step 2: Insert Pending Order Items (tblPendingOrders)

```csharp
foreach (var item in orderRequest.Items)
{
    var menuItem = await _posRepo.GetMenuItemByIdAsync(item.ItemId);
    var sizeInfo = await _posRepo.GetItemSizesAsync(item.ItemId);
    var size     = sizeInfo.FirstOrDefault(s => s.SizeID == item.SizeId);

    var pendingItem = new PendingOrderItem
    {
        SalesID            = salesId,
        ItemID             = item.ItemId,
        SizeID             = item.SizeId,
        Qty                = item.Quantity,
        UnitPrice          = size?.UnitPrice ?? 0,
        ItemName           = menuItem.IName,
        ItemName2          = menuItem.IName2 ?? "",
        SizeName           = size?.Size?.SizeName ?? "",
        Tastes             = "",
        SideDishes         = "",
        ApplyGST           = menuItem.ApplyGST,
        ApplyPST           = menuItem.ApplyPST,
        ApplyPST2          = menuItem.ApplyPST2,
        DSCAmt             = 0,
        KitchenB           = menuItem.KitchenB,
        KitchenF           = menuItem.KitchenF,
        KitchenE           = menuItem.KitchenE,
        PersonIndex        = 0,
        SeparateBillPrint  = false,
        Bar                = menuItem.Bar,
        ApplyNoDSC         = false,
        OpenItem           = false,
        ExtraChargeItem    = false,
        DSCAmtEmployee     = 0,
        DSCAmtType1        = 0,
        DSCAmtType2        = 0,
        Status             = 0,
        DayHourDiscountRate = 0,
        PricePerWeightUnit = 0
    };

    await _posRepo.InsertPendingOrderItemAsync(pendingItem, transaction);
}
```

### Step 3: Insert Payment (tblPayment)

```csharp
var payment = new PosTender
{
    SalesID         = salesId,
    PaymentTypeID   = GetPaymentTypeId(authNetResponse.CardType), // 3=Visa,4=MC,5=Amex
    Amount          = orderTotal,
    CardNumber      = authNetResponse.LastFour, // stored via dbo.EncryptString in SQL
    AuthCode        = authNetResponse.AuthCode,
    RefNum          = authNetResponse.TransactionId,
    PaymentDateTime = DateTime.Now
};

await _posRepo.InsertPaymentAsync(payment, transaction);
```

Payment type mapping helper:

```csharp
private static int GetPaymentTypeId(string cardType) => cardType.ToUpper() switch
{
    "VISA"       => 3,
    "MASTERCARD" => 4,
    "AMEX"       => 5,
    "DEBIT"      => 2,
    _            => 7   // fallback: Other Credit
};
```

### Step 4: Update Totals + Complete Ticket

```csharp
// Calculate taxes
decimal subTotal = orderRequest.Items.Sum(i => i.Quantity * i.UnitPrice);
decimal gstAmt   = subTotal * 0.05m;
decimal pstAmt   = subTotal * 0.07m;

await _posRepo.UpdateSaleTotalsAsync(salesId, subTotal, gstAmt, pstAmt, 0, 0, transaction);

// Re-validate concurrency, then transition TransType: 2 → 1
await _posRepo.CompleteOrderAsync(salesId, transaction);
```

### Step 5: CompleteOrderAsync (automatic)

`CompleteOrderAsync` internally:

1. Reads ticket and asserts `TransType=2`
2. Calls `UpdateSaleTransTypeAsync(salesId, 1, transaction)`
3. Calls `MovePendingOrdersToSalesDetailAsync(salesId, transaction)`

---

## Scheduled / Future Orders

For scheduled orders (Milestone 3, Phase 4):

- Store in `IntegrationService.ScheduledOrders` overlay table
- Background service `ScheduledOrderProcessorService` polls every minute
- When `ScheduledDateTime <= Now`, execute the same 5-step lifecycle above
- Use `ScheduledOrderRepository` for CRUD on scheduled orders

---

## Order Status Mapping (TransType → Customer-Facing Status)

```
TransType = 2  →  "Preparing"   (in kitchen)
TransType = 1  →  "Ready"       (completed by POS)
TransType = 0  →  "Refunded"
```

API endpoint for polling: `GET /api/orders/{salesId}/status`

---

## Key Repositories and Their Roles

| Repository                 | Purpose                                             |
| -------------------------- | --------------------------------------------------- |
| `PosRepository`            | All TPPro database reads/writes                     |
| `OrderRepository`          | Thin wrapper delegating to `PosRepository`          |
| `IdempotencyRepository`    | Idempotency key check/save in IntegrationService DB |
| `OrderNumberRepository`    | Atomic daily counter via `UPDATE...OUTPUT`          |
| `ScheduledOrderRepository` | Future order persistence in IntegrationService DB   |

---

## Error Handling Rules

- Wrap Steps 1–5 in a single `IDbTransaction`
- On any exception: `transaction.Rollback()` then re-throw
- Log `salesId` and `idempotencyKey` on every exception
- Do NOT swallow exceptions in repository methods — propagate to controller
- Return `409 Conflict` for idempotency key reuse with different payload
- Return `422 Unprocessable Entity` for concurrency failures (ticket already completed)
