---
name: fcm-push-notifications
description: Activate when implementing Firebase Cloud Messaging push notifications for transactional order updates, marketing campaigns, or birthday rewards. Covers device token management, modern Admin SDK sending (HTTP v1 API), and RFM audience targeting via SQL. Legacy server key is deprecated — use service account JSON.
color: orange
icon: bell
---

# FCM Push Notifications Skill

**Activation Triggers**  
- Mentions of "FCM", "Firebase Cloud Messaging", "push notification", "device token", "RFM", "birthday reward", "campaign send", "order update notification"

## Overview
IMIDUS sends two types of push notifications via **Firebase Cloud Messaging (FCM)**:
1. **Transactional** — Order status updates (e.g., "Preparing", "Ready for Pickup")
2. **Marketing Campaigns** — Admin broadcasts with RFM segmentation
3. **Birthday Rewards** — Automated annual messages + loyalty points

All server-side sending uses the **Firebase Admin SDK for .NET** (HTTP v1 API — legacy protocol deprecated June 2024).

## Environment Variables & Setup
```bash
# Required: Path to Firebase service account JSON (download from Firebase Console → Project Settings → Service Accounts → Generate new private key)
GOOGLE_APPLICATION_CREDENTIALS=/path/to/imidus-firebase-adminsdk-abc123.json
# Optional: For local dev/testing
FCM_PROJECT_ID=your-project-id
NuGet Packages (install in backend):
textFirebaseAdmin
Initialization (in Program.cs or startup):
C#using FirebaseAdmin;
using Google.Apis.Auth.OAuth2;

// One-time init (e.g., in Startup or Program)
FirebaseApp.Create(new AppOptions()
{
    Credential = GoogleCredential.FromFile(Environment.GetEnvironmentVariable("GOOGLE_APPLICATION_CREDENTIALS"))
});
Device Token Registration
API: POST /api/notifications/register
C#// NotificationsController.cs
[HttpPost("register")]
public async Task<IActionResult> RegisterToken([FromBody] RegisterTokenRequest req)
{
    await _deviceTokenRepo.UpsertAsync(req.CustomerId, req.Token, req.Platform);
    return Ok();
}
Storage (IntegrationService.DeviceTokens table):
SQLCREATE TABLE DeviceTokens (
    CustomerID INT NOT NULL,
    Token NVARCHAR(500) NOT NULL,
    Platform NVARCHAR(10) NOT NULL, -- 'ios' OR 'android'
    UpdatedAt DATETIME NOT NULL DEFAULT GETDATE(),
    PRIMARY KEY (CustomerID, Platform)
)
Transactional Notifications (Order Status)
C#// FcmNotificationService.cs (using FirebaseAdmin.Messaging)
public async Task SendOrderStatusAsync(int customerId, int salesId, string status)
{
    var tokens = await _deviceTokenRepo.GetTokensForCustomerAsync(customerId);
    if (!tokens.Any()) return;

    var messages = tokens.Select(token => new Message
    {
        Token = token.Token,
        Notification = new Notification
        {
            Title = "Order Update",
            Body = $"Your order #{salesId} is now {status}"
        },
        Data = new Dictionary<string, string>
        {
            { "orderId", salesId.ToString() },
            { "status", status },
            { "type", "transactional" }
        },
        Android = new AndroidConfig { Priority = Priority.High }, // Optional
        Apns = new ApnsConfig { Headers = { { "apns-priority", "10" } } } // Optional
    }).ToList();

    // Use multicast for efficiency (up to 500 tokens)
    var multicastMessage = new MulticastMessage
    {
        Tokens = tokens.Select(t => t.Token).ToList(),
        Notification = messages.First().Notification,
        Data = messages.First().Data
    };

    var response = await FirebaseMessaging.DefaultInstance.SendMulticastAsync(multicastMessage);

    // Log failures
    if (response.FailureCount > 0)
    {
        foreach (var resp in response.Responses.Where(r => !r.IsSuccess))
        {
            _logger.LogWarning("FCM send failed for token: {Token} - {Error}", /* token */, resp.Exception?.Message);
            // Optionally remove invalid token from DB
        }
    }
}
Trigger example:
C#await _fcmService.SendOrderStatusAsync(customerId, salesId, "Preparing");
Marketing Campaigns (RFM Targeting)
Campaign Model (unchanged — good):
C#public class PushCampaign { /* ... Audience = "all" | "rfm_high_value" | ... */ }
RFM SQL Examples (POS DB):
SQL-- High-value: > @MinSpend in last 60 days, >= @MinFrequency visits
SELECT DISTINCT s.CustomerID
FROM dbo.tblSales s
WHERE s.TransType = 1
  AND s.CustomerID IS NOT NULL
  AND s.SaleDateTime >= DATEADD(DAY, -60, GETDATE())
GROUP BY s.CustomerID
HAVING SUM(s.SubTotal + s.GSTAmt + s.PSTAmt) >= @MinSpend
   AND COUNT(s.ID) >= @MinFrequency;

-- At-risk: Ordered 30-90 days ago, none in last 30
SELECT c.CustomerNum
FROM dbo.tblCustomer c
WHERE EXISTS (
    SELECT 1 FROM dbo.tblSales s
    WHERE s.CustomerID = c.CustomerNum
      AND s.TransType = 1
      AND s.SaleDateTime >= DATEADD(DAY, -90, GETDATE())
      AND s.SaleDateTime < DATEADD(DAY, -30, GETDATE())
)
AND NOT EXISTS (
    SELECT 1 FROM dbo.tblSales s2
    WHERE s2.CustomerID = c.CustomerNum
      AND s2.TransType = 1
      AND s2.SaleDateTime >= DATEADD(DAY, -30, GETDATE())
);
Dispatch:
C#// Use similar multicast logic as above, targeting multiple customer tokens
await _fcmService.SendCampaignAsync(campaign.Title, campaign.Body, customerTokens);
Birthday Reward Notifications
Background Service (unchanged logic — solid):
C#// BirthdayRewardService.cs
protected override async Task ExecuteAsync(CancellationToken stoppingToken)
{
    while (!stoppingToken.IsCancellationRequested)
    {
        var today = DateTime.Today;
        var customers = await _birthdayRepo.GetTodaysBirthdaysAsync(today.Month, today.Day);
        foreach (var cust in customers)
        {
            await _posRepo.AddLoyaltyPointsAsync(cust.CustomerNum, rewardPoints);
            await _fcmService.SendBirthdayNotificationAsync(cust.CustomerNum, cust.FName);
            await _birthdayRepo.MarkRewardSentAsync(cust.CustomerNum, today.Year);
        }
        await Task.Delay(TimeSpan.FromHours(24), stoppingToken);
    }
}
Notification Log
(unchanged — good audit table)
Mobile App: Receiving (React Native)
(unchanged — @react-native-firebase/messaging is current and correct)
Best Practices

Always handle SendResponse.FailureCount and clean invalid tokens.
Use dry_run: true in dev for testing (via Admin SDK options).
For large campaigns (>500 tokens), batch multicast calls.
Monitor quota in Firebase Console.

Last Updated: March 17, 2026 — Migrated to Firebase Admin SDK / HTTP v1 (legacy key removed).
