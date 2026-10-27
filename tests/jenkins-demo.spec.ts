import { test, expect } from '@playwright/test';

test('Verify example website', async ({ page }) => {
    await page.goto('https://example.com');

    console.log('Page title:', await page.title());
    console.log('Page URL:', page.url());
    console.log('H1 headings:', await page.locator('h1').allTextContents());

    await expect(page).toHaveTitle('Example Domain');

    console.log('Homepage validation passed');
});