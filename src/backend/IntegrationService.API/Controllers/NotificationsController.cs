using Microsoft.AspNetCore.Mvc;
using IntegrationService.Core.Interfaces;
using IntegrationService.Core.Domain.Entities;

namespace IntegrationService.API.Controllers;

/// <summary>
/// Notification management API
/// Handles FCM token registration for mobile apps
/// </summary>
[ApiController]
[Route("api/[controller]")]
public class NotificationsController : ControllerBase
{
    private readonly IDeviceTokenRepository _tokenRepository;
    private readonly ILogger<NotificationsController> _logger;

    public NotificationsController(
        IDeviceTokenRepository tokenRepository,
        ILogger<NotificationsController> logger)
    {
        _tokenRepository = tokenRepository;
        _logger = logger;
    }

    /// <summary>
    /// Register FCM token for push notifications
    /// </summary>
    /// <param name="request">Token registration details</param>
    /// <returns>200 OK on success, 400 BadRequest on validation failure</returns>
    [HttpPost("register-token")]
    public async Task<IActionResult> RegisterToken([FromBody] RegisterTokenRequest request)
    {
        // Validation
        if (string.IsNullOrWhiteSpace(request.Token))
        {
            return BadRequest(new { error = "Token is required" });
        }

        if (request.Platform != "ios" && request.Platform != "android")
        {
            return BadRequest(new { error = "Platform must be 'ios' or 'android'" });
        }

        if (request.CustomerId <= 0)
        {
            return BadRequest(new { error = "CustomerId must be greater than 0" });
        }

        _logger.LogInformation("Registering FCM token for customer {CustomerId}, platform {Platform}",
            request.CustomerId, request.Platform);

        // Check if token already exists
        var existingToken = await _tokenRepository.GetByTokenAsync(request.Token);

        if (existingToken != null)
        {
            // Token exists - update it
            if (!existingToken.IsActive)
            {
                // Reactivate inactive token
                await _tokenRepository.ReactivateAsync(existingToken.Id);
                _logger.LogInformation("Reactivated token {TokenId} for customer {CustomerId}",
                    existingToken.Id, request.CustomerId);
            }
            else
            {
                // Already active - just update LastActive (idempotent)
                existingToken.LastActive = DateTime.UtcNow;
                await _tokenRepository.UpdateAsync(existingToken);
                _logger.LogInformation("Updated LastActive for token {TokenId}", existingToken.Id);
            }

            return Ok(new { message = "Token registered successfully", tokenId = existingToken.Id });
        }

        // Insert new token
        var newToken = new DeviceToken
        {
            CustomerId = request.CustomerId,
            Token = request.Token,
            Platform = request.Platform,
            IsActive = true,
            LastActive = DateTime.UtcNow,
            CreatedAt = DateTime.UtcNow
        };

        var tokenId = await _tokenRepository.InsertAsync(newToken);
        _logger.LogInformation("Registered new token {TokenId} for customer {CustomerId}", tokenId, request.CustomerId);

        return Ok(new { message = "Token registered successfully", tokenId });
    }

    /// <summary>
    /// Request model for token registration
    /// </summary>
    public class RegisterTokenRequest
    {
        public string Token { get; set; } = string.Empty;
        public string Platform { get; set; } = string.Empty;
        public int CustomerId { get; set; }
    }
}
