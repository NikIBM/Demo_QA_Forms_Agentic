import { test, expect } from '@playwright/test';

test('Use this test for KT session', async ({ page }) => {
  await page.goto('https://www.cfsfiserv.com/REL251SMT/SignIn.aspx');
  await page.getByRole('textbox', { name: 'User ID' }).click();
  await page.getByRole('textbox', { name: 'User ID' }).fill('isowireauto');
  await page.getByRole('textbox', { name: 'Password' }).click();
  await page.getByRole('textbox', { name: 'Password' }).fill('Asdf1234!');
  await page.getByRole('textbox', { name: 'Password' }).press('Tab');
  await page.getByRole('button', { name: 'Log In' }).click();
  await page.getByRole('button', { name: 'Don’t Save' }).click();
  await page.goto('https://www.cfsfiserv.com/REL251SMT/Accounts/AccountSummary.aspx#AccountSummary');
  await expect(page.getByRole('heading', { name: 'Change Login' })).toBeVisible();
  await page.getByRole('button', { name: 'Log Out' }).click();
  //await page.goto('https://playwright.dev/');

  // Expect a title "to contain" a substring.
  //await expect(page).toHaveTitle(/Playwright/);

});

/*test('get started link', async ({ page }) => {
  await page.goto('https://playwright.dev/');

  // Click the get started link.
  await page.getByRole('link', { name: 'Get started' }).click();

  // Expects page to have a heading with the name of Installation.
  await expect(page.getByRole('heading', { name: 'Installation' })).toBeVisible();
});*/
