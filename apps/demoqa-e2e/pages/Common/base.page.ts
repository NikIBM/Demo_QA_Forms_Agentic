
import type { Page } from '@playwright/test';

export class BasePage {
  constructor(readonly page: Page) {}

  protected async navigateTo(path: string): Promise<void> {
    await this.page.goto(path);
  }
}
