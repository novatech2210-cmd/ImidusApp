namespace IntegrationService.Core.Interfaces;

public interface IPaymentService
{
    Task<(bool Success, string? AuthorizationCode, string? Message)> ProcessPaymentAsync(decimal amount, string paymentToken);
}
