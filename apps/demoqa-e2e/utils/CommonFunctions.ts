/*
 * Author: Bob
 * Created (yyyy-mm-dd): 2025-07-10
 * Description: Common utility functions for DemoQA Playwright tests.
 */
import { Page, TestInfo } from '@playwright/test';

/**
 * Takes a screenshot and attaches it to the Playwright HTML report.
 * Respects TAKE_SCREENSHOTS env var — set to 'false' to disable.
 * @param page     - The Playwright Page object.
 * @param testInfo - The Playwright TestInfo object.
 * @param ssName   - Label used as the attachment name in the report.
 */
export async function takeScreenShot(page: Page, testInfo: TestInfo, ssName: string): Promise<void> {
  if (process.env.TAKE_SCREENSHOTS !== 'false') {
    const screenshot = await page.screenshot({ type: 'jpeg', quality: 50, fullPage: true });
    await testInfo.attach(ssName, { body: screenshot, contentType: 'image/jpeg' });
  }
}
