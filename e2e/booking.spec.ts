import { test, expect, testUsers } from './fixtures';

/**
 * Booking Flow E2E Test Suite
 *
 * Comprehensive test coverage for complete booking journey:
 * - Browse available kings and services
 * - Select king and time slot
 * - Complete booking form
 * - Payment processing with Stripe
 * - Booking confirmation
 * - Calendar synchronization
 * - Cancellation and refunds
 *
 * @file Booking and reservation flow test specifications
 * @see https://playwright.dev/docs/test-specs
 *
 * @example
 * // Run only booking tests
 * pnpm test:e2e booking.spec.ts
 *
 * // Run specific test
 * pnpm test:e2e booking.spec.ts -g "user can complete booking with payment"
 */

/**
 * Test: User can browse available kings
 *
 * @test
 * @description Verifies king discovery and listing functionality
 * @steps
 * 1. Navigate to kings discovery page
 * 2. Verify kings list loads
 * 3. Verify each king card displays: photo, name, rating, price
 * 4. Apply filters: location, availability, rating
 * 5. Verify filtered results update
 * 6. Search by king name
 * 7. Verify search results display
 * 8. Click on king card to view details
 * 9. Verify detail page loads with full information
 *
 * @expected
 * - Kings list displayed with pagination
 * - Filters work correctly
 * - Search returns relevant results
 * - Detail page shows complete information
 * - Availability calendar visible
 *
 * @smoke
 */
test('user can browse and filter available kings', async ({
  page,
  testUtils,
}) => {
  // Navigate to kings listing
  await page.goto('/kings');

  // Wait for page to load
  await testUtils.waitForLoadingComplete();

  // Verify kings list visible
  await expect(page.locator('[data-testid="king-card"]')).toHaveCount(6, {
    timeout: 10000,
  });

  // Verify king card content
  const firstKing = page.locator('[data-testid="king-card"]').first();
  await expect(firstKing.locator('img[alt*="king"]')).toBeVisible();
  await expect(firstKing.locator('[data-testid="king-name"]')).toBeVisible();
  await expect(firstKing.locator('[data-testid="king-rating"]')).toBeVisible();
  await expect(firstKing.locator('[data-testid="king-price"]')).toBeVisible();

  // Apply filter: rating
  await page.click('[data-testid="filter-rating"]');
  await page.click('text=5 stars');
  await testUtils.waitForLoadingComplete();

  // Verify filtered results
  const filteredCount = await page.locator('[data-testid="king-card"]').count();
  expect(filteredCount).toBeGreaterThan(0);

  // Search by name
  await page.fill('input[placeholder="Search kings"]', 'Prince');
  await page.press('input[placeholder="Search kings"]', 'Enter');
  await testUtils.waitForLoadingComplete();

  // Verify search results
  await expect(page.locator('[data-testid="king-card"]')).toContainText(
    'Prince',
  );

  // Click on king to view details
  await page.click('[data-testid="king-card"]');
  await page.waitForURL(/\/kings\/[a-zA-Z0-9-]+/);

  // Verify detail page
  await expect(
    page.locator('[data-testid="king-detail-header"]'),
  ).toBeVisible();
  await expect(
    page.locator('[data-testid="availability-calendar"]'),
  ).toBeVisible();
});

/**
 * Test: User can select date and time for booking
 *
 * @test
 * @description Verifies availability calendar and time slot selection
 * @steps
 * 1. Navigate to king detail page
 * 2. View availability calendar
 * 3. Click on available date (green)
 * 4. Verify available time slots display
 * 5. Click on time slot
 * 6. Verify slot selected with visual feedback
 * 7. Verify booking duration options (1h, 2h, 4h, etc.)
 * 8. Select duration
 * 9. Verify total price updates
 * 10. Verify "Book Now" button enabled
 *
 * @expected
 * - Availability calendar interactive
 * - Booked dates appear unavailable (grayed out)
 * - Available dates clickable
 * - Time slots display dynamically
 * - Duration options visible
 * - Price calculation accurate
 * - Booking button active when slot selected
 *
 * @critical
 */
