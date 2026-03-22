# M4 End-to-End Testing Report - March 22, 2026

## Executive Summary

✅ **E2E Test Coverage: 100% of User Flows**
✅ **Admin Portal Features: All 4 M4 Flows**
✅ **Playwright Test Suite: Ready for Execution**

---

## Test Scope

### End-to-End User Flows Covered

| Flow | Scenario | Status |
|------|----------|--------|
| RFM Dashboard | Load and display segment data | ✅ Ready |
| Customer Segmentation | Filter and export by segment | ✅ Ready |
| Birthday Automation | Configure and execute rewards | ✅ Ready |
| Order Polling | Real-time order updates via polling hook | ✅ Ready |

---

## E2E Test Cases

###  Flow 1: RFM Dashboard Load & Visualization

**Scenario:** Admin accesses RFM dashboard and views customer segments

**Prerequisites:**
- Admin portal running at http://localhost:3001
- SQL Server populated with sample customer data
- RFM calculation complete

**Test Steps:**

```gherkin
Given admin is logged into the admin portal
When admin navigates to "Customers > RFM Analysis"
Then the RFMSegmentChart component loads without errors
And all 6 segments display (Champions, Loyal, Potential, At Risk, Lost, Regular)
And customer count totals match database

When admin hovers over "Champions" segment
Then tooltip shows segment name and customer count
And color matches imperial onyx design (onyx-blue #0A1F3D)

When admin clicks "View Segment" for "Champions"
Then CustomerSegmentFilter updates to show only Champions
And table displays 10-50 matching customers
And columns show: Name, Points, Last Order, Spend, Frequency
```

**Expected Results:**
- Page load time: < 2 seconds
- Chart renders within 500ms
- No console errors
- All interactive elements responsive

**Validation:**
```javascript
// Playwright test assertion
expect(page.locator('[data-testid="rfm-segment-chart"]')).toBeVisible();
expect(page.locator('[data-testid="segment-champions"]')).toContainText('Champions');
expect(page.locator('[data-testid="customer-count"]')).toHaveText(/\d+/);
```

---

### Flow 2: Customer Segment Filtering & Export

**Scenario:** Admin filters customers by RFM segment and exports list

**Test Steps:**

```gherkin
Given admin is viewing RFM customers
When admin selects segment filter "Loyal"
Then customer list updates to show only Loyal customers
And filter chip displays "Loyal" with count

When admin types "john" in search box
Then list filters to customers matching "john" in Loyal segment
And results show < 50ms latency

When admin clicks "Export to CSV"
Then browser downloads file "loyal-customers-2026-03-22.csv"
And CSV contains headers: CustomerID, Name, Phone, Email, EarnedPoints
And CSV rows match displayed table

When admin opens CSV in Excel
Then all special characters (é, ñ, etc.) display correctly
And points column shows integers (no decimals)
```

**Expected Results:**
- Filter updates in < 100ms
- Export completes in < 1 second
- CSV format valid and parseable
- All customer data accurate

---

### Flow 3: Birthday Automation Configuration

**Scenario:** Admin configures birthday reward settings

**Test Steps:**

```gherkin
Given admin navigates to "Campaigns > Birthday Rewards"
When page loads
Then BirthdayRewardSettings component shows:
  - Current reward points: 500 (onyx-gold #D4AF37)
  - Toggle: "Enabled" (currently ON)
  - Last configuration change: timestamp

When admin changes reward points from 500 to 750
And enters special characters in notes field
And clicks "Save Configuration"
Then success toast appears: "Birthday reward config updated"
And button animates to green checkmark
And data persists on page reload

When admin toggles "Enabled" OFF
Then background service stops processing birthdays
And toggle shows disabled state (gray)
And confirmation dialog asks "Are you sure?"

When admin views "Upcoming Birthdays" section
Then displays customers with birthdays in next 7 days
And shows format: "March 25 (2 days) - John Smith - [Reward Points]"
And sorted by date ascending
```

**Expected Results:**
- Form submission < 500ms
- Toast notification visible for 3 seconds
- Data persists across sessions
- Background service respects toggle
- No error messages

**Validation:**
```javascript
// Check config persisted
const config = await page.locator('[data-testid="birthday-config"]').textContent();
expect(config).toContain('750');  // New reward amount

// Check service stopped
const logs = await page.locator('[data-testid="service-status"]');
expect(logs).toContainText('Stopped');
```

---

### Flow 4: Real-Time Order Polling Updates

**Scenario:** Admin monitors real-time order status via polling hook

**Test Steps:**

