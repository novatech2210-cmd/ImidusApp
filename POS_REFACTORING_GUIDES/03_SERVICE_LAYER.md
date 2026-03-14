# Step 3: Service Layer Updates

## 🎯 Goal
Update the OrderProcessingService to handle size-based pricing, tax calculation, and new database schema.

**File:** `backend/IntegrationService.Core/Services/OrderProcessingService.cs`

**Estimated time:** 1-2 hours

---

## 🔴 CRITICAL CHANGES

### What's Different:

1. **Size is now REQUIRED** for every order item
2. **Tax calculation** needs GST/PST/PST2 breakdown
3. **Daily order number** generation
4. **Stock validation** per (ItemID + SizeID)
5. **Item/Size name lookup** for denormalization

---

## 📝 Updated Service Class

Replace your `OrderProcessingService.cs` with this:

```csharp
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using IntegrationService.Core.Domain.Entities;
using IntegrationService.Core.Interfaces;
using Microsoft.Extensions.Logging;

namespace IntegrationService.Core.Services
{
    public class OrderProcessingService : IOrderProcessingService
    {
        private readonly IPosRepository _posRepo;
        private readonly ILogger<OrderProcessingService> _logger;

        public OrderProcessingService(
            IPosRepository posRepository,
            ILogger<OrderProcessingService> logger)
        {
            _posRepo = posRepository ?? throw new ArgumentNullException(nameof(posRepository));
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        }

        /// <summary>
        /// Create a new order in the POS system
        /// </summary>
        public async Task<OrderResult> CreateOrderAsync(CreateOrderRequest request, string idempotencyKey)
        {
            _logger.LogInformation("Creating order with idempotency key: {IdempotencyKey}", idempotencyKey);

            // Validate request
            if (request == null || !request.Items.Any())
            {
                throw new ArgumentException("Order must contain at least one item");
            }

            // Validate all items have SizeID
            if (request.Items.Any(i => i.SizeId <= 0))
            {
                throw new ArgumentException("All items must have a valid SizeID");
            }

            using var transaction = await _posRepo.BeginTransactionAsync();

            try
            {
                // 1. Validate inventory for all items
                await ValidateInventoryAsync(request.Items);

                // 2. Get tax rates from POS configuration
                var taxRates = await _posRepo.GetTaxRatesAsync();

                // 3. Calculate order totals
                var orderTotals = CalculateOrderTotals(request.Items, taxRates, request.DiscountAmount);

                // 4. Get next daily order number
                var dailyOrderNumber = await _posRepo.GetNextDailyOrderNumberAsync();

                // 5. Create sale record
                var sale = new PosTicket
                {
                    SaleDateTime = DateTime.Now,
                    TransType = 0,  // 0 = Sale
                    DailyOrderNumber = dailyOrderNumber,
                    SubTotal = orderTotals.SubTotal,
                    DSCAmt = request.DiscountAmount,
                    GSTAmt = orderTotals.GSTAmt,
                    PSTAmt = orderTotals.PSTAmt,
                    PST2Amt = orderTotals.PST2Amt,
                    CustomerID = request.CustomerID ?? 1,  // Default customer
                    CashierID = request.CashierID ?? 1,    // Get from auth context
                    TableID = null,  // Online orders don't have table
                    Guests = 1,
                    TakeOutOrder = true  // Online orders are takeout
                };

                var salesId = await _posRepo.InsertTicketAsync(sale, transaction);

                _logger.LogInformation("Created sale {SalesId} with order number {OrderNumber}",
                    salesId, dailyOrderNumber);

                // 6. Insert line items
                await InsertOrderItemsAsync(salesId, request.Items, transaction);

                // 7. Decrease stock quantities
                await DecreaseInventoryAsync(request.Items, transaction);

                // 8. Record payment if provided
                if (!string.IsNullOrEmpty(request.PaymentAuthorizationNo))
                {
                    await RecordPaymentAsync(salesId, orderTotals.TotalAmount, request, transaction);
                }

                // 9. Commit transaction
                transaction.Commit();

                _logger.LogInformation("Order {SalesId} created successfully", salesId);

                return new OrderResult
                {
                    Success = true,
                    SalesId = salesId,
                    OrderNumber = dailyOrderNumber.ToString(),
                    TotalAmount = orderTotals.TotalAmount,
                    Message = $"Order #{dailyOrderNumber} created successfully"
                };
            }
            catch (InsufficientStockException ex)
            {
                transaction.Rollback();
                _logger.LogWarning(ex, "Order creation failed due to insufficient stock");

                return new OrderResult
                {
                    Success = false,
                    Message = ex.Message
                };
            }
            catch (Exception ex)
            {
                transaction.Rollback();
                _logger.LogError(ex, "Order creation failed");

                return new OrderResult
                {
                    Success = false,
                    Message = "Failed to create order. Please try again."
                };
            }
        }

        /// <summary>
        /// Validate that all items are in stock
        /// </summary>
        private async Task ValidateInventoryAsync(List<OrderItemRequest> items)
        {
            foreach (var item in items)
            {
                var stock = await _posRepo.GetItemStockAsync(item.MenuItemId, item.SizeId);

                // NULL = unlimited, otherwise check quantity
                if (stock.HasValue && stock.Value < item.Quantity)
                {
                    // Get item name for error message
                    var itemSizes = await _posRepo.GetItemSizesAsync(item.MenuItemId);
                    var size = itemSizes.FirstOrDefault(s => s.SizeID == item.SizeId);
                    var itemName = size?.Size?.SizeName ?? $"Item {item.MenuItemId}";

                    throw new InsufficientStockException(item.MenuItemId, item.SizeId, itemName);
                }
            }
        }

        /// <summary>
        /// Calculate order subtotal and taxes
        /// </summary>
        private OrderTotals CalculateOrderTotals(List<OrderItemRequest> items, TaxRates taxRates, decimal discountAmount)
        {
            // Calculate subtotal
            var subtotal = items.Sum(i => i.UnitPrice * i.Quantity);

            // Apply discount
            var discountedSubtotal = subtotal - discountAmount;

            // Calculate taxes on discounted subtotal
            var gstAmt = discountedSubtotal * taxRates.GST;
            var pstAmt = discountedSubtotal * taxRates.PST;
            var pst2Amt = discountedSubtotal * taxRates.PST2;

            // Total includes taxes
            var totalAmount = discountedSubtotal + gstAmt + pstAmt + pst2Amt;

            return new OrderTotals
            {
                SubTotal = subtotal,
                GSTAmt = Math.Round(gstAmt, 2),
                PSTAmt = Math.Round(pstAmt, 2),
                PST2Amt = Math.Round(pst2Amt, 2),
                TotalAmount = Math.Round(totalAmount, 2)
            };
        }

        /// <summary>
        /// Insert all line items for the order
        /// </summary>
        private async Task InsertOrderItemsAsync(int salesId, List<OrderItemRequest> items, IDbTransaction transaction)
        {
            foreach (var item in items)
            {
                // Get item details for denormalization
                var menuItem = await _posRepo.GetActiveMenuItemsAsync();
                var menuItemData = menuItem.FirstOrDefault(m => m.ItemID == item.MenuItemId);

                var itemSizes = await _posRepo.GetItemSizesAsync(item.MenuItemId);
                var sizeData = itemSizes.FirstOrDefault(s => s.SizeID == item.SizeId);

                var detail = new PosTicketItem
                {
                    SalesID = salesId,
                    ItemID = item.MenuItemId,
                    SizeID = item.SizeId,
                    Quantity = item.Quantity,
                    UnitPrice = item.UnitPrice,
                    DSCAmt = 0,  // Line-item discounts handled separately
                    PersonIndex = 1,  // Single person for online orders

                    // Denormalized data
                    ItemName = menuItemData?.IName ?? $"Item {item.MenuItemId}",
                    SizeName = sizeData?.Size?.SizeName ?? "Regular",

                    // Tax application (typically all items taxed the same way)
                    ApplyGST = true,
                    ApplyPST = true,
                    ApplyPST2 = false,

                    // Kitchen routing (copy from menu item defaults)
                    KitchenB = menuItemData?.KitchenB ?? false,
                    KitchenF = menuItemData?.KitchenF ?? false,
                    KitchenE = menuItemData?.KitchenE ?? false,
                    Kitchen5 = menuItemData?.Kitchen5 ?? false,
                    Kitchen6 = menuItemData?.Kitchen6 ?? false,

                    OpenItem = false
                };

                await _posRepo.InsertTicketItemAsync(detail, transaction);
            }
        }

        /// <summary>
        /// Decrease inventory quantities for ordered items
        /// </summary>
        private async Task DecreaseInventoryAsync(List<OrderItemRequest> items, IDbTransaction transaction)
        {
            foreach (var item in items)
            {
                var success = await _posRepo.DecreaseStockAsync(
                    item.MenuItemId,
                    item.SizeId,
                    item.Quantity,
                    transaction
                );

                if (!success)
                {
                    _logger.LogWarning(
                        "Failed to decrease stock for item {ItemId} size {SizeId} (may be unlimited stock)",
                        item.MenuItemId, item.SizeId
                    );
                }
            }
        }

        /// <summary>
        /// Record payment for the order
        /// </summary>
        private async Task RecordPaymentAsync(
            int salesId,
            decimal totalAmount,
            CreateOrderRequest request,
            IDbTransaction transaction)
        {
            var payment = new PosTender
            {
                SalesID = salesId,
                PaymentTypeID = request.PaymentTypeID,
                PaidAmount = totalAmount,
                TipAmount = request.TipAmount,
                Voided = false,
                AuthorizationNo = request.PaymentAuthorizationNo,
                BatchNo = request.PaymentBatchNo,
                CreatedDate = DateTime.Now
            };

            await _posRepo.InsertPaymentAsync(payment, transaction);

            _logger.LogInformation(
                "Payment recorded: ${Amount} (Type: {PaymentType}, Auth: {AuthNo})",
                totalAmount, request.PaymentTypeID, request.PaymentAuthorizationNo
            );
        }
    }

    #region Request/Response Models

    /// <summary>
    /// Request model for creating an order
    /// </summary>
    public class CreateOrderRequest
    {
        public int? CustomerID { get; set; }
        public int? CashierID { get; set; }
        public List<OrderItemRequest> Items { get; set; } = new();

        // Payment info
        public byte PaymentTypeID { get; set; } = (byte)PaymentType.Visa;  // Default: Visa
        public string? PaymentAuthorizationNo { get; set; }  // From Authorize.net
        public string? PaymentBatchNo { get; set; }
        public decimal TipAmount { get; set; }

        // Discounts
        public decimal DiscountAmount { get; set; }
    }

    /// <summary>
    /// Individual order item
    /// CRITICAL: Now requires SizeId
    /// </summary>
    public class OrderItemRequest
    {
        public int MenuItemId { get; set; }
        public int SizeId { get; set; }  // ← NOW REQUIRED
        public decimal Quantity { get; set; }
        public decimal UnitPrice { get; set; }
    }

    /// <summary>
    /// Result of order creation
    /// </summary>
    public class OrderResult
    {
        public bool Success { get; set; }
        public int SalesId { get; set; }
        public string OrderNumber { get; set; } = string.Empty;
        public decimal TotalAmount { get; set; }
        public string Message { get; set; } = string.Empty;
    }

    /// <summary>
    /// Internal class for order total calculations
    /// </summary>
    internal class OrderTotals
    {
        public decimal SubTotal { get; set; }
        public decimal GSTAmt { get; set; }
        public decimal PSTAmt { get; set; }
        public decimal PST2Amt { get; set; }
        public decimal TotalAmount { get; set; }
    }

    #endregion

    #region Exceptions

    /// <summary>
    /// Exception thrown when item is out of stock
    /// </summary>
    public class InsufficientStockException : Exception
    {
        public int ItemId { get; }
        public int SizeId { get; }

        public InsufficientStockException(int itemId, int sizeId, string itemName)
            : base($"Insufficient stock for {itemName} (ItemID: {itemId}, SizeID: {sizeId})")
        {
            ItemId = itemId;
            SizeId = sizeId;
        }
    }

    #endregion
}
```

