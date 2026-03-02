using IntegrationService.Core.Interfaces;
using IntegrationService.Core.Domain.Entities;
using IntegrationService.Infrastructure.Data;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Configuration;
using FirebaseAdmin.Messaging;

namespace IntegrationService.Infrastructure.Services;

/// <summary>
/// Firebase Cloud Messaging notification service
/// Sends push notifications with retry logic and token management
/// </summary>
public class FcmNotificationService : INotificationService
{
    private readonly ILogger<FcmNotificationService> _logger;
    private readonly IDeviceTokenRepository _tokenRepository;
    private readonly NotificationLogRepository _logRepository;
    private readonly IConfiguration _configuration;

    public FcmNotificationService(
        ILogger<FcmNotificationService> logger,
        IDeviceTokenRepository tokenRepository,
        NotificationLogRepository logRepository,
        IConfiguration configuration)
    {
        _logger = logger;
        _tokenRepository = tokenRepository;
        _logRepository = logRepository;
        _configuration = configuration;
    }

    /// <summary>
    /// Send notification to all active devices for a customer
    /// Includes retry logic and automatic token invalidation
    /// </summary>
    public async Task SendNotificationAsync(int customerId, string title, string body, Dictionary<string, string>? data = null)
    {
        var tokens = await _tokenRepository.GetActiveTokensByCustomerIdAsync(customerId);
        var tokenList = tokens.ToList();

        if (!tokenList.Any())
        {
            _logger.LogWarning("No active tokens found for customer {CustomerId}", customerId);
            return;
        }

        _logger.LogInformation("Sending notification to {Count} devices for customer {CustomerId}", tokenList.Count, customerId);

        foreach (var deviceToken in tokenList)
        {
            await SendToDeviceWithRetryAsync(deviceToken, title, body, data ?? new Dictionary<string, string>());
        }
    }

    /// <summary>
    /// Send notification to a single device with exponential backoff retry
    /// </summary>
    private async Task SendToDeviceWithRetryAsync(DeviceToken deviceToken, string title, string body, Dictionary<string, string> data)
    {
        const int maxRetries = 3;
        var delays = new[] { 1000, 3000, 9000 }; // Exponential backoff: 1s, 3s, 9s

        for (int attempt = 0; attempt < maxRetries; attempt++)
        {
            try
            {
                var message = BuildMessage(deviceToken, title, body, data);
                var response = await FirebaseMessaging.DefaultInstance.SendAsync(message);

                // Success - update LastActive and log
                deviceToken.LastActive = DateTime.UtcNow;
                await _tokenRepository.UpdateAsync(deviceToken);

                await LogNotificationAsync(deviceToken, title, body, "success", response);

                _logger.LogInformation("Notification sent successfully to token {TokenId} (attempt {Attempt})",
                    deviceToken.Id, attempt + 1);

                return; // Success, exit retry loop
            }
            catch (FirebaseMessagingException ex) when (IsTokenInvalid(ex))
            {
                // Token is invalid/unregistered - mark inactive and don't retry
                _logger.LogWarning("Invalid token {TokenId} for customer {CustomerId}: {Error}",
                    deviceToken.Id, deviceToken.CustomerId, ex.Message);

                await _tokenRepository.MarkInactiveAsync(deviceToken.Id);
                await LogNotificationAsync(deviceToken, title, body, "failed", $"Token invalidated: {ex.Message}");

                return; // Don't retry invalid tokens
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to send notification to token {TokenId} (attempt {Attempt}/{MaxRetries})",
                    deviceToken.Id, attempt + 1, maxRetries);

                if (attempt < maxRetries - 1)
                {
                    // Wait before retry
                    await Task.Delay(delays[attempt]);
                    await LogNotificationAsync(deviceToken, title, body, "retry", $"Retry {attempt + 1}: {ex.Message}");
                }
                else
                {
                    // Final failure
                    await LogNotificationAsync(deviceToken, title, body, "failed", ex.Message);
                    _logger.LogError(ex, "Failed to send notification to token {TokenId} after {MaxRetries} attempts",
                        deviceToken.Id, maxRetries);
                }
            }
        }
    }

    /// <summary>
    /// Build FCM message with platform-specific configuration
    /// </summary>
    private Message BuildMessage(DeviceToken deviceToken, string title, string body, Dictionary<string, string> data)
    {
        var message = new Message
        {
            Token = deviceToken.Token,
            Notification = new Notification
            {
                Title = title,
                Body = body
            },
            Data = data
        };

        // Platform-specific configuration
        if (deviceToken.Platform == "android")
        {
            message.Android = new AndroidConfig
            {
                Priority = Priority.High,
                Notification = new AndroidNotification
                {
                    ChannelId = "order_updates",
                    Priority = NotificationPriority.HIGH
                }
            };
        }
        else if (deviceToken.Platform == "ios")
        {
            message.Apns = new ApnsConfig
            {
                Headers = new Dictionary<string, string>
                {
                    ["apns-priority"] = "5" // High priority
                },
                Aps = new Aps
                {
                    Sound = "default"
                }
            };
        }

        return message;
    }

    /// <summary>
    /// Check if exception indicates an invalid/unregistered token
    /// </summary>
    private bool IsTokenInvalid(FirebaseMessagingException ex)
    {
        return ex.MessagingErrorCode == MessagingErrorCode.Unregistered ||
               ex.MessagingErrorCode == MessagingErrorCode.InvalidArgument;
    }

    /// <summary>
    /// Log notification attempt to audit trail
    /// </summary>
    private async Task LogNotificationAsync(DeviceToken deviceToken, string title, string body, string status, string? response)
    {
        var log = new NotificationLog
        {
            CustomerId = deviceToken.CustomerId,
            DeviceTokenId = deviceToken.Id,
            NotificationType = "order_notification",
            Title = title,
            Body = body,
            Status = status,
            FcmResponse = response,
            CreatedAt = DateTime.UtcNow
        };

        await _logRepository.InsertAsync(log);
    }

    /// <summary>
    /// Broadcast notifications (deferred to M4 - marketing campaigns)
    /// </summary>
    public Task SendBroadcastNotificationAsync(string title, string body, Dictionary<string, string>? data = null)
    {
        throw new NotImplementedException("Marketing campaigns deferred to M4");
    }
}
