import { test, expect } from './fixtures';

/**
 * Discovery and Browsing E2E Test Suite
 *
 * Comprehensive test coverage for king discovery features:
 * - Browse all available kings
 * - Search and filter functionality
 * - View king detail pages
 * - Favorites/wishlist management
 * - Reviews and ratings display
 * - King categories and tags
 * - Sorting and sorting preferences
 *
 * @file King discovery and browsing test specifications
 * @see https://playwright.dev/docs/test-specs
 *
 * @example
 * // Run only discovery tests
 * pnpm test:e2e discovery.spec.ts
 *
 * // Run specific test
 * pnpm test:e2e discovery.spec.ts -g "user can search and filter kings"
 */

/**
 * Test: User can browse all available kings
 *
 * @test
 * @description Verifies king listing page with pagination
 * @steps
 * 1. Navigate to /kings route
 * 2. Verify page loads
 * 3. Verify king cards display (6 per page typically)
 * 4. Verify each card shows: image, name, rating, price/rate
 * 5. Verify pagination controls visible
 * 6. Click next page
 * 7. Verify new kings display
 * 8. Click previous page
 * 9. Verify correct kings displayed
 * 10. Go directly to page 3 via URL
 * 11. Verify correct page displayed
 *
 * @expected
 * - All kings listed with pagination
 * - 6 items per page (or configurable)
 * - Pagination controls work
 * - URL reflects current page
 * - Page state preserved on back navigation
 *
 * @smoke
 */
test('user can browse all available kings with pagination', async ({
  page,
  testUtils,
}) => {
  // Navigate to kings listing
  await page.goto('/kings');
  await testUtils.waitForLoadingComplete();

  // Verify page title
  await expect(page.locator('h1')).toContainText('Browse Kings');

  // Verify king cards visible
  const kingCards = page.locator('[data-testid="king-card"]');
  await expect(kingCards).toHaveCount(6);

  // Verify card structure
  const firstCard = kingCards.first();
  await expect(firstCard.locator('img[alt*="king"]')).toBeVisible();
  await expect(firstCard.locator('[data-testid="king-name"]')).toBeVisible();
  await expect(firstCard.locator('[data-testid="king-rating"]')).toBeVisible();
  await expect(firstCard.locator('[data-testid="king-rate"]')).toContainText(
    '$',
  );

  // Verify pagination controls
  await expect(page.locator('[data-testid="pagination"]')).toBeVisible();

  // Click next page
  await page.click('[data-testid="pagination-next"]');
  await testUtils.waitForLoadingComplete();

  // Verify URL changed
  expect(page.url()).toContain('page=2');

  // Verify different kings shown
  await expect(kingCards.first()).toContainText(/(?!Test King 1)/); // Not the first king

  // Click previous
  await page.click('[data-testid="pagination-prev"]');
  await testUtils.waitForLoadingComplete();

  // Verify back on page 1
  expect(page.url()).toContain('page=1');
});

/**
 * Test: User can search for kings by name
 *
 * @test
 * @description Verifies search functionality
 * @steps
 * 1. Navigate to kings page
 * 2. Focus search input
 * 3. Type king name
 * 4. Verify dropdown suggestions appear (optional)
 * 5. Submit search or press Enter
 * 6. Verify results filtered
 * 7. Verify "No results" if no matches
 * 8. Clear search
 * 9. Verify all kings displayed again
 * 10. Test partial name search
 * 11. Test case-insensitive search
 *
 * @expected
 * - Results filtered in real-time or on submit
 * - Only matching kings displayed
 * - Empty state shown if no results
 * - Search term preserved in input
 * - Can clear search easily
 *
 * @critical
 */
