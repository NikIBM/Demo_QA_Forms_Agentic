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
  console.log('Modal opened. Trying Escape key...');

  await page.keyboard.press('Escape');
  await page.waitForTimeout(1500);
  var cls1 = await page.evaluate(function() { var m = document.querySelector('.modal'); return m ? m.className : 'NOT_FOUND'; });
  console.log('After Escape:', cls1);

  // Try dismissing via jQuery/Bootstrap modal('hide')
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

  // Scroll modal close into view then click backdrop
  await page.evaluate(function() {
    // Try Bootstrap modal hide
    if (typeof window.$ !== 'undefined') {
      window.$('.modal').modal('hide');
    }
  });
  await page.waitForTimeout(1500);
  var cls2 = await page.evaluate(function() { var m = document.querySelector('.modal'); return m ? m.className : 'NOT_FOUND'; });
  console.log('After Bootstrap hide:', cls2);

  // Try clicking outside modal (backdrop)
  await page.mouse.click(10, 10);
  await page.waitForTimeout(1500);
  var cls3 = await page.evaluate(function() { var m = document.querySelector('.modal'); return m ? m.className : 'NOT_FOUND'; });
  console.log('After backdrop click:', cls3);

  await browser.close();
})().catch(console.error);
