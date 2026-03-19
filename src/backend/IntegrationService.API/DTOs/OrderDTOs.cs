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
