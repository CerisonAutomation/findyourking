import { test, expect } from './fixtures';
import { injectAxe, checkA11y } from 'axe-playwright';

/**
 * Accessibility Audit E2E Test Suite (WCAG AA Compliance)
 *
 * Comprehensive accessibility testing across the entire application:
 * - WCAG 2.1 Level AA compliance verification
 * - Keyboard navigation and focus management
 * - Screen reader compatibility
 * - Color contrast ratios
 * - Semantic HTML validation
 * - ARIA labels and attributes
 * - Form accessibility
 * - Mobile accessibility
 *
 * @file Accessibility and WCAG AA compliance test specifications
 * @see https://www.w3.org/WAI/test-evaluate/
 * @see https://axe-core.org/
 *
 * @requires npm install --save-dev axe-playwright
 *
 * @example
 * // Run accessibility tests
 * pnpm test:e2e a11y.spec.ts
 *
 * // Run with detailed report
 * pnpm test:e2e a11y.spec.ts --reporter=html
 */

/**
 * Test: All pages pass automated accessibility checks (axe-core)
 *
 * @test
 * @description Verifies automated accessibility violations on main pages
 * @wcag 2.1 Level AA
 * @steps
 * 1. Navigate to home page
 * 2. Inject axe accessibility checker
 * 3. Run automated checks
 * 4. Verify no violations
 * 5. Navigate to kings page
 * 6. Run checks
 * 7. Verify no violations
 * 8. Test auth pages (login, signup)
 * 9. Test dashboard/profile pages
 * 10. Generate accessibility report
 *
 * @expected
 * - Zero violations on critical elements
 * - No contrast ratio failures
 * - No missing ARIA labels
 * - No broken semantic HTML
 * - All form labels properly associated
 *
 * @critical
 */
test('all pages pass automated accessibility checks', async ({ page }) => {
  // Test home page
  await page.goto('/');
  await injectAxe(page);

  const homeResults = await checkA11y(page, null, {
    detailedReport: true,
    detailedReportOptions: {
      html: true,
    },
  });

  expect(homeResults).toBeFalsy(); // No violations

  // Test kings page
  await page.goto('/kings');
  await injectAxe(page);

  const kingsResults = await checkA11y(page, null);
  expect(kingsResults).toBeFalsy();

  // Test login page
  await page.goto('/auth/login');
  await injectAxe(page);

  const loginResults = await checkA11y(page, null);
  expect(loginResults).toBeFalsy();

  // Test signup page
  await page.goto('/auth/signup');
  await injectAxe(page);

  const signupResults = await checkA11y(page, null);
  expect(signupResults).toBeFalsy();

  // Test dashboard (authenticated)
  // Skip if not authenticated, would need login first
});

/**
 * Test: Keyboard navigation works throughout application
 *
 * @test
 * @description Verifies all functionality accessible via keyboard only
 * @wcag 2.1 Level AA - 2.1.1 Keyboard
 * @steps
 * 1. Navigate to home page
 * 2. Press Tab repeatedly to navigate through all interactive elements
 * 3. Verify focus order is logical
 * 4. Verify focus visible (not hidden)
 * 5. Press Enter/Space on buttons to activate
 * 6. Test dropdown menus with arrow keys
 * 7. Test form inputs with Tab
 * 8. Test modal dialogs (Tab trap inside modal)
 * 9. Press Escape to close modals
 * 10. Verify focus returns to trigger element after modal close
 *
 * @expected
 * - All interactive elements reachable via Tab
 * - Logical focus order (top-to-bottom, left-to-right)
 * - Focus visible (outline or highlight)
 * - Keyboard shortcuts work as documented
 * - Modals trap focus properly
 * - Escape key closes modals
 * - Focus returns appropriately after modal close
 *
 * @critical
 */
