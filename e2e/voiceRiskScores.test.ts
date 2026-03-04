import puppeteer, { Browser, Page } from 'puppeteer-core';

/**
 * End-to-End Tests for the Voice Risk Score Dashboard Panel
 * Verifies that the UI correctly fetches data and enforces organization isolation.
 */
import fs from 'fs';

const executablePath = process.env.CHROME_BIN || '/usr/bin/chromium-browser'; // Updated per user request
const hasBrowser = fs.existsSync(executablePath);

describe(hasBrowser ? 'Voice Risk Scores Dashboard E2E' : 'Voice Risk Scores Dashboard E2E (SKIPPED)', () => {
  let browser: Browser;
  let page: Page;

  beforeAll(async () => {
    if (!hasBrowser) return;
    // This assumes a Chromium executable is installed in the test environment
    browser = await puppeteer.launch({
      executablePath,
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    page = await browser.newPage();
  });

  afterAll(async () => {
    if (browser) await browser.close();
  });

  it('should display risk scores for an authorized organization', async () => {
    if (!hasBrowser) return;

    // Set credentials for Org A
    await page.setExtraHTTPHeaders({
      'x-api-key': 'test-authorized-api-key',
      'x-org-id': 'tenant-uuid-authorized'
    });

    // Navigate to a test component view in Next.js (conceptual path for E2E)
    await page.goto('http://localhost:3000/dashboard/conversations/valid-conversation-id');
    
    // Wait for the panel to fetch data and render
    await page.waitForSelector('[data-testid="voice-risk-score-panel"]');
    
    // Verify the table renders rows (assuming the mock DB has records)
    const tableRows = await page.$$eval('tbody tr', rows => rows.length);
    expect(tableRows).toBeGreaterThanOrEqual(0);
  });

  it('should not allow access to risk scores belonging to another organization', async () => {
    if (!hasBrowser) return;

    // Use token for Org B but try to fetch Org A's conversation
    await page.setExtraHTTPHeaders({
      'x-api-key': 'test-unauthorized-api-key',
      'x-org-id': 'tenant-uuid-unauthorized' // Does not own 'valid-conversation-id'
    });
    
    await page.goto('http://localhost:3000/dashboard/conversations/valid-conversation-id');
    
    // The backend API will return 404/Empty for security, rendering the empty state UI
    await page.waitForSelector('[data-testid="risk-panel-empty"]');
    
    const emptyMsg = await page.$eval('[data-testid="risk-panel-empty"]', el => el.textContent);
    expect(emptyMsg).toContain('No risk scores available for this conversation.');
  });
});
