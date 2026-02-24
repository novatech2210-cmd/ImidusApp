using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using IntegrationService.Core.Domain.Entities;

using IntegrationService.Core.Services;

namespace IntegrationService.Core.Interfaces
{
    public interface IOrderProcessingService
    {
        Task<OrderResult> CreateOrderAsync(CreateOrderRequest request, string idempotencyKey);
    }
}