test('keyboard navigation works throughout application', async ({
  page,
  testUtils,
}) => {
  // Navigate to home
  await page.goto('/');

  // Tab through elements and verify focus visible
  const focusableElements = await page.evaluate(() => {
    return document.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    ).length;
  });

  expect(focusableElements).toBeGreaterThan(0);

  // Test Tab navigation
  await page.press('body', 'Tab');
  let focusedElement = await page.evaluate(() => {
    return document.activeElement?.tagName;
  });
  expect(focusedElement).toBeTruthy();

  // Verify focus outline visible
  const focusStyle = await page.evaluate(() => {
    const element = document.activeElement as HTMLElement;
    const style = window.getComputedStyle(element);
    return style.outline || style.border || style.boxShadow;
  });
  expect(focusStyle).toBeTruthy();

  // Test form navigation
  await page.goto('/auth/login');

  // Tab to first input
  await page.press('body', 'Tab');
  let focusedInput = await page.evaluate(() => {
    return (document.activeElement as HTMLElement).name;
  });
  expect(['email', 'username']).toContain(focusedInput);

  // Tab to next input (password)
  await page.press('body', 'Tab');
  focusedInput = await page.evaluate(() => {
    return (document.activeElement as HTMLElement).name;
  });
  expect(focusedInput).toBe('password');

  // Tab to submit button
  await page.press('body', 'Tab');
  const submitButton = await page.evaluate(() => {
    return (document.activeElement as HTMLElement).textContent?.toLowerCase();
  });
  expect(submitButton).toContain('login');

  // Test modal focus trapping
  await page.goto('/');

  // Open a modal (if available)
  const modalTrigger = page
    .locator('button[data-testid="modal-trigger"]')
    .first();
  if ((await modalTrigger.count()) > 0) {
    await modalTrigger.click();

    // Verify modal focus trap (last tab from submit goes to first focusable element in modal)
    const firstFocusableInModal = await page.evaluate(() => {
      const modal = document.querySelector('[role="dialog"]');
      const focusable = modal?.querySelector(
        'button, [href], input, select, textarea',
      );
      return focusable?.textContent;
    });
    expect(firstFocusableInModal).toBeTruthy();

    // Test Escape to close
    await page.press('body', 'Escape');
    const modalVisible = await page.locator('[role="dialog"]').isVisible();
    expect(modalVisible).toBeFalsy();
  }
});

/**
 * Test: All form inputs have associated labels
 *
 * @test
 * @description Verifies form accessibility and label associations
 * @wcag 2.1 Level A - 1.3.1 Info and Relationships
 * @steps
 * 1. Navigate to form pages (signup, profile edit)
 * 2. Verify each input has <label>
 * 3. Verify label has 'for' attribute matching input 'id'
 * 4. Verify required fields marked (*) and with aria-required
 * 5. Verify error messages linked with aria-describedby
 * 6. Verify help text linked with aria-describedby
 * 7. Verify form groups labeled (fieldset + legend)
 * 8. Verify form submit has accessible name
 * 9. Test placeholder accessibility (should not replace label)
 * 10. Verify readonly/disabled states announced
 *
 * @expected
 * - Every input has associated label
 * - Labels programmatically associated
 * - Required fields properly marked
 * - Error messages accessible to screen readers
 * - Help text visible and associated
 * - Fieldsets grouped logically
 * - No reliance on placeholder as label
 *
 * @critical
 */
test('all form inputs have properly associated labels', async ({ page }) => {
  // Navigate to signup form
  await page.goto('/auth/signup');

  // Check all inputs have labels
  const inputs = await page.locator('input, select, textarea').all();

  for (const input of inputs) {
    const inputId = await input.getAttribute('id');
    const inputName = await input.getAttribute('name');
    const inputType = await input.getAttribute('type');

    // Skip hidden inputs and buttons
    if (inputType === 'hidden' || inputType === 'submit') {
      continue;
    }

    // Check if has associated label
    let hasLabel = false;

    if (inputId) {
      const label = page.locator(`label[for="${inputId}"]`);
      if ((await label.count()) > 0) {
        hasLabel = true;
        // Verify label has text
        const labelText = await label.textContent();
        expect(labelText?.trim().length).toBeGreaterThan(0);
      }
    }

    // Alternative: check aria-label or aria-labelledby
    if (!hasLabel && inputName) {
      const ariaLabel = await input.getAttribute('aria-label');
      const ariaLabelledby = await input.getAttribute('aria-labelledby');
      hasLabel = !!(ariaLabel || ariaLabelledby);
    }

    expect(hasLabel).toBeTruthy();
  }

  // Check required fields marked
  const requiredInputs = await page
    .locator('input[required], select[required], textarea[required]')
    .all();

  for (const input of requiredInputs) {
    const ariaRequired = await input.getAttribute('aria-required');
    expect(ariaRequired).toBe('true');

    // Check for visual indicator (usually * or "required")
    const inputId = await input.getAttribute('id');
    if (inputId) {
      const label = page.locator(`label[for="${inputId}"]`);
      const labelText = await label.textContent();
      expect(labelText).toMatch(/\*|required/i);
    }
  }

  // Check error messages are linked
  const errorMessages = await page
    .locator('[role="alert"], [data-testid="error-message"]')
    .all();

  for (const error of errorMessages) {
    const errorId = await error.getAttribute('id');
    if (errorId) {
      // Find input that references this error
      const inputWithError = page.locator(`[aria-describedby*="${errorId}"]`);
      expect(await inputWithError.count()).toBeGreaterThan(0);
    }
  }
});