---

## ✅ Key Changes Summary

### 1. Size is Now Required
```csharp
// BEFORE
public class OrderItemRequest {
    public int MenuItemId { get; set; }
    public decimal Quantity { get; set; }
}

// AFTER
public class OrderItemRequest {
    public int MenuItemId { get; set; }
    public int SizeId { get; set; }  // ← REQUIRED
    public decimal Quantity { get; set; }
    public decimal UnitPrice { get; set; }
}
```

### 2. Tax Calculation
```csharp
// BEFORE
var totalAmount = items.Sum(i => i.Price * i.Quantity);

// AFTER
var subtotal = items.Sum(i => i.UnitPrice * i.Quantity);
var taxRates = await _posRepo.GetTaxRatesAsync();
var gstAmt = subtotal * taxRates.GST;
var pstAmt = subtotal * taxRates.PST;
var totalAmount = subtotal + gstAmt + pstAmt;
```

### 3. Daily Order Number
```csharp
// NEW
var dailyOrderNumber = await _posRepo.GetNextDailyOrderNumberAsync();
```

### 4. Inventory Validation
```csharp
// BEFORE
var stock = await _posRepo.GetItemStockAsync(itemId);

// AFTER
var stock = await _posRepo.GetItemStockAsync(itemId, sizeId);  // ← Size required
```

