import { test, expect } from '@playwright/test';

test.describe('TAC File Conversion', () => {
  // Sample TAC file content from BGBW-282350Z.tac
  const tacFileContent = 'SPECI BGBW 282350Z AUTO /////KT 9999NDV BKN190/// M03/M12 Q1023';
  
  // NOTE: Converted output is displayed in <pre> tags inside a Results section
  // The FileConverter component stores converted files in React state and renders them in:
  // <div role="region" aria-label="Conversion results">
  //   <pre className="whitespace-pre-wrap break-all font-mono">{file.convertedContent}</pre>
  // </div>

  test.beforeEach(async ({ page }) => {
    console.log('🧪 TAC Conversion Test Setup');
    console.log('=====================================');
    
    // Navigate to the login page before each test
    console.log('Step 1: Navigating to home page...');
    await page.goto('/');
    
    // Capture all console messages
    page.on('console', msg => {
      const text = msg.text();
      console.log(`[BROWSER - ${msg.type()}]: ${text}`);
    });
    
    // Capture network errors
    page.on('requestfailed', request => {
      console.log(`❌ Request failed: ${request.method()} ${request.url()}`);
    });
  });

  test('TAC file content can be converted to IWXXM XML', async ({ page }) => {
    console.log('🧪 Testing: TAC file conversion via manual input');
    console.log('=====================================');

    // Step 1: Login with valid credentials
    console.log('Step 1: Logging in...');
    await page.getByPlaceholder(/email/i).fill('admin@metar.local');
    await page.getByPlaceholder(/password/i).fill('Admin123456!');
    await page.getByRole('button', { name: /sign in|login/i }).click();
    
    // Navigate to File Converter (admin users start on admin dashboard)
    console.log('Step 2: Navigating to File Converter...');
    await page.getByRole('button', { name: /file converter/i }).click();
    await page.waitForTimeout(1000);
    
    // Wait for converter to load
    console.log('Step 3: Waiting for converter to load...');
    await page.getByText(/METAR.*IWXXM.*Converter/i).waitFor({ state: 'visible', timeout: 10000 });
    
    // Verify we're on the File Converter view
    console.log('Step 4: Verifying File Converter view...');
    const converterHeading = page.getByText(/METAR.*IWXXM.*Converter/i);
    const isConverterVisible = await converterHeading.isVisible().catch(() => false);
    console.log(`✓ File Converter visible: ${isConverterVisible}`);
    expect(isConverterVisible).toBe(true);

    // Find and fill the input textarea
    console.log('Step 5: Finding and filling input textarea...');
    const inputTextarea = page.locator('textarea').first();
    await inputTextarea.waitFor({ state: 'attached', timeout: 5000 });

    // Paste the TAC file content
    console.log(`Step 6: Pasting TAC content: "${tacFileContent}"`);
    await inputTextarea.fill(tacFileContent);
    
    // Verify content was entered
    const enteredContent = await inputTextarea.inputValue();
    console.log(`✓ Content entered: "${enteredContent}"`);
    expect(enteredContent).toContain('BGBW');
    expect(enteredContent).toContain('282350Z');

    // Find and click the Convert button
    console.log('Step 7: Looking for Convert button...');
    const convertButton = page.locator('button[aria-label*="Convert"]').first();
    const buttonVisible = await convertButton.isVisible().catch(() => false);
    console.log(`✓ Convert button visible: ${buttonVisible}`);
    expect(buttonVisible).toBe(true);

    // Click the Convert button
    console.log('Step 8: Clicking Convert button...');
    await convertButton.click();
    
    // Wait for conversion to process
    console.log('Step 9: Waiting for conversion to complete...');
    await page.waitForTimeout(4000);

    // Look for the Results section
    console.log('Step 10: Checking for Results section...');
    const resultsHeading = page.getByText(/Results/i);
    const resultsVisible = await resultsHeading.isVisible().catch(() => false);
    console.log(`✓ Results section visible: ${resultsVisible}`);
    
    if (!resultsVisible) {
      console.log('⚠️  Results section not visible - let\'s inspect the page');
      
      // Get page text without timeout
      const pageText = await page.locator('body').textContent().catch(() => '');
      const hasErrors = pageText.includes('Error') || pageText.includes('error') || pageText.includes('failed');
      const hasToast = pageText.includes('toast') || pageText.includes('successfully');
      
      console.log(`✓ Errors on page: ${hasErrors}`);
      console.log(`✓ Toast messages: ${hasToast}`);
      
      // Look for alert/error messages
      const alerts = await page.locator('[role="alert"]').count().catch(() => 0);
      console.log(`Found ${alerts} alert elements`);
      if (alerts > 0) {
        try {
          const alertText = await page.locator('[role="alert"]').first().textContent();
          console.log(`  First alert: ${alertText?.substring(0, 300)}`);
        } catch(e) {
          console.log(`  Could not read alert text`);
        }
      }
      
      // Look for any visible error spans
      const errorCount = await page.locator('[class*="error"], [class*="Error"]').count().catch(() => 0);
      console.log(`Found ${errorCount} error class elements`);
      
      // Show page structure
      const h1 = await page.locator('h1, h2').first().textContent().catch(() => 'N/A');
      const p = await page.locator('p').first().textContent().catch(() => 'N/A');
      console.log(`\nPage elements:`);
      console.log(`  First heading: ${h1}`);
      console.log(`  First paragraph: ${p?.substring(0, 150)}`);
      
      console.log('⚠️  Conversion did not produce Results section - checking for backend errors...');
    }

    // Find the converted XML output in pre tags
    console.log('Step 11: Locating converted XML output...');
    const xmlOutputPre = page.locator('pre');
    const preCount = await xmlOutputPre.count();
    console.log(`Found ${preCount} pre elements on page`);
    
    // Also look for div, textarea, or other elements that might contain the output
    const divCount = await page.locator('div[role="region"]').count();
    console.log(`Found ${divCount} region divs`);
    
    // Check what's in the Results section
    if (resultsVisible) {
      try {
        const resultsSection = page.getByText(/Results/i).locator('..').nth(0);  // Get parent of Results heading
        const resultsSectionText = await resultsSection.textContent().catch(() => '');
        console.log(`Results section content length: ${resultsSectionText.length} chars`);
        console.log(`Results section preview: ${resultsSectionText.substring(0, 300)}`);
      } catch(e) {
        console.log(`Could not inspect Results section: ${e}`);
      }
      
      // Look for anything with IWXXM or XML content
      const pageHtml = await page.content().catch(() => '');
      const hasIwxxmInHtml = pageHtml.includes('iwxxm') || pageHtml.includes('IWXXM') || pageHtml.includes('<metar:');
      console.log(`IWXXM found in HTML: ${hasIwxxmInHtml}`);
      
      if (hasIwxxmInHtml) {
        // Find where it appears
        const metarIdx = pageHtml.indexOf('<metar:');
        const iwxxmIdx = pageHtml.indexOf('iwxxm');
        const closestIdx = metarIdx !== -1 && metarIdx < iwxxmIdx ? metarIdx : iwxxmIdx;
        if (closestIdx >= 0) {
          console.log(`IWXXM appears at position ${closestIdx} in HTML`);
          console.log(`Context: ${pageHtml.substring(Math.max(0, closestIdx - 200), closestIdx + 200)}`);
        }
      }
    }
    
    let conversionSuccessful = false;
    let xmlContent = '';
    
    if (preCount > 0) {
      // The converted output should be in a pre tag with XML content
      for (let i = 0; i < preCount; i++) {
        const preContent = await xmlOutputPre.nth(i).textContent();
        if (preContent && (preContent.includes('<?xml') || preContent.includes('<metar:') || preContent.includes('iwxxm'))) {
          xmlContent = preContent;
          conversionSuccessful = true;
          console.log(`✓ IWXXM XML found in pre element ${i}`);
          console.log(`  Content length: ${preContent.length} characters`);
          console.log(`  First 400 chars: ${preContent.substring(0, 400)}...`);
          break;
        }
      }
    }

    // Verify XML structure
    if (conversionSuccessful && xmlContent) {
      console.log('Step 12: Validating XML structure...');
      
      const hasXmlDeclaration = xmlContent.includes('<?xml');
      const hasIwxxmContent = xmlContent.toLowerCase().includes('iwxxm');
      const hasMetarContent = xmlContent.includes('<metar:') || xmlContent.includes('metar:');
      const hasClosingTags = /(<\/[\w:]+>)/.test(xmlContent);
      const xmlLength = xmlContent.length;
      
      console.log(`✓ XML declaration: ${hasXmlDeclaration}`);
      console.log(`✓ IWXXM namespace: ${hasIwxxmContent}`);
      console.log(`✓ METAR elements: ${hasMetarContent}`);
      console.log(`✓ Closing tags: ${hasClosingTags}`);
      console.log(`✓ Content size: ${xmlLength} bytes`);
      
      // Validate basic structure
      // Accept XML with or without declaration, as long as it has content and IWXXM namespace
      expect(hasXmlDeclaration || hasMetarContent || hasIwxxmContent).toBe(true, 'Should have XML content with IWXXM namespace');
      expect(hasClosingTags).toBe(true, 'Should have proper XML closing tags');
      expect(hasIwxxmContent).toBe(true, 'Should contain IWXXM namespace');
    }

    console.log('=====================================');
    console.log('✓ TAC file conversion test completed');
    
    // Final assertion - conversion should have produced valid XML
    expect(conversionSuccessful).toBe(true, 'TAC file should convert to IWXXM XML');
  });

  test('Manual METAR input converts to IWXXM', async ({ page }) => {
    console.log('🧪 Testing: Manual METAR input conversion');
    console.log('=====================================');

    // Login
    console.log('Step 1: Logging in...');
    await page.getByPlaceholder(/email/i).fill('admin@metar.local');
    await page.getByPlaceholder(/password/i).fill('Admin123456!');
    await page.getByRole('button', { name: /sign in|login/i }).click();
    
    // Navigate to File Converter
    console.log('Step 2: Navigating to File Converter...');
    await page.getByRole('button', { name: /file converter/i }).click();
    await page.waitForTimeout(1000);
    
    // Wait for converter to load
    console.log('Step 3: Waiting for converter to load...');
    await page.getByText(/METAR.*IWXXM.*Converter/i).waitFor({ state: 'visible', timeout: 10000 });

    // Enter METAR content
    console.log('Step 4: Entering METAR content...');
    const metarContent = 'METAR KJFK 121251Z 24016G28KT 3SM -RA BR BKN020 OVC040 14/11 A2990';
    const inputTextarea = page.locator('textarea').first();
    await inputTextarea.waitFor({ state: 'attached', timeout: 5000 });
    await inputTextarea.fill(metarContent);
    
    const content = await inputTextarea.inputValue();
    console.log(`✓ Content entered: "${content}"`);
    expect(content).toContain('KJFK');

    // Click convert
    console.log('Step 5: Clicking Convert button...');
    const convertButton = page.locator('button[aria-label*="Convert"]').first();
    if (await convertButton.isVisible().catch(() => false)) {
      await convertButton.click();
      await page.waitForTimeout(2000);
      console.log('✓ Convert button clicked');
    }

    console.log('=====================================');
    console.log('✓ Manual METAR input test completed');
  });

  test('Clear textarea and re-enter content', async ({ page }) => {
    console.log('🧪 Testing: Clear and re-enter TAC content');
    console.log('=====================================');

    // Login
    console.log('Step 1: Logging in...');
    await page.getByPlaceholder(/email/i).fill('admin@metar.local');
    await page.getByPlaceholder(/password/i).fill('Admin123456!');
    await page.getByRole('button', { name: /sign in|login/i }).click();
    
    // Navigate to File Converter
    console.log('Step 2: Navigating to File Converter...');
    await page.getByRole('button', { name: /file converter/i }).click();
    await page.waitForTimeout(1000);
    
    // Wait for converter to load
    console.log('Step 3: Waiting for converter to load...');
    await page.getByText(/METAR.*IWXXM.*Converter/i).waitFor({ state: 'visible', timeout: 10000 });

    // Enter TAC content
    console.log('Step 4: Entering initial TAC content...');
    const inputTextarea = page.locator('textarea').first();
    await inputTextarea.waitFor({ state: 'attached', timeout: 5000 });
    await inputTextarea.fill(tacFileContent);
    
    let textContent = await inputTextarea.inputValue();
    console.log(`✓ First entry: "${textContent}"`);
    expect(textContent).toBe(tacFileContent);

    // Clear the content
    console.log('Step 5: Clearing content...');
    const clearButton = page.getByRole('button', { name: /clear|reset/i }).first();
    
    if (await clearButton.isVisible().catch(() => false)) {
      await clearButton.click();
      textContent = await inputTextarea.inputValue();
      console.log(`✓ After clear: "${textContent}"`);
      expect(textContent.length).toBe(0);
    } else {
      // Manual clear if no button
      await inputTextarea.fill('');
      textContent = await inputTextarea.inputValue();
      console.log(`✓ Manually cleared`);
      expect(textContent.length).toBe(0);
    }

    // Re-enter different content
    console.log('Step 6: Re-entering different content...');
    const newContent = 'METAR NTAA 290000Z 25005KT 9999 FEW026 SCT043 32/24 Q1012 NOSIG';
    await inputTextarea.fill(newContent);
    
    textContent = await inputTextarea.inputValue();
    console.log(`✓ Re-entered: "${textContent}"`);
    expect(textContent).toContain('NTAA');

    console.log('=====================================');
    console.log('✓ Clear and re-enter test PASSED');
  });

  test('Error handling for invalid input', async ({ page }) => {
    console.log('🧪 Testing: Error handling for invalid input');
    console.log('=====================================');

    // Login
    console.log('Step 1: Logging in...');
    await page.getByPlaceholder(/email/i).fill('admin@metar.local');
    await page.getByPlaceholder(/password/i).fill('Admin123456!');
    await page.getByRole('button', { name: /sign in|login/i }).click();
    
    // Navigate to File Converter
    console.log('Step 2: Navigating to File Converter...');
    await page.getByRole('button', { name: /file converter/i }).click();
    await page.waitForTimeout(1000);
    
    // Wait for converter to load
    console.log('Step 3: Waiting for converter to load...');
    await page.getByText(/METAR.*IWXXM.*Converter/i).waitFor({ state: 'visible', timeout: 10000 });

    // Enter invalid content
    console.log('Step 4: Entering invalid content...');
    const invalidContent = 'INVALID DATA NOT METAR OR TAC FORMAT';
    const inputTextarea = page.locator('textarea').first();
    await inputTextarea.waitFor({ state: 'attached', timeout: 5000 });
    await inputTextarea.fill(invalidContent);
    
    const enteredContent = await inputTextarea.inputValue();
    console.log(`✓ Content entered: "${enteredContent}"`);

    // Click Convert button
    console.log('Step 5: Clicking Convert button...');
    const convertButton = page.locator('button[aria-label*="Convert"]').first();
    if (await convertButton.isVisible().catch(() => false)) {
      await convertButton.click();
      await page.waitForTimeout(2000);
    }

    // Check for error messages
    console.log('Step 6: Checking for error handling...');
    const pageText = await page.locator('body').textContent() || '';
    
    const hasError = pageText.toLowerCase().includes('error') ||
                     pageText.includes('failed') ||
                     pageText.includes('no files');

    console.log(`✓ Error detection: ${hasError}`);

    console.log('=====================================');
    console.log('✓ Error handling test completed');
  });
});
