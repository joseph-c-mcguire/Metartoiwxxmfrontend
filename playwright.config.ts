import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for METAR-to-IWXXM frontend tests
 * Tests assume the Docker container is already running on localhost:8000
 */
export default defineConfig({
  testDir: './tests/e2e',
  
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
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:8000',
    
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

  // Web Server configuration
  // NOTE: We don't start the server here since we use Docker
  // This just waits for the server to be available
  // webServer: {
  //   command: process.platform === 'win32' ? 'cmd /c echo "Server running on localhost:8000"' : 'echo "Server should be running via Docker on localhost:8000"',
  //   url: 'http://localhost:8000',
  //   timeout: 10000,
  //   reuseExistingServer: true,
  //   stdout: 'ignore',
  //   stderr: 'ignore',
  // },
});
