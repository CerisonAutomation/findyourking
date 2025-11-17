import { defineConfig, devices } from '@playwright/test';

/**
 * Configuration object for Playwright E2E testing framework
 * @file Defines test execution parameters, browser configurations, and project settings
 * @see https://playwright.dev/docs/test-configuration
 *
 * Key Features:
 * - Multi-browser testing: Chrome, Firefox, Safari, and mobile viewports
 * - Parallel execution with 4 workers for fast test runs
 * - 30-second timeout per test with 10-second timeout per network request
 * - Auto-retry failed tests up to 2 times
 * - HTML report generation and tracing for debugging
 * - Screenshot and video capture on test failure
 * - Local development server integration on port 3000
 *
 * @example
 * // Run all tests
 * pnpm test:e2e
 *
 * // Run specific test file
 * pnpm test:e2e auth.spec.ts
 *
 * // Run with UI mode for debugging
 * pnpm test:e2e:ui
 *
 * // Run with headed browser
 * pnpm test:e2e --headed
 */

/**
 * Base URL for all test requests
 * Points to local development server running Next.js application
 * @type {string}
 */
const BASE_URL =
  process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3000';

/**
 * Timeout configuration in milliseconds
 * @type {Object}
 */
const timeoutConfig = {
  /** Maximum time for entire test execution */
  testTimeout: 30 * 1000,
  /** Maximum time for each action (click, type, etc.) */
  actionTimeout: 10 * 1000,
  /** Maximum time for expect assertions */
  expectTimeout: 5 * 1000,
  /** Maximum time for navigation to complete */
  navigationTimeout: 30 * 1000,
} as const;

/**
 * Retry configuration for test resilience
 * @type {Object}
 */
const retryConfig = {
  /** Number of retries for failed tests in CI */
  retries: process.env.CI ? 2 : 0,
  /** Number of retries for failed expect assertions */
  expectRetries: 2,
} as const;

/**
 * Playwright test configuration with comprehensive setup
 * Includes all browser targets, reporter configuration, and test parameters
 *
 * @typedef {Object} PlaywrightConfig
 * @property {string} testDir - Directory containing test files
 * @property {string} testMatch - Pattern to match test files
 * @property {string} testIgnore - Pattern to ignore certain files
 * @property {number} fullyParallel - Run tests in full parallelization
 * @property {number} forbidOnly - Fail if tests contain .only
 * @property {number} retries - Retry configuration
 * @property {number} workers - Number of parallel workers
 * @property {string} reporter - Test reporter format
 * @property {Object} use - Base configuration for all tests
 * @property {Array} projects - Browser projects configuration
 * @property {Object} webServer - Local development server configuration
 * @property {Object} outputFolder - Artifacts location
 */
