# Step 4: API Contract Updates

## 🎯 Goal
Update API controllers and DTOs to support size-based pricing and new POS schema.

**Files:**
- `backend/IntegrationService.API/Controllers/MenuController.cs`
- `backend/IntegrationService.API/Controllers/OrdersController.cs`
- `backend/IntegrationService.API/DTOs/MenuDTOs.cs`
- `backend/IntegrationService.API/DTOs/OrderDTOs.cs`

**Estimated time:** 1-2 hours

---

## 🔴 CRITICAL API CHANGES

### Menu Endpoint
**OLD:** Returns items with single price
**NEW:** Returns items with multiple sizes and prices

### Order Creation Endpoint
**OLD:** Accepts `menuItemId` and `quantity`
**NEW:** Requires `menuItemId`, `sizeId`, and `quantity`

---

## 📝 Updated DTOs

### File: `DTOs/MenuDTOs.cs`

```csharp
using System.Collections.Generic;

namespace IntegrationService.API.DTOs
{
    /// <summary>
    /// Menu item response - includes all available sizes
    /// </summary>
    public class MenuItemDTO
    {
        public int ItemId { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string? ImageUrl { get; set; }
        public int CategoryId { get; set; }
        public string? CategoryName { get; set; }

        // Item flags
        public bool IsAlcohol { get; set; }
        public bool IsAvailable { get; set; } = true;

        // CRITICAL: Now returns array of sizes with prices
        public List<MenuItemSizeDTO> Sizes { get; set; } = new();

        // Deprecated: Remove after mobile app updated
        [Obsolete("Use Sizes collection instead")]
        public decimal Price => Sizes.FirstOrDefault()?.Price ?? 0;
    }

    /// <summary>
    /// Size option for a menu item
    /// NEW DTO - represents one size/price combination
    /// </summary>
    public class MenuItemSizeDTO
    {
        public int SizeId { get; set; }
        public string SizeName { get; set; } = string.Empty;  // "Small", "Medium", "Large"
        public string? ShortName { get; set; }  // "S", "M", "L"
        public decimal Price { get; set; }
        public bool InStock { get; set; }
        public int? StockQuantity { get; set; }  // NULL = unlimited
        public int DisplayOrder { get; set; }
    }

    /// <summary>
    /// Response for menu endpoint
    /// </summary>
    public class MenuResponse
    {
        public List<MenuItemDTO> Items { get; set; } = new();
        public List<CategoryDTO> Categories { get; set; } = new();
    }

    /// <summary>
    /// Category information
    /// </summary>
    public class CategoryDTO
    {
        public int CategoryId { get; set; }
        public string Name { get; set; } = string.Empty;
        public int DisplayOrder { get; set; }
    }
}
```

---

### File: `DTOs/OrderDTOs.cs`

