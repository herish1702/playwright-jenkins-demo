import { test, expect } from '@playwright/test';
import dotenv from 'dotenv';

dotenv.config();

const HALO_URL = process.env.HALO_URL;
const HALO_USERNAME = process.env.HALO_USERNAME;
const HALO_PASSWORD = process.env.HALO_PASSWORD;

const DIFY_API_URL = process.env.DIFY_API_URL;
const DIFY_API_KEY = process.env.DIFY_API_KEY;

// Send ticket details to Dify.
/*async function sendTicketToDify(ticketText: string) {
  if (!DIFY_API_URL || !DIFY_API_KEY) {
    throw new Error(
      'Set DIFY_API_URL and DIFY_API_KEY in your .env file.'
    );
  }

  const response = await fetch(DIFY_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${DIFY_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      inputs: {
        fact: ticketText,
        Ticket_Details: ticketText,
      },
      response_mode: 'blocking',
      user: 'halo-playwright',
    }),
  });

  const responseBody = await response.text();

  if (!response.ok) {
    throw new Error(
      `Dify API failed with status ${response.status}: ${responseBody}`
    );
  }

  return JSON.parse(responseBody);
}*/

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
  await page.pause();

  await page.locator("//a[text()='Home']").waitFor({
    state: 'visible',
    timeout: 15000,
  });

  // 4. Navigate to All Tickets.
  await page.locator("//div[text()='All Tickets']").first().click();

  // 5. Open Unassigned tickets.
  const unassigned = page.locator("//div[text()='Unassigned']").nth(1);

  await expect(unassigned).toBeVisible({ timeout: 15000 });
  await unassigned.click();

  // 6. Wait for the ticket list to load.
  await page.waitForLoadState('domcontentloaded').catch(() => { });
  await page.waitForTimeout(30000);

  console.log('Current URL:', page.url());

  const noResults = page.getByText('No results found', {
    exact: true,
  });

  const tickets = page.locator('div.rt-tr-group.table-tr');

  // Check whether the list is empty.
  if (await noResults.isVisible().catch(() => false)) {
    console.log('No unassigned tickets found.');
    return;
  }

  // Check whether the expected ticket-row selector exists.
  const ticketCount = await tickets.count();

  console.log('Ticket rows found:', ticketCount);

  if (ticketCount === 0) {
    console.log(
      'The expected ticket-row selector was not found.'
    );

    console.log(
      'Visible page text:',
      (await page.locator('body').innerText()).slice(0, 20000)
    );

    throw new Error(
      'Could not locate ticket rows. Inspect test-results/halo-ticket-list.png.'
    );
  }

  // 7. Open the first ticket.
  await expect(tickets.first()).toBeVisible({ timeout: 15000 });
  await tickets.first().click();

  // 8. Wait for the selected ticket page to load.
  await page.waitForTimeout(2000);

  console.log('Ticket opened successfully.');
  console.log('Ticket URL:', page.url());

  // 9. Extract the visible page text.
  const ticketText = await page.locator('tbody');

  console.log('Extracted ticket text length:', ticketText);

});