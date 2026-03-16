---
name: loyalty-and-customers
description: Activate when implementing customer authentication, profile management, loyalty points, or any feature that reads/writes tblCustomer, tblPointsDetail, tblPointReward, or the CustomerBirthdayTracking overlay table.
---

# Loyalty & Customers Skill

## Customer Identity: tblCustomer

```sql
-- PRIMARY KEY: CustomerNum (NOT CustomerID, NOT ID)
SELECT CustomerNum, FName, LName, Phone, Email, EarnedPoints
FROM dbo.tblCustomer
WHERE CustomerNum = @CustomerNum
```

> ⚠️ Always use `CustomerNum` as the FK in `tblSales.CustomerID`.

---

## Authentication Strategy

IMIDUS uses its own JWT authentication — credentials stored in `IntegrationService.AppUsers` (overlay DB, not POS DB).

```csharp
// AuthController.cs
[HttpPost("login")]
public async Task<IActionResult> Login([FromBody] LoginRequest req)
{
    var user = await _userRepo.FindByEmailAsync(req.Email);
    if (user == null || !BCrypt.Verify(req.Password, user.PasswordHash))
        return Unauthorized(new { error = "Invalid credentials" });

    var token = _jwtService.GenerateToken(user.Id, user.Email, user.Role);
    return Ok(new { token, customerId = user.PosCustomerNum });
}
```

The `PosCustomerNum` field links the app user to their `tblCustomer.CustomerNum` in the POS DB.

---

## Loyalty Points: Reading Balance

```csharp
// CustomerRepository.cs (reads from TPPro)
public async Task<int> GetLoyaltyPointsAsync(int customerNum)
{
    const string sql = "SELECT EarnedPoints FROM dbo.tblCustomer WHERE CustomerNum = @CustomerNum";
    using var conn = CreatePosConnection();
    return await conn.QuerySingleOrDefaultAsync<int>(sql, new { CustomerNum = customerNum });
}
```

---

## Loyalty Points: Earning Points

Points are earned when a transaction completes. The POS manages the calculation, but we can write to `tblPointsDetail` to record earned points from online orders:

```sql
INSERT INTO dbo.tblPointsDetail (
    CustomerNum,
    SalesID,
    PointSaved,
    PointUsed,
    PointDateTime,
    Remarks
)
VALUES (
    @CustomerNum,
    @SalesId,
    @PointsEarned,   -- positive = earned
    0,               -- 0 = not a redemption
    @DateTime,
    'Online Order'
)
```

Update the balance:

```sql
UPDATE dbo.tblCustomer
SET EarnedPoints = EarnedPoints + @PointsEarned
WHERE CustomerNum = @CustomerNum
```

---

## Loyalty Points: Redemption

```sql
-- Check available points first
SELECT EarnedPoints FROM dbo.tblCustomer WHERE CustomerNum = @CustomerNum

-- If sufficient, deduct points in transaction
UPDATE dbo.tblCustomer
SET EarnedPoints = EarnedPoints - @PointsToRedeem
WHERE CustomerNum = @CustomerNum
  AND EarnedPoints >= @PointsToRedeem  -- prevents going negative

INSERT INTO dbo.tblPointsDetail (CustomerNum, SalesID, PointSaved, PointUsed, PointDateTime, Remarks)
VALUES (@CustomerNum, @SalesId, 0, @PointsToRedeem, GETDATE(), 'Online Redemption')
```

Apply as discount in `tblSales.DSCAmt` (points → dollar value via `tblPointReward.PointValue`).

---

## Point Reward Configuration

```sql
SELECT PointValue, MinRedeemPoints, MaxRedeemPoints
FROM dbo.tblPointReward
```

Use these values to:

- Calculate how many points = $1 discount
- Enforce min/max redemption amounts

---

## Birthday Rewards

Birthday data is stored in the **overlay DB** (not POS — we can't add columns to `tblCustomer`):

```sql
-- IntegrationService DB
CREATE TABLE CustomerBirthdayTracking (
    CustomerNum    INT NOT NULL PRIMARY KEY,
    BirthMonth     INT,
    BirthDay       INT,
    LastRewardYear INT,
    UpdatedAt      DATETIME
)
```

Customers set their birthday in their Profile screen. The `BirthdayRewardService` background service checks this table daily.

---

## Customer Segmentation (RFM) for Admin

Recency-Frequency-Monetary queries for admin campaign targeting (SQL Server 2005 safe):

```sql
-- All customers with RFM metrics
SELECT
    s.CustomerID,
    COUNT(s.ID)                              AS Frequency,
    SUM(s.SubTotal + s.GSTAmt + s.PSTAmt)   AS TotalSpend,
    DATEDIFF(day, MAX(s.SaleDateTime), GETDATE()) AS DaysSinceLastOrder
FROM dbo.tblSales s
WHERE s.TransType = 1
  AND s.CustomerID IS NOT NULL
GROUP BY s.CustomerID
```

Apply filters in C# or via parameterized WHERE clauses — avoid dynamic SQL.

---

## Guest Checkout

If `CustomerID` is null in `OrderRequest`, the order is placed as a guest:

- Set `tblSales.CustomerID = NULL`
- No loyalty points earned
- Use `"Guest"` as customer name in `tblSalesOfOnlineOrders.OnlineOrderCustomerName`

---

## Profile Update (App)

Profile updates go to `IntegrationService.AppUsers` (overlay), NOT to `tblCustomer`.

Only the following fields sync back to `tblCustomer` on significant changes (e.g., phone, name — only if business requirement demands it):

```csharp
// CAUTION: Modifying tblCustomer requires careful merge logic
// The POS operator may have updated the record since last sync
// Default: do NOT write back to tblCustomer from the app
```

Phone number is the primary lookup key when registering a new customer who may already exist in POS.
