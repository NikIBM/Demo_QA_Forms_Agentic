"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.takeScreenShot = takeScreenShot;
/**
 * Takes a screenshot and attaches it to the Playwright HTML report.
 * Respects TAKE_SCREENSHOTS env var — set to 'false' to disable.
 * @param page     - The Playwright Page object.
 * @param testInfo - The Playwright TestInfo object.
 * @param ssName   - Label used as the attachment name in the report.
 */
async function takeScreenShot(page, testInfo, ssName) {
    if (process.env.TAKE_SCREENSHOTS !== 'false') {
        const screenshot = await page.screenshot({ type: 'jpeg', quality: 50, fullPage: true });
        await testInfo.attach(ssName, { body: screenshot, contentType: 'image/jpeg' });
    }
}
