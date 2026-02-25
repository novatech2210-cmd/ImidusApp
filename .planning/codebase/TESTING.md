# Testing Patterns

**Analysis Date:** 2026-02-25

## Test Framework

**Runner:**
- Mobile: Jest v29.6.3
- Web: No test runner configured (ESLint only)
- Config: `jest.config.js` (mobile only)

**Assertion Library:**
- Jest built-in matchers (mobile)
- React Test Renderer for React component testing

**Run Commands:**
```bash
# Mobile (React Native)
npm test                # Run all tests (Jest)
npm run android         # Run on Android simulator
npm run ios             # Run on iOS simulator
npm start               # Start Metro bundler

# Web
npm run lint            # ESLint only (no test runner)
npm run build           # Type check via Next.js build
npm run dev             # Development mode
```

## Test File Organization

**Location:**
- Mobile: Co-located in `__tests__/` directory at project root
  - Test file: `/home/kali/Desktop/TOAST/src/mobile/ImidusCustomerApp/__tests__/App.test.tsx`
- Web: No test files present in codebase; testing not configured

**Naming:**
- Pattern: `[ComponentName].test.tsx` or `[ComponentName].spec.tsx`
- Mobile uses `.test.tsx` convention

**Structure:**
```
src/mobile/ImidusCustomerApp/
├── __tests__/
│   └── App.test.tsx
├── src/
│   ├── screens/
│   ├── components/
│   ├── store/
│   ├── api/
│   └── config/
├── App.tsx
├── jest.config.js
└── package.json
```

## Test Structure

**Suite Organization:**
```typescript
/**
 * @format
 */

import 'react-native';
import React from 'react';
import App from '../App';

// Jest globals import
import {it} from '@jest/globals';

// Test renderer import
import renderer from 'react-test-renderer';

// Single test case
it('renders correctly', () => {
  renderer.create(<App />);
});
```

**Patterns:**
- JSDoc format comment (`@format`) at file start
- Clear import organization: native, external, relative, types
- Minimal test setup (no describe blocks in current codebase)
- Single assertion per test (currently)
- Uses React Test Renderer for snapshot/render testing

## Mocking

**Framework:** Jest built-in mocking system

**Patterns:**
Not extensively documented in codebase. However, based on structure:
- Network calls would use `jest.mock()` for API client
- Redux state would use `useSelector` mocking or store injection in tests
- Component dependencies would use Jest mocks

**What to Mock:**
- External API calls (`apiClient`)
- Redux store and selectors
- Navigation stack (for React Native screens)
- Third-party services (NotificationService, etc.)

**What NOT to Mock:**
- React Native components (use React Test Renderer)
- Custom hooks with business logic
- State management reducers (test in isolation or integration)
- Utility functions (test directly)

**Partial Mocking Example (based on codebase patterns):**
```typescript
// Would mock API but keep component logic
jest.mock('../api/apiClient');

// Would preserve NotificationService tests
jest.mock('../services/NotificationService', () => ({
  notify: jest.fn(),
}));
```

## Fixtures and Factories

**Test Data:**
- Mobile uses inline mock data for Redux state
- Web uses inline demo data (DEMO_MENU constant in menu/page.tsx)

**Location:**
- No centralized fixture directory observed
- Mock data defined in test files or component files as needed
- Example: `DEMO_MENU` array in `/home/kali/Desktop/TOAST/src/web/app/menu/page.tsx` (lines 152-196)

**Pattern (from Web):**
```typescript
const DEMO_MENU: MenuCategory[] = [
  {
    categoryId: 1,
    categoryName: "Burgers",
    isActive: true,
    itemCount: 3,
    items: [
      {
        menuItemId: 1,
        itemName: "Classic Smash Burger",
        price: 14.99,
        categoryId: 1,
        categoryName: "Burgers",
        isAvailable: true,
        description: "Double smash patty, American cheese, pickles, special sauce",
      },
      // more items...
    ],
  },
  // more categories...
];
```

## Coverage

**Requirements:** Not explicitly enforced (no coverage configuration in jest.config.js)

**Minimum Recommendation:** 80% based on user's global testing rules

**Current State:**
- Mobile: 1 basic test (App.test.tsx renders the App component)
- Web: No tests configured

**View Coverage:**
```bash
# Mobile - requires coverage configuration
npm test -- --coverage

# Not available for web (no test runner)
```

## Test Types

