using Microsoft.AspNetCore.Mvc;
using IntegrationService.Core.Interfaces;
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
