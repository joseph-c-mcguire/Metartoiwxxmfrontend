import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the login page before each test
    console.log('Navigating to login page...');
    await page.goto('/');
    
    // Set up console log listener
    page.on('console', msg => {
      const text = msg.text();
      // Log important messages
      if (
        text.includes('handleLogin') ||
        text.includes('isAdmin') ||
        text.includes('DEBUG') ||
        text.includes('Routing') ||
        text.includes('admin') ||
        text.includes('login') ||
        text.includes('auth')
      ) {
        console.log(`[BROWSER CONSOLE - ${msg.type()}]:`, text);
      }
    });
  });

  test('login page loads correctly', async ({ page }) => {
    console.log('Testing: Login page loads correctly');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Take screenshot
    await page.screenshot({ path: 'test-results/screenshots/login-page-loaded.png', fullPage: true });
    
    // Check for login form elements
    const emailInput = page.getByPlaceholder(/email/i);
    const passwordInput = page.getByPlaceholder(/password/i);
    const loginButton = page.getByRole('button', { name: /sign in|login/i });
    
    console.log('Checking for email input...');
    await expect(emailInput).toBeVisible();
    
    console.log('Checking for password input...');
    await expect(passwordInput).toBeVisible();
    
    console.log('Checking for login button...');
    await expect(loginButton).toBeVisible();
    
    console.log('✓ Login page loaded successfully');
  });

  test('empty login validation', async ({ page }) => {
    console.log('Testing: Empty login validation');
    
    await page.waitForLoadState('networkidle');
    
    // Try to submit empty form
    const loginButton = page.getByRole('button', { name: /sign in|login/i });
    console.log('Clicking login button with empty fields...');
    await loginButton.click();
    
    // Wait a bit for any validation messages
    await page.waitForTimeout(1000);
    
    // Take screenshot
    await page.screenshot({ path: 'test-results/screenshots/empty-login-validation.png', fullPage: true });
    
    // Check if we're still on the login page (not redirected)
    const url = page.url();
    console.log('Current URL after empty submit:', url);
    
    console.log('✓ Empty login validation test completed');
  });

  test('navigation to register page', async ({ page }) => {
    console.log('Testing: Navigation to register page');
    
    await page.waitForLoadState('networkidle');
    
    // Look for register/sign up link
    const registerLink = page.getByRole('link', { name: /sign up|register|create account/i });
    
    if (await registerLink.isVisible()) {
      console.log('Register link found, clicking...');
      await registerLink.click();
      await page.waitForTimeout(1000);
      
      const url = page.url();
      console.log('Navigated to:', url);
      
      await page.screenshot({ path: 'test-results/screenshots/register-page.png', fullPage: true });
      console.log('✓ Register page navigation successful');
    } else {
      console.log('⚠ Register link not found on page');
    }
  });

  test('admin login flow', async ({ page }) => {
    console.log('Testing: Admin login flow');
    console.log('=====================================');
    
    await page.waitForLoadState('networkidle');
    
    // Fill in admin credentials
    console.log('Filling in admin credentials...');
    const emailInput = page.getByPlaceholder(/email/i);
    const passwordInput = page.getByPlaceholder(/password/i);
    
    await emailInput.fill('admin@metar.local');
    console.log('Email filled: admin@metar.local');
    
    await passwordInput.fill('Admin123456!');
    console.log('Password filled: Admin123456!');
    
    // Take screenshot before login
    await page.screenshot({ path: 'test-results/screenshots/before-admin-login.png', fullPage: true });
    
    // Click login button
    const loginButton = page.getByRole('button', { name: /sign in|login/i });
    console.log('Clicking login button...');
    await loginButton.click();
    
    // Wait for navigation or response
    console.log('Waiting for response...');
    await page.waitForTimeout(3000);
    
    // Take screenshot after login
    await page.screenshot({ path: 'test-results/screenshots/after-admin-login.png', fullPage: true });
    
    // Get current URL
    const url = page.url();
    console.log('Current URL after login:', url);
    
    // Check page title
    const title = await page.title();
    console.log('Page title:', title);
    
    // Log all headings on the page
    const headings = await page.$$eval('h1, h2, h3', elements => 
      elements.map(el => ({ tag: el.tagName, text: el.textContent?.trim() }))
    );
    console.log('Page headings:', JSON.stringify(headings, null, 2));
    
    // Check for admin dashboard elements
    console.log('\nChecking for admin dashboard elements...');
    
    const adminDashboard = page.getByText(/admin dashboard/i);
    const converter = page.getByText(/converter|metar/i);
    const adminPanel = page.getByText(/statistics|user management|system settings/i);
    
    const hasAdminDashboard = await adminDashboard.count() > 0;
    const hasConverter = await converter.count() > 0;
    const hasAdminPanel = await adminPanel.count() > 0;
    
    console.log('Admin Dashboard visible:', hasAdminDashboard);
    console.log('Converter visible:', hasConverter);
    console.log('Admin Panel elements visible:', hasAdminPanel);
    
    // Check for dropdown/select menus
    const selects = await page.$$eval('select', elements =>
      elements.map(el => ({
        name: el.getAttribute('name'),
        id: el.getAttribute('id'),
        options: Array.from(el.options).map(opt => opt.text)
      }))
    );
    console.log('Select elements found:', JSON.stringify(selects, null, 2));
    
    // Check for any data-testid attributes that might indicate admin features
    const testIds = await page.$$eval('[data-testid]', elements =>
      elements.map(el => el.getAttribute('data-testid'))
    );
    console.log('Elements with data-testid:', testIds);
    
    // Print page content for debugging (first 500 chars)
    const bodyText = await page.textContent('body');
    console.log('\nPage content (first 500 chars):', bodyText?.substring(0, 500));
    
    console.log('=====================================');
    console.log('✓ Admin login flow test completed');
  });

  test('capture all console logs during login', async ({ page }) => {
    console.log('Testing: Capture ALL console logs during login');
    console.log('=====================================');
    
    const allLogs: string[] = [];
    
    // Capture ALL console messages
    page.on('console', msg => {
      const logEntry = `[${msg.type().toUpperCase()}] ${msg.text()}`;
      allLogs.push(logEntry);
      console.log(logEntry);
    });
    
    await page.waitForLoadState('networkidle');
    
    // Perform login
    await page.getByPlaceholder(/email/i).fill('admin@metar.local');
    await page.getByPlaceholder(/password/i).fill('Admin123456!');
    await page.getByRole('button', { name: /sign in|login/i }).click();
    
    await page.waitForTimeout(4000);
    
    console.log('\n=====================================');
    console.log(`Total console logs captured: ${allLogs.length}`);
    console.log('=====================================\n');
    
    // All logs are already printed to console above
    expect(allLogs.length).toBeGreaterThan(0);
  });
});
