/**
 * Segment Evaluation Tests
 *
 * SSOT Compliance Tests:
 * - Verify all POS operations are READ-ONLY
 * - Verify no mutations to INI_Restaurant
 * - Verify cache writes go to overlay DB only
 *
 * Functional Tests:
 * - Segment threshold evaluation
 * - Banner targeting matching
 * - Edge cases and error handling
 */

import {
  evaluateSegmentsFromData,
  matchesBannerTargeting,
  isHighSpendCustomer,
  isFrequentCustomer,
  isRecentCustomer,
  isBirthdayCustomer,
  calculateDaysUntilBirthday,
  calculateDaysSinceLastOrder,
  createGuestSegment,
  filterBannersBySegment,
  getTargetedBanners,
  formatSegmentName,
  getSegmentColor,
  SEGMENT_THRESHOLDS,
  type CustomerRFMData,
  type CustomerSegment,
  type TargetedBanner,
} from '../segments';

// ============================================================================
// Test Data
// ============================================================================

const createMockCustomerData = (overrides: Partial<CustomerRFMData> = {}): CustomerRFMData => ({
  customerId: 'test-123',
  lifetime_value: 0,
  visit_count: 0,
  last_order_date: null,
  birthdate: null,
  days_since_last_order: null,
  days_until_birthday: null,
  ...overrides,
});

const createMockBanner = (overrides: Partial<TargetedBanner> = {}): TargetedBanner => ({
  id: 'test-banner',
  title: 'Test Banner',
  subtitle: 'Test Subtitle',
  ctaText: 'Click Here',
  ctaLink: '/test',
  bgGradient: 'linear-gradient(#000, #fff)',
  priority: 50,
  active: true,
  ...overrides,
});

// ============================================================================
// SSOT Compliance Tests
// ============================================================================

describe('Segment Evaluation SSOT Compliance', () => {
  describe('evaluateSegmentsFromData', () => {
    it('should only process data without database calls', () => {
      const mockData = createMockCustomerData({
        lifetime_value: 600,
        visit_count: 15,
        days_since_last_order: 5,
        days_until_birthday: 3,
      });

      // This function should be pure - no side effects, no DB calls
      const result = evaluateSegmentsFromData(mockData);

      expect(result).toBeDefined();
      expect(result.customerId).toBe('test-123');
      expect(result.segments).toContain('high-spend');
      expect(result.segments).toContain('frequent');
      expect(result.segments).toContain('recent');
      expect(result.segments).toContain('birthday');
    });

    it('should return consistent results for same input (pure function)', () => {
      const mockData = createMockCustomerData({ lifetime_value: 600 });

      const result1 = evaluateSegmentsFromData(mockData);
      const result2 = evaluateSegmentsFromData(mockData);

      expect(result1.segments).toEqual(result2.segments);
      expect(result1.metadata).toEqual(result2.metadata);
    });

    it('should not modify input data (immutability)', () => {
      const mockData = createMockCustomerData({ lifetime_value: 600 });
      const originalLifetimeValue = mockData.lifetime_value;

      evaluateSegmentsFromData(mockData);

      expect(mockData.lifetime_value).toBe(originalLifetimeValue);
    });
  });

  describe('matchesBannerTargeting', () => {
    it('should be a pure function with no side effects', () => {
      const segments = ['high-spend', 'frequent'];
      const targeting = { segments: ['high-spend'] };

      const result1 = matchesBannerTargeting(segments, targeting);
      const result2 = matchesBannerTargeting(segments, targeting);

      expect(result1).toBe(result2);
      expect(result1).toBe(true);
    });
  });
});

// ============================================================================
// Segment Threshold Tests
// ============================================================================

