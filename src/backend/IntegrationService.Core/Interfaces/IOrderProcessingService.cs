using IntegrationService.Core.Domain.Entities;
using IntegrationService.Core.Interfaces;
using IntegrationService.Core.Models;
using System;
using System.Collections.Generic;
using System.Data;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;

namespace IntegrationService.Core.Interfaces
{
    public interface IOrderProcessingService
    {
        Task<IntegrationService.Core.Domain.Entities.OrderResult> CreateOrderAsync(IntegrationService.Core.Models.CreateOrderRequest request, string idempotencyKey);
        Task<IntegrationService.Core.Models.OrderCompletionResult> ProcessPaymentAndCompleteOrderAsync(int salesId, IntegrationService.Core.Models.PaymentRequest paymentRequest, System.Data.IDbTransaction? outerTransaction = null);
        Task<bool> CompleteOrderAsync(int salesId);
        Task<bool> CancelOrderAsync(int salesId);
        Task<IntegrationService.Core.Domain.Entities.PosTicket?> GetOrderAsync(int salesId);
    }
}
