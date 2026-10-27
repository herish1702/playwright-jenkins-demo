import { test, expect, Page } from '@playwright/test';
import dotenv from 'dotenv';

dotenv.config();

const HALO_URL = process.env.HALO_URL;
const HALO_USERNAME = process.env.HALO_USERNAME;
const HALO_PASSWORD = process.env.HALO_PASSWORD;

test('Read Halo tickets and generate suggested responses', async ({ page }) => {
    test.setTimeout(180_000);

    if (!HALO_URL || !HALO_USERNAME || !HALO_PASSWORD) {
        throw new Error(
            'Set HALO_URL, HALO_USERNAME and HALO_PASSWORD in .env'
        );
    }

    // 1. Open Halo.
    await page.goto(HALO_URL);

    console.log('Opened Halo');

    // 2. Login.
    const usernameField = page.locator('#Username')

    const passwordField = page.locator('#Password')

    if (await usernameField.isVisible().catch(() => false)) {
        await usernameField.fill(HALO_USERNAME);
        await passwordField.fill(HALO_PASSWORD);

        // Replace with the actual login button selector if necessary.
        const loginButton = page.locator('button[type="submit"]')

        await loginButton.click();

        console.log(
            'Login submitted.'
        );
    } else {
        console.log(
            'No login form detected. Check whether Halo is already authenticated.'
        );
    }

    await page.locator("//a[text()='Home']").waitFor({
        state: 'visible',
        timeout: 15000
    });


    await page.locator("//div[text()='All Tickets']").first().click();

    const unassigned = page.locator("//div[text()='Unassigned']");
    await unassigned.nth(1).click();

    const ticket = page.locator("//div[@class='rt-tr-group table-tr']");
    await ticket.first().click();

    await page.pause();

});
