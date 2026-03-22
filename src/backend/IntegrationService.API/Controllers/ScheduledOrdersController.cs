using System;
using System.Text.Json;
using System.Threading.Tasks;
using IntegrationService.Core.Domain.Entities;
using IntegrationService.Core.Interfaces;
using IntegrationService.Infrastructure.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;

namespace IntegrationService.API.Controllers
{
    /// <summary>
    /// API for managing scheduled future orders
    /// </summary>
    [Route("api/[controller]")]
    [ApiController]
    public class ScheduledOrdersController : ControllerBase
    {
        private readonly IScheduledOrderRepository _scheduledOrderRepo;
        private readonly ILogger<ScheduledOrdersController> _logger;

        public ScheduledOrdersController(
            IScheduledOrderRepository scheduledOrderRepo,
            ILogger<ScheduledOrdersController> logger)
        {
            _scheduledOrderRepo = scheduledOrderRepo;
            _logger = logger;
        }

        /// <summary>
        /// Get scheduled orders for a customer
        /// </summary>
        [HttpGet("customer/{customerId}")]
        public async Task<IActionResult> GetCustomerScheduledOrders(int customerId)
        {
            var orders = await _scheduledOrderRepo.GetByCustomerIdAsync(customerId);
            return Ok(new { data = orders });
        }

        /// <summary>
        /// Get scheduled order by ID
        /// </summary>
        [HttpGet("{id}")]
        public async Task<IActionResult> GetScheduledOrder(int id)
        {
            var order = await _scheduledOrderRepo.GetByIdAsync(id);
            if (order == null)
                return NotFound(new { error = "Scheduled order not found" });

            return Ok(new { data = order });
        }

        /// <summary>
        /// Create a new scheduled order
        /// </summary>
        [HttpPost]
        public async Task<IActionResult> CreateScheduledOrder([FromBody] CreateScheduledOrderRequest request)
        {
            // Validate target time is in the future
            if (request.TargetDateTime <= DateTime.Now.AddMinutes(30))
            {
                return BadRequest(new { error = "Target time must be at least 30 minutes in the future" });
            }

            // Serialize order items to JSON
            var orderData = new ScheduledOrderData
            {
                Items = request.Items,
                SpecialInstructions = request.SpecialInstructions,
                IsTakeout = request.IsTakeout
            };

            var order = new ScheduledOrder
            {
                CustomerId = request.CustomerId,
                IdempotencyKey = request.IdempotencyKey ?? Guid.NewGuid().ToString(),
                OrderJson = JsonSerializer.Serialize(orderData),
                SubTotal = request.SubTotal,
                TaxAmount = request.TaxAmount,
                TotalAmount = request.TotalAmount,
                PaymentToken = request.PaymentToken,
                CardType = request.CardType,
                Last4 = request.Last4,
                TargetDateTime = request.TargetDateTime,
                PrepTimeMinutes = request.PrepTimeMinutes ?? 30
            };

            var id = await _scheduledOrderRepo.CreateAsync(order);
            order.Id = id;

            _logger.LogInformation("Created scheduled order {Id} for customer {CustomerId}, target: {Target}",
                id, request.CustomerId, request.TargetDateTime);

            return CreatedAtAction(nameof(GetScheduledOrder), new { id }, new
            {
                data = new
                {
                    order.Id,
                    order.CustomerId,
                    order.TargetDateTime,
                    order.TotalAmount,
                    order.Status,
                    order.InjectionTime
                }
            });
        }

        /// <summary>
        /// Cancel a scheduled order
        /// </summary>
        [HttpPost("{id}/cancel")]
        public async Task<IActionResult> CancelScheduledOrder(int id)
        {
            var order = await _scheduledOrderRepo.GetByIdAsync(id);
            if (order == null)
                return NotFound(new { error = "Scheduled order not found" });

            if (order.Status != "pending")
                return BadRequest(new { error = "Can only cancel pending scheduled orders" });

            // Check if it's too late to cancel (within prep time)
            if (DateTime.Now >= order.InjectionTime)
                return BadRequest(new { error = "Too late to cancel - order is being prepared" });

            var cancelled = await _scheduledOrderRepo.CancelAsync(id);
            if (!cancelled)
                return BadRequest(new { error = "Failed to cancel order" });

            _logger.LogInformation("Cancelled scheduled order {Id}", id);
            return Ok(new { success = true });
        }

        /// <summary>
        /// Get available pickup times
        /// </summary>
        [HttpGet("available-times")]
        public IActionResult GetAvailablePickupTimes([FromQuery] DateTime? date = null)
        {
            var targetDate = date ?? DateTime.Today;
            var now = DateTime.Now;

            // Generate available slots (every 15 minutes from 30 min ahead to closing)
            var slots = new System.Collections.Generic.List<AvailableTimeSlot>();
            var startTime = targetDate.Date == now.Date
                ? now.AddMinutes(30).Date.AddHours(now.AddMinutes(30).Hour).AddMinutes((now.AddMinutes(30).Minute / 15) * 15 + 15)
                : targetDate.Date.AddHours(10); // 10 AM opening

            var endTime = targetDate.Date.AddHours(21); // 9 PM closing

            for (var time = startTime; time <= endTime; time = time.AddMinutes(15))
            {
                slots.Add(new AvailableTimeSlot
                {
                    DateTime = time,
                    DisplayTime = time.ToString("h:mm tt")
                });
            }

            return Ok(new { data = slots });
        }
    }

    public class CreateScheduledOrderRequest
    {
        public int CustomerId { get; set; }
        public string? IdempotencyKey { get; set; }
        public System.Collections.Generic.List<ScheduledOrderItem> Items { get; set; } = new();
        public string? SpecialInstructions { get; set; }
        public bool IsTakeout { get; set; } = true;

        public decimal SubTotal { get; set; }
        public decimal TaxAmount { get; set; }
        public decimal TotalAmount { get; set; }

        public string? PaymentToken { get; set; }
        public string? CardType { get; set; }
        public string? Last4 { get; set; }

        public DateTime TargetDateTime { get; set; }
        public int? PrepTimeMinutes { get; set; }
    }

    public class AvailableTimeSlot
    {
        public DateTime DateTime { get; set; }
        public string DisplayTime { get; set; } = string.Empty;
    }
}
