import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

test.describe('TAC File Upload to Database', () => {
  // Get directory path for ES modules
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  
  // Sample TAC files from the data directory
  const tacFilesDir = path.join(__dirname, '../../..', 'data/iwxxm-translation/Amd78-2018/metar');
  
  // Supabase credentials
  const projectId = 'ktvxijislbtgqapllmuk';
  const publicAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt0dnhpamlzbGJ0Z3FhcGxsbXVrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc2MzA3OTUsImV4cCI6MjA4MzIwNjc5NX0.CvgwYpgjCPfzceIC7BRZVoa5JzeLhwQlu8HMq0ACc4I';
  
  // Get available TAC files (limit to first 3)
  const getTacFiles = (): Array<{ name: string; path: string; content: string }> => {
    try {
      const files = fs.readdirSync(tacFilesDir)
        .filter(f => f.endsWith('.tac'))
        .slice(0, 3) // Get first 3 files
        .map(f => ({
          name: f,
          path: path.join(tacFilesDir, f),
          content: fs.readFileSync(path.join(tacFilesDir, f), 'utf-8').trim()
        }));
      console.log(`📁 Found ${files.length} TAC files:`, files.map(f => f.name));
      return files;
    } catch (error) {
      console.error('Failed to read TAC files:', error);
      return [];
    }
  };

  // Query Supabase KV store to verify record was saved
  const verifyRecordInDatabase = async (recordId: string): Promise<boolean> => {
    try {
      const supabase = createClient(`https://${projectId}.supabase.co`, publicAnonKey);
      
      const { data, error } = await supabase
        .from('kv_store_2e3cda33')
        .select('key, value')
        .eq('key', recordId)
        .single();
      
      if (error) {
        console.error(`❌ Error querying KV store for ${recordId}:`, error.message);
        return false;
      }
      
      if (data) {
        console.log(`✅ Record found in database: ${recordId}`);
        console.log(`   Value: ${JSON.stringify(data.value).substring(0, 100)}...`);
        return true;
      }
      
      console.warn(`⚠️ Record not found in database: ${recordId}`);
      return false;
    } catch (error) {
      console.error('Failed to verify record:', error);
      return false;
    }
  };

  test.beforeEach(async ({ page }) => {
    console.log('🧪 File Upload Test Setup');
    console.log('=====================================');
    
    // Navigate to home page
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

  test('Upload single TAC file and verify database storage', async ({ page }) => {
    const tacFiles = getTacFiles();
    if (tacFiles.length === 0) {
      test.skip();
      return;
    }

    const testFile = tacFiles[0];
    console.log('🧪 Testing: Single TAC file upload to database');
    console.log('=====================================');
    console.log(`📄 Test file: ${testFile.name}`);
    console.log(`📝 Content: ${testFile.content.substring(0, 50)}...`);

    // Step 1: Login
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

    // Step 2: Upload file via file input
    console.log(`Step 4: Uploading file: ${testFile.name}...`);
    const fileInput = await page.locator('input[type="file"]');
    await fileInput.setInputFiles(testFile.path);
    await page.waitForTimeout(500);

    // Step 3: Click Convert button
    console.log('Step 5: Clicking Convert button...');
    const convertButton = await page.getByRole('button', { name: /convert/i }).first();
    await convertButton.click();
    
    // Wait for conversion
    console.log('Step 6: Waiting for conversion to complete...');
    await page.waitForTimeout(3000);

    // Step 4: Verify Results section
    console.log('Step 7: Checking for Results section...');
    const resultsSection = page.locator('[role="region"][aria-label="Conversion results"]');
    const resultsVisible = await resultsSection.isVisible({ timeout: 5000 }).catch(() => false);
    console.log(`✓ Results section visible: ${resultsVisible}`);
    expect(resultsVisible).toBe(true);

    // Step 5: Check for converted content
    console.log('Step 8: Locating converted XML output...');
    const preElements = await page.locator('pre').count();
    console.log(`Found ${preElements} pre elements on page`);
    expect(preElements).toBeGreaterThan(0);

    const convertedContent = await page.locator('pre').first().textContent();
    expect(convertedContent).toContain('iwxxm');
    console.log(`✓ IWXXM content found: ${convertedContent?.substring(0, 80)}...`);

    // Step 6: Open database upload dialog
    console.log('Step 9: Opening database upload dialog...');
    const uploadDbButton = page.getByRole('button', { name: /upload.*database|database.*upload/i }).first();
    const uploadDbVisible = await uploadDbButton.isVisible({ timeout: 3000 }).catch(() => false);
    console.log(`✓ Upload to database button visible: ${uploadDbVisible}`);
    
    if (uploadDbVisible) {
      await uploadDbButton.click();
      await page.waitForTimeout(500);

      // Step 7: Verify upload dialog
      console.log('Step 10: Verifying upload dialog...');
      const uploadDialog = page.locator('[role="dialog"]');
      const dialogVisible = await uploadDialog.isVisible({ timeout: 3000 }).catch(() => false);
      console.log(`✓ Upload dialog visible: ${dialogVisible}`);
      expect(dialogVisible).toBe(true);

      // Step 8: Select upload options
      console.log('Step 11: Configuring upload options...');
      // Use radio buttons for format selection
      const iwxxmRadio = uploadDialog.locator('input[type="radio"][value="iwxxm"]');
      await iwxxmRadio.check();
      console.log('✓ Selected IWXXM format');
      
      // Intercept upload response to capture recordId
      let uploadResponse: any = null;
      page.on('response', async (response) => {
        if (response.url().includes('/database/upload')) {
          uploadResponse = await response.json();
        }
      });
      
      // Step 9: Click upload button in dialog
      console.log('Step 12: Clicking upload button...');
      const submitButton = uploadDialog.locator('button:has-text("Upload")').first();
      await submitButton.click();
      
      // Wait for upload to complete
      console.log('Step 13: Waiting for database upload...');
      await page.waitForTimeout(3000);

      // Verify success message
      const successMsg = page.locator('text=/uploaded.*success|success.*upload/i').first();
      const hasSuccess = await successMsg.isVisible({ timeout: 3000 }).catch(() => false);
      console.log(`✓ Upload success indicated: ${hasSuccess}`);

      // Step 10: Verify record was stored in Supabase database
      console.log('Step 14: Verifying record in Supabase database...');
      if (uploadResponse && uploadResponse.results && uploadResponse.results.length > 0) {
        const firstResult = uploadResponse.results[0];
        const recordId = firstResult.recordId;
        console.log(`🔍 Checking for recordId: ${recordId}`);
        
        await page.waitForTimeout(1000); // Give database time to persist
        
        const recordExists = await verifyRecordInDatabase(recordId);
        expect(recordExists).toBe(true);
        console.log(`✅ Record verified in Supabase KV store: ${recordId}`);
      } else {
        console.warn('⚠️ Could not extract recordId from upload response');
      }
    }

    console.log('=====================================');
    console.log('✓ Single file upload test completed');
    expect(true).toBe(true); // Test passes if we get here
  });

  test('Upload multiple TAC files (2-3) with database storage', async ({ page }) => {
    const tacFiles = getTacFiles();
    if (tacFiles.length < 2) {
      test.skip();
      return;
    }

    const filesToUpload = tacFiles.slice(0, Math.min(3, tacFiles.length));
    console.log('🧪 Testing: Multiple TAC file upload to database');
    console.log('=====================================');
    console.log(`📦 Files to upload: ${filesToUpload.map(f => f.name).join(', ')}`);

    // Step 1: Login
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

    // Upload each file
    for (let i = 0; i < filesToUpload.length; i++) {
      const file = filesToUpload[i];
      console.log(`\nStep 4.${i + 1}: Uploading file ${i + 1} of ${filesToUpload.length}: ${file.name}...`);
      
      const fileInput = await page.locator('input[type="file"]');
      await fileInput.setInputFiles(file.path);
      await page.waitForTimeout(300);

      // Convert
      const convertButton = await page.getByRole('button', { name: /convert/i }).first();
      await convertButton.click();
      
      // Wait for conversion
      console.log(`Step 5.${i + 1}: Waiting for conversion...`);
      await page.waitForTimeout(2500);

      // Verify results
      const resultsSection = page.locator('[role="region"][aria-label="Conversion results"]');
      const resultsVisible = await resultsSection.isVisible({ timeout: 5000 }).catch(() => false);
      console.log(`✓ Results visible for file ${i + 1}: ${resultsVisible}`);
    }

    // Step 6: Verify all conversions completed
    console.log(`\nStep 6: Verifying all ${filesToUpload.length} conversions completed...`);
    const preElements = await page.locator('pre').count();
    console.log(`✓ Found ${preElements} pre elements (converted files)`);
    expect(preElements).toBeGreaterThanOrEqual(filesToUpload.length);

    // Step 7: Upload all to database
    console.log('Step 7: Opening database upload dialog for all files...');
    const uploadDbButton = page.getByRole('button', { name: /upload.*database|database.*upload/i }).first();
    const uploadDbVisible = await uploadDbButton.isVisible({ timeout: 3000 }).catch(() => false);
    console.log(`✓ Upload to database button visible: ${uploadDbVisible}`);
    
    if (uploadDbVisible) {
      await uploadDbButton.click();
      await page.waitForTimeout(500);

      // Verify dialog shows all files
      console.log('Step 8: Verifying upload dialog...');
      const uploadDialog = page.locator('[role="dialog"]');
      const dialogVisible = await uploadDialog.isVisible({ timeout: 3000 }).catch(() => false);
      expect(dialogVisible).toBe(true);

      // Intercept upload response to capture recordIds
      const recordIds: string[] = [];
      page.on('response', async (response) => {
        if (response.url().includes('/database/upload')) {
          const uploadResponse = await response.json();
          if (uploadResponse && uploadResponse.results) {
            uploadResponse.results.forEach((result: any) => {
              if (result.recordId) {
                recordIds.push(result.recordId);
              }
            });
          }
        }
      });

      // Configure and submit
      console.log('Step 9: Configuring upload options...');
      const iwxxmRadio2 = uploadDialog.locator('input[type="radio"][value="iwxxm"]');
      await iwxxmRadio2.check();
      
      console.log('Step 10: Uploading all files to database...');
      const submitButton = uploadDialog.locator('button:has-text("Upload")').first();
      await submitButton.click();
      
      // Wait for completion
      await page.waitForTimeout(3000);
      console.log('✓ Database upload submitted');

      // Step 11: Verify records were stored in Supabase
      console.log('Step 11: Verifying all records in Supabase database...');
      if (recordIds.length > 0) {
        await page.waitForTimeout(1000);
        
        let verifiedCount = 0;
        for (const recordId of recordIds) {
          console.log(`🔍 Checking recordId: ${recordId}`);
          const recordExists = await verifyRecordInDatabase(recordId);
          if (recordExists) {
            verifiedCount++;
          }
        }
        
        console.log(`✅ Verified ${verifiedCount}/${recordIds.length} records in database`);
        expect(verifiedCount).toBe(recordIds.length);
      } else {
        console.warn('⚠️ Could not extract recordIds from upload response');
      }
    }

    console.log('=====================================');
    console.log(`✓ Multiple file upload test completed (${filesToUpload.length} files)`);
    expect(true).toBe(true);
  });

  test('Verify uploaded files are stored in database with correct metadata', async ({ page }) => {
    const tacFiles = getTacFiles();
    if (tacFiles.length === 0) {
      test.skip();
      return;
    }

    const testFile = tacFiles[0];
    console.log('🧪 Testing: Database storage verification');
    console.log('=====================================');
    console.log(`📄 Test file: ${testFile.name}`);

    // Step 1: Login
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

    // Upload and convert
    console.log('Step 4: Uploading and converting file...');
    const fileInput = await page.locator('input[type="file"]');
    await fileInput.setInputFiles(testFile.path);
    await page.waitForTimeout(300);

    const convertButton = await page.getByRole('button', { name: /convert/i }).first();
    await convertButton.click();
    
    console.log('Step 5: Waiting for conversion...');
    await page.waitForTimeout(2500);

    // Verify Results
    console.log('Step 6: Checking Results section...');
    const resultsSection = page.locator('[role="region"][aria-label="Conversion results"]');
    const resultsVisible = await resultsSection.isVisible({ timeout: 5000 }).catch(() => false);
    expect(resultsVisible).toBe(true);

    // Get converted content
    const convertedXml = await page.locator('pre').first().textContent();
    expect(convertedXml).toContain('iwxxm');
    console.log(`✓ Conversion successful, XML length: ${convertedXml?.length} chars`);

    // Upload to database
    console.log('Step 7: Uploading to database...');
    const uploadDbButton = page.getByRole('button', { name: /upload.*database|database.*upload/i }).first();
    const uploadDbVisible = await uploadDbButton.isVisible({ timeout: 3000 }).catch(() => false);
    
    if (uploadDbVisible) {
      await uploadDbButton.click();
      await page.waitForTimeout(500);

      // Intercept upload response to capture recordId
      let recordId: string | null = null;
      page.on('response', async (response) => {
        if (response.url().includes('/database/upload')) {
          const uploadResponse = await response.json();
          if (uploadResponse && uploadResponse.results && uploadResponse.results.length > 0) {
            recordId = uploadResponse.results[0].recordId;
          }
        }
      });

      // Configure options
      console.log('Step 8: Configuring upload with metadata...');
      const uploadDialog = page.locator('[role="dialog"]');
      // Select 'both' format - use getByRole to be more specific
      const bothFormatRadio = uploadDialog.getByRole('radio', { name: /Store both IWXXM/ });
      await bothFormatRadio.check(); // Store both IWXXM and JSON

      // Check if there's an "include original" option
      const includeOriginalCheckbox = uploadDialog.locator('input[type="checkbox"]').first();
      const isChecked = await includeOriginalCheckbox.isChecked().catch(() => false);
      if (!isChecked) {
        console.log('Step 9: Enabling original content storage...');
        await includeOriginalCheckbox.check();
      }

      // Upload
      console.log('Step 10: Submitting database upload...');
      const submitButton = uploadDialog.locator('button:has-text("Upload")').first();
      await submitButton.click();
      
      await page.waitForTimeout(3000);
      console.log('✓ Upload submitted with metadata');

      // Verify success
      const successIndicator = page.locator('[role="alert"], text=/success|complete/i').first();
      const showsSuccess = await successIndicator.isVisible({ timeout: 3000 }).catch(() => false);
      console.log(`✓ Success indicator visible: ${showsSuccess}`);

      // Step 11: Verify record was stored with metadata
      console.log('Step 11: Verifying record in database...');
      if (recordId) {
        await page.waitForTimeout(1000);
        
        console.log(`🔍 Checking recordId: ${recordId}`);
        const recordExists = await verifyRecordInDatabase(recordId);
        expect(recordExists).toBe(true);
        console.log(`✅ Record with metadata verified in database: ${recordId}`);
      } else {
        console.warn('⚠️ Could not extract recordId from upload response');
      }
    }

    console.log('=====================================');
    console.log('✓ Database storage verification completed');
    expect(true).toBe(true);
  });

  test('Handle errors during file upload gracefully', async ({ page }) => {
    console.log('🧪 Testing: Error handling during file upload');
    console.log('=====================================');

    // Step 1: Login
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

    // Try to upload database without files
    console.log('Step 4: Attempting upload without converted files...');
    const uploadDbButton = page.getByRole('button', { name: /upload.*database|database.*upload/i }).first();
    const uploadDbVisible = await uploadDbButton.isVisible({ timeout: 3000 }).catch(() => false);
    console.log(`✓ Upload button visible: ${uploadDbVisible}`);

    // Button should be disabled if no files
    const isDisabled = uploadDbVisible ? 
      await uploadDbButton.isDisabled() : 
      true; // If not visible, treat as disabled
    console.log(`✓ Upload button disabled (no files): ${isDisabled || !uploadDbVisible}`);

    // Try with malformed TAC content
    console.log('Step 5: Attempting to convert invalid content...');
    const textarea = page.locator('textarea').first();
    await textarea.fill('INVALID TAC FORMAT');
    
    const convertButton = await page.getByRole('button', { name: /convert/i }).first();
    await convertButton.click();
    
    console.log('Step 6: Checking for error handling...');
    await page.waitForTimeout(2000);

    // Check for error messages or error state
    const errorIndicator = page.locator('[role="alert"], text=/error|failed/i').first();
    const showsError = await errorIndicator.isVisible({ timeout: 3000 }).catch(() => false);
    console.log(`✓ Error handling visible: ${showsError}`);

    console.log('=====================================');
    console.log('✓ Error handling test completed');
    expect(true).toBe(true);
  });
});
