# Coding Conventions

**Analysis Date:** 2026-02-25

## Naming Patterns

**Files:**
- React components: PascalCase with `.tsx` extension (e.g., `Sidebar.tsx`, `CartContext.tsx`, `MenuItemCard.tsx`)
- Utilities and services: camelCase with `.ts` extension (e.g., `apiClient.ts`, `environment.ts`)
- Page routes: lowercase with directory structure (e.g., `/menu/page.tsx`, `/orders/page.tsx`)
- Slices and store files: camelCase + descriptive suffix (e.g., `cartSlice.ts`, `authSlice.ts`, `index.ts`)
- Type definition files: suffix with `.types.ts` (e.g., `cart.types.ts`, `menu.types.ts`)

**Functions:**
- Event handlers: `handle[Event]` prefix (e.g., `handleAdd`, `handleClearCart`, `handlePress`)
- Fetch/API calls: `fetch[Resource]` prefix (e.g., `fetchCategories`, `fetchItems`)
- Helper functions: descriptive camelCase (e.g., `calculateTotals`, `renderCategory`, `renderItem`)
- Context consumers: `use[Context]` pattern for custom hooks (e.g., `useCart`, `useAuth`)

**Variables:**
- State variables: camelCase (e.g., `items`, `selectedCategory`, `loading`, `isLoading`, `token`)
- Boolean flags: `is[State]` or `has[Feature]` prefix (e.g., `isActive`, `isAvailable`, `isLoading`)
- Constants: UPPER_SNAKE_CASE (e.g., `DEMO_MENU`, `API_BASE`, `ENV.IS_DEV`)
- Environment variables: UPPER_SNAKE_CASE with ENV prefix (e.g., `ENV.API_BASE_URL`, `NEXT_PUBLIC_API_URL`)

**Types:**
- Interface names: PascalCase with descriptive suffix (e.g., `CartContextType`, `User`, `MenuItem`, `MenuCategory`)
- Type suffixes: `[Domain]Type` for context/state types (e.g., `CartContextType`, `AuthContextType`)
- Prop interfaces: `[ComponentName]Props` (if defined separately)

## Code Style

**Formatting:**
- Web project uses ESLint v9 with Next.js config
- Mobile project uses ESLint v8 with React Native config
- Prettier v2.8.8 configured for mobile development

**Prettier Configuration (Mobile):**
```javascript
// .prettierrc.js
{
  arrowParens: 'avoid',        // Omit parens: x => x (not (x) => x)
  bracketSameLine: true,       // <Component prop /> on same line
  bracketSpacing: false,       // No spaces: {x} (not { x })
  singleQuote: true,           // Use single quotes: 'string'
  trailingComma: 'all',        // Trailing commas in all applicable places
}
```

**Linting:**
- Web: ESLint extends `eslint-config-next` (inherits strict TypeScript config)
- Mobile: ESLint extends `@react-native/eslint-config` (React Native best practices)
- Both enforce strict TypeScript checking via `tsconfig.json` with `strict: true`

**TypeScript Strictness:**
- `strict: true` - All strict type-checking options enabled
- `noEmit: true` - Compilation check only, no build output
- `esModuleInterop: true` - CommonJS/ES module interop
- `isolatedModules: true` - Each file independently transpilable

## Import Organization

**Order:**
1. React/React Native imports (`import React from 'react'`)
2. External libraries (`import { Provider } from 'react-redux'`, `import axios from 'axios'`)
3. Relative imports (`import { useCart } from '@/context/CartContext'` or `import AppNavigator from './src/navigation'`)
4. Type imports (after structural imports, using `import type` when available)
5. Local assets/styles (stylesheets, config files last)

**Path Aliases:**
- Web: `@/*` resolves to root of `src/web/` directory
- Mobile: No alias configuration observed; uses relative paths
- Enables cleaner imports: `import { useCart } from '@/context/CartContext'` instead of `../../../context/CartContext`

**Example Import Blocks:**
```typescript
// Web (layout.tsx)
import { OrderPanel } from "@/components/OrderPanel";
import { Sidebar } from "@/components/Sidebar";
import { AuthProvider } from "@/context/AuthContext";
import { CartProvider } from "@/context/CartContext";
import type { Metadata } from "next";
import "./globals.css";

// Mobile (MenuScreen.tsx)
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    SafeAreaView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { useSelector } from 'react-redux';
import apiClient from '../api/apiClient';
import { MenuItemCard } from '../components/MenuItemCard';
```

## Error Handling

**Patterns:**
- **Try-catch with fallback**: All API calls wrapped in try-catch, return `{ success: false, error: string }` objects
- **Generic error messages for network**: Catch blocks return user-friendly messages (e.g., "Network error — is the backend running?")
- **Status-based error handling**: HTTP errors parsed from response JSON (e.g., `err.error || err.message || \`HTTP ${res.status}\``)
- **Context hook guards**: Custom hooks throw descriptive errors if used outside provider (e.g., `throw new Error("useCart must be inside CartProvider")`)

**Examples:**
```typescript
// apiClient (web/lib/api.ts)
const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
if (!res.ok) {
  const err = await res.json().catch(() => ({}));
  throw new Error(err.error || err.message || `HTTP ${res.status}`);
}

// AuthContext (web/context/AuthContext.tsx)
const login = async (email: string, password: string) => {
  try {
    const res = await apiClient("/auth/login", {...});
    if (res.success && res.token) {
      // success path
      return { success: true };
    }
    return { success: false, error: res.errorMessage || "Login failed" };
  } catch {
    return { success: false, error: "Network error — is the backend running?" };
  }
};

// MenuScreen (mobile)
try {
  const response = await apiClient.get('/Menu/categories');
  setCategories(response.data);
} catch (error) {
  console.error('Error fetching categories:', error);
}
```