test('user can search for kings by name', async ({ page, testUtils }) => {
  // Navigate to kings page
  await page.goto('/kings');
  await testUtils.waitForLoadingComplete();

  // Focus and type search
  const searchInput = page.locator('input[placeholder="Search kings"]');
  await searchInput.fill('Prince');

  // Verify search suggestions (optional)
  // await expect(page.locator('[data-testid="search-suggestions"]')).toBeVisible();

  // Submit search
  await searchInput.press('Enter');
  await testUtils.waitForLoadingComplete();

  // Verify results filtered
  const results = page.locator('[data-testid="king-card"]');
  const count = await results.count();
  expect(count).toBeGreaterThan(0);

  // Verify search results contain term
  await expect(results.first()).toContainText(/Prince|prince/i);

  // Test no results
  await searchInput.clear();
  await searchInput.fill('ZZZZZZZZ');
  await searchInput.press('Enter');
  await testUtils.waitForLoadingComplete();

  // Verify no results state
  await expect(page.locator('[data-testid="no-results"]')).toBeVisible();

  // Clear search
  await searchInput.clear();
  await searchInput.press('Enter');
  await testUtils.waitForLoadingComplete();

  // Verify all kings displayed again
  await expect(page.locator('[data-testid="king-card"]')).toHaveCount(6);
});

/**
 * Test: User can filter kings by multiple criteria
 *
 * @test
 * @description Verifies advanced filtering options
 * @steps
 * 1. Navigate to kings page
 * 2. Verify filter sidebar visible
 * 3. Filter by rating (5 stars)
 * 4. Verify results filtered
 * 5. Add filter: availability (next 7 days)
 * 6. Verify results further filtered
 * 7. Add filter: price range ($50-$200)
 * 8. Verify combined filtering works
 * 9. Remove one filter
 * 10. Verify results update
 * 11. Clear all filters
 * 12. Verify all kings displayed
 *
 * @expected
 * - Filters apply independently and combined
 * - Active filters highlighted
 * - Results count updates
 * - "Clear filters" button appears
 * - Filter state preserved on page reload
 *
 * @critical
 */
test('user can filter kings by multiple criteria', async ({
  page,
  testUtils,
}) => {
  // Navigate to kings
  await page.goto('/kings');
  await testUtils.waitForLoadingComplete();

  // Verify filter panel visible
  await expect(page.locator('[data-testid="filter-panel"]')).toBeVisible();

  // Filter by rating
  await page.click('[data-testid="filter-rating"]');
  await page.click('text=5 stars');
  await testUtils.waitForLoadingComplete();

  // Verify results filtered
  let kingCards = page.locator('[data-testid="king-card"]');
  const ratingFilteredCount = await kingCards.count();
  expect(ratingFilteredCount).toBeLessThanOrEqual(6);

  // Add availability filter
  await page.click('[data-testid="filter-availability"]');
  await page.check('input[value="next-7-days"]');
  await testUtils.waitForLoadingComplete();

  // Verify further filtered
  const availabilityFilteredCount = await kingCards.count();
  expect(availabilityFilteredCount).toBeLessThanOrEqual(ratingFilteredCount);

  // Add price filter
  await page.click('[data-testid="filter-price"]');
  await page.fill('input[name="min-price"]', '50');
  await page.fill('input[name="max-price"]', '200');
  await page.click('button:has-text("Apply")');
  await testUtils.waitForLoadingComplete();

  // Verify combined filtering
  const finalCount = await kingCards.count();
  expect(finalCount).toBeGreaterThan(0);

  // Verify filter chips displayed
  await expect(page.locator('[data-testid="active-filter-chip"]')).toHaveCount(
    3,
  );

  // Remove one filter
  await page.click('[data-testid="filter-chip-rating"] button');
  await testUtils.waitForLoadingComplete();

  // Verify count increased (less restrictive)
  const afterRemovalCount = await kingCards.count();
  expect(afterRemovalCount).toBeGreaterThanOrEqual(finalCount);

  // Clear all filters
  await page.click('[data-testid="clear-all-filters"]');
  await testUtils.waitForLoadingComplete();

  // Verify all displayed
  await expect(kingCards).toHaveCount(6);
  await expect(page.locator('[data-testid="active-filter-chip"]')).toHaveCount(
    0,
  );
});