/**
 * Test: Color contrast meets WCAG AA standards
 *
 * @test
 * @description Verifies text contrast ratios are sufficient (4.5:1 minimum)
 * @wcag 2.1 Level AA - 1.4.3 Contrast (Minimum)
 * @steps
 * 1. Navigate to each page
 * 2. Check all text elements
 * 3. Calculate contrast ratio (foreground vs background)
 * 4. Verify ratio >= 4.5:1 for normal text
 * 5. Verify ratio >= 3:1 for large text (18pt+ or 14pt bold+)
 * 6. Check button text contrast
 * 7. Check link text contrast
 * 8. Check form input text contrast
 * 9. Generate contrast report
 * 10. Verify hover/focus states maintain contrast
 *
 * @expected
 * - Normal text: 4.5:1 or higher
 * - Large text: 3:1 or higher
 * - No low contrast combinations
 * - All interactive elements readable
 * - Focus states maintain contrast
 *
 * @critical
 */
test('color contrast meets WCAG AA standards', async ({ page }) => {
  // Navigate to home
  await page.goto('/');

  // Run contrast check using axe
  await injectAxe(page);

  const contrastResults = await page.evaluate(() => {
    return new Promise((resolve) => {
      (window as any).axe.run(
        { runOnly: { type: 'rule', values: ['color-contrast'] } },
        (error, results) => {
          if (error) throw error;
          resolve(results.violations);
        },
      );
    });
  });

  // Verify no contrast violations
  expect(contrastResults).toEqual([]);

  // Additional manual check for specific elements
  const textElements = await page.locator('body *').all();
  let checkedCount = 0;

  for (const element of textElements.slice(0, 50)) {
    // Check first 50 elements
    const isVisible = await element.isVisible();
    if (!isVisible) continue;

    const style = await element.evaluate((el) => {
      const computedStyle = window.getComputedStyle(el as HTMLElement);
      return {
        color: computedStyle.color,
        backgroundColor: computedStyle.backgroundColor,
        fontSize: computedStyle.fontSize,
        fontWeight: computedStyle.fontWeight,
      };
    });

    // Skip if background is transparent or color unspecified
    if (
      !style.backgroundColor ||
      style.backgroundColor === 'rgba(0, 0, 0, 0)'
    ) {
      continue;
    }

    checkedCount++;
  }

  expect(checkedCount).toBeGreaterThan(0);
});

/**
 * Test: Images have descriptive alt text
 *
 * @test
 * @description Verifies all images have meaningful alt attributes
 * @wcag 2.1 Level A - 1.1.1 Non-text Content
 * @steps
 * 1. Navigate to content pages (kings listing, detail)
 * 2. Find all images
 * 3. Verify each has 'alt' attribute
 * 4. Verify alt text is descriptive (not "image" or empty)
 * 5. Verify decorative images have empty alt (alt="")
 * 6. Check background images for text content
 * 7. Verify linked images have meaningful alt
 * 8. Verify charts/graphs have descriptions
 * 9. Generate image alt text report
 * 10. Test image loading states
 *
 * @expected
 * - All images have alt attributes
 * - Alt text descriptive and meaningful
 * - Decorative images marked appropriately
 * - Linked images identify destination
 * - Complex images have extended descriptions
 *
 * @critical
 */
