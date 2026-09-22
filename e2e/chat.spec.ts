import { expect, test } from '@playwright/test';

test.describe('standalone', () => {
  test('renders the seeded conversation with the standalone profile', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByRole('heading', { name: 'Conversation' })).toBeVisible();
    await expect(page.getByText('Signed in as operator · Standalone preview')).toBeVisible();
    await expect(page.getByText('Hello, how can I help you?')).toBeVisible();
  });

  test('sends a message', async ({ page }) => {
    await page.goto('/');

    await page.getByLabel('Message').fill('Restarting the compressor.');
    await page.getByRole('button', { name: 'Send' }).click();

    await expect(page.getByText('Restarting the compressor.')).toBeVisible();
  });
});

test.describe('remote entry', () => {
  test('remoteEntry.js is served with CORS enabled', async ({ request }) => {
    const response = await request.get('/remoteEntry.js');

    expect(response.status()).toBe(200);
    expect(response.headers()['access-control-allow-origin']).toBe('*');
  });
});
