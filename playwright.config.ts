import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  workers: 1,
  retries: 0,

  use: {
    browserName: 'chromium',
    headless: false,
    viewport: {
      width: 1500,
      height: 1000,
    },
    trace: 'retain-on-failure',
  },
});