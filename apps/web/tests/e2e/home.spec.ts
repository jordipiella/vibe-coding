import { expect, test } from '@playwright/test';

test('loads health data through the shared contract flow', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('heading', { name: 'Vue + Fastify + Zod' })).toBeVisible();

  await page.getByRole('button', { name: 'Check API health' }).click();

  await expect(page.getByText('Store state: ready')).toBeVisible();
  await expect(page.getByText('Status')).toBeVisible();
  await expect(page.getByText('Service')).toBeVisible();
  await expect(page.locator('dd').filter({ hasText: /^ok$/ })).toBeVisible();
  await expect(page.locator('dd').filter({ hasText: /^api$/ })).toBeVisible();
});