```csharp
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace IntegrationService.API.DTOs
{
    /// <summary>
    /// Request to create a new order
    /// UPDATED: Now requires sizeId for each item
    /// </summary>
    public class CreateOrderRequest
    {
        [Required]
        public List<OrderItemRequest> Items { get; set; } = new();

        // Customer info (optional)
        public int? CustomerId { get; set; }
        public string? CustomerPhone { get; set; }
        public string? CustomerName { get; set; }

        // Payment info (from Authorize.net)
        [Required]
        public string PaymentAuthorizationNo { get; set; } = string.Empty;

        public string? PaymentBatchNo { get; set; }

        [Required]
        [Range(1, 255)]
        public byte PaymentTypeId { get; set; } = 3;  // Default: Visa

        public decimal TipAmount { get; set; }

        // Discounts
        public decimal DiscountAmount { get; set; }

        // Delivery info (for future use)
        public string? DeliveryAddress { get; set; }
        public string? DeliveryInstructions { get; set; }
    }

    /// <summary>
    /// Individual order item
    /// CRITICAL: Now requires sizeId
    /// </summary>
    public class OrderItemRequest
    {
        [Required]
        [Range(1, int.MaxValue)]
        public int MenuItemId { get; set; }

        [Required]
        [Range(1, int.MaxValue)]
        public int SizeId { get; set; }  // ← NEW: REQUIRED

        [Required]
        [Range(0.01, 999.99)]
        public decimal Quantity { get; set; }

        [Required]
        [Range(0.01, 9999.99)]
        public decimal UnitPrice { get; set; }

        // Optional customizations (for future use)
        public string? SpecialInstructions { get; set; }
        public List<int>? ModifierIds { get; set; }
    }

    /// <summary>
    /// Response after creating an order
    /// UPDATED: New field names matching POS schema
    /// </summary>
    public class CreateOrderResponse
    {
        public bool Success { get; set; }
        public string Message { get; set; } = string.Empty;

        // Order identifiers
        public int SalesId { get; set; }  // Internal ID
        public string OrderNumber { get; set; } = string.Empty;  // User-facing daily order number

        // Financial details
        public decimal SubTotal { get; set; }
        public decimal TaxAmount { get; set; }
        public decimal TotalAmount { get; set; }

        // Tax breakdown (optional, for receipt display)
        public decimal? GSTAmount { get; set; }
        public decimal? PSTAmount { get; set; }

        // Timestamps
        public DateTime CreatedAt { get; set; }
        public DateTime? EstimatedReadyTime { get; set; }
    }

    /// <summary>
    /// Order details response
    /// </summary>
    public class OrderDetailsResponse
    {
        public int SalesId { get; set; }
        public string OrderNumber { get; set; } = string.Empty;
        public DateTime OrderDate { get; set; }
        public string Status { get; set; } = string.Empty;

        // Items
        public List<OrderItemDTO> Items { get; set; } = new();

        // Totals
        public decimal SubTotal { get; set; }
        public decimal TaxAmount { get; set; }
        public decimal TotalAmount { get; set; }

        // Payment
        public string PaymentMethod { get; set; } = string.Empty;
        public string? PaymentAuthCode { get; set; }
    }

    /// <summary>
    /// Order item in response
    /// </summary>
    public class OrderItemDTO
    {
        public string ItemName { get; set; } = string.Empty;
        public string SizeName { get; set; } = string.Empty;  // ← NEW
        public decimal Quantity { get; set; }
        public decimal UnitPrice { get; set; }
        public decimal LineTotal { get; set; }
    }
}
```

---

## 📝 Updated Controllers

### File: `Controllers/MenuController.cs`

```csharp
using Microsoft.AspNetCore.Mvc;
using IntegrationService.Core.Interfaces;
using IntegrationService.API.DTOs;

namespace IntegrationService.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class MenuController : ControllerBase
    {
        private readonly IPosRepository _posRepo;
        private readonly ILogger<MenuController> _logger;

        public MenuController(IPosRepository posRepository, ILogger<MenuController> logger)
        {
            _posRepo = posRepository;
            _logger = logger;
        }

        /// <summary>
        /// Get full menu with all items and sizes
        /// UPDATED: Now returns sizes array for each item
        /// </summary>
        [HttpGet]
        [ProducesResponseType(typeof(MenuResponse), 200)]
        public async Task<IActionResult> GetMenu()
        {
            try
            {
                // Get all active menu items
                var menuItems = await _posRepo.GetActiveMenuItemsAsync();

                var menuItemDTOs = new List<MenuItemDTO>();

                foreach (var item in menuItems)
                {
                    // Get all available sizes for this item
                    var sizes = await _posRepo.GetItemSizesAsync(item.ItemID);

                    var sizesDTOs = sizes.Select(s => new MenuItemSizeDTO
                    {
                        SizeId = s.SizeID,
                        SizeName = s.Size?.SizeName ?? "Regular",
                        ShortName = s.Size?.ShortName,
                        Price = s.UnitPrice,
                        InStock = s.InStock,
                        StockQuantity = s.OnHandQty,
                        DisplayOrder = s.Size?.DisplayOrder ?? 0
                    }).OrderBy(s => s.DisplayOrder).ToList();

                    // Only include items that have at least one size in stock
                    if (sizesDTOs.Any())
                    {
                        menuItemDTOs.Add(new MenuItemDTO
                        {
                            ItemId = item.ItemID,
                            Name = item.IName,
                            Description = item.ItemDescription,
                            ImageUrl = item.ImageFilePath,
                            CategoryId = item.CategoryID,
                            IsAlcohol = item.Alcohol,
                            IsAvailable = true,
                            Sizes = sizesDTOs  // ← NEW: Array of sizes
                        });
                    }
                }

                return Ok(new MenuResponse
                {
                    Items = menuItemDTOs
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to retrieve menu");
                return StatusCode(500, "Failed to retrieve menu");
            }
        }

        /// <summary>
        /// Get sizes for a specific menu item
        /// NEW ENDPOINT
        /// </summary>
        [HttpGet("{itemId}/sizes")]
        [ProducesResponseType(typeof(List<MenuItemSizeDTO>), 200)]
        public async Task<IActionResult> GetItemSizes(int itemId)
        {
            try
            {
                var sizes = await _posRepo.GetItemSizesAsync(itemId);

                var sizeDTOs = sizes.Select(s => new MenuItemSizeDTO
                {
                    SizeId = s.SizeID,
                    SizeName = s.Size?.SizeName ?? "Regular",
                    ShortName = s.Size?.ShortName,
                    Price = s.UnitPrice,
                    InStock = s.InStock,
                    StockQuantity = s.OnHandQty,
                    DisplayOrder = s.Size?.DisplayOrder ?? 0
                }).OrderBy(s => s.DisplayOrder).ToList();

                return Ok(sizeDTOs);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to retrieve sizes for item {ItemId}", itemId);
                return StatusCode(500, "Failed to retrieve item sizes");
            }
        }
    }
}
```