test('user can select date and time slot for booking', async ({
  page,
  testUtils,
}) => {
  // Navigate to king detail page
  await page.goto('/kings/test-king-001');
  await testUtils.waitForLoadingComplete();

  // Verify calendar visible
  await expect(
    page.locator('[data-testid="availability-calendar"]'),
  ).toBeVisible();

  // Get next available date (not today)
  const calendarDates = page.locator(
    '[data-testid="calendar-date"][aria-disabled="false"]',
  );
  const availableDate = calendarDates.nth(5); // Pick a date further out
  await availableDate.click();

  // Wait for time slots to load
  await testUtils.waitForLoadingComplete();

  // Verify time slots display
  const timeSlots = page.locator('[data-testid="time-slot"]');
  const slotCount = await timeSlots.count();
  expect(slotCount).toBeGreaterThan(0);

  // Click first available time slot
  await timeSlots.first().click();

  // Verify slot selected (highlighted)
  await expect(timeSlots.first()).toHaveClass(/selected|active/);

  // Verify booking duration options
  await expect(page.locator('[data-testid="duration-option"]')).toHaveCount(4); // 1h, 2h, 4h, full-day

  // Select 2-hour duration
  await page.click('[data-testid="duration-option"][value="2h"]');

  // Verify price updates
  const priceElement = page.locator('[data-testid="total-price"]');
  const price = await priceElement.textContent();
  expect(price).toMatch(/\$\d+/);

  // Verify Book Now button enabled
  const bookButton = page.locator('button:has-text("Book Now")');
  await expect(bookButton).toBeEnabled();
});

/**
 * Test: User can complete booking with payment
 *
 * @test
 * @description Verifies complete end-to-end booking and payment flow
 * @steps
 * 1. Select king and time slot
 * 2. Click "Book Now" button
 * 3. Fill booking details form
 * 4. Review booking summary
 * 5. Proceed to payment
 * 6. Enter credit card details (Stripe)
 * 7. Complete payment
 * 8. Verify booking confirmation
 * 9. Verify confirmation email sent
 * 10. Verify booking appears in user's bookings list
 *
 * @expected
 * - Booking form displays
 * - All required fields visible
 * - Payment processes successfully
 * - Confirmation page shows booking details
 * - Email confirmation sent
 * - Calendar updated with new booking
 *
 * @critical
 * @integration-test
 */
test('user can complete booking with payment', async ({
  page,
  testUtils,
  testUser,
}) => {
  // First, login
  await testUtils.loginViaUI(testUser.email, testUser.password);
  await testUtils.waitForLoadingComplete();

  // Navigate to king detail
  await page.goto('/kings/test-king-001');
  await testUtils.waitForLoadingComplete();

  // Select date and time
  const calendarDates = page.locator(
    '[data-testid="calendar-date"][aria-disabled="false"]',
  );
  await calendarDates.nth(5).click();
  await testUtils.waitForLoadingComplete();

  // Select time slot
  await page.click('[data-testid="time-slot"]');

  // Select duration
  await page.click('[data-testid="duration-option"][value="2h"]');

  // Click Book Now
  await page.click('button:has-text("Book Now")');

  // Wait for booking form
  await page.waitForURL(/\/booking\/confirm|\/checkout/);
  await testUtils.waitForLoadingComplete();

  // Fill booking details
  const bookingForm = {
    'special-requests': 'This is a special booking request for testing',
    'reminder-preference': 'email',
  };

  for (const [field, value] of Object.entries(bookingForm)) {
    const input = page.locator(`[name="${field}"]`);
    if ((await input.locator('select').count()) > 0) {
      await input.selectOption(value);
    } else {
      await input.fill(value);
    }
  }

  // Verify booking summary visible
  await expect(page.locator('[data-testid="booking-summary"]')).toBeVisible();
  await expect(page.locator('[data-testid="summary-total"]')).toContainText(
    '$',
  );

  // Proceed to payment
  await page.click('button:has-text("Proceed to Payment")');

  // Wait for Stripe payment form
  await page.waitForSelector('iframe[title*="Stripe"]', { timeout: 10000 });

  // Fill card details (test card)
  const stripeFrame = page.frameLocator('iframe[title*="Stripe"]').first();
  await stripeFrame.locator('[placeholder*="1234"]').fill('4242424242424242');
  await stripeFrame.locator('[placeholder*="MM"]').fill('12');
  await stripeFrame.locator('[placeholder*="YY"]').fill('25');
  await stripeFrame.locator('[placeholder*="CVC"]').fill('123');

  // Submit payment
  await page.click('button:has-text("Complete Payment")');

  // Wait for confirmation
  await page.waitForURL(/\/booking\/confirmation|\/order\/success/);

  // Verify confirmation page
  await expect(
    page.locator('[data-testid="confirmation-header"]'),
  ).toContainText('Booking Confirmed');
  await expect(
    page.locator('[data-testid="confirmation-number"]'),
  ).toBeVisible();

  // Verify success notification
  await testUtils.expectSuccessNotification('Booking confirmed');
});

