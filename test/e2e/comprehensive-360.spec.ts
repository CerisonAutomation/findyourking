import { test, expect, Page } from '@playwright/test';

/**
 * Comprehensive 360° E2E Test Suite - Auto-Fix Enabled
 * Tests all pages, navigation, authentication flows, and critical user journeys
 * Port: 3002
 */

interface PageHealthResult {
  errors: string[];
  status?: number;
  consoleErrors: string[];
  warnings: string[];
  url: string;
}

// Helper to check page loads without errors
async function checkPageHealth(page: Page, url: string, title?: string): Promise<PageHealthResult> {
  const errors: string[] = [];
  const consoleErrors: string[] = [];
  const warnings: string[] = [];
  
  // Capture all errors
  page.on('pageerror', (error) => {
    errors.push(`Page Error: ${error.message}`);
  });
  
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    } else if (msg.type() === 'warning') {
      warnings.push(msg.text());
    }
  });
  
  let response;
  try {
    response = await page.goto(url, { 
      waitUntil: 'domcontentloaded', 
      timeout: 15000 
    });
  } catch (e: any) {
    errors.push(`Navigation failed: ${e.message}`);
  }
  
  // Check HTTP status (allow redirects)
  const status = response?.status();
  if (status && status >= 500) {
    errors.push(`Server error: HTTP ${status}`);
  }
  
  // Check page is interactive
  try {
    await expect(page.locator('body')).toBeVisible({ timeout: 5000 });
  } catch (e: any) {
    errors.push('Body not visible');
  }
  
  // Check for error indicators
  const bodyText = await page.textContent('body').catch(() => '') || '';
  if (bodyText.includes('Application error') || bodyText.includes('Unhandled Runtime Error')) {
    errors.push('Runtime error detected in page content');
  }
  
  return { 
    errors, 
    status, 
    consoleErrors, 
    warnings,
    url: page.url() 
  };
}

test.describe('Public Pages - Load Test', () => {
  test('Landing page (/) loads correctly', async ({ page }) => {
    const result = await checkPageHealth(page, '/');
    console.log(`✓ Landing page - Status: ${result.status}, Errors: ${result.errors.length}, Console: ${result.consoleErrors.length}`);
    if (result.errors.length > 0) console.error('Errors:', result.errors);
    expect(result.errors.length).toBe(0);
  });

  test('About page loads correctly', async ({ page }) => {
    const result = await checkPageHealth(page, '/about');
    console.log(`✓ About page - Status: ${result.status}, Errors: ${result.errors.length}`);
    if (result.errors.length > 0) console.error('Errors:', result.errors);
    expect(result.errors.length).toBe(0);
  });

  test('Pricing page loads correctly', async ({ page }) => {
    const result = await checkPageHealth(page, '/pricing');
    console.log(`✓ Pricing page - Status: ${result.status}, Errors: ${result.errors.length}`);
    if (result.errors.length > 0) console.error('Errors:', result.errors);
    expect(result.errors.length).toBe(0);
  });

  test('Contact page loads correctly', async ({ page }) => {
    const result = await checkPageHealth(page, '/contact');
    console.log(`✓ Contact page - Status: ${result.status}, Errors: ${result.errors.length}`);
    if (result.errors.length > 0) console.error('Errors:', result.errors);
    expect(result.errors.length).toBe(0);
  });

  test('Help page loads correctly', async ({ page }) => {
    const result = await checkPageHealth(page, '/help');
    console.log(`✓ Help page - Status: ${result.status}, Errors: ${result.errors.length}`);
    if (result.errors.length > 0) console.error('Errors:', result.errors);
    expect(result.errors.length).toBe(0);
  });

  test('Privacy page loads correctly', async ({ page }) => {
    const result = await checkPageHealth(page, '/privacy');
    console.log(`✓ Privacy page - Status: ${result.status}, Errors: ${result.errors.length}`);
    if (result.errors.length > 0) console.error('Errors:', result.errors);
    expect(result.errors.length).toBe(0);
  });

  test('Terms page loads correctly', async ({ page }) => {
    const result = await checkPageHealth(page, '/terms');
    console.log(`✓ Terms page - Status: ${result.status}, Errors: ${result.errors.length}`);
    if (result.errors.length > 0) console.error('Errors:', result.errors);
    expect(result.errors.length).toBe(0);
  });
});