---

## 🧪 Testing

### Unit Test Example

```csharp
using Xunit;
using Moq;
using Microsoft.Extensions.Logging;

public class OrderProcessingServiceTests
{
    private readonly Mock<IPosRepository> _mockRepo;
    private readonly OrderProcessingService _service;

    public OrderProcessingServiceTests()
    {
        _mockRepo = new Mock<IPosRepository>();
        var mockLogger = new Mock<ILogger<OrderProcessingService>>();
        _service = new OrderProcessingService(_mockRepo.Object, mockLogger.Object);
    }

    [Fact]
    public async Task CreateOrder_WithValidItems_ReturnsSuccess()
    {
        // Arrange
        _mockRepo.Setup(r => r.GetNextDailyOrderNumberAsync())
            .ReturnsAsync(123);

        _mockRepo.Setup(r => r.GetTaxRatesAsync())
            .ReturnsAsync(new TaxRates { GST = 0.05m, PST = 0.07m, PST2 = 0 });

        _mockRepo.Setup(r => r.GetItemStockAsync(It.IsAny<int>(), It.IsAny<int>()))
            .ReturnsAsync((int?)null);  // Unlimited stock

        _mockRepo.Setup(r => r.InsertTicketAsync(It.IsAny<PosTicket>(), It.IsAny<IDbTransaction>()))
            .ReturnsAsync(1);

        var request = new CreateOrderRequest
        {
            Items = new List<OrderItemRequest>
            {
                new OrderItemRequest
                {
                    MenuItemId = 101,
                    SizeId = 1,        // ← Size required
                    Quantity = 2,
                    UnitPrice = 10.99m
                }
            },
            PaymentAuthorizationNo = "AUTH123",
            PaymentTypeID = (byte)PaymentType.Visa
        };

        // Act
        var result = await _service.CreateOrderAsync(request, "idempotency-key-123");

        // Assert
        Assert.True(result.Success);
        Assert.Equal("123", result.OrderNumber);
        Assert.True(result.TotalAmount > 0);
    }

    [Fact]
    public async Task CreateOrder_WithInsufficientStock_ReturnsFailure()
    {
        // Arrange
        _mockRepo.Setup(r => r.GetItemStockAsync(101, 1))
            .ReturnsAsync(0);  // Out of stock

        var request = new CreateOrderRequest
        {
            Items = new List<OrderItemRequest>
            {
                new OrderItemRequest { MenuItemId = 101, SizeId = 1, Quantity = 1, UnitPrice = 10.99m }
            }
        };

        // Act
        var result = await _service.CreateOrderAsync(request, "key");

        // Assert
        Assert.False(result.Success);
        Assert.Contains("Insufficient stock", result.Message);
    }

    [Fact]
    public void CreateOrder_WithMissingSizeId_ThrowsException()
    {
        // Arrange
        var request = new CreateOrderRequest
        {
            Items = new List<OrderItemRequest>
            {
                new OrderItemRequest { MenuItemId = 101, SizeId = 0, Quantity = 1 }  // ← Invalid
            }
        };

        // Act & Assert
        Assert.ThrowsAsync<ArgumentException>(() =>
            _service.CreateOrderAsync(request, "key")
        );
    }
}
```

