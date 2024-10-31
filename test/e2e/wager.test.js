const { chromium } = require('playwright');
const app = require('../../src/server');

describe('End-to-End Wager Flow', () => {
  let browser;
  let page;

  beforeAll(async () => {
    browser = await chromium.launch();
  });

  afterAll(async () => {
    await browser.close();
  });

  beforeEach(async () => {
    page = await browser.newPage();
  });

  afterEach(async () => {
    await page.close();
  });

  it('should complete full wager flow', async () => {
    // Login
    await page.goto('http://localhost:3000');
    await page.fill('#username', 'testuser');
    await page.fill('#password', 'testpass');
    await page.click('#login-button');
    
    // Add funds
    await page.click('#add-funds');
    await page.fill('#amount', '100');
    await page.click('#submit-payment');
    
    // Create wager
    await page.click('#create-wager');
    await page.fill('#wager-amount', '10');
    await page.click('#submit-wager');
    
    // Verify wager created
    const wagerStatus = await page.textContent('#wager-status');
    expect(wagerStatus).toContain('active');
    
    // Complete game
    await page.click('#end-game');
    await page.fill('#score', '100');
    await page.click('#submit-score');
    
    // Verify results
    const results = await page.textContent('#game-results');
    expect(results).toContain('won');
  });
});