**Unit Tests:**
- Scope: Individual functions, reducers, hooks
- Approach: Test in isolation with mocked dependencies
- Example structure: Test Redux reducers (cartSlice.ts, authSlice.ts) to verify state mutations
- Current coverage: Minimal (only App render test exists)

**Integration Tests:**
- Scope: API calls + UI updates, Redux actions + component rendering
- Approach: Mock API, render components with real Redux store
- Example: Test MenuScreen loads categories, selects first, then loads items
- Current coverage: Not present

**E2E Tests:**
- Framework: Not configured (Playwright not in dependencies)
- Approach: Would test full user flows (login → menu → cart → checkout)
- Current coverage: Not implemented

## Common Patterns

**Async Testing:**
- Mobile would use Jest async/await pattern
- Redux Toolkit supports async thunks but not currently used
- API calls in components use `.then().catch().finally()` pattern

**Pattern (Component-level):**
```typescript
// MenuScreen.tsx pattern (not in test, but async handling in component)
useEffect(() => {
  fetchCategories();
}, []);

const fetchCategories = async () => {
  try {
    const response = await apiClient.get('/Menu/categories');
    setCategories(response.data);
    if (response.data.length > 0) {
      setSelectedCategory(response.data[0].categoryId);
    }
  } catch (error) {
    console.error('Error fetching categories:', error);
  } finally {
    if (!selectedCategory) setLoading(false);
  }
};

// Test would mock apiClient.get and verify setCategories was called
```

**Error Testing:**
- Current pattern uses try-catch blocks
- Would test error paths by mocking API to reject
- Example test:
```typescript
it('handles API errors gracefully', async () => {
  // Mock apiClient.get to reject
  jest.mock('../api/apiClient', () => ({
    get: jest.fn().mockRejectedValueOnce(new Error('Network error')),
  }));

  // Render component
  const component = renderer.create(<MenuScreen />);

  // Wait for async operations
  // Verify error state or user message displayed
});
```

## Debugging Tips

**Jest Configuration (Mobile):**
```javascript
// jest.config.js
module.exports = {
  preset: 'react-native',
};
```
- Uses React Native preset with sensible defaults
- Automatically handles React Native module transformations
- Can be extended with additional config as needed

**Running Single Test:**
```bash
npm test -- App.test.tsx
npm test -- --testNamePattern="renders correctly"
```

**Watch Mode:**
```bash
npm test -- --watch
```

**Debug Mode:**
```bash
node --inspect-brk node_modules/.bin/jest --runInBand
```

## Coverage Gaps

**Critical Test Needs:**
1. **Redux Slices** (`src/mobile/ImidusCustomerApp/src/store/cartSlice.ts`, `authSlice.ts`)
   - No unit tests for reducers
   - Risk: State mutations break silently
   - Action items: Test `addToCart`, `removeFromCart`, `updateQuantity`, `clearCart`

2. **Context Hooks** (`src/web/context/CartContext.tsx`, `AuthContext.tsx`)
   - No integration tests
   - Risk: State management bugs in production
   - Action items: Test `addItem`, `removeItem`, `updateQty`, `login`, `register`

3. **API Client** (`src/web/lib/api.ts`, `src/mobile/ImidusCustomerApp/src/api/apiClient.ts`)
   - No mocked API tests
   - Risk: Network failures not caught before deployment
   - Action items: Mock fetch/axios, test error handling

4. **Pages/Screens** (`src/web/app/menu/page.tsx`, `src/mobile/ImidusCustomerApp/src/screens/MenuScreen.tsx`)
   - No render or integration tests
   - Risk: UI breaks undetected
   - Action items: Mock API, render component, verify UI state transitions

5. **Web App** (`src/web/`)
   - No test infrastructure (Jest/Vitest not installed)
   - Risk: Type errors only caught at build time
   - Action items: Install test runner, configure test environment

## Recommended Setup

**For Web:**
```bash
npm install --save-dev vitest @testing-library/react @testing-library/jest-dom
```

Add `vitest.config.ts`:
```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
});
```

**For Mobile (Enhance):**
```bash
npm install --save-dev @testing-library/react-native
```

Extend `jest.config.js`:
```javascript
module.exports = {
  preset: 'react-native',
  setupFilesAfterEnv: ['<rootDir>/__tests__/setup.js'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/index.ts',
  ],
};
```

---

*Testing analysis: 2026-02-25*
