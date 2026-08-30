/*
 * Author: Bob
 * Created (yyyy-mm-dd): 2025-07-10
 * Description: Page Object for the DemoQA Student Registration Form
 *              (https://demoqa.com/automation-practice-form).
 *              Covers all interactive elements: text inputs, radio buttons,
 *              date picker, subject auto-complete, hobby checkboxes, file
 *              upload, current address, state/city react-select dropdowns,
 *              and confirmation modal validation.
 */
import { Locator, Page, expect } from '@playwright/test';
import { BasePage } from '../Common/base.page';

export class DemoQARegistrationFormPage extends BasePage {

  // ============================================================
  // Section 1: Personal Info Locators
  // ============================================================
  readonly firstNameInput: Locator;
  readonly lastNameInput: Locator;
  readonly emailInput: Locator;

  // ============================================================
  // Section 2: Gender Radio Button Labels
  // ============================================================
  readonly genderMaleLabel: Locator;
  readonly genderFemaleLabel: Locator;
  readonly genderOtherLabel: Locator;
  readonly genderMaleRadio: Locator;
  readonly genderFemaleRadio: Locator;

  // ============================================================
  // Section 3: Mobile & Date of Birth
  // ============================================================
  readonly mobileInput: Locator;
  readonly dateOfBirthInput: Locator;
  readonly dobMonthSelect: Locator;
  readonly dobYearSelect: Locator;

  // ============================================================
  // Section 4: Subjects Auto-Complete
  // ============================================================
  readonly subjectsInput: Locator;

  // ============================================================
  // Section 5: Hobby Checkbox Labels
  // ============================================================
  readonly hobbySportsLabel: Locator;
  readonly hobbyReadingLabel: Locator;
  readonly hobbyMusicLabel: Locator;

  // ============================================================
  // Section 6: Picture Upload
  // ============================================================
  readonly uploadPictureInput: Locator;

  // ============================================================
  // Section 7: Current Address & State / City Dropdowns
  // ============================================================
  readonly currentAddressInput: Locator;
  readonly stateDropdownContainer: Locator;
  readonly stateSearchInput: Locator;
  readonly cityDropdownContainer: Locator;
  readonly citySearchInput: Locator;

  // ============================================================
  // Section 8: Submit Button
  // ============================================================
  readonly submitButton: Locator;

  // ============================================================
  // Section 9: Confirmation Modal
  // ============================================================
  readonly confirmationModal: Locator;
  readonly modalTitle: Locator;
  readonly modalTableBody: Locator;
  readonly modalCloseButton: Locator;

  // ============================================================
  // Section 10: Left Sidebar Navigation
  // ============================================================
  readonly practiceFormLink: Locator;

  constructor(page: Page) {
    super(page);

    // Personal Info
    this.firstNameInput = this.page.locator('#firstName');
    this.lastNameInput  = this.page.locator('#lastName');
    this.emailInput     = this.page.locator('#userEmail');

    // Gender — click the <label> because the actual radio input is visually hidden
    this.genderMaleLabel   = this.page.locator('label[for="gender-radio-1"]');
    this.genderFemaleLabel = this.page.locator('label[for="gender-radio-2"]');
    this.genderOtherLabel  = this.page.locator('label[for="gender-radio-3"]');
    // Hidden radio inputs — used for state assertions only
    this.genderMaleRadio   = this.page.locator('#gender-radio-1');
    this.genderFemaleRadio = this.page.locator('#gender-radio-2');

    // Mobile & DOB
    this.mobileInput      = this.page.locator('#userNumber');
    this.dateOfBirthInput = this.page.locator('#dateOfBirthInput');
    this.dobMonthSelect   = this.page.locator('.react-datepicker__month-select');
    this.dobYearSelect    = this.page.locator('.react-datepicker__year-select');

    // Subjects
    this.subjectsInput = this.page.locator('#subjectsInput');

    // Hobbies — click the <label> because the actual checkbox input is visually hidden
    this.hobbySportsLabel  = this.page.locator('label[for="hobbies-checkbox-1"]');
    this.hobbyReadingLabel = this.page.locator('label[for="hobbies-checkbox-2"]');
    this.hobbyMusicLabel   = this.page.locator('label[for="hobbies-checkbox-3"]');

    // File upload
    this.uploadPictureInput = this.page.locator('#uploadPicture');

    // Address & State/City react-select controls
    this.currentAddressInput    = this.page.locator('#currentAddress');
    this.stateDropdownContainer = this.page.locator('#state');
    this.stateSearchInput       = this.page.locator('#state input');
    this.cityDropdownContainer  = this.page.locator('#city');
    this.citySearchInput        = this.page.locator('#city input');

    // Submit
    this.submitButton = this.page.locator('#submit');

    // Confirmation Modal
    this.confirmationModal = this.page.locator('.modal-content');
    this.modalTitle        = this.page.locator('#example-modal-sizes-title-lg');
    this.modalTableBody    = this.page.locator('.table-responsive tbody');
    this.modalCloseButton  = this.page.locator('#closeLargeModal');

    // Left sidebar
    this.practiceFormLink = this.page.locator('.menu-list li', { hasText: 'Practice Form' });
  }

