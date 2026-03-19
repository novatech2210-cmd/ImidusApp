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
                var serviceRequest = new Core.Models.CreateOrderRequest
                {
                    CustomerID = request.CustomerId,
                    Items = request.Items.Select(i => new Core.Models.OrderItemRequest
                    {
                        MenuItemId = i.MenuItemId,
                        SizeId = i.SizeId,
                        Quantity = i.Quantity,
                        UnitPrice = i.UnitPrice
                    }).ToList(),
                    PaymentAuthCode = request.PaymentAuthorizationNo,
                    PaymentBatchNo = int.TryParse(request.PaymentBatchNo, out var batchNo) ? batchNo : null,
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

        /// <summary>
        /// Process payment and complete an open order
        /// </summary>
        [HttpPost("{salesId}/complete-payment")]
        [ProducesResponseType(typeof(OrderCompletionResult), 200)]
        [ProducesResponseType(typeof(OrderCompletionResult), 400)]
        public async Task<IActionResult> CompletePayment(
            int salesId,
            [FromBody] PaymentRequest paymentRequest)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(new OrderCompletionResult
                {
                    Success = false,
                    ErrorMessage = "Invalid payment request"
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
                    paymentRequest);

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
    }
}
