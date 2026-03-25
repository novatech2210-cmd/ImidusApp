using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.DependencyInjection;
using IntegrationService.Core.Interfaces;
using IntegrationService.Infrastructure.Data;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace IntegrationService.Infrastructure.Services;

/// <summary>
/// Background service that polls POS database for completed orders and sends push notifications.
/// Runs every 2 minutes (discretionary choice balancing DB load vs notification speed).
/// </summary>
public class OrderStatusPollingService : BackgroundService
{
    private readonly IServiceProvider _services;
    private readonly ILogger<OrderStatusPollingService> _logger;
    private bool _firstRun = true;

    public OrderStatusPollingService(
        IServiceProvider services,
        ILogger<OrderStatusPollingService> logger)
    {
        _services = services;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("Order Status Polling Service started with 2-minute interval (discretionary choice).");

        using PeriodicTimer timer = new(TimeSpan.FromMinutes(2));

        try
        {
            while (await timer.WaitForNextTickAsync(stoppingToken))
            {
                // Run cleanup on first tick only
                if (_firstRun)
                {
                    await CleanupInactiveTokensAsync(stoppingToken);
                    _firstRun = false;
                }

                await PollOrderStatusAsync(stoppingToken);
            }
        }
        catch (OperationCanceledException)
        {
            _logger.LogInformation("Order Status Polling Service stopping.");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Order Status Polling Service encountered error.");
        }
    }

    /// <summary>
    /// Poll POS database for completed orders and send ready notifications.
    /// </summary>
    private async Task PollOrderStatusAsync(CancellationToken stoppingToken)
    {
        try
        {
            using var scope = _services.CreateScope();

            var posRepo = scope.ServiceProvider.GetRequiredService<IPosRepository>();
            var statusRepo = scope.ServiceProvider.GetRequiredService<IOnlineOrderStatusRepository>();
            var notificationService = scope.ServiceProvider.GetRequiredService<INotificationService>();

            // Query completed orders from POS database (TransType=9)
            var completedOrders = await posRepo.GetCompletedOnlineOrdersAsync();

            _logger.LogDebug("Found {Count} completed online orders to check.", completedOrders.Count());

            foreach (var order in completedOrders)
            {
                try
                {
                    // Check if we've already sent ready notification for this order
                    var status = await statusRepo.GetBySalesIdAsync(order.ID);

                    if (status == null)
                    {
                        // First time seeing this order - create status record
                        status = new Core.Domain.Entities.OnlineOrderStatus
                        {
                            SalesId = order.ID,
                            ReadyNotificationSent = false,
                            ConfirmationNotificationSent = false,
                            LastCheckedAt = DateTime.UtcNow,
                            CreatedAt = DateTime.UtcNow
                        };

                        await statusRepo.InsertAsync(status);
                    }

                    // Send ready notification if not already sent
                    if (!status.ReadyNotificationSent)
                    {
                        // Send "Order ready for pickup" notification
                        await notificationService.SendNotificationAsync(
                            order.CustomerID!.Value,
                            "Order ready for pickup!",
                            $"Order #{order.DailyOrderNumber} is ready.",
                            new Dictionary<string, string>
                            {
                                { "type", "order_ready" },
                                { "orderId", order.ID.ToString() },
                                { "screen", "OrderTracking" }
                            }
                        );

                        // Mark as sent
                        status.ReadyNotificationSent = true;
                        status.LastCheckedAt = DateTime.UtcNow;
                        await statusRepo.UpdateAsync(status);

                        _logger.LogInformation("Sent order ready notification for Order #{OrderNumber} (SalesID {SalesId})",
                            order.DailyOrderNumber, order.ID);
                    }
                }
                catch (Exception ex)
                {
                    // Log error but continue processing other orders
                    _logger.LogError(ex, "Failed to process notification for SalesID {SalesId}", order.ID);
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during order status polling.");
        }
    }

    /// <summary>
    /// Cleanup inactive device tokens and old notification logs.
    /// Runs once on service startup.
    /// </summary>
    private async Task CleanupInactiveTokensAsync(CancellationToken stoppingToken)
    {
        try
        {
            using var scope = _services.CreateScope();

            var deviceTokenRepo = scope.ServiceProvider.GetRequiredService<IDeviceTokenRepository>();
            var notificationLogRepo = scope.ServiceProvider.GetRequiredService<INotificationLogRepository>();

            // Delete inactive tokens older than 30 days
            var staleTokensDeleted = await deviceTokenRepo.DeleteStaleTokensAsync(30);

            if (staleTokensDeleted > 0)
            {
                _logger.LogInformation("Cleaned up {Count} stale device tokens (inactive >30 days).", staleTokensDeleted);
            }

            // Delete notification logs older than 90 days
            var oldLogsDeleted = await notificationLogRepo.DeleteOldLogsAsync(90);

            if (oldLogsDeleted > 0)
            {
                _logger.LogInformation("Cleaned up {Count} old notification logs (>90 days).", oldLogsDeleted);
            }

            _logger.LogInformation("Cleanup task completed on service startup.");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during token cleanup.");
        }
    }
}