---

## ⚠️ Breaking API Changes

This service update changes the API contract:

### **API Input Changed:**
```json
// OLD
{
  "items": [
    { "menuItemId": 101, "quantity": 2 }
  ]
}

// NEW - Size required
{
  "items": [
    {
      "menuItemId": 101,
      "sizeId": 1,         // ← REQUIRED
      "quantity": 2,
      "unitPrice": 10.99
    }
  ]
}
```

### **API Output Changed:**
```json
// OLD
{
  "success": true,
  "ticketId": 1234,
  "totalAmount": 25.47
}

// NEW
{
  "success": true,
  "salesId": 1234,     // ← Renamed
  "orderNumber": "123", // ← NEW (daily order number)
  "totalAmount": 25.47
}
```

---

## 📝 Migration Checklist

- [ ] Backup original `OrderProcessingService.cs`
- [ ] Replace with updated code
- [ ] Update `IOrderProcessingService` interface to match
- [ ] Update API controllers that call this service
- [ ] Update DTOs to include SizeId
- [ ] Run unit tests
- [ ] Update Swagger documentation
- [ ] Commit: `git add . && git commit -m "Update order service for size-based pricing"`

---

## 🚀 Next Step

Once service layer is updated, proceed to:

**[Step 4: API Contract Updates →](./04_API_UPDATES.md)**

---

**Generated by Novatech** 🚀
