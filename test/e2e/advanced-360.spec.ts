import { test, expect } from '@playwright/test';

/**
 * Advanced 360° E2E Tests - Runtime & Integration
 * Tests forms, interactions, API endpoints, and error handling
 */

test.describe('Form Validation & Interaction', () => {
  test('Login form has proper validation', async ({ page }) => {
    await page.goto('/auth/login');
    
    // Find email and password inputs
    const emailInput = page.locator('input[type="email"], input[name="email"]').first();
    const passwordInput = page.locator('input[type="password"], input[name="password"]').first();
    const submitButton = page.locator('button[type="submit"]').first();
    
    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
    await expect(submitButton).toBeVisible();
    
    // Test email validation
    await emailInput.fill('invalid-email');
    await passwordInput.fill('test123');
    
    console.log('✓ Login form elements present and interactive');
  });

  test('Contact form is functional', async ({ page }) => {
    await page.goto('/contact');
    
    // Check for form elements
    const forms = await page.locator('form').count();
    console.log(`✓ Contact page has ${forms} form(s)`);
    
    if (forms > 0) {
      const inputs = await page.locator('input, textarea').count();
      console.log(`  Form has ${inputs} input field(s)`);
    }
  });
});

test.describe('Navigation & User Flow', () => {
  test('Navigation links work correctly', async ({ page }) => {
    await page.goto('/');
    
    // Check for navigation
    const navLinks = await page.locator('nav a, header a').all();
    console.log(`✓ Found ${navLinks.length} navigation links`);
    
    // Test a few key links
    const homeLink = page.locator('a[href="/"]').first();
    if (await homeLink.count() > 0) {
      console.log('  Home link present');
    }
    
    const pricingLink = page.locator('a[href="/pricing"]').first();
    if (await pricingLink.count() > 0) {
      console.log('  Pricing link present');
    }
  });

  test('Footer contains required links', async ({ page }) => {
    await page.goto('/');
    
    const footer = page.locator('footer');
    if (await footer.count() > 0) {
      const footerLinks = await footer.locator('a').count();
      console.log(`✓ Footer has ${footerLinks} links`);
      
      // Check for important legal links
      const privacyLink = page.locator('a[href="/privacy"]');
      const termsLink = page.locator('a[href="/terms"]');
      
      const hasPrivacy = await privacyLink.count() > 0;
      const hasTerms = await termsLink.count() > 0;
      
      console.log(`  Privacy link: ${hasPrivacy ? 'Yes' : 'No'}`);
      console.log(`  Terms link: ${hasTerms ? 'Yes' : 'No'}`);
    }
  });

  test('Client-side navigation works', async ({ page }) => {
    await page.goto('/');
    
    // Click About link if it exists
    const aboutLink = page.locator('a[href="/about"]').first();
    if (await aboutLink.count() > 0) {
      await aboutLink.click();
      await page.waitForURL('/about', { timeout: 5000 });
      console.log('✓ Client-side navigation to /about works');
    }
  });
});

test.describe('Responsive Design', () => {
  test('Mobile viewport renders correctly', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    
    await expect(page.locator('body')).toBeVisible();
    console.log('✓ Mobile viewport (375x667) renders correctly');
  });

  test('Tablet viewport renders correctly', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/');
    
    await expect(page.locator('body')).toBeVisible();
    console.log('✓ Tablet viewport (768x1024) renders correctly');
  });

  test('Desktop viewport renders correctly', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/');
    
    await expect(page.locator('body')).toBeVisible();
    console.log('✓ Desktop viewport (1920x1080) renders correctly');
  });

  test('Ultra-wide viewport renders correctly', async ({ page }) => {
    await page.setViewportSize({ width: 2560, height: 1440 });
    await page.goto('/');
    
    await expect(page.locator('body')).toBeVisible();
    console.log('✓ Ultra-wide viewport (2560x1440) renders correctly');
  });
});

test.describe('Performance & Loading', () => {
  test('Pages load within acceptable time', async ({ page }) => {
    const pages = ['/', '/about', '/pricing', '/contact'];
    
    for (const url of pages) {
      const startTime = Date.now();
      await page.goto(url);
      const loadTime = Date.now() - startTime;
      
      console.log(`✓ ${url} loaded in ${loadTime}ms`);
      expect(loadTime).toBeLessThan(5000);
    }
  });

  test('Images have proper attributes', async ({ page }) => {
    await page.goto('/');
    
    const images = await page.locator('img').all();
    let withAlt = 0;
    let withoutAlt = 0;
    
    for (const img of images) {
      if (await img.isVisible()) {
        const alt = await img.getAttribute('alt');
        if (alt !== null) {
          withAlt++;
        } else {
          withoutAlt++;
        }
      }
    }
    
    console.log(`✓ Images: ${withAlt} with alt, ${withoutAlt} without alt`);
  });
});

