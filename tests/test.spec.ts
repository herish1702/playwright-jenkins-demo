import { test, expect } from '@playwright/test';
import dotenv from 'dotenv';

dotenv.config();

const HALO_URL = process.env.HALO_URL;
const HALO_USERNAME = process.env.HALO_USERNAME;
const HALO_PASSWORD = process.env.HALO_PASSWORD;

test('Read Halo tickets and extract ticket details', async ({ page }) => {
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
    const usernameField = page.getByLabel('Username or Email Address');
    const passwordField = page.locator('input[name="Password"]');

    if (await usernameField.isVisible().catch(() => false)) {
        await usernameField.fill(HALO_USERNAME);
        await passwordField.fill(HALO_PASSWORD);

        const loginButton = page.locator('button[type="submit"]');
        await loginButton.click();

        console.log('Login submitted.');
    } else {
        console.log(
            'No login form detected. Checking current Halo session.'
        );
    }

    // 3. Wait for the authenticated page.
    const homeLink = page.locator("//a[normalize-space()='Home']");

    await expect(homeLink).toBeVisible({ timeout: 30000 });

    console.log('Halo login confirmed.');

    // 4. Navigate to All Tickets.
    await page.locator("//div[normalize-space()='All Tickets']")
        .first()
        .click();

    // 5. Open Unassigned tickets.
    const unassigned = page
        .locator("//div[normalize-space()='Unassigned']")
        .nth(1);

    await expect(unassigned).toBeVisible({ timeout: 15000 });
    await unassigned.click();

    // 6. Wait for the ticket list to load.
    await page.waitForLoadState('domcontentloaded').catch(() => { });
    await page.waitForTimeout(3000);

    console.log('Current URL:', page.url());

    const noResults = page.getByText('No results found', {
        exact: true,
    });

    const tickets = page.locator('div.rt-tr-group.table-tr');

    // 7. Check whether the ticket list is empty.
    if (await noResults.isVisible().catch(() => false)) {
        console.log('No unassigned tickets found.');
        return;
    }

    // 8. Check whether ticket rows exist.
    const ticketCount = await tickets.count();

    console.log('Ticket rows found:', ticketCount);

    if (ticketCount === 0) {
        console.log('The expected ticket-row selector was not found.');

        console.log(
            'Visible page text:',
            (await page.locator('body').innerText()).slice(0, 2000)
        );

        await page.screenshot({
            path: 'test-results/halo-ticket-list.png',
            fullPage: true,
        });

        throw new Error(
            'Could not locate ticket rows. Inspect test-results/halo-ticket-list.png.'
        );
    }

    // 9. Open the first ticket.
    await expect(tickets.first()).toBeVisible({ timeout: 15000 });
    await tickets.first().click();

    // 10. Wait for the selected ticket to load.
    await page.waitForTimeout(2000);

    console.log('Ticket opened successfully.');
    console.log('Ticket URL:', page.url());

    // 11. Extract the visible ticket text.
    const ticketText = await page.locator('body').innerText();

    if (!ticketText.trim()) {
        throw new Error('No ticket text was extracted.');
    }

    console.log('Extracted ticket text length:', ticketText.length);

    // 12. Display relevant error lines.
    const errorLines = ticketText
        .split(/\r?\n/)
        .filter((line) =>
            /error|missing|bad value|duplicate|itemNumber|carrier/i.test(line)
        )
        .slice(0, 15);

    console.log('\nRelevant ticket lines:');
    console.log(errorLines.join('\n') || 'No matching error lines found.');

    console.log('\nTicket extraction completed successfully.');
});