---

### File: `Controllers/OrdersController.cs`

```csharp
using Microsoft.AspNetCore.Mvc;
using IntegrationService.Core.Services;
using IntegrationService.API.DTOs;

namespace IntegrationService.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class OrdersController : ControllerBase
    {
        private readonly IOrderProcessingService _orderService;
        private readonly ILogger<OrdersController> _logger;

        public OrdersController(IOrderProcessingService orderService, ILogger<OrdersController> logger)
        {
            _orderService = orderService;
            _logger = logger;
        }

        /// <summary>
        /// Create a new order
        /// UPDATED: Now requires sizeId for each item
        /// </summary>
        [HttpPost]
        [ProducesResponseType(typeof(CreateOrderResponse), 200)]
        [ProducesResponseType(typeof(CreateOrderResponse), 400)]
        public async Task<IActionResult> CreateOrder([FromBody] CreateOrderRequest request,
            [FromHeader(Name = "X-Idempotency-Key")] string? idempotencyKey)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            // Validate idempotency key
            if (string.IsNullOrWhiteSpace(idempotencyKey))
            {
                return BadRequest(new CreateOrderResponse
                {
                    Success = false,
                    Message = "X-Idempotency-Key header is required"
                });
            }

            // Validate all items have sizeId
            if (request.Items.Any(i => i.SizeId <= 0))
            {
                return BadRequest(new CreateOrderResponse
                {
                    Success = false,
                    Message = "All items must have a valid SizeId"
                });
            }

            try
            {
                // Map DTOs to service models
                var serviceRequest = new Core.Services.CreateOrderRequest
                {
                    CustomerID = request.CustomerId,
                    Items = request.Items.Select(i => new Core.Services.OrderItemRequest
                    {
                        MenuItemId = i.MenuItemId,
                        SizeId = i.SizeId,  // ← NOW REQUIRED
                        Quantity = i.Quantity,
                        UnitPrice = i.UnitPrice
                    }).ToList(),
                    PaymentAuthorizationNo = request.PaymentAuthorizationNo,
                    PaymentBatchNo = request.PaymentBatchNo,
                    PaymentTypeID = request.PaymentTypeId,
                    TipAmount = request.TipAmount,
                    DiscountAmount = request.DiscountAmount
                };

                var result = await _orderService.CreateOrderAsync(serviceRequest, idempotencyKey);

                if (result.Success)
                {
                    return Ok(new CreateOrderResponse
                    {
                        Success = true,
                        Message = result.Message,
                        SalesId = result.SalesId,
                        OrderNumber = result.OrderNumber,
                        TotalAmount = result.TotalAmount,
                        CreatedAt = DateTime.Now
                    });
                }
                else
                {
                    return BadRequest(new CreateOrderResponse
                    {
                        Success = false,
                        Message = result.Message
                    });
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to create order");
                return StatusCode(500, new CreateOrderResponse
                {
                    Success = false,
                    Message = "An error occurred while creating your order. Please try again."
                });
            }
        }
    }
}
```