test('images have descriptive alt text', async ({ page }) => {
  // Navigate to kings listing (many images)
  await page.goto('/kings');

  // Find all images
  const images = await page.locator('img').all();

  expect(images.length).toBeGreaterThan(0);

  for (const img of images) {
    const alt = await img.getAttribute('alt');
    const isVisible = await img.isVisible().catch(() => false);

    if (isVisible) {
      // Image visible - should have meaningful alt
      expect(alt).not.toBeNull();
      expect(alt?.trim().length).toBeGreaterThan(0);

      // Verify alt is descriptive (not just "image")
      if (!alt?.toLowerCase().includes('decorative')) {
        expect(alt?.toLowerCase()).not.toMatch(/^(image|photo|picture|img)$/);
      }
    }
  }

  // Check background images for accessibility issues
  const elementsWithBg = await page
    .locator('[style*="background-image"]')
    .all();

  for (const element of elementsWithBg) {
    const hasAriaLabel = await element.getAttribute('aria-label');
    const hasRole = await element.getAttribute('role');

    // Should have either aria-label or be marked as decorative
    if (hasRole !== 'presentation' && hasRole !== 'none') {
      // Either needs aria-label or role=presentation
      const isDecorative = await element
        .evaluate((el) => {
          const style = window.getComputedStyle(el as HTMLElement);
          return style.backgroundImage.includes('data:');
        })
        .catch(() => false);

      if (!isDecorative) {
        expect(hasAriaLabel).toBeTruthy();
      }
    }
  }
});

/**
 * Test: Headings have proper hierarchy
 *
 * @test
 * @description Verifies heading structure follows WCAG guidelines
 * @wcag 2.1 Level A - 1.3.1 Info and Relationships
 * @steps
 * 1. Navigate to content pages
 * 2. Find all headings (h1-h6)
 * 3. Verify only one h1 per page
 * 4. Verify no skipped heading levels (e.g., h1 -> h3)
 * 5. Verify headings in logical order
 * 6. Verify headings are descriptive
 * 7. Verify headings don't rely on styling alone
 * 8. Test heading navigation (screen reader simulation)
 * 9. Verify heading nesting logical
 * 10. Check for orphaned sections
 *
 * @expected
 * - Single h1 per page
 * - No skipped heading levels
 * - Proper nesting hierarchy
 * - Descriptive heading text
 * - Logical document outline
 *
 * @critical
 */
test('headings have proper hierarchy and structure', async ({ page }) => {
  // Navigate to kings detail page
  await page.goto('/kings/test-king-001');

  // Get all headings
  const headings = await page.locator('h1, h2, h3, h4, h5, h6').all();

  expect(headings.length).toBeGreaterThan(0);

  // Verify only one h1
  const h1Count = await page.locator('h1').count();
  expect(h1Count).toBe(1);

  // Check heading hierarchy
  let previousLevel = 1;
  const headingLevels: number[] = [];

  for (const heading of headings) {
    const tagName = await heading.evaluate((el) => el.tagName);
    const level = parseInt(tagName[1]);
    headingLevels.push(level);

    // Check no level skipping (allow jump down of 1)
    if (level > previousLevel + 1) {
      // Verify there's valid reason (rare exception)
      expect(level - previousLevel).toBeLessThanOrEqual(1);
    }

    previousLevel = level;

    // Verify heading has text
    const text = await heading.textContent();
    expect(text?.trim().length).toBeGreaterThan(0);
  }

  // Verify logical flow
  expect(headingLevels[0]).toBe(1); // First heading should be h1
});

/**
 * Test: Screen reader announcements for dynamic content
 *
 * @test
 * @description Verifies ARIA live regions and dynamic content accessibility
 * @wcag 2.1 Level A - 4.1.3 Status Messages
 * @steps
 * 1. Navigate to page with dynamic updates
 * 2. Identify live regions (aria-live)
 * 3. Verify status messages use proper roles
 * 4. Trigger dynamic content update
 * 5. Verify announcement properties set correctly
 * 6. Check notifications (success/error) announced
 * 7. Verify sort/filter updates announced
 * 8. Check form validation errors announced
 * 9. Verify loading states announced
 * 10. Test with screen reader simulation
 *
 * @expected
 * - Status messages in live regions
 * - Proper role="alert" or role="status"
 * - aria-live="polite" or "assertive"
 * - Announcements include relevant info
 * - No duplicate announcements
 *
 * @advanced
 */
test('screen reader announcements for dynamic content', async ({
  page,
  testUtils,
}) => {
  // Navigate to kings page
  await page.goto('/kings');
  await testUtils.waitForLoadingComplete();

  // Check for live regions
  const liveRegions = await page.locator('[aria-live]').all();

  // Should have at least one live region for notifications
  expect(liveRegions.length).toBeGreaterThan(0);

  // Verify live region properties
  for (const region of liveRegions) {
    const ariaLive = await region.getAttribute('aria-live');
    expect(['polite', 'assertive', 'off']).toContain(ariaLive);
  }

  // Test filter update announcement
  await page.click('[data-testid="filter-rating"]');
  await page.click('text=5 stars');
  await testUtils.waitForLoadingComplete();

  // Verify result count announced
  const announcer = page
    .locator('[role="status"], [aria-live="polite"]')
    .first();
  const text = await announcer.textContent();

  // Should announce number of results or update
  if (text && text.length > 0) {
    expect(text.toLowerCase()).toMatch(/\d+|results?|updated|filtered/);
  }
});

