using IntegrationService.API.DTOs;
using IntegrationService.Core.Entities;
using IntegrationService.Core.Interfaces;
using IntegrationService.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using System;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;

namespace IntegrationService.API.Controllers
{
    /// <summary>
    /// Scheduled Orders API
    /// Allows customers to place orders for future pickup
    /// Orders stored in IntegrationService DB until release time, then written to POS
    /// SSOT Compliant: Never modifies INI_Restaurant schema
    /// </summary>
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class ScheduledOrdersController : ControllerBase
    {
        private readonly IScheduledOrderRepository _scheduledOrderRepo;
        private readonly IPosRepository _posRepository;
        private readonly IIdempotencyRepository _idempotencyRepo;
        private readonly ILogger<ScheduledOrdersController> _logger;

        public ScheduledOrdersController(
            IScheduledOrderRepository scheduledOrderRepo,
            IPosRepository posRepository,
            IIdempotencyRepository idempotencyRepo,
            ILogger<ScheduledOrdersController> logger)
        {
            _scheduledOrderRepo = scheduledOrderRepo;
            _posRepository = posRepository;
            _idempotencyRepo = idempotencyRepo;
            _logger = logger;
        }

        /// <summary>
        /// Create a new scheduled order
        /// Stores in IntegrationService DB, releases to POS at scheduled time
        /// </summary>
        [HttpPost]
        public async Task<ActionResult<CreateScheduledOrderResponse>> Create(
            [FromBody] CreateScheduledOrderRequest request)
        {
            try
            {
                // Check if idempotency key exists
                var existingRecord = await _idempotencyRepo.GetByKeyAsync(request.IdempotencyKey);
                if (existingRecord != null)
                {
                    var existingOrder = await _scheduledOrderRepo.GetByIdempotencyKeyAsync(request.IdempotencyKey);
                    if (existingOrder != null)
                    {
                        return Ok(new CreateScheduledOrderResponse
                        {
                            Success = true,
                            Message = "Order already exists (idempotency key matched)",
                            ScheduledOrderId = existingOrder.Id,
                            ConfirmationCode = $"SCH-{existingOrder.Id:D6}",
                            ScheduledDateTime = existingOrder.ScheduledDateTime,
                            TotalAmount = existingOrder.TotalAmount
                        });
                    }
                }

                // Validate scheduled time (must be in future, at least 30 min lead time)
                var minLeadTime = DateTime.UtcNow.AddMinutes(30);
                if (request.ScheduledDateTime <= minLeadTime)
                {
                    return BadRequest(new { error = "Scheduled time must be at least 30 minutes in the future" });
                }

                // Get customer info from POS database
                var customer = await _posRepository.GetCustomerByIdAsync(request.CustomerId);
                if (customer == null)
                {
                    return BadRequest(new { error = "Customer not found" });
                }

                // Calculate totals
                var subtotal = request.Items.Sum(i => i.UnitPrice * i.Quantity);
                var tax = subtotal * 0.06m; // 6% GST
                var total = subtotal + tax + request.TipAmount;

                // Create scheduled order
                var scheduledOrder = new ScheduledOrder
                {
                    PosCustomerId = request.CustomerId,
                    CustomerFirstName = customer.FName ?? "",
                    CustomerLastName = customer.LName ?? "",
                    CustomerPhone = customer.Phone,
                    ScheduledDateTime = request.ScheduledDateTime,
                    Status = "pending",
                    ItemsJson = JsonSerializer.Serialize(request.Items),
                    Subtotal = subtotal,
                    TaxAmount = tax,
                    TotalAmount = total,
                    PaymentAuthorizationNo = request.PaymentAuthorizationNo,
                    PaymentBatchNo = request.PaymentBatchNo ?? "1",
                    PaymentTypeId = request.PaymentTypeId,
                    TipAmount = request.TipAmount,
                    SpecialInstructions = request.SpecialInstructions,
                    IdempotencyKey = request.IdempotencyKey,
                    CreatedBy = User.Identity?.Name ?? "system"
                };

                // Record idempotency
                var idempotencyRecord = new IntegrationService.Core.Domain.Entities.IdempotencyRecord
                {
                    IdempotencyKey = request.IdempotencyKey,
                    RequestHash = JsonSerializer.Serialize(request),
                    ResponseJson = null,
                    StatusCode = 0,
                    CreatedAt = DateTime.UtcNow,
                    ExpiresAt = DateTime.UtcNow.AddHours(24)
                };
                await _idempotencyRepo.StoreAsync(idempotencyRecord);

                // Save to IntegrationService database (overlay)
                var orderId = await _scheduledOrderRepo.CreateAsync(scheduledOrder);

                _logger.LogInformation(
                    "Scheduled order {OrderId} created for customer {CustomerId}, pickup at {PickupTime}",
                    orderId, request.CustomerId, request.ScheduledDateTime);

                return Ok(new CreateScheduledOrderResponse
                {
                    Success = true,
                    Message = "Order scheduled successfully",
                    ScheduledOrderId = orderId,
                    ConfirmationCode = $"SCH-{orderId:D6}",
                    ScheduledDateTime = request.ScheduledDateTime,
                    TotalAmount = total
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating scheduled order");
                return StatusCode(500, new { error = "Failed to schedule order", details = ex.Message });
            }
        }

        /// <summary>
        /// Get customer's scheduled orders
        /// </summary>
        [HttpGet("customer/{customerId}")]
        public async Task<ActionResult> GetByCustomer(int customerId)
        {
            try
            {
                var orders = await _scheduledOrderRepo.GetByCustomerIdAsync(customerId);

                var dtos = orders.Select(o => new ScheduledOrderDto
                {
                    Id = o.Id,
                    CustomerId = o.PosCustomerId,
                    CustomerName = $"{o.CustomerFirstName} {o.CustomerLastName}",
                    ScheduledDateTime = o.ScheduledDateTime,
                    Status = o.Status,
                    Items = JsonSerializer.Deserialize<ScheduledOrderItemDto[]>(o.ItemsJson)?.ToList() ?? new(),
                    Subtotal = o.Subtotal,
                    TaxAmount = o.TaxAmount,
                    TotalAmount = o.TotalAmount,
                    SpecialInstructions = o.SpecialInstructions,
                    ConfirmationCode = $"SCH-{o.Id:D6}",
                    ReleasedDateTime = o.ReleasedDateTime,
                    PosOrderNumber = o.PosOrderNumber,
                    CreatedAt = o.CreatedAt,
                    CanCancel = o.Status == "pending" && o.ScheduledDateTime > DateTime.UtcNow.AddHours(1)
                });

                return Ok(dtos);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving scheduled orders for customer {CustomerId}", customerId);
                return StatusCode(500, new { error = "Failed to retrieve orders" });
            }
        }

        /// <summary>
        /// Cancel a scheduled order (only if status is pending and >1 hour before pickup)
        /// </summary>
        [HttpPost("{id}/cancel")]
        public async Task<ActionResult> Cancel(int id, [FromBody] string reason = "Customer requested")
        {
            try
            {
                var order = await _scheduledOrderRepo.GetByIdAsync(id);
                if (order == null)
                {
                    return NotFound(new { error = "Order not found" });
                }

                // Check if can cancel
                if (order.Status != "pending")
                {
                    return BadRequest(new { error = $"Cannot cancel order with status: {order.Status}" });
                }

                if (order.ScheduledDateTime <= DateTime.UtcNow.AddHours(1))
                {
                    return BadRequest(new { error = "Cannot cancel orders within 1 hour of pickup time" });
                }

                var success = await _scheduledOrderRepo.CancelAsync(id, reason);
                if (success)
                {
                    _logger.LogInformation("Scheduled order {OrderId} cancelled: {Reason}", id, reason);
                    return Ok(new { success = true, message = "Order cancelled successfully" });
                }

                return BadRequest(new { error = "Failed to cancel order" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error cancelling scheduled order {OrderId}", id);
                return StatusCode(500, new { error = "Failed to cancel order" });
            }
        }

        /// <summary>
        /// Get available time slots for a specific date
        /// </summary>
        [HttpGet("timeslots")]
        [AllowAnonymous]
        public async Task<ActionResult<AvailableTimeSlotsResponse>> GetTimeSlots(
            [FromQuery] DateTime date,
            [FromQuery] int leadTimeMinutes = 30)
        {
            try
            {
                // Generate time slots from 11:00 AM to 9:00 PM
                var slots = new System.Collections.Generic.List<TimeSlotDto>();
                var startTime = new TimeSpan(11, 0, 0);
                var endTime = new TimeSpan(21, 0, 0);
                var interval = TimeSpan.FromMinutes(15);

                var currentTime = startTime;
                var minTime = DateTime.UtcNow.AddMinutes(leadTimeMinutes);

                while (currentTime <= endTime)
                {
                    var slotDateTime = date.Date + currentTime;
                    var isAvailable = slotDateTime > minTime && slotDateTime > DateTime.UtcNow;

                    slots.Add(new TimeSlotDto
                    {
                        Time = currentTime.ToString(@"hh\:mm"),
                        DisplayText = DateTime.Today.Add(currentTime).ToString("h:mm tt"),
                        IsAvailable = isAvailable
                    });

                    currentTime = currentTime.Add(interval);
                }

                return Ok(new AvailableTimeSlotsResponse
                {
                    Date = date.Date,
                    AvailableSlots = slots.Where(s => s.IsAvailable).ToList(),
                    RestaurantOpenTime = "11:00 AM",
                    RestaurantCloseTime = "9:00 PM",
                    LeadTimeMinutes = leadTimeMinutes
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error generating time slots");
                return StatusCode(500, new { error = "Failed to generate time slots" });
            }
        }
    }
}