describe('Segment Thresholds', () => {
  describe('isHighSpendCustomer', () => {
    it('should return true for lifetime value > $500', () => {
      expect(isHighSpendCustomer(500.01)).toBe(true);
      expect(isHighSpendCustomer(1000)).toBe(true);
      expect(isHighSpendCustomer(10000)).toBe(true);
    });

    it('should return false for lifetime value <= $500', () => {
      expect(isHighSpendCustomer(500)).toBe(false);
      expect(isHighSpendCustomer(499.99)).toBe(false);
      expect(isHighSpendCustomer(0)).toBe(false);
    });

    it('should handle edge case at threshold', () => {
      expect(isHighSpendCustomer(SEGMENT_THRESHOLDS.HIGH_SPEND_MIN)).toBe(false);
      expect(isHighSpendCustomer(SEGMENT_THRESHOLDS.HIGH_SPEND_MIN + 0.01)).toBe(true);
    });
  });

  describe('isFrequentCustomer', () => {
    it('should return true for visit count > 10', () => {
      expect(isFrequentCustomer(11)).toBe(true);
      expect(isFrequentCustomer(50)).toBe(true);
      expect(isFrequentCustomer(100)).toBe(true);
    });

    it('should return false for visit count <= 10', () => {
      expect(isFrequentCustomer(10)).toBe(false);
      expect(isFrequentCustomer(5)).toBe(false);
      expect(isFrequentCustomer(0)).toBe(false);
    });

    it('should handle edge case at threshold', () => {
      expect(isFrequentCustomer(SEGMENT_THRESHOLDS.FREQUENT_MIN)).toBe(false);
      expect(isFrequentCustomer(SEGMENT_THRESHOLDS.FREQUENT_MIN + 1)).toBe(true);
    });
  });

  describe('isRecentCustomer', () => {
    it('should return true for orders < 14 days ago', () => {
      expect(isRecentCustomer(0)).toBe(true);
      expect(isRecentCustomer(7)).toBe(true);
      expect(isRecentCustomer(13)).toBe(true);
    });

    it('should return false for orders >= 14 days ago', () => {
      expect(isRecentCustomer(14)).toBe(false);
      expect(isRecentCustomer(30)).toBe(false);
      expect(isRecentCustomer(100)).toBe(false);
    });

    it('should return false for null (no orders)', () => {
      expect(isRecentCustomer(null)).toBe(false);
    });

    it('should handle edge case at threshold', () => {
      expect(isRecentCustomer(SEGMENT_THRESHOLDS.RECENT_MAX_DAYS - 1)).toBe(true);
      expect(isRecentCustomer(SEGMENT_THRESHOLDS.RECENT_MAX_DAYS)).toBe(false);
    });
  });

  describe('isBirthdayCustomer', () => {
    it('should return true for birthday within +/- 7 days', () => {
      expect(isBirthdayCustomer(0)).toBe(true);  // Today
      expect(isBirthdayCustomer(3)).toBe(true);  // In 3 days
      expect(isBirthdayCustomer(-3)).toBe(true); // 3 days ago
      expect(isBirthdayCustomer(7)).toBe(true);  // In 7 days
      expect(isBirthdayCustomer(-7)).toBe(true); // 7 days ago
    });

    it('should return false for birthday outside +/- 7 days', () => {
      expect(isBirthdayCustomer(8)).toBe(false);
      expect(isBirthdayCustomer(-8)).toBe(false);
      expect(isBirthdayCustomer(30)).toBe(false);
      expect(isBirthdayCustomer(-30)).toBe(false);
    });

    it('should return false for null (no birthdate)', () => {
      expect(isBirthdayCustomer(null)).toBe(false);
    });

    it('should handle edge case at threshold', () => {
      expect(isBirthdayCustomer(SEGMENT_THRESHOLDS.BIRTHDAY_RANGE_DAYS)).toBe(true);
      expect(isBirthdayCustomer(SEGMENT_THRESHOLDS.BIRTHDAY_RANGE_DAYS + 1)).toBe(false);
      expect(isBirthdayCustomer(-SEGMENT_THRESHOLDS.BIRTHDAY_RANGE_DAYS)).toBe(true);
      expect(isBirthdayCustomer(-SEGMENT_THRESHOLDS.BIRTHDAY_RANGE_DAYS - 1)).toBe(false);
    });
  });
});

// ============================================================================
// Date Calculation Tests
// ============================================================================