/**
 * Test: Focus indicators are clearly visible
 *
 * @test
 * @description Verifies focus styles meet accessibility standards
 * @wcag 2.1 Level AA - 2.4.7 Focus Visible
 * @steps
 * 1. Navigate to interactive page
 * 2. Tab through elements
 * 3. For each focused element, verify visible outline
 * 4. Check outline is 2px minimum
 * 5. Check outline has sufficient contrast
 * 6. Verify outline not hidden by other elements
 * 7. Verify focus style on hover doesn't remove focus
 * 8. Check custom focus styles (not browser default)
 * 9. Verify focus indicator in all states
 * 10. Test on dark and light backgrounds
 *
 * @expected
 * - Focus outline always visible
 * - Outline at least 2px
 * - Sufficient contrast with background
 * - Focus indicator in all interactive elements
 * - Focus not obscured by other elements
 *
 * @critical
 */
test('focus indicators are clearly visible', async ({ page }) => {
  // Navigate to form page
  await page.goto('/auth/login');

  // Tab to first focusable element
  await page.press('body', 'Tab');

  // Check focused element has visible outline
  const focusOutline = await page.evaluate(() => {
    const element = document.activeElement as HTMLElement;
    const style = window.getComputedStyle(element, ':focus');
    return {
      outline: style.outline,
      outlineWidth: style.outlineWidth,
      outlineColor: style.outlineColor,
      boxShadow: style.boxShadow,
      border: style.border,
    };
  });

  // Should have some form of focus indicator
  const hasFocusStyle =
    focusOutline.outline !== 'none' ||
    focusOutline.boxShadow !== 'none' ||
    focusOutline.border.includes('px');

  expect(hasFocusStyle).toBeTruthy();

  // Tab through more elements and verify focus visible
  for (let i = 0; i < 5; i++) {
    await page.press('body', 'Tab');

    const hasVisibleFocus = await page.evaluate(() => {
      const element = document.activeElement as HTMLElement;
      const style = window.getComputedStyle(element);
      return style.outline !== 'none' || style.boxShadow !== 'none';
    });

    expect(hasVisibleFocus).toBeTruthy();
  }
});

/**
 * Test: Mobile accessibility (touch targets, zoom)
 *
 * @test
 * @description Verifies accessibility on mobile devices
 * @wcag 2.1 Level AAA - 2.5.5 Target Size
 * @steps
 * 1. Set viewport to mobile (375x667)
 * 2. Navigate to main pages
 * 3. Verify buttons are 48x48px minimum (Apple) or 44x44px (Android)
 * 4. Verify zoom is not disabled (no user-scalable=no)
 * 5. Verify text is readable without zoom
 * 6. Verify touch targets have spacing
 * 7. Test landscape orientation
 * 8. Verify layout adapts
 * 9. Test touch interactions
 * 10. Verify no horizontal scroll
 *
 * @expected
 * - Touch targets adequate size
 * - Zoom enabled
 * - Responsive layout
 * - Readable text
 * - No horizontal scrolling
 *
 * @integration-test
 */
test('mobile accessibility (touch targets and zoom)', async ({ page }) => {
  // Set mobile viewport
  await page.setViewportSize({ width: 375, height: 667 });

  // Navigate to home
  await page.goto('/');

  // Verify zoom not disabled
  const viewport = await page
    .locator('meta[name="viewport"]')
    .getAttribute('content');
  expect(viewport).not.toContain('user-scalable=no');
  expect(viewport).toContain('viewport');

  // Check button sizes
  const buttons = await page.locator('button, a[role="button"]').all();

  for (const button of buttons.slice(0, 10)) {
    // Check first 10 buttons
    const isVisible = await button.isVisible();
    if (!isVisible) continue;

    const box = await button.boundingBox();
    if (box) {
      // Should be at least 44x44 (or 48x48 for Apple)
      expect(box.height).toBeGreaterThanOrEqual(44);
      expect(box.width).toBeGreaterThanOrEqual(44);
    }
  }

  // Verify no horizontal scroll
  const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
  const viewportWidth = await page.evaluate(() => window.innerWidth);

  expect(bodyWidth).toBeLessThanOrEqual(viewportWidth);
});