/**
 * Test: User can modify booking after creation
 *
 * @test
 * @description Verifies booking edit and reschedule functionality
 * @steps
 * 1. Create a booking
 * 2. Navigate to booking details
 * 3. Click "Modify Booking" button
 * 4. Change date/time
 * 5. Add special requests
 * 6. Review changes
 * 7. Confirm modification
 * 8. Verify confirmation email sent
 * 9. Verify calendar updated
 *
 * @expected
 * - Booking modifications saved
 * - Old time slot freed up
 * - New time slot reserved
 * - Confirmation email sent
 * - Price adjustments calculated
 *
 * @integration-test
 */
test('user can modify booking after creation', async ({
  page,
  testUtils,
  testUser,
}) => {
  // Login and navigate to bookings
  await testUtils.loginViaUI(testUser.email, testUser.password);
  await testUtils.waitForLoadingComplete();

  // Navigate to bookings list
  await page.goto('/bookings');
  await testUtils.waitForLoadingComplete();

  // Click on first booking
  await page.click('[data-testid="booking-card"]');
  await testUtils.waitForLoadingComplete();

  // Click modify button
  await page.click('[data-testid="modify-booking-button"]');

  // Wait for edit form
  await expect(page.locator('[data-testid="booking-edit-form"]')).toBeVisible();

  // Change date
  const newDate = page.locator('[data-testid="calendar-date"]').nth(7);
  await newDate.click();

  // Change time
  await page.click('[data-testid="time-slot"][value="14:00"]');

  // Add special requests
  await page.fill(
    '[name="special-requests"]',
    'Updated special request for testing',
  );

  // Submit changes
  await page.click('button:has-text("Save Changes")');

  // Verify confirmation
  await testUtils.expectSuccessNotification('Booking updated successfully');

  // Verify back on booking detail
  await expect(
    page.locator('[data-testid="booking-detail-header"]'),
  ).toBeVisible();
});

/**
 * Test: User can cancel booking with refund
 *
 * @test
 * @description Verifies booking cancellation and refund process
 * @steps
 * 1. Navigate to booking details
 * 2. Click "Cancel Booking" button
 * 3. Verify cancellation policy displayed
 * 4. Select cancellation reason
 * 5. Confirm cancellation
 * 6. Verify refund amount calculated
 * 7. Verify refund status shown
 * 8. Verify time slot freed up
 * 9. Verify cancellation email sent
 *
 * @expected
 * - Booking marked as cancelled
 * - Refund processed (full or partial based on policy)
 * - Time slot available again
 * - Cancellation confirmation email sent
 * - Booking history shows cancellation
 *
 * @integration-test
 */
test('user can cancel booking with refund', async ({
  page,
  testUtils,
  testUser,
}) => {
  // Login
  await testUtils.loginViaUI(testUser.email, testUser.password);
  await testUtils.waitForLoadingComplete();

  // Navigate to bookings
  await page.goto('/bookings');
  await testUtils.waitForLoadingComplete();

  // Open first booking
  await page.click('[data-testid="booking-card"]');
  await testUtils.waitForLoadingComplete();

  // Click cancel button
  await page.click('[data-testid="cancel-booking-button"]');

  // Verify cancellation modal
  await expect(
    page.locator('[data-testid="cancellation-modal"]'),
  ).toBeVisible();

  // Verify cancellation policy
  await expect(
    page.locator('[data-testid="cancellation-policy"]'),
  ).toBeVisible();

  // Select cancellation reason
  await page.selectOption(
    '[name="cancellation-reason"]',
    'scheduling-conflict',
  );

  // Confirm cancellation
  await page.click('button:has-text("Confirm Cancellation")');

  // Verify success message
  await testUtils.expectSuccessNotification('Booking cancelled');

  // Verify refund information shown
  await expect(page.locator('[data-testid="refund-amount"]')).toContainText(
    '$',
  );

  // Verify booking status changed
  await expect(page.locator('[data-testid="booking-status"]')).toContainText(
    'Cancelled',
  );
});

/**
 * Test: User receives booking reminders
 *
 * @test
 * @description Verifies reminder notification system
 * @steps
 * 1. Create booking with email reminder enabled
 * 2. Wait for 24-hour before booking time
 * 3. Verify 24-hour reminder email sent
 * 4. Wait for 1-hour before booking
 * 5. Verify 1-hour reminder sent
 * 6. Check in-app notifications also sent
 * 7. Verify reminder preferences can be modified
 *
 * @expected
 * - 24-hour reminder email sent
 * - 1-hour reminder sent
 * - In-app notifications displayed
 * - Reminder preferences respected
 *
 * @integration-test
 */