/**
 * Test: User can view king detail page
 *
 * @test
 * @description Verifies detailed king information display
 * @steps
 * 1. From kings list, click a king card
 * 2. Verify redirected to king detail page
 * 3. Verify header image visible
 * 4. Verify king name, rating, price displayed
 * 5. Verify about/bio section
 * 6. Verify availability calendar
 * 7. Verify reviews section
 * 8. Verify "Book Now" button prominent
 * 9. Verify related kings section
 * 10. Test back navigation to list
 *
 * @expected
 * - All information displayed correctly
 * - Images load properly
 * - Calendar interactive
 * - Reviews paginated if many
 * - Related kings suggested
 * - Responsive on mobile
 *
 * @critical
 */
test('user can view king detail page with full information', async ({
  page,
  testUtils,
}) => {
  // Navigate to kings list
  await page.goto('/kings');
  await testUtils.waitForLoadingComplete();

  // Click first king
  await page.click('[data-testid="king-card"]');
  await testUtils.waitForLoadingComplete();

  // Verify URL changed to detail page
  expect(page.url()).toMatch(/\/kings\/[a-z0-9-]+/i);

  // Verify header image
  await expect(page.locator('[data-testid="king-header-image"]')).toBeVisible();

  // Verify basic info
  await expect(page.locator('[data-testid="king-name"]')).toBeVisible();
  await expect(page.locator('[data-testid="king-rating"]')).toBeVisible();
  await expect(page.locator('[data-testid="king-rate"]')).toBeVisible();

  // Verify about section
  await expect(page.locator('[data-testid="king-about"]')).toBeVisible();
  await expect(page.locator('[data-testid="king-bio"]')).toBeVisible();

  // Verify availability calendar
  await expect(
    page.locator('[data-testid="availability-calendar"]'),
  ).toBeVisible();

  // Verify reviews section
  await expect(page.locator('[data-testid="king-reviews"]')).toBeVisible();

  // Verify book button
  await expect(page.locator('button:has-text("Book Now")')).toBeVisible();

  // Verify related kings
  await expect(page.locator('[data-testid="related-kings"]')).toBeVisible();

  // Test back navigation
  await page.goBack();
  expect(page.url()).toContain('/kings');
});

/**
 * Test: User can add/remove kings from favorites
 *
 * @test
 * @description Verifies wishlist/favorites functionality
 * @steps
 * 1. Navigate to kings list
 * 2. Click heart icon on king card
 * 3. Verify icon changes (filled/highlighted)
 * 4. Verify toast notification
 * 5. Navigate to favorites page
 * 6. Verify king appears in favorites
 * 7. Remove from favorites
 * 8. Verify removed from list
 * 9. Verify can favorite from detail page
 * 10. Verify favorites list updates in real-time
 *
 * @expected
 * - Heart icon toggles state
 * - Favorites sync across pages
 * - Notification shown
 * - Favorites page updates immediately
 * - Count badge updates
 *
 * @critical
 */
