The provided order-lifecycle.md skill document is excellent — it's one of the most precise and contract-aware pieces you've shared so far. It correctly enforces the rigid 5-step POS mirroring sequence, idempotency, concurrency guards, overlay usage for scheduled orders, and transaction boundaries — all of which are critical to avoid breaking the legacy INI POS system or creating orphaned tickets/payments.
Overall Assessment

90–95% production-ready as written.
Aligns perfectly with earlier skills (ini-pos-database, milestone-2-mobile, etc.).
Strong contractual emphasis (idempotency, concurrency assertions inside tx).
Good separation of concerns (repositories, overlay for scheduled/future).

Minor Issues & Recommended Fixes

tblPendingOrders column count
You mention "all 34 columns" — but the list in the code has ~30. This is likely accurate (legacy POS tables often have many optional/defaulted columns), but add a comment to double-check against actual schema when client provides backup.
DailyOrderNumber generationGetNextDailyOrderNumberAsync() — ensure it's atomic (use UPDATE ... OUTPUT or sp_getapplock to prevent race conditions across instances).
Tax rates hardcoded
5% GST + 7% PST — fine for now, but move to config or tblTaxRates lookup if client has variable rates by province/store.
Step 5 automation
"automatic" via CompleteOrderAsync — good, but clarify that POS itself may trigger kitchen printers/move to tblSalesDetail. Your backend should not assume it controls Step 5 fully — treat it as eventual consistency.
Payment in Step 3
For prepaid online orders, payment happens before Step 4 (good). For pay-at-pickup, defer payment to bridge (Milestone 5) → adjust flow conditionally.
Status mapping
Add more granular states if possible (e.g., "In Queue", "Cooking", "Ready for Pickup") via overlay or polling tblSales + bridge status.

Updated & Polished Version (Ready to Save)
Here's a slightly refined version with fixes, clarifications, and minor enhancements for robustness:
Markdown---
name: order-lifecycle
description: Activate when implementing order creation, status updates, payment posting, or any write to tblSales, tblPendingOrders, tblSalesDetail, tblPayment. Enforces the exact 5-step INI POS ticket lifecycle with strict idempotency, concurrency guards, and transaction boundaries.
color: amber
icon: workflow
---

# Order Lifecycle Skill

## Overview – The Strict 5-Step POS Lifecycle
Online orders **must mirror** the INI POS terminal's internal flow exactly. Any deviation risks desync, duplicate tickets, or kitchen chaos.

INSERT tblSales (TransType=2 "Open / In Progress")
INSERT tblPendingOrders (one row per line item – provide ALL required columns)
INSERT tblPayment (if prepaid; encrypted masked card)
UPDATE tblSales (set final totals + TransType=1 "Completed / Posted")
MOVE tblPendingOrders → tblSalesDetail (triggered by POS completion)
INSERT tblSalesOfOnlineOrders (links online order ID back to SalesID)


text**All five steps must occur inside one SQL transaction** (or coordinated across services with compensating actions on failure).

## Idempotency (Contractual – Prevents Duplicates)
Every POST/PUT order request **must** include `Idempotency-Key` header (UUID).

