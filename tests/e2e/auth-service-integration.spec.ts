import { test, expect } from '@playwright/test';

/**
 * Auth Service Integration Test
 * 
 * Validates that the frontend can reach the auth service at startup.
 * This test prevents issues where the auth service URL is misconfigured
 * or the auth service is not running.
 * 
 * This should run before other tests to catch configuration issues early.
 */

test.describe('Auth Service Integration', () => {
  test('should have valid AUTH_SERVICE_URL environment variable configured', async ({ page }) => {
    // Navigate to the app
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    
    // Wait for console messages
    let foundErrorMessage = false;
    const consoleMessages: string[] = [];

    page.on('console', (msg) => {
      const text = msg.text();
      consoleMessages.push(text);
      
      if (text.includes('Missing VITE_AUTH_SERVICE_URL')) {
        foundErrorMessage = true;
      }
    });

    await page.waitForTimeout(1000);

    expect(foundErrorMessage).toBe(false);
    expect(consoleMessages.some(msg => msg.includes('Missing VITE_AUTH_SERVICE_URL'))).toBe(false);
  });

  test('auth service health endpoint should be available', async ({ page, context }) => {
    // Get the auth service URL from the page's environment
    const authServiceUrl = 'http://localhost:8003'; // Must match VITE_AUTH_SERVICE_URL in .env

    try {
      // Make a direct fetch to the auth service health endpoint
      const response = await context.request.get(`${authServiceUrl}/health`, {
        timeout: 5000,
      });

      // Auth service should respond (200 or 404 is ok, just not connection refused)
      expect(response.status()).toBeGreaterThanOrEqual(200);
      expect(response.status()).toBeLessThan(500);
    } catch (error: any) {
      // If the auth service is not running, provide a helpful error
      if (error.message.includes('ECONNREFUSED') || error.message.includes('getaddrinfo')) {
        throw new Error(
          `❌ Auth service not reachable at ${authServiceUrl}. ` +
          `Please ensure the auth service is running: ` +
          `cd auth && python -m uvicorn src.__main__:app --reload --port 8003`
        );
      }
      throw error;
    }
  });

  test('frontend should not make 400 Bad Request to backend auth endpoints', async ({ page }) => {
    // Listen for network requests
    const badRequests: string[] = [];

    page.on('response', (response) => {
      if (response.status() === 400) {
        response.request().postData().then((data) => {
          if (data && (data.includes('/auth/') || data.includes('register'))) {
            badRequests.push(`${response.request().method()} ${response.request().url()}`);
          }
        }).catch(() => {
          // Ignore if we can't read the body
        });
      }
    });

    await page.goto('/', { waitUntil: 'networkidle' });
    
    // Wait for any initial auth requests
    await page.waitForTimeout(2000);

    // There should be no 400 Bad Request errors on auth endpoints
    // (400 typically means the backend couldn't parse or validate the request due to missing config)
    expect(badRequests).toHaveLength(0);
  });

  test('should display environment configuration properly on app load', async ({ page }) => {
    // Capture console logs to verify app loaded with proper env config
    const logs: { type: string; message: string }[] = [];

    page.on('console', (msg) => {
      logs.push({
        type: msg.type(),
        message: msg.text(),
      });
    });

    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(500);

    // Should not have critical environment variable errors
    const errorLogs = logs.filter((log) => log.type === 'error' && log.message.includes('VITE_'));
    expect(errorLogs).toHaveLength(0);
  });
});