---

## 📊 Swagger Documentation Updates

Update your `Startup.cs` or `Program.cs` to include Swagger examples:

```csharp
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "TOAST POS Integration API",
        Version = "v2.0",  // Increment version
        Description = "Online ordering API with size-based pricing"
    });

    // Add XML comments
    var xmlFile = $"{Assembly.GetExecutingAssembly().GetName().Name}.xml";
    var xmlPath = Path.Combine(AppContext.BaseDirectory, xmlFile);
    c.IncludeXmlComments(xmlPath);
});
```

---

## 🧪 Testing with Swagger

### 1. Test Menu Endpoint

```bash
curl -X GET "https://localhost:5001/api/menu" -H "accept: application/json"
```

**Expected response:**
```json
{
  "items": [
    {
      "itemId": 101,
      "name": "Classic Burger",
      "description": "Beef patty with lettuce, tomato, onion",
      "categoryId": 1,
      "sizes": [
        {
          "sizeId": 1,
          "sizeName": "Regular",
          "price": 10.99,
          "inStock": true,
          "displayOrder": 1
        },
        {
          "sizeId": 2,
          "sizeName": "Large",
          "price": 13.99,
          "inStock": true,
          "displayOrder": 2
        }
      ]
    }
  ]
}
```

### 2. Test Order Creation

```bash
curl -X POST "https://localhost:5001/api/orders" \
  -H "Content-Type: application/json" \
  -H "X-Idempotency-Key: unique-key-12345" \
  -d '{
    "items": [
      {
        "menuItemId": 101,
        "sizeId": 2,
        "quantity": 1,
        "unitPrice": 13.99
      }
    ],
    "paymentAuthorizationNo": "AUTH123456",
    "paymentTypeId": 3
  }'
```

**Expected response:**
```json
{
  "success": true,
  "message": "Order #123 created successfully",
  "salesId": 4567,
  "orderNumber": "123",
  "totalAmount": 15.67,
  "createdAt": "2026-02-23T19:30:00Z"
}
```

---

## ⚠️ Breaking Changes for Mobile App

### Menu Response Structure Changed

**OLD:**
```json
{
  "itemId": 101,
  "name": "Burger",
  "price": 10.99
}
```

**NEW:**
```json
{
  "itemId": 101,
  "name": "Burger",
  "sizes": [
    { "sizeId": 1, "sizeName": "Regular", "price": 10.99 },
    { "sizeId": 2, "sizeName": "Large", "price": 13.99 }
  ]
}
```

### Order Request Changed

**OLD:**
```json
{
  "items": [
    { "menuItemId": 101, "quantity": 1 }
  ]
}
```

**NEW:**
```json
{
  "items": [
    {
      "menuItemId": 101,
      "sizeId": 1,      // ← NOW REQUIRED
      "quantity": 1,
      "unitPrice": 10.99
    }
  ]
}
```

---

## 📝 Migration Checklist

- [ ] Update all DTO files
- [ ] Update MenuController
- [ ] Update OrdersController
- [ ] Update Swagger configuration
- [ ] Test with Postman/curl
- [ ] Update API documentation
- [ ] Version bump (v2.0)
- [ ] Commit: `git add . && git commit -m "Update API for size-based pricing"`

---

## 🚀 Next Step

Once API is updated and tested, proceed to:

**[Step 5: Mobile App Updates →](./05_MOBILE_UPDATES.md)**

---

**Generated by Novatech** 🚀
