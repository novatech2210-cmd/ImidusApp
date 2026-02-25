# Testing Patterns

**Analysis Date:** 2026-02-25

## Test Framework

**Runner:**
- **Web (Next.js):** No test runner configured - ESLint only
- **Mobile (React Native):** Jest v29.6.3
  - Config: `/home/kali/Desktop/TOAST/src/mobile/ImidusCustomerApp/jest.config.js`
  - Preset: `react-native`
- **Backend (.NET Core):** xUnit (v2 implied by `[Fact]` and `[Theory]` attributes)
  - Test project: `/home/kali/Desktop/TOAST/src/backend/IntegrationService.Tests`

**Assertion Library:**
- Mobile/React Native: Jest built-in assertions
- Backend: xUnit assertions (e.g., `Assert.Equal()`, `Assert.Single()`, `Assert.True()`)

**Run Commands:**
```bash
# Mobile app
npm test                # Run all tests
npm run test -- --watch # Watch mode

# Backend (.NET)
dotnet test             # Run all tests

# Web (Next.js)
npm run lint            # ESLint only, no unit tests
```

## Test File Organization

**Location:**
- Mobile: `__tests__/` directory co-located with source: `/home/kali/Desktop/TOAST/src/mobile/ImidusCustomerApp/__tests__/App.test.tsx`
- Backend: Separate project `/home/kali/Desktop/TOAST/src/backend/IntegrationService.Tests/`
- Web: None detected

**Naming:**
- Mobile: `*.test.tsx` suffix
- Backend: `*Tests.cs` suffix (e.g., `OrderServiceTests.cs`, `LoyaltyServiceTests.cs`)

**Structure:**
```
mobile/ImidusCustomerApp/
├── __tests__/
│   └── App.test.tsx
├── src/
│   ├── screens/
│   ├── store/
│   └── api/

backend/
├── IntegrationService.Tests/
│   ├── OrderServiceTests.cs
│   ├── LoyaltyServiceTests.cs
│   └── UnitTest1.cs
```

## Test Structure

**Suite Organization (Backend - xUnit):**
```csharp
// From OrderServiceTests.cs
public class OrderServiceTests
{
    private readonly Mock<IOrderRepository> _orderRepoMock = new();
    private readonly Mock<IMenuRepository> _menuRepoMock = new();
    private readonly OrderService _orderService;

    // Constructor: One-time setup for all tests
    public OrderServiceTests()
    {
        var mockTransaction = new Mock<IDbTransaction>();
        _orderRepoMock.Setup(r => r.BeginTransactionAsync()).ReturnsAsync(mockTransaction.Object);

        _orderService = new OrderService(
            _orderRepoMock.Object,
            _menuRepoMock.Object,
            // ... other dependencies
        );
    }

    [Fact]
    public async Task PlaceOrder_ShouldCalculateTaxesCorrectly()
    {
        // Arrange
        var taxRates = new Dictionary<string, decimal> { /* ... */ };

        // Act
        var result = await _orderService.PlaceOrderAsync(request);

        // Assert
        Assert.Equal(10.0m, result.SubTotal);
    }
}
```

**Patterns:**
- Setup: Constructor runs once per test class; individual test setup via Arrange section
- Teardown: No explicit teardown observed; mocks are reset between tests
- Assertion: Direct assertions with descriptive messages via xUnit

**Mobile Test (Jest - React Native):**
```typescript
// From App.test.tsx
import 'react-native';
import React from 'react';
import App from '../App';
import { it } from '@jest/globals';
import renderer from 'react-test-renderer';

it('renders correctly', () => {
  renderer.create(<App />);
});
```

## Mocking

**Framework:**
- Backend: Moq (xUnit/C#)
- Mobile/Jest: Jest mocking (not explicitly used in sample, but available)

**Patterns (Backend - Moq):**
```csharp
// From OrderServiceTests.cs
private readonly Mock<IOrderRepository> _orderRepoMock = new();

// Setup mock behavior
_orderRepoMock.Setup(r => r.GetTaxRatesAsync())
    .ReturnsAsync(taxRates);

_paymentServiceMock
    .Setup(p => p.ProcessPaymentAsync(It.IsAny<decimal>(), It.IsAny<string>()))
    .ReturnsAsync((true, "AUTH123", (string?)null));

// Verify mock was called
_loyaltyServiceMock.Verify(l => l.RedeemPointsAsync(1, 500), Times.Once);
```

**What to Mock:**
- All repository dependencies
- External service dependencies (payment, loyalty, notification)
- Database transactions

**What NOT to Mock:**
- Service under test itself
- Domain models/entities
- Utility functions
- Business logic calculations

## Fixtures and Factories

**Test Data:**
```csharp
// From OrderServiceTests.cs - Inline model creation
var item = new OrderModels.MenuItem
{
    ItemID = 1,
    IName = "Test Coffee",
    ApplyGST = true,
    ApplyPST = true,
    AvailableSizes = new List<OrderModels.AvailableSize>
    {
        new OrderModels.AvailableSize { SizeID = 1, SizeName = "Large", UnitPrice = 10.0m }
    }
};

var request = new OrderModels.OrderRequest
{
    Items = new List<OrderModels.OrderItemRequest>
    {
        new OrderModels.OrderItemRequest { ItemId = 1, SizeId = 1, Quantity = 1 }
    },
    TipAmount = 2.0m,
    PaymentToken = "tok_123"
};
```

**Location:**
- Inline in test methods (current pattern)
- No separate fixtures directory or factory classes detected

## Coverage

**Requirements:** Not enforced - no coverage reporting configured

**View Coverage:** Not configured for any test runner

## Test Types

**Unit Tests:**
- Scope: Individual service methods in isolation with mocked dependencies
- Approach: xUnit `[Fact]` tests with Arrange-Act-Assert pattern
- Example: `PlaceOrder_ShouldCalculateTaxesCorrectly()` tests tax calculation logic with mocked repositories

**Integration Tests:**
- Not detected; backend tests use mocks rather than real database

**E2E Tests:**
- Not detected; no Playwright or Cypress configuration found

## Common Patterns

**Async Testing:**
```csharp
// From OrderServiceTests.cs
[Fact]
public async Task PlaceOrder_ShouldCalculateTaxesCorrectly()
{
    // Use async/await naturally
    var result = await _orderService.PlaceOrderAsync(request);

    // Assertions directly on result
    Assert.Equal(10.0m, result.SubTotal);
}
```

**Error Testing:**
- Not explicitly demonstrated in samples
- Likely follows Arrange-Act-Assert with expected error state in result object:
  ```csharp
  // Pattern inferred from OrderService.cs
  if (menuItem == null)
    return new OrderModels.OrderResult
    {
      Success = false,
      ErrorMessage = $"Item {itemRequest.ItemId} not found"
    };
  ```

**Naming Convention:**
- Test method names follow pattern: `[MethodUnderTest]_[Scenario]_[ExpectedBehavior]`
- Examples:
  - `PlaceOrder_ShouldCalculateTaxesCorrectly()`
  - `PlaceOrder_ShouldApplyLoyaltyDiscount()`

## Coverage Gaps

**Not Tested:**
- Web (Next.js) - No unit tests configured
- Mobile - Only one smoke test (`App.test.tsx` renders without crashing)
- Database integration - All tests use mocks
- API endpoint behavior - No E2E tests

**Risk:** Logic errors in untested layers could reach production undetected

---

*Testing analysis: 2026-02-25*