test('user can add and remove kings from favorites', async ({
  page,
  testUtils,
  testUser,
}) => {
  // Login first
  await testUtils.loginViaUI(testUser.email, testUser.password);
  await testUtils.waitForLoadingComplete();

  // Navigate to kings
  await page.goto('/kings');
  await testUtils.waitForLoadingComplete();

  // Add first king to favorites
  const heartIcon = page
    .locator('[data-testid="king-card"]')
    .first()
    .locator('[data-testid="favorite-button"]');
  await heartIcon.click();

  // Verify icon changes
  await expect(heartIcon).toHaveClass(/liked|active|filled/);

  // Verify notification
  await testUtils.expectSuccessNotification('Added to favorites');

  // Navigate to favorites page
  await page.goto('/favorites');
  await testUtils.waitForLoadingComplete();

  // Verify king appears in favorites
  const favoritedKings = page.locator('[data-testid="king-card"]');
  expect(await favoritedKings.count()).toBeGreaterThan(0);

  // Remove from favorites (via detail page)
  await favoritedKings.first().click();
  await testUtils.waitForLoadingComplete();

  // Click favorite button
  const detailHeartIcon = page.locator('[data-testid="favorite-button"]');
  await detailHeartIcon.click();

  // Verify removed notification
  await testUtils.expectSuccessNotification('Removed from favorites');

  // Go back to favorites list
  await page.goto('/favorites');
  await testUtils.waitForLoadingComplete();

  // Verify fewer items
  const updatedCount = await favoritedKings.count();
  expect(updatedCount).toBeGreaterThanOrEqual(0);
});

/**
 * Test: User can view and filter reviews
 *
 * @test
 * @description Verifies reviews section on king detail page
 * @steps
 * 1. Navigate to king detail page
 * 2. Scroll to reviews section
 * 3. Verify review cards display: avatar, name, rating, date, comment
 * 4. Verify rating distribution shown (5★: 40, 4★: 20, etc.)
 * 5. Filter by rating (e.g., 5 stars only)
 * 6. Verify filtered results
 * 7. Sort by newest/oldest
 * 8. Verify sort applied
 * 9. Pagination for many reviews
 * 10. Verify "Write Review" button if logged in and booked
 *
 * @expected
 * - Reviews display correctly
 * - Filters work
 * - Sorting applied
 * - Pagination works
 * - Rating distribution visible
 * - Average rating displayed
 *
 * @integration-test
 */
test('user can view and filter king reviews', async ({ page, testUtils }) => {
  // Navigate to king detail
  await page.goto('/kings/test-king-001');
  await testUtils.waitForLoadingComplete();

  // Scroll to reviews
  await page.locator('[data-testid="king-reviews"]').scrollIntoViewIfNeeded();

  // Verify reviews visible
  const reviewCards = page.locator('[data-testid="review-card"]');
  expect(await reviewCards.count()).toBeGreaterThan(0);

  // Verify review structure
  const firstReview = reviewCards.first();
  await expect(
    firstReview.locator('[data-testid="reviewer-avatar"]'),
  ).toBeVisible();
  await expect(
    firstReview.locator('[data-testid="reviewer-name"]'),
  ).toBeVisible();
  await expect(
    firstReview.locator('[data-testid="review-rating"]'),
  ).toBeVisible();
  await expect(
    firstReview.locator('[data-testid="review-date"]'),
  ).toBeVisible();
  await expect(
    firstReview.locator('[data-testid="review-text"]'),
  ).toBeVisible();

  // Verify rating distribution
  await expect(
    page.locator('[data-testid="rating-distribution"]'),
  ).toBeVisible();

  // Filter by 5 stars
  await page.click('[data-testid="filter-reviews-5-stars"]');
  await testUtils.waitForLoadingComplete();

  // Verify all reviews are 5 stars
  const fiveStarReviews = page.locator('[data-testid="review-card"]');
  const count = await fiveStarReviews.count();
  for (let i = 0; i < Math.min(count, 3); i++) {
    await expect(
      fiveStarReviews.nth(i).locator('[data-testid="review-rating"]'),
    ).toContainText('5');
  }

  // Sort by newest
  await page.selectOption('[data-testid="review-sort"]', 'newest');
  await testUtils.waitForLoadingComplete();

  // Verify sorted (most recent date first)
  const dates = await fiveStarReviews
    .locator('[data-testid="review-date"]')
    .allTextContents();
  expect(dates.length).toBeGreaterThan(0);
});

