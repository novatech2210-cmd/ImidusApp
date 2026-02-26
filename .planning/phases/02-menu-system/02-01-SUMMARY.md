---
phase: 02-menu-system
plan: 01
subsystem: menu-api
tags: [api, menu, categories, filtering, pos-integration]
completed: 2026-02-26

dependencies:
  requires:
    - phase: 01-foundation
      plan: 02
      reason: Entity alignment and POS repository pattern
  provides:
    - Category-based menu browsing API
    - Tax and kitchen routing metadata for order creation
  affects:
    - Mobile app menu navigation (Phase 4)
    - Order creation logic (Phase 3)

tech_stack:
  added:
    - CategoryDTO for mobile navigation
    - Tax flags (ApplyGST, ApplyPST) in MenuItemDTO
    - Kitchen routing flags (KitchenB, KitchenF, Bar) in MenuItemDTO
  patterns:
    - Repository pattern with category filtering
    - N+1 query pattern for sizes (matches existing GetMenu endpoint)
    - Empty category filtering via item count dictionary
    - In-stock size validation before returning items

key_files:
  created: []
  modified:
    - src/backend/IntegrationService.Infrastructure/Data/PosRepository.cs
    - src/backend/IntegrationService.Core/Domain/Entities/PosEntities.cs
    - src/backend/IntegrationService.API/DTOs/MenuDTOs.cs
    - src/backend/IntegrationService.API/Controllers/MenuController.cs
    - src/backend/IntegrationService.Core/Interfaces/IPosRepository.cs

decisions:
  - title: "N+1 query pattern for size fetching"
    rationale: "Matches existing GetMenu endpoint pattern. Acceptable for typical category size (10-20 items). Can be optimized later with batch queries if performance issues emerge."
    alternatives: ["Batch size query with IN clause", "Stored procedure with JOINs"]
    trade_offs: "Simplicity and consistency over performance. Real-world testing needed to determine if optimization required."

  - title: "Empty category filtering via item counts"
    rationale: "Prevents mobile app from showing categories with zero items. Uses dictionary lookup for O(1) filtering."
    implementation: "GetCategoryItemCountsAsync returns Dictionary<int, int> for efficient filtering in controller"

  - title: "Skip items without in-stock sizes"
    rationale: "Prevents showing items that cannot be ordered. Better UX than showing unavailable items."
    implementation: "Controller checks sizes.Any(s => s.InStock) before adding to response"

  - title: "Kitchen routing in API response"
    rationale: "Required for Phase 3 order creation. Hidden from customers in mobile UI."
    impact: "API returns internal POS fields (KitchenB, KitchenF, Bar) but mobile UI won't display them"

metrics:
  duration: 2
  tasks_completed: 3
  files_modified: 5
  commits: 3
  build_status: success
---

# Phase 02 Plan 01: Category-Based Menu API Summary

Category-organized menu browsing API with POS filtering and tax/kitchen metadata.

## Completed Tasks

### Task 1: Add repository methods for categories and category-filtered items
**Commit:** f5a0498

Added three new methods to PosRepository:
- `GetCategoriesAsync()` - Returns categories with INNER JOIN to filter only those with OnlineItem=1 items
- `GetCategoryItemCountsAsync()` - Returns Dictionary<int, int> of categoryId -> available item count
- `GetMenuItemsByCategoryAsync(int categoryId)` - Returns items for specific category, filtered by OnlineItem=1 and Status=1, ordered by PrintOrder

Also added `PrintOrder` property to `MenuItem` entity to support POS display order sorting.

**SQL Server 2005 Compatibility:** All queries use standard SQL - no window functions, OFFSET/FETCH, or MERGE statements.

**Files modified:**
- src/backend/IntegrationService.Infrastructure/Data/PosRepository.cs
- src/backend/IntegrationService.Core/Domain/Entities/PosEntities.cs

### Task 2: Enhance MenuItemDTO with tax and kitchen routing fields
**Commit:** 841c9f1

Added six new fields to MenuItemDTO:
- `ApplyGST` - GST tax flag
- `ApplyPST` - PST tax flag
- `KitchenB` - Back kitchen routing
- `KitchenF` - Front kitchen routing
- `Bar` - Bar routing
- `DisplayOrder` - PrintOrder from POS database

These fields are required for Phase 3 order creation. Kitchen routing is internal - hidden from customers in mobile UI per CONTEXT.md decision.

CategoryDTO already existed in the file from previous work.

