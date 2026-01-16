import { test, expect, Page } from '@playwright/test';

/**
 * Helper function to login as admin
 */
async function loginAsAdmin(page: Page) {
  console.log('Logging in as admin...');
  
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  
  const emailInput = page.getByPlaceholder(/email/i);
  const passwordInput = page.getByPlaceholder(/password/i);
  const loginButton = page.getByRole('button', { name: /sign in|login/i });
  
  await emailInput.fill('admin@metar.local');
  await passwordInput.fill('Admin123456!');
  
  console.log('Credentials filled, clicking login...');
  await loginButton.click();
  
  // Wait for navigation
  await page.waitForTimeout(3000);
  
  const url = page.url();
  console.log('Logged in, current URL:', url);
  
  return url;
}

test.describe('Admin Navigation', () => {
  test.beforeEach(async ({ page }) => {
    // Set up console log listener for all tests
    page.on('console', msg => {
      const text = msg.text();
      if (
        text.includes('admin') ||
        text.includes('navigation') ||
        text.includes('route') ||
        text.includes('DEBUG') ||
        text.includes('dashboard')
      ) {
        console.log(`[BROWSER - ${msg.type()}]:`, text);
      }
    });
  });

  test('admin view appears after login', async ({ page }) => {
    console.log('Testing: Admin view appears after login');
    console.log('=====================================');
    
    await loginAsAdmin(page);
    
    // Take screenshot
    await page.screenshot({ path: 'test-results/screenshots/admin-view-after-login.png', fullPage: true });
    
    // Check for admin-specific elements
    console.log('Checking for admin-specific elements...');
    
    // Get all text content
    const bodyText = await page.textContent('body');
    
    const hasAdminText = bodyText?.toLowerCase().includes('admin');
    const hasDashboardText = bodyText?.toLowerCase().includes('dashboard');
    
    console.log('Page contains "admin":', hasAdminText);
    console.log('Page contains "dashboard":', hasDashboardText);
    
    // List all visible buttons
    const buttons = await page.$$eval('button', elements =>
      elements
        .filter(el => el.offsetParent !== null) // Only visible buttons
        .map(el => el.textContent?.trim())
    );
    console.log('Visible buttons:', buttons);
    
    // List all links
    const links = await page.$$eval('a', elements =>
      elements
        .filter(el => el.offsetParent !== null)
        .map(el => ({
          text: el.textContent?.trim(),
          href: el.getAttribute('href')
        }))
    );
    console.log('Visible links:', JSON.stringify(links, null, 2));
    
    console.log('=====================================');
    console.log('✓ Admin view test completed');
  });

  test('admin dropdown menu check', async ({ page }) => {
    console.log('Testing: Admin dropdown menu');
    console.log('=====================================');
    
    await loginAsAdmin(page);
    
    // Look for select/dropdown elements
    const selects = await page.locator('select').all();
    console.log(`Found ${selects.length} select elements`);
    
    for (let i = 0; i < selects.length; i++) {
      const select = selects[i];
      const isVisible = await select.isVisible();
      
      if (isVisible) {
        console.log(`\nSelect ${i + 1}:`);
        
        const name = await select.getAttribute('name');
        const id = await select.getAttribute('id');
        console.log('  Name:', name);
        console.log('  ID:', id);
        
        // Get options
        const options = await select.locator('option').allTextContents();
        console.log('  Options:', options);
        
        // Check if it has "Admin Dashboard" option
        const hasAdminDashboard = options.some(opt => 
          opt.toLowerCase().includes('admin') && opt.toLowerCase().includes('dashboard')
        );
        
        if (hasAdminDashboard) {
          console.log('  ✓ Found Admin Dashboard option!');
          
          // Take screenshot
          await page.screenshot({ 
            path: `test-results/screenshots/admin-dropdown-${i + 1}.png`, 
            fullPage: true 
          });
          
          // Try to select it
          await select.selectOption({ label: options.find(opt => 
            opt.toLowerCase().includes('admin') && opt.toLowerCase().includes('dashboard')
          )! });
          
          console.log('  Selected Admin Dashboard option');
          await page.waitForTimeout(2000);
          
          // Take screenshot after selection
          await page.screenshot({ 
            path: `test-results/screenshots/after-admin-selection-${i + 1}.png`, 
            fullPage: true 
          });
          
          const newUrl = page.url();
          console.log('  URL after selection:', newUrl);
        }
      }
    }
    
    console.log('\n=====================================');
    console.log('✓ Admin dropdown test completed');
  });

  test('admin panel elements check', async ({ page }) => {
    console.log('Testing: Admin panel elements');
    console.log('=====================================');
    
    await loginAsAdmin(page);
    
    // Check for admin panel components
    const elementsToCheck = [
      'Statistics',
      'User Management',
      'System Settings',
      'Dashboard',
      'Analytics',
      'Users',
      'Settings'
    ];
    
    console.log('Checking for admin panel elements...\n');
    
    for (const elementText of elementsToCheck) {
      const element = page.getByText(elementText, { exact: false });
      const count = await element.count();
      const isVisible = count > 0 && await element.first().isVisible().catch(() => false);
      
      console.log(`  ${elementText}: ${isVisible ? '✓ Found' : '✗ Not found'} (count: ${count})`);
      
      if (isVisible) {
        // Take screenshot of the element
        await element.first().screenshot({ 
          path: `test-results/screenshots/admin-element-${elementText.replace(/\s+/g, '-').toLowerCase()}.png` 
        });
      }
    }
    
    console.log('\n=====================================');
    console.log('✓ Admin panel elements test completed');
  });

  test('capture full login flow with detailed logging', async ({ page }) => {
    console.log('Testing: Full login flow with detailed logging');
    console.log('=====================================');
    
    const events: string[] = [];
    
    // Capture console logs
    page.on('console', msg => {
      const event = `[CONSOLE-${msg.type()}] ${msg.text()}`;
      events.push(event);
      console.log(event);
    });
    
    // Capture network requests
    page.on('request', request => {
      const event = `[REQUEST] ${request.method()} ${request.url()}`;
      events.push(event);
      console.log(event);
    });
    
    // Capture network responses
    page.on('response', response => {
      const event = `[RESPONSE] ${response.status()} ${response.url()}`;
      events.push(event);
      console.log(event);
    });
    
    // Navigate and login
    await page.goto('/');
    console.log('Step 1: Navigated to home page');
    await page.screenshot({ path: 'test-results/screenshots/flow-1-home.png', fullPage: true });
    
    await page.waitForLoadState('networkidle');
    console.log('Step 2: Page loaded');
    
    await page.getByPlaceholder(/email/i).fill('admin@metar.local');
    console.log('Step 3: Email filled');
    await page.screenshot({ path: 'test-results/screenshots/flow-2-email-filled.png', fullPage: true });
    
    await page.getByPlaceholder(/password/i).fill('Admin123456!');
    console.log('Step 4: Password filled');
    await page.screenshot({ path: 'test-results/screenshots/flow-3-password-filled.png', fullPage: true });
    
    await page.getByRole('button', { name: /sign in|login/i }).click();
    console.log('Step 5: Login button clicked');
    
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'test-results/screenshots/flow-4-after-login-2s.png', fullPage: true });
    console.log('Step 6: Waited 2s');
    
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'test-results/screenshots/flow-5-after-login-4s.png', fullPage: true });
    console.log('Step 7: Waited 4s total');
    
    // Log page state
    const url = page.url();
    const title = await page.title();
    const headings = await page.$$eval('h1, h2, h3, h4', els => 
      els.map(el => `${el.tagName}: ${el.textContent?.trim()}`)
    );
    
    console.log('\nFinal State:');
    console.log('URL:', url);
    console.log('Title:', title);
    console.log('Headings:', headings);
    
    console.log('\n=====================================');
    console.log(`Total events captured: ${events.length}`);
    console.log('✓ Full login flow test completed');
  });

  test('file converter button is accessible from admin dashboard', async ({ page }) => {
    console.log('Testing: File Converter button accessibility');
    console.log('=====================================');
    
    // Step 1: Login as admin
    console.log('Step 1: Logging in as admin...');
    await page.goto('/');
    await page.getByPlaceholder(/email/i).fill('admin@metar.local');
    await page.getByPlaceholder(/password/i).fill('Admin123456!');
    await page.getByRole('button', { name: /sign in|login/i }).click();
    await page.waitForTimeout(3000);
    
    // Step 2: Verify admin dashboard is loaded
    console.log('Step 2: Verifying admin dashboard...');
    const adminTitle = page.getByText('Admin Dashboard');
    await adminTitle.waitFor({ state: 'visible', timeout: 5000 });
    const isDashboardVisible = await adminTitle.isVisible();
    console.log(`Admin Dashboard visible: ${isDashboardVisible}`);
    expect(isDashboardVisible).toBe(true);
    
    // Step 3: Verify File Converter button exists and is clickable
    console.log('Step 3: Checking File Converter button...');
    const fileConverterBtn = page.getByRole('button', { name: /file converter/i });
    const btnExists = await fileConverterBtn.isVisible();
    console.log(`File Converter button visible: ${btnExists}`);
    expect(btnExists).toBe(true);
    
    // Step 4: Click File Converter button
    console.log('Step 4: Clicking File Converter button...');
    await fileConverterBtn.click();
    await page.waitForTimeout(2000);
    
    // Step 5: Verify file converter view loaded
    console.log('Step 5: Verifying file converter view...');
    const converterHeading = page.getByText(/METAR.*IWXXM.*Converter/i);
    const isConverterVisible = await converterHeading.isVisible().catch(() => false);
    console.log(`File Converter heading visible: ${isConverterVisible}`);
    expect(isConverterVisible).toBe(true);
    
    // Step 6: Verify dropdown select exists in converter view
    console.log('Step 6: Checking select dropdown in converter...');
    const selectDropdown = page.locator('select').first();
    const selectExists = await selectDropdown.isVisible();
    console.log(`Select dropdown visible: ${selectExists}`);
    expect(selectExists).toBe(true);
    
    // Step 7: Verify Admin Dashboard option exists in dropdown
    console.log('Step 7: Checking Admin Dashboard option...');
    const adminOption = page.locator('option[value="admin"]');
    const optionExists = await adminOption.count() > 0;
    console.log(`Admin Dashboard option exists: ${optionExists}`);
    expect(optionExists).toBe(true);
    
    console.log('=====================================');
    console.log('✓ File Converter button accessibility test completed');
  });

  test('switch between admin dashboard and file converter using select dropdown', async ({ page }) => {
    console.log('Testing: Select dropdown for view switching');
    console.log('=====================================');
    
    // Step 1: Login as admin
    console.log('Step 1: Logging in as admin...');
    await page.goto('/');
    await page.getByPlaceholder(/email/i).fill('admin@metar.local');
    await page.getByPlaceholder(/password/i).fill('Admin123456!');
    await page.getByRole('button', { name: /sign in|login/i }).click();
    await page.waitForTimeout(3000);
    
    // Step 2: Verify admin dashboard is loaded
    console.log('Step 2: Verifying admin dashboard view...');
    const adminTitle = page.getByText('Admin Dashboard');
    await adminTitle.waitFor({ state: 'visible', timeout: 5000 });
    const adminVisible = await adminTitle.isVisible();
    console.log(`Admin Dashboard visible: ${adminVisible}`);
    expect(adminVisible).toBe(true);
    
    // Step 3: Navigate to File Converter view (where the select dropdown is)
    console.log('Step 3: Navigating to File Converter...');
    const fileConverterBtn = page.getByRole('button', { name: /file converter/i });
    await fileConverterBtn.click();
    await page.waitForTimeout(2000);
    
    // Step 4: Verify we're now in the File Converter view
    console.log('Step 4: Verifying File Converter view...');
    const converterHeading = page.getByText(/METAR.*IWXXM.*Converter/i);
    const converterVisible = await converterHeading.isVisible();
    console.log(`File Converter heading visible: ${converterVisible}`);
    expect(converterVisible).toBe(true);
    
    // Step 5: Find the view select dropdown
    console.log('Step 5: Finding the switch view select dropdown...');
    const viewSelect = page.locator('select[aria-label="Switch view"]');
    const selectVisible = await viewSelect.isVisible();
    console.log(`Switch view select found: ${selectVisible}`);
    expect(selectVisible).toBe(true);
    
    // Step 6: Verify current value is 'converter'
    console.log('Step 6: Checking current select value...');
    const currentValue = await viewSelect.inputValue();
    console.log(`Current select value: ${currentValue}`);
    expect(currentValue).toBe('converter');
    
    // Step 7: Verify converter and admin options exist in the select
    console.log('Step 7: Verifying select options exist...');
    const converterOption = page.locator('option[value="converter"]');
    const adminOption = page.locator('option[value="admin"]');
    const converterOptionExists = await converterOption.count() > 0;
    const adminOptionExists = await adminOption.count() > 0;
    console.log(`Converter option exists: ${converterOptionExists}`);
    console.log(`Admin option exists: ${adminOptionExists}`);
    expect(converterOptionExists).toBe(true);
    expect(adminOptionExists).toBe(true);
    
    // Step 8: Get the option values to display them
    console.log('Step 8: Checking select option values...');
    const options = await page.locator('select[aria-label="Switch view"] option').all();
    for (const option of options) {
      const value = await option.getAttribute('value');
      const text = await option.textContent();
      console.log(`  Option: value="${value}", text="${text}"`);
    }
    
    // Step 9: Attempt to switch to admin and capture the behavior
    console.log('Step 9: Attempting to switch to admin view...');
    await viewSelect.selectOption('admin');
    await page.waitForTimeout(2000);
    
    // Step 10: Check if we switched to admin view (select won't be visible on admin view)
    console.log('Step 10: Verifying admin view loaded after switch...');
    const adminNowVisible = await adminTitle.isVisible().catch(() => false);
    console.log(`Admin Dashboard visible after switch: ${adminNowVisible}`);
    expect(adminNowVisible).toBe(true);
    
    // Step 11: Verify the select is not visible on admin view (expected behavior)
    console.log('Step 11: Verifying select is not visible on admin view...');
    const selectNotVisible = !(await viewSelect.isVisible().catch(() => false));
    console.log(`Select hidden on admin view (expected): ${selectNotVisible}`);
    expect(selectNotVisible).toBe(true);
    
    // Step 12: Navigate back to File Converter using the button
    console.log('Step 12: Switching back to File Converter using button...');
    const fileConverterBtnAgain = page.getByRole('button', { name: /file converter/i });
    await fileConverterBtnAgain.click();
    await page.waitForTimeout(2000);
    
    // Step 13: Verify select is visible again on File Converter view
    console.log('Step 13: Verifying select is visible again on File Converter...');
    const selectVisibleAgain = await viewSelect.isVisible();
    console.log(`Select visible again: ${selectVisibleAgain}`);
    expect(selectVisibleAgain).toBe(true);
    
    // Step 14: Verify the select value is back to converter
    console.log('Step 14: Checking final select value...');
    const finalValue = await viewSelect.inputValue();
    console.log(`Final select value: ${finalValue}`);
    expect(finalValue).toBe('converter');
    
    console.log('=====================================');
    console.log('✓ Select dropdown switching test completed successfully');
    console.log('✓ Successfully switched from File Converter to Admin Dashboard using select');
    console.log('✓ Successfully switched back to File Converter view');
  });
});