export default defineConfig({
  /**
   * Directory containing test specifications
   * @default '__tests__/e2e'
   */
  testDir: './e2e',

  /**
   * Pattern to match test files by convention
   * @default '**\/*.@(spec|test).@(ts|js)'
   */
  testMatch: '**/*.spec.ts',

  /**
   * Pattern to ignore certain files during test discovery
   * Excludes fixtures and utilities from being treated as tests
   */
  testIgnore: ['**/fixtures/**', '**/utils/**'],

  /**
   * Run all tests in parallel across workers
   * Set to false for sequential execution if tests have shared dependencies
   */
  fullyParallel: true,

  /**
   * Fail the test run if any test is marked with .only
   * Prevents accidentally committing focused tests
   */
  forbidOnly: !!process.env.CI,

  /**
   * Abort test run if no tests were found
   * Prevents false positives from missing test files
   */
  forbidUnusedFixtures: true,

  /**
   * Timeout configurations for test execution
   * @see timeoutConfig
   */
  ...timeoutConfig,

  /**
   * Retry configuration for CI resilience
   * @see retryConfig
   */
  ...retryConfig,

  /**
   * Number of parallel workers for test execution
   * Reduced to 1 in CI for stability, full parallelization in local
   */
  workers: process.env.CI ? 1 : 4,

  /**
   * Test reporter configuration
   * Generates HTML report and outputs to console
   * HTML reports stored in: playwright-report/
   *
   * @see https://playwright.dev/docs/test-reporters
   */
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['json', { outputFile: 'playwright-results.json' }],
    ['junit', { outputFile: 'playwright-junit.xml' }],
    ['list'],
  ],

  /**
   * Base configuration for all tests
   * Applied to each test execution context
   * @see https://playwright.dev/docs/api/class-testoptions
   */
  use: {
    /**
     * Base URL for all page.goto() calls without a full URL
     * Allows tests to use relative paths
     */
    baseURL: BASE_URL,

    /**
     * Whether to run in headed mode (show browser UI)
     * Override with --headed flag on CLI
     */
    headless: !process.env.HEADED,

    /**
     * Slow down Playwright actions by specified milliseconds
     * Useful for debugging and visual inspection
     */
    slowMo: process.env.SLOW_MO ? parseInt(process.env.SLOW_MO) : 0,

    /**
     * Screenshot configuration
     * Capture failed test screenshots for debugging
     */
    screenshot: 'only-on-failure',

    /**
     * Video configuration
     * Record videos only for failed tests to save storage
     */
    video: 'retain-on-failure',

    /**
     * Trace configuration for debugging
     * Creates trace files for step-by-step replay
     */
    trace: 'on-first-retry',

    /**
     * Browser action timeout
     * @see timeoutConfig.actionTimeout
     */
    actionTimeout: timeoutConfig.actionTimeout,

    /**
     * Navigation timeout
     * @see timeoutConfig.navigationTimeout
     */
    navigationTimeout: timeoutConfig.navigationTimeout,

    /**
     * Accept downloads without showing dialog
     */
    acceptDownloads: true,

    /**
     * Emulate network conditions
     * Can be set to 'slow-4g', 'fast-4g', or false for offline
     */
    offline: false,

    /**
     * HTTP headers to include in all requests
     * Useful for auth tokens or custom headers
     */
    extraHTTPHeaders: {
      'User-Agent': 'Playwright E2E Test Suite',
    },
  },

  /**
   * Projects define different browser contexts and configurations
   * Each project runs all tests with its specific settings
   *
   * @see https://playwright.dev/docs/test-projects
   */
  projects: [
    /**
     * Desktop Chrome browser testing
     * Primary target for most applications
     */
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },

    /**
     * Desktop Firefox browser testing
     * Tests cross-browser compatibility
     */
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },

    /**
     * Desktop Safari browser testing
     * macOS-specific browser compatibility
     * Note: Requires macOS for local execution
     */
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },

    /**
     * Mobile Chrome browser testing
     * Tests responsive design on mobile viewport
     * Emulates Pixel 5 with realistic mobile settings
     */
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },

    /**
     * Mobile Safari browser testing
     * Tests iOS-specific behavior
     * Emulates iPhone 12 screen size
     */
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
  ],

  /**
   * Metadata for test output and reporting
   */
  metadata: {
    /** Application name */
    appName: 'FindYourKing',
    /** Testing framework version */
    framework: '@playwright/test',
    /** Test environment identifier */
    environment: process.env.ENVIRONMENT || 'staging',
  },

  /**
   * Web server configuration
   * Automatically starts development server before tests
   *
   * If you already have a development server running,
   * comment out this section or set reuseExistingServer: true
   *
   * @see https://playwright.dev/docs/test-webserver
   */
  webServer: {
    /**
     * Command to start development server
     * Uses pnpm dev with Turbopack for fast rebuilds
     */
    command: 'pnpm dev --turbo',

    /**
     * URL to check for server readiness
     * Test suite waits for this URL to be available
     */
    url: BASE_URL,

    /**
     * Timeout waiting for server to start
     * 2 minutes maximum wait time
     */
    timeout: 120 * 1000,

    /**
     * Reuse existing server if already running
     * Useful for development to avoid multiple starts
     * Set to true if you manage the dev server separately
     */
    reuseExistingServer: !process.env.CI,

    /**
     * Output handling for server logs
     * pipe: display server output in test runner
     */
    stdout: 'pipe',
    stderr: 'pipe',
  },

  /**
   * Global timeout for entire test run
   * Prevents tests from hanging indefinitely
   * 30 minutes for complete test suite
   */
  timeout: 30 * 60 * 1000,

  /**
   * Global test timeout applied to all tests
   * Can be overridden per test file or test case
   */
  globalTimeout: 60 * 60 * 1000,

  /**
   * Expect assertion timeout
   * How long to wait for expect conditions to become true
   */
  expect: {
    timeout: timeoutConfig.expectTimeout,
    /**
     * Polling interval for expect retry
     * Check condition every 100ms until timeout
     */
    toHaveProperty: { timeout: 5000 },
  },

  /**
   * Output folder for test artifacts
   * Contains screenshots, videos, traces, and reports
   * Clean before each test run
   */
  outputFolder: 'test-results',

  /**
   * Snapshot testing configuration
   * Store snapshots in __snapshots__ folder
   * Use with expect(page).toHaveScreenshot()
   */
  snapshotDir: 'e2e/__snapshots__',
  snapshotPathTemplate:
    '{snapshotDir}/{testFileDir}/{testFileName}-{platform}{ext}',
  snapshotUpdateMode: process.env.UPDATE_SNAPSHOTS ? 'all' : 'missing',
});
