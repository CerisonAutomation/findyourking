import { test as base, expect } from '@playwright/test';
import path from 'path';

/**
 * Test user fixtures for E2E testing
 * Pre-configured user accounts for various test scenarios
 *
 * Usage:
 * ```ts
 * test('login with valid user', async ({ authenticatedPage, testUser }) => {
 *   await authenticatedPage.goto('/dashboard');
 * });
 * ```
 *
 * @file Defines custom fixtures and user data for E2E tests
 * @see https://playwright.dev/docs/test-fixtures
 */

/**
 * Test user credentials for various scenarios
 * @type {Object}
 */
export const testUsers = {
  /**
   * Standard test user for login/signup flows
   * @property {string} email - Test email address
   * @property {string} password - Test password
   * @property {string} fullName - User full name
   */
  valid: {
    email: 'test.user@findyourking.local',
    password: 'TestPassword123!@#',
    fullName: 'Test User',
  },

  /**
   * Admin user with elevated permissions
   */
  admin: {
    email: 'admin@findyourking.local',
    password: 'AdminPassword123!@#',
    fullName: 'Admin User',
    role: 'admin',
  },

  /**
   * King/Creator user account
   */
  king: {
    email: 'king.test@findyourking.local',
    password: 'KingPassword123!@#',
    fullName: 'King User',
    role: 'king',
  },

  /**
   * Invalid credentials for negative testing
   */
  invalid: {
    email: 'nonexistent@findyourking.local',
    password: 'WrongPassword123!@#',
  },

  /**
   * User with incomplete profile
   */
  incomplete: {
    email: 'incomplete@findyourking.local',
    password: 'TestPassword123!@#',
    fullName: 'Incomplete User',
  },
} as const;

/**
 * Extended test type with custom fixtures
 * Provides pre-configured page contexts, authenticated sessions, and utilities
 */