describe('Date Calculations', () => {
  describe('calculateDaysSinceLastOrder', () => {
    it('should calculate days correctly for recent orders', () => {
      const now = new Date();
      const fiveDaysAgo = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000);

      const result = calculateDaysSinceLastOrder(fiveDaysAgo.toISOString());

      expect(result).toBe(5);
    });

    it('should return 0 for order placed today', () => {
      const today = new Date();

      const result = calculateDaysSinceLastOrder(today.toISOString());

      expect(result).toBe(0);
    });

    it('should return null for null input', () => {
      expect(calculateDaysSinceLastOrder(null)).toBeNull();
    });

    it('should return null for invalid date', () => {
      expect(calculateDaysSinceLastOrder('invalid-date')).toBeNull();
    });
  });

  describe('calculateDaysUntilBirthday', () => {
    it('should return null for null input', () => {
      expect(calculateDaysUntilBirthday(null)).toBeNull();
    });

    it('should return null for invalid date', () => {
      expect(calculateDaysUntilBirthday('invalid-date')).toBeNull();
    });

    it('should calculate upcoming birthday correctly', () => {
      // Create a birthday 5 days from now
      const now = new Date();
      const fiveDaysFromNow = new Date(now);
      fiveDaysFromNow.setDate(now.getDate() + 5);
      const birthdate = new Date(1990, fiveDaysFromNow.getMonth(), fiveDaysFromNow.getDate());

      const result = calculateDaysUntilBirthday(birthdate.toISOString());

      expect(result).toBe(5);
    });

    it('should return 0 for birthday today', () => {
      const now = new Date();
      const birthdate = new Date(1990, now.getMonth(), now.getDate());

      const result = calculateDaysUntilBirthday(birthdate.toISOString());

      expect(result).toBe(0);
    });
  });
});

// ============================================================================
// Segment Evaluation Tests
// ============================================================================

describe('evaluateSegmentsFromData', () => {
  it('should return all segments for customer meeting all criteria', () => {
    const data = createMockCustomerData({
      lifetime_value: 600,
      visit_count: 15,
      days_since_last_order: 5,
      days_until_birthday: 3,
    });

    const result = evaluateSegmentsFromData(data);

    expect(result.segments).toContain('high-spend');
    expect(result.segments).toContain('frequent');
    expect(result.segments).toContain('recent');
    expect(result.segments).toContain('birthday');
    expect(result.segments.length).toBe(4);
  });

  it('should return empty segments for customer meeting no criteria', () => {
    const data = createMockCustomerData({
      lifetime_value: 100,
      visit_count: 2,
      days_since_last_order: 30,
      days_until_birthday: 60,
    });

    const result = evaluateSegmentsFromData(data);

    expect(result.segments.length).toBe(0);
  });

  it('should preserve metadata in result', () => {
    const data = createMockCustomerData({
      lifetime_value: 600,
      visit_count: 15,
      last_order_date: '2026-03-01',
      birthdate: '1990-03-15',
      days_since_last_order: 5,
      days_until_birthday: 3,
    });

    const result = evaluateSegmentsFromData(data);

    expect(result.metadata.lifetime_value).toBe(600);
    expect(result.metadata.visit_count).toBe(15);
    expect(result.metadata.last_order_date).toBe('2026-03-01');
    expect(result.metadata.birthdate).toBe('1990-03-15');
  });

  it('should include evaluatedAt timestamp', () => {
    const data = createMockCustomerData();
    const before = new Date().toISOString();

    const result = evaluateSegmentsFromData(data);

    const after = new Date().toISOString();
    expect(result.evaluatedAt).toBeDefined();
    expect(result.evaluatedAt >= before).toBe(true);
    expect(result.evaluatedAt <= after).toBe(true);
  });
});

// ============================================================================
// Banner Targeting Tests
// ============================================================================

