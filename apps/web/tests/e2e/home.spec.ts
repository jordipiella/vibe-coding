import { expect, test } from '@playwright/test';

test('renders the scaffold home page', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('heading', { name: 'Vue + Fastify + Zod' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Check API health' })).toBeVisible();
});
