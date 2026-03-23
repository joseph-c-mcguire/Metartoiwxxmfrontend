import { defineConfig, devices } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

function loadEnvFile(filePath: string): void {
  if (!fs.existsSync(filePath)) {
    return;
  }

  const lines = fs.readFileSync(filePath, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }

    const eqIndex = trimmed.indexOf('=');
    if (eqIndex <= 0) {
      continue;
    }

    const key = trimmed.slice(0, eqIndex).trim();
    if (!key || process.env[key] !== undefined) {
      continue;
    }

    let value = trimmed.slice(eqIndex + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    process.env[key] = value;
  }
}

function loadPlaywrightEnv(): void {
  const frontendDir = path.dirname(fileURLToPath(import.meta.url));
  const repoRoot = path.resolve(frontendDir, '..');

  // Later files in this list should not override already-set shell env vars.
  loadEnvFile(path.join(repoRoot, '.env'));
  loadEnvFile(path.join(frontendDir, '.env'));
}

loadPlaywrightEnv();

/**
 * Playwright configuration for full-stack E2E tests.
 *
 * The actual Playwright specs live in the repository-level tests directory
 * because these scenarios require the frontend, backend, and auth services.
 */
export default defineConfig({
  testDir: '../tests',
  globalSetup: './playwright.global-setup.ts',
  
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
    command: 'AUTO_KILL_PORTS=true VITE_APP_URL=http://localhost:5173 VITE_BACKEND_URL=http://localhost:8001 VITE_AUTH_SERVICE_URL=http://localhost:8003 ../start-dev-servers.sh --kill',
    url: 'http://localhost:5173',
    timeout: 180000,
    reuseExistingServer: !process.env.CI,
    stdout: 'pipe',
    stderr: 'pipe',
  },
});