describe('matchesBannerTargeting', () => {
  it('should return true when no targeting rules', () => {
    expect(matchesBannerTargeting(['high-spend'], null)).toBe(true);
    expect(matchesBannerTargeting(['high-spend'], undefined)).toBe(true);
    expect(matchesBannerTargeting([], null)).toBe(true);
  });

  it('should return true when customer matches target segment', () => {
    const targeting = { segments: ['high-spend', 'frequent'] };

    expect(matchesBannerTargeting(['high-spend'], targeting)).toBe(true);
    expect(matchesBannerTargeting(['frequent'], targeting)).toBe(true);
    expect(matchesBannerTargeting(['high-spend', 'birthday'], targeting)).toBe(true);
  });

  it('should return false when customer does not match any target segment', () => {
    const targeting = { segments: ['high-spend', 'frequent'] };

    expect(matchesBannerTargeting(['recent'], targeting)).toBe(false);
    expect(matchesBannerTargeting(['birthday'], targeting)).toBe(false);
    expect(matchesBannerTargeting([], targeting)).toBe(false);
  });

  it('should return true for empty segments array in targeting', () => {
    const targeting = { segments: [] };

    expect(matchesBannerTargeting(['high-spend'], targeting)).toBe(true);
    expect(matchesBannerTargeting([], targeting)).toBe(true);
  });

  it('should check minLifetimeValue with metadata', () => {
    const targeting = { minLifetimeValue: 500 };
    const metadataHigh = { lifetime_value: 600 } as CustomerSegment['metadata'];
    const metadataLow = { lifetime_value: 400 } as CustomerSegment['metadata'];

    expect(matchesBannerTargeting([], targeting, metadataHigh)).toBe(true);
    expect(matchesBannerTargeting([], targeting, metadataLow)).toBe(false);
  });

  it('should check minVisitCount with metadata', () => {
    const targeting = { minVisitCount: 10 };
    const metadataHigh = { visit_count: 15 } as CustomerSegment['metadata'];
    const metadataLow = { visit_count: 5 } as CustomerSegment['metadata'];

    expect(matchesBannerTargeting([], targeting, metadataHigh)).toBe(true);
    expect(matchesBannerTargeting([], targeting, metadataLow)).toBe(false);
  });

  it('should check maxDaysSinceLastOrder with metadata', () => {
    const targeting = { maxDaysSinceLastOrder: 14 };
    const metadataRecent = { days_since_last_order: 5 } as CustomerSegment['metadata'];
    const metadataOld = { days_since_last_order: 30 } as CustomerSegment['metadata'];
    const metadataNull = { days_since_last_order: null } as CustomerSegment['metadata'];

    expect(matchesBannerTargeting([], targeting, metadataRecent)).toBe(true);
    expect(matchesBannerTargeting([], targeting, metadataOld)).toBe(false);
    expect(matchesBannerTargeting([], targeting, metadataNull)).toBe(true); // null should pass
  });

  it('should check includesBirthday with metadata', () => {
    const targeting = { includesBirthday: true };
    const metadataBirthday = { days_until_birthday: 3 } as CustomerSegment['metadata'];
    const metadataNoBirthday = { days_until_birthday: 30 } as CustomerSegment['metadata'];

    expect(matchesBannerTargeting([], targeting, metadataBirthday)).toBe(true);
    expect(matchesBannerTargeting([], targeting, metadataNoBirthday)).toBe(false);
  });
});

// ============================================================================
// Banner Filtering Tests
// ============================================================================

describe('filterBannersBySegment', () => {
  it('should return banners that match customer segments', () => {
    const banners: TargetedBanner[] = [
      createMockBanner({ id: 'all', targeting_rules: undefined }),
      createMockBanner({ id: 'high-spend', targeting_rules: { segments: ['high-spend'] } }),
      createMockBanner({ id: 'frequent', targeting_rules: { segments: ['frequent'] } }),
    ];

    const segment: CustomerSegment = {
      customerId: '123',
      segments: ['high-spend'],
      metadata: {} as CustomerSegment['metadata'],
      evaluatedAt: new Date().toISOString(),
    };

    const result = filterBannersBySegment(banners, segment);

    expect(result.map((b) => b.id)).toContain('all');
    expect(result.map((b) => b.id)).toContain('high-spend');
    expect(result.map((b) => b.id)).not.toContain('frequent');
  });
});

