import { expect, test } from '@playwright/test';

test('login view hides register and shows legal placeholders', async ({ page }) => {
  await page.route('**/auth/v1/settings', async (route) => {
    await route.fulfill({ status: 200, body: '{}' });
  });

  await page.route('**/health', async (route) => {
    await route.fulfill({ status: 200, body: JSON.stringify({ status: 'ok' }) });
  });

  await page.goto('/');

  await expect(page.getByRole('button', { name: 'Authenticate' })).toBeVisible();
  await expect(page.getByText('Register')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Terms of Service' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Privacy Policy' })).toBeVisible();
  await expect(page.getByRole('button', { name: /Open accessibility settings menu/i })).toBeVisible();
});
