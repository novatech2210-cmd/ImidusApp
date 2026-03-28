using Microsoft.AspNetCore.Mvc;
using IntegrationService.Core.Interfaces;
using IntegrationService.Core.Domain.Entities;
using IntegrationService.Core.Models;
using IntegrationService.API.DTOs;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using System;

namespace IntegrationService.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class OrdersController : ControllerBase
    {
        private readonly IOrderProcessingService _orderService;
        private readonly IPosRepository _posRepo;
        private readonly ILogger<OrdersController> _logger;

        public OrdersController(
            IOrderProcessingService orderService, 
            IPosRepository posRepository,
            ILogger<OrdersController> logger)
        {
            _orderService = orderService;
            _posRepo = posRepository;
            _logger = logger;
        }

        /// <summary>
        /// Create a new order
        /// </summary>
        [HttpPost]
        [ProducesResponseType(typeof(CreateOrderResponse), 200)]
        [ProducesResponseType(typeof(CreateOrderResponse), 400)]
        public async Task<IActionResult> CreateOrder([FromBody] API.DTOs.CreateOrderRequest request,
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
                var serviceRequest = new Core.Domain.Entities.CreateOrderRequest
                {
                    CustomerID = request.CustomerId,
                    Items = request.Items.Select(i => new Core.Domain.Entities.OrderItemRequest
                    {
                        MenuItemId = i.MenuItemId,
                        SizeId = i.SizeId,
                        Quantity = i.Quantity,
                        UnitPrice = i.UnitPrice
                    }).ToList(),
                    PaymentAuthCode = request.PaymentAuthorizationNo,
                    PaymentBatchNo = request.PaymentBatchNo,
                    PaymentTypeID = request.PaymentTypeId ?? (byte)PaymentType.Visa,
                    TipAmount = request.TipAmount,
                    IsTakeout = true
                };

                var result = await _orderService.CreateOrderAsync(serviceRequest, idempotencyKey);

                if (result.Success)
                {
                    return Ok(new CreateOrderResponse
                    {
                        Success = true,
                        Message = $"Order #{result.DailyOrderNumber} created successfully",
                        SalesId = result.SalesID,
                        OrderNumber = result.TicketNumber,
                        TotalAmount = result.TotalAmount,
                        CreatedAt = DateTime.Now
                    });
                }
                else
                {
                    return BadRequest(new CreateOrderResponse
                    {
                        Success = false,
                        Message = result.ErrorMessage ?? "Order creation failed"
                    });
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to create order. Exception: {Message}. Inner: {InnerMessage}", 
                    ex.Message, ex.InnerException?.Message);
                    
                return StatusCode(500, new CreateOrderResponse
                {
                    Success = false,
                    Message = "An error occurred while creating your order. Please try again.",
                    SalesId = 0
                });
            }
        }

        /// <summary>
        /// Process payment and complete an open order
        /// </summary>
        [HttpPost("{salesId}/complete-payment")]
        [ProducesResponseType(typeof(OrderCompletionResult), 200)]
        [ProducesResponseType(typeof(OrderCompletionResult), 400)]
        public async Task<IActionResult> CompletePayment(
            int salesId,
            [FromBody] PaymentRequest paymentRequest,
            [FromHeader(Name = "X-Idempotency-Key")] string? idempotencyKey)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(new OrderCompletionResult
                {
                    Success = false,
                    ErrorMessage = "Invalid payment request"
                });
            }

            // Validate idempotency key
            if (string.IsNullOrWhiteSpace(idempotencyKey))
            {
                return BadRequest(new OrderCompletionResult
                {
                    Success = false,
                    ErrorMessage = "X-Idempotency-Key header is required"
                });
            }

            if (paymentRequest.Token == null ||
                string.IsNullOrWhiteSpace(paymentRequest.Token.DataDescriptor) ||
                string.IsNullOrWhiteSpace(paymentRequest.Token.DataValue))
            {
                return BadRequest(new OrderCompletionResult
                {
                    Success = false,
                    ErrorMessage = "Payment token is required"
                });
            }

            try
            {
                // Set salesId in payment request if not already set
                paymentRequest.SalesId = salesId;

                var result = await _orderService.ProcessPaymentAndCompleteOrderAsync(
                    salesId,
                    paymentRequest,
                    idempotencyKey);

                if (result.Success)
                {
                    return Ok(result);
                }
                else
                {
                    return BadRequest(result);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to complete payment for order {SalesId}", salesId);
                return StatusCode(500, new OrderCompletionResult
                {
                    Success = false,
                    ErrorMessage = "An error occurred while processing your payment. Please try again."
                });
            }
        }

        /// <summary>
        /// Get order details by sales ID or daily order number
        /// </summary>
        [HttpGet("{id}")]
        [ProducesResponseType(typeof(OrderHistoryDto), 200)]
        [ProducesResponseType(typeof(OrderHistoryDto), 404)]
        public async Task<IActionResult> GetOrder(string id)
        {
            try
            {
                PosTicket? order = null;

                // Try to parse as integer ID (salesId)
                if (int.TryParse(id, out int salesId))
                {
                    order = await _orderService.GetOrderAsync(salesId);
                }

                // If not found, it might be a DailyOrderNumber?
                // For now, assume it's primarily by SalesId as that's unique.
                
                if (order == null)
                {
                    return NotFound(new { error = $"Order {id} not found" });
                }

                // Map to the "Order" interface expected by the web frontend
                var response = new
                {
                    id = order.ID.ToString(),
                    orderNumber = order.DailyOrderNumber.ToString(),
                    transactionId = order.Payments?.FirstOrDefault()?.AuthorizationNo ?? "",
                    items = order.Items?.Select(i => (object)new
                    {
                        id = i.ItemID.ToString(),
                        name = i.ItemName,
                        quantity = (int)i.Qty,
                        price = i.UnitPrice,
                        total = i.UnitPrice * i.Qty
                    }).ToList() ?? new List<object>(),
                    subtotal = order.SubTotal,
                    gst = order.GSTAmt,
                    pst = order.PSTAmt + order.PST2Amt,
                    total = order.SubTotal + order.GSTAmt + order.PSTAmt + order.PST2Amt - order.DSCAmt,
                    createdAt = order.SaleDateTime.ToString("yyyy-MM-ddTHH:mm:ssZ"),
                    status = order.TransType == 1 ? "completed" : "received"
                };

                return Ok(response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to get order details for {Id}", id);
                return StatusCode(500, new { error = "An error occurred while retrieving order details" });
            }
        }

        /// <summary>
        /// Get order history for a customer
        /// SSOT Compliant: Reads from POS database (ground truth)
        /// </summary>
        [HttpGet("history/{customerId}")]
        [ProducesResponseType(typeof(List<OrderHistoryDto>), 200)]
        public async Task<IActionResult> GetOrderHistory(int customerId)
        {
            try
            {
                _logger.LogInformation("Fetching order history for customer {CustomerId}", customerId);

                // Get orders from POS database (SSOT - ground truth)
                var orders = await _posRepo.GetOrdersByCustomerIdAsync(customerId);

                // Map to DTOs
                var orderDtos = orders.Select(o => new OrderHistoryDto
                {
                    Id = o.ID,
                    SalesId = o.ID,
                    DailyOrderNumber = o.DailyOrderNumber,
                    SaleDateTime = o.SaleDateTime,
                    SubTotal = o.SubTotal,
                    GstAmt = o.GSTAmt,
                    PstAmt = o.PSTAmt,
                    PsT2Amt = o.PST2Amt,
                    DscAmt = o.DSCAmt,
                    TotalAmount = o.SubTotal + o.GSTAmt + o.PSTAmt + o.PST2Amt - o.DSCAmt,
                    Status = o.TransType == 1 ? "Completed" : "Pending",
                    Details = o.Items?.Select(i => new OrderDetailDto
                    {
                        ItemId = i.ItemID,
                        IName = i.ItemName,
                        SizeName = i.SizeName,
                        ItemQty = i.Qty,
                        UnitPrice = i.UnitPrice
                    }).ToList() ?? new List<OrderDetailDto>()
                }).ToList();

                return Ok(orderDtos);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to get order history for customer {CustomerId}", customerId);
                return StatusCode(500, new { error = "Failed to retrieve order history" });
            }
        }

        /// <summary>
        /// Get recent orders for admin dashboard
        /// SSOT Compliant: Reads from POS database (ground truth)
        /// </summary>
        [HttpGet("recent")]
        [ProducesResponseType(typeof(List<RecentOrderDto>), 200)]
        public async Task<IActionResult> GetRecentOrders([FromQuery] int days = 1)
        {
            try
            {
                _logger.LogInformation("Fetching orders from last {Days} days", days);

                var startDate = DateTime.Now.AddDays(-days);
                var endDate = DateTime.Now.AddDays(1);

                // Get orders from POS database (SSOT - ground truth)
                var orders = await _posRepo.GetOrdersByDateRangeAsync(startDate, endDate);

                // Map to DTOs with customer info
                var orderDtos = new List<RecentOrderDto>();
                foreach (var order in orders)
                {
                    // Get customer info from POS if available
                    PosCustomer? customer = null;
                    if (order.CustomerID.HasValue && order.CustomerID.Value > 0)
                    {
                        customer = await _posRepo.GetCustomerByIdAsync(order.CustomerID.Value);
                    }
                    
                    orderDtos.Add(new RecentOrderDto
                    {
                        SalesId = order.ID,
                        DailyOrderNumber = order.DailyOrderNumber,
                        CustomerName = customer != null ? $"{customer.FName} {customer.LName}".Trim() : "Guest",
                        TotalAmount = order.SubTotal + order.GSTAmt + order.PSTAmt + order.PST2Amt - order.DSCAmt,
                        TransType = order.TransType,
                        SaleDateTime = order.SaleDateTime,
                        ItemCount = order.Items?.Count ?? 0,
                        PaymentStatus = order.TransType == 1 ? "Paid" : "Pending"
                    });
                }

                return Ok(orderDtos.OrderByDescending(o => o.SaleDateTime));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to get recent orders");
                return StatusCode(500, new { error = "Failed to retrieve recent orders" });
            }
        }
    }

    /// <summary>
    /// Order history DTO for API responses
    /// </summary>
    public class OrderHistoryDto
    {
        public int Id { get; set; }
        public int SalesId { get; set; }
        public int DailyOrderNumber { get; set; }
        public DateTime SaleDateTime { get; set; }
        public decimal SubTotal { get; set; }
        public decimal GstAmt { get; set; }
        public decimal PstAmt { get; set; }
        public decimal PsT2Amt { get; set; }
        public decimal DscAmt { get; set; }
        public decimal TotalAmount { get; set; }
        public string Status { get; set; } = "";
        public List<OrderDetailDto> Details { get; set; } = new();
    }

    public class OrderDetailDto
    {
        public int ItemId { get; set; }
        public string IName { get; set; } = "";
        public string SizeName { get; set; } = "";
        public decimal ItemQty { get; set; }
        public decimal UnitPrice { get; set; }
    }

    /// <summary>
    /// Recent order DTO for admin dashboard
    /// </summary>
    public class RecentOrderDto
    {
        public int SalesId { get; set; }
        public int DailyOrderNumber { get; set; }
        public string CustomerName { get; set; } = "";
        public decimal TotalAmount { get; set; }
        public int TransType { get; set; }
        public DateTime SaleDateTime { get; set; }
        public int ItemCount { get; set; }
        public string PaymentStatus { get; set; } = "";
    }
}