## Logging

**Framework:** Native console methods (`console.log`, `console.error`)

**Patterns:**
- **Development logging**: Conditional logs guarded by environment check (e.g., `if (ENV.IS_DEV) console.log(...)`)
- **Error logging**: Explicit `console.error()` for error conditions
- **Debug logging**: Prefixed logs for readability (e.g., `console.log('[API] Base URL:', ENV.API_BASE_URL)`)
- **No production logging**: Production code removes debug logs; use proper observability tools in production

**Examples:**
```typescript
// Development-only logging (mobile/src/api/apiClient.ts)
if (ENV.IS_DEV) {
  console.log('[API] Base URL:', ENV.API_BASE_URL);
}

// Error logging (mobile/src/screens/MenuScreen.tsx)
try {
  const response = await apiClient.get('/Menu/items/{categoryId}');
} catch (error) {
  console.error('Error fetching items:', error);
}

// Mock notification logging (mobile)
console.log('🔔 [MOCK NOTIFICATION RECEIVED]', {title, body, data});
```

## Comments

**When to Comment:**
- **JSDoc for exported functions**: Use `/** ... */` format for public functions and hooks
- **Algorithm explanations**: Comment complex logic or business rules
- **Section dividers**: Use comment blocks to separate concerns (e.g., `// ── Typed API helpers ──────────────────────────────────────────────────`)
- **Inline comments**: Use sparingly; prefer self-documenting code with clear naming

**JSDoc/TSDoc Usage:**
- Applied to component entry points and root functions
- Include `@format` tag for React components in mobile project
- Type definitions include inline comments for field purposes

**Example:**
```typescript
/**
 * IMIDUS Customer App — Root Entry Point
 * Wires Redux store and navigation.
 */
function App(): React.JSX.Element {
  // implementation
}

/**
 * @format
 */
it('renders correctly', () => {
  // test code
});
```

## Function Design

**Size:**
- Most functions remain under 50 lines
- API client functions are typically single-purpose: one API call per function
- Event handlers kept concise; delegate to helper functions for complex logic

**Parameters:**
- Use destructuring for object parameters (e.g., `{ children }` in component props)
- Type all parameters explicitly (TypeScript strict mode enforced)
- Avoid long parameter lists; pass objects for related parameters

**Return Values:**
- Functions return typed objects (e.g., `{ success: boolean; error?: string }`)
- API helper functions return Promise-wrapped JSON data
- State update functions return void or undefined
- Utility functions return computed values (numbers, strings, booleans, objects)

**Example (CartContext):**
```typescript
const addItem = (item: Omit<CartItem, "quantity">) => {
  setItems((prev) => {
    const existing = prev.find((i) => i.menuItemId === item.menuItemId);
    if (existing) {
      return prev.map((i) =>
        i.menuItemId === item.menuItemId
          ? { ...i, quantity: i.quantity + 1 }
          : i,
      );
    }
    return [...prev, { ...item, quantity: 1 }];
  });
};
```

## Module Design

**Exports:**
- Named exports for utilities, hooks, and components (enables better tree-shaking)
- Default export for page components (Next.js convention)
- Consistent export style: `export function Name() {}` over `export const Name = () => {}`

**Barrel Files:**
- Used for index files in store directories (e.g., `src/store/index.ts` exports all slices)
- Enables cleaner imports: `import { store } from './src/store'`

**Example (Mobile Store):**
```typescript
// src/store/index.ts
export { default as cartSlice } from './cartSlice';
export { default as authSlice } from './authSlice';

// Usage:
import { cartSlice, authSlice } from './src/store';
```

**File Organization Patterns:**
- API clients live in `api/` directory as single modules
- Contexts and providers live in `context/` directory (web) or state management in Redux (mobile)
- Types defined in `types/` directory or co-located in `.types.ts` files
- Screens/Pages organized by feature or route (Next.js app directory structure for web)

## State Management Patterns

**Web (React Context API):**
- Contexts provide state + dispatch functions
- Consumers use custom hooks (e.g., `useCart()`, `useAuth()`)
- State persisted to localStorage for cart and auth
- Context Provider wraps layout to make state globally available

**Mobile (Redux Toolkit):**
- Slices define reducers and actions
- Store centralized in `src/store/index.ts`
- State subscribed via `useSelector` hook
- Dispatch via `useDispatch` hook
- No persistence layer observed (state resets on app reload)

## Immutability Practices

**Context API (Web):**
- Cart updates use spread operators: `{ ...item, quantity: i.quantity + 1 }`
- State updates use functional setState: `setItems((prev) => [...prev, newItem])`
- Item removal via `filter()` creating new arrays
- No direct mutation of state objects

**Redux (Mobile):**
- Redux Toolkit uses Immer internally for immutable updates
- Reducers can appear to mutate but are actually immutable (Immer transforms them)
- State calculations use pure functions (e.g., `calculateTotals()`)

**Example (Immutable Context Update):**
```typescript
const updateQty = (menuItemId: number, qty: number) => {
  if (qty <= 0) return removeItem(menuItemId);
  setItems((prev) =>
    prev.map((i) =>
      i.menuItemId === menuItemId ? { ...i, quantity: qty } : i,
    ),
  );
};
```

---

*Convention analysis: 2026-02-25*