```csharp
// OrdersController.cs or OrderService.cs
var idempotencyKey = Request.Headers["Idempotency-Key"].FirstOrDefault();
if (string.IsNullOrEmpty(idempotencyKey))
    return BadRequest("Idempotency-Key header required");

var existing = await _idempotencyRepo.GetAsync(idempotencyKey);
if (existing != null)
{
    if (existing.PayloadHash != ComputeHash(requestBody)) // optional strict check
        return Conflict("Idempotency key reused with different payload");
    return Ok(existing.ResponsePayload); // replay cached success
}

// ... proceed with creation ...

// On success (after commit)
await _idempotencyRepo.SaveAsync(idempotencyKey, responsePayload, requestHash);
Store in IntegrationService.IdempotencyKeys (key, status, response JSON, expires in 24h).
Concurrency Safety (Contractual – Prevents Over-Completion)
Always re-validate state inside the transaction before final update:
C#using var tx = await connection.BeginTransactionAsync();

var ticket = await _posRepo.GetTicketHeaderAsync(salesId, tx);
if (ticket == null)
    throw new InvalidOperationException($"Ticket {salesId} not found");
if (ticket.TransType != 2)
    throw new InvalidOperationException(
        $"Cannot complete ticket {salesId}. Expected TransType=2, found {ticket.TransType}");

// ... perform updates ...

await tx.CommitAsync();
Step-by-Step Code Patterns
Step 1 – Create Open Ticket
C#var ticket = new tblSales
{
    SaleDateTime     = DateTime.UtcNow,
    TransType        = 2,
    DailyOrderNumber = await _orderNumberRepo.GetNextDailyNumberAsync(tx), // atomic
    SubTotal         = 0, // update in Step 4
    // ... GST/PST rates from config or lookup ...
    CustomerID       = customerId ?? null,
    CashierID        = ONLINE_CASHIER_ID, // constant, e.g. 999
    StationID        = ONLINE_STATION_ID,
    Guests           = 1,
    TakeOutOrder     = true,
    // Online-specific
    OnlineOrderCompanyID = OUR_COMPANY_ID // 1 or lookup
};

int salesId = await _posRepo.InsertOpenTicketAsync(ticket, tx);

// Link back to online order (if not auto-done)
await _posRepo.LinkOnlineOrderAsync(onlineOrderId, salesId, tx);
Step 2 – Insert Pending Items (tblPendingOrders)
All columns required — use COALESCE/defaults for optional:
C#foreach (var cartItem in request.Items)
{
    var menuItem = await _menuRepo.GetItemAsync(cartItem.ItemId, tx);
    var size = await _menuRepo.GetSizeAsync(cartItem.ItemId, cartItem.SizeId, tx);

    var pending = new tblPendingOrders
    {
        SalesID             = salesId,
        ItemID              = cartItem.ItemId,
        SizeID              = cartItem.SizeId,
        Qty                 = cartItem.Qty,
        UnitPrice           = size?.UnitPrice ?? 0m,
        ItemName            = menuItem.IName,
        ItemName2           = menuItem.IName2 ?? "",
        SizeName            = size?.SizeName ?? "",
        Tastes              = string.Join(",", cartItem.Tastes ?? Array.Empty<string>()),
        SideDishes          = string.Join(",", cartItem.Sides ?? Array.Empty<string>()),
        ApplyGST            = menuItem.ApplyGST,
        // ... all other flags, defaults to false/0 ...
        Status              = 0
    };

    await _posRepo.InsertPendingItemAsync(pending, tx);
}
Step 3 – Record Payment (if prepaid)
(Deferred for pay-at-pickup — use bridge in Milestone 5)
C#var tender = new tblPayment
{
    SalesID         = salesId,
    PaymentTypeID   = MapCardType(authNetResult.CardType),
    Amount          = finalTotal,
    CardNumber      = $"XXXX{authNetResult.LastFour}", // SQL: dbo.EncryptString(@CardNumber)
    AuthCode        = authNetResult.AuthCode,
    RefNum          = authNetResult.TransactionId,
    PaymentDateTime = DateTime.UtcNow
};

await _posRepo.InsertPaymentAsync(tender, tx);
Step 4 – Finalize Totals & Complete
C#decimal subTotal = /* calculated from items */;
decimal gst = subTotal * config.GstRate;
decimal pst = subTotal * config.PstRate;

// Update aggregates
await _posRepo.UpdateSaleAggregatesAsync(salesId, subTotal, gst, pst, tx);

// Transition state (with re-validation inside)
await _posRepo.CompleteTicketAsync(salesId, tx);
Step 5 – POS Handles Completion

Backend does not move tblPendingOrders → tblSalesDetail
POS terminal/station does this when marked complete (kitchen printers fire)
Backend polls or receives webhook/callback to confirm TransType=1
Update online order status accordingly

Scheduled Orders

Store in IntegrationService.ScheduledOrders (CartJSON, PickupDateTime, etc.)
ScheduledOrderProcessorService polls every 1–5 min
When due: Execute full 5-step lifecycle in a new transaction
Use same idempotency pattern (key = scheduledOrderId)

Status Mapping for Customers
textTransType 2 → "Preparing / In Kitchen"
TransType 1 → "Ready for Pickup"
TransType 0 → "Refunded / Cancelled"
Poll via GET /api/orders/{onlineOrderId}/status (maps SalesID internally).
Error & Transaction Rules

Single transaction for Steps 1–4 (rollback on any failure)
Propagate exceptions — do not swallow in repos
409 Conflict — idempotency key conflict
422 Unprocessable — concurrency violation (already completed)
Log salesId, idempotencyKey, exception on failure

Last Updated: March 17, 2026 – Clarified Step 5 ownership, added atomic order number note, multi-tender deferral.