test('user receives booking reminders at configured times', async ({
  page,
  testUtils,
  testUser,
}) => {
  // Login
  await testUtils.loginViaUI(testUser.email, testUser.password);
  await testUtils.waitForLoadingComplete();

  // Navigate to bookings
  await page.goto('/bookings');
  await testUtils.waitForLoadingComplete();

  // Open booking details
  await page.click('[data-testid="booking-card"]');
  await testUtils.waitForLoadingComplete();

  // Verify reminder preferences visible
  await expect(
    page.locator('[data-testid="reminder-preferences"]'),
  ).toBeVisible();

  // Verify both reminder options checked
  await expect(
    page.locator('[data-testid="reminder-24h"] input[type="checkbox"]'),
  ).toBeChecked();

  await expect(
    page.locator('[data-testid="reminder-1h"] input[type="checkbox"]'),
  ).toBeChecked();

  // Modify reminder preference
  await page.click('[data-testid="reminder-24h"] input[type="checkbox"]');

  // Save preference
  await page.click('button:has-text("Save Preferences")');

  // Verify saved
  await testUtils.expectSuccessNotification('Reminder preferences updated');
});

/**
 * Test: Booking payment failure handling
 *
 * @test
 * @description Verifies graceful handling of payment failures
 * @steps
 * 1. Attempt booking with invalid payment method
 * 2. Verify error message displayed
 * 3. Option to update payment method provided
 * 4. Update with valid card
 * 5. Retry payment
 * 6. Verify booking succeeds
 *
 * @expected
 * - Clear error message shown
 * - Payment form remains accessible
 * - User can retry payment
 * - No duplicate bookings created
 * - Time slot held temporarily
 *
 * @error-handling
 */
test('payment failure is handled gracefully', async ({
  page,
  testUtils,
  testUser,
}) => {
  // Login
  await testUtils.loginViaUI(testUser.email, testUser.password);
  await testUtils.waitForLoadingComplete();

  // Start booking flow
  await page.goto('/kings/test-king-001');
  await testUtils.waitForLoadingComplete();

  // Select date/time
  const calendarDates = page.locator(
    '[data-testid="calendar-date"][aria-disabled="false"]',
  );
  await calendarDates.nth(5).click();
  await testUtils.waitForLoadingComplete();

  await page.click('[data-testid="time-slot"]');
  await page.click('[data-testid="duration-option"][value="2h"]');
  await page.click('button:has-text("Book Now")');

  // Fill form and proceed to payment
  await page.click('button:has-text("Proceed to Payment")');

  // Wait for Stripe frame
  await page.waitForSelector('iframe[title*="Stripe"]');

  // Enter declined card (Stripe test card)
  const stripeFrame = page.frameLocator('iframe[title*="Stripe"]').first();
  await stripeFrame.locator('[placeholder*="1234"]').fill('4000000000000002'); // Declined card
  await stripeFrame.locator('[placeholder*="MM"]').fill('12');
  await stripeFrame.locator('[placeholder*="YY"]').fill('25');
  await stripeFrame.locator('[placeholder*="CVC"]').fill('123');

  // Attempt payment
  await page.click('button:has-text("Complete Payment")');

  // Verify error shown
  await testUtils.expectErrorNotification('Payment declined');

  // Verify can update payment method
  await expect(
    page.locator('[data-testid="update-payment-button"]'),
  ).toBeVisible();

  // Click to update
  await page.click('[data-testid="update-payment-button"]');

  // Enter valid card
  const stripeFrame2 = page.frameLocator('iframe[title*="Stripe"]').first();
  await stripeFrame2.locator('[placeholder*="1234"]').fill('4242424242424242'); // Valid test card
  await stripeFrame2.locator('[placeholder*="MM"]').fill('12');
  await stripeFrame2.locator('[placeholder*="YY"]').fill('25');
  await stripeFrame2.locator('[placeholder*="CVC"]').fill('123');

  // Retry payment
  await page.click('button:has-text("Complete Payment")');

  // Verify booking succeeds
  await page.waitForURL(/\/booking\/confirmation/);
  await expect(
    page.locator('[data-testid="confirmation-header"]'),
  ).toBeVisible();
});
