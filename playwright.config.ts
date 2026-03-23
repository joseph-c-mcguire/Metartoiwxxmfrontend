import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for full-stack E2E tests.
 *
 * The actual Playwright specs live in the repository-level tests directory
 * because these scenarios require the frontend, backend, and auth services.
 */
export default defineConfig({
  testDir: '../tests',
  
  // Run tests in files in parallel, but run tests within a file sequentially
  fullyParallel: false,
  
  // Fail the build on CI if you accidentally left test.only in the source code
  forbidOnly: !!process.env.CI,
  
  // Retry on CI only
  retries: process.env.CI ? 2 : 0,
  
  // Single worker - sequential test execution for debugging
  workers: 1,
  
  // Reporter to use
  reporter: [
    ['html'],
    ['list'],
    ['json', { outputFile: 'test-results/results.json' }]
  ],
  
  use: {
    // Base URL to use in actions like `await page.goto('/')`
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:5173',
    
    // Collect trace when retrying the failed test
    trace: 'on-first-retry',
    
    // Capture screenshot on failure
    screenshot: 'only-on-failure',
    
    // Capture video on failure
    video: 'retain-on-failure',
    
    // Maximum time each action can take
    actionTimeout: 10000,
    
    // Navigation timeout
    navigationTimeout: 30000,
  },

  // Configure projects for major browsers
  projects: [
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        // Launch options for better debugging
        launchOptions: {
          slowMo: process.env.DEBUG ? 500 : 0,
        }
      },
    },
  ],

  webServer: {
    command: 'VITE_APP_URL=http://localhost:5173 VITE_BACKEND_URL=http://localhost:8001 VITE_AUTH_SERVICE_URL=http://localhost:8003 ../start-dev-servers.sh --kill',
    url: 'http://localhost:5173',
    timeout: 120000,
    reuseExistingServer: true,
    stdout: 'pipe',
    stderr: 'pipe',
  },
});