export const test = base.extend<{
  /**
   * Page with custom authentication setup
   * Bypasses login flow for faster test execution
   */
  authenticatedPage: typeof base.page;

  /**
   * Direct navigation with automatic auth token injection
   * Simulates authenticated user without UI login
   */
  authPage: (url: string) => Promise<void>;

  /**
   * Test user object with credentials
   */
  testUser: typeof testUsers.valid;

  /**
   * Utilities for common test operations
   */
  testUtils: {
    /**
     * Clear browser storage (cookies, localStorage, sessionStorage)
     * Useful for cleanup between tests
     */
    clearStorage: () => Promise<void>;

    /**
     * Get authentication token from localStorage
     * Returns null if not authenticated
     */
    getAuthToken: () => Promise<string | null>;

    /**
     * Set authentication token directly
     * Bypasses login UI for faster test setup
     */
    setAuthToken: (token: string) => Promise<void>;

    /**
     * Wait for network requests to complete
     * Useful for async operations
     */
    waitForNetworkIdle: () => Promise<void>;

    /**
     * Intercept and mock API responses
     * Useful for testing error states and edge cases
     */
    mockApiResponse: (url: string, response: any) => Promise<void>;

    /**
     * Take consistent screenshot for visual regression
     * Automatically names based on test name
     */
    takeScreenshot: (name?: string) => Promise<void>;

    /**
     * Perform user login through UI
     * Returns authentication token
     */
    loginViaUI: (email: string, password: string) => Promise<string>;

    /**
     * Perform user signup through UI
     * Returns authentication token
     */
    signupViaUI: (
      email: string,
      password: string,
      fullName: string,
    ) => Promise<string>;

    /**
     * Logout current user
     * Clears all authentication data
     */
    logout: () => Promise<void>;

    /**
     * Fill and submit a form
     * Handles text inputs, selects, checkboxes, etc.
     */
    fillForm: (formData: Record<string, string | boolean>) => Promise<void>;

    /**
     * Wait for loading state to disappear
     * Indicates page/component ready for interaction
     */
    waitForLoadingComplete: () => Promise<void>;

    /**
     * Assert page error notification
     * Verify error message content
     */
    expectErrorNotification: (message: string) => Promise<void>;

    /**
     * Assert page success notification
     * Verify success message content
     */
    expectSuccessNotification: (message: string) => Promise<void>;
  };
}>({
  /**
   * Setup authenticated page with pre-configured session
   * Injects auth token to skip login flow
   */
  authenticatedPage: async ({ page, context }, use) => {
    // Navigate to app to establish session
    await page.goto('/');

    // Inject mock auth token (in real tests, use actual auth token)
    await page.evaluate(() => {
      const mockToken = 'mock-jwt-token-for-testing';
      localStorage.setItem('auth-token', mockToken);
      localStorage.setItem('user-id', 'test-user-123');
    });

    await use(page);
  },

  /**
   * Setup direct authenticated navigation
   */
  authPage: async ({ authenticatedPage }, use) => {
    const navigate = async (url: string) => {
      await authenticatedPage.goto(url);
      // Verify authentication is in place
      const token = await authenticatedPage.evaluate(() =>
        localStorage.getItem('auth-token'),
      );
      if (!token) {
        throw new Error('Authentication token not found');
      }
    };

    await use(navigate);
  },

  /**
   * Provide test user object
   */
  testUser: async ({}, use) => {
    await use(testUsers.valid);
  },

  /**
   * Provide test utilities
   */
  testUtils: async ({ page }, use) => {
    const utils = {
      /**
       * Clear all browser storage
       */
      clearStorage: async () => {
        await page.context().clearCookies();
        await page.evaluate(() => {
          localStorage.clear();
          sessionStorage.clear();
        });
      },

      /**
       * Get auth token from localStorage
       */
      getAuthToken: async () => {
        return await page.evaluate(() => localStorage.getItem('auth-token'));
      },

      /**
       * Set auth token directly
       */
      setAuthToken: async (token: string) => {
        await page.evaluate((t) => {
          localStorage.setItem('auth-token', t);
        }, token);
      },

      /**
       * Wait for network to idle
       */
      waitForNetworkIdle: async () => {
        await page.waitForLoadState('networkidle');
      },

      /**
       * Mock API response
       */
      mockApiResponse: async (url: string, response: any) => {
        await page.route(url, (route) => {
          route.abort('blockedbyclient');
        });
      },

      /**
       * Take screenshot with auto-naming
       */
      takeScreenshot: async (name?: string) => {
        const testName = name || 'screenshot';
        await page.screenshot({
          path: path.join('test-results', `${testName}.png`),
          fullPage: true,
        });
      },

      /**
       * Login through UI
       */
      loginViaUI: async (email: string, password: string) => {
        await page.goto('/auth/login');
        await page.fill('input[type="email"]', email);
        await page.fill('input[type="password"]', password);
        await page.click('button[type="submit"]');
        await page.waitForNavigation();

        // Extract and return auth token
        const token = await page.evaluate(() =>
          localStorage.getItem('auth-token'),
        );
        return token || '';
      },

      /**
       * Signup through UI
       */
      signupViaUI: async (
        email: string,
        password: string,
        fullName: string,
      ) => {
        await page.goto('/auth/signup');
        await page.fill('input[name="fullName"]', fullName);
        await page.fill('input[type="email"]', email);
        await page.fill('input[type="password"]', password);
        await page.click('button[type="submit"]');
        await page.waitForNavigation();

        const token = await page.evaluate(() =>
          localStorage.getItem('auth-token'),
        );
        return token || '';
      },

      /**
       * Logout current user
       */
      logout: async () => {
        await page.goto('/auth/logout');
        await page.waitForNavigation();
        await utils.clearStorage();
      },

      /**
       * Fill form with data
       */
      fillForm: async (formData: Record<string, string | boolean>) => {
        for (const [key, value] of Object.entries(formData)) {
          const selector = `[name="${key}"]`;
          const element = await page.$(selector);

          if (!element) {
            throw new Error(`Form field not found: ${key}`);
          }

          const type = await element.getAttribute('type');

          if (type === 'checkbox') {
            if (value) {
              await element.check();
            } else {
              await element.uncheck();
            }
          } else if (type === 'radio') {
            await element.click();
          } else {
            await element.fill(String(value));
          }
        }
      },

      /**
       * Wait for loading to complete
       */
      waitForLoadingComplete: async () => {
        // Wait for any spinners/loading states to disappear
        await page
          .waitForSelector('[data-testid="loading-spinner"]', {
            state: 'hidden',
          })
          .catch(() => {});
        await page.waitForLoadState('networkidle');
      },

      /**
       * Assert error notification
       */
      expectErrorNotification: async (message: string) => {
        const notification = page.locator('[data-testid="error-notification"]');
        await expect(notification).toContainText(message);
      },

      /**
       * Assert success notification
       */
      expectSuccessNotification: async (message: string) => {
        const notification = page.locator(
          '[data-testid="success-notification"]',
        );
        await expect(notification).toContainText(message);
      },
    };

    await use(utils);
  },
});

/**
 * Export expect from Playwright for assertions
 * Usage: expect(value).toBe(expected)
 */
export { expect };
