---
name: fcm-push-notifications
description: Activate when implementing Firebase Cloud Messaging push notifications for transactional order updates or marketing campaigns. Covers device token management, notification payload structure, and campaign targeting via RFM customer segmentation SQL queries.
---

# FCM Push Notifications Skill

## Overview

The IMIDUS platform sends two types of push notifications:

1. **Transactional** — Order status updates triggered by order lifecycle events
2. **Marketing Campaigns** — Admin-created broadcast campaigns with RFM audience targeting

Both paths go through `FcmNotificationService` in the backend.

---

## Environment Variables

```bash
FCM_SERVER_KEY=...                    # Firebase Server Key (from Firebase Console → Project Settings → Cloud Messaging)
FCM_PROJECT_ID=...                    # Firebase project ID
# OR use Service Account JSON:
GOOGLE_APPLICATION_CREDENTIALS=/path/to/firebase-service-account.json
```

---

## Device Token Registration

Customers register their device push token when logging in or opening the app:

**API endpoint:** `POST /api/notifications/register`

```csharp
// NotificationsController.cs
[HttpPost("register")]
public async Task<IActionResult> RegisterToken([FromBody] RegisterTokenRequest req)
{
    await _deviceTokenRepo.UpsertAsync(req.CustomerId, req.Token, req.Platform);
    return Ok();
}
```

`DeviceTokenRepository` stores in `IntegrationService.DeviceTokens`:

```sql
-- IntegrationService DB (overlay)
CREATE TABLE DeviceTokens (
    CustomerID   INT NOT NULL,
    Token        NVARCHAR(500) NOT NULL,
    Platform     NVARCHAR(10) NOT NULL,  -- 'ios' or 'android'
    UpdatedAt    DATETIME NOT NULL,
    PRIMARY KEY (CustomerID, Platform)
)
```

---

## Transactional Notifications (Order Status)

Triggered automatically within the order lifecycle:

```csharp
// FcmNotificationService.cs
public async Task SendOrderStatusAsync(int customerId, int salesId, string status)
{
    var tokens = await _deviceTokenRepo.GetTokensForCustomerAsync(customerId);
    foreach (var token in tokens)
    {
        var message = new Message
        {
            Token = token.Token,
            Notification = new Notification
            {
                Title = "Order Update",
                Body  = $"Your order #{salesId} is now {status}"
            },
            Data = new Dictionary<string, string>
            {
                ["orderId"] = salesId.ToString(),
                ["status"]  = status
            }
        };
        await FirebaseMessaging.DefaultInstance.SendAsync(message);
    }
}
```

Call after each TransType change:

```csharp
// TransType=2 (Open/Preparing)
await _fcmService.SendOrderStatusAsync(customerId, salesId, "Preparing");

// TransType=1 (Completed/Ready)
await _fcmService.SendOrderStatusAsync(customerId, salesId, "Ready for Pickup");
```

---

## Marketing Campaigns (Admin Portal)

### Campaign Model

```csharp
// Core/Models/AdminPortal/PushCampaign.cs
public class PushCampaign
{
    public int    Id          { get; set; }
    public string Title       { get; set; } = "";
    public string Body        { get; set; } = "";
    public string Audience    { get; set; } = "all"; // "all", "rfm_high_value", "rfm_at_risk", "custom"
    public string? RfmFilter  { get; set; }          // JSON: { minSpend, minFreq, maxDaysSince }
    public DateTime? ScheduledAt { get; set; }        // null = send immediately
    public string Status      { get; set; } = "draft"; // draft, scheduled, sent
}
```

### RFM Audience Targeting SQL

The Admin creates campaigns with audience filters. The backend translates these to SQL against the POS DB:

```sql
-- High-value customers: Spend > $X AND Frequency > N visits in last 60 days
SELECT DISTINCT s.CustomerID
FROM dbo.tblSales s
WHERE s.TransType = 1
  AND s.CustomerID IS NOT NULL
  AND s.SaleDateTime >= DATEADD(day, -60, GETDATE())
GROUP BY s.CustomerID
HAVING SUM(s.SubTotal + s.GSTAmt + s.PSTAmt) >= @MinSpend
   AND COUNT(s.ID) >= @MinFrequency

-- At-risk customers: haven't ordered in 30-90 days
SELECT c.CustomerNum
FROM dbo.tblCustomer c
WHERE EXISTS (
    SELECT 1 FROM dbo.tblSales s
    WHERE s.CustomerID = c.CustomerNum
      AND s.TransType = 1
      AND s.SaleDateTime >= DATEADD(day, -90, GETDATE())
      AND s.SaleDateTime < DATEADD(day, -30, GETDATE())
)
```

> **SQL Server 2005**: No `OFFSET/FETCH`, no window functions. Use `SELECT TOP N` and `DATEADD/DATEDIFF`.

### Campaign Dispatch

```csharp
// AdminController.cs
[HttpPost("campaigns/{id}/send")]
public async Task<IActionResult> SendCampaign(int id)
{
    var campaign    = await _campaignRepo.GetAsync(id);
    var customerIds = await _posRepo.GetRfmAudienceAsync(campaign.RfmFilter);
    var tokens      = await _deviceTokenRepo.GetTokensForCustomersAsync(customerIds);

    await _fcmService.SendCampaignAsync(campaign.Title, campaign.Body, tokens);
    await _campaignRepo.MarkSentAsync(id);
    return Ok(new { sent = tokens.Count });
}
```

---

## Birthday Reward Notifications

The `BirthdayRewardService` background service runs daily:

```csharp
// BackgroundServices/BirthdayRewardService.cs
protected override async Task ExecuteAsync(CancellationToken stoppingToken)
{
    while (!stoppingToken.IsCancellationRequested)
    {
        var today = DateTime.Today;
        // Query CustomerBirthdayTracking (overlay table) for today's birthdays
        var customers = await _birthdayRepo.GetTodaysBirthdaysAsync(today.Month, today.Day);

        foreach (var customer in customers)
        {
            // Apply birthday reward (loyalty points)
            await _posRepo.AddLoyaltyPointsAsync(customer.CustomerNum, rewardPoints);
            // Send push notification
            await _fcmService.SendBirthdayNotificationAsync(customer.CustomerNum, customer.FName);
            // Mark as sent for this year
            await _birthdayRepo.MarkRewardSentAsync(customer.CustomerNum, today.Year);
        }

        await Task.Delay(TimeSpan.FromHours(24), stoppingToken);
    }
}
```

---

## Notification Log

All sent notifications are recorded in `IntegrationService.NotificationLog` (overlay table) for audit and analytics in the Admin Portal.

```csharp
await _notificationLogRepo.InsertAsync(new NotificationLog
{
    CustomerId    = customerId,
    Type          = "transactional" | "campaign" | "birthday",
    Title         = title,
    Body          = body,
    SentAt        = DateTime.UtcNow,
    CampaignId    = campaignId // null for transactional
});
```

---

## Mobile App: Receiving Notifications

**React Native** — both iOS and Android via `@react-native-firebase/messaging`:

```ts
// App.tsx or NotificationsProvider.tsx
import messaging from "@react-native-firebase/messaging";

// Request permission + register token
const token = await messaging().getToken();
await api.post("/notifications/register", { token, platform: Platform.OS });

// Handle foreground notifications
messaging().onMessage(async (remoteMessage) => {
  const { orderId, status } = remoteMessage.data ?? {};
  if (orderId) navigation.navigate("OrderStatus", { orderId });
});
```
