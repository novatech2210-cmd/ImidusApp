using Microsoft.AspNetCore.Mvc;
using IntegrationService.Core.Interfaces;
using IntegrationService.Core.Domain.Entities;
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
        private readonly ILogger<OrdersController> _logger;

        public OrdersController(IOrderProcessingService orderService, ILogger<OrdersController> logger)
        {
            _orderService = orderService;
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
                    PaymentTypeID = request.PaymentTypeId,
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
