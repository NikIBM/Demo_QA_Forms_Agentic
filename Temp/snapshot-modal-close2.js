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

  await page.fill('#firstName', 'John');
  await page.fill('#lastName', 'Smith');
  await page.locator('label[for="gender-radio-1"]').click();
  await page.fill('#userNumber', '9876543210');
  await page.locator('#submit').click();
  await page.waitForSelector('.modal-content', { state: 'visible', timeout: 10000 });
  console.log('Modal opened');

  // Check if close button is visible and interactable
  const btn = page.locator('#closeLargeModal');
  const isVisible = await btn.isVisible();
  const bbox = await btn.boundingBox();
  console.log('Close btn visible:', isVisible, 'bbox:', JSON.stringify(bbox));

  // Force scroll to make it visible
  await btn.scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);

  // Click with force
  await btn.click({ force: true });
  await page.waitForTimeout(2000);

  const modalClass2 = await page.evaluate(function() {
    var m = document.querySelector('.modal');
    return m ? m.className : 'NOT_FOUND';
  });
  console.log('.modal class after forced click:', modalClass2);

  // Also try via JS click
  if (modalClass2.includes('show')) {
    await page.evaluate(function() {
      var btn = document.querySelector('#closeLargeModal');
      if (btn) btn.click();
    });
    await page.waitForTimeout(1500);
    var modalClass3 = await page.evaluate(function() {
      var m = document.querySelector('.modal');
      return m ? m.className : 'NOT_FOUND';
    });
    console.log('.modal class after JS click:', modalClass3);
  }

  await browser.close();
})().catch(console.error);