  // ============================================================
  // Section 11: Navigation Actions
  // ============================================================

  /** Navigate to the Forms landing page then click 'Practice Form' in the sidebar. */
  async goToFormViaMenu(baseUrl: string): Promise<void> {
    await this.navigateTo(`${baseUrl}/forms`);
    await this.dismissAds();
    await this.practiceFormLink.click();
    await this.dismissAds();
  }

  /** Remove fixed ad banners that can intercept pointer events on Chromium. */
  async dismissAds(): Promise<void> {
    await this.page.evaluate(() => {
      ['#fixedban', '.google-auto-placed', '#adplus-anchor', 'footer'].forEach((sel) => {
        document.querySelectorAll(sel).forEach((el) => {
          (el as HTMLElement).style.display = 'none';
        });
      });
    });
  }

  // ============================================================
  // Section 12: Form Field Actions
  // ============================================================

  async fillFirstName(value: string): Promise<void> {
    await this.firstNameInput.fill(value);
  }

  async fillLastName(value: string): Promise<void> {
    await this.lastNameInput.fill(value);
  }

  async fillEmail(value: string): Promise<void> {
    await this.emailInput.fill(value);
  }

  async selectGender(gender: 'Male' | 'Female' | 'Other'): Promise<void> {
    const map: Record<string, Locator> = {
      Male:   this.genderMaleLabel,
      Female: this.genderFemaleLabel,
      Other:  this.genderOtherLabel,
    };
    await map[gender].click();
  }

  async fillMobile(value: string): Promise<void> {
    await this.mobileInput.fill(value);
  }

  /**
   * Opens the date-picker and selects day/month/year via the dropdown controls.
   * @param day   - Two-digit day e.g. '24'
   * @param month - Full month name e.g. 'September'
   * @param year  - Four-digit year string e.g. '1999'
   */
  async setDateOfBirth(day: string, month: string, year: string): Promise<void> {
    await this.dateOfBirthInput.click();
    await this.dobMonthSelect.selectOption({ label: month });
    await this.dobYearSelect.selectOption({ label: year });
    const dayPadded = day.padStart(2, '0');
    await this.page
      .locator(`.react-datepicker__day--0${dayPadded}:not(.react-datepicker__day--outside-month)`)
      .first()
      .click();
  }

  /**
   * Types a subject into the auto-complete field and clicks the first matching option.
   * @param subject - Text to search e.g. 'Maths'
   */
  async addSubject(subject: string): Promise<void> {
    await this.subjectsInput.fill(subject);
    await this.page.locator('.subjects-auto-complete__option').first().click();
  }

  /**
   * Ticks one or more hobby checkboxes by clicking their visible labels.
   * @param hobbies - Array of hobby names to select.
   */
  async checkHobbies(hobbies: Array<'Sports' | 'Reading' | 'Music'>): Promise<void> {
    const map: Record<string, Locator> = {
      Sports:  this.hobbySportsLabel,
      Reading: this.hobbyReadingLabel,
      Music:   this.hobbyMusicLabel,
    };
    for (const h of hobbies) {
      await map[h].click();
    }
  }

  /**
   * Uploads a file via the hidden file input.
   * @param filePath - Absolute or workspace-relative path to the file.
   */
  async uploadPicture(filePath: string): Promise<void> {
    await this.uploadPictureInput.setInputFiles(filePath);
  }

  async fillCurrentAddress(value: string): Promise<void> {
    await this.currentAddressInput.fill(value);
  }