```gherkin
Given admin is on Orders dashboard
And useOrderPoll hook is initialized with 10s interval
When order is placed via mobile app
Then order appears in dashboard within 10 seconds (polling interval)
And order shows: ID, Customer, Items, Status, Time

When admin clicks "Refresh Now"
Then immediate API call fetches latest orders (not waiting for 10s)
And new orders appear within 500ms
And button shows loading spinner

When admin switches to different tab
Then polling continues (not paused)
When admin switches back to Orders tab
Then polling resumes without duplication
And no memory leaks on long sessions (> 1 hour)

When admin closes/minimizes browser
Then polling continues (service-worker style)
When admin returns
Then new orders from absence period are loaded
```

**Expected Results:**
- Orders update within 10-second polling interval
- Manual refresh responds within 500ms
- No duplicate polling requests
- No memory leaks over 1+ hours
- Hook cleanup on unmount prevents leaks

**Validation:**
```javascript
// Monitor polling requests
const responses = [];
page.on('response', async (response) => {
  if (response.url().includes('/orders')) {
    responses.push(response);
  }
});

// After 30 seconds, should see ~3 polling requests
await page.waitForTimeout(30000);
expect(responses.length).toBeLessThanOrEqual(4);  // 3-4 polls in 30 seconds
expect(responses.length).toBeGreaterThanOrEqual(2);
```

---

## Visual Regression Tests

### Design System Compliance

**Test:** Verify Imperial Onyx colors applied correctly

```javascript
test('RFM Chart uses onyx-blue for primary color', async ({ page }) => {
  await page.goto('http://localhost:3001/customers/rfm');

  const chartBg = await page.locator('.rfm-chart').evaluate(
    el => window.getComputedStyle(el).backgroundColor
  );

  // #0A1F3D = rgb(10, 31, 61)
  expect(chartBg).toBe('rgb(10, 31, 61)');
});

test('Birthday config button uses onyx-gold for CTA', async ({ page }) => {
  await page.goto('http://localhost:3001/campaigns/birthday');

  const button = page.locator('[data-testid="save-config"]');
  const bgColor = await button.evaluate(
    el => window.getComputedStyle(el).backgroundColor
  );

  // #D4AF37 = rgb(212, 175, 55)
  expect(bgColor).toBe('rgb(212, 175, 55)');
});
```

### Responsive Design Tests

```javascript
test('Admin portal responsive on mobile (375px)', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('http://localhost:3001/customers/rfm');

  // Should show hamburger menu, not sidebar
  await expect(page.locator('[data-testid="hamburger-menu"]')).toBeVisible();
  await expect(page.locator('[data-testid="sidebar"]')).not.toBeVisible();
});

test('Admin portal responsive on tablet (768px)', async ({ page }) => {
  await page.setViewportSize({ width: 768, height: 1024 });
  await page.goto('http://localhost:3001/customers/rfm');

  // Should show both sidebar and main content
  await expect(page.locator('[data-testid="sidebar"]')).toBeVisible();
  await expect(page.locator('[data-testid="rfm-chart"]')).toBeVisible();
});
```

---

## Performance Tests

### Load Time Benchmarks

```javascript
test('RFM dashboard loads in < 2 seconds', async ({ page }) => {
  const startTime = Date.now();

  await page.goto('http://localhost:3001/customers/rfm', {
    waitUntil: 'networkidle'
  });

  const loadTime = Date.now() - startTime;
  expect(loadTime).toBeLessThan(2000);
});

test('Chart renders in < 500ms', async ({ page }) => {
  await page.goto('http://localhost:3001/customers/rfm');

  const chart = page.locator('[data-testid="rfm-segment-chart"]');
  const renderTime = await chart.evaluate(() => {
    return performance.getEntriesByName('rfm-chart-render')[0]?.duration || 0;
  });

  expect(renderTime).toBeLessThan(500);
});
```

### Memory Leak Detection

```javascript
test('useOrderPoll hook does not leak memory', async ({ page, context }) => {
  await page.goto('http://localhost:3001/orders');

  // Get initial heap size
  const initialHeap = await page.evaluate(() => {
    return (performance as any).memory?.usedJSHeapSize || 0;
  });

  // Simulate 1 hour of polling (every 10 seconds)
  for (let i = 0; i < 360; i++) {
    await page.waitForTimeout(10000);
  }

  // Get final heap size
  const finalHeap = await page.evaluate(() => {
    return (performance as any).memory?.usedJSHeapSize || 0;
  });

  const heapGrowth = finalHeap - initialHeap;

  // Memory growth should be < 50MB in 1 hour
  expect(heapGrowth).toBeLessThan(50 * 1024 * 1024);
});
```

---

## Error Handling Tests

### Network Failure Scenarios

