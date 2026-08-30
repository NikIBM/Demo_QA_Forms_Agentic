const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto('https://demoqa.com/automation-practice-form', { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => {
    ['#fixedban', '.google-auto-placed', '#adplus-anchor', 'footer'].forEach(function(s) {
      document.querySelectorAll(s).forEach(function(e) { e.style.display = 'none'; });
    });
  });

  // Fill minimum required fields and submit
  await page.fill('#firstName', 'John');
  await page.fill('#lastName', 'Smith');
  await page.locator('label[for="gender-radio-1"]').click();
  await page.fill('#userNumber', '9876543210');
  await page.locator('#submit').click();

  // Wait for modal
  await page.waitForSelector('.modal-content', { state: 'visible', timeout: 10000 });
  console.log('Modal visible — clicking close');

  await page.locator('#closeLargeModal').click();
  await page.waitForTimeout(2000);

  // Check modal states
  const modalEl = await page.$('.modal');
  const modalContentEl = await page.$('.modal-content');
  const modalDisplay = modalEl ? await page.evaluate(function(el) { return window.getComputedStyle(el).display; }, modalEl) : 'NOT_FOUND';
  const modalClass = modalEl ? await page.evaluate(function(el) { return el.className; }, modalEl) : 'NOT_FOUND';
  const contentDisplay = modalContentEl ? await page.evaluate(function(el) { return window.getComputedStyle(el).display; }, modalContentEl) : 'NOT_FOUND';

  console.log('.modal display:', modalDisplay);
  console.log('.modal class:', modalClass);
  console.log('.modal-content display:', contentDisplay);
  console.log('.modal-content exists:', !!modalContentEl);

  await browser.close();
})().catch(console.error);
