# Coding Conventions

**Analysis Date:** 2026-02-25

## Naming Patterns

**Files:**
- TypeScript/React files use PascalCase for components: `OrderPanel.tsx`, `CartContext.tsx`
- Utility/library files use camelCase: `api.ts`
- Test files use `.test.ts` or `.test.tsx` suffix: `App.test.tsx`
- C# files use PascalCase for classes: `OrderService.cs`, `OrdersController.cs`

**Functions:**
- TypeScript: camelCase for all functions and methods: `addItem()`, `removeItem()`, `updateQty()`
- C# async methods use Async suffix: `PlaceOrderAsync()`, `GetItemByIdAsync()`, `InsertTicketAsync()`
- React hooks follow `useHookName` pattern: `useCart()`, `useAuth()`

**Variables:**
- TypeScript: camelCase for regular variables and constants: `total`, `items`, `count`
- React state: camelCase: `const [error, setError] = useState()`
- C# private fields prefixed with underscore: `_orderRepo`, `_menuRepo`, `_logger`
- C# readonly properties: PascalCase: `Success`, `ErrorMessage`, `TotalAmount`

**Types/Interfaces:**
- React/TypeScript interfaces prefixed with `I` is NOT used; use bare interface names: `CartContextType`, `User`, `CartItem`
- C# interfaces prefixed with `I`: `IOrderRepository`, `IMenuRepository`, `IPaymentService`
- C# domain entities use descriptive names: `PosTicket`, `PosTicketItem`, `PosTender`
- DTOs use `DTO` suffix in C#: `CreateOrderRequest`, `OrderDTOs`

## Code Style

**Formatting:**
- TypeScript/React: Follows Next.js + ESLint defaults, no Prettier config found but styles are consistent
- Target: ES2017 (TypeScript `target`)
- JSX mode: `react-jsx` (automatic runtime)
- Indentation: 2 spaces observed in all TypeScript files
- C# follows standard .NET conventions with proper casing

**Linting:**
- ESLint (v9) with Next.js config: `eslint-config-next` core-web-vitals and TypeScript
- Config file: `/home/kali/Desktop/TOAST/src/web/eslint.config.mjs`
- Ignores: `.next/`, `out/`, `build/`, `next-env.d.ts`
- React Native uses ESLint (v8) via `@react-native/eslint-config`
- C# uses standard .NET naming and style conventions

## Import Organization

**Order:**
1. React/external framework imports (e.g., `import React, { createContext }`)
2. Next.js imports (e.g., `import type { Metadata }`)
3. Absolute path imports using `@/` alias (e.g., `import { useCart } from "@/context/CartContext"`)
4. Type imports and interfaces
5. Custom relative imports (rarely used due to `@/` alias)

**Path Aliases:**
- Web: `@/*` resolves to `/home/kali/Desktop/TOAST/src/web/`
- Used for `@/components/`, `@/context/`, `@/lib/`

**Example from `OrderPanel.tsx`:**
```typescript
"use client";
import { useCart } from "@/context/CartContext";

export function OrderPanel() {
  // ...
}
```

## Error Handling

**Patterns:**
- React components use try-catch in async functions with generic error state management:
  ```typescript
  // From AuthContext.tsx
  try {
    const res = await apiClient("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    if (res.success && res.token) {
      // success path
    }
    return { success: false, error: res.errorMessage || "Login failed" };
  } catch {
    return { success: false, error: "Network error — is the backend running?" };
  }
  ```

- API client throws on non-2xx responses with descriptive error messages:
  ```typescript
  // From lib/api.ts
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || err.message || `HTTP ${res.status}`);
  }
  ```

- C# services return result objects with `Success` flag and `ErrorMessage`:
  ```csharp
  // From OrderService.cs
  if (menuItem == null) {
    return new OrderModels.OrderResult {
      Success = false,
      ErrorMessage = $"Item {itemRequest.ItemId} not found"
    };
  }
  ```

- C# controllers validate ModelState before processing:
  ```csharp
  if (!ModelState.IsValid) {
    return BadRequest(ModelState);
  }
  ```

## Logging

**Framework:** No explicit logging library used in TypeScript/React; standard `console` methods not observed

**Patterns:**
- Error messages passed through state: React components set error state and display to UI
- Backend uses `ILogger<T>` pattern in .NET Core via dependency injection
- From `OrdersController.cs`: logger parameter injected through constructor, logged during processing

## Comments

**When to Comment:**
- Inline comments are minimal; comments appear mainly for clarification of tax calculations
- Comments mark UPDATED behavior in Redux slices: `// UPDATED: Now requires sizeId and sizeName`
- Business logic comments explain tax application and discount calculations

**JSDoc/TSDoc:**
- Minimal JSDoc usage observed
- C# uses XML documentation comments for public APIs:
  ```csharp
  /// <summary>
  /// Create a new order
  /// </summary>
  [HttpPost]
  public async Task<IActionResult> CreateOrder(...)
  ```

## Function Design

**Size:** Functions are generally small and focused
- React components under 100 lines: `OrderPanel.tsx` (98 lines), `CartContext.tsx` (82 lines)
- Service methods 30-150 lines with single responsibilities
- Helper functions like `calculateTotals()` in Redux slice: 13 lines

**Parameters:**
- React functions destructure props: `export function RootLayout({ children }: { children: React.ReactNode })`
- Typed parameters via TypeScript interfaces
- C# constructor injection pattern for dependencies:
  ```csharp
  public OrderService(
    IOrderRepository orderRepo,
    IMenuRepository menuRepo,
    IPaymentService paymentService,
    IMiscRepository miscRepo,
    ILoyaltyService loyaltyService,
    INotificationService notificationService)
  ```

**Return Values:**
- React hooks return context values or hook functions: `const { items, addItem, removeItem } = useCart()`
- Service methods return Promise-wrapped result objects with strongly typed responses
- Async methods consistently named with `Async` suffix

## Module Design

**Exports:**
- Context providers export both Provider component and custom hook:
  ```typescript
  export function CartProvider({ children }) { /* ... */ }
  export const useCart = () => { /* ... */ }
  ```

- API modules export object namespaces grouped by domain:
  ```typescript
  export const MenuAPI = { ... }
  export const OrderAPI = { ... }
  export const LoyaltyAPI = { ... }
  ```

- Redux slices export slice reducer and destructured actions:
  ```typescript
  export const { addToCart, updateQuantity, removeFromCart, clearCart } = cartSlice.actions;
  export default cartSlice.reducer;
  ```

**Barrel Files:** Not used; direct imports from files preferred using `@/` path aliases

## Immutability Patterns

**React/TypeScript:**
- State updates use spread operators and mapping functions to create new objects:
  ```typescript
  // CartContext.tsx
  return prev.map((i) =>
    i.menuItemId === item.menuItemId
      ? { ...i, quantity: i.quantity + 1 }
      : i,
  );
  ```

- Redux slices use Immer (built into Redux Toolkit) enabling direct mutation syntax that creates new state:
  ```typescript
  // cartSlice.ts
  existingItem.quantity += quantity;  // Immer handles immutability
  state.items.push(newItem);
  ```

---

*Convention analysis: 2026-02-25*