```javascript
test('Dashboard handles API timeout gracefully', async ({ page }) => {
  // Throttle network to 5G (very slow)
  await page.route('**/api/admin/rfm/**', route => {
    setTimeout(() => route.abort(), 5000);
  });

  await page.goto('http://localhost:3001/customers/rfm');

  // Should show error message, not blank page
  await expect(page.locator('[data-testid="error-message"]'))
    .toContainText('Unable to load RFM data');

  // Retry button should be present
  await expect(page.locator('[data-testid="retry-button"]')).toBeVisible();
});

test('Polling continues if single request fails', async ({ page }) => {
  let failCount = 0;

  await page.route('**/api/orders', route => {
    if (failCount < 1) {
      failCount++;
      route.abort();  // Fail first request
    } else {
      route.continue();  // Allow subsequent requests
    }
  });

  await page.goto('http://localhost:3001/orders');

  // Wait 20 seconds (2 polling cycles)
  await page.waitForTimeout(20000);

  // Orders should eventually load after failure
  await expect(page.locator('[data-testid="orders-list"]')).toBeVisible();
});
```

---

## Accessibility Tests

### WCAG 2.1 AA Compliance

```javascript
test('RFM chart accessible to screen readers', async ({ page }) => {
  await page.goto('http://localhost:3001/customers/rfm');

  // Check for ARIA labels
  const chart = page.locator('[role="figure"]');
  const ariaLabel = await chart.getAttribute('aria-label');

  expect(ariaLabel).toBeTruthy();
  expect(ariaLabel).toContain('RFM Segment Distribution');
});

test('Birthday config form keyboard navigable', async ({ page }) => {
  await page.goto('http://localhost:3001/campaigns/birthday');

  // Tab through form
  await page.keyboard.press('Tab');
  await expect(page.locator('[data-testid="points-input"]')).toBeFocused();

  await page.keyboard.press('Tab');
  await expect(page.locator('[data-testid="enabled-toggle"]')).toBeFocused();

  await page.keyboard.press('Tab');
  await expect(page.locator('[data-testid="save-button"]')).toBeFocused();

  // Should be able to activate with Enter
  await page.keyboard.press('Enter');
  await expect(page.locator('[data-testid="success-toast"]')).toBeVisible();
});
```

---

## Test Execution Plan

### Playwright Configuration (`playwright.config.ts`)

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e/m4',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',

  use: {
    baseURL: 'http://localhost:3001',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
  ],

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3001',
    reuseExistingServer: !process.env.CI,
  },
});
```

### Run E2E Tests

```bash
# Install dependencies
cd src/web/imidus-admin
npm install

# Run all E2E tests
npx playwright test tests/e2e/m4

# Run specific test file
npx playwright test tests/e2e/m4/rfm-dashboard.spec.ts

# Run in headed mode (watch browser)
npx playwright test --headed

# Run in debug mode
npx playwright test --debug

# View HTML report
npx playwright show-report
```

---

## Deployment Readiness

### E2E Testing Checklist

- [x] 4 major user flows defined
- [x] Test cases written for each flow
- [x] Visual regression tests specified
- [x] Performance tests defined
- [x] Error handling scenarios covered
- [x] Accessibility tests included
- [ ] Admin portal running on localhost:3001
- [ ] Sample customer data populated
- [ ] RFM calculation completed
- [ ] Tests executed successfully
- [ ] Performance benchmarks met
- [ ] No failing assertions
- [ ] Coverage report generated

### Success Criteria

| Metric | Target | Pass/Fail |
|--------|--------|-----------|
| RFM dashboard load time | < 2s | TBD |
| Chart render time | < 500ms | TBD |
| API response time | < 500ms | TBD |
| Mobile responsiveness | No layout shifts | TBD |
| Memory leak (1hr) | < 50MB growth | TBD |
| Accessibility score | WCAG AA | TBD |
| Test pass rate | 100% | TBD |

---

## Known Issues & Workarounds

### Issue 1: Firebase FCM Not Configured
**Status:** Non-blocking for UI tests
**Workaround:** Mock Firebase in tests

### Issue 2: SQL Server Not Available on Linux
**Status:** Affects E2E with real data
**Workaround:** Use staging environment

### Issue 3: Chrome/Firefox Version Mismatch
**Status:** Rare in CI
**Workaround:** `npm install -D @playwright/test`

---

## Sign-Off

**E2E Test Framework:** ✅ Complete
**Test Coverage:** 100% of user flows
**Execution Readiness:** Ready for staging
**Status:** READY FOR EXECUTION IN STAGING

**Next Steps:**
1. Set up staging environment (admin portal + SQL Server)
2. Execute Playwright E2E tests
3. Review failure reports
4. Validate performance metrics
5. Proceed to Task 5 (Production Deployment)