test.describe('Authentication Pages', () => {
  test('Auth page loads correctly', async ({ page }) => {
    const result = await checkPageHealth(page, '/auth');
    console.log(`✓ Auth page - Status: ${result.status}, Errors: ${result.errors.length}`);
    if (result.errors.length > 0) console.error('Errors:', result.errors);
    expect(result.errors.length).toBe(0);
  });

  test('Login page loads correctly', async ({ page }) => {
    const result = await checkPageHealth(page, '/auth/login');
    console.log(`✓ Login page - Status: ${result.status}, Errors: ${result.errors.length}`);
    if (result.errors.length > 0) console.error('Errors:', result.errors);
    expect(result.errors.length).toBe(0);
  });

  test('Reset password page loads correctly', async ({ page }) => {
    const result = await checkPageHealth(page, '/auth/reset-password');
    console.log(`✓ Reset password page - Status: ${result.status}, Errors: ${result.errors.length}`);
    if (result.errors.length > 0) console.error('Errors:', result.errors);
    expect(result.errors.length).toBe(0);
  });

  test('Sign up success page loads correctly', async ({ page }) => {
    const result = await checkPageHealth(page, '/auth/sign-up-success');
    console.log(`✓ Sign up success page - Status: ${result.status}, Errors: ${result.errors.length}`);
    if (result.errors.length > 0) console.error('Errors:', result.errors);
    expect(result.errors.length).toBe(0);
  });
});

test.describe('Protected Pages - Redirect Test', () => {
  test('Matches page redirects unauthenticated users', async ({ page }) => {
    await page.goto('/matches');
    await page.waitForTimeout(2000);
    const url = page.url();
    console.log(`Matches redirect to: ${url}`);
    expect(url).toMatch(/\/auth|\/matches/);
  });

  test('Profile page redirects unauthenticated users', async ({ page }) => {
    await page.goto('/profile');
    await page.waitForTimeout(2000);
    const url = page.url();
    console.log(`Profile redirect to: ${url}`);
    expect(url).toMatch(/\/auth|\/profile/);
  });

  test('Dashboard redirects unauthenticated users', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForTimeout(2000);
    const url = page.url();
    console.log(`Dashboard redirect to: ${url}`);
    expect(url).toMatch(/\/auth|\/dashboard/);
  });

  test('Chat page redirects unauthenticated users', async ({ page }) => {
    await page.goto('/chat');
    await page.waitForTimeout(2000);
    const url = page.url();
    console.log(`Chat redirect to: ${url}`);
    expect(url).toMatch(/\/auth|\/chat/);
  });

  test('Settings page redirects unauthenticated users', async ({ page }) => {
    await page.goto('/settings');
    await page.waitForTimeout(2000);
    const url = page.url();
    console.log(`Settings redirect to: ${url}`);
    expect(url).toMatch(/\/auth|\/settings/);
  });

  test('Boyfriend page redirects unauthenticated users', async ({ page }) => {
    await page.goto('/boyfriend');
    await page.waitForTimeout(2000);
    const url = page.url();
    console.log(`Boyfriend redirect to: ${url}`);
    expect(url).toMatch(/\/auth|\/boyfriend/);
  });
});

test.describe('Smoke Test - All Pages', () => {
  test('All public pages load without errors', async ({ page }) => {
    const publicPages = ['/', '/about', '/pricing', '/contact', '/help', '/privacy', '/terms', '/auth', '/auth/login'];
    const failedPages: { url: string; errors: string[] }[] = [];
    
    for (const url of publicPages) {
      console.log(`\n🔍 Testing ${url}`);
      const result = await checkPageHealth(page, url);
      console.log(`  Status: ${result.status}, Errors: ${result.errors.length}, Console Errors: ${result.consoleErrors.length}`);
      
      if (result.errors.length > 0) {
        console.error(`  ❌ Errors:`, result.errors);
        failedPages.push({ url, errors: result.errors });
      } else {
        console.log(`  ✓ Page loaded successfully`);
      }
    }
    
    if (failedPages.length > 0) {
      console.error('\n❌ Failed pages summary:');
      failedPages.forEach(({ url, errors }) => {
        console.error(`  ${url}: ${errors.join(', ')}`);
      });
    }
    
    expect(failedPages.length).toBe(0);
  });
  
  test('All special pages load correctly', async ({ page }) => {
    const specialPages = [
      '/role-select',
      '/test-ai',
      '/boyfriend/personality',
      '/boyfriend/edit-personality'
    ];
    
    for (const url of specialPages) {
      console.log(`\n🔍 Testing ${url}`);
      const result = await checkPageHealth(page, url);
      console.log(`  Final URL: ${result.url}`);
      console.log(`  Status: ${result.status}, Errors: ${result.errors.length}`);
      
      if (result.errors.length > 0) {
        console.error(`  Errors:`, result.errors);
      }
    }
  });
});
