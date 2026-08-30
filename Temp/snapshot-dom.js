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

  // Snapshot city before state selection
  const cityHtml = await page.locator('#city').innerHTML();
  console.log('=== CITY HTML (no state) ===');
  console.log(cityHtml.substring(0, 800));

  // Select NCR state
  await page.locator('#state').click();
  await page.locator('#state input').fill('NCR');
  await page.locator('#state [class*="-option"]').filter({ hasText: 'NCR' }).first().click();
  await page.waitForTimeout(800);

  const cityHtml2 = await page.locator('#city').innerHTML();
  console.log('=== CITY HTML (after NCR) ===');
  console.log(cityHtml2.substring(0, 800));

  // Also snapshot close button
  const modalBtn = await page.$('#closeLargeModal');
  console.log('=== Close button exists on page load:', !!modalBtn);

  await browser.close();
})().catch(console.error);