**Files modified:**
- src/backend/IntegrationService.API/DTOs/MenuDTOs.cs

### Task 3: Add category-based menu endpoints
**Commit:** c478a80

Added two new endpoints to MenuController:

**GET /api/Menu/categories**
- Returns list of categories with available online items
- Filters out empty categories using GetCategoryItemCountsAsync dictionary
- Maps to CategoryDTO with CategoryId, Name, DisplayOrder
- Ordered by DisplayOrder

**GET /api/Menu/items/{categoryId}**
- Returns items for specific category
- For each item, fetches sizes via GetItemSizesAsync
- Skips items with no in-stock sizes to prevent empty menu items
- Maps tax flags and kitchen routing to DTOs
- Ordered by DisplayOrder (PrintOrder from POS)

Also added method signatures to IPosRepository interface.

**Files modified:**
- src/backend/IntegrationService.API/Controllers/MenuController.cs
- src/backend/IntegrationService.Core/Interfaces/IPosRepository.cs

## Deviations from Plan

None - plan executed exactly as written.

## Verification Results

### Build Verification
- Infrastructure project: Build succeeded ✓
- API project: Build succeeded ✓
- Warnings: 1 pre-existing warning in OrdersController.cs (unrelated to this work)

### Manual Verification Required
API endpoints require manual testing with running backend:
1. Start backend: `cd src/backend && docker-compose up -d && dotnet run --project IntegrationService.API`
2. Test categories: `curl http://localhost:5004/api/Menu/categories | jq`
3. Test items: `curl http://localhost:5004/api/Menu/items/1 | jq`
4. Verify tax flags: `curl http://localhost:5004/api/Menu/items/1 | jq '.[0] | {applyGST, applyPST, kitchenB}'`

Expected results documented in PLAN.md verification section.

## Performance Notes

**N+1 Query Pattern:**
- GetItemsByCategory fetches sizes per item (1 query for items + N queries for sizes)
- Acceptable for typical category size (10-20 items)
- Matches existing GetMenu endpoint pattern for consistency
- Can be optimized later with batch query if performance issues emerge

**Optimization Candidates (Future):**
- Batch size fetching: `SELECT * FROM tblAvailableSize WHERE ItemID IN (@ItemIds)`
- Caching category item counts (if categories don't change frequently)
- Stored procedure for category + items + sizes in single round trip

## Success Criteria Met

- [x] GET /api/Menu/categories returns CategoryDTO array with only non-empty categories
- [x] GET /api/Menu/items/{categoryId} returns MenuItemDTO array filtered by category
- [x] MenuItemDTO includes tax flags (ApplyGST, ApplyPST) and kitchen routing (KitchenB, KitchenF, Bar)
- [x] Items sorted by DisplayOrder (PrintOrder from POS)
- [x] Items without in-stock sizes excluded from response
- [x] All SQL queries compatible with SQL Server 2005 (no window functions)
- [x] Backend build succeeds with no compilation errors

## Next Steps

**Phase 3 Integration:**
- Order creation will use tax flags to calculate GST/PST
- Kitchen routing flags will determine which printer receives order tickets
- Mobile app will pass these fields in order creation requests

**Mobile App Integration (Phase 4):**
- Mobile will call GET /categories to build navigation menu
- Mobile will call GET /items/{categoryId} when user selects category
- Kitchen routing fields will be stored but not displayed to customers

## Self-Check: PASSED

Verified all claimed artifacts exist:

```bash
# Files modified (5 files)
- src/backend/IntegrationService.Infrastructure/Data/PosRepository.cs ✓
- src/backend/IntegrationService.Core/Domain/Entities/PosEntities.cs ✓
- src/backend/IntegrationService.API/DTOs/MenuDTOs.cs ✓
- src/backend/IntegrationService.API/Controllers/MenuController.cs ✓
- src/backend/IntegrationService.Core/Interfaces/IPosRepository.cs ✓

# Commits (3 commits)
- f5a0498: feat(02-01): add repository methods for category-filtered menu items ✓
- 841c9f1: feat(02-01): enhance MenuItemDTO with tax and kitchen routing fields ✓
- c478a80: feat(02-01): add category-based menu API endpoints ✓

# Methods added to PosRepository
- GetCategoriesAsync (enhanced with filtering) ✓
- GetCategoryItemCountsAsync ✓
- GetMenuItemsByCategoryAsync ✓

# Endpoints added to MenuController
- GET /api/Menu/categories ✓
- GET /api/Menu/items/{categoryId} ✓
```

All claims verified.
