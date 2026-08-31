/*
 * Created (yyyy-mm-dd): 2025-07-10
 * Description: Base page class for DemoQA Playwright tests. Provides shared navigation utility.
 */
import type { Page } from '@playwright/test';

export class BasePage {
  constructor(readonly page: Page) {}

  protected async navigateTo(path: string): Promise<void> {
    await this.page.goto(path);
  }
}