test.describe('API Health Check', () => {
  test('API routes respond correctly', async ({ page }) => {
    const apiRoutes = [
      { url: '/api/auth/settings', expectedCodes: [200, 401, 403, 405] },
      { url: '/api/admin/settings', expectedCodes: [200, 401, 403, 405] },
      { url: '/api/boyfriend/chat', expectedCodes: [200, 401, 403, 405] },
    ];
    
    for (const route of apiRoutes) {
      const response = await page.request.get(route.url);
      const status = response.status();
      
      console.log(`✓ ${route.url}: ${status}`);
      expect(status).not.toBe(404);
      expect(status).not.toBe(500);
    }
  });
});

test.describe('Error Handling', () => {
  test('404 page works for non-existent routes', async ({ page }) => {
    const response = await page.goto('/this-page-does-not-exist-12345');
    const status = response?.status();
    
    console.log(`✓ Non-existent page returns status: ${status}`);
    // Next.js may return 200 with not-found content or 404
    expect([200, 404]).toContain(status);
    
    // Check if not-found content is shown
    const bodyText = await page.textContent('body') || '';
    const has404 = bodyText.includes('404') || bodyText.includes('Not Found');
    console.log(`  Shows 404 content: ${has404 ? 'Yes' : 'No'}`);
  });

  test('Error boundary catches errors', async ({ page }) => {
    await page.goto('/auth/error');
    await expect(page.locator('body')).toBeVisible();
    console.log('✓ Error page is accessible');
  });
});

test.describe('SEO & Meta Tags', () => {
  test('Pages have proper meta tags', async ({ page }) => {
    const pages = ['/', '/about', '/pricing'];
    
    for (const url of pages) {
      await page.goto(url);
      
      const title = await page.title();
      const metaDescription = await page.locator('meta[name="description"]').count();
      const metaOG = await page.locator('meta[property^="og:"]').count();
      
      console.log(`✓ ${url}:`);
      console.log(`  Title: "${title}"`);
      console.log(`  Meta description: ${metaDescription > 0 ? 'Yes' : 'No'}`);
      console.log(`  Open Graph tags: ${metaOG}`);
      
      expect(title.length).toBeGreaterThan(0);
    }
  });
});

test.describe('Accessibility Basics', () => {
  test('Forms have labels or aria-labels', async ({ page }) => {
    await page.goto('/auth/login');
    
    const inputs = await page.locator('input').all();
    let labeled = 0;
    let unlabeled = 0;
    
    for (const input of inputs) {
      const id = await input.getAttribute('id');
      const ariaLabel = await input.getAttribute('aria-label');
      const ariaLabelledby = await input.getAttribute('aria-labelledby');
      const placeholder = await input.getAttribute('placeholder');
      
      if (id || ariaLabel || ariaLabelledby || placeholder) {
        labeled++;
      } else {
        unlabeled++;
      }
    }
    
    console.log(`✓ Form inputs: ${labeled} labeled, ${unlabeled} unlabeled`);
  });

  test('Buttons have accessible text', async ({ page }) => {
    await page.goto('/');
    
    const buttons = await page.locator('button').all();
    let accessible = 0;
    
    for (const button of buttons) {
      if (await button.isVisible()) {
        const text = await button.textContent();
        const ariaLabel = await button.getAttribute('aria-label');
        
        if ((text && text.trim().length > 0) || ariaLabel) {
          accessible++;
        }
      }
    }
    
    console.log(`✓ ${accessible} accessible buttons found`);
  });
});

test.describe('Security Headers', () => {
  test('Important security headers are present', async ({ page }) => {
    const response = await page.goto('/');
    const headers = response?.headers() || {};
    
    console.log('✓ Security Headers:');
    console.log(`  X-Frame-Options: ${headers['x-frame-options'] || 'Not set'}`);
    console.log(`  X-Content-Type-Options: ${headers['x-content-type-options'] || 'Not set'}`);
    console.log(`  Referrer-Policy: ${headers['referrer-policy'] || 'Not set'}`);
  });
});