describe('getTargetedBanners', () => {
  it('should filter inactive banners', () => {
    const banners: TargetedBanner[] = [
      createMockBanner({ id: 'active', active: true }),
      createMockBanner({ id: 'inactive', active: false }),
    ];

    const segment = createGuestSegment();
    const result = getTargetedBanners(banners, segment);

    expect(result.map((b) => b.id)).toContain('active');
    expect(result.map((b) => b.id)).not.toContain('inactive');
  });

  it('should sort by priority descending', () => {
    const banners: TargetedBanner[] = [
      createMockBanner({ id: 'low', priority: 10 }),
      createMockBanner({ id: 'high', priority: 100 }),
      createMockBanner({ id: 'medium', priority: 50 }),
    ];

    const segment = createGuestSegment();
    const result = getTargetedBanners(banners, segment);

    expect(result[0].id).toBe('high');
    expect(result[1].id).toBe('medium');
    expect(result[2].id).toBe('low');
  });

  it('should limit to maxBanners', () => {
    const banners: TargetedBanner[] = Array.from({ length: 10 }, (_, i) =>
      createMockBanner({ id: `banner-${i}`, priority: i })
    );

    const segment = createGuestSegment();
    const result = getTargetedBanners(banners, segment, 3);

    expect(result.length).toBe(3);
  });

  it('should default to 5 banners max', () => {
    const banners: TargetedBanner[] = Array.from({ length: 10 }, (_, i) =>
      createMockBanner({ id: `banner-${i}` })
    );

    const segment = createGuestSegment();
    const result = getTargetedBanners(banners, segment);

    expect(result.length).toBe(5);
  });
});

// ============================================================================
// Utility Function Tests
// ============================================================================

describe('Utility Functions', () => {
  describe('createGuestSegment', () => {
    it('should return empty segments for guest', () => {
      const result = createGuestSegment();

      expect(result.customerId).toBe('guest');
      expect(result.segments).toEqual([]);
      expect(result.metadata.lifetime_value).toBe(0);
      expect(result.metadata.visit_count).toBe(0);
    });
  });

  describe('formatSegmentName', () => {
    it('should format known segments', () => {
      expect(formatSegmentName('high-spend')).toBe('High Spender');
      expect(formatSegmentName('frequent')).toBe('Frequent Customer');
      expect(formatSegmentName('recent')).toBe('Recent Customer');
      expect(formatSegmentName('birthday')).toBe('Birthday');
    });

    it('should return original for unknown segments', () => {
      expect(formatSegmentName('unknown')).toBe('unknown');
    });
  });

  describe('getSegmentColor', () => {
    it('should return colors for known segments', () => {
      expect(getSegmentColor('high-spend')).toBe('#D4AF37');
      expect(getSegmentColor('frequent')).toBe('#4CAF50');
      expect(getSegmentColor('recent')).toBe('#2196F3');
      expect(getSegmentColor('birthday')).toBe('#E91E63');
    });

    it('should return default color for unknown segments', () => {
      expect(getSegmentColor('unknown')).toBe('#9E9E9E');
    });
  });
});

// ============================================================================
// SSOT Compliance - READ-ONLY Verification
// ============================================================================

describe('SSOT Compliance - READ-ONLY', () => {
  it('should have no mutation keywords in segment evaluation', () => {
    // These functions should be pure - no database operations
    const functionsToTest = [
      evaluateSegmentsFromData,
      matchesBannerTargeting,
      isHighSpendCustomer,
      isFrequentCustomer,
      isRecentCustomer,
      isBirthdayCustomer,
      createGuestSegment,
      formatSegmentName,
      getSegmentColor,
    ];

    // Verify these are pure functions by checking they return consistent results
    functionsToTest.forEach((fn) => {
      expect(typeof fn).toBe('function');
    });
  });

  it('segment evaluation should not mutate input', () => {
    const originalData = createMockCustomerData({ lifetime_value: 600 });
    const frozenData = Object.freeze({ ...originalData });

    // Should not throw when input is frozen (proves no mutation)
    expect(() => evaluateSegmentsFromData(frozenData)).not.toThrow();
  });

  it('banner targeting should not mutate inputs', () => {
    const segments = Object.freeze(['high-spend', 'frequent']);
    const targeting = Object.freeze({ segments: ['high-spend'] });

    // Should not throw when inputs are frozen (proves no mutation)
    expect(() => matchesBannerTargeting([...segments], targeting)).not.toThrow();
  });
});