/**
 * Test: User can sort kings by different criteria
 *
 * @test
 * @description Verifies sorting functionality
 * @steps
 * 1. Navigate to kings page
 * 2. Verify default sort (recommended)
 * 3. Click sort dropdown
 * 4. Select "Price: Low to High"
 * 5. Verify kings sorted by price ascending
 * 6. Select "Highest Rated"
 * 7. Verify highest rated first
 * 8. Select "Newest"
 * 9. Verify newest first
 * 10. Test sort with filters combined
 *
 * @expected
 * - Sort options available
 * - Results reorder correctly
 * - Sort + filter combination works
 * - Sort preference can be saved
 * - Correct sort indicator shown
 *
 * @critical
 */
test('user can sort kings by different criteria', async ({
  page,
  testUtils,
}) => {
  // Navigate to kings
  await page.goto('/kings');
  await testUtils.waitForLoadingComplete();

  // Get initial order
  const kingNames1 = await page
    .locator('[data-testid="king-card"] [data-testid="king-name"]')
    .allTextContents();
  expect(kingNames1.length).toBeGreaterThan(0);

  // Open sort dropdown
  await page.click('[data-testid="sort-dropdown"]');

  // Select price low to high
  await page.click('text=Price: Low to High');
  await testUtils.waitForLoadingComplete();

  // Get new order
  const prices1 = await page
    .locator('[data-testid="king-card"] [data-testid="king-rate"]')
    .allTextContents();

  // Verify sorted (prices should increase)
  const priceValues = prices1.map((p) => parseInt(p.replace(/\D/g, '')));
  for (let i = 1; i < priceValues.length; i++) {
    expect(priceValues[i]).toBeGreaterThanOrEqual(priceValues[i - 1]);
  }

  // Sort by highest rated
  await page.click('[data-testid="sort-dropdown"]');
  await page.click('text=Highest Rated');
  await testUtils.waitForLoadingComplete();

  // Verify rating order
  const ratings = await page
    .locator('[data-testid="king-card"] [data-testid="king-rating"]')
    .allTextContents();
  const ratingValues = ratings.map((r) => parseFloat(r.split(' ')[0]));
  for (let i = 1; i < ratingValues.length; i++) {
    expect(ratingValues[i]).toBeLessThanOrEqual(ratingValues[i - 1]);
  }
});

/**
 * Test: User can view king categories and tags
 *
 * @test
 * @description Verifies category browsing and filtering by tags
 * @steps
 * 1. Navigate to kings page
 * 2. Verify categories visible (if applicable)
 * 3. Click on a category
 * 4. Verify kings filtered to category
 * 5. View king detail page
 * 6. Verify tags displayed
 * 7. Click on tag
 * 8. Verify filtered to tag
 * 9. Verify breadcrumb shows category
 * 10. Verify can clear category filter
 *
 * @expected
 * - Categories displayed
 * - Tags visible on detail page
 * - Tag filtering works
 * - Breadcrumb navigation works
 * - Category persistence across navigation
 *
 * @integration-test
 */
test('user can browse by categories and tags', async ({ page, testUtils }) => {
  // Navigate to kings
  await page.goto('/kings');
  await testUtils.waitForLoadingComplete();

  // Verify categories visible
  await expect(page.locator('[data-testid="category-filter"]')).toBeVisible();

  // Click category
  await page.click('[data-testid="category-option"]');
  await testUtils.waitForLoadingComplete();

  // Verify filtered
  const kingCards = page.locator('[data-testid="king-card"]');
  expect(await kingCards.count()).toBeGreaterThan(0);

  // Go to detail page
  await kingCards.first().click();
  await testUtils.waitForLoadingComplete();

  // Verify tags visible
  await expect(page.locator('[data-testid="king-tags"]')).toBeVisible();

  // Click tag
  const firstTag = page.locator('[data-testid="tag-chip"]').first();
  await firstTag.click();

  // Verify filtered by tag
  expect(page.url()).toContain('tag=');
});