  /**
   * Selects a State from the react-select #state dropdown.
   * @param state - State label e.g. 'NCR'
   */
  async selectState(state: string): Promise<void> {
    await this.stateDropdownContainer.click();
    await this.stateSearchInput.fill(state);
    // react-select renders options with a dynamic hash class — use the data-driven text match
    await this.page.locator('#state [class*="-option"]', { hasText: state }).first().click();
  }

  /**
   * Selects a City from the react-select #city dropdown. Requires State to be selected first.
   * @param city - City label e.g. 'Delhi'
   */
  async selectCity(city: string): Promise<void> {
    await this.cityDropdownContainer.click();
    await this.citySearchInput.fill(city);
    // react-select renders options with a dynamic hash class — use the data-driven text match
    await this.page.locator('#city [class*="-option"]', { hasText: city }).first().click();
  }

  async clickSubmit(): Promise<void> {
    await this.submitButton.click();
  }

  // ============================================================
  // Section 13: Validation Methods
  // ============================================================

  /** Asserts the 'Student Registration Form' heading is visible on the page. */
  async verifyFormPageLoaded(): Promise<void> {
    await expect(
      this.page.locator('.practice-form-wrapper h5', { hasText: 'Student Registration Form' }),
    ).toBeVisible({ timeout: 10000 });
  }

  /** Asserts the confirmation modal is visible with the correct title. */
  async verifySubmissionSuccessful(): Promise<void> {
    await expect(this.confirmationModal).toBeVisible({ timeout: 10000 });
    await expect(this.modalTitle).toHaveText('Thanks for submitting the form');
  }

  /** Asserts the modal is NOT visible — form submission was blocked. */
  async verifyFormNotSubmitted(): Promise<void> {
    await expect(this.confirmationModal).not.toBeVisible({ timeout: 5000 });
  }

  /**
   * Asserts a modal table row contains the expected value.
   * @param label         - Row label e.g. 'Student Name'
   * @param expectedValue - Text that must appear in the value cell.
   */
  async verifyModalField(label: string, expectedValue: string): Promise<void> {
    const row = this.modalTableBody.locator('tr', {
      has: this.page.locator('td', { hasText: label }),
    });
    await expect(row.locator('td').nth(1)).toContainText(expectedValue);
  }

  /**
   * Asserts a required text input shows the invalid red-border style.
   * @param field - Locator of the input element.
   */
  async verifyFieldInvalid(field: Locator): Promise<void> {
    await expect(field).toHaveCSS('border-color', 'rgb(220, 53, 69)');
  }

  /** Asserts the city react-select control is disabled (no State selected).
   *  DemoQA renders: aria-disabled="true" on the control div and disabled on the input. */
  async verifyCityDropdownDisabled(): Promise<void> {
    const control = this.page.locator('#city [class*="-control"]').first();
    await control.waitFor({ state: 'attached', timeout: 10000 });
    // Use aria-disabled attribute which is reliably set by DemoQA's react-select
    await expect(control).toHaveAttribute('aria-disabled', 'true', { timeout: 5000 });
  }

  /** Asserts the city react-select control is enabled (State was selected).
   *  DemoQA removes aria-disabled once a State is selected. */
  async verifyCityDropdownEnabled(): Promise<void> {
    const control = this.page.locator('#city [class*="-control"]').first();
    await control.waitFor({ state: 'attached', timeout: 10000 });
    // aria-disabled is removed (or absent) when the city dropdown is enabled
    await expect(control).not.toHaveAttribute('aria-disabled', 'true', { timeout: 5000 });
  }

  /** Closes the confirmation modal and waits for it to disappear.
   *  DemoQA uses Escape / Bootstrap dismiss — clicking the close button may be blocked by
   *  ad overlays. Press Escape which reliably dismisses the modal in headless Chromium. */
  async closeModal(): Promise<void> {
    // Attempt the close button first; fall back to Escape key
    await this.modalCloseButton.click({ force: true });
    // DemoQA Bootstrap modal: the outer .modal wrapper is removed from DOM on dismiss
    try {
      await expect(this.page.locator('.modal')).not.toBeAttached({ timeout: 5000 });
    } catch {
      // If button click didn't work, press Escape to close
      await this.page.keyboard.press('Escape');
      await expect(this.page.locator('.modal')).not.toBeAttached({ timeout: 5000 });
    }
  }
}
